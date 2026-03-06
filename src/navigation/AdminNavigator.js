import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import DashboardScreen from '../screens/admin/DashboardScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import ClassesScreen from '../screens/admin/ClassesScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import ProfileScreen from '../screens/admin/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => (
  <Ionicons
    name={focused ? name : `${name}-outline`}
    size={22}
    color={focused ? Colors.primary : '#9E9E9E'}
  />
);

const AdminNavigator = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      >
        {(props) => <DashboardScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="AdminUsers"
        component={UsersScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="AdminClasses"
        component={ClassesScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ focused }) => <TabIcon name="book" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="AdminReports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="AdminProfile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default AdminNavigator;

const styles = StyleSheet.create({
  tabBar: {
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
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});