import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import AdminSignupScreen from '../screens/auth/AdminSignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

/**
 * AuthNavigator
 *
 * Routes:
 *  - Login         → Universal login (email + password, role auto-detected)
 *  - Signup        → Teacher / Student registration only
 *  - AdminSignup   → Admin-only registration (role hard-coded to 'admin')
 *  - ForgotPassword
 */
const AuthNavigator = ({ onLogin }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Default landing screen */}
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>

      {/* Teacher / Student signup */}
      <Stack.Screen name="Signup" component={SignupScreen} />

      {/* Admin-only signup — accessible via Login screen link */}
      <Stack.Screen name="AdminSignup" component={AdminSignupScreen} />

      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
