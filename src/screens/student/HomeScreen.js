import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import {
  doc, getDoc, collection, query, where, getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../services/firebase/config';

// ─── Constants ────────────────────────────────────────────────────────────────
const THRESHOLD = 75;
const { width: SW } = Dimensions.get('window');

const C = {
  primary:     '#5B21B6',
  primarySoft: '#EDE9FE',
  accent:      '#8B5CF6',
  accentSoft:  '#F3E8FF',
  teal:        '#7C3AED',
  tealSoft:    '#F5F3FF',
  success:     '#16A34A',
  successSoft: '#DCFCE7',
  danger:      '#DC2626',
  dangerSoft:  '#FEE2E2',
  warning:     '#D97706',
  warningSoft: '#FEF3C7',
  bg:          '#F6F5FF',
  card:        '#FFFFFF',
  text:        '#1E1B4B',
  textSub:     '#4C1D95',
  textMuted:   '#A78BFA',
  border:      '#E9D5FF',
};

const SUBJECT_COLORS = [
  '#E94560', '#0F9B8E', '#6366F1', '#F59E0B', '#10B981', '#8B5CF6',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (p, t) => (t === 0 ? 0 : Math.round((p / t) * 100));
const todayStr = () => new Date().toISOString().split('T')[0];
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { msg: 'Good Morning',   emoji: '☀️' };
  if (h < 17) return { msg: 'Good Afternoon', emoji: '🌤️' };
  return        { msg: 'Good Evening',   emoji: '🌙' };
};
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || 'S';
const formatDate = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

// ─── Animated Progress Bar ────────────────────────────────────────────────────
const AnimatedBar = ({ percentage, color, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: percentage, duration: 800, delay, useNativeDriver: false,
    }).start();
  }, [percentage]);
  const width = anim.interpolate({
    inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp',
  });
  return (
    <View style={bar.bg}>
      <Animated.View style={[bar.fill, { width, backgroundColor: color }]} />
      <View style={[bar.marker, { left: `${THRESHOLD}%` }]} />
    </View>
  );
};
const bar = StyleSheet.create({
  bg:     { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'visible', position: 'relative', marginVertical: 6 },
  fill:   { height: 8, borderRadius: 4 },
  marker: { position: 'absolute', top: -4, width: 2, height: 16, backgroundColor: C.warning, borderRadius: 1 },
});

// ─── Circular Progress ────────────────────────────────────────────────────────
const CirclePct = ({ percentage, size = 120, strokeWidth = 10 }) => {
  const anim   = useRef(new Animated.Value(0)).current;
  const isGood = percentage >= THRESHOLD;
  const color  = isGood ? C.success : C.danger;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: percentage, duration: 1000, useNativeDriver: false,
    }).start();
  }, [percentage]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: C.border,
      }} />
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: color,
        transform: [{ rotate: '-90deg' }],
        opacity: percentage > 0 ? 1 : 0,
        borderTopColor:    percentage >= 25  ? color : 'transparent',
        borderRightColor:  percentage >= 50  ? color : 'transparent',
        borderBottomColor: percentage >= 75  ? color : 'transparent',
        borderLeftColor:   percentage >= 100 ? color : 'transparent',
      }} />
      <Text style={{ fontSize: 26, fontWeight: '900', color, letterSpacing: -1 }}>
        {percentage}%
      </Text>
      <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2 }}>
        Overall
      </Text>
    </View>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const HomeHeader = ({ name, className, rollNumber }) => {
  const { msg, emoji } = getGreeting();
  return (
    <View style={s.header}>
      <View style={s.headerCircle1} />
      <View style={s.headerCircle2} />
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <Text style={s.headerGreeting}>{emoji} {msg}</Text>
          <Text style={s.headerName}>{name || 'Student'}</Text>
          <View style={s.headerChips}>
            {!!className  && <View style={s.chip}><Text style={s.chipTxt}>🏫 {className}</Text></View>}
            {!!rollNumber && <View style={s.chip}><Text style={s.chipTxt}>🎓 Roll {rollNumber}</Text></View>}
          </View>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{getInitials(name)}</Text>
        </View>
      </View>
      <View style={s.datePill}>
        <Text style={s.datePillTxt}>📅 {formatDate()}</Text>
      </View>
    </View>
  );
};

// ─── Overall Card ─────────────────────────────────────────────────────────────
const OverallCard = ({ present, total, percentage }) => {
  const isGood = percentage >= THRESHOLD;
  return (
    <View style={s.card}>
      <View style={s.cardTitleRow}>
        <View style={[s.cardIcon, { backgroundColor: C.tealSoft }]}>
          <Text style={s.cardIconTxt}>📊</Text>
        </View>
        <View>
          <Text style={s.cardTitle}>Overall Attendance</Text>
          <Text style={s.cardSub}>All subjects combined</Text>
        </View>
      </View>
      <View style={s.overallBody}>
        <CirclePct percentage={percentage} size={110} strokeWidth={9} />
        <View style={s.overallStats}>
          {[
            { label: 'Total Classes', val: total,           clr: C.text    },
            { label: 'Present',       val: present,         clr: C.success },
            { label: 'Absent',        val: total - present, clr: C.danger  },
          ].map(item => (
            <View key={item.label} style={s.statItem}>
              <View style={[s.statDot, { backgroundColor: item.clr }]} />
              <View>
                <Text style={[s.statVal, { color: item.clr }]}>{item.val}</Text>
                <Text style={s.statLbl}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={[s.statusStrip, { backgroundColor: isGood ? C.successSoft : C.dangerSoft }]}>
        <Text style={[s.statusStripTxt, { color: isGood ? C.success : C.danger }]}>
          {isGood
            ? `✓  You meet the ${THRESHOLD}% attendance requirement!`
            : `⚠  Below ${THRESHOLD}% minimum — please attend more classes.`}
        </Text>
      </View>
    </View>
  );
};

// ─── Subject Row ──────────────────────────────────────────────────────────────
const SubjectRow = ({ subjectName, present, total, index }) => {
  const p      = pct(present, total);
  const isLow  = p < THRESHOLD;
  const color  = isLow ? C.danger : C.success;
  const dot    = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  const needed = isLow
    ? Math.max(0, Math.ceil((THRESHOLD * total - 100 * present) / (100 - THRESHOLD)))
    : 0;
  return (
    <View style={[s.subjectRow, isLow && s.subjectRowLow]}>
      {isLow && <View style={[s.subjectBorder, { backgroundColor: C.danger }]} />}
      <View style={[s.subjectDot, { backgroundColor: dot }]} />
      <View style={s.subjectInfo}>
        <View style={s.subjectTopRow}>
          <Text style={s.subjectName} numberOfLines={1}>{subjectName}</Text>
          <View style={[s.pctBadge, { backgroundColor: isLow ? C.dangerSoft : C.successSoft }]}>
            {isLow && <Text style={s.warnMini}>⚠ </Text>}
            <Text style={[s.pctBadgeTxt, { color }]}>{p}%</Text>
          </View>
        </View>
        <AnimatedBar percentage={p} color={color} delay={index * 80} />
        <View style={s.subjectBottomRow}>
          <Text style={s.subjectSessions}>{present}/{total} classes</Text>
          {isLow && needed > 0 && (
            <Text style={s.subjectNeeded}>Need {needed} more to reach {THRESHOLD}%</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// ─── Today Card ───────────────────────────────────────────────────────────────
const TodayCard = ({ records }) => {
  if (!records || records.length === 0) return null;
  return (
    <View style={s.card}>
      <View style={s.cardTitleRow}>
        <View style={[s.cardIcon, { backgroundColor: C.accentSoft }]}>
          <Text style={s.cardIconTxt}>✅</Text>
        </View>
        <View>
          <Text style={s.cardTitle}>Today's Attendance</Text>
          <Text style={s.cardSub}>Your status for today</Text>
        </View>
      </View>
      {records.map((r, i) => {
        const isPresent = r.status === 'present';
        return (
          <View key={`${r.subjectId}_${i}`} style={[s.todayRow, i < records.length - 1 && s.rowDivider]}>
            <View style={[s.todayDot, { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }]} />
            <Text style={s.todaySubject}>{r.subjectName}</Text>
            <View style={[s.todayBadge, { backgroundColor: isPresent ? C.successSoft : C.dangerSoft }]}>
              <Text style={[s.todayBadgeTxt, { color: isPresent ? C.success : C.danger }]}>
                {isPresent ? '✓ Present' : '✗ Absent'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const StudentHomeScreen = ({ navigation }) => {

  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [name,         setName]         = useState('');
  const [className,    setClassName]    = useState('');
  const [rollNumber,   setRollNumber]   = useState('');
  const [overall,      setOverall]      = useState({ present: 0, total: 0, pct: 0 });
  const [subjectStats, setSubjectStats] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [error,        setError]        = useState('');

  // ── Core fetch — receives uid directly (no race condition) ─────────────────
  const fetchData = useCallback(async (uid) => {
    try {
      setError('');
      console.log('🔍 [HomeScreen] Fetching for uid:', uid);

      // ── 1. User profile ────────────────────────────────────────────────────
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) {
        console.warn('⚠️ [HomeScreen] No user doc found for uid:', uid);
        setError('User profile not found.');
        return;
      }

      const userData = userSnap.data();
      console.log('👤 [HomeScreen] userData:', JSON.stringify(userData));

      const classId  = userData.classId   ?? null;
      const uName    = userData.name      ?? '';
      const uClass   = userData.className ?? '';
      const uRoll    = userData.rollNumber ?? userData.roll ?? '';

      setName(uName);
      setRollNumber(uRoll);

      if (!classId) {
        console.warn('⚠️ [HomeScreen] classId missing on user doc');
        setError('No class assigned to your account.');
        return;
      }
      console.log('🏫 [HomeScreen] classId:', classId);

      // ── 2. Class name (fallback) ───────────────────────────────────────────
      let resolvedClassName = uClass;
      if (!resolvedClassName) {
        const classSnap = await getDoc(doc(db, 'classes', classId));
        if (classSnap.exists()) resolvedClassName = classSnap.data().name ?? '';
      }
      setClassName(resolvedClassName);
      console.log('🏫 [HomeScreen] className:', resolvedClassName);

      // ── 3. All attendance sessions for this class ──────────────────────────
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('classId', '==', classId))
      );
      console.log('📋 [HomeScreen] attendance docs count:', attSnap.size);

      if (attSnap.empty) {
        setOverall({ present: 0, total: 0, pct: 0 });
        setSubjectStats([]);
        setTodayRecords([]);
        return;
      }

      const today      = todayStr();
      const subjectMap = {};
      const todayList  = [];

      // ── 4. Scan each session doc ───────────────────────────────────────────
      attSnap.docs.forEach(sessionDoc => {
        const d = sessionDoc.data();

        const sid   = d.subjectId   ?? d.subject   ?? 'unknown';
        const sName = d.subjectName ?? d.subject   ?? 'Unknown Subject';
        const date  = d.date        ?? '';

        // Normalise records field — could be array or Firestore map
        let records = d.records ?? d.attendance ?? [];
        if (!Array.isArray(records)) records = Object.values(records);

        console.log(
          `📄 [HomeScreen] session ${sessionDoc.id} | subject: ${sName} | date: ${date} | records count: ${records.length}`
        );

        // Find this student's entry
        // Try both 'studentId' and 'uid' field names for safety
        const myRecord = records.find(
          r => r.studentId === uid || r.uid === uid || r.id === uid
        );

        if (!myRecord) {
          console.log(`   ↳ uid ${uid} NOT found in records`);
          return;
        }

        const status = (myRecord.status ?? '').toLowerCase();
        console.log(`   ↳ found record: status = ${status}`);

        if (!subjectMap[sid]) {
          subjectMap[sid] = { subjectId: sid, subjectName: sName, present: 0, total: 0 };
        }
        subjectMap[sid].total += 1;
        if (status === 'present') subjectMap[sid].present += 1;

        if (date === today) {
          todayList.push({ subjectId: sid, subjectName: sName, status });
        }
      });

      // ── 5. Final stats ─────────────────────────────────────────────────────
      const stats = Object.values(subjectMap)
        .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

      const totalPresent = stats.reduce((s, x) => s + x.present, 0);
      const totalClasses = stats.reduce((s, x) => s + x.total,   0);
      const overallPct   = pct(totalPresent, totalClasses);

      console.log('✅ [HomeScreen] stats:', stats);
      console.log(`✅ [HomeScreen] overall: ${totalPresent}/${totalClasses} = ${overallPct}%`);

      setSubjectStats(stats);
      setOverall({ present: totalPresent, total: totalClasses, pct: overallPct });
      setTodayRecords(todayList);

    } catch (err) {
      console.error('❌ [HomeScreen] fetchData error:', err);
      setError('Something went wrong. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Wait for auth state before fetching ─────────────────────────────────
  // This fixes the race condition where auth.currentUser is null on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData(user.uid);
      } else {
        console.warn('⚠️ [HomeScreen] No authenticated user');
        setLoading(false);
        setError('Not logged in.');
      }
    });
    return () => unsubscribe();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) fetchData(user.uid);
    else setRefreshing(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.teal} />
          <Text style={s.loaderTxt}>Loading your dashboard…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.teal]}
              tintColor={C.teal}
            />
          }
        >
          <HomeHeader name={name} className={className} rollNumber={rollNumber} />

          <View style={s.body}>

            {/* Error banner */}
            {!!error && (
              <View style={s.errorCard}>
                <Text style={s.errorTxt}>⚠️ {error}</Text>
              </View>
            )}

            {/* Overall Attendance */}
            {overall.total === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyIcon}>📋</Text>
                <Text style={s.emptyTitle}>No Attendance Data Yet</Text>
                <Text style={s.emptySub}>
                  Your teacher hasn't recorded any sessions yet.{'\n'}
                  Check back after your first class.
                </Text>
              </View>
            ) : (
              <OverallCard
                present={overall.present}
                total={overall.total}
                percentage={overall.pct}
              />
            )}

            {/* Today's Attendance */}
            <TodayCard records={todayRecords} />

            {/* Subject-wise Attendance */}
            {subjectStats.length > 0 && (
              <View style={s.card}>
                <View style={s.cardTitleRow}>
                  <View style={[s.cardIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Text style={s.cardIconTxt}>📚</Text>
                  </View>
                  <View>
                    <Text style={s.cardTitle}>Subject-wise Attendance</Text>
                    <Text style={s.cardSub}>75% threshold marked ▲</Text>
                  </View>
                </View>
                {subjectStats.map((sub, i) => (
                  <View key={sub.subjectId}>
                    <SubjectRow
                      subjectName={sub.subjectName}
                      present={sub.present}
                      total={sub.total}
                      index={i}
                    />
                    {i < subjectStats.length - 1 && <View style={s.rowDivider} />}
                  </View>
                ))}
                {subjectStats.every(x => pct(x.present, x.total) >= THRESHOLD) && (
                  <View style={s.allGoodStrip}>
                    <Text style={s.allGoodTxt}>
                      🎉  Excellent! You're above {THRESHOLD}% in all subjects.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* View Full Report Button */}
            <TouchableOpacity
              style={s.reportBtn}
              activeOpacity={0.82}
              onPress={() => navigation?.navigate('Report')}
            >
              <View style={s.reportBtnInner}>
                <Text style={s.reportBtnIcon}>📈</Text>
                <View>
                  <Text style={s.reportBtnTitle}>View Full Report</Text>
                  <Text style={s.reportBtnSub}>Detailed analysis & defaulter list</Text>
                </View>
              </View>
              <Text style={s.reportBtnArrow}>→</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primary,
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 28,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40,
  },
  headerCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(233,69,96,0.15)', bottom: -20, left: 10,
  },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerLeft:     { flex: 1, marginRight: 12 },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  headerName:     { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  headerChips:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:           { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt:        { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarTxt:    { color: '#fff', fontWeight: '900', fontSize: 18 },
  datePill:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start' },
  datePillTxt:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIcon:     { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardIconTxt:  { fontSize: 18 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:      { fontSize: 11, color: C.textMuted, marginTop: 1 },

  overallBody:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  overallStats: { flex: 1, gap: 8 },
  statItem:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDot:      { width: 8, height: 8, borderRadius: 4 },
  statVal:      { fontSize: 18, fontWeight: '800' },
  statLbl:      { fontSize: 11, color: C.textMuted },
  statusStrip:  { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 4 },
  statusStripTxt: { fontSize: 12, fontWeight: '600', lineHeight: 18 },

  subjectRow:    { paddingVertical: 12, paddingLeft: 4, overflow: 'hidden' },
  subjectRowLow: {},
  subjectBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  subjectDot:    { width: 9, height: 9, borderRadius: 5, position: 'absolute', left: 4, top: 19 },
  subjectInfo:   { marginLeft: 20 },
  subjectTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName:   { fontSize: 14, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  pctBadge:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pctBadgeTxt:   { fontSize: 12, fontWeight: '800' },
  warnMini:      { fontSize: 10 },
  subjectBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectSessions:  { fontSize: 11, color: C.textMuted },
  subjectNeeded:    { fontSize: 10, color: C.danger, fontWeight: '600', fontStyle: 'italic' },

  todayRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  todayDot:     { width: 9, height: 9, borderRadius: 5 },
  todaySubject: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  todayBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  todayBadgeTxt:{ fontSize: 12, fontWeight: '700' },

  rowDivider: { height: 1, backgroundColor: C.border, marginLeft: 20 },

  allGoodStrip: { backgroundColor: C.successSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginTop: 10 },
  allGoodTxt:   { fontSize: 12, color: C.success, fontWeight: '600' },

  reportBtn: {
    backgroundColor: C.primary, borderRadius: 18, padding: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  reportBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportBtnIcon:  { fontSize: 26 },
  reportBtnTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  reportBtnSub:   { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  reportBtnArrow: { fontSize: 22, color: C.accent, fontWeight: '900' },

  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 400 },
  loaderTxt: { fontSize: 14, color: C.textSub },

  emptyCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 36,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },

  errorCard: {
    backgroundColor: C.dangerSoft, borderRadius: 12, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.danger,
  },
  errorTxt: { color: C.danger, fontSize: 13, fontWeight: '600' },
});

export default StudentHomeScreen;