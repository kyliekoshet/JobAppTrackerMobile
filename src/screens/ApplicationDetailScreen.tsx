import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobApplicationsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FollowUp {
  id: number;
  follow_up_type: string;
  title: string;
  description?: string;
  date: string;
  status: string;
  outcome?: string;
  notes?: string;
  created_at: string;
}

interface JobApplication {
  id: number;
  job_title: string;
  company: string;
  location?: string;
  job_description?: string;
  salary?: string;
  job_url?: string;
  date_applied: string;
  date_job_posted?: string;
  application_status: string;
  interview_stage: string;
  notes?: string;
  referred_by?: string;
  referral_relationship?: string;
  referral_date?: string;
  referral_notes?: string;
  created_at: string;
  updated_at: string;
  follow_ups?: FollowUp[];
}

export default function ApplicationDetailScreen({ route, navigation }: any) {
  const { applicationId } = route.params;
  const { user } = useAuth();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    follow_up_type: 'Interview',
    title: '',
    description: '',
    date: new Date().toISOString(),
    status: 'Pending',
    outcome: '',
    notes: '',
  });

  const followUpTypes = [
    'Interview', 'Phone Call', 'Email', 'Follow-up', 'Technical Interview', 
    'Behavioral Interview', 'System Design', 'Coding Challenge', 'Onsite', 
    'Final Round', 'Reference Check', 'Background Check', 'Offer Discussion'
  ];

  const followUpStatuses = ['Pending', 'Completed', 'Cancelled', 'Rescheduled'];

  const loadApplication = async () => {
    try {
      const response = await jobApplicationsApi.getWithFollowUps(applicationId);
      setApplication(response);
    } catch (error) {
      console.error('Error loading application:', error);
      Alert.alert('Error', 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const handleAddFollowUp = async () => {
    if (!newFollowUp.title.trim()) {
      Alert.alert('Error', 'Follow-up title is required');
      return;
    }

    try {
      // Prepare the data, converting empty strings to null for optional fields
      const followUpData = {
        ...newFollowUp,
        description: newFollowUp.description || null,
        outcome: newFollowUp.outcome || null,
        notes: newFollowUp.notes || null,
        date: new Date(newFollowUp.date).toISOString(), // Ensure proper datetime format
      };
      
      console.log('🔍 Sending follow-up data:', JSON.stringify(followUpData, null, 2));
      await jobApplicationsApi.addFollowUp(applicationId, followUpData);
      setShowAddFollowUp(false);
      setNewFollowUp({
        follow_up_type: 'Interview',
        title: '',
        description: '',
        date: new Date().toISOString(),
        status: 'Pending',
        outcome: '',
        notes: '',
      });
      loadApplication(); // Reload to get updated follow-ups
    } catch (error) {
      console.error('Error adding follow-up:', error);
      Alert.alert('Error', 'Failed to add follow-up');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied': return '#007AFF';
      case 'interviewing': return '#FF9500';
      case 'offer': return '#4CAF50';
      case 'rejected': return '#FF3B30';
      case 'withdrawn': return '#8E8E93';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getFollowUpTypeLabel = (type: string) => {
    return type; // The types are now already in the correct format
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading application...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Application not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Details</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Company</Text>
            <Text style={styles.value}>{application.company}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.value}>{application.job_title}</Text>
          </View>
          
          {application.location && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{application.location}</Text>
            </View>
          )}
          
          {application.salary && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Salary</Text>
              <Text style={styles.value}>{application.salary}</Text>
            </View>
          )}
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.application_status) }]}>
              <Text style={styles.statusText}>{application.application_status}</Text>
            </View>
            <Text style={styles.interviewStage}>{application.interview_stage}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Applied</Text>
            <Text style={styles.value}>{formatDate(application.date_applied)}</Text>
          </View>
          
          {application.date_job_posted && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Job Posted</Text>
              <Text style={styles.value}>{formatDate(application.date_job_posted)}</Text>
            </View>
          )}
        </View>

        {/* Referral Info */}
        {application.referred_by && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Referral Information</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Referred By</Text>
              <Text style={styles.value}>{application.referred_by}</Text>
            </View>
            
            {application.referral_relationship && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Relationship</Text>
                <Text style={styles.value}>{application.referral_relationship}</Text>
              </View>
            )}
            
            {application.referral_date && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Referral Date</Text>
                <Text style={styles.value}>{formatDate(application.referral_date)}</Text>
              </View>
            )}
            
            {application.referral_notes && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Referral Notes</Text>
                <Text style={styles.value}>{application.referral_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Follow-ups Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Follow-ups</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddFollowUp(true)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {application.follow_ups && application.follow_ups.length > 0 ? (
            application.follow_ups.map((followUp) => (
              <View key={followUp.id} style={styles.followUpItem}>
                <View style={styles.followUpHeader}>
                  <Text style={styles.followUpTitle}>{followUp.title}</Text>
                  <View style={[styles.followUpStatus, { backgroundColor: getStatusColor(followUp.status) }]}>
                    <Text style={styles.followUpStatusText}>{followUp.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.followUpType}>
                  {getFollowUpTypeLabel(followUp.follow_up_type)} • {formatDate(followUp.date)}
                </Text>
                
                {followUp.description && (
                  <Text style={styles.followUpDescription}>{followUp.description}</Text>
                )}
                
                {followUp.outcome && (
                  <Text style={styles.followUpOutcome}>Outcome: {followUp.outcome}</Text>
                )}
                
                {followUp.notes && (
                  <Text style={styles.followUpNotes}>{followUp.notes}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyFollowUps}>
              <Ionicons name="chatbubble-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyFollowUpsText}>No follow-ups yet</Text>
              <Text style={styles.emptyFollowUpsSubtext}>Add your first follow-up to track interactions</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {application.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{application.notes}</Text>
          </View>
        )}

        {/* Job Description */}
        {application.job_description && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Job Description</Text>
            </View>
            <Text style={styles.jobDescriptionText}>{application.job_description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Follow-up Modal */}
      <Modal
        visible={showAddFollowUp}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFollowUp(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Follow-up</Text>
            <TouchableOpacity onPress={handleAddFollowUp}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newFollowUp.title}
                onChangeText={(text) => setNewFollowUp({ ...newFollowUp, title: text })}
                placeholder="e.g., Phone interview with hiring manager"
                placeholderTextColor="#8E8E93"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                {followUpTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      newFollowUp.follow_up_type === type && styles.typeButtonActive
                    ]}
                    onPress={() => setNewFollowUp({ ...newFollowUp, follow_up_type: type })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newFollowUp.follow_up_type === type && styles.typeButtonTextActive
                    ]}>
                      {getFollowUpTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={newFollowUp.date ? new Date(newFollowUp.date).toISOString().split('T')[0] : ''}
                onChangeText={(text) => {
                  // Convert YYYY-MM-DD to ISO datetime
                  const date = new Date(text + 'T00:00:00.000Z');
                  setNewFollowUp({ ...newFollowUp, date: date.toISOString() });
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8E8E93"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {followUpStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      newFollowUp.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => setNewFollowUp({ ...newFollowUp, status })}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      newFollowUp.status === status && styles.statusButtonTextActive
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newFollowUp.description}
                onChangeText={(text) => setNewFollowUp({ ...newFollowUp, description: text })}
                placeholder="Describe the follow-up interaction..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Outcome</Text>
              <TextInput
                style={styles.textInput}
                value={newFollowUp.outcome}
                onChangeText={(text) => setNewFollowUp({ ...newFollowUp, outcome: text })}
                placeholder="e.g., Moved to next round"
                placeholderTextColor="#8E8E93"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newFollowUp.notes}
                onChangeText={(text) => setNewFollowUp({ ...newFollowUp, notes: text })}
                placeholder="Additional notes..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  addButton: {
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#1D1D1F',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  interviewStage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  followUpItem: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
    marginBottom: 16,
  },
  followUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  followUpStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followUpStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  followUpType: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  followUpDescription: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 8,
    lineHeight: 20,
  },
  followUpOutcome: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  followUpNotes: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  emptyFollowUps: {
    alignItems: 'center',
    padding: 40,
  },
  emptyFollowUpsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFollowUpsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  notesText: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20,
  },
  jobDescriptionText: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1D1D1F',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statusButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
}); 