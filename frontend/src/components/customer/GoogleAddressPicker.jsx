import { useEffect, useRef, useState } from "react";

export default function GoogleAddressPicker({ apiKey, onChange }) {
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.google?.maps) return setLoaded(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !inputRef.current || !mapRef.current) return;
    const defaultCenter = { lat: 10.762622, lng: 106.660172 };
    const map = new window.google.maps.Map(mapRef.current, { center: defaultCenter, zoom: 13 });
    const marker = new window.google.maps.Marker({ map, position: defaultCenter, draggable: true });
    markerRef.current = marker;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "place_id", "name"],
      componentRestrictions: { country: "vn" }
    });

    const emit = (address, placeId, latLng) => {
      onChange?.({
        shippingAddress: address,
        shippingPlaceId: placeId,
        shippingLat: latLng.lat(),
        shippingLng: latLng.lng(),
        shippingDistanceKm: 5
      });
    };

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      const loc = place.geometry.location;
      map.setCenter(loc); marker.setPosition(loc);
      emit(place.formatted_address || place.name, place.place_id, loc);
    });

    marker.addListener("dragend", () => {
      const loc = marker.getPosition();
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: loc }, (results, status) => {
        const address = status === "OK" && results?.[0] ? results[0].formatted_address : `${loc.lat()}, ${loc.lng()}`;
        inputRef.current.value = address;
        emit(address, results?.[0]?.place_id, loc);
      });
    });
  }, [loaded, onChange]);

  return <div className="address-picker"><input ref={inputRef} className="form-control" placeholder="Nhập hoặc chọn địa chỉ giao hàng" /><div ref={mapRef} style={{ height: 320, borderRadius: 12, marginTop: 12 }} /></div>;
}
