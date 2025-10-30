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
// --- NewsAPI: carrusel 3x2 ---
const newsApiKey = '8fb96aa0baeb4749ba32a77e39f9e3e8';
const newsCarouselInner = document.getElementById('news-carousel-inner');
const newsPrevBtn = document.getElementById('newsPrev');
const newsNextBtn = document.getElementById('newsNext');

let newsPage = 1;
const newsPageSize = 6;
let newsCountry = null;


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

  // Eventos de clic en tarjetas
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

// ---- NewsAPI helpers ----

// Lista oficial de países soportados por /v2/top-headlines (ISO2 minúsculas)
const NEWSAPI_SUPPORTED = new Set([
  'ae','ar','at','au','be','bg','br','ca','ch','cn','co','cu','cz','de','eg','fr','gb',
  'gr','hk','hu','id','ie','il','in','it','jp','kr','lt','lv','ma','mx','my','ng','nl',
  'no','nz','ph','pl','pt','ro','rs','ru','sa','se','sg','si','sk','th','tr','tw','ua',
  'us','ve','za'
]);

async function getCountryCodeISO2(name) {
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=cca2`);
    const j = await r.json();
    return j?.[0]?.cca2?.toLowerCase() || null;
  } catch {
    return null;
  }
}

// Recorta el content al primer "…", o quita el sufijo "[+1234 chars]"; fallback a description
function makeArticleSnippet(article, maxLen = 220) {
  let txt = article.content || article.description || '';
  if (!txt) return '';
  // eliminar sufijo "[+NNNN chars]"
  txt = txt.replace(/\s*\[\+\d+\s*chars\]\s*$/i, '');
  // cortar en "…" si aparece
  const ell = txt.indexOf('…');
  if (ell > 0) txt = txt.slice(0, ell);
  // límite duro de longitud
  if (txt.length > maxLen) txt = txt.slice(0, maxLen).trim() + '…';
  return txt;
}
// Render de un slide 3x2 (6 artículos)
function renderNewsSlide(articles, active = false) {
  const grid = document.createElement('div');
  grid.className = 'news-grid';

  grid.innerHTML = articles.map(a => {
    const img = a.urlToImage || 'https://via.placeholder.com/600x320?text=Sin+imagen';
    const title = a.title || 'Sin título';
    const snippet = makeArticleSnippet(a, 120);
    const url = a.url || '#';
    return `
      <div class="news-tile">
        <div class="card h-100">
          <img src="${img}" class="card-img-top" alt="${title}" style="height: 180px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title" style="font-size: 0.95rem;">${title}</h6>
            <p class="card-text small text-muted">${snippet}</p>
            <a class="btn btn-primary btn-sm mt-auto" href="${url}" target="_blank" rel="noopener">Leer más</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return grid;
}

// Llama top-headlines si el código está soportado; si no, fallback a everything con language=es
async function fetchNewsPage(countryCode, countryName, page, pageSize) {
  let url;
  if (NEWSAPI_SUPPORTED.has(countryCode)) {
    url = new URL('https://newsapi.org/v2/top-headlines');
    url.searchParams.set('country', countryCode);
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set('page', String(page));
  } else {
    url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', `"${countryName}"`);
    url.searchParams.set('language', 'es');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set('page', String(page));
  }
  const res = await fetch(url.toString(), { headers: { 'X-Api-Key': newsApiKey } });
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'NewsAPI error');
  return data;
}


async function loadNewsSlide(countryCode, countryName, page) {
  if (!newsCarouselInner) return;
  if (newsPrevBtn) newsPrevBtn.disabled = true;
  if (newsNextBtn) newsNextBtn.disabled = true;

  try {
    const data = await fetchNewsPage(countryCode, countryName, page, newsPageSize);
    const articles = data.articles || [];

    newsCarouselInner.innerHTML = '';
    const grid = renderNewsSlide(articles, true);
    newsCarouselInner.appendChild(grid);

    if (newsPrevBtn) newsPrevBtn.disabled = page <= 1;
    if (newsNextBtn) newsNextBtn.disabled = articles.length < newsPageSize;
  } catch (e) {
    console.error('Error cargando noticias:', e);
    newsCarouselInner.innerHTML = `<div class="text-center p-3 text-danger">No se pudieron cargar noticias: ${e.message}</div>`;
    if (newsPrevBtn) newsPrevBtn.disabled = true;
    if (newsNextBtn) newsNextBtn.disabled = true;
  }
}

function setupNewsCarousel(countryCode, countryName) {
  newsCountry = countryCode;
  newsPage = 1;
  loadNewsSlide(newsCountry, countryName, newsPage);
}


fetchCountries();

// --------- Función para traer el horóscopo ---------
async function fetchHoroscope() {
  try {
    const response = await fetch("https://horoscopefree.herokuapp.com/daily/");
    const data = await response.json();

    // Este endpoint devuelve un objeto con signos y textos. Ejemplo:
    // { "aries": "texto...", "taurus": "texto...", ... }

    // Puedes elegir un signo aleatorio o uno fijo:
    const signs = Object.keys(data);
    const randomSign = signs[Math.floor(Math.random() * signs.length)];
    const text = data[randomSign];

    horoscopeSignImg.src = `${randomSign}.svg`; // Ejemplo: aries.svg
    horoscopeSignImg.alt = randomSign;
    horoscopeSignName.textContent = randomSign.charAt(0).toUpperCase() + randomSign.slice(1);
    horoscopeText.textContent = text;
  } catch (err) {
    console.error("Error obteniendo el horóscopo:", err);
    horoscopeText.textContent = "No se pudo cargar el horóscopo diario.";
  }
}

// --------- Al seleccionar país ---------
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

    // --------- Horóscopo ---------
const horoscopeAPI = "https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=";

// Lista de signos en inglés
const horoscopeSigns = [
  "aries", "taurus", "gemini", "cancer",
  "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces"
];

let currentSignIndex = 0;

// ✅ Versión sin CORS usando proxy AllOrigins
async function fetchHoroscopeData(sign) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(horoscopeAPI + sign)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();

    // AllOrigins devuelve la respuesta como texto en data.contents
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

// Botones siguiente / anterior
document.getElementById("horoscopeNext").addEventListener("click", () => {
  currentSignIndex = (currentSignIndex + 1) % horoscopeSigns.length;
  fetchHoroscopeData(horoscopeSigns[currentSignIndex]);
});

document.getElementById("horoscopePrev").addEventListener("click", () => {
  currentSignIndex = (currentSignIndex - 1 + horoscopeSigns.length) % horoscopeSigns.length;
  fetchHoroscopeData(horoscopeSigns[currentSignIndex]);
});

// Carga inicial
fetchHoroscopeData(horoscopeSigns[currentSignIndex]);

// --- Noticias (al final del listener de país) ---
// --- Noticias (al final del listener de país) ---
const iso2 = await getCountryCodeISO2(countryName);
if (iso2) {
  setupNewsCarousel(iso2, countryName); // inicia página 1 (6 noticias)
} else {
  newsCountry = null;
  newsPage = 1;
  newsCarouselInner.innerHTML = '';
  const slideEmpty = renderNewsSlide([], true);
  newsCarouselInner.appendChild(slideEmpty);
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

// Navegación carrusel de noticias
if (newsPrevBtn) {
  newsPrevBtn.addEventListener('click', () => {
    if (!newsCountry || newsPage <= 1) return;
    newsPage--;
    loadNewsSlide(newsCountry, mainCountry.textContent, newsPage);
  });
}
if (newsNextBtn) {
  newsNextBtn.addEventListener('click', () => {
    if (!newsCountry) return;
    newsPage++;
    loadNewsSlide(newsCountry, mainCountry.textContent, newsPage);
  });
}
