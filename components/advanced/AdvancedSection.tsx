import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ChevronRight, Bell, Shield, RefreshCw, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import NotificationSettings from './NotificationSettings';
import DataPrivacy from './DataPrivacy';
import ResetSettings from './ResetSettings';
import ExportData from './ExportData';

type SubSection = 'notifications' | 'privacy' | 'reset' | 'export' | null;

export default function AdvancedSection() {
  const [activeSubSection, setActiveSubSection] = useState<SubSection>(null);

  const handleSubSectionPress = (section: SubSection) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveSubSection(section);
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveSubSection(null);
  };

  if (activeSubSection === 'notifications') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronRight
            color="#7C9DD9"
            size={20}
            strokeWidth={2}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <NotificationSettings />
      </View>
    );
  }

  if (activeSubSection === 'privacy') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronRight
            color="#7C9DD9"
            size={20}
            strokeWidth={2}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <DataPrivacy />
      </View>
    );
  }

  if (activeSubSection === 'reset') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronRight
            color="#7C9DD9"
            size={20}
            strokeWidth={2}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <ResetSettings />
      </View>
    );
  }

  if (activeSubSection === 'export') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronRight
            color="#7C9DD9"
            size={20}
            strokeWidth={2}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <ExportData />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>Fine-tune your detox experience</Text>

      <View style={styles.menuList}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleSubSectionPress('notifications')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuItemIcon, styles.notificationIcon]}>
              <Bell color="#7C9DD9" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.menuItemText}>Notification settings</Text>
          </View>
          <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleSubSectionPress('privacy')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuItemIcon, styles.privacyIcon]}>
              <Shield color="#4ED4C7" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.menuItemText}>Data & privacy</Text>
          </View>
          <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleSubSectionPress('reset')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuItemIcon, styles.resetIcon]}>
              <RefreshCw color="#FFA726" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.menuItemText}>Reset settings</Text>
          </View>
          <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleSubSectionPress('export')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuItemIcon, styles.exportIcon]}>
              <Download color="#8E89FB" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.menuItemText}>Export data</Text>
          </View>
          <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(107, 122, 143, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.15)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    backgroundColor: 'rgba(124, 157, 217, 0.15)',
  },
  privacyIcon: {
    backgroundColor: 'rgba(78, 212, 199, 0.15)',
  },
  resetIcon: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  exportIcon: {
    backgroundColor: 'rgba(142, 137, 251, 0.15)',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
