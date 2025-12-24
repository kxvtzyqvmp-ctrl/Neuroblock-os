/**
 * Manage Sites Modal Component
 * 
 * Bottom sheet modal for managing blocked websites/URLs.
 * Opens directly from Home screen for quick site management.
 * 
 * Features:
 * - Add/remove blocked URLs
 * - Common distraction site suggestions
 * - Save to AsyncStorage
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Globe, Plus, Trash2, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProStatus } from '@/hooks/useProStatus';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

const BLOCKED_SITES_KEY = '@neuroblock:blocked_sites';

// Common distraction sites to suggest
const SUGGESTED_SITES = [
  { domain: 'twitter.com', name: 'Twitter / X' },
  { domain: 'facebook.com', name: 'Facebook' },
  { domain: 'instagram.com', name: 'Instagram' },
  { domain: 'tiktok.com', name: 'TikTok' },
  { domain: 'reddit.com', name: 'Reddit' },
  { domain: 'youtube.com', name: 'YouTube' },
  { domain: 'netflix.com', name: 'Netflix' },
  { domain: 'twitch.tv', name: 'Twitch' },
];

interface ManageSitesModalProps {
  visible: boolean;
  onClose: () => void;
  onSitesUpdated?: (sites: string[]) => void;
}

interface SiteItemProps {
  domain: string;
  name?: string;
  isBlocked: boolean;
  onToggle: (domain: string) => void;
  onRemove?: (domain: string) => void;
  showRemove?: boolean;
}

const SiteItem = React.memo(({ domain, name, isBlocked, onToggle, onRemove, showRemove }: SiteItemProps) => {
  return (
    <View style={[styles.siteItem, isBlocked && styles.siteItemBlocked]}>
      <TouchableOpacity
        style={styles.siteContent}
        onPress={() => onToggle(domain)}
        activeOpacity={0.7}
      >
        <Globe color={isBlocked ? '#8E89FB' : '#6B7A8F'} size={20} strokeWidth={2} />
        <View style={styles.siteInfo}>
          <Text style={[styles.siteDomain, isBlocked && styles.siteDomainBlocked]}>
            {domain}
          </Text>
          {name && (
            <Text style={styles.siteName}>{name}</Text>
          )}
        </View>
        {isBlocked && <Check color="#8E89FB" size={20} strokeWidth={3} />}
      </TouchableOpacity>
      {showRemove && onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(domain)}
          activeOpacity={0.7}
        >
          <Trash2 color="#F87171" size={18} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
});

SiteItem.displayName = 'SiteItem';

export default function ManageSitesModal({ visible, onClose, onSitesUpdated }: ManageSitesModalProps) {
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [customSites, setCustomSites] = useState<string[]>([]);
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const { hasPro } = useProStatus();

  const MAX_FREE_SITES = SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks; // Reuse app limit

  // Load existing blocked sites
  useEffect(() => {
    if (visible) {
      loadBlockedSites();
    }
  }, [visible]);

  const loadBlockedSites = async () => {
    try {
      const stored = await AsyncStorage.getItem(BLOCKED_SITES_KEY);
      if (stored) {
        const sites = JSON.parse(stored);
        setBlockedSites(sites.blocked || []);
        setCustomSites(sites.custom || []);
      }
    } catch (error) {
      console.error('[ManageSitesModal] Error loading sites:', error);
    }
  };

  const saveSites = async (blocked: string[], custom: string[]) => {
    try {
      await AsyncStorage.setItem(BLOCKED_SITES_KEY, JSON.stringify({ blocked, custom }));
      if (onSitesUpdated) {
        onSitesUpdated(blocked);
      }
    } catch (error) {
      console.error('[ManageSitesModal] Error saving sites:', error);
    }
  };

  const toggleSite = useCallback((domain: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setBlockedSites(prev => {
      let newBlocked: string[];
      if (prev.includes(domain)) {
        newBlocked = prev.filter(s => s !== domain);
      } else {
        // Check limit for free users
        if (!hasPro && prev.length >= MAX_FREE_SITES) {
          Alert.alert(
            'Site Limit Reached',
            `Free plan allows blocking up to ${MAX_FREE_SITES} sites. Upgrade to Premium for unlimited blocking.`
          );
          return prev;
        }
        newBlocked = [...prev, domain];
      }
      saveSites(newBlocked, customSites);
      return newBlocked;
    });
  }, [hasPro, MAX_FREE_SITES, customSites]);

  const removeCustomSite = useCallback((domain: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCustomSites(prev => {
      const newCustom = prev.filter(s => s !== domain);
      const newBlocked = blockedSites.filter(s => s !== domain);
      setBlockedSites(newBlocked);
      saveSites(newBlocked, newCustom);
      return newCustom;
    });
  }, [blockedSites]);

  const addCustomSite = useCallback(() => {
    let url = newSiteUrl.trim().toLowerCase();
    
    if (!url) return;

    // Clean up URL - remove protocol and www
    url = url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
    
    // Basic validation
    if (!url.includes('.') || url.length < 4) {
      Alert.alert('Invalid URL', 'Please enter a valid website domain (e.g., example.com)');
      return;
    }

    // Check if already exists
    if (customSites.includes(url) || SUGGESTED_SITES.some(s => s.domain === url)) {
      Alert.alert('Already Added', 'This site is already in your list.');
      return;
    }

    // Check limit
    if (!hasPro && (blockedSites.length >= MAX_FREE_SITES)) {
      Alert.alert(
        'Site Limit Reached',
        `Free plan allows blocking up to ${MAX_FREE_SITES} sites. Upgrade to Premium for unlimited blocking.`
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newCustom = [...customSites, url];
    const newBlocked = [...blockedSites, url];
    
    setCustomSites(newCustom);
    setBlockedSites(newBlocked);
    setNewSiteUrl('');
    saveSites(newBlocked, newCustom);
  }, [newSiteUrl, customSites, blockedSites, hasPro, MAX_FREE_SITES]);

  const allSites = [
    ...customSites.map(domain => ({ domain, name: undefined, isCustom: true })),
    ...SUGGESTED_SITES.map(s => ({ ...s, isCustom: false })),
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
                <Globe color="#8E89FB" size={24} strokeWidth={2} />
                <Text style={styles.headerTitle}>Manage Blocked Sites</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#9BA8BA" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Add Custom Site */}
            <View style={styles.addSiteContainer}>
              <TextInput
                style={styles.addSiteInput}
                placeholder="Add website (e.g., example.com)"
                placeholderTextColor="#6B7A8F"
                value={newSiteUrl}
                onChangeText={setNewSiteUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={addCustomSite}
              />
              <TouchableOpacity
                style={[styles.addButton, !newSiteUrl.trim() && styles.addButtonDisabled]}
                onPress={addCustomSite}
                disabled={!newSiteUrl.trim()}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Limit indicator for free users */}
            {!hasPro && (
              <View style={styles.limitBadge}>
                <Text style={styles.limitText}>
                  {blockedSites.length} / {MAX_FREE_SITES} sites (Free)
                </Text>
              </View>
            )}

            {/* Sites List */}
            <FlatList
              data={allSites}
              renderItem={({ item }) => (
                <SiteItem
                  domain={item.domain}
                  name={item.name}
                  isBlocked={blockedSites.includes(item.domain)}
                  onToggle={toggleSite}
                  onRemove={item.isCustom ? removeCustomSite : undefined}
                  showRemove={item.isCustom}
                />
              )}
              keyExtractor={(item) => item.domain}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                customSites.length > 0 ? (
                  <Text style={styles.sectionTitle}>Your Sites</Text>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Globe color="#6B7A8F" size={48} strokeWidth={1.5} />
                  <Text style={styles.emptyText}>Add websites to block</Text>
                </View>
              }
            />

            {/* Suggested Sites Section */}
            {customSites.length > 0 && (
              <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
                Suggested Sites
              </Text>
            )}

            {/* Footer Summary */}
            {blockedSites.length > 0 && (
              <View style={styles.footer}>
                <LinearGradient
                  colors={['rgba(142, 137, 251, 0.2)', 'rgba(78, 212, 199, 0.2)']}
                  style={styles.footerGradient}
                >
                  <Text style={styles.footerText}>
                    {blockedSites.length} site{blockedSites.length !== 1 ? 's' : ''} will be blocked
                  </Text>
                </LinearGradient>
              </View>
            )}
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
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
    height: '80%',
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
  addSiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 12,
    gap: 12,
  },
  addSiteInput: {
    flex: 1,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8E89FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  limitBadge: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(254, 207, 94, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 207, 94, 0.3)',
    alignSelf: 'flex-start',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FECF5E',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A8F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(142, 137, 251, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.1)',
    overflow: 'hidden',
  },
  siteItemBlocked: {
    backgroundColor: 'rgba(142, 137, 251, 0.15)',
    borderColor: 'rgba(142, 137, 251, 0.3)',
  },
  siteContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteDomain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  siteDomainBlocked: {
    color: '#8E89FB',
  },
  siteName: {
    fontSize: 12,
    color: '#6B7A8F',
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(142, 137, 251, 0.1)',
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

