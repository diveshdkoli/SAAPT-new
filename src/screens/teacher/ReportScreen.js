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
import * as Print from 'expo-print';
// expo-print: converts an HTML string into a real PDF file saved on device
// printToFileAsync() returns a file URI like "file:///data/.../print.pdf"

import * as Sharing from 'expo-sharing';
// expo-sharing: opens the native Android/iOS share sheet
// teacher can save to Files, WhatsApp, email, Google Drive etc.
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

// ── Date helpers for Tab 2 defaulter filter ───────────────────────────────────

const todayISO = () =>
  new Date().toISOString().split('T')[0];
// toISOString() → "2026-03-14T10:30:00.000Z"
// .split('T')[0] → takes only the date part → "2026-03-14"
// used as the default "To Date" value

const monthAgoISO = () => {
  const d = new Date();       // current date
  d.setMonth(d.getMonth() - 1); // go back 1 month
  return d.toISOString().split('T')[0]; // format as YYYY-MM-DD
};
// used as the default "From Date" value
// so by default the filter covers the last 30 days

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
// converts "2026-02-14" → "14 Feb 2026"
// en-IN = Indian locale, used in PDF header and result subtitle

// pctNull — same as pct() but returns null when total is 0
// WHY a separate function: in Tab 1, 0/0 = 0% is fine for display
// but in Tab 2 defaulter calc, 0/0 = null means "no data" which is
// different from 0% — we don't want to mark a student as defaulter
// just because no sessions happened for that type
const pctNull = (p, t) => (t === 0 ? null : Math.round((p / t) * 100));

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

  // ── Tab 2 Defaulter state ─────────────────────────────────────────────────
  const [fromDate,    setFromDate]    = useState(monthAgoISO());
  // fromDate: start of date range, default = 1 month ago
  // stored as "YYYY-MM-DD" string — matches how dates are saved in Firestore

  const [toDate,      setToDate]      = useState(todayISO());
  // toDate: end of date range, default = today

  const [threshold,   setThreshold]   = useState('75');
  // threshold: the attendance % below which a student is a defaulter
  // stored as STRING because it comes from a TextInput
  // parsed to number with parseFloat() before math

  const [calculating, setCalculating] = useState(false);
  // true while the defaulter calculation is running
  // disables the Calculate button and shows a spinner

  const [defaulters,  setDefaulters]  = useState(null);
  // null = not yet calculated (shows prompt to press Calculate)
  // [] = calculated but no one is a defaulter
  // [...] = list of defaulter objects

  const [exporting,   setExporting]   = useState(false);
  // true while PDF is being generated and shared
  // disables the PDF button during export

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

  // ── Calculate Defaulters (Tab 2) ──────────────────────────────────────────
  // WHY: teacher selects date range + threshold → we fetch attendance docs
  // for the selected class → split by sessionType → count per student →
  // flag anyone below threshold as defaulter
  const calculateDefaulters = async () => {

    // Guard: must have a class selected
    if (!selectedClass) {
      Alert.alert('Select Class', 'Please select a class first.');
      return;
    }

    // Guard: dates must be filled
    if (!fromDate || !toDate) {
      Alert.alert('Select Dates', 'Please enter both from and to dates.');
      return;
    }

    // Guard: from must be before to
    // String comparison works here because format is YYYY-MM-DD
    // "2026-01-01" < "2026-03-14" ✅
    if (fromDate > toDate) {
      Alert.alert('Invalid Range', 'From date must be before To date.');
      return;
    }

    // parseFloat converts string "75" → number 75
    // isNaN = "is Not a Number" — catches if teacher typed letters
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
      Alert.alert('Invalid Threshold', 'Enter a number between 0 and 100.');
      return;
    }

    setCalculating(true); // show spinner on button
    setDefaulters(null);  // clear previous results while recalculating

    try {
      // selectedClass.classId is the Firestore document ID of the class
      const classId = selectedClass.classId;

      // Step 1: get list of student UIDs from the classes doc
      // WHY: classes/{classId} has a students[] array of UIDs
      const classSnap = await getDoc(doc(db, 'classes', classId));
      const studentUids = classSnap.exists()
        ? (classSnap.data().students ?? [])
        // ?? [] means: if students field is missing, use empty array
        : [];

      // If no students in class, return empty defaulter list immediately
      if (studentUids.length === 0) {
        setDefaulters([]);
        setCalculating(false);
        return;
      }

      // Step 2: fetch student names from users collection
      // WHY: we need names for display and PDF — UIDs alone aren't readable
      // nameMap = { "uid123": "Ravi Sharma", "uid456": "Priya Patel", ... }
      const nameMap = {};
      await Promise.all(studentUids.map(async (uid) => {
        // Promise.all runs all fetches simultaneously — faster than one by one
        try {
          // where('__name__', '==', uid) queries by document ID
          // __name__ is Firestore's special field for document ID
          const uSnap = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', uid))
          );
          if (!uSnap.empty) {
            const d = uSnap.docs[0].data();
            nameMap[uid] = d.full_name ?? d.name ?? uid;
            // full_name is our Firestore field name
            // fallback to name, then to uid if both missing
          } else {
            nameMap[uid] = uid; // UID as fallback if user doc missing
          }
        } catch {
          nameMap[uid] = uid; // network error for this one — use UID
        }
      }));

      // Step 3: fetch all attendance sessions for this class
      // WHY: one query gets everything, then we filter by date in JS
      // This is more efficient than querying with date range in Firestore
      // because Firestore charges per read, and we need all sessions anyway
      const attSnap = await getDocs(
        query(collection(db, 'attendance'), where('classId', '==', classId))
      );

      // Step 4: filter sessions to only those within the date range
      // d.date is stored as "YYYY-MM-DD" string in Firestore
      // string comparison works: "2026-01-01" >= "2026-01-01" ✅
      const sessions = attSnap.docs
        .map(d => d.data())
        .filter(d => d.date >= fromDate && d.date <= toDate);

      // Step 5: separate sessions by type
      // lectureSessions = all docs where sessionType is "lecture" (or missing)
      // ?? 'lecture' handles OLD attendance docs saved before sessionType was added
      // those old docs have no sessionType field, so they default to lecture
      const lectureSessions   = sessions.filter(
        s => (s.sessionType ?? 'lecture') === 'lecture'
      );
      const practicalSessions = sessions.filter(
        s => s.sessionType === 'practical'
      );

      const totalLectures   = lectureSessions.length;
      // how many lecture sessions happened in the date range for this class
      const totalPracticals = practicalSessions.length;
      // how many practical sessions happened

      // Step 6: for each student, count how many they attended
      const results = studentUids.map(uid => {

        // Count lectures this student was present for
        let lecturePresent = 0;
        lectureSessions.forEach(session => {
          // session.records is the array like:
          // [{ studentId: "abc", name: "Ravi", status: "present" }, ...]
          // .find() searches for the record belonging to THIS student
          const record = (session.records ?? []).find(r => r.studentId === uid);
          // if found AND status is present → increment counter
          if (record && record.status === 'present') lecturePresent++;
        });

        // Count practicals this student was present for
        let practicalPresent = 0;
        practicalSessions.forEach(session => {
          const record = (session.records ?? []).find(r => r.studentId === uid);
          if (record && record.status === 'present') practicalPresent++;
        });

        // Calculate percentages using pctNull (returns null if no sessions)
        // WHY null and not 0: if no practicals happened, we shouldn't
        // penalize the student with 0% practical attendance
        const lecturePct   = pctNull(lecturePresent,   totalLectures);
        const practicalPct = pctNull(practicalPresent, totalPracticals);

        // Calculate overall percentage
        let overallPct;
        if (lecturePct !== null && practicalPct !== null) {
          // BOTH types exist → average them
          // e.g. lecture 80% + practical 60% → overall 70%
          overallPct = Math.round((lecturePct + practicalPct) / 2);
        } else if (lecturePct !== null) {
          // only lectures in range → overall = lecture %
          overallPct = lecturePct;
        } else if (practicalPct !== null) {
          // only practicals in range → overall = practical %
          overallPct = practicalPct;
        } else {
          // NO sessions at all → null means "no data"
          // this student won't appear in defaulter list
          overallPct = null;
        }

        return {
          uid,
          name:            nameMap[uid] ?? uid,
          lecturePresent,
          totalLectures,
          lecturePct,
          practicalPresent,
          totalPracticals,
          practicalPct,
          overallPct,
          isDefaulter: overallPct !== null && overallPct < thresholdNum,
          // isDefaulter = true only if:
          // 1. we have actual data (not null — no data ≠ defaulter)
          // 2. AND overall % is strictly below threshold
        };
      });

      // Step 7: keep only defaulters, sort worst first (ascending %)
      const defaulterList = results
        .filter(s => s.isDefaulter)
        // sort ascending so the student with lowest attendance appears first
        // (a.overallPct ?? 0) — ?? 0 is safety but nulls are filtered out above
        .sort((a, b) => (a.overallPct ?? 0) - (b.overallPct ?? 0));

      setDefaulters(defaulterList); // update UI with results

    } catch (e) {
      console.error('calculateDefaulters error:', e);
      Alert.alert('Error', 'Failed to calculate. Check internet and try again.');
    } finally {
      setCalculating(false); // hide spinner regardless of success or failure
    }
  };

  // ── Export PDF (Tab 2) ────────────────────────────────────────────────────
  // WHY: teacher may need to submit the defaulter list to HOD or print it
  // expo-print converts HTML → PDF file on device
  // expo-sharing opens native share sheet to save/send the file
  const exportPDF = async () => {
    if (!defaulters || defaulters.length === 0) return;
    setExporting(true);
    try {
      // Build HTML table rows for each defaulter
      // map((s, i) => ...) — s = student object, i = index (0,1,2...)
      const rows = defaulters.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
          <td>${i + 1}</td>
          <td>${s.name}</td>
          <td>${s.lecturePct !== null ? s.lecturePct + '%' : '—'}
              (${s.lecturePresent}/${s.totalLectures})</td>
          <td>${s.practicalPct !== null ? s.practicalPct + '%' : '—'}
              (${s.practicalPresent}/${s.totalPracticals})</td>
          <td style="color:#EF4444;font-weight:bold">${s.overallPct}%</td>
        </tr>
      `).join('');
      // .join('') combines all row strings into one big string with no separator

      // Build complete HTML document
      // Template literals (backticks) allow multi-line strings and ${} variables
      const html = `
        <html><head><meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1E1B4B; }
          h1   { font-size: 24px; color: #4F46E5; margin-bottom: 4px; }
          .sub { font-size: 13px; color: #6B7280; margin-bottom: 20px; }
          .info-row { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
          .info-box { background: #EEF2FF; border-radius: 8px; padding: 10px 16px; }
          .info-box .val { font-size: 16px; font-weight: bold; color: #4F46E5; }
          .info-box .lbl { font-size: 11px; color: #6B7280; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #4F46E5; color: white; padding: 10px 12px; text-align: left; }
          td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; }
          .footer { margin-top: 24px; font-size: 11px; color: #9CA3AF; text-align: center; }
        </style>
        </head><body>
        <h1>SAAPT — Defaulter List</h1>
        <div class="sub">Generated on ${fmtDate(todayISO())}</div>
        <div class="info-row">
          <div class="info-box">
            <div class="val">${selectedClass?.className}</div>
            <div class="lbl">Class</div>
          </div>
          <div class="info-box">
            <div class="val">${fmtDate(fromDate)} → ${fmtDate(toDate)}</div>
            <div class="lbl">Date Range</div>
          </div>
          <div class="info-box">
            <div class="val">Below ${threshold}%</div>
            <div class="lbl">Threshold</div>
          </div>
          <div class="info-box">
            <div class="val" style="color:#EF4444">${defaulters.length}</div>
            <div class="lbl">Defaulters</div>
          </div>
        </div>
        <table>
          <thead><tr>
            <th>#</th><th>Student Name</th>
            <th>Lectures</th><th>Practicals</th><th>Overall</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">SAAPT Attendance Management System</div>
        </body></html>
      `;

      // expo-print converts the HTML string to a PDF file saved on device
      // { uri } destructures the return value — uri is the file path
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      // base64: false means return a file path, not a base64 string

      // expo-sharing opens the native share sheet
      // teacher can save to Files, email, WhatsApp, Google Drive etc.
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',       // tells OS this is a PDF
        dialogTitle: 'Save Defaulter List', // text shown in share sheet title
        UTI: 'com.adobe.pdf',              // iOS file type identifier
      });
    } catch (e) {
      console.error('exportPDF error:', e);
      Alert.alert('Export Failed', 'Could not generate PDF. Try again.');
    } finally {
      setExporting(false); // re-enable PDF button regardless of outcome
    }
  };

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
                  Now has date range + threshold + calculate + PDF export
                  Same logic as admin ReportsScreen but shown here for teacher
              ════════════════════ */}
              {activeTab === 1 && (
                <View style={styles.tabContent}>

                  {/* ── Filter Card ───────────────────────────────────────── */}
                  {/* WHY a card: groups all filter controls visually */}
                  <View style={styles.filterCard}>
                    <Text style={styles.filterCardTitle}>🔧 Filter Settings</Text>

                    {/* ── Date Range ── */}
                    {/* Two side-by-side date inputs inside a row */}
                    <View style={styles.dateRow}>

                      {/* FROM DATE */}
                      <View style={styles.dateInputWrap}>
                        <Text style={styles.dateInputLabel}>FROM DATE</Text>
                        <View style={styles.dateInputBox}>
                          <Text style={styles.dateInputIcon}>📅</Text>
                          <TextInput
                            style={styles.dateInputField}
                            value={fromDate}
                            // onChangeText fires every time teacher types a character
                            // setFromDate updates the state → re-renders the input
                            onChangeText={setFromDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="numeric"
                            // numeric keyboard — easier to type dates on phone
                            maxLength={10}
                            // max 10 chars = "YYYY-MM-DD" exactly
                          />
                        </View>
                      </View>

                      {/* TO DATE */}
                      <View style={styles.dateInputWrap}>
                        <Text style={styles.dateInputLabel}>TO DATE</Text>
                        <View style={styles.dateInputBox}>
                          <Text style={styles.dateInputIcon}>📅</Text>
                          <TextInput
                            style={styles.dateInputField}
                            value={toDate}
                            onChangeText={setToDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="numeric"
                            maxLength={10}
                          />
                        </View>
                      </View>

                    </View>
                    {/* end dateRow */}

                    {/* ── Threshold % ── */}
                    <Text style={styles.thresholdLabel}>
                      THRESHOLD % (students below this = defaulter)
                    </Text>

                    {/* Quick-select chips + custom input in a wrapping row */}
                    {/* flexWrap:'wrap' means chips overflow to next line on small screens */}
                    <View style={styles.thresholdRow}>

                      {/* ['60','65','70','75','80','85'] — common threshold values */}
                      {/* .map() creates one chip button per value */}
                      {['60','65','70','75','80','85'].map(t => (
                        <TouchableOpacity
                          key={t}
                          // key={t} — React needs a unique key for each item in a list
                          style={[
                            styles.thresholdChip,
                            // if this chip's value matches current threshold → highlight it
                            threshold === t && styles.thresholdChipActive,
                          ]}
                          onPress={() => setThreshold(t)}
                          // tapping a chip sets threshold to that value (as string)
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.thresholdChipTxt,
                            threshold === t && styles.thresholdChipTxtActive,
                          ]}>
                            {t}%
                          </Text>
                        </TouchableOpacity>
                      ))}

                      {/* Custom input — teacher can type any number */}
                      <View style={styles.thresholdCustomBox}>
                        <TextInput
                          style={styles.thresholdCustomInput}
                          value={threshold}
                          onChangeText={setThreshold}
                          // typing here also updates threshold state
                          // so if teacher types "72", none of the chips will be highlighted
                          // (none of them === "72")
                          keyboardType="numeric"
                          maxLength={3}
                          // max 3 chars because 100 is the highest valid value
                          placeholder="Custom"
                          placeholderTextColor={COLORS.textLight}
                        />
                      </View>

                    </View>
                    {/* end thresholdRow */}

                    {/* ── Calculate Button ── */}
                    <TouchableOpacity
                      style={[
                        styles.calcBtn,
                        calculating && styles.calcBtnDisabled,
                        // when calculating=true, apply grey disabled style
                      ]}
                      onPress={calculateDefaulters}
                      // calls our function defined above
                      disabled={calculating}
                      // disabled=true means taps are ignored while running
                      activeOpacity={0.85}
                    >
                      {calculating
                        ? <ActivityIndicator color="#fff" />
                        // show white spinner while calculating
                        : <Text style={styles.calcBtnTxt}>Calculate Defaulters</Text>
                      }
                    </TouchableOpacity>

                  </View>
                  {/* end filterCard */}

                  {/* ── Results ── */}
                  {/* Only shown after Calculate has been pressed */}
                  {/* defaulters === null means not yet calculated → show nothing */}
                  {defaulters !== null && (
                    <View style={styles.filterCard}>

                      {/* Result header row: title on left, PDF button on right */}
                      <View style={styles.resultHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.filterCardTitle}>
                            {defaulters.length === 0
                              ? '✅ No Defaulters'
                              // ternary: if length is 0 → show success message
                              : `⚠️ ${defaulters.length} Defaulter${defaulters.length > 1 ? 's' : ''}`
                              // pluralize: 1 Defaulter vs 2 Defaulters
                            }
                          </Text>
                          {/* Subtitle showing the filter that was used */}
                          <Text style={styles.resultSub}>
                            {selectedClass?.className}  ·  {fmtDate(fromDate)} → {fmtDate(toDate)}  ·  Below {threshold}%
                          </Text>
                        </View>

                        {/* PDF button — only shown when there ARE defaulters */}
                        {defaulters.length > 0 && (
                          <TouchableOpacity
                            style={[styles.pdfBtn, exporting && styles.pdfBtnDisabled]}
                            onPress={exportPDF}
                            disabled={exporting}
                            activeOpacity={0.8}
                          >
                            {exporting
                              ? <ActivityIndicator color="#fff" size="small" />
                              : <Text style={styles.pdfBtnTxt}>⬇ PDF</Text>
                            }
                          </TouchableOpacity>
                        )}
                      </View>
                      {/* end resultHeader */}

                      {/* ── Empty result ── */}
                      {defaulters.length === 0 ? (
                        <View style={styles.emptyCard}>
                          <Text style={styles.emptyIcon}>🎉</Text>
                          <Text style={styles.emptyTitle}>No Defaulters!</Text>
                          <Text style={styles.emptySubText}>
                            All students are above {threshold}% in this period.
                          </Text>
                        </View>

                      ) : (
                        // ── Defaulter Table ──
                        <>
                          {/* Column header row */}
                          <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderTxt, { flex: 0.4 }]}>#</Text>
                            <Text style={[styles.tableHeaderTxt, { flex: 2   }]}>Name</Text>
                            <Text style={[styles.tableHeaderTxt, { flex: 1, textAlign: 'center' }]}>📖 Lec</Text>
                            <Text style={[styles.tableHeaderTxt, { flex: 1, textAlign: 'center' }]}>🔬 Prac</Text>
                            <Text style={[styles.tableHeaderTxt, { flex: 1, textAlign: 'center' }]}>Overall</Text>
                          </View>

                          {/* One row per defaulter student */}
                          {defaulters.map((student, i) => (
                            <View
                              key={student.uid}
                              // key must be unique — uid is unique per student
                              style={[
                                styles.tableRow,
                                i % 2 === 1 && styles.tableRowAlt,
                                // alternate row background (zebra striping)
                                // i % 2 === 1 means odd index rows get grey background
                              ]}
                            >
                              {/* Serial number */}
                              <Text style={[styles.tableCell, { flex: 0.4, color: COLORS.textLight }]}>
                                {i + 1}
                              </Text>

                              {/* Student name — truncates if too long */}
                              <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                                {student.name}
                              </Text>

                              {/* Lecture % — blue color, shows — if no lecture data */}
                              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: COLORS.primary }]}>
                                {student.lecturePct !== null ? `${student.lecturePct}%` : '—'}
                              </Text>

                              {/* Practical % — purple color */}
                              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: '#7C3AED' }]}>
                                {student.practicalPct !== null ? `${student.practicalPct}%` : '—'}
                              </Text>

                              {/* Overall % — red badge because this student is a defaulter */}
                              <View style={[styles.tableCellCenter, { flex: 1 }]}>
                                <View style={styles.defaulterBadge}>
                                  <Text style={styles.defaulterBadgeTxt}>
                                    {student.overallPct}%
                                  </Text>
                                </View>
                              </View>

                            </View>
                          ))}
                        </>
                      )}

                    </View>
                  )}
                  {/* end results card */}

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

  // ── Tab 2 Defaulter styles ─────────────────────────────────────────────────

  filterCard: {
    // white card wrapping the filter controls and results
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  filterCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },

  // Date range row — two inputs side by side
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dateInputWrap: { flex: 1 },
  // flex:1 means each input takes equal half of the row width
  dateInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: '#F9FAFB',
  },
  dateInputIcon: { fontSize: 13, marginRight: 6 },
  dateInputField: { flex: 1, fontSize: 13, color: COLORS.text },
  // flex:1 makes the text input fill remaining space after the emoji icon

  // Threshold chips
  thresholdLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  thresholdRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // flexWrap:'wrap' allows chips to overflow to the next line
    gap: 8,
    marginBottom: 16,
  },
  thresholdChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
  },
  thresholdChipActive: {
    // highlighted state when this chip matches current threshold value
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  thresholdChipTxt:       { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  thresholdChipTxtActive: { color: COLORS.primary },
  thresholdCustomBox: {
    // custom input styled to look like a chip
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minWidth: 72,
    // minWidth ensures it doesn't collapse too small
  },
  thresholdCustomInput: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Calculate button
  calcBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  calcBtnDisabled: {
    backgroundColor: '#9AA5B1',
    // grey when disabled — visually shows button is not tappable
    elevation: 0,
  },
  calcBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Result header (title + PDF button side by side)
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  // PDF button
  pdfBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pdfBtnDisabled: { backgroundColor: '#9AA5B1' },
  pdfBtnTxt:      { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Defaulter table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  tableHeaderTxt: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tableRowAlt:    { backgroundColor: '#F9FAFB' },
  // alternate rows get a light grey background (zebra striping)
  tableCell:      { fontSize: 13, fontWeight: '600', color: COLORS.text },
  tableCellCenter:{ alignItems: 'center' },
  defaulterBadge: {
    backgroundColor: COLORS.dangerLight,
    // light red background — signals danger/failure
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaulterBadgeTxt: { fontSize: 12, fontWeight: '800', color: COLORS.danger },

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