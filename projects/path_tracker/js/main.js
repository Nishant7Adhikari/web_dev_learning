// js/main.js - FULL CONTENT

const app = {
  async init() {
    console.log("Initializing 3D Path Tracker...");
    ui.init(this);
    try {
      await db.init(config);
      console.log("Database connection successful.");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      alert(
        "Error: Could not connect to the offline database. The app may not function correctly."
      );
    }
  },
  startTracking() {
    modeController.start(this.trackPoint.bind(this), config);
    ui.setTrackingStarted(modeController.currentMode);
  },
  stopTracking() {
    modeController.stop();
    ui.setTrackingStopped();
  },
  async trackPoint(mode, customName = null) {
    try {
      console.log("Fetching GPS position...");
      const position = await gps.getCurrentPosition(config.gps);
      const lastNode = await db.getLastNode(config);
      if (lastNode) {
        const distance = gps.calculateDistance(
          { latitude: lastNode.latitude, longitude: lastNode.longitude },
          { latitude: position.latitude, longitude: position.longitude }
        );
        if (distance < config.gps.minDistanceThreshold) {
          console.log(
            `Point ignored. Distance (${distance.toFixed(
              2
            )}m) is less than threshold (${config.gps.minDistanceThreshold}m).`
          );
          return;
        }
      }
      const node = {
        name: customName || modeController.getAutoNodeName(config),
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        timestamp: new Date().toISOString(),
      };
      await db.addNode(node, config);
    } catch (error) {
      console.error("Failed to track point:", error);
      alert(`Error: ${error}`);
      this.stopTracking();
    }
  },
  addManualNode() {
    const nodeName = ui.getNodeName("");
    if (nodeName === null) {
      return;
    }
    this.trackPoint("manual", nodeName || "Manual Node");
  },
  async handleExport() {
    try {
      console.log("Exporting path...");
      const nodes = await db.getAllNodes(config);
      exportImport.exportPath(nodes);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Could not export path: " + error);
    }
  },
  async handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const confirmation = confirm(
      "This will replace your current tracked path. Are you sure?"
    );
    if (!confirmation) {
      event.target.value = "";
      return;
    }
    try {
      const importedNodes = await exportImport.importPath(file);
      await db.clearAllNodes(config);
      const transaction = db._db.transaction(
        [config.database.objectStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(config.database.objectStoreName);
      importedNodes.forEach((node) => {
        delete node.id;
        store.add(node);
      });
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });
      alert(`Successfully imported ${importedNodes.length} nodes.`);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed: " + error);
    } finally {
      event.target.value = "";
    }
  },
};
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
