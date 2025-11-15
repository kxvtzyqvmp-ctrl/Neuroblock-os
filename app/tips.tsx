/**
 * Digital Reset Tips Screen
 * 
 * Displays useful productivity and digital wellness tips
 * to help users during their detox journey.
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
import { Sparkles, ChevronLeft, Lightbulb, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import FloatingNav from '@/components/FloatingNav';

interface Tip {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
}

const TIPS: Tip[] = [
  {
    id: '1',
    category: 'Quick Breaks',
    title: 'Take a 10-minute walk',
    description: 'Step away from screens and get some fresh air. Walking helps reset your mind and reduces eye strain.',
    icon: '🚶',
  },
  {
    id: '2',
    category: 'Notifications',
    title: 'Turn off notifications',
    description: 'Disable non-essential notifications for an hour. You\'ll be surprised how much calmer you feel.',
    icon: '🔕',
  },
  {
    id: '3',
    category: 'Reading',
    title: 'Read one chapter of a book',
    description: 'Replace scrolling with reading. Start with just one chapter - physical books are best for focus.',
    icon: '📚',
  },
  {
    id: '4',
    category: 'Mindfulness',
    title: 'Practice 5-minute meditation',
    description: 'Sit quietly and focus on your breathing. Even 5 minutes can significantly reduce stress and improve focus.',
    icon: '🧘',
  },
  {
    id: '5',
    category: 'Movement',
    title: 'Do some stretching',
    description: 'Release tension in your body with gentle stretches. Your neck and shoulders will thank you.',
    icon: '🤸',
  },
  {
    id: '6',
    category: 'Connection',
    title: 'Have a face-to-face conversation',
    description: 'Call or meet someone in person instead of texting. Real connection beats digital communication.',
    icon: '💬',
  },
  {
    id: '7',
    category: 'Creativity',
    title: 'Write in a journal',
    description: 'Put pen to paper and write down your thoughts. Journaling helps process emotions and clear your mind.',
    icon: '✍️',
  },
  {
    id: '8',
    category: 'Nature',
    title: 'Spend time in nature',
    description: 'If possible, go outside. Nature has a calming effect and helps reset your mental state.',
    icon: '🌳',
  },
  {
    id: '9',
    category: 'Hydration',
    title: 'Drink a glass of water',
    description: 'Stay hydrated! Dehydration can cause fatigue and make it harder to focus. Keep water nearby.',
    icon: '💧',
  },
  {
    id: '10',
    category: 'Organization',
    title: 'Tidy your physical space',
    description: 'Clean up your desk or room. A organized environment promotes an organized mind.',
    icon: '🧹',
  },
  {
    id: '11',
    category: 'Breathing',
    title: 'Practice deep breathing',
    description: 'Take 10 deep breaths, inhaling for 4 counts and exhaling for 6. This activates your relaxation response.',
    icon: '🌬️',
  },
  {
    id: '12',
    category: 'Sleep',
    title: 'Check your sleep schedule',
    description: 'Quality sleep is essential for digital wellness. Aim for 7-9 hours and avoid screens before bed.',
    icon: '😴',
  },
];

export default function TipsScreen() {
  const router = useRouter();
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTipComplete = (tipId: string) => {
    const newCompleted = new Set(completedTips);
    if (newCompleted.has(tipId)) {
      newCompleted.delete(tipId);
    } else {
      newCompleted.add(tipId);
    }
    setCompletedTips(newCompleted);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderTip = ({ item }: { item: Tip }) => {
    const isCompleted = completedTips.has(item.id);

    return (
      <TouchableOpacity
        style={styles.tipCard}
        onPress={() => handleTipComplete(item.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(142, 137, 251, 0.1)', 'rgba(78, 212, 199, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipCardGradient}
        >
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>{item.icon}</Text>
            {isCompleted && (
              <CheckCircle color="#4ED4C7" size={24} strokeWidth={2} fill="#4ED4C7" />
            )}
          </View>
          
          <View style={styles.tipCategory}>
            <Text style={styles.tipCategoryText}>{item.category}</Text>
          </View>

          <Text style={[styles.tipTitle, isCompleted && styles.tipTitleCompleted]}>
            {item.title}
          </Text>
          <Text style={styles.tipDescription}>{item.description}</Text>
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
            <Sparkles color="#8E89FB" size={24} strokeWidth={2} />
            <Text style={styles.headerTitle}>Digital Reset Tips</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.introSection}>
          <Lightbulb color="#4ED4C7" size={32} strokeWidth={1.5} />
          <Text style={styles.introText}>
            Tap any tip to mark it as complete. Use these ideas during your detox sessions.
          </Text>
        </View>

        <FlatList
          data={TIPS}
          renderItem={renderTip}
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
    marginBottom: 8,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    gap: 16,
  },
  tipCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  tipCardGradient: {
    padding: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 32,
  },
  tipCategory: {
    marginBottom: 8,
  },
  tipCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E89FB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tipTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  tipDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
});

