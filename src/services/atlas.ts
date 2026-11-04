const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

export type IssPosition = {
  latitude: number;
  longitude: number;
};

export async function getIssPosition(): Promise<IssPosition> {
  const response = await fetch(ISS_API_URL);
  if (!response.ok) {
    throw new Error(`ISS position request failed: ${response.status}`);
  }

  const data: Partial<IssPosition> = await response.json();
  if (
    typeof data.latitude !== 'number' ||
    typeof data.longitude !== 'number' ||
    !Number.isFinite(data.latitude) ||
    !Number.isFinite(data.longitude) ||
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    throw new Error('Unexpected response format from ISS position API');
  }

  return { latitude: data.latitude, longitude: data.longitude };
}
