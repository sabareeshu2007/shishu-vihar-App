import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function TabLayout() {
  const router = useRouter(); // Brought the router back!

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // ✅ Do NOT navigate here — let _layout.tsx handle it
    } catch (error) {
      Alert.alert('Logout failed', String(error));
    }
  };

  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ecf0f1', height: 60, paddingBottom: 10, paddingTop: 5 },
        headerStyle: { backgroundColor: '#3498db' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15, padding: 5 }}>
            <Ionicons name="log-out-outline" size={26} color="white" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="activity-feed" options={{ title: 'Feed', tabBarIcon: ({ color }) => <Ionicons name="images" size={24} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Events', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat', tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} /> }} />

      {/* Hidden Screens */}
      <Tabs.Screen name="notice-board" options={{ href: null, title: 'Notice Board' }} />
      <Tabs.Screen name="create-post" options={{ href: null, title: 'Create Update' }} />
      <Tabs.Screen name="attendance" options={{ href: null, title: 'Roll Call' }} />
      <Tabs.Screen name="admissions" options={{ href: null, title: 'Admissions' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="parent-attendance" options={{ href: null, title: 'Attendance History' }} />
      <Tabs.Screen name="add-student" options={{ href: null }} />
      <Tabs.Screen name="link-accounts" options={{ href: null }} />
      <Tabs.Screen name="manage-students" options={{ href: null }} />
      <Tabs.Screen name="child-profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}