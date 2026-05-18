import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

interface EmergencyRouteMapProps {
  customer: RouteCoordinate | null;
  employee?: RouteCoordinate | null;
  style?: StyleProp<ViewStyle>;
}

const makePoint = (point: RouteCoordinate) => ({
  lat: Number(point.latitude.toFixed(7)),
  lng: Number(point.longitude.toFixed(7)),
});

function buildRouteMapHtml(customer: RouteCoordinate, employee: RouteCoordinate | null, isDark: boolean) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttrib = isDark
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const customerPoint = makePoint(customer);
  const employeePoint = employee ? makePoint(employee) : null;
  const surface = isDark ? '#111119' : '#FFFFFF';
  const text = isDark ? '#F8F7FF' : '#172033';
  const employeeColor = isDark ? '#00C853' : '#047857';
  const customerColor = isDark ? '#CD42A8' : '#B83291';
  const routeColor = isDark ? '#2979FF' : '#2563EB';

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
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: ${surface}; }
    .marker {
      width: 32px;
      height: 32px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font: 800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 3px solid rgba(255,255,255,0.92);
      box-shadow: 0 10px 24px rgba(0,0,0,0.34);
    }
    .leaflet-container { background: ${surface}; }
    .leaflet-control-attribution {
      background: rgba(0,0,0,0.22);
      color: ${text};
      font-size: 9px;
    }
    .leaflet-control-attribution a { color: ${text}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var customer = [${customerPoint.lat}, ${customerPoint.lng}];
    var employee = ${employeePoint ? `[${employeePoint.lat}, ${employeePoint.lng}]` : 'null'};
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false
    }).setView(customer, 15);

    L.tileLayer(${JSON.stringify(tileUrl)}, {
      maxZoom: 19,
      attribution: ${JSON.stringify(tileAttrib)}
    }).addTo(map);

    function markerIcon(color, label) {
      return L.divIcon({
        className: '',
        html: '<div class="marker" style="background:' + color + '">' + label + '</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }

    L.marker(customer, { icon: markerIcon('${customerColor}', 'YOU') }).addTo(map);

    if (employee) {
      L.marker(employee, { icon: markerIcon('${employeeColor}', 'EMP') }).addTo(map);
      L.polyline([customer, employee], {
        color: '${routeColor}',
        weight: 4,
        opacity: 0.78,
        dashArray: '8, 10',
        lineCap: 'round'
      }).addTo(map);

      if (customer[0] === employee[0] && customer[1] === employee[1]) {
        map.setView(customer, 16);
      } else {
        map.fitBounds(L.latLngBounds([customer, employee]), { padding: [34, 34], maxZoom: 16 });
      }
    }
  </script>
</body>
</html>
`.trim();
}

export default function EmergencyRouteMap({ customer, employee = null, style }: EmergencyRouteMapProps) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  const html = useMemo(
    () => (customer ? buildRouteMapHtml(customer, employee, isDark) : null),
    [customer, employee, isDark]
  );

  useEffect(() => {
    setLoading(true);
  }, [html]);

  if (!customer || !html) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.surfaceMuted, borderColor: colors.cardBorder }, style]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Location unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceMuted, borderColor: colors.cardBorder }, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surfaceMuted }]}>
          <ActivityIndicator color={colors.pink} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 176,
    alignSelf: 'stretch',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    height: 176,
    alignSelf: 'stretch',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  placeholderText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
