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

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../services/firebase/config'; // adjust path as needed

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
  { key: 'all', label: 'All', icon: '👥' },
  { key: 'teacher', label: 'Teachers', icon: '👩‍🏫' },
  { key: 'student', label: 'Students', icon: '🎓' },
];

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  teacher: {
    label: 'Teacher',
    icon: '👩‍🏫',
    color: COLORS.primary,
    lightColor: COLORS.primaryLight,
    initBg: '#4F46E5',
  },
  student: {
    label: 'Student',
    icon: '🎓',
    color: COLORS.secondary,
    lightColor: COLORS.secondaryLight,
    initBg: '#06B6D4',
  },
};

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

// ─── Add User Modal ───────────────────────────────────────────────────────────
const AddUserModal = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(''); setEmail(''); setPassword(''); setPhone('');
    setSelectedRole('student'); setShowPassword(false); setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a full name.'); return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters.'); return;
    }
    setSaving(true);
    await onSave({ name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim(), role: selectedRole });
    setSaving(false);
    reset();
  };

  const conf = ROLE_CONFIG[selectedRole];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.kvWrapper}>
          <View style={modalStyles.sheet}>

            {/* Drag Handle */}
            <View style={modalStyles.handle} />

            {/* Header */}
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>Add New User</Text>
                <Text style={modalStyles.subtitle}>Fill in the details below</Text>
              </View>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={handleClose}>
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>

              {/* ── Role Selector ── */}
              <Text style={modalStyles.sectionLabel}>Select Role</Text>
              <View style={modalStyles.roleRow}>
                {['teacher', 'student'].map((role) => {
                  const rc = ROLE_CONFIG[role];
                  const isActive = selectedRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[modalStyles.roleCard, isActive && { borderColor: rc.color, backgroundColor: rc.lightColor }]}
                      onPress={() => setSelectedRole(role)}
                      activeOpacity={0.8}
                    >
                      <Text style={modalStyles.roleCardIcon}>{rc.icon}</Text>
                      <Text style={[modalStyles.roleCardLabel, isActive && { color: rc.color }]}>{rc.label}</Text>
                      {isActive && (
                        <View style={[modalStyles.roleCheck, { backgroundColor: rc.color }]}>
                          <Text style={modalStyles.roleCheckTick}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Full Name ── */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>Full Name <Text style={modalStyles.required}>*</Text></Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>👤</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g. John Smith"
                    placeholderTextColor={COLORS.textLight}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* ── Email ── */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>Email Address <Text style={modalStyles.required}>*</Text></Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>📧</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g. john@school.com"
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* ── Password ── */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>Password <Text style={modalStyles.required}>*</Text></Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>🔒</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={modalStyles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Phone ── */}
              <View style={modalStyles.formGroup}>
                <Text style={modalStyles.label}>Phone Number <Text style={modalStyles.optional}>(optional)</Text></Text>
                <View style={modalStyles.inputRow}>
                  <Text style={modalStyles.inputIcon}>📞</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g. +91 9876543210"
                    placeholderTextColor={COLORS.textLight}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* ── Live Preview Card ── */}
              {name.trim() !== '' && (
                <View style={[modalStyles.previewCard, { borderColor: conf.color + '40' }]}>
                  <View style={[modalStyles.previewAvatar, { backgroundColor: conf.initBg }]}>
                    <Text style={modalStyles.previewInitials}>{getInitials(name)}</Text>
                  </View>
                  <View style={modalStyles.previewInfo}>
                    <Text style={modalStyles.previewName}>{name}</Text>
                    <Text style={modalStyles.previewEmail} numberOfLines={1}>{email || 'No email yet'}</Text>
                    <View style={[modalStyles.previewBadge, { backgroundColor: conf.lightColor }]}>
                      <Text style={[modalStyles.previewBadgeText, { color: conf.color }]}>
                        {conf.icon}  {conf.label}
                      </Text>
                    </View>
                  </View>
                  <View style={modalStyles.previewCheckCircle}>
                    <Text style={modalStyles.previewCheckText}>👁️</Text>
                  </View>
                </View>
              )}

              {/* ── Save Button ── */}
              <TouchableOpacity
                style={[modalStyles.saveBtn, saving && modalStyles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={modalStyles.saveBtnText}>✓  Add {conf.label}</Text>
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
  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
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
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleAddUser = async ({ name, email, password, phone, role }) => {
    try {
      // 1️⃣ Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // 2️⃣ Prepare Firestore data
      const newUser = { name, email, phone, role, uid, createdAt: serverTimestamp() };

      // 3️⃣ Create Firestore document with UID as ID
      await setDoc(doc(db, 'users', uid), newUser);

      // 4️⃣ Update local state for immediate UI
      setUsers((prev) => [{ id: uid, ...newUser, createdAt: new Date() }, ...prev]);

      // 5️⃣ Close modal & show success
      setModalVisible(false);
      Alert.alert('Success! 🎉', `${name} has been added as a ${role}.`);
    } catch (error) {
      console.log('Firebase error adding user:', error); // ✅ log full error
      const msg =
        error.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
          error.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
            error.code === 'permission-denied' ? 'You do not have permission to add users.' :
              'Failed to add user. Please check console for details.';
      Alert.alert('Error', msg);
    }
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>Manage teachers & students</Text>
          </View>
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.headerAddBtnText}>+ Add</Text>
          </TouchableOpacity>
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

      {/* Add User Modal */}
      <AddUserModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddUser}
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