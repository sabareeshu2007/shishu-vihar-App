import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SHADOWS } from '../../theme/designSystem';

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
    const checkAdminRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdminRole();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'notice-board'), 
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotices: Notice[] = [];
      snapshot.forEach((document) => {
        fetchedNotices.push({ id: document.id, ...document.data() } as Notice);
      });
      setNotices(fetchedNotices);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

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
    if (context.includes('holiday') || context.includes('closed')) return { bg: '#EAFDF3', accent: PALETTE.accent, icon: 'calendar' };
    if (context.includes('urgent') || context.includes('important') || context.includes('rain')) return { bg: '#FFF2EA', accent: PALETTE.warning, icon: 'alert-circle' };
    return { bg: '#F5EEFF', accent: PALETTE.secondary, icon: 'bookmark' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="megaphone" size={26} color={PALETTE.secondary} />
        <Text style={styles.headerTitle}>Notice Board</Text>
      </View>

      {notices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={54} color={PALETTE.textMuted} />
          <Text style={styles.emptyText}>Everything is running smoothly. No new announcements listed.</Text>
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
              <View style={[styles.noticeCard, SHADOWS.soft, { borderLeftColor: cardTheme.accent }]}>
                <View style={[styles.noticeHeader, { backgroundColor: cardTheme.bg }]}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#FFFFFF' }]}>
                    <Ionicons name={cardTheme.icon as any} size={20} color={cardTheme.accent} />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.noticeTitle}>{item.title}</Text>
                    <Text style={styles.noticeTime}>Official Notice</Text>
                  </View>
                  {isAdmin && (
                    <TouchableOpacity onPress={() => handleClearNotice(item.id)} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={22} color="#E74C3C" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.contentContainer}>
                  <Text style={styles.noticeDescription}>{item.description}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 60, backgroundColor: PALETTE.card, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  headerTitle: { fontSize: 22, fontWeight: '900', color: PALETTE.text, marginLeft: 10 },
  listContainer: { padding: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: PALETTE.textMuted, textAlign: 'center', marginTop: 12, fontSize: 14 },
  noticeCard: { backgroundColor: PALETTE.card, marginBottom: 18, borderRadius: 24, overflow: 'hidden', borderLeftWidth: 6 },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconWrapper: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTextContainer: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.text },
  noticeTime: { fontSize: 11, color: PALETTE.textMuted, marginTop: 1 },
  clearButton: { padding: 4 },
  contentContainer: { padding: 18 },
  noticeDescription: { fontSize: 14, color: PALETTE.text, lineHeight: 22 }
});