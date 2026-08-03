import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, Tabs } from 'expo-router'; // 🔄 Added Tabs helper to turn off native header forcing layout down
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient'; // 🎨 Premium background gradients
import { PALETTE, RADIUS, SPACING, SHADOWS } from '../../theme/designSystem';

export default function PremiumHomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Record<string, string> | null>(null);
  const todayFormatted = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let unsubscribeRole = () => {};
    let unsubscribeAttendance = () => {};

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      unsubscribeRole = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
          setChildId(docSnap.data().childId || null); 
        } else {
          setRole('parent');
        }
        setLoadingRole(false);
      });

      const attendanceRef = doc(db, 'attendance', todayFormatted);
      unsubscribeAttendance = onSnapshot(attendanceRef, (docSnap) => {
        if (docSnap.exists()) {
          setTodayAttendance(docSnap.data().records);
        } else {
          setTodayAttendance(null);
        }
      });
    } else {
      setLoadingRole(false);
    }

    return () => {
      unsubscribeRole();
      unsubscribeAttendance();
    };
  }, []);

  const myChildStatus = (todayAttendance && childId) ? todayAttendance[childId] : null;

  if (loadingRole) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🛑 Hides the clunky native default blue header bar from the view stack completely! */}
      <Tabs.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ☁️ Premium Integrated Gradient Sky Header Background */}
        <LinearGradient
          colors={role === 'admin' ? ['#F5EEFF', '#FAFBFC'] : ['#EBF5FF', '#F4F9FF', PALETTE.background]}
          style={styles.topHeaderBackground}
        >
          {/* Decorative Vectors structured cleanly to prevent screen collision */}
          <View style={styles.sunshineVector}>
            <Ionicons name="sunny" size={64} color={PALETTE.highlight} />
          </View>
          <View style={styles.cloudVectorLeft}>
            <Ionicons name="cloud" size={44} color="white" opacity={0.6} />
          </View>

          {/* Welcome Block Layout */}
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.brandSubtitle}>
                {role === 'admin' ? 'SHISHUVIHAR MANAGEMENT' : 'SHISHUVIHAR'}
              </Text>
              <Text style={styles.brandText}>
                {role === 'admin' ? 'Hello, Administrator' : 'Welcome Back 👋'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => auth.signOut()} style={[styles.avatarBorder, SHADOWS.soft]}>
              <View style={[styles.avatarInner, { backgroundColor: role === 'admin' ? PALETTE.secondary : PALETTE.primary }]}>
                <Ionicons name="log-out-outline" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Dynamic Contextual Hero Card */}
          <View style={[styles.heroCard, SHADOWS.premium]}>
            <View style={styles.heroRow}>
              <View style={styles.heroMainInfo}>
                <View style={styles.badgeRow}>
                  <View style={[styles.roleBadge, { backgroundColor: role === 'admin' ? PALETTE.warning : PALETTE.primary }]}>
                    <Text style={styles.roleBadgeText}>{role === 'admin' ? 'Admin Mode' : 'Playgroup'}</Text>
                  </View>
                  {myChildStatus && (
                    <View style={[styles.statusBadge, { backgroundColor: myChildStatus === 'present' ? '#EAFDF3' : '#FDF2F2' }]}>
                      <View style={[styles.statusDot, { backgroundColor: myChildStatus === 'present' ? PALETTE.accent : '#E74C3C' }]} />
                      <Text style={[styles.statusBadgeText, { color: PALETTE.text }]}>
                        {myChildStatus === 'present' ? 'At School' : 'Absent'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroHeadline}>
                  {role === 'admin' ? "Campus Overview" : "Your Little One's Day"}
                </Text>
                <Text style={styles.heroSubheadline}>
                  {role === 'admin' 
                    ? "Track operational activity feeds and daily student rosters effortlessly." 
                    : "Every moment is captured with care, love, and professional guidance."}
                </Text>
              </View>
              <View style={styles.illustrationPlaceholder}>
                <Ionicons name="sparkles" size={32} color={PALETTE.highlight} />
              </View>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.mainContent}>
          {/* Carousel Banner Segment */}
          <View style={[styles.carouselCard, SHADOWS.soft]}>
            <Ionicons name="balloon" size={20} color="#6A56E3" />
            <Text style={styles.carouselText}>Upcoming Event: Annual Sports Day preparations have begun! 🎈</Text>
          </View>

          {/* Parent Hub Interactive Navigation Grid */}
          <Text style={styles.sectionTitle}>Parent Hub</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/activity-feed' as any)}>
              <View style={[styles.iconContainer, { backgroundColor: '#EBF5FF' }]}>
                <Ionicons name="images" size={24} color={PALETTE.primary} />
              </View>
              <Text style={styles.buttonText}>Activity Feed</Text>
              <Text style={styles.buttonDesc}>Daily moments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/notice-board' as any)}>
              <View style={[styles.iconContainer, { backgroundColor: '#F5EEFF' }]}>
                <Ionicons name="megaphone" size={24} color={PALETTE.secondary} />
              </View>
              <Text style={styles.buttonText}>Notice Board</Text>
              <Text style={styles.buttonDesc}>School updates</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/calendar' as any)}>
              <View style={[styles.iconContainer, { backgroundColor: '#EAFDF3' }]}>
                <Ionicons name="calendar" size={24} color={PALETTE.accent} />
              </View>
              <Text style={styles.buttonText}>Calendar</Text>
              <Text style={styles.buttonDesc}>Holidays & events</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/messages' as any)}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF2EA' }]}>
                <Ionicons name="chatbubbles" size={24} color={PALETTE.warning} />
              </View>
              <Text style={styles.buttonText}>Message Us</Text>
              <Text style={styles.buttonDesc}>Direct chat line</Text>
            </TouchableOpacity>

            {/* 👶 NEW: Quick-Link to the Premium Child Profile Page */}
            <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/child-profile' as any)}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFFEEA' }]}>
                <Ionicons name="happy-outline" size={24} color={PALETTE.highlight} />
              </View>
              <Text style={styles.buttonText}>Child Profile</Text>
              <Text style={styles.buttonDesc}>Vital statistics</Text>
            </TouchableOpacity>

            {/* ⚙️ NEW: Quick-Link to the System Configuration & Settings Page */}
            <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/settings' as any)}>
              <View style={[styles.iconContainer, { backgroundColor: '#F0F3F5' }]}>
                <Ionicons name="settings-outline" size={24} color={PALETTE.text} />
              </View>
              <Text style={styles.buttonText}>App Settings</Text>
              <Text style={styles.buttonDesc}>Preferences & info</Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Management Panel Controls for Admin Role */}
          {role === 'admin' && (
            <View style={styles.adminSection}>
              <Text style={styles.sectionTitle}>Admin Controls</Text>
              <View style={styles.grid}>
                <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/create-post' as any)}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FFFEEA' }]}>
                    <Ionicons name="create" size={24} color={PALETTE.highlight} />
                  </View>
                  <Text style={styles.buttonText}>Post Update</Text>
                  <Text style={styles.buttonDesc}>Feed broadcast</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/attendance' as any)}>
                  <View style={[styles.iconContainer, { backgroundColor: '#EAFDF3' }]}>
                    <Ionicons name="checkmark-circle" size={24} color={PALETTE.accent} />
                  </View>
                  <Text style={styles.buttonText}>Roll Call</Text>
                  <Text style={styles.buttonDesc}>Take attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/add-student' as any)}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F0F3F5' }]}>
                    <Ionicons name="person-add" size={24} color={PALETTE.text} />
                  </View>
                  <Text style={styles.buttonText}>New Admission</Text>
                  <Text style={styles.buttonDesc}>Onboard & twins</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/link-accounts' as any)}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F5EEFF' }]}>
                    <Ionicons name="link" size={24} color={PALETTE.secondary} />
                  </View>
                  <Text style={styles.buttonText}>Link Accounts</Text>
                  <Text style={styles.buttonDesc}>Connect families</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.gridButton, SHADOWS.soft]} onPress={() => router.push('/manage-students' as any)}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FFF2EA' }]}>
                    <Ionicons name="school" size={26} color={PALETTE.warning} />
                  </View>
                  <Text style={styles.buttonText}>Manage Roster</Text>
                  <Text style={styles.buttonDesc}>Update student records</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeaderBackground: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  sunshineVector: { position: 'absolute', top: 16, right: -10, opacity: 0.6 },
  cloudVectorLeft: { position: 'absolute', top: 40, left: -15, opacity: 0.4 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 5 },
  brandSubtitle: { fontSize: 11, fontWeight: '900', color: PALETTE.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  brandText: { fontSize: 24, fontWeight: '900', color: PALETTE.text, letterSpacing: -0.5 },
  avatarBorder: { padding: 3, borderRadius: 18, backgroundColor: '#FFFFFF' },
  avatarInner: { width: 38, height: 38, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  heroCard: { backgroundColor: PALETTE.card, borderRadius: RADIUS.card, padding: 20, marginTop: SPACING.xs, zIndex: 10 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroMainInfo: { flex: 1, paddingRight: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  roleBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  heroHeadline: { fontSize: 20, fontWeight: '900', color: PALETTE.text, marginBottom: 4 },
  heroSubheadline: { fontSize: 12, color: PALETTE.textMuted, lineHeight: 16, fontWeight: '500' },
  illustrationPlaceholder: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  mainContent: { paddingHorizontal: 24, paddingTop: SPACING.md, paddingBottom: 40 },
  carouselCard: { flexDirection: 'row', gap: 12, backgroundColor: '#F4F1FE', padding: 14, borderRadius: 20, alignItems: 'center', marginBottom: SPACING.lg },
  carouselText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#6A56E3', lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.text, marginBottom: SPACING.md, letterSpacing: -0.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  gridButton: { width: '48%', backgroundColor: PALETTE.card, padding: 16, borderRadius: RADIUS.card, alignItems: 'flex-start' },
  iconContainer: { padding: 10, borderRadius: 14, marginBottom: 12 },
  buttonText: { fontSize: 14, fontWeight: '800', color: PALETTE.text, marginBottom: 1 },
  buttonDesc: { fontSize: 11, color: PALETTE.textMuted, fontWeight: '600' },
  adminSection: { marginTop: 28 }
});