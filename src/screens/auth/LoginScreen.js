import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Dimensions,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { loginUser } from '../../services/firebase/auth';
import { Colors } from '../../theme';

const { height } = Dimensions.get('window');

/**
 * LoginScreen — Universal Login
 *
 * ✅ NO role selector here. User enters only email + password.
 * ✅ Backend (loginUser) fetches the role from Firestore and returns it.
 * ✅ RootNavigator redirects to the correct dashboard based on role.
 *
 * The old Teacher/Student toggle is REMOVED because it allowed role bypass.
 */
const LoginScreen = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      // loginUser returns { uid, name, email, role, ... }
      const userData = await loginUser(email.trim(), password);
      onLogin(userData); // RootNavigator handles redirect by role
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.appName}>SAAPT</Text>
        <Text style={styles.appSubtitle}>Sign in to continue</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back 👋</Text>
            <Text style={styles.cardSub}>
              Enter your credentials. You'll be redirected to the right portal automatically.
            </Text>

            {/* Email */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputBox, email.length > 0 && styles.inputBoxActive]}>
                <Text style={styles.icon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputBox, password.length > 0 && styles.inputBoxActive]}>
                <Text style={styles.icon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.icon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotTxt}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.btn, !isFormValid && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={!isFormValid || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnTxt, !isFormValid && styles.btnTxtDisabled]}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divTxt}>Admin?</Text>
              <View style={styles.divLine} />
            </View>

            {/* Admin Signup Link */}
            <View style={styles.row}>
              <Text style={styles.rowTxt}>Register as Admin  </Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminSignup')}>
                <Text style={styles.rowLink}>Admin Signup →</Text>
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
  root: { flex: 1, backgroundColor: '#F4F7F5' },
  header: {
    backgroundColor: Colors.primary,
    height: height * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40,
  },
  circle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -20,
  },
  appName: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  appSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.82)', marginTop: 6, letterSpacing: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, marginTop: -30 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#1C1C1C', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#6B6B6B', lineHeight: 20, marginBottom: 20 },
  inputWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#1C1C1C', marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 13,
    backgroundColor: '#fff', paddingHorizontal: 14, height: 52,
  },
  inputBoxActive: { borderColor: Colors.primary },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1C' },
  forgotBtn: { alignItems: 'flex-end', marginBottom: 4 },
  forgotTxt: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 50, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#D6D6D6', elevation: 0 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  btnTxtDisabled: { color: '#8A8A8A' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  divTxt: { marginHorizontal: 10, color: '#9E9E9E', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  rowTxt: { fontSize: 14, color: '#6B6B6B' },
  rowLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
