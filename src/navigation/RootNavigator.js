import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import TeacherNavigator from './TeacherNavigator';
import StudentNavigator from './StudentNavigator';

// Temporary auth state — will be replaced with Firebase Auth later
export let appNavigate = null;

const RootNavigator = () => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    role: null, // 'teacher' | 'student'
  });

  const handleLogin = (role) => {
    setAuthState({ isLoggedIn: true, role });
  };

  const handleLogout = () => {
    setAuthState({ isLoggedIn: false, role: null });
  };

  return (
    <NavigationContainer>
      {!authState.isLoggedIn ? (
        <AuthNavigator onLogin={handleLogin} />
      ) : authState.role === 'teacher' ? (
        <TeacherNavigator onLogout={handleLogout} />
      ) : (
        <StudentNavigator onLogout={handleLogout} />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
