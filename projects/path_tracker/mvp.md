# 3D Path Tracker — Detailed MVP Plan

## 1. Project Summary
**Goal:**  
Create an offline-capable, mobile-friendly web application that tracks GPS coordinates in real time (latitude, longitude, altitude) and visualizes the path in 3D, similar to Google Earth or Blender navigation. Each recorded point is called a **node**, which can have a custom **name**, making it easier to track stops or events. Users can export paths, share them with friends, or load pre-recorded paths.  

**Key Uses:**  
- Personal travel tracking (like a timeline)  
- Sharing detailed paths with friends  
- Offline usage without relying on internet  
- Data analysis for altitude, distance, or time  

**End Goal:**  
A modular, maintainable, offline-first web app that can:  
1. Track paths automatically at set intervals or manually.  
2. Allow naming of each node in real-time.  
3. Render a smooth, interactive 3D path with Blender/Google Earth style navigation.  
4. Save large GPS datasets offline using IndexedDB.  
5. Export/import paths as JSON for sharing.  
6. Provide a fully modular architecture to add future features like satellite overlay, custom markers, or terrain.

---

## 2. MVP Features

| Feature | Description | Notes |
|---------|------------|------|
| **A. 3D Path Rendering** | Render path in 3D using Three.js | 3D line connecting GPS points, colored line |
| **B. Automated Tracking** | Record GPS every X seconds (custom interval) | Configurable in `variable.js` |
| **C. Manual Tracking** | Add GPS points manually via button | Each node can be named on add |
| **D. Hybrid Mode** | Combination of Auto + Manual | Record continuously, allow manual additions, name nodes manually if needed |
| **E. Node Naming** | Each recorded point has `id` and `name` | Example JSON format: <br>```json { "id": 1, "name": "Start Point", "latitude": 26.704, "longitude": 85.902, "altitude": 73.5, "timestamp": "2025-11-06T10:00:00Z" }``` |
| **F. IndexedDB Storage** | Save GPS points offline | Works for large datasets (unlike localStorage) |
| **G. Export JSON** | Save recorded path for sharing | Uses Blob and URL.createObjectURL |
| **H. Import JSON** | Load previously recorded paths | Can show path on 3D map with node names |
| **I. Share** | Use Android share API | Works with JSON files |
| **J. Log** | Capture every code change & new feature added by AI | Stored in `log.md` |
| **K. Multi-Page Navigation** | Dashboard, Map page, Settings | Navbar for switching pages |
| **L. 3D Map Navigation** | Orbit, Pan, Zoom (Blender style) | Mouse drag, touch, or keyboard shortcuts |
| **M. Time Stamps** | Each GPS point includes timestamp | Useful for timeline analysis |
| **N. Variable Config** | Central config file `variable.js` | Allows quick tweaks and debugging |

---

## 3. Workflow

### Start
1. Open `index.html` (dashboard)  
2. Select mode: **Auto**, **Manual**, or **Hybrid**  
3. Start tracking  

### Tracking
- **Auto:** GPS collected every `autoInterval`, each node auto-assigned a default name (Node 001, Node 002…)  
- **Manual:** Press **Add Node** → input popup appears → enter custom node name → save node  
- **Hybrid:** Both above simultaneously  

### Visualization
- Open `map.html`  
- Render 3D path using Three.js  
- Blender-style navigation:
  - Orbit: Drag  
  - Pan: Shift + Drag  
  - Zoom: Pinch / Scroll  
- Show info panel: node name, coordinates, timestamp, altitude  

### Export / Share
- Export path as JSON (including node names)  
- Import JSON to see exact path with names  
- Share via Android share API  

### Post-Trip
- Optionally analyze: time, altitude changes, distance, speed  

---

## 4. Technologies

| Layer | Technology / Library |
|-------|--------------------|
| Frontend | HTML5, CSS3, Vanilla JS |
| 3D Rendering | Three.js (offline CDN copy) |
| GPS | HTML5 Geolocation API (`navigator.geolocation`) |
| Storage | IndexedDB (with optional idb library) |
| Sharing | Web Share API (`navigator.share`) |
| UI / Dashboard | Custom CSS + optional lightweight UI library |
| Time / Interval | `setInterval` for auto-tracking |
| JSON Handling | `Blob` API + `FileReader` API |
| Optional | OpenTopoMap or heightmaps for terrain |

---

## 5. CDNs / Libraries

- **Three.js** – 3D rendering, offline copy: `/lib/three.min.js`  
- **idb.min.js** – IndexedDB helper (optional, simplifies DB)  
- Optional future libraries:  
  - **dat.GUI** – for UI sliders (interval, camera speed)  
  - **OrbitControls.js** – Blender-style camera navigation  
- **Optional polyfills** for older Android browsers (if needed for IndexedDB or Geolocation)

---

## 6. Folder Structure
###  
3DPathTracker/
│
├── index.html
├── map.html
├── log.md
│
├── /assets/
│   ├── style.css
│   └── icons/
│       ├── start.svg
│       ├── pause.svg
│       └── export.svg
│
├── /js/
│   ├── variable.js
│   ├── db.js
│   ├── gps.js
│   ├── pathRenderer.js
│   ├── modeController.js
│   ├── exportImport.js
│   ├── ui.js
│   └── main.js
│
├── /lib/
│   ├── three.min.js
│   └── idb.min.js
│
└── /data/
    └── samples/
        └── sample1.json

---

## 7. APIs

| API | Usage |
|-----|-------|
| `navigator.geolocation.getCurrentPosition` | Fetch lat/lon/altitude for nodes |
| `setInterval` | Auto-record GPS points at configurable intervals |
| `IndexedDB` | Store large datasets offline (node name, coordinates, timestamp) |
| `FileReader` / `Blob` | Export & import JSON files with node names |
| `navigator.share` | Share JSON files via Android share API |
| **Three.js OrbitControls** | Camera navigation in 3D (orbit, pan, zoom) |

---

## 8. MVP Priorities

1. **Core tracking + IndexedDB storage**  
2. **3D path rendering with orbit/pan/zoom**  
3. **Manual + Auto + Hybrid modes**  
4. **Node naming support** (custom names + auto default names)  
5. **Export / Import / Share JSON** (including node names)  
6. **Multi-page navigation with navbar**  
7. **Configurable variables in `variable.js`**  
8. **Logging system (`log.md`)**  

**Optional / future features:**  
- Real satellite map overlay  
- Terrain/heightmap rendering  
- Speed/distance calculations  
- Photo/video integration at nodes  

---

## 9. Node JSON Format

All nodes, whether manually or automatically recorded, will be stored in **IndexedDB** and exported/imported as JSON in the following format:

## 9. JSON Node Format

Each node stored in IndexedDB or exported as JSON should have the following structure:

```json
{
  "id": 1,
  "name": "Start Point",
  "latitude": 26.704,
  "longitude": 85.902,
  "altitude": 73.5,
  "timestamp": "2025-11-06T10:00:00Z"
}
```

- `id` → Unique sequential identifier
- `name` → Custom node name (manual) or default node name (auto)
- `latitude` → Latitude coordinate
- `longitude` → Longitude coordinate
- `altitude` → Altitude from GPS
- `timestamp` → Time when node was recorded

---

## 10. Node Naming Integration

**Manual Mode**
- User taps "Add Node"
- Input prompt appears for node name
- Node saved with `id`, `name`, lat/lon/alt, timestamp

**Auto Mode**
- Nodes recorded automatically at intervals
- Default name assigned: Node 001, Node 002, …
- User can rename later via sidebar table

**Hybrid Mode**
- Auto nodes receive default names
- Manual nodes allow custom names
- Both node types stored in same IndexedDB store

**UI**
- Sidebar table showing:
  Name | Time | Latitude | Longitude | Altitude
- 3D map optionally shows node names as floating text
- Editable for auto-generated node names


### For Generative AIs
if necessary give bash code to install necessary libraries in system with detailed and clear instructions on how to work with bash, how to install, in termux.

[ !!! CRITICAL !!! ] most important task for Gemini or any ai working on this project: always maintain and append the log.md file, instead of rewriting everything just give what needs to be appened. 
the purpose of log.md file is to give context to future agents and engineer on the log and progress of the application design over time. 