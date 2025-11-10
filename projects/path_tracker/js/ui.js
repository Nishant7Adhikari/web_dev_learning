// js/ui.js

// This file handles all UI-related interactions.

const ui = {
  // --- Element Selectors ---
  modeSelection: document.getElementById("mode-selection"),
  autoModeBtn: document.getElementById("auto-mode-btn"),
  manualModeBtn: document.getElementById("manual-mode-btn"),
  hybridModeBtn: document.getElementById("hybrid-mode-btn"),

  startTrackingBtn: document.getElementById("start-tracking-btn"),
  stopTrackingBtn: document.getElementById("stop-tracking-btn"),
  addNodeBtn: document.getElementById("add-node-btn"),

  exportJsonBtn: document.getElementById("export-json-btn"),
  importJsonInput: document.getElementById("import-json-input"),

  /**
   * Initializes the UI by setting up event listeners.
   * @param {object} app - The main application controller instance.
   */
  init(app) {
    this.startTrackingBtn.addEventListener("click", () => app.startTracking());
    this.stopTrackingBtn.addEventListener("click", () => app.stopTracking());
    this.addNodeBtn.addEventListener("click", () => app.addManualNode());
    this.exportJsonBtn.addEventListener("click", () => app.handleExport());
    this.importJsonInput.addEventListener("change", (event) =>
      app.handleImport(event)
    );

    // Add more event listeners for mode selection if needed
  },

  /**
   * Updates the UI state when tracking starts.
   * @param {string} mode - The current tracking mode ('auto', 'manual', 'hybrid').
   */
  setTrackingStarted(mode) {
    this.startTrackingBtn.disabled = true;
    this.stopTrackingBtn.disabled = false;
    this.modeSelection.style.pointerEvents = "none"; // Disable mode switching
    this.modeSelection.style.opacity = "0.5";

    if (mode === "manual" || mode === "hybrid") {
      this.addNodeBtn.disabled = false;
    }
  },

  /**
   * Updates the UI state when tracking stops.
   */
  setTrackingStopped() {
    this.startTrackingBtn.disabled = false;
    this.stopTrackingBtn.disabled = true;
    this.addNodeBtn.disabled = true;
    this.modeSelection.style.pointerEvents = "auto";
    this.modeSelection.style.opacity = "1";
  },

  /**
   * Prompts the user for a node name.
   * @param {string} defaultValue - The default value for the prompt.
   * @returns {string|null} The entered name or null if cancelled.
   */
  getNodeName(defaultValue) {
    return prompt("Enter a name for this node:", defaultValue);
  },
};
