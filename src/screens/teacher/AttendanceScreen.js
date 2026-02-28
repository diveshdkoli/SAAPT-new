import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

const MOCK_CLASSES = [
  { id: '1', name: 'CM1 – A' },
  { id: '2', name: 'CM2 – B' },
];

const MOCK_SUBJECTS = {
  '1': [{ id: 's1', name: 'Mathematics' }, { id: 's2', name: 'Physics' }, { id: 's3', name: 'Chemistry' }],
  '2': [{ id: 's4', name: 'English' }, { id: 's5', name: 'Biology' }],
};

const MOCK_STUDENTS = [
  { id: 'st1', name: 'Aarav Sharma', rollNo: '01' },
  { id: 'st2', name: 'Priya Patel', rollNo: '02' },
  { id: 'st3', name: 'Rohan Mehta', rollNo: '03' },
  { id: 'st4', name: 'Sneha Verma', rollNo: '04' },
  { id: 'st5', name: 'Arjun Singh', rollNo: '05' },
  { id: 'st6', name: 'Ananya Gupta', rollNo: '06' },
  { id: 'st7', name: 'Kabir Joshi', rollNo: '07' },
  { id: 'st8', name: 'Meera Nair', rollNo: '08' },
  { id: 'st9', name: 'Vivek Kumar', rollNo: '09' },
  { id: 'st10', name: 'Pooja Reddy', rollNo: '10' },
];

const STEP = { CLASS: 0, SUBJECT: 1, ATTENDANCE: 2, DONE: 3 };

const StudentRow = ({ student, present, onToggle }) => (
  <TouchableOpacity style={styles.studentRow} onPress={onToggle} activeOpacity={0.75}>
    <View style={styles.rollBadge}>
      <Text style={styles.rollNo}>{student.rollNo}</Text>
    </View>
    <Text style={styles.studentName}>{student.name}</Text>
    <View style={[styles.toggle, present ? styles.togglePresent : styles.toggleAbsent]}>
      <Text style={styles.toggleTxt}>{present ? 'P' : 'A'}</Text>
    </View>
  </TouchableOpacity>
);

const TeacherAttendanceScreen = () => {
  const [step, setStep] = useState(STEP.CLASS);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [attendance, setAttendance] = useState({});

  const initAttendance = () => {
    const init = {};
    MOCK_STUDENTS.forEach((s) => (init[s.id] = true)); // all present by default
    setAttendance(init);
  };

  const toggleStudent = (id) =>
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));

  const markAll = (val) => {
    const updated = {};
    MOCK_STUDENTS.forEach((s) => (updated[s.id] = val));
    setAttendance(updated);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const total = MOCK_STUDENTS.length;

  const reset = () => {
    setStep(STEP.CLASS);
    setSelectedClass(null);
    setSelectedSubject(null);
    setAttendance({});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
      barStyle="dark-content"
      backgroundColor="#F4F7F5"
      translucent={false}
    />
      {/* Top Bar */}
      <View style={styles.topBar}>
        {step > STEP.CLASS && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Text style={styles.backTxt}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>Attendance</Text>
          <Text style={styles.topBarSub}>
            {step === STEP.CLASS && 'Step 1 — Select a class'}
            {step === STEP.SUBJECT && `Step 2 — Select subject in ${selectedClass?.name}`}
            {step === STEP.ATTENDANCE && `${selectedClass?.name} · ${selectedSubject?.name}`}
            {step === STEP.DONE && 'Session saved!'}
          </Text>
        </View>
      </View>

      {/* ── STEP 1: Pick Class ── */}
      {step === STEP.CLASS && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.stepHint}>Which class are you taking attendance for?</Text>
          {MOCK_CLASSES.map((cls) => (
            <TouchableOpacity key={cls.id} style={styles.optionCard}
              onPress={() => { setSelectedClass(cls); setStep(STEP.SUBJECT); }}
              activeOpacity={0.8}
            >
              <Text style={styles.optionEmoji}>📚</Text>
              <Text style={styles.optionName}>{cls.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── STEP 2: Pick Subject ── */}
      {step === STEP.SUBJECT && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.stepHint}>Which subject is this session for?</Text>
          {(MOCK_SUBJECTS[selectedClass?.id] || []).map((sub) => (
            <TouchableOpacity key={sub.id} style={styles.optionCard}
              onPress={() => { setSelectedSubject(sub); initAttendance(); setStep(STEP.ATTENDANCE); }}
              activeOpacity={0.8}
            >
              <Text style={styles.optionEmoji}>📖</Text>
              <Text style={styles.optionName}>{sub.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── STEP 3: Mark Attendance ── */}
      {step === STEP.ATTENDANCE && (
        <>
          {/* Summary bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: Colors.primary }]}>{presentCount}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#D94F4F' }]}>{total - presentCount}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#1976B8' }]}>{total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>

          {/* Mark all buttons */}
          <View style={styles.markAllRow}>
            <TouchableOpacity style={[styles.markAllBtn, styles.markAllPresent]} onPress={() => markAll(true)}>
              <Text style={styles.markAllTxt}>✓ All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.markAllBtn, styles.markAllAbsent]} onPress={() => markAll(false)}>
              <Text style={[styles.markAllTxt, { color: '#D94F4F' }]}>✗ All Absent</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.studentScroll}>
            {MOCK_STUDENTS.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                present={attendance[student.id]}
                onToggle={() => toggleStudent(student.id)}
              />
            ))}
          </ScrollView>

          {/* Submit */}
          <View style={styles.submitWrap}>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setStep(STEP.DONE)} activeOpacity={0.85}>
              <Text style={styles.submitTxt}>Save Attendance  ({presentCount}/{total} present)</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── STEP 4: Done ── */}
      {step === STEP.DONE && (
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>Attendance Saved!</Text>
          <Text style={styles.doneSub}>
            {selectedClass?.name} · {selectedSubject?.name}{'\n'}
            {presentCount} present out of {total} students
          </Text>
          <TouchableOpacity style={styles.submitBtn} onPress={reset} activeOpacity={0.85}>
            <Text style={styles.submitTxt}>Take Another Attendance</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TeacherAttendanceScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 10,
  },
  backBtn: { paddingRight: 4 },
  backTxt: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  topBarSub: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  stepHint: { fontSize: 14, color: '#6B6B6B', marginBottom: 4 },

  optionCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  optionEmoji: { fontSize: 22 },
  optionName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1C1C1C' },
  chevron: { fontSize: 22, color: '#C0C0C0' },

  summaryBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryVal: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#F0F0F0' },

  markAllRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  markAllBtn: {
    flex: 1, height: 36, borderRadius: 50, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1.5,
  },
  markAllPresent: { borderColor: Colors.primary, backgroundColor: '#E6F0EA' },
  markAllAbsent: { borderColor: '#D94F4F', backgroundColor: '#FFF0F0' },
  markAllTxt: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  studentScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 8 },
  studentRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rollBadge: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#F0F7F3', alignItems: 'center', justifyContent: 'center',
  },
  rollNo: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  studentName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1C1C1C' },
  toggle: {
    width: 36, height: 36, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  togglePresent: { backgroundColor: Colors.primary },
  toggleAbsent: { backgroundColor: '#D94F4F' },
  toggleTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  submitWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 50, height: 52,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, elevation: 4,
  },
  submitTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1C' },
  doneSub: { fontSize: 15, color: '#6B6B6B', textAlign: 'center', lineHeight: 24 },
});
