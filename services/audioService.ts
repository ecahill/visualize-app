import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AudioTrack {
  id: string;
  title: string;
  theme: string;
  description: string;
  duration: number;
  uri: string;
  color: string[];
}

export interface ListeningSession {
  trackId: string;
  date: string;
  completed: boolean;
}

// Sample audio tracks (in a real app, these would be actual audio files)
const audioTracks: AudioTrack[] = [
  {
    id: 'abundance_1',
    title: 'Golden Abundance Flow',
    theme: 'Abundance',
    description: 'Attract wealth and prosperity into your life',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#FFD93D', '#FFAB00'],
  },
  {
    id: 'abundance_2',
    title: 'Money Magnetism',
    theme: 'Abundance',
    description: 'Become a magnet for financial opportunities',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#4CAF50', '#81C784'],
  },
  {
    id: 'love_1',
    title: 'Heart Opening Meditation',
    theme: 'Love',
    description: 'Open your heart to divine love and connection',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#FF6B9D', '#FFB4D1'],
  },
  {
    id: 'love_2',
    title: 'Soulmate Attraction',
    theme: 'Love',
    description: 'Align with your perfect romantic partner',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#E91E63', '#F8BBD9'],
  },
  {
    id: 'career_1',
    title: 'Success Visualization',
    theme: 'Career',
    description: 'Step into your dream career and success',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#2196F3', '#64B5F6'],
  },
  {
    id: 'career_2',
    title: 'Leadership Confidence',
    theme: 'Career',
    description: 'Embody confidence and leadership qualities',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#9C27B0', '#BA68C8'],
  },
  {
    id: 'health_1',
    title: 'Radiant Vitality',
    theme: 'Health',
    description: 'Visualize perfect health and energy',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#4CAF50', '#8BC34A'],
  },
  {
    id: 'health_2',
    title: 'Healing Light Meditation',
    theme: 'Health',
    description: 'Channel healing energy throughout your body',
    duration: 68,
    uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
    color: ['#00BCD4', '#4DD0E1'],
  },
];

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentTrack: AudioTrack | null = null;

  async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async loadTrack(track: AudioTrack): Promise<void> {
    try {
      // Unload previous sound if exists
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // For demo purposes, we'll use a simple tone
      // In production, you'd load actual audio files
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/audio/meditation-bell.wav'),
        {
          shouldPlay: false,
          isLooping: false,
          volume: 0.8,
        }
      );

      this.sound = sound;
      this.currentTrack = track;
    } catch (error) {
      console.error('Failed to load track:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.playAsync();
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  }

  async pause(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.pauseAsync();
      } catch (error) {
        console.error('Failed to pause audio:', error);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.setPositionAsync(0);
      } catch (error) {
        console.error('Failed to stop audio:', error);
      }
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(volume);
      } catch (error) {
        console.error('Failed to set volume:', error);
      }
    }
  }

  async unload(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentTrack = null;
      } catch (error) {
        console.error('Failed to unload audio:', error);
      }
    }
  }

  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  // Listening history management
  async saveListeningSession(trackId: string, completed: boolean): Promise<void> {
    try {
      const session: ListeningSession = {
        trackId,
        date: new Date().toISOString(),
        completed,
      };

      const existingHistory = await AsyncStorage.getItem('listening_history');
      const history: ListeningSession[] = existingHistory ? JSON.parse(existingHistory) : [];
      
      history.unshift(session);
      
      // Keep only last 100 sessions
      if (history.length > 100) {
        history.splice(100);
      }

      await AsyncStorage.setItem('listening_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save listening session:', error);
    }
  }

  async getListeningHistory(): Promise<ListeningSession[]> {
    try {
      const history = await AsyncStorage.getItem('listening_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get listening history:', error);
      return [];
    }
  }

  async toggleFavorite(trackId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const isFavorite = favorites.includes(trackId);
      
      let newFavorites: string[];
      if (isFavorite) {
        newFavorites = favorites.filter(id => id !== trackId);
      } else {
        newFavorites = [...favorites, trackId];
      }

      await AsyncStorage.setItem('favorite_tracks', JSON.stringify(newFavorites));
      return !isFavorite;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }

  async getFavorites(): Promise<string[]> {
    try {
      const favorites = await AsyncStorage.getItem('favorite_tracks');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  }

  async isFavorite(trackId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(trackId);
  }

  // Get tracks by theme
  getTracksByTheme(theme: string): AudioTrack[] {
    return audioTracks.filter(track => track.theme === theme);
  }

  // Get all tracks
  getAllTracks(): AudioTrack[] {
    return audioTracks;
  }

  // Get track by ID
  getTrackById(id: string): AudioTrack | undefined {
    return audioTracks.find(track => track.id === id);
  }

  // Get listening stats
  async getListeningStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    favoriteTheme: string;
    totalMinutes: number;
  }> {
    try {
      const history = await this.getListeningHistory();
      const completed = history.filter(session => session.completed);
      
      // Calculate favorite theme
      const themeCounts: { [key: string]: number } = {};
      completed.forEach(session => {
        const track = this.getTrackById(session.trackId);
        if (track) {
          themeCounts[track.theme] = (themeCounts[track.theme] || 0) + 1;
        }
      });

      const favoriteTheme = Object.keys(themeCounts).reduce((a, b) => 
        themeCounts[a] > themeCounts[b] ? a : b, 'Abundance'
      );

      return {
        totalSessions: history.length,
        completedSessions: completed.length,
        favoriteTheme,
        totalMinutes: Math.round((completed.length * 68) / 60),
      };
    } catch (error) {
      console.error('Failed to get listening stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        favoriteTheme: 'Abundance',
        totalMinutes: 0,
      };
    }
  }
}

export const audioService = new AudioService();
export { audioTracks };