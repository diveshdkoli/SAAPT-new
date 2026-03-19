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
  const [students,    setStudents]    = useState([]); // currently shown (filtered for practical)
  const [allStudents, setAllStudents] = useState([]); // full unfiltered list for this class
  // WHY two lists:
  // allStudents = complete class list, fetched once, never changes
  // students = what's shown in the table — all for lecture, batch-filtered for practical
  // when teacher switches batch, we filter allStudents → set students
  // when teacher switches to lecture, we restore allStudents → set students
  const [attendance, setAttendance] = useState({}); // { uid: 'present'|'absent' }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [sessionType,   setSessionType]   = useState('lecture');
  const [selectedBatch, setSelectedBatch] = useState('');
  // '' = no batch selected yet (shown when practical is chosen)
  // 'A', 'B', 'C' = batch selected → filter students by this
  const [usingCache, setUsingCache] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [view, setView] = useState('subjects');
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
    setView('marking');
    // switch to full-screen marking view immediately
    // loading spinner will show while students are being fetched

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

      // Sort by roll number numerically
      // WHY: teachers expect students in register order, not random order
      const sorted = [...studentList].sort((a, b) => {
        const numA = parseInt((a.roll_number ?? '').replace(/\D/g, '') || '0');
        const numB = parseInt((b.roll_number ?? '').replace(/\D/g, '') || '0');
        return numA - numB;
      });

      setStudents(sorted);
      setAllStudents(sorted);
      setAttendance(defaultAttendance);

    } catch (err) {
      setError('Could not load students from local storage.');
    } finally {
      setLoadingStudents(false);
    }
  };


  // ── Go back to subject list ───────────────────────────────────────────────
  // called by back button in marking view header
  const goBackToSubjects = () => {
    setView('subjects');
    setSelected(null);
    setStudents([]);
    setAttendance({});
    setSubmitted(false);
    setSessionType('lecture');
    setSelectedBatch('');
    setAllStudents([]);
    // WHY clear allStudents: fresh load when next subject selected
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
      `${selected.subjectName} — ${selected.className}` +
      (sessionType === 'practical' ? ` (Batch ${selectedBatch})` : '') +
      `\n\n✓ Present: ${presentCount}\n✗ Absent: ${absentCount}\n\nDate: ${formatDate(todayStr())}`,
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
                classId:     selected.classId,
                className:   selected.className,
                subjectId:   selected.subjectId,
                subjectName: selected.subjectName,
                teacherId:   auth.currentUser.uid,
                date:        todayStr(),
                sessionType: sessionType,
                batch:       sessionType === 'practical' ? selectedBatch : '',
                // WHY conditional: lecture sessions have no batch (empty string)
                // practical sessions carry the selected batch 'A', 'B', or 'C'
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

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1 — SUBJECT LIST
  // shown when view === 'subjects'
  // teacher sees all their assigned subjects as tappable cards
  // tapping one calls selectAssignment() which switches to view === 'marking'
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'subjects') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>📝 Take Attendance</Text>
          <Text style={s.headerSub}>{formatDate(todayStr())}</Text>

          {/* Network pill + pending sync badge */}
          <View style={s.statusRow}>
            <View style={[s.netPill, { backgroundColor: isOnline ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[s.netTxt, { color: isOnline ? '#16A34A' : '#DC2626' }]}>
                {isOnline ? '🌐 Online' : '📴 Offline'}
              </Text>
            </View>
            {usingCache && lastSync && (
              <View style={s.cachePill}>
                <Text style={s.cacheTxt}>
                  💾 Cached · {new Date(lastSync).toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
            {pendingCount > 0 && (
              <TouchableOpacity style={s.syncPill} onPress={handleManualSync} activeOpacity={0.8}>
                <Text style={s.syncTxt}>⏳ {pendingCount} pending — Tap to sync</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.body}>

            {/* Error message if any */}
            {!!error && (
              <View style={s.errorCard}>
                <Text style={s.errorTxt}>⚠️ {error}</Text>
              </View>
            )}

            {/* Section label */}
            <Text style={s.sectionLabel}>SELECT SUBJECT</Text>
            <Text style={s.sectionSub}>Tap a subject to begin marking attendance</Text>

            {assignments.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyStateIcon}>📋</Text>
                <Text style={s.emptyStateTitle}>No Subjects Assigned</Text>
                <Text style={s.emptyStateSub}>Contact your admin to assign subjects.</Text>
              </View>
            ) : (
              assignments.map((item, index) => (
                // each subject is a full-width tappable card
                // index % 2 gives alternating accent colors (blue / cyan)
                <TouchableOpacity
                  key={item.id}
                  style={s.subjectCard}
                  onPress={() => selectAssignment(item)}
                  activeOpacity={0.82}
                >
                  {/* Left colored accent bar — alternates between primary and secondary */}
                  <View style={[
                    s.subjectAccent,
                    { backgroundColor: index % 2 === 0 ? '#1565C0' : '#06B6D4' }
                  ]} />

                  <View style={s.subjectCardBody}>
                    {/* Subject name — large and bold */}
                    <Text style={s.subjectCardName}>{item.subjectName}</Text>
                    {/* Class name below */}
                    <Text style={s.subjectCardClass}>🏫  {item.className}</Text>
                  </View>

                  {/* Right arrow indicating this is tappable */}
                  <Text style={s.subjectCardArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2 — MARKING SCREEN
  // shown when view === 'marking' after teacher taps a subject
  // full screen replacement — subject list is gone
  // back button in header calls goBackToSubjects()
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* ── Marking Header — shows subject + class + back button ── */}
      <View style={s.markingHeader}>

        {/* Back button — tapping goes back to subject list */}
        <TouchableOpacity style={s.backBtn} onPress={goBackToSubjects} activeOpacity={0.8}>
          <Text style={s.backBtnTxt}>‹</Text>
          {/* ‹ is the left angle bracket character, looks like a back arrow */}
        </TouchableOpacity>

        <View style={s.markingHeaderText}>
          {/* Subject name in header */}
          <Text style={s.markingHeaderTitle} numberOfLines={1}>
            {selected?.subjectName}
          </Text>
          {/* Class name below subject */}
          <Text style={s.markingHeaderSub} numberOfLines={1}>
            {selected?.className}  ·  {todayStr()}
          </Text>
        </View>

        {/* Online/offline pill — compact version in header */}
        <View style={[s.netPillSmall, { backgroundColor: isOnline ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[s.netTxtSmall, { color: isOnline ? '#16A34A' : '#DC2626' }]}>
            {isOnline ? '🌐' : '📴'}
          </Text>
        </View>

      </View>

      {/* ── Loading students spinner ── */}
      {loadingStudents ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={s.loadingTxt}>Loading students…</Text>
        </View>

      ) : submitted ? (
        // ── Success screen after submit ──────────────────────────────────────
        // shown after successful submission
        // "Take Another Session" resets and goes back to subject list
        <View style={s.centeredFull}>
          <Text style={s.successBigIcon}>{isOnline ? '✅' : '💾'}</Text>
          <Text style={s.successBigTitle}>
            {isOnline ? 'Attendance Submitted!' : 'Saved Offline!'}
          </Text>
          <Text style={s.successBigSub}>
            {isOnline
              ? 'Attendance uploaded to cloud successfully.'
              : 'Saved locally. Will sync when internet returns.'}
          </Text>
          <TouchableOpacity
            style={s.anotherBtn}
            onPress={goBackToSubjects}
            // goes back to subject list so teacher can take another session
            activeOpacity={0.85}
          >
            <Text style={s.anotherBtnTxt}>← Back to Subjects</Text>
          </TouchableOpacity>
        </View>

      ) : students.length === 0 && !(sessionType === 'practical' && !selectedBatch) && allStudents.length === 0 ? (
        // ── Empty state — no students in class ──────────────────────────────
        // WHY the extra condition: when practical is selected but NO batch chosen yet,
        // students is intentionally empty (waiting for batch selection).
        // We only show "No Students Found" if allStudents is also empty,
        // meaning the class genuinely has no students.
        <View style={s.centeredFull}>
          <Text style={s.emptyStateIcon}>👥</Text>
          <Text style={s.emptyStateTitle}>No Students Found</Text>
          <Text style={s.emptyStateSub}>No students are enrolled in this class yet.</Text>
          <TouchableOpacity style={s.anotherBtn} onPress={goBackToSubjects} activeOpacity={0.85}>
            <Text style={s.anotherBtnTxt}>← Go Back</Text>
          </TouchableOpacity>
        </View>

      ) : (
        // ── Main marking UI ──────────────────────────────────────────────────
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.body}>

            {/* ── Summary bar — shows live present/absent count ── */}
            <View style={s.summaryBar}>
              <View style={s.summaryBarItem}>
                <Text style={[s.summaryBarVal, { color: '#16A34A' }]}>{presentCount}</Text>
                <Text style={s.summaryBarLbl}>Present</Text>
              </View>
              <View style={s.summaryBarDivider} />
              <View style={s.summaryBarItem}>
                <Text style={[s.summaryBarVal, { color: '#DC2626' }]}>{absentCount}</Text>
                <Text style={s.summaryBarLbl}>Absent</Text>
              </View>
              <View style={s.summaryBarDivider} />
              <View style={s.summaryBarItem}>
                <Text style={[s.summaryBarVal, { color: '#1565C0' }]}>{students.length}</Text>
                <Text style={s.summaryBarLbl}>Total</Text>
              </View>
            </View>

            {/* ── Mark All buttons ── */}
            <View style={s.markAllRow}>
              <TouchableOpacity
                style={s.markAllPresent}
                onPress={() => markAll('present')}
                activeOpacity={0.8}
              >
                <Text style={s.markAllTxt}>✓ All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.markAllAbsent}
                onPress={() => markAll('absent')}
                activeOpacity={0.8}
              >
                <Text style={[s.markAllTxt, { color: '#DC2626' }]}>✗ All Absent</Text>
              </TouchableOpacity>
            </View>

            {/* ── Session Type selector ── */}
            <View style={s.sessionTypeCard}>
              <Text style={s.sessionTypeLabel}>Session Type</Text>
              <View style={s.sessionTypeRow}>
                <TouchableOpacity
                  style={[s.sessionTypeBtn, sessionType === 'lecture' && s.sessionTypeBtnActive]}
                  onPress={() => {
                    setSessionType('lecture');
                    setSelectedBatch('');
                    setStudents(allStudents);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.sessionTypeBtnIcon}>📖</Text>
                  <Text style={[s.sessionTypeBtnTxt, sessionType === 'lecture' && s.sessionTypeBtnTxtActive]}>
                    Lecture
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.sessionTypeBtn, sessionType === 'practical' && s.sessionTypeBtnActivePractical]}
                  onPress={() => {
                    setSessionType('practical');
                    setSelectedBatch('');
                    setStudents([]);
                    setAttendance({});
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.sessionTypeBtnIcon}>🔬</Text>
                  <Text style={[s.sessionTypeBtnTxt, sessionType === 'practical' && s.sessionTypeBtnTxtActivePractical]}>
                    Practical
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Batch selector — only shown when Practical is selected ── */}
              {sessionType === 'practical' && (
                <View style={s.batchSection}>
                  <Text style={s.batchLabel}>Select Batch</Text>
                  <View style={s.batchRow}>
                    {['A', 'B', 'C'].map(batch => (
                      <TouchableOpacity
                        key={batch}
                        style={[s.batchBtn, selectedBatch === batch && s.batchBtnActive]}
                        onPress={() => {
                          setSelectedBatch(batch);
                          const filtered = allStudents
                            .filter(st => (st.batch ?? '').toUpperCase() === batch)
                            .sort((a, b) => {
                              const numA = parseInt((a.roll_number ?? '').replace(/\D/g, '') || '0');
                              const numB = parseInt((b.roll_number ?? '').replace(/\D/g, '') || '0');
                              return numA - numB;
                            });
                          setStudents(filtered);
                          const defaultAttendance = {};
                          filtered.forEach(s => { defaultAttendance[s.uid] = 'present'; });
                          setAttendance(defaultAttendance);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.batchBtnTxt, selectedBatch === batch && s.batchBtnTxtActive]}>
                          Batch {batch}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {!selectedBatch && (
                    <View style={s.batchHint}>
                      <Text style={s.batchHintTxt}>
                        👆 Select a batch to load students for that batch
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* ── Student Table ── */}
            <View style={s.studentTable}>

              {/* Table header row */}
              <View style={s.tableHeaderRow}>
                {/* Roll No column — narrow fixed width */}
                <Text style={[s.tableHeaderCell, { width: 52 }]}>Roll No</Text>
                {/* Name column — takes remaining space */}
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Student Name</Text>
                {/* Status column — fixed width */}
                <Text style={[s.tableHeaderCell, { width: 90, textAlign: 'center' }]}>Status</Text>
              </View>

              {/* One row per student */}
              {students.map((student, i) => {
                const isPresent = attendance[student.uid] === 'present';
                // isPresent = true if this student is marked present
                // false = absent

                return (
                  <TouchableOpacity
                    key={student.uid}
                    // key must be unique — uid is unique per student in Firestore
                    style={[
                      s.tableRow,
                      i % 2 === 0 ? s.tableRowEven : s.tableRowOdd,
                      // zebra striping — alternate row background colors
                      // even rows = white, odd rows = very light grey
                      isPresent ? s.tableRowPresent : s.tableRowAbsent,
                      // green tint if present, red tint if absent
                      // this overrides the zebra color when marked
                    ]}
                    onPress={() => toggleStudent(student.uid)}
                    // tap anywhere on the row to toggle present/absent
                    activeOpacity={0.75}
                  >
                    {/* Roll number cell — shows actual roll_number from Firestore */}
                    <View style={[s.rollCell, { width: 52 }]}>
                      <Text style={s.rollNumber} numberOfLines={1}>
                        {student.roll_number ?? '—'}
                      </Text>
                    </View>

                    {/* Student name cell */}
                    <View style={{ flex: 1 }}>
                      <Text style={s.studentNameCell} numberOfLines={1}>
                        {student.name}
                      </Text>
                    </View>

                    {/* Status badge cell */}
                    <View style={{ width: 90, alignItems: 'center' }}>
                      <View style={[
                        s.statusBadge,
                        { backgroundColor: isPresent ? '#DCFCE7' : '#FEE2E2' }
                      ]}>
                        <Text style={[
                          s.statusBadgeTxt,
                          { color: isPresent ? '#16A34A' : '#DC2626' }
                        ]}>
                          {isPresent ? '✓ Present' : '✗ Absent'}
                        </Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                );
              })}

            </View>
            {/* end studentTable */}

            {/* ── Submit button ── */}
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

            {/* pending sync badge at bottom */}
            {pendingCount > 0 && (
              <TouchableOpacity style={s.syncPill} onPress={handleManualSync} activeOpacity={0.8}>
                <Text style={s.syncTxt}>⏳ {pendingCount} pending — Tap to sync</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },

  // ── Shared ────────────────────────────────────────────────────────────────
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  centeredFull: {
    // used for success screen and empty state in marking view
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  loadingTxt: { fontSize: 14, color: '#1565C0' },

  // ── Subject list header ───────────────────────────────────────────────────
  header: {
    backgroundColor: '#1565C0',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },

  // ── Marking view header ───────────────────────────────────────────────────
  markingHeader: {
    backgroundColor: '#1565C0',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    // circular back button
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  backBtnTxt: {
    color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30,
    // ‹ character needs specific lineHeight to center properly
  },
  markingHeaderText: { flex: 1 },
  markingHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  markingHeaderSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  netPillSmall: {
    borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4,
  },
  netTxtSmall: { fontSize: 14 },

  // ── Status row (subject list header) ─────────────────────────────────────
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  netPill:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  netTxt:    { fontSize: 12, fontWeight: '700' },
  syncPill:  {
    backgroundColor: '#FEF3C7', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  syncTxt:   { fontSize: 12, fontWeight: '700', color: '#D97706' },
  cachePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  cacheTxt:  { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // ── Body padding ─────────────────────────────────────────────────────────
  body: { paddingHorizontal: 16, paddingTop: 16 },

  // ── Section label (above subject list) ───────────────────────────────────
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#9AA5B1',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13, color: '#5F6C7B', marginBottom: 16,
  },

  // ── Subject cards (View 1) ────────────────────────────────────────────────
  subjectCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    overflow: 'hidden',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  subjectAccent: {
    // left colored bar — 5px wide, full height of card
    width: 5, alignSelf: 'stretch',
  },
  subjectCardBody: { flex: 1, paddingVertical: 18, paddingHorizontal: 16 },
  subjectCardName: { fontSize: 16, fontWeight: '700', color: '#0A1F44' },
  subjectCardClass:{ fontSize: 13, color: '#5F6C7B', marginTop: 4 },
  subjectCardArrow:{ fontSize: 28, color: '#9AA5B1', paddingRight: 16 },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingVertical: 48,
  },
  emptyStateIcon:  { fontSize: 48, marginBottom: 12 },
  emptyStateTitle: { fontSize: 17, fontWeight: '700', color: '#0A1F44', marginBottom: 6 },
  emptyStateSub:   { fontSize: 13, color: '#9AA5B1', textAlign: 'center', lineHeight: 20 },

  // ── Summary bar (View 2) ─────────────────────────────────────────────────
  summaryBar: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', paddingVertical: 14,
    marginBottom: 12,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  summaryBarItem:    { alignItems: 'center', flex: 1 },
  summaryBarVal:     { fontSize: 24, fontWeight: '900' },
  summaryBarLbl:     { fontSize: 11, color: '#9AA5B1', fontWeight: '600', marginTop: 2 },
  summaryBarDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },

  // ── Mark All row ─────────────────────────────────────────────────────────
  markAllRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  markAllPresent: {
    flex: 1, backgroundColor: '#DCFCE7', borderRadius: 10,
    padding: 11, alignItems: 'center',
  },
  markAllAbsent: {
    flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10,
    padding: 11, alignItems: 'center',
  },
  markAllTxt: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  // ── Student Table ─────────────────────────────────────────────────────────
  studentTable: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    marginBottom: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  tableHeaderRow: {
    // dark blue header row — looks like a formal register
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 10, paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 11, fontWeight: '800', color: '#fff',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F4F7FB',
  },
  tableRowEven:    { backgroundColor: '#fff' },
  tableRowOdd:     { backgroundColor: '#FAFBFC' },
  // when marked, these override the zebra colors
  tableRowPresent: { backgroundColor: '#F0FDF4' }, // very light green
  tableRowAbsent:  { backgroundColor: '#FFF5F5' }, // very light red
  rollCell: {
    alignItems: 'center', justifyContent: 'center',
  },
  rollNumber: {
    fontSize: 13, fontWeight: '700', color: '#9AA5B1',
    // grey color because it's a temporary sequential number
  },
  studentNameCell: {
    fontSize: 14, fontWeight: '600', color: '#0A1F44',
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  statusBadgeTxt: { fontSize: 12, fontWeight: '700' },

  // ── Session type ──────────────────────────────────────────────────────────
  sessionTypeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 2,
  },
  sessionTypeLabel: { fontSize: 13, fontWeight: '700', color: '#0A1F44', marginBottom: 10 },
  sessionTypeRow:   { flexDirection: 'row', gap: 10 },
  sessionTypeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#DCE3EA',
    borderRadius: 12, paddingVertical: 12, backgroundColor: '#F9FAFB',
  },
  sessionTypeBtnActive:          { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
  sessionTypeBtnActivePractical: { borderColor: '#7C3AED', backgroundColor: '#F3E8FF' },
  sessionTypeBtnIcon: { fontSize: 18 },
  sessionTypeBtnTxt:  { fontSize: 14, fontWeight: '700', color: '#9AA5B1' },
  sessionTypeBtnTxtActive:          { color: '#1565C0' },
  sessionTypeBtnTxtActivePractical: { color: '#7C3AED' },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: '#1565C0', borderRadius: 16, padding: 18,
    alignItems: 'center', marginBottom: 14,
    elevation: 5, shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitBtnDisabled: { backgroundColor: '#9AA5B1', elevation: 0 },
  submitBtnTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },

  // ── Success screen ────────────────────────────────────────────────────────
  successBigIcon:  { fontSize: 64, marginBottom: 16 },
  successBigTitle: { fontSize: 22, fontWeight: '900', color: '#16A34A', textAlign: 'center' },
  successBigSub:   { fontSize: 14, color: '#166534', textAlign: 'center', lineHeight: 22 },
  anotherBtn: {
    marginTop: 8, backgroundColor: '#1565C0', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  anotherBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Batch selector ────────────────────────────────────────────────────────
  batchSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
  },
  batchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A1F44',
    marginBottom: 10,
  },
  batchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  batchBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCE3EA',
    backgroundColor: '#F9FAFB',
  },
  batchBtnActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
    // WHY purple: practical is already purple themed in this screen
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  batchBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9AA5B1',
  },
  batchBtnTxtActive: {
    color: '#7C3AED',
  },
  batchHint: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  batchHintTxt: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Error card ────────────────────────────────────────────────────────────
  errorCard: {
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#DC2626',
  },
  errorTxt: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});
//   centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
//   loadingTxt: { fontSize: 14, color: '#1565C0' },

//   header: { backgroundColor: '#1565C0', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
//   headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2 },
//   headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
//   statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
//   netPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
//   netTxt: { fontSize: 12, fontWeight: '700' },
//   syncPill:    { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
//   syncTxt:     { fontSize: 12, fontWeight: '700', color: '#D97706' },
//   cachePill:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
//   cacheTxt:    { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

//   body: { paddingHorizontal: 16, paddingTop: 16 },

//   card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
//   cardTitle: { fontSize: 15, fontWeight: '700', color: '#0A1F44', marginBottom: 4 },
//   cardSub: { fontSize: 12, color: '#9AA5B1', marginBottom: 12 },
//   emptyTxt: { fontSize: 13, color: '#9AA5B1', textAlign: 'center', paddingVertical: 16 },

//   // Assignment options
//   assignOption: { borderWidth: 1.5, borderColor: '#DCE3EA', borderRadius: 12, padding: 12, marginBottom: 8 },
//   assignOptionSelected: { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
//   assignOptionLeft: { flex: 1 },
//   assignSubject: { fontSize: 14, fontWeight: '700', color: '#0A1F44' },
//   assignSubjectSelected: { color: '#1565C0' },
//   assignClass: { fontSize: 12, color: '#5F6C7B', marginTop: 2 },
//   assignClassSelected: { color: '#1565C0' },
//   checkmark: { fontSize: 18, color: '#1565C0', fontWeight: '900' },

//   // Mark all
//   markAllRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
//   markAllPresent: { flex: 1, backgroundColor: '#DCFCE7', borderRadius: 10, padding: 10, alignItems: 'center' },
//   markAllAbsent: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, alignItems: 'center' },
//   markAllTxt: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

//   // Summary
//   summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
//   presentCount: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
//   absentCount: { fontSize: 14, fontWeight: '700', color: '#DC2626' },

//   // Student rows
//   studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8 },
//   studentPresent: { backgroundColor: 'transparent' },
//   studentAbsent: { backgroundColor: '#FFF5F5' },
//   studentDivider: { borderTopWidth: 1, borderTopColor: '#F4F7FB' },
//   studentStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
//   studentName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0A1F44' },
//   statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
//   statusBadgeTxt: { fontSize: 12, fontWeight: '700' },

//   // Submit
//   submitBtn: { backgroundColor: '#1565C0', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 14, elevation: 5, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
//   submitBtnDisabled: { backgroundColor: '#9AA5B1' },
//   submitBtnTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },

//   // Success
//   successCard: { backgroundColor: '#DCFCE7', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#16A34A' },
//   successIcon: { fontSize: 40, marginBottom: 8 },
//   successTitle: { fontSize: 18, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
//   successSub: { fontSize: 13, color: '#166534', textAlign: 'center', marginBottom: 16 },
//   newSessionBtn: { backgroundColor: '#16A34A', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
//   newSessionTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

//   errorCard: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DC2626' },
//   errorTxt:  { color: '#DC2626', fontSize: 13, fontWeight: '600' },

//   sessionTypeCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
//   sessionTypeLabel:   { fontSize: 13, fontWeight: '700', color: '#0A1F44', marginBottom: 10 },
//   sessionTypeRow:     { flexDirection: 'row', gap: 10 },
//   sessionTypeBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#DCE3EA', borderRadius: 12, paddingVertical: 12, backgroundColor: '#F9FAFB' },
//   sessionTypeBtnActive:           { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
//   sessionTypeBtnActivePractical:  { borderColor: '#7C3AED', backgroundColor: '#F3E8FF' },
//   sessionTypeBtnIcon: { fontSize: 18 },
//   sessionTypeBtnTxt:  { fontSize: 14, fontWeight: '700', color: '#9AA5B1' },
//   sessionTypeBtnTxtActive:          { color: '#1565C0' },
//   sessionTypeBtnTxtActivePractical: { color: '#7C3AED' },
// });