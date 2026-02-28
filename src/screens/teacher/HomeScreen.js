import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme';


const { width } = Dimensions.get('window');

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getDate = () => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
};

const getInitials = (name) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

// ── Overview stat card ──────────────────────────────────────────────────────
const StatCard = ({ value, label, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.75}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Quick action row ─────────────────────────────────────────────────────────
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

// ── Main Screen ──────────────────────────────────────────────────────────────
const TeacherHomeScreen = ({ navigation, onLogout }) => {
  // Placeholder data — will come from Firebase later
  const teacher = { fullName: 'Dr. Sarah Khan', employeeId: 'TCH-2024-001' };
  const stats = { classes: 4, subjects: 6, students: 120, attendanceRate: '87%' };

  const goTo = (tab) => navigation.navigate(tab);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F4F7F5"
        translucent={false}
      />
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>SAAPT</Text>
        <TouchableOpacity onPress={() => goTo('TeacherProfile')} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{getInitials(teacher.fullName)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome Header ── */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeCircle1} />
          <View style={styles.welcomeCircle2} />
          <Text style={styles.welcomeDate}>{getDate()}</Text>
          <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
          <Text style={styles.welcomeName}>{teacher.fullName}</Text>
          <Text style={styles.welcomeId}>{teacher.employeeId}</Text>
        </View>

        {/* ── Overview Stats ── */}
        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard value={stats.classes} label="Classes" color={Colors.primary} onPress={() => goTo('TeacherClasses')} />
          <StatCard value={stats.subjects} label="Subjects" color="#7C5CBF" onPress={() => goTo('TeacherClasses')} />
          <StatCard value={stats.students} label="Students" color="#1976B8" onPress={() => goTo('TeacherClasses')} />
          <StatCard value={stats.attendanceRate} label="Avg Attend" color="#D97706" onPress={() => goTo('TeacherReport')} />
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.card}>
          <ActionRow emoji="✅" title="Mark Attendance" subtitle="Record today's session" onPress={() => goTo('TeacherAttendance')} />
          <ActionRow emoji="📚" title="My Classes" subtitle="View and manage classes" onPress={() => goTo('TeacherClasses')} />
          <ActionRow emoji="📊" title="View Reports" subtitle="Attendance reports & analysis" onPress={() => goTo('TeacherReport')} />
          <ActionRow emoji="⚠️" title="Defaulter List" subtitle="Students below 75%" onPress={() => goTo('TeacherReport')} last />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherHomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5' },
  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: 3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Scroll
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },

  // Welcome card
  welcomeCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18, padding: 20,
    overflow: 'hidden', position: 'relative',
    marginBottom: 4,
  },
  welcomeCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30,
  },
  welcomeCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -10,
  },
  welcomeDate: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  welcomeGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  welcomeName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  welcomeId: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  // Section label
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: -8,
  },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B6B6B', marginTop: 2, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },

  // Action rows
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  actionIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#E6F0EA', alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  actionEmoji: { fontSize: 18 },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1C' },
  actionSub: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  chevron: { fontSize: 22, color: '#C0C0C0', fontWeight: '300' },
  rowDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 70 },
});
