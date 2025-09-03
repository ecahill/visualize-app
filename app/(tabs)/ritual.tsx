import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { RitualTemplate } from '@/types';

const ritualTemplates: RitualTemplate[] = [
  {
    id: '1',
    name: 'Morning Goddess Ritual',
    description: 'Start your day with intention and divine feminine energy',
    duration: 15,
    category: 'meditation',
    difficulty: 'beginner',
    steps: [
      'Find a quiet space and sit comfortably',
      'Take 5 deep breaths, feeling gratitude for this new day',
      'Set 3 intentions for the day ahead',
      'Visualize your goals as already achieved',
      'Express gratitude for what you are manifesting',
    ],
  },
  {
    id: '2',
    name: 'Abundance Visualization',
    description: 'Attract prosperity and abundance into your life',
    duration: 20,
    category: 'visualization',
    difficulty: 'intermediate',
    steps: [
      'Close your eyes and breathe deeply',
      'Visualize yourself living abundantly',
      'Feel the emotions of having everything you desire',
      'See money flowing to you easily and effortlessly',
      'Thank the universe for your abundance',
    ],
  },
  {
    id: '3',
    name: 'Love Magnetism Practice',
    description: 'Align with love energy and attract your soulmate',
    duration: 25,
    category: 'visualization',
    difficulty: 'intermediate',
    steps: [
      'Place hand on heart and breathe deeply',
      'Visualize your ideal relationship',
      'Feel the love and joy in your heart',
      'Send love to yourself first',
      'Affirm: "I am worthy of divine love"',
    ],
  },
];

export default function RitualScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedRitual, setSelectedRitual] = useState<RitualTemplate | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRitualActive, setIsRitualActive] = useState(false);

  const startRitual = (ritual: RitualTemplate) => {
    setSelectedRitual(ritual);
    setCurrentStep(0);
    setIsRitualActive(true);
    setIsModalVisible(true);
  };

  const nextStep = () => {
    if (selectedRitual && currentStep < selectedRitual.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeRitual();
    }
  };

  const completeRitual = () => {
    setIsModalVisible(false);
    setIsRitualActive(false);
    setSelectedRitual(null);
    setCurrentStep(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return gradients.success;
      case 'intermediate':
        return gradients.secondary;
      case 'advanced':
        return gradients.primary;
      default:
        return gradients.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Daily Rituals</Text>
        <Text style={styles.headerSubtitle}>Choose your sacred practice for today</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {ritualTemplates.map((ritual) => (
          <TouchableOpacity
            key={ritual.id}
            style={[styles.ritualCard, { backgroundColor: colors.card }]}
            onPress={() => startRitual(ritual)}
          >
            <View style={[styles.ritualHeader, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.ritualName, { color: colors.text }]}>{ritual.name}</Text>
              <View style={styles.ritualMeta}>
                <LinearGradient
                  colors={getDifficultyColor(ritual.difficulty)}
                  style={styles.difficultyBadge}
                >
                  <Text style={styles.difficultyText}>{ritual.difficulty}</Text>
                </LinearGradient>
                <Text style={[styles.durationText, { color: colors.text }]}>{ritual.duration} min</Text>
              </View>
            </View>
            <Text style={[styles.ritualDescription, { color: colors.text }]}>{ritual.description}</Text>
            <View style={[styles.ritualFooter, { backgroundColor: 'transparent' }]}>
              <FontAwesome name={ritual.category === 'meditation' ? 'leaf' : 'eye'} size={16} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>{ritual.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {selectedRitual && (
            <>
              <LinearGradient
                colors={gradients.primary}
                style={styles.modalHeader}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <FontAwesome name="times" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedRitual.name}</Text>
                <Text style={styles.stepCounter}>
                  Step {currentStep + 1} of {selectedRitual.steps.length}
                </Text>
              </LinearGradient>

              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.stepText, { color: colors.text }]}>
                    {selectedRitual.steps[currentStep]}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: colors.primary }]}
                  onPress={nextStep}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === selectedRitual.steps.length - 1 ? 'Complete' : 'Next Step'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
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
  ritualCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ritualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ritualName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  ritualMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  ritualDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  ritualFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 32,
    paddingTop: 60,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepCounter: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  stepCard: {
    padding: 32,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignSelf: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});