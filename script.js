'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Global vars
let map, mapEvent;
//Geolocation Api
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(latitude, longitude);
      console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

      const coords = [latitude, longitude];
      //Leaflet map
      map = L.map('map').setView(coords, 13);
      L.tileLayer(
        'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ).addTo(map);

      //Handling clicks on the map
      map.on('click', function (mapE) {
        mapEvent = mapE;
        //Remove the hide form class
        form.classList.remove('hidden');

        inputDistance.focus();
        // console.log(mapEvent);
      });
    },
    function () {
      alert("Something wrong we can't get your position");
    },

    { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
  );
form.addEventListener('submit', function (e) {
  e.preventDefault();

  //Clear inputs
  inputDistance.value =
    inputDuration.value =
    inputElevation.value =
    inputCadence.value =
      '';
  //display marker
  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxwidth: 250,
        minwidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
    )
    .setPopupContent('Workout')
    .openPopup();
});

inputType.addEventListener('change', function () {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
