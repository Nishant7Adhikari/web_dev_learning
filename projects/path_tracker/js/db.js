// js/db.js
const db = {
  _db: null,
  DB_NAME: "3DPathTrackerDB",
  DB_VERSION: 2,
  JOURNEYS_STORE: "journeys",
  NODES_STORE: "nodes",

  init() {
    return new Promise((resolve, reject) => {
      if (this._db) return resolve(this._db);
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = (event) => reject(event.target.error);
      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve(this._db);
      };
      request.onupgradeneeded = (event) => {
        const dbInstance = event.target.result;
        if (!dbInstance.objectStoreNames.contains(this.JOURNEYS_STORE)) {
          dbInstance.createObjectStore(this.JOURNEYS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!dbInstance.objectStoreNames.contains(this.NODES_STORE)) {
          const nodesStore = dbInstance.createObjectStore(this.NODES_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          nodesStore.createIndex("journeyId_idx", "journeyId", {
            unique: false,
          });
        }
      };
    });
  },

  addJourney(journeyData) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(
        [this.JOURNEYS_STORE],
        "readwrite"
      );
      const store = transaction.objectStore(this.JOURNEYS_STORE);
      const request = store.add(journeyData);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  getJourney(journeyId) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(
        [this.JOURNEYS_STORE],
        "readonly"
      );
      const store = transaction.objectStore(this.JOURNEYS_STORE);
      const request = store.get(journeyId);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  getAllJourneys() {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(
        [this.JOURNEYS_STORE],
        "readonly"
      );
      const store = transaction.objectStore(this.JOURNEYS_STORE);
      const request = store.getAll();
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  updateJourney(journeyId, journeyData) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(
        [this.JOURNEYS_STORE],
        "readwrite"
      );
      const store = transaction.objectStore(this.JOURNEYS_STORE);
      // Ensure the key is part of the data for `put`
      const dataToUpdate = { ...journeyData, id: journeyId };
      const request = store.put(dataToUpdate);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  addNode(nodeData) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.NODES_STORE], "readwrite");
      const store = transaction.objectStore(this.NODES_STORE);
      const request = store.add(nodeData);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  getNodesForJourney(journeyId) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.NODES_STORE], "readonly");
      const store = transaction.objectStore(this.NODES_STORE);
      const index = store.index("journeyId_idx");
      const request = index.getAll(journeyId);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  getLastNodeForJourney(journeyId) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.NODES_STORE], "readonly");
      const store = transaction.objectStore(this.NODES_STORE);
      const index = store.index("journeyId_idx");
      const cursorRequest = index.openCursor(
        IDBKeyRange.only(journeyId),
        "prev"
      );
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        resolve(cursor ? cursor.value : null);
      };
      cursorRequest.onerror = (event) => reject(event.target.error);
    });
  },

  deleteNode(nodeId) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.NODES_STORE], "readwrite");
      const store = transaction.objectStore(this.NODES_STORE);
      const request = store.delete(nodeId);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  },

  updateNode(nodeId, nodeUpdateData) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.NODES_STORE], "readwrite");
      const store = transaction.objectStore(this.NODES_STORE);
      const getRequest = store.get(nodeId);
      getRequest.onsuccess = () => {
        const updatedData = { ...getRequest.result, ...nodeUpdateData };
        const putRequest = store.put(updatedData);
        putRequest.onsuccess = (event) => resolve(event.target.result);
        putRequest.onerror = (event) => reject(event.target.error);
      };
      getRequest.onerror = (event) => reject(event.target.error);
    });
  },

  /**
   * Deletes a journey and all of its associated nodes.
   * @param {number} journeyId The ID of the journey to delete.
   * @returns {Promise<void>}
   */
  deleteJourneyAndNodes(journeyId) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(
        [this.JOURNEYS_STORE, this.NODES_STORE],
        "readwrite"
      );
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);

      // 1. Delete the journey itself
      const journeysStore = transaction.objectStore(this.JOURNEYS_STORE);
      journeysStore.delete(journeyId);

      // 2. Delete all associated nodes
      const nodesStore = transaction.objectStore(this.NODES_STORE);
      const nodesIndex = nodesStore.index("journeyId_idx");
      const keyRange = IDBKeyRange.only(journeyId);
      const cursorRequest = nodesIndex.openCursor(keyRange);

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    });
  },
};