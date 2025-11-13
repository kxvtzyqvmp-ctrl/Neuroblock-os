import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Lock, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinSetupModal({ visible, onClose, onSuccess }: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const hashPin = async (pinCode: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pinCode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handlePinEntry = async () => {
    if (step === 'enter') {
      if (pin.length !== 4) {
        setError('PIN must be 4 digits');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
      setError('');
      setStep('confirm');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      if (confirmPin.length !== 4) {
        setError('PIN must be 4 digits');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      if (pin !== confirmPin) {
        setError('PINs do not match');
        setConfirmPin('');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      setLoading(true);
      try {
        const pinHash = await hashPin(pin);

        const { data: existingSettings } = await supabase
          .from('detox_settings')
          .select('id')
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (existingSettings) {
          const { error } = await supabase
            .from('detox_settings')
            .update({
              require_pin: true,
              pin_hash: pinHash,
            })
            .eq('id', existingSettings.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('detox_settings')
            .insert([
              {
                require_pin: true,
                pin_hash: pinHash,
              },
            ]);

          if (error) throw error;
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onSuccess();
        onClose();
      } catch (err) {
        console.error('Error setting PIN:', err);
        setError('Failed to set PIN. Please try again.');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDigitPress = (digit: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (step === 'enter') {
      if (pin.length < 4) {
        setPin(pin + digit);
        setError('');
      }
    } else {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + digit);
        setError('');
      }
    }
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const currentPin = step === 'enter' ? pin : confirmPin;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(22, 28, 38, 0.95)', 'rgba(26, 27, 46, 0.95)']}
              style={styles.modalGradient}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X color="#9BA8BA" size={24} strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <View style={styles.lockIconContainer}>
                  <Lock color="#7C9DD9" size={32} strokeWidth={2} />
                </View>
                <Text style={styles.modalTitle}>
                  {step === 'enter' ? 'Set PIN' : 'Confirm PIN'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {step === 'enter'
                    ? 'Enter a 4-digit PIN to protect your settings'
                    : 'Re-enter your PIN to confirm'}
                </Text>
              </View>

              <View style={styles.pinDisplay}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.pinDot,
                      currentPin.length > i && styles.pinDotFilled,
                    ]}
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.pinPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.pinButton}
                    onPress={() => handleDigitPress(digit.toString())}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pinButtonText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.pinButton} />
                <TouchableOpacity
                  style={styles.pinButton}
                  onPress={() => handleDigitPress('0')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pinButtonText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pinButton}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pinButtonText}>⌫</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (currentPin.length !== 4 || loading) && styles.confirmButtonDisabled,
                ]}
                onPress={handlePinEntry}
                disabled={currentPin.length !== 4 || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    currentPin.length === 4 && !loading
                      ? ['#7C9DD9', '#5A8BC4']
                      : ['#3A4556', '#3A4556']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  {step === 'enter' ? (
                    <Text style={styles.confirmButtonText}>Continue</Text>
                  ) : (
                    <>
                      <Check color="#FFFFFF" size={20} strokeWidth={2} />
                      <Text style={styles.confirmButtonText}>
                        {loading ? 'Setting PIN...' : 'Confirm'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
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
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124, 157, 217, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6B7A8F',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#7C9DD9',
    borderColor: '#7C9DD9',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  pinPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  pinButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(107, 122, 143, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.3)',
  },
  pinButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C9DD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
