import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getLocationFromCoordinates } from '../utils/nominatimService';

interface LocationState {
  location: Location.LocationObject | null;
  address: string | null;
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    address: null,
    error: null,
    loading: false,
    permissionGranted: false,
  });

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      setState(prev => ({
        ...prev,
        permissionGranted: granted,
        error: granted ? null : 'Location permission denied',
      }));

      return granted;
    } catch (error) {
      console.error('Permission request error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to request location permission',
      }));
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (!state.permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address from coordinates
      const address = await getLocationFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      setState(prev => ({
        ...prev,
        location,
        address,
        loading: false,
      }));

      return location;
    } catch (error) {
      console.error('Location error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to get location',
        loading: false,
      }));
      return null;
    }
  };

  const watchLocation = async (callback: (location: Location.LocationObject) => void) => {
    if (!state.permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update if moved 10 meters
        },
        callback
      );

      return subscription;
    } catch (error) {
      console.error('Location watch error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to watch location',
      }));
      return null;
    }
  };

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState(prev => ({
        ...prev,
        permissionGranted: status === 'granted',
      }));
    };

    checkPermission();
  }, []);

  const reset = () => {
    setState({
      location: null,
      address: null,
      error: null,
      loading: false,
      permissionGranted: false,
    });
  };

  return {
    ...state,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    reset,
  };
}
