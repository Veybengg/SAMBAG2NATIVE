import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Splashscreen from '../../src/Splashscreen'; // Adjust the path
import Homescreen from '../../src/Homescreen'; // Adjust the path

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splashscreen" component={Splashscreen} />
      <Stack.Screen name="Homescreen" component={Homescreen} />
    </Stack.Navigator>
  );
}
