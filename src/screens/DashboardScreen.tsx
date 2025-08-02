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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobApplicationsApi, tasksApi } from '../services/api';
import { SummaryStats, TaskSummary, Task } from '../types';

export default function DashboardScreen() {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="briefcase" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{stats?.total_applications || 0}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{stats?.interviews_scheduled || 0}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{taskSummary?.completed_tasks || 0}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#5856D6" />
            <Text style={styles.statNumber}>{stats?.response_rate?.toFixed(1) || 0}%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
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
                <Ionicons 
                  name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={task.status === 'completed' ? '#34C759' : '#8E8E93'} 
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>No tasks for today</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Add Application</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create" size={24} color="#FF9500" />
            <Text style={styles.actionButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
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
    borderRadius: 8,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
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
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginTop: 8,
    fontWeight: '500',
  },
}); 