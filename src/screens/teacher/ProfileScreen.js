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

const TeacherProfileScreen = ({ onLogout }) => {
  const teacher = {
    fullName: 'Dr. Sarah Khan',
    username: 'sarah.khan',
    email: 'sarah@college.edu',
    phone: '+91 98765 43210',
    employeeId: 'TCH-2024-001',
    role: 'Teacher',
    department: 'Science',
    joinedYear: '2020',
  };

  const getInitials = (name) =>
    name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
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

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{getInitials(teacher.fullName)}</Text>
          </View>
          <Text style={styles.name}>{teacher.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleTxt}>👩‍🏫 Teacher</Text>
          </View>
          <Text style={styles.empId}>{teacher.employeeId}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Account Information</Text>
          <InfoRow label="Username" value={teacher.username} />
          <View style={styles.divider} />
          <InfoRow label="Email" value={teacher.email} />
          <View style={styles.divider} />
          <InfoRow label="Phone" value={teacher.phone} />
          <View style={styles.divider} />
          <InfoRow label="Department" value={teacher.department} />
          <View style={styles.divider} />
          <InfoRow label="Joined" value={teacher.joinedYear} />
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Teaching Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.primary }]}>4</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: '#7C5CBF' }]}>6</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: '#1976B8' }]}>120</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutTxt}>🚪  Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherProfileScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5', paddingTop: 8 },
  topBar: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, elevation: 6,
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 28 },
  name: { fontSize: 22, fontWeight: '800', color: '#1C1C1C' },
  roleBadge: {
    backgroundColor: '#E6F0EA', borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  roleTxt: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  empId: { fontSize: 13, color: '#6B6B6B' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 14, color: '#6B6B6B' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1C1C1C', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#F5F5F5' },

  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statVal: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0' },

  logoutBtn: {
    backgroundColor: '#FFF0F0', borderRadius: 14, padding: 18,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FFDDDD',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: '#D94F4F' },
});
