import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { HapticFeedback } from '../../services/haptics';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface RichTextEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
}

const moodEmojis = [
  { emoji: '😊', mood: 'Joyful', color: '#FFD93D' },
  { emoji: '🥰', mood: 'Grateful', color: '#FF6B9D' },
  { emoji: '✨', mood: 'Inspired', color: '#C44AFF' },
  { emoji: '💫', mood: 'Magical', color: '#4ECDC4' },
  { emoji: '🌟', mood: 'Confident', color: '#45B7D1' },
  { emoji: '🔥', mood: 'Passionate', color: '#FF6B35' },
  { emoji: '💖', mood: 'Loving', color: '#FF69B4' },
  { emoji: '🦋', mood: 'Transformed', color: '#9D4EDD' },
];

export default function RichTextEditor({ 
  initialContent = '', 
  onContentChange, 
  placeholder = "Begin scripting your manifestation..."
}: RichTextEditorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const richEditor = useRef<RichEditor>(null);
  const [selectedMood, setSelectedMood] = useState<string>('');

  const handleMoodSelect = (mood: string) => {
    HapticFeedback.trigger('impactLight');
    setSelectedMood(mood);
  };

  const getSelectedMoodData = () => {
    return moodEmojis.find(m => m.mood === selectedMood);
  };

  const insertQuote = () => {
    HapticFeedback.trigger('impactLight');
    richEditor.current?.insertText('"');
  };

  const insertAffirmation = () => {
    HapticFeedback.trigger('impactLight');
    richEditor.current?.insertText('I am ');
  };

  const insertGratitude = () => {
    HapticFeedback.trigger('impactLight');
    richEditor.current?.insertText('I am so grateful for ');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['rgba(248, 187, 217, 0.1)', 'rgba(228, 193, 249, 0.1)']}
        style={styles.editorContainer}
      >
        <ScrollView style={styles.moodSelector} horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.moodLabel}>How are you feeling?</Text>
          {moodEmojis.map((mood) => (
            <TouchableOpacity
              key={mood.mood}
              style={[
                styles.moodButton,
                selectedMood === mood.mood && { 
                  backgroundColor: mood.color,
                  transform: [{ scale: 1.1 }] 
                }
              ]}
              onPress={() => handleMoodSelect(mood.mood)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[
                styles.moodText,
                selectedMood === mood.mood && { color: 'white', fontWeight: 'bold' }
              ]}>
                {mood.mood}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <RichEditor
          ref={richEditor}
          style={styles.richEditor}
          initialContentHTML={initialContent}
          onChange={onContentChange}
          placeholder={placeholder}
          editorStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#2D3436',
            contentCSSText: 'font-size: 16px; line-height: 24px; padding: 20px;',
          }}
          useContainer={false}
        />

        <View style={styles.toolbarContainer}>
          <RichToolbar
            editor={richEditor}
            style={styles.richToolbar}
            flatContainerStyle={styles.toolbarContent}
            selectedIconTint={colors.primary}
            iconTint="#666"
            iconSize={20}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.removeFormat,
              actions.alignLeft,
              actions.alignCenter,
              actions.alignRight,
              actions.undo,
              actions.redo,
            ]}
            iconMap={{
              [actions.setBold]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="bold" size={20} color={tintColor} />
              ),
              [actions.setItalic]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="italic" size={20} color={tintColor} />
              ),
              [actions.setUnderline]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="underline" size={20} color={tintColor} />
              ),
              [actions.removeFormat]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="remove" size={20} color={tintColor} />
              ),
              [actions.alignLeft]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="align-left" size={20} color={tintColor} />
              ),
              [actions.alignCenter]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="align-center" size={20} color={tintColor} />
              ),
              [actions.alignRight]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="align-right" size={20} color={tintColor} />
              ),
              [actions.undo]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="undo" size={20} color={tintColor} />
              ),
              [actions.redo]: ({ tintColor }: { tintColor: string }) => (
                <FontAwesome name="repeat" size={20} color={tintColor} />
              ),
            }}
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsContainer}
            contentContainerStyle={styles.quickActionsContent}
          >
            <TouchableOpacity style={styles.quickAction} onPress={insertQuote}>
              <FontAwesome name="quote-left" size={16} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>Quote</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={insertAffirmation}>
              <FontAwesome name="heart" size={16} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>I am</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={insertGratitude}>
              <FontAwesome name="star" size={16} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>Grateful</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  moodSelector: {
    maxHeight: 80,
    marginBottom: 16,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    alignSelf: 'center',
    marginRight: 16,
    marginTop: 15,
  },
  moodButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  richEditor: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 16,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolbarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  richToolbar: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  toolbarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionsContainer: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 50,
  },
  quickActionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 187, 217, 0.2)',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});