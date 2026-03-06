import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebase/config';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:        '#4F46E5',
  primaryLight:   '#EEF2FF',
  secondary:      '#06B6D4',
  secondaryLight: '#ECFEFF',
  success:        '#10B981',
  successLight:   '#D1FAE5',
  danger:         '#EF4444',
  dangerLight:    '#FEF2F2',
  warning:        '#F59E0B',
  warningLight:   '#FEF3C7',
  background:     '#F8F9FE',
  card:           '#FFFFFF',
  text:           '#1E1B4B',
  textSecondary:  '#6B7280',
  textLight:      '#9CA3AF',
  border:         '#E5E7EB',
  shadow:         '#1E1B4B',
};

const AVATAR_PALETTE = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#ECFEFF', text: '#06B6D4' },
  { bg: '#D1FAE5', text: '#10B981' },
  { bg: '#FEF3C7', text: '#F59E0B' },
  { bg: '#FCE7F3', text: '#EC4899' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || '?';

const avatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Section wrapper with title */
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/** Info row: label + value */
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Text style={styles.infoIcon}>{icon}</Text>
    </View>
    <View style={styles.infoTextGroup}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  </View>
);

/** Class pill chip */
const ClassPill = ({ name }) => (
  <View style={styles.classPill}>
    <Text style={styles.classPillText}>{name}</Text>
  </View>
);

/** Settings row */
const SettingsRow = ({ icon, label, sublabel, onPress, danger }) => (
  <TouchableOpacity
    style={styles.settingsRow}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <View style={[styles.settingsIconWrap, danger && { backgroundColor: COLORS.dangerLight }]}>
      <Text style={styles.settingsIcon}>{icon}</Text>
    </View>
    <View style={styles.settingsMeta}>
      <Text style={[styles.settingsLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      {sublabel ? <Text style={styles.settingsSublabel}>{sublabel}</Text> : null}
    </View>
    {!danger && <Text style={styles.settingsChevron}>›</Text>}
  </TouchableOpacity>
);

/** Edit Profile Modal */
const EditProfileModal = ({ visible, profile, onSave, onClose }) => {
  const [name,  setName]  = useState(profile?.name  || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(profile?.name  || '');
      setPhone(profile?.phone || '');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    await onSave({ name: name.trim(), phone: phone.trim() });
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Edit Profile</Text>
          <Text style={styles.modalSubtitle}>Update your name and contact info</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.modalNotice}>
            <Text style={styles.modalNoticeText}>
              🔒  Email and Role cannot be changed. Contact admin if needed.
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.btnPrimaryText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal,  setEditModal]  = useState(false);
  const [resetSent,  setResetSent]  = useState(false);

  // ── Fetch profile ────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  // ── Save profile edits ───────────────────────────────────────────────────
  const handleSaveProfile = async ({ name, phone }) => {
    try {
      const uid = auth.currentUser?.uid;
      await updateDoc(doc(db, 'users', uid), { name, phone });
      setProfile((prev) => ({ ...prev, name, phone }));
      setEditModal(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      console.error('handleSaveProfile error:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // ── Password reset ───────────────────────────────────────────────────────
  const handlePasswordReset = () => {
    const email = auth.currentUser?.email;
    if (!email) return;
    Alert.alert(
      'Reset Password',
      `A password reset link will be sent to:\n${email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email);
              setResetSent(true);
              Alert.alert('Email Sent', 'Check your inbox for the reset link.');
            } catch (err) {
              console.error('passwordReset error:', err);
              Alert.alert('Error', 'Failed to send reset email. Try again later.');
            }
          },
        },
      ]
    );
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation?.replace('Login');
            } catch (err) {
              console.error('signOut error:', err);
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── Avatar derived values ─────────────────────────────────────────────────
  const initials  = getInitials(profile?.name);
  const avatar    = avatarColor(profile?.name || '');
  const classes   = profile?.classes ?? [];
  const fireUser  = auth.currentUser;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account</Text>
          </View>
        </View>
      </View>

      {/* ═══════════════════ LOADING ═══════════════════ */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerLoaderTxt}>Loading profile…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >

          {/* ═══════════════════ PROFILE CARD ═══════════════════ */}
          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={[styles.avatarCircle, { backgroundColor: avatar.bg }]}>
              <Text style={[styles.avatarInitials, { color: avatar.text }]}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>{profile?.name || 'Teacher'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>🎓  Teacher</Text>
            </View>
            <Text style={styles.profileEmail}>{profile?.email || fireUser?.email || '—'}</Text>
          </View>

          {/* ═══════════════════ PERSONAL INFO ═══════════════════ */}
          <Section title="Personal Information">
            <View style={styles.card}>
              <InfoRow icon="👤" label="Full Name"    value={profile?.name} />
              <View style={styles.divider} />
              <InfoRow icon="📧" label="Email"        value={profile?.email || fireUser?.email} />
              <View style={styles.divider} />
              <InfoRow icon="📱" label="Phone"        value={profile?.phone} />
              <View style={styles.divider} />
              <InfoRow icon="🏷️" label="Role"         value="Teacher" />
            </View>
          </Section>

          {/* ═══════════════════ ASSIGNED CLASSES ═══════════════════ */}
          <Section title={`Assigned Classes  (${classes.length})`}>
            {classes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>No Classes Assigned</Text>
                <Text style={styles.emptySubText}>
                  Contact admin to get classes assigned to your account.
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.classGrid}>
                  {classes.map((cls, idx) => (
                    <ClassPill key={idx} name={cls} />
                  ))}
                </View>
              </View>
            )}
          </Section>

          {/* ═══════════════════ ACCOUNT INFO ═══════════════════ */}
          <Section title="Account Information">
            <View style={styles.card}>
              <InfoRow
                icon="📅"
                label="Account Created"
                value={formatDate(profile?.createdAt || fireUser?.metadata?.creationTime)}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="🔑"
                label="Last Login"
                value={formatDate(fireUser?.metadata?.lastSignInTime)}
              />
            </View>
          </Section>

          {/* ═══════════════════ SETTINGS ═══════════════════ */}
          <Section title="Settings">
            <View style={styles.card}>
              <SettingsRow
                icon="✏️"
                label="Edit Profile"
                sublabel="Update name & phone number"
                onPress={() => setEditModal(true)}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="🔒"
                label="Change Password"
                sublabel={resetSent ? 'Reset email sent ✓' : 'Receive a reset link via email'}
                onPress={handlePasswordReset}
              />
            </View>
          </Section>

          {/* ═══════════════════ APP INFO ═══════════════════ */}
          <Section title="App Information">
            <View style={styles.card}>
              <InfoRow icon="📱" label="App Version"   value="1.0.0" />
              <View style={styles.divider} />
              <InfoRow icon="🏫" label="Developed By"  value="SAAPT Team" />
            </View>
          </Section>

          {/* ═══════════════════ LOGOUT ═══════════════════ */}
          <View style={[styles.card, { marginBottom: 0 }]}>
            <SettingsRow
              icon="🚪"
              label="Logout"
              sublabel="Sign out of your account"
              onPress={handleLogout}
              danger
            />
          </View>

          <View style={{ height: 36 }} />
        </ScrollView>
      )}

      {/* ═══════════════════ EDIT MODAL ═══════════════════ */}
      <EditProfileModal
        visible={editModal}
        profile={profile}
        onSave={handleSaveProfile}
        onClose={() => setEditModal(false)}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    backgroundColor:         COLORS.primary,
    paddingTop:              52,
    paddingHorizontal:       20,
    paddingBottom:           24,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  headerTop:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  backBtnIcon:     { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  headerTextGroup: { flex: 1 },
  headerTitle:     { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '500' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 24 },

  // Profile card
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius:    22,
    alignItems:      'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom:    24,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.08,
    shadowRadius:    14,
    elevation:       5,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor:  COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  profileName:    { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  roleBadge: {
    backgroundColor:   COLORS.primaryLight,
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   5,
    marginBottom:      10,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  profileEmail:  { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  // Section
  section:      { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius:    16,
    paddingHorizontal: 16,
    paddingVertical:   4,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },

  // Info row
  infoRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 14,
    gap:             14,
  },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  infoIcon:      { fontSize: 16 },
  infoTextGroup: { flex: 1 },
  infoLabel:     { fontSize: 11, fontWeight: '600', color: COLORS.textLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:     { fontSize: 14, fontWeight: '600', color: COLORS.text },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 50 },

  // Class grid
  classGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, paddingVertical: 14,
  },
  classPill: {
    backgroundColor:   COLORS.primaryLight,
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderWidth:       1,
    borderColor:       '#C7D2FE',
  },
  classPillText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Settings row
  settingsRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 14,
    gap:             14,
  },
  settingsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon:     { fontSize: 16 },
  settingsMeta:     { flex: 1 },
  settingsLabel:    { fontSize: 14, fontWeight: '600', color: COLORS.text },
  settingsSublabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  settingsChevron:  { fontSize: 22, color: COLORS.textLight, fontWeight: '300' },

  // Empty card
  emptyCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 32, alignItems: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.border,
  },
  emptyIcon:    { fontSize: 36, marginBottom: 10 },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Loader
  centerLoader:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerLoaderTxt: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(30,27,75,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor:     COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding:             24,
    paddingBottom:       Platform.OS === 'ios' ? 44 : 28,
  },
  modalHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 22,
  },
  modalTitle:    { fontSize: 19, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 22 },

  // Inputs
  inputGroup:  { marginBottom: 16 },
  inputLabel:  { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:        14,
    color:           COLORS.text,
    fontWeight:      '500',
  },

  modalNotice: {
    backgroundColor: COLORS.warningLight,
    borderRadius:    10,
    padding:         12,
    marginBottom:    22,
  },
  modalNoticeText: { fontSize: 12, color: COLORS.warning, fontWeight: '600', lineHeight: 18 },

  modalActions: { flexDirection: 'row', gap: 12 },
  btnSecondary: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  btnPrimary: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default ProfileScreen;