import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { db, auth } from '../../services/firebase/config'; // adjust path as needed

// ─── Color Palette (consistent with all SAAPT screens) ───────────────────────
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
  inputBg:        '#F3F4F6',
  shadow:         '#1E1B4B',
  modalOverlay:   'rgba(30, 27, 75, 0.5)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase() || 'AD';
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return 'N/A'; }
};

const ROLE_LABELS = {
  admin:   { label: 'Admin',   color: COLORS.primary,  bg: COLORS.primaryLight  },
  teacher: { label: 'Teacher', color: COLORS.secondary, bg: COLORS.secondaryLight },
  student: { label: 'Student', color: COLORS.success,   bg: COLORS.successLight  },
};

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
const EditProfileModal = ({ visible, userData, onClose, onSave }) => {
  const [name,    setName]    = useState(userData?.name  || '');
  const [phone,   setPhone]   = useState(userData?.phone || '');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (visible) {
      setName(userData?.name  || '');
      setPhone(userData?.phone || '');
    }
  }, [visible, userData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    await onSave({ name: name.trim(), phone: phone.trim() });
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOuter}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>Update your account details</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                <Text style={styles.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.textLight}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📞</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email note */}
              <View style={styles.infoNote}>
                <Text style={styles.infoNoteIcon}>ℹ️</Text>
                <Text style={styles.infoNoteText}>
                  Email cannot be changed here. Contact system administrator if needed.
                </Text>
              </View>

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, isLast }) => (
  <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
    <View style={styles.infoRowLeft}>
      <View style={styles.infoRowIconBox}>
        <Text style={styles.infoRowIcon}>{icon}</Text>
      </View>
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <Text style={styles.infoRowValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionButton = ({ icon, label, subtitle, color, bg, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.actionRow, !isLast && styles.actionRowBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIconBox, { backgroundColor: bg }]}>
      <Text style={styles.actionBtnIcon}>{icon}</Text>
    </View>
    <View style={styles.actionTextGroup}>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      {!!subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={[styles.actionChevron, { color }]}>›</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const [userData,     setUserData]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [editVisible,  setEditVisible]  = useState(false);
  const [loggingOut,   setLoggingOut]   = useState(false);

  const currentUser = auth.currentUser;

  // ── Fetch user data ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!currentUser) return;
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          setUserData({ id: snap.id, ...snap.data() });
        } else {
          // Fallback to auth data
          setUserData({
            name:      currentUser.displayName || 'Admin',
            email:     currentUser.email       || '',
            role:      'admin',
            phone:     '',
            createdAt: null,
          });
        }
      } catch (e) {
        console.error('Error fetching user:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ── Save edited profile ────────────────────────────────────────────────────
  const handleSaveProfile = async ({ name, phone }) => {
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), { name, phone });
        await updateProfile(currentUser, { displayName: name });
      }
      setUserData((prev) => ({ ...prev, name, phone }));
      setEditVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // ── Change password (reset email) ─────────────────────────────────────────
  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      `A password reset link will be sent to:\n${userData?.email || currentUser?.email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Email',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, userData?.email || currentUser?.email);
              Alert.alert('Email Sent', 'Check your inbox for the password reset link.');
            } catch (e) {
              console.error('Password reset error:', e);
              Alert.alert('Error', 'Failed to send reset email. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut(auth);
              navigation?.replace('AuthNavigator');
            } catch (e) {
              console.error('Logout error:', e);
              Alert.alert('Error', 'Failed to logout. Please try again.');
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all associated data. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Contact Support', 'Please contact your system administrator to delete your account.'),
        },
      ]
    );
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const initials  = getInitials(userData?.name || '');
  const roleConf  = ROLE_LABELS[userData?.role] || ROLE_LABELS.admin;

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.fullLoader}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.fullLoaderText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <View style={styles.headerBg}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              {/* Online dot */}
              <View style={styles.onlineDot} />
            </View>

            {/* Name + email */}
            <Text style={styles.profileName}>{userData?.name || 'Admin'}</Text>
            <Text style={styles.profileEmail}>{userData?.email || '—'}</Text>

            {/* Role badge */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>⚡ {roleConf.label}</Text>
            </View>
          </View>
        </View>

        {/* ── Account Information Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <TouchableOpacity
              style={styles.editChip}
              onPress={() => setEditVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.editChipText}>✏️  Edit</Text>
            </TouchableOpacity>
          </View>

          <InfoRow icon="👤" label="Full Name"    value={userData?.name}                         />
          <InfoRow icon="📧" label="Email"        value={userData?.email}                        />
          <InfoRow icon="📞" label="Phone"        value={userData?.phone || 'Not set'}           />
          <InfoRow icon="🎭" label="Role"         value={roleConf.label}                         />
          <InfoRow icon="📅" label="Member Since" value={formatDate(userData?.createdAt)} isLast />
        </View>

        {/* ── Security ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Security</Text>

          <ActionButton
            icon="🔒"
            label="Change Password"
            subtitle="Send a reset link to your email"
            color={COLORS.primary}
            bg={COLORS.primaryLight}
            onPress={handleChangePassword}
            isLast
          />
        </View>

        {/* ── Account Actions ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Account</Text>

          <ActionButton
            icon="✏️"
            label="Edit Profile"
            subtitle="Update name and phone number"
            color={COLORS.secondary}
            bg={COLORS.secondaryLight}
            onPress={() => setEditVisible(true)}
          />

          <ActionButton
            icon="🚪"
            label={loggingOut ? 'Logging out...' : 'Logout'}
            subtitle="Sign out of your account"
            color={COLORS.danger}
            bg={COLORS.dangerLight}
            onPress={handleLogout}
            isLast
          />
        </View>

        {/* ── Danger Zone ── */}
        <View style={[styles.sectionCard, styles.dangerCard]}>
          <Text style={[styles.cardTitle, { color: COLORS.danger }]}>Danger Zone</Text>
          <Text style={styles.dangerSubtext}>
            Irreversible actions that affect your account permanently.
          </Text>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.dangerBtnText}>🗑️  Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App version footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>SAAPT</Text>
          <Text style={styles.footerVersion}>Version 1.0.0  •  Admin Panel</Text>
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        visible={editVisible}
        userData={userData}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Full loader
  fullLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 14,
  },
  fullLoaderText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Profile Header
  headerBg: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 48,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 1,
  },

  // Avatar
  avatarOuter: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },

  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
    fontWeight: '400',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },

  // ── Section Cards
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 18,
    marginTop: 18,
    paddingTop: 18,
    paddingBottom: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  editChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  editChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  infoRowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowIcon: { fontSize: 14 },
  infoRowLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoRowValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    maxWidth: '45%',
    textAlign: 'right',
  },

  // ── Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: { fontSize: 20 },
  actionTextGroup: { flex: 1 },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  actionChevron: {
    fontSize: 22,
    fontWeight: '300',
  },

  // ── Danger Zone
  dangerCard: {
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingBottom: 16,
  },
  dangerSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 18,
    marginBottom: 14,
    lineHeight: 18,
  },
  dangerBtn: {
    marginHorizontal: 18,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },

  // ── Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  footerLogo: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  footerVersion: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '400',
  },

  // ── Edit Modal
  modalOuter: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseTxt: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },

  // Form
  formGroup: { marginBottom: 18 },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: { color: COLORS.danger },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 13,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  infoNoteIcon: { fontSize: 14, marginTop: 1 },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    lineHeight: 17,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ProfileScreen;