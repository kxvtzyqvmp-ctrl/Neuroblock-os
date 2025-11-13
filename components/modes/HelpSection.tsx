import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Wrench,
  MessageCircle,
  HelpCircle as HelpCircleIcon,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  display_order: number;
}

interface HelpItem {
  id: string;
  category_id: string;
  title: string;
  content: string;
  display_order: number;
}

const ICONS: Record<string, any> = {
  BookOpen,
  Wrench,
  MessageCircle,
  HelpCircle: HelpCircleIcon,
};

export default function HelpSection() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<HelpItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HelpItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryItems(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading help categories:', error);
        return;
      }

      if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Unexpected error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = async (categoryId: string) => {
    setItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from('help_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading help items:', error);
        return;
      }

      if (data) {
        setCategoryItems(data);
      }
    } catch (err) {
      console.error('Unexpected error loading items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
    setSelectedItem(null);
  };

  const handleItemPress = (item: HelpItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedItem(item);
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setCategoryItems([]);
    }
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <Text key={index} style={styles.mdH1}>
            {line.replace('# ', '')}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        return (
          <Text key={index} style={styles.mdH2}>
            {line.replace('## ', '')}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        return (
          <Text key={index} style={styles.mdH3}>
            {line.replace('### ', '')}
          </Text>
        );
      } else if (line.startsWith('- ')) {
        return (
          <View key={index} style={styles.mdListItem}>
            <Text style={styles.mdBullet}>•</Text>
            <Text style={styles.mdListText}>
              {line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '$1')}
            </Text>
          </View>
        );
      } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return (
          <Text key={index} style={styles.mdBold}>
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      } else if (line.trim() === '') {
        return <View key={index} style={styles.mdSpacing} />;
      } else {
        return (
          <Text key={index} style={styles.mdParagraph}>
            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
          </Text>
        );
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading help content...</Text>
      </View>
    );
  }

  if (selectedItem) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft color="#7C9DD9" size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.articleScroll}
          contentContainerStyle={styles.articleScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.articleContent}>
            {renderMarkdown(selectedItem.content)}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (selectedCategory) {
    const category = categories.find((c) => c.id === selectedCategory);
    if (!category) return null;

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft color="#7C9DD9" size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>Back to Help</Text>
        </TouchableOpacity>

        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            {ICONS[category.icon] &&
              (() => {
                const Icon = ICONS[category.icon];
                return <Icon color="#7C9DD9" size={24} strokeWidth={2} />;
              })()}
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>

        {itemsLoading ? (
          <Text style={styles.loadingText}>Loading articles...</Text>
        ) : (
          <View style={styles.itemsList}>
            {categoryItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Get assistance with using NeuroBlock OS
      </Text>

      <View style={styles.categoriesList}>
        {categories.map((category) => {
          const Icon = ICONS[category.icon] || HelpCircleIcon;
          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(107, 122, 143, 0.05)', 'rgba(107, 122, 143, 0.02)']}
                style={styles.categoryCardGradient}
              >
                <View style={styles.categoryCardLeft}>
                  <View style={styles.categoryCardIcon}>
                    <Icon color="#7C9DD9" size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.categoryCardText}>
                    <Text style={styles.categoryCardTitle}>{category.title}</Text>
                    <Text style={styles.categoryCardDescription}>
                      {category.description}
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    paddingVertical: 20,
  },
  description: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.2)',
  },
  categoryCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 157, 217, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardText: {
    flex: 1,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryCardDescription: {
    fontSize: 13,
    color: '#9BA8BA',
    lineHeight: 18,
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
  categoryHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 122, 143, 0.2)',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124, 157, 217, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
  },
  itemsList: {
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(107, 122, 143, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  articleScroll: {
    flex: 1,
  },
  articleScrollContent: {
    paddingBottom: 40,
  },
  articleContent: {
    gap: 8,
  },
  mdH1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  mdH2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 16,
  },
  mdH3: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 12,
  },
  mdParagraph: {
    fontSize: 15,
    color: '#C5D1E0',
    lineHeight: 22,
    marginBottom: 8,
  },
  mdListItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  mdBullet: {
    fontSize: 15,
    color: '#7C9DD9',
    marginRight: 12,
    marginTop: 2,
  },
  mdListText: {
    fontSize: 15,
    color: '#C5D1E0',
    lineHeight: 22,
    flex: 1,
  },
  mdBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 8,
  },
  mdSpacing: {
    height: 8,
  },
});
