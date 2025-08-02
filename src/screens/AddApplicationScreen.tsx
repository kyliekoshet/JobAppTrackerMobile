import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobApplicationsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ScrapedJobData {
  job_title?: string;
  company?: string;
  location?: string;
  job_description?: string;
  salary?: string;
  job_board?: string;
  success: boolean;
  error?: string;
}

export default function AddApplicationScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedJobData | null>(null);
  
  // Form fields
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);
  const [dateJobPosted, setDateJobPosted] = useState('');
  const [applicationStatus, setApplicationStatus] = useState('Applied');
  const [interviewStage, setInterviewStage] = useState('None');
  const [notes, setNotes] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [referralRelationship, setReferralRelationship] = useState('');
  const [referralDate, setReferralDate] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  const statusOptions = [
    'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn', 'Pending'
  ];

  const interviewStageOptions = [
    'None', 'Phone Screen', 'Technical Interview', 'Behavioral Interview', 
    'System Design', 'Coding Challenge', 'Onsite', 'Final Round'
  ];

  const handleScrapeJob = async () => {
    if (!jobUrl.trim()) {
      Alert.alert('Error', 'Please enter a job URL');
      return;
    }

    console.log('🔍 Starting scraping for URL:', jobUrl);
    setScraping(true);
    
    try {
      console.log('🔍 Making API call to /job-applications/scrape-job');
      const response = await jobApplicationsApi.enhanceDescription(jobUrl);
      console.log('🔍 API Response received:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const data = response.data;
        console.log('🔍 Scraped data:', JSON.stringify(data, null, 2));
        setScrapedData(data);
        
        // Auto-fill form with scraped data
        if (data.job_title) setJobTitle(data.job_title);
        if (data.company) setCompany(data.company);
        if (data.location) setLocation(data.location);
        if (data.job_description) setJobDescription(data.job_description);
        if (data.salary) setSalary(data.salary);
        
        Alert.alert('Success', 'Job details scraped successfully!');
      } else {
        console.log('🔍 Scraping failed with error:', response.error);
        Alert.alert(
          'Scraping Failed', 
          response.error || 'Could not scrape job details. You can still fill out the form manually.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Try Again', onPress: handleScrapeJob }
          ]
        );
      }
    } catch (error: any) {
      console.error('🔍 Error scraping job:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        timeout: error.code === 'ECONNABORTED'
      });
      
      let errorMessage = 'Failed to scrape job details.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Scraping timed out. The job site might be slow or the URL might not be supported.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Job posting not found. Please check the URL.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. This job site might block scraping.';
      }
      
      Alert.alert(
        'Scraping Failed', 
        errorMessage + ' You can still fill out the form manually.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Try Again', onPress: handleScrapeJob }
        ]
      );
    } finally {
      console.log('🔍 Scraping process completed');
      setScraping(false);
    }
  };

  const handleSubmit = async () => {
    if (!jobTitle.trim() || !company.trim()) {
      Alert.alert('Error', 'Job title and company are required');
      return;
    }

    setLoading(true);
    try {
      const applicationData = {
        job_title: jobTitle,
        company,
        job_description: jobDescription,
        location,
        salary: salary, // Changed from salary_range to salary
        job_url: jobUrl, // Changed from source to job_url
        date_applied: new Date(dateApplied).toISOString(),
        date_job_posted: dateJobPosted ? new Date(dateJobPosted).toISOString() : undefined,
        application_status: applicationStatus as 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Withdrawn' | 'Pending',
        interview_stage: interviewStage as 'None' | 'Phone Screen' | 'Technical Interview' | 'Behavioral Interview' | 'System Design' | 'Coding Challenge' | 'Onsite' | 'Final Round',
        notes: notes + (referralNotes ? `\n\nReferral Notes: ${referralNotes}` : ''),
        referred_by: referredBy || undefined,
        referral_relationship: referralRelationship || undefined,
        referral_date: referralDate ? new Date(referralDate).toISOString() : undefined,
        referral_notes: referralNotes || undefined,
      };

      console.log('🔍 Submitting application data:', applicationData);
      await jobApplicationsApi.create(applicationData);
      Alert.alert('Success', 'Job application added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating application:', error);
      Alert.alert('Error', 'Failed to create job application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setJobUrl('');
    setJobTitle('');
    setCompany('');
    setLocation('');
    setJobDescription('');
    setSalary('');
    setDateApplied(new Date().toISOString().split('T')[0]);
    setDateJobPosted('');
    setApplicationStatus('Applied');
    setInterviewStage('None');
    setNotes('');
    setReferredBy('');
    setReferralRelationship('');
    setReferralDate('');
    setReferralNotes('');
    setScrapedData(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Job Application</Text>
        <TouchableOpacity onPress={clearForm} style={styles.clearButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Job URL and Scraping Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job URL & Scraping</Text>
        <Text style={styles.sectionSubtitle}>
          Enter a job URL to automatically scrape details, or fill out the form manually
        </Text>
        <View style={styles.urlContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="Enter job posting URL"
            value={jobUrl}
            onChangeText={setJobUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity 
            style={[styles.scrapeButton, scraping && styles.scrapeButtonDisabled]}
            onPress={handleScrapeJob}
            disabled={scraping}
          >
            {scraping ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="download" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        {scrapedData && (
          <View style={styles.scrapedInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.scrapedText}>
              Scraped from {scrapedData.job_board || 'job posting'}
            </Text>
          </View>
        )}
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Senior Software Engineer"
          value={jobTitle}
          onChangeText={setJobTitle}
        />

        <Text style={styles.label}>Company *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Google"
          value={company}
          onChangeText={setCompany}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., San Francisco, CA"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Salary</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., $120,000 - $150,000"
          value={salary}
          onChangeText={setSalary}
        />
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Dates</Text>
        
        <Text style={styles.label}>Date Applied *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={dateApplied}
          onChangeText={setDateApplied}
        />

        <Text style={styles.label}>Date Job Posted</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD (optional)"
          value={dateJobPosted}
          onChangeText={setDateJobPosted}
        />
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application Status</Text>
        
        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusChip,
                applicationStatus === status && styles.statusChipSelected
              ]}
              onPress={() => setApplicationStatus(status)}
            >
              <Text style={[
                styles.statusChipText,
                applicationStatus === status && styles.statusChipTextSelected
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Interview Stage</Text>
        <View style={styles.pickerContainer}>
          {interviewStageOptions.map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[
                styles.statusChip,
                interviewStage === stage && styles.statusChipSelected
              ]}
              onPress={() => setInterviewStage(stage)}
            >
              <Text style={[
                styles.statusChipText,
                interviewStage === stage && styles.statusChipTextSelected
              ]}>
                {stage}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Referral Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Referral Information</Text>
        
        <Text style={styles.label}>Referred By</Text>
        <TextInput
          style={styles.input}
          placeholder="Name of person who referred you"
          value={referredBy}
          onChangeText={setReferredBy}
        />

        <Text style={styles.label}>Relationship</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Former colleague, Friend"
          value={referralRelationship}
          onChangeText={setReferralRelationship}
        />

        <Text style={styles.label}>Referral Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD (optional)"
          value={referralDate}
          onChangeText={setReferralDate}
        />

        <Text style={styles.label}>Referral Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional notes about the referral"
          value={referralNotes}
          onChangeText={setReferralNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Job Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Paste or type the job description here..."
          value={jobDescription}
          onChangeText={setJobDescription}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional notes about this application..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Add Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  clearButton: {
    padding: 8,
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urlInput: {
    flex: 1,
    height: 50,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1D1D1F',
  },
  scrapeButton: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrapeButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  scrapedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  scrapedText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1D1D1F',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statusChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusChipText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusChipTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  submitSection: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 