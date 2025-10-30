
const APIcountries_name = "https://restcountries.com/v3.1/all?fields=name";
const APIcountries_capital = "https://restcountries.com/v3.1/all?fields=capital,capitalInfo";
const APIcountries_latlng = "https://restcountries.com/v3.1/all?fields=latlng";

const countriesSelect = document.getElementById("countries");
const conoceSection = document.getElementById("carousel-content");
const mainCountry = document.getElementById("main-country");
const weatherIcon = document.getElementById("weather-icon");
const weatherTemp = document.getElementById("weather-temp");
const weatherDesc = document.getElementById("weather-desc");
const weatherLocation = document.getElementById("weather-location");
const horoscopeText = document.getElementById("horoscope-text");
const horoscopeSignImg = document.querySelector(".col-md-4 img");
const horoscopeSignName = document.querySelector(".col-md-4 span");

const buttonPrev = document.getElementById("cardsPrev");
const buttonNext = document.getElementById("cardsNext");

const dateInput = document.getElementById("date-input");
// Ocultar botones al inicio
buttonPrev.disabled = true;
buttonNext.disabled = true;

let countriesName = [];
let countriesCapital = [];
let countriesLatlng = [];

const geoapifyApiKey = "fce4747f7b88425a9796aaf3326b05fe";
const openWeatherApiKey = "a846fd3683392957148d860e9e26500e";

// --------- Carrusel sliding window ---------
let allPlaces = [];
let startIdx = 0;
const maxCards = 5;
const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";
dateInput.addEventListener("change", function() {
  const value = this.value; // formato: YYYY-MM-DD
  if (value) {
    const [year, month, day] = value.split("-");
    const fechaFormateada = `${day}/${month}/${year}`;
    console.log("Fecha (DD/MM/YYYY):", fechaFormateada);
    // Aquí puedes llamar a tu función de filtro con esa fecha
    // filtrarPorFecha(fechaFormateada);
  }
});
// --------- Renderizado de tarjetas tipo Booking ---------
function renderCards(idx) {
  const end = Math.min(idx + maxCards, allPlaces.length);

  if (allPlaces.length === 0) {
    conoceSection.innerHTML = "<div class='text-center'>No se encontraron sitios destacados.</div>";
    return;
  }

  conoceSection.innerHTML = allPlaces.slice(idx, end).map(place => {
    const props = place.properties;
    const imgSrc = placeholderImg;
    const title = props.name || "Sin nombre";
    const city = props.city || props.address_line2 || "";
    const desc = props.formatted || "Sin descripción disponible.";

    return `
      <div class="col-auto d-flex" style="padding-left:0;padding-right:0;">
        <div class="carousel-card" 
             data-title="${title}" 
             data-city="${city}" 
             data-img="${imgSrc}" 
             data-desc="${desc}">
          <img src="${imgSrc}" class="carousel-card-img" alt="${title}">
          <div class="carousel-card-body">
            <div class="carousel-card-title">${title}</div>
            ${city ? `<div class="carousel-card-detail">${city}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Activar/Desactivar botones
  buttonPrev.disabled = (startIdx === 0);
  buttonNext.disabled = (startIdx + maxCards >= allPlaces.length);

  // --------- Eventos para abrir modal al hacer clic ---------
  document.querySelectorAll(".carousel-card").forEach(card => {
    card.addEventListener("click", () => {
      const title = card.dataset.title;
      const city = card.dataset.city;
      const img = card.dataset.img;
      const desc = card.dataset.desc;

      // Actualizar contenido del modal
      document.getElementById("placeTitle").textContent = title;
      document.getElementById("placeImage").src = img;
      document.getElementById("placeInfo").innerHTML = `
        <strong>Ubicación:</strong> ${city || "No disponible"}<br>
        <strong>Descripción:</strong> ${desc}
      `;

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById("placeModal"));
      modal.show();
    });
  });
}

// --------- Selector de países ordenado ---------
async function fetchCountries() {
  try {
    const [nameResp, capitalResp, latlngResp] = await Promise.all([
      fetch(APIcountries_name),
      fetch(APIcountries_capital),
      fetch(APIcountries_latlng),
    ]);
    const [names, capitals, latlngs] = await Promise.all([
      nameResp.json(),
      capitalResp.json(),
      latlngResp.json(),
    ]);

    countriesName = names;
    countriesCapital = capitals;
    countriesLatlng = latlngs;
    populateCountriesSelect();
  } catch (e) {
    console.error("Error cargando países:", e);
  }
}

function populateCountriesSelect() {
  const combined = countriesName.map((c, i) => ({ 
    name: c.name.common, 
    capital: countriesCapital[i]?.capital?.[0] || "", 
    capitalLat: countriesCapital[i]?.capitalInfo?.latlng?.[0] || countriesLatlng[i]?.latlng?.[0] || null, 
    capitalLon: countriesCapital[i]?.capitalInfo?.latlng?.[1] || countriesLatlng[i]?.latlng?.[1] || null 
  }));
  combined.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  countriesSelect.innerHTML = '<option selected disabled>Selecciona un país</option>';
  combined.forEach(({ name, capital, capitalLat, capitalLon }) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    option.dataset.capital = capital;
    option.dataset.capitalLat = capitalLat;
    option.dataset.capitalLon = capitalLon;
    countriesSelect.appendChild(option);
  });
}

fetchCountries();

// --------- Al seleccionar país, traer lugares turísticos, clima y reiniciar carrusel ---------
countriesSelect.addEventListener('change', async () => {
  const selectedOption = countriesSelect.options[countriesSelect.selectedIndex];
  const countryName = selectedOption.value;
  const capital = selectedOption.dataset.capital;
  const lat = parseFloat(selectedOption.dataset.capitalLat);
  const lon = parseFloat(selectedOption.dataset.capitalLon);

  mainCountry.textContent = countryName;

  if (!lat || !lon) {
    conoceSection.innerHTML = "<div class='text-center'>No hay datos geográficos disponibles.</div>";
    allPlaces = [];
    renderCards(0);
    return;
  }

  startIdx = 0;
  // Geoapify en español
  const radiusMeters = 50000; 
  const categories = "tourism.sights,tourism,tourism.attraction,entertainment.museum";
  const geoapifyUrl = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radiusMeters}&limit=30&lang=es&apiKey=${geoapifyApiKey}`;

  try {
    const geoResp = await fetch(geoapifyUrl);
    const geoData = await geoResp.json();
    allPlaces = (geoData.features || []).filter(f => f.properties && (f.properties.name || f.properties.address_line2));
    renderCards(startIdx);
  } catch (e) {
    conoceSection.innerHTML = "<div class='text-center'>Error al obtener datos.</div>";
    allPlaces = [];
    renderCards(0);
  }
//clima
  try {
  const weatherResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${capital}&units=metric&appid=${openWeatherApiKey}`);
  const weatherData = await weatherResp.json();

  if (weatherData.weather && weatherData.weather.length > 0) {
    weatherTemp.textContent = `${Math.round(weatherData.main.temp)}°`;
    weatherDesc.textContent = weatherData.weather[0].description;
     weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png" alt="Weather icon">`;
 
    // Añade nombre del lugar
    weatherLocation.textContent = weatherData.name || "";
  } else {
    weatherTemp.textContent = "";
    weatherDesc.textContent = "";
    weatherIcon.innerHTML = "";
    weatherLocation.textContent = "";
  }
} catch {
  weatherTemp.textContent = "";
  weatherDesc.textContent = "";
  weatherIcon.innerHTML = "";
  weatherLocation.textContent = "";
}


  // Horóscopo ejemplo
  horoscopeSignImg.src = "virgo.svg";
  horoscopeSignImg.alt = "Virgo";
  horoscopeSignName.textContent = "Virgo";
  horoscopeText.textContent = "Horóscopo diario de Virgo: Hoy es un buen día para tomar decisiones importantes.";
});

// --------- Botones "deslizar" ---------
buttonNext.addEventListener('click', () => {
  if (startIdx + maxCards < allPlaces.length) {
    startIdx++;
    renderCards(startIdx);
  }
});
buttonPrev.addEventListener('click', () => {
  if (startIdx > 0) {
    startIdx--;
    renderCards(startIdx);
  }
});



