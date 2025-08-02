import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobApplicationsApi, tasksApi } from '../services/api';
import { SummaryStats, TaskSummary, Task } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [statsData, taskSummaryData, allTasks] = await Promise.all([
        jobApplicationsApi.getStats(),
        tasksApi.getSummary(),
        tasksApi.getAll(),
      ]);

      setStats(statsData);
      setTaskSummary(taskSummaryData);

      // Filter tasks for today
      const today = new Date().toISOString().split('T')[0];
      const todayTasksFiltered = allTasks
        .filter(task => {
          const isToday = task.due_date === today;
          const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed';
          const isCreatedToday = !task.due_date && task.created_at.split('T')[0] === today;
          return isToday || isOverdue || isCreatedToday;
        })
        .sort((a, b) => {
          // Sort by completion status, then priority, then due date
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
          
          return aPriority - bPriority;
        })
        .slice(0, 5); // Show top 5 tasks

      setTodayTasks(todayTasksFiltered);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleTaskToggle = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await tasksApi.update(task.id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });
      
      // Refresh data
      loadDashboardData();
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const handleAddApplication = () => {
    navigation.navigate('AddApplication');
  };

  const handleAddTask = () => {
    navigation.navigate('AddTask');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Job Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="briefcase" size={20} color="#007AFF" />
              </View>
              <Text style={styles.statNumber}>{stats?.total_applications || 0}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={20} color="#FF9500" />
              </View>
              <Text style={styles.statNumber}>{stats?.interviews_scheduled || 0}</Text>
              <Text style={styles.statLabel}>Interviews</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              </View>
              <Text style={styles.statNumber}>{taskSummary?.completed_tasks || 0}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={20} color="#5856D6" />
              </View>
              <Text style={styles.statNumber}>{stats?.response_rate?.toFixed(1) || 0}%</Text>
              <Text style={styles.statLabel}>Response Rate</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAddApplication}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </View>
              <Text style={styles.actionButtonText}>Add Application</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAddTask}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="create" size={24} color="#FF9500" />
              </View>
              <Text style={styles.actionButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddTask')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {todayTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {todayTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    task.status === 'completed' && styles.taskItemCompleted
                  ]}
                  onPress={() => handleTaskToggle(task)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <View style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(task.priority) }
                      ]} />
                      <Text style={[
                        styles.taskTitle,
                        task.status === 'completed' && styles.taskTitleCompleted
                      ]}>
                        {task.status === 'completed' ? '✅ ' : ''}{task.title}
                      </Text>
                    </View>
                    {task.due_date && (
                      <Text style={[
                        styles.taskDueDate,
                        task.due_date < new Date().toISOString().split('T')[0] && 
                        task.status !== 'completed' && styles.taskOverdue
                      ]}>
                        {task.due_date < new Date().toISOString().split('T')[0] && 
                         task.status !== 'completed' ? '⚠️ Overdue: ' : 'Due: '}
                        {new Date(task.due_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.taskCheckbox}>
                    <Ionicons 
                      name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={24} 
                      color={task.status === 'completed' ? '#34C759' : '#8E8E93'} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done" size={48} color="#8E8E93" />
              <Text style={styles.emptyStateText}>No tasks for today</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleAddTask}
              >
                <Text style={styles.emptyStateButtonText}>Add Your First Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    minHeight: 80,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '600',
    textAlign: 'center',
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    minHeight: 60,
  },
  taskItemCompleted: {
    backgroundColor: '#E8F5E8',
    opacity: 0.8,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 16,
  },
  taskOverdue: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  taskCheckbox: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
}); 