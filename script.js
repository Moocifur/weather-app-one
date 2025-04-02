//script.js
// Get your API key by signing up at https://www.visualcrossing.com/
const API_KEY = 'CCNLQLGBYFULF3FQYHURKZ532'

// Fetch API and turn it into JSON named data
async function getWeatherData(location) {
    try {
        // get API data and put it in response
        const response = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=us&key=${API_KEY}&contentType=json`);

        // If response is a bad response like 404, create new error object and throw it
        if (!response.ok) {
            throw new Error(`Weather data not available for ${location}`);
        }

        // Else, turn response into json format and put in data
        const data = await response.json();
        // Show for developer, and to see all properties
        console.log('Raw weather data:', data);
        return data;

    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

// Process the raw data into a more usable format
function processWeatherData(data) {
    // Extract current conditions
    const current = data.currentConditions; 

    // Create a simplified weather object with just the data we need
    const processedData = {
        location: data.resolvedAddress, 
        currentTemp: {
            fahrenheit: Math.round(current.temp),
            celsius: Math.round((current.temp -32) * 5/9) 
        },
        description: current.conditions,
        icon: current.icon,
        humidity: current.humidity,
        windSpeed: current.windspeed,
        datetime: new Date(current.datetime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), 
        // Add a 3 day forecast
        forecast: data.days.slice(0, 3).map(day => ({ 
            date: new Date(day.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), // also, where do i learn or get to know this format
            highTemp: {
                fahrenheit: Math.round(day.tempmax),
                celsius: Math.round((day.tempmax - 32) * 5/9)
            },
            lowTemp: {
                fahrenheit: Math.round(day.tempmin),
                celsius: Math.round((day.tempmin -32) * 5/9)
            },
            description: day.conditions,
            icon: day.icon
        }))
    };

    console.log('Processed weather data:', processedData);
    return processedData;
}

getWeatherData('London')
    .then(data => processWeatherData(data))
    .catch(error => console.error('Test failed:', error));

document.addEventListener('DOMContentLoaded', () => {
    const weatherForm = document.getElementById('weather-form');
    const locationInput = document.getElementById('location-input');
    const loadingIndicator = document.getElementById('loading');
    const weatherContainer = document.getElementById('weather-container');
    const tempToggle = document.getElementById('temp-toggle');
    let currentWeatherData = null;

    // 1. When form is submitted
    weatherForm.addEventListener('submit', async (event) => {
        // 2. Prevent default form submission
        event.preventDefault();

        // 3. Get user input location
        const location = locationInput.value.trim();
        if (!location) return; // Exit if empty

        // 4. Show loading indicator and hide weather conditions
        loadingIndicator.classList.remove('hidden');
        weatherContainer.classList.add('hidden');

        try {
            // 5. Call API to get weather data
            const rawData = await getWeatherData(location); 

            // 6. Proccess the raw data into usable format
            const processedData = processWeatherData(rawData);

            // 7. Log processedData = processWeatherData(rawData);
            console.log('Weather data ready to display:', processedData);

            // Save the data for tempurature toggle
            currentWeatherData = processedData;

            // 8. Display the weather data on the page
            displayWeatherData(processedData, tempToggle.checked);

        } catch (error) {
            // 8a If error occurs, show error message
            console.error('Failed to get weather data:', error);

            // Show error message to user
            weatherContainer.innerHTML = `
                <div class="error">
                    <p>Sorry, we couldn't find weather data for "${location}".</p>
                    <p>${error.message}</p>
                </div>
            `;
            weatherContainer.classList.remove('hidden');
        } finally {
            // Always hide loading indicator
            loadingIndicator.classList.add('hidden');
        }
    });

    // Add event listener for temourature toggle
    tempToggle.addEventListener('change', () => {
        if (currentWeatherData) {
            displayWeatherData(currentWeatherData, tempToggle.checked);
        }
    });
});

// Function to display weather data on the page
function displayWeatherData(weatherData, useCelsius = false) {
    const weatherContainer = document.getElementById('weather-container');

    // Get temperature based on selected unit
    const currentTemp = useCelsius
        ? `${weatherData.currentTemp.celsius}°C`
        : `${weatherData.currentTemp.fahrenheit}°F`;

    // Create HTML for the curent weather
    let currentWeatherHTML = `
        <div class="current-weather">
            <h2>${weatherData.location}</h2>
            <div class="weather-main">
                <div class="weather-icon">${getWeatherEmoji(weatherData.icon)}</div>
                <div class="temperature">${currentTemp}</div>
            </div>
            <div class="description">${weatherData.description}</div>
            <div class="details">
                <div class="detail">
                    <span class="label">Humidity</span>
                    <span class="value">${weatherData.humidity}%</span>
                </div>
                <div class="detail">
                    <span class="label">Wind</span>
                    <span class="value">${weatherData.windSpeed} mph</span>
                </div>
                <div class="detail">
                    <span class="label">Updated</span>
                    <span class="value">${weatherData.datetime}</span>
                </div>
            </div>
        </div>    
    `;

    // Create HYML for the forecast
    let forecastHTML = '<div class="forecast">';

    weatherData.forecast.forEach(day => {
        const highTemp = useCelsius
            ? `${day.highTemp.celsius}°C`
            : `${day.highTemp.fahrenheit}°F`;

        const lowTemp = useCelsius
            ? `${day.lowTemp.celsius}°C`
            : `${day.lowTemp.fahrenheit}°F`;

        forecastHTML += `
            <div class="forecast-day">
                <div class="date">${day.date}</div>
                <div class="icon">${getWeatherEmoji(day.icon)}</div>
                <div class="forecast-temps">
                    <div class="high">High: ${highTemp}</div>
                    <div class="low">Low: ${lowTemp}</div>
                </div>
                <div class="description">${day.description}</div>
            </div>
        `;
    });

    forecastHTML += '</div>';

    // Combine current weather and forcast
    weatherContainer.innerHTML = currentWeatherHTML + forecastHTML;

    // Show the weather container
    weatherContainer.classList.remove('hidden');

    // Optional: Changebackground color based on weather
    document.body.className = `bg-${weatherData.icon}`;
}

// Helper function to convert icon code to emoj
function getWeatherEmoji(iconCode) {
    const iconMap = {
        'clear-day': '☀️',
        'clear-night': '🌙',
        'partly-cloudy-day': '⛅',
        'partly-cloudy-night': '☁️🌙',
        'cloudy': '☁️',
        'rain': '🌧️',
        'snow': '❄️',
        'sleet': '🌨️',
        'wind': '💨',
        'fog': '🌫️',
        'thunder': '⛈️',
        'thunder-rain': '⛈️',
        'thunder-showers-day': '⛈️',
        'thunder-showers-night': '⛈️',
        'showers-day': '🌦️',
        'showers-night': '🌧️'
    };

    return iconMap[iconCode] || '❓';
}