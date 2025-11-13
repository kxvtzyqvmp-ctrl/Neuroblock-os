import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link2, X, Crown, Shield, AlertCircle, CheckCircle, Users } from 'lucide-react-native';
import { supabase, UserProfile, LinkedAccount, UserSubscription } from '@/lib/supabase';
import { createParentLink, validatePairingCode, acceptParentLink, unlinkAccounts } from '@/lib/linking';

export default function FamilyLinkingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccount | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [childName, setChildName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      setSubscription(sub);

      let { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .maybeSingle();

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert([{ role: null }])
          .select()
          .single();
        profile = newProfile;
      }

      setUserProfile(profile);

      if (profile?.role) {
        const { data: link } = await supabase
          .from('linked_accounts')
          .select('*')
          .or(`parent_id.eq.${profile.id},child_id.eq.${profile.id}`)
          .eq('status', 'active')
          .maybeSingle();

        setLinkedAccount(link);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!userProfile) return;

    setProcessing(true);
    const result = await createParentLink(userProfile.id);

    if (result) {
      setGeneratedCode(result.code);
      setShowCodeModal(true);
    }

    setProcessing(false);
  };

  const handlePairWithCode = async () => {
    if (!pairingCode || pairingCode.length !== 6 || !childName.trim()) {
      setError('Please enter a valid 6-digit code and your name');
      return;
    }

    setProcessing(true);
    setError('');

    const link = await validatePairingCode(pairingCode);

    if (!link) {
      setError('Invalid or expired code');
      setProcessing(false);
      return;
    }

    if (!userProfile) {
      setProcessing(false);
      return;
    }

    const success = await acceptParentLink(link.id, userProfile.id, childName);

    if (success) {
      setShowPairModal(false);
      setPairingCode('');
      setChildName('');
      await loadData();
    } else {
      setError('Failed to link accounts');
    }

    setProcessing(false);
  };

  const handleUnlink = async () => {
    if (!linkedAccount || !userProfile) return;

    setProcessing(true);
    const success = await unlinkAccounts(
      linkedAccount.id,
      userProfile.role as 'parent' | 'child'
    );

    if (success) {
      setShowUnlinkModal(false);
      await loadData();
    }

    setProcessing(false);
  };

  const isPremium = subscription?.plan === 'premium' && subscription?.is_active;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#9BA8BA" size={24} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Shield color="#6B7A8F" size={48} strokeWidth={1.5} />
            <Text style={styles.title}>Family Linking</Text>
            <Text style={styles.subtitle}>Premium Feature</Text>
          </View>

          <View style={styles.premiumCard}>
            <Crown color="#7C9DD9" size={32} strokeWidth={1.5} />
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumText}>
              Family linking is available with Premium. Help your family build healthier digital
              habits together.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription')}
            >
              <Text style={styles.upgradeButtonText}>View Premium Plans</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (linkedAccount && userProfile?.role === 'child') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#9BA8BA" size={24} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Link2 color="#4ED4C7" size={48} strokeWidth={1.5} />
            <Text style={styles.title}>Linked with Parent</Text>
            <Text style={styles.subtitle}>Your parent is helping you stay focused and balanced.</Text>
          </View>

          <View style={[styles.infoCard, styles.childCard]}>
            <AlertCircle color="#4ED4C7" size={24} strokeWidth={2} />
            <Text style={styles.infoText}>
              Your parent can view your screen time and detox settings. They cannot access your
              private data.
            </Text>
          </View>

          <TouchableOpacity style={styles.unlinkButton} onPress={() => setShowUnlinkModal(true)}>
            <Text style={styles.unlinkButtonText}>Unlink from Parent</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (linkedAccount && userProfile?.role === 'parent') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#9BA8BA" size={24} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Link2 color="#8E89FB" size={48} strokeWidth={1.5} />
            <Text style={styles.title}>Linked Accounts</Text>
            <Text style={styles.subtitle}>You're helping your child build healthier habits.</Text>
          </View>

          <View style={[styles.infoCard, styles.parentCard]}>
            <Users color="#8E89FB" size={24} strokeWidth={2} />
            <Text style={styles.infoText}>
              View your child's screen time and manage their detox settings. Their privacy is
              protected.
            </Text>
          </View>

          <TouchableOpacity style={styles.unlinkButton} onPress={() => setShowUnlinkModal(true)}>
            <Text style={styles.unlinkButtonText}>Unlink Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#9BA8BA" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Shield color="#7C9DD9" size={48} strokeWidth={1.5} />
          <Text style={styles.title}>Family Linking</Text>
          <Text style={styles.subtitle}>Connect with your family for shared digital wellness.</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, styles.parentOptionCard]}
            onPress={handleGenerateCode}
            disabled={processing}
          >
            <View style={styles.optionIcon}>
              <Shield color="#8E89FB" size={32} strokeWidth={1.5} />
            </View>
            <Text style={styles.optionTitle}>I'm a Parent</Text>
            <Text style={styles.optionDescription}>
              Generate a code for your child to pair their account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.childOptionCard]}
            onPress={() => setShowPairModal(true)}
          >
            <View style={styles.optionIcon}>
              <Link2 color="#4ED4C7" size={32} strokeWidth={1.5} />
            </View>
            <Text style={styles.optionTitle}>I'm a Child</Text>
            <Text style={styles.optionDescription}>
              Enter the code from your parent to link accounts
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacyNote}>
          <AlertCircle color="#7C9DD9" size={20} strokeWidth={2} />
          <Text style={styles.privacyText}>
            This link only shares screen-time data and detox settings. No private information is
            shared.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showCodeModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCodeModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <CheckCircle color="#7C9DD9" size={48} strokeWidth={1.5} />
            <Text style={styles.modalTitle}>Pairing Code Generated</Text>
            <Text style={styles.modalSubtitle}>Share this code with your child:</Text>

            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{generatedCode}</Text>
            </View>

            <Text style={styles.codeExpiry}>Code expires in 5 minutes</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCodeModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showPairModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !processing && setShowPairModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Link with Parent</Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#6B7A8F"
              value={childName}
              onChangeText={setChildName}
              maxLength={30}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#6B7A8F"
              value={pairingCode}
              onChangeText={setPairingCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle color="#FF6B6B" size={16} strokeWidth={2} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPairModal(false)}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, processing && styles.confirmButtonProcessing]}
                onPress={handlePairWithCode}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#0A0E14" />
                ) : (
                  <Text style={styles.confirmButtonText}>Link Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showUnlinkModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !processing && setShowUnlinkModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <AlertCircle color="#FF6B6B" size={48} strokeWidth={1.5} />
            <Text style={styles.modalTitle}>Unlink Account?</Text>
            <Text style={styles.modalDescription}>
              This will remove the connection between accounts. You can always link again later.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUnlinkModal(false)}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dangerButton, processing && styles.confirmButtonProcessing]}
                onPress={handleUnlink}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dangerButtonText}>Unlink</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: '#0A0E14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 24,
  },
  premiumCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8EDF4',
    marginTop: 16,
    marginBottom: 12,
  },
  premiumText: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: '#7C9DD9',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2A3441',
    alignItems: 'center',
  },
  parentOptionCard: {
    borderColor: '#8E89FB',
  },
  childOptionCard: {
    borderColor: '#4ED4C7',
  },
  optionIcon: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  parentCard: {
    borderLeftColor: '#8E89FB',
  },
  childCard: {
    borderLeftColor: '#4ED4C7',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  privacyNote: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7A8F',
    lineHeight: 20,
  },
  unlinkButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    alignItems: 'center',
  },
  unlinkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#161C26',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalDescription: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  codeDisplay: {
    backgroundColor: '#0A0E14',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#7C9DD9',
    letterSpacing: 8,
  },
  codeExpiry: {
    fontSize: 13,
    color: '#6B7A8F',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#0A0E14',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    color: '#E8EDF4',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#7C9DD9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonProcessing: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
