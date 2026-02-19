import { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, ExternalLink, Church, Home, Globe, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const EventMapPreview = ({
  latitude,
  longitude,
  address,
  locationType,
  title = "Local do Evento",
  compact = false,
}: EventMapPreviewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.default.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
        dragging: !compact,
        scrollWheelZoom: false,
        touchZoom: !compact,
      });

      if (!compact) {
        L.default.control.zoom({ position: "bottomright" }).addTo(map);
      }

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
        html: `<div style="background:hsl(142, 40%, 20%);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      L.default.marker([latitude, longitude], { icon }).addTo(map);

      mapInstanceRef.current = map;
      (map as any)._streetLayer = streetLayer;
      (map as any)._satelliteLayer = satelliteLayer;

      setTimeout(() => map.invalidateSize(), 150);
    };

    const timer = setTimeout(initMap, 150);
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, compact]);

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
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <div ref={mapRef} className={compact ? "h-[100px]" : "h-[140px] sm:h-[180px]"} />
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

      {/* Location info */}
      {(address || typeInfo) && (
        <div className="rounded-xl bg-muted/50 p-2.5">
          <div className="flex items-start gap-2">
            <TypeIcon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              {typeInfo && (
                <span className="text-[10px] font-medium text-primary">{typeInfo.label}</span>
              )}
              {address && (
                <p className="text-xs text-foreground mt-0.5 break-words line-clamp-2">{address}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={openNavigation}
          className="flex-1 rounded-xl gap-1.5 text-xs h-9"
          variant="default"
        >
          <Navigation className="h-3.5 w-3.5" />
          Ir para o Local
        </Button>
        <Button
          onClick={shareLocation}
          variant="outline"
          size="icon"
          className="rounded-xl h-9 w-9"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default EventMapPreview;
