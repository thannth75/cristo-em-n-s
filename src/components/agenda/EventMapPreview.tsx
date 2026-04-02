import { useEffect, useState } from "react";
import { Navigation, MapPin, ExternalLink, Church, Home, Globe, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface EventMapPreviewProps {
  latitude: number;
  longitude: number;
  address?: string | null;
  locationType?: string | null;
  title?: string;
  compact?: boolean;
}

const LOCATION_TYPE_INFO: Record<string, { label: string; icon: typeof Church }> = {
  igreja: { label: "Igreja", icon: Church },
  casa: { label: "Casa", icon: Home },
  externo: { label: "Evento Externo", icon: Globe },
  outro: { label: "Outro", icon: MoreHorizontal },
};

const createMarkerIcon = () =>
  L.divIcon({
    html: `<div style="background:hsl(142,40%,20%);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

// Component to auto-resize map when container dimensions change (dialog animation)
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const intervals = [100, 300, 600, 1000, 2000];
    const timers = intervals.map((ms) =>
      setTimeout(() => map.invalidateSize(), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
};

const STREET_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const EventMapPreview = ({
  latitude,
  longitude,
  address,
  locationType,
  title = "Local do Evento",
  compact = false,
}: EventMapPreviewProps) => {
  const [isSatellite, setIsSatellite] = useState(false);
  const markerIcon = createMarkerIcon();

  const openNavigation = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
      "_blank"
    );
  };

  const shareLocation = () => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    if (navigator.share) {
      navigator.share({ title, text: address || title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const typeInfo = locationType ? LOCATION_TYPE_INFO[locationType] : null;
  const TypeIcon = typeInfo?.icon || MapPin;

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ background: "#ddd" }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          zoomControl={false}
          dragging={!compact}
          scrollWheelZoom={false}
          touchZoom={!compact}
          style={{ zIndex: 0, height: compact ? "100px" : "180px", width: "100%", background: "#ddd" }}
        >
          <TileLayer
            url={isSatellite ? SATELLITE_URL : STREET_URL}
            attribution={isSatellite ? "© Esri" : "© OSM"}
            maxZoom={19}
          />
          <Marker position={[latitude, longitude]} icon={markerIcon} />
          <MapResizer />
        </MapContainer>
        {!compact && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 z-[1000] rounded-lg text-[10px] shadow-md h-6 px-1.5"
            onClick={() => setIsSatellite(!isSatellite)}
          >
            {isSatellite ? "🗺️" : "🛰️"}
          </Button>
        )}
      </div>

      {(address || typeInfo) && (
        <div className="rounded-xl bg-muted/50 p-2.5">
          <div className="flex items-start gap-2">
            <TypeIcon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              {typeInfo && <span className="text-[10px] font-medium text-primary">{typeInfo.label}</span>}
              {address && <p className="text-xs text-foreground mt-0.5 break-words line-clamp-2">{address}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={openNavigation} className="flex-1 rounded-xl gap-1.5 text-xs h-9" variant="default">
          <Navigation className="h-3.5 w-3.5" />
          Ir para o Local
        </Button>
        <Button onClick={shareLocation} variant="outline" size="icon" className="rounded-xl h-9 w-9">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default EventMapPreview;
