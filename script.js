'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteBtn = document.querySelector('.btn');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // Array
    this.distance = distance; //in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min per km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//For testing
// const run1 = new Running([33, 15], 5.2, 24, 170);
// const cycl1 = new Cycling([33, 15], 5.2, 30, 564);
// console.log(run1, cycl1);

////////////////////////////////////////////////////////////
// Application Arch
class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get user position
    this._getPosition();

    //Get data from local storage
    this._getLocalStorage();

    //Event handlers function
    form.addEventListener('submit', this._newWorkout.bind(this));
    deleteBtn.addEventListener('click', this._reset.bind(this));
    inputType.addEventListener('change', this._toggleElevation.bind(this));
    containerWorkouts.addEventListener('click', this._moveToMark.bind(this));
  }
  _getPosition() {
    //Geolocation Api
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          swal('Error Message', "We can't obtain your position");
        },

        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    //Leaflet map
    this.#map = L.map('map').setView(coords, this.#mapZoom);
    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    //Handling clicks on the map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    //Remove the hide form class
    form.classList.remove('hidden');

    inputDistance.focus();
    // console.log(mapEvent);
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevation() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const posNumber = (...inputs) => inputs.every(inp => inp > 0);

    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // Checks if data valid

    // If (running = running object/cycling = cycling object)
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInput(distance, duration, cadence) ||
        !posNumber(distance, duration, cadence)
      )
        return swal({
          text: 'The inputs must be positive!',
          icon: 'error',
        });

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInput(distance, duration, elevation) ||
        !posNumber(distance, duration)
      )
        return;
      swal({
        text: 'The inputs must be positive!',
        icon: 'error',
      });
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.#workouts.push(workout);

    // render the workout on map as marker
    this._renderMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    //Hide the form + Clear inputs
    this._hideForm();

    //Save data in local storage
    this._setLocalStorage();

    //Delete the data from the local storage
  }
  _renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '????' : '????'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '????' : '????'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">???</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    //for running
    if (workout.type === 'running')
      html += `<div class="workout__details">
        <span class="workout__icon">???</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">????????</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
          </div>
    </li>`;

    //for cycling

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
      <span class="workout__icon">???</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">???</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
  </div>
  </li> `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToMark(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
