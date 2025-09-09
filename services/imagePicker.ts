import { EnvironmentDetector } from './environmentDetection';

// Unified type definitions
export interface ImagePickerResult {
  canceled: boolean;
  assets?: Array<{
    uri: string;
    width?: number;
    height?: number;
    type?: string;
    fileSize?: number;
    fileName?: string;
    base64?: string;
  }>;
}

export interface ImagePickerOptions {
  mediaTypes?: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

export interface CameraOptions extends ImagePickerOptions {
  cameraType?: 'front' | 'back';
}

/**
 * Unified image picker service that works across Expo Go and native builds
 */
class ImagePickerService {
  private expoImagePicker: any = null;
  private nativeImagePicker: any = null;
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    try {
      if (EnvironmentDetector.isExpoGo()) {
        // Use Expo Image Picker for Expo Go
        this.expoImagePicker = await import('expo-image-picker');
        console.log('📸 ImagePicker: Using Expo Image Picker for Expo Go');
      } else {
        // Try to use native image picker for development/production builds
        try {
          this.nativeImagePicker = await import('react-native-image-picker');
          console.log('📸 ImagePicker: Using React Native Image Picker for native build');
        } catch (error) {
          console.warn('⚠️ Native image picker not available, falling back to Expo Image Picker');
          this.expoImagePicker = await import('expo-image-picker');
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize image picker:', error);
    }

    this.isInitialized = true;
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<{ status: string; granted: boolean }> {
    await this.initialize();

    try {
      if (this.expoImagePicker) {
        const result = await this.expoImagePicker.requestMediaLibraryPermissionsAsync();
        return {
          status: result.status,
          granted: result.granted,
        };
      } else {
        // Native image picker handles permissions internally
        return { status: 'granted', granted: true };
      }
    } catch (error) {
      console.error('❌ Failed to request media library permissions:', error);
      return { status: 'denied', granted: false };
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<{ status: string; granted: boolean }> {
    await this.initialize();

    try {
      if (this.expoImagePicker) {
        const result = await this.expoImagePicker.requestCameraPermissionsAsync();
        return {
          status: result.status,
          granted: result.granted,
        };
      } else {
        // Native image picker handles permissions internally
        return { status: 'granted', granted: true };
      }
    } catch (error) {
      console.error('❌ Failed to request camera permissions:', error);
      return { status: 'denied', granted: false };
    }
  }

  /**
   * Launch image library picker
   */
  async launchImageLibrary(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    await this.initialize();

    try {
      if (this.expoImagePicker) {
        return await this.launchExpoImageLibrary(options);
      } else if (this.nativeImagePicker) {
        return await this.launchNativeImageLibrary(options);
      } else {
        throw new Error('No image picker available');
      }
    } catch (error) {
      console.error('❌ Failed to launch image library:', error);
      return { canceled: true };
    }
  }

  /**
   * Launch camera
   */
  async launchCamera(options: CameraOptions = {}): Promise<ImagePickerResult> {
    await this.initialize();

    try {
      if (this.expoImagePicker) {
        return await this.launchExpoCamera(options);
      } else if (this.nativeImagePicker) {
        return await this.launchNativeCamera(options);
      } else {
        throw new Error('No camera available');
      }
    } catch (error) {
      console.error('❌ Failed to launch camera:', error);
      return { canceled: true };
    }
  }

  /**
   * Launch Expo image library
   */
  private async launchExpoImageLibrary(options: ImagePickerOptions): Promise<ImagePickerResult> {
    const expoOptions = {
      mediaTypes: this.mapMediaTypes(options.mediaTypes),
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      quality: options.quality ?? 0.8,
      base64: options.base64 ?? false,
      allowsMultipleSelection: options.allowsMultipleSelection ?? false,
      selectionLimit: options.selectionLimit ?? 1,
    };

    const result = await this.expoImagePicker.launchImageLibraryAsync(expoOptions);
    return this.normalizeExpoResult(result);
  }

  /**
   * Launch Expo camera
   */
  private async launchExpoCamera(options: CameraOptions): Promise<ImagePickerResult> {
    const expoOptions = {
      mediaTypes: this.mapMediaTypes(options.mediaTypes),
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      quality: options.quality ?? 0.8,
      base64: options.base64 ?? false,
      cameraType: options.cameraType === 'front' ? 
        this.expoImagePicker.CameraType.front : 
        this.expoImagePicker.CameraType.back,
    };

    const result = await this.expoImagePicker.launchCameraAsync(expoOptions);
    return this.normalizeExpoResult(result);
  }

  /**
   * Launch native image library
   */
  private async launchNativeImageLibrary(options: ImagePickerOptions): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
      const nativeOptions = {
        mediaType: this.mapNativeMediaType(options.mediaTypes),
        includeBase64: options.base64 ?? false,
        maxWidth: 2000,
        maxHeight: 2000,
        quality: options.quality ?? 0.8,
      };

      this.nativeImagePicker.launchImageLibrary(nativeOptions, (response: any) => {
        resolve(this.normalizeNativeResult(response));
      });
    });
  }

  /**
   * Launch native camera
   */
  private async launchNativeCamera(options: CameraOptions): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
      const nativeOptions = {
        mediaType: this.mapNativeMediaType(options.mediaTypes),
        includeBase64: options.base64 ?? false,
        maxWidth: 2000,
        maxHeight: 2000,
        quality: options.quality ?? 0.8,
        cameraType: options.cameraType === 'front' ? 'front' : 'back',
      };

      this.nativeImagePicker.launchCamera(nativeOptions, (response: any) => {
        resolve(this.normalizeNativeResult(response));
      });
    });
  }

  /**
   * Map unified media types to Expo format
   */
  private mapMediaTypes(mediaTypes?: string) {
    if (!this.expoImagePicker) return undefined;

    switch (mediaTypes) {
      case 'images':
        return this.expoImagePicker.MediaTypeOptions.Images;
      case 'videos':
        return this.expoImagePicker.MediaTypeOptions.Videos;
      case 'all':
        return this.expoImagePicker.MediaTypeOptions.All;
      default:
        return this.expoImagePicker.MediaTypeOptions.Images;
    }
  }

  /**
   * Map unified media types to native format
   */
  private mapNativeMediaType(mediaTypes?: string): string {
    switch (mediaTypes) {
      case 'images':
        return 'photo';
      case 'videos':
        return 'video';
      case 'all':
        return 'mixed';
      default:
        return 'photo';
    }
  }

  /**
   * Normalize Expo result to unified format
   */
  private normalizeExpoResult(result: any): ImagePickerResult {
    if (result.canceled) {
      return { canceled: true };
    }

    return {
      canceled: false,
      assets: result.assets?.map((asset: any) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
        base64: asset.base64,
      })),
    };
  }

  /**
   * Normalize native result to unified format
   */
  private normalizeNativeResult(response: any): ImagePickerResult {
    if (response.didCancel || response.errorMessage) {
      return { canceled: true };
    }

    const asset = response.assets?.[0] || response;
    
    return {
      canceled: false,
      assets: [{
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
        base64: asset.base64,
      }],
    };
  }

  /**
   * Check if image picker is available
   */
  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return !!(this.expoImagePicker || this.nativeImagePicker);
  }

  /**
   * Get information about the image picker implementation being used
   */
  async getImplementationInfo() {
    await this.initialize();
    return {
      environment: EnvironmentDetector.getEnvironment(),
      implementation: this.nativeImagePicker ? 'react-native-image-picker' : 'expo-image-picker',
      isAvailable: await this.isAvailable(),
    };
  }
}

// Create singleton instance
const imagePickerService = new ImagePickerService();

// Export convenience functions
export const requestMediaLibraryPermissions = () => 
  imagePickerService.requestMediaLibraryPermissions();

export const requestCameraPermissions = () => 
  imagePickerService.requestCameraPermissions();

export const launchImageLibrary = (options?: ImagePickerOptions) => 
  imagePickerService.launchImageLibrary(options);

export const launchCamera = (options?: CameraOptions) => 
  imagePickerService.launchCamera(options);

export const isImagePickerAvailable = () => 
  imagePickerService.isAvailable();

export const getImagePickerInfo = () => 
  imagePickerService.getImplementationInfo();

// Export the service instance for advanced usage
export { imagePickerService };