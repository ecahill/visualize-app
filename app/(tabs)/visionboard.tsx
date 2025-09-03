import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { VisionBoardItem } from '@/types';

const sampleVisionItems: VisionBoardItem[] = [
  {
    id: '1',
    title: 'Dream Home',
    description: 'A beautiful house with a garden and natural light',
    category: 'material',
    priority: 'high',
    isAchieved: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Soul Mate Connection',
    description: 'Meeting my perfect life partner',
    category: 'relationships',
    priority: 'high',
    isAchieved: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Creative Business',
    description: 'Starting my own design studio',
    category: 'career',
    priority: 'medium',
    isAchieved: false,
    createdAt: new Date(),
  },
];

export default function VisionBoardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [visionItems, setVisionItems] = useState<VisionBoardItem[]>(sampleVisionItems);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VisionBoardItem['category']>('personal');

  const categories: { key: VisionBoardItem['category'], label: string, icon: string }[] = [
    { key: 'career', label: 'Career', icon: 'briefcase' },
    { key: 'relationships', label: 'Love', icon: 'heart' },
    { key: 'health', label: 'Health', icon: 'heart-o' },
    { key: 'travel', label: 'Travel', icon: 'plane' },
    { key: 'material', label: 'Material', icon: 'home' },
    { key: 'personal', label: 'Personal', icon: 'user' },
  ];

  const getCategoryGradient = (category: VisionBoardItem['category']) => {
    switch (category) {
      case 'career':
        return gradients.secondary;
      case 'relationships':
        return gradients.sunset;
      case 'health':
        return gradients.success;
      case 'travel':
        return gradients.ocean;
      case 'material':
        return gradients.primary;
      default:
        return gradients.primary;
    }
  };

  const addNewItem = () => {
    if (!newItemTitle.trim()) {
      Alert.alert('Please enter a title for your vision');
      return;
    }

    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      title: newItemTitle,
      description: newItemDescription,
      category: selectedCategory,
      priority: 'medium',
      isAchieved: false,
      createdAt: new Date(),
    };

    setVisionItems([...visionItems, newItem]);
    setIsAddModalVisible(false);
    setNewItemTitle('');
    setNewItemDescription('');
    setSelectedCategory('personal');
  };

  const toggleAchieved = (id: string) => {
    setVisionItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isAchieved: !item.isAchieved } : item
      )
    );
  };

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
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.visionGrid}>
          {visionItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.visionCard, { backgroundColor: colors.card }]}
              onPress={() => toggleAchieved(item.id)}
            >
              {item.isAchieved && (
                <View style={styles.achievedBadge}>
                  <FontAwesome name="check" size={16} color="white" />
                </View>
              )}
              <LinearGradient
                colors={getCategoryGradient(item.category)}
                style={[styles.visionIcon, { opacity: item.isAchieved ? 0.5 : 1 }]}
              >
                <FontAwesome
                  name={categories.find(cat => cat.key === item.category)?.icon || 'star'}
                  size={24}
                  color="white"
                />
              </LinearGradient>
              <Text style={[styles.visionTitle, { color: colors.text, opacity: item.isAchieved ? 0.5 : 1 }]}>
                {item.title}
              </Text>
              <Text style={[styles.visionDescription, { color: colors.text, opacity: item.isAchieved ? 0.5 : 0.7 }]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => setIsAddModalVisible(true)}
          >
            <FontAwesome name="plus" size={32} color={colors.primary} />
            <Text style={[styles.addText, { color: colors.primary }]}>Add Vision</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isAddModalVisible}
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
              onPress={() => setIsAddModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Vision</Text>
          </LinearGradient>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Vision Title *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="What do you want to manifest?"
                placeholderTextColor={colors.placeholder}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Describe your vision in detail..."
                placeholderTextColor={colors.placeholder}
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      { backgroundColor: selectedCategory === category.key ? colors.primary : colors.surface }
                    ]}
                    onPress={() => setSelectedCategory(category.key)}
                  >
                    <FontAwesome
                      name={category.icon}
                      size={16}
                      color={selectedCategory === category.key ? 'white' : colors.text}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: selectedCategory === category.key ? 'white' : colors.text }
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={addNewItem}
            >
              <Text style={styles.addButtonText}>Add to Vision Board</Text>
            </TouchableOpacity>
          </ScrollView>
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
  visionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  visionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  visionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  visionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  visionDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  addCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    minHeight: 120,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
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
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignSelf: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});