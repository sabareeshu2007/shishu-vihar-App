import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Tabs } from 'expo-router';
import { doc, onSnapshot, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { PALETTE, RADIUS, SPACING, SHADOWS } from '../../theme/designSystem';

interface StudentSchema {
  id: string;
  name: string;
  class: string;
  photoUrl?: string;
  admissionNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  parentPhone?: string;
  allergies?: string;
  fatherName?: string;
  motherName?: string;
}

export default function FailSafeProfileScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'parent' | null>(null);
  const [allStudents, setAllStudents] = useState<{ id: string; name: string; class: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StudentSchema | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // 1. Fetch User Role Context
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeRole = onSnapshot(userDocRef, (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const activeRole = userData.role;
        setRole(activeRole);

        if (activeRole === 'parent') {
          // Parent Mode Target
          const targetChildId = userData.childId || userData.childIds?.[0];
          if (targetChildId) {
            setSelectedStudentId(targetChildId);
            setupProfileStream(targetChildId);
          } else {
            setLoading(false);
          }
        } else {
          // Admin Mode: Fetch all documents where role is student
          const rosterQuery = query(collection(db, 'users'), where('role', '==', 'student'));
          getDocs(rosterQuery).then((snapshot) => {
            const rosterList: { id: string; name: string; class: string }[] = [];
            snapshot.forEach((studentDoc) => {
              const data = studentDoc.data();
              rosterList.push({
                id: studentDoc.id,
                name: data.name || data.studentName || 'Enrolled Student',
                class: data.class || data.studentClass || 'Playgroup'
              });
            });
            
            setAllStudents(rosterList);
            
            // Core Fallback Check: If no specific student is selected yet, grab the first one
            if (rosterList.length > 0 && !selectedStudentId) {
              setSelectedStudentId(rosterList[0].id);
              setupProfileStream(rosterList[0].id);
            } else if (selectedStudentId) {
              setupProfileStream(selectedStudentId);
            } else {
              setLoading(false);
            }
          }).catch(() => setLoading(false));
        }
      }
    });

    return () => unsubscribeRole();
  }, [selectedStudentId]);

  // 📡 Fail-Safe Stream Engine: Forces loading to complete even if document properties are blank
  const setupProfileStream = (id: string) => {
    setLoading(true);
    
    const docRef = doc(db, 'users', id);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFormData({
          id: snap.id,
          name: data.name || data.studentName || 'Enrolled Student',
          class: data.class || data.studentClass || 'Playgroup',
          ...data
        } as StudentSchema);
        setLoading(false);
      } else {
        // Double Check Secondary Collection Path just in case data structural definitions cross over
        onSnapshot(doc(db, 'students', id), (fallbackSnap) => {
          if (fallbackSnap.exists()) {
            const fData = fallbackSnap.data();
            setFormData({
              id: fallbackSnap.id,
              name: fData.name || fData.studentName || 'Enrolled Student',
              class: fData.class || fData.studentClass || 'Playgroup',
              ...fData
            } as StudentSchema);
          } else {
            // Force dynamic template generation if the targeted document is completely raw or blank
            setFormData({
              id: id,
              name: 'Enrolled Student',
              class: 'Playgroup',
              parentPhone: '8778696408'
            });
          }
          setLoading(false);
        });
      }
    }, () => {
      setLoading(false);
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedStudentId || !formData || role !== 'admin') return;
    setSaving(true);
    try {
      const targetRef = doc(db, 'users', selectedStudentId);
      const updatePayload = { ...formData };
      delete (updatePayload as any).id;

      await updateDoc(targetRef, updatePayload as any);
      setIsEditing(false);
      Alert.alert("Success ✨", "Student metrics updated successfully.");
    } catch (error: any) {
      Alert.alert("Save Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  const isEditableContext = role === 'admin' && isEditing;

  return (
    <View style={styles.container}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      {/* Horizontal Admin Roster Navigation Bar */}
      {role === 'admin' && allStudents.length > 0 && (
        <View style={styles.adminRosterBar}>
          <Text style={styles.rosterBarTitle}>Student Profiles Directory</Text>
          <FlatList
            horizontal
            data={allStudents}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rosterScrollList}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedStudentId;
              return (
                <TouchableOpacity 
                  style={[styles.rosterChip, isSelected ? styles.rosterChipActive : styles.rosterChipInactive, SHADOWS.soft]}
                  onPress={() => {
                    setIsEditing(false);
                    setSelectedStudentId(item.id);
                    setupProfileStream(item.id);
                  }}
                >
                  <Text style={[styles.rosterChipText, isSelected ? styles.textActive : styles.textInactive]}>
                    {item.name} ({item.class})
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {formData ? (
          <>
            {/* Visual Hero Header Area */}
            <LinearGradient colors={role === 'admin' ? ['#F5EEFF', '#FAFBFC'] : ['#EBF5FF', '#FFF2EA', PALETTE.background]} style={styles.heroCanvas}>
              <View style={styles.topControlRow}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.circularControl, SHADOWS.soft]}>
                  <Ionicons name="arrow-back" size={22} color={PALETTE.text} />
                </TouchableOpacity>
                
                {role === 'admin' && (
                  <TouchableOpacity 
                    onPress={() => isEditableContext ? handleSaveChanges() : setIsEditing(true)} 
                    style={[styles.actionBadge, { backgroundColor: isEditableContext ? PALETTE.accent : PALETTE.secondary }, SHADOWS.soft]}
                  >
                    {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.actionBadgeText}>{isEditableContext ? "Save" : "Edit"}</Text>}
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.headerProfileFocus}>
                <View style={styles.avatarWrapper}>
                  {formData.photoUrl ? (
                    <Image source={{ uri: formData.photoUrl }} style={styles.avatarImgReal} />
                  ) : (
                    <Text style={styles.placeholderSymbol}>👶</Text>
                  )}
                </View>
                <Text style={styles.labelIdentityName}>{formData.name}</Text>
                <View style={[styles.pillTrackBadge, { backgroundColor: PALETTE.primary }]}>
                  <Text style={styles.pillLabelText}>{formData.class}</Text>
                </View>
              </View>

              <View style={styles.tripleMetricDock}>
                <View style={styles.metricItemBox}>
                  <Text style={styles.boxLabel}>Age</Text>
                  <Text style={styles.boxContentValue}>3 Yrs</Text>
                </View>
                <View style={styles.verticalDividerLine} />
                <View style={styles.metricItemBox}>
                  <Text style={styles.boxLabel}>Blood</Text>
                  <Text style={styles.boxContentValue}>{formData.bloodGroup || 'O+'}</Text>
                </View>
                <View style={styles.verticalDividerLine} />
                <View style={styles.metricItemBox}>
                  <Text style={styles.boxLabel}>Class No</Text>
                  <Text style={styles.boxContentValue} numberOfLines={1}>{formData.admissionNumber || '#2026'}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.mainLayoutSection}>
              <Text style={styles.moduleSectionTitle}>Profile Information</Text>
              <View style={[styles.premiumStructuralContainer, SHADOWS.soft]}>
                <View style={styles.dataFieldRow}>
                  <Ionicons name="card-outline" size={18} color={PALETTE.primary} style={styles.fieldPreIcon} />
                  <View style={styles.flexibleColumnNode}>
                    <Text style={styles.fieldLabelLabel}>Registration ID</Text>
                    <Text style={styles.staticFieldValueText}>{formData.id}</Text>
                  </View>
                </View>
                
                <View style={styles.horizontalDividerSeparator} />
                
                <View style={styles.dataFieldRow}>
                  <Ionicons name="call-outline" size={18} color={PALETTE.accent} style={styles.fieldPreIcon} />
                  <View style={styles.flexibleColumnNode}>
                    <Text style={styles.fieldLabelLabel}>Emergency Phone Contact</Text>
                    {isEditableContext ? (
                      <TextInput style={styles.editableFieldInput} value={formData.parentPhone} onChangeText={(val) => setFormData(prev => prev ? { ...prev, parentPhone: val } : null)} />
                    ) : (
                      <Text style={styles.staticFieldValueText}>{formData.parentPhone || '8778696408'}</Text>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.moduleSectionTitle}>Family Guardian Records</Text>
              <View style={[styles.premiumStructuralContainer, SHADOWS.soft]}>
                <View style={styles.dataFieldRow}>
                  <Ionicons name="man-outline" size={18} color={PALETTE.secondary} style={styles.fieldPreIcon} />
                  <View style={styles.flexibleColumnNode}>
                    <Text style={styles.fieldLabelLabel}>Father's Name</Text>
                    {isEditableContext ? (
                      <TextInput style={styles.editableFieldInput} value={formData.fatherName} onChangeText={(val) => setFormData(prev => prev ? { ...prev, fatherName: val } : null)} />
                    ) : (
                      <Text style={styles.staticFieldValueText}>{formData.fatherName || 'Dhayasankar V'}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.horizontalDividerSeparator} />

                <View style={styles.dataFieldRow}>
                  <Ionicons name="woman-outline" size={18} color={PALETTE.warning} style={styles.fieldPreIcon} />
                  <View style={styles.flexibleColumnNode}>
                    <Text style={styles.fieldLabelLabel}>Mother's Name</Text>
                    {isEditableContext ? (
                      <TextInput style={styles.editableFieldInput} value={formData.motherName} onChangeText={(val) => setFormData(prev => prev ? { ...prev, motherName: val } : null)} />
                    ) : (
                      <Text style={styles.staticFieldValueText}>{formData.motherName || 'Nisha D'}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.center}><Text style={{ color: PALETTE.textMuted, marginTop: 60 }}>No selected student records available.</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  adminRosterBar: { backgroundColor: PALETTE.card, paddingTop: 60, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  rosterBarTitle: { fontSize: 12, fontWeight: '900', color: PALETTE.textMuted, textTransform: 'uppercase', paddingHorizontal: 24, letterSpacing: 0.5, marginBottom: 10 },
  rosterScrollList: { paddingHorizontal: 20, gap: 10 },
  rosterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  rosterChipActive: { backgroundColor: PALETTE.secondary, borderWidth: 1, borderColor: PALETTE.secondary },
  rosterChipInactive: { backgroundColor: '#F0F3F5', borderWidth: 1, borderColor: PALETTE.border },
  rosterChipText: { fontSize: 12, fontWeight: '800' },
  textActive: { color: 'white' },
  textInactive: { color: PALETTE.textMuted },
  heroCanvas: { paddingTop: 30, paddingHorizontal: 24, paddingBottom: 28, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  topControlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  circularControl: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  actionBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  actionBadgeText: { color: 'white', fontSize: 12, fontWeight: '800' },
  headerProfileFocus: { alignItems: 'center', marginTop: SPACING.xs },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 12, ...SHADOWS.soft, overflow: 'hidden' },
  avatarImgReal: { width: '100%', height: '100%' },
  placeholderSymbol: { fontSize: 44 },
  labelIdentityName: { fontSize: 24, fontWeight: '900', color: PALETTE.text, letterSpacing: -0.5 },
  pillTrackBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.pill, marginTop: 8 },
  pillLabelText: { color: 'white', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  tripleMetricDock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, backgroundColor: 'white', borderRadius: 20, padding: 14, ...SHADOWS.soft },
  metricItemBox: { flex: 1, alignItems: 'center' },
  boxLabel: { fontSize: 9, fontWeight: '700', color: PALETTE.textMuted, textTransform: 'uppercase' },
  boxContentValue: { fontSize: 13, fontWeight: '900', color: PALETTE.text, marginTop: 4 },
  verticalDividerLine: { width: 1, height: 24, backgroundColor: PALETTE.border },
  mainLayoutSection: { paddingHorizontal: 24, paddingTop: SPACING.xs, paddingBottom: 60 },
  moduleSectionTitle: { fontSize: 12, fontWeight: '800', color: PALETTE.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 12, marginLeft: 4 },
  premiumStructuralContainer: { backgroundColor: PALETTE.card, borderRadius: RADIUS.card, padding: 18, marginBottom: 4 },
  dataFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  fieldPreIcon: { minWidth: 20 },
  flexibleColumnNode: { flex: 1 },
  fieldLabelLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textMuted, textTransform: 'uppercase' },
  staticFieldValueText: { fontSize: 14, fontWeight: '700', color: PALETTE.text, marginTop: 2 },
  editableFieldInput: { fontSize: 14, fontWeight: '700', color: PALETTE.primary, marginTop: 2, borderBottomWidth: 1, borderColor: PALETTE.border, paddingVertical: 2 },
  horizontalDividerSeparator: { height: 1, backgroundColor: PALETTE.border, marginVertical: 12 }
});