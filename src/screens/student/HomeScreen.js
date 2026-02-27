import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors } from '../../theme';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getDate = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

const getInitials = (name) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

const ActionRow = ({ emoji, title, subtitle, onPress, last }) => (
  <>
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIconBox}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
    {!last && <View style={styles.rowDivider} />}
  </>
);

const StudentHomeScreen = ({ navigation }) => {
  const student = {
    fullName: 'Aarav Sharma',
    rollNo: 'STU-2024-001',
    className: 'CM1 – A',
  };

  const stats = {
    overallPct: '82%',
    subjectCount: 5,
    totalSessions: 86,
    defaulterCount: 1,
  };

  const goTo = (tab) => navigation.navigate(tab);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F5" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>SAAPT</Text>
        <TouchableOpacity onPress={() => goTo('StudentProfile')} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{getInitials(student.fullName)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeCircle1} />
          <View style={styles.welcomeCircle2} />
          <Text style={styles.welcomeDate}>{getDate()}</Text>
          <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
          <Text style={styles.welcomeName}>{student.fullName}</Text>
          <Text style={styles.welcomeSub}>{student.className} · {student.rollNo}</Text>
        </View>

        {/* Overview */}
        <Text style={styles.sectionLabel}>My Attendance</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: Colors.primary }]}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>{stats.overallPct}</Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#7C5CBF' }]}>
            <Text style={[styles.statVal, { color: '#7C5CBF' }]}>{stats.subjectCount}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#1976B8' }]}>
            <Text style={[styles.statVal, { color: '#1976B8' }]}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: stats.defaulterCount > 0 ? '#D94F4F' : Colors.primary }]}>
            <Text style={[styles.statVal, { color: stats.defaulterCount > 0 ? '#D94F4F' : Colors.primary }]}>{stats.defaulterCount}</Text>
            <Text style={styles.statLabel}>Defaulter</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.card}>
          <ActionRow emoji="📊" title="My Attendance Report" subtitle="Subject-wise attendance details"  onPress={() => goTo('StudentReport')} />
          <ActionRow emoji="⚠️" title="Defaulter List"       subtitle="Students below 75% in your class" onPress={() => goTo('StudentReport')} />
          <ActionRow emoji="👤" title="My Profile"           subtitle="View and manage your profile"     onPress={() => goTo('StudentProfile')} last />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentHomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5', paddingTop: 8 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: 3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#7C5CBF', alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },

  welcomeCard: {
    backgroundColor: '#7C5CBF', borderRadius: 18, padding: 20,
    overflow: 'hidden', position: 'relative',
  },
  welcomeCircle1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30 },
  welcomeCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -10 },
  welcomeDate:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  welcomeGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  welcomeName:     { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  welcomeSub:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: -8,
  },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statVal:   { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B6B6B', marginTop: 2, textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  actionIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  actionEmoji: { fontSize: 18 },
  actionText:  { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1C' },
  actionSub:   { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  chevron:     { fontSize: 22, color: '#C0C0C0', fontWeight: '300' },
  rowDivider:  { height: 1, backgroundColor: '#F5F5F5', marginLeft: 70 },
});

// hiiiii