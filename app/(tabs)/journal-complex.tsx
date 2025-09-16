import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  Dimensions,
  Platform,
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { HapticFeedback } from '../../services/haptics';
import * as Notifications from 'expo-notifications';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { databaseService, JournalEntry, JournalPrompt } from '@/services/database';
import { pdfExportService } from '@/services/pdfExport';
import PromptSelection from '@/components/journal/PromptSelection';
import RichTextEditor from '@/components/journal/RichTextEditor';
import JournalEntryCard from '@/components/journal/JournalEntryCard';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isWritingModalVisible, setIsWritingModalVisible] = useState(false);
  const [isPromptModalVisible, setIsPromptModalVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryMood, setEntryMood] = useState<string>('Joyful');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  const fabScale = useSharedValue(1);

  useEffect(() => {
    loadEntries();
    setupNotifications();
  }, []);

  const loadEntries = async () => {
    try {
      await databaseService.initDB();
      const dbEntries = await databaseService.getJournalEntries();
      setEntries(dbEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✨ Time to Script Your Reality",
          body: "Your daily journaling practice awaits. What will you manifest today?",
          sound: true,
        },
        trigger: {
          type: 'calendar',
          hour: 20,
          minute: 0,
          repeats: true,
        } as any,
      });
    }
  };

  const handlePromptSelect = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    setEntryTitle(prompt.title);
    setEntryContent(`<p><em>${prompt.prompt}</em></p><br><p></p>`);
    setIsWritingModalVisible(true);
  };

  const handleSaveEntry = async () => {
    if (!entryTitle.trim() || !entryContent.trim()) {
      Alert.alert('Please add both a title and content');
      return;
    }

    try {
      setLoading(true);
      const category = selectedPrompt?.category || 'Personal';
      
      await databaseService.saveJournalEntry({
        title: entryTitle,
        content: entryContent,
        mood: entryMood,
        category: category,
      });

      await loadEntries();
      setIsWritingModalVisible(false);
      setEntryTitle('');
      setEntryContent('');
      setEntryMood('Joyful');
      setSelectedPrompt(null);
      
      HapticFeedback.trigger('notificationSuccess');
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteJournalEntry(entry.id);
              await loadEntries();
              HapticFeedback.trigger('impactMedium');
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const handleShareEntry = async (entry: JournalEntry) => {
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
    const plainContent = stripHtml(entry.content);
    
    try {
      await Share.share({
        message: `${entry.title}\n\n${plainContent}\n\n✨ Created with my Manifestation Journal`,
        title: entry.title,
      });
    } catch (error) {
      console.error('Error sharing entry:', error);
    }
  };

  const searchEntries = async (query: string) => {
    if (!query.trim()) {
      loadEntries();
      return;
    }

    try {
      const results = await databaseService.searchJournalEntries(
        query,
        filterCategory === 'All' ? undefined : filterCategory
      );
      setEntries(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleFabPress = () => {
    HapticFeedback.trigger('impactMedium');
    fabScale.value = withSpring(0.9, { duration: 100 });
    setTimeout(() => {
      fabScale.value = withSpring(1, { duration: 100 });
      setIsPromptModalVisible(true);
    }, 150);
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const filteredEntries = entries.filter(entry => {
    if (filterCategory === 'All') return true;
    return entry.category === filterCategory;
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8BBD9', '#E4C1F9', '#FFD93D']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.6, 1]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sacred Journal ✨</Text>
          <Text style={styles.headerSubtitle}>Script your reality with Neville's wisdom</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your manifestations..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchEntries(text);
            }}
          />
          <FontAwesome name="search" size={20} color="rgba(255, 255, 255, 0.8)" style={styles.searchIcon} />
        </View>

        <View style={styles.controlsRow}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {['All', 'Gratitude', 'Manifestation', 'Abundance'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  filterCategory === category && styles.activeFilterChip
                ]}
                onPress={() => setFilterCategory(category)}
              >
                <Text style={[
                  styles.filterText,
                  filterCategory === category && styles.activeFilterText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => pdfExportService.exportFilteredEntries(entries, filterCategory)}
          >
            <FontAwesome name="file-pdf-o" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="book" size={64} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyTitle}>Start Your Journey</Text>
              <Text style={styles.emptySubtitle}>
                Begin scripting your reality with your first journal entry
              </Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onPress={() => {
                  setSelectedEntry(entry);
                  setIsModalVisible(true);
                }}
                onDelete={() => handleDeleteEntry(entry)}
              />
            ))
          )}
        </ScrollView>

        <AnimatedTouchableOpacity
          style={[styles.fab, fabAnimatedStyle]}
          onPress={handleFabPress}
        >
          <LinearGradient
            colors={['#D63384', '#6A4C93']}
            style={styles.fabGradient}
          >
            <FontAwesome name="edit" size={24} color="white" />
          </LinearGradient>
        </AnimatedTouchableOpacity>
      </LinearGradient>

      <PromptSelection
        visible={isPromptModalVisible}
        onClose={() => setIsPromptModalVisible(false)}
        onSelectPrompt={handlePromptSelect}
      />

      <Modal
        visible={isWritingModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <LinearGradient
          colors={['#F8BBD9', '#E4C1F9']}
          style={styles.editorContainer}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsWritingModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Script Your Reality</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveEntry}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Entry title..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={entryTitle}
            onChangeText={setEntryTitle}
          />

          <RichTextEditor
            initialContent={entryContent}
            onContentChange={setEntryContent}
            placeholder="Begin scripting your manifestation... Remember Neville's teachings: Live in the end, assume it is done, feel the wish fulfilled..."
          />
        </LinearGradient>
      </Modal>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#F8BBD9', '#E4C1F9']}
          style={styles.container}
        >
          <View style={styles.viewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => selectedEntry && handleShareEntry(selectedEntry)}
            >
              <FontAwesome name="share" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {selectedEntry && (
            <ScrollView style={styles.viewContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.viewTitle}>{selectedEntry.title}</Text>
              <Text style={styles.viewDate}>
                {new Date(selectedEntry.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>

              <View style={styles.viewMoodContainer}>
                <Text style={styles.viewMoodLabel}>Mood: {selectedEntry.mood}</Text>
              </View>

              <View style={styles.viewContentContainer}>
                <Text style={styles.viewContentText}>
                  {selectedEntry.content.replace(/<[^>]*>/g, '')}
                </Text>
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingRight: 50,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  filterContainer: {
    flex: 1,
    maxHeight: 50,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  filterContent: {
    paddingHorizontal: 4,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  filterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#2D3436',
  },
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
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
  editorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#2D3436',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  viewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  viewDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  viewMoodContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  viewMoodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  viewContentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  viewContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2D3436',
  },
});