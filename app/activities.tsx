/**
 * Offscreen Activities Screen
 * 
 * Displays a curated list of meaningful offline activities
 * users can engage in during detox mode.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, ChevronLeft, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import FloatingNav from '@/components/FloatingNav';

interface Activity {
  id: string;
  category: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
}

const ACTIVITIES: Activity[] = [
  {
    id: '1',
    category: 'Journaling',
    title: 'Write in a journal',
    description: 'Express your thoughts, reflect on your day, or practice gratitude. Writing helps process emotions and gain clarity.',
    duration: '10-30 min',
    icon: '📝',
    color: '#8E89FB',
  },
  {
    id: '2',
    category: 'Meditation',
    title: 'Practice mindfulness',
    description: 'Sit quietly and observe your breath. Start with 5 minutes and gradually increase. Apps like Headspace or Calm can guide you.',
    duration: '5-20 min',
    icon: '🧘',
    color: '#4ED4C7',
  },
  {
    id: '3',
    category: 'Physical Activity',
    title: 'Stretching or yoga',
    description: 'Release tension in your body with gentle stretches or a simple yoga routine. Perfect for desk workers.',
    duration: '10-30 min',
    icon: '🤸',
    color: '#5AE38C',
  },
  {
    id: '4',
    category: 'Reading',
    title: 'Read a physical book',
    description: 'Escape into a good book. Fiction, non-fiction, or self-help - choose something that interests you.',
    duration: '20-60 min',
    icon: '📚',
    color: '#FECF5E',
  },
  {
    id: '5',
    category: 'Creativity',
    title: 'Draw or sketch',
    description: 'No artistic talent required! Doodle, sketch, or try your hand at drawing. It\'s relaxing and creative.',
    duration: '15-45 min',
    icon: '🎨',
    color: '#A3A1FF',
  },
  {
    id: '6',
    category: 'Learning',
    title: 'Learn something new',
    description: 'Pick up a new skill like cooking, learning a language basics, or studying an interesting topic offline.',
    duration: '20-60 min',
    icon: '🧠',
    color: '#7C9DD9',
  },
  {
    id: '7',
    category: 'Music',
    title: 'Listen to music mindfully',
    description: 'Put on headphones and really listen. Focus on different instruments, melodies, or lyrics. No multitasking!',
    duration: '15-60 min',
    icon: '🎵',
    color: '#F87171',
  },
  {
    id: '8',
    category: 'Physical Activity',
    title: 'Go for a walk',
    description: 'Fresh air and movement are powerful. Walk around your neighborhood, a park, or just up and down the stairs.',
    duration: '10-30 min',
    icon: '🚶',
    color: '#4ED4C7',
  },
  {
    id: '9',
    category: 'Connection',
    title: 'Call a friend or family member',
    description: 'Have a real conversation. Catch up with someone you haven\'t talked to in a while. Voice calls feel more personal than texts.',
    duration: '15-60 min',
    icon: '📞',
    color: '#5AE38C',
  },
  {
    id: '10',
    category: 'Organization',
    title: 'Organize your space',
    description: 'Declutter your desk, organize a drawer, or tidy up your room. A clean environment promotes a clear mind.',
    duration: '15-45 min',
    icon: '🧹',
    color: '#8E89FB',
  },
  {
    id: '11',
    category: 'Hobbies',
    title: 'Work on a hobby',
    description: 'Knitting, puzzles, model building, or any hands-on activity. Engaging your hands helps calm your mind.',
    duration: '20-60 min',
    icon: '🧩',
    color: '#FECF5E',
  },
  {
    id: '12',
    category: 'Mindfulness',
    title: 'Practice deep breathing',
    description: 'Try the 4-7-8 technique: Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4-8 times.',
    duration: '5-10 min',
    icon: '🌬️',
    color: '#A3A1FF',
  },
  {
    id: '13',
    category: 'Physical Activity',
    title: 'Do a quick workout',
    description: 'Push-ups, sit-ups, squats, or follow a workout routine. Exercise releases endorphins and boosts energy.',
    duration: '10-30 min',
    icon: '💪',
    color: '#F87171',
  },
  {
    id: '14',
    category: 'Creativity',
    title: 'Write poetry or stories',
    description: 'Express yourself through creative writing. Don\'t worry about being perfect - just let your thoughts flow.',
    duration: '15-45 min',
    icon: '✍️',
    color: '#7C9DD9',
  },
  {
    id: '15',
    category: 'Nature',
    title: 'Spend time in nature',
    description: 'If possible, go outside. Sit in a park, garden, or balcony. Nature has a calming, restorative effect.',
    duration: '15-60 min',
    icon: '🌳',
    color: '#4ED4C7',
  },
];

export default function ActivitiesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const categories = Array.from(new Set(ACTIVITIES.map((a) => a.category)));

  const filteredActivities = selectedCategory
    ? ACTIVITIES.filter((a) => a.category === selectedCategory)
    : ACTIVITIES;

  const renderActivity = ({ item }: { item: Activity }) => {
    return (
      <TouchableOpacity
        style={styles.activityCard}
        activeOpacity={0.8}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <LinearGradient
          colors={[`${item.color}20`, `${item.color}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activityCardGradient}
        >
          <View style={styles.activityHeader}>
            <Text style={styles.activityIcon}>{item.icon}</Text>
            <View style={[styles.durationBadge, { backgroundColor: `${item.color}30` }]}>
              <Text style={[styles.durationText, { color: item.color }]}>
                {item.duration}
              </Text>
            </View>
          </View>

          <View style={styles.activityCategory}>
            <Text style={[styles.activityCategoryText, { color: item.color }]}>
              {item.category}
            </Text>
          </View>

          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityDescription}>{item.description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Headphones color="#4ED4C7" size={24} strokeWidth={2} />
            <Text style={styles.headerTitle}>Offscreen Activities</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.introSection}>
          <Activity color="#8E89FB" size={28} strokeWidth={1.5} />
          <Text style={styles.introText}>
            Meaningful activities to do during your detox sessions. No screens required!
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              !selectedCategory && styles.categoryButtonActive,
            ]}
            onPress={() => {
              setSelectedCategory(null);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text
              style={[
                styles.categoryButtonText,
                !selectedCategory && styles.categoryButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => {
                setSelectedCategory(category);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredActivities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      <FloatingNav activeTab="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  introSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  categoryButtonActive: {
    backgroundColor: '#8E89FB',
    borderColor: '#8E89FB',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    gap: 16,
  },
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  activityCardGradient: {
    padding: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    fontSize: 32,
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activityCategory: {
    marginBottom: 8,
  },
  activityCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
});

