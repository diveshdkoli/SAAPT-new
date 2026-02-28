import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import TeacherNavigator from './TeacherNavigator';
import StudentNavigator from './StudentNavigator';

const RootNavigator = () => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    role: null,
  });

  const handleLogin = (userData) => {
    setAuthState({ isLoggedIn: true, role: userData.role });
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
      ) : authState.role === 'student' ? (
        <StudentNavigator onLogout={handleLogout} />
      ) : (
        <AuthNavigator onLogin={handleLogin} />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;