// js/metrics.js

const metrics = {
  /**
   * Calculates the total distance along a path segment.
   * @param {Array<object>} nodes - An array of all nodes in the journey, sorted by timestamp.
   * @param {number|string} startNodeId - The ID of the starting node (or 'start').
   * @param {number|string} endNodeId - The ID of the ending node (or 'end').
   * @returns {number} The total distance in kilometers.
   */
  calculateDistance(nodes, startNodeId, endNodeId) {
    if (nodes.length < 2) return 0;
    const startIndex =
      startNodeId === "start" ? 0 : nodes.findIndex((n) => n.id == startNodeId);
    const endIndex =
      endNodeId === "end"
        ? nodes.length - 1
        : nodes.findIndex((n) => n.id == endNodeId);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = startIndex; i < endIndex; i++) {
      totalDistance += gps.calculateDistance(nodes[i], nodes[i + 1]);
    }

    return totalDistance / 1000; // Convert meters to kilometers
  },

  /**
   * Calculates the time elapsed between two nodes.
   * @param {Array<object>} nodes - An array of all nodes in the journey.
   * @param {number|string} startNodeId - The ID of the starting node (or 'start').
   * @param {number|string} endNodeId - The ID of the ending node (or 'end').
   * @returns {string} The elapsed time in HH:MM:SS format.
   */
  calculateTime(nodes, startNodeId, endNodeId) {
    if (nodes.length < 1) return "00:00:00";
    const startNode =
      startNodeId === "start" ? nodes[0] : nodes.find((n) => n.id == startNodeId);
    const endNode =
      endNodeId === "end"
        ? nodes[nodes.length - 1]
        : nodes.find((n) => n.id == endNodeId);

    if (!startNode || !endNode) return "00:00:00";

    const startTime = new Date(startNode.timestamp);
    const endTime = new Date(endNode.timestamp);
    let diffSeconds = Math.abs(endTime - startTime) / 1000;

    const h = String(Math.floor(diffSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(Math.floor(diffSeconds % 60)).padStart(2, "0");

    return `${h}:${m}:${s}`;
  },
  
  /**
   * Computes average velocity from recent, stable GPS data or direct GPS speed.
   * @param {Array<object>} nodes - An array of all nodes in the journey, sorted by timestamp.
   * @returns {number} The calculated velocity in km/h. Returns 0 if not enough data.
   */
  computeVelocity(nodes) {
      if (nodes.length < 1) return 0;
      
      const lastNode = nodes[nodes.length - 1];
      if (lastNode.speed !== null && lastNode.speed !== undefined && (new Date() - new Date(lastNode.timestamp)) < 15000) {
          return lastNode.speed * 3.6; // Convert m/s to km/h
      }

      if (nodes.length < 5) return 0;
      const twoMinutesAgo = new Date().getTime() - (2 * 60 * 1000);
      const recentNodes = nodes.filter(n => new Date(n.timestamp).getTime() > twoMinutesAgo);

      if (recentNodes.length < 2) return 0;

      const totalDist = this.calculateDistance(recentNodes, 'start', 'end') * 1000; // meters
      const totalTime = (new Date(recentNodes[recentNodes.length-1].timestamp) - new Date(recentNodes[0].timestamp)) / 1000; // seconds

      if (totalTime < 1) return 0;
      const avgSpeed = totalDist / totalTime;
      return avgSpeed * 3.6; // Convert m/s to km/h
  },

  /**
   * Calculates the ETA for a given distance and velocity.
   * @param {number} distanceKm - The distance to travel in kilometers.
   * @param {number} velocityKmh - The current speed in km/h.
   * @returns {string} The ETA in HH:MM:SS format.
   */
  calculateETA(distanceKm, velocityKmh) {
      if (velocityKmh <= 0.1) return "--:--:--";
      
      const hours = distanceKm / velocityKmh;
      const totalSeconds = hours * 3600;

      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(Math.floor(totalSeconds % 60)).padStart(2, "0");

      return `${h}:${m}:${s}`;
  },

  /**
   * NEW: Calculates a full suite of statistics for a completed journey.
   * @param {Array<object>} nodes - The sorted array of all nodes for the journey.
   * @returns {object} An object containing all calculated stats.
   */
  calculateStats(nodes) {
    if (nodes.length < 2) {
      return {
        totalDistance: 0, totalTime: "00:00:00", avgSpeed: 0, maxSpeed: 0,
        minAltitude: 0, maxAltitude: 0, elevationGain: 0,
      };
    }

    const totalDistance = this.calculateDistance(nodes, 'start', 'end');
    const totalTimeStr = this.calculateTime(nodes, 'start', 'end');
    const totalTimeSeconds = (new Date(nodes[nodes.length - 1].timestamp) - new Date(nodes[0].timestamp)) / 1000;
    
    let maxSpeed = 0;
    let minAltitude = Infinity;
    let maxAltitude = -Infinity;
    let elevationGain = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const speedKmh = (node.speed || 0) * 3.6;
        if (speedKmh > maxSpeed) maxSpeed = speedKmh;
        
        const altitude = node.altitude || 0;
        if (altitude < minAltitude) minAltitude = altitude;
        if (altitude > maxAltitude) maxAltitude = altitude;
        
        if (i > 0) {
            const prevAltitude = nodes[i-1].altitude || 0;
            if (altitude > prevAltitude) {
                elevationGain += altitude - prevAltitude;
            }
        }
    }

    const avgSpeed = totalTimeSeconds > 0 ? (totalDistance / (totalTimeSeconds / 3600)) : 0;

    return {
      totalDistance: totalDistance.toFixed(2),
      totalTime: totalTimeStr,
      avgSpeed: avgSpeed.toFixed(1),
      maxSpeed: maxSpeed.toFixed(1),
      minAltitude: minAltitude.toFixed(1),
      maxAltitude: maxAltitude.toFixed(1),
      elevationGain: elevationGain.toFixed(1),
    };
  },

  /**
   * NEW: Formats a timestamp into a human-readable string.
   * @param {string} isoTimestamp - The ISO 8601 timestamp string.
   * @returns {string} The formatted date string e.g., "2025 September 26 01:12:43 PM".
   */
  formatTimestamp(isoTimestamp) {
      const date = new Date(isoTimestamp);
      const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
      };
      return date.toLocaleString('en-US', options);
  }
};