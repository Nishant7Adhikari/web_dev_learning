// js/app.js
const App = {
  // --- State & Elements ---
  isTracking: false,
  isPaused: false,
  activeJourneyId: null,
  activeMetricsJourneyData: null,
  gpsWatchId: null,
  timerIntervalId: null,
  activeTab: "home-tab",
  tabs: {},
  navButtons: {},
  ui: {},

  async init() {
    this.ui = {
      startBtn: document.getElementById("start-btn"),
      pauseBtn: document.getElementById("pause-btn"),
      stopBtn: document.getElementById("stop-btn"),
      activeJourneyPanel: document.getElementById("active-journey-panel"),
      journeyTimer: document.getElementById("journey-timer"),
      dataTableContainer: document.getElementById("data-table-container"),
      infoPanel: document.getElementById("info-panel"),
      mapControls: document.getElementById("map-controls"),
      resetViewBtn: document.getElementById("reset-view-btn"),
      previewBtn: document.getElementById("preview-btn"),
      animControls: document.getElementById("animation-controls"),
      animPlayPauseBtn: document.getElementById("anim-play-pause-btn"),
      animStopBtn: document.getElementById("anim-stop-btn"),
      animLockCameraBtn: document.getElementById("anim-lock-camera-btn"),
      animSpeedSlider: document.getElementById("anim-speed-slider"),
      metricsInfoPanel: document.getElementById("metrics-info-panel"),
      metricsHistoricalPanel: document.getElementById("metrics-historical-panel"),
      metricsLivePanel: document.getElementById("metrics-live-panel"),
      metricsJourneyNameHistorical: document.getElementById("metrics-journey-name-historical"),
      metricsJourneyNameLive: document.getElementById("metrics-journey-name-live"),
      journeyStatsContainer: document.getElementById("journey-stats-container"),
      startPointSelect: document.getElementById("start-point-select"),
      endPointSelect: document.getElementById("end-point-select"),
      measuredDistance: document.getElementById("measured-distance"),
      measuredTime: document.getElementById("measured-time"),
      historicalNodesList: document.getElementById("historical-nodes-list"),
      liveTotalDistance: document.getElementById("live-total-distance"),
      liveCurrentVelocity: document.getElementById("live-current-velocity"),
      etaDistanceInput: document.getElementById("eta-distance-input"),
      etaResult: document.getElementById("eta-result"),
      historyListContainer: document.getElementById("journey-list-container"),
      bulkActionsContainer: document.getElementById("bulk-actions-container"),
      importInput: document.getElementById("import-prkt-input"),
      exportSelectedBtn: document.getElementById("export-selected-btn"),
      deleteSelectedBtn: document.getElementById("delete-selected-btn"),
      mergeSelectedBtn: document.getElementById("merge-selected-btn"),
      addStopModal: document.getElementById("add-stop-modal"),
      nodeNameInput: document.getElementById("node-name-input"),
      captureImageBtn: document.getElementById("capture-image-btn"),
      uploadImageBtn: document.getElementById("upload-image-btn"),
      imageCaptureInput: document.getElementById("image-capture-input"),
      imageUploadInput: document.getElementById("image-upload-input"),
      imagePreview: document.getElementById("image-preview"),
      saveStopBtn: document.getElementById("save-stop-btn"),
      cancelStopBtn: document.getElementById("cancel-stop-btn"),
      imageViewerModal: document.getElementById("image-viewer-modal"),
      imageViewerTitle: document.getElementById("image-viewer-title"),
      imageViewerImg: document.getElementById("image-viewer-img"),
      imageViewerTimestamp: document.getElementById("image-viewer-timestamp"),
      imageViewerCloseBtn: document.getElementById("image-viewer-close-btn"),
      dialogModal: document.getElementById('dialog-modal'),
      dialogTitle: document.getElementById('dialog-title'),
      dialogMessage: document.getElementById('dialog-message'),
      dialogButtons: document.getElementById('dialog-buttons'),
    };
    
    this.tabs = { home: document.getElementById("home-tab"), map: document.getElementById("map-tab"), metrics: document.getElementById("metrics-tab"), history: document.getElementById("history-tab") };
    this.navButtons = { home: document.querySelector('[data-tab="home-tab"]'), map: document.querySelector('[data-tab="map-tab"]'), metrics: document.querySelector('[data-tab="metrics-tab"]'), history: document.querySelector('[data-tab="history-tab"]') };

    await db.init();
    pathRenderer.init(config, (nodeId) => this.showImageForNode(nodeId));
    this.bindEvents();
    this.showTab("home");
    await this.refreshHistoryList();
  },

  bindEvents() {
    document.querySelector(".app-nav").addEventListener("click",(e) => e.target.matches(".nav-button") && this.showTab(e.target.dataset.tab.replace("-tab", "")));
    this.ui.startBtn.addEventListener("click", () => this.startNewJourney());
    this.ui.pauseBtn.addEventListener("click", () => this.togglePause());
    this.ui.stopBtn.addEventListener("click", () => this.finishJourney());
    document.getElementById("add-data-btn").addEventListener("click", () => this.showModal("add-stop-modal"));
    this.ui.cancelStopBtn.addEventListener("click", () => this.hideModal("add-stop-modal"));
    this.ui.saveStopBtn.addEventListener("click", () => this.saveManualStop());
    this.ui.captureImageBtn.addEventListener("click", () => this.ui.imageCaptureInput.click());
    this.ui.uploadImageBtn.addEventListener("click", () => this.ui.imageUploadInput.click());
    this.ui.imageCaptureInput.addEventListener("change", (e) => this.previewImage(e));
    this.ui.imageUploadInput.addEventListener("change", (e) => this.previewImage(e));
    this.ui.dataTableContainer.addEventListener("focusout", (e) => e.target.matches('td[contenteditable="true"]') && this.handleTableCellEdit(e.target));
    this.ui.dataTableContainer.addEventListener("click", (e) => {
        const target = e.target;
        if (target.matches(".action-btn-delete")) { const row = target.closest("tr"); this.handleNodeDelete(row.dataset.nodeId, row); }
        if (target.matches(".action-btn-image")) { this.handleNodeImageAdd(target.closest("tr").dataset.nodeId); }
    });
    this.ui.historyListContainer.addEventListener("click", (e) => {
      const journeyCard = e.target.closest(".journey-item");
      if (!journeyCard) return;
      const journeyId = parseInt(journeyCard.dataset.journeyId);
      if (e.target.matches(".view-map-btn")) this.viewJourneyOnMap(journeyId);
      if (e.target.matches(".delete-btn")) this.deleteJourney(journeyId);
      if (e.target.matches(".export-btn")) this.exportJourneys([journeyId]);
      if (e.target.matches(".metrics-btn")) this.loadJourneyForMetrics(journeyId);
      if (e.target.matches(".journey-select")) this.updateBulkActionButtons();
    });
    this.ui.importInput.addEventListener("change", (e) => this.handleImport(e));
    this.ui.exportSelectedBtn.addEventListener("click", () => this.handleBulkExport());
    this.ui.deleteSelectedBtn.addEventListener("click", () => this.handleBulkDelete());
    this.ui.mergeSelectedBtn.addEventListener("click", () => this.handleBulkMerge());
    this.ui.resetViewBtn.addEventListener("click", () => pathRenderer.resetCamera());
    this.ui.previewBtn.addEventListener("click", () => this.startPreview());
    this.ui.animStopBtn.addEventListener("click", () => this.stopPreview());
    this.ui.animPlayPauseBtn.addEventListener("click", () => pathRenderer.togglePauseAnimation());
    
    // Initialize animation slider from config
    this.ui.animSpeedSlider.min = config.animation.minSpeed;
    this.ui.animSpeedSlider.max = config.animation.maxSpeed;
    this.ui.animSpeedSlider.value = config.animation.defaultSpeed;
    pathRenderer.setAnimationSpeed(config.animation.defaultSpeed);
    this.ui.animSpeedSlider.addEventListener("input", (e) => pathRenderer.setAnimationSpeed(parseFloat(e.target.value)));

    this.ui.animLockCameraBtn.addEventListener("click", () => {
        const isLocked = pathRenderer.toggleCameraLock();
        this.ui.animLockCameraBtn.textContent = isLocked ? "Free Camera" : "Follow Car";
    });
    this.ui.startPointSelect.addEventListener("change", () => this.updateHistoricalMetrics());
    this.ui.endPointSelect.addEventListener("change", () => this.updateHistoricalMetrics());
    this.ui.etaDistanceInput.addEventListener('input', () => this.updateLiveMetrics());
    this.ui.imageViewerCloseBtn.addEventListener("click", () => this.hideModal('image-viewer-modal'));
  },

  startPreview() {
    if (pathRenderer.startPreview()) {
      this.ui.mapControls.style.display = "none";
      this.ui.animControls.style.display = "flex";
      this.ui.animPlayPauseBtn.textContent = "Pause";
      this.ui.animLockCameraBtn.textContent = "Free Camera";
    } else {
      this.showDialog('Preview Error', 'Cannot start preview. Make sure a path with at least two points is loaded and the 3D model is available.', [{text: 'OK'}]);
    }
  },

  stopPreview() {
    pathRenderer.stopPreview();
    this.ui.mapControls.style.display = "flex";
    this.ui.animControls.style.display = "none";
  },

  async startNewJourney() {
    this.ui.startBtn.disabled = true;
    this.ui.startBtn.textContent = "Getting GPS...";
    pathRenderer.clearScene();
    this.activeMetricsJourneyData = null;
    try {
      const initialPosition = await gps.getCurrentPosition(config.gps);
      this.isTracking = true;
      this.isPaused = false;
      const newJourney = { name: `Journey on ${new Date().toLocaleDateString()}`, startTime: new Date().toISOString(), endTime: null };
      this.activeJourneyId = await db.addJourney(newJourney);
      this.updateTrackingUI();
      await this.renderDataTable();
      await this.recordNode(initialPosition, true);
      this.gpsWatchId = gps.startWatching(config.gps, (p) => this.recordNode(p), (e) => console.error("GPS Watch Error:", e));
      this.startTimer();
    } catch (error) {
      console.error("Failed to start new journey:", error);
      this.showDialog('GPS Error', 'Could not get an initial GPS signal. Please check location permissions and try again in an open area.', [{text: 'OK'}]);
      this.updateTrackingUI();
    } finally {
      this.ui.startBtn.disabled = false;
      this.ui.startBtn.textContent = "Start";
    }
  },

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      gps.stopWatching(this.gpsWatchId);
      this.gpsWatchId = null;
      this.stopTimer();
    } else {
      this.gpsWatchId = gps.startWatching(config.gps, (p) => this.recordNode(p), (e) => console.error("GPS Watch Error:", e));
      this.startTimer(this.getCurrentTime());
    }
    this.updateTrackingUI();
  },

  async finishJourney() {
    if (!this.activeJourneyId) return;
    gps.stopWatching(this.gpsWatchId);
    this.stopTimer();
    const journey = await db.getJourney(this.activeJourneyId);
    journey.endTime = new Date().toISOString();
    await db.updateJourney(this.activeJourneyId, journey);
    this.isTracking = false;
    this.isPaused = false;
    this.activeJourneyId = null;
    this.gpsWatchId = null;
    this.updateTrackingUI();
    await this.refreshHistoryList();
    this.showDialog('Success', 'Journey finished and saved.', [{text: 'OK'}]);
  },

  async recordNode(position, isFirstNode = false) {
    if (this.isPaused || !this.isTracking) return;
    try {
      if (!isFirstNode) {
        const lastNode = await db.getLastNodeForJourney(this.activeJourneyId);
        if (lastNode) { if (gps.calculateDistance(lastNode, position) < config.gps.minDistanceThreshold) return; }
      }
      const nodeData = { journeyId: this.activeJourneyId, latitude: position.latitude, longitude: position.longitude, altitude: position.altitude || 0, timestamp: new Date().toISOString(), speed: position.speed };
      const nodeId = await db.addNode(nodeData);
      const newNode = { ...nodeData, id: nodeId };
      this.appendNodeToTable(newNode);
      this.updateLiveMap();
      if (this.activeMetricsJourneyData && this.activeMetricsJourneyData.journey.id === this.activeJourneyId) {
          this.activeMetricsJourneyData.nodes.push(newNode);
          this.updateLiveMetrics();
      }
    } catch (error) { console.error("Failed to record node:", error); }
  },

  async saveManualStop() {
    const name = this.ui.nodeNameInput.value.trim();
    const file = this.ui.imageCaptureInput.files[0] || this.ui.imageUploadInput.files[0];
    let imageBlob = null;
    if (file) { imageBlob = new Blob([file], { type: file.type }); }
    try {
      const position = await gps.getCurrentPosition(config.gps);
      const nodeData = { journeyId: this.activeJourneyId, name: name || `Stop @ ${new Date().toLocaleTimeString()}`, imageBlob: imageBlob, latitude: position.latitude, longitude: position.longitude, altitude: position.altitude, timestamp: new Date().toISOString(), speed: position.speed };
      const nodeId = await db.addNode(nodeData);
      const newNode = { ...nodeData, id: nodeId };
      this.appendNodeToTable(newNode);
      this.hideModal("add-stop-modal");
      if (this.activeMetricsJourneyData && this.activeMetricsJourneyData.journey.id === this.activeJourneyId) {
          this.activeMetricsJourneyData.nodes.push(newNode);
          this.populateMetricsDropdowns();
      }
    } catch (error) {
      console.error("Failed to save manual stop:", error);
      this.showDialog('GPS Error', 'Could not get GPS location to save stop.', [{text: 'OK'}]);
    }
  },

  async refreshHistoryList() {
    const journeys = await db.getAllJourneys();
    this.ui.historyListContainer.innerHTML = journeys.length === 0 ? "<p>No journeys recorded yet.</p>" : "";
    journeys.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).forEach((journey) => {
      const journeyEl = document.createElement("div");
      journeyEl.className = "card journey-item";
      journeyEl.dataset.journeyId = journey.id;
      journeyEl.innerHTML = `
        <div class="journey-info">
            <input type="checkbox" class="journey-select">
            <div>
                <strong>${journey.name}</strong> 
                <small>${new Date(journey.startTime).toLocaleString()}</small>
            </div>
        </div>
        <div class="journey-actions">
            <button class="metrics-btn secondary">Metrics</button>
            <button class="view-map-btn secondary">Map</button>
            <button class="export-btn">Export</button>
            <button class="delete-btn">Delete</button>
        </div>`;
      this.ui.historyListContainer.appendChild(journeyEl);
    });
    this.updateBulkActionButtons();
  },

  updateBulkActionButtons() {
    const count = this.ui.historyListContainer.querySelectorAll(".journey-select:checked").length;
    this.ui.bulkActionsContainer.style.display = count > 0 ? "flex" : "none";
  },

  async viewJourneyOnMap(journeyId) {
    this.stopPreview();
    this.ui.infoPanel.textContent = "Loading path from database...";
    this.ui.infoPanel.style.display = "block";
    this.showTab("map");
    pathRenderer.clearScene();
    try {
      const nodes = await db.getNodesForJourney(journeyId);
      if (nodes && nodes.length > 1) {
        pathRenderer.renderPath(nodes);
        this.ui.infoPanel.style.display = "none";
      } else {
        pathRenderer.resetCamera();
        this.ui.infoPanel.textContent = "Not enough data points to render a path.";
      }
    } catch (error) {
      console.error("Failed to render path:", error);
      this.ui.infoPanel.textContent = "Error loading path.";
    }
  },

  deleteJourney(journeyId) {
    this.showDialog(
        'Confirm Delete',
        'Are you sure you want to permanently delete this journey? This action cannot be undone.',
        [
            { text: 'Cancel', class: 'secondary' },
            { text: 'Delete', onClick: async () => {
                await db.deleteJourneyAndNodes(journeyId);
                if (this.activeMetricsJourneyData && this.activeMetricsJourneyData.journey.id === journeyId) {
                    this.activeMetricsJourneyData = null;
                }
                await this.refreshHistoryList();
            }}
        ]
    );
  },

  showTab(tabKey) {
    for (const key in this.tabs) {
      this.tabs[key].classList.remove("active");
      this.navButtons[key].classList.remove("active");
    }
    this.tabs[tabKey].classList.add("active");
    this.navButtons[tabKey].classList.add("active");
    this.activeTab = `${tabKey}-tab`;
    
    if (this.activeTab === 'map-tab') { pathRenderer.onResize(); if (this.isTracking) this.updateLiveMap(); } 
    else { this.stopPreview(); }
    
    if (this.activeTab === 'metrics-tab') {
        if (this.isTracking && (!this.activeMetricsJourneyData || this.activeMetricsJourneyData.journey.id !== this.activeJourneyId)) {
            this.loadJourneyForMetrics(this.activeJourneyId);
        } else if (!this.isTracking && !this.activeMetricsJourneyData) {
            this.ui.metricsInfoPanel.style.display = 'block';
            this.ui.metricsHistoricalPanel.style.display = 'none';
            this.ui.metricsLivePanel.style.display = 'none';
        }
    }
  },

  async showImageForNode(nodeId) {
      let data = null;
      if (this.isTracking && this.activeMetricsJourneyData && this.activeMetricsJourneyData.journey.id === this.activeJourneyId) {
        data = this.activeMetricsJourneyData.nodes;
      } else if (this.activeMetricsJourneyData) {
        data = this.activeMetricsJourneyData.nodes;
      }

      if (!data) return;
      const node = data.find(n => n.id === nodeId);
      if (!node || !node.imageBlob) return;

      this.ui.imageViewerTitle.textContent = node.name || "Image";
      this.ui.imageViewerImg.src = URL.createObjectURL(node.imageBlob);
      this.ui.imageViewerTimestamp.textContent = metrics.formatTimestamp(node.timestamp);
      this.showModal('image-viewer-modal');
  },

  async loadJourneyForMetrics(journeyId) {
      const journey = await db.getJourney(journeyId);
      const nodes = await db.getNodesForJourney(journeyId);
      nodes.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
      this.activeMetricsJourneyData = { journey, nodes };
      
      if (this.isTracking && this.activeJourneyId === journeyId) {
          this.ui.metricsJourneyNameLive.textContent = `Live: ${journey.name}`;
          this.updateLiveMetrics();
          this.ui.metricsHistoricalPanel.style.display = 'none';
          this.ui.metricsLivePanel.style.display = 'block';
      } else {
          this.ui.metricsJourneyNameHistorical.textContent = `Analysis: ${journey.name}`;
          this.populateMetricsForHistory();
          this.ui.metricsLivePanel.style.display = 'none';
          this.ui.metricsHistoricalPanel.style.display = 'block';
      }
      this.ui.metricsInfoPanel.style.display = 'none';
      this.showTab('metrics');
  },

  populateMetricsForHistory() {
      if (!this.activeMetricsJourneyData) return;
      const stats = metrics.calculateStats(this.activeMetricsJourneyData.nodes);
      this.ui.journeyStatsContainer.innerHTML = `
        <div><strong>Total Distance</strong><span>${stats.totalDistance} km</span></div>
        <div><strong>Total Time</strong><span>${stats.totalTime}</span></div>
        <div><strong>Avg. Speed</strong><span>${stats.avgSpeed} km/h</span></div>
        <div><strong>Max Speed</strong><span>${stats.maxSpeed} km/h</span></div>
        <div><strong>Min Altitude</strong><span>${stats.minAltitude} m</span></div>
        <div><strong>Max Altitude</strong><span>${stats.maxAltitude} m</span></div>
        <div><strong>Elevation Gain</strong><span>${stats.elevationGain} m</span></div>`;
      this.populateMetricsDropdowns();
      this.updateHistoricalMetrics();
      this.renderHistoricalNodeList();
  },

  updateHistoricalMetrics() {
    if (!this.activeMetricsJourneyData) return;
    const { nodes } = this.activeMetricsJourneyData;
    const startId = this.ui.startPointSelect.value;
    const endId = this.ui.endPointSelect.value;
    this.ui.measuredDistance.textContent = `${metrics.calculateDistance(nodes, startId, endId).toFixed(2)} km`;
    this.ui.measuredTime.textContent = metrics.calculateTime(nodes, startId, endId);
  },

  updateLiveMetrics() {
      if (!this.activeMetricsJourneyData) return;
      const { nodes } = this.activeMetricsJourneyData;
      this.ui.liveTotalDistance.textContent = `${metrics.calculateDistance(nodes, 'start', 'end').toFixed(2)} km`;
      const velocity = metrics.computeVelocity(nodes);
      this.ui.liveCurrentVelocity.textContent = `${velocity.toFixed(1)} km/h`;
      const distanceToTravel = parseFloat(this.ui.etaDistanceInput.value);
      this.ui.etaResult.textContent = !isNaN(distanceToTravel) && distanceToTravel > 0 ? metrics.calculateETA(distanceToTravel, velocity) : "--:--:--";
  },

  renderHistoricalNodeList() {
      const { nodes } = this.activeMetricsJourneyData;
      const displayNodes = nodes.filter(n => n.name || n.imageBlob);
      
      if (displayNodes.length === 0) {
          this.ui.historicalNodesList.innerHTML = "<p>No named stops or images in this journey.</p>";
          return;
      }
      
      let html = '';
      displayNodes.forEach(node => {
          const imageUrl = node.imageBlob ? URL.createObjectURL(node.imageBlob) : 'assets/placeholder.png';
          html += `
            <div class="node-item">
                <img src="${imageUrl}" class="node-thumbnail" alt="Node thumbnail" loading="lazy"/>
                <div class="node-info">
                    <strong>${node.name || 'Image Stop'}</strong>
                    <small>${metrics.formatTimestamp(node.timestamp)}</small>
                    <small>Lat: ${node.latitude.toFixed(4)}, Lon: ${node.longitude.toFixed(4)}, Alt: ${(node.altitude || 0).toFixed(1)}m</small>
                </div>
            </div>`;
      });
      this.ui.historicalNodesList.innerHTML = html;
  },

  populateMetricsDropdowns() {
      const { nodes } = this.activeMetricsJourneyData;
      const displayNodes = nodes.filter(n => n.name || n.imageBlob);

      this.ui.startPointSelect.innerHTML = '<option value="start">Start of Journey</option>';
      this.ui.endPointSelect.innerHTML = '<option value="end">End of Journey</option>';
      
      displayNodes.forEach(node => {
          const option = `<option value="${node.id}">${node.name || 'Image Stop'}</option>`;
          this.ui.startPointSelect.innerHTML += option;
          this.ui.endPointSelect.innerHTML += option;
      });
      
      this.ui.startPointSelect.value = 'start';
      this.ui.endPointSelect.value = 'end';
  },
  
  updateTrackingUI() {
    this.ui.startBtn.style.display = this.isTracking ? "none" : "inline-block";
    this.ui.pauseBtn.style.display = this.isTracking ? "inline-block" : "none";
    this.ui.stopBtn.style.display = this.isTracking ? "inline-block" : "none";
    this.ui.activeJourneyPanel.style.display = this.isTracking ? "block" : "none";
    this.ui.pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
  },

  async renderDataTable() {
    if (!this.activeJourneyId) { this.ui.dataTableContainer.innerHTML = ""; return; }
    const nodes = await db.getNodesForJourney(this.activeJourneyId);
    let tableHTML = `<table class="data-table"><thead><tr><th>Name</th><th>Time</th><th>Lat</th><th>Lon</th><th>Alt</th><th class="col-actions">Actions</th></tr></thead><tbody></tbody></table>`;
    this.ui.dataTableContainer.innerHTML = tableHTML;
    const tbody = this.ui.dataTableContainer.querySelector("tbody");
    if (!nodes || nodes.length === 0) { tbody.innerHTML = '<tr><td colspan="6">No data points recorded yet.</td></tr>'; return; }
    nodes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach((n) => this.appendNodeToTable(n, false));
  },

  appendNodeToTable(node, fromTop = true) {
    const table = this.ui.dataTableContainer.querySelector(".data-table");
    if (!table) return;
    let tbody = table.querySelector("tbody");
    const firstRow = tbody.querySelector("td[colspan='6']");
    if (firstRow) tbody.innerHTML = "";
    const row = document.createElement("tr");
    row.dataset.nodeId = node.id;
    row.innerHTML = `<td contenteditable="true" data-field="name">${node.name || ""}</td><td>${new Date(node.timestamp).toLocaleTimeString()}</td><td contenteditable="true" data-field="latitude">${node.latitude.toFixed(5)}</td><td contenteditable="true" data-field="longitude">${node.longitude.toFixed(5)}</td><td contenteditable="true" data-field="altitude">${(node.altitude || 0).toFixed(1)}</td><td class="col-actions"><button class="action-btn action-btn-image" title="Add/Change Image">🖼️</button><button class="action-btn action-btn-delete" title="Delete Node">🗑️</button></td></tr>`;
    if (fromTop) { tbody.prepend(row); } else { tbody.appendChild(row); }
  },

  async handleTableCellEdit(cell) {
    const row = cell.closest("tr");
    const nodeId = parseInt(row.dataset.nodeId);
    const field = cell.dataset.field;
    let value = cell.textContent.trim();
    if (["latitude", "longitude", "altitude"].includes(field)) {
      value = parseFloat(value);
      if (isNaN(value)) { 
        this.showDialog('Invalid Input', 'Please enter a valid number for geographic coordinates.', [{text: 'OK'}]);
        this.renderDataTable(); 
        return; 
      }
    }
    await db.updateNode(nodeId, { [field]: value });
  },

  handleNodeDelete(nodeId, rowElement) {
    this.showDialog('Confirm Delete', 'Are you sure you want to delete this data point?', [
        { text: 'Cancel', class: 'secondary' },
        { text: 'Delete', onClick: async () => {
            await db.deleteNode(parseInt(nodeId));
            rowElement.remove();
        }}
    ]);
  },

  handleNodeImageAdd(nodeId) {
    const captureInput = document.createElement("input");
    captureInput.type = "file";
    captureInput.accept = "image/*";
    captureInput.capture = "environment";
    const uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.accept = "image/*";

    const handleFile = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageBlob = new Blob([file], { type: file.type });
            await db.updateNode(parseInt(nodeId), { imageBlob: imageBlob });
            this.showDialog('Success', 'Image updated!', [{text: 'OK'}]);
            if(this.activeTab === 'metrics-tab' && this.activeMetricsJourneyData) { this.loadJourneyForMetrics(this.activeMetricsJourneyData.journey.id); }
        }
    };
    captureInput.addEventListener("change", handleFile, {once: true});
    uploadInput.addEventListener("change", handleFile, {once: true});
    
    this.showDialog('Choose Method', 'How would you like to add an image?', [
        { text: 'Cancel', class: 'secondary' },
        { text: 'Gallery', onClick: () => uploadInput.click() },
        { text: 'Camera', onClick: () => captureInput.click() }
    ]);
  },

  showModal(modalId) { document.getElementById(modalId).classList.add("active"); },

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
    if (modalId === 'add-stop-modal') {
        this.ui.nodeNameInput.value = "";
        this.ui.imageCaptureInput.value = "";
        this.ui.imageUploadInput.value = "";
        this.ui.imagePreview.style.display = "none";
        this.ui.imagePreview.src = "#";
    }
  },

  showDialog(title, message, buttons) {
    this.ui.dialogTitle.textContent = title;
    this.ui.dialogMessage.innerHTML = message;
    this.ui.dialogButtons.innerHTML = '';
    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        if(btnInfo.class) button.className = btnInfo.class;
        button.addEventListener('click', () => {
            this.hideModal('dialog-modal');
            if (btnInfo.onClick) btnInfo.onClick();
        }, { once: true });
        this.ui.dialogButtons.appendChild(button);
    });
    this.showModal('dialog-modal');
  },

  previewImage(event) {
    const file = event.target.files[0];
    if (file) {
      this.ui.imagePreview.src = URL.createObjectURL(file);
      this.ui.imagePreview.style.display = "block";
    }
    if(event.target.id === 'image-capture-input') { this.ui.imageUploadInput.value = ''; } 
    else { this.ui.imageCaptureInput.value = ''; }
  },

  startTimer(startSeconds = 0) {
    let seconds = startSeconds;
    this.stopTimer();
    this.timerIntervalId = setInterval(() => {
      seconds++;
      const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      this.ui.journeyTimer.textContent = `${h}:${m}:${s}`;
    }, 1000);
  },

  stopTimer() { clearInterval(this.timerIntervalId); },

  getCurrentTime() {
    const [h, m, s] = this.ui.journeyTimer.textContent.split(":");
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
  },

  async updateLiveMap() {
    if (this.activeTab === "map-tab" && this.isTracking) {
      try {
        const nodes = await db.getNodesForJourney(this.activeJourneyId);
        if (nodes && nodes.length > 0) { pathRenderer.renderPath(nodes, true); }
      } catch (error) { console.error("Failed to live-update map:", error); }
    }
  },

  async handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await exportImport.importJourneys(file);
      await this.refreshHistoryList();
      this.showDialog('Success', 'Journeys imported successfully!', [{text: 'OK'}]);
    } catch (error) {
      this.showDialog('Import Failed', `The import failed with an error: ${error.message}`, [{text: 'OK'}]);
      console.error(error);
    } finally {
      event.target.value = "";
    }
  },

  handleBulkExport() {
    const selectedIds = [...this.ui.historyListContainer.querySelectorAll(".journey-select:checked")].map((el) => parseInt(el.closest(".journey-item").dataset.journeyId));
    if (selectedIds.length > 0) { this.exportJourneys(selectedIds); } 
    else { this.showDialog('Export Info', 'Please select at least one journey to export.', [{text: 'OK'}]); }
  },

  handleBulkDelete() {
    const selectedIds = [...this.ui.historyListContainer.querySelectorAll(".journey-select:checked")].map((el) => parseInt(el.closest(".journey-item").dataset.journeyId));
    if (selectedIds.length > 0) {
        this.showDialog('Confirm Delete', `Are you sure you want to permanently delete ${selectedIds.length} journey(s)?`, [
            { text: 'Cancel', class: 'secondary' },
            { text: 'Delete', onClick: async () => {
                for (const id of selectedIds) { await db.deleteJourneyAndNodes(id); }
                await this.refreshHistoryList();
            }}
        ]);
    }
  },

  handleBulkMerge() {
    const selectedIds = [...this.ui.historyListContainer.querySelectorAll(".journey-select:checked")].map((el) => parseInt(el.closest(".journey-item").dataset.journeyId));
    if (selectedIds.length < 2) { 
        this.showDialog('Merge Info', 'Please select at least two journeys to merge.', [{text: 'OK'}]);
        return; 
    }
    
    this.showDialog('Confirm Merge', `Merge ${selectedIds.length} journeys into a new one? The original journeys will be deleted.`, [
        { text: 'Cancel', class: 'secondary' },
        { text: 'Merge', onClick: async () => {
            try {
              let allNodes = []; let earliestStartTime = new Date(); let latestEndTime = new Date(0);
              for (const id of selectedIds) {
                const journey = await db.getJourney(id);
                const nodes = await db.getNodesForJourney(id);
                allNodes.push(...nodes);
                if (new Date(journey.startTime) < earliestStartTime) { earliestStartTime = new Date(journey.startTime); }
                if (journey.endTime && new Date(journey.endTime) > latestEndTime) { latestEndTime = new Date(journey.endTime); }
              }
              allNodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              const mergedJourneyId = await db.addJourney({ name: `Merged Journey - ${earliestStartTime.toLocaleDateString()}`, startTime: earliestStartTime.toISOString(), endTime: latestEndTime > new Date(0) ? latestEndTime.toISOString() : new Date().toISOString() });
              for (const node of allNodes) {
                const { id, ...nodeData } = node;
                await db.addNode({ ...nodeData, journeyId: mergedJourneyId });
              }
              for (const id of selectedIds) { await db.deleteJourneyAndNodes(id); }
              this.showDialog('Success', 'Journeys merged successfully!', [{text: 'OK'}]);
              await this.refreshHistoryList();
            } catch (error) {
              console.error("Failed to merge journeys:", error);
              this.showDialog('Merge Error', 'An error occurred while merging journeys.', [{text: 'OK'}]);
            }
        }}
    ]);
  },

  async exportJourneys(journeyIds) {
    try {
      const journeysToExport = [];
      for (const id of journeyIds) {
        const journey = await db.getJourney(id);
        const nodes = await db.getNodesForJourney(id);
        journeysToExport.push({ ...journey, nodes });
      }
      await exportImport.exportJourneys(journeysToExport);
    } catch (error) {
      console.error("Export failed:", error);
      this.showDialog('Export Failed', `The export failed: ${error.message}`, [{text: 'OK'}]);
    }
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());