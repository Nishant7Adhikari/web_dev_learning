// js/gps.js

const gps = {
  /**
   * Gets a single, current GPS position.
   * @param {object} config - The global configuration object's GPS settings.
   * @returns {Promise<object>} A promise that resolves with position data.
   */
  getCurrentPosition(config) {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        return reject("Geolocation is not supported by your browser.");
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        {
          enableHighAccuracy: config.highAccuracy,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  },

  /**
   * Starts watching the user's position and calls a callback with new data.
   * @param {object} config - The global config's GPS settings.
   * @param {function} onPositionUpdate - The callback function to execute with new position data.
   * @param {function} onError - The callback function for errors.
   * @returns {number} The ID of the watch, to be used with stopWatching.
   */
  startWatching(config, onPositionUpdate, onError) {
    if (!("geolocation" in navigator)) {
      onError({ message: "Geolocation is not supported." });
      return null;
    }
    return navigator.geolocation.watchPosition(
      (position) => onPositionUpdate(position.coords),
      onError,
      { enableHighAccuracy: config.highAccuracy, timeout: 10000, maximumAge: 0 }
    );
  },

  /**
   * Stops watching the user's position.
   * @param {number} watchId - The ID returned by startWatching.
   */
  stopWatching(watchId) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Calculates the distance between two GPS coordinates using the Haversine formula.
   * @returns {number} The distance in meters.
   */
  calculateDistance(coords1, coords2) {
    // ... unchanged ...
    const R = 6371e3;
    const lat1Rad = (coords1.latitude * Math.PI) / 180;
    const lat2Rad = (coords2.latitude * Math.PI) / 180;
    const deltaLatRad = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
    const deltaLonRad =
      ((coords2.longitude - coords1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLonRad / 2) *
        Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};
