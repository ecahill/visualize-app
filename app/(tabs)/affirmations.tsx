import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Affirmation } from '@/types';

const { width } = Dimensions.get('window');

const affirmationsData: Affirmation[] = [
  {
    id: '1',
    text: 'I am worthy of all the love and abundance the universe has to offer',
    category: 'love',
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    text: 'Money flows to me easily and effortlessly from multiple sources',
    category: 'abundance',
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    text: 'I radiate confidence and attract success in everything I do',
    category: 'confidence',
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '4',
    text: 'My body is healthy, strong, and vibrant with healing energy',
    category: 'health',
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '5',
    text: 'I am aligned with my highest purpose and living my dream life',
    category: 'success',
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '6',
    text: 'Every challenge I face helps me grow stronger and wiser',
    category: 'growth',
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '7',
    text: 'I trust the divine timing of my life and embrace each moment',
    category: 'growth',
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '8',
    text: 'I am a magnet for positive opportunities and amazing people',
    category: 'success',
    isFavorite: false,
    createdAt: new Date(),
  },
];

const categoryColors = {
  love: gradients.sunset,
  abundance: gradients.secondary,
  success: gradients.primary,
  health: gradients.success,
  confidence: gradients.ocean,
  growth: gradients.primary,
};

export default function AffirmationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [affirmations, setAffirmations] = useState<Affirmation[]>(affirmationsData);
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation>(affirmationsData[0]);
  const [selectedCategory, setSelectedCategory] = useState<Affirmation['category'] | 'all'>('all');

  const categories: { key: Affirmation['category'] | 'all', label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'love', label: 'Love' },
    { key: 'abundance', label: 'Abundance' },
    { key: 'success', label: 'Success' },
    { key: 'health', label: 'Health' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'growth', label: 'Growth' },
  ];

  const filteredAffirmations = selectedCategory === 'all' 
    ? affirmations 
    : affirmations.filter(a => a.category === selectedCategory);

  const getRandomAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * filteredAffirmations.length);
    setCurrentAffirmation(filteredAffirmations[randomIndex]);
  };

  const toggleFavorite = (id: string) => {
    setAffirmations(items =>
      items.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  useEffect(() => {
    if (filteredAffirmations.length > 0) {
      setCurrentAffirmation(filteredAffirmations[0]);
    }
  }, [selectedCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.sunset}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Daily Affirmations</Text>
        <Text style={styles.headerSubtitle}>Speak your truth into existence</Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={categoryColors[currentAffirmation.category]}
          style={styles.dailyCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome name="quote-left" size={24} color="white" style={styles.quoteIcon} />
          <Text style={styles.dailyAffirmation}>{currentAffirmation.text}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={getRandomAffirmation}>
            <FontAwesome name="refresh" size={20} color="white" />
            <Text style={styles.refreshText}>New Affirmation</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={[styles.categoryFilter, { backgroundColor: colors.background }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: selectedCategory === category.key ? colors.primary : colors.surface,
                  }
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
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

        <ScrollView style={styles.affirmationsList}>
          {filteredAffirmations.map((affirmation) => (
            <TouchableOpacity
              key={affirmation.id}
              style={[styles.affirmationCard, { backgroundColor: colors.card }]}
              onPress={() => setCurrentAffirmation(affirmation)}
            >
              <View style={[styles.affirmationHeader, { backgroundColor: 'transparent' }]}>
                <LinearGradient
                  colors={categoryColors[affirmation.category]}
                  style={styles.categoryDot}
                />
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(affirmation.id)}
                >
                  <FontAwesome
                    name={affirmation.isFavorite ? 'heart' : 'heart-o'}
                    size={20}
                    color={affirmation.isFavorite ? colors.primary : colors.text}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.affirmationText, { color: colors.text }]}>
                {affirmation.text}
              </Text>
              <Text style={[styles.categoryLabel, { color: colors.primary }]}>
                {affirmation.category.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
  dailyCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  quoteIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  dailyAffirmation: {
    fontSize: 18,
    lineHeight: 28,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  refreshText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  categoryFilter: {
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  affirmationsList: {
    flex: 1,
  },
  affirmationCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  affirmationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  favoriteButton: {
    padding: 4,
  },
  affirmationText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});