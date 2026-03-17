import { Tabs } from "expo-router";
import { Home, Clock, Settings, Shield } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

function TabIcon({ icon: Icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  if (focused) {
    return (
      <View style={styles.activePill}>
        <Icon size={18} color={Colors.textPrimary} />
        <Text style={styles.activePillLabel}>{label}</Text>
      </View>
    );
  }
  return <Icon size={22} color={Colors.tabInactive} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.tabInactive,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="guardian"
        options={{
          title: "Guardian",
          tabBarIcon: ({ focused }) => <TabIcon icon={Shield} label="Guardian" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused }) => <TabIcon icon={Clock} label="Activity" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon icon={Settings} label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    elevation: 0,
    height: 85,
    paddingTop: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
    minWidth: 0,
    flexShrink: 1,
  },
  activePillLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
});
