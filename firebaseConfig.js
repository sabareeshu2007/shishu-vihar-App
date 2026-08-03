import { initializeApp } from 'firebase/app';
import { collection, doc, initializeFirestore } from 'firebase/firestore';
// 1. Import the specific React Native auth tools
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

// 2. Import the local storage package you just installed
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAJg2AyJ2alonwPXU65NVcZYbLNkHsci-4",
  authDomain: "shishu-app.firebaseapp.com",
  projectId: "shishu-app",
  storageBucket: "shishu-app.firebasestorage.app",
  messagingSenderId: "567025901589",
  appId: "1:567025901589:web:1ec396a4c6c0948bcdee1c"
};

// Initialize Core App
const app = initializeApp(firebaseConfig);

// Initialize DB
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// 🔒 Initialize Auth with Bulletproof Permanent Persistence Memory
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});