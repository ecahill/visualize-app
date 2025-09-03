import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.welcomeText}>Welcome Beautiful Soul ✨</Text>
        <Text style={styles.dateText}>{currentDate}</Text>
        <Text style={styles.manifestText}>Today is perfect for manifesting your dreams</Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
          <FontAwesome name="fire" size={32} color={colors.primary} />
          <View style={styles.streakInfo}>
            <Text style={[styles.streakNumber, { color: colors.text }]}>7</Text>
            <Text style={[styles.streakLabel, { color: colors.text }]}>day streak</Text>
          </View>
        </View>

        <View style={[styles.quickActions, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={gradients.secondary}
                style={styles.actionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome name="sun-o" size={24} color="white" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>Morning Ritual</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={gradients.success}
                style={styles.actionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome name="heart" size={24} color="white" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>Daily Affirmation</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={gradients.ocean}
                style={styles.actionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome name="book" size={24} color="white" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={gradients.sunset}
                style={styles.actionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome name="picture-o" size={24} color="white" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>Vision Board</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.dailyQuote, { backgroundColor: colors.card }]}>
          <FontAwesome name="quote-left" size={20} color={colors.primary} style={styles.quoteIcon} />
          <Text style={[styles.quoteText, { color: colors.text }]}>
            "The universe is conspiring to help you achieve your dreams. Trust the process and watch magic unfold."
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    padding: 32,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  manifestText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    padding: 20,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakInfo: {
    marginLeft: 16,
    backgroundColor: 'transparent',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dailyQuote: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteIcon: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
