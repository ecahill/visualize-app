import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function AffirmationsScreen() {

  const affirmations = [
    "I am worthy of all the abundance the universe has to offer",
    "My dreams are manifesting in perfect divine timing",
    "I attract success, happiness, and prosperity into my life",
    "I am aligned with my highest purpose and calling",
    "Love flows to me and through me effortlessly"
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>❤️ Affirmations</Text>
        <Text style={styles.subtitle}>Speak your truth into existence</Text>
      </View>

      <View style={styles.content}>
        {affirmations.map((affirmation, index) => (
          <View key={index} style={styles.affirmationCard}>
            <Text style={styles.heartIcon}>❤️</Text>
            <Text style={styles.affirmationText}>
              {affirmation}
            </Text>
          </View>
        ))}
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add New Affirmation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  affirmationCard: {
    backgroundColor: 'white',
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
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
    color: '#333',
  },
  button: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});