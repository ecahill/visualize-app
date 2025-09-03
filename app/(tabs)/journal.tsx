import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { JournalEntry } from '@/types';

const sampleEntries: JournalEntry[] = [
  {
    id: '1',
    title: 'Gratitude & Manifestation',
    content: 'Today I am grateful for the beautiful sunrise and the opportunities coming my way. I feel abundant and ready to receive my blessings.',
    mood: 5,
    gratitudeItems: ['Morning coffee', 'Supportive friends', 'New opportunities'],
    manifestationGoals: ['Dream job offer', 'Financial abundance'],
    createdAt: new Date(Date.now() - 86400000),
    tags: ['gratitude', 'abundance'],
  },
  {
    id: '2',
    title: 'Self-Love Journey',
    content: 'Working on loving myself more deeply. I am worthy of all the good things coming to me.',
    mood: 4,
    gratitudeItems: ['My body', 'My creativity', 'My journey'],
    manifestationGoals: ['Self-confidence', 'Inner peace'],
    createdAt: new Date(Date.now() - 172800000),
    tags: ['self-love', 'growth'],
  },
];

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [entries, setEntries] = useState<JournalEntry[]>(sampleEntries);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryMood, setNewEntryMood] = useState<1 | 2 | 3 | 4 | 5>(5);

  const moodEmojis = ['😔', '😕', '😊', '😃', '🤩'];
  const moodLabels = ['Struggling', 'Down', 'Neutral', 'Good', 'Amazing'];

  const openEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsModalVisible(true);
  };

  const addNewEntry = () => {
    if (!newEntryTitle.trim() || !newEntryContent.trim()) {
      Alert.alert('Please fill in both title and content');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: newEntryTitle,
      content: newEntryContent,
      mood: newEntryMood,
      gratitudeItems: [],
      manifestationGoals: [],
      createdAt: new Date(),
      tags: [],
    };

    setEntries([newEntry, ...entries]);
    setIsAddModalVisible(false);
    setNewEntryTitle('');
    setNewEntryContent('');
    setNewEntryMood(5);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.ocean}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Sacred Journal</Text>
        <Text style={styles.headerSubtitle}>Capture your manifestation journey</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={[styles.addEntryButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddModalVisible(true)}
        >
          <FontAwesome name="plus" size={20} color="white" />
          <Text style={styles.addEntryText}>Write New Entry</Text>
        </TouchableOpacity>

        {entries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.entryCard, { backgroundColor: colors.card }]}
            onPress={() => openEntry(entry)}
          >
            <View style={[styles.entryHeader, { backgroundColor: 'transparent' }]}>
              <View style={styles.entryTitleRow}>
                <Text style={[styles.entryTitle, { color: colors.text }]}>{entry.title}</Text>
                <Text style={styles.moodEmoji}>{moodEmojis[entry.mood - 1]}</Text>
              </View>
              <Text style={[styles.entryDate, { color: colors.text }]}>{formatDate(entry.createdAt)}</Text>
            </View>
            <Text style={[styles.entryPreview, { color: colors.text }]} numberOfLines={2}>
              {entry.content}
            </Text>
            {entry.tags.length > 0 && (
              <View style={[styles.tagContainer, { backgroundColor: 'transparent' }]}>
                {entry.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.tagText, { color: colors.text }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {selectedEntry && (
            <>
              <LinearGradient
                colors={gradients.ocean}
                style={styles.modalHeader}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <FontAwesome name="times" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedEntry.title}</Text>
                <Text style={styles.modalDate}>{formatDate(selectedEntry.createdAt)}</Text>
              </LinearGradient>

              <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={[styles.moodSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood</Text>
                  <View style={styles.moodDisplay}>
                    <Text style={styles.moodEmojiLarge}>{moodEmojis[selectedEntry.mood - 1]}</Text>
                    <Text style={[styles.moodLabel, { color: colors.text }]}>
                      {moodLabels[selectedEntry.mood - 1]}
                    </Text>
                  </View>
                </View>

                <View style={[styles.contentSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Journal Entry</Text>
                  <Text style={[styles.entryFullContent, { color: colors.text }]}>
                    {selectedEntry.content}
                  </Text>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={gradients.ocean}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsAddModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Journal Entry</Text>
          </LinearGradient>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Entry Title</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="How are you feeling today?"
                placeholderTextColor={colors.placeholder}
                value={newEntryTitle}
                onChangeText={setNewEntryTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Your Thoughts</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Write about your manifestations, gratitude, and feelings..."
                placeholderTextColor={colors.placeholder}
                value={newEntryContent}
                onChangeText={setNewEntryContent}
                multiline
                numberOfLines={8}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Mood</Text>
              <View style={styles.moodSelector}>
                {moodEmojis.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.moodOption,
                      {
                        backgroundColor: newEntryMood === index + 1 ? colors.primary : colors.surface,
                      }
                    ]}
                    onPress={() => setNewEntryMood((index + 1) as 1 | 2 | 3 | 4 | 5)}
                  >
                    <Text style={styles.moodOptionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={addNewEntry}
            >
              <Text style={styles.addButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </ScrollView>
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
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
  },
  addEntryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  entryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    marginBottom: 12,
  },
  entryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 24,
  },
  entryDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  entryPreview: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 32,
    paddingTop: 60,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  moodSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  moodDisplay: {
    alignItems: 'center',
  },
  moodEmojiLarge: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentSection: {
    padding: 20,
    borderRadius: 16,
  },
  entryFullContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moodOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodOptionEmoji: {
    fontSize: 24,
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignSelf: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});