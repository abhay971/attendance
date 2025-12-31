interface GeocodingResult {
  address: string;
  displayName: string;
}

// Helper to add delay (respecting Nominatim rate limits - 1 request per second)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  try {
    // Add a small delay to respect rate limits
    await delay(1000);

    console.log(`[Geocoding] Fetching address for: ${lat}, ${lng}`);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AttendanceTracker/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`[Geocoding] API error: ${response.status} ${response.statusText}`);
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Geocoding] Response:', data);

    if (!data.display_name) {
      console.warn('[Geocoding] No display_name in response');
      throw new Error('No address found');
    }

    // Use the full display_name as the primary address
    // This preserves all available location details from OpenStreetMap
    const formattedAddress = data.display_name;

    console.log(`[Geocoding] Address: ${formattedAddress}`);

    return {
      address: formattedAddress,
      displayName: formattedAddress,
    };
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    // Return coordinates as fallback
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    console.warn(`[Geocoding] Falling back to coordinates: ${fallback}`);
    return {
      address: fallback,
      displayName: 'Location unavailable',
    };
  }
}
