import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Search, ChevronDown, ChevronRight, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { usePaywall } from '@/hooks/usePaywall';
import PaywallModal from '@/components/subscription/PaywallModal';
import {
  getInstalledApps,
  groupAppsByCategory,
  searchApps,
  InstalledApp,
  AppCategory,
} from '@/lib/installedApps';
import * as Haptics from 'expo-haptics';

export default function BlockedAppsManager() {
  const { canBlockApp, showPaywall, paywallConfig, closePaywall } = usePaywall();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (installedApps.length > 0) {
      const filteredApps = searchApps(installedApps, searchQuery);
      const grouped = groupAppsByCategory(filteredApps);
      setCategories(grouped);

      if (searchQuery.trim()) {
        setExpandedCategories(new Set(grouped.map(cat => cat.id)));
      }
    }
  }, [searchQuery, installedApps]);

  const initializeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadExistingBlocks(user.id);
      }

      const apps = await getInstalledApps();
      setInstalledApps(apps);

      const grouped = groupAppsByCategory(apps);
      setCategories(grouped);

      if (grouped.length > 0) {
        setExpandedCategories(new Set([grouped[0].id]));
      }
    } catch (error) {
      console.error('[BlockedApps] Failed to initialize:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingBlocks = async (uid: string) => {
    try {
      const { data: groups } = await supabase
        .from('blocked_app_groups')
        .select('id')
        .eq('user_id', uid)
        .eq('is_active', true);

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id);

        const { data: blockedApps } = await supabase
          .from('blocked_apps')
          .select('app_name, is_blocked')
          .in('group_id', groupIds)
          .eq('is_blocked', true);

        if (blockedApps) {
          setSelectedApps(new Set(blockedApps.map(app => app.app_name)));
        }
      }
    } catch (error) {
      console.error('[BlockedApps] Failed to load existing blocks:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleAppSelection = (appName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appName)) {
        newSet.delete(appName);
      } else {
        if (!canBlockApp(newSet.size + 1)) {
          return prev;
        }
        newSet.add(appName);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!userId || saving || selectedApps.size === 0) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSaving(true);

    try {
      const { data: existingGroups } = await supabase
        .from('blocked_app_groups')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      let groupId: string;

      if (existingGroups && existingGroups.length > 0) {
        groupId = existingGroups[0].id;

        await supabase
          .from('blocked_apps')
          .delete()
          .eq('group_id', groupId);
      } else {
        const { data: newGroup, error: groupError } = await supabase
          .from('blocked_app_groups')
          .insert([
            {
              user_id: userId,
              name: 'My Blocked Apps',
              is_active: true,
            },
          ])
          .select()
          .single();

        if (groupError) throw groupError;
        groupId = newGroup.id;
      }

      const appsToInsert = Array.from(selectedApps).map(appName => {
        const app = installedApps.find(a => a.appName === appName);
        return {
          group_id: groupId,
          app_name: appName,
          category: app?.category || 'other',
          is_blocked: true,
        };
      });

      if (appsToInsert.length > 0) {
        const { error: appsError } = await supabase
          .from('blocked_apps')
          .insert(appsToInsert);

        if (appsError) throw appsError;
      }

      console.log(`[BlockedApps] Saved ${selectedApps.size} apps successfully`);
    } catch (error) {
      console.error('[BlockedApps] Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = (category: AppCategory) => {
    const isExpanded = expandedCategories.has(category.id);
    const selectedInCategory = category.apps.filter(app => selectedApps.has(app.appName)).length;

    return (
      <View key={category.id} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryLeft}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>
                {category.apps.length} {category.apps.length === 1 ? 'app' : 'apps'}
                {selectedInCategory > 0 && ` • ${selectedInCategory} selected`}
              </Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronDown color="#9BA8BA" size={20} strokeWidth={2} />
          ) : (
            <ChevronRight color="#9BA8BA" size={20} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.appsContainer}>
            {category.apps.map(app => {
              const isSelected = selectedApps.has(app.appName);
              return (
                <TouchableOpacity
                  key={app.packageName}
                  style={[styles.appItem, isSelected && styles.appItemSelected]}
                  onPress={() => toggleAppSelection(app.appName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.appLeft}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check color="#0A0E14" size={16} strokeWidth={3} />}
                    </View>
                    <Text style={[styles.appName, isSelected && styles.appNameSelected]}>
                      {app.appName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
        <Text style={styles.loadingText}>Loading installed apps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Block Apps</Text>
        <Text style={styles.subtitle}>
          Select apps to block during your focus sessions
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#6B7A8F" size={20} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps or categories..."
          placeholderTextColor="#6B7A8F"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No apps found' : 'No installed apps detected'}
            </Text>
          </View>
        ) : (
          categories.map(renderCategory)
        )}
      </ScrollView>

      {selectedApps.size > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#0A0E14" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save ({selectedApps.size})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: '#0A0E14',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#9BA8BA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#9BA8BA',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161C26',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#E8EDF4',
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7A8F',
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: '#161C26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: '#6B7A8F',
  },
  appsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
    padding: 12,
    gap: 8,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0A0E14',
  },
  appItemSelected: {
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2A3441',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7C9DD9',
    borderColor: '#7C9DD9',
  },
  appName: {
    fontSize: 15,
    color: '#E8EDF4',
    fontWeight: '500',
  },
  appNameSelected: {
    color: '#7C9DD9',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#0A0E14',
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
  },
  saveButton: {
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0E14',
  },
});
