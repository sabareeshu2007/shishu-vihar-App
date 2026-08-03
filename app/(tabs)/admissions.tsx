import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function AdmissionsScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const leadsQuery = query(collection(db, 'admissions'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
      const liveLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(liveLeads);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddLead = async () => {
    if (!parentName || !childName || !phone) {
      Alert.alert("Missing Info", "Please fill in all details for the new inquiry.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'admissions'), {
        parentName,
        childName,
        phone,
        status: 'New Inquiry',
        timestamp: new Date()
      });
      
      Alert.alert("Success", "New lead added to the tracker!");
      setParentName('');
      setChildName('');
      setPhone('');
      setIsAddingMode(false);
    } catch (error) {
      console.error("Error saving lead:", error);
      Alert.alert("Error", "Could not save the new inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLeadCard = ({ item }: { item: any }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <Text style={styles.childName}>{item.childName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.parentDetail}>Parent: {item.parentName}</Text>
      <Text style={styles.parentDetail}>📞 {item.phone}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>2026-2027 Admissions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddingMode(!isAddingMode)}
        >
          <Text style={styles.addButtonText}>{isAddingMode ? 'Cancel' : '+ Add Lead'}</Text>
        </TouchableOpacity>
      </View>

      {isAddingMode && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>New Walk-In / Call Inquiry</Text>
          <TextInput style={styles.input} placeholder="Child's Name" value={childName} onChangeText={setChildName} />
          <TextInput style={styles.input} placeholder="Parent's Name" value={parentName} onChangeText={setParentName} />
          <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleAddLead} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Inquiry</Text>}
          </TouchableOpacity>
        </View>
      )}

      <FlatList 
        data={leads}
        keyExtractor={item => item.id}
        renderItem={renderLeadCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No inquiries tracked yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ecf0f1' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  addButton: { backgroundColor: '#3498db', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  formContainer: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#34495e' },
  input: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ecf0f1' },
  saveButton: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  listContainer: { padding: 20 },
  leadCard: {
    backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, 
  },
  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  childName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  statusBadge: { backgroundColor: '#f39c12', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  parentDetail: { fontSize: 14, color: '#7f8c8d', marginBottom: 5 },
  emptyText: { textAlign: 'center', color: '#7f8c8d', marginTop: 20 }
});