import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, CheckCircle } from 'lucide-react-native';

interface Step6PermissionsProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function Step6Permissions({ onComplete, onBack }: Step6PermissionsProps) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGrantPermission = async () => {
    setIsLoading(true);

    setTimeout(() => {
      setPermissionGranted(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!permissionGranted ? (
          <>
            <View style={styles.iconContainer}>
              <Shield color="#7C9DD9" size={48} strokeWidth={1.5} />
            </View>

            <Text style={styles.heading}>Enable Screen Time Access.</Text>

            <Text style={styles.subtext}>
              This lets NeuroBlock OS track usage and apply blocks. We never access your
              personal data.
            </Text>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyText}>
                Your data stays on your device and is never shared with third parties.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.successIconContainer}>
              <CheckCircle color="#7C9DD9" size={64} strokeWidth={1.5} />
            </View>

            <Text style={styles.successHeading}>Detox Mode Activated</Text>

            <Text style={styles.successSubtext}>
              You're all set! Your personalized detox plan is now active.
            </Text>
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!permissionGranted ? (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonLoading]}
              onPress={handleGrantPermission}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Granting...' : 'Grant Permission'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.dashboardButton} onPress={onComplete}>
            <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtext: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  privacyNote: {
    backgroundColor: '#161C26',
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7C9DD9',
  },
  privacyText: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successHeading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  successSubtext: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonLoading: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
  dashboardButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dashboardButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
});
