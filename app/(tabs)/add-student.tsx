import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { collection, addDoc, doc, setDoc, getDocs, query, where, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';


// 🔒 Core items from the main auth package
import { initializeAuth, getAuth, Auth, createUserWithEmailAndPassword } from 'firebase/auth';

// @ts-ignore - Explicitly ignore linter error; Metro resolves this correctly for mobile at runtime
import { getReactNativePersistence } from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SHADOWS } from '../../theme/designSystem';

// 🛑 Automatic Firebase Config extractor
import * as firebaseConfigModule from '../../firebaseConfig'; 
const firebaseConfig = (firebaseConfigModule as any).firebaseConfig || (firebaseConfigModule as any).default?.firebaseConfig;
const fallbackConfig = {
  apiKey: (db as any)._apiKey || (db as any).app?.options?.apiKey,
  authDomain: (db as any).app?.options?.authDomain,
  projectId: (db as any).app?.options?.projectId,
  storageBucket: (db as any).app?.options?.storageBucket,
  messagingSenderId: (db as any).app?.options?.messagingSenderId,
  appId: (db as any).app?.options?.appId
};
const finalConfig = firebaseConfig || fallbackConfig;

const adminSecondaryApp = getApps().find((app) => app.name === "AdminSecondaryBridge")
  ?? initializeApp(finalConfig, "AdminSecondaryBridge");

let adminSecondaryAuth: Auth;

try {
  adminSecondaryAuth = initializeAuth(adminSecondaryApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  adminSecondaryAuth = getAuth(adminSecondaryApp);
}

export default function SiblingAdmissionScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [studentClass, setStudentClass] = useState('Playgroup');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdmissionAndLinking = async () => {
    const cleanEmail = parentEmail.trim().toLowerCase();

    if (!childName.trim() || !cleanEmail) {
      Alert.alert("Missing Fields", "Please fill in the child's details and parent's email.");
      return;
    }

    setSubmitting(true);

    try {
      // 🔍 First, check if this parent already exists in the database
      const userQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(userQuery);
      const isExistingParent = !querySnapshot.empty;

      // 🔐 Validation Check: Only require a password if it's a NEW parent account
      if (!isExistingParent && (!parentPassword.trim() || parentPassword.length < 6)) {
        Alert.alert("Password Required", "A temporary password of at least 6 characters is required for new parent accounts.");
        setSubmitting(false);
        return;
      }

      // Step 1: Always add the new child to the master 'students' collection first
      const studentDocRef = await addDoc(collection(db, 'students'), {
        name: childName.trim(),
        class: studentClass,
        createdAt: serverTimestamp()
      });
      const generatedChildId = studentDocRef.id;

      if (isExistingParent) {
        // 👬 TWIN/SIBLING PIPELINE: Parent already exists!
        const parentDoc = querySnapshot.docs[0];
        const parentDocRef = doc(db, 'users', parentDoc.id);

        // Append the new child ID to their array list cleanly
        await updateDoc(parentDocRef, {
          childIds: arrayUnion(generatedChildId),
          childId: generatedChildId // Keeps legacy view updated
        });

        Alert.alert(
          "Twin/Sibling Linked! 👬",
          `${childName} has been successfully added and linked to the existing parent account (${cleanEmail}).`,
          [{ text: "Wonderful", onPress: () => router.back() }]
        );
      } else {
        // 👤 NEW PARENT PIPELINE: Create account from scratch
        const userCredential = await createUserWithEmailAndPassword(adminSecondaryAuth, cleanEmail, parentPassword);
        const parentUid = userCredential.user.uid;

        // Save new user profile tracking an array of child IDs
        await setDoc(doc(db, 'users', parentUid), {
          email: cleanEmail,
          role: 'parent',
          childIds: [generatedChildId], 
          childId: generatedChildId,    
          createdAt: serverTimestamp()
        });

        Alert.alert(
          "Success! 🎉", 
          `${childName} has been admitted and a new parent profile created for ${cleanEmail}.`,
          [{ text: "Awesome", onPress: () => router.back() }]
        );
      }

      // Reset fields completely
      setChildName('');
      setParentEmail('');
      setParentPassword('');

    } catch (error: any) {
      console.error("Admission system error: ", error);
      Alert.alert("Admission Setup Failed", error.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PALETTE.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Admission</Text>
      </View>

      <View style={styles.formWrapper}>
        {/* Child Details */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#EBF5FF' }]}>
            <Ionicons name="happy" size={20} color={PALETTE.primary} />
          </View>
          <Text style={styles.sectionHeading}>Child Details</Text>
        </View>

        <View style={[styles.inputCard, SHADOWS.soft]}>
          <Text style={styles.inputLabel}>Child's Full Name</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="e.g., V krish"
            placeholderTextColor={PALETTE.textMuted}
            value={childName}
            onChangeText={setChildName}
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Class / Grade</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="e.g., Sr.Playgroup"
            placeholderTextColor={PALETTE.textMuted}
            value={studentClass}
            onChangeText={setStudentClass}
          />
        </View>

        {/* Parent Details */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={[styles.iconBubble, { backgroundColor: '#F5EEFF' }]}>
            <Ionicons name="people" size={20} color={PALETTE.secondary} />
          </View>
          <Text style={styles.sectionHeading}>Parent Connection</Text>
        </View>

        <View style={[styles.inputCard, SHADOWS.soft]}>
          <Text style={styles.inputLabel}>Parent's Email</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="parent@gmail.com"
            placeholderTextColor={PALETTE.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={parentEmail}
            onChangeText={setParentEmail}
          />
          <Text style={{ fontSize: 11, color: PALETTE.textMuted, marginTop: 4, fontStyle: 'italic' }}>
            💡 For twins/siblings, enter the same parent email. The password field below can be ignored.
          </Text>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Temporary Password (New Parents Only)</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="Minimum 6 characters"
            placeholderTextColor={PALETTE.textMuted}
            autoCapitalize="none"
            secureTextEntry
            value={parentPassword}
            onChangeText={setParentPassword}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, SHADOWS.premium, submitting && styles.disabledBtn]}
          onPress={handleAdmissionAndLinking}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.submitText}>Complete Setup & Link</Text>
              <Ionicons name="shield-checkmark" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 60, backgroundColor: PALETTE.card, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: PALETTE.text },
  formWrapper: { padding: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBubble: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: PALETTE.text, marginLeft: 8 },
  inputCard: { backgroundColor: PALETTE.card, borderRadius: 24, padding: 20, marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: PALETTE.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: PALETTE.text, borderWidth: 1, borderColor: PALETTE.border },
  submitButton: { backgroundColor: PALETTE.accent, borderRadius: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 30 },
  disabledBtn: { backgroundColor: '#BDC3C7' },
  submitText: { color: 'white', fontSize: 16, fontWeight: '800' }
});