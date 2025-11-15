/**
 * Focus Modal Component
 * 
 * 2-step modal flow for starting a focus session:
 * Step 1: Select Apps to Block (with checkboxes)
 * Step 2: Set Duration (slider or input)
 * 
 * Validates app limit (7 for free tier, unlimited for pro)
 * Shows paywall when limit is reached for free users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { X, ChevronRight, Check, Shield, Timer, Crown, AlertCircle, Search, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { groupAppsByCategory, InstalledApp, AppCategory, searchApps } from '@/lib/installedApps';
import { useInstalledApps } from '@/hooks/useInstalledApps';
import { usePaywall } from '@/hooks/usePaywall';
import { useProStatus } from '@/hooks/useProStatus';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

interface FocusModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (selectedApps: string[], durationMinutes: number) => void;
  selectedApps?: string[];
}

export default function FocusModal({ visible, onClose, onComplete, selectedApps: initialSelectedApps = [] }: FocusModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const { apps, loading, hasPermission, requestPermission } = useInstalledApps();
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set(initialSelectedApps));
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { hasPro } = useProStatus();
  const { canBlockApp } = usePaywall();

  const MAX_FREE_APPS = SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedApps(new Set(initialSelectedApps));
      setDurationMinutes(25);
      setSearchQuery('');
      
      // Request permission if needed
      if (!hasPermission) {
        requestPermission();
      }
    }
  }, [visible, hasPermission, requestPermission]);

  useEffect(() => {
    if (apps.length > 0) {
      const filteredApps = searchQuery.trim()
        ? searchApps(apps, searchQuery)
        : apps;
      const grouped = groupAppsByCategory(filteredApps);
      setCategories(grouped);
      
      if (grouped.length > 0 && expandedCategories.size === 0) {
        setExpandedCategories(new Set([grouped[0].id]));
      } else if (searchQuery.trim()) {
        setExpandedCategories(new Set(grouped.map(cat => cat.id)));
      }
    }
  }, [apps, searchQuery]);

  const toggleAppSelection = (appName: string) => {
    if (!canBlockApp(selectedApps.size)) {
      // Paywall will be shown by usePaywall hook
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newSelected = new Set(selectedApps);
    if (newSelected.has(appName)) {
      newSelected.delete(appName);
    } else {
      // Check limit for free users
      if (!hasPro && newSelected.size >= MAX_FREE_APPS) {
        Alert.alert(
          'App Limit Reached',
          `Free plan allows blocking up to ${MAX_FREE_APPS} apps. Upgrade to Premium for unlimited blocking.`,
          [
            { text: 'OK', style: 'default' },
            { text: 'Upgrade', style: 'default', onPress: () => {/* Show paywall */} },
          ]
        );
        return;
      }
      newSelected.add(appName);
    }
    setSelectedApps(newSelected);
  };

  const toggleCategory = (categoryId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedApps.size === 0) {
        Alert.alert('Select Apps', 'Please select at least one app to block.');
        return;
      }
      setStep(2);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (durationMinutes < 1 || durationMinutes > 480) {
      Alert.alert('Invalid Duration', 'Please enter a duration between 1 and 480 minutes.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onComplete(Array.from(selectedApps), durationMinutes);
  };

  const quickDurations = [5, 10, 15, 25, 30, 45, 60, 90, 120];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {step === 2 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(1)}
                >
                  <ChevronRight
                    color="#9BA8BA"
                    size={20}
                    strokeWidth={2}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>
                {step === 1 ? 'Select Apps to Block' : 'Set Duration'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#9BA8BA" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading apps...</Text>
            </View>
          ) : step === 1 ? (
            /* Step 1: Select Apps */
            <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
              <View style={styles.stepHeader}>
                <Shield color="#8E89FB" size={32} strokeWidth={1.5} />
                <Text style={styles.stepDescription}>
                  Choose which apps to block during your focus session
                </Text>
                {!hasPro && (
                  <View style={styles.limitBadge}>
                    <AlertCircle color="#FECF5E" size={16} strokeWidth={2} />
                    <Text style={styles.limitText}>
                      {selectedApps.size} / {MAX_FREE_APPS} apps (Free)
                    </Text>
                  </View>
                )}
                {Platform.OS === 'ios' && !hasPermission && (
                  <View style={styles.iOSWarning}>
                    <AlertTriangle color="#FECF5E" size={16} strokeWidth={2} />
                    <Text style={styles.iOSWarningText}>
                      App blocking is limited on iOS. You can still use focus timers and offscreen activities.
                    </Text>
                  </View>
                )}
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Search color="#6B7A8F" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search apps..."
                  placeholderTextColor="#6B7A8F"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X color="#6B7A8F" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              {categories.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>({category.apps.length})</Text>
                    <View style={styles.categorySpacer} />
                    <ChevronRight
                      color="#6B7A8F"
                      size={20}
                      strokeWidth={2}
                      style={{
                        transform: [{ rotate: expandedCategories.has(category.id) ? '90deg' : '0deg' }],
                      }}
                    />
                  </TouchableOpacity>

                  {expandedCategories.has(category.id) && (
                    <View style={styles.appsList}>
                      {category.apps.map((app) => {
                        const isSelected = selectedApps.has(app.appName);
                        const isAtLimit = !hasPro && selectedApps.size >= MAX_FREE_APPS && !isSelected;
                        
                        return (
                          <TouchableOpacity
                            key={app.packageName}
                            style={[
                              styles.appItem,
                              isSelected && styles.appItemSelected,
                              isAtLimit && styles.appItemDisabled,
                            ]}
                            onPress={() => toggleAppSelection(app.appName)}
                            disabled={isAtLimit}
                          >
                            <View style={styles.appIcon}>
                              <Shield color={isSelected ? '#8E89FB' : '#6B7A8F'} size={20} strokeWidth={2} />
                            </View>
                            <Text style={[styles.appName, isSelected && styles.appNameSelected]}>
                              {app.appName}
                            </Text>
                            {isSelected && (
                              <Check color="#8E89FB" size={20} strokeWidth={3} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}

              {selectedApps.size > 0 && (
                <View style={styles.selectedSummary}>
                  <Text style={styles.selectedSummaryText}>
                    {selectedApps.size} app{selectedApps.size !== 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : (
            /* Step 2: Set Duration */
            <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
              <View style={styles.stepHeader}>
                <Timer color="#8E89FB" size={32} strokeWidth={1.5} />
                <Text style={styles.stepDescription}>
                  How long do you want to focus?
                </Text>
              </View>

              <View style={styles.durationInputContainer}>
                <TextInput
                  style={styles.durationInput}
                  value={durationMinutes.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    if (value >= 1 && value <= 480) {
                      setDurationMinutes(value);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="25"
                  placeholderTextColor="#6B7A8F"
                />
                <Text style={styles.durationLabel}>minutes</Text>
              </View>

              <View style={styles.quickDurations}>
                <Text style={styles.quickDurationsLabel}>Quick Select:</Text>
                <View style={styles.quickDurationsGrid}>
                  {quickDurations.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.quickDurationButton,
                        durationMinutes === mins && styles.quickDurationButtonActive,
                      ]}
                      onPress={() => {
                        setDurationMinutes(mins);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.quickDurationText,
                          durationMinutes === mins && styles.quickDurationTextActive,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#8E89FB', '#4ED4C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {step === 1 ? 'Next' : 'Start Focus Session'}
                </Text>
                <ChevronRight color="#FFFFFF" size={20} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161C26',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(142, 137, 251, 0.2)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8E89FB',
    borderRadius: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  stepDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
  },
  limitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(254, 207, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(254, 207, 94, 0.3)',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FECF5E',
  },
  iOSWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(254, 207, 94, 0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(254, 207, 94, 0.3)',
    marginTop: 8,
  },
  iOSWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#FECF5E',
    lineHeight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7A8F',
    marginLeft: 8,
  },
  categorySpacer: {
    flex: 1,
  },
  appsList: {
    marginTop: 8,
    gap: 8,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(142, 137, 251, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.1)',
  },
  appItemSelected: {
    backgroundColor: 'rgba(142, 137, 251, 0.15)',
    borderColor: 'rgba(142, 137, 251, 0.3)',
  },
  appItemDisabled: {
    opacity: 0.5,
  },
  appIcon: {
    marginRight: 12,
  },
  appName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  appNameSelected: {
    color: '#8E89FB',
  },
  selectedSummary: {
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  selectedSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E89FB',
    textAlign: 'center',
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  durationInput: {
    width: 120,
    height: 80,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8E89FB',
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 16,
  },
  durationLabel: {
    fontSize: 20,
    color: '#9BA8BA',
    fontWeight: '600',
  },
  quickDurations: {
    marginBottom: 32,
  },
  quickDurationsLabel: {
    fontSize: 14,
    color: '#6B7A8F',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickDurationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickDurationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  quickDurationButtonActive: {
    backgroundColor: '#8E89FB',
    borderColor: '#8E89FB',
  },
  quickDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  quickDurationTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 137, 251, 0.2)',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButton: {
    height: 56,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

