import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

const tabIcons = {
  index: 'grid-outline',
  map: 'globe-outline',
  missions: 'rocket-outline',
} as const;

export default function TabLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/login" />;

  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    animation: 'shift',
    tabBarActiveTintColor: colors.cyan,
    tabBarInactiveTintColor: colors.faint,
    tabBarStyle: {
      height: 72,
      paddingTop: 9,
      paddingBottom: 9,
      backgroundColor: 'rgba(9, 13, 25, 0.94)',
      borderTopColor: 'rgba(121, 150, 218, 0.18)',
      borderTopWidth: 1,
      elevation: 18,
      shadowColor: '#7468D8',
      shadowOpacity: 0.16,
      shadowRadius: 18,
    },
    tabBarItemStyle: { marginHorizontal: 6, borderRadius: 15 },
    tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.45 },
    tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name as keyof typeof tabIcons]} size={size} color={color as string} />,
  })}>
    <Tabs.Screen name="index" options={{ title: 'Overview' }} />
    <Tabs.Screen name="map" options={{ title: 'Live map' }} />
    <Tabs.Screen name="missions" options={{ title: 'Active Missions' }} />
  </Tabs>;
}
