import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState('teacher'); // 'teacher' | 'student'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchRole = (selectedRole) => {
    if (selectedRole === role) return;
    Animated.spring(slideAnim, {
      toValue: selectedRole === 'teacher' ? 0 : 1,
      useNativeDriver: false,
      friction: 6,
    }).start();
    setRole(selectedRole);
    setUsername('');
    setPassword('');
  };

  const sliderLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  const isFormValid = username.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (!isFormValid) return;
    setLoading(true);
    // TODO: Firebase auth call here
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header Banner ── */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <Text style={styles.appName}>SAAPT</Text>
        <Text style={styles.appSubtitle}>
          {role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
        </Text>
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
              <Animated.View style={[styles.roleSlider, { left: sliderLeft }]} />
              <TouchableOpacity
                style={styles.roleBtn}
                onPress={() => switchRole('teacher')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBtnText, role === 'teacher' && styles.roleBtnActive]}>
                  👩‍🏫  Teacher
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.roleBtn}
                onPress={() => switchRole('student')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBtnText, role === 'student' && styles.roleBtnActive]}>
                  🎓  Student
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Title */}
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Welcome back! Please enter your credentials to continue.
            </Text>

            {/* Username Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, !isFormValid && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={!isFormValid || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, !isFormValid && styles.primaryBtnTextDisabled]}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signup', { role })}
                activeOpacity={0.7}
              >
                <Text style={styles.signupLink}>Create Account</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: Colors.primary,
    height: height * 0.30,
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
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 6,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    marginTop: 6,
    letterSpacing: 1,
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    marginTop: -30,
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
    position: 'relative',
    height: 46,
  },
  roleSlider: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '48%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    zIndex: 0,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  roleBtnActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // ── Card Text ──
  cardTitle: {
    fontSize: 24,
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
  inputWrapper: {
    marginBottom: Spacing.md,
  },
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
  inputIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.titleText,
    fontWeight: '400',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryBtnTextDisabled: {
    color: Colors.disabledText,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.inputBorder,
  },
  dividerText: {
    marginHorizontal: Spacing.sm,
    color: Colors.subtitleText,
    fontSize: 13,
  },

  // ── Sign Up Row ──
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: Colors.subtitleText,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
