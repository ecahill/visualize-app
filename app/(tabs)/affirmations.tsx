import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HapticFeedback from 'react-native-haptic-feedback';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence
} from 'react-native-reanimated';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

interface ExtendedAffirmation {
  id: string;
  text: string;
  category: 'abundance' | 'career' | 'love' | 'self-love' | 'custom';
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: Date;
}

const affirmationsData: ExtendedAffirmation[] = [
  // Abundance
  { id: '1', text: 'Money flows to me easily and effortlessly from multiple sources', category: 'abundance', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '2', text: 'I attract abundance in all areas of my life', category: 'abundance', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '3', text: 'The universe provides for me in miraculous ways', category: 'abundance', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '4', text: 'I am open to receiving unlimited prosperity', category: 'abundance', isFavorite: false, isCustom: false, createdAt: new Date() },
  
  // Career
  { id: '5', text: 'I am aligned with my highest purpose and calling', category: 'career', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '6', text: 'Success flows to me naturally in my career', category: 'career', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '7', text: 'I attract opportunities that align with my passion', category: 'career', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '8', text: 'I am confident and capable in all my professional endeavors', category: 'career', isFavorite: false, isCustom: false, createdAt: new Date() },
  
  // Love
  { id: '9', text: 'I am worthy of deep, unconditional love', category: 'love', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '10', text: 'Love flows to me and through me effortlessly', category: 'love', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '11', text: 'I attract loving, supportive relationships', category: 'love', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '12', text: 'My soulmate is finding their way to me now', category: 'love', isFavorite: false, isCustom: false, createdAt: new Date() },
  
  // Self-Love
  { id: '13', text: 'I love and accept myself completely', category: 'self-love', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '14', text: 'I am beautiful, inside and out', category: 'self-love', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '15', text: 'I trust myself and my intuition completely', category: 'self-love', isFavorite: false, isCustom: false, createdAt: new Date() },
  { id: '16', text: 'I am enough exactly as I am', category: 'self-love', isFavorite: false, isCustom: false, createdAt: new Date() },
];

const categoryColors = {
  abundance: gradients.secondary,
  career: gradients.primary,
  love: gradients.sunset,
  'self-love': gradients.success,
  custom: gradients.ocean,
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Set up notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function AffirmationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [affirmations, setAffirmations] = useState<ExtendedAffirmation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExtendedAffirmation['category'] | 'favorites'>('abundance');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newAffirmationText, setNewAffirmationText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories: { key: ExtendedAffirmation['category'] | 'favorites', label: string, icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
    { key: 'abundance', label: 'Abundance', icon: 'diamond' },
    { key: 'career', label: 'Career', icon: 'briefcase' },
    { key: 'love', label: 'Love', icon: 'heart' },
    { key: 'self-love', label: 'Self-Love', icon: 'user-circle' },
    { key: 'custom', label: 'Custom', icon: 'edit' },
    { key: 'favorites', label: 'Favorites', icon: 'star' },
  ];

  const loadAffirmations = async () => {
    try {
      const saved = await AsyncStorage.getItem('affirmations');
      if (saved) {
        const savedAffirmations = JSON.parse(saved);
        setAffirmations(savedAffirmations);
      } else {
        setAffirmations(affirmationsData);
        await AsyncStorage.setItem('affirmations', JSON.stringify(affirmationsData));
      }
    } catch (error) {
      console.error('Failed to load affirmations:', error);
      setAffirmations(affirmationsData);
    }
  };

  const saveAffirmations = async (newAffirmations: ExtendedAffirmation[]) => {
    try {
      await AsyncStorage.setItem('affirmations', JSON.stringify(newAffirmations));
      setAffirmations(newAffirmations);
    } catch (error) {
      console.error('Failed to save affirmations:', error);
    }
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule daily notification at 8 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Your Daily Affirmation',
        body: getRandomAffirmationText(),
        sound: 'default',
      },
      trigger: {
        type: 'calendar',
        hour: 8,
        minute: 0,
        repeats: true,
      } as any,
    });
  };

  const getRandomAffirmationText = () => {
    const allAffirmations = affirmations.length > 0 ? affirmations : affirmationsData;
    const randomIndex = Math.floor(Math.random() * allAffirmations.length);
    return allAffirmations[randomIndex].text;
  };

  useEffect(() => {
    loadAffirmations();
    setupNotifications();
  }, []);

  const filteredAffirmations = selectedCategory === 'favorites' 
    ? affirmations.filter(a => a.isFavorite)
    : affirmations.filter(a => a.category === selectedCategory);

  const toggleFavorite = async (id: string) => {
    HapticFeedback.trigger('impactLight', hapticOptions);
    const updated = affirmations.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    await saveAffirmations(updated);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    HapticFeedback.trigger('notificationSuccess', hapticOptions);
  };

  const shareAffirmation = async (text: string) => {
    try {
      await Sharing.shareAsync(`${text}\n\n✨ Shared from my Manifestation Journey`);
      HapticFeedback.trigger('impactLight', hapticOptions);
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const addCustomAffirmation = async () => {
    if (!newAffirmationText.trim()) {
      Alert.alert('Please enter an affirmation');
      return;
    }

    const newAffirmation: ExtendedAffirmation = {
      id: Date.now().toString(),
      text: newAffirmationText,
      category: 'custom',
      isFavorite: false,
      isCustom: true,
      createdAt: new Date(),
    };

    const updated = [...affirmations, newAffirmation];
    await saveAffirmations(updated);
    setIsAddModalVisible(false);
    setNewAffirmationText('');
    setSelectedCategory('custom');
    HapticFeedback.trigger('notificationSuccess', hapticOptions);
  };

  const deleteCustomAffirmation = async (id: string) => {
    const updated = affirmations.filter(item => item.id !== id);
    await saveAffirmations(updated);
    HapticFeedback.trigger('impactMedium', hapticOptions);
  };

  const renderRightActions = (id: string, isCustom: boolean) => {
    if (!isCustom) return null;
    
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          Alert.alert(
            'Delete Affirmation',
            'Are you sure you want to delete this custom affirmation?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete', 
                style: 'destructive',
                onPress: () => deleteCustomAffirmation(id)
              },
            ]
          );
        }}
      >
        <FontAwesome name="trash" size={20} color="white" />
      </TouchableOpacity>
    );
  };

  const renderAffirmationItem = ({ item }: { item: ExtendedAffirmation }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id, item.isCustom)}>
      <View style={[styles.affirmationCard, { backgroundColor: colors.card }]}>
        <View style={[styles.affirmationHeader, { backgroundColor: 'transparent' }]}>
          <LinearGradient
            colors={categoryColors[item.category]}
            style={styles.categoryDot}
          />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyToClipboard(item.text, item.id)}
            >
              <FontAwesome 
                name={copiedId === item.id ? 'check' : 'copy'} 
                size={16} 
                color={copiedId === item.id ? '#4CAF50' : colors.text} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareAffirmation(item.text)}
            >
              <FontAwesome name="share" size={16} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <FontAwesome
                name={item.isFavorite ? 'heart' : 'heart-o'}
                size={16}
                color={item.isFavorite ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.affirmationText, { color: colors.text }]}>
          {item.text}
        </Text>
        
        <View style={[styles.affirmationFooter, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.categoryLabel, { color: colors.primary }]}>
            {item.category.replace('-', ' ').toUpperCase()}
          </Text>
          {item.isCustom && (
            <View style={[styles.customBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.customBadgeText}>CUSTOM</Text>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.sunset}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Affirmations</Text>
        <Text style={styles.headerSubtitle}>Speak your truth into existence</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <FontAwesome name="plus" size={16} color="white" />
          <Text style={styles.addButtonText}>Add Custom</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Category Tabs */}
      <View style={[styles.categoryContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: selectedCategory === category.key ? colors.primary : colors.surface,
                }
              ]}
              onPress={() => {
                setSelectedCategory(category.key);
                HapticFeedback.trigger('selection', hapticOptions);
              }}
            >
              <FontAwesome
                name={category.icon}
                size={16}
                color={selectedCategory === category.key ? 'white' : colors.text}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  {
                    color: selectedCategory === category.key ? 'white' : colors.text,
                  }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Affirmations List */}
      <FlatList
        data={filteredAffirmations}
        renderItem={renderAffirmationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="heart-o" size={48} color={colors.primary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedCategory === 'favorites' ? 'No Favorites Yet' : 'No Affirmations'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text }]}>
              {selectedCategory === 'favorites' 
                ? 'Heart your favorite affirmations to see them here'
                : selectedCategory === 'custom'
                ? 'Create your first custom affirmation'
                : 'Loading affirmations...'}
            </Text>
          </View>
        }
      />

      {/* Add Custom Affirmation Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsAddModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Custom Affirmation</Text>
          </LinearGradient>

          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Your Affirmation</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="I am worthy of all my desires..."
                placeholderTextColor={colors.placeholder}
                value={newAffirmationText}
                onChangeText={setNewAffirmationText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Affirmation Tips</Text>
              <View style={styles.tipsContainer}>
                <Text style={[styles.tip, { color: colors.text }]}>• Use present tense ("I am" not "I will")</Text>
                <Text style={[styles.tip, { color: colors.text }]}>• Be specific and positive</Text>
                <Text style={[styles.tip, { color: colors.text }]}>• Feel the emotion behind the words</Text>
                <Text style={[styles.tip, { color: colors.text }]}>• Keep it personal and meaningful</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={addCustomAffirmation}
            >
              <Text style={styles.saveButtonText}>Add Affirmation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 32,
    paddingTop: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  affirmationCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  affirmationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  affirmationText: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: '500',
  },
  affirmationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 32,
    paddingTop: 80,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tipsContainer: {
    marginTop: 8,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});