// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import {
//   doc,
//   getDoc,
//   collection,
//   query,
//   where,
//   getDocs,
// } from 'firebase/firestore';
// import { auth, db } from '../../services/firebase/config'; // adjust path as needed

// // ─── Color Palette ────────────────────────────────────────────────────────────
// const COLORS = {
//   primary: '#4F46E5',
//   primaryLight: '#EEF2FF',
//   secondary: '#06B6D4',
//   secondaryLight: '#ECFEFF',
//   success: '#10B981',
//   successLight: '#D1FAE5',
//   warning: '#F59E0B',
//   warningLight: '#FEF3C7',
//   background: '#F8F9FE',
//   card: '#FFFFFF',
//   text: '#1E1B4B',
//   textSecondary: '#6B7280',
//   textLight: '#9CA3AF',
//   border: '#E5E7EB',
//   shadow: '#1E1B4B',
// };

// // ─── Summary Card Config ──────────────────────────────────────────────────────
// const STAT_CONFIGS = [
//   {
//     key: 'classes',
//     label: 'Total Classes',
//     icon: '🏫',
//     color: COLORS.primary,
//     lightColor: COLORS.primaryLight,
//   },
//   {
//     key: 'students',
//     label: 'Total Students',
//     icon: '👨‍🎓',
//     color: COLORS.secondary,
//     lightColor: COLORS.secondaryLight,
//   },
//   {
//     key: 'subjects',
//     label: 'Total Subjects',
//     icon: '📖',
//     color: COLORS.success,
//     lightColor: COLORS.successLight,
//   },
// ];

// // ─── Quick Actions Config ─────────────────────────────────────────────────────
// const QUICK_ACTIONS = [
//   {
//     key: 'classes',
//     label: 'My Classes',
//     icon: '📚',
//     color: COLORS.primary,
//     lightColor: COLORS.primaryLight,
//     route: 'ClassesScreen',
//   },
//   {
//     key: 'attendance',
//     label: 'Take Attendance',
//     icon: '📝',
//     color: COLORS.secondary,
//     lightColor: COLORS.secondaryLight,
//     route: 'AttendanceScreen',
//   },
//   {
//     key: 'reports',
//     label: 'View Reports',
//     icon: '📊',
//     color: COLORS.success,
//     lightColor: COLORS.successLight,
//     route: 'ReportScreen',
//   },
//   {
//     key: 'profile',
//     label: 'My Profile',
//     icon: '👤',
//     color: COLORS.warning,
//     lightColor: COLORS.warningLight,
//     route: 'ProfileScreen',
//   },
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const getGreeting = () => {
//   const h = new Date().getHours();
//   if (h < 12) return 'Good Morning';
//   if (h < 17) return 'Good Afternoon';
//   return 'Good Evening';
// };

// const getInitials = (name = '') =>
//   name
//     .split(' ')
//     .slice(0, 2)
//     .map((n) => n[0]?.toUpperCase())
//     .join('');

// const formatDate = () =>
//   new Date().toLocaleDateString('en-US', {
//     weekday: 'long',
//     month: 'long',
//     day: 'numeric',
//     year: 'numeric',
//   });

// const formatNumber = (num) => {
//   if (num === null || num === undefined) return '—';
//   if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
//   return num.toString();
// };

// // ─── Sub-components ───────────────────────────────────────────────────────────

// const StatCard = ({ config, value, loading }) => (
//   <View style={[styles.statCard, { borderTopColor: config.color }]}>
//     <View style={[styles.statIconWrapper, { backgroundColor: config.lightColor }]}>
//       <Text style={styles.statIcon}>{config.icon}</Text>
//     </View>
//     {loading ? (
//       <ActivityIndicator size="small" color={config.color} style={styles.cardLoader} />
//     ) : (
//       <Text style={[styles.statNumber, { color: config.color }]}>
//         {formatNumber(value)}
//       </Text>
//     )}
//     <Text style={styles.statLabel}>{config.label}</Text>
//   </View>
// );

// const QuickActionButton = ({ action, onPress }) => (
//   <TouchableOpacity
//     style={styles.actionButton}
//     onPress={() => onPress(action.route)}
//     activeOpacity={0.75}
//   >
//     <View style={[styles.actionIconCircle, { backgroundColor: action.lightColor }]}>
//       <Text style={styles.actionIcon}>{action.icon}</Text>
//     </View>
//     <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
//   </TouchableOpacity>
// );

// const ClassCard = ({ item, onTakeAttendance }) => (
//   <View style={styles.classCard}>
//     <View style={styles.classAccentBar} />
//     <View style={styles.classCardInner}>

//       {/* Top row: class name + student badge */}
//       <View style={styles.classCardTop}>
//         <View style={styles.classCardTitles}>
//           <Text style={styles.className}>{item.className}</Text>
//           <Text style={styles.classSubject}>📖  {item.subjectName}</Text>
//         </View>
//         <View style={styles.studentBadge}>
//           <Text style={styles.studentBadgeIcon}>👨‍🎓</Text>
//           <Text style={styles.studentBadgeText}>{item.studentCount ?? 0}</Text>
//         </View>
//       </View>

//       <View style={styles.classCardDivider} />

//       {/* Take Attendance CTA */}
//       <TouchableOpacity
//         style={styles.takeAttendanceBtn}
//         onPress={() => onTakeAttendance(item)}
//         activeOpacity={0.78}
//       >
//         <Text style={styles.takeAttendanceBtnIcon}>📝</Text>
//         <Text style={styles.takeAttendanceBtnText}>Take Attendance</Text>
//       </TouchableOpacity>

//     </View>
//   </View>
// );

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// const TeacherHomeScreen = ({ navigation }) => {
//   const [teacherName, setTeacherName] = useState('');
//   const [teacherRole, setTeacherRole] = useState('Teacher');
//   const [classCards, setClassCards] = useState([]);
//   const [stats, setStats] = useState({
//     classes: null,
//     students: null,
//     subjects: null,
//   });
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // ─────────────────────────────────────────────────────────────────────────
//   // 1️⃣  Fetch teacher profile → users/{uid}
//   // ─────────────────────────────────────────────────────────────────────────
//   const fetchTeacherProfile = async (uid) => {
//     try {
//       const snap = await getDoc(doc(db, 'users', uid));
//       if (snap.exists()) {
//         const data = snap.data();
//         setTeacherName(data.name ?? '');
//         setTeacherRole(data.role ?? 'Teacher');
//       }
//     } catch (err) {
//       console.error('fetchTeacherProfile error:', err);
//     }
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // 2️⃣  Fetch class_subjects where teacherId == uid
//   //     Enrich each row with studentCount from classes collection
//   //     Calculate 3 summary stats
//   // ─────────────────────────────────────────────────────────────────────────
//   const fetchClassSubjects = async (uid) => {
//     try {
//       // Step 1 — Query class_subjects for this teacher
//       const csSnap = await getDocs(
//         query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
//       );
//       const csRows = csSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

//       // Step 2 — Unique class IDs to fetch student counts
//       const uniqueClassIds = [...new Set(csRows.map((r) => r.classId).filter(Boolean))];

//       // Step 3 — Fetch student count per class
//       const classStudentMap = {};
//       await Promise.all(
//         uniqueClassIds.map(async (classId) => {
//           try {
//             const classSnap = await getDoc(doc(db, 'classes', classId));
//             classStudentMap[classId] = classSnap.exists()
//               ? (classSnap.data().students?.length ?? 0)
//               : 0;
//           } catch {
//             classStudentMap[classId] = 0;
//           }
//         })
//       );

//       // Step 4 — Build enriched card list
//       const enriched = csRows.map((row) => ({
//         ...row,
//         studentCount: classSnap.exists()
//           ? classSnap.data().students?.length || 0
//           : 0,
//       }));

//       // Step 5 — Summary stats
//       const totalStudents = uniqueClassIds.reduce(
//         (sum, id) => sum + (classStudentMap[id] ?? 0),
//         0
//       );
//       const uniqueSubjectIds = new Set(csRows.map((r) => r.subjectId).filter(Boolean));

//       setClassCards(enriched);
//       setStats({
//         classes: uniqueClassIds.length,
//         students: totalStudents,
//         subjects: uniqueSubjectIds.size,
//       });
//     } catch (err) {
//       console.error('fetchClassSubjects error:', err);
//     }
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // Load all
//   // ─────────────────────────────────────────────────────────────────────────
//   const loadData = async () => {
//     const uid = auth.currentUser?.uid;
//     if (!uid) { setLoading(false); setRefreshing(false); return; }
//     await Promise.all([fetchTeacherProfile(uid), fetchClassSubjects(uid)]);
//     setLoading(false);
//     setRefreshing(false);
//   };

//   useEffect(() => { loadData(); }, []);

//   const onRefresh = () => { setRefreshing(true); loadData(); };

//   // ─────────────────────────────────────────────────────────────────────────
//   // Navigation handlers
//   // ─────────────────────────────────────────────────────────────────────────
//   const handleQuickAction = (route) => navigation?.navigate(route);

//   const handleTakeAttendance = (item) => {
//     navigation?.navigate('AttendanceScreen', {
//       classId: item.classId,
//       className: item.className,
//       subjectId: item.subjectId,
//       subjectName: item.subjectName,
//     });
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // Render
//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

//       {/* ══════════════════════════════
//           HEADER — Welcome Section
//       ══════════════════════════════ */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <View style={styles.headerTextGroup}>
//             <Text style={styles.greeting}>{getGreeting()} 👋</Text>
//             <Text style={styles.teacherName}>{teacherName || 'Teacher'}</Text>
//             <Text style={styles.roleTag}>{teacherRole}</Text>
//           </View>
//           <View style={styles.avatarCircle}>
//             <Text style={styles.avatarText}>{getInitials(teacherName) || 'T'}</Text>
//           </View>
//         </View>
//         <View style={styles.dateChip}>
//           <Text style={styles.dateText}>📅  {formatDate()}</Text>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[COLORS.primary]}
//             tintColor={COLORS.primary}
//           />
//         }
//       >
//         {/* ══════════════════════════════
//             OVERVIEW — 3 Stat Cards
//         ══════════════════════════════ */}
//         <Text style={styles.sectionTitle}>Overview</Text>
//         <View style={styles.statsGrid}>
//           {STAT_CONFIGS.map((config) => (
//             <StatCard
//               key={config.key}
//               config={config}
//               value={stats[config.key]}
//               loading={loading}
//             />
//           ))}
//         </View>

//         {/* ══════════════════════════════
//             QUICK ACTIONS
//         ══════════════════════════════ */}
//         <Text style={styles.sectionTitle}>Quick Actions</Text>
//         <View style={styles.actionsGrid}>
//           {QUICK_ACTIONS.map((action) => (
//             <QuickActionButton
//               key={action.key}
//               action={action}
//               onPress={handleQuickAction}
//             />
//           ))}
//         </View>

//         {/* ══════════════════════════════
//             MY CLASSES — from class_subjects
//         ══════════════════════════════ */}
//         <View style={styles.sectionRow}>
//           <Text style={styles.sectionTitle}>My Classes</Text>
//           <TouchableOpacity onPress={() => navigation?.navigate('ClassesScreen')}>
//             <Text style={styles.seeAllText}>See all</Text>
//           </TouchableOpacity>
//         </View>

//         {loading ? (
//           <View style={styles.centeredLoader}>
//             <ActivityIndicator size="large" color={COLORS.primary} />
//             <Text style={styles.loaderText}>Loading your classes…</Text>
//           </View>
//         ) : classCards.length === 0 ? (
//           <View style={styles.emptyCard}>
//             <Text style={styles.emptyIcon}>🏫</Text>
//             <Text style={styles.emptyText}>No classes assigned yet</Text>
//             <Text style={styles.emptySubText}>
//               Ask your admin to assign classes and subjects to your account.
//             </Text>
//           </View>
//         ) : (
//           classCards.map((item) => (
//             <ClassCard
//               key={item.id}
//               item={item}
//               onTakeAttendance={handleTakeAttendance}
//             />
//           ))
//         )}

//         <View style={{ height: 32 }} />
//       </ScrollView>
//     </View>
//   );
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },

//   // Header
//   header: {
//     backgroundColor: COLORS.primary,
//     paddingTop: 52,
//     paddingHorizontal: 20,
//     paddingBottom: 28,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//   },
//   headerTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 14,
//   },
//   headerTextGroup: {
//     flex: 1,
//     marginRight: 12,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.75)',
//     letterSpacing: 0.3,
//   },
//   teacherName: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#FFFFFF',
//     marginTop: 3,
//   },
//   roleTag: {
//     fontSize: 11,
//     color: 'rgba(255,255,255,0.6)',
//     fontWeight: '600',
//     marginTop: 4,
//     textTransform: 'uppercase',
//     letterSpacing: 1.2,
//   },
//   avatarCircle: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.4)',
//   },
//   avatarText: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//     fontSize: 16,
//   },
//   dateChip: {
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     borderRadius: 20,
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     alignSelf: 'flex-start',
//   },
//   dateText: {
//     color: 'rgba(255,255,255,0.9)',
//     fontSize: 13,
//     fontWeight: '500',
//   },

//   // Scroll
//   scrollView: { flex: 1 },
//   scrollContent: {
//     paddingHorizontal: 18,
//     paddingTop: 24,
//   },

//   // Section titles
//   sectionTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: COLORS.text,
//     marginBottom: 14,
//     marginTop: 4,
//   },
//   sectionRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 14,
//     marginTop: 4,
//   },
//   seeAllText: {
//     fontSize: 13,
//     color: COLORS.primary,
//     fontWeight: '600',
//   },

//   // Stat Cards
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 14,
//     marginBottom: 28,
//   },
//   statCard: {
//     flex: 1,
//     minWidth: '45%',
//     backgroundColor: COLORS.card,
//     borderRadius: 18,
//     padding: 18,
//     borderTopWidth: 4,
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     elevation: 4,
//     alignItems: 'flex-start',
//   },
//   statIconWrapper: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   statIcon: { fontSize: 20 },
//   cardLoader: { marginVertical: 6 },
//   statNumber: {
//     fontSize: 28,
//     fontWeight: '800',
//     marginBottom: 4,
//     letterSpacing: -0.5,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//     letterSpacing: 0.2,
//   },

//   // Quick Actions
//   actionsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 14,
//     marginBottom: 28,
//   },
//   actionButton: {
//     flex: 1,
//     minWidth: '45%',
//     backgroundColor: COLORS.card,
//     borderRadius: 18,
//     padding: 18,
//     alignItems: 'center',
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   actionIconCircle: {
//     width: 52,
//     height: 52,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 10,
//   },
//   actionIcon: { fontSize: 24 },
//   actionLabel: {
//     fontSize: 13,
//     fontWeight: '700',
//     textAlign: 'center',
//     letterSpacing: 0.1,
//   },

//   // Class Cards
//   classCard: {
//     backgroundColor: COLORS.card,
//     borderRadius: 18,
//     marginBottom: 14,
//     flexDirection: 'row',
//     overflow: 'hidden',
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   classAccentBar: {
//     width: 5,
//     backgroundColor: COLORS.primary,
//   },
//   classCardInner: {
//     flex: 1,
//     padding: 16,
//   },
//   classCardTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   classCardTitles: {
//     flex: 1,
//     marginRight: 10,
//   },
//   className: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   classSubject: {
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//     marginTop: 4,
//   },
//   studentBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 10,
//     gap: 4,
//   },
//   studentBadgeIcon: { fontSize: 13 },
//   studentBadgeText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: COLORS.primary,
//   },
//   classCardDivider: {
//     height: 1,
//     backgroundColor: COLORS.border,
//     marginVertical: 12,
//   },
//   takeAttendanceBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: COLORS.primaryLight,
//     borderRadius: 10,
//     paddingVertical: 10,
//     gap: 6,
//   },
//   takeAttendanceBtnIcon: { fontSize: 15 },
//   takeAttendanceBtnText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: COLORS.primary,
//   },

//   // Loader
//   centeredLoader: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     gap: 10,
//   },
//   loaderText: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     marginTop: 6,
//   },

//   // Empty State
//   emptyCard: {
//     backgroundColor: COLORS.card,
//     borderRadius: 18,
//     padding: 36,
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderStyle: 'dashed',
//     borderColor: COLORS.border,
//   },
//   emptyIcon: { fontSize: 36, marginBottom: 10 },
//   emptyText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: COLORS.text,
//     marginBottom: 6,
//   },
//   emptySubText: {
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 18,
//   },
// });

// export default TeacherHomeScreen;









// src/screens/teacher/HomeScreen.js
//
// ─── WHAT THIS FILE DOES ───────────────────────────────────────────────────
// Teacher's home dashboard showing:
//   • Greeting with teacher name
//   • Overview stats: total classes assigned, total students, sessions taken today
//   • Subject+class cards (what they teach and to which class)
//   • Quick action: "Take Attendance" button → navigates to Attend tab
//
// ─── WHY OVERVIEW DATA WAS EMPTY BEFORE ───────────────────────────────────
// The old UI shell had hardcoded/mock data.
// No Firestore fetch was happening at all.
//
// ─── HOW DATA IS NOW FETCHED ──────────────────────────────────────────────
// STEP 1: auth.currentUser.uid → teacher's uid
//
// STEP 2: getDoc users/{uid}
//         → teacher name, email
//
// STEP 3: query class_subjects WHERE teacherId == uid
//         → all subject+class combos assigned to this teacher
//         → gives us: className, subjectName, classId, subjectId
//
// STEP 4: for each classId, look up classes/{classId}
//         → get students[] array → count = total students per class
//
// STEP 5: query attendance WHERE teacherId == uid
//         → count how many sessions taken today (date == today)
//         → total sessions ever taken
// ───────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

const todayStr = () => new Date().toISOString().split('T')[0];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
};

const getInitials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');

const SUBJECT_COLORS = ['#1565C0','#0F9B8E','#E94560','#6366F1','#F59E0B','#10B981'];

export default function TeacherHomeScreen({ navigation, onLogout }) {
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [teacherName,    setTeacherName]    = useState('');
  const [assignments,    setAssignments]    = useState([]); // [{ classId, className, subjectId, subjectName, studentCount }]
  const [todaySessions,  setTodaySessions]  = useState(0);
  const [totalSessions,  setTotalSessions]  = useState(0);
  const [totalStudents,  setTotalStudents]  = useState(0);
  const [error,          setError]          = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const uid = auth.currentUser?.uid;
      if (!uid) { setError('Not logged in.'); return; }

      // ── STEP 1: Get teacher profile ──────────────────────────────────────
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        setTeacherName(d.full_name ?? d.name ?? '');
      }

      // ── STEP 2: Get all class-subject assignments for this teacher ────────
      // WHY: class_subjects is the join table. Each doc = one subject in one class.
      //      teacherId field tells us which teacher is assigned to it.
      const csSnap = await getDocs(
        query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
      );

      if (csSnap.empty) {
        setAssignments([]);
        setTotalStudents(0);
        setTodaySessions(0);
        setTotalSessions(0);
        return;
      }

      // ── STEP 3: For each assignment, get student count from classes doc ───
      // WHY: We want to show "X students" on each subject card.
      //      Student count = length of classes/{classId}.students[] array.
      const classCache = {}; // cache to avoid fetching same class twice

      const assignmentList = await Promise.all(
        csSnap.docs.map(async (csDoc) => {
          const d = csDoc.data();
          const classId = d.classId;

          // Fetch class doc if not cached
          if (!classCache[classId]) {
            const classSnap = await getDoc(doc(db, 'classes', classId));
            classCache[classId] = classSnap.exists() ? classSnap.data() : { students: [] };
          }

          const studentCount = (classCache[classId].students ?? []).length;

          return {
            id:           csDoc.id,
            classId:      d.classId      ?? '',
            className:    d.className    ?? 'Unknown Class',
            subjectId:    d.subjectId    ?? '',
            subjectName:  d.subjectName  ?? 'Unknown Subject',
            studentCount,
          };
        })
      );

      // Total unique students across all classes
      const uniqueClassIds  = [...new Set(assignmentList.map(a => a.classId))];
      let uniqueStudentCount = 0;
      uniqueClassIds.forEach(cid => {
        uniqueStudentCount += (classCache[cid]?.students ?? []).length;
      });

      setAssignments(assignmentList);
      setTotalStudents(uniqueStudentCount);

      // ── STEP 4: Count attendance sessions for this teacher ────────────────
      // WHY: Show "sessions taken today" and "total sessions" in overview cards.
      const today   = todayStr();
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('teacherId', '==', uid))
      );

      let todayCount = 0;
      attSnap.forEach(attDoc => {
        if (attDoc.data().date === today) todayCount += 1;
      });

      setTodaySessions(todayCount);
      setTotalSessions(attSnap.size);

    } catch (err) {
      console.error('Teacher HomeScreen fetch error:', err);
      setError('Failed to load data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Navigate to Attend tab when quick action pressed
  const goToAttendance = () => {
    navigation?.navigate('TeacherAttendance');
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={s.loadingTxt}>Loading your dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <Text style={s.greeting}>{getGreeting()}</Text>
              <Text style={s.teacherName}>{teacherName || 'Teacher'}</Text>
              <View style={s.rolePill}>
                <Text style={s.roleTxt}>👩‍🏫 Teacher</Text>
              </View>
            </View>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{getInitials(teacherName) || 'T'}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>

          {!!error && (
            <View style={s.errorCard}>
              <Text style={s.errorTxt}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Overview Stats ── */}
          {/* WHY: These were empty before because no fetch was happening */}
          <View style={s.statsRow}>
            <StatCard icon="📚" value={assignments.length} label="Subjects" color="#1565C0" bg="#E3F2FD" />
            <StatCard icon="👥" value={totalStudents}      label="Students" color="#0F9B8E" bg="#E0F7F4" />
            <StatCard icon="✅" value={todaySessions}      label="Today"    color="#16A34A" bg="#DCFCE7" />
            <StatCard icon="📋" value={totalSessions}      label="Total"    color="#7C3AED" bg="#F3E8FF" />
          </View>

          {/* ── Quick Action ── */}
          <TouchableOpacity style={s.quickBtn} activeOpacity={0.85} onPress={goToAttendance}>
            <View style={s.quickBtnInner}>
              <Text style={s.quickBtnIcon}>📝</Text>
              <View>
                <Text style={s.quickBtnTitle}>Take Attendance</Text>
                <Text style={s.quickBtnSub}>Mark today's attendance for your class</Text>
              </View>
            </View>
            <Text style={s.quickBtnArrow}>→</Text>
          </TouchableOpacity>

          {/* ── Assigned Subjects ── */}
          {assignments.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTitle}>No Subjects Assigned Yet</Text>
              <Text style={s.emptySub}>Ask your admin to assign you to a class and subject.</Text>
            </View>
          ) : (
            <View style={s.card}>
              <Text style={s.cardTitle}>📖 Your Assignments</Text>
              <Text style={s.cardSub}>{assignments.length} subject{assignments.length > 1 ? 's' : ''} across {[...new Set(assignments.map(a => a.classId))].length} class{[...new Set(assignments.map(a => a.classId))].length > 1 ? 'es' : ''}</Text>
              {assignments.map((item, i) => (
                <View key={item.id} style={[s.assignRow, i > 0 && s.divider]}>
                  <View style={[s.assignDot, { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }]} />
                  <View style={s.assignInfo}>
                    <Text style={s.assignSubject}>{item.subjectName}</Text>
                    <Text style={s.assignClass}>🏫 {item.className}  •  👥 {item.studentCount} students</Text>
                  </View>
                  <TouchableOpacity
                    style={s.attendBtn}
                    onPress={goToAttendance}
                    activeOpacity={0.8}
                  >
                    <Text style={s.attendBtnTxt}>Attend</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── Today's Sessions Summary ── */}
          {todaySessions > 0 && (
            <View style={[s.card, { backgroundColor: '#F0FDF4' }]}>
              <Text style={s.cardTitle}>✅ Today's Sessions</Text>
              <Text style={[s.cardSub, { color: '#16A34A' }]}>
                You've taken {todaySessions} attendance session{todaySessions > 1 ? 's' : ''} today.
              </Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color, bg }) => (
  <View style={[s.statCard, { backgroundColor: bg }]}>
    <Text style={s.statIcon}>{icon}</Text>
    <Text style={[s.statVal, { color }]}>{value}</Text>
    <Text style={[s.statLabel, { color }]}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F4F7FB' },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: '#1565C0' },

  header:     { backgroundColor: '#1565C0', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  greeting:   { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  teacherName:{ fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  rolePill:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  roleTxt:    { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0D47A1', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarTxt:  { color: '#fff', fontWeight: '900', fontSize: 17 },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  // Overview stats row
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard:  { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center' },
  statIcon:  { fontSize: 18, marginBottom: 4 },
  statVal:   { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Quick action button
  quickBtn:      { backgroundColor: '#1565C0', borderRadius: 18, padding: 16, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  quickBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickBtnIcon:  { fontSize: 26 },
  quickBtnTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  quickBtnSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  quickBtnArrow: { fontSize: 22, color: '#90CAF9', fontWeight: '900' },

  // Card
  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0A1F44', marginBottom: 2 },
  cardSub:   { fontSize: 12, color: '#9AA5B1', marginBottom: 12 },

  // Assignment rows
  assignRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  assignDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  assignInfo:   { flex: 1 },
  assignSubject:{ fontSize: 14, fontWeight: '700', color: '#0A1F44' },
  assignClass:  { fontSize: 12, color: '#5F6C7B', marginTop: 2 },
  attendBtn:    { backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  attendBtnTxt: { fontSize: 12, fontWeight: '700', color: '#1565C0' },

  divider: { borderTopWidth: 1, borderTopColor: '#F4F7FB' },

  // Empty / error
  emptyCard:  { backgroundColor: '#fff', borderRadius: 20, padding: 36, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#DCE3EA' },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0A1F44', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#5F6C7B', textAlign: 'center', lineHeight: 20 },
  errorCard:  { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DC2626' },
  errorTxt:   { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});