import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config'; // adjust path as needed

// ─── Color Palette ────────────────────────────────────────────────────────────
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
const getTodayString = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const formatDisplayDate = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || '?';

const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#ECFEFF', text: '#06B6D4' },
  { bg: '#D1FAE5', text: '#10B981' },
  { bg: '#FEF3C7', text: '#F59E0B' },
  { bg: '#FCE7F3', text: '#EC4899' },
  { bg: '#FEE2E2', text: '#EF4444' },
];

// ─── STEP 1: Class+Subject Selector ──────────────────────────────────────────
/**
 * Shows list of class_subjects assigned to teacher.
 * Teacher taps one → moves to attendance marking.
 */
const ClassSubjectSelector = ({ assignments, onSelect }) => (
  <View style={styles.selectorWrapper}>
    <Text style={styles.selectorTitle}>Select Class & Subject</Text>
    <Text style={styles.selectorSubtitle}>
      Tap a class to start marking attendance
    </Text>

    {assignments.map((item, index) => (
      <TouchableOpacity
        key={item.id}
        style={styles.assignmentCard}
        onPress={() => onSelect(item)}
        activeOpacity={0.82}
      >
        {/* Left accent */}
        <View style={[
          styles.assignmentAccent,
          { backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.secondary },
        ]} />

        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentClass}>{item.className}</Text>
          <Text style={styles.assignmentSubject}>📖  {item.subjectName}</Text>
        </View>

        <View style={styles.assignmentArrow}>
          <Text style={styles.assignmentArrowText}>→</Text>
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Summary Bar ──────────────────────────────────────────────────────────────
const SummaryBar = ({ total, present, absent, unmarked }) => (
  <View style={styles.summaryBar}>
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryVal, { color: COLORS.success }]}>{present}</Text>
      <Text style={styles.summaryLbl}>Present</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryVal, { color: COLORS.danger }]}>{absent}</Text>
      <Text style={styles.summaryLbl}>Absent</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryVal, { color: COLORS.warning }]}>{unmarked}</Text>
      <Text style={styles.summaryLbl}>Unmarked</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryVal, { color: COLORS.text }]}>{total}</Text>
      <Text style={styles.summaryLbl}>Total</Text>
    </View>
  </View>
);

// ─── Student Row ──────────────────────────────────────────────────────────────
/**
 * Tapping the row toggles: unmarked → present → absent → unmarked
 * Visual feedback changes instantly.
 */
const StudentRow = ({ student, index, status, onToggle }) => {
  const isPresent = status === 'present';
  const isAbsent  = status === 'absent';
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <TouchableOpacity
      style={[
        styles.studentRow,
        isPresent && styles.studentRowPresent,
        isAbsent  && styles.studentRowAbsent,
      ]}
      onPress={() => onToggle(student.id)}
      activeOpacity={0.82}
    >
      {/* Avatar */}
      <View style={[
        styles.studentAvatar,
        { backgroundColor: avatarColor.bg },
        isPresent && { backgroundColor: COLORS.successLight },
        isAbsent  && { backgroundColor: COLORS.dangerLight },
      ]}>
        <Text style={[
          styles.studentAvatarText,
          { color: avatarColor.text },
          isPresent && { color: COLORS.success },
          isAbsent  && { color: COLORS.danger },
        ]}>
          {getInitials(student.name)}
        </Text>
      </View>

      {/* Name */}
      <View style={styles.studentMeta}>
        <Text style={styles.studentName}>{student.name ?? 'Unknown'}</Text>
        <Text style={styles.studentHint}>
          {isPresent ? 'Tap to mark Absent' : isAbsent ? 'Tap to clear' : 'Tap to mark Present'}
        </Text>
      </View>

      {/* Status Badge — updates immediately on tap */}
      <View style={[
        styles.statusBadge,
        isPresent && styles.statusBadgePresent,
        isAbsent  && styles.statusBadgeAbsent,
        !isPresent && !isAbsent && styles.statusBadgeUnmarked,
      ]}>
        {isPresent ? (
          <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>✓ Present</Text>
        ) : isAbsent ? (
          <Text style={[styles.statusBadgeText, { color: COLORS.danger }]}>✗ Absent</Text>
        ) : (
          <Text style={[styles.statusBadgeText, { color: COLORS.textLight }]}>— Mark</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AttendanceScreen = ({ navigation, route }) => {
  // Optional: if navigated directly from ClassesScreen with params
  const routeParams = route?.params ?? {};

  const [teacherId,    setTeacherId]    = useState('');
  const [assignments,  setAssignments]  = useState([]); // class_subjects rows
  const [selected,     setSelected]     = useState(    // currently selected assignment
    routeParams.classId ? {
      classId:     routeParams.classId,
      className:   routeParams.className   ?? '',
      subjectId:   routeParams.subjectId   ?? '',
      subjectName: routeParams.subjectName ?? '',
    } : null
  );
  const [students,     setStudents]     = useState([]);
  const [attendance,   setAttendance]   = useState({}); // { uid: 'present' | 'absent' }
  const [loadingAssign, setLoadingAssign] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedDocId,   setSavedDocId]   = useState(null); // existing attendance doc for today

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — Get teacher UID + fetch all class_subjects for this teacher
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setTeacherId(uid);

      const snap = await getDocs(
        query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
      );
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAssignments(rows);

      // If navigated with params, skip selector
      if (routeParams.classId) {
        loadStudents(routeParams.classId, {
          classId:     routeParams.classId,
          className:   routeParams.className   ?? '',
          subjectId:   routeParams.subjectId   ?? '',
          subjectName: routeParams.subjectName ?? '',
        }, uid);
      }
    } catch (err) {
      console.error('fetchAssignments error:', err);
    } finally {
      setLoadingAssign(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2+3+4 — When teacher selects a class:
  //   classes/{classId} → students[] → users collection → names
  // ─────────────────────────────────────────────────────────────────────────
  const loadStudents = async (classId, assignment, uid) => {
    setLoadingStudents(true);
    setStudents([]);
    setAttendance({});
    setSavedDocId(null);

    try {
      // Step 2: get students array from classes doc
      const classSnap = await getDoc(doc(db, 'classes', classId));
      if (!classSnap.exists()) { setLoadingStudents(false); return; }

      const studentIds = classSnap.data().students ?? [];
      if (studentIds.length === 0) { setStudents([]); setLoadingStudents(false); return; }

      // Step 3+4: fetch student docs from users collection
      const studentList = [];
      await Promise.all(
        studentIds.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'users', id));
            if (snap.exists()) studentList.push({ id: snap.id, ...snap.data() });
          } catch { /* skip missing users */ }
        })
      );

      // Preserve original order
      const ordered = studentIds
        .map((id) => studentList.find((s) => s.id === id))
        .filter(Boolean);

      setStudents(ordered);

      // Step 5: check if attendance already saved today for this class+subject
      const today = getTodayString();
      const existSnap = await getDocs(
        query(
          collection(db, 'attendance'),
          where('classId',   '==', classId),
          where('subjectId', '==', assignment.subjectId),
          where('date',      '==', today),
        )
      );

      if (!existSnap.empty) {
        const existDoc  = existSnap.docs[0];
        const existData = existDoc.data();
        setSavedDocId(existDoc.id);

        // Pre-fill attendance state from existing records
        const prefilled = {};
        (existData.records ?? []).forEach((r) => {
          prefilled[r.studentId] = r.status;
        });
        setAttendance(prefilled);
      }
    } catch (err) {
      console.error('loadStudents error:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle assignment selection from selector
  const handleSelectAssignment = (item) => {
    setSelected(item);
    loadStudents(item.classId, item, teacherId || auth.currentUser?.uid);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle: unmarked → present → absent → unmarked (cycles on each tap)
  // Data changes INSTANTLY in state — no delay
  // ─────────────────────────────────────────────────────────────────────────
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => {
      const current = prev[studentId];
      if (!current)           return { ...prev, [studentId]: 'present' };
      if (current === 'present') return { ...prev, [studentId]: 'absent'  };
      // current === 'absent' → clear
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });
  };

  // Mark all present shortcut
  const markAllPresent = () => {
    const all = {};
    students.forEach((s) => { all[s.id] = 'present'; });
    setAttendance(all);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Save attendance to Firebase
  // If record exists today → updateDoc, else → addDoc
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const unmarked = students.filter((s) => !attendance[s.id]);
    if (unmarked.length > 0) {
      Alert.alert(
        'Incomplete',
        `${unmarked.length} student(s) not marked. Please mark all students.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSaving(true);
    try {
      const today   = getTodayString();
      const uid     = teacherId || auth.currentUser?.uid;
      const records = students.map((s) => ({
        studentId: s.id,
        name:      s.name ?? '',
        status:    attendance[s.id],
      }));

      const payload = {
        classId:     selected.classId,
        className:   selected.className,
        subjectId:   selected.subjectId,
        subjectName: selected.subjectName,
        teacherId:   uid,
        date:        today,          // "YYYY-MM-DD" — easy to query in reports
        savedAt:     Timestamp.now(),
        records,
      };

      if (savedDocId) {
        // Update existing record
        await updateDoc(doc(db, 'attendance', savedDocId), payload);
      } else {
        // Create new record
        const newDoc = await addDoc(collection(db, 'attendance'), payload);
        setSavedDocId(newDoc.id);
      }

      Alert.alert(
        '✅ Saved',
        `Attendance for ${selected.className} - ${selected.subjectName} has been recorded.`,
        [{ text: 'Done', onPress: () => navigation?.goBack() }]
      );
    } catch (err) {
      console.error('saveAttendance error:', err);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Derived counts ──────────────────────────────────────────────────────
  const presentCount  = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount   = Object.values(attendance).filter((s) => s === 'absent').length;
  const unmarkedCount = students.length - presentCount - absentCount;
  const allMarked     = students.length > 0 && unmarkedCount === 0;
  const markedCount   = presentCount + absentCount;

  // ─── Render ───────────────────────────────────────────────────────────────
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
            onPress={() => {
              if (selected && !routeParams.classId) {
                setSelected(null); setStudents([]); setAttendance({});
              } else {
                navigation?.goBack();
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>
              {selected ? 'Mark Attendance' : 'Attendance'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {selected
                ? `${selected.className}  ·  ${selected.subjectName}`
                : 'Select a class to begin'}
            </Text>
          </View>
        </View>

        <View style={styles.dateChip}>
          <Text style={styles.dateChipText}>📅  {formatDisplayDate()}</Text>
        </View>

        {savedDocId && (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>
              🔄 Attendance already saved today — editing will update it
            </Text>
          </View>
        )}
      </View>

      {/* ══════════════════════════════
          BODY
      ══════════════════════════════ */}

      {/* ── Loading assignments ── */}
      {loadingAssign ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerLoaderText}>Loading classes…</Text>
        </View>

      /* ── Step 1: No class selected → show selector ── */
      ) : !selected ? (
        <ScrollView
          contentContainerStyle={styles.selectorScroll}
          showsVerticalScrollIndicator={false}
        >
          {assignments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Classes Assigned</Text>
              <Text style={styles.emptySubText}>
                Ask your admin to assign classes to your account.
              </Text>
            </View>
          ) : (
            <ClassSubjectSelector
              assignments={assignments}
              onSelect={handleSelectAssignment}
            />
          )}
        </ScrollView>

      /* ── Step 2: Loading students ── */
      ) : loadingStudents ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerLoaderText}>Fetching students…</Text>
        </View>

      /* ── Step 3: Show student list ── */
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}

          ListHeaderComponent={
            <>
              {/* Summary bar */}
              <SummaryBar
                total={students.length}
                present={presentCount}
                absent={absentCount}
                unmarked={unmarkedCount}
              />

              {/* Mark All Present shortcut */}
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={markAllPresent}
                activeOpacity={0.78}
              >
                <Text style={styles.markAllBtnText}>✓  Mark All Present</Text>
              </TouchableOpacity>

              {/* Section label */}
              <Text style={styles.listSectionLabel}>
                STUDENTS  ·  {students.length}
              </Text>
            </>
          }

          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptySubText}>No students enrolled in this class yet.</Text>
            </View>
          }

          renderItem={({ item, index }) => (
            <StudentRow
              student={item}
              index={index}
              status={attendance[item.id]}
              onToggle={toggleAttendance}   // instant state update on tap
            />
          )}

          ListFooterComponent={
            students.length > 0 ? (
              <View style={styles.footer}>
                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {markedCount} / {students.length} marked
                  </Text>
                  <View style={styles.progressBg}>
                    <View style={[
                      styles.progressFill,
                      {
                        width: `${students.length > 0 ? (markedCount / students.length) * 100 : 0}%`,
                        backgroundColor: allMarked ? COLORS.success : COLORS.primary,
                      },
                    ]} />
                  </View>
                </View>

                {/* Save button */}
                <TouchableOpacity
                  style={[styles.saveBtn, (!allMarked || saving) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  activeOpacity={0.82}
                  disabled={!allMarked || saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {savedDocId ? '🔄  Update Attendance' : '💾  Save Attendance'}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={{ height: 32 }} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor:         COLORS.primary,
    paddingTop:              52,
    paddingHorizontal:       20,
    paddingBottom:           24,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    marginBottom:  14,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.35)',
  },
  backBtnIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  headerTextGroup: { flex: 1 },
  headerTitle:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '500' },
  dateChip: {
    backgroundColor:   'rgba(255,255,255,0.15)',
    borderRadius:      20,
    paddingVertical:   6,
    paddingHorizontal: 14,
    alignSelf:         'flex-start',
  },
  dateChipText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
  savedBanner: {
    marginTop:         10,
    backgroundColor:   'rgba(16,185,129,0.22)',
    borderRadius:      10,
    paddingVertical:   7,
    paddingHorizontal: 14,
    alignSelf:         'flex-start',
  },
  savedBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // ── Center loader ─────────────────────────────────────────────────────────────
  centerLoader: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  centerLoaderText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // ── Selector ─────────────────────────────────────────────────────────────────
  selectorScroll:  { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 32 },
  selectorWrapper: {},
  selectorTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6,
  },
  selectorSubtitle: {
    fontSize: 13, color: COLORS.textSecondary, marginBottom: 20,
  },
  assignmentCard: {
    backgroundColor: COLORS.card,
    borderRadius:    16,
    marginBottom:    12,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       4,
  },
  assignmentAccent: { width: 5, alignSelf: 'stretch' },
  assignmentInfo:   { flex: 1, padding: 16 },
  assignmentClass: {
    fontSize: 16, fontWeight: '700', color: COLORS.text,
  },
  assignmentSubject: {
    fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 3,
  },
  assignmentArrow: {
    paddingHorizontal: 16,
    alignItems:        'center',
    justifyContent:    'center',
  },
  assignmentArrowText: {
    fontSize: 20, color: COLORS.primary, fontWeight: '700',
  },

  // ── FlatList ──────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 18, paddingTop: 22 },

  // ── Summary bar ───────────────────────────────────────────────────────────────
  summaryBar: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-around',
    paddingVertical: 16,
    marginBottom:    14,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       4,
  },
  summaryItem:   { alignItems: 'center', flex: 1 },
  summaryVal:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  summaryLbl:    { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

  // ── Mark All button ───────────────────────────────────────────────────────────
  markAllBtn: {
    backgroundColor: COLORS.successLight,
    borderRadius:    12,
    paddingVertical: 11,
    alignItems:      'center',
    marginBottom:    18,
    borderWidth:     1,
    borderColor:     COLORS.success,
  },
  markAllBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.success },

  listSectionLabel: {
    fontSize:      12,
    fontWeight:    '700',
    color:         COLORS.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  10,
  },

  // ── Student Row ───────────────────────────────────────────────────────────────
  studentRow: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   COLORS.card,
    borderRadius:      14,
    marginBottom:      10,
    padding:           14,
    gap:               12,
    shadowColor:       COLORS.shadow,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.05,
    shadowRadius:      6,
    elevation:         2,
    borderWidth:       1.5,
    borderColor:       'transparent',
  },
  studentRowPresent: {
    borderColor:     COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  studentRowAbsent: {
    borderColor:     COLORS.danger,
    backgroundColor: '#FFF5F5',
  },
  studentAvatar: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 15, fontWeight: '700' },
  studentMeta: { flex: 1 },
  studentName:  { fontSize: 15, fontWeight: '600', color: COLORS.text },
  studentHint:  { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

  // Status badge — changes live on tap
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      8,
    borderWidth:       1.5,
  },
  statusBadgePresent:  { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  statusBadgeAbsent:   { backgroundColor: COLORS.dangerLight,  borderColor: COLORS.danger  },
  statusBadgeUnmarked: { backgroundColor: COLORS.background,   borderColor: COLORS.border  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: { marginTop: 8 },
  progressRow: { gap: 8, marginBottom: 14 },
  progressText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  progressBg: {
    height: 6, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius:    16,
    paddingVertical: 16,
    alignItems:      'center',
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    10,
    elevation:       6,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.border, shadowOpacity: 0, elevation: 0,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // ── Empty ─────────────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    padding:         36,
    alignItems:      'center',
    marginTop:       24,
    borderWidth:     1.5,
    borderStyle:     'dashed',
    borderColor:     COLORS.border,
  },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default AttendanceScreen;