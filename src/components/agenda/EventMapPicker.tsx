import { useEffect, useState, useCallback, useMemo } from "react";
import { MapPin, Search, Church, Home, Globe, MoreHorizontal, Locate, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface EventMapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
    location_type: string;
  }) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  initialLocationType?: string;
}

const LOCATION_TYPES = [
  { value: "igreja", label: "Igreja", icon: Church },
  { value: "casa", label: "Casa", icon: Home },
  { value: "externo", label: "Externo", icon: Globe },
  { value: "outro", label: "Outro", icon: MoreHorizontal },
];

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

const createPickerIcon = () =>
  L.divIcon({
    html: `<div style="background:hsl(142,40%,20%);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

// Handles map clicks and auto-resize
const MapInteraction = ({
  onPositionChange,
}: {
  onPositionChange: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const intervals = [100, 300, 600, 1000, 2000, 3000];
    const timers = intervals.map((ms) =>
      setTimeout(() => map.invalidateSize(), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

// Moves map view programmatically
const MapController = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
    setTimeout(() => map.invalidateSize(), 100);
  }, [center, zoom, map]);
  return null;
};

const STREET_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const EventMapPicker = ({
  open,
  onOpenChange,
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress = "",
  initialLocationType = "igreja",
}: EventMapPickerProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [lat, setLat] = useState(initialLat || -15.7801);
  const [lng, setLng] = useState(initialLng || -47.9292);
  const [locationType, setLocationType] = useState(initialLocationType);
  const [isSearching, setIsSearching] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat || -15.7801, initialLng || -47.9292]);
  const [mapZoom, setMapZoom] = useState(15);
  // Key to force re-mount MapContainer when dialog reopens
  const [mapKey, setMapKey] = useState(0);

  const markerIcon = useMemo(() => createPickerIcon(), []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const newLat = initialLat || -15.7801;
      const newLng = initialLng || -47.9292;
      setLat(newLat);
      setLng(newLng);
      setAddress(initialAddress);
      setLocationType(initialLocationType);
      setSearchQuery("");
      setSearchResults([]);
      setMapCenter([newLat, newLng]);
      setMapZoom(15);
      setMapKey((k) => k + 1);

      // Auto-locate if no initial coords
      if (!initialLat && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLat(latitude);
            setLng(longitude);
            setMapCenter([latitude, longitude]);
            setMapZoom(16);
            reverseGeocode(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    }
  }, [open, initialLat, initialLng, initialAddress, initialLocationType]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR&addressdetails=1`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      // silent
    }
  }, []);

  const handlePositionChange = useCallback(
    (newLat: number, newLng: number) => {
      setLat(newLat);
      setLng(newLng);
      reverseGeocode(newLat, newLng);
    },
    [reverseGeocode]
  );

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setMapCenter([latitude, longitude]);
        setMapZoom(17);
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=pt-BR&countrycodes=br`
      );
      const data: SearchResult[] = await res.json();
      if (data.length === 1) {
        selectSearchResult(data[0]);
      } else if (data.length > 1) {
        setSearchResults(data);
      }
    } catch {
      // silent
    }
    setIsSearching(false);
  };

  const selectSearchResult = (result: SearchResult) => {
    const nLat = parseFloat(result.lat);
    const nLng = parseFloat(result.lon);
    setLat(nLat);
    setLng(nLng);
    setAddress(result.display_name);
    setMapCenter([nLat, nLng]);
    setMapZoom(16);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleConfirm = () => {
    onLocationSelect({
      address,
      latitude: lat,
      longitude: lng,
      location_type: locationType,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-3 sm:p-5">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            Selecionar Local
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search + Locate */}
          <div className="flex gap-1.5">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Pesquisar endereço..."
              className="rounded-xl text-sm flex-1 min-w-0"
            />
            <Button onClick={handleSearch} size="icon" className="rounded-xl shrink-0 h-10 w-10" disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button onClick={handleLocateMe} size="icon" variant="outline" className="rounded-xl shrink-0 h-10 w-10" disabled={isLocating}>
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-lg max-h-36 overflow-y-auto">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectSearchResult(result)}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                >
                  <span className="line-clamp-2">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Map */}
          {open && (
            <div className="relative rounded-xl overflow-hidden border border-border" style={{ minHeight: "220px" }}>
              <MapContainer
                key={mapKey}
                center={mapCenter}
                zoom={mapZoom}
                zoomControl={false}
                className="w-full"
                style={{ zIndex: 0, height: "280px" }}
              >
                <TileLayer
                  url={isSatellite ? SATELLITE_URL : STREET_URL}
                  attribution={isSatellite ? "© Esri" : "© OSM"}
                  maxZoom={19}
                />
                <Marker
                  position={[lat, lng]}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const pos = e.target.getLatLng();
                      handlePositionChange(pos.lat, pos.lng);
                    },
                  }}
                />
                <MapInteraction onPositionChange={handlePositionChange} />
                <MapController center={mapCenter} zoom={mapZoom} />
              </MapContainer>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 z-[1000] rounded-lg text-[10px] sm:text-xs shadow-md h-7 px-2"
                onClick={() => setIsSatellite(!isSatellite)}
              >
                {isSatellite ? "🗺️ Mapa" : "🛰️ Satélite"}
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            Toque no mapa ou arraste o marcador para ajustar
          </p>

          {/* Address preview */}
          {address && (
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Endereço:</p>
              <p className="text-xs font-medium text-foreground break-words line-clamp-3">{address}</p>
            </div>
          )}

          {/* Location type */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Tipo de local</Label>
            <RadioGroup value={locationType} onValueChange={setLocationType} className="grid grid-cols-2 gap-1.5">
              {LOCATION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-1.5 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                    locationType === type.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={type.value} className="sr-only" />
                  <type.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs">{type.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Button onClick={handleConfirm} className="w-full rounded-xl text-sm h-10">
            ✅ Confirmar Local
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventMapPicker;
