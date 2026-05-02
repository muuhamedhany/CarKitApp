import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export interface MapPickerResult {
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  formattedAddress: string;
}

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (result: MapPickerResult) => void;
}

const DEFAULT_LAT = 30.0444; // Cairo, Egypt
const DEFAULT_LNG = 31.2357;

/**
 * Generates an HTML page with Leaflet.js (OpenStreetMap) embedded.
 * The user can drag the marker to pick a location.
 */
function buildMapHTML(lat: number, lng: number, isDark: boolean) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttrib = isDark
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${lat}, ${lng}], 16);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${tileAttrib}'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

    function sendLocation(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'location',
        latitude: lat,
        longitude: lng
      }));
    }

    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendLocation(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendLocation(e.latlng.lat, e.latlng.lng);
    });

    // Send initial location
    sendLocation(${lat}, ${lng});
  </script>
</body>
</html>
  `.trim();
}

export default function MapLocationPicker({
  visible,
  onClose,
  onLocationSelected,
}: MapLocationPickerProps) {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [initialCoords, setInitialCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Request location when the modal becomes visible
  const handleShow = useCallback(async () => {
    setGpsLoading(true);
    setErrorMsg(null);
    setCurrentCoords(null);
    setInitialCoords(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission was denied. Using default location (Cairo).');
        setInitialCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setCurrentCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setGpsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setInitialCoords(coords);
      setCurrentCoords(coords);
    } catch {
      setErrorMsg('Could not get your location. Using default location (Cairo).');
      setInitialCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      setCurrentCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    } finally {
      setGpsLoading(false);
    }
  }, []);

  // Handle messages from the WebView (marker position updates)
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location') {
        setCurrentCoords({ lat: data.latitude, lng: data.longitude });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Reverse geocode the selected coordinates using Nominatim (free OpenStreetMap)
  const handleConfirmLocation = useCallback(async () => {
    if (!currentCoords) return;

    setGeocoding(true);
    try {
      // Try expo-location reverse geocoding first (uses device's native geocoder)
      const results = await Location.reverseGeocodeAsync({
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
      });

      if (results && results.length > 0) {
        const r = results[0];
        const streetParts = [r.streetNumber, r.street].filter(Boolean);
        const street = streetParts.join(' ') || r.name || '';
        const city = r.city || r.subregion || r.region || '';
        const formatted = [street, r.district, city, r.region].filter(Boolean).join(', ');

        onLocationSelected({
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          street,
          city,
          formattedAddress: formatted,
        });
        onClose();
        return;
      }
    } catch {
      // Fallback to Nominatim API
    }

    // Fallback: Nominatim reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${currentCoords.lat}&lon=${currentCoords.lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'CarKitApp/1.0' } }
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.village || addr.state || '';
        const formatted = data.display_name || `${street}, ${city}`;

        onLocationSelected({
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          street,
          city,
          formattedAddress: formatted,
        });
        onClose();
        return;
      }
    } catch {
      // Last resort — return coordinates only
    }

    onLocationSelected({
      latitude: currentCoords.lat,
      longitude: currentCoords.lng,
      street: '',
      city: '',
      formattedAddress: `${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}`,
    });
    onClose();
  }, [currentCoords, onLocationSelected, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleShow}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Pick Location</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Map Area */}
        <View style={styles.mapContainer}>
          {gpsLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <ActivityIndicator size="large" color={colors.pink} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Getting your location...
              </Text>
            </View>
          ) : initialCoords ? (
            <WebView
              ref={webViewRef}
              source={{ html: buildMapHTML(initialCoords.lat, initialCoords.lng, isDark) }}
              style={styles.webview}
              onMessage={handleWebViewMessage}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          ) : null}

          {loading && !gpsLoading && (
            <View style={[styles.mapOverlay, { backgroundColor: colors.backgroundSecondary }]}>
              <ActivityIndicator size="large" color={colors.pink} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading map...
              </Text>
            </View>
          )}
        </View>

        {/* Error message */}
        {errorMsg && (
          <View style={[styles.errorBanner, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.errorText, { color: colors.textMuted }]}>{errorMsg}</Text>
          </View>
        )}

        {/* Instructions + Confirm */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
          <View style={styles.instructionRow}>
            <MaterialCommunityIcons name="gesture-tap" size={20} color={colors.pink} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Tap or drag the pin to set your location
            </Text>
          </View>

          {currentCoords && (
            <Text style={[styles.coordsText, { color: colors.textMuted }]}>
              {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
            </Text>
          )}

          <Pressable
            onPress={handleConfirmLocation}
            disabled={!currentCoords || geocoding}
            style={[
              styles.confirmBtn,
              { backgroundColor: colors.pink, opacity: currentCoords && !geocoding ? 1 : 0.45 },
            ]}
          >
            {geocoding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirm Location</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 16 : Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instructionText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  coordsText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
  },
  confirmBtnText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
});
