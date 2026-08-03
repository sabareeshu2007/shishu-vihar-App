import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

interface ParentUser {
  id: string;
  email: string;
  studentId?: string;
}

interface Student {
  id: string;
  name: string;
}

export default function LinkAccountsScreen() {
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all users who are Parents
      const parentQuery = query(collection(db, 'users'), where('role', '==', 'parent'));
      const parentSnapshot = await getDocs(parentQuery);
      const parentList: ParentUser[] = [];
      parentSnapshot.forEach(doc => parentList.push({ id: doc.id, ...doc.data() } as ParentUser));
      
      // 2. Fetch all Students
      const studentSnapshot = await getDocs(collection(db, 'students'));
      const studentList: Student[] = [];
      studentSnapshot.forEach(doc => studentList.push({ id: doc.id, ...doc.data() } as Student));

      setParents(parentList);
      setStudents(studentList);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load parents and students.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccounts = async () => {
    if (!selectedParent || !selectedStudent) {
      Alert.alert("Selection Required", "Please select both a parent and a student.");
      return;
    }

    setIsLinking(true);
    try {
      // Update the parent's user document to include the linked student's ID!
      await updateDoc(doc(db, 'users', selectedParent), {
        studentId: selectedStudent
      });

      Alert.alert("Success!", "The parent is now securely linked to the student.");
      
      // Reset selections and refresh data
      setSelectedParent(null);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      console.error("Error linking accounts:", error);
      Alert.alert("Error", "Could not link the accounts.");
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="link" size={28} color="#2c3e50" />
        <Text style={styles.headerTitle}>Link Accounts</Text>
      </View>

      <Text style={styles.instructions}>1. Select a Parent Email:</Text>
      <View style={styles.listWrapper}>
        <FlatList
          data={parents}
          keyExtractor={(item) => item.id}
          nestedScrollEnabled
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.listItem, selectedParent === item.id && styles.selectedItem]}
              onPress={() => setSelectedParent(item.id)}
            >
              <Text style={[styles.itemText, selectedParent === item.id && styles.selectedText]}>
                {item.email} {item.studentId ? '(Already Linked)' : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={styles.instructions}>2. Select their Child:</Text>
      <View style={styles.listWrapper}>
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          nestedScrollEnabled
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.listItem, selectedStudent === item.id && styles.selectedItem]}
              onPress={() => setSelectedStudent(item.id)}
            >
              <Text style={[styles.itemText, selectedStudent === item.id && styles.selectedText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity 
        style={[styles.linkButton, (!selectedParent || !selectedStudent) && styles.disabledButton]} 
        onPress={handleLinkAccounts}
        disabled={isLinking || !selectedParent || !selectedStudent}
      >
        {isLinking ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.linkButtonText}>Securely Link Accounts</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },
  instructions: { fontSize: 16, fontWeight: 'bold', color: '#34495e', marginBottom: 10, marginTop: 10 },
  listWrapper: { height: 180, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ecf0f1', marginBottom: 20, overflow: 'hidden' },
  listItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  selectedItem: { backgroundColor: '#3498db' },
  itemText: { fontSize: 15, color: '#2c3e50' },
  selectedText: { color: 'white', fontWeight: 'bold' },
  linkButton: { backgroundColor: '#2ecc71', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  disabledButton: { backgroundColor: '#95a5a6' },
  linkButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});