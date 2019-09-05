/* global fetch, L */
import React, { useEffect, useRef, useState } from 'react'
import Moment from 'moment'

// Define Marker as global to change its location, maybe make it state variable will make more sense 
let marker = undefined

// Function to get random Hex color code
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
  
  // most probably better to use single object for the Range Rendering
  //set Selected Time for the Marker and Range Input
  const [timeValue, setTimeValue] = useState("")
  
  //Min Value for the Range
  const [min, setMin] = useState()
  
  // Max value for the Range
  const [max, setMax] = useState()

  //The Response lat & long for the marker
  const [latLong, setLatLong] = useState()

  // Request location data.
  useEffect(() => {
    fetch('http://localhost:3000')
      .then(response => response.json())
      .then((json) => {
        setLocations(json)

        // min value of last element of Array of Array
        setMin(Moment(json[json.length - 1][json[json.length - 1].length - 1].time).unix())

        // max value is first element in Array of Array
        setMax(Moment(json[0][0].time).unix())

        // set the unix time to the latest Data.
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
    // since location is array no we change it to map to draw polyline for each array chunk
    locations.map((loc) => {
      const latlons = loc.map(({ lat, lon }) => [lat, lon])
      const polyline = L.polyline(latlons, { color: getRandomColor() }).bindPopup(getRouteSummary(loc)).addTo(map.current)
      map.current.fitBounds(polyline.getBounds())
      return () => map.current.remove(polyline)
    })

    
  }, [locations, map.current])

  // setup the marker location

  useEffect(() => {

    //only render marker once the timeValue is ready
    if (timeValue) {
      // if we already created marker object then we set it new value based on response
      if (marker) {
        marker.setLatLng(latLong);
      }

      //create new marker and added to the map
      else {
        marker = L.marker(latLong);
        map.current.addLayer(marker);
        
      }

      //either case center view to the marker location , without changing zoom for UI/UX
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
