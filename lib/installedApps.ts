import { Platform } from 'react-native';

export interface InstalledApp {
  packageName: string;
  appName: string;
  icon?: string;
  category?: string;
}

export interface AppCategory {
  id: string;
  name: string;
  icon: string;
  apps: InstalledApp[];
}

const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; icon: string; name: string }> = {
  social: {
    keywords: ['facebook', 'instagram', 'twitter', 'snapchat', 'tiktok', 'whatsapp', 'messenger', 'telegram', 'reddit', 'linkedin', 'discord', 'wechat', 'line'],
    icon: '💗',
    name: 'Social',
  },
  entertainment: {
    keywords: ['youtube', 'netflix', 'spotify', 'twitch', 'hulu', 'disney', 'prime video', 'hbo', 'music', 'video', 'stream'],
    icon: '🍿',
    name: 'Entertainment',
  },
  games: {
    keywords: ['game', 'play', 'candy', 'clash', 'pokemon', 'minecraft', 'roblox', 'fortnite', 'pubg', 'cod', 'arcade'],
    icon: '🎮',
    name: 'Games',
  },
  productivity: {
    keywords: ['gmail', 'outlook', 'mail', 'calendar', 'notes', 'drive', 'dropbox', 'docs', 'sheets', 'office', 'notion', 'trello', 'slack', 'teams', 'zoom'],
    icon: '📨',
    name: 'Productivity',
  },
  shopping: {
    keywords: ['amazon', 'ebay', 'shop', 'store', 'walmart', 'target', 'aliexpress', 'etsy', 'market'],
    icon: '🛍',
    name: 'Shopping',
  },
  news: {
    keywords: ['news', 'times', 'post', 'bbc', 'cnn', 'reuters', 'guardian', 'medium', 'flipboard'],
    icon: '📰',
    name: 'News & Reading',
  },
  travel: {
    keywords: ['uber', 'lyft', 'maps', 'waze', 'airbnb', 'booking', 'expedia', 'travel', 'hotel', 'flight'],
    icon: '🏝',
    name: 'Travel',
  },
  food: {
    keywords: ['uber eats', 'doordash', 'grubhub', 'postmates', 'deliveroo', 'food', 'restaurant', 'delivery'],
    icon: '🍔',
    name: 'Food & Delivery',
  },
  fitness: {
    keywords: ['strava', 'nike', 'peloton', 'fitness', 'workout', 'health', 'gym', 'run', 'yoga'],
    icon: '🚴',
    name: 'Health & Fitness',
  },
  finance: {
    keywords: ['bank', 'paypal', 'venmo', 'cash', 'finance', 'wallet', 'crypto', 'trading', 'stock'],
    icon: '💰',
    name: 'Finance',
  },
  education: {
    keywords: ['duolingo', 'khan', 'coursera', 'udemy', 'learn', 'education', 'study', 'class'],
    icon: '🌍',
    name: 'Education',
  },
  utilities: {
    keywords: ['calculator', 'flashlight', 'weather', 'clock', 'timer', 'file', 'cleaner'],
    icon: '🧮',
    name: 'Utilities',
  },
};

function categorizeApp(appName: string, packageName: string): string {
  const searchText = `${appName.toLowerCase()} ${packageName.toLowerCase()}`;

  for (const [categoryId, { keywords }] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return categoryId;
    }
  }

  return 'other';
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (Platform.OS === 'web') {
    return getMockInstalledApps();
  }

  try {
    const { getInstalledApplications } = require('@/modules/screentime');
    const apps = await getInstalledApplications();
    return apps || getMockInstalledApps();
  } catch (error) {
    console.warn('[InstalledApps] Native module not available, using mock data:', error);
    return getMockInstalledApps();
  }
}

function getMockInstalledApps(): InstalledApp[] {
  return [
    { packageName: 'com.instagram.android', appName: 'Instagram', category: 'social' },
    { packageName: 'com.facebook.katana', appName: 'Facebook', category: 'social' },
    { packageName: 'com.twitter.android', appName: 'Twitter', category: 'social' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', category: 'social' },
    { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', category: 'social' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'social' },
    { packageName: 'com.discord', appName: 'Discord', category: 'social' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', category: 'news' },
    { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'entertainment' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', category: 'entertainment' },
    { packageName: 'com.spotify.music', appName: 'Spotify', category: 'entertainment' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', category: 'entertainment' },
    { packageName: 'com.google.android.apps.tachyon', appName: 'Google Meet', category: 'productivity' },
    { packageName: 'us.zoom.videomeetings', appName: 'Zoom', category: 'productivity' },
    { packageName: 'com.google.android.gm', appName: 'Gmail', category: 'productivity' },
    { packageName: 'com.microsoft.office.outlook', appName: 'Outlook', category: 'productivity' },
    { packageName: 'com.slack', appName: 'Slack', category: 'productivity' },
    { packageName: 'com.notion.id', appName: 'Notion', category: 'productivity' },
    { packageName: 'com.amazon.mShop.android.shopping', appName: 'Amazon', category: 'shopping' },
    { packageName: 'com.ubercab', appName: 'Uber', category: 'travel' },
    { packageName: 'com.ubercab.eats', appName: 'Uber Eats', category: 'food' },
    { packageName: 'com.contextlogic.wish', appName: 'Wish', category: 'shopping' },
    { packageName: 'com.king.candycrushsaga', appName: 'Candy Crush Saga', category: 'games' },
    { packageName: 'com.roblox.client', appName: 'Roblox', category: 'games' },
    { packageName: 'com.mojang.minecraftpe', appName: 'Minecraft', category: 'games' },
    { packageName: 'com.pubg.krmobile', appName: 'PUBG Mobile', category: 'games' },
    { packageName: 'com.duolingo', appName: 'Duolingo', category: 'education' },
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', category: 'travel' },
    { packageName: 'com.airbnb.android', appName: 'Airbnb', category: 'travel' },
    { packageName: 'com.strava', appName: 'Strava', category: 'fitness' },
    { packageName: 'com.nike.plusgps', appName: 'Nike Run Club', category: 'fitness' },
  ];
}

export function groupAppsByCategory(apps: InstalledApp[]): AppCategory[] {
  const categorizedApps: Record<string, InstalledApp[]> = {};

  apps.forEach(app => {
    const category = app.category || categorizeApp(app.appName, app.packageName);
    if (!categorizedApps[category]) {
      categorizedApps[category] = [];
    }
    categorizedApps[category].push({ ...app, category });
  });

  const categories: AppCategory[] = [];

  Object.entries(CATEGORY_KEYWORDS).forEach(([id, { name, icon }]) => {
    if (categorizedApps[id] && categorizedApps[id].length > 0) {
      categories.push({
        id,
        name,
        icon,
        apps: categorizedApps[id].sort((a, b) => a.appName.localeCompare(b.appName)),
      });
    }
  });

  if (categorizedApps.other && categorizedApps.other.length > 0) {
    categories.push({
      id: 'other',
      name: 'Other',
      icon: '📱',
      apps: categorizedApps.other.sort((a, b) => a.appName.localeCompare(b.appName)),
    });
  }

  return categories.sort((a, b) => b.apps.length - a.apps.length);
}

export function searchApps(apps: InstalledApp[], query: string): InstalledApp[] {
  if (!query.trim()) return apps;

  const lowerQuery = query.toLowerCase();
  return apps.filter(app =>
    app.appName.toLowerCase().includes(lowerQuery) ||
    app.packageName.toLowerCase().includes(lowerQuery) ||
    (app.category && app.category.toLowerCase().includes(lowerQuery))
  );
}
