import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars'; // Beautiful grid component
import { PALETTE, SHADOWS } from '../../theme/designSystem';

interface SchoolEvent {
  id: string;
  title: string;
  date: string; // Expected format: YYYY-MM-DD
  type: 'Holiday' | 'Event' | 'Exam';
}

export default function PremiumCalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const q = query(collection(db, 'school-events'), orderBy('date', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: SchoolEvent[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() } as SchoolEvent);
      });
      setEvents(fetchedEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🎨 Map database events into dot markers on the monthly grid
  const markedDates: Record<string, any> = {};
  
  // Highlighting the selected target day with our theme's Secondary color (Lavender)
  markedDates[selectedDate] = { selected: true, selectedColor: PALETTE.secondary };
  
  events.forEach(event => {
    const isSelected = event.date === selectedDate;
    // Color dots based on event types
    let dotColor = PALETTE.accent; // Default green
    if (event.type === 'Holiday') dotColor = PALETTE.warning; // Peach
    if (event.type === 'Exam') dotColor = PALETTE.primary; // Sky Blue

    markedDates[event.date] = {
      ...markedDates[event.date],
      marked: true,
      dotColor: isSelected ? '#FFFFFF' : dotColor
    };
  });

  // Filter the agenda tracking timeline down to the active date selected
  const agendaForSelectedDay = events.filter(e => e.date === selectedDate);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PALETTE.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Calendar</Text>
      </View>

      {/* Modern Grid Calendar Component */}
      <View style={[styles.calendarWrapper, SHADOWS.soft]}>
        <Calendar
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: PALETTE.textMuted,
            selectedDayBackgroundColor: PALETTE.secondary,
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: PALETTE.primary,
            dayTextColor: PALETTE.text,
            textDisabledColor: '#D1D9E2',
            dotColor: PALETTE.accent,
            selectedDotColor: '#FFFFFF',
            arrowColor: PALETTE.primary,
            disabledArrowColor: '#D1D9E2',
            monthTextColor: PALETTE.text,
            indicatorColor: PALETTE.primary,
            textDayFontWeight: '500',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 15,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13,
          }}
          style={styles.calendarComponent}
        />
      </View>

      {/* Selected Day Agenda Header & Timeline */}
      <View style={styles.agendaContainer}>
        <Text style={styles.agendaTitle}>
          Agenda for {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>

        {agendaForSelectedDay.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={38} color={PALETTE.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No special schedules mapped out today!</Text>
          </View>
        ) : (
          <FlatList
            data={agendaForSelectedDay}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.eventCard, SHADOWS.soft]}>
                <View style={[
                  styles.typeIndicator, 
                  { backgroundColor: item.type === 'Holiday' ? PALETTE.warning : item.type === 'Exam' ? PALETTE.primary : PALETTE.accent }
                ]} />
                <View style={styles.eventDetails}>
                  <Text style={styles.eventCardTitle}>{item.title}</Text>
                  <Text style={styles.eventCardType}>{item.type}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 60, backgroundColor: PALETTE.card, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: PALETTE.text },
  calendarWrapper: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 15, borderRadius: 24, overflow: 'hidden' },
  calendarComponent: { paddingBottom: 10 },
  agendaContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  agendaTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.text, marginBottom: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.7, marginTop: 20 },
  emptyText: { color: PALETTE.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  eventCard: { flexDirection: 'row', backgroundColor: PALETTE.card, padding: 16, borderRadius: 20, alignItems: 'center', marginBottom: 12 },
  typeIndicator: { width: 6, height: 36, borderRadius: 3, marginRight: 16 },
  eventDetails: { flex: 1 },
  eventCardTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.text },
  eventCardType: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2, fontWeight: '600' },
});