import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderEmail: string;
  createdAt: any;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    // Listen to the global 'messages' collection, ordered by oldest to newest so they stack correctly
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(fetchedMessages);
      setLoading(false);
      
      // Auto-scroll to the bottom when new messages load
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UI feel

    try {
      await addDoc(collection(db, 'messages'), {
        text: messageText,
        senderId: currentUser.uid,
        senderEmail: currentUser.email || 'Unknown User',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message: ", error);
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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>School Support</Text>
          <Text style={styles.headerSubtitle}>Admin & Staff Chat</Text>
        </View>
      </View>

      {/* Chat History */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.senderId === currentUser?.uid;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
              {!isMe && <Text style={styles.senderEmail}>{item.senderEmail}</Text>}
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.text}
              </Text>
            </View>
          );
        }}
      />

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="white" style={styles.sendIcon} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  backButton: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  headerSubtitle: { fontSize: 12, color: '#2ecc71', fontWeight: 'bold' },
  
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#3498db', borderBottomRightRadius: 2 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  
  senderEmail: { fontSize: 10, color: '#95a5a6', marginBottom: 4, fontWeight: 'bold' },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#2c3e50' },

  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ecf0f1', alignItems: 'flex-end' },
  textInput: { flex: 1, backgroundColor: '#f0f3f4', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, paddingTop: 10, fontSize: 16, maxHeight: 100, color: '#2c3e50' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendButtonDisabled: { backgroundColor: '#bdc3c7' },
  sendIcon: { marginLeft: 3 },
});