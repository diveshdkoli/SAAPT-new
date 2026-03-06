import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { signOut }      from 'firebase/auth';
import { auth, db }     from '../../services/firebase/config';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  // Brand
  primary:    '#4C1D95',   // deep purple
  accent:     '#7C3AED',   // vibrant purple
  accentSoft: '#F3E8FF',

  // Semantic
  success:    '#10B981',
  successSoft:'#D1FAE5',
  danger:     '#EF4444',
  dangerSoft: '#FEE2E2',
  warning:    '#F59E0B',

  // Neutral
  bg:         '#F6F5FF',   // light purple background
  card:       '#FFFFFF',
  text:       '#1E1B4B',
  textSub:    '#475569',
  textMuted:  '#A78BFA',
  border:     '#E9D5FF',
  divider:    '#F1F5F9',

  // Avatar palette — cycles through these
  avatarBgs:  ['#7C3AED', '#8B5CF6', '#A78BFA', '#C084FC', '#6366F1', '#10B981'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || 'S';

const getAvatarColor = (name = '') => {
  const i = name.charCodeAt(0) % C.avatarBgs.length;
  return C.avatarBgs[i] ?? C.accent;
};

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  // Firestore Timestamp or ISO string
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const maskUid = (uid = '') =>
  uid.length > 10 ? `${uid.slice(0, 8)}…${uid.slice(-4)}` : uid;

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, onCopy, last = false }) => (
  <View style={[ir.row, !last && ir.rowBorder]}>
    <View style={ir.iconWrap}>
      <Text style={ir.icon}>{icon}</Text>
    </View>
    <View style={ir.textCol}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value} numberOfLines={1}>{value || '—'}</Text>
    </View>
    {onCopy && (
      <TouchableOpacity style={ir.copyBtn} onPress={onCopy} activeOpacity={0.7}>
        <Text style={ir.copyTxt}>Copy</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ir = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  iconWrap:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  icon:      { fontSize: 16 },
  textCol:   { flex: 1 },
  label:     { fontSize: 11, color: C.textMuted, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  value:     { fontSize: 14, color: C.text, fontWeight: '600' },
  copyBtn:   { backgroundColor: C.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  copyTxt:   { fontSize: 11, color: C.accent, fontWeight: '700' },
});

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, children }) => (
  <View style={sc.card}>
    <View style={sc.header}>
      <View style={sc.iconWrap}>
        <Text style={sc.icon}>{icon}</Text>
      </View>
      <Text style={sc.title}>{title}</Text>
    </View>
    {children}
  </View>
);

const sc = StyleSheet.create({
  card:    { backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.divider },
  iconWrap:{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  icon:    { fontSize: 16 },
  title:   { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: 0.2 },
});

// ─── Profile Header ───────────────────────────────────────────────────────────
const ProfileHeader = ({ name, role, email }) => {
  const avatarColor = getAvatarColor(name);
  const initials    = getInitials(name);

  return (
    <View style={ph.wrap}>
      {/* Decorative BG shapes */}
      <View style={ph.deco1} />
      <View style={ph.deco2} />
      <View style={ph.deco3} />

      {/* Avatar */}
      <View style={[ph.avatarOuter, { borderColor: avatarColor + '55' }]}>
        <View style={[ph.avatar, { backgroundColor: avatarColor }]}>
          <Text style={ph.avatarTxt}>{initials}</Text>
        </View>
      </View>

      {/* Name + role */}
      <Text style={ph.name}>{name || 'Student'}</Text>
      <View style={ph.rolePill}>
        <View style={[ph.roleDot, { backgroundColor: C.success }]} />
        <Text style={ph.roleText}>{role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Student'}</Text>
      </View>
      {email ? <Text style={ph.email}>{email}</Text> : null}
    </View>
  );
};

const ph = StyleSheet.create({
  wrap:       { backgroundColor: C.primary, paddingTop: 20, paddingBottom: 32, alignItems: 'center', overflow: 'hidden' },
  deco1:      { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(99,102,241,0.1)', top: -80, right: -50 },
  deco2:      { position: 'absolute', width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: -20 },
  deco3:      { position: 'absolute', width: 80,  height: 80,  borderRadius: 40,  backgroundColor: 'rgba(99,102,241,0.07)', top: 10, left: 30 },
  avatarOuter:{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatar:     { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  name:       { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  rolePill:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  roleDot:    { width: 7, height: 7, borderRadius: 4 },
  roleText:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  email:      { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
});

// ─── Logout Button ────────────────────────────────────────────────────────────
const LogoutButton = ({ onPress }) => (
  <TouchableOpacity style={lb.btn} onPress={onPress} activeOpacity={0.82}>
    <Text style={lb.icon}>🚪</Text>
    <Text style={lb.txt}>Logout</Text>
  </TouchableOpacity>
);

const lb = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.dangerSoft, borderRadius: 16, paddingVertical: 16, marginBottom: 14, borderWidth: 1.5, borderColor: C.danger + '40' },
  icon:{ fontSize: 18 },
  txt: { fontSize: 15, fontWeight: '800', color: C.danger, letterSpacing: 0.2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData,   setUserData]   = useState(null);
  const [className,  setClassName]  = useState('');
  const [uid,        setUid]        = useState('');

  // ── Fetch profile ───────────────────────────────────────────────────────────
  //
  // users/{uid}:
  //   full_name / name, email, phone, username, role, classId,
  //   rollNumber / roll, created_at
  //
  // classes/{classId}:
  //   name
  // ────────────────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;
      setUid(currentUid);

      // ── Step 1: Fetch user doc ─────────────────────────────────────────────
      const userSnap = await getDoc(doc(db, 'users', currentUid));
      if (!userSnap.exists()) return;

      const data = userSnap.data();
      setUserData(data);

      // ── Step 2: Fetch class name ───────────────────────────────────────────
      const classId = data.classId ?? null;
      if (classId) {
        // Use className stored on user doc first (avoids extra read)
        if (data.className) {
          setClassName(data.className);
        } else {
          const classSnap = await getDoc(doc(db, 'classes', classId));
          if (classSnap.exists()) setClassName(classSnap.data().name ?? '');
        }
      }
    } catch (err) {
      console.error('ProfileScreen loadProfile error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = () => { setRefreshing(true); loadProfile(); };

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
            try {
              await signOut(auth);
              // Navigator will automatically redirect to AuthNavigator
              // because auth state listener detects signed-out state
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── Copy UID ───────────────────────────────────────────────────────────────
  const handleCopyUid = () => {
    Clipboard.setString(uid);
    Alert.alert('Copied', 'User ID copied to clipboard.');
  };

  // ── Derived fields (handle multiple field name variants) ───────────────────
  const displayName  = userData?.full_name  ?? userData?.name      ?? '';
  const displayEmail = userData?.email      ?? '';
  const displayPhone = userData?.phone      ?? userData?.mobile     ?? '';
  const displayUser  = userData?.username   ?? userData?.user_name  ?? '';
  const displayRole  = userData?.role       ?? 'student';
  const displayRoll  = userData?.rollNumber ?? userData?.roll       ?? '';
  const createdAt    = userData?.created_at ?? userData?.createdAt  ?? null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.loaderTxt}>Loading profile…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.accent]} tintColor={C.accent} />
          }
        >
          {/* ── Profile Header ── */}
          <ProfileHeader
            name={displayName}
            role={displayRole}
            email={displayEmail}
          />

          <View style={s.body}>

            {/* ── Personal Information ── */}
            <SectionCard icon="👤" title="Personal Information">
              <InfoRow icon="✏️" label="Full Name"  value={displayName}  />
              <InfoRow icon="🔖" label="Username"   value={displayUser}  />
              <InfoRow icon="📧" label="Email"      value={displayEmail} />
              <InfoRow icon="📱" label="Phone"      value={displayPhone} last />
            </SectionCard>

            {/* ── Academic Information ── */}
            <SectionCard icon="🎓" title="Academic Information">
              <InfoRow icon="🏫" label="Class"       value={className || '—'} />
              <InfoRow icon="📋" label="Role"        value={displayRole.charAt(0).toUpperCase() + displayRole.slice(1)} />
              <InfoRow icon="🔢" label="Roll Number" value={displayRoll || '—'} last />
            </SectionCard>

            {/* ── Account Information ── */}
            <SectionCard icon="🔐" title="Account Information">
              <InfoRow
                icon="🪪"
                label="User ID"
                value={maskUid(uid)}
                onCopy={handleCopyUid}
              />
              <InfoRow
                icon="📅"
                label="Account Created"
                value={formatTimestamp(createdAt)}
                last
              />
            </SectionCard>

            {/* ── Logout ── */}
            <LogoutButton onPress={handleLogout} />

            {/* App version tag */}
            <Text style={s.version}>SAAPT  ·  v1.0.0</Text>

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.primary },
  body:     { backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: 16 },
  loader:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loaderTxt:{ fontSize: 14, color: C.textSub },
  version:  { textAlign: 'center', fontSize: 11, color: C.textMuted, marginBottom: 8, letterSpacing: 0.5 },
});

export default ProfileScreen;