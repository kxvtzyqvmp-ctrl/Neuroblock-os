import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Plus, X, Shield, Check, Search as SearchIcon, ChevronRight, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { usePaywall } from '@/hooks/usePaywall';
import PaywallModal from '@/components/subscription/PaywallModal';

interface AppGroup {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  apps: BlockedApp[];
  schedules: AppSchedule[];
  created_at: string;
  updated_at: string;
}

interface BlockedApp {
  id: string;
  group_id: string;
  app_name: string;
  category: string;
  is_blocked: boolean;
  created_at: string;
}

interface AppSchedule {
  id: string;
  group_id: string;
  day_of_week: string;
  is_active: boolean;
}

interface AppCategory {
  id: string;
  name: string;
  icon: string;
  apps: string[];
}

const APP_CATEGORIES: AppCategory[] = [
  { id: 'social', name: 'Social', icon: '💗', apps: ['Instagram', 'TikTok', 'Twitter', 'Facebook', 'Snapchat', 'WhatsApp'] },
  { id: 'games', name: 'Games', icon: '🚀', apps: ['Candy Crush', 'PUBG', 'Fortnite', 'Minecraft', 'Roblox'] },
  { id: 'entertainment', name: 'Entertainment', icon: '🍿', apps: ['YouTube', 'Netflix', 'Twitch', 'Disney+', 'Hulu', 'Spotify'] },
  { id: 'creativity', name: 'Creativity', icon: '🎨', apps: ['Photoshop', 'Figma', 'Canva', 'Procreate'] },
  { id: 'education', name: 'Education', icon: '🌍', apps: ['Duolingo', 'Khan Academy', 'Coursera', 'Udemy'] },
  { id: 'fitness', name: 'Health & Fitness', icon: '🚴', apps: ['Strava', 'MyFitnessPal', 'Peloton', 'Nike Run'] },
  { id: 'reading', name: 'Information & Reading', icon: '📖', apps: ['Reddit', 'Medium', 'Pocket', 'Kindle'] },
  { id: 'productivity', name: 'Productivity & Finance', icon: '📨', apps: ['Gmail', 'Slack', 'Notion', 'Microsoft Teams'] },
  { id: 'shopping', name: 'Shopping & Food', icon: '🛍', apps: ['Amazon', 'Uber Eats', 'DoorDash', 'eBay'] },
  { id: 'travel', name: 'Travel', icon: '🏝', apps: ['Airbnb', 'Booking.com', 'Uber', 'Maps'] },
  { id: 'utilities', name: 'Utilities', icon: '🧮', apps: ['Calculator', 'Calendar', 'Notes', 'Weather'] },
];

export default function BlockedAppsManager() {
  const { colors } = useTheme();
  const { canBlockApp, showPaywall, paywallConfig, closePaywall } = usePaywall();
  const [appGroups, setAppGroups] = useState<AppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAllAppsModal, setShowAllAppsModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Array<{ name: string; category: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeUser();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadAppGroups(user.id);
    } else {
      setLoading(false);
    }
  };

  const loadAppGroups = async (uid: string) => {
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('blocked_app_groups')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id);

        const { data: apps, error: appsError } = await supabase
          .from('blocked_apps')
          .select('*')
          .in('group_id', groupIds);

        if (appsError) throw appsError;

        const { data: schedules, error: schedulesError } = await supabase
          .from('blocked_app_schedules')
          .select('*')
          .in('group_id', groupIds);

        if (schedulesError) throw schedulesError;

        const enrichedGroups = groups.map(group => ({
          ...group,
          apps: apps?.filter(app => app.group_id === group.id) || [],
          schedules: schedules?.filter(schedule => schedule.group_id === group.id) || [],
        }));

        setAppGroups(enrichedGroups);
      }
    } catch (error) {
      console.error('Failed to load app groups:', error);
      Alert.alert('Error', 'Failed to load blocked apps');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppGroup = () => {
    setSelectedApps([]);
    setShowModal(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleShowAllApps = () => {
    setShowAllAppsModal(true);
  };

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowModal(false));
  };

  const toggleAppSelection = (appName: string, category: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedApps(prev => {
      const exists = prev.find(app => app.name === appName && app.category === category);
      if (exists) {
        return prev.filter(app => !(app.name === appName && app.category === category));
      } else {
        const currentBlockedCount = appGroups.reduce((total, group) => total + group.apps.length, 0);
        const newBlockedCount = currentBlockedCount + prev.length + 1;

        if (!canBlockApp(newBlockedCount)) {
          return prev;
        }

        return [...prev, { name: appName, category }];
      }
    });
  };

  const toggleCategorySelection = (category: AppCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const categoryAppNames = category.apps.map(app => app);
    const allSelected = categoryAppNames.every(appName =>
      selectedApps.some(selected => selected.name === appName && selected.category === category.id)
    );

    if (allSelected) {
      setSelectedApps(prev =>
        prev.filter(app => !(app.category === category.id && categoryAppNames.includes(app.name)))
      );
    } else {
      const newApps = categoryAppNames
        .filter(appName => !selectedApps.some(selected => selected.name === appName))
        .map(appName => ({ name: appName, category: category.id }));
      setSelectedApps(prev => [...prev, ...newApps]);
    }
  };

  const handleSave = async () => {
    if (selectedApps.length === 0 || !userId) return;

    try {
      const { data: newGroup, error: groupError } = await supabase
        .from('blocked_app_groups')
        .insert({
          user_id: userId,
          name: `Group ${appGroups.length + 1}`,
          is_active: true,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const appsToInsert = selectedApps.map(app => ({
        group_id: newGroup.id,
        app_name: app.name,
        category: app.category,
        is_blocked: true,
      }));

      const { error: appsError } = await supabase
        .from('blocked_apps')
        .insert(appsToInsert);

      if (appsError) throw appsError;

      const defaultSchedule = ['M', 'T', 'W', 'Th', 'F'].map(day => ({
        group_id: newGroup.id,
        day_of_week: day,
        is_active: true,
      }));

      const { error: scheduleError } = await supabase
        .from('blocked_app_schedules')
        .insert(defaultSchedule);

      if (scheduleError) throw scheduleError;

      await loadAppGroups(userId);
      handleCloseModal();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to save app group:', error);
      Alert.alert('Error', 'Failed to save blocked apps');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!userId) return;

    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this blocking group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('blocked_app_groups')
                .delete()
                .eq('id', groupId);

              if (error) throw error;

              await loadAppGroups(userId);

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Failed to delete group:', error);
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const toggleGroupActive = async (groupId: string, currentState: boolean) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('blocked_app_groups')
        .update({ is_active: !currentState })
        .eq('id', groupId);

      if (error) throw error;

      await loadAppGroups(userId);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to toggle group:', error);
      Alert.alert('Error', 'Failed to update group status');
    }
  };

  const getAllBlockedApps = (): Array<{ name: string; category: string }> => {
    const allApps: Array<{ name: string; category: string }> = [];
    appGroups.forEach(group => {
      group.apps.forEach(app => {
        if (!allApps.some(a => a.name === app.app_name && a.category === app.category)) {
          allApps.push({ name: app.app_name, category: app.category });
        }
      });
    });
    return allApps;
  };

  const isAppBlocked = (appName: string): boolean => {
    return appGroups.some(group =>
      group.is_active && group.apps.some(app => app.app_name === appName && app.is_blocked)
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Shield color={colors.accent} size={64} strokeWidth={1.2} />
        <View style={[styles.emptyIconGlow, { backgroundColor: colors.accent }]} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No distractions blocked yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Tap + Add App Group to begin
      </Text>
    </View>
  );

  const renderAppGroupCard = (group: AppGroup) => (
    <View
      key={group.id}
      style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.groupHeader}>
        <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
        <TouchableOpacity
          onPress={() => toggleGroupActive(group.id, group.is_active)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.statusChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              group.is_active && { backgroundColor: `${colors.accent}20`, borderColor: colors.accent },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: colors.textSecondary },
                group.is_active && { backgroundColor: colors.accent },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: colors.textSecondary },
                group.is_active && { color: colors.accent },
              ]}
            >
              {group.is_active ? 'Active' : 'Paused'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.appsRow}>
        {group.apps.slice(0, 4).map((app, index) => (
          <View key={index} style={[styles.appIcon, { backgroundColor: `${colors.accent}30`, borderColor: `${colors.accent}50` }]}>
            <Text style={[styles.appIconText, { color: colors.accent }]}>{app.app_name[0]}</Text>
          </View>
        ))}
        {group.apps.length > 4 && (
          <View style={[styles.appIcon, styles.appIconMore, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.appIconText, { color: colors.textSecondary }]}>+{group.apps.length - 4}</Text>
          </View>
        )}
      </View>

      <View style={styles.groupFooter}>
        <View style={styles.daysRow}>
          <Text style={[styles.daysLabel, { color: colors.textSecondary }]}>Active Days:</Text>
          <View style={styles.daysContainer}>
            {['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'].map((day) => (
              <Text
                key={day}
                style={[
                  styles.dayText,
                  { color: colors.textSecondary },
                  group.schedules.some(s => s.day_of_week === day && s.is_active) && { color: colors.accent },
                ]}
              >
                {day}
              </Text>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDeleteGroup(group.id)} style={styles.deleteButton}>
          <Trash2 size={18} color={colors.error} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryModal = () => {
    const filteredCategories = APP_CATEGORIES.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.apps.some(app => app.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
              {
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalClose}>
                <X color={colors.accent} size={24} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select apps to block</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SearchIcon color={colors.textSecondary} size={20} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search apps or categories..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.categoriesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {filteredCategories.map((category, index) => {
                  const categorySelected = category.apps.some(app =>
                    selectedApps.some(selected => selected.name === app && selected.category === category.id)
                  );

                  return (
                    <View key={category.id}>
                      <TouchableOpacity
                        style={styles.categoryRow}
                        activeOpacity={0.7}
                        onPress={() => toggleCategorySelection(category)}
                      >
                        <View style={styles.categoryLeft}>
                          <View style={[styles.categoryCheckbox, { borderColor: colors.textSecondary }]}>
                            {categorySelected && (
                              <View style={[styles.categoryCheckboxInner, { backgroundColor: colors.accent }]} />
                            )}
                          </View>
                          <Text style={styles.categoryIcon}>{category.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                            <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                              {category.apps.filter(app => selectedApps.some(s => s.name === app)).length}/{category.apps.length} selected
                            </Text>
                          </View>
                        </View>
                        <ChevronRight color={colors.textSecondary} size={20} strokeWidth={2} />
                      </TouchableOpacity>

                      <View style={[styles.appsListContainer, { backgroundColor: colors.surface }]}>
                        {category.apps.map((app, appIndex) => {
                          const isSelected = selectedApps.some(
                            selected => selected.name === app && selected.category === category.id
                          );
                          return (
                            <TouchableOpacity
                              key={appIndex}
                              style={styles.appRow}
                              onPress={() => toggleAppSelection(app, category.id)}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.appCheckbox, { borderColor: colors.border }]}>
                                {isSelected && (
                                  <Check color={colors.accent} size={16} strokeWidth={3} />
                                )}
                              </View>
                              <Text style={[styles.appNameText, { color: colors.text }]}>{app}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {index < filteredCategories.length - 1 && (
                        <View style={[styles.categoryDivider, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.counterContainer}>
                <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                  {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedApps.length > 0 && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={handleSave}
              disabled={selectedApps.length === 0}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  { color: colors.textSecondary },
                  selectedApps.length > 0 && { color: '#FFFFFF' },
                ]}
              >
                Save ({selectedApps.length})
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderAllAppsModal = () => {
    const blockedApps = getAllBlockedApps();
    const categoriesWithApps = APP_CATEGORIES.map(category => ({
      ...category,
      blockedApps: blockedApps.filter(app => app.category === category.id),
    })).filter(category => category.apps.length > 0);

    return (
      <Modal
        visible={showAllAppsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllAppsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAllAppsModal(false)} style={styles.modalClose}>
                <X color={colors.accent} size={24} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>All Apps & Categories</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.allAppsContainer}>
                <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statsNumber, { color: colors.accent }]}>{blockedApps.length}</Text>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Apps Blocked</Text>
                </View>

                {categoriesWithApps.map((category) => (
                  <View key={category.id} style={[styles.categorySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.categorySectionHeader}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{category.name}</Text>
                      <Text style={[styles.categorySectionCount, { color: colors.textSecondary }]}>
                        {category.blockedApps.length}/{category.apps.length}
                      </Text>
                    </View>

                    <View style={styles.appsList}>
                      {category.apps.map((app, index) => {
                        const blocked = isAppBlocked(app);
                        return (
                          <View
                            key={index}
                            style={[
                              styles.appItem,
                              { backgroundColor: colors.surface, borderColor: colors.border },
                              blocked && { backgroundColor: `${colors.error}15`, borderColor: colors.error },
                            ]}
                          >
                            <Text style={[styles.appItemText, { color: colors.text }]}>{app}</Text>
                            {blocked && (
                              <View style={[styles.blockedBadge, { backgroundColor: colors.error }]}>
                                <Shield size={12} color="#FFFFFF" strokeWidth={2} />
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Please sign in to manage blocked apps</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.addButton, { borderColor: `${colors.accent}60` }]}
            onPress={handleAddAppGroup}
            activeOpacity={0.8}
          >
            <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add App Group</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.allAppsButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleShowAllApps}
          activeOpacity={0.7}
        >
          <Text style={[styles.allAppsButtonText, { color: colors.accent }]}>All Apps</Text>
          <ChevronRight color={colors.accent} size={18} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {appGroups.length === 0 ? renderEmptyState() : appGroups.map(renderAppGroupCard)}
      </ScrollView>

      {renderCategoryModal()}
      {renderAllAppsModal()}

      <PaywallModal
        visible={showPaywall}
        onClose={closePaywall}
        feature={paywallConfig.feature}
        message={paywallConfig.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  allAppsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
  },
  allAppsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyIcon: {
    position: 'relative',
    marginBottom: 32,
  },
  emptyIconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    borderRadius: 100,
    transform: [{ scale: 1.5 }],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  groupCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  appIconMore: {
    backgroundColor: 'rgba(107, 122, 143, 0.2)',
    borderColor: 'rgba(107, 122, 143, 0.3)',
  },
  appIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  daysLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  categoryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 2,
  },
  appsListContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  appCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNameText: {
    fontSize: 15,
  },
  categoryDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  counterContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  counterText: {
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    marginHorizontal: 24,
    marginVertical: 20,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  allAppsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statsCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categorySectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  categorySectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  appsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  appItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  blockedBadge: {
    padding: 4,
    borderRadius: 8,
  },
});
