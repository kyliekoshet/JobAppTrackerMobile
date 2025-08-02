import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp 
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);

      if (error) {
        Alert.alert(
          isSignUp ? 'Sign Up Failed' : 'Sign In Failed', 
          error.message || 'Please try again'
        );
      } else if (isSignUp) {
        Alert.alert(
          'Success!', 
          'Account created! Please check your email to verify your account, then sign in.'
        );
        setIsSignUp(false);
      }
    } catch (error) {
      console.error('Auth failed:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@jobtracker.com');
    setPassword('demo123');
    // Auto-login with demo credentials
    setTimeout(() => {
      handleAuth();
    }, 100);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <Ionicons name="briefcase" size={80} color="#007AFF" />
          <Text style={styles.appTitle}>Job Tracker</Text>
          <Text style={styles.appSubtitle}>Track your job applications</Text>
        </View>

        {/* Auth Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAuth}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#8E8E93" 
              />
            </TouchableOpacity>
          </View>

          {/* Auth Button */}
          <TouchableOpacity 
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.authButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Sign Up/Sign In */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.toggleText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>

          {/* Demo Access */}
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Quick Demo Access:</Text>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={handleDemoLogin}
            >
              <Text style={styles.demoButtonText}>Try Demo Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure authentication powered by Supabase
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
  },
  authButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  authButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  demoContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 