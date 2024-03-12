// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoibmJlbjAwMTMiLCJhIjoiY2x0bmpndnF1MDdlczJrbnZlZ3N5a2o1ZCJ9.6zJUB284XBV3p4sn9loTkQ';

// Map
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [144.9631, -37.8136], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

// Suburb selection dropdown
fetch('vic_locations.json')
    .then(response => response.json())
    .then(data => {
        var select = d3.select('#suburbSelect');
        data.forEach(suburb => {
            select.append('option').text(suburb.Suburb).attr("value", JSON.stringify({ lat: suburb.Latitude, lon: suburb.Longitude }));
        });
    })
    .catch(error => console.error("Error loading suburb data:", error));

// Func to categorize UV index
function categorizeUvIndex(uvIndex) {
    if(uvIndex <= 2) return "Low";
    else if(uvIndex <= 5) return "Moderate";
    else if(uvIndex <= 7) return "High";
    else if(uvIndex <= 10) return "Very High";
    else return "Extreme";
}

// weather and uv information on suburb selection
d3.select('#suburbSelect').on("change", function(d) {
    var selectedValue = JSON.parse(d3.select(this).property('value'));
    map.flyTo({ center: [selectedValue.lon, selectedValue.lat], zoom: 11 });
    updateWeatherInfo(selectedValue.lat, selectedValue.lon);
});

var currentPopup;

function updateWeatherInfo(lat, lon) {
    console.log(`Fetching weather data for lat: ${lat}, lon: ${lon}`); // Debug log
    var apiKey = 'e1090b77b5f26661cc28f92a7a4ea9fb';
    var url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var uvIndex = data.current.uvi;
            var uvCategory = categorizeUvIndex(uvIndex);
            var temp = data.current.temp;
            
            // to clear previous UV Info content
            d3.select('#uvInfo').html("");

            // to update the UV Info div with new data
            d3.select('#uvInfo').html(`Current UV Index: ${uvIndex} (${uvCategory})<br>Temperature: ${temp}°C`);

            // to close the current popup if it exists
            if (currentPopup) {
                currentPopup.remove();
            }

            // to create a new pop up
            currentPopup = new mapboxgl.Popup()
                .setLngLat([lon, lat])
                .setHTML(`<h4>Weather Info</h4><p>UV Index: ${uvIndex} (${uvCategory})<br>Temperature: ${temp}°C</p>`)
                .addTo(map);

            visualizeHourlyForecast(data.hourly);
            visualizeDailyForecast(data.daily);    
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
            // Clear previous UV Info content and show error message
            d3.select('#uvInfo').html(""); // Clear the content
            d3.select('#uvInfo').html("Error fetching weather data. Please try again later.");
        });
}

// visualizehourlyforecst
function visualizeHourlyForecast(hourlyData) {
    const hourlyForecastContainer = d3.select("#hourlyForecast");
    hourlyForecastContainer.html(""); // to clear old content

    hourlyForecastContainer.append("h3").text("Hourly Forecast");

    hourlyData.forEach((hour, index) => {
        if (index < 7) { // next 7 hours
            const date = new Date(hour.dt * 1000);
            const hourBlock = hourlyForecastContainer.append("div");
            hourBlock.html(`
                <p><b>${date.getHours()}:00</b> - Temp: ${hour.temp}°C, UV Index: ${hour.uvi}</p>
            `);
        }
    });
}


// visualizedailyforecst
function visualizeDailyForecast(dailyData) {
    const dailyForecastContainer = d3.select("#dailyForecast");
    dailyForecastContainer.html(""); // to clear old content

    dailyForecastContainer.append("h3").text("\nDaily Forecast");

    dailyData.forEach((day, index) => {
        const date = new Date(day.dt * 1000);
        const dayBlock = dailyForecastContainer.append("div");
        dayBlock.html(`
            <p><b>${date.toDateString()}</b> - Temp: ${day.temp.day}°C (min: ${day.temp.min}°C, max: ${day.temp.max}°C), UV Index: ${day.uvi}</p>
        `);
    });
}



