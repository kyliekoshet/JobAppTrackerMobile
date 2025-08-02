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
  SafeAreaView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { tasksApi } from '../services/api';
import { Task, TaskCreate } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTask, setNewTask] = useState<TaskCreate>({
    title: '',
    description: '',
    task_type: 'custom',
    priority: 'medium',
    due_date: '',
    due_time: '',
    estimated_duration: undefined,
    target_count: undefined,
  });

  const loadTasks = async () => {
    try {
      const allTasks = await tasksApi.getAll();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleTaskToggle = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await tasksApi.update(task.id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });
      
      // Refresh tasks
      loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    try {
      // Prepare task data with proper types
      const taskData = {
        ...newTask,
        // Convert empty strings to undefined for optional fields
        description: newTask.description || undefined,
        due_date: newTask.due_date || undefined,
        due_time: newTask.due_time || undefined,
        estimated_duration: newTask.estimated_duration || undefined,
        target_count: newTask.target_count || undefined,
      };

      await tasksApi.create(taskData);
      setShowAddModal(false);
      setNewTask({
        title: '',
        description: '',
        task_type: 'custom',
        priority: 'medium',
        due_date: '',
        due_time: '',
        estimated_duration: undefined,
        target_count: undefined,
      });
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'job_application': return 'Job Application';
      case 'interview_prep': return 'Interview Prep';
      case 'networking': return 'Networking';
      case 'skill_building': return 'Skill Building';
      case 'daily_goal': return 'Daily Goal';
      case 'custom': return 'Custom';
      default: return 'Custom';
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && event.type !== 'dismissed') {
      setNewTask({ ...newTask, due_date: selectedDate.toISOString().split('T')[0] });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime && event.type !== 'dismissed') {
      setNewTask({ ...newTask, due_time: selectedTime.toTimeString().split(' ')[0] });
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      // Apply status filter
      if (filter === 'pending' && task.status === 'completed') return false;
      if (filter === 'completed' && task.status !== 'completed') return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(query) || 
               (task.description && task.description.toLowerCase().includes(query));
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by completion status, then priority, then due date
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      return aPriority - bPriority;
    });

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({tasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending ({tasks.filter(t => t.status !== 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length > 0 ? (
          <View style={styles.tasksList}>
            {filteredTasks.map((task) => (
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
                  
                  {task.description && (
                    <Text style={[
                      styles.taskDescription,
                      task.status === 'completed' && styles.taskDescriptionCompleted
                    ]}>
                      {task.description}
                    </Text>
                  )}
                  
                  <View style={styles.taskFooter}>
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
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(task.priority) + '20' }
                    ]}>
                      <Text style={[
                        styles.priorityText,
                        { color: getPriorityColor(task.priority) }
                      ]}>
                        {getPriorityLabel(task.priority)}
                      </Text>
                    </View>
                  </View>
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
            <Ionicons name="checkmark-done" size={64} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No tasks found' : 'No tasks yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first task to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Add Your First Task</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity onPress={handleAddTask}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                placeholder="Enter task title"
                placeholderTextColor="#8E8E93"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                placeholder="Enter task description"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Type</Text>
              <View style={styles.taskTypeButtons}>
                {['job_application', 'interview_prep', 'networking', 'skill_building', 'daily_goal', 'custom'].map((taskType) => (
                  <TouchableOpacity
                    key={taskType}
                    style={[
                      styles.taskTypeButton,
                      newTask.task_type === taskType && styles.taskTypeButtonActive
                    ]}
                    onPress={() => setNewTask({ ...newTask, task_type: taskType as any })}
                  >
                    <Text style={[
                      styles.taskTypeButtonText,
                      newTask.task_type === taskType && styles.taskTypeButtonTextActive
                    ]}>
                      {getTaskTypeLabel(taskType)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newTask.priority === priority && {
                        backgroundColor: getPriorityColor(priority) + '20',
                        borderColor: getPriorityColor(priority)
                      }
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: priority as any })}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      newTask.priority === priority && { 
                        color: getPriorityColor(priority),
                        fontWeight: '600'
                      }
                    ]}>
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Date</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#8E8E93" />
                  <Text style={styles.dateTimeButtonText}>
                    {newTask.due_date ? new Date(newTask.due_date).toLocaleDateString() : 'Select date'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>
                {newTask.due_date && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setNewTask({ ...newTask, due_date: '' })}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Time (Optional)</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color="#8E8E93" />
                  <Text style={styles.dateTimeButtonText}>
                    {newTask.due_time ? newTask.due_time : 'Select time'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>
                {newTask.due_time && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setNewTask({ ...newTask, due_time: '' })}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={newTask.estimated_duration?.toString() || ''}
                onChangeText={(text) => setNewTask({ 
                  ...newTask, 
                  estimated_duration: text ? parseInt(text) : undefined 
                })}
                placeholder="e.g., 120"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Count (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newTask.target_count?.toString() || ''}
                onChangeText={(text) => setNewTask({ 
                  ...newTask, 
                  target_count: text ? parseInt(text) : undefined 
                })}
                placeholder="e.g., 5 applications"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          {/* Date Picker - Inside Modal */}
          {showDatePicker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={newTask.due_date ? new Date(newTask.due_date) : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          )}

          {/* Time Picker - Inside Modal */}
          {showTimePicker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1D1D1F',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tasksList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  taskItemCompleted: {
    backgroundColor: '#F8F8F8',
    opacity: 0.8,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    color: '#C7C7CC',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  taskOverdue: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskCheckbox: {
    marginLeft: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
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
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#F2F2F7',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  taskTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  taskTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  taskTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  taskTypeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateTimeButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1D1D1F',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    padding: 4,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  pickerCancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  pickerDoneButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
}); 