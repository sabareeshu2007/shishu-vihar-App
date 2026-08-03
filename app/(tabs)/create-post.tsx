import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

// ☁️ CLOUDINARY CONFIGURATION
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dufkteoi1/image/upload';
const UPLOAD_PRESET = 'shishu_app_preset'; 

export default function CreatePostScreen() {
  const router = useRouter();
  const [postType, setPostType] = useState<'feed' | 'notice'>('feed');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Open Native Gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7, // 70% quality for fast mobile loading
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 2. Upload directly to Cloudinary
  const uploadToCloudinary = async (uri: string) => {
    const data = new FormData();
    
    // Format the file for React Native upload
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    data.append('file', {
      uri: uri,
      name: filename,
      type: type
    } as any);
    
    data.append('upload_preset', UPLOAD_PRESET);

    // Send to Cloudinary API
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      }
    });

    const responseData = await response.json();
    
    if (responseData.secure_url) {
      return responseData.secure_url; // The permanent public link!
    } else {
      throw new Error("Cloudinary upload failed");
    }
  };

  const handlePublish = async () => {
    if (!description) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }
    if (postType === 'notice' && !title) {
      Alert.alert("Required", "Notices require a title.");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = null;

      // Handle real image upload if one is selected
      if (postType === 'feed' && imageUri) {
        finalImageUrl = await uploadToCloudinary(imageUri);
      }

      const targetCollection = postType === 'feed' ? 'activity-feed' : 'notice-board';
      const payload: Record<string, any> = {
        description,
        createdAt: serverTimestamp(),
      };

      if (postType === 'notice') payload.title = title;
      if (postType === 'feed' && finalImageUrl) payload.imageUrl = finalImageUrl; 

      // Save the text and the Cloudinary URL to Firestore
      await addDoc(collection(db, targetCollection), payload);

      Alert.alert("Success", `Published to the ${postType === 'feed' ? 'Activity Feed' : 'Notice Board'}.`);
      
      setTitle('');
      setDescription('');
      setImageUri(null);
      router.back();
    } catch (error) {
      console.error("Upload Error: ", error);
      Alert.alert("Upload Failed", "Could not upload image. Check your Cloudinary settings and internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Publish Destination</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleButton, postType === 'feed' ? styles.toggleActiveFeed : styles.toggleInactive]}
            onPress={() => setPostType('feed')}
          >
            <Ionicons name="images" size={18} color={postType === 'feed' ? 'white' : '#7f8c8d'} />
            <Text style={[styles.toggleText, postType === 'feed' && styles.textActiveWhite]}>Activity Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toggleButton, postType === 'notice' ? styles.toggleActiveNotice : styles.toggleInactive]}
            onPress={() => setPostType('notice')}
          >
            <Ionicons name="megaphone" size={18} color={postType === 'notice' ? 'white' : '#7f8c8d'} />
            <Text style={[styles.toggleText, postType === 'notice' && styles.textActiveWhite]}>Notice Board</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formContainer}>
        {postType === 'notice' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notice Title</Text>
            <TextInput 
              style={styles.input} placeholder="e.g., Circular No. 42" value={title} onChangeText={setTitle} 
            />
          </View>
        )}

        {/* Real Native Image Picker UI */}
        {postType === 'feed' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attach Photo</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color="#bdc3c7" />
                  <Text style={styles.imagePlaceholderText}>Open Device Gallery</Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Write your update here..."
            value={description} onChangeText={setDescription} multiline numberOfLines={5}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, postType === 'feed' ? styles.bgFeed : styles.bgNotice]} 
          onPress={handlePublish} disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Publish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  selectorContainer: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  selectorLabel: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#f0f3f4', borderRadius: 10, padding: 4, gap: 4 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
  toggleInactive: { backgroundColor: 'transparent' },
  toggleActiveFeed: { backgroundColor: '#3498db' },
  toggleActiveNotice: { backgroundColor: '#9b59b6' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#7f8c8d' },
  textActiveWhite: { color: 'white' },
  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#34495e', marginBottom: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ecf0f1', padding: 15, borderRadius: 10, fontSize: 16, color: '#2c3e50' },
  textArea: { height: 120, textAlignVertical: 'top' },
  imagePickerButton: { backgroundColor: '#ecf0f1', borderRadius: 12, overflow: 'hidden', height: 200, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bdc3c7', borderStyle: 'dashed' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { color: '#7f8c8d', marginTop: 10, fontWeight: 'bold' },
  imagePreview: { width: '100%', height: '100%' },
  removeImageBtn: { marginTop: 8, alignSelf: 'flex-end' },
  removeImageText: { color: '#e74c3c', fontWeight: 'bold' },
  submitButton: { flexDirection: 'row', padding: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  bgFeed: { backgroundColor: '#3498db' },
  bgNotice: { backgroundColor: '#9b59b6' },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});