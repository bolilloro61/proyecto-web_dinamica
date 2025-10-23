const APIcountries_name = "https://restcountries.com/v3.1/all?fields=name";
const countriesSelect = document.getElementById("countries");

async function fetchCountries() {
  const response = await fetch(APIcountries_name);
  const data = await response.json();

  data.sort((a, b) => a.name.common.localeCompare(b.name.common));

  countriesSelect.innerHTML = "";
  data.forEach(country => {
    const option = document.createElement("option");
    option.value = country.name.common;
    option.textContent = country.name.common;
    countriesSelect.appendChild(option);
  });
}

fetchCountries();

// Escuchar cuando el usuario seleccione un país
countriesSelect.addEventListener('change', () => {
  const textoSeleccionado = countriesSelect.options[countriesSelect.selectedIndex].text;
  
  const APIbooking = new XMLHttpRequest();
  APIbooking.withCredentials = true;

  APIbooking.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
      console.log(this.responseText);
    }
  });

  const url = `https://booking-com15.p.rapidapi.com/api/v1/attraction/searchLocation?query=${encodeURIComponent(textoSeleccionado)}&languagecode=en-us`;
  
  APIbooking.open('GET', url);
  APIbooking.setRequestHeader('x-rapidapi-key', '913dc042bamsh64559777b9efd1ap1f0cebjsnb5235ae74968');
  APIbooking.setRequestHeader('x-rapidapi-host', 'booking-com15.p.rapidapi.com');

  APIbooking.send(null);
});


const APIweather = "http://api.openweathermap.org/data/2.5/find?q=Palo+Alto&units=metric&type=accurate&mode=JSON&APPID=a846fd3683392957148d860e9e26500e"

fetch(APIweather)
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la solicitud: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });



const dat = null;





const da = null;

const APIastro = new XMLHttpRequest();
APIastro.withCredentials = true;

APIastro.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

APIastro.open('GET', 'https://astropredict-daily-horoscopes-lucky-insights.p.rapidapi.com/horoscope?lang=es&zodiac=aquarius&type=daily&timezone=UTC');
APIastro.setRequestHeader('x-rapidapi-key', '913dc042bamsh64559777b9efd1ap1f0cebjsnb5235ae74968');
APIastro.setRequestHeader('x-rapidapi-host', 'astropredict-daily-horoscopes-lucky-insights.p.rapidapi.com');

APIastro.send(da);








