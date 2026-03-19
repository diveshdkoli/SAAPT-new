import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary:        '#4F46E5',
  primaryLight:   '#EEF2FF',
  secondary:      '#06B6D4',
  secondaryLight: '#ECFEFF',
  success:        '#10B981',
  successLight:   '#D1FAE5',
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

const ACCENT_CYCLE = [
  { bar: COLORS.primary,   badge: COLORS.primaryLight,   text: COLORS.primary   },
  { bar: COLORS.secondary, badge: COLORS.secondaryLight, text: COLORS.secondary },
  { bar: COLORS.success,   badge: COLORS.successLight,   text: COLORS.success   },
  { bar: COLORS.warning,   badge: COLORS.warningLight,   text: COLORS.warning   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

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

// ─── Bottom Sheet Component ───────────────────────────────────────────────────
const StudentBottomSheet = ({ visible, onClose, classItem, teacherName }) => {
  const slideAnim  = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [students, setStudents]   = useState([]);
  const [loading,  setLoading]    = useState(false);

  // ── Animate in/out ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      fetchStudents();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue:        0,
          useNativeDriver: true,
          bounciness:      4,
          speed:           14,
        }),
        Animated.timing(backdropAnim, {
          toValue:         1,
          duration:        300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue:         SCREEN_HEIGHT,
          duration:        280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue:         0,
          duration:        280,
          useNativeDriver: true,
        }),
      ]).start(() => setStudents([]));
    }
  }, [visible]);

  // ── Fetch students from classes/{classId} → users collection ───────────────
  const fetchStudents = async () => {
    if (!classItem?.classId) return;
    setLoading(true);
    try {
      const classSnap = await getDoc(doc(db, 'classes', classItem.classId));
      if (!classSnap.exists()) { setStudents([]); return; }

      const studentIds = classSnap.data().students ?? [];
      if (studentIds.length === 0) { setStudents([]); return; }

      // Fetch in chunks of 30 (Firestore 'in' limit)
      const userDocs = [];
      for (let i = 0; i < studentIds.length; i += 30) {
        const chunk = studentIds.slice(i, i + 30);
        const snap  = await getDocs(
          query(collection(db, 'users'), where('__name__', 'in', chunk))
        );
        snap.docs.forEach((d) => userDocs.push({ id: d.id, ...d.data() }));
      }

      // Preserve original order
      const ordered = studentIds
        .map((id) => userDocs.find((u) => u.id === id))
        .filter(Boolean);

      setStudents(ordered);
    } catch (err) {
      console.error('fetchStudents error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!classItem) return null;

  const accentIndex = 0;
  const accent      = ACCENT_CYCLE[accentIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* ── Backdrop ── */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* ── Sheet ── */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* ── Sheet Header ── */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderLeft}>
            {/* Class icon */}
            <View style={[styles.sheetClassIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={styles.sheetClassIconText}>🏫</Text>
            </View>
            <View>
              <Text style={styles.sheetClassName}>{classItem.className}</Text>
              <Text style={styles.sheetSubjectName}>📖  {classItem.subjectName}</Text>
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Teacher Info Row ── */}
        <View style={styles.teacherRow}>
          <View style={styles.teacherAvatar}>
            <Text style={styles.teacherAvatarText}>{getInitials(teacherName)}</Text>
          </View>
          <View>
            <Text style={styles.teacherLabel}>Class Teacher</Text>
            <Text style={styles.teacherName}>{teacherName || '—'}</Text>
          </View>
        </View>

        {/* ── Student Count pill ── */}
        <View style={styles.studentCountRow}>
          <Text style={styles.studentCountTitle}>Students</Text>
          <View style={styles.studentCountPill}>
            <Text style={styles.studentCountPillText}>
              {loading ? '…' : students.length}
            </Text>
          </View>
        </View>

        {/* ── Student List ── */}
        {loading ? (
          <View style={styles.sheetLoader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.sheetLoaderText}>Loading students…</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.sheetEmpty}>
            <Text style={styles.sheetEmptyIcon}>👥</Text>
            <Text style={styles.sheetEmptyText}>No students enrolled yet</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.studentScroll}
            contentContainerStyle={styles.studentScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {students.map((student, index) => {
              const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
              return (
                <View key={student.id} style={styles.studentRow}>
                  {/* Index */}
                  <Text style={styles.studentIndex}>{index + 1}</Text>

                  {/* Avatar */}
                  <View style={[styles.studentAvatar, { backgroundColor: avatarColor.bg }]}>
                    <Text style={[styles.studentAvatarText, { color: avatarColor.text }]}>
                      {getInitials(student.name)}
                    </Text>
                  </View>

                  {/* Name + email */}
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name ?? 'Unknown'}</Text>
                    {student.email ? (
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── Class Card ───────────────────────────────────────────────────────────────
const ClassCard = ({ item, index, onPress, onTakeAttendance }) => {
  const accent       = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
  const studentCount = item.studentCount ?? 0;

  return (
    // Whole card is tappable → opens bottom sheet
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
    >
      <View style={[styles.classAccentBar, { backgroundColor: accent.bar }]} />

      <View style={styles.classCardInner}>
        <View style={styles.classCardTop}>
          <View style={styles.classCardTitles}>
            <Text style={styles.className}>{item.className}</Text>
            <Text style={styles.classSubject}>📖  {item.subjectName}</Text>
          </View>

          <View style={[styles.studentBadge, { backgroundColor: accent.badge }]}>
            <Text style={styles.studentBadgeIcon}>👨‍🎓</Text>
            <Text style={[styles.studentBadgeText, { color: accent.text }]}>
              {formatNumber(studentCount)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>
              {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
            </Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: accent.badge, borderColor: accent.badge }]}>
            <Text style={[styles.metaChipText, { color: accent.text }]}>
              Tap to view students
            </Text>
          </View>
        </View>

        <View style={styles.classCardDivider} />

        <TouchableOpacity
          style={[styles.takeAttendanceBtn, { backgroundColor: accent.badge }]}
          onPress={() => onTakeAttendance(item)}
          activeOpacity={0.78}
        >
          <Text style={styles.takeAttendanceBtnIcon}>📝</Text>
          <Text style={[styles.takeAttendanceBtnText, { color: accent.text }]}>
            Take Attendance
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Summary Strip ────────────────────────────────────────────────────────────
const SummaryStrip = ({ totalClasses, totalStudents, totalSubjects }) => (
  <View style={styles.summaryStrip}>
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{totalClasses}</Text>
      <Text style={styles.summaryLabel}>Classes</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{formatNumber(totalStudents)}</Text>
      <Text style={styles.summaryLabel}>Students</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: COLORS.success }]}>{totalSubjects}</Text>
      <Text style={styles.summaryLabel}>Subjects</Text>
    </View>
  </View>
);

const EmptyState = () => (
  <View style={styles.emptyWrapper}>
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>🏫</Text>
      <Text style={styles.emptyTitle}>No Classes Assigned</Text>
      <Text style={styles.emptySubText}>
        Your admin hasn't assigned any classes to your account yet.{'\n'}
        Please contact your admin to get started.
      </Text>
    </View>
  </View>
);

const FullLoader = () => (
  <View style={styles.loaderWrapper}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loaderText}>Loading your classes…</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ClassesScreen = ({ navigation }) => {
  const [classCards,    setClassCards]    = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [teacherName,   setTeacherName]   = useState('');
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  // Bottom sheet state
  const [sheetVisible,  setSheetVisible]  = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // ── Fetch data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Teacher name
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) setTeacherName(userSnap.data().name ?? '');

      // class_subjects rows
      const csSnap = await getDocs(
        query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
      );
      const csRows = csSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (csRows.length === 0) {
        setClassCards([]); setTotalStudents(0); setTotalSubjects(0);
        return;
      }

      // Unique classIds → student counts
      const uniqueClassIds = [...new Set(csRows.map((r) => r.classId).filter(Boolean))];
      const classStudentMap = {};
      await Promise.all(
        uniqueClassIds.map(async (classId) => {
          try {
            const snap = await getDoc(doc(db, 'classes', classId));
            classStudentMap[classId] = snap.exists() ? (snap.data().students?.length ?? 0) : 0;
          } catch { classStudentMap[classId] = 0; }
        })
      );

      const enriched = csRows
        .map((row) => ({ ...row, studentCount: classStudentMap[row.classId] ?? 0 }))
        .sort((a, b) => (a.className ?? '').localeCompare(b.className ?? ''));

      const students = uniqueClassIds.reduce((sum, id) => sum + (classStudentMap[id] ?? 0), 0);
      const subjects = new Set(csRows.map((r) => r.subjectId).filter(Boolean)).size;

      setClassCards(enriched);
      setTotalStudents(students);
      setTotalSubjects(subjects);
    } catch (err) {
      console.error('ClassesScreen fetchData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCardPress = (item) => {
    setSelectedClass(item);
    setSheetVisible(true);
  };

  const handleCloseSheet = () => setSheetVisible(false);

  const handleTakeAttendance = (item) => {
    navigation?.navigate('TeacherAttendance', {
      classId:     item.classId,
      className:   item.className,
      subjectId:   item.subjectId,
      subjectName: item.subjectName,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
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
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>
              {loading ? 'Loading…' : `${classCards.length} class${classCards.length !== 1 ? 'es' : ''} assigned`}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <FullLoader />
      ) : (
        <FlatList
          data={classCards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
          ListHeaderComponent={
            <SummaryStrip totalClasses={classCards.length} totalStudents={totalStudents} totalSubjects={totalSubjects} />
          }
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item, index }) => (
            <ClassCard
              item={item}
              index={index}
              onPress={handleCardPress}
              onTakeAttendance={handleTakeAttendance}
            />
          )}
          ListFooterComponent={<View style={{ height: 32 }} />}
        />
      )}

      {/* ── Bottom Sheet ── */}
      <StudentBottomSheet
        visible={sheetVisible}
        onClose={handleCloseSheet}
        classItem={selectedClass}
        teacherName={teacherName}
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

  // Header
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
  backBtnIcon: {
    color:      '#FFFFFF',
    fontSize:   18,
    fontWeight: '700',
    lineHeight: 22,
  },
  headerTextGroup: { flex: 1 },
  headerTitle: {
    fontSize:   22,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
  headerSubtitle: {
    fontSize:   13,
    color:      'rgba(255,255,255,0.7)',
    marginTop:  3,
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingHorizontal: 18,
    paddingTop:        22,
  },

  // Summary strip
  summaryStrip: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-around',
    paddingVertical: 18,
    marginBottom:    22,
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       4,
  },
  summaryItem:  { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 3 },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.border },

  // Class Card
  classCard: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    marginBottom:    14,
    flexDirection:   'row',
    overflow:        'hidden',
    shadowColor:     COLORS.shadow,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       4,
  },
  classAccentBar:  { width: 5 },
  classCardInner:  { flex: 1, padding: 16 },
  classCardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   10,
  },
  classCardTitles: { flex: 1, marginRight: 10 },
  className:   { fontSize: 17, fontWeight: '700', color: COLORS.text },
  classSubject: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 4 },
  studentBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      10,
    gap:               4,
  },
  studentBadgeIcon: { fontSize: 14 },
  studentBadgeText: { fontSize: 14, fontWeight: '800' },
  metaRow:     { flexDirection: 'row', gap: 8, marginBottom: 2, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor:   COLORS.background,
    borderRadius:      8,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       COLORS.border,
  },
  metaChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  classCardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  takeAttendanceBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    10,
    paddingVertical: 11,
    gap:             6,
  },
  takeAttendanceBtnIcon: { fontSize: 15 },
  takeAttendanceBtnText: { fontSize: 13, fontWeight: '700' },

  // Loader
  loaderWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText:    { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // Empty
  emptyWrapper: { paddingTop: 40 },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius:    18,
    padding:         36,
    alignItems:      'center',
    borderWidth:     1.5,
    borderStyle:     'dashed',
    borderColor:     COLORS.border,
  },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  // ── Bottom Sheet ─────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    position:              'absolute',
    bottom:                0,
    left:                  0,
    right:                 0,
    height:                SCREEN_HEIGHT * 0.80,
    backgroundColor:       COLORS.card,
    borderTopLeftRadius:   28,
    borderTopRightRadius:  28,
    paddingTop:            12,
    shadowColor:           '#000',
    shadowOffset:          { width: 0, height: -4 },
    shadowOpacity:         0.14,
    shadowRadius:          20,
    elevation:             24,
  },
  dragHandle: {
    width:           44,
    height:          5,
    borderRadius:    3,
    backgroundColor: COLORS.border,
    alignSelf:       'center',
    marginBottom:    16,
  },

  // Sheet header
  sheetHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 20,
    marginBottom:    16,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    flex:          1,
  },
  sheetClassIcon: {
    width:          48,
    height:         48,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sheetClassIconText: { fontSize: 24 },
  sheetClassName: {
    fontSize:   18,
    fontWeight: '700',
    color:      COLORS.text,
  },
  sheetSubjectName: {
    fontSize:   13,
    color:      COLORS.textSecondary,
    fontWeight: '500',
    marginTop:  2,
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: COLORS.background,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  closeBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },

  // Teacher row
  teacherRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    marginHorizontal: 20,
    backgroundColor: COLORS.primaryLight,
    borderRadius:    14,
    padding:         14,
    marginBottom:    16,
  },
  teacherAvatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  teacherAvatarText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  teacherLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  teacherName:  { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 1 },

  // Student count row
  studentCountRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 20,
    marginBottom:    12,
  },
  studentCountTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  studentCountPill: {
    backgroundColor:   COLORS.primary,
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  studentCountPillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Sheet loader / empty
  sheetLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  sheetLoaderText: { fontSize: 14, color: COLORS.textSecondary },
  sheetEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  sheetEmptyIcon: { fontSize: 40 },
  sheetEmptyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

  // Student scroll
  studentScroll:        { flex: 1 },
  studentScrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  // Student row
  studentRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  studentIndex: {
    fontSize:   13,
    fontWeight: '700',
    color:      COLORS.textLight,
    width:      22,
    textAlign:  'right',
  },
  studentAvatar: {
    width:          42,
    height:         42,
    borderRadius:   21,
    alignItems:     'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 15, fontWeight: '700' },
  studentInfo:  { flex: 1 },
  studentName:  { fontSize: 15, fontWeight: '600', color: COLORS.text },
  studentEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
});

export default ClassesScreen;