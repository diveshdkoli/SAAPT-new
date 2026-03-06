import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../services/firebase/config';  // adjust path as needed

// ─── Color Palette (consistent with all SAAPT screens) ───────────────────────
const COLORS = {
  primary:        '#4F46E5',
  primaryLight:   '#EEF2FF',
  secondary:      '#06B6D4',
  secondaryLight: '#ECFEFF',
  success:        '#10B981',
  successLight:   '#D1FAE5',
  danger:         '#EF4444',
  dangerLight:    '#FEF2F2',
  warning:        '#F59E0B',
  warningLight:   '#FEF3C7',
  purple:         '#8B5CF6',
  purpleLight:    '#F5F3FF',
  background:     '#F8F9FE',
  card:           '#FFFFFF',
  text:           '#1E1B4B',
  textSecondary:  '#6B7280',
  textLight:      '#9CA3AF',
  border:         '#E5E7EB',
  inputBg:        '#F3F4F6',
  shadow:         '#1E1B4B',
  modalOverlay:   'rgba(30, 27, 75, 0.5)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (present, total) => {
  if (!total) return 0;
  return Math.round((present / total) * 100);
};

const pctColor = (p) => {
  if (p >= 85) return COLORS.success;
  if (p >= 65) return COLORS.warning;
  return COLORS.danger;
};

const pctBg = (p) => {
  if (p >= 85) return COLORS.successLight;
  if (p >= 65) return COLORS.warningLight;
  return COLORS.dangerLight;
};

const pctLabel = (p) => {
  if (p >= 85) return 'Excellent';
  if (p >= 65) return 'Average';
  return 'Low';
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Sub-components ───────────────────────────────────────────────────────────

/* Summary stat card */
const SummaryCard = ({ icon, value, label, color, bg }) => (
  <View style={[styles.summaryCard, { borderTopColor: color }]}>
    <View style={[styles.summaryIconBox, { backgroundColor: bg }]}>
      <Text style={styles.summaryIcon}>{icon}</Text>
    </View>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

/* Attendance bar */
const AttendanceBar = ({ percentage }) => {
  const color = pctColor(percentage);
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  );
};

/* Student row in class report */
const StudentRow = ({ student, index }) => {
  const { name, email, presentDays, totalDays } = student;
  const p     = pct(presentDays, totalDays);
  const color = pctColor(p);
  const bg    = pctBg(p);

  return (
    <View style={styles.studentRow}>
      <View style={styles.studentRowLeft}>
        <View style={[styles.rowIndex, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={[styles.rowIndexText, { color: COLORS.primary }]}>{index + 1}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{name || 'Unknown'}</Text>
          <Text style={styles.rowEmail} numberOfLines={1}>{email || ''}</Text>
        </View>
      </View>
      <View style={styles.studentRowRight}>
        <View style={[styles.pctBadge, { backgroundColor: bg }]}>
          <Text style={[styles.pctBadgeText, { color }]}>{p}%</Text>
        </View>
        <Text style={[styles.pctStatus, { color }]}>{pctLabel(p)}</Text>
      </View>
    </View>
  );
};

/* Dropdown modal */
const DropdownModal = ({ visible, title, items, selectedId, onSelect, onClose, emptyText }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownHeader}>
          <Text style={styles.dropdownTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.dropdownClose}>
            <Text style={styles.dropdownCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
          {/* None option */}
          <TouchableOpacity
            style={[styles.dropdownItem, !selectedId && styles.dropdownItemActive]}
            onPress={() => { onSelect(null); onClose(); }}
          >
            <Text style={[styles.dropdownItemText, !selectedId && styles.dropdownItemTextActive]}>
              — None (Clear)
            </Text>
            {!selectedId && <Text style={styles.dropdownCheck}>✓</Text>}
          </TouchableOpacity>

          {items.length === 0 ? (
            <Text style={styles.dropdownEmpty}>{emptyText || 'No items'}</Text>
          ) : (
            items.map((item) => {
              const active = selectedId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                    {item.name}
                  </Text>
                  {active && <Text style={styles.dropdownCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </TouchableOpacity>
  </Modal>
);

/* Class report detail card */
const ClassReportCard = ({ classData, reportData, loadingReport }) => {
  const totalStudents = reportData.length;
  const totalPresent  = reportData.reduce((a, s) => a + (s.presentDays || 0), 0);
  const totalPossible = reportData.reduce((a, s) => a + (s.totalDays   || 0), 0);
  const overallPct    = pct(totalPresent, totalPossible);
  const color         = pctColor(overallPct);

  return (
    <View style={styles.reportCard}>
      {/* Class header */}
      <View style={[styles.reportCardHeader, { backgroundColor: COLORS.primary }]}>
        <View style={styles.reportCardHeaderLeft}>
          <Text style={styles.reportCardTitle}>{classData.name}</Text>
          <Text style={styles.reportCardSub}>
            👩‍🏫 {classData.teacherName || 'No Teacher Assigned'}
          </Text>
        </View>
        <View style={styles.reportCardBadge}>
          <Text style={[styles.reportCardPct, { color: '#fff' }]}>{overallPct}%</Text>
          <Text style={styles.reportCardPctLabel}>Avg</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.reportMetaRow}>
        <View style={styles.reportMetaItem}>
          <Text style={styles.reportMetaNum}>{totalStudents}</Text>
          <Text style={styles.reportMetaLabel}>Students</Text>
        </View>
        <View style={styles.reportMetaDivider} />
        <View style={styles.reportMetaItem}>
          <Text style={styles.reportMetaNum}>{totalPresent}</Text>
          <Text style={styles.reportMetaLabel}>Present Days</Text>
        </View>
        <View style={styles.reportMetaDivider} />
        <View style={styles.reportMetaItem}>
          <Text style={[styles.reportMetaNum, { color }]}>{overallPct}%</Text>
          <Text style={styles.reportMetaLabel}>Overall</Text>
        </View>
      </View>

      {/* Overall bar */}
      <View style={styles.overallBarRow}>
        <Text style={styles.overallBarLabel}>Overall Attendance</Text>
        <Text style={[styles.overallBarPct, { color }]}>{overallPct}%</Text>
      </View>
      <AttendanceBar percentage={overallPct} />

      {/* Students list */}
      <View style={styles.studentListHeader}>
        <Text style={styles.studentListTitle}>Student Breakdown</Text>
        <Text style={styles.studentListCount}>{totalStudents} students</Text>
      </View>

      {loadingReport ? (
        <View style={styles.reportLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.reportLoadingText}>Calculating...</Text>
        </View>
      ) : reportData.length === 0 ? (
        <View style={styles.reportEmpty}>
          <Text style={styles.reportEmptyIcon}>📋</Text>
          <Text style={styles.reportEmptyText}>No attendance records found</Text>
        </View>
      ) : (
        reportData.map((student, index) => (
          <View key={student.id}>
            <StudentRow student={student} index={index} />
            {index < reportData.length - 1 && <View style={styles.rowDivider} />}
          </View>
        ))
      )}
    </View>
  );
};

/* Student report detail card */
const StudentReportCard = ({ student, classData, presentDays, totalDays }) => {
  const p     = pct(presentDays, totalDays);
  const color = pctColor(p);
  const bg    = pctBg(p);

  return (
    <View style={styles.reportCard}>
      <View style={[styles.reportCardHeader, { backgroundColor: COLORS.secondary }]}>
        <View style={styles.reportCardHeaderLeft}>
          <Text style={styles.reportCardTitle}>{student.name}</Text>
          <Text style={styles.reportCardSub}>
            🏫 {classData?.name || 'No class assigned'}
          </Text>
        </View>
        <View style={styles.reportCardBadge}>
          <Text style={[styles.reportCardPct, { color: '#fff' }]}>{p}%</Text>
          <Text style={styles.reportCardPctLabel}>{pctLabel(p)}</Text>
        </View>
      </View>

      <View style={styles.reportMetaRow}>
        <View style={styles.reportMetaItem}>
          <Text style={styles.reportMetaNum}>{totalDays}</Text>
          <Text style={styles.reportMetaLabel}>Total Days</Text>
        </View>
        <View style={styles.reportMetaDivider} />
        <View style={styles.reportMetaItem}>
          <Text style={[styles.reportMetaNum, { color: COLORS.success }]}>{presentDays}</Text>
          <Text style={styles.reportMetaLabel}>Present</Text>
        </View>
        <View style={styles.reportMetaDivider} />
        <View style={styles.reportMetaItem}>
          <Text style={[styles.reportMetaNum, { color: COLORS.danger }]}>{totalDays - presentDays}</Text>
          <Text style={styles.reportMetaLabel}>Absent</Text>
        </View>
      </View>

      <View style={styles.overallBarRow}>
        <Text style={styles.overallBarLabel}>Attendance Rate</Text>
        <Text style={[styles.overallBarPct, { color }]}>{p}%</Text>
      </View>
      <AttendanceBar percentage={p} />

      {/* Status indicator */}
      <View style={[styles.statusBanner, { backgroundColor: bg }]}>
        <Text style={[styles.statusBannerText, { color }]}>
          {p >= 85
            ? '✅ Excellent attendance — keep it up!'
            : p >= 65
            ? '⚠️ Average attendance — improvement needed'
            : '🚨 Low attendance — immediate attention required'}
        </Text>
      </View>

      {/* Student info */}
      <View style={styles.studentDetailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📧</Text>
          <Text style={styles.detailText}>{student.email || '—'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>🎓</Text>
          <Text style={styles.detailText}>{student.role || 'student'}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportsScreen = ({ navigation }) => {
  const [classes,          setClasses]          = useState([]);
  const [students,         setStudents]         = useState([]);
  const [selectedClass,    setSelectedClass]    = useState(null);
  const [selectedStudent,  setSelectedStudent]  = useState(null);
  const [classStudents,    setClassStudents]    = useState([]);
  const [reportData,       setReportData]       = useState([]);
  const [studentReport,    setStudentReport]    = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [loadingReport,    setLoadingReport]    = useState(false);
  const [refreshing,       setRefreshing]       = useState(false);
  const [showClassDD,      setShowClassDD]      = useState(false);
  const [showStudentDD,    setShowStudentDD]    = useState(false);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    overallPct: 0,
    todayPct:   0,
    totalClasses: 0,
    totalStudents: 0,
  });

  // ── Fetch base data ────────────────────────────────────────────────────────
  const fetchBaseData = async () => {
    try {
      const [classSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'classes'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'users')),
      ]);
      const classData   = classSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const allUsers    = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const studentData = allUsers.filter((u) => u.role === 'student');

      setClasses(classData);
      setStudents(studentData);
      return { classData, studentData };
    } catch (e) {
      console.error('Error fetching base data:', e);
      return { classData: [], studentData: [] };
    }
  };

  // ── Fetch summary stats ────────────────────────────────────────────────────
  const fetchSummaryStats = async (classData, studentData) => {
    try {
      const attendanceSnap = await getDocs(collection(db, 'attendance'));
      const records        = attendanceSnap.docs.map((d) => d.data());

      const total   = records.length;
      const present = records.filter((r) => r.status === 'present').length;

      const today       = todayStr();
      const todayRecs   = records.filter((r) => {
        const d = r.date?.toDate ? r.date.toDate().toISOString().slice(0, 10) : r.date;
        return d === today;
      });
      const todayTotal   = todayRecs.length;
      const todayPresent = todayRecs.filter((r) => r.status === 'present').length;

      setSummaryStats({
        overallPct:    pct(present, total),
        todayPct:      pct(todayPresent, todayTotal),
        totalClasses:  classData.length,
        totalStudents: studentData.length,
      });
    } catch (e) {
      console.error('Error fetching summary:', e);
      setSummaryStats({
        overallPct:    0,
        todayPct:      0,
        totalClasses:  classData.length,
        totalStudents: studentData.length,
      });
    }
  };

  const loadAll = async () => {
    const { classData, studentData } = await fetchBaseData();
    await fetchSummaryStats(classData, studentData);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadAll(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); loadAll(); }, []);

  // ── When class selected → fetch student attendance ─────────────────────────
  useEffect(() => {
    if (!selectedClass) {
      setReportData([]);
      setClassStudents([]);
      return;
    }
    setSelectedStudent(null);
    fetchClassReport(selectedClass);
  }, [selectedClass]);

  const fetchClassReport = async (cls) => {
    setLoadingReport(true);
    try {
      // Get students in this class
      const memberIds  = cls.students || [];
      const members    = students.filter((s) => memberIds.includes(s.id));

      if (members.length === 0) {
        setReportData([]);
        setClassStudents([]);
        setLoadingReport(false);
        return;
      }

      // Fetch attendance for this class
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('classId', '==', cls.id))
      );
      const records = attSnap.docs.map((d) => d.data());

      const result = members.map((student) => {
        const studentRecs  = records.filter((r) => r.studentId === student.id);
        const totalDays    = studentRecs.length;
        const presentDays  = studentRecs.filter((r) => r.status === 'present').length;
        return { ...student, totalDays, presentDays };
      });

      // Sort by attendance % descending
      result.sort((a, b) => pct(b.presentDays, b.totalDays) - pct(a.presentDays, a.totalDays));

      setReportData(result);
      setClassStudents(members);
    } catch (e) {
      console.error('Error fetching class report:', e);
      setReportData([]);
    } finally {
      setLoadingReport(false);
    }
  };

  // ── When student selected → fetch student attendance ──────────────────────
  useEffect(() => {
    if (!selectedStudent) {
      setStudentReport(null);
      return;
    }
    setSelectedClass(null);
    fetchStudentReport(selectedStudent);
  }, [selectedStudent]);

  const fetchStudentReport = async (student) => {
    setLoadingReport(true);
    try {
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('studentId', '==', student.id))
      );
      const records    = attSnap.docs.map((d) => d.data());
      const totalDays  = records.length;
      const presentDays = records.filter((r) => r.status === 'present').length;

      // Find their class
      const studentClass = classes.find((c) => (c.students || []).includes(student.id)) || null;

      setStudentReport({ presentDays, totalDays, studentClass });
    } catch (e) {
      console.error('Error fetching student report:', e);
      setStudentReport({ presentDays: 0, totalDays: 0, studentClass: null });
    } finally {
      setLoadingReport(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const showReport     = !!selectedClass || !!selectedStudent;
  const overallColor   = pctColor(summaryStats.overallPct);
  const todayColor     = pctColor(summaryStats.todayPct);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Reports & Analytics</Text>
            <Text style={styles.headerSubtitle}>Monitor attendance and performance</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>📊</Text>
          </View>
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
        {loading ? (
          <View style={styles.fullLoader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.fullLoaderText}>Loading reports...</Text>
          </View>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.summaryGrid}>
              <SummaryCard
                icon="📊"
                value={`${summaryStats.overallPct}%`}
                label="Overall Attendance"
                color={overallColor}
                bg={pctBg(summaryStats.overallPct)}
              />
              <SummaryCard
                icon="📅"
                value={summaryStats.todayPct > 0 ? `${summaryStats.todayPct}%` : '—'}
                label="Today's Attendance"
                color={todayColor}
                bg={pctBg(summaryStats.todayPct)}
              />
              <SummaryCard
                icon="🏫"
                value={summaryStats.totalClasses.toString()}
                label="Total Classes"
                color={COLORS.primary}
                bg={COLORS.primaryLight}
              />
              <SummaryCard
                icon="🎓"
                value={summaryStats.totalStudents.toString()}
                label="Total Students"
                color={COLORS.secondary}
                bg={COLORS.secondaryLight}
              />
            </View>

            {/* ── Filters ── */}
            <Text style={styles.sectionTitle}>Filter Report</Text>
            <View style={styles.filterRow}>
              {/* Class dropdown */}
              <TouchableOpacity
                style={[styles.filterBtn, selectedClass && styles.filterBtnActive]}
                onPress={() => setShowClassDD(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterBtnIcon}>🏫</Text>
                <Text
                  style={[styles.filterBtnText, selectedClass && styles.filterBtnTextActive]}
                  numberOfLines={1}
                >
                  {selectedClass ? selectedClass.name : 'Select Class'}
                </Text>
                <Text style={[styles.filterBtnArrow, selectedClass && { color: COLORS.primary }]}>▼</Text>
              </TouchableOpacity>

              {/* Student dropdown */}
              <TouchableOpacity
                style={[styles.filterBtn, selectedStudent && styles.filterBtnActive]}
                onPress={() => setShowStudentDD(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterBtnIcon}>🎓</Text>
                <Text
                  style={[styles.filterBtnText, selectedStudent && styles.filterBtnTextActive]}
                  numberOfLines={1}
                >
                  {selectedStudent ? selectedStudent.name : 'Select Student'}
                </Text>
                <Text style={[styles.filterBtnArrow, selectedStudent && { color: COLORS.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Active filter chip */}
            {(selectedClass || selectedStudent) && (
              <View style={styles.activeFilterRow}>
                <View style={styles.activeChip}>
                  <Text style={styles.activeChipText}>
                    {selectedClass
                      ? `🏫 ${selectedClass.name}`
                      : `🎓 ${selectedStudent?.name}`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedClass(null);
                      setSelectedStudent(null);
                    }}
                  >
                    <Text style={styles.activeChipClear}>  ✕ Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Report Content ── */}
            {!showReport && (
              <View style={styles.promptCard}>
                <Text style={styles.promptIcon}>🔍</Text>
                <Text style={styles.promptTitle}>Select a Filter</Text>
                <Text style={styles.promptSubtitle}>
                  Choose a class or student above to view their detailed attendance report
                </Text>

                {/* Legend */}
                <View style={styles.legendRow}>
                  {[
                    { color: COLORS.success, label: 'Excellent  ≥85%' },
                    { color: COLORS.warning, label: 'Average  65–84%' },
                    { color: COLORS.danger,  label: 'Low  <65%' },
                  ].map((l) => (
                    <View key={l.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendText}>{l.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {loadingReport && showReport && (
              <View style={styles.reportLoadingCard}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.reportLoadingCardText}>Generating report...</Text>
              </View>
            )}

            {!loadingReport && selectedClass && (
              <ClassReportCard
                classData={selectedClass}
                reportData={reportData}
                loadingReport={loadingReport}
              />
            )}

            {!loadingReport && selectedStudent && studentReport && (
              <StudentReportCard
                student={selectedStudent}
                classData={studentReport.studentClass}
                presentDays={studentReport.presentDays}
                totalDays={studentReport.totalDays}
              />
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* ── Dropdowns ── */}
      <DropdownModal
        visible={showClassDD}
        title="Select Class"
        items={classes}
        selectedId={selectedClass?.id}
        onSelect={(item) => setSelectedClass(item)}
        onClose={() => setShowClassDD(false)}
        emptyText="No classes found"
      />
      <DropdownModal
        visible={showStudentDD}
        title="Select Student"
        items={students}
        selectedId={selectedStudent?.id}
        onSelect={(item) => setSelectedStudent(item)}
        onClose={() => setShowStudentDD(false)}
        emptyText="No students found"
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 22 },

  // ── Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  // ── Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    marginTop: 4,
  },

  // ── Full loader
  fullLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 14,
  },
  fullLoaderText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Summary cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderTopWidth: 4,
    alignItems: 'flex-start',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryIcon: { fontSize: 18 },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // ── Filters
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterBtnIcon: { fontSize: 14 },
  filterBtnText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterBtnTextActive: { color: COLORS.primary },
  filterBtnArrow: {
    fontSize: 10,
    color: COLORS.textLight,
  },

  // Active filter chip
  activeFilterRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeChipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeChipClear: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // ── Prompt card (no filter selected)
  promptCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  promptIcon: { fontSize: 44, marginBottom: 14 },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Report loading card
  reportLoadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  reportLoadingCardText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Report Card (shared)
  reportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 5,
  },
  reportCardHeader: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCardHeaderLeft: { flex: 1 },
  reportCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  reportCardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  reportCardBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reportCardPct: {
    fontSize: 22,
    fontWeight: '800',
  },
  reportCardPctLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 1,
  },

  // Meta row
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportMetaItem: { flex: 1, alignItems: 'center' },
  reportMetaNum: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  reportMetaLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  reportMetaDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },

  // Overall bar
  overallBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  overallBarLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  overallBarPct: {
    fontSize: 14,
    fontWeight: '800',
  },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 4,
    marginHorizontal: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Student list
  studentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  studentListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentListCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Student row
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  studentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  rowIndex: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIndexText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rowEmail: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  studentRowRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  pctBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pctBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pctStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 18,
  },

  // Report empty / loading (inside card)
  reportLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  reportLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  reportEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  reportEmptyIcon: { fontSize: 32, marginBottom: 10 },
  reportEmptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Student detail card extras
  statusBanner: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 12,
    padding: 12,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  studentDetailRow: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: { fontSize: 14 },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Dropdown Modal
  dropdownOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdownContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  dropdownClose: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCloseText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dropdownCheck: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  dropdownEmpty: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default ReportsScreen;