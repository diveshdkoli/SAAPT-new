import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import TeacherNavigator from './TeacherNavigator';
import StudentNavigator from './StudentNavigator';
import AdminNavigator from './AdminNavigator';

/**
 * RootNavigator
 *
 * Controls which navigator to show based on auth state + role.
 *
 * ✅ Role redirect is based on data returned by loginUser() from Firestore.
 * ✅ UI never influences which dashboard is shown.
 *
 * Flow:
 *  Not logged in   → AuthNavigator  (Login / Signup / AdminSignup)
 *  role = 'admin'  → AdminNavigator
 *  role = 'teacher'→ TeacherNavigator
 *  role = 'student'→ StudentNavigator
 */
const RootNavigator = () => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    role: null,
    user: null,
  });

  const handleLogin = (userData) => {
    // userData = { uid, name, email, role } — role from Firestore, not UI
    setAuthState({ isLoggedIn: true, role: userData.role, user: userData });
  };

  const handleLogout = () => {
    setAuthState({ isLoggedIn: false, role: null, user: null });
  };

  return (
    <NavigationContainer>
      {!authState.isLoggedIn ? (
        <AuthNavigator onLogin={handleLogin} />
      ) : authState.role === 'admin' ? (
        <AdminNavigator onLogout={handleLogout} user={authState.user} />
      ) : authState.role === 'teacher' ? (
        <TeacherNavigator onLogout={handleLogout} user={authState.user} />
      ) : authState.role === 'student' ? (
        <StudentNavigator onLogout={handleLogout} user={authState.user} />
      ) : (
        // Unknown role — send back to auth
        <AuthNavigator onLogin={handleLogin} />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
