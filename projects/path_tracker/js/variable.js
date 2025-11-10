// js/variable.js

const config = {
  // GPS Tracking Settings
  gps: {
    autoInterval: 8000,
    highAccuracy: true,
    minDistanceThreshold: 17,
  },

  // 3D Renderer Settings
  renderer: {
    backgroundColor: 0x87ceeb,
    path: {
      width: 9, // Road width in meters
      height: 0.5, // Road height/thickness in meters
      color: 0x444444,
    },
    floor: {
      size: 10,
      color: 0x336633,
    },
    camera: {
      fov: 75,
      nearPlane: 0.1,
      farPlane: 5000,
    },
  },

  // Animation settings for the path preview
  animation: {
    minSpeed: 1,
    maxSpeed: 10,
    defaultSpeed: 5,
  },

  // Database Settings
  database: {
    name: "3DPathTrackerDB",
    version: 2,
  },

  // Default Naming
  defaults: {
    nodeNamePrefix: "Node ",
  },
};