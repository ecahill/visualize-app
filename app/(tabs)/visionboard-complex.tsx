import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  Dimensions,
  StatusBar,
  Image,
  PanResponder
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { PinchGestureHandler, State, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HapticFeedback } from '../../services/haptics';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 2;

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

interface VisionImage {
  id: string;
  uri: string;
  affirmation: string;
  position: { x: number; y: number };
  createdAt: Date;
}

const defaultAffirmations = [
  "This or something better is mine now",
  "I am grateful for this manifestation",
  "I attract this with ease and joy",
  "This is already mine in the quantum field",
  "I deserve all of this and more",
  "The universe delivers this to me perfectly",
  "I am aligned with this reality",
  "This flows to me effortlessly",
];

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function VisionBoardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [visionImages, setVisionImages] = useState<VisionImage[]>([]);
  const [isFlashMode, setIsFlashMode] = useState(false);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<VisionImage | null>(null);
  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAffirmation, setEditingAffirmation] = useState('');
  
  const scale = useSharedValue(1);
  const kenBurnsScale = useSharedValue(1);
  const kenBurnsX = useSharedValue(0);
  const kenBurnsY = useSharedValue(0);
  const flashOpacity = useSharedValue(1);
  
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadVisionImages = async () => {
    try {
      const savedImages = await AsyncStorage.getItem('vision_images');
      if (savedImages) {
        setVisionImages(JSON.parse(savedImages));
      }
    } catch (error) {
      console.error('Failed to load vision images:', error);
    }
  };

  const saveVisionImages = async (images: VisionImage[]) => {
    try {
      await AsyncStorage.setItem('vision_images', JSON.stringify(images));
    } catch (error) {
      console.error('Failed to save vision images:', error);
    }
  };

  useEffect(() => {
    loadVisionImages();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await saveImageToLocal(result.assets[0].uri);
      HapticFeedback.trigger('notificationSuccess', hapticOptions);
    }
  };

  const saveImageToLocal = async (uri: string) => {
    try {
      const filename = `vision_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: localUri,
      });

      const randomAffirmation = defaultAffirmations[Math.floor(Math.random() * defaultAffirmations.length)];
      
      const newImage: VisionImage = {
        id: Date.now().toString(),
        uri: localUri,
        affirmation: randomAffirmation,
        position: { x: 0.5, y: 0.8 },
        createdAt: new Date(),
      };

      const updatedImages = [...visionImages, newImage];
      setVisionImages(updatedImages);
      await saveVisionImages(updatedImages);
      
    } catch (error) {
      console.error('Failed to save image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const deleteImage = async (id: string) => {
    const updatedImages = visionImages.filter(img => img.id !== id);
    setVisionImages(updatedImages);
    await saveVisionImages(updatedImages);
    HapticFeedback.trigger('impactLight', hapticOptions);
  };

  const startFlashMode = () => {
    if (visionImages.length === 0) {
      Alert.alert('No Images', 'Add some vision images first!');
      return;
    }
    
    setIsFlashMode(true);
    setCurrentFlashIndex(0);
    startKenBurnsEffect();
    HapticFeedback.trigger('impactMedium', hapticOptions);
    
    flashIntervalRef.current = setInterval(() => {
      setCurrentFlashIndex(prev => {
        const next = (prev + 1) % visionImages.length;
        runOnJS(startKenBurnsEffect)();
        return next;
      });
    }, 4000);
  };

  const stopFlashMode = () => {
    setIsFlashMode(false);
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
      flashIntervalRef.current = null;
    }
    resetKenBurns();
  };

  const startKenBurnsEffect = () => {
    kenBurnsScale.value = withTiming(1.1, { duration: 4000 });
    kenBurnsX.value = withTiming(Math.random() * 20 - 10, { duration: 4000 });
    kenBurnsY.value = withTiming(Math.random() * 20 - 10, { duration: 4000 });
  };

  const resetKenBurns = () => {
    kenBurnsScale.value = withTiming(1, { duration: 300 });
    kenBurnsX.value = withTiming(0, { duration: 300 });
    kenBurnsY.value = withTiming(0, { duration: 300 });
  };

  const kenBurnsStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: kenBurnsScale.value },
      { translateX: kenBurnsX.value },
      { translateY: kenBurnsY.value },
    ],
  }));

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: () => {
      runOnJS(HapticFeedback.trigger)('impactLight', hapticOptions);
    },
    onActive: (event) => {
      scale.value = Math.max(0.5, Math.min(event.scale, 3));
    },
    onEnd: () => {
      scale.value = withSpring(1);
    },
  });

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const updateImageAffirmation = (id: string, newAffirmation: string) => {
    const updatedImages = visionImages.map(img =>
      img.id === id ? { ...img, affirmation: newAffirmation } : img
    );
    setVisionImages(updatedImages);
    saveVisionImages(updatedImages);
  };

  const renderImageItem = ({ item }: { item: VisionImage }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => {
        setSelectedImage(item);
        setIsZoomModalVisible(true);
        HapticFeedback.trigger('impactLight', hapticOptions);
      }}
      onLongPress={() => {
        setSelectedImage(item);
        setEditingAffirmation(item.affirmation);
        setIsEditModalVisible(true);
        HapticFeedback.trigger('impactMedium', hapticOptions);
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.visionImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.imageOverlay}
      >
        <Text style={styles.imageAffirmation} numberOfLines={2}>
          {item.affirmation}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderAddButton = () => (
    <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.addButtonGradient}
      >
        <FontAwesome name="plus" size={32} color="white" />
        <Text style={styles.addButtonText}>Add Vision</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Vision Board</Text>
        <Text style={styles.headerSubtitle}>Visualize your dreams into reality</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={startFlashMode}
          >
            <FontAwesome name="play" size={16} color="white" />
            <Text style={styles.flashButtonText}>Flash Mode</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={[...visionImages, { id: 'add-button' } as any]}
        renderItem={({ item }) => 
          item.id === 'add-button' ? renderAddButton() : renderImageItem({ item })
        }
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Flash Mode Modal */}
      <Modal
        visible={isFlashMode}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.flashContainer}>
          <StatusBar hidden />
          
          {visionImages.length > 0 && (
            <AnimatedImage
              source={{ uri: visionImages[currentFlashIndex].uri }}
              style={[styles.flashImage, kenBurnsStyle]}
              resizeMode="cover"
            />
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.flashOverlay}
          >
            <Text style={styles.flashAffirmation}>
              {visionImages[currentFlashIndex]?.affirmation}
            </Text>
          </LinearGradient>

          <TouchableOpacity
            style={styles.closeFlashButton}
            onPress={stopFlashMode}
          >
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Zoom Modal */}
      <Modal
        visible={isZoomModalVisible}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.zoomContainer}>
          <StatusBar hidden />
          
          {selectedImage && (
            <PinchGestureHandler onGestureEvent={pinchHandler}>
              <Animated.View style={[styles.zoomImageContainer, zoomStyle]}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.zoomImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </PinchGestureHandler>
          )}

          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={[styles.zoomButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (selectedImage) {
                  setEditingAffirmation(selectedImage.affirmation);
                  setIsEditModalVisible(true);
                  setIsZoomModalVisible(false);
                }
              }}
            >
              <FontAwesome name="edit" size={16} color="white" />
              <Text style={styles.zoomButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.zoomButton, { backgroundColor: '#FF3B30' }]}
              onPress={() => {
                if (selectedImage) {
                  Alert.alert(
                    'Delete Image',
                    'Are you sure you want to remove this vision?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: () => {
                          deleteImage(selectedImage.id);
                          setIsZoomModalVisible(false);
                        }
                      },
                    ]
                  );
                }
              }}
            >
              <FontAwesome name="trash" size={16} color="white" />
              <Text style={styles.zoomButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeZoomButton}
            onPress={() => setIsZoomModalVisible(false)}
          >
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Affirmation Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsEditModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Affirmation</Text>
          </LinearGradient>

          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Affirmation Text</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter your powerful affirmation..."
                placeholderTextColor={colors.placeholder}
                value={editingAffirmation}
                onChangeText={setEditingAffirmation}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Quick Affirmations</Text>
              <View style={styles.quickAffirmations}>
                {defaultAffirmations.map((affirmation, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickAffirmationButton, { backgroundColor: colors.surface }]}
                    onPress={() => setEditingAffirmation(affirmation)}
                  >
                    <Text style={[styles.quickAffirmationText, { color: colors.text }]}>
                      {affirmation}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (selectedImage && editingAffirmation.trim()) {
                  updateImageAffirmation(selectedImage.id, editingAffirmation);
                  setIsEditModalVisible(false);
                  HapticFeedback.trigger('notificationSuccess', hapticOptions);
                }
              }}
            >
              <Text style={styles.saveButtonText}>Save Affirmation</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 80,
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
    marginBottom: 20,
  },
  headerActions: {
    alignItems: 'center',
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  flashButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  flatListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  visionImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  imageAffirmation: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addImageButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  flashContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashImage: {
    width: width * 1.1,
    height: height * 1.1,
    position: 'absolute',
  },
  flashOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    justifyContent: 'flex-end',
    padding: 32,
  },
  flashAffirmation: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  closeFlashButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  zoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  zoomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeZoomButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 32,
    paddingTop: 80,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickAffirmations: {
    gap: 8,
  },
  quickAffirmationButton: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickAffirmationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignSelf: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});