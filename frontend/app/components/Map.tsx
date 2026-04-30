'use client'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Map({ location }: { location: any }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const mapLoaded = useRef(false)

  const markers = useRef<mapboxgl.Marker[]>([])
  const currentMarker = useRef<mapboxgl.Marker | null>(null)

  // 🔥 MAIN FIX: active shipment lock
  const activeShipment = useRef<string>('')

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 20.5937],
      zoom: 4.5,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

    map.current.on('load', () => {
      mapLoaded.current = true
    })
  }, [])

  const waitForMap = () => {
    return new Promise<void>((resolve) => {
      if (mapLoaded.current) return resolve()

      const check = setInterval(() => {
        if (mapLoaded.current) {
          clearInterval(check)
          resolve()
        }
      }, 100)
    })
  }

  const getRoadRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
      const res = await fetch(url)
      const data = await res.json()
      return data.routes?.[0]?.geometry || null
    } catch {
      return null
    }
  }

  const removeLayer = (id: string) => {
    if (!map.current) return
    if (map.current.getLayer(id)) map.current.removeLayer(id)
    if (map.current.getSource(id)) map.current.removeSource(id)
  }

  const addRouteLayer = (id: string, geometry: any, color: string, width: number, opacity: number, dash?: number[]) => {
    if (!map.current || !geometry) return

    removeLayer(id)

    map.current.addSource(id, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry }
    })

    const paint: any = {
      'line-color': color,
      'line-width': width,
      'line-opacity': opacity
    }

    if (dash) paint['line-dasharray'] = dash

    map.current.addLayer({
      id,
      type: 'line',
      source: id,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint
    })
  }

  const updateTruckMarker = (lng: number, lat: number) => {
    if (currentMarker.current) {
      currentMarker.current.setLngLat([lng, lat])
      return
    }

    const el = document.createElement('div')
    el.style.cssText = `
      width:20px;height:20px;
      background:#10b981;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 10px #10b981;
    `

    currentMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.current!)
  }

  useEffect(() => {
    if (!map.current || !location?.current_lat) return

    const currentTracking = location.tracking_number

    // ✅ detect shipment switch
    const isNewShipment =
      activeShipment.current === '' ||
      currentTracking !== activeShipment.current

    // ✅ lock active shipment
    if (isNewShipment) {
      activeShipment.current = currentTracking
    }

    // 🚫 ignore outdated updates
    if (currentTracking !== activeShipment.current) return

    const lng = Number(location.current_lon)
    const lat = Number(location.current_lat)
    const originLng = Number(location.origin_lon)
    const originLat = Number(location.origin_lat)
    const destLng = Number(location.destination_lon)
    const destLat = Number(location.destination_lat)

    const setupMap = async () => {
      await waitForMap()

      // 🚫 async guard
      if (currentTracking !== activeShipment.current) return

      if (isNewShipment) {
        // clear markers
        markers.current.forEach(m => m.remove())
        markers.current = []

        if (currentMarker.current) {
          currentMarker.current.remove()
          currentMarker.current = null
        }

        // remove old routes
        removeLayer('route-full')
        removeLayer('route-line')

        // fetch route
        const fullRoute = await getRoadRoute(
          [originLng, originLat],
          [destLng, destLat]
        )

        // 🚫 guard again
        if (currentTracking !== activeShipment.current) return

        if (fullRoute) {
          addRouteLayer('route-full', fullRoute, '#1e3a5f', 5, 1)
          addRouteLayer('route-line', fullRoute, '#06b6d4', 2, 0.6, [2, 3])
        }

        // origin marker
        const o = new mapboxgl.Marker()
          .setLngLat([originLng, originLat])
          .addTo(map.current!)
        markers.current.push(o)

        // destination marker
        const d = new mapboxgl.Marker()
          .setLngLat([destLng, destLat])
          .addTo(map.current!)
        markers.current.push(d)

        map.current!.flyTo({
          center: [lng, lat],
          zoom: 6,
          speed: 1.5
        })
      }

      // always update truck
      updateTruckMarker(lng, lat)

      // smooth movement
      if (!isNewShipment) {
        map.current!.easeTo({
          center: [lng, lat],
          duration: 500
        })
      }
    }

    setupMap()
  }, [location])

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '100%' }}
    />
  )
}