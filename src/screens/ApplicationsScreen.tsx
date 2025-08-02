import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobApplicationsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface JobApplication {
  id: number;
  company: string;
  position: string;
  status: string;
  location?: string;
  salary?: string;
  created_at: string;
  application_date?: string;
}

export default function ApplicationsScreen({ navigation }: any) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadApplications = async () => {
    try {
      const response = await jobApplicationsApi.getAll();
      // Handle both array response and object with applications property
      const apps = Array.isArray(response) ? response : ((response as any).applications || []);
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load job applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied': return '#007AFF';
      case 'interview': return '#FF9500';
      case 'offer': return '#4CAF50';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied': return 'paper-plane';
      case 'interview': return 'people';
      case 'offer': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'document';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderApplication = ({ item }: { item: JobApplication }) => (
    <TouchableOpacity style={styles.applicationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.position}>{item.position}</Text>
          {item.location && (
            <Text style={styles.location}>
              <Ionicons name="location-outline" size={12} color="#8E8E93" />
              {' '}{item.location}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={12} 
            color="white" 
          />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          Applied: {formatDate(item.application_date || item.created_at)}
        </Text>
        {item.salary && (
          <Text style={styles.salary}>{item.salary}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="briefcase-outline" size={80} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Applications Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your job applications by adding your first one!
      </Text>
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Application</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <Text style={styles.subtitle}>
          {applications.length} {applications.length === 1 ? 'application' : 'applications'}
        </Text>
      </View>

      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddApplication')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  applicationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flex: 1,
    marginRight: 12,
  },
  company: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  position: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  salary: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
}); 