// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
// } from 'react-native';
// import {
//   doc,
//   getDoc,
//   collection,
//   query,
//   where,
//   getDocs,
//   addDoc,
//   updateDoc,
//   Timestamp,
// } from 'firebase/firestore';
// import { auth, db } from '../../services/firebase/config'; // adjust path as needed

// // ─── Color Palette ────────────────────────────────────────────────────────────
// const COLORS = {
//   primary:        '#4F46E5',
//   primaryLight:   '#EEF2FF',
//   secondary:      '#06B6D4',
//   secondaryLight: '#ECFEFF',
//   success:        '#10B981',
//   successLight:   '#D1FAE5',
//   danger:         '#EF4444',
//   dangerLight:    '#FEF2F2',
//   warning:        '#F59E0B',
//   warningLight:   '#FEF3C7',
//   background:     '#F8F9FE',
//   card:           '#FFFFFF',
//   text:           '#1E1B4B',
//   textSecondary:  '#6B7280',
//   textLight:      '#9CA3AF',
//   border:         '#E5E7EB',
//   shadow:         '#1E1B4B',
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const getTodayString = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// const formatDisplayDate = () =>
//   new Date().toLocaleDateString('en-IN', {
//     weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
//   });

// const getInitials = (name = '') =>
//   name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || '?';

// const AVATAR_COLORS = [
//   { bg: '#EEF2FF', text: '#4F46E5' },
//   { bg: '#ECFEFF', text: '#06B6D4' },
//   { bg: '#D1FAE5', text: '#10B981' },
//   { bg: '#FEF3C7', text: '#F59E0B' },
//   { bg: '#FCE7F3', text: '#EC4899' },
//   { bg: '#FEE2E2', text: '#EF4444' },
// ];

// // ─── STEP 1: Class+Subject Selector ──────────────────────────────────────────
// /**
//  * Shows list of class_subjects assigned to teacher.
//  * Teacher taps one → moves to attendance marking.
//  */
// const ClassSubjectSelector = ({ assignments, onSelect }) => (
//   <View style={styles.selectorWrapper}>
//     <Text style={styles.selectorTitle}>Select Class & Subject</Text>
//     <Text style={styles.selectorSubtitle}>
//       Tap a class to start marking attendance
//     </Text>

//     {assignments.map((item, index) => (
//       <TouchableOpacity
//         key={item.id}
//         style={styles.assignmentCard}
//         onPress={() => onSelect(item)}
//         activeOpacity={0.82}
//       >
//         {/* Left accent */}
//         <View style={[
//           styles.assignmentAccent,
//           { backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.secondary },
//         ]} />

//         <View style={styles.assignmentInfo}>
//           <Text style={styles.assignmentClass}>{item.className}</Text>
//           <Text style={styles.assignmentSubject}>📖  {item.subjectName}</Text>
//         </View>

//         <View style={styles.assignmentArrow}>
//           <Text style={styles.assignmentArrowText}>→</Text>
//         </View>
//       </TouchableOpacity>
//     ))}
//   </View>
// );

// // ─── Summary Bar ──────────────────────────────────────────────────────────────
// const SummaryBar = ({ total, present, absent, unmarked }) => (
//   <View style={styles.summaryBar}>
//     <View style={styles.summaryItem}>
//       <Text style={[styles.summaryVal, { color: COLORS.success }]}>{present}</Text>
//       <Text style={styles.summaryLbl}>Present</Text>
//     </View>
//     <View style={styles.summaryDivider} />
//     <View style={styles.summaryItem}>
//       <Text style={[styles.summaryVal, { color: COLORS.danger }]}>{absent}</Text>
//       <Text style={styles.summaryLbl}>Absent</Text>
//     </View>
//     <View style={styles.summaryDivider} />
//     <View style={styles.summaryItem}>
//       <Text style={[styles.summaryVal, { color: COLORS.warning }]}>{unmarked}</Text>
//       <Text style={styles.summaryLbl}>Unmarked</Text>
//     </View>
//     <View style={styles.summaryDivider} />
//     <View style={styles.summaryItem}>
//       <Text style={[styles.summaryVal, { color: COLORS.text }]}>{total}</Text>
//       <Text style={styles.summaryLbl}>Total</Text>
//     </View>
//   </View>
// );

// // ─── Student Row ──────────────────────────────────────────────────────────────
// /**
//  * Tapping the row toggles: unmarked → present → absent → unmarked
//  * Visual feedback changes instantly.
//  */
// const StudentRow = ({ student, index, status, onToggle }) => {
//   const isPresent = status === 'present';
//   const isAbsent  = status === 'absent';
//   const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

//   return (
//     <TouchableOpacity
//       style={[
//         styles.studentRow,
//         isPresent && styles.studentRowPresent,
//         isAbsent  && styles.studentRowAbsent,
//       ]}
//       onPress={() => onToggle(student.id)}
//       activeOpacity={0.82}
//     >
//       {/* Avatar */}
//       <View style={[
//         styles.studentAvatar,
//         { backgroundColor: avatarColor.bg },
//         isPresent && { backgroundColor: COLORS.successLight },
//         isAbsent  && { backgroundColor: COLORS.dangerLight },
//       ]}>
//         <Text style={[
//           styles.studentAvatarText,
//           { color: avatarColor.text },
//           isPresent && { color: COLORS.success },
//           isAbsent  && { color: COLORS.danger },
//         ]}>
//           {getInitials(student.name)}
//         </Text>
//       </View>

//       {/* Name */}
//       <View style={styles.studentMeta}>
//         <Text style={styles.studentName}>{student.name ?? 'Unknown'}</Text>
//         <Text style={styles.studentHint}>
//           {isPresent ? 'Tap to mark Absent' : isAbsent ? 'Tap to clear' : 'Tap to mark Present'}
//         </Text>
//       </View>

//       {/* Status Badge — updates immediately on tap */}
//       <View style={[
//         styles.statusBadge,
//         isPresent && styles.statusBadgePresent,
//         isAbsent  && styles.statusBadgeAbsent,
//         !isPresent && !isAbsent && styles.statusBadgeUnmarked,
//       ]}>
//         {isPresent ? (
//           <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>✓ Present</Text>
//         ) : isAbsent ? (
//           <Text style={[styles.statusBadgeText, { color: COLORS.danger }]}>✗ Absent</Text>
//         ) : (
//           <Text style={[styles.statusBadgeText, { color: COLORS.textLight }]}>— Mark</Text>
//         )}
//       </View>
//     </TouchableOpacity>
//   );
// };

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// const AttendanceScreen = ({ navigation, route }) => {
//   // Optional: if navigated directly from ClassesScreen with params
//   const routeParams = route?.params ?? {};

//   const [teacherId,    setTeacherId]    = useState('');
//   const [assignments,  setAssignments]  = useState([]); // class_subjects rows
//   const [selected,     setSelected]     = useState(    // currently selected assignment
//     routeParams.classId ? {
//       classId:     routeParams.classId,
//       className:   routeParams.className   ?? '',
//       subjectId:   routeParams.subjectId   ?? '',
//       subjectName: routeParams.subjectName ?? '',
//     } : null
//   );
//   const [students,     setStudents]     = useState([]);
//   const [attendance,   setAttendance]   = useState({}); // { uid: 'present' | 'absent' }
//   const [loadingAssign, setLoadingAssign] = useState(true);
//   const [loadingStudents, setLoadingStudents] = useState(false);
//   const [saving,       setSaving]       = useState(false);
//   const [savedDocId,   setSavedDocId]   = useState(null); // existing attendance doc for today

//   // ─────────────────────────────────────────────────────────────────────────
//   // Step 1 — Get teacher UID + fetch all class_subjects for this teacher
//   // ─────────────────────────────────────────────────────────────────────────
//   const fetchAssignments = useCallback(async () => {
//     try {
//       const uid = auth.currentUser?.uid;
//       if (!uid) return;
//       setTeacherId(uid);

//       const snap = await getDocs(
//         query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
//       );
//       const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       setAssignments(rows);

//       // If navigated with params, skip selector
//       if (routeParams.classId) {
//         loadStudents(routeParams.classId, {
//           classId:     routeParams.classId,
//           className:   routeParams.className   ?? '',
//           subjectId:   routeParams.subjectId   ?? '',
//           subjectName: routeParams.subjectName ?? '',
//         }, uid);
//       }
//     } catch (err) {
//       console.error('fetchAssignments error:', err);
//     } finally {
//       setLoadingAssign(false);
//     }
//   }, []);

//   useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

//   // ─────────────────────────────────────────────────────────────────────────
//   // Step 2+3+4 — When teacher selects a class:
//   //   classes/{classId} → students[] → users collection → names
//   // ─────────────────────────────────────────────────────────────────────────
//   const loadStudents = async (classId, assignment, uid) => {
//     setLoadingStudents(true);
//     setStudents([]);
//     setAttendance({});
//     setSavedDocId(null);

//     try {
//       // Step 2: get students array from classes doc
//       const classSnap = await getDoc(doc(db, 'classes', classId));
//       if (!classSnap.exists()) { setLoadingStudents(false); return; }

//       const studentIds = classSnap.data().students ?? [];
//       if (studentIds.length === 0) { setStudents([]); setLoadingStudents(false); return; }

//       // Step 3+4: fetch student docs from users collection
//       const studentList = [];
//       await Promise.all(
//         studentIds.map(async (id) => {
//           try {
//             const snap = await getDoc(doc(db, 'users', id));
//             if (snap.exists()) studentList.push({ id: snap.id, ...snap.data() });
//           } catch { /* skip missing users */ }
//         })
//       );

//       // Preserve original order
//       const ordered = studentIds
//         .map((id) => studentList.find((s) => s.id === id))
//         .filter(Boolean);

//       setStudents(ordered);

//       // Step 5: check if attendance already saved today for this class+subject
//       const today = getTodayString();
//       const existSnap = await getDocs(
//         query(
//           collection(db, 'attendance'),
//           where('classId',   '==', classId),
//           where('subjectId', '==', assignment.subjectId),
//           where('date',      '==', today),
//         )
//       );

//       if (!existSnap.empty) {
//         const existDoc  = existSnap.docs[0];
//         const existData = existDoc.data();
//         setSavedDocId(existDoc.id);

//         // Pre-fill attendance state from existing records
//         const prefilled = {};
//         (existData.records ?? []).forEach((r) => {
//           prefilled[r.studentId] = r.status;
//         });
//         setAttendance(prefilled);
//       }
//     } catch (err) {
//       console.error('loadStudents error:', err);
//     } finally {
//       setLoadingStudents(false);
//     }
//   };

//   // Handle assignment selection from selector
//   const handleSelectAssignment = (item) => {
//     setSelected(item);
//     loadStudents(item.classId, item, teacherId || auth.currentUser?.uid);
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // Toggle: unmarked → present → absent → unmarked (cycles on each tap)
//   // Data changes INSTANTLY in state — no delay
//   // ─────────────────────────────────────────────────────────────────────────
//   const toggleAttendance = (studentId) => {
//     setAttendance((prev) => {
//       const current = prev[studentId];
//       if (!current)           return { ...prev, [studentId]: 'present' };
//       if (current === 'present') return { ...prev, [studentId]: 'absent'  };
//       // current === 'absent' → clear
//       const updated = { ...prev };
//       delete updated[studentId];
//       return updated;
//     });
//   };

//   // Mark all present shortcut
//   const markAllPresent = () => {
//     const all = {};
//     students.forEach((s) => { all[s.id] = 'present'; });
//     setAttendance(all);
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // Save attendance to Firebase
//   // If record exists today → updateDoc, else → addDoc
//   // ─────────────────────────────────────────────────────────────────────────
//   const handleSave = async () => {
//     const unmarked = students.filter((s) => !attendance[s.id]);
//     if (unmarked.length > 0) {
//       Alert.alert(
//         'Incomplete',
//         `${unmarked.length} student(s) not marked. Please mark all students.`,
//         [{ text: 'OK' }]
//       );
//       return;
//     }

//     setSaving(true);
//     try {
//       const today   = getTodayString();
//       const uid     = teacherId || auth.currentUser?.uid;
//       const records = students.map((s) => ({
//         studentId: s.id,
//         name:      s.name ?? '',
//         status:    attendance[s.id],
//       }));

//       const payload = {
//         classId:     selected.classId,
//         className:   selected.className,
//         subjectId:   selected.subjectId,
//         subjectName: selected.subjectName,
//         teacherId:   uid,
//         date:        today,          // "YYYY-MM-DD" — easy to query in reports
//         savedAt:     Timestamp.now(),
//         records,
//       };

//       if (savedDocId) {
//         // Update existing record
//         await updateDoc(doc(db, 'attendance', savedDocId), payload);
//       } else {
//         // Create new record
//         const newDoc = await addDoc(collection(db, 'attendance'), payload);
//         setSavedDocId(newDoc.id);
//       }

//       Alert.alert(
//         '✅ Saved',
//         `Attendance for ${selected.className} - ${selected.subjectName} has been recorded.`,
//         [{ text: 'Done', onPress: () => navigation?.goBack() }]
//       );
//     } catch (err) {
//       console.error('saveAttendance error:', err);
//       Alert.alert('Error', 'Failed to save. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ─── Derived counts ──────────────────────────────────────────────────────
//   const presentCount  = Object.values(attendance).filter((s) => s === 'present').length;
//   const absentCount   = Object.values(attendance).filter((s) => s === 'absent').length;
//   const unmarkedCount = students.length - presentCount - absentCount;
//   const allMarked     = students.length > 0 && unmarkedCount === 0;
//   const markedCount   = presentCount + absentCount;

//   // ─── Render ───────────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

//       {/* ══════════════════════════════
//           HEADER
//       ══════════════════════════════ */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <TouchableOpacity
//             style={styles.backBtn}
//             onPress={() => {
//               if (selected && !routeParams.classId) {
//                 setSelected(null); setStudents([]); setAttendance({});
//               } else {
//                 navigation?.goBack();
//               }
//             }}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.backBtnIcon}>←</Text>
//           </TouchableOpacity>

//           <View style={styles.headerTextGroup}>
//             <Text style={styles.headerTitle}>
//               {selected ? 'Mark Attendance' : 'Attendance'}
//             </Text>
//             <Text style={styles.headerSubtitle} numberOfLines={1}>
//               {selected
//                 ? `${selected.className}  ·  ${selected.subjectName}`
//                 : 'Select a class to begin'}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.dateChip}>
//           <Text style={styles.dateChipText}>📅  {formatDisplayDate()}</Text>
//         </View>

//         {savedDocId && (
//           <View style={styles.savedBanner}>
//             <Text style={styles.savedBannerText}>
//               🔄 Attendance already saved today — editing will update it
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* ══════════════════════════════
//           BODY
//       ══════════════════════════════ */}

//       {/* ── Loading assignments ── */}
//       {loadingAssign ? (
//         <View style={styles.centerLoader}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.centerLoaderText}>Loading classes…</Text>
//         </View>

//       /* ── Step 1: No class selected → show selector ── */
//       ) : !selected ? (
//         <ScrollView
//           contentContainerStyle={styles.selectorScroll}
//           showsVerticalScrollIndicator={false}
//         >
//           {assignments.length === 0 ? (
//             <View style={styles.emptyCard}>
//               <Text style={styles.emptyIcon}>📋</Text>
//               <Text style={styles.emptyTitle}>No Classes Assigned</Text>
//               <Text style={styles.emptySubText}>
//                 Ask your admin to assign classes to your account.
//               </Text>
//             </View>
//           ) : (
//             <ClassSubjectSelector
//               assignments={assignments}
//               onSelect={handleSelectAssignment}
//             />
//           )}
//         </ScrollView>

//       /* ── Step 2: Loading students ── */
//       ) : loadingStudents ? (
//         <View style={styles.centerLoader}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.centerLoaderText}>Fetching students…</Text>
//         </View>

//       /* ── Step 3: Show student list ── */
//       ) : (
//         <FlatList
//           data={students}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}

//           ListHeaderComponent={
//             <>
//               {/* Summary bar */}
//               <SummaryBar
//                 total={students.length}
//                 present={presentCount}
//                 absent={absentCount}
//                 unmarked={unmarkedCount}
//               />

//               {/* Mark All Present shortcut */}
//               <TouchableOpacity
//                 style={styles.markAllBtn}
//                 onPress={markAllPresent}
//                 activeOpacity={0.78}
//               >
//                 <Text style={styles.markAllBtnText}>✓  Mark All Present</Text>
//               </TouchableOpacity>

//               {/* Section label */}
//               <Text style={styles.listSectionLabel}>
//                 STUDENTS  ·  {students.length}
//               </Text>
//             </>
//           }

//           ListEmptyComponent={
//             <View style={styles.emptyCard}>
//               <Text style={styles.emptyIcon}>👥</Text>
//               <Text style={styles.emptyTitle}>No Students Found</Text>
//               <Text style={styles.emptySubText}>No students enrolled in this class yet.</Text>
//             </View>
//           }

//           renderItem={({ item, index }) => (
//             <StudentRow
//               student={item}
//               index={index}
//               status={attendance[item.id]}
//               onToggle={toggleAttendance}   // instant state update on tap
//             />
//           )}

//           ListFooterComponent={
//             students.length > 0 ? (
//               <View style={styles.footer}>
//                 {/* Progress bar */}
//                 <View style={styles.progressRow}>
//                   <Text style={styles.progressText}>
//                     {markedCount} / {students.length} marked
//                   </Text>
//                   <View style={styles.progressBg}>
//                     <View style={[
//                       styles.progressFill,
//                       {
//                         width: `${students.length > 0 ? (markedCount / students.length) * 100 : 0}%`,
//                         backgroundColor: allMarked ? COLORS.success : COLORS.primary,
//                       },
//                     ]} />
//                   </View>
//                 </View>

//                 {/* Save button */}
//                 <TouchableOpacity
//                   style={[styles.saveBtn, (!allMarked || saving) && styles.saveBtnDisabled]}
//                   onPress={handleSave}
//                   activeOpacity={0.82}
//                   disabled={!allMarked || saving}
//                 >
//                   {saving ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <Text style={styles.saveBtnText}>
//                       {savedDocId ? '🔄  Update Attendance' : '💾  Save Attendance'}
//                     </Text>
//                   )}
//                 </TouchableOpacity>

//                 <View style={{ height: 32 }} />
//               </View>
//             ) : null
//           }
//         />
//       )}
//     </View>
//   );
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },

//   // ── Header ──────────────────────────────────────────────────────────────────
//   header: {
//     backgroundColor:         COLORS.primary,
//     paddingTop:              52,
//     paddingHorizontal:       20,
//     paddingBottom:           24,
//     borderBottomLeftRadius:  28,
//     borderBottomRightRadius: 28,
//   },
//   headerTop: {
//     flexDirection: 'row',
//     alignItems:    'center',
//     gap:           14,
//     marginBottom:  14,
//   },
//   backBtn: {
//     width:           38,
//     height:          38,
//     borderRadius:    19,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems:      'center',
//     justifyContent:  'center',
//     borderWidth:     1.5,
//     borderColor:     'rgba(255,255,255,0.35)',
//   },
//   backBtnIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 },
//   headerTextGroup: { flex: 1 },
//   headerTitle:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
//   headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '500' },
//   dateChip: {
//     backgroundColor:   'rgba(255,255,255,0.15)',
//     borderRadius:      20,
//     paddingVertical:   6,
//     paddingHorizontal: 14,
//     alignSelf:         'flex-start',
//   },
//   dateChipText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
//   savedBanner: {
//     marginTop:         10,
//     backgroundColor:   'rgba(16,185,129,0.22)',
//     borderRadius:      10,
//     paddingVertical:   7,
//     paddingHorizontal: 14,
//     alignSelf:         'flex-start',
//   },
//   savedBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

//   // ── Center loader ─────────────────────────────────────────────────────────────
//   centerLoader: {
//     flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
//   },
//   centerLoaderText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

//   // ── Selector ─────────────────────────────────────────────────────────────────
//   selectorScroll:  { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 32 },
//   selectorWrapper: {},
//   selectorTitle: {
//     fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6,
//   },
//   selectorSubtitle: {
//     fontSize: 13, color: COLORS.textSecondary, marginBottom: 20,
//   },
//   assignmentCard: {
//     backgroundColor: COLORS.card,
//     borderRadius:    16,
//     marginBottom:    12,
//     flexDirection:   'row',
//     alignItems:      'center',
//     overflow:        'hidden',
//     shadowColor:     COLORS.shadow,
//     shadowOffset:    { width: 0, height: 3 },
//     shadowOpacity:   0.07,
//     shadowRadius:    10,
//     elevation:       4,
//   },
//   assignmentAccent: { width: 5, alignSelf: 'stretch' },
//   assignmentInfo:   { flex: 1, padding: 16 },
//   assignmentClass: {
//     fontSize: 16, fontWeight: '700', color: COLORS.text,
//   },
//   assignmentSubject: {
//     fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 3,
//   },
//   assignmentArrow: {
//     paddingHorizontal: 16,
//     alignItems:        'center',
//     justifyContent:    'center',
//   },
//   assignmentArrowText: {
//     fontSize: 20, color: COLORS.primary, fontWeight: '700',
//   },

//   // ── FlatList ──────────────────────────────────────────────────────────────────
//   listContent: { paddingHorizontal: 18, paddingTop: 22 },

//   // ── Summary bar ───────────────────────────────────────────────────────────────
//   summaryBar: {
//     backgroundColor: COLORS.card,
//     borderRadius:    18,
//     flexDirection:   'row',
//     alignItems:      'center',
//     justifyContent:  'space-around',
//     paddingVertical: 16,
//     marginBottom:    14,
//     shadowColor:     COLORS.shadow,
//     shadowOffset:    { width: 0, height: 3 },
//     shadowOpacity:   0.07,
//     shadowRadius:    10,
//     elevation:       4,
//   },
//   summaryItem:   { alignItems: 'center', flex: 1 },
//   summaryVal:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
//   summaryLbl:    { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
//   summaryDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

//   // ── Mark All button ───────────────────────────────────────────────────────────
//   markAllBtn: {
//     backgroundColor: COLORS.successLight,
//     borderRadius:    12,
//     paddingVertical: 11,
//     alignItems:      'center',
//     marginBottom:    18,
//     borderWidth:     1,
//     borderColor:     COLORS.success,
//   },
//   markAllBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.success },

//   listSectionLabel: {
//     fontSize:      12,
//     fontWeight:    '700',
//     color:         COLORS.textLight,
//     letterSpacing: 0.8,
//     textTransform: 'uppercase',
//     marginBottom:  10,
//   },

//   // ── Student Row ───────────────────────────────────────────────────────────────
//   studentRow: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     backgroundColor:   COLORS.card,
//     borderRadius:      14,
//     marginBottom:      10,
//     padding:           14,
//     gap:               12,
//     shadowColor:       COLORS.shadow,
//     shadowOffset:      { width: 0, height: 2 },
//     shadowOpacity:     0.05,
//     shadowRadius:      6,
//     elevation:         2,
//     borderWidth:       1.5,
//     borderColor:       'transparent',
//   },
//   studentRowPresent: {
//     borderColor:     COLORS.success,
//     backgroundColor: '#F0FDF4',
//   },
//   studentRowAbsent: {
//     borderColor:     COLORS.danger,
//     backgroundColor: '#FFF5F5',
//   },
//   studentAvatar: {
//     width:          44,
//     height:         44,
//     borderRadius:   22,
//     alignItems:     'center',
//     justifyContent: 'center',
//   },
//   studentAvatarText: { fontSize: 15, fontWeight: '700' },
//   studentMeta: { flex: 1 },
//   studentName:  { fontSize: 15, fontWeight: '600', color: COLORS.text },
//   studentHint:  { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

//   // Status badge — changes live on tap
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical:   5,
//     borderRadius:      8,
//     borderWidth:       1.5,
//   },
//   statusBadgePresent:  { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
//   statusBadgeAbsent:   { backgroundColor: COLORS.dangerLight,  borderColor: COLORS.danger  },
//   statusBadgeUnmarked: { backgroundColor: COLORS.background,   borderColor: COLORS.border  },
//   statusBadgeText: { fontSize: 12, fontWeight: '700' },

//   // ── Footer ────────────────────────────────────────────────────────────────────
//   footer: { marginTop: 8 },
//   progressRow: { gap: 8, marginBottom: 14 },
//   progressText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
//   progressBg: {
//     height: 6, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden',
//   },
//   progressFill: { height: 6, borderRadius: 4 },
//   saveBtn: {
//     backgroundColor: COLORS.primary,
//     borderRadius:    16,
//     paddingVertical: 16,
//     alignItems:      'center',
//     shadowColor:     COLORS.primary,
//     shadowOffset:    { width: 0, height: 4 },
//     shadowOpacity:   0.3,
//     shadowRadius:    10,
//     elevation:       6,
//   },
//   saveBtnDisabled: {
//     backgroundColor: COLORS.border, shadowOpacity: 0, elevation: 0,
//   },
//   saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

//   // ── Empty ─────────────────────────────────────────────────────────────────────
//   emptyCard: {
//     backgroundColor: COLORS.card,
//     borderRadius:    18,
//     padding:         36,
//     alignItems:      'center',
//     marginTop:       24,
//     borderWidth:     1.5,
//     borderStyle:     'dashed',
//     borderColor:     COLORS.border,
//   },
//   emptyIcon:    { fontSize: 40, marginBottom: 12 },
//   emptyTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
//   emptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
// });

// export default AttendanceScreen;







// src/screens/teacher/AttendanceScreen.js
//
// ─── WHAT THIS FILE DOES ───────────────────────────────────────────────────
// Teacher selects a class+subject → sees student list → marks present/absent
// → submits. Works FULLY OFFLINE. Syncs to Firestore when internet returns.
//
// ─── FLOW ──────────────────────────────────────────────────────────────────
// 1. Screen loads → fetch teacher's assignments from class_subjects
// 2. Teacher picks a class+subject from dropdown
// 3. Students for that class loaded from classes/{classId}.students[]
//    → then their names fetched from users collection
// 4. Teacher taps each student to toggle present/absent (default = present)
// 5. Teacher hits Submit:
//    → saveAttendanceOffline() saves to SQLite
//    → if online: auto-syncs to Firestore immediately
//    → if offline: queued, syncs when internet comes back
// 6. Pending badge shows how many sessions are waiting to sync
// ───────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { auth, db } from '../../services/firebase/config';
import {
  initOfflineDB,
  saveAttendanceOffline,
  getPendingCount,
  syncPendingToFirestore,
  syncTeacherStructureToCache,
  getCachedAssignments,
  getCachedStudents,
  hasCachedStructure,
  getCacheTimestamp,
} from '../../services/offline/attendanceOffline';

const todayStr = () => new Date().toISOString().split('T')[0];
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function TeacherAttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignments, setAssignments] = useState([]); // class+subject combos
  const [selected, setSelected] = useState(null); // currently chosen assignment
  const [students, setStudents] = useState([]); // [{ uid, name }]
  const [attendance, setAttendance] = useState({}); // { uid: 'present'|'absent' }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ── Init SQLite + network listener ────────────────────────────────────────
  useEffect(() => {
    const setup = async () => {
      await initOfflineDB();
      const count = await getPendingCount();
      setPendingCount(count);
    };
    setup();

    // Watch network status
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    return () => unsub();
  }, []);

  // ── Fetch teacher assignments ─────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    try {
      setError('');
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }

      // Read current network state
      const netState = await NetInfo.fetch();
      const online = netState.isConnected && netState.isInternetReachable;

      if (online) {
        // ── ONLINE: fetch from Firebase, overwrite SQLite ─────────────────
        // WHY overwrite: admin may have changed classes/subjects since last login.
        // syncTeacherStructureToCache fetches EVERYTHING (assignments + students)
        // and saves it all to saapt_offline.db in one go.
        try {
          const list = await syncTeacherStructureToCache(uid);
          const ts = await getCacheTimestamp();
          setAssignments(list);
          setUsingCache(false);
          setLastSync(ts);
        } catch (firebaseErr) {
          // Firebase failed even though online (rare) — fall back to cache
          console.warn('Firebase failed, falling back to cache:', firebaseErr);
          await loadFromSQLite(uid);
        }
      } else {
        // ── OFFLINE: read from SQLite ─────────────────────────────────────
        // WHY: no internet, but SQLite was filled last time teacher was online.
        await loadFromSQLite(uid);
      }
    } catch (err) {
      setError('Something went wrong loading your classes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper — reads from SQLite, shows error if cache is empty
  const loadFromSQLite = async (uid) => {
    const hasData = await hasCachedStructure(uid);
    if (hasData) {
      const list = await getCachedAssignments(uid);
      const ts = await getCacheTimestamp();
      setAssignments(list);
      setUsingCache(true);
      setLastSync(ts);
    } else {
      // First ever login + no internet = nothing to show
      setAssignments([]);
      setError('No offline data yet. Open the app once with internet to cache your classes.');
      setUsingCache(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ── When teacher selects a class+subject → load students ─────────────────
  const selectAssignment = async (assignment) => {
    setSelected(assignment);
    setStudents([]);
    setAttendance({});
    setSubmitted(false);
    setLoadingStudents(true);

    try {
      // Read students from SQLite — works offline, no Firebase needed here.
      // WHY: students were cached into saapt_offline.db when app opened online.
      const studentList = await getCachedStudents(assignment.classId);

      if (studentList.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      const defaultAttendance = {};
      studentList.forEach(s => { defaultAttendance[s.uid] = 'present'; });

      setStudents(studentList);
      setAttendance(defaultAttendance);

    } catch (err) {
      setError('Could not load students from local storage.');
    } finally {
      setLoadingStudents(false);
    }
  };


  // ── Toggle a student's attendance ─────────────────────────────────────────
  const toggleStudent = (uid) => {
    setAttendance(prev => ({
      ...prev,
      [uid]: prev[uid] === 'present' ? 'absent' : 'present',
    }));
  };

  // ── Mark all present / all absent ────────────────────────────────────────
  const markAll = (status) => {
    const all = {};
    students.forEach(s => { all[s.uid] = status; });
    setAttendance(all);
  };

  // ── Submit attendance ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selected || students.length === 0) return;

    const presentCount = Object.values(attendance).filter(v => v === 'present').length;
    const absentCount = students.length - presentCount;

    Alert.alert(
      'Confirm Attendance',
      `${selected.subjectName} — ${selected.className}\n\n✓ Present: ${presentCount}\n✗ Absent: ${absentCount}\n\nDate: ${formatDate(todayStr())}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const records = students.map(s => ({
                studentId: s.uid,
                name: s.name,
                status: attendance[s.uid] ?? 'absent',
              }));

              const sessionData = {
                classId: selected.classId,
                className: selected.className,
                subjectId: selected.subjectId,
                subjectName: selected.subjectName,
                teacherId: auth.currentUser.uid,
                date: todayStr(),
                records,
              };

              // saveAttendanceOffline handles:
              // → SQLite save (always)
              // → Firestore sync (if online)
              // → Queue for later (if offline)
              await saveAttendanceOffline(sessionData);

              const pending = await getPendingCount();
              setPendingCount(pending);
              setSubmitted(true);

              Alert.alert(
                isOnline ? '✅ Saved & Synced' : '💾 Saved Offline',
                isOnline
                  ? 'Attendance saved and uploaded to cloud.'
                  : 'Attendance saved locally. Will upload when internet returns.'
              );

            } catch (err) {
              Alert.alert('Error', 'Failed to save attendance. Try again.');
              console.error('Submit error:', err);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // ── Manual sync button ────────────────────────────────────────────────────
  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('No Internet', 'Connect to internet first to sync.');
      return;
    }
    try {
      const result = await syncPendingToFirestore();
      const pending = await getPendingCount();
      setPendingCount(pending);
      Alert.alert('Sync Complete', `${result.synced} session(s) uploaded to cloud.`);
    } catch (err) {
      Alert.alert('Sync Failed', 'Try again.');
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = students.length - presentCount;

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={s.loadingTxt}>Loading assignments…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📝 Take Attendance</Text>
        <Text style={s.headerSub}>{formatDate(todayStr())}</Text>

        {/* Network + pending status */}
        <View style={s.statusRow}>
          <View style={[s.netPill, { backgroundColor: isOnline ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={[s.netTxt, { color: isOnline ? '#16A34A' : '#DC2626' }]}>
              {isOnline ? '🌐 Online' : '📴 Offline'}
            </Text>
          </View>
          {usingCache && lastSync && (
            <View style={s.cachePill}>
              <Text style={s.cacheTxt}>
                💾 Offline data · {new Date(lastSync).toLocaleDateString('en-IN')}
              </Text>
            </View>
          )}
          {pendingCount > 0 && (
            <TouchableOpacity
              style={s.syncPill}
              onPress={handleManualSync}
              activeOpacity={0.8}
            >
              <Text style={s.syncTxt}>⏳ {pendingCount} pending — Tap to sync</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.body}>

          {!!error && (
            <View style={s.errorCard}>
              <Text style={s.errorTxt}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Step 1: Select class+subject ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Step 1 — Select Subject & Class</Text>
            {assignments.length === 0 ? (
              <Text style={s.emptyTxt}>No subjects assigned. Contact admin.</Text>
            ) : (
              assignments.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    s.assignOption,
                    selected?.id === item.id && s.assignOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => selectAssignment(item)}
                >
                  <View style={s.assignOptionLeft}>
                    <Text style={[s.assignSubject, selected?.id === item.id && s.assignSubjectSelected]}>
                      {item.subjectName}
                    </Text>
                    <Text style={[s.assignClass, selected?.id === item.id && s.assignClassSelected]}>
                      🏫 {item.className}
                    </Text>
                  </View>
                  {selected?.id === item.id && (
                    <Text style={s.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── Step 2: Student list ── */}
          {selected && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Step 2 — Mark Attendance</Text>
              <Text style={s.cardSub}>{selected.subjectName} · {selected.className}</Text>

              {loadingStudents ? (
                <ActivityIndicator size="small" color="#1565C0" style={{ marginVertical: 20 }} />
              ) : students.length === 0 ? (
                <Text style={s.emptyTxt}>No students in this class yet.</Text>
              ) : (
                <>
                  {/* Mark all buttons */}
                  <View style={s.markAllRow}>
                    <TouchableOpacity style={s.markAllPresent} onPress={() => markAll('present')} activeOpacity={0.8}>
                      <Text style={s.markAllTxt}>✓ All Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.markAllAbsent} onPress={() => markAll('absent')} activeOpacity={0.8}>
                      <Text style={[s.markAllTxt, { color: '#DC2626' }]}>✗ All Absent</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Summary */}
                  <View style={s.summaryRow}>
                    <Text style={s.presentCount}>✓ {presentCount} present</Text>
                    <Text style={s.absentCount}>✗ {absentCount} absent</Text>
                  </View>

                  {/* Student rows */}
                  {students.map((student, i) => {
                    const isPresent = attendance[student.uid] === 'present';
                    return (
                      <TouchableOpacity
                        key={student.uid}
                        style={[
                          s.studentRow,
                          i > 0 && s.studentDivider,
                          isPresent ? s.studentPresent : s.studentAbsent,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => toggleStudent(student.uid)}
                      >
                        <View style={[s.studentStatusDot, { backgroundColor: isPresent ? '#16A34A' : '#DC2626' }]} />
                        <Text style={s.studentName}>{student.name}</Text>
                        <View style={[s.statusBadge, { backgroundColor: isPresent ? '#DCFCE7' : '#FEE2E2' }]}>
                          <Text style={[s.statusBadgeTxt, { color: isPresent ? '#16A34A' : '#DC2626' }]}>
                            {isPresent ? '✓ Present' : '✗ Absent'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          )}

          {/* ── Submit button ── */}
          {selected && students.length > 0 && !submitted && (
            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnTxt}>
                  {isOnline ? '✅ Submit & Upload' : '💾 Save Offline'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* ── Submitted confirmation ── */}
          {submitted && (
            <View style={s.successCard}>
              <Text style={s.successIcon}>{isOnline ? '✅' : '💾'}</Text>
              <Text style={s.successTitle}>
                {isOnline ? 'Attendance Submitted!' : 'Saved Offline!'}
              </Text>
              <Text style={s.successSub}>
                {isOnline
                  ? 'Data has been saved to cloud.'
                  : 'Will sync when internet returns.'}
              </Text>
              <TouchableOpacity
                style={s.newSessionBtn}
                onPress={() => { setSelected(null); setStudents([]); setAttendance({}); setSubmitted(false); }}
              >
                <Text style={s.newSessionTxt}>Take Another Session</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: '#1565C0' },

  header: { backgroundColor: '#1565C0', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  netPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  netTxt: { fontSize: 12, fontWeight: '700' },
  syncPill:    { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  syncTxt:     { fontSize: 12, fontWeight: '700', color: '#D97706' },
  cachePill:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  cacheTxt:    { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0A1F44', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#9AA5B1', marginBottom: 12 },
  emptyTxt: { fontSize: 13, color: '#9AA5B1', textAlign: 'center', paddingVertical: 16 },

  // Assignment options
  assignOption: { borderWidth: 1.5, borderColor: '#DCE3EA', borderRadius: 12, padding: 12, marginBottom: 8 },
  assignOptionSelected: { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
  assignOptionLeft: { flex: 1 },
  assignSubject: { fontSize: 14, fontWeight: '700', color: '#0A1F44' },
  assignSubjectSelected: { color: '#1565C0' },
  assignClass: { fontSize: 12, color: '#5F6C7B', marginTop: 2 },
  assignClassSelected: { color: '#1565C0' },
  checkmark: { fontSize: 18, color: '#1565C0', fontWeight: '900' },

  // Mark all
  markAllRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  markAllPresent: { flex: 1, backgroundColor: '#DCFCE7', borderRadius: 10, padding: 10, alignItems: 'center' },
  markAllAbsent: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, alignItems: 'center' },
  markAllTxt: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  presentCount: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  absentCount: { fontSize: 14, fontWeight: '700', color: '#DC2626' },

  // Student rows
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8 },
  studentPresent: { backgroundColor: 'transparent' },
  studentAbsent: { backgroundColor: '#FFF5F5' },
  studentDivider: { borderTopWidth: 1, borderTopColor: '#F4F7FB' },
  studentStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  studentName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0A1F44' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeTxt: { fontSize: 12, fontWeight: '700' },

  // Submit
  submitBtn: { backgroundColor: '#1565C0', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 14, elevation: 5, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnDisabled: { backgroundColor: '#9AA5B1' },
  submitBtnTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },

  // Success
  successCard: { backgroundColor: '#DCFCE7', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#16A34A' },
  successIcon: { fontSize: 40, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
  successSub: { fontSize: 13, color: '#166534', textAlign: 'center', marginBottom: 16 },
  newSessionBtn: { backgroundColor: '#16A34A', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  newSessionTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  errorCard: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DC2626' },
  errorTxt: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});