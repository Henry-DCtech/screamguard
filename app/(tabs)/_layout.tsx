import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  focused,
  icon,
 
}: {
  focused: boolean;
  icon: IoniconsName;

}) {
  return (
    <View style={tabStyles.wrapper}>
      <Ionicons
        name={icon}
        size={22}
        color={focused ? colors.red : colors.textMuted}
      />
     
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 6,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.red,
    fontWeight: '700',
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="shield-checkmark-outline"  />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="people-outline"  />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="time-outline"  />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="settings-outline"  />
          ),
        }}
      />
    </Tabs>
  );
}