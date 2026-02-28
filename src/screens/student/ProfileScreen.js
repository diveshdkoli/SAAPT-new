import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const StudentProfileScreen = ({ onLogout }) => {
  const student = {
    fullName: 'Aarav Sharma',
    username: 'aarav.sharma',
    email: 'aarav@college.edu',
    phone: '+91 91234 56789',
    rollNo: 'STU-2024-001',
    className: 'CM1 – A',
    role: 'Student',
    overallPct: '82%',
  };

  const getInitials = (name) =>
    name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F4F7F5"
        translucent={false}
      />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{getInitials(student.fullName)}</Text>
          </View>
          <Text style={styles.name}>{student.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleTxt}>🎓 Student</Text>
          </View>
          <Text style={styles.rollNo}>{student.rollNo} · {student.className}</Text>
        </View>

        {/* Attendance summary */}
        <View style={[styles.card, styles.attendanceCard]}>
          <Text style={styles.attendanceLabel}>Overall Attendance</Text>
          <Text style={styles.attendancePct}>{student.overallPct}</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: student.overallPct }]} />
          </View>
          <Text style={styles.attendanceSub}>Across all subjects this semester</Text>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Account Information</Text>
          <InfoRow label="Username" value={student.username} />
          <View style={styles.divider} />
          <InfoRow label="Email" value={student.email} />
          <View style={styles.divider} />
          <InfoRow label="Phone" value={student.phone} />
          <View style={styles.divider} />
          <InfoRow label="Class" value={student.className} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutTxt}>🚪  Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentProfileScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5' },
  topBar: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#7C5CBF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C5CBF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, elevation: 6,
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 28 },
  name: { fontSize: 22, fontWeight: '800', color: '#1C1C1C' },
  roleBadge: { backgroundColor: '#F3EEFF', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 5 },
  roleTxt: { fontSize: 13, fontWeight: '600', color: '#7C5CBF' },
  rollNo: { fontSize: 13, color: '#6B6B6B' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  attendanceCard: { alignItems: 'center', gap: 8 },
  attendanceLabel: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', letterSpacing: 1, textTransform: 'uppercase' },
  attendancePct: { fontSize: 48, fontWeight: '800', color: Colors.primary },
  progressBg: { width: '100%', height: 8, backgroundColor: '#F0F0F0', borderRadius: 50, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 50 },
  attendanceSub: { fontSize: 12, color: '#6B6B6B' },

  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 14, color: '#6B6B6B' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1C1C1C', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#F5F5F5' },

  logoutBtn: {
    backgroundColor: '#FFF0F0', borderRadius: 14, padding: 18,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FFDDDD',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: '#D94F4F' },
});
