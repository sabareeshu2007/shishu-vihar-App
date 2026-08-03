import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, doc, deleteDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SHADOWS } from '../../theme/designSystem';

interface StudentItem {
  id: string;
  name: string;
  class: string;
}

export default function DeepCleanManageStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const fetched: StudentItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          name: data.name || 'Unknown Student',
          class: data.class || 'Playgroup',
        });
      });
      fetched.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeepWipeout = (student: StudentItem) => {
    Alert.alert(
      "Complete Data Purge",
      `Are you absolutely sure you want to graduate ${student.name}? This will permanently wipe out their entire attendance footprint and completely delete the linked parent database profile. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Purge Everything", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              const batch = writeBatch(db);

              // 🧽 1. PURGE PARENT USER PROFILE DOCUMENT
              const parentsQuery = query(collection(db, 'users'), where('childId', '==', student.id));
              const parentSnapshot = await getDocs(parentsQuery);
              
              parentSnapshot.forEach((parentDoc) => {
                const parentDocRef = doc(db, 'users', parentDoc.id);
                batch.delete(parentDocRef); // Deletes parent metadata profile instantly
              });

              // 🧽 2. PURGE ATTENDANCE DATA FOOTPRINT FOR THIS CHILD
              const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
              attendanceSnapshot.forEach((attendanceDoc) => {
                const data = attendanceDoc.data();
                if (data.records && data.records[student.id]) {
                  const updatedRecords = { ...data.records };
                  delete updatedRecords[student.id]; // Strip this student completely out of the historical tracking records
                  
                  const attendanceDocRef = doc(db, 'attendance', attendanceDoc.id);
                  batch.update(attendanceDocRef, { records: updatedRecords });
                }
              });

              // 🧽 3. PURGE MASTER STUDENT ROSTER RECORD
              const studentDocRef = doc(db, 'students', student.id);
              batch.delete(studentDocRef);

              // Execute all deletions securely in a single transaction
              await batch.commit();

              Alert.alert(
                "Purge Successful ✨", 
                `${student.name} and all linked parent configurations have been deleted from your database storage pipelines.`
              );
            } catch (error: any) {
              console.error("Deep cleanup routine failure: ", error);
              Alert.alert("Purge Failed", error.message || "An error occurred while cleaning directory databases.");
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PALETTE.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Manage Directory</Text>
          <Text style={styles.headerSubtitle}>Complete Offboarding Control</Text>
        </View>
      </View>

      {students.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trash-bin-outline" size={54} color={PALETTE.textMuted} />
          <Text style={styles.emptyText}>No registered active profiles available to manage.</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, SHADOWS.soft]}>
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarText}>🎓</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentClass}>{item.class}</Text>
              </View>
              <TouchableOpacity 
                style={styles.archiveButton}
                onPress={() => handleDeepWipeout(item)}
              >
                <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                <Text style={styles.archiveText}>Purge All</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 60, backgroundColor: PALETTE.card, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: PALETTE.text },
  headerSubtitle: { fontSize: 12, color: PALETTE.textMuted, fontWeight: '600', marginTop: 1 },
  listContainer: { padding: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: PALETTE.textMuted, textAlign: 'center', marginTop: 12, fontSize: 14 },
  card: { backgroundColor: PALETTE.card, borderRadius: 22, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  avatarBubble: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF2EA', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontSize: 20 },
  infoBlock: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '700', color: PALETTE.text },
  studentClass: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2, fontWeight: '600' },
  archiveButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  archiveText: { color: '#E74C3C', fontSize: 12, fontWeight: '700' }
});