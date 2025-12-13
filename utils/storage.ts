import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'app_';

/**
 * Get value from storage
 */
export const getStorageItem = async <T = string>(key: string): Promise<T | null> => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const value = await AsyncStorage.getItem(prefixedKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    console.error(`Failed to get storage item '${key}':`, error);
    return null;
  }
};

/**
 * Set value in storage
 */
export const setStorageItem = async <T = string>(key: string, value: T): Promise<void> => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(prefixedKey, stringValue);
  } catch (error) {
    console.error(`Failed to set storage item '${key}':`, error);
    throw error;
  }
};

/**
 * Remove value from storage
 */
export const removeStorageItem = async (key: string): Promise<void> => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    await AsyncStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error(`Failed to remove storage item '${key}':`, error);
    throw error;
  }
};

/**
 * Clear all storage items
 */
export const clearStorage = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefixedKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
    await AsyncStorage.multiRemove(prefixedKeys);
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
};
