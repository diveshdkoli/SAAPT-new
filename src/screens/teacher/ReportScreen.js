import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors } from '../../theme';

const DEFAULTER_THRESHOLD = 75; // universal variable — change here to update everywhere

const MOCK_REPORT = [
  {
    classId: '1', className: 'CM1 – A',
    subjects: [
      {
        id: 's1', name: 'Mathematics', totalSessions: 18,
        students: [
          { id: 'st1', name: 'Aarav Sharma',  present: 16 },
          { id: 'st2', name: 'Priya Patel',   present: 18 },
          { id: 'st3', name: 'Rohan Mehta',   present: 10 },
          { id: 'st4', name: 'Sneha Verma',   present: 14 },
          { id: 'st5', name: 'Arjun Singh',   present: 8  },
        ],
      },
      {
        id: 's2', name: 'Physics', totalSessions: 14,
        students: [
          { id: 'st1', name: 'Aarav Sharma',  present: 13 },
          { id: 'st2', name: 'Priya Patel',   present: 9  },
          { id: 'st3', name: 'Rohan Mehta',   present: 14 },
          { id: 'st4', name: 'Sneha Verma',   present: 6  },
          { id: 'st5', name: 'Arjun Singh',   present: 11 },
        ],
      },
    ],
  },
  {
    classId: '2', className: 'CM2 – B',
    subjects: [
      {
        id: 's4', name: 'English', totalSessions: 16,
        students: [
          { id: 'st6', name: 'Ananya Gupta',  present: 15 },
          { id: 'st7', name: 'Kabir Joshi',   present: 11 },
          { id: 'st8', name: 'Meera Nair',    present: 7  },
        ],
      },
    ],
  },
];

const pct = (present, total) => Math.round((present / total) * 100);

const AttendanceBadge = ({ percentage }) => {
  const color = percentage >= DEFAULTER_THRESHOLD ? Colors.primary : '#D94F4F';
  return (
    <View style={[styles.badge, { backgroundColor: color + '18', borderColor: color }]}>
      <Text style={[styles.badgeTxt, { color }]}>{percentage}%</Text>
    </View>
  );
};

const TABS = ['By Subject', 'Defaulters'];

const TeacherReportScreen = () => {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // Build defaulter list per class
  const defaulterData = MOCK_REPORT.map((cls) => {
    const defaulterMap = {};
    cls.subjects.forEach((sub) => {
      sub.students.forEach((st) => {
        const p = pct(st.present, sub.totalSessions);
        if (p < DEFAULTER_THRESHOLD) {
          if (!defaulterMap[st.id]) defaulterMap[st.id] = { name: st.name, subjects: [] };
          defaulterMap[st.id].subjects.push({ name: sub.name, pct: p });
        }
      });
    });
    return { className: cls.className, defaulters: Object.values(defaulterMap) };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Reports</Text>
        <Text style={styles.topBarSub}>Threshold: {DEFAULTER_THRESHOLD}% attendance required</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tabBtn, tab === i && styles.tabBtnActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabTxt, tab === i && styles.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TAB 1: By Subject ── */}
        {tab === 0 && MOCK_REPORT.map((cls) => (
          <View key={cls.classId}>
            <Text style={styles.classLabel}>{cls.className}</Text>
            {cls.subjects.map((sub) => {
              const key = `${cls.classId}-${sub.id}`;
              const isOpen = expanded[key];
              const avgPct = Math.round(sub.students.reduce((a, s) => a + pct(s.present, sub.totalSessions), 0) / sub.students.length);
              return (
                <View key={sub.id} style={styles.card}>
                  <TouchableOpacity style={styles.subjectHeader} onPress={() => toggleExpand(key)} activeOpacity={0.8}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{sub.name}</Text>
                      <Text style={styles.subjectMeta}>{sub.totalSessions} sessions · {sub.students.length} students</Text>
                    </View>
                    <AttendanceBadge percentage={avgPct} />
                    <Text style={[styles.chevron, isOpen && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.studentList}>
                      <View style={styles.listHeader}>
                        <Text style={[styles.colTxt, { flex: 1 }]}>Student</Text>
                        <Text style={styles.colTxt}>Present</Text>
                        <Text style={styles.colTxt}>  %</Text>
                      </View>
                      {sub.students.map((st) => {
                        const p = pct(st.present, sub.totalSessions);
                        const isDefaulter = p < DEFAULTER_THRESHOLD;
                        return (
                          <View key={st.id} style={[styles.studentRow, isDefaulter && styles.studentRowAlert]}>
                            <Text style={[styles.studentName, { flex: 1 }]}>{st.name}{isDefaulter ? ' ⚠️' : ''}</Text>
                            <Text style={styles.studentStat}>{st.present}/{sub.totalSessions}</Text>
                            <AttendanceBadge percentage={p} />
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* ── TAB 2: Defaulters ── */}
        {tab === 1 && defaulterData.map((cls, i) => (
          <View key={i}>
            <Text style={styles.classLabel}>{cls.className}</Text>
            {cls.defaulters.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTxt}>No defaulters in this class!</Text>
              </View>
            ) : cls.defaulters.map((d, j) => (
              <View key={j} style={[styles.card, styles.defaulterCard]}>
                <View style={styles.defaulterHeader}>
                  <Text style={styles.defaulterName}>⚠️ {d.name}</Text>
                  <View style={[styles.badge, { backgroundColor: '#FFF0F0', borderColor: '#D94F4F' }]}>
                    <Text style={[styles.badgeTxt, { color: '#D94F4F' }]}>{d.subjects.length} subject{d.subjects.length > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View style={styles.defaulterSubjects}>
                  {d.subjects.map((s, k) => (
                    <View key={k} style={styles.defaulterSubjectRow}>
                      <Text style={styles.defaulterSubName}>{s.name}</Text>
                      <Text style={styles.defaulterSubPct}>{s.pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherReportScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F5', paddingTop: 8 },
  topBar: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  topBarSub:   { fontSize: 12, color: '#6B6B6B', marginTop: 2 },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt:       { fontSize: 13, fontWeight: '600', color: '#6B6B6B' },
  tabTxtActive: { color: '#fff' },

  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  classLabel: {
    fontSize: 11, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden', marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 10,
  },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  subjectMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  chevron:     { fontSize: 22, color: '#C0C0C0' },

  studentList: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  listHeader: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  colTxt: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', width: 70, textAlign: 'right' },

  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  studentRowAlert: { backgroundColor: '#FFF8F8' },
  studentName: { fontSize: 14, fontWeight: '500', color: '#1C1C1C' },
  studentStat: { fontSize: 13, color: '#6B6B6B', width: 70, textAlign: 'right' },

  badge: {
    borderWidth: 1, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3,
    marginLeft: 8,
  },
  badgeTxt: { fontSize: 12, fontWeight: '700' },

  defaulterCard: { borderLeftWidth: 3, borderLeftColor: '#D94F4F' },
  defaulterHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  defaulterName:     { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  defaulterSubjects: { paddingHorizontal: 14, paddingBottom: 12, gap: 4 },
  defaulterSubjectRow: { flexDirection: 'row', justifyContent: 'space-between' },
  defaulterSubName:  { fontSize: 13, color: '#6B6B6B' },
  defaulterSubPct:   { fontSize: 13, fontWeight: '700', color: '#D94F4F' },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24,
    alignItems: 'center', gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTxt:   { fontSize: 14, color: '#6B6B6B' },
});
