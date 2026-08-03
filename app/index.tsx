import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
// We no longer need useRouter or onAuthStateChanged here!
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      // Just tell Firebase to log them in. 
      // The Global Bouncer in _layout.tsx will instantly detect this and teleport them to the Dashboard!
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Login Failed", "Incorrect email or password. Please try again.");
      setIsLoading(false); // Only stop loading if there's an error, otherwise let the screen transition
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandText}>SHISHUVIHAR</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={styles.input} 
            placeholder="admin@shishuvihar.com" 
            value={email} 
            onChangeText={setEmail}
            keyboardType="email-address" 
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>Secure Login</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#3498db', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  welcomeText: { fontSize: 16, color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 1 },
  brandText: { fontSize: 28, fontWeight: '900', color: '#2c3e50', marginTop: 5 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#34495e', marginBottom: 8 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ecf0f1', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 15 },
  loginButton: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});