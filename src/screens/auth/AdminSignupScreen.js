import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, KeyboardAvoidingView,
  Platform, Dimensions, Alert,
} from 'react-native';
import { Colors } from '../../theme';
import { registerAdmin } from '../../services/firebase/auth';

const { height } = Dimensions.get('window');

/**
 * AdminSignupScreen
 *
 * ✅ ONLY creates users with role = "admin"
 * ✅ Accessible from LoginScreen → "Admin Signup" link
 * ✅ After signup, navigates back to Login
 *
 * 🔒 In production: protect this route with an invite code or
 *    superadmin approval so anyone can't freely create admins.
 */
const AdminSignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',   // optional extra security layer
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const isFormValid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.password.trim().length >= 6 &&
    form.confirmPassword.trim() &&
    form.password === form.confirmPassword;

  const handleSignup = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      await registerAdmin({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        // role is ALWAYS set to 'admin' inside registerAdmin — not passed by UI
      });
      Alert.alert(
        'Admin Account Created ✅',
        `Welcome, ${form.name}! You can now log in with your credentials.`,
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Signup Failed', error.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name',  label: 'Full Name',     placeholder: 'Enter your full name',    icon: '👤', keyboardType: 'default',       autoCapitalize: 'words' },
    { key: 'email', label: 'Email Address', placeholder: 'Enter your email',         icon: '✉️', keyboardType: 'email-address', autoCapitalize: 'none' },
    { key: 'phone', label: 'Phone Number',  placeholder: 'Enter your phone number',  icon: '📱', keyboardType: 'phone-pad',     autoCapitalize: 'none' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>SAAPT</Text>
        <Text style={styles.appSubtitle}>Admin Registration</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>

            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🛡️</Text>
              <Text style={styles.badgeTxt}>Admin Account</Text>
            </View>

            <Text style={styles.cardTitle}>Create Admin Account</Text>
            <Text style={styles.cardSub}>
              This account will have full access to manage teachers, students, classes, and system settings.
            </Text>

            {/* Text fields */}
            {fields.map((field) => (
              <View key={field.key} style={styles.inputWrap}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={[styles.inputBox, form[field.key].length > 0 && styles.inputBoxActive]}>
                  <Text style={styles.icon}>{field.icon}</Text>
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
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputBox, form.password.length > 0 && styles.inputBoxActive]}>
                <Text style={styles.icon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={form.password}
                  onChangeText={(val) => update('password', val)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.icon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[
                styles.inputBox,
                form.confirmPassword.length > 0 && styles.inputBoxActive,
                form.confirmPassword.length > 0 && form.password !== form.confirmPassword && styles.inputBoxError,
              ]}>
                <Text style={styles.icon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={form.confirmPassword}
                  onChangeText={(val) => update('confirmPassword', val)}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Text style={styles.icon}>{showConfirm ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                <Text style={styles.errorTxt}>Passwords do not match</Text>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, !isFormValid && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={!isFormValid || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnTxt, !isFormValid && styles.btnTxtDisabled]}>
                {loading ? 'Creating Admin Account...' : '🛡️  Create Admin Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <Text style={styles.rowTxt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.rowLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AdminSignupScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7F5' },
  header: {
    backgroundColor: Colors.primary,
    height: height * 0.24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  circle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -20 },
  backBtn: { position: 'absolute', top: 16, left: 16 },
  backTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  appName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  appSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 4, letterSpacing: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, marginTop: -24 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  badgeIcon: { fontSize: 14, marginRight: 6 },
  badgeTxt: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1C1C1C', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#6B6B6B', lineHeight: 20, marginBottom: 20 },
  inputWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#1C1C1C', marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 13,
    backgroundColor: '#fff', paddingHorizontal: 14, height: 52,
  },
  inputBoxActive: { borderColor: Colors.primary },
  inputBoxError: { borderColor: '#EF4444' },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1C' },
  errorTxt: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 50, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#D6D6D6', elevation: 0 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  btnTxtDisabled: { color: '#8A8A8A' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  rowTxt: { fontSize: 14, color: '#6B6B6B' },
  rowLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
