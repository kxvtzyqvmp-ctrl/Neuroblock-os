import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  Lock,
  HelpCircle,
  Settings as SettingsIcon,
  Palette,
  ChevronDown,
  Info,
} from 'lucide-react-native';
import AuroraBackground from '@/components/shared/AuroraBackground';
import FloatingNav from '@/components/FloatingNav';
import LockSettingsPanel from '@/components/modes/LockSettingsPanel';
import PinSetupModal from '@/components/modes/PinSetupModal';
import HelpSection from '@/components/modes/HelpSection';
import AdvancedSection from '@/components/advanced/AdvancedSection';
import * as Haptics from 'expo-haptics';

export default function ModesScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [disableDuration, setDisableDuration] = useState(60);
  const [showPinModal, setShowPinModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState<'violet' | 'blue' | 'green' | 'orange'>('violet');
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const toggleSection = (section: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDisableBlocking = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerIconContainer}>
            <SettingsIcon color="#7C9DD9" size={40} strokeWidth={1.5} />
            <View style={styles.headerIconGlow} />
          </View>
          <Text style={styles.headerTitle}>Modes</Text>
          <Text style={styles.headerSubtitle}>
            Configure your detox settings and preferences
          </Text>
        </Animated.View>

        <View style={styles.mainSection}>
          <View style={styles.sectionHeaderRow}>
            <Clock color="#FFFFFF" size={20} strokeWidth={2} />
            <Text style={styles.sectionHeaderText}>Quick Disable</Text>
          </View>

          <View style={styles.quickDisableCard}>
            <LinearGradient
              colors={['rgba(22, 28, 38, 0.8)', 'rgba(26, 27, 46, 0.6)']}
              style={styles.cardGradient}
            >
              <View style={styles.disableRow}>
                <View style={styles.disableLabel}>
                  <Text style={styles.disableLabelText}>Disable Block Time:</Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => toggleSection('disable_info')}
                  >
                    <Info color="#6B7A8F" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.durationPicker}
                  onPress={() => toggleSection('duration')}
                >
                  <Text style={styles.durationText}>{disableDuration} minutes</Text>
                  <ChevronDown color="#7C9DD9" size={20} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {expandedSection === 'duration' && (
                <View style={styles.durationOptions}>
                  {[15, 30, 60, 120, 240].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.durationOption,
                        disableDuration === minutes && styles.durationOptionActive,
                      ]}
                      onPress={() => {
                        setDisableDuration(minutes);
                        setExpandedSection(null);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.durationOptionText,
                          disableDuration === minutes && styles.durationOptionTextActive,
                        ]}
                      >
                        {minutes} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.disableButton}
                onPress={handleDisableBlocking}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#7C9DD9', '#5A8BC4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.disableButtonGradient}
                >
                  <Text style={styles.disableButtonText}>
                    Disable Blocking: {disableDuration} mins
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        <CollapsibleSection
          title="NeuroBlock OS Settings"
          icon={Lock}
          iconColor="#A3A1FF"
          isExpanded={expandedSection === 'lock'}
          onToggle={() => toggleSection('lock')}
        >
          <LockSettingsPanel onRequestPin={() => setShowPinModal(true)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Help"
          icon={HelpCircle}
          iconColor="#4ED4C7"
          isExpanded={expandedSection === 'help'}
          onToggle={() => toggleSection('help')}
        >
          <HelpSection />
        </CollapsibleSection>

        <CollapsibleSection
          title="Advanced"
          icon={SettingsIcon}
          iconColor="#8E89FB"
          isExpanded={expandedSection === 'advanced'}
          onToggle={() => toggleSection('advanced')}
        >
          <AdvancedSection />
        </CollapsibleSection>

        <CollapsibleSection
          title="Appearance"
          icon={Palette}
          iconColor="#FECF5E"
          isExpanded={expandedSection === 'appearance'}
          onToggle={() => toggleSection('appearance')}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.sectionDescription}>
              Customize the look and feel of the app
            </Text>
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => toggleSection('theme')}
              >
                <Text style={styles.optionLabel}>Theme</Text>
                <Text style={styles.optionValue}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
              {expandedSection === 'theme' && (
                <View style={styles.subOptions}>
                  {(['dark', 'light', 'system'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.subOption,
                        theme === t && styles.subOptionActive,
                      ]}
                      onPress={() => {
                        setTheme(t);
                        setExpandedSection(null);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.subOptionText,
                          theme === t && styles.subOptionTextActive,
                        ]}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                      {theme === t && (
                        <View style={styles.checkIcon}>
                          <Text style={styles.checkIconText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => toggleSection('accent')}
              >
                <Text style={styles.optionLabel}>Accent color</Text>
                <View style={styles.colorPreview}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: getAccentColor(accentColor) },
                    ]}
                  />
                  <Text style={styles.optionValue}>
                    {accentColor.charAt(0).toUpperCase() + accentColor.slice(1)}
                  </Text>
                </View>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
              {expandedSection === 'accent' && (
                <View style={styles.subOptions}>
                  {(['violet', 'blue', 'green', 'orange'] as const).map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.subOption,
                        accentColor === color && styles.subOptionActive,
                      ]}
                      onPress={() => {
                        setAccentColor(color);
                        setExpandedSection(null);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: getAccentColor(color) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.subOptionText,
                          accentColor === color && styles.subOptionTextActive,
                        ]}
                      >
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </Text>
                      {accentColor === color && (
                        <View style={styles.checkIcon}>
                          <Text style={styles.checkIconText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => toggleSection('animation')}
              >
                <Text style={styles.optionLabel}>Animation speed</Text>
                <Text style={styles.optionValue}>
                  {animationSpeed.charAt(0).toUpperCase() + animationSpeed.slice(1)}
                </Text>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
              {expandedSection === 'animation' && (
                <View style={styles.subOptions}>
                  {(['slow', 'normal', 'fast'] as const).map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.subOption,
                        animationSpeed === speed && styles.subOptionActive,
                      ]}
                      onPress={() => {
                        setAnimationSpeed(speed);
                        setExpandedSection(null);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.subOptionText,
                          animationSpeed === speed && styles.subOptionTextActive,
                        ]}
                      >
                        {speed.charAt(0).toUpperCase() + speed.slice(1)}
                      </Text>
                      {animationSpeed === speed && (
                        <View style={styles.checkIcon}>
                          <Text style={styles.checkIconText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </CollapsibleSection>

        <View style={styles.spacer} />
      </ScrollView>

      <FloatingNav activeTab="modes" />

      <PinSetupModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          console.log('PIN set successfully');
        }}
      />
    </View>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: any;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isExpanded, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.collapsibleHeaderLeft}>
          <View style={[styles.collapsibleIcon, { backgroundColor: `${iconColor}20` }]}>
            <Icon color={iconColor} size={20} strokeWidth={2} />
          </View>
          <Text style={styles.collapsibleTitle}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown color="#6B7A8F" size={24} strokeWidth={2} />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.collapsibleContent}>{children}</View>
      )}
    </View>
  );
}

interface OptionRowProps {
  label: string;
  value?: string;
}

function getAccentColor(color: 'violet' | 'blue' | 'green' | 'orange'): string {
  switch (color) {
    case 'violet':
      return '#8E89FB';
    case 'blue':
      return '#3b82f6';
    case 'green':
      return '#10b981';
    case 'orange':
      return '#f59e0b';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  headerIconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7C9DD9',
    opacity: 0.3,
    borderRadius: 50,
    transform: [{ scale: 1.5 }],
    shadowColor: '#7C9DD9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#C5D0E0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  mainSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  quickDisableCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
  },
  disableRow: {
    marginBottom: 20,
  },
  disableLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  disableLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoButton: {
    padding: 4,
  },
  durationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.3)',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  durationOption: {
    backgroundColor: 'rgba(107, 122, 143, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.3)',
  },
  durationOptionActive: {
    backgroundColor: 'rgba(124, 157, 217, 0.2)',
    borderColor: 'rgba(124, 157, 217, 0.5)',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  durationOptionTextActive: {
    color: '#7C9DD9',
  },
  disableButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C9DD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  disableButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  disableButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  collapsibleSection: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.15)',
    backgroundColor: 'rgba(22, 28, 38, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  collapsibleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  collapsibleContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionContent: {
    gap: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  optionsList: {
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(107, 122, 143, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  optionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C9DD9',
    marginRight: 8,
  },
  optionArrow: {
    fontSize: 20,
    color: '#6B7A8F',
    fontWeight: '300',
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subOptions: {
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 12,
    gap: 8,
  },
  subOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(107, 122, 143, 0.08)',
    borderRadius: 10,
    gap: 12,
  },
  subOptionActive: {
    backgroundColor: 'rgba(124, 157, 217, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.3)',
  },
  subOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9BA8BA',
    flex: 1,
  },
  subOptionTextActive: {
    color: '#7C9DD9',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C9DD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spacer: {
    height: 40,
  },
});
