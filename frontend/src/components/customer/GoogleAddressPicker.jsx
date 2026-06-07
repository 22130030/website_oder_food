import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = {
  lat: 10.762622,
  lng: 106.660172,
};

// Đổi chỗ này thành tọa độ quán / cửa hàng của bạn
const STORE_LOCATION = {
  lat: 10.762622,
  lng: 106.660172,
};

const calculateDistanceKm = (from, to) => {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};

const buildPlaceId = (item) => {
  if (!item) return "";

  if (item.place_id) {
    return `osm_place_${item.place_id}`;
  }

  if (item.osm_type && item.osm_id) {
    return `${item.osm_type}_${item.osm_id}`;
  }

  return "";
};

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const MapFlyTo = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position?.lat && position?.lng) {
      map.flyTo([position.lat, position.lng], 16, {
        duration: 0.6,
      });
    }
  }, [position, map]);

  return null;
};

export default function GoogleAddressPicker({ value, onChange }) {
  const [keyword, setKeyword] = useState(value || "");
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState("");

  const skipSearchRef = useRef(false);

  useEffect(() => {
    setKeyword(value || "");
  }, [value]);

  const emitAddress = ({ address, lat, lng, placeId }) => {
    const shippingDistanceKm = calculateDistanceKm(STORE_LOCATION, {
      lat,
      lng,
    });

    onChange?.({
      shippingAddress: address,
      shippingLat: lat,
      shippingLng: lng,
      shippingPlaceId: placeId || "",
      shippingDistanceKm,
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      setError("");

      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${lat}` +
        `&lon=${lng}` +
        `&zoom=18` +
        `&addressdetails=1` +
        `&accept-language=vi`;

      const res = await fetch(url);
      const data = await res.json();

      const address = data?.display_name || `${lat}, ${lng}`;

      skipSearchRef.current = true;
      setKeyword(address);
      setPosition({ lat, lng });
      setSuggestions([]);
      setShowSuggestions(false);

      emitAddress({
        address,
        lat,
        lng,
        placeId: buildPlaceId(data),
      });
    } catch (err) {
      console.error("Reverse geocode error:", err);
      setError("Không lấy được địa chỉ từ vị trí đã chọn.");
    }
  };

  const handleInputChange = (e) => {
    const address = e.target.value;

    setKeyword(address);
    setShowSuggestions(true);

    onChange?.({
      shippingAddress: address,
      shippingLat: null,
      shippingLng: null,
      shippingPlaceId: "",
      shippingDistanceKm: null,
    });
  };

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const text = keyword.trim();

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        setError("");

        const url =
          `https://nominatim.openstreetmap.org/search?format=jsonv2` +
          `&q=${encodeURIComponent(text)}` +
          `&countrycodes=vn` +
          `&limit=5` +
          `&addressdetails=1` +
          `&accept-language=vi`;

        const res = await fetch(url);
        const data = await res.json();

        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Search address error:", err);
        setError("Không tìm được địa chỉ. Bạn có thể chọn trực tiếp trên bản đồ.");
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSelectSuggestion = (item) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    const address = item.display_name || "";

    skipSearchRef.current = true;
    setKeyword(address);
    setPosition({ lat, lng });
    setSuggestions([]);
    setShowSuggestions(false);

    emitAddress({
      address,
      lat,
      lng,
      placeId: buildPlaceId(item),
    });
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const latLng = marker.getLatLng();

    reverseGeocode(latLng.lat, latLng.lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setLoadingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        await reverseGeocode(lat, lng);
        setLoadingLocation(false);
      },
      () => {
        setError("Không lấy được vị trí hiện tại. Bạn có thể nhập địa chỉ thủ công.");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <div className="address-picker">
      <div className="address-picker-input-row">
        <div className="address-picker-search-wrap">
          <input
            className="address-picker-input"
            placeholder="Nhập địa chỉ hoặc tên địa điểm giao hàng"
            value={keyword}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="address-picker-suggestions">
              {suggestions.map((item) => (
                <button
                  key={`${item.place_id}-${item.osm_id}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <strong>{item.name || "Địa chỉ gợi ý"}</strong>
                  <span>{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="address-picker-current-btn"
          onClick={handleUseCurrentLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? "Đang lấy..." : "Vị trí hiện tại"}
        </button>
      </div>

      {searching && (
        <p className="address-picker-status">Đang tìm địa chỉ...</p>
      )}

      {error && <p className="address-picker-error">{error}</p>}

      <div className="address-picker-map">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={14}
          scrollWheelZoom={true}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFlyTo position={position} />

          <MapClickHandler onPick={reverseGeocode} />

          <Marker
            position={[position.lat, position.lng]}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
        </MapContainer>
      </div>

      <p className="address-picker-hint">
        Gợi ý: bạn có thể nhập địa chỉ, chọn địa chỉ gợi ý, click trên bản đồ hoặc kéo ghim để chọn vị trí giao hàng chính xác hơn.
      </p>
    </div>
  );
}