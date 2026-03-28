import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Search, X, MapPin } from 'lucide-react-native';
import SafeMap, { SafeMarker } from '@/components/SafeMap';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import { CONFIG } from '@/lib/config';

const GOOGLE_API_KEY = CONFIG.GOOGLE_PLACES_KEY;

const PLACES_PROXY_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressResult {
  label: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface AddressSearchProps {
  initialValue?: string;
  onAddressSelected: (result: AddressResult) => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function AddressSearch({
  initialValue = '',
  onAddressSelected,
  onClear,
  autoFocus = false,
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(
    initialValue ? null : null
  );
  const [showMap, setShowMap] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [autoFocus]);

  const fetchPredictions = useCallback(async (text: string) => {
    if (text.length < 3) {
      setPredictions([]);
      setError(null);
      return;
    }

    if (!GOOGLE_API_KEY) {
      console.log('AddressSearch: No Google API key found');
      setError('Google Places API key not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('AddressSearch: Fetching predictions for:', text);
      console.log('AddressSearch: API key present:', !!GOOGLE_API_KEY, 'length:', GOOGLE_API_KEY.length);

      const response = await fetch(PLACES_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
        },
        body: JSON.stringify({
          input: text,
          includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route', 'locality'],
        }),
      });

      const data = await response.json();
      console.log('AddressSearch: Places API response status:', response.status);
      console.log('AddressSearch: Places API response:', JSON.stringify(data).substring(0, 500));

      if (data.suggestions && data.suggestions.length > 0) {
        const mapped: PlacePrediction[] = data.suggestions
          .filter((s: any) => s.placePrediction)
          .slice(0, 5)
          .map((s: any) => ({
            place_id: s.placePrediction.placeId,
            description: s.placePrediction.text?.text ?? '',
            structured_formatting: {
              main_text: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? '',
              secondary_text: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
            },
          }));
        setPredictions(mapped);
        if (mapped.length === 0) {
          setError('Address not found — try being more specific');
        }
      } else {
        setPredictions([]);
        if (text.length >= 3) {
          setError('Address not found — try being more specific');
        }
      }
    } catch (e) {
      console.log('AddressSearch: Places API error:', e);
      setPredictions([]);
      setError('Address not found — try being more specific');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = useCallback(
    (text: string) => {
      setQuery(text);
      setSelectedAddress(null);
      setShowMap(false);
      setError(null);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        void fetchPredictions(text);
      }, 300);
    },
    [fetchPredictions]
  );

  const handleSelectPrediction = useCallback(
    async (prediction: PlacePrediction) => {
      Keyboard.dismiss();
      setQuery(prediction.description);
      setPredictions([]);
      setIsLoading(true);
      setError(null);

      try {
        console.log('AddressSearch: Fetching place details for:', prediction.place_id);
        const url = `${PLACE_DETAILS_URL}/${prediction.place_id}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'location,formattedAddress,displayName',
          },
        });
        const data = await response.json();
        console.log('AddressSearch: Place details response:', JSON.stringify(data).substring(0, 500));

        if (data.location) {
          const result: AddressResult = {
            label: data.formattedAddress ?? prediction.description,
            coords: {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            },
          };
          setSelectedAddress(result);
          setShowMap(true);
          onAddressSelected(result);
        } else {
          setError('Address not found — try being more specific');
        }
      } catch (e) {
        console.log('AddressSearch: Geocoding error:', e);
        setError('Address not found — try being more specific');
      } finally {
        setIsLoading(false);
      }
    },
    [onAddressSelected]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setPredictions([]);
    setSelectedAddress(null);
    setShowMap(false);
    setError(null);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const handleEditFromMap = useCallback(() => {
    setShowMap(false);
    setSelectedAddress(null);
    setPredictions([]);
    inputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleTextChange}
          placeholder="Start typing your address…"
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {isLoading && (
          <ActivityIndicator size="small" color={Colors.textMuted} style={styles.loader} />
        )}
      </View>

      {error && !selectedAddress && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {predictions.length > 0 && !selectedAddress && (
        <Card style={styles.suggestionsCard}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionRow,
                  index < predictions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => handleSelectPrediction(item)}
              >
                <MapPin size={16} color={Colors.textMuted} />
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionPrimary} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestionSecondary} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </Card>
      )}

      {showMap && selectedAddress && (
        <View style={styles.mapSection}>
          <View style={styles.mapWrapper}>
            <SafeMap
              style={styles.map}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              region={{
                latitude: selectedAddress.coords.latitude,
                longitude: selectedAddress.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              fallbackLabel={selectedAddress.label}
              fallbackCoords={selectedAddress.coords}
            >
              <SafeMarker
                coordinate={selectedAddress.coords}
                pinColor={Colors.green}
              />
            </SafeMap>
          </View>
          <TouchableOpacity onPress={handleEditFromMap}>
            <Text style={styles.editMapLink}>Not right? Edit above</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 6,
  },
  loader: {
    marginLeft: 6,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    marginTop: 8,
    marginLeft: 4,
  },
  suggestionsCard: {
    marginTop: 8,
    padding: 0,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  suggestionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionPrimary: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500' as const,
  },
  suggestionSecondary: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mapSection: {
    marginTop: 16,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  editMapLink: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  webMapPlaceholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
    gap: 6,
  },
  webMapAddress: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500' as const,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  webMapCoords: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
