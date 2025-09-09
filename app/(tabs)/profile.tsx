import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ProfileScreen() {
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
        <FontAwesome name="user-circle" size={80} color="white" style={styles.avatar} />
        <Text style={styles.headerTitle}>Beautiful Soul</Text>
        <Text style={styles.headerSubtitle}>Your manifestation journey</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <FontAwesome name="star" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>7</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Days Active</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <FontAwesome name="heart" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>42</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Affirmations Read</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <FontAwesome name="book" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>5</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Journal Entries</Text>
        </View>
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
    paddingTop: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});