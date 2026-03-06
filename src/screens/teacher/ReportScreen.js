import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const THRESHOLD   = 75; // defaulter threshold %
const TABS        = ['By Subject', 'Defaulters'];

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
  background:     '#F8F9FE',
  card:           '#FFFFFF',
  text:           '#1E1B4B',
  textSecondary:  '#6B7280',
  textLight:      '#9CA3AF',
  border:         '#E5E7EB',
  shadow:         '#1E1B4B',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (present, total) =>
  total === 0 ? 0 : Math.round((present / total) * 100);

const badgeColor = (p) => ({
  bg:   p >= THRESHOLD ? COLORS.successLight : COLORS.dangerLight,
  text: p >= THRESHOLD ? COLORS.success      : COLORS.danger,
  border: p >= THRESHOLD ? COLORS.success    : COLORS.danger,
});

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || '?';

const AVATAR_PALETTE = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#ECFEFF', text: '#06B6D4' },
  { bg: '#D1FAE5', text: '#10B981' },
  { bg: '#FEF3C7', text: '#F59E0B' },
  { bg: '#FCE7F3', text: '#EC4899' },
  { bg: '#FEE2E2', text: '#EF4444' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Colored percentage badge */
const PctBadge = ({ value }) => {
  const c = badgeColor(value);
  return (
    <View style={[styles.pctBadge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.pctBadgeText, { color: c.text }]}>{value}%</Text>
    </View>
  );
};

/** Quick stats strip at top of report */
const StatsStrip = ({ totalStudents, defaulterCount, bestSubject, worstSubject }) => (
  <View style={styles.statsStrip}>
    <View style={styles.statsItem}>
      <Text style={[styles.statsVal, { color: COLORS.primary }]}>{totalStudents}</Text>
      <Text style={styles.statsLbl}>Students</Text>
    </View>
    <View style={styles.statsDivider} />
    <View style={styles.statsItem}>
      <Text style={[styles.statsVal, { color: COLORS.danger }]}>{defaulterCount}</Text>
      <Text style={styles.statsLbl}>Defaulters</Text>
    </View>
    <View style={styles.statsDivider} />
    <View style={styles.statsItem}>
      <Text style={[styles.statsVal, { color: COLORS.success }]} numberOfLines={1}>
        {bestSubject || '—'}
      </Text>
      <Text style={styles.statsLbl}>Best Subject</Text>
    </View>
    <View style={styles.statsDivider} />
    <View style={styles.statsItem}>
      <Text style={[styles.statsVal, { color: COLORS.warning }]} numberOfLines={1}>
        {worstSubject || '—'}
      </Text>
      <Text style={styles.statsLbl}>Worst Subject</Text>
    </View>
  </View>
);

/** Single student row inside an expanded subject */
const StudentAttRow = ({ student, index, present, total }) => {
  const percentage  = pct(present, total);
  const isDefaulter = percentage < THRESHOLD;
  const avatar      = AVATAR_PALETTE[index % AVATAR_PALETTE.length];

  return (
    <View style={[styles.studentRow, isDefaulter && styles.studentRowDefaulter]}>
      {/* Avatar */}
      <View style={[styles.studentAvatar, { backgroundColor: avatar.bg }]}>
        <Text style={[styles.studentAvatarTxt, { color: avatar.text }]}>
          {getInitials(student.name)}
        </Text>
      </View>

      {/* Name + sessions */}
      <View style={styles.studentMeta}>
        <View style={styles.studentNameRow}>
          {isDefaulter && <Text style={styles.warnIcon}>⚠️ </Text>}
          <Text style={[styles.studentName, isDefaulter && { color: COLORS.danger }]}>
            {student.name}
          </Text>
        </View>
        <Text style={styles.sessionText}>{present} / {total} sessions</Text>
      </View>

      <PctBadge value={percentage} />
    </View>
  );
};

/** Expandable subject section (Tab 1) */
const SubjectSection = ({ subjectName, subjectPct, students, expanded, onToggle, search }) => {
  const filtered = search
    ? students.filter((s) => s.student.name?.toLowerCase().includes(search.toLowerCase()))
    : students;

  return (
    <View style={styles.subjectSection}>
      {/* Subject header row — tap to expand/collapse */}
      <TouchableOpacity style={styles.subjectHeader} onPress={onToggle} activeOpacity={0.82}>
        <View style={styles.subjectAccent} />
        <View style={styles.subjectHeaderInner}>
          <Text style={styles.subjectName}>{subjectName}</Text>
          <View style={styles.subjectHeaderRight}>
            <PctBadge value={subjectPct} />
            <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded student list */}
      {expanded && (
        <View style={styles.studentList}>
          {filtered.length === 0 ? (
            <Text style={styles.noResultText}>No students match "{search}"</Text>
          ) : (
            filtered.map((item, i) => (
              <StudentAttRow
                key={item.student.id}
                student={item.student}
                index={i}
                present={item.present}
                total={item.total}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
};

/** Single defaulter card (Tab 2) */
const DefaulterCard = ({ student, subjects }) => (
  <View style={styles.defaulterCard}>
    <View style={styles.defaulterCardTop}>
      <View style={[styles.defaulterAvatar, { backgroundColor: COLORS.dangerLight }]}>
        <Text style={[styles.defaulterAvatarTxt, { color: COLORS.danger }]}>
          {getInitials(student.name)}
        </Text>
      </View>
      <View style={styles.defaulterMeta}>
        <Text style={styles.defaulterName}>⚠️  {student.name}</Text>
        <View style={styles.defaulterPill}>
          <Text style={styles.defaulterPillText}>
            {subjects.length} subject{subjects.length > 1 ? 's' : ''} below {THRESHOLD}%
          </Text>
        </View>
      </View>
    </View>

    {/* Subject rows */}
    <View style={styles.defaulterSubjects}>
      {subjects.map((sub) => (
        <View key={sub.subjectId} style={styles.defaulterSubRow}>
          <Text style={styles.defaulterSubName}>{sub.subjectName}</Text>
          <PctBadge value={sub.percentage} />
        </View>
      ))}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportsScreen = ({ navigation }) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [assignments,   setAssignments]   = useState([]); // class_subjects rows
  const [uniqueClasses, setUniqueClasses] = useState([]); // [{classId, className}]
  const [selectedClass, setSelectedClass] = useState(null);
  const [reportData,    setReportData]    = useState(null); // computed report
  const [activeTab,     setActiveTab]     = useState(0);    // 0=BySubject, 1=Defaulters
  const [expandedSubs,  setExpandedSubs]  = useState({});   // { subjectId: bool }
  const [search,        setSearch]        = useState('');
  const [loadingInit,   setLoadingInit]   = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — Fetch class_subjects for teacher → derive unique classes
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDocs(
        query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
      );
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAssignments(rows);

      // Unique classes
      const seen = {};
      const classes = [];
      rows.forEach((r) => {
        if (r.classId && !seen[r.classId]) {
          seen[r.classId] = true;
          classes.push({ classId: r.classId, className: r.className });
        }
      });
      classes.sort((a, b) => a.className.localeCompare(b.className));
      setUniqueClasses(classes);

      if (classes.length > 0) setSelectedClass(classes[0]);
    } catch (err) {
      console.error('fetchAssignments error:', err);
    } finally {
      setLoadingInit(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 — When class selected: build full report
  //   a) Get subjects for this class from assignments
  //   b) Fetch students from classes/{classId}
  //   c) Fetch student names from users
  //   d) Fetch all attendance docs for classId
  //   e) Compute present/total per student per subject
  // ─────────────────────────────────────────────────────────────────────────
  const buildReport = useCallback(async (classObj) => {
    if (!classObj) return;
    setLoadingReport(true);
    setReportData(null);
    setExpandedSubs({});
    setSearch('');

    try {
      const { classId } = classObj;

      // a) Subjects assigned for this class
      const subjectsForClass = assignments.filter((a) => a.classId === classId);

      // b) Students array from classes doc
      const classSnap = await getDoc(doc(db, 'classes', classId));
      const studentIds = classSnap.exists() ? (classSnap.data().students ?? []) : [];

      // c) Fetch student names from users in chunks of 30
      const studentMap = {}; // id → { id, name }
      if (studentIds.length > 0) {
        for (let i = 0; i < studentIds.length; i += 30) {
          const chunk = studentIds.slice(i, i + 30);
          const snap  = await getDocs(
            query(collection(db, 'users'), where('__name__', 'in', chunk))
          );
          snap.docs.forEach((d) => { studentMap[d.id] = { id: d.id, ...d.data() }; });
        }
      }

      // Ordered student list
      const studentList = studentIds
        .map((id) => studentMap[id] ?? { id, name: 'Unknown' });

      // d) Fetch all attendance docs for this class
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('classId', '==', classId))
      );
      const attDocs = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // e) Build per-subject stats
      // subjectReport[subjectId] = { subjectName, students: { studentId: {present, total} } }
      const subjectReport = {};

      subjectsForClass.forEach((sub) => {
        subjectReport[sub.subjectId] = {
          subjectId:   sub.subjectId,
          subjectName: sub.subjectName,
          students:    {},
        };
        // Init every student to 0/0
        studentList.forEach((s) => {
          subjectReport[sub.subjectId].students[s.id] = { present: 0, total: 0 };
        });
      });

      // Tally attendance docs
      attDocs.forEach((att) => {
        const sid = att.subjectId;
        if (!subjectReport[sid]) return; // different subject, skip

        (att.records ?? []).forEach((rec) => {
          if (!subjectReport[sid].students[rec.studentId]) {
            subjectReport[sid].students[rec.studentId] = { present: 0, total: 0 };
          }
          subjectReport[sid].students[rec.studentId].total += 1;
          if (rec.status === 'present') {
            subjectReport[sid].students[rec.studentId].present += 1;
          }
        });
      });

      // f) Compute per-subject average percentage
      const subjectSummaries = Object.values(subjectReport).map((sub) => {
        const entries = Object.entries(sub.students);
        let totalPresent = 0, totalPossible = 0;

        const studentRows = entries.map(([stuId, data]) => ({
          student: studentMap[stuId] ?? { id: stuId, name: 'Unknown' },
          present: data.present,
          total:   data.total,
        }));

        studentRows.forEach((r) => {
          totalPresent   += r.present;
          totalPossible  += r.total;
        });

        const avgPct = pct(totalPresent, totalPossible);

        return {
          subjectId:   sub.subjectId,
          subjectName: sub.subjectName,
          avgPct,
          studentRows,
          totalSessions: totalPossible / (studentList.length || 1),
        };
      });

      subjectSummaries.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

      // g) Quick stats
      const allPcts = subjectSummaries.map((s) => s.avgPct).filter((p) => p > 0);
      const bestSub  = subjectSummaries.reduce((best, s) =>
        s.avgPct > (best?.avgPct ?? -1) ? s : best, null);
      const worstSub = subjectSummaries.reduce((worst, s) =>
        s.avgPct < (worst?.avgPct ?? 101) ? s : worst, null);

      // h) Build defaulter list
      // defaulterMap: studentId → { student, failedSubjects[] }
      const defaulterMap = {};
      subjectSummaries.forEach((sub) => {
        sub.studentRows.forEach((row) => {
          const p = pct(row.present, row.total);
          if (p < THRESHOLD && row.total > 0) {
            if (!defaulterMap[row.student.id]) {
              defaulterMap[row.student.id] = { student: row.student, subjects: [] };
            }
            defaulterMap[row.student.id].subjects.push({
              subjectId:   sub.subjectId,
              subjectName: sub.subjectName,
              percentage:  p,
            });
          }
        });
      });
      const defaulters = Object.values(defaulterMap)
        .sort((a, b) => a.student.name?.localeCompare(b.student.name));

      setReportData({
        studentList,
        subjectSummaries,
        defaulters,
        bestSubject:  bestSub?.subjectName  ?? null,
        worstSubject: worstSub?.subjectName ?? null,
      });
    } catch (err) {
      console.error('buildReport error:', err);
    } finally {
      setLoadingReport(false);
    }
  }, [assignments]);

  // Rebuild report when class changes
  useEffect(() => {
    if (selectedClass && assignments.length > 0) buildReport(selectedClass);
  }, [selectedClass, assignments]);

  const onRefresh = () => { setRefreshing(true); fetchAssignments(); };

  // ── Toggle expand subject ─────────────────────────────────────────────────
  const toggleSubject = (subjectId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSubs((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSubtitle}>
              {selectedClass ? selectedClass.className : 'Select a class'}
            </Text>
          </View>
        </View>
      </View>

      {/* ══════════════════════════════
          LOADING INIT
      ══════════════════════════════ */}
      {loadingInit ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerLoaderTxt}>Loading classes…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
        >
          {/* ── Class selector pills ── */}
          {uniqueClasses.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classPillRow}
            >
              {uniqueClasses.map((c) => {
                const isActive = selectedClass?.classId === c.classId;
                return (
                  <TouchableOpacity
                    key={c.classId}
                    style={[styles.classPill, isActive && styles.classPillActive]}
                    onPress={() => setSelectedClass(c)}
                    activeOpacity={0.78}
                  >
                    <Text style={[styles.classPillText, isActive && styles.classPillTextActive]}>
                      {c.className}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ── Tabs ── */}
          <View style={styles.tabBar}>
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === i && styles.tabActive]}
                onPress={() => setActiveTab(i)}
                activeOpacity={0.82}
              >
                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                  {i === 1 && reportData?.defaulters.length > 0
                    ? `${tab}  (${reportData.defaulters.length})`
                    : tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Report loading ── */}
          {loadingReport ? (
            <View style={styles.reportLoader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerLoaderTxt}>Building report…</Text>
            </View>
          ) : !reportData ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No Report Available</Text>
              <Text style={styles.emptySubText}>Select a class above to view its report.</Text>
            </View>
          ) : (
            <>
              {/* ── Quick Stats Strip ── */}
              <StatsStrip
                totalStudents={reportData.studentList.length}
                defaulterCount={reportData.defaulters.length}
                bestSubject={reportData.bestSubject}
                worstSubject={reportData.worstSubject}
              />

              {/* ════════════════════
                  TAB 1 — By Subject
              ════════════════════ */}
              {activeTab === 0 && (
                <View style={styles.tabContent}>
                  {/* Search bar */}
                  <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search student…"
                      placeholderTextColor={COLORS.textLight}
                      value={search}
                      onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch('')}>
                        <Text style={styles.searchClear}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {reportData.subjectSummaries.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyIcon}>📋</Text>
                      <Text style={styles.emptyTitle}>No Attendance Data</Text>
                      <Text style={styles.emptySubText}>
                        No attendance has been recorded for this class yet.
                      </Text>
                    </View>
                  ) : (
                    reportData.subjectSummaries.map((sub) => (
                      <SubjectSection
                        key={sub.subjectId}
                        subjectName={sub.subjectName}
                        subjectPct={sub.avgPct}
                        students={sub.studentRows}
                        expanded={!!expandedSubs[sub.subjectId]}
                        onToggle={() => toggleSubject(sub.subjectId)}
                        search={search}
                      />
                    ))
                  )}
                </View>
              )}

              {/* ════════════════════
                  TAB 2 — Defaulters
              ════════════════════ */}
              {activeTab === 1 && (
                <View style={styles.tabContent}>
                  {reportData.defaulters.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyIcon}>🎉</Text>
                      <Text style={styles.emptyTitle}>No Defaulters!</Text>
                      <Text style={styles.emptySubText}>
                        All students in {selectedClass?.className} are above {THRESHOLD}% attendance.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.defaulterHeader}>
                        ⚠️  {reportData.defaulters.length} student{reportData.defaulters.length > 1 ? 's' : ''} below {THRESHOLD}% attendance
                      </Text>
                      {reportData.defaulters.map((d) => (
                        <DefaulterCard
                          key={d.student.id}
                          student={d.student}
                          subjects={d.subjects}
                        />
                      ))}
                    </>
                  )}
                </View>
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    backgroundColor:         COLORS.primary,
    paddingTop:              52,
    paddingHorizontal:       20,
    paddingBottom:           24,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  backBtnIcon:     { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  headerTextGroup: { flex: 1 },
  headerTitle:     { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '500' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20 },

  // Class pills
  classPillRow:  { flexDirection: 'row', gap: 10, paddingBottom: 20 },
  classPill: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, backgroundColor: COLORS.card,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  classPillActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classPillText:       { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  classPillTextActive: { color: '#FFFFFF' },

  // Tabs
  tabBar: {
    flexDirection:   'row',
    backgroundColor: COLORS.card,
    borderRadius:    14,
    padding:         4,
    marginBottom:    20,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  tab: {
    flex: 1, paddingVertical: 11,
    borderRadius: 11, alignItems: 'center',
  },
  tabActive:     { backgroundColor: COLORS.primary },
  tabText:       { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#FFFFFF' },

  // Stat strip
  statsStrip: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-around',
    paddingVertical: 16,
    marginBottom:    18,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       4,
  },
  statsItem:   { alignItems: 'center', flex: 1 },
  statsVal:    { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statsLbl:    { fontSize: 10, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  statsDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

  tabContent: {},

  // Search bar
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.card,
    borderRadius:    14,
    paddingHorizontal: 14,
    paddingVertical:   10,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     COLORS.border,
    gap:             10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, padding: 0 },
  searchClear: { fontSize: 13, color: COLORS.textLight, fontWeight: '700', padding: 4 },

  // Subject section
  subjectSection: {
    backgroundColor: COLORS.card,
    borderRadius:    16,
    marginBottom:    12,
    overflow:        'hidden',
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  subjectAccent: {
    width: 5, alignSelf: 'stretch', backgroundColor: COLORS.primary,
  },
  subjectHeaderInner: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  subjectName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  subjectHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chevron: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700' },

  // Student list inside subject
  studentList: {
    paddingHorizontal: 14,
    paddingBottom:     10,
    borderTopWidth:    1,
    borderTopColor:    COLORS.border,
    paddingTop:        6,
  },
  studentRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 10,
    gap:             12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  studentRowDefaulter: { backgroundColor: '#FFF5F5', borderRadius: 8, paddingHorizontal: 6 },
  studentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  studentAvatarTxt: { fontSize: 13, fontWeight: '700' },
  studentMeta:      { flex: 1 },
  studentNameRow:   { flexDirection: 'row', alignItems: 'center' },
  warnIcon:         { fontSize: 12 },
  studentName:      { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sessionText:      { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  noResultText:     { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingVertical: 12 },

  // Percentage badge
  pctBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1.5,
  },
  pctBadgeText: { fontSize: 12, fontWeight: '800' },

  // Defaulters tab
  defaulterHeader: {
    fontSize: 14, fontWeight: '700', color: COLORS.danger,
    marginBottom: 14,
  },
  defaulterCard: {
    backgroundColor: COLORS.card,
    borderRadius:    16,
    marginBottom:    12,
    padding:         16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  defaulterCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  defaulterAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  defaulterAvatarTxt: { fontSize: 16, fontWeight: '700' },
  defaulterMeta:      { flex: 1 },
  defaulterName:      { fontSize: 15, fontWeight: '700', color: COLORS.text },
  defaulterPill: {
    marginTop:         4,
    alignSelf:         'flex-start',
    backgroundColor:   COLORS.dangerLight,
    borderRadius:      10,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  defaulterPillText: { fontSize: 11, fontWeight: '600', color: COLORS.danger },
  defaulterSubjects: { gap: 8 },
  defaulterSubRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: 6,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
  },
  defaulterSubName: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  // Loaders
  centerLoader:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  reportLoader:    { alignItems: 'center', paddingVertical: 48, gap: 12 },
  centerLoaderTxt: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // Empty
  emptyCard: {
    backgroundColor: COLORS.card, borderRadius: 18,
    padding: 36, alignItems: 'center', marginTop: 10,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.border,
  },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default ReportsScreen;