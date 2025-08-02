import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Ionicons name="person-circle" size={80} color="#007AFF" />
        <Text style={styles.userName}>{user?.email || 'Demo User'}</Text>
        <Text style={styles.userId}>User ID: {user?.id?.substring(0, 8)}...</Text>
        <Text style={styles.authStatus}>
          ✅ Authenticated with Supabase
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This is a demo app. In production, you'd have more profile options here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
  },
  userId: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  authStatus: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 12,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 