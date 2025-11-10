// js/modeController.js

// This file controls the logic for different tracking modes.

const modeController = {
  currentMode: "auto", // Default mode
  isActive: false,
  autoIntervalId: null,
  nodeCounter: 0,

  /**
   * Starts the tracking process based on the selected mode.
   * @param {function} onTrack - The callback function to execute when a new node should be created.
   * @param {object} config - The global configuration object.
   */
  start(onTrack, config) {
    if (this.isActive) return;
    this.isActive = true;
    console.log(`Tracking started in ${this.currentMode} mode.`);

    // Reset node counter at the beginning of a new session
    // A more robust implementation might load the last count from the DB.
    this.nodeCounter = 0;

    if (this.currentMode === "auto" || this.currentMode === "hybrid") {
      // Immediately track the first point
      onTrack(this.currentMode);

      // Set up the interval for subsequent points
      this.autoIntervalId = setInterval(() => {
        onTrack(this.currentMode);
      }, config.gps.autoInterval);
    }
  },

  /**
   * Stops the tracking process.
   */
  stop() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.autoIntervalId) {
      clearInterval(this.autoIntervalId);
      this.autoIntervalId = null;
    }
    console.log("Tracking stopped.");
  },

  /**
   * Generates a default name for an automatically captured node.
   * @param {object} config - The global configuration object.
   * @returns {string} The generated node name.
   */
  getAutoNodeName(config) {
    this.nodeCounter++;
    // Pads the number with leading zeros (e.g., 1 -> 001)
    const paddedCount = this.nodeCounter.toString().padStart(3, "0");
    return `${config.defaults.nodeNamePrefix}${paddedCount}`;
  },
};
