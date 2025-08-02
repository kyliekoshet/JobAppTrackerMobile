import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calendarEventsApi, tasksApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  event_type: string;
  color?: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  priority: string;
}

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // August 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const { user } = useAuth();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    if (user) {
      console.log('📅 Calendar useEffect triggered:', { 
        currentYear, 
        currentMonth, 
        user: user.email,
        currentDate: currentDate.toISOString()
      });
      loadCalendarData();
    }
  }, [user, currentYear, currentMonth]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const [eventsData, tasksData] = await Promise.all([
        calendarEventsApi.getMonthView(currentYear, currentMonth + 1),
        tasksApi.getAll()
      ]);
      
      // Handle different response formats and ensure we always have arrays
      let eventsArray: CalendarEvent[] = [];
      
      // The API returns a different format - check if it has weeks structure
      if (eventsData?.weeks && Array.isArray(eventsData.weeks)) {
        // Extract events from the weeks structure - each week is an array of days
        eventsArray = eventsData.weeks.flat().filter((day: any) => 
          day && day.events && Array.isArray(day.events)
        ).flatMap((day: any) => day.events);
        
        console.log('📅 Extracted events from weeks:', {
          weeksCount: eventsData.weeks.length,
          extractedEvents: eventsArray.length,
          sampleDay: eventsData.weeks[0]?.[0]
        });
      } else if (Array.isArray(eventsData)) {
        eventsArray = eventsData;
      } else if (eventsData?.events && Array.isArray(eventsData.events)) {
        eventsArray = eventsData.events;
      }
      
      const tasksArray = Array.isArray(tasksData) ? tasksData : [];
      
      console.log('📅 Calendar data loaded:', { 
        eventsCount: eventsArray.length, 
        tasksCount: tasksArray.length,
        eventsData: eventsData,
        tasksData: tasksData
      });
      
      setEvents(eventsArray);
      setTasks(tasksArray);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
      // Set empty arrays on error to prevent crashes
      setEvents([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const getEventsForDate = (date: number) => {
    // Create date string directly without timezone conversion
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    // Safety checks to prevent filter errors
    const dayEvents = (events || []).filter(event => 
      event?.start_datetime?.startsWith(dateString)
    );
    const dayTasks = (tasks || []).filter(task => 
      task?.due_date?.startsWith(dateString)
    );

    // Debug logging for August 2nd
    if (currentMonth === 7 && date === 2) { // August is month 7 (0-indexed)
      console.log('🔍 August 2nd filtering debug:', { 
        dateString,
        totalEvents: events?.length || 0,
        totalTasks: tasks?.length || 0,
        dayEvents: dayEvents.length,
        dayTasks: dayTasks.length,
        sampleEvent: events?.[0],
        sampleTask: tasks?.[0]
      });
    }

    return { events: dayEvents, tasks: dayTasks };
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return { events: [], tasks: [] };
    
    // Create date string directly without timezone conversion
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayEvents = (events || []).filter(event => 
      event?.start_datetime?.startsWith(dateString)
    );
    const dayTasks = (tasks || []).filter(task => 
      task?.due_date?.startsWith(dateString)
    );
    return { events: dayEvents, tasks: dayTasks };
  };

  const getEventColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'interview': return '#FF9500';
      case 'application': return '#007AFF';
      case 'follow_up': return '#4CAF50';
      case 'deadline': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getTaskColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#4CAF50';
      default: return '#8E8E93';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayPress = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    
    const selectedDay = new Date(currentYear, currentMonth, day);
    setSelectedDate(selectedDay);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderCalendarDay = (day: number, isCurrentMonth: boolean = true) => {
    const { events: dayEvents, tasks: dayTasks } = getEventsForDate(day);
    const hasEvents = dayEvents.length > 0;
    const hasTasks = dayTasks.length > 0;
    const isToday = day === new Date().getDate() && 
                   currentMonth === new Date().getMonth() && 
                   currentYear === new Date().getFullYear();
    
    const isSelected = selectedDate && 
                      selectedDate.getDate() === day && 
                      selectedDate.getMonth() === currentMonth && 
                      selectedDate.getFullYear() === currentYear;

    // Debug logging for August 2nd
    if (currentMonth === 7 && day === 2) { // August is month 7 (0-indexed)
      console.log('🔍 August 2nd debug:', { 
        dayEvents: dayEvents.length, 
        dayTasks: dayTasks.length,
        currentMonth,
        currentYear,
        isCurrentMonth
      });
    }

    // Create unique key for each day
    const monthKey = isCurrentMonth ? currentMonth : (isCurrentMonth === false ? currentMonth - 1 : currentMonth + 1);
    const uniqueKey = `${currentYear}-${monthKey}-${day}`;

    return (
      <TouchableOpacity 
        key={uniqueKey}
        style={[
          styles.calendarDay,
          !isCurrentMonth && styles.otherMonthDay,
          isToday && styles.today,
          isSelected && styles.selectedDay
        ]}
        onPress={() => handleDayPress(day, isCurrentMonth)}
        disabled={!isCurrentMonth}
      >
        <Text style={[
          styles.dayNumber,
          !isCurrentMonth && styles.otherMonthText,
          isToday && styles.todayText,
          isSelected && styles.selectedDayText
        ]}>
          {day}
        </Text>
        
        {/* Event indicators */}
        <View style={styles.eventIndicators}>
          {dayEvents.slice(0, 2).map((event, index) => (
            <View 
              key={`event-${event.id}-${index}`}
              style={[
                styles.eventDot,
                { backgroundColor: getEventColor(event.event_type) }
              ]}
            />
          ))}
          {dayTasks.slice(0, 1).map((task, index) => (
            <View 
              key={`task-${task.id}-${index}`}
              style={[
                styles.taskDot,
                { backgroundColor: getTaskColor(task.priority) }
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
    
    const calendarDays = [];
    
    // Add days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      calendarDays.push(renderCalendarDay(day, false));
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(renderCalendarDay(day, true));
    }
    
    // Add days from next month to fill the grid
    const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push(renderCalendarDay(day, false));
    }
    
    return calendarDays;
  };

  const renderSelectedDayEvents = () => {
    if (!selectedDate) {
      return (
        <View style={styles.noSelection}>
          <Ionicons name="calendar-outline" size={40} color="#C7C7CC" />
          <Text style={styles.noSelectionText}>Select a day to view events</Text>
        </View>
      );
    }

    const { events: dayEvents, tasks: dayTasks } = getEventsForSelectedDate();
    const allItems = [
      ...dayEvents.map(event => ({ ...event, type: 'event' as const })),
      ...dayTasks.map(task => ({ ...task, type: 'task' as const }))
    ].sort((a, b) => {
      const aTime = a.type === 'event' ? new Date(a.start_datetime).getTime() : new Date(a.due_date || '').getTime();
      const bTime = b.type === 'event' ? new Date(b.start_datetime).getTime() : new Date(b.due_date || '').getTime();
      return aTime - bTime;
    });

    if (allItems.length === 0) {
      return (
        <View style={styles.emptyDay}>
          <Ionicons name="calendar-outline" size={40} color="#C7C7CC" />
          <Text style={styles.emptyDayText}>No events or tasks for this day</Text>
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={() => setShowEventModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addEventButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.eventsList}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsHeaderText}>
            {allItems.length} item{allItems.length !== 1 ? 's' : ''} on {formatSelectedDate()}
          </Text>
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={() => setShowEventModal(true)}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addEventButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {allItems.map((item, index) => (
          <View key={`${item.type}-${item.id}`} style={styles.eventItem}>
            <View style={[
              styles.eventColor,
              { backgroundColor: item.type === 'event' ? getEventColor(item.event_type) : getTaskColor(item.priority) }
            ]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventSubtitle}>
                {item.type === 'event' ? 'Event' : `Task (${item.priority})`}
              </Text>
              <Text style={styles.eventTime}>
                {item.type === 'event' 
                  ? new Date(item.start_datetime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : `Due: ${new Date(item.due_date || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}`
                }
              </Text>
            </View>
            <Ionicons 
              name={item.type === 'event' ? 'calendar' : 'checkmark-circle'} 
              size={20} 
              color="#C7C7CC" 
            />
          </View>
        ))}
      </View>
    );
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    
    try {
      const eventData = {
        title: newEventTitle,
        start_datetime: selectedDate.toISOString(),
        end_datetime: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
        event_type: 'custom' as const
      };
      
      await calendarEventsApi.create(eventData);
      setNewEventTitle('');
      setShowEventModal(false);
      loadCalendarData(); // Refresh data
      Alert.alert('Success', 'Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'Failed to add event');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <View style={styles.monthNavigator}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {getMonthName(currentMonth)} {currentYear}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar days */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
              <Text style={styles.legendText}>Applications</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Interviews</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Follow-ups</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Events */}
        <View style={styles.selectedDaySection}>
          {renderSelectedDayEvents()}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.eventInput}
              placeholder="Event title"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addButton, !newEventTitle.trim() && styles.addButtonDisabled]}
                onPress={handleAddEvent}
                disabled={!newEventTitle.trim()}
              >
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  calendarContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    padding: 4,
    justifyContent: 'space-between',
  },
  otherMonthDay: {
    backgroundColor: '#F8F8F8',
  },
  today: {
    backgroundColor: '#E3F2FD',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  otherMonthText: {
    color: '#C7C7CC',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  eventIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'white',
  },
  legend: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  selectedDaySection: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noSelection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    alignSelf: 'center',
  },
  addEventButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventsList: {
    marginTop: 16,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  eventColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  eventInput: {
    width: '100%',
    height: 50,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1D1D1F',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '40%',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '40%',
  },
  addButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
}); 