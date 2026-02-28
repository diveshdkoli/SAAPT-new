import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

const DEFAULTER_THRESHOLD = 75;

const MY_ATTENDANCE = [
  { id: 's1', subject: 'Mathematics', present: 16, total: 18 },
  { id: 's2', subject: 'Physics', present: 10, total: 14 },
  { id: 's3', subject: 'Chemistry', present: 12, total: 14 },
  { id: 's4', subject: 'English', present: 8, total: 12 },
  { id: 's5', subject: 'Biology', present: 11, total: 14 },
];

const CLASS_DEFAULTERS = [
  { name: 'Rohan Mehta', rollNo: '03', pct: 55, subjects: ['Mathematics', 'English'] },
  { name: 'Arjun Singh', rollNo: '05', pct: 44, subjects: ['Mathematics', 'Physics'] },
  { name: 'Sneha Verma', rollNo: '04', pct: 42, subjects: ['Physics', 'Biology'] },
];

const pct = (p, t) => Math.round((p / t) * 100);

const ProgressBar = ({ percentage, color }) => (
  <View style={styles.progressBg}>
    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
  </View>
);

const TABS = ['My Attendance', 'Class Defaulters'];

const StudentReportScreen = () => {
  const [tab, setTab] = useState(0);

  const overallPct = Math.round(
    MY_ATTENDANCE.reduce((a, s) => a + pct(s.present, s.total), 0) / MY_ATTENDANCE.length
  );

  return (
<SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar
        barStyle="dark-content"
        backgroundColor="#F4F7F5"
        translucent={false}
      />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>My Report</Text>
        <View style={[styles.overallBadge, { backgroundColor: overallPct >= DEFAULTER_THRESHOLD ? '#E6F0EA' : '#FFF0F0' }]}>
          <Text style={[styles.overallTxt, { color: overallPct >= DEFAULTER_THRESHOLD ? Colors.primary : '#D94F4F' }]}>
            Overall {overallPct}%
          </Text>
        </View>
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

        {/* ── TAB 1: My Attendance ── */}
        {tab === 0 && (
          <>
            {MY_ATTENDANCE.map((sub) => {
              const p = pct(sub.present, sub.total);
              const isLow = p < DEFAULTER_THRESHOLD;
              const color = isLow ? '#D94F4F' : Colors.primary;
              const needed = isLow
                ? Math.ceil((DEFAULTER_THRESHOLD * sub.total - 100 * sub.present) / (100 - DEFAULTER_THRESHOLD))
                : null;

              return (
                <View key={sub.id} style={[styles.card, isLow && styles.cardAlert]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.subjectName}>{sub.subject}</Text>
                    <Text style={[styles.pctTxt, { color }]}>{p}%</Text>
                  </View>
                  <ProgressBar percentage={p} color={color} />
                  <View style={styles.cardFooter}>
                    <Text style={styles.sessionTxt}>{sub.present}/{sub.total} sessions attended</Text>
                    {isLow && (
                      <Text style={styles.warningTxt}>⚠️ Need {needed} more to reach 75%</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ── TAB 2: Class Defaulters ── */}
        {tab === 1 && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoTxt}>
                Students in your class (CM1 – A) with attendance below {DEFAULTER_THRESHOLD}%
              </Text>
            </View>
            {CLASS_DEFAULTERS.map((d, i) => (
              <View key={i} style={styles.defaulterCard}>
                <View style={styles.defaulterLeft}>
                  <View style={styles.rollBadge}>
                    <Text style={styles.rollNo}>{d.rollNo}</Text>
                  </View>
                  <View>
                    <Text style={styles.defaulterName}>{d.name}</Text>
                    <Text style={styles.defaulterSubs}>{d.subjects.join(', ')}</Text>
                  </View>
                </View>
                <View style={styles.defaulterBadge}>
                  <Text style={styles.defaulterPct}>{d.pct}%</Text>
                </View>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentReportScreen;

const styles = StyleSheet.create({
safe: { flex: 1, backgroundColor: '#F4F7F5' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1C' },
  overallBadge: { borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5 },
  overallTxt: { fontSize: 13, fontWeight: '700' },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  tabBtnActive: { backgroundColor: '#7C5CBF', borderColor: '#7C5CBF' },
  tabTxt: { fontSize: 13, fontWeight: '600', color: '#6B6B6B' },
  tabTxtActive: { color: '#fff' },

  scroll: { padding: 16, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardAlert: { borderLeftWidth: 3, borderLeftColor: '#D94F4F' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  pctTxt: { fontSize: 16, fontWeight: '800' },
  progressBg: { height: 7, backgroundColor: '#F0F0F0', borderRadius: 50, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 50 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sessionTxt: { fontSize: 12, color: '#6B6B6B' },
  warningTxt: { fontSize: 12, color: '#D94F4F', fontWeight: '600' },

  infoBox: {
    backgroundColor: '#FFF8E6', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#D97706',
  },
  infoTxt: { fontSize: 13, color: '#92600A', lineHeight: 20 },

  defaulterCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: '#D94F4F',
  },
  defaulterLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rollBadge: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  rollNo: { fontSize: 12, fontWeight: '700', color: '#D94F4F' },
  defaulterName: { fontSize: 15, fontWeight: '600', color: '#1C1C1C' },
  defaulterSubs: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  defaulterBadge: {
    backgroundColor: '#FFF0F0', borderRadius: 50,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FFCCCC',
  },
  defaulterPct: { fontSize: 14, fontWeight: '800', color: '#D94F4F' },
});
