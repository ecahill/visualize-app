import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { JournalEntry } from '@/services/database';

const { width } = Dimensions.get('window');

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
  onDelete?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const moodEmojiMap: { [key: string]: string } = {
  'Joyful': '😊',
  'Grateful': '🥰', 
  'Inspired': '✨',
  'Magical': '💫',
  'Confident': '🌟',
  'Passionate': '🔥',
  'Loving': '💖',
  'Transformed': '🦋',
};

export default function JournalEntryCard({ entry, onPress, onDelete }: JournalEntryCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const cardScale = useSharedValue(1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const getPreviewText = (content: string) => {
    const plainText = stripHtml(content);
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
  };

  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    cardScale.value = withSpring(0.97, { duration: 100 });
    setTimeout(() => {
      cardScale.value = withSpring(1, { duration: 100 });
      onPress();
    }, 150);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const getCategoryGradient = () => {
    switch (entry.category) {
      case 'Gratitude':
        return ['#FF6B9D', '#FFB4D1'];
      case 'Manifestation':
        return ['#9D4EDD', '#C77DFF'];
      case 'Abundance':
        return ['#4ECDC4', '#7FCDCD'];
      default:
        return ['#E4C1F9', '#F8BBD9'];
    }
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
        style={styles.cardGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{entry.title}</Text>
            <View style={styles.metadata}>
              <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
              <Text style={styles.time}>{formatTime(entry.created_at)}</Text>
            </View>
          </View>
          
          <View style={styles.moodContainer}>
            <Text style={styles.moodEmoji}>
              {moodEmojiMap[entry.mood] || '😊'}
            </Text>
            <Text style={styles.moodLabel}>{entry.mood}</Text>
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <LinearGradient
            colors={getCategoryGradient()}
            style={styles.categoryGradient}
          >
            <Text style={styles.categoryText}>{entry.category}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.preview}>
          {getPreviewText(entry.content)}
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="eye" size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Read</Text>
          </TouchableOpacity>
          
          {onDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                HapticFeedback.trigger('impactMedium');
                onDelete();
              }}
            >
              <FontAwesome name="trash" size={16} color="#FF4757" />
              <Text style={[styles.actionText, { color: '#FF4757' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  date: {
    fontSize: 12,
    color: '#636E72',
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#636E72',
  },
  moodContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: '#636E72',
    fontWeight: '500',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    color: '#636E72',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 187, 217, 0.2)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});