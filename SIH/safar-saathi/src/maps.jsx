import React, {
  useEffect,
  useRef,
  useState
} from 'react'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geocodeIndianLocation } from './ui'


/* =========================================================
   LIVE MAP TRUCK DATA
========================================================= */

const initialTrucks = [
  {
    id: 1,
    name: 'RF-1024',
    driver: 'Ramesh Kumar',
    start: [20.2961, 85.8245],
    destinationPoint: [20.4625, 85.8828],
    status: 'Moving',
    load: 'Rice',
    destination: 'Cuttack',
    speed: 42,
    routeChanged: true,
    changeReason:
      'Road blockage reported on the AI suggested route'
  },
  {
    id: 2,
    name: 'RF-2048',
    driver: 'Suresh Patel',
    start: [20.4625, 85.8828],
    destinationPoint: [20.2961, 85.8245],
    status: 'Moving',
    load: 'Vegetables',
    destination: 'Bhubaneswar',
    speed: 36,
    routeChanged: false,
    changeReason: ''
  },
  {
    id: 3,
    name: 'RF-3096',
    driver: 'Amit Singh',
    start: [20.37, 85.86],
    destinationPoint: [20.41, 85.88],
    status: 'Stopped',
    load: 'Potatoes',
    destination: 'Collection Hub',
    speed: 0,
    routeChanged: false,
    changeReason: ''
  },
  {
    id: 4,
    name: 'RF-4012',
    driver: 'Rajesh Das',
    start: [20.28, 85.8],
    destinationPoint: [20.44, 85.88],
    status: 'Moving',
    load: 'Grains',
    destination: 'Cuttack',
    speed: 30,
    routeChanged: true,
    changeReason:
      'Heavy traffic detected on the recommended route'
  },
  {
    id: 5,
    name: 'RF-5021',
    driver: 'Vikash Sharma',
    start: [20.25, 85.78],
    destinationPoint: [20.35, 85.84],
    status: 'Offline',
    load: 'Fruits',
    destination: 'Bhubaneswar',
    speed: 0,
    routeChanged: false,
    changeReason: ''
  }
]


/* =========================================================
   HELPERS
========================================================= */

function getStatusColor(status) {
  if (status === 'Moving') return '#22c55e'
  if (status === 'Stopped') return '#f59e0b'

  return '#6b7280'
}


function getStatusDot(status) {
  if (status === 'Moving') return '🟢'
  if (status === 'Stopped') return '🟠'

  return '⚪'
}


function formatDistance(meters) {
  if (!meters) return '—'

  return `${(meters / 1000).toFixed(1)} km`
}


function formatDuration(seconds) {
  if (!seconds) return '—'

  const minutes = Math.round(seconds / 60)

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}


function getBearing(start, end) {
  const lat1 = (start[0] * Math.PI) / 180
  const lat2 = (end[0] * Math.PI) / 180

  const deltaLng =
    ((end[1] - start[1]) * Math.PI) / 180

  const y =
    Math.sin(deltaLng) * Math.cos(lat2)

  const x =
    Math.cos(lat1) *
      Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(deltaLng)

  return (
    ((Math.atan2(y, x) * 180) /
      Math.PI +
      360) %
    360
  )
}


/* =========================================================
   ROAD ROUTE
========================================================= */

async function getRoadRoute(
  start,
  end,
  alternatives = false
) {
  const coordinates =
    `${start[1]},${start[0]};${end[1]},${end[0]}`

  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
    `?overview=full&geometries=geojson&alternatives=${alternatives}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      'Could not load road route'
    )
  }

  const data = await response.json()

  if (
    data.code !== 'Ok' ||
    !data.routes?.length
  ) {
    throw new Error(
      'No road route found'
    )
  }

  return data.routes.map(route => ({
    points:
      route.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      ),

    distance: route.distance,

    duration: route.duration
  }))
}


/* =========================================================
   TRUCK ICON
========================================================= */

function getTruckIcon(status) {
  return L.divIcon({
    className: 'custom-truck-marker',

    html: `
      <div
        style="
          width:44px;
          height:44px;
          background:${getStatusColor(status)};
          border:3px solid white;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 3px 10px rgba(0,0,0,.35);
          cursor:pointer;
          pointer-events:auto;
        "
      >
        <div
          class="truck-icon"
          style="
            font-size:22px;
            transform:rotate(0deg);
            transform-origin:center;
            transition:transform .15s linear;
            pointer-events:none;
          "
        >
          🚚
        </div>
      </div>
    `,

    iconSize: [44, 44],

    iconAnchor: [22, 22]
  })
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function Maps({
  mode = 'live',
  trips = [],
  selectedTripId = null,
  onTripSelect = null,
  activeRequest = null,
  focusMode = null
}) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markersRef = useRef({})
  const routeLayersRef = useRef({})
  const activeRouteLayersRef = useRef([])
  const activeRouteMarkersRef = useRef([])
  const trucksRef = useRef([])
  const animationRef = useRef(null)
  const lastTimeRef = useRef(null)
  const selectedTruckIdRef = useRef(null)

  const [routeInfo, setRouteInfo] = useState(null)
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [trucks, setTrucks] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [routeError, setRouteError] =
    useState(false)

  const [followTruck, setFollowTruck] =
    useState(false)

  const [sidebarOpen, setSidebarOpen] =
    useState(true)


  /* =====================================================
     FIND VEHICLE MODE
  ===================================================== */

  useEffect(() => {

    if (mode !== 'findVehicle') return

    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView(
      [20.5937, 78.9629],
      5
    )

    leafletMapRef.current = map


    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(map)


    L.control.zoom({
      position: 'bottomright'
    }).addTo(map)

    setLoading(false)

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }

  }, [mode])


  /* =====================================================
     UPDATE FIND VEHICLE INDEPENDENT MARKERS
  ===================================================== */

  useEffect(() => {

    if (
      mode !== 'findVehicle' ||
      !leafletMapRef.current
    ) {
      return
    }

    const map = leafletMapRef.current

    Object.values(markersRef.current).forEach(marker => {
      map.removeLayer(marker)
    })

    markersRef.current = {}

    trips.forEach(trip => {
      if (
        trip.lat === undefined ||
        trip.lng === undefined ||
        (trip.lat === 0 && trip.lng === 0) ||
        trip.status === 'cancelled_by_driver' ||
        trip.status === 'cancelled' ||
        trip.status === 'completed'
      ) {
        return
      }

      const isLive = trip.status === 'in_transit' || trip.is_live;
      const truckIcon = isLive ? getTruckIcon('Moving') : getTruckIcon('Stopped');

      // 1. Independent Live Driver / Vehicle Location Marker
      const driverMarker = L.marker(
        [trip.lat, trip.lng],
        { icon: truckIcon }
      )
        .addTo(map)
        .bindPopup(`
          <div style="min-width:210px;font-family:Arial,sans-serif;padding:4px;">
            ${isLive ? `<div style="background:#22c55e;color:white;font-weight:bold;padding:3px 8px;border-radius:12px;display:inline-block;font-size:11px;margin-bottom:6px;">🔴 LIVE IN-TRANSIT (${trip.speed || 35} km/h)</div><br/>` : `<div style="background:#4b5563;color:white;font-weight:bold;padding:3px 8px;border-radius:12px;display:inline-block;font-size:11px;margin-bottom:6px;">🚛 SCHEDULED VEHICLE</div><br/>`}
            <b style="font-size:14px;color:#1F3D2B;">
              🚚 ${trip.from || trip.from_loc} → ${trip.to || trip.to_loc}
            </b>
            <br/>
            <span style="font-size:12px;color:#4b5563;">👤 Owner: ${trip.owner}</span>
            <br/>
            <span style="font-size:12px;color:#4b5563;">🚛 Vehicle: ${trip.vehicle}</span>
            <br/>
            <span style="font-size:12px;color:#166534;font-weight:600;">Status: ${(trip.status || 'scheduled').toUpperCase()}</span>
          </div>
        `);

      driverMarker.on('click', () => {
        if (onTripSelect) onTripSelect(trip);
      });
      markersRef.current[`driver_${trip.id}`] = driverMarker;

      // 2. Independent Pickup Location Marker
      const pLat = trip.pickup_lat || trip.lat;
      const pLng = trip.pickup_lng || trip.lng;
      if (pLat && pLng) {
        const pickupIcon = L.divIcon({
          className: 'pickup-point-icon',
          html: `<div style="background:#f59e0b;color:white;width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:12px;">📦</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const pickupMarker = L.marker(
          [pLat, pLng],
          { icon: pickupIcon }
        )
          .addTo(map)
          .bindPopup(`
            <div style="min-width:200px;font-family:Arial,sans-serif;padding:4px;">
              <div style="background:#f59e0b;color:white;font-weight:bold;padding:3px 8px;border-radius:12px;display:inline-block;font-size:11px;margin-bottom:6px;">📦 PICKUP LOCATION</div><br/>
              <b style="font-size:13px;color:#1F3D2B;">${trip.pickup || trip.from || 'Pickup Point'}</b><br/>
              <span style="font-size:12px;color:#4b5563;">🚛 Vehicle: ${trip.vehicle} (${trip.owner})</span><br/>
              <span style="font-size:12px;color:#166534;font-weight:600;">Available: ${trip.available_space_kg ?? (trip.total_kg || 1000)} kg</span>
            </div>
          `);

        pickupMarker.on('click', () => {
          if (onTripSelect) onTripSelect(trip);
        });
        markersRef.current[`pickup_${trip.id}`] = pickupMarker;
      }
    });

  }, [trips, mode, onTripSelect])


  /* =====================================================
     SMOOTH TARGET FOCUSING (PICKUP vs LIVE DRIVER)
  ===================================================== */

  useEffect(() => {
    if (mode !== 'findVehicle' || !leafletMapRef.current || !focusMode) return;
    const map = leafletMapRef.current;
    const { type, lat, lng, tripId } = focusMode;
    if (!lat || !lng) return;

    map.flyTo([lat, lng], type === 'live_driver' ? 15 : 14, {
      animate: true,
      duration: 1.2
    });

    const targetMarkerKey = type === 'live_driver' ? `driver_${tripId}` : `pickup_${tripId}`;
    const marker = markersRef.current[targetMarkerKey] || markersRef.current[tripId];
    if (marker) {
      setTimeout(() => {
        try {
          marker.openPopup();
        } catch (e) {}
      }, 500);
    }
  }, [focusMode, mode]);



  /* =====================================================
     GOOGLE MAPS STYLE ROUTE RENDERER FOR SELECTED VEHICLE
  ===================================================== */

  useEffect(() => {
    if (mode !== 'findVehicle' || !leafletMapRef.current) return;
    const map = leafletMapRef.current;

    // Clean up previous route layers & markers
    activeRouteLayersRef.current.forEach(layer => map.removeLayer(layer));
    activeRouteLayersRef.current = [];
    activeRouteMarkersRef.current.forEach(marker => map.removeLayer(marker));
    activeRouteMarkersRef.current = [];

    if (!selectedTripId) {
      setRouteInfo(null);
      return;
    }

    const trip = trips.find(item => item.id === selectedTripId);
    if (!trip || trip.status === 'cancelled_by_driver' || trip.status === 'cancelled') {
      setRouteInfo(null);
      return;
    }

    let isMounted = true;

    async function drawTripRoute() {
      try {
        const startLat = trip.lat;
        const startLng = trip.lng;
        if (!startLat || !startLng) return;

        let destLat = trip.destLat;
        let destLng = trip.destLng;


        if (!destLat || !destLng) {
          const destResolved = await geocodeIndianLocation(trip.to || trip.to_loc);
          if (destResolved) {
            destLat = destResolved.lat;
            destLng = destResolved.lng;
          } else {
            destLat = startLat + 0.8;
            destLng = startLng + 0.8;
          }
        }

        const startCoords = [startLat, startLng];
        const destCoords = [destLat, destLng];

        const routes = await getRoadRoute(startCoords, destCoords, false);
        if (!isMounted || !routes || routes.length === 0) return;

        const bestRoute = routes[0];
        const points = bestRoute.points;

        // 1. Google Maps Outer Dark Blue Glow Casing Polyline
        const casingPolyline = L.polyline(points, {
          color: '#1d4ed8',
          weight: 8,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // 2. Google Maps Inner Vibrant Sky Blue Driving Route Line
        const corePolyline = L.polyline(points, {
          color: '#38bdf8',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        activeRouteLayersRef.current = [casingPolyline, corePolyline];

        // 3. Start Marker (🟢 Driver Origin)
        const startIcon = L.divIcon({
          className: 'route-start-icon',
          html: `<div style="background:#16a34a;color:white;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;">🟢</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        const startMarker = L.marker(startCoords, { icon: startIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1F3D2B;">🟢 Origin:<br/><span style="font-weight:normal;color:#4b5563;">${trip.from || trip.from_loc}</span></div>`);

        // 4. Destination Marker (🏁 Driver Destination)
        const destIcon = L.divIcon({
          className: 'route-dest-icon',
          html: `<div style="background:#dc2626;color:white;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;">🏁</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        const destMarker = L.marker(destCoords, { icon: destIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1F3D2B;">🏁 Destination:<br/><span style="font-weight:normal;color:#4b5563;">${trip.to || trip.to_loc}</span></div>`);

        const newMarkers = [startMarker, destMarker];

        // 5. Sender Custom Pickup Pin (📦 Pickup)
        if (activeRequest?.pickupCoords?.lat && activeRequest?.pickupCoords?.lng) {
          const pickupIcon = L.divIcon({
            className: 'sender-pickup-icon',
            html: `<div style="background:#f59e0b;color:white;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;">📦</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          const pickupMarker = L.marker([activeRequest.pickupCoords.lat, activeRequest.pickupCoords.lng], { icon: pickupIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1F3D2B;">📦 Your Pickup:<br/><span style="font-weight:normal;color:#4b5563;">${activeRequest.pickupLocation}</span></div>`);
          newMarkers.push(pickupMarker);
        }

        // 6. Sender Custom Delivery Pin (🎯 Delivery)
        if (activeRequest?.deliveryCoords?.lat && activeRequest?.deliveryCoords?.lng) {
          const deliveryIcon = L.divIcon({
            className: 'sender-delivery-icon',
            html: `<div style="background:#8b5cf6;color:white;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;">🎯</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          const deliveryMarker = L.marker([activeRequest.deliveryCoords.lat, activeRequest.deliveryCoords.lng], { icon: deliveryIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1F3D2B;">🎯 Your Delivery:<br/><span style="font-weight:normal;color:#4b5563;">${activeRequest.deliveryLocation}</span></div>`);
          newMarkers.push(deliveryMarker);
        }

        activeRouteMarkersRef.current = newMarkers;

        // 7. Google Maps style Bounds Fitting
        const bounds = L.latLngBounds(points);
        if (activeRequest?.pickupCoords?.lat) bounds.extend([activeRequest.pickupCoords.lat, activeRequest.pickupCoords.lng]);
        if (activeRequest?.deliveryCoords?.lat) bounds.extend([activeRequest.deliveryCoords.lat, activeRequest.deliveryCoords.lng]);
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 13, animate: true, duration: 1 });

        setRouteInfo({
          from: trip.from || trip.from_loc,
          to: trip.to || trip.to_loc,
          distanceKm: (bestRoute.distance / 1000).toFixed(1),
          durationText: formatDuration(Math.round(bestRoute.duration / 60))
        });

      } catch (err) {
        console.error("Failed to load and draw road route", err);
      }
    }

    drawTripRoute();

    return () => {
      isMounted = false;
    };
  }, [selectedTripId, activeRequest, mode, trips])


  /* =====================================================
     LIVE MAP SETUP
  ===================================================== */

  useEffect(() => {

    if (mode !== 'live') return

    let mounted = true


    async function setupMap() {

      const map = L.map(
        mapRef.current,
        {
          zoomControl: false
        }
      ).setView(
        [20.37, 85.84],
        11
      )


      leafletMapRef.current = map


      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; OpenStreetMap contributors'
        }
      ).addTo(map)


      L.control.zoom({
        position: 'bottomright'
      }).addTo(map)


      try {

        const loadedTrucks =
          await Promise.all(

            initialTrucks.map(
              async truck => {

                const routes =
                  await getRoadRoute(
                    truck.start,
                    truck.destinationPoint,
                    true
                  )


                const aiRoute =
                  routes[0]


                const actualRoute =
                  truck.routeChanged &&
                  routes[1]
                    ? routes[1]
                    : aiRoute


                return {

                  ...truck,

                  aiRoute:
                    aiRoute.points,

                  actualRoute:
                    actualRoute.points,

                  position: [
                    ...actualRoute.points[0]
                  ],

                  routeIndex: 0,

                  direction: 1,

                  aiDistance:
                    aiRoute.distance,

                  aiDuration:
                    aiRoute.duration,

                  actualDistance:
                    actualRoute.distance,

                  actualDuration:
                    actualRoute.duration
                }

              }
            )
          )


        if (!mounted) return


        trucksRef.current =
          loadedTrucks

        setTrucks([
          ...loadedTrucks
        ])


        loadedTrucks.forEach(
          truck => {

            const aiLine =
              L.polyline(
                truck.aiRoute,
                {
                  color: '#22c55e',
                  weight: 4,
                  opacity: 0.55,
                  dashArray: '10 10'
                }
              )


            const actualLine =
              L.polyline(
                truck.actualRoute,
                {
                  color: '#2563eb',
                  weight: 4,
                  opacity: 0.85
                }
              )


            routeLayersRef.current[
              truck.id
            ] = {
              aiLine,
              actualLine
            }


            const marker =
              L.marker(
                truck.position,
                {
                  icon:
                    getTruckIcon(
                      truck.status
                    ),

                  interactive: true,

                  keyboard: true,

                  riseOnHover: true,

                  zIndexOffset: 1000
                }
              ).addTo(map)


            marker.on(
              'click',
              () => {
                selectTruck(truck.id)
              }
            )


            markersRef.current[
              truck.id
            ] = marker

          }
        )


        setLoading(false)

      } catch (error) {

        console.error(error)

        if (mounted) {

          setRouteError(true)

          setLoading(false)

        }

      }

    }


    setupMap()


    return () => {

      mounted = false


      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        )
      }


      if (
        leafletMapRef.current
      ) {

        leafletMapRef.current.remove()

        leafletMapRef.current =
          null

      }

    }

  }, [mode])


  /* =====================================================
     SELECT TRUCK
  ===================================================== */

  const selectTruck = truckId => {

    selectedTruckIdRef.current =
      truckId


    const truck =
      trucksRef.current.find(
        item =>
          item.id === truckId
      )


    if (!truck) return


    setSelectedTruck({
      ...truck
    })


    setFollowTruck(false)


    const map =
      leafletMapRef.current


    if (map) {

      map.flyTo(
        truck.position,
        13,
        {
          duration: 0.8
        }
      )

    }

  }


  /* =====================================================
     LIVE TRUCK ANIMATION
  ===================================================== */

  useEffect(() => {

    if (
      mode !== 'live' ||
      loading ||
      routeError
    ) {
      return
    }


    const animate =
      timestamp => {

        if (
          !lastTimeRef.current
        ) {

          lastTimeRef.current =
            timestamp

        }


        const deltaTime =
          timestamp -
          lastTimeRef.current


        lastTimeRef.current =
          timestamp


        trucksRef.current.forEach(
          truck => {

            if (
              truck.status !==
                'Moving' ||
              !truck.actualRoute?.length
            ) {
              return
            }


            const movement =
              (deltaTime / 1000) *
              0.35


            truck.routeIndex +=
              movement *
              truck.direction


            const lastIndex =
              truck.actualRoute.length -
              1


            if (
              truck.routeIndex >=
              lastIndex
            ) {

              truck.routeIndex =
                lastIndex

              truck.direction =
                -1

            }


            if (
              truck.routeIndex <=
              0
            ) {

              truck.routeIndex = 0

              truck.direction = 1

            }


            const index =
              Math.floor(
                truck.routeIndex
              )


            const nextIndex =
              Math.min(
                index + 1,
                lastIndex
              )


            const fraction =
              truck.routeIndex -
              index


            const current =
              truck.actualRoute[
                index
              ]


            const next =
              truck.actualRoute[
                nextIndex
              ]


            const newPosition = [

              current[0] +
                (next[0] -
                  current[0]) *
                  fraction,

              current[1] +
                (next[1] -
                  current[1]) *
                  fraction

            ]


            truck.position =
              newPosition


            const marker =
              markersRef.current[
                truck.id
              ]


            if (marker) {

              marker.setLatLng(
                newPosition
              )


              const rotation =
                truck.direction === 1
                  ? getBearing(
                      current,
                      next
                    )
                  : getBearing(
                      next,
                      current
                    )


              const markerElement =
                marker.getElement()


              if (markerElement) {

                const truckElement =
                  markerElement.querySelector(
                    '.truck-icon'
                  )


                if (
                  truckElement
                ) {

                  truckElement.style.transform =
                    `rotate(${rotation}deg)`

                }

              }

            }

          }
        )


        const selectedId =
          selectedTruckIdRef.current


        if (
          selectedId !== null
        ) {

          const updatedTruck =
            trucksRef.current.find(
              truck =>
                truck.id ===
                selectedId
            )


          if (
            updatedTruck
          ) {

            setSelectedTruck({
              ...updatedTruck
            })

          }

        }


        if (
          Math.floor(
            timestamp / 1000
          ) !==
          Math.floor(
            (
              timestamp -
              deltaTime
            ) / 1000
          )
        ) {

          setTrucks([
            ...trucksRef.current
          ])

        }


        animationRef.current =
          requestAnimationFrame(
            animate
          )

      }


    animationRef.current =
      requestAnimationFrame(
        animate
      )


    return () => {

      if (
        animationRef.current
      ) {

        cancelAnimationFrame(
          animationRef.current
        )

      }

    }

  }, [
    mode,
    loading,
    routeError
  ])


  /* =====================================================
     SHOW SELECTED ROUTE
  ===================================================== */

  useEffect(() => {

    if (mode !== 'live') return


    const map =
      leafletMapRef.current


    if (!map) return


    Object.values(
      routeLayersRef.current
    ).forEach(
      ({
        aiLine,
        actualLine
      }) => {

        if (
          map.hasLayer(aiLine)
        ) {

          map.removeLayer(aiLine)

        }


        if (
          map.hasLayer(actualLine)
        ) {

          map.removeLayer(actualLine)

        }

      }
    )


    if (
      !selectedTruck
    ) return


    const layers =
      routeLayersRef.current[
        selectedTruck.id
      ]


    if (layers) {

      layers.aiLine.addTo(map)

      layers.actualLine.addTo(map)

    }

  }, [
    selectedTruck?.id,
    mode
  ])


  /* =====================================================
     FOLLOW TRUCK
  ===================================================== */

  useEffect(() => {

    if (
      mode !== 'live' ||
      !followTruck ||
      !selectedTruck ||
      !leafletMapRef.current
    ) {
      return
    }


    leafletMapRef.current.panTo(
      selectedTruck.position,
      {
        animate: true,
        duration: 0.3
      }
    )

  }, [
    selectedTruck?.position?.[0],
    selectedTruck?.position?.[1],
    followTruck,
    mode
  ])


  const closeTruck = () => {

    selectedTruckIdRef.current =
      null

    setSelectedTruck(null)

    setFollowTruck(false)

  }


  /* =====================================================
     FIND VEHICLE RETURN
  ===================================================== */

  if (mode === 'findVehicle') {

    return (

      <div
        className="
          relative
          w-full
          h-[420px]
          overflow-hidden
          rounded-2xl
          border
          border-gold/30
          shadow-sm
        "
      >

        <div
          ref={mapRef}
          className="
            w-full
            h-full
          "
        />

      </div>

    )

  }


  /* =====================================================
     LIVE MAP VALUES
  ===================================================== */

  const movingCount =
    trucks.filter(
      truck =>
        truck.status ===
        'Moving'
    ).length


  const stoppedCount =
    trucks.filter(
      truck =>
        truck.status ===
        'Stopped'
    ).length


  const offlineCount =
    trucks.filter(
      truck =>
        truck.status ===
        'Offline'
    ).length


  /* =====================================================
     LIVE MAP RETURN
  ===================================================== */

  return (

    <div
      style={{
        width: '100%',
        height:
          'calc(100vh - 70px)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />


      {/* HEADER */}

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left:
            sidebarOpen
              ? '350px'
              : '20px',
          zIndex: 1000,
          background:
            'rgba(255,255,255,.96)',
          padding: '14px 18px',
          borderRadius: '14px',
          boxShadow:
            '0 5px 25px rgba(0,0,0,.18)',
          transition:
            'left .3s ease'
        }}
      >

        <div
          style={{
            fontWeight: 800,
            fontSize: '18px',
            color: '#14532d'
          }}
        >
          🚚 RuralFlow Live Map
        </div>

        <div
          style={{
            fontSize: '13px',
            marginTop: '4px',
            color: '#666'
          }}
        >
          {movingCount} vehicles moving live
        </div>

      </div>


      {/* SIDEBAR */}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left:
            sidebarOpen
              ? 0
              : '-330px',
          zIndex: 1100,
          width: '330px',
          height: '100%',
          background:
            'rgba(255,255,255,.98)',
          boxShadow:
            '4px 0 25px rgba(0,0,0,.15)',
          transition:
            'left .3s ease',
          display: 'flex',
          flexDirection:
            'column'
        }}
      >

        <div
          style={{
            padding: '20px',
            borderBottom:
              '1px solid #e5e7eb'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '19px',
                  fontWeight: 800,
                  color: '#14532d'
                }}
              >
                🚚 LIVE VEHICLES
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#777',
                  marginTop: '4px'
                }}
              >
                Real-time RuralFlow tracking
              </div>

            </div>


            <button
              onClick={() =>
                setSidebarOpen(false)
              }
              style={{
                border: 'none',
                background: '#f3f4f6',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ←
            </button>

          </div>


          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px'
            }}
          >

            <div
              style={{
                flex: 1,
                background: '#f0fdf4',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '11px',
                textAlign:
                  'center'
              }}
            >
              🟢 {movingCount}
              <br />
              Moving
            </div>


            <div
              style={{
                flex: 1,
                background: '#fffbeb',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '11px',
                textAlign:
                  'center'
              }}
            >
              🟠 {stoppedCount}
              <br />
              Stopped
            </div>


            <div
              style={{
                flex: 1,
                background: '#f3f4f6',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '11px',
                textAlign:
                  'center'
              }}
            >
              ⚪ {offlineCount}
              <br />
              Offline
            </div>

          </div>

        </div>


        {/* TRUCK LIST */}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px'
          }}
        >

          {trucks.map(
            truck => {

              const isSelected =
                selectedTruck?.id ===
                truck.id


              return (

                <div
                  key={truck.id}
                  onClick={() =>
                    selectTruck(
                      truck.id
                    )
                  }
                  style={{
                    padding: '14px',
                    marginBottom: '8px',
                    borderRadius:
                      '12px',
                    cursor: 'pointer',
                    border:
                      isSelected
                        ? '2px solid #14532d'
                        : '1px solid #e5e7eb',
                    background:
                      isSelected
                        ? '#f0fdf4'
                        : 'white'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center'
                    }}
                  >

                    <div
                      style={{
                        fontWeight: 800,
                        color: '#1f2937'
                      }}
                    >
                      {getStatusDot(
                        truck.status
                      )}{' '}
                      {truck.name}
                    </div>


                    <div
                      style={{
                        fontSize: '11px',
                        color:
                          getStatusColor(
                            truck.status
                          ),
                        fontWeight: 700
                      }}
                    >
                      {truck.status}
                    </div>

                  </div>


                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '6px'
                    }}
                  >
                    👤 {truck.driver}
                  </div>


                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      marginTop: '10px',
                      fontSize: '12px'
                    }}
                  >

                    <span>
                      📦 {truck.load}
                    </span>


                    <span
                      style={{
                        fontWeight: 700,
                        color: '#14532d'
                      }}
                    >
                      {truck.speed} km/h
                    </span>

                  </div>


                  <div
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      marginTop: '8px'
                    }}
                  >
                    → {truck.destination}
                  </div>


                  {truck.routeChanged && (

                    <div
                      style={{
                        marginTop: '9px',
                        background:
                          '#fff7ed',
                        color:
                          '#c2410c',
                        padding:
                          '6px 8px',
                        borderRadius:
                          '6px',
                        fontSize:
                          '10px',
                        fontWeight: 700
                      }}
                    >
                      ⚠ Route changed
                    </div>

                  )}

                </div>

              )

            }
          )}

        </div>

      </div>


      {!sidebarOpen && (

        <button
          onClick={() =>
            setSidebarOpen(true)
          }
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1200,
            border: 'none',
            background: '#14532d',
            color: 'white',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ☰
        </button>

      )}


      {/* LOADING */}

      {loading && (

        <div
          style={{
            position: 'absolute',
            top: '95px',
            left:
              sidebarOpen
                ? '350px'
                : '20px',
            zIndex: 1000,
            background: 'white',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow:
              '0 4px 18px rgba(0,0,0,.15)'
          }}
        >
          🛣️ Loading road routes...
        </div>

      )}


      {/* ERROR */}

      {routeError && (

        <div
          style={{
            position: 'absolute',
            top: '95px',
            left:
              sidebarOpen
                ? '350px'
                : '20px',
            zIndex: 1000,
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '10px'
          }}
        >
          Could not load road routes.
        </div>

      )}


      {/* ROUTE LEGEND */}

      <div
        style={{
          position: 'absolute',
          bottom: '25px',
          left:
            sidebarOpen
              ? '350px'
              : '20px',
          zIndex: 1000,
          background:
            'rgba(255,255,255,.96)',
          padding: '14px 16px',
          borderRadius: '14px',
          boxShadow:
            '0 5px 25px rgba(0,0,0,.18)',
          fontSize: '13px'
        }}
      >

        <div
          style={{
            fontWeight: 700,
            marginBottom: '8px'
          }}
        >
          Route Legend
        </div>

        <div>
          🟢 Dashed — AI Suggested
        </div>

        <div>
          🔵 Solid — Actual Route
        </div>

      </div>


      {/* TRUCK DETAILS */}

      {selectedTruck && (

        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            width: '330px',
            maxHeight:
              'calc(100% - 40px)',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow:
              '0 8px 30px rgba(0,0,0,.25)'
          }}
        >

          <button
            onClick={closeTruck}
            style={{
              position: 'absolute',
              right: '12px',
              top: '10px',
              border: 'none',
              background:
                'transparent',
              fontSize: '22px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>


          <div
            style={{
              fontSize: '30px'
            }}
          >
            🚚
          </div>


          <h2
            style={{
              margin: '6px 0',
              color: '#14532d'
            }}
          >
            {selectedTruck.name}
          </h2>


          <div
            style={{
              display: 'inline-block',
              padding: '5px 10px',
              borderRadius: '20px',
              background:
                getStatusColor(
                  selectedTruck.status
                ),
              color: 'white',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {selectedTruck.status}
          </div>


          <hr
            style={{
              margin: '16px 0'
            }}
          />


          <p>
            <strong>Driver:</strong>{' '}
            {selectedTruck.driver}
          </p>

          <p>
            <strong>Load:</strong>{' '}
            {selectedTruck.load}
          </p>

          <p>
            <strong>Destination:</strong>{' '}
            {selectedTruck.destination}
          </p>

          <p>
            <strong>Speed:</strong>{' '}
            {selectedTruck.speed} km/h
          </p>


          <button
            onClick={() =>
              setFollowTruck(
                current => !current
              )
            }
            style={{
              width: '100%',
              marginTop: '10px',
              background:
                followTruck
                  ? '#2563eb'
                  : '#14532d',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '9px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {followTruck
              ? '📍 Following Truck'
              : '📍 Follow Truck'}
          </button>


          <hr
            style={{
              margin: '16px 0'
            }}
          />


          <div
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '14px'
            }}
          >

            <div
              style={{
                fontWeight: 800,
                color: '#14532d',
                marginBottom: '12px'
              }}
            >
              🤖 AI Route Analysis
            </div>


            <div>
              AI Distance:{' '}
              <strong>
                {formatDistance(
                  selectedTruck.aiDistance
                )}
              </strong>
            </div>


            <div>
              Actual Distance:{' '}
              <strong>
                {formatDistance(
                  selectedTruck.actualDistance
                )}
              </strong>
            </div>


            <div>
              AI ETA:{' '}
              <strong>
                {formatDuration(
                  selectedTruck.aiDuration
                )}
              </strong>
            </div>


            <div>
              Actual ETA:{' '}
              <strong>
                {formatDuration(
                  selectedTruck.actualDuration
                )}
              </strong>
            </div>

          </div>


          <hr
            style={{
              margin: '16px 0'
            }}
          />


          {selectedTruck.routeChanged ? (

            <div
              style={{
                background: '#fff7ed',
                border:
                  '1px solid #fb923c',
                borderRadius: '10px',
                padding: '12px'
              }}
            >

              <strong
                style={{
                  color: '#c2410c'
                }}
              >
                ⚠ Route Changed
              </strong>

              <p
                style={{
                  marginBottom: 0,
                  fontSize: '13px'
                }}
              >
                <strong>
                  Reason:
                </strong>{' '}
                {
                  selectedTruck.changeReason
                }
              </p>

            </div>

          ) : (

            <div
              style={{
                background: '#f0fdf4',
                border:
                  '1px solid #22c55e',
                borderRadius: '10px',
                padding: '12px',
                color: '#166534',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              ✓ Driver is following the AI suggested route
            </div>
          )}
        </div>
      )}

      {/* GOOGLE MAPS STYLE ROUTE CARD OVERLAY (FIND VEHICLE MODE) */}
      {mode === 'findVehicle' && routeInfo && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-gold/40 max-w-[260px] animate-[fadeIn_.3s_ease]">
          <div className="flex items-center gap-2 text-green-deep font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>DRIVING ROUTE</span>
          </div>
          <p className="font-display font-bold text-xs text-green-deep mt-1 truncate">
            {routeInfo.from} → {routeInfo.to}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
            <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
              🛣️ {routeInfo.distanceKm} km
            </span>
            <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
              ⏱ {routeInfo.durationText}
            </span>
          </div>
          {activeRequest?.pickupLocation && (
            <p className="text-[10px] text-green-deep mt-2 pt-1.5 border-t border-gold/20 truncate">
              📦 <span className="font-semibold">Pickup:</span> {activeRequest.pickupLocation}
            </p>
          )}
          {activeRequest?.deliveryLocation && (
            <p className="text-[10px] text-green-deep mt-0.5 truncate">
              🎯 <span className="font-semibold">Drop:</span> {activeRequest.deliveryLocation}
            </p>
          )}
        </div>
      )}

    </div>
  )

}


export default Maps