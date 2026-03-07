// import React from 'react';
// import RootNavigator from './src/navigation/RootNavigator';

// export default function App() {
//   return <RootNavigator />;
// }


// App.js
//
// FIX: Wrap everything in SafeAreaProvider.
// WHY: useSafeAreaInsets (used in all 3 navigators to fix tab bar overlap)
//      requires SafeAreaProvider to exist somewhere above it in the tree.
//      Without this, the app will crash with:
//      "No safe area value available. Make sure you are rendering `<SafeAreaProvider>`"

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}