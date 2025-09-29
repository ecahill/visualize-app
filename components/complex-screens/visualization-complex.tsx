import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  AppState,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { HapticFeedback } from '../../services/haptics';
import { Audio } from 'expo-av';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AudioTrack, audioService } from '@/services/audioService';
import CircularProgress from '@/components/visualization/CircularProgress';
import BreathingGuide from '@/components/visualization/BreathingGuide';
import TrackSelection from '@/components/visualization/TrackSelection';

const { width, height } = Dimensions.get('window');

const TIMER_DURATION = 68; // 68 seconds

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function VisualizationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [remainingTime, setRemainingTime] = useState(TIMER_DURATION);
  const [isTrackSelectionVisible, setIsTrackSelectionVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const progress = useSharedValue(0);
  const playButtonScale = useSharedValue(1);
  const pauseButtonScale = useSharedValue(1);
  const resetButtonScale = useSharedValue(1);
  const selectButtonScale = useSharedValue(1);
  const completionScale = useSharedValue(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    initializeAudio();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      clearTimer();
      audioService.unload();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      await audioService.initializeAudio();
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  };

  const handleAppStateChange = (nextAppState: any) => {
    appStateRef.current = nextAppState;
    // Audio continues in background due to expo-av background mode
  };

  const startTimer = () => {
    if (!currentTrack) {
      Alert.alert('Please select a visualization track first');
      return;
    }

    HapticFeedback.trigger('impactMedium');
    setIsPlaying(true);
    setIsPaused(false);
    setIsCompleted(false);

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start audio
    audioService.play();
  };

  const pauseTimer = () => {
    HapticFeedback.trigger('impactLight');
    setIsPaused(true);
    clearTimer();
    audioService.pause();
  };

  const resumeTimer = () => {
    HapticFeedback.trigger('impactLight');
    setIsPaused(false);
    startTimer();
  };

  const resetTimer = () => {
    HapticFeedback.trigger('impactMedium');
    setIsPlaying(false);
    setIsPaused(false);
    setRemainingTime(TIMER_DURATION);
    setIsCompleted(false);
    progress.value = withTiming(0, { duration: 500 });
    completionScale.value = withTiming(0, { duration: 300 });
    clearTimer();
    audioService.stop();
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimerComplete = async () => {
    HapticFeedback.trigger('notificationSuccess');
    setIsPlaying(false);
    setIsCompleted(true);
    clearTimer();

    // Save listening session
    if (currentTrack) {
      await audioService.saveListeningSession(currentTrack.id, true);
    }

    // Completion animation
    completionScale.value = withSpring(1, { duration: 800 });

    // Show completion message
    setTimeout(() => {
      Alert.alert(
        '✨ Visualization Complete!',
        'You\'ve successfully completed your 68-second manifestation. Feel the reality of your desire!',
        [{ text: 'Amazing!', onPress: () => resetTimer() }]
      );
    }, 1000);
  };

  const handleTrackSelect = async (track: AudioTrack) => {
    try {
      await audioService.loadTrack(track);
      setCurrentTrack(track);
      resetTimer();
      HapticFeedback.trigger('impactMedium');
    } catch (error) {
      console.error('Failed to load track:', error);
      Alert.alert('Error', 'Failed to load audio track');
    }
  };

  // Update progress based on remaining time
  useEffect(() => {
    const progressValue = 1 - (remainingTime / TIMER_DURATION);
    progress.value = withTiming(progressValue, { duration: 1000 });
  }, [remainingTime]);

  const createButtonPressAnimation = (scaleValue: Animated.SharedValue<number>, action: () => void) => {
    return () => {
      scaleValue.value = withSequence(
        withSpring(0.9, { duration: 100 }),
        withSpring(1, { duration: 100 })
      );
      setTimeout(action, 150);
    };
  };

  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const pauseButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseButtonScale.value }],
  }));

  const resetButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resetButtonScale.value }],
  }));

  const selectButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectButtonScale.value }],
  }));

  const completionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completionScale.value }],
    opacity: completionScale.value,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={currentTrack ? currentTrack.color as any : ['#F8BBD9', '#E4C1F9', '#FFD93D']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.6, 1]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Visualization Timer ✨</Text>
          <Text style={styles.headerSubtitle}>
            {currentTrack ? currentTrack.title : 'Select a track to begin'}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.progressContainer}>
            <CircularProgress
              size={280}
              strokeWidth={8}
              progress={progress}
            />
            
            <View style={styles.timerContent}>
              <BreathingGuide 
                isActive={isPlaying && !isPaused} 
                size={180}
              />
              
              <Text style={styles.timeText}>
                {formatTime(remainingTime)}
              </Text>
              
              {currentTrack && (
                <Text style={styles.trackText}>
                  {currentTrack.description}
                </Text>
              )}
            </View>

            <Animated.View style={[styles.completionOverlay, completionStyle]}>
              <Text style={styles.completionEmoji}>🎉</Text>
              <Text style={styles.completionText}>Complete!</Text>
            </Animated.View>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <AnimatedTouchableOpacity
            style={[styles.selectButton, selectButtonStyle]}
            onPress={createButtonPressAnimation(
              selectButtonScale,
              () => setIsTrackSelectionVisible(true)
            )}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.buttonGradient}
            >
              <FontAwesome name="music" size={20} color="white" />
              <Text style={styles.selectButtonText}>Select Track</Text>
            </LinearGradient>
          </AnimatedTouchableOpacity>

          <View style={styles.mainControls}>
            {!isPlaying && !isPaused ? (
              <AnimatedTouchableOpacity
                style={[styles.playButton, playButtonStyle]}
                onPress={createButtonPressAnimation(playButtonScale, startTimer)}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.mainButtonGradient}
                >
                  <FontAwesome name="play" size={32} color="white" />
                </LinearGradient>
              </AnimatedTouchableOpacity>
            ) : isPaused ? (
              <AnimatedTouchableOpacity
                style={[styles.playButton, playButtonStyle]}
                onPress={createButtonPressAnimation(playButtonScale, resumeTimer)}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.mainButtonGradient}
                >
                  <FontAwesome name="play" size={32} color="white" />
                </LinearGradient>
              </AnimatedTouchableOpacity>
            ) : (
              <AnimatedTouchableOpacity
                style={[styles.pauseButton, pauseButtonStyle]}
                onPress={createButtonPressAnimation(pauseButtonScale, pauseTimer)}
              >
                <LinearGradient
                  colors={['#FF9800', '#FFB74D']}
                  style={styles.mainButtonGradient}
                >
                  <FontAwesome name="pause" size={32} color="white" />
                </LinearGradient>
              </AnimatedTouchableOpacity>
            )}

            <AnimatedTouchableOpacity
              style={[styles.resetButton, resetButtonStyle]}
              onPress={createButtonPressAnimation(resetButtonScale, resetTimer)}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.resetButtonGradient}
              >
                <FontAwesome name="refresh" size={24} color="white" />
              </LinearGradient>
            </AnimatedTouchableOpacity>
          </View>
        </View>

        <TrackSelection
          visible={isTrackSelectionVisible}
          onClose={() => setIsTrackSelectionVisible(false)}
          onSelectTrack={handleTrackSelect}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    width: width,
    height: height,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  trackText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  completionOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 140,
    width: 280,
    height: 280,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  controlsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    backgroundColor: 'transparent',
  },
  selectButton: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: 'transparent',
  },
  playButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pauseButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});