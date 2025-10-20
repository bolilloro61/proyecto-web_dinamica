const apiKey = 'a846fd3683392957148d860e9e26500e'; // Reemplaza con tu clave real
const lat = 33.44;
const lon = -94.04;

const url = "http://api.openweathermap.org/data/2.5/find?q=Palo+Alto&units=metric&type=accurate&mode=JSON&APPID=a846fd3683392957148d860e9e26500e"

fetch(url)
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

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

xhr.open('GET', 'https://booking-com15.p.rapidapi.com/api/v1/cars/searchCarRentals?pick_up_latitude=40.6397018432617&pick_up_longitude=-73.7791976928711&drop_off_latitude=40.6397018432617&drop_off_longitude=-73.7791976928711&pick_up_time=10%3A00&drop_off_time=10%3A00&driver_age=30&currency_code=USD&location=US');
xhr.setRequestHeader('x-rapidapi-key', '913dc042bamsh64559777b9efd1ap1f0cebjsnb5235ae74968');
xhr.setRequestHeader('x-rapidapi-host', 'booking-com15.p.rapidapi.com');

xhr.send(dat);
const da = null;

const xh = new XMLHttpRequest();
xh.withCredentials = true;

xh.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

xh.open('GET', 'https://astropredict-daily-horoscopes-lucky-insights.p.rapidapi.com/horoscope?lang=es&zodiac=aquarius&type=daily&timezone=UTC');
xh.setRequestHeader('x-rapidapi-key', '913dc042bamsh64559777b9efd1ap1f0cebjsnb5235ae74968');
xh.setRequestHeader('x-rapidapi-host', 'astropredict-daily-horoscopes-lucky-insights.p.rapidapi.com');

xh.send(da);

countries="https://restcountries.com/v3.1/all"