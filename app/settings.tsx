import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { trigger as triggerHaptic } from '@/services/haptics';
import { useDatePicker } from '@/services/datePicker';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ShiftingRainbow } from '@/components/animations/AnimatedGradient';
import SpringButton from '@/components/animations/SpringButton';
import { userService, UserPreferences } from '@/services/userService';

type ThemeOption = 'light' | 'dark' | 'auto';
type FontSizeOption = 'small' | 'medium' | 'large';

const themeOptions: { value: ThemeOption; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sun-o' },
  { value: 'dark', label: 'Dark', icon: 'moon-o' },
  { value: 'auto', label: 'Auto', icon: 'magic' },
];

const fontSizeOptions: { value: FontSizeOption; label: string; size: number }[] = [
  { value: 'small', label: 'Small', size: 14 },
  { value: 'medium', label: 'Medium', size: 16 },
  { value: 'large', label: 'Large', size: 18 },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const headerScale = useSharedValue(1);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const userPrefs = userService.getUserPreferences();
      if (userPrefs) {
        setPreferences(userPrefs);
        
        // Parse time string to Date object
        const [hours, minutes] = userPrefs.notifications.time.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours), parseInt(minutes));
        setTempTime(timeDate);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      
      await userService.updateUserProfile({ preferences: newPreferences });
      triggerHaptic('impact-light');
      
      // Track settings changes
      await userService.trackFeatureUsage('settings_updated', {
        updatedFields: Object.keys(updates),
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
      // Revert changes
      loadUserPreferences();
    }
  };

  const handleThemeChange = (theme: ThemeOption) => {
    triggerHaptic('impact-medium');
    updatePreferences({ theme });
  };

  const handleNotificationToggle = (key: keyof UserPreferences['notifications'], value: boolean) => {
    if (!preferences) return;
    
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    });
  };

  const handlePrivacyToggle = (key: keyof UserPreferences['privacy'], value: boolean) => {
    if (!preferences) return;

    if (key === 'analyticsEnabled' && !value) {
      Alert.alert(
        'Disable Analytics',
        'This will prevent us from improving the app based on usage patterns. You can re-enable this anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: () => updatePreferences({
              privacy: {
                ...preferences.privacy,
                [key]: value,
              },
            }),
          },
        ]
      );
      return;
    }
    
    updatePreferences({
      privacy: {
        ...preferences.privacy,
        [key]: value,
      },
    });
  };

  const handleDisplayChange = (key: keyof UserPreferences['display'], value: any) => {
    if (!preferences) return;
    
    updatePreferences({
      display: {
        ...preferences.display,
        [key]: value,
      },
    });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime && preferences) {
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      setTempTime(selectedTime);
      
      updatePreferences({
        notifications: {
          ...preferences.notifications,
          time: timeString,
        },
      });
    }
  };

  const handleDataExport = async () => {
    try {
      const filePath = await userService.exportUserData();
      Alert.alert(
        'Data Exported Successfully',
        `Your data has been saved to: ${filePath}`,
        [
          { text: 'OK', onPress: () => triggerHaptic('notification-success') },
        ]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    }
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data including profile, goals, journal entries, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUserData();
              Alert.alert(
                'Data Deleted',
                'All your data has been deleted. The app will now restart.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // In a real app, you might restart or navigate to onboarding
                      router.replace('/(tabs)/');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderToggleItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        {icon && (
          <View style={styles.settingIconContainer}>
            <FontAwesome name={icon as any} size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5E5', true: colors.primary }}
        thumbColor={value ? 'white' : '#f4f3f4'}
      />
    </View>
  );

  const renderSelectionItem = (
    title: string,
    subtitle: string,
    options: any[],
    currentValue: any,
    onSelect: (value: any) => void,
    icon?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        {icon && (
          <View style={styles.settingIconContainer}>
            <FontAwesome name={icon as any} size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.selectionContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectionOption,
              currentValue === option.value && styles.selectionOptionActive,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.selectionOptionText,
                currentValue === option.value && styles.selectionOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderActionItem = (
    title: string,
    subtitle: string,
    onPress: () => void,
    icon: string,
    gradient?: string[],
    destructive?: boolean
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <LinearGradient
        colors={gradient || (destructive ? ['#FF6B6B', '#FF5252'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)'])}
        style={styles.actionGradient}
      >
        <View style={styles.actionContent}>
          <View style={styles.actionIconContainer}>
            <FontAwesome 
              name={icon as any} 
              size={20} 
              color={destructive ? 'white' : colors.primary} 
            />
          </View>
          <View style={styles.actionText}>
            <Text style={[
              styles.actionTitle,
              { color: destructive ? 'white' : '#2D3436' }
            ]}>
              {title}
            </Text>
            <Text style={[
              styles.actionSubtitle,
              { color: destructive ? 'rgba(255, 255, 255, 0.8)' : '#6C7B7F' }
            ]}>
              {subtitle}
            </Text>
          </View>
          <FontAwesome 
            name="chevron-right" 
            size={16} 
            color={destructive ? 'rgba(255, 255, 255, 0.6)' : '#6C7B7F'} 
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading || !preferences) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ShiftingRainbow style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ShiftingRainbow style={StyleSheet.absoluteFill} />

      <Animated.View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            triggerHaptic('impact-light');
            router.back();
          }}
        >
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Settings</Text>
        
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Theme Settings */}
        {renderSection(
          'Appearance',
          renderSelectionItem(
            'Theme',
            'Choose your preferred theme',
            themeOptions,
            preferences.theme,
            handleThemeChange,
            'paint-brush'
          )
        )}

        {renderSection(
          'Display',
          <>
            {renderSelectionItem(
              'Font Size',
              'Adjust text size for better readability',
              fontSizeOptions,
              preferences.display.fontSize,
              (value) => handleDisplayChange('fontSize', value),
              'text-height'
            )}
            {renderToggleItem(
              'Haptic Feedback',
              'Feel vibrations when interacting with the app',
              preferences.display.hapticFeedback,
              (value) => handleDisplayChange('hapticFeedback', value),
              'mobile'
            )}
            {renderToggleItem(
              'Sound Effects',
              'Play sounds for interactions and notifications',
              preferences.display.soundEffects,
              (value) => handleDisplayChange('soundEffects', value),
              'volume-up'
            )}
          </>
        )}

        {/* Notification Settings */}
        {renderSection(
          'Notifications',
          <>
            {renderToggleItem(
              'Daily Reminders',
              'Get reminded to practice daily manifestation',
              preferences.notifications.dailyReminders,
              (value) => handleNotificationToggle('dailyReminders', value),
              'bell'
            )}
            {renderToggleItem(
              'Affirmation Notifications',
              'Receive positive affirmations throughout the day',
              preferences.notifications.affirmationNotifications,
              (value) => handleNotificationToggle('affirmationNotifications', value),
              'heart'
            )}
            {renderToggleItem(
              'Journal Reminders',
              'Get prompted to write in your manifestation journal',
              preferences.notifications.journalReminders,
              (value) => handleNotificationToggle('journalReminders', value),
              'book'
            )}
            {renderToggleItem(
              'Visualization Reminders',
              'Reminders for your daily visualization practice',
              preferences.notifications.visualizationReminders,
              (value) => handleNotificationToggle('visualizationReminders', value),
              'eye'
            )}
            
            <TouchableOpacity
              style={styles.timePickerItem}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.settingInfo}>
                <View style={styles.settingIconContainer}>
                  <FontAwesome name="clock-o" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Notification Time</Text>
                  <Text style={styles.settingSubtitle}>When to send daily reminders</Text>
                </View>
              </View>
              <Text style={styles.timeValue}>
                {tempTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={false}
                onChange={handleTimeChange}
              />
            )}
          </>
        )}

        {/* Privacy Settings */}
        {renderSection(
          'Privacy & Data',
          <>
            {renderToggleItem(
              'Share Progress',
              'Allow sharing your progress with the community',
              preferences.privacy.shareProgress,
              (value) => handlePrivacyToggle('shareProgress', value),
              'share-alt'
            )}
            {renderToggleItem(
              'Analytics',
              'Help improve the app by sharing usage data',
              preferences.privacy.analyticsEnabled,
              (value) => handlePrivacyToggle('analyticsEnabled', value),
              'bar-chart'
            )}
            {renderToggleItem(
              'Crash Reports',
              'Automatically send crash reports to improve stability',
              preferences.privacy.crashReporting,
              (value) => handlePrivacyToggle('crashReporting', value),
              'bug'
            )}
          </>
        )}

        {/* Account Actions */}
        {renderSection(
          'Account & Data',
          <>
            {renderActionItem(
              'Export My Data',
              'Download all your manifestation data',
              handleDataExport,
              'download',
              gradients.success
            )}
            {renderActionItem(
              'Privacy Policy',
              'Read our privacy policy and terms',
              () => {
                // In production, open privacy policy URL
                Alert.alert('Privacy Policy', 'This would open the privacy policy in your browser.');
              },
              'shield',
              gradients.ocean
            )}
            {renderActionItem(
              'Contact Support',
              'Get help or send feedback',
              () => {
                Alert.alert('Contact Support', 'This would open your email app to contact support.');
              },
              'envelope',
              gradients.purple
            )}
            {renderActionItem(
              'Delete All Data',
              'Permanently delete your account and data',
              handleDataDeletion,
              'trash',
              undefined,
              true
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSpacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    marginHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  settingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 123, 127, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6C7B7F',
    lineHeight: 20,
  },
  selectionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
  },
  selectionOptionActive: {
    backgroundColor: '#6A4C93',
  },
  selectionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C7B7F',
  },
  selectionOptionTextActive: {
    color: 'white',
  },
  timePickerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A4C93',
  },
  actionItem: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    borderRadius: 12,
    padding: 16,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});