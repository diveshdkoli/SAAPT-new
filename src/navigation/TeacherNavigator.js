import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
// Ionicons comes built-in with Expo — no extra install needed
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import TeacherHomeScreen       from '../screens/teacher/HomeScreen';
import TeacherClassesScreen    from '../screens/teacher/ClassesScreen';
import TeacherAttendanceScreen from '../screens/teacher/AttendanceScreen';
import TeacherReportScreen     from '../screens/teacher/ReportScreen';
import TeacherProfileScreen    from '../screens/teacher/ProfileScreen';

const Tab = createBottomTabNavigator();

// Each tab icon — uses Ionicons, green when active, grey when not
const TabIcon = ({ name, focused }) => (
  <Ionicons
    name={focused ? name : `${name}-outline`}
    size={22}
    color={focused ? Colors.primary : '#9E9E9E'}
  />
);

const TeacherNavigator = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
      })}
    >
      <Tab.Screen
        name="TeacherHome"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      >
        {(props) => <TeacherHomeScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="TeacherClasses"
        component={TeacherClassesScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ focused }) => <TabIcon name="book" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="TeacherAttendance"
        component={TeacherAttendanceScreen}
        options={{
          tabBarLabel: 'Attend',
          // "Attend" instead of "Attendance" so it fits in one line
          tabBarIcon: ({ focused }) => <TabIcon name="checkbox" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="TeacherReport"
        component={TeacherReportScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="TeacherProfile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      >
        {(props) => <TeacherProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TeacherNavigator;

const styles = StyleSheet.create({
  tabBar: {
    // White background, subtle top border, proper height with padding
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  tabLabel: {
    // Small, clean label — never wraps because all labels are one word
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
