import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AffirmationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const affirmations = [
    "I am worthy of all the abundance the universe has to offer",
    "My dreams are manifesting in perfect divine timing",
    "I attract success, happiness, and prosperity into my life",
    "I am aligned with my highest purpose and calling",
    "Love flows to me and through me effortlessly"
  ];

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
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {affirmations.map((affirmation, index) => (
          <View key={index} style={[styles.affirmationCard, { backgroundColor: colors.card }]}>
            <FontAwesome name="heart" size={20} color={colors.primary} style={styles.heartIcon} />
            <Text style={[styles.affirmationText, { color: colors.text }]}>
              {affirmation}
            </Text>
          </View>
        ))}
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  affirmationCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
});