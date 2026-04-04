import { useEffect, useState, useCallback, useMemo } from "react";
import { MapPin, Search, Church, Home, Globe, MoreHorizontal, Locate, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { cn } from "@/lib/utils";
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

const MapInteraction = ({
  onPositionChange,
}: {
  onPositionChange: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const intervals = [0, 100, 300, 600, 1000, 2000, 3000];
    const timers = intervals.map((ms) => window.setTimeout(() => map.invalidateSize(), ms));

    const container = map.getContainer();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => map.invalidateSize())
      : null;

    observer?.observe(container);

    return () => {
      timers.forEach(window.clearTimeout);
      observer?.disconnect();
    };
  }, [map]);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const MapController = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), { animate: false });
    const timer = window.setTimeout(() => map.invalidateSize(), 50);

    return () => window.clearTimeout(timer);
  }, [center, zoom, map]);

  return null;
};

const STREET_TILE_SOURCES = [
  {
    key: "osm",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    key: "carto",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
  },
] as const;

const SATELLITE_TILE_SOURCE = {
  key: "esri",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles © Esri",
} as const;

const DEFAULT_POSITION: [number, number] = [-15.7801, -47.9292];

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
  const [lat, setLat] = useState(initialLat || DEFAULT_POSITION[0]);
  const [lng, setLng] = useState(initialLng || DEFAULT_POSITION[1]);
  const [locationType, setLocationType] = useState(initialLocationType);
  const [isSearching, setIsSearching] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialLat || DEFAULT_POSITION[0],
    initialLng || DEFAULT_POSITION[1],
  ]);
  const [mapZoom, setMapZoom] = useState(initialLat && initialLng ? 16 : 15);
  const [mapKey, setMapKey] = useState(0);
  const [streetTileIndex, setStreetTileIndex] = useState(0);

  const markerIcon = useMemo(() => createPickerIcon(), []);

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

  useEffect(() => {
    if (!open) return;

    const newLat = initialLat || DEFAULT_POSITION[0];
    const newLng = initialLng || DEFAULT_POSITION[1];
    setLat(newLat);
    setLng(newLng);
    setAddress(initialAddress);
    setLocationType(initialLocationType);
    setSearchQuery("");
    setSearchResults([]);
    setMapCenter([newLat, newLng]);
    setMapZoom(initialLat && initialLng ? 16 : 15);
    setMapKey((k) => k + 1);
    setStreetTileIndex(0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open, initialLat, initialLng, initialAddress, initialLocationType, reverseGeocode]);

  useEffect(() => {
    if (!open || initialLat || !navigator.geolocation) return;

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
  }, [open, initialLat, reverseGeocode]);

  const handlePositionChange = useCallback(
    (newLat: number, newLng: number) => {
      setLat(newLat);
      setLng(newLng);
      setMapCenter([newLat, newLng]);
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
          const result = data[0];
          const nLat = parseFloat(result.lat);
          const nLng = parseFloat(result.lon);
          setLat(nLat);
          setLng(nLng);
          setAddress(result.display_name);
          setMapCenter([nLat, nLng]);
          setMapZoom(16);
          setSearchQuery("");
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

  const activeTileSource = isSatellite
    ? SATELLITE_TILE_SOURCE
    : STREET_TILE_SOURCES[Math.min(streetTileIndex, STREET_TILE_SOURCES.length - 1)];

  const handleTileError = useCallback(() => {
    if (isSatellite) return;

    setStreetTileIndex((currentIndex) =>
      currentIndex < STREET_TILE_SOURCES.length - 1 ? currentIndex + 1 : currentIndex
    );
  }, [isSatellite]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-background/96 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div
          className="flex items-center justify-between border-b border-border bg-background/95 px-4 py-3"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Selecionar Local
            </p>
            <p className="text-xs text-muted-foreground">Toque no mapa para marcar com precisão</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar mapa"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="order-2 flex min-h-0 flex-1 flex-col border-t border-border lg:order-1 lg:border-r lg:border-t-0">
            <div className="flex items-center gap-2 px-3 py-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Pesquisar endereço..."
                className="rounded-xl text-sm"
              />
              <Button onClick={handleSearch} size="icon" className="rounded-xl shrink-0" disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
              <Button onClick={handleLocateMe} size="icon" variant="outline" className="rounded-xl shrink-0" disabled={isLocating}>
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mx-3 mb-3 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.lat}-${result.lon}-${index}`}
                    onClick={() => selectSearchResult(result)}
                    className="w-full border-b border-border px-3 py-3 text-left text-xs transition-colors last:border-b-0 hover:bg-muted/50"
                  >
                    <span className="line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative min-h-0 flex-1 bg-muted">
              <MapContainer
                key={mapKey}
                center={mapCenter}
                zoom={mapZoom}
                zoomControl={false}
                preferCanvas
                className="h-full w-full"
              >
                <TileLayer
                  key={activeTileSource.key}
                  url={activeTileSource.url}
                  attribution={activeTileSource.attribution}
                  eventHandlers={{ tileerror: handleTileError }}
                  maxZoom={19}
                />
                <Marker
                  position={[lat, lng]}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend: (event) => {
                      const position = event.target.getLatLng();
                      handlePositionChange(position.lat, position.lng);
                    },
                  }}
                />
                <MapInteraction onPositionChange={handlePositionChange} />
                <MapController center={mapCenter} zoom={mapZoom} />
              </MapContainer>

              <Button
                variant="secondary"
                size="sm"
                className="absolute right-3 top-3 z-[1000] rounded-lg shadow-md"
                onClick={() => setIsSatellite((current) => !current)}
              >
                {isSatellite ? "🗺️ Mapa" : "🛰️ Satélite"}
              </Button>
            </div>
          </div>

          <div
            className="order-1 w-full shrink-0 overflow-y-auto border-b border-border bg-background p-4 lg:order-2 lg:w-[360px] lg:border-b-0"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 16px))" }}
          >
            <div className="space-y-4">
              {!isSatellite && streetTileIndex > 0 && (
                <div className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                  Mapa alternativo ativado para melhorar o carregamento.
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-foreground">Coordenadas</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </div>

              {address && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="mb-1 text-[10px] text-muted-foreground">Endereço</p>
                  <p className="text-xs font-medium text-foreground break-words">{address}</p>
                </div>
              )}

              <div>
                <Label className="mb-2 block text-xs font-medium">Tipo de local</Label>
                <RadioGroup value={locationType} onValueChange={setLocationType} className="grid grid-cols-2 gap-2">
                  {LOCATION_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-colors",
                        locationType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value={type.value} className="sr-only" />
                      <type.icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-xs text-foreground">{type.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Toque no mapa ou arraste o marcador para posicionar com precisão.
              </p>

              <Button onClick={handleConfirm} className="w-full rounded-xl">
                ✅ Confirmar Local
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventMapPicker;
