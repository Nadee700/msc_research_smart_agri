import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
      google: any; // More specific types can be defined if needed
      initMap: () => void;
    }
  }
  
const GoogleMapWithSearch: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const loadScript = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&libraries=places&v=weekly&callback=initMap`;
    script.defer = true;
    document.head.appendChild(script);

    // Define callback globally
    window.initMap = () => {
      setScriptLoaded(true);
    };
  };

  useEffect(() => {
    if (!window?.google) {
      loadScript();
    } else {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: -33.8688, lng: 151.2195 },
        zoom: 13,
        mapTypeId: "roadmap",
      });

      const searchBox = new window.google.maps.places.SearchBox(inputRef.current);
      map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(inputRef.current);

      map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
      });

      let markers: any[] = [];

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length === 0) {
          return;
        }

        markers.forEach(marker => marker.setMap(null));
        markers = [];

        const bounds = new window.google.maps.LatLngBounds();

        places.forEach((place: { geometry: { location: any; viewport: any; }; icon: any; name: any; }) => {
          if (!place.geometry || !place.geometry.location) {
            console.log("Returned place contains no geometry");
            return;
          }

          const icon = {
            url: place.icon,
            size: new window.google.maps.Size(71, 71),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(17, 34),
            scaledSize: new window.google.maps.Size(25, 25),
          };

          markers.push(
            new window.google.maps.Marker({
              map,
              icon,
              title: place.name,
              position: place.geometry.location,
            })
          );

          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
      });
    }
  }, [scriptLoaded]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search places..."
        className="form-input mt-2 block w-1/3 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
      <div ref={mapRef} className="w-full h-full mt-5" />
    </div>
  );
};

export default GoogleMapWithSearch;
