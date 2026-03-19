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
// src/screens/teacher/HomeScreen.js
//
// ─── VIEWS ────────────────────────────────────────────────────────────────────
// 'home'          → greeting, stats, assignments, quick action, date-wise report
// 'studentDetail' → full attendance breakdown for one student (same file, no nav)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  TextInput, Modal, Alert, Platform,
} from 'react-native';
import {
  collection, getDocs, query, where,
  getDoc, doc, orderBy,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr      = () => new Date().toISOString().split('T')[0];
const getInitials   = (n = '') => n.trim().split(' ').slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('');
const getGreeting   = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙'; };
const SUBJECT_COLORS = ['#1565C0','#0F9B8E','#E94560','#6366F1','#F59E0B','#10B981'];

// Format YYYY-MM-DD → "15 Jan 2024"
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Format YYYY-MM-DD → "Monday, 15 January 2024"
const fmtDateLong = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// ─── Simple Date Picker Modal ─────────────────────────────────────────────────
const DatePickerModal = ({ visible, value, onSelect, onClose, title }) => {
  const init = () => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return isNaN(d) ? new Date() : d;
  };
  const [date, setDate] = useState(init);

  useEffect(() => { if (visible) setDate(init()); }, [visible]);

  const shift = (unit, n) => {
    setDate(prev => {
      const d = new Date(prev);
      if (unit === 'day')   d.setDate(d.getDate() + n);
      if (unit === 'month') d.setMonth(d.getMonth() + n);
      if (unit === 'year')  d.setFullYear(d.getFullYear() + n);
      return d;
    });
  };

  const display = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isoVal  = date.toISOString().split('T')[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dp.overlay}>
        <View style={dp.sheet}>
          <View style={dp.handle} />
          <Text style={dp.title}>{title}</Text>
          <Text style={dp.dateDisplay}>{display}</Text>

          {/* Year row */}
          <View style={dp.ctrlRow}>
            <TouchableOpacity style={dp.ctrlBtn} onPress={() => shift('year',-1)}><Text style={dp.ctrlBtnTxt}>◀◀</Text></TouchableOpacity>
            <Text style={dp.ctrlLabel}>Year</Text>
            <TouchableOpacity style={dp.ctrlBtn} onPress={() => shift('year', 1)}><Text style={dp.ctrlBtnTxt}>▶▶</Text></TouchableOpacity>
          </View>

          {/* Month row */}
          <View style={dp.ctrlRow}>
            <TouchableOpacity style={dp.ctrlBtn} onPress={() => shift('month',-1)}><Text style={dp.ctrlBtnTxt}>◀</Text></TouchableOpacity>
            <Text style={dp.ctrlLabel}>Month</Text>
            <TouchableOpacity style={dp.ctrlBtn} onPress={() => shift('month', 1)}><Text style={dp.ctrlBtnTxt}>▶</Text></TouchableOpacity>
          </View>

          {/* Day row */}
          <View style={dp.ctrlRow}>
            <TouchableOpacity style={dp.ctrlBtn} onPress={() => shift('day',-1)}><Text style={dp.ctrlBtnTxt}>−</Text></TouchableOpacity>
            <Text style={dp.ctrlLabel}>Day</Text>
            <TouchableOpacity style={dp.ctrlBtn} onPress={() => shift('day', 1)}><Text style={dp.ctrlBtnTxt}>+</Text></TouchableOpacity>
          </View>

          <View style={dp.btnRow}>
            <TouchableOpacity style={dp.cancelBtn} onPress={onClose}><Text style={dp.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={dp.selectBtn} onPress={() => { onSelect(isoVal); onClose(); }}>
              <Text style={dp.selectTxt}>Select Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const dp = StyleSheet.create({
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:       { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingTop:12 },
  handle:      { width:40, height:4, backgroundColor:'#DCE3EA', borderRadius:2, alignSelf:'center', marginBottom:16 },
  title:       { fontSize:16, fontWeight:'800', color:'#0A1F44', textAlign:'center', marginBottom:8 },
  dateDisplay: { fontSize:22, fontWeight:'900', color:'#1565C0', textAlign:'center', marginBottom:20 },
  ctrlRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  ctrlLabel:   { fontSize:14, fontWeight:'700', color:'#5F6C7B', flex:1, textAlign:'center' },
  ctrlBtn:     { backgroundColor:'#E3F2FD', borderRadius:12, paddingHorizontal:20, paddingVertical:10, minWidth:56, alignItems:'center' },
  ctrlBtnTxt:  { fontSize:16, color:'#1565C0', fontWeight:'900' },
  btnRow:      { flexDirection:'row', gap:12, marginTop:16 },
  cancelBtn:   { flex:1, padding:14, borderRadius:14, backgroundColor:'#F4F7FB', alignItems:'center' },
  cancelTxt:   { fontWeight:'700', color:'#5F6C7B', fontSize:14 },
  selectBtn:   { flex:1, padding:14, borderRadius:14, backgroundColor:'#1565C0', alignItems:'center' },
  selectTxt:   { fontWeight:'700', color:'#fff', fontSize:14 },
});

// ─── PDF Generation ───────────────────────────────────────────────────────────
const generatePDF = async (studentInfo, sessions, fromDate, toDate) => {
  // Pivot: rows = unique dates, columns = unique session headers
  const dateSet = [...new Set(sessions.map(s => s.date))].sort();

  // Build unique column headers: "SubjectName (Lecture)" or "SubjectName (Practical - Batch X)"
  const colHeaders = [];
  const colKeySet  = new Set();
  sessions.forEach(s => {
    const key = s.sessionType === 'practical'
      ? `${s.subjectName}||practical||${s.batch}`
      : `${s.subjectName}||lecture||`;
    if (!colKeySet.has(key)) {
      colKeySet.add(key);
      colHeaders.push({
        key,
        label: s.sessionType === 'practical'
          ? `${s.subjectName}<br/><small>Practical – Batch ${s.batch}</small>`
          : `${s.subjectName}<br/><small>Lecture</small>`,
      });
    }
  });

  // Build pivot data
  const pivotRows = dateSet.map(date => {
    const daySessions = sessions.filter(s => s.date === date);
    const dayMap = {};
    daySessions.forEach(s => {
      const key = s.sessionType === 'practical'
        ? `${s.subjectName}||practical||${s.batch}`
        : `${s.subjectName}||lecture||`;
      dayMap[key] = s.status;
    });
    const present = daySessions.filter(s => s.status === 'present').length;
    const total   = daySessions.length;
    return { date, dayMap, present, total };
  });

  const totalSessions = sessions.length;
  const totalPresent  = sessions.filter(s => s.status === 'present').length;
  const totalAbsent   = totalSessions - totalPresent;
  const pct           = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
  const pctColor      = pct >= 75 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626';

  const colHeadersHTML = colHeaders.map(c =>
    `<th style="background:#1565C0;color:#fff;padding:8px 6px;font-size:11px;border:1px solid #0D47A1;min-width:90px">${c.label}</th>`
  ).join('');

  const rowsHTML = pivotRows.map((row, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#F4F7FB';
    const cellsHTML = colHeaders.map(c => {
      const status = row.dayMap[c.key];
      const cellBg  = status === 'present' ? '#DCFCE7' : status === 'absent' ? '#FEE2E2' : '#F9FAFB';
      const cellClr = status === 'present' ? '#16A34A' : status === 'absent' ? '#DC2626' : '#9AA5B1';
      const cellTxt = status === 'present' ? 'P' : status === 'absent' ? 'A' : '—';
      return `<td style="background:${cellBg};color:${cellClr};text-align:center;font-weight:700;padding:8px 4px;font-size:13px;border:1px solid #E5E7EB">${cellTxt}</td>`;
    }).join('');
    const dayPct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
    const dayClr = dayPct >= 75 ? '#16A34A' : dayPct >= 60 ? '#D97706' : '#DC2626';
    return `
      <tr style="background:${bg}">
        <td style="padding:8px 10px;border:1px solid #E5E7EB;font-weight:600;font-size:12px;white-space:nowrap">${fmtDate(row.date)}</td>
        ${cellsHTML}
        <td style="padding:8px 6px;text-align:center;border:1px solid #E5E7EB;font-size:12px">${row.present}/${row.total}</td>
        <td style="padding:8px 6px;text-align:center;border:1px solid #E5E7EB;font-weight:700;color:${dayClr};font-size:12px">${dayPct}%</td>
      </tr>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Attendance Report – ${studentInfo.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin:0; padding:0; color:#0A1F44; }
    .page { padding:24px; max-width:900px; margin:0 auto; }
    h1 { color:#1565C0; font-size:22px; margin:0 0 4px; }
    .sub { font-size:12px; color:#5F6C7B; margin-bottom:20px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid #DCE3EA; border-radius:10px; overflow:hidden; margin-bottom:20px; }
    .info-cell { padding:10px 14px; font-size:13px; border-bottom:1px solid #E5E7EB; }
    .info-cell:nth-child(odd) { background:#F4F7FB; }
    .info-label { font-size:10px; font-weight:700; color:#9AA5B1; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
    .info-value { font-weight:600; color:#0A1F44; }
    .summary-bar { display:flex; gap:12px; margin-bottom:20px; }
    .sum-box { flex:1; border-radius:10px; padding:14px; text-align:center; }
    .sum-val { font-size:26px; font-weight:900; }
    .sum-lbl { font-size:11px; font-weight:700; margin-top:4px; opacity:0.8; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { background:#1565C0; color:#fff; padding:10px 8px; text-align:center; border:1px solid #0D47A1; font-size:11px; }
    .legend { display:flex; gap:16px; margin-top:12px; font-size:11px; }
    .legend-item { display:flex; align-items:center; gap:4px; }
    .legend-dot { width:12px; height:12px; border-radius:3px; }
    .footer { margin-top:24px; border-top:1px solid #E5E7EB; padding-top:12px; font-size:11px; color:#9AA5B1; display:flex; justify-content:space-between; }
  </style>
</head>
<body>
<div class="page">

  <!-- Title -->
  <h1>📋 SAAPT Attendance Report</h1>
  <div class="sub">Generated on ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Period: ${fmtDate(fromDate)} – ${fmtDate(toDate)}</div>

  <!-- Student Info Grid -->
  <div class="info-grid">
    <div class="info-cell"><div class="info-label">Student Name</div><div class="info-value">${studentInfo.name || '—'}</div></div>
    <div class="info-cell"><div class="info-label">Roll Number</div><div class="info-value">${studentInfo.roll_number || '—'}</div></div>
    <div class="info-cell"><div class="info-label">Enrollment Number</div><div class="info-value">${studentInfo.enrollment_number || '—'}</div></div>
    <div class="info-cell"><div class="info-label">Batch</div><div class="info-value">${studentInfo.batch ? `Batch ${studentInfo.batch}` : '—'}</div></div>
    <div class="info-cell"><div class="info-label">Email</div><div class="info-value">${studentInfo.email || '—'}</div></div>
    <div class="info-cell"><div class="info-label">Class</div><div class="info-value">${studentInfo.className || '—'}</div></div>
  </div>

  <!-- Summary Boxes -->
  <div class="summary-bar">
    <div class="sum-box" style="background:#E3F2FD;color:#1565C0">
      <div class="sum-val">${totalSessions}</div><div class="sum-lbl">Total Sessions</div>
    </div>
    <div class="sum-box" style="background:#DCFCE7;color:#16A34A">
      <div class="sum-val">${totalPresent}</div><div class="sum-lbl">Present</div>
    </div>
    <div class="sum-box" style="background:#FEE2E2;color:#DC2626">
      <div class="sum-val">${totalAbsent}</div><div class="sum-lbl">Absent</div>
    </div>
    <div class="sum-box" style="background:${pct >= 75 ? '#DCFCE7' : pct >= 60 ? '#FEF3C7' : '#FEE2E2'};color:${pctColor}">
      <div class="sum-val">${pct}%</div><div class="sum-lbl">Attendance</div>
    </div>
  </div>

  <!-- Attendance Table -->
  <table>
    <thead>
      <tr>
        <th style="background:#0D47A1;min-width:100px;text-align:left;padding:10px">Date</th>
        ${colHeadersHTML}
        <th style="background:#0D47A1;min-width:60px">P / T</th>
        <th style="background:#0D47A1;min-width:50px">Daily %</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
      <!-- Summary row -->
      <tr style="background:#0D47A1">
        <td style="color:#fff;font-weight:800;padding:10px;border:1px solid #0A3A8F;font-size:12px">TOTAL</td>
        ${colHeaders.map(c => {
          const colSessions = sessions.filter(s => {
            const k = s.sessionType === 'practical' ? `${s.subjectName}||practical||${s.batch}` : `${s.subjectName}||lecture||`;
            return k === c.key;
          });
          const colPresent = colSessions.filter(s => s.status === 'present').length;
          return `<td style="color:#fff;text-align:center;font-weight:800;padding:10px;border:1px solid #0A3A8F;font-size:12px">${colPresent}/${colSessions.length}</td>`;
        }).join('')}
        <td style="color:#fff;text-align:center;font-weight:800;padding:10px;border:1px solid #0A3A8F;font-size:12px">${totalPresent}/${totalSessions}</td>
        <td style="color:#fff;text-align:center;font-weight:800;padding:10px;border:1px solid #0A3A8F;font-size:12px">${pct}%</td>
      </tr>
    </tbody>
  </table>

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#DCFCE7;border:1px solid #16A34A"></div><span style="color:#16A34A;font-weight:700">P = Present</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#FEE2E2;border:1px solid #DC2626"></div><span style="color:#DC2626;font-weight:700">A = Absent</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#F9FAFB;border:1px solid #DCE3EA"></div><span style="color:#9AA5B1;font-weight:700">— = No class that day</span></div>
  </div>

  <div class="footer">
    <span>SAAPT Attendance Management System</span>
    <span>Confidential – For internal use only</span>
  </div>
</div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Attendance – ${studentInfo.name}`,
      UTI: 'com.adobe.pdf',
    });
  } catch (err) {
    Alert.alert('PDF Error', 'Could not generate PDF. Make sure expo-print is installed.');
    console.error('PDF error:', err);
  }
};

// ─── StatCard (home screen) ───────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color, bg }) => (
  <View style={[s.statCard, { backgroundColor: bg }]}>
    <Text style={s.statIcon}>{icon}</Text>
    <Text style={[s.statVal, { color }]}>{value ?? '—'}</Text>
    <Text style={[s.statLabel, { color }]}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TeacherHomeScreen({ navigation }) {
  // ── Home screen state ──────────────────────────────────────────────────────
  const [view,          setView]         = useState('home');
  const [loading,       setLoading]      = useState(true);
  const [refreshing,    setRefreshing]   = useState(false);
  const [teacherName,   setTeacherName]  = useState('');
  const [teacherUid,    setTeacherUid]   = useState('');
  const [assignments,   setAssignments]  = useState([]);
  const [todaySessions, setTodaySessions]= useState(0);
  const [totalSessions, setTotalSessions]= useState(0);
  const [totalStudents, setTotalStudents]= useState(0);
  const [error,         setError]        = useState('');

  // ── Report filter state ────────────────────────────────────────────────────
  const [filterClass,   setFilterClass]  = useState(null);   // { classId, className }
  const [filterRoll,    setFilterRoll]   = useState('');
  const [filterEnroll,  setFilterEnroll] = useState('');
  const [fromDate,      setFromDate]     = useState(() => {
    // default: 30 days ago
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [toDate,        setToDate]       = useState(todayStr);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showFromPicker,  setShowFromPicker]  = useState(false);
  const [showToPicker,    setShowToPicker]    = useState(false);

  // ── Report results state ───────────────────────────────────────────────────
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResults, setReportResults] = useState([]); // [{ studentInfo, sessions }]
  const [hasSearched,   setHasSearched]   = useState(false);

  // ── Detail state ───────────────────────────────────────────────────────────
  const [detailStudent, setDetailStudent] = useState(null); // { studentInfo, sessions }
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const [pdfStudentId,  setPdfStudentId]  = useState(null); // which card is generating PDF

  // ── Unique classes from assignments ────────────────────────────────────────
  const uniqueClasses = (() => {
    const seen = new Set();
    return assignments.filter(a => {
      if (seen.has(a.classId)) return false;
      seen.add(a.classId); return true;
    }).map(a => ({ classId: a.classId, className: a.className }));
  })();

  // ── Fetch dashboard data ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError('');
      const uid = auth.currentUser?.uid;
      if (!uid) { setError('Not logged in.'); return; }
      setTeacherUid(uid);

      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        setTeacherName(d.full_name ?? d.name ?? '');
      }

      const csSnap = await getDocs(
        query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
      );
      if (csSnap.empty) {
        setAssignments([]); setTotalStudents(0); setTodaySessions(0); setTotalSessions(0);
        return;
      }

      const classCache = {};
      const list = await Promise.all(csSnap.docs.map(async (csDoc) => {
        const d = csDoc.data();
        if (!classCache[d.classId]) {
          const snap = await getDoc(doc(db, 'classes', d.classId));
          classCache[d.classId] = snap.exists() ? snap.data() : { students: [] };
        }
        return {
          id: csDoc.id,
          classId:     d.classId     ?? '',
          className:   d.className   ?? '',
          subjectId:   d.subjectId   ?? '',
          subjectName: d.subjectName ?? '',
          studentCount: (classCache[d.classId]?.students ?? []).length,
        };
      }));

      const uniqueClassIds = [...new Set(list.map(a => a.classId))];
      const uStudents = uniqueClassIds.reduce((sum, id) => sum + (classCache[id]?.students ?? []).length, 0);
      setAssignments(list);
      setTotalStudents(uStudents);

      const today = todayStr();
      const attSnap = await getDocs(query(collection(db, 'attendance'), where('teacherId', '==', uid)));
      let todayCount = 0;
      attSnap.forEach(d => { if (d.data().date === today) todayCount++; });
      setTodaySessions(todayCount);
      setTotalSessions(attSnap.size);

    } catch (err) {
      console.error('HomeScreen fetch error:', err);
      setError('Failed to load. Pull down to retry.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Background preload for Attendance tab ──────────────────────────────────
  // WHY: AttendanceScreen loads students from SQLite when teacher taps the tab.
  // If SQLite is empty, it fetches from Firebase AT TAP TIME → slow/crash risk.
  // Solution: as soon as HomeScreen mounts (teacher just logged in and has internet),
  // silently sync Firebase → SQLite in background while teacher sees the home screen.
  // By the time teacher taps Attendance, data is already cached.
  useEffect(() => {
    const preloadOfflineCache = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Only run if we have internet — no point trying offline
        const netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) return;

        // Import and run sync — this fills SQLite with assignments + students
        // runs completely in background, no await blocking the UI
        const { syncTeacherStructureToCache } = await import(
          '../../services/offline/attendanceOffline'
        );
        await syncTeacherStructureToCache(uid);
        // Attendance tab is now pre-populated — teacher can tap it instantly
      } catch (err) {
        // Silent fail — AttendanceScreen has its own fallback logic
        console.log('Background preload failed (non-critical):', err.message);
      }
    };

    // Small delay so HomeScreen renders first before starting heavy sync
    const timer = setTimeout(preloadOfflineCache, 1500);
    return () => clearTimeout(timer);
  }, []); // runs once on mount = once per login session

  // ── Quick date presets ─────────────────────────────────────────────────────
  const setPreset = (days) => {
    const d = new Date(); d.setDate(d.getDate() - days);
    setFromDate(d.toISOString().split('T')[0]);
    setToDate(todayStr());
  };

  // ── Fetch report ───────────────────────────────────────────────────────────
  const fetchReport = async () => {
    if (!fromDate || !toDate) { Alert.alert('Date Required', 'Please select From and To dates.'); return; }
    if (fromDate > toDate)    { Alert.alert('Date Error', 'From date must be before To date.'); return; }
    if (!filterClass && !filterRoll.trim() && !filterEnroll.trim()) {
      Alert.alert('Filter Required', 'Please select a class or enter roll/enrollment number to search.');
      return;
    }

    setReportLoading(true);
    setHasSearched(true);
    setReportResults([]);

    try {
      const uid = auth.currentUser?.uid;

      // ── Step 1: find which student UIDs to filter for ──────────────────────
      let targetUids = null; // null = no filter (show all in class)

      if (filterRoll.trim() || filterEnroll.trim()) {
        // Find student by roll number or enrollment number
        const searchField = filterRoll.trim() ? 'roll_number' : 'enrollment_number';
        const searchValue = filterRoll.trim() || filterEnroll.trim();
        const stuSnap = await getDocs(
          query(collection(db, 'users'), where(searchField, '==', searchValue))
        );
        if (stuSnap.empty) {
          Alert.alert('Not Found', `No student found with ${filterRoll.trim() ? 'roll number' : 'enrollment number'} "${searchValue}".`);
          setReportLoading(false);
          return;
        }
        targetUids = new Set(stuSnap.docs.map(d => d.id));
      }

      // ── Step 2: fetch attendance docs for this teacher in date range ────────
      // Query by teacherId + classId (if selected). Date filter done in JS.
      let attQuery = query(
        collection(db, 'attendance'),
        where('teacherId', '==', uid)
      );
      if (filterClass) {
        attQuery = query(
          collection(db, 'attendance'),
          where('teacherId', '==', uid),
          where('classId', '==', filterClass.classId)
        );
      }
      const attSnap = await getDocs(attQuery);

      // Filter by date range in JS
      const attDocs = attSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.date >= fromDate && d.date <= toDate);

      if (attDocs.length === 0) {
        setReportResults([]);
        setReportLoading(false);
        return;
      }

      // ── Step 3: aggregate sessions per student ─────────────────────────────
      // studentMap: { uid → { sessions: [] } }
      const studentMap = {};

      attDocs.forEach(attDoc => {
        const records = attDoc.records ?? [];
        records.forEach(rec => {
          const sid = rec.studentId;
          // Skip if we're filtering by specific student UIDs
          if (targetUids && !targetUids.has(sid)) return;
          if (!studentMap[sid]) studentMap[sid] = { sessions: [], className: attDoc.className || '' };
          studentMap[sid].sessions.push({
            date:        attDoc.date,
            subjectName: attDoc.subjectName ?? '',
            sessionType: attDoc.sessionType ?? 'lecture',
            batch:       attDoc.batch        ?? '',
            status:      rec.status          ?? 'absent',
          });
        });
      });

      if (Object.keys(studentMap).length === 0) {
        setReportResults([]);
        setReportLoading(false);
        return;
      }

      // ── Step 4: fetch student details from users collection ────────────────
      const results = await Promise.all(
        Object.entries(studentMap).map(async ([uid, data]) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            const info = snap.exists() ? snap.data() : {};
            return {
              studentInfo: {
                uid,
                name:               info.name              ?? info.full_name ?? 'Unknown',
                email:              info.email             ?? '',
                roll_number:        info.roll_number        ?? '',
                enrollment_number:  info.enrollment_number  ?? '',
                batch:              info.batch              ?? '',
                phone:              info.phone              ?? '',
                className:          data.className,
              },
              sessions: data.sessions.sort((a, b) => a.date.localeCompare(b.date)),
            };
          } catch {
            return null;
          }
        })
      );

      const validResults = results.filter(Boolean);
      validResults.sort((a, b) =>
        (a.studentInfo.roll_number || a.studentInfo.name).localeCompare(
          b.studentInfo.roll_number || b.studentInfo.name
        )
      );
      setReportResults(validResults);

    } catch (err) {
      console.error('fetchReport error:', err);
      Alert.alert('Error', 'Failed to fetch report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  // ── PDF download from card ─────────────────────────────────────────────────
  const handleCardPDF = async (result) => {
    setPdfStudentId(result.studentInfo.uid);
    await generatePDF(result.studentInfo, result.sessions, fromDate, toDate);
    setPdfStudentId(null);
  };

  // ── Open detail view ───────────────────────────────────────────────────────
  const openDetail = (result) => {
    setDetailStudent(result);
    setView('studentDetail');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  STUDENT DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'studentDetail' && detailStudent) {
    const { studentInfo, sessions } = detailStudent;
    const totalS  = sessions.length;
    const present = sessions.filter(s => s.status === 'present').length;
    const absent  = totalS - present;
    const pct     = totalS > 0 ? Math.round((present / totalS) * 100) : 0;
    const pctClr  = pct >= 75 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626';

    // Group sessions by date
    const byDate = {};
    sessions.forEach(s => {
      if (!byDate[s.date]) byDate[s.date] = [];
      byDate[s.date].push(s);
    });
    const dates = Object.keys(byDate).sort();

    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

        {/* Detail Header */}
        <View style={s.detailHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => setView('home')} activeOpacity={0.8}>
            <Text style={s.backBtnTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex:1 }}>
            <Text style={s.detailHeaderTitle} numberOfLines={1}>{studentInfo.name}</Text>
            <Text style={s.detailHeaderSub}>{studentInfo.className} {studentInfo.batch ? `· Batch ${studentInfo.batch}` : ''}</Text>
          </View>
          {/* PDF button in header */}
          <TouchableOpacity
            style={s.headerPDFBtn}
            onPress={async () => { setPdfLoading(true); await generatePDF(studentInfo, sessions, fromDate, toDate); setPdfLoading(false); }}
            disabled={pdfLoading}
            activeOpacity={0.8}
          >
            {pdfLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.headerPDFTxt}>📄 PDF</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal:16, paddingTop:16, paddingBottom:40 }}>

            {/* Student Info Card */}
            <View style={s.detailInfoCard}>
              <View style={s.detailInfoRow}><Text style={s.detailInfoLabel}>Name</Text><Text style={s.detailInfoValue}>{studentInfo.name}</Text></View>
              <View style={s.detailInfoRow}><Text style={s.detailInfoLabel}>Roll Number</Text><Text style={s.detailInfoValue}>{studentInfo.roll_number || '—'}</Text></View>
              <View style={s.detailInfoRow}><Text style={s.detailInfoLabel}>Enrollment No</Text><Text style={s.detailInfoValue}>{studentInfo.enrollment_number || '—'}</Text></View>
              <View style={s.detailInfoRow}><Text style={s.detailInfoLabel}>Batch</Text><Text style={s.detailInfoValue}>{studentInfo.batch ? `Batch ${studentInfo.batch}` : '—'}</Text></View>
              <View style={s.detailInfoRow}><Text style={s.detailInfoLabel}>Email</Text><Text style={s.detailInfoValue}>{studentInfo.email || '—'}</Text></View>
              <View style={[s.detailInfoRow, { borderBottomWidth:0 }]}><Text style={s.detailInfoLabel}>Period</Text><Text style={s.detailInfoValue}>{fmtDate(fromDate)} – {fmtDate(toDate)}</Text></View>
            </View>

            {/* Summary Row */}
            <View style={s.detailSummaryRow}>
              <View style={[s.detailSumBox, { backgroundColor:'#E3F2FD' }]}><Text style={[s.detailSumVal,{ color:'#1565C0' }]}>{totalS}</Text><Text style={[s.detailSumLbl,{ color:'#1565C0' }]}>Total</Text></View>
              <View style={[s.detailSumBox, { backgroundColor:'#DCFCE7' }]}><Text style={[s.detailSumVal,{ color:'#16A34A' }]}>{present}</Text><Text style={[s.detailSumLbl,{ color:'#16A34A' }]}>Present</Text></View>
              <View style={[s.detailSumBox, { backgroundColor:'#FEE2E2' }]}><Text style={[s.detailSumVal,{ color:'#DC2626' }]}>{absent}</Text><Text style={[s.detailSumLbl,{ color:'#DC2626' }]}>Absent</Text></View>
              <View style={[s.detailSumBox, { backgroundColor: pct >= 75 ? '#DCFCE7' : pct >= 60 ? '#FEF3C7' : '#FEE2E2' }]}>
                <Text style={[s.detailSumVal, { color: pctClr }]}>{pct}%</Text>
                <Text style={[s.detailSumLbl, { color: pctClr }]}>Attend.</Text>
              </View>
            </View>

            {/* Attendance Table — one group per date */}
            <Text style={s.tableTitle}>📅 Date-wise Attendance</Text>
            <View style={s.table}>
              {/* Table Header */}
              <View style={s.tableHeader}>
                <Text style={[s.thCell, { flex:1.2 }]}>Date</Text>
                <Text style={[s.thCell, { flex:1.5 }]}>Subject</Text>
                <Text style={[s.thCell, { flex:0.9 }]}>Type</Text>
                <Text style={[s.thCell, { flex:0.6, textAlign:'center' }]}>Batch</Text>
                <Text style={[s.thCell, { flex:0.8, textAlign:'center' }]}>Status</Text>
              </View>

              {dates.map((date, di) => {
                const daySessions = byDate[date];
                const dayPresent  = daySessions.filter(s => s.status === 'present').length;
                return (
                  <View key={date}>
                    {daySessions.map((session, si) => {
                      const isP = session.status === 'present';
                      const rowBg = di % 2 === 0 ? '#fff' : '#F8F9FE';
                      return (
                        <View key={si} style={[s.tableRow, { backgroundColor: rowBg }]}>
                          {si === 0
                            ? <Text style={[s.tdCell, { flex:1.2, fontWeight:'700', color:'#0A1F44', fontSize:11 }]}>{fmtDate(date)}</Text>
                            : <Text style={[s.tdCell, { flex:1.2 }]}></Text>
                          }
                          <Text style={[s.tdCell, { flex:1.5, color:'#0A1F44', fontWeight:'600', fontSize:12 }]} numberOfLines={2}>{session.subjectName}</Text>
                          <Text style={[s.tdCell, { flex:0.9, fontSize:11, color: session.sessionType === 'practical' ? '#7C3AED' : '#1565C0', fontWeight:'700' }]}>
                            {session.sessionType === 'practical' ? '🔬 Prac' : '📖 Lec'}
                          </Text>
                          <Text style={[s.tdCell, { flex:0.6, textAlign:'center', fontSize:12, fontWeight:'700', color:'#5F6C7B' }]}>
                            {session.batch || '—'}
                          </Text>
                          <View style={[s.tdCell, { flex:0.8, alignItems:'center' }]}>
                            <View style={[s.statusPill, { backgroundColor: isP ? '#DCFCE7' : '#FEE2E2' }]}>
                              <Text style={[s.statusPillTxt, { color: isP ? '#16A34A' : '#DC2626' }]}>
                                {isP ? '✓ P' : '✗ A'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    {/* Day summary row */}
                    <View style={s.daySummaryRow}>
                      <Text style={s.daySummaryTxt}>
                        {fmtDate(date)} — {dayPresent}/{daySessions.length} sessions attended
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Download PDF button at bottom */}
            <TouchableOpacity
              style={s.bigPDFBtn}
              onPress={async () => { setPdfLoading(true); await generatePDF(studentInfo, sessions, fromDate, toDate); setPdfLoading(false); }}
              disabled={pdfLoading}
              activeOpacity={0.85}
            >
              {pdfLoading
                ? <ActivityIndicator color="#fff" />
                : <><Text style={s.bigPDFIcon}>📄</Text><Text style={s.bigPDFTxt}>Download PDF Report</Text></>
              }
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOME VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#1565C0" />
      <Text style={s.loadingTxt}>Loading your dashboard…</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <Text style={s.greeting}>{getGreeting()}</Text>
              <Text style={s.teacherName}>{teacherName || 'Teacher'}</Text>
              <View style={s.rolePill}><Text style={s.roleTxt}>👩‍🏫 Teacher</Text></View>
            </View>
            <View style={s.avatar}><Text style={s.avatarTxt}>{getInitials(teacherName) || 'T'}</Text></View>
          </View>
        </View>

        <View style={s.body}>
          {!!error && <View style={s.errorCard}><Text style={s.errorTxt}>⚠️ {error}</Text></View>}

          {/* ── Stats Row ── */}
          <View style={s.statsRow}>
            <StatCard icon="📚" value={assignments.length} label="Subjects"  color="#1565C0" bg="#E3F2FD" />
            <StatCard icon="👥" value={totalStudents}      label="Students"  color="#0F9B8E" bg="#E0F7F4" />
            <StatCard icon="✅" value={todaySessions}      label="Today"     color="#16A34A" bg="#DCFCE7" />
            <StatCard icon="📋" value={totalSessions}      label="Total"     color="#7C3AED" bg="#F3E8FF" />
          </View>

          {/* ── Quick Action ── */}
          <TouchableOpacity style={s.quickBtn} activeOpacity={0.85} onPress={() => navigation?.navigate('TeacherAttendance')}>
            <View style={s.quickBtnInner}>
              <Text style={s.quickBtnIcon}>📝</Text>
              <View>
                <Text style={s.quickBtnTitle}>Take Attendance</Text>
                <Text style={s.quickBtnSub}>Mark today's attendance for your class</Text>
              </View>
            </View>
            <Text style={s.quickBtnArrow}>→</Text>
          </TouchableOpacity>

          {/* ── Your Assignments ── */}
          {assignments.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>📖 Your Assignments</Text>
              <Text style={s.cardSub}>{assignments.length} subject{assignments.length > 1 ? 's' : ''} across {uniqueClasses.length} class{uniqueClasses.length > 1 ? 'es' : ''}</Text>
              {assignments.map((item, i) => (
                <View key={item.id} style={[s.assignRow, i > 0 && s.divider]}>
                  <View style={[s.assignDot, { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }]} />
                  <View style={s.assignInfo}>
                    <Text style={s.assignSubject}>{item.subjectName}</Text>
                    <Text style={s.assignClass}>🏫 {item.className}  •  👥 {item.studentCount} students</Text>
                  </View>
                  <TouchableOpacity style={s.attendBtn} onPress={() => navigation?.navigate('TeacherAttendance')} activeOpacity={0.8}>
                    <Text style={s.attendBtnTxt}>Attend</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── Today's Sessions ── */}
          {todaySessions > 0 && (
            <View style={[s.card, { backgroundColor:'#F0FDF4' }]}>
              <Text style={s.cardTitle}>✅ Today's Sessions</Text>
              <Text style={[s.cardSub, { color:'#16A34A' }]}>
                You've taken {todaySessions} attendance session{todaySessions > 1 ? 's' : ''} today.
              </Text>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════
              DATE-WISE STUDENT REPORT
          ══════════════════════════════════════════════════════════════ */}
          <View style={s.reportSection}>
            <View style={s.reportSectionHeader}>
              <Text style={s.reportSectionTitle}>📊 Date-wise Student Report</Text>
              <Text style={s.reportSectionSub}>Filter & download individual student attendance</Text>
            </View>

            {/* ── Filter Card ── */}
            <View style={s.filterCard}>

              {/* Class Picker */}
              <Text style={s.filterLabel}>Class</Text>
              <TouchableOpacity style={s.filterPicker} onPress={() => setShowClassPicker(true)} activeOpacity={0.8}>
                <Text style={[s.filterPickerTxt, filterClass && { color:'#0A1F44', fontWeight:'600' }]}>
                  {filterClass ? filterClass.className : 'All my classes'}
                </Text>
                <Text style={s.filterPickerArrow}>▼</Text>
              </TouchableOpacity>

              {/* Roll Number */}
              <Text style={[s.filterLabel, { marginTop:12 }]}>Roll Number</Text>
              <TextInput
                style={s.filterInput}
                placeholder="e.g. 23CS001"
                placeholderTextColor="#9AA5B1"
                value={filterRoll}
                onChangeText={v => { setFilterRoll(v); if (v) setFilterEnroll(''); }}
                autoCapitalize="characters"
              />

              {/* Enrollment Number */}
              <Text style={[s.filterLabel, { marginTop:12 }]}>Enrollment Number</Text>
              <TextInput
                style={s.filterInput}
                placeholder="e.g. EN2023001"
                placeholderTextColor="#9AA5B1"
                value={filterEnroll}
                onChangeText={v => { setFilterEnroll(v); if (v) setFilterRoll(''); }}
                autoCapitalize="characters"
              />

              {/* Date Range Quick Presets */}
              <Text style={[s.filterLabel, { marginTop:12 }]}>Date Range</Text>
              <View style={s.presetRow}>
                {[
                  { label:'7d',  days:7  },
                  { label:'30d', days:30 },
                  { label:'3m',  days:90 },
                  { label:'6m',  days:180},
                ].map(p => (
                  <TouchableOpacity key={p.label} style={s.presetBtn} onPress={() => setPreset(p.days)} activeOpacity={0.8}>
                    <Text style={s.presetBtnTxt}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* From / To Date */}
              <View style={s.dateRow}>
                <View style={{ flex:1 }}>
                  <Text style={s.filterLabel}>From</Text>
                  <TouchableOpacity style={s.datePicker} onPress={() => setShowFromPicker(true)} activeOpacity={0.8}>
                    <Text style={s.datePickerTxt}>📅 {fmtDate(fromDate)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width:12 }} />
                <View style={{ flex:1 }}>
                  <Text style={s.filterLabel}>To</Text>
                  <TouchableOpacity style={s.datePicker} onPress={() => setShowToPicker(true)} activeOpacity={0.8}>
                    <Text style={s.datePickerTxt}>📅 {fmtDate(toDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Button */}
              <TouchableOpacity
                style={[s.searchBtn, reportLoading && s.searchBtnDisabled]}
                onPress={fetchReport}
                disabled={reportLoading}
                activeOpacity={0.85}
              >
                {reportLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.searchBtnTxt}>🔍 Search Students</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Results ── */}
            {hasSearched && !reportLoading && (
              reportResults.length === 0 ? (
                <View style={s.noResults}>
                  <Text style={s.noResultsIcon}>🔍</Text>
                  <Text style={s.noResultsTitle}>No Results Found</Text>
                  <Text style={s.noResultsSub}>No attendance data found for the selected filters and date range.</Text>
                </View>
              ) : (
                <View>
                  <Text style={s.resultsLabel}>{reportResults.length} student{reportResults.length > 1 ? 's' : ''} found</Text>
                  {reportResults.map(result => {
                    const { studentInfo, sessions } = result;
                    const total   = sessions.length;
                    const present = sessions.filter(s => s.status === 'present').length;
                    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
                    const pctClr  = pct >= 75 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626';
                    const isPdfLoading = pdfStudentId === studentInfo.uid;

                    return (
                      <TouchableOpacity
                        key={studentInfo.uid}
                        style={s.studentCard}
                        onPress={() => openDetail(result)}
                        activeOpacity={0.85}
                      >
                        {/* Left accent */}
                        <View style={[s.studentCardAccent, { backgroundColor: pctClr }]} />

                        <View style={s.studentCardBody}>
                          {/* Top row: avatar + info */}
                          <View style={s.studentCardTop}>
                            <View style={s.studentAvatar}>
                              <Text style={s.studentAvatarTxt}>{getInitials(studentInfo.name)}</Text>
                            </View>
                            <View style={{ flex:1 }}>
                              <Text style={s.studentCardName}>{studentInfo.name}</Text>
                              <Text style={s.studentCardMeta}>
                                {studentInfo.roll_number ? `🔢 ${studentInfo.roll_number}` : ''}
                                {studentInfo.roll_number && studentInfo.className ? '  ·  ' : ''}
                                {studentInfo.className ? `🏫 ${studentInfo.className}` : ''}
                              </Text>
                              {!!studentInfo.batch && (
                                <View style={s.batchPill}>
                                  <Text style={s.batchPillTxt}>Batch {studentInfo.batch}</Text>
                                </View>
                              )}
                            </View>

                            {/* PDF Download Button */}
                            <TouchableOpacity
                              style={s.pdfBtn}
                              onPress={() => handleCardPDF(result)}
                              disabled={isPdfLoading}
                              activeOpacity={0.8}
                              // Stop propagation so tap doesn't open detail view
                              onStartShouldSetResponder={() => true}
                            >
                              {isPdfLoading
                                ? <ActivityIndicator size="small" color="#1565C0" />
                                : <Text style={s.pdfBtnTxt}>📄</Text>
                              }
                            </TouchableOpacity>
                          </View>

                          {/* Stats bar */}
                          <View style={s.studentCardStats}>
                            <View style={s.studentStatItem}>
                              <Text style={s.studentStatVal}>{total}</Text>
                              <Text style={s.studentStatLbl}>Sessions</Text>
                            </View>
                            <View style={s.studentStatDivider} />
                            <View style={s.studentStatItem}>
                              <Text style={[s.studentStatVal, { color:'#16A34A' }]}>{present}</Text>
                              <Text style={s.studentStatLbl}>Present</Text>
                            </View>
                            <View style={s.studentStatDivider} />
                            <View style={s.studentStatItem}>
                              <Text style={[s.studentStatVal, { color:'#DC2626' }]}>{total - present}</Text>
                              <Text style={s.studentStatLbl}>Absent</Text>
                            </View>
                            <View style={s.studentStatDivider} />
                            <View style={s.studentStatItem}>
                              <Text style={[s.studentStatVal, { color: pctClr, fontSize:16 }]}>{pct}%</Text>
                              <Text style={s.studentStatLbl}>Attend.</Text>
                            </View>
                            {/* Progress bar */}
                            <View style={s.progressWrap}>
                              <View style={s.progressBg}>
                                <View style={[s.progressFill, { width:`${pct}%`, backgroundColor: pctClr }]} />
                              </View>
                            </View>
                          </View>

                          {/* Tap hint */}
                          <Text style={s.tapHint}>Tap to view full attendance  ›</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}
          </View>

          <View style={{ height:40 }} />
        </View>
      </ScrollView>

      {/* ── Class Picker Modal ── */}
      <Modal visible={showClassPicker} transparent animationType="slide" onRequestClose={() => setShowClassPicker(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.sheetTitle}>Select Class</Text>
            <TouchableOpacity
              style={[m.classRow, !filterClass && m.classRowSelected]}
              onPress={() => { setFilterClass(null); setShowClassPicker(false); }}
              activeOpacity={0.8}
            >
              <Text style={[m.classRowTxt, !filterClass && m.classRowTxtSelected]}>All my classes</Text>
              {!filterClass && <Text style={m.checkmark}>✓</Text>}
            </TouchableOpacity>
            {uniqueClasses.map(cls => (
              <TouchableOpacity
                key={cls.classId}
                style={[m.classRow, filterClass?.classId === cls.classId && m.classRowSelected]}
                onPress={() => { setFilterClass(cls); setShowClassPicker(false); }}
                activeOpacity={0.8}
              >
                <Text style={[m.classRowTxt, filterClass?.classId === cls.classId && m.classRowTxtSelected]}>
                  🏫 {cls.className}
                </Text>
                {filterClass?.classId === cls.classId && <Text style={m.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <View style={{ height:24 }} />
          </View>
        </View>
      </Modal>

      {/* ── Date Picker Modals ── */}
      <DatePickerModal visible={showFromPicker} value={fromDate} title="Select From Date" onSelect={setFromDate} onClose={() => setShowFromPicker(false)} />
      <DatePickerModal visible={showToPicker}   value={toDate}   title="Select To Date"   onSelect={setToDate}   onClose={() => setShowToPicker(false)} />
    </View>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:             { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:               { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, paddingHorizontal:20, paddingTop:12 },
  handle:              { width:40, height:4, backgroundColor:'#DCE3EA', borderRadius:2, alignSelf:'center', marginBottom:16 },
  sheetTitle:          { fontSize:16, fontWeight:'800', color:'#0A1F44', marginBottom:16 },
  classRow:            { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:14, paddingHorizontal:12, borderRadius:12, marginBottom:8, backgroundColor:'#F4F7FB', borderWidth:1.5, borderColor:'transparent' },
  classRowSelected:    { backgroundColor:'#E3F2FD', borderColor:'#1565C0' },
  classRowTxt:         { fontSize:14, fontWeight:'600', color:'#5F6C7B' },
  classRowTxtSelected: { color:'#1565C0' },
  checkmark:           { fontSize:18, color:'#1565C0', fontWeight:'900' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#F4F7FB' },
  centered:    { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingTxt:  { fontSize:14, color:'#1565C0' },

  // Header
  header:      { backgroundColor:'#1565C0', paddingTop:52, paddingHorizontal:20, paddingBottom:28 },
  headerRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  headerLeft:  { flex:1 },
  greeting:    { fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:4 },
  teacherName: { fontSize:26, fontWeight:'900', color:'#fff', letterSpacing:-0.5, marginBottom:8 },
  rolePill:    { backgroundColor:'rgba(255,255,255,0.15)', borderRadius:20, paddingHorizontal:10, paddingVertical:4, alignSelf:'flex-start' },
  roleTxt:     { fontSize:11, color:'rgba(255,255,255,0.9)', fontWeight:'600' },
  avatar:      { width:52, height:52, borderRadius:26, backgroundColor:'#0D47A1', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'rgba(255,255,255,0.3)' },
  avatarTxt:   { color:'#fff', fontWeight:'900', fontSize:17 },

  body: { paddingHorizontal:16, paddingTop:16 },

  // Stats
  statsRow:  { flexDirection:'row', gap:8, marginBottom:14 },
  statCard:  { flex:1, borderRadius:14, padding:10, alignItems:'center' },
  statIcon:  { fontSize:18, marginBottom:4 },
  statVal:   { fontSize:20, fontWeight:'900' },
  statLabel: { fontSize:10, fontWeight:'600', marginTop:2 },

  // Quick action
  quickBtn:      { backgroundColor:'#1565C0', borderRadius:18, padding:16, marginBottom:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center', elevation:5, shadowColor:'#1565C0', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 },
  quickBtnInner: { flexDirection:'row', alignItems:'center', gap:12 },
  quickBtnIcon:  { fontSize:26 },
  quickBtnTitle: { fontSize:15, fontWeight:'800', color:'#fff' },
  quickBtnSub:   { fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 },
  quickBtnArrow: { fontSize:22, color:'#90CAF9', fontWeight:'900' },

  // Card
  card:       { backgroundColor:'#fff', borderRadius:20, padding:16, marginBottom:14, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  cardTitle:  { fontSize:15, fontWeight:'700', color:'#0A1F44', marginBottom:2 },
  cardSub:    { fontSize:12, color:'#9AA5B1', marginBottom:12 },
  assignRow:  { flexDirection:'row', alignItems:'center', paddingVertical:12 },
  assignDot:  { width:10, height:10, borderRadius:5, marginRight:12 },
  assignInfo: { flex:1 },
  assignSubject: { fontSize:14, fontWeight:'700', color:'#0A1F44' },
  assignClass:   { fontSize:12, color:'#5F6C7B', marginTop:2 },
  attendBtn:     { backgroundColor:'#E3F2FD', borderRadius:10, paddingHorizontal:12, paddingVertical:6 },
  attendBtnTxt:  { fontSize:12, fontWeight:'700', color:'#1565C0' },
  divider:    { borderTopWidth:1, borderTopColor:'#F4F7FB' },

  // Error
  errorCard: { backgroundColor:'#FEE2E2', borderRadius:12, padding:14, marginBottom:14, borderWidth:1, borderColor:'#DC2626' },
  errorTxt:  { color:'#DC2626', fontSize:13, fontWeight:'600' },

  // ── Report Section ──────────────────────────────────────────────────────────
  reportSection:       { marginTop:4 },
  reportSectionHeader: { marginBottom:12 },
  reportSectionTitle:  { fontSize:17, fontWeight:'800', color:'#0A1F44' },
  reportSectionSub:    { fontSize:12, color:'#9AA5B1', marginTop:2 },

  // Filter card
  filterCard:    { backgroundColor:'#fff', borderRadius:20, padding:16, marginBottom:14, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  filterLabel:   { fontSize:12, fontWeight:'700', color:'#5F6C7B', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  filterPicker:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1.5, borderColor:'#DCE3EA', borderRadius:12, paddingHorizontal:14, paddingVertical:12, backgroundColor:'#F9FAFB' },
  filterPickerTxt:   { fontSize:14, color:'#9AA5B1', flex:1 },
  filterPickerArrow: { fontSize:11, color:'#9AA5B1' },
  filterInput:   { borderWidth:1.5, borderColor:'#DCE3EA', borderRadius:12, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:'#0A1F44', backgroundColor:'#F9FAFB' },

  // Presets
  presetRow: { flexDirection:'row', gap:8, marginBottom:12 },
  presetBtn: { flex:1, backgroundColor:'#E3F2FD', borderRadius:10, paddingVertical:8, alignItems:'center' },
  presetBtnTxt: { fontSize:12, fontWeight:'700', color:'#1565C0' },

  // Date row
  dateRow:    { flexDirection:'row', marginBottom:16 },
  datePicker: { borderWidth:1.5, borderColor:'#DCE3EA', borderRadius:12, paddingHorizontal:10, paddingVertical:12, backgroundColor:'#F9FAFB' },
  datePickerTxt: { fontSize:12, color:'#0A1F44', fontWeight:'600' },

  // Search button
  searchBtn:         { backgroundColor:'#1565C0', borderRadius:14, paddingVertical:15, alignItems:'center', elevation:4, shadowColor:'#1565C0', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6 },
  searchBtnDisabled: { backgroundColor:'#9AA5B1', elevation:0 },
  searchBtnTxt:      { color:'#fff', fontWeight:'800', fontSize:15 },

  // Results
  resultsLabel:    { fontSize:12, fontWeight:'800', color:'#9AA5B1', letterSpacing:1, textTransform:'uppercase', marginBottom:12 },
  noResults:       { alignItems:'center', paddingVertical:36 },
  noResultsIcon:   { fontSize:40, marginBottom:10 },
  noResultsTitle:  { fontSize:16, fontWeight:'700', color:'#0A1F44', marginBottom:6 },
  noResultsSub:    { fontSize:13, color:'#9AA5B1', textAlign:'center', lineHeight:20 },

  // Student Result Card
  studentCard:        { backgroundColor:'#fff', borderRadius:18, marginBottom:12, overflow:'hidden', elevation:4, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:8, flexDirection:'row' },
  studentCardAccent:  { width:5 },
  studentCardBody:    { flex:1, padding:14 },
  studentCardTop:     { flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:12 },
  studentAvatar:      { width:44, height:44, borderRadius:13, backgroundColor:'#E3F2FD', alignItems:'center', justifyContent:'center' },
  studentAvatarTxt:   { fontSize:15, fontWeight:'800', color:'#1565C0' },
  studentCardName:    { fontSize:15, fontWeight:'800', color:'#0A1F44' },
  studentCardMeta:    { fontSize:12, color:'#5F6C7B', marginTop:3 },
  batchPill:          { backgroundColor:'#EEF2FF', borderRadius:8, paddingHorizontal:8, paddingVertical:2, alignSelf:'flex-start', marginTop:4, borderWidth:1.5, borderColor:'#C7D2FE' },
  batchPillTxt:       { fontSize:11, fontWeight:'800', color:'#4338CA' },

  // PDF button on card
  pdfBtn:    { width:38, height:38, borderRadius:11, backgroundColor:'#F0F4FF', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'#C7D2FE' },
  pdfBtnTxt: { fontSize:20 },

  // Student stats bar inside card
  studentCardStats:  { flexDirection:'row', alignItems:'center', backgroundColor:'#F8F9FE', borderRadius:12, padding:10, marginBottom:8 },
  studentStatItem:   { alignItems:'center', flex:1 },
  studentStatVal:    { fontSize:17, fontWeight:'900', color:'#0A1F44' },
  studentStatLbl:    { fontSize:10, fontWeight:'600', color:'#9AA5B1', marginTop:2 },
  studentStatDivider:{ width:1, height:28, backgroundColor:'#E5E7EB' },
  progressWrap:      { position:'absolute', bottom:0, left:10, right:10, height:3, borderRadius:2, overflow:'hidden', backgroundColor:'#E5E7EB' },
  progressBg:        { flex:1, borderRadius:2, overflow:'hidden' },
  progressFill:      { height:3, borderRadius:2 },
  tapHint:           { fontSize:11, color:'#9AA5B1', textAlign:'right', fontWeight:'600' },

  // ── Detail View ─────────────────────────────────────────────────────────────
  detailHeader:      { backgroundColor:'#1565C0', paddingTop:52, paddingHorizontal:16, paddingBottom:18, flexDirection:'row', alignItems:'center', gap:12 },
  backBtn:           { width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'rgba(255,255,255,0.35)' },
  backBtnTxt:        { color:'#fff', fontSize:26, fontWeight:'300', lineHeight:30 },
  detailHeaderTitle: { fontSize:18, fontWeight:'800', color:'#fff' },
  detailHeaderSub:   { fontSize:12, color:'rgba(255,255,255,0.65)', marginTop:2 },
  headerPDFBtn:      { backgroundColor:'rgba(255,255,255,0.2)', borderRadius:10, paddingHorizontal:12, paddingVertical:8, borderWidth:1.5, borderColor:'rgba(255,255,255,0.35)' },
  headerPDFTxt:      { color:'#fff', fontWeight:'700', fontSize:12 },

  // Student Info Card
  detailInfoCard:  { backgroundColor:'#fff', borderRadius:18, marginBottom:14, overflow:'hidden', elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  detailInfoRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#F4F7FB' },
  detailInfoLabel: { fontSize:12, color:'#9AA5B1', fontWeight:'700' },
  detailInfoValue: { fontSize:13, color:'#0A1F44', fontWeight:'600', flex:1, textAlign:'right' },

  // Summary boxes in detail
  detailSummaryRow: { flexDirection:'row', gap:8, marginBottom:16 },
  detailSumBox:     { flex:1, borderRadius:14, padding:12, alignItems:'center' },
  detailSumVal:     { fontSize:22, fontWeight:'900' },
  detailSumLbl:     { fontSize:11, fontWeight:'700', marginTop:3, opacity:0.8 },

  // Attendance Table
  tableTitle:   { fontSize:15, fontWeight:'800', color:'#0A1F44', marginBottom:10 },
  table:        { backgroundColor:'#fff', borderRadius:18, overflow:'hidden', marginBottom:16, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  tableHeader:  { flexDirection:'row', backgroundColor:'#1565C0', paddingVertical:10, paddingHorizontal:10 },
  thCell:       { fontSize:10, fontWeight:'800', color:'#fff', textTransform:'uppercase', letterSpacing:0.4 },
  tableRow:     { flexDirection:'row', paddingVertical:10, paddingHorizontal:10, borderBottomWidth:1, borderBottomColor:'#F4F7FB', alignItems:'center' },
  tdCell:       { fontSize:12, color:'#5F6C7B' },
  statusPill:   { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  statusPillTxt:{ fontSize:11, fontWeight:'800' },
  daySummaryRow:{ backgroundColor:'#F0F4FF', paddingVertical:6, paddingHorizontal:10, borderBottomWidth:1, borderBottomColor:'#E5E7EB' },
  daySummaryTxt:{ fontSize:11, color:'#1565C0', fontWeight:'700' },

  // Big PDF button
  bigPDFBtn:  { backgroundColor:'#1565C0', borderRadius:16, paddingVertical:16, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:10, elevation:5, shadowColor:'#1565C0', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 },
  bigPDFIcon: { fontSize:22 },
  bigPDFTxt:  { fontSize:16, fontWeight:'800', color:'#fff' },
});