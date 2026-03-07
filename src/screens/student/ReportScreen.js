// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View, Text, ScrollView, StyleSheet, StatusBar,
//   ActivityIndicator, RefreshControl, TouchableOpacity,
//   Animated,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import {
//   doc, getDoc, collection, query, where, getDocs,
// } from 'firebase/firestore';
// import { auth, db } from '../../services/firebase/config';

// // ─── Constants ────────────────────────────────────────────────────────────────
// const THRESHOLD = 75;

// const C = {
//   bg:           '#F5F3FF',   // soft purple background
//   card:         '#FFFFFF',

//   primary:      '#4C1D95',   // deep purple (header / navbar)

//   accent:       '#7C3AED',   // main purple buttons
//   accentLight:  '#F3E8FF',   // light purple background
//   accentDark:   '#5B21B6',   // darker purple

//   success:      '#16A34A',
//   successBg:    '#DCFCE7',

//   danger:       '#DC2626',
//   dangerBg:     '#FEE2E2',

//   warning:      '#D97706',
//   warningBg:    '#FEF3C7',

//   text:         '#1E1B4B',   // dark indigo text
//   textSub:      '#4B5563',
//   textMuted:    '#A78BFA',

//   border:       '#E9D5FF',

//   tab:          '#F5F3FF',
//   tabActive:    '#7C3AED',
// };

// const DOT_COLORS = [
//   '#0F9B8E', '#6366F1', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6',
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const pct = (p, t) => (t === 0 ? 0 : Math.round((p / t) * 100));

// const requiredClasses = (present, total) =>
//   Math.max(0, Math.ceil((THRESHOLD * total - 100 * present) / (100 - THRESHOLD)));

// const getInitials = (name = '') =>
//   name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || '?';

// // ─── Progress Bar ─────────────────────────────────────────────────────────────
// const ProgressBar = ({ percentage, color }) => (
//   <View style={pb.bg}>
//     <View style={[pb.fill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
//     <View style={[pb.threshold, { left: `${THRESHOLD}%` }]} />
//   </View>
// );

// const pb = StyleSheet.create({
//   bg:        { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'visible', position: 'relative', marginVertical: 8 },
//   fill:      { height: 8, borderRadius: 4 },
//   threshold: { position: 'absolute', top: -4, width: 2, height: 16, backgroundColor: C.warning, borderRadius: 1 },
// });

// // ─── Overall Badge ────────────────────────────────────────────────────────────
// const OverallBadge = ({ percentage, totalSubjects, totalPresent, totalClasses }) => {
//   const isGood = percentage >= THRESHOLD;
//   const color  = isGood ? C.success : C.danger;
//   const bg     = isGood ? C.successBg : C.dangerBg;

//   return (
//     <View style={ob.wrap}>
//       {/* Decorative circles */}
//       <View style={ob.deco1} />
//       <View style={ob.deco2} />

//       <View style={ob.inner}>
//         {/* Left: big circle */}
//         <View style={[ob.circle, { borderColor: color, backgroundColor: bg }]}>
//           <Text style={[ob.circlePct, { color }]}>{percentage}%</Text>
//           <Text style={ob.circleLabel}>Overall</Text>
//         </View>

//         {/* Right: stats */}
//         <View style={ob.statsGroup}>
//           <Text style={ob.statsHeading}>Attendance Summary</Text>
//           {[
//             { label: 'Subjects Tracked', val: totalSubjects, color: C.accent   },
//             { label: 'Total Present',    val: totalPresent,  color: C.success  },
//             { label: 'Total Absent',     val: totalClasses - totalPresent, color: C.danger },
//           ].map(item => (
//             <View key={item.label} style={ob.statRow}>
//               <View style={[ob.statDot, { backgroundColor: item.color }]} />
//               <Text style={ob.statVal}>{item.val} </Text>
//               <Text style={ob.statLbl}>{item.label}</Text>
//             </View>
//           ))}
//         </View>
//       </View>

//       {/* Status strip */}
//       <View style={[ob.strip, { backgroundColor: isGood ? C.successBg : C.dangerBg, borderColor: color }]}>
//         <Text style={[ob.stripTxt, { color }]}>
//           {isGood
//             ? '✓  You meet the attendance requirement. Keep it up!'
//             : `⚠  Below ${THRESHOLD}% requirement. Attend more classes!`}
//         </Text>
//       </View>
//     </View>
//   );
// };

// const ob = StyleSheet.create({
//   wrap: {
//     backgroundColor: C.primary, borderRadius: 24, padding: 20,
//     marginBottom: 16, overflow: 'hidden',
//     shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
//   },
//   deco1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(15,155,142,0.12)', top: -50, right: -30 },
//   deco2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: 10 },
//   inner: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 14 },
//   circle: {
//     width: 96, height: 96, borderRadius: 48, borderWidth: 5,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   circlePct:   { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
//   circleLabel: { fontSize: 10, color: C.textSub, fontWeight: '700', marginTop: 1 },
//   statsGroup:  { flex: 1 },
//   statsHeading:{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
//   statRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
//   statDot:     { width: 7, height: 7, borderRadius: 4 },
//   statVal:     { fontSize: 14, fontWeight: '800', color: '#fff' },
//   statLbl:     { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
//   strip:       { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1 },
//   stripTxt:    { fontSize: 12, fontWeight: '600', lineHeight: 18 },
// });

// // ─── Tab Bar ──────────────────────────────────────────────────────────────────
// const TabBar = ({ tab, setTab }) => (
//   <View style={tb.wrap}>
//     {['My Attendance', 'Class Defaulters'].map((label, i) => (
//       <TouchableOpacity
//         key={label}
//         style={[tb.tab, tab === i && tb.tabActive]}
//         onPress={() => setTab(i)}
//         activeOpacity={0.8}
//       >
//         <Text style={[tb.tabTxt, tab === i && tb.tabTxtActive]}>
//           {i === 0 ? '📊 ' : '⚠️ '}{label}
//         </Text>
//       </TouchableOpacity>
//     ))}
//   </View>
// );

// const tb = StyleSheet.create({
//   wrap:        { flexDirection: 'row', backgroundColor: C.tab, borderRadius: 14, padding: 4, marginBottom: 16 },
//   tab:         { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
//   tabActive:   { backgroundColor: C.tabActive, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
//   tabTxt:      { fontSize: 13, fontWeight: '600', color: C.textMuted },
//   tabTxtActive:{ color: '#fff' },
// });

// // ─── Subject Attendance Card ──────────────────────────────────────────────────
// const SubjectCard = ({ subject, present, total, index }) => {
//   const p      = pct(present, total);
//   const isLow  = p < THRESHOLD;
//   const color  = isLow ? C.danger : C.success;
//   const needed = isLow ? requiredClasses(present, total) : 0;
//   const dot    = DOT_COLORS[index % DOT_COLORS.length];

//   return (
//     <View style={[sc.card, isLow && sc.cardLow]}>
//       {isLow && <View style={[sc.leftBorder, { backgroundColor: C.danger }]} />}

//       <View style={sc.header}>
//         <View style={[sc.dot, { backgroundColor: dot }]} />
//         <Text style={sc.subjectName} numberOfLines={1}>{subject}</Text>
//         <View style={[sc.pctBadge, { backgroundColor: isLow ? C.dangerBg : C.successBg }]}>
//           <Text style={[sc.pctTxt, { color }]}>{p}%</Text>
//         </View>
//       </View>

//       <ProgressBar percentage={p} color={color} />

//       <View style={sc.footer}>
//         <Text style={sc.sessions}>{present} / {total} sessions attended</Text>
//         {isLow && needed > 0 && (
//           <View style={sc.warningRow}>
//             <Text style={sc.warningTxt}>
//               ⚠️  Attend {needed} more consecutive class{needed > 1 ? 'es' : ''} to reach {THRESHOLD}%
//             </Text>
//           </View>
//         )}
//         {!isLow && (
//           <Text style={sc.goodTxt}>✓ Good standing</Text>
//         )}
//       </View>
//     </View>
//   );
// };

// const sc = StyleSheet.create({
//   card: {
//     backgroundColor: C.card, borderRadius: 16, padding: 16,
//     marginBottom: 10, overflow: 'hidden',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
//     borderWidth: 1, borderColor: C.border,
//   },
//   cardLow:     { borderColor: C.danger + '40' },
//   leftBorder:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
//   header:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   dot:         { width: 10, height: 10, borderRadius: 5 },
//   subjectName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
//   pctBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
//   pctTxt:      { fontSize: 13, fontWeight: '800' },
//   footer:      { gap: 4 },
//   sessions:    { fontSize: 12, color: C.textMuted },
//   warningRow:  { backgroundColor: C.dangerBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 },
//   warningTxt:  { fontSize: 12, color: C.danger, fontWeight: '600', lineHeight: 17 },
//   goodTxt:     { fontSize: 12, color: C.success, fontWeight: '600' },
// });

// // ─── Defaulter Card ───────────────────────────────────────────────────────────
// const DefaulterCard = ({ name, rollNo, overallPct: oPct, lowSubjects, index }) => (
//   <View style={dc.card}>
//     <View style={dc.left}>
//       <View style={[dc.avatar, { backgroundColor: DOT_COLORS[index % DOT_COLORS.length] + '22' }]}>
//         <Text style={[dc.avatarTxt, { color: DOT_COLORS[index % DOT_COLORS.length] }]}>
//           {getInitials(name)}
//         </Text>
//       </View>
//     </View>
//     <View style={dc.info}>
//       {rollNo ? <Text style={dc.roll}>Roll #{rollNo}</Text> : null}
//       <Text style={dc.name}>{name}</Text>
//       <View style={dc.subjectWrap}>
//         {lowSubjects.map(sub => (
//           <View key={sub} style={dc.subChip}>
//             <Text style={dc.subChipTxt}>{sub}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//     <View style={[dc.pctBox, { backgroundColor: C.dangerBg }]}>
//       <Text style={dc.pctVal}>{oPct}%</Text>
//       <Text style={dc.pctLbl}>overall</Text>
//     </View>
//   </View>
// );

// const dc = StyleSheet.create({
//   card: {
//     backgroundColor: C.card, borderRadius: 16, padding: 14,
//     marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
//     borderWidth: 1, borderColor: C.dangerBg,
//   },
//   left:       {},
//   avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt:  { fontSize: 15, fontWeight: '800' },
//   info:       { flex: 1 },
//   roll:       { fontSize: 10, color: C.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
//   name:       { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
//   subjectWrap:{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
//   subChip:    { backgroundColor: C.dangerBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
//   subChipTxt: { fontSize: 10, color: C.danger, fontWeight: '600' },
//   pctBox:     { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
//   pctVal:     { fontSize: 18, fontWeight: '900', color: C.danger },
//   pctLbl:     { fontSize: 9, color: C.danger, fontWeight: '600', opacity: 0.7 },
// });

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// const ReportScreen = ({ navigation }) => {
//   const [tab,          setTab]          = useState(0);
//   const [loading,      setLoading]      = useState(true);
//   const [refreshing,   setRefreshing]   = useState(false);
//   const [className,    setClassName]    = useState('');
//   const [myAttendance, setMyAttendance] = useState([]);  // [{ subjectId, subjectName, present, total }]
//   const [defaulters,   setDefaulters]   = useState([]);  // [{ name, rollNo, overallPct, lowSubjects }]
//   const [overall,      setOverall]      = useState({ pct: 0, present: 0, total: 0, subjects: 0 });

//   // ─────────────────────────────────────────────────────────────────────────
//   // Fetch data
//   //
//   // attendance/{autoId} structure (confirmed from Firestore screenshots):
//   //   classId, className, date, subjectId, subjectName, teacherId, savedAt
//   //   records: [{ name, status, studentId }]   ← array ON the doc itself
//   //
//   // For defaulters we also need users/{uid} to get names and roll numbers
//   // of all students in the class — sourced from classes/{classId}.students[]
//   // ─────────────────────────────────────────────────────────────────────────
//   const loadData = useCallback(async () => {
//     try {
//       const uid = auth.currentUser?.uid;
//       if (!uid) return;

//       // ── Step 1: Get current student profile ──────────────────────────────
//       const userSnap = await getDoc(doc(db, 'users', uid));
//       if (!userSnap.exists()) return;
//       const userData = userSnap.data();
//       const classId  = userData.classId ?? null;
//       const cName    = userData.className ?? '';
//       setClassName(cName);
//       if (!classId) return;

//       // ── Step 2: Query all attendance docs for this class ──────────────────
//       // Single query: attendance WHERE classId == studentClassId
//       const attQuery = query(
//         collection(db, 'attendance'),
//         where('classId', '==', classId)
//       );
//       const attSnap = await getDocs(attQuery);

//       // ── Step 3: Build subject maps in one pass ────────────────────────────
//       // mySubjectMap[subjectId]             = { subjectId, subjectName, present, total }
//       // allStudentMap[studentId][subjectId] = { subjectName, present, total }
//       const mySubjectMap  = {};
//       const allStudentMap = {};

//       attSnap.docs.forEach(sessionDoc => {
//         const d = sessionDoc.data();

//         // subjectId & subjectName are stored on the SESSION doc (top level)
//         const sessionSubjectId   = d.subjectId   ?? 'unknown';
//         const sessionSubjectName = d.subjectName ?? 'Unknown';
//         const records            = d.records     ?? [];

//         records.forEach(r => {
//           const studentId = r.studentId ?? '';
//           if (!studentId) return;

//           const status = (r.status ?? '').toLowerCase();

//           // Read subjectId from the record if present (written by latest AttendanceScreen).
//           // Fall back to session-level subjectId for older docs that don't have it per-record.
//           const sid   = r.subjectId ?? sessionSubjectId;
//           const sName = sessionSubjectName;

//           // ── Track every student → used for defaulters tab ──
//           if (!allStudentMap[studentId])       allStudentMap[studentId] = {};
//           if (!allStudentMap[studentId][sid]) {
//             allStudentMap[studentId][sid] = { subjectName: sName, present: 0, total: 0 };
//           }
//           allStudentMap[studentId][sid].total += 1;
//           if (status === 'present') allStudentMap[studentId][sid].present += 1;

//           // ── Track only MY records → used for My Attendance tab ──
//           if (studentId === uid) {
//             if (!mySubjectMap[sid]) {
//               mySubjectMap[sid] = { subjectId: sid, subjectName: sName, present: 0, total: 0 };
//             }
//             mySubjectMap[sid].total += 1;
//             if (status === 'present') mySubjectMap[sid].present += 1;
//           }
//         });
//       });

//       // ── Step 4: My attendance stats ───────────────────────────────────────
//       const myStats = Object.values(mySubjectMap)
//         .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

//       const totalPresent  = myStats.reduce((s, x) => s + x.present, 0);
//       const totalClasses  = myStats.reduce((s, x) => s + x.total,   0);
//       const overallPctVal = myStats.length > 0
//         ? Math.round(myStats.reduce((s, x) => s + pct(x.present, x.total), 0) / myStats.length)
//         : 0;

//       setMyAttendance(myStats);
//       setOverall({
//         pct:      overallPctVal,
//         present:  totalPresent,
//         total:    totalClasses,
//         subjects: myStats.length,
//       });

//       // ── Step 5: Build defaulters list ─────────────────────────────────────
//       // Get student names from users collection for each studentId
//       const otherStudentIds = Object.keys(allStudentMap).filter(id => id !== uid);

//       const defaulterList = [];

//       await Promise.all(
//         otherStudentIds.map(async (sId) => {
//           const subjects = allStudentMap[sId];
//           const subList  = Object.values(subjects);

//           // Calculate their overall pct (average across subjects)
//           const theirOverall = subList.length > 0
//             ? Math.round(subList.reduce((s, x) => s + pct(x.present, x.total), 0) / subList.length)
//             : 0;

//           if (theirOverall >= THRESHOLD) return; // not a defaulter

//           // Low attendance subjects
//           const lowSubs = subList
//             .filter(x => pct(x.present, x.total) < THRESHOLD)
//             .map(x => x.subjectName);

//           if (lowSubs.length === 0) return;

//           // Fetch their name from users collection
//           let name   = 'Unknown Student';
//           let rollNo = '';
//           try {
//             const uSnap = await getDoc(doc(db, 'users', sId));
//             if (uSnap.exists()) {
//               name   = uSnap.data().name       ?? 'Unknown Student';
//               rollNo = uSnap.data().rollNumber ?? uSnap.data().roll ?? '';
//             }
//           } catch (_) {}

//           defaulterList.push({ name, rollNo, overallPct: theirOverall, lowSubjects: lowSubs });
//         })
//       );

//       // Sort by pct ascending (worst first)
//       defaulterList.sort((a, b) => a.overallPct - b.overallPct);
//       setDefaulters(defaulterList);

//     } catch (err) {
//       console.error('ReportScreen error:', err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => { loadData(); }, [loadData]);

//   const onRefresh = () => { setRefreshing(true); loadData(); };

//   // ─── Render ────────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={s.safe} edges={['top']}>
//       <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

//       {/* Header */}
//       <View style={s.header}>
//         <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
//           <Text style={s.backIcon}>←</Text>
//         </TouchableOpacity>
//         <View>
//           <Text style={s.headerTitle}>Attendance Report</Text>
//           {className ? <Text style={s.headerSub}>Class: {className}</Text> : null}
//         </View>
//       </View>

//       {loading ? (
//         <View style={s.loader}>
//           <ActivityIndicator size="large" color={C.accent} />
//           <Text style={s.loaderTxt}>Analysing your attendance…</Text>
//         </View>
//       ) : (
//         <ScrollView
//           style={s.scroll}
//           contentContainerStyle={s.scrollContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
//               colors={[C.accent]} tintColor={C.accent} />
//           }
//         >
//           {/* Overall Badge */}
//           <OverallBadge
//             percentage={overall.pct}
//             totalSubjects={overall.subjects}
//             totalPresent={overall.present}
//             totalClasses={overall.total}
//           />

//           {/* Tabs */}
//           <TabBar tab={tab} setTab={setTab} />

//           {/* ── Tab 1: My Attendance ── */}
//           {tab === 0 && (
//             <>
//               {myAttendance.length === 0 ? (
//                 <View style={s.emptyCard}>
//                   <Text style={s.emptyIcon}>📋</Text>
//                   <Text style={s.emptyTitle}>No Attendance Data Yet</Text>
//                   <Text style={s.emptySub}>Your teacher hasn't recorded any sessions yet.</Text>
//                 </View>
//               ) : (
//                 <>
//                   {/* Low attendance warning banner */}
//                   {myAttendance.filter(x => pct(x.present, x.total) < THRESHOLD).length > 0 && (
//                     <View style={s.alertBanner}>
//                       <Text style={s.alertBannerTxt}>
//                         ⚠️  {myAttendance.filter(x => pct(x.present, x.total) < THRESHOLD).length} subject
//                         {myAttendance.filter(x => pct(x.present, x.total) < THRESHOLD).length > 1 ? 's are' : ' is'} below {THRESHOLD}% — action required!
//                       </Text>
//                     </View>
//                   )}

//                   {myAttendance.map((sub, i) => (
//                     <SubjectCard
//                       key={sub.subjectId}
//                       subject={sub.subjectName}
//                       present={sub.present}
//                       total={sub.total}
//                       index={i}
//                     />
//                   ))}

//                   {/* All good banner */}
//                   {myAttendance.every(x => pct(x.present, x.total) >= THRESHOLD) && (
//                     <View style={s.goodBanner}>
//                       <Text style={s.goodBannerTxt}>
//                         🎉  Excellent! You're above {THRESHOLD}% in all subjects.
//                       </Text>
//                     </View>
//                   )}
//                 </>
//               )}
//             </>
//           )}

//           {/* ── Tab 2: Class Defaulters ── */}
//           {tab === 1 && (
//             <>
//               <View style={s.infoBanner}>
//                 <Text style={s.infoBannerTitle}>🏫 {className || 'Your Class'}</Text>
//                 <Text style={s.infoBannerSub}>
//                   Students with overall attendance below {THRESHOLD}%
//                 </Text>
//               </View>

//               {defaulters.length === 0 ? (
//                 <View style={s.emptyCard}>
//                   <Text style={s.emptyIcon}>🎉</Text>
//                   <Text style={s.emptyTitle}>No Defaulters!</Text>
//                   <Text style={s.emptySub}>All students are above {THRESHOLD}% attendance.</Text>
//                 </View>
//               ) : (
//                 <>
//                   <View style={s.defaulterCount}>
//                     <Text style={s.defaulterCountTxt}>
//                       {defaulters.length} student{defaulters.length > 1 ? 's' : ''} below {THRESHOLD}%
//                     </Text>
//                   </View>
//                   {defaulters.map((d, i) => (
//                     <DefaulterCard
//                       key={d.name + i}
//                       name={d.name}
//                       rollNo={d.rollNo}
//                       overallPct={d.overallPct}
//                       lowSubjects={d.lowSubjects}
//                       index={i}
//                     />
//                   ))}
//                 </>
//               )}
//             </>
//           )}

//           <View style={{ height: 40 }} />
//         </ScrollView>
//       )}
//     </SafeAreaView>
//   );
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   safe:   { flex: 1, backgroundColor: C.bg },
//   header: {
//     flexDirection: 'row', alignItems: 'center', gap: 12,
//     paddingHorizontal: 16, paddingVertical: 14,
//     borderBottomWidth: 1, borderBottomColor: C.border,
//     backgroundColor: C.bg,
//   },
//   backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
//   backIcon:    { fontSize: 18, color: C.text, fontWeight: '700' },
//   headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
//   headerSub:   { fontSize: 12, color: C.textMuted, marginTop: 1 },

//   scroll:        { flex: 1 },
//   scrollContent: { padding: 16 },

//   loader:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
//   loaderTxt: { fontSize: 14, color: C.textSub },

//   alertBanner: {
//     backgroundColor: C.dangerBg, borderRadius: 12, padding: 12,
//     marginBottom: 12, borderWidth: 1, borderColor: C.danger + '40',
//   },
//   alertBannerTxt: { fontSize: 13, color: C.danger, fontWeight: '600', lineHeight: 18 },

//   goodBanner: {
//     backgroundColor: C.successBg, borderRadius: 12, padding: 12,
//     marginTop: 4, borderWidth: 1, borderColor: C.success + '40',
//   },
//   goodBannerTxt: { fontSize: 13, color: C.success, fontWeight: '600' },

//   infoBanner: {
//     backgroundColor: C.primary, borderRadius: 16, padding: 16,
//     marginBottom: 14,
//   },
//   infoBannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
//   infoBannerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

//   defaulterCount: {
//     backgroundColor: C.dangerBg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
//     marginBottom: 10, alignSelf: 'flex-start',
//   },
//   defaulterCountTxt: { fontSize: 12, color: C.danger, fontWeight: '700' },

//   emptyCard: {
//     backgroundColor: C.card, borderRadius: 20, padding: 40,
//     alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border,
//   },
//   emptyIcon:  { fontSize: 40, marginBottom: 12 },
//   emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
//   emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
// });

// export default ReportScreen;






// src/screens/student/ReportScreen.js
//
// ─── WHAT THIS FILE DOES ───────────────────────────────────────────────────
// Shows the student's DETAILED attendance report:
//   • Subject-wise attendance (% + present/total counts)
//   • Each subject shows: percentage bar, sessions attended, sessions missed
//   • Defaulter warning if ANY subject is below 75%
//   • Summary at the top: total sessions, total present, total absent
//
// ─── HOW DATA IS FETCHED ───────────────────────────────────────────────────
// SAME fetch logic as HomeScreen (reused — same 4 steps).
// Report shows SAME data as home but in a MORE DETAILED layout.
// No extra Firestore reads needed beyond what HomeScreen does.
//
// ─── WHY NOT USE NAVIGATION PARAMS? ───────────────────────────────────────
// We could pass data from HomeScreen via navigation params, but that would
// mean report shows stale data if teacher marks attendance while student
// is on home tab. Better to fetch fresh on every tab visit.
// ───────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

const THRESHOLD = 75;

const pct = (present, total) => (total === 0 ? 0 : Math.round((present / total) * 100));

const COLORS = ['#E94560', '#0F9B8E', '#6366F1', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const Bar = ({ percentage, color }) => (
  <View style={bar.track}>
    <View style={[bar.fill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
    <View style={bar.marker} />
  </View>
);
const bar = StyleSheet.create({
  track:  { height: 10, backgroundColor: '#F3E8FF', borderRadius: 5, marginVertical: 8, position: 'relative', overflow: 'visible' },
  fill:   { height: 10, borderRadius: 5 },
  marker: { position: 'absolute', left: '75%', top: -3, width: 2, height: 16, backgroundColor: '#F59E0B', borderRadius: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentReportScreen() {
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [className,  setClassName]  = useState('');
  const [subjects,   setSubjects]   = useState([]); // [{ subjectId, subjectName, present, total }]
  const [summary,    setSummary]    = useState({ present: 0, total: 0 });
  const [error,      setError]      = useState('');

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError('');
      const uid = auth.currentUser?.uid;
      if (!uid) { setError('Not logged in.'); return; }

      // ── STEP 1: Find student's class ─────────────────────────────────────
      // WHY: users doc has no classId. Must scan classes collection.
      const classSnap = await getDocs(collection(db, 'classes'));
      let foundClassId = null;
      let foundClassName = '';

      classSnap.forEach(classDoc => {
        const data = classDoc.data();
        if ((data.students ?? []).includes(uid)) {
          foundClassId   = classDoc.id;
          foundClassName = data.className ?? data.name ?? '';
        }
      });

      setClassName(foundClassName);

      if (!foundClassId) {
        setError('You have not been assigned to any class yet. Ask your admin.');
        return;
      }

      // ── STEP 2: Fetch all attendance for this class ───────────────────────
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('classId', '==', foundClassId))
      );

      if (attSnap.empty) {
        setSubjects([]);
        setSummary({ present: 0, total: 0 });
        return;
      }

      // ── STEP 3: Build subject-wise stats for THIS student ─────────────────
      // WHY: We iterate every session doc. Each doc = one subject + one date.
      //      Inside records[] we find the entry for this student's uid.
      const subjectMap = {};

      attSnap.forEach(sessionDoc => {
        const d = sessionDoc.data();
        const subjectId   = d.subjectId   ?? 'unknown';
        const subjectName = d.subjectName ?? 'Unknown Subject';
        const records     = d.records     ?? [];

        const myRecord = records.find(r => r.studentId === uid);
        if (!myRecord) return;

        const isPresent = (myRecord.status ?? '').toLowerCase() === 'present';

        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = { subjectId, subjectName, present: 0, total: 0 };
        }
        subjectMap[subjectId].total += 1;
        if (isPresent) subjectMap[subjectId].present += 1;
      });

      // ── STEP 4: Sort and compute summary ──────────────────────────────────
      const stats = Object.values(subjectMap).sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName)
      );
      const totalPresent = stats.reduce((s, x) => s + x.present, 0);
      const totalClasses = stats.reduce((s, x) => s + x.total,   0);

      setSubjects(stats);
      setSummary({ present: totalPresent, total: totalClasses });

    } catch (err) {
      console.error('ReportScreen fetchData error:', err);
      setError('Failed to load report. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const overallPct   = pct(summary.present, summary.total);
  const defaulters   = subjects.filter(s => pct(s.present, s.total) < THRESHOLD);
  const hasDefaulter = defaulters.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={s.loadingTxt}>Loading your report…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4C1D95" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>📈 My Attendance Report</Text>
          {!!className && <Text style={s.headerSub}>Class: {className}</Text>}
        </View>

        <View style={s.body}>

          {/* ── Error ── */}
          {!!error && (
            <View style={s.errorCard}>
              <Text style={s.errorTxt}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Summary Strip ── */}
          {summary.total > 0 && (
            <View style={s.summaryCard}>
              <SummaryBox label="Total Sessions" value={summary.total}                    color="#1E1B4B" />
              <View style={s.summaryDiv} />
              <SummaryBox label="Present"        value={summary.present}                  color="#16A34A" />
              <View style={s.summaryDiv} />
              <SummaryBox label="Absent"         value={summary.total - summary.present}  color="#DC2626" />
              <View style={s.summaryDiv} />
              <SummaryBox label="Overall %"      value={`${overallPct}%`}                 color={overallPct >= THRESHOLD ? '#16A34A' : '#DC2626'} />
            </View>
          )}

          {/* ── Defaulter Warning ── */}
          {hasDefaulter && (
            <View style={s.warnCard}>
              <Text style={s.warnTitle}>⚠️ Attendance Warning</Text>
              <Text style={s.warnBody}>
                You are below 75% in {defaulters.length} subject{defaulters.length > 1 ? 's' : ''}:{' '}
                {defaulters.map(d => d.subjectName).join(', ')}.
                {'\n'}Please attend more classes to avoid being marked as defaulter.
              </Text>
            </View>
          )}

          {/* ── No data ── */}
          {subjects.length === 0 && !error && (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No Report Available</Text>
              <Text style={s.emptySub}>Your teacher hasn't recorded any attendance yet.</Text>
            </View>
          )}

          {/* ── Subject-wise detail cards ── */}
          {subjects.map((sub, i) => {
            const p       = pct(sub.present, sub.total);
            const isLow   = p < THRESHOLD;
            const color   = COLORS[i % COLORS.length];
            const needed  = isLow
              ? Math.max(0, Math.ceil((THRESHOLD * sub.total - 100 * sub.present) / (100 - THRESHOLD)))
              : 0;

            return (
              <View key={sub.subjectId} style={[s.subCard, isLow && s.subCardLow]}>
                {/* Left color strip */}
                <View style={[s.subStrip, { backgroundColor: color }]} />

                <View style={s.subContent}>
                  {/* Top row: subject name + % badge */}
                  <View style={s.subTopRow}>
                    <Text style={s.subName} numberOfLines={1}>{sub.subjectName}</Text>
                    <View style={[s.pctBadge, { backgroundColor: isLow ? '#FEE2E2' : '#DCFCE7' }]}>
                      {isLow && <Text style={s.warnDot}>⚠ </Text>}
                      <Text style={[s.pctTxt, { color: isLow ? '#DC2626' : '#16A34A' }]}>{p}%</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <Bar percentage={p} color={isLow ? '#DC2626' : '#16A34A'} />

                  {/* Stats row */}
                  <View style={s.subStatsRow}>
                    <StatChip label="Present" value={sub.present}              bgColor="#DCFCE7" textColor="#16A34A" />
                    <StatChip label="Absent"  value={sub.total - sub.present}  bgColor="#FEE2E2" textColor="#DC2626" />
                    <StatChip label="Total"   value={sub.total}                bgColor="#F3E8FF" textColor="#7C3AED" />
                  </View>

                  {/* Defaulter notice */}
                  {isLow && needed > 0 && (
                    <View style={s.neededRow}>
                      <Text style={s.neededTxt}>
                        📌  Attend {needed} more class{needed > 1 ? 'es' : ''} to reach 75%
                      </Text>
                    </View>
                  )}

                  {/* All clear */}
                  {!isLow && (
                    <Text style={s.goodTxt}>✓  Above 75% — You're on track!</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Bottom note */}
          {subjects.length > 0 && (
            <View style={s.noteCard}>
              <Text style={s.noteTxt}>
                📌  The yellow marker (▲) on each bar marks the 75% minimum threshold.
                {'\n'}Pull down to refresh with latest data.
              </Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
const SummaryBox = ({ label, value, color }) => (
  <View style={s.summaryBox}>
    <Text style={[s.summaryVal, { color }]}>{value}</Text>
    <Text style={s.summaryLabel}>{label}</Text>
  </View>
);

const StatChip = ({ label, value, bgColor, textColor }) => (
  <View style={[s.chip, { backgroundColor: bgColor }]}>
    <Text style={[s.chipVal, { color: textColor }]}>{value}</Text>
    <Text style={[s.chipLabel, { color: textColor }]}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F6F5FF' },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: '#7C3AED' },

  header:      { backgroundColor: '#4C1D95', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  // Summary strip
  summaryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  summaryBox:  { flex: 1, alignItems: 'center' },
  summaryVal:  { fontSize: 20, fontWeight: '900' },
  summaryLabel:{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  summaryDiv:  { width: 1, height: 36, backgroundColor: '#F3E8FF' },

  // Warning card
  warnCard:  { backgroundColor: '#FFF7ED', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: '#F59E0B' },
  warnTitle: { fontSize: 14, fontWeight: '700', color: '#D97706', marginBottom: 6 },
  warnBody:  { fontSize: 13, color: '#92400E', lineHeight: 20 },

  // Subject cards
  subCard: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
    overflow: 'hidden', flexDirection: 'row',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  subCardLow:  { borderWidth: 1.5, borderColor: '#FECACA' },
  subStrip:    { width: 5 },
  subContent:  { flex: 1, padding: 14 },
  subTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subName:     { fontSize: 15, fontWeight: '800', color: '#1E1B4B', flex: 1, marginRight: 8 },
  pctBadge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pctTxt:      { fontSize: 14, fontWeight: '900' },
  warnDot:     { fontSize: 11 },

  // Stats chips
  subStatsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip:        { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  chipVal:     { fontSize: 16, fontWeight: '900' },
  chipLabel:   { fontSize: 10, fontWeight: '600', marginTop: 1 },

  // Needed / good messages
  neededRow: { backgroundColor: '#FFF7ED', borderRadius: 8, padding: 8, marginTop: 8 },
  neededTxt: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  goodTxt:   { fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 8 },

  // Note at bottom
  noteCard: { backgroundColor: '#EDE9FE', borderRadius: 12, padding: 14, marginBottom: 14 },
  noteTxt:  { fontSize: 12, color: '#5B21B6', lineHeight: 20 },

  // Empty / error
  emptyCard:  { backgroundColor: '#fff', borderRadius: 20, padding: 36, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E9D5FF' },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#7C3AED', textAlign: 'center', lineHeight: 20 },
  errorCard:  { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DC2626' },
  errorTxt:   { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});







