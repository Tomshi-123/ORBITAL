import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const tabIcons = {
  index: 'grid-outline',
  map: 'globe-outline',
  cameras: 'videocam-outline',
} as const;

export default function TabLayout() {
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.cyan,
    tabBarInactiveTintColor: colors.faint,
    tabBarStyle: {
      height: 68,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
    },
    tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
    tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name as keyof typeof tabIcons]} size={size} color={color} />,
  })}>
    <Tabs.Screen name="index" options={{ title: 'Overview' }} />
    <Tabs.Screen name="map" options={{ title: 'Live map' }} />
    <Tabs.Screen name="cameras" options={{ title: 'Live cam' }} />
  </Tabs>;
}
