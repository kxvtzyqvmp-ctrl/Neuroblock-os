/**
 * Help Center Screen
 * 
 * Displays FAQs and support contact information:
 * - Common questions and answers
 * - Contact Support button (opens email)
 * - Privacy Policy link
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I start a Focus Session?',
    answer: 'Tap the circular "Tap to Focus" button on the Home screen. Select your desired duration (15m, 30m, 1h, 2h, or custom up to 8 hours), then tap the button again to start. Your session will begin immediately, and you can manage which apps are blocked from the same screen.',
  },
  {
    question: 'Why can\'t I see all my apps?',
    answer: 'Due to iOS system restrictions, we cannot access the full list of installed apps. On Android, you\'ll see all apps, but on iOS, we use a curated list of common distraction apps. You can manually add apps to your block list in Settings or from the "Manage Blocked Apps" button on the Home screen.',
  },
  {
    question: 'How do I customize Focus duration?',
    answer: 'On the Home screen, below the Focus button, you\'ll see duration presets (15m, 30m, 1h, 2h, 8h) or a "Custom" option. Tap "Custom" to set any duration between 5 minutes and 8 hours. Your selection is saved automatically for future sessions.',
  },
  {
    question: 'How do I manage notifications or Quiet Hours?',
    answer: 'Go to Settings → Notifications. Here you can toggle different notification types (Focus Reminders, Motivation Boosts, AI Nudges, etc.) and set up Quiet Hours to mute notifications during specific times (e.g., 10 PM to 7 AM). All preferences are saved automatically.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleContactSupport = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL('mailto:contact@neuroblockos.com?subject=NeuroBlock%20OS%20Support');
  };

  const handlePrivacyPolicy = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL('https://www.neuroblockos.live/privacy-policy');
  };

  const toggleFAQ = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#FFFFFF" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <HelpCircle color="#7C9DD9" size={32} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>Help Center</Text>
        </View>

        {/* FAQs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {FAQ_DATA.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => toggleFAQ(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    {isExpanded ? (
                      <ChevronUp color="#7C9DD9" size={20} strokeWidth={2} />
                    ) : (
                      <ChevronDown color="#6B7A8F" size={20} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <Mail color="#7C9DD9" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.contactButtonText}>Contact Support</Text>
            <ExternalLink color="#6B7A8F" size={16} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.contactSubtext}>
            Email us at contact@neuroblockos.com
          </Text>
        </View>

        {/* Privacy Policy Link */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.privacyButton}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.privacyIconContainer}>
              <Shield color="#8E89FB" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.privacyButtonText}>Privacy Policy</Text>
            <ExternalLink color="#6B7A8F" size={16} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A8F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  faqContainer: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: 'rgba(142, 137, 251, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.1)',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 137, 251, 0.1)',
  },
  faqAnswerText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B0B8C8',
    lineHeight: 20,
    paddingTop: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.2)',
    gap: 16,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 157, 217, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactSubtext: {
    fontSize: 12,
    color: '#6B7A8F',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(142, 137, 251, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.1)',
    gap: 16,
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(142, 137, 251, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});



