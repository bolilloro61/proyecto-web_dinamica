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

// --- 🔮 NewsData.io ---
const newsApiKey = "pub_c55e72b912a04fe9927f552af8fa87d9"; // reemplaza por tu API key real
const newsCarouselInner = document.getElementById('news-carousel-inner');
const newsPrevBtn = document.getElementById('newsPrev');
const newsNextBtn = document.getElementById('newsNext');
let newsPage = 1;
let newsCountry = null;

buttonPrev.disabled = true;
buttonNext.disabled = true;

let countriesName = [];
let countriesCapital = [];
let countriesLatlng = [];

const geoapifyApiKey = "fce4747f7b88425a9796aaf3326b05fe";
const openWeatherApiKey = "a846fd3683392957148d860e9e26500e";

let allPlaces = [];
let startIdx = 0;
const maxCards = 5;
const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";
// ---- NewsData.io: búfer y paginación UI (6 por slide) ----
const NEWS_ITEMS_PER_SLIDE = 6;
let newsBuffer = [];        // artículos ya descargados (acumula)
let newsNextToken = null;   // token nextPage del API
let newsUiPage = 0;         // índice de página de interfaz (0,1,2,...)

// Construye snippet corto
function snippet(txt, max = 220) {
  if (!txt) return "";
  let s = txt.trim();
  if (s.length > max) s = s.slice(0, max).trim() + "…";
  return s;
}

// Renderiza 6 ítems desde el búfer según newsUiPage
function renderNewsFromBuffer() {
  const start = newsUiPage * NEWS_ITEMS_PER_SLIDE;
  const end = start + NEWS_ITEMS_PER_SLIDE;
  const items = newsBuffer.slice(start, end);

  if (!newsCarouselInner) return;

  // Grid 3x2
  const grid = document.createElement("div");
  grid.className = "news-grid";
  grid.innerHTML = items.map(a => `
    <div class="news-tile">
      <div class="card h-100">
        <img src="${a.image_url || 'https://via.placeholder.com/600x320?text=No+Image'}"
             class="card-img-top" alt="${(a.title||'')}" style="height:180px;object-fit:cover;">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title" style="font-size:0.95rem;">${a.title || ''}</h6>
          <p class="card-text small text-muted">${snippet(a.description || a.content)}</p>
          <p class="small text-secondary mt-auto mb-2">
            ${(a.source_id ? a.source_id + ' • ' : '')}${a.pubDate ? new Date(a.pubDate).toLocaleDateString() : ''}
          </p>
          <a class="btn btn-primary btn-sm" href="${a.link || '#'}" target="_blank" rel="noopener">Leer más</a>
        </div>
      </div>
    </div>
  `).join('');

  // Si usas .carousel-inner, envuelve en .carousel-item.active
  const isCarousel = !!document.getElementById('news-carousel-inner');
  newsCarouselInner.innerHTML = '';
  if (isCarousel) {
    const item = document.createElement('div');
    item.className = 'carousel-item active';
    item.appendChild(grid);
    newsCarouselInner.appendChild(item);
  } else {
    newsCarouselInner.appendChild(grid);
  }

  // Habilitar/deshabilitar botones
  const totalSlides = Math.ceil(newsBuffer.length / NEWS_ITEMS_PER_SLIDE);
  newsPrevBtn.disabled = newsUiPage <= 0;
  // Si estamos en la última página visible y ya no hay token, desactiva Next
  const atLastVisible = newsUiPage >= totalSlides - 1;
  newsNextBtn.disabled = atLastVisible && !newsNextToken;
}

// Descarga una “página” del API latest; usa token nextPage cuando exista
async function fetchNewsBatch(countryCode, nextToken = null) {
  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", newsApiKey);
  url.searchParams.set("country", countryCode);
  url.searchParams.set("language", "es");
  if (nextToken) url.searchParams.set("page", nextToken);

  const resp = await fetch(url.toString());
  const data = await resp.json();

  // data.results: array; data.nextPage: token string o undefined
  const results = Array.isArray(data.results) ? data.results : [];
  newsBuffer.push(...results);
  newsNextToken = data.nextPage || null;

  return results.length;
}


dateInput.addEventListener("change", function() {
  const value = this.value;
  if (value) {
    const [year, month, day] = value.split("-");
    const fechaFormateada = `${day}/${month}/${year}`;
    console.log("Fecha (DD/MM/YYYY):", fechaFormateada);
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

  buttonPrev.disabled = (startIdx === 0);
  buttonNext.disabled = (startIdx + maxCards >= allPlaces.length);

  document.querySelectorAll(".carousel-card").forEach(card => {
    card.addEventListener("click", () => {
      const title = card.dataset.title;
      const city = card.dataset.city;
      const img = card.dataset.img;
      const desc = card.dataset.desc;

      document.getElementById("placeTitle").textContent = title;
      document.getElementById("placeImage").src = img;
      document.getElementById("placeInfo").innerHTML = `
        <strong>Ubicación:</strong> ${city || "No disponible"}<br>
        <strong>Descripción:</strong> ${desc}
      `;

      const modal = new bootstrap.Modal(document.getElementById("placeModal"));
      modal.show();
    });
  });
}

// --------- Selector de países ---------
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

// --------- 🌤️ y 🔮 ---------
const horoscopeAPI = "https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=";
const horoscopeSigns = [
  "aries", "taurus", "gemini", "cancer",
  "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces"
];
let currentSignIndex = 0;

async function fetchHoroscopeData(sign) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(horoscopeAPI + sign)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const parsed = JSON.parse(data.contents);
    const text = parsed.data?.horoscope_data || "No data available today.";
    renderHoroscopeCard(sign, text);
  } catch (err) {
    console.error("Error cargando el horóscopo:", err);
    const container = document.getElementById("horoscope-cards");
    container.innerHTML = `<div class="text-center text-danger">No se pudo cargar el horóscopo diario.</div>`;
  }
}

function renderHoroscopeCard(sign, text) {
  const container = document.getElementById("horoscope-cards");
  container.innerHTML = `
    <div class="horoscope-card text-center">
      <img src="src/signs/${sign}.svg" alt="${sign}" style="width:80px;height:80px;">
      <h6 class="mt-2">${sign.charAt(0).toUpperCase() + sign.slice(1)}</h6>
      <p>${text}</p>
    </div>
  `;
}

document.getElementById("horoscopeNext").addEventListener("click", () => {
  currentSignIndex = (currentSignIndex + 1) % horoscopeSigns.length;
  fetchHoroscopeData(horoscopeSigns[currentSignIndex]);
});
document.getElementById("horoscopePrev").addEventListener("click", () => {
  currentSignIndex = (currentSignIndex - 1 + horoscopeSigns.length) % horoscopeSigns.length;
  fetchHoroscopeData(horoscopeSigns[currentSignIndex]);
});
fetchHoroscopeData(horoscopeSigns[currentSignIndex]);

// --------- 🌍 País seleccionado ---------
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

  // --- Clima ---
  try {
    const weatherResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${capital}&units=metric&appid=${openWeatherApiKey}`);
    const weatherData = await weatherResp.json();

    if (weatherData.weather && weatherData.weather.length > 0) {
      weatherTemp.textContent = `${Math.round(weatherData.main.temp)}°`;
      weatherDesc.textContent = weatherData.weather[0].description;
      weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png" alt="Weather icon">`;
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

// -------- 📰 NEWSDATA.IO (REEMPLAZO ROBUSTO + DEPURACIÓN) --------
// ---- Carga inicial al cambiar de país (dentro del listener de país) ----
const iso2 = await getCountryCodeISO2(countryName);
if (iso2) {
  // reset estado de noticias
  newsCountry = iso2.toLowerCase();
  newsPage = 1;            // ya no se usa para el API; mantenemos por compatibilidad
  newsUiPage = 0;
  newsBuffer = [];
  newsNextToken = null;

  // Precarga: intenta reunir al menos 12 items (2 páginas UI)
  // Plan free: 10 por batch, así que con 2 batches tendrás 20 típicamente
  let loaded = 0;
  loaded += await fetchNewsBatch(newsCountry, null);
  if (newsBuffer.length < 12 && newsNextToken) {
    loaded += await fetchNewsBatch(newsCountry, newsNextToken);
  }

  // Render primer slide
  if (newsBuffer.length === 0) {
    newsCarouselInner.innerHTML = `
      <div class="text-center text-muted p-3">No hay noticias disponibles para este país.</div>
    `;
    newsPrevBtn.disabled = true;
    newsNextBtn.disabled = true;
  } else {
    renderNewsFromBuffer();
  }

  // Listeners de navegación (idempotentes)
  if (newsPrevBtn) {
    newsPrevBtn.onclick = async () => {
      if (newsUiPage <= 0) return;
      newsUiPage--;
      renderNewsFromBuffer();
    };
  }
  if (newsNextBtn) {
    newsNextBtn.onclick = async () => {
      // ¿hay otra página visible con lo ya cargado?
      const totalSlides = Math.ceil(newsBuffer.length / NEWS_ITEMS_PER_SLIDE);
      const wantPage = newsUiPage + 1;

      // Si la siguiente página aún no existe en el búfer, intenta cargar más usando nextPage
      if (wantPage >= totalSlides && newsNextToken) {
        await fetchNewsBatch(newsCountry, newsNextToken);
      }

      // Si ahora hay suficientes, avanza
      const newTotal = Math.ceil(newsBuffer.length / NEWS_ITEMS_PER_SLIDE);
      if (wantPage < newTotal) {
        newsUiPage = wantPage;
        renderNewsFromBuffer();
      } else {
        // Sin más datos
        newsNextBtn.disabled = true;
      }
    };
  }
} else {
  newsCountry = null;
  newsBuffer = [];
  newsNextToken = null;
  newsUiPage = 0;
  newsCarouselInner.innerHTML = `<div class="text-center text-muted p-3">No se pudieron cargar noticias para este país.</div>`;
  newsPrevBtn.disabled = true;
  newsNextBtn.disabled = true;
}

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

// Obtener ISO2
async function getCountryCodeISO2(name) {
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=cca2`);
    const j = await r.json();
    return j?.[0]?.cca2?.toLowerCase() || null;
  } catch {
    return null;
  }
}