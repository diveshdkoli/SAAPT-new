// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   ActivityIndicator,
//   ScrollView,
//   Modal,
//   RefreshControl,
// } from 'react-native';
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   orderBy,
// } from 'firebase/firestore';
// import { db } from '../../services/firebase/config';  // adjust path as needed

// // ─── Color Palette (consistent with all SAAPT screens) ───────────────────────
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
//   purple:         '#8B5CF6',
//   purpleLight:    '#F5F3FF',
//   background:     '#F8F9FE',
//   card:           '#FFFFFF',
//   text:           '#1E1B4B',
//   textSecondary:  '#6B7280',
//   textLight:      '#9CA3AF',
//   border:         '#E5E7EB',
//   inputBg:        '#F3F4F6',
//   shadow:         '#1E1B4B',
//   modalOverlay:   'rgba(30, 27, 75, 0.5)',
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const pct = (present, total) => {
//   if (!total) return 0;
//   return Math.round((present / total) * 100);
// };

// const pctColor = (p) => {
//   if (p >= 85) return COLORS.success;
//   if (p >= 65) return COLORS.warning;
//   return COLORS.danger;
// };

// const pctBg = (p) => {
//   if (p >= 85) return COLORS.successLight;
//   if (p >= 65) return COLORS.warningLight;
//   return COLORS.dangerLight;
// };

// const pctLabel = (p) => {
//   if (p >= 85) return 'Excellent';
//   if (p >= 65) return 'Average';
//   return 'Low';
// };

// const todayStr = () => new Date().toISOString().slice(0, 10);

// // ─── Sub-components ───────────────────────────────────────────────────────────

// /* Summary stat card */
// const SummaryCard = ({ icon, value, label, color, bg }) => (
//   <View style={[styles.summaryCard, { borderTopColor: color }]}>
//     <View style={[styles.summaryIconBox, { backgroundColor: bg }]}>
//       <Text style={styles.summaryIcon}>{icon}</Text>
//     </View>
//     <Text style={[styles.summaryValue, { color }]}>{value}</Text>
//     <Text style={styles.summaryLabel}>{label}</Text>
//   </View>
// );

// /* Attendance bar */
// const AttendanceBar = ({ percentage }) => {
//   const color = pctColor(percentage);
//   return (
//     <View style={styles.barTrack}>
//       <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
//     </View>
//   );
// };

// /* Student row in class report */
// const StudentRow = ({ student, index }) => {
//   const { name, email, presentDays, totalDays } = student;
//   const p     = pct(presentDays, totalDays);
//   const color = pctColor(p);
//   const bg    = pctBg(p);

//   return (
//     <View style={styles.studentRow}>
//       <View style={styles.studentRowLeft}>
//         <View style={[styles.rowIndex, { backgroundColor: COLORS.primaryLight }]}>
//           <Text style={[styles.rowIndexText, { color: COLORS.primary }]}>{index + 1}</Text>
//         </View>
//         <View style={styles.rowInfo}>
//           <Text style={styles.rowName} numberOfLines={1}>{name || 'Unknown'}</Text>
//           <Text style={styles.rowEmail} numberOfLines={1}>{email || ''}</Text>
//         </View>
//       </View>
//       <View style={styles.studentRowRight}>
//         <View style={[styles.pctBadge, { backgroundColor: bg }]}>
//           <Text style={[styles.pctBadgeText, { color }]}>{p}%</Text>
//         </View>
//         <Text style={[styles.pctStatus, { color }]}>{pctLabel(p)}</Text>
//       </View>
//     </View>
//   );
// };

// /* Dropdown modal */
// const DropdownModal = ({ visible, title, items, selectedId, onSelect, onClose, emptyText }) => (
//   <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
//     <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={onClose}>
//       <View style={styles.dropdownContainer}>
//         <View style={styles.dropdownHeader}>
//           <Text style={styles.dropdownTitle}>{title}</Text>
//           <TouchableOpacity onPress={onClose} style={styles.dropdownClose}>
//             <Text style={styles.dropdownCloseText}>✕</Text>
//           </TouchableOpacity>
//         </View>

//         <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
//           {/* None option */}
//           <TouchableOpacity
//             style={[styles.dropdownItem, !selectedId && styles.dropdownItemActive]}
//             onPress={() => { onSelect(null); onClose(); }}
//           >
//             <Text style={[styles.dropdownItemText, !selectedId && styles.dropdownItemTextActive]}>
//               — None (Clear)
//             </Text>
//             {!selectedId && <Text style={styles.dropdownCheck}>✓</Text>}
//           </TouchableOpacity>

//           {items.length === 0 ? (
//             <Text style={styles.dropdownEmpty}>{emptyText || 'No items'}</Text>
//           ) : (
//             items.map((item) => {
//               const active = selectedId === item.id;
//               return (
//                 <TouchableOpacity
//                   key={item.id}
//                   style={[styles.dropdownItem, active && styles.dropdownItemActive]}
//                   onPress={() => { onSelect(item); onClose(); }}
//                 >
//                   <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
//                     {item.name}
//                   </Text>
//                   {active && <Text style={styles.dropdownCheck}>✓</Text>}
//                 </TouchableOpacity>
//               );
//             })
//           )}
//         </ScrollView>
//       </View>
//     </TouchableOpacity>
//   </Modal>
// );

// /* Class report detail card */
// const ClassReportCard = ({ classData, reportData, loadingReport }) => {
//   const totalStudents = reportData.length;
//   const totalPresent  = reportData.reduce((a, s) => a + (s.presentDays || 0), 0);
//   const totalPossible = reportData.reduce((a, s) => a + (s.totalDays   || 0), 0);
//   const overallPct    = pct(totalPresent, totalPossible);
//   const color         = pctColor(overallPct);

//   return (
//     <View style={styles.reportCard}>
//       {/* Class header */}
//       <View style={[styles.reportCardHeader, { backgroundColor: COLORS.primary }]}>
//         <View style={styles.reportCardHeaderLeft}>
//           <Text style={styles.reportCardTitle}>{classData.name}</Text>
//           <Text style={styles.reportCardSub}>
//             👩‍🏫 {classData.teacherName || 'No Teacher Assigned'}
//           </Text>
//         </View>
//         <View style={styles.reportCardBadge}>
//           <Text style={[styles.reportCardPct, { color: '#fff' }]}>{overallPct}%</Text>
//           <Text style={styles.reportCardPctLabel}>Avg</Text>
//         </View>
//       </View>

//       {/* Meta row */}
//       <View style={styles.reportMetaRow}>
//         <View style={styles.reportMetaItem}>
//           <Text style={styles.reportMetaNum}>{totalStudents}</Text>
//           <Text style={styles.reportMetaLabel}>Students</Text>
//         </View>
//         <View style={styles.reportMetaDivider} />
//         <View style={styles.reportMetaItem}>
//           <Text style={styles.reportMetaNum}>{totalPresent}</Text>
//           <Text style={styles.reportMetaLabel}>Present Days</Text>
//         </View>
//         <View style={styles.reportMetaDivider} />
//         <View style={styles.reportMetaItem}>
//           <Text style={[styles.reportMetaNum, { color }]}>{overallPct}%</Text>
//           <Text style={styles.reportMetaLabel}>Overall</Text>
//         </View>
//       </View>

//       {/* Overall bar */}
//       <View style={styles.overallBarRow}>
//         <Text style={styles.overallBarLabel}>Overall Attendance</Text>
//         <Text style={[styles.overallBarPct, { color }]}>{overallPct}%</Text>
//       </View>
//       <AttendanceBar percentage={overallPct} />

//       {/* Students list */}
//       <View style={styles.studentListHeader}>
//         <Text style={styles.studentListTitle}>Student Breakdown</Text>
//         <Text style={styles.studentListCount}>{totalStudents} students</Text>
//       </View>

//       {loadingReport ? (
//         <View style={styles.reportLoading}>
//           <ActivityIndicator size="small" color={COLORS.primary} />
//           <Text style={styles.reportLoadingText}>Calculating...</Text>
//         </View>
//       ) : reportData.length === 0 ? (
//         <View style={styles.reportEmpty}>
//           <Text style={styles.reportEmptyIcon}>📋</Text>
//           <Text style={styles.reportEmptyText}>No attendance records found</Text>
//         </View>
//       ) : (
//         reportData.map((student, index) => (
//           <View key={student.id}>
//             <StudentRow student={student} index={index} />
//             {index < reportData.length - 1 && <View style={styles.rowDivider} />}
//           </View>
//         ))
//       )}
//     </View>
//   );
// };

// /* Student report detail card */
// const StudentReportCard = ({ student, classData, presentDays, totalDays }) => {
//   const p     = pct(presentDays, totalDays);
//   const color = pctColor(p);
//   const bg    = pctBg(p);

//   return (
//     <View style={styles.reportCard}>
//       <View style={[styles.reportCardHeader, { backgroundColor: COLORS.secondary }]}>
//         <View style={styles.reportCardHeaderLeft}>
//           <Text style={styles.reportCardTitle}>{student.name}</Text>
//           <Text style={styles.reportCardSub}>
//             🏫 {classData?.name || 'No class assigned'}
//           </Text>
//         </View>
//         <View style={styles.reportCardBadge}>
//           <Text style={[styles.reportCardPct, { color: '#fff' }]}>{p}%</Text>
//           <Text style={styles.reportCardPctLabel}>{pctLabel(p)}</Text>
//         </View>
//       </View>

//       <View style={styles.reportMetaRow}>
//         <View style={styles.reportMetaItem}>
//           <Text style={styles.reportMetaNum}>{totalDays}</Text>
//           <Text style={styles.reportMetaLabel}>Total Days</Text>
//         </View>
//         <View style={styles.reportMetaDivider} />
//         <View style={styles.reportMetaItem}>
//           <Text style={[styles.reportMetaNum, { color: COLORS.success }]}>{presentDays}</Text>
//           <Text style={styles.reportMetaLabel}>Present</Text>
//         </View>
//         <View style={styles.reportMetaDivider} />
//         <View style={styles.reportMetaItem}>
//           <Text style={[styles.reportMetaNum, { color: COLORS.danger }]}>{totalDays - presentDays}</Text>
//           <Text style={styles.reportMetaLabel}>Absent</Text>
//         </View>
//       </View>

//       <View style={styles.overallBarRow}>
//         <Text style={styles.overallBarLabel}>Attendance Rate</Text>
//         <Text style={[styles.overallBarPct, { color }]}>{p}%</Text>
//       </View>
//       <AttendanceBar percentage={p} />

//       {/* Status indicator */}
//       <View style={[styles.statusBanner, { backgroundColor: bg }]}>
//         <Text style={[styles.statusBannerText, { color }]}>
//           {p >= 85
//             ? '✅ Excellent attendance — keep it up!'
//             : p >= 65
//             ? '⚠️ Average attendance — improvement needed'
//             : '🚨 Low attendance — immediate attention required'}
//         </Text>
//       </View>

//       {/* Student info */}
//       <View style={styles.studentDetailRow}>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailIcon}>📧</Text>
//           <Text style={styles.detailText}>{student.email || '—'}</Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailIcon}>🎓</Text>
//           <Text style={styles.detailText}>{student.role || 'student'}</Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// const ReportsScreen = ({ navigation }) => {
//   const [classes,          setClasses]          = useState([]);
//   const [students,         setStudents]         = useState([]);
//   const [selectedClass,    setSelectedClass]    = useState(null);
//   const [selectedStudent,  setSelectedStudent]  = useState(null);
//   const [classStudents,    setClassStudents]    = useState([]);
//   const [reportData,       setReportData]       = useState([]);
//   const [studentReport,    setStudentReport]    = useState(null);
//   const [loading,          setLoading]          = useState(true);
//   const [loadingReport,    setLoadingReport]    = useState(false);
//   const [refreshing,       setRefreshing]       = useState(false);
//   const [showClassDD,      setShowClassDD]      = useState(false);
//   const [showStudentDD,    setShowStudentDD]    = useState(false);

//   // Summary stats
//   const [summaryStats, setSummaryStats] = useState({
//     overallPct: 0,
//     todayPct:   0,
//     totalClasses: 0,
//     totalStudents: 0,
//   });

//   // ── Fetch base data ────────────────────────────────────────────────────────
//   const fetchBaseData = async () => {
//     try {
//       const [classSnap, usersSnap] = await Promise.all([
//         getDocs(query(collection(db, 'classes'), orderBy('createdAt', 'desc'))),
//         getDocs(collection(db, 'users')),
//       ]);
//       const classData   = classSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       const allUsers    = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       const studentData = allUsers.filter((u) => u.role === 'student');

//       setClasses(classData);
//       setStudents(studentData);
//       return { classData, studentData };
//     } catch (e) {
//       console.error('Error fetching base data:', e);
//       return { classData: [], studentData: [] };
//     }
//   };

//   // ── Fetch summary stats ────────────────────────────────────────────────────
//   const fetchSummaryStats = async (classData, studentData) => {
//     try {
//       const attendanceSnap = await getDocs(collection(db, 'attendance'));
//       const records        = attendanceSnap.docs.map((d) => d.data());

//       const total   = records.length;
//       const present = records.filter((r) => r.status === 'present').length;

//       const today       = todayStr();
//       const todayRecs   = records.filter((r) => {
//         const d = r.date?.toDate ? r.date.toDate().toISOString().slice(0, 10) : r.date;
//         return d === today;
//       });
//       const todayTotal   = todayRecs.length;
//       const todayPresent = todayRecs.filter((r) => r.status === 'present').length;

//       setSummaryStats({
//         overallPct:    pct(present, total),
//         todayPct:      pct(todayPresent, todayTotal),
//         totalClasses:  classData.length,
//         totalStudents: studentData.length,
//       });
//     } catch (e) {
//       console.error('Error fetching summary:', e);
//       setSummaryStats({
//         overallPct:    0,
//         todayPct:      0,
//         totalClasses:  classData.length,
//         totalStudents: studentData.length,
//       });
//     }
//   };

//   const loadAll = async () => {
//     const { classData, studentData } = await fetchBaseData();
//     await fetchSummaryStats(classData, studentData);
//     setLoading(false);
//     setRefreshing(false);
//   };

//   useEffect(() => { loadAll(); }, []);

//   const onRefresh = useCallback(() => { setRefreshing(true); loadAll(); }, []);

//   // ── When class selected → fetch student attendance ─────────────────────────
//   useEffect(() => {
//     if (!selectedClass) {
//       setReportData([]);
//       setClassStudents([]);
//       return;
//     }
//     setSelectedStudent(null);
//     fetchClassReport(selectedClass);
//   }, [selectedClass]);

//   const fetchClassReport = async (cls) => {
//     setLoadingReport(true);
//     try {
//       // Get students in this class
//       const memberIds  = cls.students || [];
//       const members    = students.filter((s) => memberIds.includes(s.id));

//       if (members.length === 0) {
//         setReportData([]);
//         setClassStudents([]);
//         setLoadingReport(false);
//         return;
//       }

//       // Fetch attendance for this class
//       const attSnap = await getDocs(
//         query(collection(db, 'attendance'), where('classId', '==', cls.id))
//       );
//       const records = attSnap.docs.map((d) => d.data());

//       const result = members.map((student) => {
//         const studentRecs  = records.filter((r) => r.studentId === student.id);
//         const totalDays    = studentRecs.length;
//         const presentDays  = studentRecs.filter((r) => r.status === 'present').length;
//         return { ...student, totalDays, presentDays };
//       });

//       // Sort by attendance % descending
//       result.sort((a, b) => pct(b.presentDays, b.totalDays) - pct(a.presentDays, a.totalDays));

//       setReportData(result);
//       setClassStudents(members);
//     } catch (e) {
//       console.error('Error fetching class report:', e);
//       setReportData([]);
//     } finally {
//       setLoadingReport(false);
//     }
//   };

//   // ── When student selected → fetch student attendance ──────────────────────
//   useEffect(() => {
//     if (!selectedStudent) {
//       setStudentReport(null);
//       return;
//     }
//     setSelectedClass(null);
//     fetchStudentReport(selectedStudent);
//   }, [selectedStudent]);

//   const fetchStudentReport = async (student) => {
//     setLoadingReport(true);
//     try {
//       const attSnap = await getDocs(
//         query(collection(db, 'attendance'), where('studentId', '==', student.id))
//       );
//       const records    = attSnap.docs.map((d) => d.data());
//       const totalDays  = records.length;
//       const presentDays = records.filter((r) => r.status === 'present').length;

//       // Find their class
//       const studentClass = classes.find((c) => (c.students || []).includes(student.id)) || null;

//       setStudentReport({ presentDays, totalDays, studentClass });
//     } catch (e) {
//       console.error('Error fetching student report:', e);
//       setStudentReport({ presentDays: 0, totalDays: 0, studentClass: null });
//     } finally {
//       setLoadingReport(false);
//     }
//   };

//   // ── Render ─────────────────────────────────────────────────────────────────
//   const showReport     = !!selectedClass || !!selectedStudent;
//   const overallColor   = pctColor(summaryStats.overallPct);
//   const todayColor     = pctColor(summaryStats.todayPct);

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <View>
//             <Text style={styles.headerTitle}>Reports & Analytics</Text>
//             <Text style={styles.headerSubtitle}>Monitor attendance and performance</Text>
//           </View>
//           <View style={styles.headerIcon}>
//             <Text style={styles.headerIconText}>📊</Text>
//           </View>
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
//         {loading ? (
//           <View style={styles.fullLoader}>
//             <ActivityIndicator size="large" color={COLORS.primary} />
//             <Text style={styles.fullLoaderText}>Loading reports...</Text>
//           </View>
//         ) : (
//           <>
//             {/* ── Summary Cards ── */}
//             <Text style={styles.sectionTitle}>Overview</Text>
//             <View style={styles.summaryGrid}>
//               <SummaryCard
//                 icon="📊"
//                 value={`${summaryStats.overallPct}%`}
//                 label="Overall Attendance"
//                 color={overallColor}
//                 bg={pctBg(summaryStats.overallPct)}
//               />
//               <SummaryCard
//                 icon="📅"
//                 value={summaryStats.todayPct > 0 ? `${summaryStats.todayPct}%` : '—'}
//                 label="Today's Attendance"
//                 color={todayColor}
//                 bg={pctBg(summaryStats.todayPct)}
//               />
//               <SummaryCard
//                 icon="🏫"
//                 value={summaryStats.totalClasses.toString()}
//                 label="Total Classes"
//                 color={COLORS.primary}
//                 bg={COLORS.primaryLight}
//               />
//               <SummaryCard
//                 icon="🎓"
//                 value={summaryStats.totalStudents.toString()}
//                 label="Total Students"
//                 color={COLORS.secondary}
//                 bg={COLORS.secondaryLight}
//               />
//             </View>

//             {/* ── Filters ── */}
//             <Text style={styles.sectionTitle}>Filter Report</Text>
//             <View style={styles.filterRow}>
//               {/* Class dropdown */}
//               <TouchableOpacity
//                 style={[styles.filterBtn, selectedClass && styles.filterBtnActive]}
//                 onPress={() => setShowClassDD(true)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.filterBtnIcon}>🏫</Text>
//                 <Text
//                   style={[styles.filterBtnText, selectedClass && styles.filterBtnTextActive]}
//                   numberOfLines={1}
//                 >
//                   {selectedClass ? selectedClass.name : 'Select Class'}
//                 </Text>
//                 <Text style={[styles.filterBtnArrow, selectedClass && { color: COLORS.primary }]}>▼</Text>
//               </TouchableOpacity>

//               {/* Student dropdown */}
//               <TouchableOpacity
//                 style={[styles.filterBtn, selectedStudent && styles.filterBtnActive]}
//                 onPress={() => setShowStudentDD(true)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.filterBtnIcon}>🎓</Text>
//                 <Text
//                   style={[styles.filterBtnText, selectedStudent && styles.filterBtnTextActive]}
//                   numberOfLines={1}
//                 >
//                   {selectedStudent ? selectedStudent.name : 'Select Student'}
//                 </Text>
//                 <Text style={[styles.filterBtnArrow, selectedStudent && { color: COLORS.primary }]}>▼</Text>
//               </TouchableOpacity>
//             </View>

//             {/* Active filter chip */}
//             {(selectedClass || selectedStudent) && (
//               <View style={styles.activeFilterRow}>
//                 <View style={styles.activeChip}>
//                   <Text style={styles.activeChipText}>
//                     {selectedClass
//                       ? `🏫 ${selectedClass.name}`
//                       : `🎓 ${selectedStudent?.name}`}
//                   </Text>
//                   <TouchableOpacity
//                     onPress={() => {
//                       setSelectedClass(null);
//                       setSelectedStudent(null);
//                     }}
//                   >
//                     <Text style={styles.activeChipClear}>  ✕ Clear</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}

//             {/* ── Report Content ── */}
//             {!showReport && (
//               <View style={styles.promptCard}>
//                 <Text style={styles.promptIcon}>🔍</Text>
//                 <Text style={styles.promptTitle}>Select a Filter</Text>
//                 <Text style={styles.promptSubtitle}>
//                   Choose a class or student above to view their detailed attendance report
//                 </Text>

//                 {/* Legend */}
//                 <View style={styles.legendRow}>
//                   {[
//                     { color: COLORS.success, label: 'Excellent  ≥85%' },
//                     { color: COLORS.warning, label: 'Average  65–84%' },
//                     { color: COLORS.danger,  label: 'Low  <65%' },
//                   ].map((l) => (
//                     <View key={l.label} style={styles.legendItem}>
//                       <View style={[styles.legendDot, { backgroundColor: l.color }]} />
//                       <Text style={styles.legendText}>{l.label}</Text>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {loadingReport && showReport && (
//               <View style={styles.reportLoadingCard}>
//                 <ActivityIndicator size="large" color={COLORS.primary} />
//                 <Text style={styles.reportLoadingCardText}>Generating report...</Text>
//               </View>
//             )}

//             {!loadingReport && selectedClass && (
//               <ClassReportCard
//                 classData={selectedClass}
//                 reportData={reportData}
//                 loadingReport={loadingReport}
//               />
//             )}

//             {!loadingReport && selectedStudent && studentReport && (
//               <StudentReportCard
//                 student={selectedStudent}
//                 classData={studentReport.studentClass}
//                 presentDays={studentReport.presentDays}
//                 totalDays={studentReport.totalDays}
//               />
//             )}

//             <View style={{ height: 40 }} />
//           </>
//         )}
//       </ScrollView>

//       {/* ── Dropdowns ── */}
//       <DropdownModal
//         visible={showClassDD}
//         title="Select Class"
//         items={classes}
//         selectedId={selectedClass?.id}
//         onSelect={(item) => setSelectedClass(item)}
//         onClose={() => setShowClassDD(false)}
//         emptyText="No classes found"
//       />
//       <DropdownModal
//         visible={showStudentDD}
//         title="Select Student"
//         items={students}
//         selectedId={selectedStudent?.id}
//         onSelect={(item) => setSelectedStudent(item)}
//         onClose={() => setShowStudentDD(false)}
//         emptyText="No students found"
//       />
//     </View>
//   );
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },

//   // ── Header
//   header: {
//     backgroundColor: COLORS.primary,
//     paddingTop: 52,
//     paddingHorizontal: 20,
//     paddingBottom: 22,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//   },
//   headerTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#FFFFFF',
//     letterSpacing: -0.3,
//   },
//   headerSubtitle: {
//     fontSize: 13,
//     color: 'rgba(255,255,255,0.70)',
//     marginTop: 2,
//   },
//   headerIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 16,
//     backgroundColor: 'rgba(255,255,255,0.18)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerIconText: { fontSize: 22 },

//   // ── Scroll
//   scrollView: { flex: 1 },
//   scrollContent: {
//     paddingHorizontal: 18,
//     paddingTop: 24,
//   },

//   // ── Section title
//   sectionTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: COLORS.text,
//     marginBottom: 14,
//     marginTop: 4,
//   },

//   // ── Full loader
//   fullLoader: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 80,
//     gap: 14,
//   },
//   fullLoaderText: {
//     fontSize: 15,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//   },

//   // ── Summary cards
//   summaryGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 28,
//   },
//   summaryCard: {
//     flex: 1,
//     minWidth: '45%',
//     backgroundColor: COLORS.card,
//     borderRadius: 18,
//     padding: 16,
//     borderTopWidth: 4,
//     alignItems: 'flex-start',
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   summaryIconBox: {
//     width: 38,
//     height: 38,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 10,
//   },
//   summaryIcon: { fontSize: 18 },
//   summaryValue: {
//     fontSize: 26,
//     fontWeight: '800',
//     letterSpacing: -0.5,
//     marginBottom: 3,
//   },
//   summaryLabel: {
//     fontSize: 11,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//     letterSpacing: 0.1,
//   },

//   // ── Filters
//   filterRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   filterBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.card,
//     borderRadius: 14,
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     gap: 6,
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   filterBtnActive: {
//     borderColor: COLORS.primary,
//     backgroundColor: COLORS.primaryLight,
//   },
//   filterBtnIcon: { fontSize: 14 },
//   filterBtnText: {
//     flex: 1,
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     fontWeight: '600',
//   },
//   filterBtnTextActive: { color: COLORS.primary },
//   filterBtnArrow: {
//     fontSize: 10,
//     color: COLORS.textLight,
//   },

//   // Active filter chip
//   activeFilterRow: {
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   activeChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.primaryLight,
//     borderRadius: 20,
//     paddingHorizontal: 14,
//     paddingVertical: 6,
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//   },
//   activeChipText: {
//     fontSize: 13,
//     color: COLORS.primary,
//     fontWeight: '600',
//   },
//   activeChipClear: {
//     fontSize: 13,
//     color: COLORS.danger,
//     fontWeight: '600',
//   },

//   // ── Prompt card (no filter selected)
//   promptCard: {
//     backgroundColor: COLORS.card,
//     borderRadius: 20,
//     padding: 28,
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   promptIcon: { fontSize: 44, marginBottom: 14 },
//   promptTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: COLORS.text,
//     marginBottom: 8,
//   },
//   promptSubtitle: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 24,
//   },
//   legendRow: {
//     flexDirection: 'row',
//     gap: 14,
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },
//   legendText: {
//     fontSize: 12,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//   },

//   // ── Report loading card
//   reportLoadingCard: {
//     backgroundColor: COLORS.card,
//     borderRadius: 20,
//     padding: 40,
//     alignItems: 'center',
//     gap: 14,
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   reportLoadingCardText: {
//     fontSize: 15,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//   },

//   // ── Report Card (shared)
//   reportCard: {
//     backgroundColor: COLORS.card,
//     borderRadius: 20,
//     overflow: 'hidden',
//     marginBottom: 20,
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.09,
//     shadowRadius: 14,
//     elevation: 5,
//   },
//   reportCardHeader: {
//     padding: 18,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   reportCardHeaderLeft: { flex: 1 },
//   reportCardTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#FFFFFF',
//     letterSpacing: -0.2,
//   },
//   reportCardSub: {
//     fontSize: 13,
//     color: 'rgba(255,255,255,0.75)',
//     marginTop: 3,
//   },
//   reportCardBadge: {
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//   },
//   reportCardPct: {
//     fontSize: 22,
//     fontWeight: '800',
//   },
//   reportCardPctLabel: {
//     fontSize: 11,
//     color: 'rgba(255,255,255,0.75)',
//     fontWeight: '600',
//     marginTop: 1,
//   },

//   // Meta row
//   reportMetaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 18,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   reportMetaItem: { flex: 1, alignItems: 'center' },
//   reportMetaNum: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: COLORS.text,
//   },
//   reportMetaLabel: {
//     fontSize: 11,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//     marginTop: 2,
//   },
//   reportMetaDivider: {
//     width: 1,
//     height: 32,
//     backgroundColor: COLORS.border,
//   },

//   // Overall bar
//   overallBarRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 18,
//     paddingTop: 16,
//     paddingBottom: 8,
//   },
//   overallBarLabel: {
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     fontWeight: '600',
//   },
//   overallBarPct: {
//     fontSize: 14,
//     fontWeight: '800',
//   },
//   barTrack: {
//     height: 8,
//     backgroundColor: COLORS.inputBg,
//     borderRadius: 4,
//     marginHorizontal: 18,
//     marginBottom: 18,
//     overflow: 'hidden',
//   },
//   barFill: {
//     height: '100%',
//     borderRadius: 4,
//   },

//   // Student list
//   studentListHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 18,
//     paddingBottom: 10,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//     paddingTop: 14,
//   },
//   studentListTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   studentListCount: {
//     fontSize: 12,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//   },

//   // Student row
//   studentRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     justifyContent: 'space-between',
//   },
//   studentRowLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     gap: 10,
//   },
//   rowIndex: {
//     width: 28,
//     height: 28,
//     borderRadius: 9,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rowIndexText: {
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   rowInfo: { flex: 1 },
//   rowName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: COLORS.text,
//   },
//   rowEmail: {
//     fontSize: 11,
//     color: COLORS.textLight,
//     marginTop: 1,
//   },
//   studentRowRight: {
//     alignItems: 'flex-end',
//     gap: 3,
//   },
//   pctBadge: {
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//   },
//   pctBadgeText: {
//     fontSize: 13,
//     fontWeight: '800',
//   },
//   pctStatus: {
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   rowDivider: {
//     height: 1,
//     backgroundColor: COLORS.border,
//     marginHorizontal: 18,
//   },

//   // Report empty / loading (inside card)
//   reportLoading: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 24,
//     gap: 10,
//   },
//   reportLoadingText: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//   },
//   reportEmpty: {
//     alignItems: 'center',
//     paddingVertical: 28,
//   },
//   reportEmptyIcon: { fontSize: 32, marginBottom: 10 },
//   reportEmptyText: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//   },

//   // Student detail card extras
//   statusBanner: {
//     marginHorizontal: 18,
//     marginBottom: 14,
//     borderRadius: 12,
//     padding: 12,
//   },
//   statusBannerText: {
//     fontSize: 13,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   studentDetailRow: {
//     paddingHorizontal: 18,
//     paddingBottom: 18,
//     gap: 8,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   detailIcon: { fontSize: 14 },
//   detailText: {
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//   },

//   // ── Dropdown Modal
//   dropdownOverlay: {
//     flex: 1,
//     backgroundColor: COLORS.modalOverlay,
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   dropdownContainer: {
//     backgroundColor: COLORS.card,
//     borderRadius: 22,
//     paddingBottom: 16,
//     overflow: 'hidden',
//   },
//   dropdownHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 18,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   dropdownTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   dropdownClose: {
//     width: 30,
//     height: 30,
//     borderRadius: 9,
//     backgroundColor: COLORS.inputBg,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   dropdownCloseText: {
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     fontWeight: '700',
//   },
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 18,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   dropdownItemActive: {
//     backgroundColor: COLORS.primaryLight,
//   },
//   dropdownItemText: {
//     fontSize: 15,
//     color: COLORS.text,
//     fontWeight: '500',
//     flex: 1,
//   },
//   dropdownItemTextActive: {
//     color: COLORS.primary,
//     fontWeight: '700',
//   },
//   dropdownCheck: {
//     fontSize: 16,
//     color: COLORS.primary,
//     fontWeight: '700',
//     marginLeft: 8,
//   },
//   dropdownEmpty: {
//     textAlign: 'center',
//     color: COLORS.textLight,
//     fontSize: 14,
//     paddingVertical: 20,
//   },
// });

// export default ReportsScreen;















// src/screens/admin/ReportsScreen.js
// FULL REPLACEMENT — fixes fetch logic + adds defaulter list with PDF export

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { collection, getDocs, query, where, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { db, auth } from '../../services/firebase/config';
import emailjs from '@emailjs/react-native';

// ─── EmailJS config ───────────────────────────────────────────────────────────
const EJ_SERVICE  = 'service_ls6msx7';
const EJ_TEMPLATE = 'template_evyrexp';
const EJ_KEY      = 'Jz3qARWMJFbnm8zTT';

// WHY removed init(): @emailjs/react-native handles key via send() directly
// init() at module level causes conflicts in React Native bundler

const COLORS = {
  primary: '#4F46E5', primaryLight: '#EEF2FF',
  success: '#10B981', successLight: '#D1FAE5',
  danger:  '#EF4444', dangerLight:  '#FEF2F2',
  warning: '#F59E0B', warningLight: '#FEF3C7',
  purple:  '#7C3AED', purpleLight:  '#F3E8FF',
  background: '#F8F9FE', card: '#FFFFFF',
  text: '#1E1B4B', textSecondary: '#6B7280', textLight: '#9CA3AF',
  border: '#E5E7EB',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (p, t) => (t === 0 ? null : Math.round((p / t) * 100));

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
});

const todayISO = () => new Date().toISOString().split('T')[0];

const monthAgoISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
};

// ─── Date Picker Row ──────────────────────────────────────────────────────────
// Simple text input for dates (YYYY-MM-DD) — works without any native picker
const DateInput = ({ label, value, onChange }) => (
  <View style={s.dateInputWrap}>
    <Text style={s.dateInputLabel}>{label}</Text>
    <View style={s.dateInputBox}>
      <Text style={s.dateInputIcon}>📅</Text>
      <TextInput
        style={s.dateInputField}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.textLight}
        keyboardType="numeric"
        maxLength={10}
      />
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [classes,       setClasses]       = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassDD,   setShowClassDD]   = useState(false);
  const [fromDate,      setFromDate]      = useState(monthAgoISO());
  const [toDate,        setToDate]        = useState(todayISO());
  const [threshold,     setThreshold]     = useState('75');
  const [calculating,   setCalculating]   = useState(false);
  const [defaulters,    setDefaulters]    = useState(null); // null = not yet calculated
  const [exporting,     setExporting]     = useState(false);
  const [publishing,    setPublishing]    = useState(false);
  // true while writing to Firestore during publish

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  // controls the publish confirmation modal

  const [sendingEmails, setSendingEmails] = useState(false);
  // true while emails are being sent to parents

  const [emailResult,   setEmailResult]   = useState(null);
  // { sent, failed } — result after sending emails

  const [view,          setView]          = useState('main');
  // 'main' = defaulter calculator, 'published' = published lists screen

  const [publishedLists, setPublishedLists] = useState([]);
  // all published defaulter docs from Firestore

  const [loadingPublished, setLoadingPublished] = useState(false);

  const [selectedPublished, setSelectedPublished] = useState(null);
  // the published doc currently being viewed in detail

  // ── Load classes ────────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const list = snap.docs
        .map(d => ({ id: d.id, name: d.data().className ?? d.data().name ?? 'Unnamed', students: d.data().students ?? [] }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setClasses(list);
    } catch (e) {
      console.error('loadClasses error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  const onRefresh = () => { setRefreshing(true); loadClasses(); };

  // ── Calculate defaulters ────────────────────────────────────────────────────
  const calculateDefaulters = async () => {
    if (!selectedClass) { Alert.alert('Select Class', 'Please select a class first.'); return; }
    if (!fromDate || !toDate) { Alert.alert('Select Dates', 'Please enter both from and to dates.'); return; }
    if (fromDate > toDate) { Alert.alert('Invalid Range', 'From date must be before To date.'); return; }

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
      Alert.alert('Invalid Threshold', 'Enter a number between 0 and 100.');
      return;
    }

    setCalculating(true);
    setDefaulters(null);

    try {
      const studentUids = selectedClass.students ?? [];
      if (studentUids.length === 0) {
        setDefaulters([]);
        setCalculating(false);
        return;
      }

      // ── Fetch student names + parent emails ──────────────────────────────
      // WHY also fetch parent_email here: we need it for EmailJS sending
      // nameMap stores both name and parent_email per student uid
      const nameMap = {};
      await Promise.all(studentUids.map(async (uid) => {
        try {
          const uSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
          if (!uSnap.empty) {
            const d = uSnap.docs[0].data();
            nameMap[uid] = {
              name:         d.full_name ?? d.name ?? uid,
              parent_email: d.parent_email ?? '',
              batch:        d.batch ?? '',
              roll_number:  d.roll_number ?? '',
              // WHY fetch batch here: practical sessions are batch-specific
              // a batch B student should only count batch B practical sessions
              // we already fetch this doc for name/email — no extra Firebase call
            };
          } else {
            nameMap[uid] = { name: uid, parent_email: '', batch: '' };
          }
        } catch {
          nameMap[uid] = { name: uid, parent_email: '', batch: '' };
        }
      }));

      // ── Fetch all attendance sessions for this class in date range ───────
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('classId', '==', selectedClass.id))
      );

      // Filter by date range
      const sessions = attSnap.docs
        .map(d => d.data())
        .filter(d => d.date >= fromDate && d.date <= toDate);

      // Separate lecture and practical sessions
      const lectureSessions   = sessions.filter(s => (s.sessionType ?? 'lecture') === 'lecture');
      const practicalSessions = sessions.filter(s => s.sessionType === 'practical');

      const totalLectures   = lectureSessions.length;
      const totalPracticals = practicalSessions.length;

      // ── Build per-student stats ──────────────────────────────────────────
      const results = studentUids.map(uid => {
        const studentBatch = nameMap[uid]?.batch ?? '';
        // WHY read batch here: each student belongs to A, B, or C
        // practical sessions are only for one batch at a time
        // so we must filter practical sessions by this student's batch

        let lecturePresent = 0;
        lectureSessions.forEach(session => {
          const record = (session.records ?? []).find(r => r.studentId === uid);
          if (record && record.status === 'present') lecturePresent++;
        });

        // Filter practical sessions to only those meant for this student's batch
        // WHY: a batch B student should not be counted against batch A or C sessions
        // session.batch is '' for old sessions (treated as lecture) — already filtered above
        const myPracticalSessions = practicalSessions.filter(
          s => (s.batch ?? '').toUpperCase() === studentBatch.toUpperCase()
        );
        const myTotalPracticals = myPracticalSessions.length;

        let practicalPresent = 0;
        myPracticalSessions.forEach(session => {
          const record = (session.records ?? []).find(r => r.studentId === uid);
          if (record && record.status === 'present') practicalPresent++;
        });

        const lecturePct   = pct(lecturePresent,   totalLectures);
        const practicalPct = pct(practicalPresent, myTotalPracticals);
        // WHY myTotalPracticals not totalPracticals:
        // denominator must be sessions for THIS student's batch only

        let overallPct;
        if (lecturePct !== null && practicalPct !== null) {
          overallPct = Math.round((lecturePct + practicalPct) / 2);
        } else if (lecturePct !== null) {
          overallPct = lecturePct;
        } else if (practicalPct !== null) {
          overallPct = practicalPct;
        } else {
          overallPct = null;
        }

        // nameMap[uid] is now an object { name, parent_email }
        const studentInfo = nameMap[uid] ?? { name: uid, parent_email: '' };

        return {
          uid,
          name:            studentInfo.name,
          parent_email:    studentInfo.parent_email,
          batch:           studentInfo.batch ?? '',
          roll_number:     studentInfo.roll_number ?? '',
          lecturePresent,
          totalLectures,
          lecturePct,
          practicalPresent,
          totalPracticals: myTotalPracticals,
          // WHY myTotalPracticals: each student has their own practical session count
          // based on their batch — not the same for everyone in the class
          practicalPct,
          overallPct,
          isDefaulter:     overallPct !== null && overallPct < thresholdNum,
          noData:          overallPct === null,
        };
      });

      // Sort defaulters by roll number numerically
      const defaulterList = results
        .filter(s => s.isDefaulter)
        .sort((a, b) => {
          const numA = parseInt((a.roll_number ?? '').replace(/\D/g, '') || '0');
          const numB = parseInt((b.roll_number ?? '').replace(/\D/g, '') || '0');
          return numA - numB;
        });

      setDefaulters(defaulterList);

    } catch (e) {
      console.error('calculateDefaulters error:', e);
      Alert.alert('Error', 'Failed to calculate. Check internet and try again.');
    } finally {
      setCalculating(false);
    }
  };

  // ── Generate + export PDF ───────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!defaulters || defaulters.length === 0) return;
    setExporting(true);
    try {
      const rows = defaulters.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
          <td>${i + 1}</td>
          <td>${s.name}</td>
          <td>${s.lecturePct !== null ? s.lecturePct + '%' : '—'} (${s.lecturePresent}/${s.totalLectures})</td>
          <td>${s.practicalPct !== null ? s.practicalPct + '%' : '—'} (${s.practicalPresent}/${s.totalPracticals})</td>
          <td style="color:#EF4444;font-weight:bold">${s.overallPct}%</td>
        </tr>
      `).join('');

      const html = `
        <html><head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1E1B4B; }
          h1   { font-size: 24px; color: #4F46E5; margin-bottom: 4px; }
          .sub { font-size: 13px; color: #6B7280; margin-bottom: 20px; }
          .info-row { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
          .info-box { background: #EEF2FF; border-radius: 8px; padding: 10px 16px; }
          .info-box .val { font-size: 16px; font-weight: bold; color: #4F46E5; }
          .info-box .lbl { font-size: 11px; color: #6B7280; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #4F46E5; color: white; padding: 10px 12px; text-align: left; }
          td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; }
          .footer { margin-top: 24px; font-size: 11px; color: #9CA3AF; text-align: center; }
        </style>
        </head><body>
        <h1>SAAPT — Defaulter List</h1>
        <div class="sub">Generated on ${fmtDate(todayISO())}</div>
        <div class="info-row">
          <div class="info-box"><div class="val">${selectedClass?.name}</div><div class="lbl">Class</div></div>
          <div class="info-box"><div class="val">${fmtDate(fromDate)} → ${fmtDate(toDate)}</div><div class="lbl">Date Range</div></div>
          <div class="info-box"><div class="val">Below ${threshold}%</div><div class="lbl">Threshold</div></div>
          <div class="info-box"><div class="val" style="color:#EF4444">${defaulters.length}</div><div class="lbl">Defaulters</div></div>
        </div>
        <table>
          <thead><tr>
            <th>#</th><th>Student Name</th>
            <th>Lectures</th><th>Practicals</th><th>Overall</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">SAAPT Attendance Management System</div>
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Defaulter List',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      console.error('exportPDF error:', e);
      Alert.alert('Export Failed', 'Could not generate PDF. Try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Publish defaulter list to Firestore ────────────────────────────────────
  // WHY setDoc with classId as doc ID: if admin publishes again for same class
  // it automatically REPLACES the old list — no duplicates, no orphans
  const handlePublish = async () => {
    if (!defaulters || defaulters.length === 0) return;
    setPublishing(true);
    try {
      const publishDoc = {
        classId:     selectedClass.id,
        className:   selectedClass.name,
        fromDate,
        toDate,
        threshold,
        publishedAt: serverTimestamp(),
        publishedBy: auth.currentUser?.uid ?? '',
        students:    defaulters.map(s => ({
          uid:          s.uid,
          name:         s.name,
          lecturePct:   s.lecturePct,
          practicalPct: s.practicalPct,
          overallPct:   s.overallPct,
        })),
      };

      // setDoc with classId as document ID
      // WHY: same class → same doc ID → old list gets replaced automatically
      await setDoc(doc(db, 'published_defaulters', selectedClass.id), publishDoc);
      setPublishing(false);
      setShowPublishConfirm(true);
      // show confirmation modal with "Send Emails" option
    } catch(e) {
      console.error('publish error:', e);
      Alert.alert('Error', 'Failed to publish. Try again.');
      setPublishing(false);
    }
  };

  // ── Send emails to parents via EmailJS ────────────────────────────────────
  // WHY EmailJS: works directly from React Native, no backend needed
  // Free tier: 200 emails/month. After limit emails just stop — no charge.
  const handleSendEmails = async () => {
    setSendingEmails(true);
    let sent = 0;
    let failed = 0;

    for (const student of defaulters) {
      // Skip if no parent email in database
      if (!student.parent_email) { failed++; continue; }

      try {
        await emailjs.send(
          EJ_SERVICE,
          EJ_TEMPLATE,
          {
            parent_email:  student.parent_email,
            student_name:  student.name,
            class_name:    selectedClass.name,
            overall_pct:   String(student.overallPct ?? '—'),
            lecture_pct:   String(student.lecturePct  !== null ? student.lecturePct  : '—'),
            practical_pct: String(student.practicalPct !== null ? student.practicalPct : '—'),
            from_date:     fmtDate(fromDate),
            to_date:       fmtDate(toDate),
            threshold:     String(threshold),
          },
          { publicKey: EJ_KEY }
          // WHY object format: @emailjs/react-native v4+ requires { publicKey: '...' }
          // not just the string directly — this is different from the web SDK
        );
        sent++;
      } catch(e) {
        failed++;
        console.error(`Email failed for ${student.name}:`, JSON.stringify(e));
        // WHY JSON.stringify: emailjs errors are objects, e.message alone may be empty
        // Full object shows the actual HTTP error code and reason from EmailJS server
      }
    }

    setSendingEmails(false);
    setEmailResult({ sent, failed });
  };

  // ── Load all published defaulter lists ────────────────────────────────────
  const loadPublishedLists = async () => {
    setLoadingPublished(true);
    try {
      const snap = await getDocs(collection(db, 'published_defaulters'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          // sort by publishedAt descending (newest first)
          const aTime = a.publishedAt?.toDate?.() ?? new Date(0);
          const bTime = b.publishedAt?.toDate?.() ?? new Date(0);
          return bTime - aTime;
        });
      setPublishedLists(list);
    } catch(e) {
      console.error('loadPublishedLists error:', e);
    } finally {
      setLoadingPublished(false);
    }
  };

  // ── Export PDF for a published list ──────────────────────────────────────
  const exportPublishedPDF = async (pub) => {
    try {
      const rows = pub.students.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
          <td>${i + 1}</td>
          <td>${s.name}</td>
          <td>${s.lecturePct !== null ? s.lecturePct + '%' : '—'}</td>
          <td>${s.practicalPct !== null ? s.practicalPct + '%' : '—'}</td>
          <td style="color:#EF4444;font-weight:bold">${s.overallPct}%</td>
        </tr>
      `).join('');

      const html = `
        <html><head><meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1E1B4B; }
          h1   { font-size: 24px; color: #4F46E5; margin-bottom: 4px; }
          .sub { font-size: 13px; color: #6B7280; margin-bottom: 20px; }
          .info-row { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
          .info-box { background: #EEF2FF; border-radius: 8px; padding: 10px 16px; }
          .info-box .val { font-size: 16px; font-weight: bold; color: #4F46E5; }
          .info-box .lbl { font-size: 11px; color: #6B7280; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #4F46E5; color: white; padding: 10px 12px; text-align: left; }
          td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; }
          .footer { margin-top: 24px; font-size: 11px; color: #9CA3AF; text-align: center; }
        </style>
        </head><body>
        <h1>SAAPT — Published Defaulter List</h1>
        <div class="sub">Published on ${pub.publishedAt?.toDate
          ? fmtDate(pub.publishedAt.toDate().toISOString().split('T')[0])
          : '—'}</div>
        <div class="info-row">
          <div class="info-box"><div class="val">${pub.className}</div><div class="lbl">Class</div></div>
          <div class="info-box"><div class="val">${fmtDate(pub.fromDate)} → ${fmtDate(pub.toDate)}</div><div class="lbl">Date Range</div></div>
          <div class="info-box"><div class="val">Below ${pub.threshold}%</div><div class="lbl">Threshold</div></div>
          <div class="info-box"><div class="val" style="color:#EF4444">${pub.students.length}</div><div class="lbl">Defaulters</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Lectures</th><th>Practicals</th><th>Overall</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">SAAPT Attendance Management System</div>
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Defaulter List',
        UTI: 'com.adobe.pdf',
      });
    } catch(e) {
      Alert.alert('Export Failed', 'Could not generate PDF.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={s.loadingTxt}>Loading...</Text>
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: PUBLISHED LIST DETAIL
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'publishedDetail' && selectedPublished) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => { setView('published'); setSelectedPublished(null); }}
            activeOpacity={0.8}
          >
            <Text style={s.backBtnTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={s.headerTitle}>{selectedPublished.className}</Text>
            <Text style={s.headerSub}>
              Published · {selectedPublished.publishedAt?.toDate
                ? fmtDate(selectedPublished.publishedAt.toDate().toISOString().split('T')[0])
                : '—'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => exportPublishedPDF(selectedPublished)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#4F46E5',
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 20,
              elevation: 5,
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>⬇</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.body}>
            {/* Info strip */}
            <View style={s.pubInfoStrip}>
              <View style={s.pubInfoItem}>
                <Text style={s.pubInfoVal}>{selectedPublished.students.length}</Text>
                <Text style={s.pubInfoLbl}>Defaulters</Text>
              </View>
              <View style={s.pubInfoDiv} />
              <View style={s.pubInfoItem}>
                <Text style={s.pubInfoVal}>Below {selectedPublished.threshold}%</Text>
                <Text style={s.pubInfoLbl}>Threshold</Text>
              </View>
              <View style={s.pubInfoDiv} />
              <View style={s.pubInfoItem}>
                <Text style={s.pubInfoVal} numberOfLines={1}>
                  {fmtDate(selectedPublished.fromDate)}
                </Text>
                <Text style={s.pubInfoLbl}>From</Text>
              </View>
            </View>

            {/* Table */}
            <View style={s.card}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderTxt, {flex:0.4}]}>#</Text>
                <Text style={[s.tableHeaderTxt, {flex:2}]}>Name</Text>
                <Text style={[s.tableHeaderTxt, {flex:1, textAlign:'center'}]}>📖 Lec</Text>
                <Text style={[s.tableHeaderTxt, {flex:1, textAlign:'center'}]}>🔬 Prac</Text>
                <Text style={[s.tableHeaderTxt, {flex:1, textAlign:'center'}]}>Overall</Text>
              </View>
              {selectedPublished.students.map((student, i) => (
                <View key={student.uid} style={[s.tableRow, i%2===1 && s.tableRowAlt]}>
                  <Text style={[s.tableCell, {flex:0.4, color:COLORS.textLight}]}>{i+1}</Text>
                  <Text style={[s.tableCell, {flex:2}]} numberOfLines={1}>{student.name}</Text>
                  <Text style={[s.tableCell, {flex:1, textAlign:'center', color:COLORS.primary}]}>
                    {student.lecturePct !== null ? `${student.lecturePct}%` : '—'}
                  </Text>
                  <Text style={[s.tableCell, {flex:1, textAlign:'center', color:COLORS.purple}]}>
                    {student.practicalPct !== null ? `${student.practicalPct}%` : '—'}
                  </Text>
                  <View style={[s.tableCellBadge, {flex:1}]}>
                    <View style={s.defaulterBadge}>
                      <Text style={s.defaulterBadgeTxt}>{student.overallPct}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View style={{height:30}} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: PUBLISHED LISTS
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'published') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setView('main')}
            activeOpacity={0.8}
          >
            <Text style={s.backBtnTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={s.headerTitle}>📋 Published Lists</Text>
            <Text style={s.headerSub}>All published defaulter lists</Text>
          </View>
        </View>

        {loadingPublished ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={s.loadingTxt}>Loading...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.body}>
              {publishedLists.length === 0 ? (
                <View style={[s.card, {alignItems:'center', paddingVertical:48}]}>
                  <Text style={{fontSize:40, marginBottom:12}}>📋</Text>
                  <Text style={{fontSize:16, fontWeight:'700', color:COLORS.text, marginBottom:6}}>
                    No Published Lists Yet
                  </Text>
                  <Text style={{fontSize:13, color:COLORS.textSecondary, textAlign:'center'}}>
                    Calculate and publish a defaulter list to see it here.
                  </Text>
                </View>
              ) : (
                publishedLists.map(pub => (
                  <TouchableOpacity
                    key={pub.id}
                    style={s.pubCard}
                    onPress={() => { setSelectedPublished(pub); setView('publishedDetail'); }}
                    activeOpacity={0.82}
                  >
                    <View style={s.pubCardLeft}>
                      <Text style={s.pubCardClass}>{pub.className}</Text>
                      <Text style={s.pubCardDate}>
                        {fmtDate(pub.fromDate)} → {fmtDate(pub.toDate)}
                      </Text>
                      <Text style={s.pubCardThreshold}>Below {pub.threshold}%</Text>
                    </View>
                    <View style={s.pubCardRight}>
                      <View style={s.pubCardBadge}>
                        <Text style={s.pubCardBadgeNum}>{pub.students.length}</Text>
                        <Text style={s.pubCardBadgeLbl}>Defaulters</Text>
                      </View>
                      <Text style={s.pubCardArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
              <View style={{height:30}} />
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📊 Reports & Defaulters</Text>
        <Text style={s.headerSub}>Calculate defaulter list by class and date range</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={s.body}>

          {/* Published Lists button */}
          <TouchableOpacity
            style={s.pubListsBtn}
            onPress={() => { setView('published'); loadPublishedLists(); }}
            activeOpacity={0.85}
          >
            <Text style={s.pubListsBtnTxt}>📋 View Published Defaulter Lists</Text>
            <Text style={s.pubListsBtnArrow}>›</Text>
          </TouchableOpacity>

          {/* ── Filter Card ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>🔧 Filter Settings</Text>

            {/* Class selector */}
            <Text style={s.fieldLabel}>Class</Text>
            <TouchableOpacity
              style={[s.selectBtn, selectedClass && s.selectBtnActive]}
              onPress={() => setShowClassDD(true)}
              activeOpacity={0.8}
            >
              <Text style={[s.selectBtnTxt, selectedClass && s.selectBtnTxtActive]}>
                🏫  {selectedClass ? selectedClass.name : 'Select a class'}
              </Text>
              <Text style={s.selectBtnArrow}>▼</Text>
            </TouchableOpacity>

            {/* Date range */}
            <View style={s.dateRow}>
              <View style={{ flex: 1 }}>
                <DateInput label="From Date" value={fromDate} onChange={setFromDate} />
              </View>
              <View style={{ flex: 1 }}>
                <DateInput label="To Date"   value={toDate}   onChange={setToDate}   />
              </View>
            </View>

            {/* Threshold */}
            <Text style={s.fieldLabel}>Threshold % (students below this = defaulter)</Text>
            <View style={s.thresholdRow}>
              {['60','65','70','75','80','85'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.thresholdChip, threshold === t && s.thresholdChipActive]}
                  onPress={() => setThreshold(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.thresholdChipTxt, threshold === t && s.thresholdChipTxtActive]}>
                    {t}%
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={s.thresholdCustomBox}>
                <TextInput
                  style={s.thresholdCustomInput}
                  value={threshold}
                  onChangeText={setThreshold}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="Custom"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            {/* Calculate button */}
            <TouchableOpacity
              style={[s.calcBtn, calculating && s.calcBtnDisabled]}
              onPress={calculateDefaulters}
              disabled={calculating}
              activeOpacity={0.85}
            >
              {calculating
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.calcBtnTxt}>Calculate Defaulters</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Results ── */}
          {defaulters !== null && (
            <View style={s.card}>

              {/* Summary */}
              <View style={{marginBottom:12}}>
                <Text style={s.cardTitle}>
                  {defaulters.length === 0 ? '✅ No Defaulters' : `⚠️ ${defaulters.length} Defaulter${defaulters.length > 1 ? 's' : ''}`}
                </Text>
                <Text style={s.resultSub}>
                  {selectedClass?.name}  ·  {fmtDate(fromDate)} → {fmtDate(toDate)}  ·  Below {threshold}%
                </Text>

                {defaulters.length > 0 && (
                <View style={{flexDirection:'row', gap:8, marginTop:0, marginBottom:12}}>
                    <TouchableOpacity
                      style={[s.actionBtnSmall, {backgroundColor:COLORS.primary}, exporting && s.pdfBtnDisabled]}
                      onPress={exportPDF}
                      disabled={exporting}
                      activeOpacity={0.8}
                    >
                      {exporting
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={s.actionBtnSmallTxt}>⬇ PDF</Text>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.actionBtnSmall, {backgroundColor:COLORS.success}, publishing && s.pdfBtnDisabled]}
                      onPress={handlePublish}
                      disabled={publishing}
                      activeOpacity={0.8}
                    >
                      {publishing
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={s.actionBtnSmallTxt}>📢 Publish</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {defaulters.length === 0 ? (
                <View style={s.emptyResult}>
                  <Text style={s.emptyResultIcon}>🎉</Text>
                  <Text style={s.emptyResultTxt}>All students are above {threshold}% attendance</Text>
                </View>
              ) : (
                <>
                  {/* Column headers */}
                  <View style={s.tableHeader}>
                    <Text style={[s.tableHeaderTxt, { flex: 0.4 }]}>#</Text>
                    <Text style={[s.tableHeaderTxt, { flex: 2 }]}>Name</Text>
                    <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: 'center' }]}>📖 Lec</Text>
                    <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: 'center' }]}>🔬 Prac</Text>
                    <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: 'center' }]}>Overall</Text>
                  </View>

                  {defaulters.map((student, i) => (
                    <View key={student.uid} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                      <Text style={[s.tableCell, { flex: 0.4, color: COLORS.textLight }]} numberOfLines={1}>
                        {student.roll_number || (i + 1)}
                      </Text>
                      <Text style={[s.tableCell, { flex: 2 }]} numberOfLines={1}>{student.name}</Text>
                      <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: COLORS.primary }]}>
                        {student.lecturePct !== null ? `${student.lecturePct}%` : '—'}
                      </Text>
                      <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: COLORS.purple }]}>
                        {student.practicalPct !== null ? `${student.practicalPct}%` : '—'}
                      </Text>
                      <View style={[s.tableCellBadge, { flex: 1 }]}>
                        <View style={s.defaulterBadge}>
                          <Text style={s.defaulterBadgeTxt}>{student.overallPct}%</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* ── Publish Confirmation Modal ── */}
      <Modal
        visible={showPublishConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowPublishConfirm(false); setEmailResult(null); }}
      >
        <View style={s.modalOverlay}>
          <View style={s.pubConfirmSheet}>

            {/* Success icon */}
            <Text style={{fontSize:48, textAlign:'center', marginBottom:12}}>✅</Text>
            <Text style={s.pubConfirmTitle}>Published Successfully!</Text>
            <Text style={s.pubConfirmSub}>
              Defaulter list for {selectedClass?.name} has been published.
              {'\n'}{defaulters?.length} student{defaulters?.length !== 1 ? 's' : ''} on the list.
            </Text>

            {/* Email result if sent */}
            {emailResult && (
              <View style={s.emailResultBox}>
                <Text style={s.emailResultTxt}>
                  ✉️ {emailResult.sent} email{emailResult.sent !== 1 ? 's' : ''} sent to parents.
                  {emailResult.failed > 0 ? `\n⚠️ ${emailResult.failed} failed (no parent email on file).` : ''}
                </Text>
              </View>
            )}

            {/* Send emails button — only show if emails not sent yet */}
            {!emailResult && (
              <TouchableOpacity
                style={[s.sendEmailBtn, sendingEmails && s.pdfBtnDisabled]}
                onPress={handleSendEmails}
                disabled={sendingEmails}
                activeOpacity={0.85}
              >
                {sendingEmails
                  ? (
                    <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={s.pdfBtnTxt}>Sending emails...</Text>
                    </View>
                  )
                  : <Text style={s.pdfBtnTxt}>✉️ Send Emails to Parents</Text>
                }
              </TouchableOpacity>
            )}

            {/* Close button */}
            <TouchableOpacity
              style={s.pubConfirmCloseBtn}
              onPress={() => { setShowPublishConfirm(false); setEmailResult(null); }}
              activeOpacity={0.8}
            >
              <Text style={s.pubConfirmCloseTxt}>Done</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ── Class Dropdown Modal ── */}
      <Modal visible={showClassDD} transparent animationType="fade" onRequestClose={() => setShowClassDD(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowClassDD(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Class</Text>
            <ScrollView>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={[s.modalItem, selectedClass?.id === cls.id && s.modalItemActive]}
                  onPress={() => { setSelectedClass(cls); setShowClassDD(false); setDefaulters(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.modalItemTxt, selectedClass?.id === cls.id && s.modalItemTxtActive]}>
                    🏫  {cls.name}
                  </Text>
                  <Text style={s.modalItemCount}>{cls.students.length} students</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: COLORS.textSecondary },

  header:      { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  card:      { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  selectBtn:        { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, backgroundColor: '#F9FAFB' },
  selectBtnActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  selectBtnTxt:     { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  selectBtnTxtActive: { color: COLORS.primary },
  selectBtnArrow:   { fontSize: 10, color: COLORS.textLight },

  dateRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dateInputWrap: { flex: 1 },
  dateInputLabel:{ fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateInputBox:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 10, height: 44, backgroundColor: '#F9FAFB' },
  dateInputIcon: { fontSize: 14, marginRight: 6 },
  dateInputField:{ flex: 1, fontSize: 13, color: COLORS.text },

  thresholdRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  thresholdChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#F9FAFB' },
  thresholdChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  thresholdChipTxt:    { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  thresholdChipTxtActive: { color: COLORS.primary },
  thresholdCustomBox:  { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, height: 36, justifyContent: 'center', backgroundColor: '#F9FAFB', minWidth: 72 },
  thresholdCustomInput:{ fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },

  calcBtn:         { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  calcBtnDisabled: { backgroundColor: '#9AA5B1', elevation: 0 },
  calcBtnTxt:      { fontSize: 15, fontWeight: '800', color: '#fff' },

  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  resultSub:    { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  pdfBtn:         { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  pdfBtnDisabled: { backgroundColor: '#9AA5B1' },
  pdfBtnTxt:      { fontSize: 13, fontWeight: '800', color: '#fff' },

  emptyResult:    { alignItems: 'center', paddingVertical: 24 },
  emptyResultIcon:{ fontSize: 36, marginBottom: 8 },
  emptyResultTxt: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

  tableHeader:    { flexDirection: 'row', backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 4 },
  tableHeaderTxt: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  tableRow:       { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
  tableRowAlt:    { backgroundColor: '#F9FAFB' },
  tableCell:      { fontSize: 13, fontWeight: '600', color: COLORS.text },
  tableCellBadge: { alignItems: 'center' },
  defaulterBadge: { backgroundColor: COLORS.dangerLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  defaulterBadgeTxt: { fontSize: 12, fontWeight: '800', color: COLORS.danger },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,27,75,0.5)', justifyContent: 'center', paddingHorizontal: 24 },

  // Back button (used in published views)
  backBtn:    { width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'rgba(255,255,255,0.35)', marginRight:12 },
  backBtnTxt: { color:'#fff', fontSize:26, fontWeight:'300', lineHeight:30 },

  // Small action buttons (PDF, Publish) — clearly visible as buttons
  actionBtnSmall:    { flex:1, backgroundColor:COLORS.primary, borderRadius:12,
                       paddingVertical:11, alignItems:'center', justifyContent:'center',
                       elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2},
                       shadowOpacity:0.2, shadowRadius:4 },
  actionBtnSmallTxt: { color:'#fff', fontWeight:'800', fontSize:14 },

  // Published lists button on main screen
  pubListsBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primaryLight, borderRadius:14, padding:14, marginBottom:14, borderWidth:1.5, borderColor:COLORS.primary },
  pubListsBtnTxt:  { fontSize:14, fontWeight:'700', color:COLORS.primary },
  pubListsBtnArrow:{ fontSize:20, color:COLORS.primary },

  // Publish button (green)
  publishBtn: { backgroundColor:COLORS.success, borderRadius:10, paddingHorizontal:14, paddingVertical:8 },

  // Publish confirm modal
  pubConfirmSheet:    { backgroundColor:COLORS.card, borderRadius:24, padding:24 },
  pubConfirmTitle:    { fontSize:20, fontWeight:'800', color:COLORS.text, textAlign:'center', marginBottom:8 },
  pubConfirmSub:      { fontSize:13, color:COLORS.textSecondary, textAlign:'center', lineHeight:20, marginBottom:16 },
  emailResultBox:     { backgroundColor:COLORS.successLight, borderRadius:12, padding:12, marginBottom:16, borderWidth:1, borderColor:COLORS.success },
  emailResultTxt:     { fontSize:13, color:COLORS.success, fontWeight:'600', lineHeight:20 },
  sendEmailBtn:       { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:14, alignItems:'center', marginBottom:10 },
  pubConfirmCloseBtn: { backgroundColor:COLORS.inputBg ?? '#F3F4F6', borderRadius:14, paddingVertical:13, alignItems:'center' },
  pubConfirmCloseTxt: { fontSize:15, fontWeight:'700', color:COLORS.text },

  // Published list cards
  pubCard:         { backgroundColor:COLORS.card, borderRadius:16, padding:16, marginBottom:12, flexDirection:'row', alignItems:'center', elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  pubCardLeft:     { flex:1 },
  pubCardClass:    { fontSize:16, fontWeight:'700', color:COLORS.text, marginBottom:4 },
  pubCardDate:     { fontSize:12, color:COLORS.textSecondary, marginBottom:2 },
  pubCardThreshold:{ fontSize:11, color:COLORS.textLight },
  pubCardRight:    { alignItems:'center', flexDirection:'row', gap:8 },
  pubCardBadge:    { backgroundColor:COLORS.dangerLight, borderRadius:10, paddingHorizontal:10, paddingVertical:6, alignItems:'center' },
  pubCardBadgeNum: { fontSize:18, fontWeight:'900', color:COLORS.danger },
  pubCardBadgeLbl: { fontSize:9, color:COLORS.danger, fontWeight:'600' },
  pubCardArrow:    { fontSize:24, color:COLORS.textLight },

  // Published detail info strip
  pubInfoStrip:  { backgroundColor:COLORS.card, borderRadius:16, flexDirection:'row', alignItems:'center', justifyContent:'space-around', paddingVertical:14, marginBottom:12, elevation:2 },
  pubInfoItem:   { alignItems:'center', flex:1 },
  pubInfoVal:    { fontSize:14, fontWeight:'800', color:COLORS.text },
  pubInfoLbl:    { fontSize:10, color:COLORS.textSecondary, marginTop:2 },
  pubInfoDiv:    { width:1, height:28, backgroundColor:COLORS.border },
  modalSheet:   { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle:   { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  modalItem:    { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemActive: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 8 },
  modalItemTxt: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  modalItemTxtActive: { color: COLORS.primary, fontWeight: '700' },
  modalItemCount: { fontSize: 12, color: COLORS.textLight },
});