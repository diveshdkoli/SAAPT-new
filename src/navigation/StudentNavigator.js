// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '../theme';

// import StudentHomeScreen    from '../screens/student/HomeScreen';
// import StudentReportScreen  from '../screens/student/ReportScreen';
// import StudentProfileScreen from '../screens/student/ProfileScreen';

// const Tab = createBottomTabNavigator();

// // Reusable icon component — filled when active, outline when not
// const TabIcon = ({ name, focused }) => (
//   <Ionicons
//     name={focused ? name : `${name}-outline`}
//     size={22}
//     color={focused ? '#7C5CBF' : '#9E9E9E'}
//   />
// );

// const StudentNavigator = ({ onLogout }) => {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: styles.tabBar,
//         tabBarLabelStyle: styles.tabLabel,
//         tabBarActiveTintColor: '#7C5CBF',
//         tabBarInactiveTintColor: '#9E9E9E',
//       }}
//     >
//       <Tab.Screen
//         name="StudentHome"
//         options={{
//           tabBarLabel: 'Home',
//           tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
//         }}
//       >
//         {(props) => <StudentHomeScreen {...props} onLogout={onLogout} />}
//       </Tab.Screen>

//       <Tab.Screen
//         name="StudentReport"
//         component={StudentReportScreen}
//         options={{
//           tabBarLabel: 'Report',
//           tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
//         }}
//       />

//       <Tab.Screen
//         name="StudentProfile"
//         options={{
//           tabBarLabel: 'Profile',
//           tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
//         }}
//       >
//         {(props) => <StudentProfileScreen {...props} onLogout={onLogout} />}
//       </Tab.Screen>
//     </Tab.Navigator>
//   );
// };

// export default StudentNavigator;

// const styles = StyleSheet.create({
//   tabBar: {
//     // Matches teacher tab bar — consistent look across both interfaces
//     backgroundColor: '#FFFFFF',
//     borderTopWidth: 1,
//     borderTopColor: '#F0F0F0',
//     height: 60,
//     paddingBottom: 8,
//     paddingTop: 6,
//     elevation: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.06,
//     shadowRadius: 10,
//   },
//   tabLabel: {
//     // Kept small and bold — single words only so nothing wraps
//     fontSize: 10,
//     fontWeight: '600',
//     marginTop: 2,
//   },
// });








// src/navigation/StudentNavigator.js
//
// FIX: Same bottom nav overlap issue as TeacherNavigator.
// Using useSafeAreaInsets to properly account for gesture nav bar.

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StudentHomeScreen    from '../screens/student/HomeScreen';
import StudentReportScreen  from '../screens/student/ReportScreen';
import StudentProfileScreen from '../screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => (
  <Ionicons
    name={focused ? name : `${name}-outline`}
    size={22}
    color={focused ? '#7C5CBF' : '#9E9E9E'}
  />
);

const StudentNavigator = ({ onLogout }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: '#7C5CBF',
        tabBarInactiveTintColor: '#9E9E9E',
      }}
    >
      <Tab.Screen
        name="StudentHome"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      >
        {(props) => <StudentHomeScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="StudentReport"
        component={StudentReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="StudentProfile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      >
        {(props) => <StudentProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default StudentNavigator;

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});