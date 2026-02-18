import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Church, Home, Globe, MoreHorizontal } from "lucide-react";
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
  { value: "externo", label: "Evento Externo", icon: Globe },
  { value: "outro", label: "Outro", icon: MoreHorizontal },
];

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

  useEffect(() => {
    if (!open || !mapRef.current) return;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.default.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
      });

      const streetLayer = L.default.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "© OpenStreetMap contributors", maxZoom: 19 }
      );

      const satelliteLayer = L.default.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri", maxZoom: 19 }
      );

      if (isSatellite) {
        satelliteLayer.addTo(map);
      } else {
        streetLayer.addTo(map);
      }

      // Custom icon
      const icon = L.default.divIcon({
        html: `<div style="background:#1a472a;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
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

      // Layer toggle
      (map as any)._streetLayer = streetLayer;
      (map as any)._satelliteLayer = satelliteLayer;

      setTimeout(() => map.invalidateSize(), 100);
    };

    const timer = setTimeout(initMap, 200);
    return () => clearTimeout(timer);
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

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (e) {
      // silent fail
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=pt-BR`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat: newLat, lon: newLng, display_name } = data[0];
        const nLat = parseFloat(newLat);
        const nLng = parseFloat(newLng);
        setLat(nLat);
        setLng(nLng);
        setAddress(display_name);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([nLat, nLng], 16);
          markerRef.current.setLatLng([nLat, nLng]);
        }
      }
    } catch (e) {
      // silent fail
    }
    setIsSearching(false);
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
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Selecionar Local no Mapa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Pesquisar endereço..."
              className="rounded-xl"
            />
            <Button
              onClick={handleSearch}
              size="icon"
              className="rounded-xl shrink-0"
              disabled={isSearching}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Map */}
          <div className="relative rounded-xl overflow-hidden border border-border">
            <div ref={mapRef} className="h-[280px] w-full" />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 z-[1000] rounded-lg text-xs shadow-md"
              onClick={() => setIsSatellite(!isSatellite)}
            >
              {isSatellite ? "🗺️ Mapa" : "🛰️ Satélite"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Toque no mapa ou arraste o marcador para ajustar a posição
          </p>

          {/* Address preview */}
          {address && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Endereço selecionado:</p>
              <p className="text-sm font-medium text-foreground">{address}</p>
            </div>
          )}

          {/* Location type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipo de local</Label>
            <RadioGroup
              value={locationType}
              onValueChange={setLocationType}
              className="grid grid-cols-2 gap-2"
            >
              {LOCATION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors ${
                    locationType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={type.value} className="sr-only" />
                  <type.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Button onClick={handleConfirm} className="w-full rounded-xl">
            ✅ Confirmar Local
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventMapPicker;
