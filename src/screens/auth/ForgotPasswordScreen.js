// src/screens/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../services/firebase/config';
import { Colors } from '../../theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = email.trim().length > 0 && email.includes('@');

  const handleSendReset = async () => {
    if (!isValidEmail) return;
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const usersSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', trimmedEmail))
      );
      if (usersSnap.empty) {
        Alert.alert('Email Not Found', 'This email is not registered in SAAPT. Please check and try again.');
        setLoading(false);
        return;
      }
      await sendPasswordResetEmail(auth, trimmedEmail);
      setStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      Alert.alert('Something Went Wrong', 'Could not send reset email. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={s.header}>
          <View style={s.circle1} /><View style={s.circle2} />
          <Text style={s.appName}>SAAPT</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.card}>
            <View style={s.successIcon}><Text style={s.successEmoji}>📬</Text></View>
            <Text style={s.successTitle}>Check Your Inbox</Text>
            <Text style={s.successSub}>We've sent a password reset link to:</Text>
            <View style={s.emailPill}>
              <Text style={s.emailPillTxt}>{email.trim().toLowerCase()}</Text>
            </View>
            <Text style={s.successNote}>
              Click the link in the email to set a new password. Check your spam folder if you don't see it within a few minutes.
            </Text>
            <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
              <Text style={s.btnTxt}>Back to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.resendBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
              <Text style={s.resendTxt}>Wrong email? Try again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={s.header}>
        <View style={s.circle1} /><View style={s.circle2} />
        <Text style={s.appName}>SAAPT</Text>
        <Text style={s.appSubtitle}>Reset Password</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={s.backTxt}>← Back to Login</Text>
            </TouchableOpacity>
            <Text style={s.cardTitle}>Forgot Password?</Text>
            <Text style={s.cardSub}>Enter your registered email. We'll verify it exists in SAAPT before sending a reset link.</Text>
            <View style={s.inputWrap}>
              <Text style={s.label}>Registered Email</Text>
              <View style={[s.inputBox, email.length > 0 && s.inputBoxActive]}>
                <Text style={s.icon}>📧</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#9AA5B1"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>🔒  We'll verify your email is registered in SAAPT before sending the reset link.</Text>
            </View>
            <TouchableOpacity
              style={[s.btn, !isValidEmail && s.btnDisabled]}
              onPress={handleSendReset}
              disabled={!isValidEmail || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[s.btnTxt, !isValidEmail && s.btnTxtDisabled]}>Send Reset Link</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F4F7F5' },
  header:      { backgroundColor: Colors.primary, height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circle1:     { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  circle2:     { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -20 },
  appName:     { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  appSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.82)', marginTop: 6, letterSpacing: 1 },
  scroll:      { paddingHorizontal: 16, paddingBottom: 32, marginTop: -30 },
  card:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  backBtn:     { marginBottom: 16 },
  backTxt:     { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  cardTitle:   { fontSize: 24, fontWeight: '700', color: '#1C1C1C', marginBottom: 6 },
  cardSub:     { fontSize: 14, color: '#6B6B6B', lineHeight: 21, marginBottom: 20 },
  inputWrap:   { marginBottom: 14 },
  label:       { fontSize: 13, fontWeight: '600', color: '#1C1C1C', marginBottom: 6 },
  inputBox:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 13, backgroundColor: '#fff', paddingHorizontal: 14, height: 52 },
  inputBoxActive: { borderColor: Colors.primary },
  icon:        { fontSize: 16, marginRight: 8 },
  input:       { flex: 1, fontSize: 15, color: '#1C1C1C' },
  infoBox:     { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, marginBottom: 20 },
  infoTxt:     { fontSize: 13, color: '#4F46E5', fontWeight: '500', lineHeight: 19 },
  btn:         { backgroundColor: Colors.primary, borderRadius: 50, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 4 },
  btnDisabled: { backgroundColor: '#D6D6D6', elevation: 0 },
  btnTxt:      { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  btnTxtDisabled: { color: '#8A8A8A' },
  successIcon:  { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1C', textAlign: 'center', marginBottom: 8 },
  successSub:   { fontSize: 14, color: '#6B6B6B', textAlign: 'center', marginBottom: 12 },
  emailPill:    { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginBottom: 16 },
  emailPillTxt: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  successNote:  { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  resendBtn:    { alignItems: 'center', marginTop: 14 },
  resendTxt:    { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});