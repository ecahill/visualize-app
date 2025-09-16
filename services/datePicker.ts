import React from 'react';
import { Platform } from 'react-native';
import { EnvironmentDetector } from './environmentDetection';

// Unified type definitions
export interface DatePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  is24Hour?: boolean;
  display?: 'default' | 'spinner' | 'compact' | 'inline';
  onChange: (event: any, selectedDate?: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  locale?: string;
  textColor?: string;
}

export interface DatePickerModalProps extends DatePickerProps {
  isVisible: boolean;
  onConfirm?: (date: Date) => void;
  onCancel?: () => void;
  title?: string;
}

/**
 * Unified date picker service that works across Expo Go and native builds
 */
class DatePickerService {
  private nativeDateTimePicker: any = null;
  private expoPicker: any = null;
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    try {
      if (EnvironmentDetector.isExpoGo()) {
        // For Expo Go, we'll use a custom implementation or basic date picker
        console.log('📅 DatePicker: Using custom date picker for Expo Go');
        // Note: We could implement a custom picker or use a web-compatible one
      } else {
        // For native builds, we'll also use custom implementation for now
        // The @react-native-community/datetimepicker was removed for Expo Go compatibility
        console.log('📅 DatePicker: Using custom date picker for native build (Expo Go compatible)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize date picker:', error);
    }

    this.isInitialized = true;
  }

  /**
   * Get the appropriate DateTimePicker component
   */
  async getDateTimePicker(): Promise<React.ComponentType<DatePickerProps> | null> {
    await this.initialize();

    if (this.nativeDateTimePicker && !EnvironmentDetector.isExpoGo()) {
      return this.nativeDateTimePicker.default;
    }

    // Return a fallback component for Expo Go
    return this.createFallbackDatePicker();
  }

  /**
   * Create a fallback date picker for Expo Go
   */
  private createFallbackDatePicker() {
    return React.forwardRef<any, DatePickerProps>((props, ref) => {
      const { value, onChange, mode = 'date', is24Hour = false } = props;

      // For Expo Go, we can create a simple input-based picker or use native web inputs
      if (Platform.OS === 'web') {
        // Use HTML5 date/time inputs on web
        const inputType = mode === 'time' ? 'time' : mode === 'datetime' ? 'datetime-local' : 'date';
        const inputValue = this.formatDateForInput(value, mode);

        return React.createElement('input', {
          ref,
          type: inputType,
          value: inputValue,
          onChange: (event: any) => {
            const newDate = new Date(event.target.value);
            onChange(event, newDate);
          },
          style: {
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: 'white',
          },
        });
      }

      // For native Expo Go, create a simple button that shows current value
      // This is a basic fallback - in production, you might want a more sophisticated picker
      return React.createElement('button', {
        ref,
        onClick: () => {
          // Show an alert with current date - basic fallback
          const dateString = value.toLocaleDateString();
          const timeString = value.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: !is24Hour 
          });
          
          const displayValue = mode === 'time' ? timeString : 
                              mode === 'datetime' ? `${dateString} ${timeString}` : 
                              dateString;
          
          // In a real implementation, you'd show a modal with date selection
          alert(`Current ${mode}: ${displayValue}\n\nNote: Full date picker requires native build`);
        },
        style: {
          padding: '12px 16px',
          fontSize: '16px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
        },
      }, this.formatDisplayValue(value, mode, is24Hour));
    });
  }

  /**
   * Format date for HTML input
   */
  private formatDateForInput(date: Date, mode: string): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    switch (mode) {
      case 'time':
        return `${hours}:${minutes}`;
      case 'datetime':
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Format display value for fallback button
   */
  private formatDisplayValue(date: Date, mode: string, is24Hour?: boolean): string {
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24Hour,
    };

    switch (mode) {
      case 'time':
        return date.toLocaleTimeString([], timeOptions);
      case 'datetime':
        return `${date.toLocaleDateString([], dateOptions)} ${date.toLocaleTimeString([], timeOptions)}`;
      default:
        return date.toLocaleDateString([], dateOptions);
    }
  }

  /**
   * Show a date picker modal (platform-appropriate)
   */
  async showDatePicker(options: DatePickerModalProps): Promise<Date | null> {
    await this.initialize();

    return new Promise((resolve) => {
      if (this.nativeDateTimePicker && !EnvironmentDetector.isExpoGo()) {
        // Use native picker - this would typically be handled by the component itself
        // For now, we'll resolve with the current value
        resolve(options.value);
      } else {
        // Fallback for Expo Go
        if (Platform.OS === 'web') {
          // Create a temporary input element
          const input = document.createElement('input');
          const inputType = options.mode === 'time' ? 'time' : 
                           options.mode === 'datetime' ? 'datetime-local' : 'date';
          
          input.type = inputType;
          input.value = this.formatDateForInput(options.value, options.mode || 'date');
          input.style.position = 'absolute';
          input.style.left = '-9999px';
          
          document.body.appendChild(input);
          
          input.addEventListener('change', () => {
            const newDate = new Date(input.value);
            document.body.removeChild(input);
            resolve(newDate);
          });
          
          input.focus();
          input.click();
        } else {
          // For native Expo Go, show an alert with current value
          // In a real implementation, you'd show a custom modal
          const currentValue = this.formatDisplayValue(options.value, options.mode || 'date', options.is24Hour);
          alert(`Current ${options.mode || 'date'}: ${currentValue}\n\nFull date picker requires native build`);
          resolve(options.value);
        }
      }
    });
  }

  /**
   * Check if native date picker is available
   */
  async isNativeAvailable(): Promise<boolean> {
    await this.initialize();
    return !!this.nativeDateTimePicker && !EnvironmentDetector.isExpoGo();
  }

  /**
   * Get information about the date picker implementation being used
   */
  async getImplementationInfo() {
    await this.initialize();
    return {
      environment: EnvironmentDetector.getEnvironment(),
      implementation: 'custom-picker',
      isNativeAvailable: await this.isNativeAvailable(),
      platform: Platform.OS,
    };
  }
}

// Create singleton instance
const datePickerService = new DatePickerService();

// Export convenience functions
export const getDateTimePicker = () => datePickerService.getDateTimePicker();
export const showDatePicker = (options: DatePickerModalProps) => datePickerService.showDatePicker(options);
export const isNativeDatePickerAvailable = () => datePickerService.isNativeAvailable();
export const getDatePickerInfo = () => datePickerService.getImplementationInfo();

// Export a hook for easier usage in components
export const useDatePicker = () => {
  const [DateTimePickerComponent, setDateTimePickerComponent] = React.useState<React.ComponentType<DatePickerProps> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadPicker = async () => {
      try {
        const picker = await datePickerService.getDateTimePicker();
        if (isMounted) {
          setDateTimePickerComponent(() => picker);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load date picker:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPicker();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    DateTimePicker: DateTimePickerComponent,
    isLoading,
    showDatePicker: (options: DatePickerModalProps) => datePickerService.showDatePicker(options),
    isNativeAvailable: () => datePickerService.isNativeAvailable(),
  };
};

// Export the service instance for advanced usage
export { datePickerService };