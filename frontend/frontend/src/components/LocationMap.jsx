import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom store icon
const storeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom user location icon
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map clicks
const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e);
      }
    },
  });
  return null;
};

// Component to fix map size and handle updates
const MapController = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    // Fix map size on mount and when container becomes visible
    const fixSize = () => {
      map.invalidateSize();
    };
    
    // Run multiple times to handle modal animations
    fixSize();
    const t1 = setTimeout(fixSize, 100);
    const t2 = setTimeout(fixSize, 300);
    const t3 = setTimeout(fixSize, 500);
    const t4 = setTimeout(fixSize, 1000);
    
    // Also fix on window resize
    window.addEventListener('resize', fixSize);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', fixSize);
    };
  }, [map]);

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

const LocationMap = ({
  center = [27.7172, 85.324],
  zoom = 13,
  storeLocations = [],
  userLocation = null,
  selectedLocation = null,
  showRadius = true,
  onMapClick = null,
  onMarkerClick = null,
  className = "",
  height = 400,
}) => {
  const mapRef = useRef(null);
  
  // Handle height - keep as string if it's a percentage, otherwise use px
  const getHeightStyle = () => {
    if (typeof height === 'string') {
      if (height.includes('%')) {
        return height;
      }
      return `${parseInt(height) || 400}px`;
    }
    return `${height}px`;
  };

  return (
    <div 
      className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} 
      style={{ 
        height: getHeightStyle(), 
        width: '100%', 
        position: 'relative',
        zIndex: 1 
      }}
    >
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} />
        {onMapClick && <MapClickHandler onClick={onMapClick} />}

        {/* Store location markers */}
        {storeLocations.map((store) => (
          <div key={store.id}>
            <Marker
              position={[parseFloat(store.latitude), parseFloat(store.longitude)]}
              icon={storeIcon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(store),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">{store.name}</h3>
                  <p className="text-gray-600">{store.address}</p>
                  <p className="text-gray-500">Radius: {store.radius} km</p>
                </div>
              </Popup>
            </Marker>
            {showRadius && (
              <Circle
                center={[parseFloat(store.latitude), parseFloat(store.longitude)]}
                radius={store.radius * 1000}
                pathOptions={{
                  color: "#0B4E3C",
                  fillColor: "#0B4E3C",
                  fillOpacity: 0.1,
                }}
              />
            )}
          </div>
        ))}

        {/* Selected location marker (for adding new store) */}
        {selectedLocation && (
          <>
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={storeIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">New Store Location</p>
                  <p className="text-gray-600">
                    Lat: {selectedLocation.lat.toFixed(6)}
                  </p>
                  <p className="text-gray-600">
                    Lng: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
            {showRadius && selectedLocation.radius && (
              <Circle
                center={[selectedLocation.lat, selectedLocation.lng]}
                radius={selectedLocation.radius * 1000}
                pathOptions={{
                  color: "#0B4E3C",
                  fillColor: "#0B4E3C",
                  fillOpacity: 0.1,
                  dashArray: "5, 10",
                }}
              />
            )}
          </>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
