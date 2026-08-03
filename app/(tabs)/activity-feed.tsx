import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc, getDoc } from 'firebase/firestore'; // Added getDoc
import { db, auth } from '../../firebaseConfig'; // Ensure auth is imported
import { Ionicons } from '@expo/vector-icons';

interface FeedPost {
  id: string;
  description: string;
  imageUrl?: string;
  createdAt: any;
}

export default function ActivityFeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // New state to check admin role

  useEffect(() => {
    // 1. Check if the user is Admin
    const checkAdminRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdminRole();

    // 2. Fetch posts
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'activity-feed'), 
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: FeedPost[] = [];
      snapshot.forEach((document) => {
        fetchedPosts.push({ id: document.id, ...document.data() } as FeedPost);
      });
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  const handleClearPost = (id: string) => {
    Alert.alert(
      "Clear Post",
      "Are you sure you want to take this down?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Clear It", style: "destructive", onPress: async () => {
            try {
              await deleteDoc(doc(db, 'activity-feed', id));
            } catch (error) {
              console.error("Error clearing post:", error);
            }
          } 
        }
      ]
    );
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
        <Ionicons name="images" size={28} color="#3498db" />
        <Text style={styles.headerTitle}>Daily Activities</Text>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyText}>No activities in the last 24 hours.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>SV</Text>
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.authorName}>Shishu Vihar Admin</Text>
                  <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
                </View>
                
                {/* 🔒 ONLY show if isAdmin is true */}
                {isAdmin && (
                  <TouchableOpacity onPress={() => handleClearPost(item.id)} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>

              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
              ) : null}

              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f4' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ecf0f1', zIndex: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },
  listContainer: { paddingVertical: 15 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#95a5a6', fontSize: 16, marginTop: 10, fontStyle: 'italic' },
  postCard: { backgroundColor: 'white', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  headerTextContainer: { flex: 1 },
  authorName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  postTime: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  clearButton: { padding: 8, backgroundColor: '#fdedec', borderRadius: 8 },
  postImage: { width: '100%', height: 300, backgroundColor: '#ecf0f1' },
  captionContainer: { padding: 15 },
  captionText: { fontSize: 15, color: '#34495e', lineHeight: 22 },
});