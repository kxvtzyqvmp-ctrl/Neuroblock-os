import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, RefreshCw, Trash2, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

export default function ResetSettings() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetSettings = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setResetting(true);
    try {
      const { error: detoxError } = await supabase
        .from('detox_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: notifError } = await supabase
        .from('notification_preferences')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: privacyError } = await supabase
        .from('privacy_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (detoxError || notifError || privacyError) {
        console.error('Error resetting settings:', { detoxError, notifError, privacyError });
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      console.error('Unexpected error resetting settings:', err);
    } finally {
      setResetting(false);
      setShowResetModal(false);
    }
  };

  const handleClearUsageData = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setResetting(true);
    try {
      const { error: sessionsError } = await supabase
        .from('usage_sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: dailyError } = await supabase
        .from('daily_usage')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (sessionsError || dailyError) {
        console.error('Error clearing usage data:', { sessionsError, dailyError });
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      console.error('Unexpected error clearing data:', err);
    } finally {
      setResetting(false);
      setShowClearModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.warningCard}>
        <AlertTriangle color="#FF6B6B" size={28} strokeWidth={2} />
        <Text style={styles.warningTitle}>Danger Zone</Text>
        <Text style={styles.warningDescription}>
          These actions cannot be undone. Proceed with caution.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowResetModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.actionButtonContent}>
          <View style={styles.actionButtonLeft}>
            <View style={[styles.actionButtonIcon, styles.resetIcon]}>
              <RefreshCw color="#FFA726" size={20} strokeWidth={2} />
            </View>
            <View style={styles.actionButtonText}>
              <Text style={styles.actionButtonTitle}>Reset all settings</Text>
              <Text style={styles.actionButtonDescription}>
                Restore default configuration
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowClearModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.actionButtonContent}>
          <View style={styles.actionButtonLeft}>
            <View style={[styles.actionButtonIcon, styles.deleteIcon]}>
              <Trash2 color="#FF6B6B" size={20} strokeWidth={2} />
            </View>
            <View style={styles.actionButtonText}>
              <Text style={styles.actionButtonTitle}>Clear usage data</Text>
              <Text style={styles.actionButtonDescription}>
                Delete all tracking history
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['rgba(22, 28, 38, 0.95)', 'rgba(26, 27, 46, 0.95)']}
                style={styles.modalGradient}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowResetModal(false)}
                >
                  <X color="#9BA8BA" size={24} strokeWidth={2} />
                </TouchableOpacity>

                <View style={styles.modalIconContainer}>
                  <RefreshCw color="#FFA726" size={32} strokeWidth={2} />
                </View>

                <Text style={styles.modalTitle}>Reset All Settings?</Text>
                <Text style={styles.modalDescription}>
                  This will restore all settings to their default values. Your usage
                  data will not be affected.
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowResetModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleResetSettings}
                    disabled={resetting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FFA726', '#FB8C00']}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>
                        {resetting ? 'Resetting...' : 'Reset Settings'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['rgba(22, 28, 38, 0.95)', 'rgba(26, 27, 46, 0.95)']}
                style={styles.modalGradient}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowClearModal(false)}
                >
                  <X color="#9BA8BA" size={24} strokeWidth={2} />
                </TouchableOpacity>

                <View style={styles.modalIconContainer}>
                  <Trash2 color="#FF6B6B" size={32} strokeWidth={2} />
                </View>

                <Text style={styles.modalTitle}>Clear Usage Data?</Text>
                <Text style={styles.modalDescription}>
                  This will permanently delete all your usage history, analytics, and
                  progress tracking. This action cannot be undone.
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowClearModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleClearUsageData}
                    disabled={resetting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#F44336']}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>
                        {resetting ? 'Clearing...' : 'Clear Data'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  warningCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: 12,
    marginBottom: 6,
  },
  warningDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.2)',
    marginBottom: 12,
  },
  actionButtonContent: {
    backgroundColor: 'rgba(107, 122, 143, 0.05)',
    padding: 16,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIcon: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  deleteIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 13,
    color: '#9BA8BA',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.3)',
  },
  modalGradient: {
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: 'rgba(107, 122, 143, 0.2)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  confirmButton: {
    flex: 1,
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
