import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { auth, db } from '../../firebaseConfig';
import { GLASS_THEME, PALETTE } from '../../theme/designSystem';
interface Notice {
  id: string;
  title: string;
  description: string;
  createdAt: any;
}

export default function PremiumNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 🛑 1. GUARD: Do not attempt to fetch from Firestore if Auth hasn't loaded yet
    if (!auth.currentUser) {
      return; 
    }

    const checkAdminRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.warn("Role check failed:", error);
      }
    };
    
    checkAdminRole();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'notice-board'), 
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc')
    );
    
    // 🛡️ 2. SAFE LISTENER: Added an error callback to catch and silence any stray permission glitches
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedNotices: Notice[] = [];
        snapshot.forEach((document) => {
          fetchedNotices.push({ id: document.id, ...document.data() } as Notice);
        });
        setNotices(fetchedNotices);
        setLoading(false);
      },
      (error) => {
        console.warn("Notice board listener gracefully caught an error:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe(); 
  }, [auth.currentUser]); // 🔄 3. DEPENDENCY: This ensures the hook re-runs the exact millisecond Firebase restores the user's session!

  const handleClearNotice = (id: string) => {
    Alert.alert(
      "Remove Notice",
      "Are you sure you want to retire this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Dismiss", style: "destructive", onPress: async () => {
            try { await deleteDoc(doc(db, 'notice-board', id)); } catch (e) { console.error(e); }
          } 
        }
      ]
    );
  };

  const parseCardTheme = (title: string, desc: string) => {
    const context = (title + ' ' + desc).toLowerCase();
    if (context.includes('holiday') || context.includes('closed')) {
      return { 
        badgeBg: 'rgba(16, 185, 129, 0.15)', 
        accent: PALETTE.accent, 
        icon: 'calendar-outline',
        label: 'HOLIDAY & EVENT' 
      };
    }
    if (context.includes('urgent') || context.includes('important') || context.includes('rain')) {
      return { 
        badgeBg: 'rgba(245, 158, 11, 0.15)', 
        accent: PALETTE.warning, 
        icon: 'alert-circle-outline',
        label: 'IMPORTANT NOTICE' 
      };
    }
    return { 
      badgeBg: 'rgba(236, 72, 153, 0.15)', 
      accent: PALETTE.secondary, 
      icon: 'bookmark-outline',
      label: 'ANNOUNCEMENT' 
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainCanvas}>
        {/* 🌈 Ambient Light Orbs */}
        <LinearGradient
          colors={GLASS_THEME.orbSecondary}
          style={[styles.ambientOrb, styles.orbTopLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={GLASS_THEME.orbAccent}
          style={[styles.ambientOrb, styles.orbBottomRight]}
          pointerEvents="none"
        />

        {/* 📢 Glassmorphism Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBubble}>
              <Ionicons name="megaphone" size={22} color={PALETTE.secondary} />
            </View>
            <View>
              <Text style={styles.brandSubtitle}>SHISHUVIHAR BULLETIN</Text>
              <Text style={styles.headerTitle}>Notice Board</Text>
            </View>
          </View>
        </View>

        {/* 📋 Notices Feed */}
        {notices.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={42} color={PALETTE.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>Everything is running smoothly. No active announcements listed right now.</Text>
          </View>
        ) : (
          <FlatList
            data={notices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const cardTheme = parseCardTheme(item.title, item.description);
              return (
                <GlassCard intensity={60} style={styles.glassNoticeCard}>
                  {/* Card Top Row */}
                  <View style={styles.noticeHeader}>
                    <View style={[styles.iconWrapper, { backgroundColor: cardTheme.badgeBg }]}>
                      <Ionicons name={cardTheme.icon as any} size={20} color={cardTheme.accent} />
                    </View>
                    
                    <View style={styles.headerTextContainer}>
                      <View style={[styles.noticeTypeBadge, { backgroundColor: cardTheme.badgeBg }]}>
                        <Text style={[styles.noticeTypeBadgeText, { color: cardTheme.accent }]}>
                          {cardTheme.label}
                        </Text>
                      </View>
                      <Text style={styles.noticeTitle}>{item.title}</Text>
                    </View>

                    {isAdmin && (
                      <TouchableOpacity onPress={() => handleClearNotice(item.id)} style={styles.clearButton}>
                        <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.glassDivider} />

                  {/* Card Content Body */}
                  <View style={styles.contentContainer}>
                    <Text style={styles.noticeDescription}>{item.description}</Text>
                  </View>
                </GlassCard>
              );
            }}
          />
        )}
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
  /* Ambient Orbs */
  ambientOrb: {
    position: 'absolute',
    borderRadius: 140,
    opacity: 0.5,
  },
  orbTopLeft: {
    width: 280,
    height: 280,
    top: -30,
    left: -40,
  },
  orbBottomRight: {
    width: 250,
    height: 250,
    bottom: 40,
    right: -40,
  },
  /* Header Bar */
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: PALETTE.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  /* Notice List */
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    paddingTop: 4,
  },
  glassNoticeCard: {
    marginBottom: 16,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  noticeTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  noticeTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  clearButton: {
    padding: 2,
  },
  glassDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginVertical: 12,
  },
  contentContainer: {
    paddingTop: 2,
  },
  noticeDescription: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },
  /* Empty State */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});