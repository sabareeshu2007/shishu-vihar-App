import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { PALETTE, RADIUS, SHADOWS, SPACING } from '../../theme/designSystem';

interface UserData {
  email: string;
  role: string;
  childId?: string;
  childIds?: string[];
}

interface LinkedStudentData {
  name: string;
  class: string;
}

export default function RealDataSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState<UserData | null>(null);
  const [childData, setChildData] = useState<LinkedStudentData | null>(null);
  
  // App system preference states
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // 📡 Stream parent profile data in real-time from your 'users' collection
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
      if (userSnap.exists()) {
        const uData = userSnap.data() as UserData;
        setParentData(uData);

        // Fetch the corresponding real student name and class data if a link exists
        const targetChildId = uData.childIds?.[0] || uData.childId;
        if (targetChildId) {
          const studentDocRef = doc(db, 'students', targetChildId);
          const unsubscribeStudent = onSnapshot(studentDocRef, (studentSnap) => {
            if (studentSnap.exists()) {
              setChildData(studentSnap.data() as LinkedStudentData);
            }
            setLoading(false);
          });
          return () => unsubscribeStudent();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error("Settings stream error: ", error);
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, []);

  const handleSignOutProcess = () => {
    Alert.alert(
      "Secure Disconnection",
      "Are you sure you want to log out of your active session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disconnect", 
          style: "destructive", 
          onPress: () => {
            auth.signOut()
              .then(() => router.replace('/login' as any))
              .catch(err => Alert.alert("Sign Out Error", err.message));
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
      <Tabs.Screen options={{ headerShown: false }} />
      
      <View style={styles.headerContext}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={PALETTE.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Configuration</Text>
      </View>

      <ScrollView style={styles.scrollCanvas} showsVerticalScrollIndicator={false}>
        
        {/* Real-time Connected Account Info */}
        <View style={[styles.profileHeroCard, SHADOWS.soft]}>
          <View style={styles.avatarPill}><Text style={styles.avatarLabel}>🏡</Text></View>
          <View style={styles.heroRightData}>
            <Text style={styles.parentNameText}>
              {parentData?.role === 'admin' ? 'Administrator Account' : 'SHISHUVIHAR Parent Portal'}
            </Text>
            <Text style={styles.parentEmailText}>{parentData?.email || 'No email associated'}</Text>
          </View>
        </View>

        {/* Dynamic Connected Student Association */}
        {parentData?.role !== 'admin' && (
          <>
            <Text style={styles.groupHeading}>Linked Ward Association</Text>
            <View style={[styles.settingCard, SHADOWS.soft]}>
              <View style={styles.staticField}>
                <Text style={styles.fieldMeta}>Student Name</Text>
                <Text style={styles.fieldContent}>{childData?.name || 'Searching registration records...'}</Text>
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.staticField}>
                <Text style={styles.fieldMeta}>Assigned Class Track</Text>
                <Text style={styles.fieldContent}>{childData?.class || 'Unassigned group status'}</Text>
              </View>
            </View>
          </>
        )}

        {/* Account System Toggles */}
        <Text style={styles.groupHeading}>Personal Configuration</Text>
        <View style={[styles.settingCard, SHADOWS.soft]}>
          <View style={styles.actionItemRow}>
            <View style={styles.itemLeftBlock}>
              <Ionicons name="notifications-outline" size={20} color={PALETTE.primary} />
              <Text style={styles.itemLabel}>Real-time Activity Alerts</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications} 
              trackColor={{ true: PALETTE.primary, false: PALETTE.border }}
              thumbColor="white"
            />
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.actionItemRow}>
            <View style={styles.itemLeftBlock}>
              <Ionicons name="cloud-download-outline" size={20} color={PALETTE.accent} />
              <Text style={styles.itemLabel}>Auto-Cache Media Over Wi-Fi</Text>
            </View>
            <Switch 
              value={autoDownload} 
              onValueChange={setAutoDownload}
              trackColor={{ true: PALETTE.accent, false: PALETTE.border }}
              thumbColor="white"
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.signOutButton, SHADOWS.soft]} onPress={handleSignOutProcess}>
          <Ionicons name="power" size={18} color="white" />
          <Text style={styles.signOutButtonText}>Terminate Session Logging</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContext: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 60, backgroundColor: PALETTE.card, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: PALETTE.text },
  scrollCanvas: { flex: 1, paddingHorizontal: 24, paddingTop: SPACING.md },
  profileHeroCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: PALETTE.card, borderRadius: RADIUS.card, padding: 16, marginBottom: 12 },
  avatarPill: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#FFF2EA', justifyContent: 'center', alignItems: 'center' },
  avatarLabel: { fontSize: 24 },
  heroRightData: { flex: 1 },
  parentNameText: { fontSize: 16, fontWeight: '800', color: PALETTE.text },
  parentEmailText: { fontSize: 12, fontWeight: '600', color: PALETTE.textMuted, marginTop: 1 },
  groupHeading: { fontSize: 12, fontWeight: '800', color: PALETTE.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 10, marginLeft: 4 },
  settingCard: { backgroundColor: PALETTE.card, borderRadius: RADIUS.card, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 4 },
  actionItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  itemLeftBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemLabel: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  rowDivider: { height: 1, backgroundColor: PALETTE.border },
  staticField: { paddingVertical: 12 },
  fieldMeta: { fontSize: 11, fontWeight: '700', color: PALETTE.textMuted, textTransform: 'uppercase' },
  fieldContent: { fontSize: 14, fontWeight: '700', color: PALETTE.text, marginTop: 2 },
  signOutButton: { backgroundColor: '#E74C3C', borderRadius: RADIUS.card, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40, marginBottom: 60 },
  signOutButtonText: { color: 'white', fontSize: 15, fontWeight: '800' }
});