import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Shield, Settings, Zap, Users, MoreHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

type NavTab = 'blocks' | 'modes' | 'flow' | 'circles' | 'more';

interface FloatingNavProps {
  activeTab: NavTab;
}

export default function FloatingNav({ activeTab }: FloatingNavProps) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const handleTabPress = (tab: NavTab, route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const getTabColor = (tab: NavTab) => {
    if (tab === activeTab) {
      switch (tab) {
        case 'blocks': return '#8E89FB';
        case 'modes': return '#7C9DD9';
        case 'flow': return '#4ED4C7';
        case 'circles': return '#A3A1FF';
        case 'more': return '#8E89FB';
        default: return '#8E89FB';
      }
    }
    return '#6B7A8F';
  };

  const getGlowOpacity = (tab: NavTab) => {
    return tab === activeTab ? 1 : 0;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.navWrapper,
          {
            backgroundColor: waveAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                'rgba(22, 28, 38, 0.85)',
                'rgba(26, 27, 46, 0.85)',
                'rgba(22, 28, 38, 0.85)',
              ],
            }),
          },
        ]}
      >
        <View style={styles.navInner}>
          {renderNavItems()}
        </View>
      </Animated.View>
    </View>
  );

  function renderNavItems() {
    return (
      <View style={styles.navContent}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('blocks', '/apps')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Shield color={getTabColor('blocks')} size={24} strokeWidth={2} />
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: getGlowOpacity('blocks'),
                  backgroundColor: '#8E89FB',
                },
              ]}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'blocks' && { color: '#8E89FB' }]}>
            Blocks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('modes', '/modes')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Settings color={getTabColor('modes')} size={24} strokeWidth={2} />
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: getGlowOpacity('modes'),
                  backgroundColor: '#7C9DD9',
                },
              ]}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'modes' && { color: '#7C9DD9' }]}>
            Modes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.centerItem]}
          onPress={() => handleTabPress('flow', '/dashboard')}
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.centerIconContainer,
              activeTab === 'flow' && {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Zap color={getTabColor('flow')} size={28} strokeWidth={2} fill={activeTab === 'flow' ? '#4ED4C7' : 'transparent'} />
              <Animated.View
                style={[
                  styles.centerGlow,
                  {
                    opacity: getGlowOpacity('flow'),
                    backgroundColor: '#4ED4C7',
                  },
                ]}
              />
            </View>
          </Animated.View>
          <Text style={[styles.navLabel, activeTab === 'flow' && { color: '#4ED4C7' }]}>
            Flow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('circles', '/community')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Users color={getTabColor('circles')} size={24} strokeWidth={2} />
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: getGlowOpacity('circles'),
                  backgroundColor: '#A3A1FF',
                },
              ]}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'circles' && { color: '#A3A1FF' }]}>
            Circles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('more', '/more')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MoreHorizontal color={getTabColor('more')} size={24} strokeWidth={2} />
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: getGlowOpacity('more'),
                  backgroundColor: '#8E89FB',
                },
              ]}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'more' && { color: '#8E89FB' }]}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  navWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  navInner: {
    backgroundColor: 'rgba(22, 28, 38, 0.95)',
    overflow: 'hidden',
  },
  navContent: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  centerItem: {
    marginTop: -8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(22, 28, 38, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.3)',
  },
  glow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  centerGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 10,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7A8F',
    letterSpacing: 0.2,
  },
});
