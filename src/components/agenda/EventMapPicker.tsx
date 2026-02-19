import { useEffect, useRef, useState, useCallback } from "react";
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

const EventMapPicker = ({
  open,
  onOpenChange,
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress = "",
  initialLocationType = "igreja",
}: EventMapPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [lat, setLat] = useState(initialLat || -15.7801);
  const [lng, setLng] = useState(initialLng || -47.9292);
  const [locationType, setLocationType] = useState(initialLocationType);
  const [isSearching, setIsSearching] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [autoLocated, setAutoLocated] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLat(initialLat || -15.7801);
      setLng(initialLng || -47.9292);
      setAddress(initialAddress);
      setLocationType(initialLocationType);
      setSearchQuery("");
      setSearchResults([]);
      setAutoLocated(false);
    }
  }, [open, initialLat, initialLng, initialAddress, initialLocationType]);

  const updateMapPosition = useCallback((newLat: number, newLng: number, zoom?: number) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], zoom || mapInstanceRef.current.getZoom());
      markerRef.current.setLatLng([newLat, newLng]);
    }
    setLat(newLat);
    setLng(newLng);
  }, []);

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

  // Auto-locate user when opening without initial coordinates
  useEffect(() => {
    if (!open || autoLocated || initialLat) return;
    if (!navigator.geolocation) return;

    setAutoLocated(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMapPosition(latitude, longitude, 16);
        reverseGeocode(latitude, longitude);
      },
      () => {
        // Use default (Brasília) if geolocation fails
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [open, autoLocated, initialLat, updateMapPosition, reverseGeocode]);

  useEffect(() => {
    if (!open || !mapRef.current) return;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.default.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
      });

      L.default.control.zoom({ position: "bottomright" }).addTo(map);

      const streetLayer = L.default.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "© OSM", maxZoom: 19 }
      );

      const satelliteLayer = L.default.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri", maxZoom: 19 }
      );

      streetLayer.addTo(map);

      const icon = L.default.divIcon({
        html: `<div style="background:hsl(var(--primary));border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.default.marker([lat, lng], { icon, draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        setLat(newLat);
        setLng(newLng);
        reverseGeocode(newLat, newLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      (map as any)._streetLayer = streetLayer;
      (map as any)._satelliteLayer = satelliteLayer;

      setTimeout(() => map.invalidateSize(), 200);
    };

    const timer = setTimeout(initMap, 300);
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const streetLayer = map._streetLayer;
    const satelliteLayer = map._satelliteLayer;
    if (!streetLayer || !satelliteLayer) return;

    if (isSatellite) {
      map.removeLayer(streetLayer);
      satelliteLayer.addTo(map);
    } else {
      map.removeLayer(satelliteLayer);
      streetLayer.addTo(map);
    }
  }, [isSatellite]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMapPosition(latitude, longitude, 17);
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
    setAddress(result.display_name);
    updateMapPosition(nLat, nLng, 16);
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
            <Button
              onClick={handleSearch}
              size="icon"
              className="rounded-xl shrink-0 h-10 w-10"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleLocateMe}
              size="icon"
              variant="outline"
              className="rounded-xl shrink-0 h-10 w-10"
              disabled={isLocating}
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search results dropdown */}
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
          <div className="relative rounded-xl overflow-hidden border border-border">
            <div ref={mapRef} className="h-[200px] sm:h-[260px] w-full" />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 z-[1000] rounded-lg text-[10px] sm:text-xs shadow-md h-7 px-2"
              onClick={() => setIsSatellite(!isSatellite)}
            >
              {isSatellite ? "🗺️ Mapa" : "🛰️ Satélite"}
            </Button>
          </div>

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
            <RadioGroup
              value={locationType}
              onValueChange={setLocationType}
              className="grid grid-cols-2 gap-1.5"
            >
              {LOCATION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-1.5 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                    locationType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
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
