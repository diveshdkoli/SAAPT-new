import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase/config'; // adjust path as needed

// ─── Icons (using text/emoji fallback if no icon library) ───────────────────
// If you have @expo/vector-icons or react-native-vector-icons, swap these out
const ICONS = {
  teachers:  '👩‍🏫',
  students:  '🎓',
  classes:   '🏫',
  users:     '👥',
  addTeacher:'➕',
  addStudent:'➕',
  createClass:'🏛️',
  reports:   '📊',
  activity:  '🕐',
  dot:       '●',
};

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary:       '#4F46E5',   // Indigo
  primaryLight:  '#EEF2FF',
  secondary:     '#06B6D4',   // Cyan
  secondaryLight:'#ECFEFF',
  success:       '#10B981',
  successLight:  '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  background:    '#F8F9FE',
  card:          '#FFFFFF',
  text:          '#1E1B4B',
  textSecondary: '#6B7280',
  textLight:     '#9CA3AF',
  border:        '#E5E7EB',
  shadow:        '#1E1B4B',
};

const CARD_CONFIGS = [
  {
    key: 'teachers',
    label: 'Total Teachers',
    icon: ICONS.teachers,
    color: COLORS.primary,
    lightColor: COLORS.primaryLight,
  },
  {
    key: 'students',
    label: 'Total Students',
    icon: ICONS.students,
    color: COLORS.secondary,
    lightColor: COLORS.secondaryLight,
  },
  {
    key: 'classes',
    label: 'Total Classes',
    icon: ICONS.classes,
    color: COLORS.success,
    lightColor: COLORS.successLight,
  },
  {
    key: 'users',
    label: 'Total Users',
    icon: ICONS.users,
    color: COLORS.warning,
    lightColor: COLORS.warningLight,
  },
];

const QUICK_ACTIONS = [
  {
    key: 'addTeacher',
    label: 'Add Teacher',
    icon: ICONS.addTeacher,
    color: COLORS.primary,
    lightColor: COLORS.primaryLight,
    route: 'AddTeacher',
  },
  {
    key: 'addStudent',
    label: 'Add Student',
    icon: ICONS.addStudent,
    color: COLORS.secondary,
    lightColor: COLORS.secondaryLight,
    route: 'AddStudent',
  },
  {
    key: 'createClass',
    label: 'Create Class',
    icon: ICONS.createClass,
    color: COLORS.success,
    lightColor: COLORS.successLight,
    route: 'CreateClass',
  },
  {
    key: 'reports',
    label: 'View Reports',
    icon: ICONS.reports,
    color: COLORS.warning,
    lightColor: COLORS.warningLight,
    route: 'Reports',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ config, value, loading }) => (
  <View style={[styles.statCard, { borderTopColor: config.color }]}>
    <View style={[styles.statIconWrapper, { backgroundColor: config.lightColor }]}>
      <Text style={styles.statIcon}>{config.icon}</Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={config.color} style={styles.cardLoader} />
    ) : (
      <Text style={[styles.statNumber, { color: config.color }]}>
        {formatNumber(value)}
      </Text>
    )}
    <Text style={styles.statLabel}>{config.label}</Text>
  </View>
);

const QuickActionButton = ({ action, onPress }) => (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={() => onPress(action.route)}
    activeOpacity={0.75}
  >
    <View style={[styles.actionIconCircle, { backgroundColor: action.lightColor }]}>
      <Text style={styles.actionIcon}>{action.icon}</Text>
    </View>
    <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ item }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityDot, { backgroundColor: item.color }]} />
    <View style={styles.activityContent}>
      <Text style={styles.activityText}>{item.message}</Text>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    teachers: null,
    students: null,
    classes:  null,
    users:    null,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminName]                 = useState('Super Admin');

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      // Count teachers
      const teacherQuery = query(
        collection(db, 'users'),
        where('role', '==', 'teacher')
      );
      const teacherSnap = await getCountFromServer(teacherQuery);

      // Count students
      const studentQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      const studentSnap = await getCountFromServer(studentQuery);

      // Count classes
      const classesSnap = await getCountFromServer(collection(db, 'classes'));

      // Count all users
      const usersSnap = await getCountFromServer(collection(db, 'users'));

      setStats({
        teachers: teacherSnap.data().count,
        students: studentSnap.data().count,
        classes:  classesSnap.data().count,
        users:    usersSnap.data().count,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep nulls — UI shows '—' gracefully
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Example: last 5 users added (adjust collection/field as needed)
      const recentQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(recentQuery);
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        const role = data.role || 'user';
        const name = data.name || data.displayName || 'Unknown';
        const icon = role === 'teacher' ? '👩‍🏫' : role === 'student' ? '🎓' : '👤';
        return {
          id: doc.id,
          message: `${icon} ${name} registered as ${role}`,
          time: data.createdAt?.toDate
            ? timeAgo(data.createdAt.toDate())
            : 'recently',
          color:
            role === 'teacher'
              ? COLORS.primary
              : role === 'student'
              ? COLORS.secondary
              : COLORS.warning,
        };
      });
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching activity:', error);
      // Fallback placeholder activity
      setRecentActivity([
        { id: '1', message: '👩‍🏫 Dashboard ready to go!', time: 'just now', color: COLORS.primary },
        { id: '2', message: '🏫 Connect your Firestore to see activity', time: '', color: COLORS.success },
      ]);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchStats(), fetchRecentActivity()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleQuickAction = (route) => {
    if (navigation) {
      navigation.navigate(route);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.adminName}>{adminName}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>SA</Text>
          </View>
        </View>
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>📅  {formatDate()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
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
        {/* ── Section: Summary Stats ── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {CARD_CONFIGS.map((config) => (
            <StatCard
              key={config.key}
              config={config}
              value={stats[config.key]}
              loading={loading}
            />
          ))}
        </View>

        {/* ── Section: Quick Actions ──
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionButton
              key={action.key}
              action={action}
              onPress={handleQuickAction}
            />
          ))}
        </View> */}

        {/* ── Section: Recent Activity ── */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        <View style={styles.activityCard}>
          {recentActivity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No recent activity yet</Text>
              <Text style={styles.emptySubText}>
                Actions will appear here as you use SAAPT
              </Text>
            </View>
          ) : (
            recentActivity.map((item, index) => (
              <View key={item.id}>
                <ActivityItem item={item} />
                {index < recentActivity.length - 1 && (
                  <View style={styles.activityDivider} />
                )}
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },
  adminName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  dateChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  dateText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    marginTop: 4,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderTopWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'flex-start',
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  cardLoader: {
    marginVertical: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Recent activity header row
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Activity card
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 22,
  },

  // Empty state
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ─── Utility ──────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default DashboardScreen;