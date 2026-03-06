import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Animated, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Alert } from 'react-native';
import { loginUser } from '../../services/firebase/auth';
// import { seedAdmin } from '../../services/firebase/seed';
import { Colors } from '../../theme';
const { height } = Dimensions.get('window');


const LoginScreen = ({ navigation, onLogin }) => {
  const [role, setRole] = useState('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  //   useEffect(() => {
  //   seedAdmin();
  // }, []);

  const switchRole = (selectedRole) => {
    if (selectedRole === role) return;
    Animated.spring(slideAnim, {
      toValue: selectedRole === 'teacher' ? 0 : 1,
      useNativeDriver: false,
      friction: 6,
    }).start();
    setRole(selectedRole);
    setEmail('');
    setPassword('');
  };

  const sliderLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      const userData = await loginUser(email, password);
      onLogin(userData);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
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
        <Text style={styles.appSubtitle}>
          {role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            {/* Role Switcher */}
            <View style={styles.switcher}>
              <Animated.View style={[styles.slider, { left: sliderLeft }]} />
              <TouchableOpacity style={styles.roleBtn} onPress={() => switchRole('teacher')} activeOpacity={0.8}>
                <Text style={[styles.roleTxt, role === 'teacher' && styles.roleTxtActive]}>👩‍🏫  Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.roleBtn} onPress={() => switchRole('student')} activeOpacity={0.8}>
                <Text style={[styles.roleTxt, role === 'student' && styles.roleTxtActive]}>🎓  Student</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Welcome back! Enter your credentials to continue.</Text>

            {/* Username */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputBox, email.length > 0 && styles.inputBoxActive]}>
                <Text style={styles.icon}>👤</Text>
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
              <View style={styles.divLine} /><Text style={styles.divTxt}>or</Text><View style={styles.divLine} />
            </View>

            <View style={styles.row}>
              <Text style={styles.rowTxt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup', { role })}>
                <Text style={styles.rowLink}>Create Account</Text>
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
    height: height * 0.30,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  circle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -20 },
  appName: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  appSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.82)', marginTop: 6, letterSpacing: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, marginTop: -30 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  switcher: {
    flexDirection: 'row', backgroundColor: '#E6F0EA', borderRadius: 50,
    padding: 3, marginBottom: 20, position: 'relative', height: 46,
  },
  slider: {
    position: 'absolute', top: 3, bottom: 3, width: '48%',
    backgroundColor: Colors.primary, borderRadius: 50, zIndex: 0,
  },
  roleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  roleTxt: { fontSize: 14, fontWeight: '500', color: Colors.primary },
  roleTxtActive: { color: '#fff', fontWeight: '700' },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#1C1C1C', marginBottom: 6 },
  cardSub: { fontSize: 14, color: '#6B6B6B', lineHeight: 21, marginBottom: 20 },
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
  btn: {
    backgroundColor: Colors.primary, borderRadius: 50, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#D6D6D6', elevation: 0 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  btnTxtDisabled: { color: '#8A8A8A' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  divTxt: { marginHorizontal: 8, color: '#9E9E9E', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  rowTxt: { fontSize: 14, color: '#6B6B6B' },
  rowLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});