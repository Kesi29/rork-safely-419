import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

interface SafeMapProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  followsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  zoomTapEnabled?: boolean;
  zoomControlEnabled?: boolean;
  toolbarEnabled?: boolean;
  moveOnMarkerPress?: boolean;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  mapRef?: React.RefObject<any>;
  fallbackLabel?: string;
  fallbackCoords?: { latitude: number; longitude: number };
}

function WebMapFallback({ style, fallbackLabel, fallbackCoords }: {
  style?: ViewStyle;
  fallbackLabel?: string;
  fallbackCoords?: { latitude: number; longitude: number };
}) {
  const lat = fallbackCoords?.latitude?.toFixed(4) ?? '';
  const lng = fallbackCoords?.longitude?.toFixed(4) ?? '';

  return (
    <View style={[styles.webFallback, style]}>
      <Text style={styles.webIcon}>🗺️</Text>
      {fallbackLabel ? (
        <Text style={styles.webLabel}>{fallbackLabel}</Text>
      ) : null}
      {lat && lng ? (
        <Text style={styles.webCoords}>{lat}, {lng}</Text>
      ) : null}
    </View>
  );
}

export default function SafeMap({
  style,
  children,
  initialRegion,
  region,
  showsUserLocation = false,
  showsMyLocationButton = false,
  showsCompass = false,
  followsUserLocation = false,
  scrollEnabled = true,
  zoomEnabled = true,
  pitchEnabled = true,
  rotateEnabled = true,
  zoomTapEnabled,
  zoomControlEnabled,
  toolbarEnabled,
  moveOnMarkerPress,
  pointerEvents,
  mapRef,
  fallbackLabel,
  fallbackCoords,
}: SafeMapProps) {
  if (Platform.OS === 'web') {
    const coords = fallbackCoords ?? (region ? { latitude: region.latitude, longitude: region.longitude } : initialRegion ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude } : undefined);
    return (
      <WebMapFallback
        style={style}
        fallbackLabel={fallbackLabel}
        fallbackCoords={coords}
      />
    );
  }

  const MapView = require('react-native-maps').default;

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={initialRegion}
      region={region}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      showsCompass={showsCompass}
      followsUserLocation={followsUserLocation}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      pitchEnabled={pitchEnabled}
      rotateEnabled={rotateEnabled}
      zoomTapEnabled={zoomTapEnabled}
      zoomControlEnabled={zoomControlEnabled}
      toolbarEnabled={toolbarEnabled}
      moveOnMarkerPress={moveOnMarkerPress}
      pointerEvents={pointerEvents}
    >
      {children}
    </MapView>
  );
}

export function SafeMarker(props: any) {
  if (Platform.OS === 'web') return null;
  const { Marker } = require('react-native-maps');
  return <Marker {...props} />;
}

export function SafePolyline(props: any) {
  if (Platform.OS === 'web') return null;
  const { Polyline } = require('react-native-maps');
  return <Polyline {...props} />;
}

const styles = StyleSheet.create({
  webFallback: {
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  webLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  webCoords: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
