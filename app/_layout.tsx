import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { View, ActivityIndicator, Platform } from 'react-native';

// 🔇 TEMPORARILY MUTED FOR EXPO GO
//import * as Notifications from 'expo-notifications';
//import * as Device from 'expo-device';
import Constants from 'expo-constants'; 

/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,  
  }),
});
*/

/* 2. The Upgraded, Crash-Proof Token Function (MUTED)
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return undefined; 
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.log("🛡️ SAFETY NET: No Project ID found. Skipping Push Token for now.");
        return undefined;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      console.log("🛡️ SAFETY NET: Expected error in Expo Go. Skipping token generation.");
      return undefined;
    }
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3498db',
    });
  }
  return token;
}
*/

// ⬇️ THIS IS THE FIX: The tiny active dummy function outside the comments!
async function registerForPushNotificationsAsync() {
  return undefined; 
}

export default function RootLayout() {
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments(); 

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (user) => {
      const inTabsGroup = segments[0] === '(tabs)';

      if (user) {
        // Now it will safely call the dummy function above and return undefined!
        const token = await registerForPushNotificationsAsync();
        if (token) {
          try {
            await updateDoc(doc(db, 'users', user.uid), { pushToken: token });
          } catch (error) {
            console.log("Error saving token:", error);
          }
        }

        if (!inTabsGroup) router.replace('/(tabs)');
      } else if (!user && inTabsGroup) {
        router.replace('/');
      }
      
      if (isInitializing) setIsInitializing(false);
    });

    return subscriber; 
  }, [segments, isInitializing]); 

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}