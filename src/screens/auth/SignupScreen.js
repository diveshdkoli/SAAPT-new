import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const { height } = Dimensions.get('window');

const SignupScreen = ({ navigation, route }) => {
  const initialRole = route?.params?.role || 'teacher';
  const [role, setRole] = useState(initialRole);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const isFormValid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.username.trim() &&
    form.password.trim() &&
    form.confirmPassword.trim() &&
    form.password === form.confirmPassword;

  const handleSignup = () => {
    if (!isFormValid) return;
    setLoading(true);
    // TODO: Firebase createUser call here
    setTimeout(() => setLoading(false), 1500);
  };

  const fields = [
    {
      key: 'name',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      icon: '👤',
      keyboardType: 'default',
      autoCapitalize: 'words',
    },
    {
      key: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      icon: '✉️',
      keyboardType: 'email-address',
      autoCapitalize: 'none',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
      icon: '📱',
      keyboardType: 'phone-pad',
      autoCapitalize: 'none',
    },
    {
      key: 'username',
      label: 'Username',
      placeholder: 'Choose a username',
      icon: '🆔',
      keyboardType: 'default',
      autoCapitalize: 'none',
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.appName}>SAAPT</Text>
        <Text style={styles.appSubtitle}>Create Account</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card ── */}
          <View style={styles.card}>

            {/* Role Switcher */}
            <View style={styles.roleSwitcher}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                onPress={() => setRole('teacher')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBtnText, role === 'teacher' && styles.roleBtnTextActive]}>
                  👩‍🏫  Teacher
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
                onPress={() => setRole('student')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBtnText, role === 'student' && styles.roleBtnTextActive]}>
                  🎓  Student
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>
              {role === 'teacher' ? 'Teacher' : 'Student'} Registration
            </Text>
            <Text style={styles.cardSubtitle}>
              Fill in your details below to create your account.
            </Text>

            {/* Dynamic Fields */}
            {fields.map((field) => (
              <View key={field.key} style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <View style={[
                  styles.inputContainer,
                  form[field.key].length > 0 && styles.inputContainerActive,
                ]}>
                  <Text style={styles.inputIcon}>{field.icon}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.inputPlaceholder}
                    value={form[field.key]}
                    onChangeText={(val) => update(field.key, val)}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.autoCapitalize}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputContainer,
                form.password.length > 0 && styles.inputContainerActive,
              ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={form.password}
                  onChangeText={(val) => update('password', val)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[
                styles.inputContainer,
                form.confirmPassword.length > 0 && styles.inputContainerActive,
                form.confirmPassword.length > 0 && form.password !== form.confirmPassword && styles.inputContainerError,
              ]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={form.confirmPassword}
                  onChangeText={(val) => update('confirmPassword', val)}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, !isFormValid && styles.primaryBtnDisabled]}
              onPress={handleSignup}
              disabled={!isFormValid || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, !isFormValid && styles.primaryBtnTextDisabled]}>
                {loading ? 'Creating Account...' : `Create ${role === 'teacher' ? 'Teacher' : 'Student'} Account`}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: Colors.primary,
    height: height * 0.24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -40,
  },
  headerCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  backIcon: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 6,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
    letterSpacing: 1,
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    marginTop: -24,
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  // ── Role Switcher ──
  roleSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.lg,
    height: 46,
    gap: 3,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  roleBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // ── Text ──
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.titleText,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.subtitleText,
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },

  // ── Input ──
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.titleText,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputContainerActive: {
    borderColor: Colors.primary,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.titleText,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Button ──
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.disabledBtn,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryBtnTextDisabled: {
    color: Colors.disabledText,
  },

  // ── Login row ──
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  loginText: { fontSize: 14, color: Colors.subtitleText },
  loginLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
