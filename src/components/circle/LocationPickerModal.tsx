import Button from "@/src/components/ui/Button";
import { Colors, Radius, Spacing, Typography, createThemedStyles } from "@/src/constants/theme";
import { ChevronLeft, LocateFixed, MapPin, Search } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

export interface PickedEventLocation {
  address: string;
  lat: number;
  lng: number;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_LOCATION = { lat: 6.5244, lng: 3.3792 };

const mapHtml = (lat: number, lng: number) => `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;width:100%;margin:0} .leaflet-control-attribution{font-size:9px}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
    function send(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: lat, lng: lng }));
    }
    function setLocation(lat, lng) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 16);
    }
    map.on('click', function(event) {
      setLocation(event.latlng.lat, event.latlng.lng);
      send(event.latlng.lat, event.latlng.lng);
    });
    marker.on('dragend', function() {
      var point = marker.getLatLng();
      send(point.lat, point.lng);
    });
  </script>
</body>
</html>`;

export default function LocationPickerModal({
  visible,
  initialLocation,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  initialLocation?: PickedEventLocation | null;
  onClose: () => void;
  onConfirm: (location: PickedEventLocation) => void;
}) {
  const webViewRef = useRef<WebView>(null);
  const initialPoint = initialLocation ?? DEFAULT_LOCATION;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selection, setSelection] = useState<PickedEventLocation | null>(initialLocation ?? null);
  const html = useMemo(() => mapHtml(initialPoint.lat, initialPoint.lng), [initialPoint.lat, initialPoint.lng]);

  const searchPlaces = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(query.trim())}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Location search failed");
      setResults((await response.json()) as SearchResult[]);
    } catch (error) {
      console.error("Error searching OpenStreetMap:", error);
      Alert.alert("Search unavailable", "We couldn’t search for that location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } },
      );
      const data = response.ok ? await response.json() : null;
      setSelection({
        lat,
        lng,
        address: data?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });
    } catch {
      setSelection({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
    } finally {
      setResolving(false);
    }
  };

  const chooseResult = (result: SearchResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    setSelection({ address: result.display_name, lat, lng });
    setResults([]);
    setQuery(result.display_name.split(",")[0]);
    webViewRef.current?.injectJavaScript(`setLocation(${lat}, ${lng}); true;`);
  };

  const handleMapMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type: string; lat: number; lng: number };
      if (message.type === "location") void reverseGeocode(message.lat, message.lng);
    } catch (error) {
      console.error("Invalid OpenStreetMap message:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Choose location</Text>
            <Text style={styles.subtitle}>Search or tap anywhere to drop a pin</Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.searchArea}>
          <View style={styles.searchBar}>
            <Search size={19} color={Colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => void searchPlaces()}
              returnKeyType="search"
              placeholder="Search places or addresses"
              placeholderTextColor={Colors.textDisabled}
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.searchButton} onPress={() => void searchPlaces()}>
              {searching ? <ActivityIndicator size="small" color={Colors.textPrimary} /> : <Text style={styles.searchButtonText}>Search</Text>}
            </TouchableOpacity>
          </View>
          {results.length > 0 && (
            <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
              {results.map((result) => (
                <TouchableOpacity key={`${result.lat}-${result.lon}`} style={styles.resultRow} onPress={() => chooseResult(result)}>
                  <MapPin size={17} color={Colors.primaryDark} />
                  <Text numberOfLines={2} style={styles.resultText}>{result.display_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.mapWrap}>
          <WebView
            ref={webViewRef}
            source={{ html }}
            onMessage={handleMapMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            style={styles.map}
          />
          <View pointerEvents="none" style={styles.mapHint}>
            <LocateFixed size={15} color={Colors.textPrimary} />
            <Text style={styles.mapHintText}>Tap map or drag pin</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.selectionCard}>
            <View style={styles.locationIcon}><MapPin size={20} color={Colors.primaryDark} /></View>
            <View style={styles.selectionCopy}>
              <Text style={styles.selectionLabel}>{resolving ? "Finding address…" : selection ? "Selected location" : "No location selected"}</Text>
              <Text numberOfLines={2} style={styles.selectionAddress}>{selection?.address ?? "Search or place a pin on the map"}</Text>
            </View>
          </View>
          <Button
            title="Use this location"
            disabled={!selection || resolving}
            onPress={() => selection && onConfirm(selection)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", minHeight: 62, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, alignItems: "center" },
  title: { ...Typography.h3, fontSize: 17 },
  subtitle: { ...Typography.bodySmall, fontSize: 11 },
  searchArea: { zIndex: 10, padding: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: { height: 48, flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingLeft: 12, backgroundColor: Colors.surface },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  searchButton: { height: 38, minWidth: 68, alignItems: "center", justifyContent: "center", marginRight: 4, borderRadius: Radius.sm, backgroundColor: Colors.primary },
  searchButtonText: { ...Typography.label, color: Colors.textPrimary },
  results: { position: "absolute", top: 66, left: Spacing.md, right: Spacing.md, maxHeight: 230, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface },
  resultRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  resultText: { ...Typography.bodySmall, flex: 1, color: Colors.textPrimary },
  mapWrap: { flex: 1, overflow: "hidden", borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.divider },
  map: { flex: 1, backgroundColor: Colors.inputBg },
  mapHint: { position: "absolute", top: 12, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  mapHintText: { ...Typography.label, color: Colors.textPrimary, fontSize: 10 },
  footer: { padding: Spacing.md, gap: Spacing.md, backgroundColor: Colors.background },
  selectionCard: { flexDirection: "row", alignItems: "center", gap: 11 },
  locationIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  selectionCopy: { flex: 1 },
  selectionLabel: { ...Typography.label, color: Colors.textPrimary },
  selectionAddress: { ...Typography.bodySmall, marginTop: 2 },
}));
