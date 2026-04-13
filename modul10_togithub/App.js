import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './screens/WelcomeScreen';
import LoginOwnerScreen from './screens/LoginOwnerScreen';
import CustomerHomeScreen from './screens/CustomerHomeScreen';
import DetailScreen from './screens/DetailScreen';
import CartScreen from './screens/CartScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginOwner" component={LoginOwnerScreen} options={{ title: 'Login Admin' }} />
        <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} options={{ title: 'Katalog Produk' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Detail' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Keranjang Belanja' }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Panel Owner' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}