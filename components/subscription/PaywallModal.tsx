import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, X, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  message?: string;
}

export default function PaywallModal({
  visible,
  onClose,
  feature = 'Premium Feature',
  message = 'Upgrade to NeuroBlock OS Premium to unlock this feature and enhance your focus journey.',
}: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/subscription');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="#9BA8BA" size={24} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(124, 157, 217, 0.2)', 'rgba(124, 157, 217, 0.05)']}
              style={styles.iconGradient}
            >
              <Lock color="#7C9DD9" size={48} strokeWidth={1.5} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>{feature}</Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <Sparkles color="#7C9DD9" size={20} strokeWidth={2} />
              <Text style={styles.featureText}>Unlimited app blocks</Text>
            </View>
            <View style={styles.featureRow}>
              <Sparkles color="#7C9DD9" size={20} strokeWidth={2} />
              <Text style={styles.featureText}>AI insights & coaching</Text>
            </View>
            <View style={styles.featureRow}>
              <Sparkles color="#7C9DD9" size={20} strokeWidth={2} />
              <Text style={styles.featureText}>Family linking</Text>
            </View>
            <View style={styles.featureRow}>
              <Sparkles color="#7C9DD9" size={20} strokeWidth={2} />
              <Text style={styles.featureText}>Custom schedules</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <LinearGradient
              colors={['#7C9DD9', '#5A7DB8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#161C26',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#E8EDF4',
    fontWeight: '500',
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0E14',
  },
  laterButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7A8F',
  },
});
