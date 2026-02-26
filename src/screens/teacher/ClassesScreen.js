import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Modal, TextInput, Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CLASS_COLORS = ['#2F6F4E', '#7C5CBF', '#1976B8', '#D97706', '#D94F4F'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — will be replaced with Firestore data later
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_CLASSES = [
  {
    id: '1',
    name: 'CM1',
    section: 'A',
    students: [
      { id: 'st1', rollNo: '01', name: 'Aarav Sharma',  enrollNo: 'EN2024001' },
      { id: 'st2', rollNo: '02', name: 'Priya Patel',   enrollNo: 'EN2024002' },
      { id: 'st3', rollNo: '03', name: 'Rohan Mehta',   enrollNo: 'EN2024003' },
    ],
    subjects: [
      { id: 's1', name: 'Mathematics', days: ['Mon', 'Wed'], time: '09:00 AM' },
      { id: 's2', name: 'Physics',     days: ['Tue', 'Thu'], time: '11:00 AM' },
    ],
  },
  {
    id: '2',
    name: 'CM2',
    section: 'B',
    students: [
      { id: 'st4', rollNo: '01', name: 'Sneha Verma',  enrollNo: 'EN2024004' },
      { id: 'st5', rollNo: '02', name: 'Arjun Singh',  enrollNo: 'EN2024005' },
    ],
    subjects: [
      { id: 's3', name: 'English', days: ['Mon', 'Fri'], time: '10:00 AM' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Single student row shown inside class detail view
const StudentRow = ({ student, onEdit, onDelete }) => (
  <View style={styles.studentRow}>
    <View style={styles.rollBadge}>
      <Text style={styles.rollNo}>{student.rollNo}</Text>
    </View>
    <View style={styles.studentInfo}>
      <Text style={styles.studentName}>{student.name}</Text>
      <Text style={styles.enrollNo}>Enroll: {student.enrollNo}</Text>
    </View>
    <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
      <Ionicons name="pencil-outline" size={16} color="#6B6B6B" />
    </TouchableOpacity>
    <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
      <Ionicons name="trash-outline" size={16} color="#D94F4F" />
    </TouchableOpacity>
  </View>
);

// Subject chip shown inside class detail view
const SubjectChip = ({ subject, onPress }) => (
  <TouchableOpacity style={styles.subjectChip} onPress={onPress} activeOpacity={0.75}>
    <Text style={styles.subjectChipName}>{subject.name}</Text>
    <Text style={styles.subjectChipMeta}>{subject.days.join(', ')} · {subject.time}</Text>
  </TouchableOpacity>
);

// Class card shown in the main list
const ClassCard = ({ cls, color, onPress }) => (
  <TouchableOpacity style={styles.classCard} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.classCardHeader, { backgroundColor: color }]}>
      {/* Left — class name and counts */}
      <View style={styles.classCardLeft}>
        <Text style={styles.classCardName}>{cls.name} – {cls.section}</Text>
        <Text style={styles.classCardMeta}>
          👥 {cls.students.length} students · 📖 {cls.subjects.length} subjects
        </Text>
      </View>
      {/* Right — chevron */}
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
    </View>
    {/* Subject chips preview */}
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
  const [classes, setClasses]           = useState(INITIAL_CLASSES);
  const [view, setView]                 = useState('list');       // 'list' | 'detail'
  const [selectedClass, setSelectedClass] = useState(null);

  // Modal visibility states
  const [showCreateClass, setShowCreateClass]   = useState(false);
  const [showAddStudent, setShowAddStudent]     = useState(false);
  const [showEditStudent, setShowEditStudent]   = useState(false);
  const [showAddSubject, setShowAddSubject]     = useState(false);

  // Form states for create class
  const [newClassName, setNewClassName]   = useState('');
  const [newSection, setNewSection]       = useState('');

  // Form states for add/edit student
  const [studentForm, setStudentForm] = useState({ rollNo: '', name: '', enrollNo: '' });
  const [editingStudent, setEditingStudent] = useState(null);

  // Form states for add subject
  const [subjectForm, setSubjectForm] = useState({ name: '', days: [], time: '' });

  // ── Helper: get fresh class data by id ──────────────────────────────────
  const refreshSelected = (id, updated) => {
    const fresh = updated.find((c) => c.id === id);
    setSelectedClass(fresh);
  };

  // ── CREATE CLASS ─────────────────────────────────────────────────────────
  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const newClass = {
      id: Date.now().toString(),
      name: newClassName.trim().toUpperCase(),
      section: newSection.trim() || 'A',
      students: [],
      subjects: [],
    };
    setClasses((prev) => [...prev, newClass]);
    setNewClassName('');
    setNewSection('');
    setShowCreateClass(false);
  };

  // ── ADD STUDENT ──────────────────────────────────────────────────────────
  const handleAddStudent = () => {
    if (!studentForm.rollNo.trim() || !studentForm.name.trim() || !studentForm.enrollNo.trim()) {
      Alert.alert('Required', 'Roll No, Name and Enrollment No are all required.');
      return;
    }
    const newStudent = {
      id: Date.now().toString(),
      rollNo: studentForm.rollNo.trim(),
      name: studentForm.name.trim(),
      enrollNo: studentForm.enrollNo.trim(),
    };
    const updated = classes.map((c) =>
      c.id === selectedClass.id
        ? { ...c, students: [...c.students, newStudent] }
        : c
    );
    setClasses(updated);
    refreshSelected(selectedClass.id, updated);
    setStudentForm({ rollNo: '', name: '', enrollNo: '' });
    setShowAddStudent(false);
  };

  // ── EDIT STUDENT ─────────────────────────────────────────────────────────
  const handleEditStudent = () => {
    if (!studentForm.rollNo.trim() || !studentForm.name.trim()) return;
    const updated = classes.map((c) =>
      c.id === selectedClass.id
        ? {
            ...c,
            students: c.students.map((s) =>
              s.id === editingStudent.id ? { ...s, ...studentForm } : s
            ),
          }
        : c
    );
    setClasses(updated);
    refreshSelected(selectedClass.id, updated);
    setStudentForm({ rollNo: '', name: '', enrollNo: '' });
    setEditingStudent(null);
    setShowEditStudent(false);
  };

  // ── DELETE STUDENT ────────────────────────────────────────────────────────
  const handleDeleteStudent = (studentId) => {
    Alert.alert('Remove Student', 'Are you sure you want to remove this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          const updated = classes.map((c) =>
            c.id === selectedClass.id
              ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
              : c
          );
          setClasses(updated);
          refreshSelected(selectedClass.id, updated);
        },
      },
    ]);
  };

  // ── ADD SUBJECT ───────────────────────────────────────────────────────────
  const handleAddSubject = () => {
    if (!subjectForm.name.trim()) return;
    const newSubject = {
      id: Date.now().toString(),
      name: subjectForm.name.trim(),
      days: subjectForm.days,
      time: subjectForm.time.trim() || 'TBD',
    };
    const updated = classes.map((c) =>
      c.id === selectedClass.id
        ? { ...c, subjects: [...c.subjects, newSubject] }
        : c
    );
    setClasses(updated);
    refreshSelected(selectedClass.id, updated);
    setSubjectForm({ name: '', days: [], time: '' });
    setShowAddSubject(false);
  };

  const toggleDay = (day) => {
    setSubjectForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  // ── CSV UPLOAD (placeholder — wired to backend later) ─────────────────────
  const handleCSVUpload = () => {
    Alert.alert(
      'Upload CSV',
      'CSV must have columns: roll_no, name, enrollment_no\n\n(Backend integration coming soon)',
      [{ text: 'OK' }]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — LIST VIEW (all classes)
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarTitle}>Classes</Text>
            <Text style={styles.topBarSub}>
              {classes.length} classes · {classes.reduce((a, c) => a + c.subjects.length, 0)} subjects
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateClass(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnTxt}>New Class</Text>
          </TouchableOpacity>
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

        {/* ── CREATE CLASS MODAL ── */}
        <Modal visible={showCreateClass} transparent animationType="slide" onRequestClose={() => setShowCreateClass(false)}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create New Class</Text>

              <Text style={styles.fieldLabel}>Class Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. CM1, FY-BSc, Class 10"
                placeholderTextColor="#9E9E9E"
                value={newClassName}
                onChangeText={setNewClassName}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>Section</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. A, B, C  (default: A)"
                placeholderTextColor="#9E9E9E"
                value={newSection}
                onChangeText={setNewSection}
                autoCapitalize="characters"
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateClass(false)}>
                  <Text style={styles.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, !newClassName.trim() && styles.confirmDisabled]}
                  onPress={handleCreateClass}
                  disabled={!newClassName.trim()}
                >
                  <Text style={styles.confirmTxt}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

        {/* ── STUDENTS SECTION ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Students ({selectedClass?.students.length})</Text>
          <View style={styles.sectionActions}>
            {/* Upload CSV button */}
            <TouchableOpacity style={styles.outlineBtn} onPress={handleCSVUpload}>
              <Ionicons name="cloud-upload-outline" size={14} color={Colors.primary} />
              <Text style={styles.outlineBtnTxt}>CSV</Text>
            </TouchableOpacity>
            {/* Add single student */}
            <TouchableOpacity style={styles.addBtn} onPress={() => { setStudentForm({ rollNo: '', name: '', enrollNo: '' }); setShowAddStudent(true); }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnTxt}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CSV format hint */}
        <View style={styles.csvHint}>
          <Ionicons name="information-circle-outline" size={14} color="#6B6B6B" />
          <Text style={styles.csvHintTxt}>CSV columns must be: roll_no · name · enrollment_no</Text>
        </View>

        {/* Student list */}
        <View style={styles.card}>
          {selectedClass?.students.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTxt}>No students yet. Add one or upload a CSV.</Text>
            </View>
          ) : (
            selectedClass?.students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onEdit={() => {
                  setEditingStudent(student);
                  setStudentForm({ rollNo: student.rollNo, name: student.name, enrollNo: student.enrollNo });
                  setShowEditStudent(true);
                }}
                onDelete={() => handleDeleteStudent(student.id)}
              />
            ))
          )}
        </View>

        {/* ── SUBJECTS SECTION ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subjects ({selectedClass?.subjects.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setSubjectForm({ name: '', days: [], time: '' }); setShowAddSubject(true); }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnTxt}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {selectedClass?.subjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTxt}>No subjects yet. Add one above.</Text>
            </View>
          ) : (
            selectedClass?.subjects.map((subject) => (
              <SubjectChip key={subject.id} subject={subject} onPress={() => {}} />
            ))
          )}
        </View>

      </ScrollView>

      {/* ── ADD STUDENT MODAL ── */}
      <Modal visible={showAddStudent} transparent animationType="slide" onRequestClose={() => setShowAddStudent(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Student</Text>

            <Text style={styles.fieldLabel}>Roll No *</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 01" placeholderTextColor="#9E9E9E"
              value={studentForm.rollNo} onChangeText={(v) => setStudentForm((p) => ({ ...p, rollNo: v }))} />

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput style={styles.modalInput} placeholder="Student full name" placeholderTextColor="#9E9E9E"
              value={studentForm.name} onChangeText={(v) => setStudentForm((p) => ({ ...p, name: v }))}
              autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Enrollment No *</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. EN2024001" placeholderTextColor="#9E9E9E"
              value={studentForm.enrollNo} onChangeText={(v) => setStudentForm((p) => ({ ...p, enrollNo: v }))}
              autoCapitalize="characters" />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddStudent(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddStudent}>
                <Text style={styles.confirmTxt}>Add Student</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── EDIT STUDENT MODAL ── */}
      <Modal visible={showEditStudent} transparent animationType="slide" onRequestClose={() => setShowEditStudent(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Student</Text>

            <Text style={styles.fieldLabel}>Roll No *</Text>
            <TextInput style={styles.modalInput} placeholder="Roll number" placeholderTextColor="#9E9E9E"
              value={studentForm.rollNo} onChangeText={(v) => setStudentForm((p) => ({ ...p, rollNo: v }))} />

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput style={styles.modalInput} placeholder="Student full name" placeholderTextColor="#9E9E9E"
              value={studentForm.name} onChangeText={(v) => setStudentForm((p) => ({ ...p, name: v }))}
              autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Enrollment No</Text>
            <TextInput style={styles.modalInput} placeholder="Enrollment number" placeholderTextColor="#9E9E9E"
              value={studentForm.enrollNo} onChangeText={(v) => setStudentForm((p) => ({ ...p, enrollNo: v }))}
              autoCapitalize="characters" />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditStudent(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleEditStudent}>
                <Text style={styles.confirmTxt}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ADD SUBJECT MODAL ── */}
      <Modal visible={showAddSubject} transparent animationType="slide" onRequestClose={() => setShowAddSubject(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Subject</Text>

            <Text style={styles.fieldLabel}>Subject Name *</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Mathematics, Physics"
              placeholderTextColor="#9E9E9E" value={subjectForm.name}
              onChangeText={(v) => setSubjectForm((p) => ({ ...p, name: v }))}
              autoCapitalize="words" />

            {/* Weekly timetable — day picker */}
            <Text style={styles.fieldLabel}>Days (Weekly Schedule)</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, subjectForm.days.includes(day) && styles.dayChipActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[styles.dayChipTxt, subjectForm.days.includes(day) && styles.dayChipTxtActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Session Time</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 09:00 AM"
              placeholderTextColor="#9E9E9E" value={subjectForm.time}
              onChangeText={(v) => setSubjectForm((p) => ({ ...p, time: v }))} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddSubject(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !subjectForm.name.trim() && styles.confirmDisabled]}
                onPress={handleAddSubject}
                disabled={!subjectForm.name.trim()}
              >
                <Text style={styles.confirmTxt}>Add Subject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default TeacherClassesScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5', paddingTop: 8 },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  topBarSub:   { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt:     { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  // ── Buttons ──
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 50,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  outlineBtnTxt: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

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
  classCardLeft:  {},
  classCardName:  { fontSize: 18, fontWeight: '800', color: '#fff' },
  classCardMeta:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
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
  sectionActions: { flexDirection: 'row', gap: 8 },

  csvHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F9F9F9', borderRadius: 8, padding: 10,
    marginBottom: 8,
  },
  csvHintTxt: { fontSize: 12, color: '#6B6B6B', flex: 1 },

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
  rollNo:      { fontSize: 12, fontWeight: '700', color: Colors.primary },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1C1C1C' },
  enrollNo:    { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  iconBtn:     { padding: 6 },

  // ── Subject chip (detail view) ──
  subjectChip: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  subjectChipName: { fontSize: 14, fontWeight: '700', color: '#1C1C1C' },
  subjectChipMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 3 },

  // ── Empty state ──
  emptyState: { padding: 24, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyTxt:   { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },

  // ── Modals ──
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle:  { fontSize: 20, fontWeight: '700', color: '#1C1C1C', marginBottom: 20 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: '#1C1C1C', marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 13,
    paddingHorizontal: 14, height: 50, fontSize: 15, color: '#1C1C1C', marginBottom: 14,
  },
  daysRow:     { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  dayChipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipTxt:       { fontSize: 13, fontWeight: '600', color: '#6B6B6B' },
  dayChipTxtActive: { color: '#fff' },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 50, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt:    { fontSize: 15, fontWeight: '600', color: '#6B6B6B' },
  confirmBtn: {
    flex: 1, height: 50, borderRadius: 50,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  confirmDisabled: { backgroundColor: '#D6D6D6' },
  confirmTxt:   { fontSize: 15, fontWeight: '700', color: '#fff' },
});
