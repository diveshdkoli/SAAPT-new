import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db, auth } from '../../services/firebase/config';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Secondary Firebase app — used ONLY for creating users
// so admin auth session is NEVER interrupted
const SECONDARY_APP_NAME = 'SecondaryApp';

const getSecondaryAuth = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyAmvBa6G9kt6Vrjx0_tf_QJoKAwMPrMSLA",
    authDomain: "saapt-new.firebaseapp.com",
    projectId: "saapt-new",
    storageBucket: "saapt-new.firebasestorage.app",
    messagingSenderId: "1084667160499",
    appId: "1:1084667160499:web:9f45f6cf28de68c4090dc6"
  };

  // Reuse if already initialized
  const existing = getApps().find(app => app.name === SECONDARY_APP_NAME);
  if (existing) return getAuth(existing);

  const secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
};


// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  secondary: '#06B6D4',
  secondaryLight: '#ECFEFF',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  background: '#F8F9FE',
  card: '#FFFFFF',
  text: '#1E1B4B',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  inputBg: '#F3F4F6',
  shadow: '#1E1B4B',
};

// ─── Filter Tabs Config ───────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'all',     label: 'All',      icon: '👥' },
  { key: 'teacher', label: 'Teachers', icon: '👩‍🏫' },
];
// Students removed — teachers only in this tab
// Students are created inside Classes tab per class

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  teacher: {
    label: 'Teacher',
    icon: '👩‍🏫',
    color: COLORS.primary,
    lightColor: COLORS.primaryLight,
    initBg: '#4F46E5',
  },
  // student removed — students created inside Classes tab
};

// Default password for all teachers created by admin
// WHY hardcoded: team will implement proper generation later
// Teacher can reset via Forgot Password
const DEFAULT_TEACHER_PASSWORD = 'saapt123456';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase() || '?';
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

// ─── Excel Instructions Modal ─────────────────────────────────────────────────
// Shows required column names before allowing file upload
const ExcelInstructionsModal = ({ visible, onClose, onProceed }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.sheet, { borderRadius: 24, marginHorizontal: 20 }]}>
        <View style={modalStyles.handle} />
        <Text style={modalStyles.title}>📊 Excel Upload Instructions</Text>
        <Text style={[modalStyles.subtitle, { marginBottom: 16 }]}>
          Make sure your Excel file has these exact column names in row 1:
        </Text>

        {[
          { col: 'name',  req: true,  desc: 'Full name of teacher' },
          { col: 'email', req: true,  desc: 'Email address (used for login)' },
          { col: 'phone', req: false, desc: 'Phone number' },
        ].map(({ col, req, desc }) => (
          <View key={col} style={modalStyles.colRow}>
            <View style={[modalStyles.colBadge, { backgroundColor: req ? COLORS.dangerLight : COLORS.successLight }]}>
              <Text style={[modalStyles.colBadgeTxt, { color: req ? COLORS.danger : COLORS.success }]}>
                {req ? 'Required' : 'Optional'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.colName}>{col}</Text>
              <Text style={modalStyles.colDesc}>{desc}</Text>
            </View>
          </View>
        ))}

        <View style={modalStyles.infoBox}>
          <Text style={modalStyles.infoTxt}>
            ⚠️ Column names are case-sensitive. Password auto-set to saapt123456 for all teachers.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <TouchableOpacity
            style={[modalStyles.saveBtn, { flex: 1, backgroundColor: COLORS.border }]}
            onPress={onClose} activeOpacity={0.8}
          >
            <Text style={[modalStyles.saveBtnText, { color: COLORS.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.saveBtn, { flex: 1, backgroundColor: COLORS.primary }]}
            onPress={onProceed} activeOpacity={0.85}
          >
            <Text style={modalStyles.saveBtnText}>Pick File  →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </View>
    </View>
  </Modal>
);

// ─── Excel Preview Screen ─────────────────────────────────────────────────────
// Shows parsed teachers, allows inline editing, then commits to Firestore
const ExcelPreviewScreen = ({ teachers: initialTeachers, onBack, onCommit, committing }) => {
  const [teachers, setTeachers] = useState(
    initialTeachers.map((t, i) => ({ ...t, _key: String(i) }))
  );
  const [editingKey, setEditingKey] = useState(null);
  const [editVals,   setEditVals]   = useState({});

  const startEdit = (teacher) => {
    setEditingKey(teacher._key);
    setEditVals({ ...teacher });
  };

  const saveEdit = () => {
    setTeachers(prev =>
      prev.map(t => t._key === editingKey ? { ...editVals, _key: editingKey } : t)
    );
    setEditingKey(null);
  };

  const removeTeacher = (key) => {
    Alert.alert('Remove', 'Remove this teacher from the list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive',
        onPress: () => setTeachers(prev => prev.filter(t => t._key !== key)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.previewHeader}>
        <TouchableOpacity style={styles.previewBackBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.previewBackTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewTitle}>Preview Teachers</Text>
          <Text style={styles.previewSub}>{teachers.length} teachers — review before committing</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>

          <View style={modalStyles.infoBox}>
            <Text style={modalStyles.infoTxt}>
              📝 Tap ✏️ to edit any teacher's info. Tap 🗑️ to remove. Then tap Commit.
            </Text>
          </View>

          {teachers.map((teacher) => (
            <View key={teacher._key} style={styles.previewCard}>
              {editingKey === teacher._key ? (
                // ── Inline edit form ────────────────────────────────────────
                <View>
                  <Text style={styles.previewEditTitle}>Editing teacher</Text>
                  {[
                    { key: 'name',  label: 'Name',  keyboard: 'default' },
                    { key: 'email', label: 'Email', keyboard: 'email-address' },
                    { key: 'phone', label: 'Phone', keyboard: 'phone-pad' },
                  ].map(({ key, label, keyboard }) => (
                    <View key={key} style={styles.previewEditRow}>
                      <Text style={styles.previewEditLabel}>{label}</Text>
                      <TextInput
                        style={styles.previewEditInput}
                        value={editVals[key] ?? ''}
                        onChangeText={v => setEditVals(prev => ({ ...prev, [key]: v }))}
                        keyboardType={keyboard}
                        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
                        placeholderTextColor={COLORS.textLight}
                      />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[modalStyles.saveBtn, { backgroundColor: COLORS.success }]}
                    onPress={saveEdit} activeOpacity={0.85}
                  >
                    <Text style={modalStyles.saveBtnText}>✓ Save Changes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // ── Read-only row ──────────────────────────────────────────
                <View style={styles.previewRow}>
                  <View style={[styles.previewAvatar, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.previewAvatarTxt}>{getInitials(teacher.name || '?')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewName}>{teacher.name || '—'}</Text>
                    <Text style={styles.previewEmail}>{teacher.email || '—'}</Text>
                    {!!teacher.phone && (
                      <Text style={styles.previewMeta}>📞 {teacher.phone}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.previewAction, { backgroundColor: COLORS.primaryLight }]}
                      onPress={() => startEdit(teacher)} activeOpacity={0.7}
                    >
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.previewAction, { backgroundColor: COLORS.dangerLight }]}
                      onPress={() => removeTeacher(teacher._key)} activeOpacity={0.7}
                    >
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Commit button */}
          <TouchableOpacity
            style={[modalStyles.saveBtn, { backgroundColor: COLORS.success }, committing && modalStyles.saveBtnDisabled]}
            onPress={() => onCommit(teachers)}
            disabled={committing || teachers.length === 0}
            activeOpacity={0.85}
          >
            {committing
              ? <ActivityIndicator color="#fff" />
              : <Text style={modalStyles.saveBtnText}>
                  ✅ Commit {teachers.length} Teacher{teachers.length !== 1 ? 's' : ''} to Database
                </Text>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Add Teacher Modal (one by one) ──────────────────────────────────────────
const AddUserModal = ({ visible, onClose, onSave }) => {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const reset = () => { setName(''); setEmail(''); setPhone(''); setSaving(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a full name.'); return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.'); return;
    }
    setSaving(true);
    await onSave({
      name:  name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role:  'teacher',
      // role always teacher — students handled in Classes tab
    });
    setSaving(false);
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.kvWrapper}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />

            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>Add Teacher</Text>
                <Text style={modalStyles.subtitle}>Password auto-set to saapt123456</Text>
              </View>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={handleClose}>
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Name */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>Full Name <Text style={modalStyles.required}>*</Text></Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>👤</Text>
                  <TextInput style={modalStyles.input} placeholder="e.g. John Smith"
                    placeholderTextColor={COLORS.textLight} value={name}
                    onChangeText={setName} autoCapitalize="words" />
                </View>
              </View>

              {/* Email */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>Email Address <Text style={modalStyles.required}>*</Text></Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>📧</Text>
                  <TextInput style={modalStyles.input} placeholder="e.g. teacher@school.com"
                    placeholderTextColor={COLORS.textLight} value={email}
                    onChangeText={setEmail} keyboardType="email-address"
                    autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>

              {/* Phone */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>
                  Phone Number <Text style={modalStyles.optional}>(optional)</Text>
                </Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>📞</Text>
                  <TextInput style={modalStyles.input} placeholder="+91 9876543210"
                    placeholderTextColor={COLORS.textLight} value={phone}
                    onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </View>

              {/* Password note */}
              <View style={modalStyles.infoBox}>
                <Text style={modalStyles.infoTxt}>
                  🔒 Password will be set to <Text style={{ fontWeight: '800' }}>saapt123456</Text> automatically.
                  Teacher can reset it via Forgot Password.
                </Text>
              </View>

              {/* Preview */}
              {name.trim() !== '' && (
                <View style={[modalStyles.previewCard, { borderColor: COLORS.primary + '40' }]}>
                  <View style={[modalStyles.previewAvatar, { backgroundColor: COLORS.primary }]}>
                    <Text style={modalStyles.previewInitials}>{getInitials(name)}</Text>
                  </View>
                  <View style={modalStyles.previewInfo}>
                    <Text style={modalStyles.previewName}>{name}</Text>
                    <Text style={modalStyles.previewEmail} numberOfLines={1}>{email || 'No email yet'}</Text>
                    <View style={[modalStyles.previewBadge, { backgroundColor: COLORS.primaryLight }]}>
                      <Text style={[modalStyles.previewBadgeText, { color: COLORS.primary }]}>
                        👩‍🏫  Teacher
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[modalStyles.saveBtn, saving && modalStyles.saveBtnDisabled]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={modalStyles.saveBtnText}>✓  Add Teacher</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── User Card ────────────────────────────────────────────────────────────────
const UserCard = ({ user, onDelete, onEdit }) => {
  const role = ROLE_CONFIG[user.role] || {
    // Fallback for any role not in ROLE_CONFIG (e.g. existing students in DB)
    // WHY: database may still have users with role:'student' from before
    // We don't crash — just show a neutral grey style
    label:      user.role ?? 'User',
    icon:       '👤',
    color:      COLORS.textSecondary,
    lightColor: COLORS.inputBg,
    initBg:     '#9CA3AF',
  };
  const initials = getInitials(user.name);

  const handleDelete = () => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(user.id) },
      ]
    );
  };

  return (
    <View style={styles.userCard}>
      <View style={[styles.avatarCircle, { backgroundColor: role.initBg }]}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{user.name || 'Unnamed User'}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{user.email || '—'}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, { backgroundColor: role.lightColor }]}>
            <Text style={styles.roleIcon}>{role.icon}</Text>
            <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
          </View>
          {!!formatDate(user.createdAt) && (
            <Text style={styles.dateText}>📅 {formatDate(user.createdAt)}</Text>
          )}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => onEdit(user)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ searchQuery, selectedFilter }) => {
  const isFiltered = searchQuery.length > 0 || selectedFilter !== 'all';
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{isFiltered ? '🔍' : '👥'}</Text>
      <Text style={styles.emptyTitle}>{isFiltered ? 'No results found' : 'No users yet'}</Text>
      <Text style={styles.emptySubtitle}>
        {isFiltered ? 'Try a different search or filter' : 'Add your first teacher or student to get started'}
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const UsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible,      setModalVisible]      = useState(false);
  const [excelInstructions, setExcelInstructions] = useState(false);
  const [excelTeachers,     setExcelTeachers]     = useState([]);
  const [showPreview,       setShowPreview]       = useState(false);
  const [committing,        setCommitting]        = useState(false);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = [...users];
    if (selectedFilter !== 'all') result = result.filter((u) => u.role === selectedFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) =>
        (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      );
    }
    setFilteredUsers(result);
  }, [users, selectedFilter, searchQuery]);

  const handleAddUser = async ({ name, email, phone, role }) => {
    try {
      const secondaryAuth = getSecondaryAuth();
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        DEFAULT_TEACHER_PASSWORD
        // WHY auto-password: admin doesn't set passwords manually anymore
        // Teacher resets via Forgot Password on first login
      );
      const uid = credential.user.uid;
      await secondaryAuth.signOut();

      const newUser = {
        name,
        full_name: name,
        // WHY both: some screens read 'name', others read 'full_name'
        email,
        phone,
        role: 'teacher',
        // always teacher — students handled in Classes tab
        uid,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', uid), newUser);

      setUsers(prev => [{ id: uid, ...newUser, createdAt: new Date() }, ...prev]);
      setModalVisible(false);
      Alert.alert('✅ Added', `${name} has been added as a teacher.`);

    } catch (error) {
      const msg =
        error.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
        error.code === 'auth/invalid-email'         ? 'Please enter a valid email address.' :
        `Failed to add teacher: ${error.message}`;
      Alert.alert('Error', msg);
    }
  };

  // ── Pick and parse Excel file ──────────────────────────────────────────────
  const handleExcelPick = async () => {
    setExcelInstructions(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;

      // Read as base64 using legacy import
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      // Parse with SheetJS
      const workbook = xlsxRead(fileContent, { type: 'base64' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsxUtils.sheet_to_json(firstSheet);

      if (rows.length === 0) {
        Alert.alert('Empty File', 'No data found in the Excel file.');
        return;
      }

      const parsed = rows.map(row => ({
        name:  String(row['name']  ?? row['Name']  ?? '').trim(),
        email: String(row['email'] ?? row['Email'] ?? '').trim().toLowerCase(),
        phone: String(row['phone'] ?? row['Phone'] ?? '').trim(),
      })).filter(t => t.name && t.email);
      // Filter out rows missing name or email

      if (parsed.length === 0) {
        Alert.alert('No Valid Teachers',
          'No rows found with both name and email. Check column names.');
        return;
      }

      setExcelTeachers(parsed);
      setShowPreview(true);

    } catch(e) {
      Alert.alert('Error', 'Failed to read Excel file. Make sure it is a valid .xlsx file.');
      console.error('Excel parse error:', e);
    }
  };

  // ── Commit Excel teachers to Firestore ─────────────────────────────────────
  const handleExcelCommit = async (teachers) => {
    setCommitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const teacher of teachers) {
      try {
        const secondaryAuth = getSecondaryAuth();
        const credential = await createUserWithEmailAndPassword(
          secondaryAuth, teacher.email, DEFAULT_TEACHER_PASSWORD
        );
        const uid = credential.user.uid;
        await secondaryAuth.signOut();

        await setDoc(doc(db, 'users', uid), {
          name:      teacher.name,
          full_name: teacher.name,
          email:     teacher.email,
          phone:     teacher.phone || '',
          role:      'teacher',
          uid,
          createdAt: serverTimestamp(),
        });

        setUsers(prev => [{
          id: uid, name: teacher.name, full_name: teacher.name,
          email: teacher.email, phone: teacher.phone || '',
          role: 'teacher', uid, createdAt: new Date(),
        }, ...prev]);

        successCount++;
      } catch(e) {
        failCount++;
        console.error(`Failed to create ${teacher.email}:`, e.message);
      }
    }

    setCommitting(false);
    setShowPreview(false);
    Alert.alert(
      '✅ Commit Complete',
      `${successCount} teacher${successCount !== 1 ? 's' : ''} added.` +
      (failCount > 0 ? `\n${failCount} failed (email already in use or invalid).` : '')
    );
  };

  const handleDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch { Alert.alert('Error', 'Failed to delete user.'); }
  };

  const handleEdit = (user) => { navigation?.navigate('EditUser', { user }); };
  const onRefresh = useCallback(() => { setRefreshing(true); fetchUsers(); }, []);
  const getCount = (role) => role === 'all' ? users.length : users.filter((u) => u.role === role).length;
  const renderUser = ({ item }) => <UserCard user={item} onDelete={handleDelete} onEdit={handleEdit} />;
  const keyExtractor = (item) => item.id;

  // Show Excel preview screen when active
  if (showPreview) {
    return (
      <ExcelPreviewScreen
        teachers={excelTeachers}
        onBack={() => setShowPreview(false)}
        onCommit={handleExcelCommit}
        committing={committing}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Teachers</Text>
            <Text style={styles.headerSubtitle}>Manage teacher accounts</Text>
          </View>
          {/* Two buttons: Add one + Excel upload */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => setExcelInstructions(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerAddBtnText}>📊 Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerAddBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setSelectedFilter(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.icon}  {tab.label}</Text>
                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>{getCount(tab.key)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Results meta */}
        {!loading && (
          <View style={styles.resultsMeta}>
            <Text style={styles.resultsText}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </Text>
          </View>
        )}

        {/* List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={keyExtractor}
            renderItem={renderUser}
            contentContainerStyle={[styles.listContent, filteredUsers.length === 0 && styles.listContentEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState searchQuery={searchQuery} selectedFilter={selectedFilter} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Add Teacher Modal */}
      <AddUserModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddUser}
      />

      {/* Excel Instructions Modal */}
      <ExcelInstructionsModal
        visible={excelInstructions}
        onClose={() => setExcelInstructions(false)}
        onProceed={handleExcelPick}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 75, 0.5)',
    justifyContent: 'flex-end',
  },
  kvWrapper: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '93%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700' },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },

  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    position: 'relative',
  },
  roleCardIcon: { fontSize: 30, marginBottom: 6 },
  roleCardLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  roleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  roleCheckTick: { color: '#fff', fontSize: 11, fontWeight: '800' },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  required: { color: COLORS.danger },
  optional: { color: COLORS.textLight, fontWeight: '400', fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputIcon: { fontSize: 15, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 13 },
  eyeIcon: { fontSize: 16, paddingLeft: 8 },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    gap: 12,
  },
  previewAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  previewInitials: { color: '#fff', fontWeight: '800', fontSize: 17 },
  previewInfo: { flex: 1, gap: 4 },
  previewName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  previewEmail: { fontSize: 12, color: COLORS.textSecondary },
  previewBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  previewBadgeText: { fontSize: 11, fontWeight: '700' },
  previewCheckCircle: { width: 28, height: 28, borderRadius: 9, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  previewCheckText: { fontSize: 14 },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Excel instruction styles
  colRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10,
                marginBottom: 10, paddingVertical: 4 },
  colBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                minWidth: 64, alignItems: 'center' },
  colBadgeTxt:{ fontSize: 10, fontWeight: '800' },
  colName:    { fontSize: 14, fontWeight: '700', color: COLORS.text },
  colDesc:    { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  infoBox:    { backgroundColor: COLORS.warningLight, borderRadius: 12, padding: 12,
                borderWidth: 1, borderColor: COLORS.warning, marginBottom: 12 },
  infoTxt:    { fontSize: 12, color: COLORS.text, lineHeight: 18 },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 2 },
  headerAddBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerAddBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  body: { flex: 1, paddingTop: 20 },

  searchWrapper: { paddingHorizontal: 18, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 0 },
  clearIcon: { fontSize: 14, color: COLORS.textLight, fontWeight: '600', paddingLeft: 8 },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 18, gap: 10, marginBottom: 14 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, borderRadius: 12,
    paddingVertical: 9, paddingHorizontal: 8, gap: 6,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabLabelActive: { color: '#FFFFFF' },
  tabCount: { backgroundColor: COLORS.inputBg, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  tabCountTextActive: { color: '#FFFFFF' },

  resultsMeta: { paddingHorizontal: 20, marginBottom: 10 },
  resultsText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  listContent: { paddingHorizontal: 18, paddingBottom: 100 },
  listContentEmpty: { flex: 1 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },

  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarInitials: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text, letterSpacing: -0.1 },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '400' },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  roleIcon: { fontSize: 11 },
  roleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  dateText: { fontSize: 11, color: COLORS.textLight, fontWeight: '400' },

  cardActions: { flexDirection: 'column', gap: 8, marginLeft: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: COLORS.primaryLight },
  deleteBtn: { backgroundColor: COLORS.dangerLight },
  actionBtnIcon: { fontSize: 15 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Preview screen styles
  previewHeader:  { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16,
                    paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewBackBtn: { width: 40, height: 40, borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center',
                    justifyContent: 'center', borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.35)' },
  previewBackTxt: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
  previewTitle:   { fontSize: 20, fontWeight: '800', color: '#fff' },
  previewSub:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  previewCard:    { backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
                    marginBottom: 10, elevation: 2 },
  previewRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewAvatar:  { width: 40, height: 40, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center' },
  previewAvatarTxt:{ color: '#fff', fontWeight: '800', fontSize: 14 },
  previewName:    { fontSize: 14, fontWeight: '700', color: COLORS.text },
  previewEmail:   { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  previewMeta:    { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  previewEditTitle:{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  previewEditRow: { marginBottom: 10 },
  previewEditLabel:{ fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  previewEditInput:{ backgroundColor: COLORS.inputBg, borderRadius: 10, paddingHorizontal: 12,
                     paddingVertical: 10, fontSize: 14, color: COLORS.text,
                     borderWidth: 1.5, borderColor: COLORS.border },
  previewAction:  { width: 34, height: 34, borderRadius: 10,
                    alignItems: 'center', justifyContent: 'center' },

  fab: {
    position: 'absolute', bottom: 28, right: 22,
    width: 58, height: 58, borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 10,
  },
  fabIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});

export default UsersScreen;