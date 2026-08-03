import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SHADOWS } from '../../theme/designSystem';

interface Student {
  id: string;
  name: string;
  class: string;
}

export default function RealTimeAttendanceScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const todayFormatted = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // 📡 Stream the REAL-TIME student roster from the master 'students' collection
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const fetchedStudents: Student[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedStudents.push({
          id: docSnap.id,
          name: data.name || 'Unknown Student',
          class: data.class || 'Playgroup',
        });
      });
      
      // Sort alphabetically by name so the roster looks professional
      fetchedStudents.sort((a, b) => a.name.localeCompare(b.name));
      
      setStudents(fetchedStudents);
      setLoading(false);
    }, (error) => {
      console.error("Error streaming dynamic student roster:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const submitAttendance = async () => {
    // Safety verification: Ensure every child on the active roster has been accounted for
    const unrecordedStudents = students.filter(s => !attendanceRecords[s.id]);
    if (unrecordedStudents.length > 0) {
      Alert.alert(
        "Roster Incomplete",
        `Please log an attendance status for all students before submitting today's records.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Commit the dynamic state tracking array directly to your master 'attendance' document
      await setDoc(doc(db, 'attendance', todayFormatted), {
        records: attendanceRecords,
        updatedAt: serverTimestamp(),
        date: todayFormatted
      });

      Alert.alert(
        "Roster Submitted! 🟢",
        "Today's attendance has been safely logged. Parent dashboards will reflect this instantly.",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error("Failed to commit attendance ledger: ", error);
      Alert.alert("Submission Failed", error.message || "Could not log attendance tracking.");
    } finally {
      setSubmitting(false);
    }
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
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PALETTE.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Daily Roll Call</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {students.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={54} color={PALETTE.textMuted} />
          <Text style={styles.emptyText}>No registered students found in the active admissions directory.</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const currentStatus = attendanceRecords[item.id];
            return (
              <View style={[styles.studentCard, SHADOWS.soft]}>
                <View style={styles.infoWrapper}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentClass}>{item.class}</Text>
                </View>

                {/* Status Picker Layout */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      currentStatus === 'present' ? styles.presentActive : styles.inactiveButton
                    ]}
                    onPress={() => toggleAttendance(item.id, 'present')}
                  >
                    <Text style={[
                      styles.buttonText,
                      currentStatus === 'present' ? styles.textActive : styles.textInactive
                    ]}>Present</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      currentStatus === 'absent' ? styles.absentActive : styles.inactiveButton
                    ]}
                    onPress={() => toggleAttendance(item.id, 'absent')}
                  >
                    <Text style={[
                      styles.buttonText,
                      currentStatus === 'absent' ? styles.textActive : styles.textInactive
                    ]}>Absent</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Persistent Bottom Action Trigger */}
      {students.length > 0 && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.submitButton, SHADOWS.premium, submitting && styles.disabledBtn]}
            onPress={submitAttendance}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Publish Attendance Roster</Text>
                <Ionicons name="cloud-upload" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
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
  listContainer: { padding: 20, paddingBottom: 100 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: PALETTE.textMuted, textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 20 },
  studentCard: { backgroundColor: PALETTE.card, borderRadius: 22, padding: 18, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoWrapper: { flex: 1, paddingRight: 10 },
  studentName: { fontSize: 16, fontWeight: '700', color: PALETTE.text },
  studentClass: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8 },
  statusButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, minWidth: 75, alignItems: 'center' },
  inactiveButton: { backgroundColor: '#F0F3F5', borderWidth: 1, borderColor: '#E8EDF2' },
  presentActive: { backgroundColor: '#EAFDF3', borderWidth: 1, borderColor: PALETTE.accent },
  absentActive: { backgroundColor: '#FFF2EA', borderWidth: 1, borderColor: PALETTE.warning },
  buttonText: { fontSize: 13, fontWeight: '700' },
  textActive: { color: PALETTE.text },
  textInactive: { color: PALETTE.textMuted },
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'transparent' },
  submitButton: { backgroundColor: PALETTE.secondary, borderRadius: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  disabledBtn: { backgroundColor: '#BDC3C7' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '800' }
});