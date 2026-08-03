import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { auth, db } from '../../firebaseConfig';
import { GLASS_THEME, PALETTE } from '../../theme/designSystem';

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

    // 🛑 Guard: Wait until auth.currentUser is available
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      
      // 🛡️ Added error handlers to prevent unhandled permission exceptions
      unsubscribeRole = onSnapshot(
        userDocRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
            setChildId(docSnap.data().childId || null); 
          } else {
            setRole('parent');
          }
          setLoadingRole(false);
        },
        (error) => {
          console.warn("User role listener caught error:", error.message);
          setLoadingRole(false);
        }
      );

      const attendanceRef = doc(db, 'attendance', todayFormatted);
      unsubscribeAttendance = onSnapshot(
        attendanceRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            setTodayAttendance(docSnap.data().records);
          } else {
            setTodayAttendance(null);
          }
        },
        (error) => {
          console.warn("Attendance listener caught error:", error.message);
        }
      );
    } else {
      // ⏳ If auth is not ready yet on cold boot, keep checking as auth state resolves
      setLoadingRole(false);
    }

    return () => {
      unsubscribeRole();
      unsubscribeAttendance();
    };
  }, [auth.currentUser, todayFormatted]); // 🔄 Re-runs automatically the instant auth.currentUser resolves!

  const myChildStatus = (todayAttendance && childId) ? todayAttendance[childId] : null;

  if (loadingRole) {
    return (
      <View style={[styles.mainCanvas, styles.center]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Tabs.Screen options={{ headerShown: false }} />

      <View style={styles.mainCanvas}>
        {/* 🌈 Glassmorphism Ambient Light Orbs */}
        <LinearGradient
          colors={GLASS_THEME.orbPrimary}
          style={[styles.ambientOrb, styles.orbTopLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={GLASS_THEME.orbSecondary}
          style={[styles.ambientOrb, styles.orbBottomRight]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={GLASS_THEME.orbAccent}
          style={[styles.ambientOrb, styles.orbCenterRight]}
          pointerEvents="none"
        />

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollLayout} 
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* ☀️ Top Brand Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandSubtitle}>
                {role === 'admin' ? 'SHISHUVIHAR MANAGEMENT' : 'SHISHUVIHAR'}
              </Text>
              <Text style={styles.brandText}>
                {role === 'admin' ? 'Hello, Administrator' : 'Welcome Back 👋'}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => auth.signOut()} 
              style={styles.avatarGlassBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={role === 'admin' ? PALETTE.secondary : PALETTE.primary} />
            </TouchableOpacity>
          </View>

          {/* 🔮 Hero Card Glass Panel */}
          <GlassCard intensity={65} style={{ marginTop: 16 }}>
            <View style={styles.heroRow}>
              <View style={styles.heroMainInfo}>
                <View style={styles.badgeRow}>
                  <View style={[styles.roleBadge, { backgroundColor: role === 'admin' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(99, 102, 241, 0.9)' }]}>
                    <Text style={styles.roleBadgeText}>{role === 'admin' ? 'Admin Mode' : 'Playgroup'}</Text>
                  </View>

                  {myChildStatus && (
                    <View style={[styles.statusBadge, { backgroundColor: myChildStatus === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                      <View style={[styles.statusDot, { backgroundColor: myChildStatus === 'present' ? PALETTE.accent : '#EF4444' }]} />
                      <Text style={styles.statusBadgeText}>
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

              <View style={styles.sparkleRing}>
                <Ionicons name="sparkles" size={28} color="#FFB800" />
              </View>
            </View>
          </GlassCard>

          {/* 🎈 Announcement Banner */}
          <GlassCard intensity={45} style={{ marginTop: 16 }}>
            <View style={styles.carouselInner}>
              <View style={styles.bannerIconCircle}>
                <Ionicons name="balloon" size={18} color="#6366F1" />
              </View>
              <Text style={styles.carouselText}>Upcoming Event: Annual Sports Day preparations have begun! 🎈</Text>
            </View>
          </GlassCard>

          {/* 🏠 Parent Hub Interactive Grid */}
          <Text style={styles.sectionTitle}>Parent Hub</Text>
          <View style={styles.grid}>
            
            <GlassCard intensity={50} style={styles.gridCardWrapper}>
              <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/activity-feed' as any)}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <Ionicons name="images" size={22} color={PALETTE.primary} />
                </View>
                <Text style={styles.buttonText}>Activity Feed</Text>
                <Text style={styles.buttonDesc}>Daily moments</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard intensity={50} style={styles.gridCardWrapper}>
              <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/notice-board' as any)}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Ionicons name="megaphone" size={22} color={PALETTE.secondary} />
                </View>
                <Text style={styles.buttonText}>Notice Board</Text>
                <Text style={styles.buttonDesc}>School updates</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard intensity={50} style={styles.gridCardWrapper}>
              <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/calendar' as any)}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="calendar" size={22} color={PALETTE.accent} />
                </View>
                <Text style={styles.buttonText}>Calendar</Text>
                <Text style={styles.buttonDesc}>Holidays & events</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard intensity={50} style={styles.gridCardWrapper}>
              <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/messages' as any)}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="chatbubbles" size={22} color={PALETTE.warning} />
                </View>
                <Text style={styles.buttonText}>Message Us</Text>
                <Text style={styles.buttonDesc}>Direct chat line</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard intensity={50} style={styles.gridCardWrapper}>
              <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/child-profile' as any)}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Ionicons name="happy-outline" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.buttonText}>Child Profile</Text>
                <Text style={styles.buttonDesc}>Vital statistics</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard intensity={50} style={styles.gridCardWrapper}>
              <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/settings' as any)}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
                  <Ionicons name="settings-outline" size={22} color={PALETTE.text} />
                </View>
                <Text style={styles.buttonText}>App Settings</Text>
                <Text style={styles.buttonDesc}>Preferences & info</Text>
              </TouchableOpacity>
            </GlassCard>

          </View>

          {/* ⚡ Conditional Admin Controls Panel */}
          {role === 'admin' && (
            <View style={styles.adminSection}>
              <Text style={styles.sectionTitle}>Admin Controls</Text>
              <View style={styles.grid}>

                <GlassCard intensity={50} style={styles.gridCardWrapper}>
                  <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/create-post' as any)}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Ionicons name="create" size={22} color={PALETTE.warning} />
                    </View>
                    <Text style={styles.buttonText}>Post Update</Text>
                    <Text style={styles.buttonDesc}>Feed broadcast</Text>
                  </TouchableOpacity>
                </GlassCard>

                <GlassCard intensity={50} style={styles.gridCardWrapper}>
                  <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/attendance' as any)}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons name="checkmark-circle" size={22} color={PALETTE.accent} />
                    </View>
                    <Text style={styles.buttonText}>Roll Call</Text>
                    <Text style={styles.buttonDesc}>Take attendance</Text>
                  </TouchableOpacity>
                </GlassCard>

                <GlassCard intensity={50} style={styles.gridCardWrapper}>
                  <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/add-student' as any)}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                      <Ionicons name="person-add" size={22} color={PALETTE.primary} />
                    </View>
                    <Text style={styles.buttonText}>New Admission</Text>
                    <Text style={styles.buttonDesc}>Onboard & twins</Text>
                  </TouchableOpacity>
                </GlassCard>

                <GlassCard intensity={50} style={styles.gridCardWrapper}>
                  <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/link-accounts' as any)}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                      <Ionicons name="link" size={22} color={PALETTE.secondary} />
                    </View>
                    <Text style={styles.buttonText}>Link Accounts</Text>
                    <Text style={styles.buttonDesc}>Connect families</Text>
                  </TouchableOpacity>
                </GlassCard>

                <GlassCard intensity={50} style={styles.gridCardWrapper}>
                  <TouchableOpacity style={styles.gridTouchable} onPress={() => router.push('/manage-students' as any)}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                      <Ionicons name="school" size={22} color="#0EA5E9" />
                    </View>
                    <Text style={styles.buttonText}>Manage Roster</Text>
                    <Text style={styles.buttonDesc}>Update records</Text>
                  </TouchableOpacity>
                </GlassCard>

              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  mainCanvas: {
    flex: 1,
    position: 'relative',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollLayout: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  /* Ambient Orbs */
  ambientOrb: {
    position: 'absolute',
    borderRadius: 150,
    opacity: 0.5,
  },
  orbTopLeft: {
    width: 280,
    height: 280,
    top: -40,
    left: -50,
  },
  orbBottomRight: {
    width: 260,
    height: 260,
    bottom: 60,
    right: -40,
  },
  orbCenterRight: {
    width: 200,
    height: 200,
    top: '35%',
    right: -60,
  },
  /* Header Section */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: PALETTE.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  avatarGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Hero Card */
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMainInfo: {
    flex: 1,
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubheadline: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    fontWeight: '500',
  },
  sparkleRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  /* Carousel Banner */
  carouselInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    lineHeight: 16,
  },
  /* Grid Layout */
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 26,
    marginBottom: 12,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridCardWrapper: {
    width: '48%',
  },
  gridTouchable: {
    width: '100%',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  buttonDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  adminSection: {
    marginTop: 10,
  },
});