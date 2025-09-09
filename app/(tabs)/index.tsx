import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Manifestation Journey</Text>
        <Text style={styles.headerSubtitle}>Welcome to your spiritual practice</Text>
        <FontAwesome name="heart" size={32} color="white" style={styles.headerIcon} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <FontAwesome name="star" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Affirmations</Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Start your day with powerful affirmations that align you with your desires.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <FontAwesome name="heart" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Vision Board</Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Create a visual representation of your dreams and goals.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <FontAwesome name="book" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Journal</Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Record your thoughts, gratitude, and manifestation journey.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <FontAwesome name="play-circle" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Guided Visualization</Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Immerse yourself in powerful visualization exercises.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
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
    marginBottom: 16,
  },
  headerIcon: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
});