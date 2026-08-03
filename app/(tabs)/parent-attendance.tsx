import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

interface AttendanceRecord {
  date: string;
  displayDate: string;
  status: 'present' | 'absent';
}

export default function ParentAttendanceScreen() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 🛑 1. GUARD: Exit if auth session isn't restored yet
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }
        
        setLoading(true);

        // 1. Fetch the logged-in parent's profile to find their child
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        
        if (!userDoc.exists() || !userDoc.data().childId) {
          // Parent has no child linked, stop loading
          setLoading(false);
          return;
        }
        
        const myChildId = userDoc.data().childId;

        // 2. Fetch all attendance history
        const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        
        let presentDays = 0;
        let totalDays = 0;
        const records: AttendanceRecord[] = [];

        querySnapshot.forEach((document) => {
          const data = document.data();
          // 3. Look up ONLY their child's specific status for the day
          const status = data.records?.[myChildId]; 
          
          if (status) {
            totalDays++;
            if (status === 'present') presentDays++;
            
            const dateObj = new Date(data.date);
            const displayDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

            records.push({ date: data.date, displayDate, status });
          }
        });

        setHistory(records);
        setPercentage(totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [auth.currentUser]); // 🔄 2. DEPENDENCY: Automatically runs the instant Firebase restores auth.currentUser!

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.percentageCard}>
        <Text style={styles.percentageTitle}>Attendance Percentage</Text>
        <Text style={styles.percentageNumber}>{percentage}%</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.historyTitle}>History</Text>
        
        {history.map((item) => (
          <View key={item.date} style={styles.recordRow}>
            <Text style={styles.dateText}>{item.displayDate}</Text>
            <Text style={[styles.statusText, item.status === 'present' ? styles.present : styles.absent]}>
              {item.status === 'present' ? '🟢 Present' : '🔴 Absent'}
            </Text>
          </View>
        ))}
        
        {history.length === 0 && (
          <Text style={styles.emptyText}>No attendance records found yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { justifyContent: 'center', alignItems: 'center' },
  percentageCard: { backgroundColor: 'white', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ecf0f1', marginBottom: 20 },
  percentageTitle: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  percentageNumber: { fontSize: 48, fontWeight: '900', color: '#3498db' },
  listContainer: { paddingHorizontal: 20 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#34495e', marginBottom: 15 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  dateText: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  statusText: { fontSize: 18, fontWeight: 'bold' },
  present: { color: '#27ae60' },
  absent: { color: '#c0392b' },
  emptyText: { textAlign: 'center', color: '#95a5a6', marginTop: 20, fontStyle: 'italic' }
});