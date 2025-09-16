import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { HapticFeedback } from '../../services/haptics';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { databaseService, JournalPrompt } from '@/services/database';

const { width } = Dimensions.get('window');

interface PromptSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: JournalPrompt) => void;
}

const categories = [
  {
    name: 'Gratitude',
    icon: 'heart',
    gradient: gradients.primary,
    description: 'Cultivate appreciation and thankfulness'
  },
  {
    name: 'Manifestation', 
    icon: 'star',
    gradient: gradients.sunset,
    description: 'Script your desires into reality'
  },
  {
    name: 'Abundance',
    icon: 'diamond',
    gradient: gradients.success,
    description: 'Attract prosperity and wealth'
  }
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function PromptSelection({ visible, onClose, onSelectPrompt }: PromptSelectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedCategory, setSelectedCategory] = useState<string>('Gratitude');
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      loadPrompts(selectedCategory);
    }
  }, [visible, selectedCategory]);

  const loadPrompts = async (category: string) => {
    setLoading(true);
    try {
      await databaseService.initDB();
      const categoryPrompts = await databaseService.getJournalPrompts(category);
      setPrompts(categoryPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    HapticFeedback.trigger('impactLight');
    setSelectedCategory(categoryName);
  };

  const handlePromptSelect = (prompt: JournalPrompt) => {
    HapticFeedback.trigger('impactMedium');
    onSelectPrompt(prompt);
    onClose();
  };

  const createPressAnimation = () => {
    categoryScale.value = withSpring(0.95, { duration: 100 });
    setTimeout(() => {
      categoryScale.value = withSpring(1, { duration: 100 });
    }, 150);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: categoryScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#F8BBD9', '#E4C1F9']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Prompt</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.categoryHeader}>Select a Category</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.name && styles.selectedCategoryCard
                ]}
                onPress={() => handleCategorySelect(category.name)}
              >
                <LinearGradient
                  colors={category.gradient}
                  style={styles.categoryGradient}
                >
                  <FontAwesome 
                    name={category.icon as React.ComponentProps<typeof FontAwesome>['name']} 
                    size={24} 
                    color="white" 
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.promptsSection}>
            <Text style={styles.promptsHeader}>
              {selectedCategory} Prompts
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading prompts...</Text>
              </View>
            ) : (
              <View style={styles.promptsList}>
                {prompts.map((prompt) => (
                  <AnimatedTouchableOpacity
                    key={prompt.id}
                    style={[styles.promptCard, animatedStyle]}
                    onPress={() => {
                      createPressAnimation();
                      setTimeout(() => handlePromptSelect(prompt), 150);
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                      style={styles.promptGradient}
                    >
                      <Text style={styles.promptTitle}>{prompt.title}</Text>
                      <Text style={styles.promptText}>{prompt.prompt}</Text>
                      <View style={styles.promptFooter}>
                        <FontAwesome name="edit" size={16} color={colors.primary} />
                        <Text style={[styles.promptAction, { color: colors.primary }]}>
                          Start Writing
                        </Text>
                      </View>
                    </LinearGradient>
                  </AnimatedTouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoriesContent: {
    paddingHorizontal: 10,
  },
  categoryCard: {
    width: width * 0.7,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.02 }],
  },
  categoryGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  promptsSection: {
    marginBottom: 40,
  },
  promptsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  promptsList: {
    gap: 16,
  },
  promptCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promptGradient: {
    borderRadius: 16,
    padding: 20,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  promptText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#636E72',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  promptFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptAction: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});