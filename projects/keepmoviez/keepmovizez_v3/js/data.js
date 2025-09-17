/* data.js */
async function saveToIndexedDB() {
    if (!db) {
        console.warn("IndexedDB not open. Attempting to open before saving...");
        try {
            await openDatabase();
            if (!db) {
                 showToast("Local Save Failed", "Cannot connect to local database. Changes not saved locally.", "error");
                 return;
            }
        } catch (e) {
            showToast("Local Save Failed", `Error connecting to local database: ${e.message}. Changes not saved.`, "error");
            return;
        }
    }
    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array. Cannot save to IndexedDB.");
        showToast("Data Error", "Invalid data format. Cannot save locally.", "error");
        return;
    }

    try {
        const dataToStore = JSON.stringify(movieData); // Serialize the whole array
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // Use a fixed key for the entire movieData array
        const request = store.put(dataToStore, IDB_USER_DATA_KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                // console.log("Movie data saved to IndexedDB."); // Less verbose logging for frequent saves
                resolve();
            };
            request.onerror = (event) => {
                console.error("Error saving to IndexedDB (local cache):", event.target.error);
                showToast("Local Cache Error", "Could not save data locally.", "warning");
                reject(event.target.error);
            };
            transaction.onerror = (event) => { // Also handle transaction errors
                console.error("IndexedDB transaction error during save:", event.target.error);
                reject(event.target.error);
            };
        });
    } catch (e) {
        console.error("Exception during IndexedDB save process:", e);
        showToast("Local Cache Error", `Could not save data locally due to an exception: ${e.message}`, "warning");
        return Promise.reject(e);
    }
}

async function loadFromIndexedDB() {
    if (!db) {
        console.warn("IndexedDB not open. Attempting to open before loading...");
        try {
            await openDatabase();
            if (!db) return []; // Return empty array if DB can't be opened
        } catch (e) {
            console.error("Failed to open database for loading:", e);
            return [];
        }
    }
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(IDB_USER_DATA_KEY); // Get data by the fixed key

        return await new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const jsonData = event.target.result;
                if (jsonData) {
                    try {
                        const parsedData = JSON.parse(jsonData);
                        resolve(Array.isArray(parsedData) ? parsedData : []);
                    } catch (e) {
                        console.error("Error parsing cached data from IndexedDB:", e);
                        showToast("Cache Corrupt", "Local cache was corrupt and has been cleared. Please sync with cloud if possible.", "error", 0, DO_NOT_SHOW_AGAIN_KEYS.LOCAL_CACHE_CORRUPT_CLEARED);
                        // Attempt to clear the corrupted cache entry
                        const writeTransaction = db.transaction([STORE_NAME], 'readwrite');
                        const writeStore = writeTransaction.objectStore(STORE_NAME);
                        writeStore.delete(IDB_USER_DATA_KEY); // Delete the specific key
                        resolve([]); // Return empty array after clearing
                    }
                } else {
                    resolve([]); // No data found for the key
                }
            };
            request.onerror = (event) => {
                console.error("Error fetching from IndexedDB (local cache):", event.target.error);
                showToast("Local Cache Error", "Failed to load data from local cache.", "error");
                reject(event.target.error); // Propagate error
            };
        });
    } catch (e) {
        // Catch synchronous errors from transaction creation, etc.
        console.error("IndexedDB local cache load process failed:", e);
        showToast("Local Cache Error", "Failed to load data from local cache.", "error");
        return []; // Ensure an array is returned on failure
    }
}

async function migrateVeryOldLocalStorageData() {
    try {
        const ancientLocalStorageKey = 'myMovieTrackerData'; // Key used in very old versions
        const storedData = localStorage.getItem(ancientLocalStorageKey);

        if (storedData) {
            console.log("Found very old localStorage data. Attempting to parse.");
            let parsedData;
            try {
                parsedData = JSON.parse(storedData);
            } catch (e) {
                console.error("Could not parse very old localStorage data. Removing it.", e);
                localStorage.removeItem(ancientLocalStorageKey);
                showToast("Old Data Cleanup", "Invalid old data found in localStorage and removed.", "warning");
                return false; // Indicate no data was actually migrated
            }

            if (Array.isArray(parsedData) && parsedData.length > 0) {
                // This data is too old/different structure to directly merge.
                // Inform user, remove it to prevent conflicts.
                console.warn("Data from very old localStorage version found. This data is NOT automatically migrated. Please use CSV/JSON import if this data is important. The old data has been removed from localStorage to prevent issues.", parsedData.slice(0, 5)); // Log a sample
                showToast("Old Data Found & Removed", "Remnants of a very old data version were cleared from localStorage. Please use import if needed.", "info", 7000);
            }
            // Always remove the old key after checking
            localStorage.removeItem(ancientLocalStorageKey);

            // Also remove other potentially very old keys if they existed
            localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY.replace('_v2', ''));
            localStorage.removeItem(DAILY_RECOMMENDATION_DATE_KEY.replace('_v2', ''));
            localStorage.removeItem(DAILY_REC_SKIP_COUNT_KEY.replace('_v2', ''));
            return true; // Indicated that some cleanup was done
        }
    } catch (e) {
        console.error("Error during very old localStorage data cleanup:", e);
    }
    return false; // No old data found or error occurred
}

function recalculateAndApplyAllRelationships() {
    if (!Array.isArray(movieData) || movieData.length === 0) return;

    const adj = new Map(); // Adjacency list: movieId -> Set of relatedMovieIds
    const movieIds = new Set(movieData.map(m => m.id)); // For quick lookup

    // Build adjacency list and validate existing relatedEntries
    movieData.forEach(movie => {
        if (!movie || !movie.id) return; // Skip invalid entries
        if (!adj.has(movie.id)) adj.set(movie.id, new Set());

        const validRelatedIds = (movie.relatedEntries || [])
            .filter(id => id && movieIds.has(id) && id !== movie.id); // Filter out self-links and non-existent IDs

        validRelatedIds.forEach(relatedId => {
            adj.get(movie.id).add(relatedId);
            if (!adj.has(relatedId)) adj.set(relatedId, new Set());
            adj.get(relatedId).add(movie.id); // Ensure bi-directional link in adjacency list
        });
        // Update the movie's relatedEntries to only contain valid, existing IDs
        movie.relatedEntries = validRelatedIds;
    });

    // Find connected components using BFS/DFS
    const visited = new Set();
    const allComponents = []; // Array of components, where each component is an array of movie IDs

    movieData.forEach(movie => {
        if (!movie || !movie.id || visited.has(movie.id)) return;

        const currentComponent = new Set();
        const queue = [movie.id]; // Start BFS from current movie
        visited.add(movie.id);

        let head = 0;
        while(head < queue.length) {
            const nodeId = queue[head++];
            if(!nodeId) continue; // Should not happen if data is clean
            currentComponent.add(nodeId);

            const neighbors = adj.get(nodeId) || new Set();
            neighbors.forEach(neighborId => {
                if (neighborId && !visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            });
        }
        if (currentComponent.size > 0) allComponents.push(Array.from(currentComponent));
    });

    // Update each movie's relatedEntries to be its entire connected component (excluding self)
    movieData.forEach(movie => {
        if (!movie || !movie.id) return;
        const component = allComponents.find(comp => comp.includes(movie.id));
        if (component) {
            // Ensure only valid IDs that are not the movie itself are in relatedEntries
            movie.relatedEntries = component.filter(id => id && id !== movie.id && movieIds.has(id));
        } else {
            // If somehow not in a component (e.g., isolated node that was missed),
            // ensure its relatedEntries are still valid. This case should be rare if BFS is correct.
            movie.relatedEntries = (movie.relatedEntries || []).filter(id => id && id !== movie.id && movieIds.has(id));
        }
    });
}
