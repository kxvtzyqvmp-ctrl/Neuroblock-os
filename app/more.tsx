import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Sparkles, Headphones, Clock, Lock, Globe, Layers, Timer, FileSliders as Sliders, Brain, Circle as HelpCircle, Share2, Star, MessageCircle, Languages, Music, Shield, Eye, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/components/shared/AuroraBackground';
import FloatingNav from '@/components/FloatingNav';
import SectionPanel from '@/components/more/SectionPanel';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: any;
  label: string;
  color: string;
  route?: string;
  action?: () => void;
}

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

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

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    if (scrollY + layoutHeight >= contentHeight - 50) {
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleMenuPress = (item: MenuItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const wellnessToolkit: MenuItem[] = [
    { icon: Sparkles, label: 'Digital Reset Tips', color: '#8E89FB', route: '/tips' },
    { icon: Headphones, label: 'Offscreen Activities', color: '#4ED4C7', route: '/activities' },
    { icon: Clock, label: 'Quick Focus Block', color: '#7C9DD9', route: '/quick-focus' },
    { icon: Lock, label: 'App Control & Limits', color: '#A3A1FF', route: '/apps' },
    { icon: Globe, label: 'Web Detox Mode', color: '#5AE38C', route: '/web-detox' },
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data is safely stored and will be available when you sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/signin');
          },
        },
      ]
    );
  };

  const appControls: MenuItem[] = [
    { icon: Layers, label: 'Manage Blocked Apps', color: '#8E89FB', route: '/apps' },
    { icon: Timer, label: 'Detox Timer Settings', color: '#7C9DD9', route: '/setup' },
    { icon: Sliders, label: 'Appearance Settings', color: '#4ED4C7', route: '/appearance' },
    { icon: Brain, label: 'AI Insights & Analytics', color: '#A3A1FF', route: '/analytics' },
    { icon: LogOut, label: 'Sign Out', color: '#F87171', action: handleLogout },
  ];

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out NeuroBlock OS - Take back control of your digital life! 🧠✨',
        url: 'https://neuroblockos.app',
        title: 'NeuroBlock OS',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveReview = () => {
    const reviewUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id123456789', // Replace with actual App Store ID
      android: 'https://play.google.com/store/apps/details?id=com.harmonicminds.neuroblockos', // Replace with actual package name
      default: 'https://neuroblockos.app/reviews',
    });
    Linking.openURL(reviewUrl);
  };

  const handleJoinBeta = () => {
    Alert.alert(
      'Join Beta Program',
      'Get early access to new features and help shape the future of NeuroBlock OS!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Up',
          onPress: () => Linking.openURL('https://neuroblockos.app/beta'),
        },
      ]
    );
  };

  const handleTranslate = () => {
    Alert.alert(
      'Help Translate',
      'Want to help translate NeuroBlock OS into your language? We\'d love your contribution!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Started',
          onPress: () => Linking.openURL('https://neuroblockos.app/translate'),
        },
      ]
    );
  };

  const handleFocusSoundtrack = () => {
    Alert.alert(
      'Focus Soundtrack',
      'Choose your perfect focus soundtrack to enhance your detox sessions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Spotify',
          onPress: () => Linking.openURL('https://open.spotify.com/playlist/focus'),
        },
        {
          text: 'Open Apple Music',
          onPress: () => Linking.openURL('https://music.apple.com/browse'),
        },
      ]
    );
  };

  const supportCommunity: MenuItem[] = [
    { icon: HelpCircle, label: 'FAQs & Help Center', color: '#7C9DD9', action: () => Linking.openURL('https://neuroblockos.app/help') },
    { icon: Share2, label: 'Share NeuroBlock OS', color: '#5AE38C', action: handleShareApp },
    { icon: Star, label: 'Leave a Review', color: '#FECF5E', action: handleLeaveReview },
    { icon: MessageCircle, label: 'Join Beta & Feedback', color: '#A3A1FF', action: handleJoinBeta },
    { icon: Languages, label: 'Translate NeuroBlock OS', color: '#8E89FB', action: handleTranslate },
    { icon: Music, label: 'Focus Soundtrack', color: '#4ED4C7', action: handleFocusSoundtrack },
  ];

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
            <Shield color="#8E89FB" size={40} strokeWidth={1.5} />
            <View style={styles.headerIconGlow} />
          </View>
          <Text style={styles.headerTitle}>More Tools & Insights</Text>
          <Text style={styles.headerSubtitle}>
            Explore features that enhance your detox journey
          </Text>
        </Animated.View>

        <SectionPanel
          title="Wellness Toolkit"
          items={wellnessToolkit}
          gradient={['#8E89FB', '#4ED4C7']}
          delay={200}
          onMenuPress={handleMenuPress}
        />

        <SectionPanel
          title="App Controls"
          items={appControls}
          gradient={['#7C9DD9', '#A3A1FF']}
          delay={400}
          onMenuPress={handleMenuPress}
        />

        <SectionPanel
          title="Support & Community"
          items={supportCommunity}
          gradient={['#4ED4C7', '#8E89FB']}
          delay={600}
          onMenuPress={handleMenuPress}
        />

        <Animated.View
          style={[
            styles.footer,
            {
              opacity: footerAnim,
              transform: [
                {
                  translateY: footerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.privacyBadge}>
            <Eye color="#4ED4C7" size={16} strokeWidth={2} />
            <Text style={styles.privacyText}>No data stored — your focus is yours</Text>
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://neuroblockos.com/privacy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://neuroblockos.com/terms')}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.copyright}>NeuroBlock OS © 2025</Text>

          <LinearGradient
            colors={['rgba(142, 137, 251, 0.0)', 'rgba(142, 137, 251, 0.1)', 'rgba(142, 137, 251, 0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.footerShimmer}
          />
        </Animated.View>
      </ScrollView>

      <FloatingNav activeTab="more" />
    </View>
  );
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
    marginBottom: 40,
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
    backgroundColor: '#8E89FB',
    opacity: 0.3,
    borderRadius: 50,
    transform: [{ scale: 1.5 }],
    shadowColor: '#8E89FB',
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
    textShadowColor: 'rgba(163, 161, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#C5D0E0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    gap: 16,
    position: 'relative',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(78, 212, 199, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(78, 212, 199, 0.2)',
  },
  privacyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4ED4C7',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  footerDivider: {
    fontSize: 13,
    color: '#6B7A8F',
  },
  copyright: {
    fontSize: 12,
    color: '#6B7A8F',
    letterSpacing: 0.5,
  },
  footerShimmer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
