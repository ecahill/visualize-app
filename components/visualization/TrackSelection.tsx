import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
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
import { AudioTrack, audioService, audioTracks } from '@/services/audioService';

const { width } = Dimensions.get('window');

interface TrackSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelectTrack: (track: AudioTrack) => void;
}

const themes = [
  {
    name: 'Abundance',
    icon: 'diamond',
    color: ['#FFD93D', '#FFAB00'] as const,
    description: 'Attract wealth and prosperity',
  },
  {
    name: 'Love',
    icon: 'heart',
    color: ['#FF6B9D', '#FFB4D1'] as const,
    description: 'Open your heart to love',
  },
  {
    name: 'Career',
    icon: 'briefcase',
    color: ['#2196F3', '#64B5F6'] as const,
    description: 'Manifest career success',
  },
  {
    name: 'Health',
    icon: 'leaf',
    color: ['#4CAF50', '#81C784'] as const,
    description: 'Radiate perfect health',
  },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function TrackSelection({ visible, onClose, onSelectTrack }: TrackSelectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Abundance');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    favoriteTheme: 'Abundance',
    totalMinutes: 0,
  });

  const cardScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      loadFavorites();
      loadStats();
    }
  }, [visible]);

  const loadFavorites = async () => {
    const userFavorites = await audioService.getFavorites();
    setFavorites(userFavorites);
  };

  const loadStats = async () => {
    const listeningStats = await audioService.getListeningStats();
    setStats(listeningStats);
  };

  const handleThemeSelect = (themeName: string) => {
    HapticFeedback.trigger('impactLight');
    setSelectedTheme(themeName);
  };

  const handleTrackSelect = async (track: AudioTrack) => {
    HapticFeedback.trigger('impactMedium');
    onSelectTrack(track);
    onClose();
  };

  const toggleFavorite = async (trackId: string, event: any) => {
    event.stopPropagation();
    HapticFeedback.trigger('impactLight');
    
    const newIsFavorite = await audioService.toggleFavorite(trackId);
    await loadFavorites();
  };

  const createPressAnimation = () => {
    cardScale.value = withSpring(0.95, { duration: 100 });
    setTimeout(() => {
      cardScale.value = withSpring(1, { duration: 100 });
    }, 150);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const filteredTracks = audioTracks.filter(track => track.theme === selectedTheme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#F8BBD9', '#E4C1F9']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Journey</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
              style={styles.statsGradient}
            >
              <Text style={styles.statsTitle}>Your Journey</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.completedSessions}</Text>
                  <Text style={styles.statLabel}>Sessions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalMinutes}</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.favoriteTheme}</Text>
                  <Text style={styles.statLabel}>Top Theme</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.themeHeader}>Choose Your Focus</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.themesContainer}
            contentContainerStyle={styles.themesContent}
          >
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.name}
                style={[
                  styles.themeCard,
                  selectedTheme === theme.name && styles.selectedThemeCard
                ]}
                onPress={() => handleThemeSelect(theme.name)}
              >
                <LinearGradient
                  colors={theme.color as any}
                  style={styles.themeGradient}
                >
                  <FontAwesome 
                    name={theme.icon as React.ComponentProps<typeof FontAwesome>['name']} 
                    size={28} 
                    color="white" 
                  />
                  <Text style={styles.themeName}>{theme.name}</Text>
                  <Text style={styles.themeDescription}>{theme.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.tracksSection}>
            <Text style={styles.tracksHeader}>
              {selectedTheme} Meditations
            </Text>
            
            <View style={styles.tracksList}>
              {filteredTracks.map((track) => (
                <AnimatedTouchableOpacity
                  key={track.id}
                  style={[styles.trackCard, animatedStyle]}
                  onPress={() => {
                    createPressAnimation();
                    setTimeout(() => handleTrackSelect(track), 150);
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.trackGradient}
                  >
                    <View style={styles.trackHeader}>
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{track.title}</Text>
                        <Text style={styles.trackDescription}>{track.description}</Text>
                        <View style={styles.trackMeta}>
                          <FontAwesome name="clock-o" size={14} color="#636E72" />
                          <Text style={styles.trackDuration}>68 seconds</Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={(e) => toggleFavorite(track.id, e)}
                      >
                        <FontAwesome
                          name={favorites.includes(track.id) ? 'heart' : 'heart-o'}
                          size={24}
                          color={favorites.includes(track.id) ? '#FF4757' : '#636E72'}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.trackFooter}>
                      <LinearGradient
                        colors={track.color as any}
                        style={styles.playButton}
                      >
                        <FontAwesome name="play" size={16} color="white" />
                      </LinearGradient>
                      <Text style={styles.trackAction}>Start Visualization</Text>
                    </View>
                  </LinearGradient>
                </AnimatedTouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGradient: {
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '600',
  },
  themeHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  themesContainer: {
    marginBottom: 32,
  },
  themesContent: {
    paddingHorizontal: 10,
  },
  themeCard: {
    width: width * 0.6,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedThemeCard: {
    transform: [{ scale: 1.02 }],
  },
  themeGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  themeDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  tracksSection: {
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  tracksHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  tracksList: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  trackCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trackGradient: {
    borderRadius: 16,
    padding: 20,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 6,
  },
  trackDescription: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
    marginBottom: 8,
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  trackDuration: {
    fontSize: 12,
    color: '#636E72',
    marginLeft: 6,
    fontWeight: '500',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 187, 217, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
});