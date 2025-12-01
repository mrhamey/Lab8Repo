// Initialize base map
const map = L.map("map").setView([55, -70], 5);

// Add base tile layer (OpenStreetMap)
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
// Second base tile layer
var Stadia_StamenToner = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});


// PART 1
// Load GeoJSON of weather stations
const stationsURL = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-8/refs/heads/main/DATA/climate-stations.geojson";

// Fetch GeoJSON and add to map
function loadStations(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load GeoJSON");
      return response.json();
    })
    .then(data => {
      const stationLayer = L.geoJSON(data, {
        onEachFeature: onEachStation,
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, stationStyle(feature))
      });
        // Add marker cluster group
        const markers = L.markerClusterGroup();
        stationLayer.eachLayer(layer => {
          markers.addLayer(layer);
        })

 
     markers.addTo(map);

            // Add layer control
        const baseMaps = {
        "OpenStreetMap": osm,
        "Stadia Dark": Stadia_StamenToner,
        };
      const overlayMaps = {
       "Climate Stations": stationLayer
      };
      L.control.layers(baseMaps, overlayMaps).addTo(map);
      L.control.scale().addTo(map);
      

    })
    .catch(err => console.error("Error loading GeoJSON:", err));
};


// Popup and click handler for each station
function onEachStation(feature, layer) {
  const props = feature.properties;
  const popup = `
    <strong>${props.STATION_NAME}</strong><br>
    Province: ${props.ENG_PROV_NAME}<br>
    Station ID: ${props.STN_ID}<br>
    Elevation: ${props.ELEVATION}<br> 
  `;
  // Fetch API data on click
    layer.on("click", () => {
      document.getElementById("station-name").innerHTML = "<strong>" + props.STATION_NAME + "</strong>";
      document.getElementById("climate-data").innerHTML = "<p>Loading climate data...</p>";
      fetchClimateData(props.CLIMATE_IDENTIFIER);
      });
  layer.bindPopup(popup);
}



// Q1 - The fetch command fetches content (here a geoJSON file) from a web URL, while catch is a command triggered when an exception to the above conditional method occurs 
// Q2 - editted in code, see added ID and elevtion. however, cannot comment out and indicate?? 


// PART 2

// Function to fetch Environment Canada climate data


function fetchClimateData(climateID) {
  let yearofstudy = 2025; //setting the year for which we want data (was 2000)
  const apiURL = `https://api.weather.gc.ca/collections/climate-daily/items?limit=10&sortby=-LOCAL_DATE&CLIMATE_IDENTIFIER=${climateID}&LOCAL_YEAR=${yearofstudy}`;

  fetch(apiURL)
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(json => {
      if (!json.features || json.features.length === 0) {
        console.log("No recent climate data available for this station.");
        return;
      }
      
      const props = json.features[0].properties;
     const container = document.getElementById("climate-data");
// adding the filtering of null/not avail data (only displaying in the container if theres a climate data value)
let html = "" //starts as empty stirng 
 if (props.MAX_TEMPERATURE != null) { //if max temp isn't null, add the followijng statement to the html container: 
      html += `<p><strong>Max Temp:</strong> ${props.MAX_TEMPERATURE} °C</p>`;
    }

    if (props.MIN_TEMPERATURE != null) {
      html += `<p><strong>Min Temp:</strong> ${props.MIN_TEMPERATURE} °C</p>`;
    }

    if (props.SNOW_ON_GROUND != null) {
      html += `<p><strong>Snow on Ground:</strong> ${props.SNOW_ON_GROUND} cm</p>`;
    }

    // If nothing was added, show fallback message
    if (html === "") {
      html = "<p>No recent climate data available for this station.</p>";
    }
    container.innerHTML = html;//constructing our displayed html container now that we have the different combinations of values
  })
    .catch(error => {console.error("Error fetching climate data:", error);
    });
}

// PART 3

// Style for stations
function stationStyle(feature) {
  let fillColor; //setting my variable to use the switch

  switch (true) {
  

    case feature.properties.ELEVATION >200:
      fillColor = '#fa651fff';
      break;

    case feature.properties.ELEVATION >100:
      fillColor = '#f99465ff';
      break;

    default :
      fillColor = '#f9d2c0ff';
  }


  return {
    radius: 6,
    fillColor: fillColor,
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 1.0
  };
}

// PART 5
//Legend 

// Add elevation color legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [0, 100, 200];
  const colors = ['#f9d2c0ff', '#f99465ff', "#fa651fff"];
  div.innerHTML += '<b>Elevation (m)</b><br>';
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML += `<i style="background:${colors[i]}"></i> ${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br><br>' : '+'}`;
  }
  return div;
};
legend.addTo(map);

// Load map
loadStations(stationsURL);