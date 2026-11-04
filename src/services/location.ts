import * as Location from 'expo-location';

export type Coordinates = {
  latitude: number;
  longitude: number;
  altitude: number;
};

export async function getCurrentCoordinates(): Promise<Coordinates> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error(permission.canAskAgain
      ? 'Location permission is needed to calculate local sky positions.'
      : 'Location permission is disabled. Enable it in your device settings to calculate local sky positions.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude ?? 0,
  };
}
