/* global fetch, L */
import React, { useEffect, useRef, useState } from 'react'
import Moment from 'moment'
let marker = undefined
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++)  color += letters[Math.floor(Math.random() * 16)];
  return color;
}

const getRouteSummary = (locations) => {
  const to = Moment(locations[0].time).format('hh:mm DD.MM')
  const from = Moment(locations[locations.length - 1].time).format('hh:mm DD.MM')
  return `${from} - ${to}`
}

const MapComponent = () => {
  const map = useRef()
  const [locations, setLocations] = useState()
  const [timeValue, setTimeValue] = useState("")
  const [min, setMin] = useState()
  const [max, setMax] = useState()
  const [latLong, setLatLong] = useState()
  // Request location data.

  useEffect(() => {
    fetch('http://localhost:3000')
      .then(response => response.json())
      .then((json) => {
        setLocations(json)
        setMin(Moment(json[json.length - 1][json[json.length - 1].length - 1].time).unix())
        setMax(Moment(json[0][0].time).unix())
        setTimeValue(Moment(json[0][0].time).unix()*1000)
      })

  }, [])

  // Initialize map.
  useEffect(() => {
    map.current = new L.Map('mapid')
    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    const attribution = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    const osm = new L.TileLayer(osmUrl, {
      minZoom: 8,
      maxZoom: 18,
      attribution
    })
    
    map.current.setView(new L.LatLng(52.51, 13.40), 9)
    map.current.addLayer(osm)
  }, [])
  // Update location data on map.
  useEffect(() => {
    if (!map.current || !locations) {
      return // If map or locations not loaded yet.
    }
    // TODO(Task 1): Replace the single red polyline by the different segments on the map.
    locations.map((loc) => {
      const latlons = loc.map(({ lat, lon }) => [lat, lon])
      const polyline = L.polyline(latlons, { color: getRandomColor() }).bindPopup(getRouteSummary(loc)).addTo(map.current)
      map.current.fitBounds(polyline.getBounds())
      return () => map.current.remove(polyline)
    })

    
  }, [locations, map.current])


  useEffect(() => {
    if (timeValue) {
      if (marker) {
        marker.setLatLng(latLong);
      }
      else {
        marker = L.marker(latLong);
        map.current.addLayer(marker);
        
      }
      map.current.setView(new L.LatLng(latLong[0], latLong[1]))
    }
  },[latLong])

  return (
    <div>
      {locations && `${locations.length} locations loaded`}
      {!locations && 'Loading...'}
      <div id='mapid' />
      <span >{Moment(min * 1000 || 0).format("dddd, MMMM YYYY Do, h:mm a")}</span>
      <input
        style={{ width: '70%' }}
        type="range"
        min={min * 1000 || 0}
        max={max * 1000 || 0}
        step={60 * 5 *1000}
        value={timeValue}
        onChange={(e) => {
          setTimeValue(parseInt(e.target.value));
          if(timeValue)
          fetch(`http://localhost:3000/location/${timeValue}`)
            .then(response => response.json())
            .then((json) => {
              setLatLong(json)
            })
        }}
      />
      <span >{Moment(max * 1000 || 0).format("dddd, MMMM YYYY Do, h:mm a")}</span>
      <div style={{ margin: "0 40%" }}><p>{Moment(timeValue).format("dddd, MMMM YYYY Do, h:mm a")}</p></div>
    </div>)
}

export default MapComponent
