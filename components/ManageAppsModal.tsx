/**
 * Manage Apps Modal Component
 * 
 * Bottom sheet modal for selecting which apps to block.
 * Opens directly from Home screen for quick app management.
 * 
 * Features:
 * - Categorized app list with FlatList virtualization
 * - Search functionality
 * - Select All / Deselect All
 * - Toast notifications on selection
 * - Instant save to AsyncStorage
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  SectionList,
  Platform,
  Alert,
} from 'react-native';
import { X, Search, Check, Shield, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { groupAppsByCategory, InstalledApp, AppCategory, searchApps } from '@/lib/installedApps';
import { useInstalledApps } from '@/hooks/useInstalledApps';
import { usePaywall } from '@/hooks/usePaywall';
import { useProStatus } from '@/hooks/useProStatus';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { saveDetoxSettings, getDetoxSettings } from '@/lib/localStorage';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
// Toast notifications handled via onAppsUpdated callback

interface ManageAppsModalProps {
  visible: boolean;
  onClose: () => void;
  onAppsUpdated?: (selectedApps: string[]) => void;
}

interface AppItemProps {
  app: InstalledApp;
  isSelected: boolean;
  isAtLimit: boolean;
  onToggle: (appName: string) => void;
}

// Memoized app item component for performance
const AppItem = React.memo(({ app, isSelected, isAtLimit, onToggle }: AppItemProps) => {
  const handlePress = useCallback(() => {
    if (!isAtLimit) {
      onToggle(app.appName);
    }
  }, [app.appName, isAtLimit, onToggle]);

  return (
    <TouchableOpacity
      style={[
        styles.appItem,
        isSelected && styles.appItemSelected,
        isAtLimit && styles.appItemDisabled,
      ]}
      onPress={handlePress}
      disabled={isAtLimit}
      activeOpacity={0.7}
    >
      <View style={styles.appIcon}>
        <Shield color={isSelected ? '#8E89FB' : '#6B7A8F'} size={20} strokeWidth={2} />
      </View>
      <Text style={[styles.appName, isSelected && styles.appNameSelected]} numberOfLines={1}>
        {app.appName}
      </Text>
      {isSelected && <Check color="#8E89FB" size={20} strokeWidth={3} />}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.app.appName === nextProps.app.appName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isAtLimit === nextProps.isAtLimit
  );
});

AppItem.displayName = 'AppItem';

interface CategoryHeaderProps {
  category: AppCategory;
  isExpanded: boolean;
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
}

const CategoryHeader = React.memo(({ category, isExpanded, selectedCount, totalCount, onToggle }: CategoryHeaderProps) => {
  return (
    <TouchableOpacity
      style={styles.categoryHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryCount}>
        {selectedCount > 0 ? `${selectedCount}/${totalCount}` : `(${totalCount})`}
      </Text>
      <View style={styles.categorySpacer} />
      <ChevronRight
        color="#6B7A8F"
        size={20}
        strokeWidth={2}
        style={{
          transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
        }}
      />
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.selectedCount === nextProps.selectedCount
  );
});

CategoryHeader.displayName = 'CategoryHeader';

export default function ManageAppsModal({ visible, onClose, onAppsUpdated }: ManageAppsModalProps) {
  const { apps, loading, hasPermission, requestPermission } = useInstalledApps();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { hasPro } = useProStatus();
  const { canBlockApp } = usePaywall();

  const MAX_FREE_APPS = SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks;

  // Load existing blocked apps on mount
  useEffect(() => {
    if (visible) {
      loadExistingApps();
      if (!hasPermission && Platform.OS === 'android') {
        requestPermission();
      }
    }
  }, [visible, hasPermission]);

  const loadExistingApps = async () => {
    try {
      const settings = await getDetoxSettings();
      if (settings?.selected_apps) {
        setSelectedApps(new Set(settings.selected_apps));
      }
    } catch (error) {
      console.error('[ManageAppsModal] Error loading existing apps:', error);
    }
  };

  // Memoize filtered and categorized apps for performance
  const { filteredApps, categories } = useMemo(() => {
    const filtered = searchQuery.trim() ? searchApps(apps, searchQuery) : apps;
    const grouped = groupAppsByCategory(filtered);
    
    // Auto-expand categories when searching
    if (searchQuery.trim() && expandedCategories.size === 0) {
      setExpandedCategories(new Set(grouped.map(cat => cat.id)));
    } else if (!searchQuery.trim() && grouped.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set([grouped[0].id]));
    }
    
    return { filteredApps: filtered, categories: grouped };
  }, [apps, searchQuery]);

  // Prepare section list data
  const sectionData = useMemo(() => {
    return categories.map(category => ({
      title: category.name,
      data: category.apps,
      categoryId: category.id,
      icon: category.icon,
    }));
  }, [categories]);

  const toggleAppSelection = useCallback(async (appName: string) => {
    if (!canBlockApp(selectedApps.size)) {
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
    
    // Save immediately
    await saveDetoxSettings({ selected_apps: Array.from(newSelected) });
    
    // Toast notification will be handled by parent component
    
    // Notify parent
    if (onAppsUpdated) {
      onAppsUpdated(Array.from(newSelected));
    }
  }, [selectedApps, hasPro, MAX_FREE_APPS, canBlockApp, onAppsUpdated]);

  const toggleCategory = useCallback((categoryId: string) => {
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
  }, []);

  const handleSelectAll = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const allAppNames = new Set(filteredApps.map(app => app.appName));
    const limited = !hasPro ? Array.from(allAppNames).slice(0, MAX_FREE_APPS) : Array.from(allAppNames);
    setSelectedApps(new Set(limited));
    
    await saveDetoxSettings({ selected_apps: limited });
    
    if (onAppsUpdated) {
      onAppsUpdated(limited);
    }

    // Toast notification will be handled by parent component
  }, [filteredApps, hasPro, MAX_FREE_APPS, onAppsUpdated]);

  const handleDeselectAll = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedApps(new Set());
    await saveDetoxSettings({ selected_apps: [] });
    
    if (onAppsUpdated) {
      onAppsUpdated([]);
    }

    // Toast notification will be handled by parent component
  }, [onAppsUpdated]);

  const getSelectedCountForCategory = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    return category.apps.filter(app => selectedApps.has(app.appName)).length;
  }, [categories, selectedApps]);

  const renderApp = useCallback(({ item }: { item: InstalledApp }) => {
    const isSelected = selectedApps.has(item.appName);
    const isAtLimit = !hasPro && selectedApps.size >= MAX_FREE_APPS && !isSelected;
    
    return (
      <AppItem
        app={item}
        isSelected={isSelected}
        isAtLimit={isAtLimit}
        onToggle={toggleAppSelection}
      />
    );
  }, [selectedApps, hasPro, MAX_FREE_APPS, toggleAppSelection]);

  const renderSectionHeader = useCallback(({ section }: { section: any }) => {
    const isExpanded = expandedCategories.has(section.categoryId);
    const selectedCount = getSelectedCountForCategory(section.categoryId);
    
    return (
      <CategoryHeader
        category={{ id: section.categoryId, name: section.title, icon: section.icon, apps: section.data }}
        isExpanded={isExpanded}
        selectedCount={selectedCount}
        totalCount={section.data.length}
        onToggle={() => toggleCategory(section.categoryId)}
      />
    );
  }, [expandedCategories, getSelectedCountForCategory, toggleCategory]);

  const renderSectionContent = useCallback(({ section }: { section: any }) => {
    const isExpanded = expandedCategories.has(section.categoryId);
    
    if (!isExpanded) return null;

    return (
      <View style={styles.appsList}>
        {section.data.map((app: InstalledApp) => (
          <AppItem
            key={app.packageName}
            app={app}
            isSelected={selectedApps.has(app.appName)}
            isAtLimit={!hasPro && selectedApps.size >= MAX_FREE_APPS && !selectedApps.has(app.appName)}
            onToggle={toggleAppSelection}
          />
        ))}
      </View>
    );
  }, [expandedCategories, selectedApps, hasPro, MAX_FREE_APPS, toggleAppSelection]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const category = categories.find(c => c.id === item.categoryId);
    if (!category) return null;
    
    const isExpanded = expandedCategories.has(category.id);
    const selectedCount = getSelectedCountForCategory(category.id);
    
    return (
      <View style={styles.categorySection}>
        <CategoryHeader
          category={category}
          isExpanded={isExpanded}
          selectedCount={selectedCount}
          totalCount={category.apps.length}
          onToggle={() => toggleCategory(category.id)}
        />
        {isExpanded && (
          <View style={styles.appsList}>
            {category.apps.map((app: InstalledApp) => (
              <AppItem
                key={app.packageName}
                app={app}
                isSelected={selectedApps.has(app.appName)}
                isAtLimit={!hasPro && selectedApps.size >= MAX_FREE_APPS && !selectedApps.has(app.appName)}
                onToggle={toggleAppSelection}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, [categories, expandedCategories, selectedApps, hasPro, MAX_FREE_APPS, getSelectedCountForCategory, toggleCategory, toggleAppSelection]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['rgba(22, 28, 38, 0.98)', 'rgba(26, 27, 46, 0.98)']}
            style={styles.blurView}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Shield color="#8E89FB" size={24} strokeWidth={2} />
                <Text style={styles.headerTitle}>Manage Blocked Apps</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#9BA8BA" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Search and Actions */}
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

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSelectAll}>
                <CheckSquare color="#8E89FB" size={18} strokeWidth={2} />
                <Text style={styles.actionText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDeselectAll}>
                <Square color="#6B7A8F" size={18} strokeWidth={2} />
                <Text style={styles.actionText}>Deselect All</Text>
              </TouchableOpacity>
              {!hasPro && (
                <View style={styles.limitBadge}>
                  <Text style={styles.limitText}>
                    {selectedApps.size} / {MAX_FREE_APPS} (Free)
                  </Text>
                </View>
              )}
            </View>

            {/* App List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonLoader
                    key={i}
                    width="100%"
                    height={56}
                    borderRadius={12}
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </View>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                windowSize={3}
                initialNumToRender={5}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Shield color="#6B7A8F" size={48} strokeWidth={1.5} />
                    <Text style={styles.emptyText}>No apps found</Text>
                  </View>
                }
              />
            )}

            {/* Footer Summary */}
            {selectedApps.size > 0 && (
              <View style={styles.footer}>
                <LinearGradient
                  colors={['rgba(142, 137, 251, 0.2)', 'rgba(78, 212, 199, 0.2)']}
                  style={styles.footerGradient}
                >
                  <Text style={styles.footerText}>
                    {selectedApps.size} app{selectedApps.size !== 1 ? 's' : ''} selected for blocking
                  </Text>
                </LinearGradient>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 137, 251, 0.2)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    marginBottom: 12,
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  limitBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(254, 207, 94, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 207, 94, 0.3)',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FECF5E',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7A8F',
    marginRight: 8,
  },
  categorySpacer: {
    width: 12,
  },
  appsList: {
    gap: 8,
    paddingLeft: 8,
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
    marginLeft: 8,
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
  loadingContainer: {
    padding: 20,
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9BA8BA',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 137, 251, 0.2)',
  },
  footerGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E89FB',
  },
});

