import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface MenuItem {
  icon: any;
  label: string;
  color: string;
  route?: string;
  action?: () => void;
}

interface SectionPanelProps {
  title: string;
  items: MenuItem[];
  gradient: [string, string];
  delay?: number;
  onMenuPress: (item: MenuItem) => void;
}

export default function SectionPanel({
  title,
  items,
  gradient,
  delay = 0,
  onMenuPress,
}: SectionPanelProps) {
  const sectionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(sectionAnim, {
      toValue: 1,
      duration: 600,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [delay, sectionAnim]);

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: sectionAnim,
          transform: [
            {
              translateY: sectionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionGradientLine}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.glassPanel}>
        <LinearGradient
          colors={['rgba(22, 28, 38, 0.8)', 'rgba(26, 27, 46, 0.6)']}
          style={styles.panelGradient}
        >
          {items.map((item, index) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => onMenuPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: `${item.color}20` }]}>
                    <item.icon color={item.color} size={20} strokeWidth={2} />
                    <View
                      style={[
                        styles.iconGlow,
                        {
                          backgroundColor: item.color,
                          shadowColor: item.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              {index < items.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    position: 'relative',
    marginBottom: 16,
    paddingLeft: 12,
  },
  sectionGradientLine: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  glassPanel: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  panelGradient: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    opacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  menuArrow: {
    fontSize: 24,
    color: '#6B7A8F',
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(107, 122, 143, 0.15)',
    marginLeft: 72,
    marginRight: 16,
  },
});
