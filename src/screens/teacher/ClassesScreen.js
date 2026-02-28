import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CLASS_COLORS = ['#2F6F4E', '#7C5CBF', '#1976B8', '#D97706', '#D94F4F'];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — will be replaced with Firestore data later
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_CLASSES = [
  {
    id: '1',
    name: 'CM1',
    section: 'A',
    students: [
      { id: 'st1', rollNo: '01', name: 'Aarav Sharma', enrollNo: 'EN2024001' },
      { id: 'st2', rollNo: '02', name: 'Priya Patel', enrollNo: 'EN2024002' },
      { id: 'st3', rollNo: '03', name: 'Rohan Mehta', enrollNo: 'EN2024003' },
      { id: 'st4', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st5', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st6', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st7', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st8', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st9', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st10', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },

    ],
    subjects: [
      { id: 's1', name: 'Operating System', days: ['Mon', 'Wed'], time: '09:00 AM' },
    ],
  },
  {
    id: '2',
    name: 'CM2',
    section: 'B',
    students: [
      { id: 'st11', rollNo: '01', name: 'Aarav Sharma', enrollNo: 'EN2024001' },
      { id: 'st12', rollNo: '02', name: 'Priya Patel', enrollNo: 'EN2024002' },
      { id: 'st13', rollNo: '03', name: 'Rohan Mehta', enrollNo: 'EN2024003' },
      { id: 'st14', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' },
      { id: 'st15', rollNo: '04', name: 'Neha Gupta', enrollNo: 'EN2024004' }

    ],
    subjects: [
      { id: 's3', name: 'English', days: ['Mon', 'Fri'], time: '10:00 AM' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Single student row — read-only
const StudentRow = ({ student }) => (
  <View style={styles.studentRow}>
    <View style={styles.rollBadge}>
      <Text style={styles.rollNo}>{student.rollNo}</Text>
    </View>
    <View style={styles.studentInfo}>
      <Text style={styles.studentName}>{student.name}</Text>
      <Text style={styles.enrollNo}>Enroll: {student.enrollNo}</Text>
    </View>
  </View>
);

// Subject chip — read-only
const SubjectChip = ({ subject }) => (
  <View style={styles.subjectChip}>
    <Text style={styles.subjectChipName}>{subject.name}</Text>
    <Text style={styles.subjectChipMeta}>{subject.days.join(', ')} · {subject.time}</Text>
  </View>
);

// Class card shown in the main list
const ClassCard = ({ cls, color, onPress }) => (
  <TouchableOpacity style={styles.classCard} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.classCardHeader, { backgroundColor: color }]}>
      <View style={styles.classCardLeft}>
        <Text style={styles.classCardName}>{cls.name} – {cls.section}</Text>
        <Text style={styles.classCardMeta}>
          👥 {cls.students.length} students · 📖 {cls.subjects.length} subjects
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
    </View>
    {cls.subjects.length > 0 && (
      <View style={styles.chipRow}>
        {cls.subjects.map((s) => (
          <View key={s.id} style={styles.previewChip}>
            <Text style={styles.previewChipTxt}>{s.name}</Text>
          </View>
        ))}
      </View>
    )}
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const TeacherClassesScreen = () => {
  const [classes] = useState(INITIAL_CLASSES);
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedClass, setSelectedClass] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — LIST VIEW (all classes)
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
<SafeAreaView style={styles.safe} edges={['top']}>
          <StatusBar
          barStyle="dark-content"
          backgroundColor="#F4F7F5"
          translucent={false}
        />
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarTitle}>My Classes</Text>
            <Text style={styles.topBarSub}>
              {classes.length} classes · {classes.reduce((a, c) => a + c.subjects.length, 0)} subjects
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {classes.map((cls, i) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              color={CLASS_COLORS[i % CLASS_COLORS.length]}
              onPress={() => { setSelectedClass(cls); setView('detail'); }}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — DETAIL VIEW (single class)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar with back button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setView('list')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.backTxt}>Classes</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{selectedClass?.name} – {selectedClass?.section}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── SUBJECTS SECTION (read-only) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Subjects ({selectedClass?.subjects.length})
          </Text>
        </View>

        <View style={styles.card}>
          {selectedClass?.subjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTxt}>
                No subjects assigned to this class yet.
              </Text>
            </View>
          ) : (
            selectedClass?.subjects.map((subject) => (
              <SubjectChip key={subject.id} subject={subject} />
            ))
          )}
        </View>

        {/* ── STUDENTS SECTION (read-only) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Students ({selectedClass?.students.length})
          </Text>
        </View>

        <View style={styles.card}>
          {selectedClass?.students.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTxt}>
                No students enrolled in this class yet.
              </Text>
            </View>
          ) : (
            selectedClass?.students.map((student) => (
              <StudentRow key={student.id} student={student} />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherClassesScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5' },
  // ── Top bar ──
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  topBarSub: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt: { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  // ── Scroll ──
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  // ── Class card (list view) ──
  classCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, overflow: 'hidden',
  },
  classCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  classCardLeft: {},
  classCardName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  classCardMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  previewChip: {
    backgroundColor: '#F0F7F3', borderRadius: 50,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  previewChipTxt: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  // ── Detail view sections ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },

  // ── Card wrapper ──
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },

  // ── Student row ──
  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  rollBadge: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#F0F7F3', alignItems: 'center', justifyContent: 'center',
  },
  rollNo: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1C1C1C' },
  enrollNo: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },

  // ── Subject chip (detail view — read-only) ──
  subjectChip: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  subjectChipName: { fontSize: 14, fontWeight: '700', color: '#1C1C1C' },
  subjectChipMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 3 },

  // ── Empty state ──
  emptyState: { padding: 24, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyTxt: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },
});