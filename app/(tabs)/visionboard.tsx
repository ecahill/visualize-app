import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function VisionBoard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.sunset}
        style={styles.header}
      >
        <FontAwesome name="image" size={48} color="white" />
        <Text style={styles.headerTitle}>Vision Board</Text>
        <Text style={styles.headerSubtitle}>Visualize your dreams</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 32, paddingTop: 80, alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 16 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', marginTop: 8 },
});