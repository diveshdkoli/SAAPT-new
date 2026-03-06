import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config'; // adjust path as needed

// ─── Constants ────────────────────────────────────────────────────────────────
const THRESHOLD = 75; // low attendance warning threshold

// ─── Color Palette (matches entire SAAPT app) ─────────────────────────────────
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

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || 'S';

const formatDate = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Circular-style overall attendance card */
const OverallCard = ({ totalLectures, present, absent, percentage }) => {
  const color = percentage >= THRESHOLD ? COLORS.success : COLORS.danger;

  return (
    <View style={styles.overallCard}>
      {/* Big percentage circle */}
      <View style={[styles.pctCircle, { borderColor: color }]}>
        <Text style={[styles.pctCircleValue, { color }]}>{percentage}%</Text>
        <Text style={styles.pctCircleLabel}>Overall</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.overallStats}>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatValue}>{totalLectures}</Text>
          <Text style={styles.overallStatLabel}>Total</Text>
        </View>
        <View style={styles.overallStatDivider} />
        <View style={styles.overallStatItem}>
          <Text style={[styles.overallStatValue, { color: COLORS.success }]}>{present}</Text>
          <Text style={styles.overallStatLabel}>Present</Text>
        </View>
        <View style={styles.overallStatDivider} />
        <View style={styles.overallStatItem}>
          <Text style={[styles.overallStatValue, { color: COLORS.danger }]}>{absent}</Text>
          <Text style={styles.overallStatLabel}>Absent</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.overallProgressBg}>
        <View
          style={[
            styles.overallProgressFill,
            {
              width:           `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <View style={styles.overallProgressLabels}>
        <Text style={styles.overallProgressMin}>0%</Text>
        <View style={[styles.thresholdMarker, { left: `${THRESHOLD}%` }]}>
          <Text style={styles.thresholdLabel}>{THRESHOLD}%</Text>
        </View>
        <Text style={styles.overallProgressMax}>100%</Text>
      </View>
    </View>
  );
};

/** Single subject attendance row */
const SubjectRow = ({ subjectName, present, total, index }) => {
  const percentage  = pct(present, total);
  const isLow       = percentage < THRESHOLD;
  const barColor    = isLow ? COLORS.danger : COLORS.success;

  const SUBJECT_COLORS = [
    COLORS.primary, COLORS.secondary, COLORS.success,
    COLORS.warning, '#EC4899', '#8B5CF6',
  ];
  const dotColor = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

  return (
    <View style={[styles.subjectRow, isLow && styles.subjectRowLow]}>
      {/* Color dot */}
      <View style={[styles.subjectDot, { backgroundColor: dotColor }]} />

      <View style={styles.subjectInfo}>
        {/* Top: name + percentage */}
        <View style={styles.subjectTopRow}>
          <Text style={styles.subjectName} numberOfLines={1}>{subjectName}</Text>
          <View style={[
            styles.subjectPctBadge,
            { backgroundColor: isLow ? COLORS.dangerLight : COLORS.successLight },
          ]}>
            {isLow && <Text style={styles.subjectWarnIcon}>⚠️ </Text>}
            <Text style={[
              styles.subjectPctText,
              { color: isLow ? COLORS.danger : COLORS.success },
            ]}>
              {percentage}%
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.subjectProgressBg}>
          <View style={[
            styles.subjectProgressFill,
            { width: `${percentage}%`, backgroundColor: barColor },
          ]} />
          {/* Threshold line */}
          <View style={[styles.subjectThresholdLine, { left: `${THRESHOLD}%` }]} />
        </View>

        {/* Sessions info */}
        <Text style={styles.subjectSessions}>
          {present} / {total} lectures
        </Text>
      </View>
    </View>
  );
};

/** Low attendance warning card */
const LowAttendanceWarning = ({ subjects }) => {
  if (subjects.length === 0) return null;

  return (
    <View style={styles.warningCard}>
      <View style={styles.warningHeader}>
        <Text style={styles.warningHeaderIcon}>⚠️</Text>
        <View>
          <Text style={styles.warningHeaderTitle}>Low Attendance Alert</Text>
          <Text style={styles.warningHeaderSubtitle}>
            {subjects.length} subject{subjects.length > 1 ? 's' : ''} below {THRESHOLD}%
          </Text>
        </View>
      </View>

      {subjects.map((sub, i) => {
        const percentage   = pct(sub.present, sub.total);
        const lecturesNeeded = Math.max(
          0,
          Math.ceil((THRESHOLD / 100 * sub.total - sub.present) / (1 - THRESHOLD / 100))
        );

        return (
          <View key={sub.subjectId} style={[
            styles.warningItem,
            i < subjects.length - 1 && styles.warningItemBorder,
          ]}>
            <View style={styles.warningItemLeft}>
              <Text style={styles.warningSubjectName}>{sub.subjectName}</Text>
              <Text style={styles.warningDetail}>
                {sub.present} / {sub.total} lectures attended
              </Text>
              {lecturesNeeded > 0 && (
                <Text style={styles.warningNeeded}>
                  Need {lecturesNeeded} more consecutive lectures to reach {THRESHOLD}%
                </Text>
              )}
            </View>
            <View style={styles.warningPctBadge}>
              <Text style={styles.warningPct}>{percentage}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const StudentHomeScreen = ({ navigation }) => {
  const [studentName, setStudentName] = useState('');
  const [className,   setClassName]   = useState('');
  const [rollNumber,  setRollNumber]  = useState('');
  const [classId,     setClassId]     = useState('');

  // Attendance data
  const [subjectStats,  setSubjectStats]  = useState([]); // [{subjectId, subjectName, present, total}]
  const [overallStats,  setOverallStats]  = useState({ total: 0, present: 0, absent: 0, pct: 0 });
  const [lowSubjects,   setLowSubjects]   = useState([]);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — Fetch student profile from users/{uid}
  // ─────────────────────────────────────────────────────────────────────────
  const fetchStudentProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    setStudentName(data.name      ?? '');
    setClassName(data.className   ?? data.classId ?? '');
    setRollNumber(data.rollNumber ?? data.roll    ?? '');
    return data.classId ?? null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 — Fetch all attendance docs for this class
  //          then filter records where studentId == uid
  //          group by subjectId to compute present/total per subject
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAttendance = async (cId, uid) => {
    // All attendance docs for this class
    const attSnap = await getDocs(
      query(collection(db, 'attendance'), where('classId', '==', cId))
    );
    const attDocs = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Group by subjectId
    // subjectMap: { subjectId: { subjectName, present, total } }
    const subjectMap = {};

    attDocs.forEach((att) => {
      const sid   = att.subjectId;
      const sName = att.subjectName ?? sid;

      if (!subjectMap[sid]) {
        subjectMap[sid] = { subjectId: sid, subjectName: sName, present: 0, total: 0 };
      }

      // Find this student's record in the session
      const myRecord = (att.records ?? []).find((r) => r.studentId === uid);
      if (myRecord) {
        subjectMap[sid].total += 1;
        if (myRecord.status === 'present') subjectMap[sid].present += 1;
      }
    });

    const stats = Object.values(subjectMap)
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    // Overall totals
    const totalPresent  = stats.reduce((s, x) => s + x.present, 0);
    const totalLectures = stats.reduce((s, x) => s + x.total,   0);
    const totalAbsent   = totalLectures - totalPresent;
    const overallPct    = pct(totalPresent, totalLectures);

    // Low attendance subjects
    const low = stats.filter((s) => s.total > 0 && pct(s.present, s.total) < THRESHOLD);

    setSubjectStats(stats);
    setOverallStats({
      total:   totalLectures,
      present: totalPresent,
      absent:  totalAbsent,
      pct:     overallPct,
    });
    setLowSubjects(low);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Load all
  // ─────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const cId = await fetchStudentProfile(uid);
      if (cId) {
        setClassId(cId);
        await fetchAttendance(cId, uid);
      }
    } catch (err) {
      console.error('StudentHomeScreen loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ══════════════════════════════
          HEADER — Welcome Section
      ══════════════════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.studentName}>{studentName || 'Student'}</Text>
            <View style={styles.headerMeta}>
              {className  ? <View style={styles.metaPill}><Text style={styles.metaPillText}>🏫 {className}</Text></View>  : null}
              {rollNumber ? <View style={styles.metaPill}><Text style={styles.metaPillText}>🎓 Roll {rollNumber}</Text></View> : null}
            </View>
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(studentName)}</Text>
          </View>
        </View>

        <View style={styles.dateChip}>
          <Text style={styles.dateChipText}>📅  {formatDate()}</Text>
        </View>
      </View>

      {/* ══════════════════════════════
          BODY
      ══════════════════════════════ */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerLoaderTxt}>Loading your attendance…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
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
          {/* ── Overall Attendance Card ── */}
          <Text style={styles.sectionTitle}>Overall Attendance</Text>
          {overallStats.total === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Attendance Data Yet</Text>
              <Text style={styles.emptySubText}>
                Your teacher hasn't recorded any attendance sessions yet.
              </Text>
            </View>
          ) : (
            <OverallCard
              totalLectures={overallStats.total}
              present={overallStats.present}
              absent={overallStats.absent}
              percentage={overallStats.pct}
            />
          )}

          {/* ── Low Attendance Warning ── */}
          {lowSubjects.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                Attendance Alerts
              </Text>
              <LowAttendanceWarning subjects={lowSubjects} />
            </>
          )}

          {/* ── Subject Wise Attendance ── */}
          {subjectStats.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                Subject-wise Attendance
              </Text>
              <View style={styles.subjectCard}>
                {subjectStats.map((sub, i) => (
                  <View key={sub.subjectId}>
                    <SubjectRow
                      subjectName={sub.subjectName}
                      present={sub.present}
                      total={sub.total}
                      index={i}
                    />
                    {i < subjectStats.length - 1 && (
                      <View style={styles.subjectDivider} />
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── All good banner ── */}
          {subjectStats.length > 0 && lowSubjects.length === 0 && (
            <View style={styles.allGoodBanner}>
              <Text style={styles.allGoodIcon}>🎉</Text>
              <View>
                <Text style={styles.allGoodTitle}>Great Attendance!</Text>
                <Text style={styles.allGoodSub}>
                  You're above {THRESHOLD}% in all subjects. Keep it up!
                </Text>
              </View>
            </View>
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

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor:         COLORS.primary,
    paddingTop:              52,
    paddingHorizontal:       20,
    paddingBottom:           28,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   14,
  },
  headerTextGroup: { flex: 1, marginRight: 12 },
  greeting:    { fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  studentName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 3 },
  headerMeta:  { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  metaPill: {
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  metaPillText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  avatarCircle: {
    width:           50,
    height:          50,
    borderRadius:    25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     'rgba(255,255,255,0.4)',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 17 },
  dateChip: {
    backgroundColor:   'rgba(255,255,255,0.15)',
    borderRadius:      20,
    paddingVertical:   6,
    paddingHorizontal: 14,
    alignSelf:         'flex-start',
  },
  dateChipText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 24 },

  // Section title
  sectionTitle: {
    fontSize:     17,
    fontWeight:   '700',
    color:        COLORS.text,
    marginBottom: 14,
    marginTop:    4,
  },

  // ── Overall Card ─────────────────────────────────────────────────────────────
  overallCard: {
    backgroundColor: COLORS.card,
    borderRadius:    20,
    padding:         20,
    marginBottom:    22,
    alignItems:      'center',
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.08,
    shadowRadius:    12,
    elevation:       5,
  },
  pctCircle: {
    width:          100,
    height:         100,
    borderRadius:   50,
    borderWidth:    5,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   20,
  },
  pctCircleValue: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  pctCircleLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },

  overallStats: {
    flexDirection:   'row',
    width:           '100%',
    justifyContent:  'space-around',
    marginBottom:    18,
  },
  overallStatItem:    { alignItems: 'center', flex: 1 },
  overallStatValue:   { fontSize: 22, fontWeight: '800', color: COLORS.text },
  overallStatLabel:   { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  overallStatDivider: { width: 1, backgroundColor: COLORS.border, alignSelf: 'stretch' },

  overallProgressBg: {
    width:           '100%',
    height:          8,
    backgroundColor: COLORS.border,
    borderRadius:    4,
    overflow:        'hidden',
    marginBottom:    4,
  },
  overallProgressFill:   { height: 8, borderRadius: 4 },
  overallProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', position: 'relative' },
  overallProgressMin:    { fontSize: 10, color: COLORS.textLight },
  overallProgressMax:    { fontSize: 10, color: COLORS.textLight },
  thresholdMarker: {
    position:   'absolute',
    top:        -22,
    transform:  [{ translateX: -12 }],
  },
  thresholdLabel: { fontSize: 10, color: COLORS.warning, fontWeight: '700' },

  // ── Subject Card ─────────────────────────────────────────────────────────────
  subjectCard: {
    backgroundColor: COLORS.card,
    borderRadius:    20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom:    22,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.08,
    shadowRadius:    12,
    elevation:       5,
  },
  subjectRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingVertical: 14,
    gap:             12,
  },
  subjectRowLow: {},
  subjectDot: {
    width:       10,
    height:      10,
    borderRadius: 5,
    marginTop:   5,
  },
  subjectInfo: { flex: 1 },
  subjectTopRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   8,
  },
  subjectName: {
    fontSize:   14,
    fontWeight: '600',
    color:      COLORS.text,
    flex:       1,
    marginRight: 8,
  },
  subjectPctBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      8,
  },
  subjectWarnIcon: { fontSize: 11 },
  subjectPctText:  { fontSize: 12, fontWeight: '800' },

  subjectProgressBg: {
    height:          5,
    backgroundColor: COLORS.border,
    borderRadius:    3,
    overflow:        'visible',
    marginBottom:    4,
    position:        'relative',
  },
  subjectProgressFill:    { height: 5, borderRadius: 3 },
  subjectThresholdLine: {
    position:        'absolute',
    top:             -3,
    width:           2,
    height:          11,
    backgroundColor: COLORS.warning,
    borderRadius:    1,
  },
  subjectSessions: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  subjectDivider:  { height: 1, backgroundColor: COLORS.border, marginLeft: 22 },

  // ── Warning Card ─────────────────────────────────────────────────────────────
  warningCard: {
    backgroundColor: COLORS.dangerLight,
    borderRadius:    20,
    padding:         16,
    marginBottom:    22,
    borderWidth:     1.5,
    borderColor:     COLORS.danger,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  14,
  },
  warningHeaderIcon:     { fontSize: 24 },
  warningHeaderTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  warningHeaderSubtitle: { fontSize: 12, color: COLORS.danger, opacity: 0.8, marginTop: 1 },

  warningItem: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap:             12,
  },
  warningItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239,68,68,0.2)',
  },
  warningItemLeft:   { flex: 1 },
  warningSubjectName: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  warningDetail:     { fontSize: 12, color: COLORS.danger, opacity: 0.75, marginTop: 2 },
  warningNeeded: {
    fontSize:   11,
    color:      COLORS.danger,
    opacity:    0.7,
    marginTop:  4,
    fontStyle:  'italic',
  },
  warningPctBadge: {
    backgroundColor:   COLORS.danger,
    borderRadius:      10,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  warningPct: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  // ── All Good Banner ───────────────────────────────────────────────────────────
  allGoodBanner: {
    backgroundColor: COLORS.successLight,
    borderRadius:    16,
    padding:         16,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     COLORS.success,
  },
  allGoodIcon:  { fontSize: 28 },
  allGoodTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  allGoodSub:   { fontSize: 12, color: COLORS.success, opacity: 0.8, marginTop: 2 },

  // ── Center Loader ─────────────────────────────────────────────────────────────
  centerLoader:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerLoaderTxt: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // ── Empty ─────────────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    padding:         36,
    alignItems:      'center',
    marginBottom:    22,
    borderWidth:     1.5,
    borderStyle:     'dashed',
    borderColor:     COLORS.border,
  },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default StudentHomeScreen;