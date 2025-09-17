// js/file-io.js

/**
 * Handles file upload (CSV or JSON).
 */
async function handleFileUpload(event) {
    const file = event.target.files && event.target.files[0]; // Ensure files array exists
    const customFileLabel = document.querySelector('.custom-file-label[for="csvFileUploader"]');

    if (!file) {
        showToast("No File", "No file selected.", "info");
        if (customFileLabel) customFileLabel.textContent = "Append CSV/JSON";
        return;
    }

    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.csv', '.json'];
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
        showToast("Invalid File Type", "Please select a .csv or .json file.", "error");
        if (customFileLabel) customFileLabel.textContent = "Append CSV/JSON";
        if (event.target) event.target.value = null; // Clear file input
        return;
    }

    if (customFileLabel) customFileLabel.textContent = file.name;

    showLoading("Processing uploaded file...");
    const reader = new FileReader();
    reader.onload = async function(e) {
        const fileContent = e.target.result;
        try {
            let parsedDataFromFile;
            let headersFromFile = [];

            if (fileExtension === '.csv') {
                const results = await new Promise((resolve, reject) => {
                    Papa.parse(fileContent, {
                        header: true, skipEmptyLines: true, dynamicTyping: false, // Keep values as strings for uniform processing
                        complete: (res) => resolve(res),
                        error: (err) => reject(err)
                    });
                });
                if (results.errors && results.errors.length > 0) {
                    const firstError = results.errors[0];
                    throw new Error(`CSV Parsing Error in ${file.name} (Row ${firstError.row || 'N/A'}): ${firstError.message}.`);
                }
                parsedDataFromFile = results.data;
                headersFromFile = results.meta && results.meta.fields ? results.meta.fields : [];
            } else if (fileExtension === '.json') {
                parsedDataFromFile = JSON.parse(fileContent);
                if (!Array.isArray(parsedDataFromFile)) {
                    // Check if it's an object containing an array (e.g. from some backup tools)
                    if (typeof parsedDataFromFile === 'object' && parsedDataFromFile !== null) {
                        const keys = Object.keys(parsedDataFromFile);
                        if (keys.length === 1 && Array.isArray(parsedDataFromFile[keys[0]])) {
                            parsedDataFromFile = parsedDataFromFile[keys[0]]; // Use the inner array
                        } else {
                            throw new Error("JSON file must be an array of movie objects, or an object with a single key containing an array of movie objects.");
                        }
                    } else {
                         throw new Error("JSON file must be an array of movie objects.");
                    }
                }
                if (parsedDataFromFile.length > 0 && typeof parsedDataFromFile[0] === 'object' && parsedDataFromFile[0] !== null) {
                    // Infer headers from first object, good for validation/mapping
                    headersFromFile = Object.keys(parsedDataFromFile[0]);
                }
            } else {
                // This case should be caught by earlier extension check, but as a safeguard:
                throw new Error("Unsupported file type. Please use .csv or .json.");
            }
            await processUploadedDataToAppend(parsedDataFromFile, headersFromFile, file.name);
        } catch (err) {
            console.error("File processing error:", err);
            showToast("File Error", `Processing error: ${err.message}. Check console for details.`, "error", 6000);
            if (customFileLabel) customFileLabel.textContent = "Append CSV/JSON";
        } finally {
            hideLoading();
            if (event.target) event.target.value = null;
        }
    };
    reader.onerror = () => {
        showToast("File Read Error", "Could not read the selected file.", "error");
        if (customFileLabel) customFileLabel.textContent = "Append CSV/JSON";
        hideLoading();
        if (event.target) event.target.value = null;
    };
    reader.readAsText(file);
}


/**
 * Processes uploaded data, normalizing it and APPENDING/UPDATING existing movieData.
 */
// js/file-io.js (processUploadedDataToAppend function)

async function processUploadedDataToAppend(dataFromFile, uploadedHeaders, fileName) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

    let appendedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const processedEntriesFromFile = dataFromFile.map((row, idx) => {
        if (typeof row !== 'object' || row === null) {
            console.warn(`Skipping invalid row at index ${idx} in ${fileName}: not an object.`);
            skippedCount++;
            return null; // Mark for filtering out later
        }

        // Attempt to get an ID, generate if missing/invalid
        let entryId = row.id || row.Id || row.ID;
        if (!entryId || typeof entryId !== 'string' || !uuidRegex.test(entryId)) {
            entryId = generateUUID();
        }

        // Initialize new entry. Keys should match your LOCAL `movieData` object structure.
        const newEntry = {
            id: entryId,
            Name: String(row.Name || `Imported Entry ${idx + 1}`).trim(),
            Category: String(row.Category || 'Movie').trim(),
            Genre: String(row.Genre || '').trim(),
            Status: String(row.Status || 'To Watch').trim(),
            'Continue Details': String(row['Continue Details'] || '').trim(),
            Recommendation: String(row.Recommendation || '').trim(),
            overallRating: String(row.overallRating || '').trim(), // Keep as string, renderStars handles 'N/A' or empty
            personalRecommendation: String(row.personalRecommendation || '').trim(),
            Language: String(row.Language || '').trim(),
            Year: String(row.Year || '').trim(),
            Country: String(row.Country || '').trim(), // This might be full name from JSON, map to code if needed later
            Description: String(row.Description || '').trim(),
            'Poster URL': String(row['Poster URL'] || row.poster_url || '').trim(), // Allow poster_url
            watchHistory: [], // To be populated carefully
            relatedEntries: [], // To be populated carefully
            doNotRecommendDaily: typeof row.doNotRecommendDaily === 'boolean' ? row.doNotRecommendDaily : false,
            lastModifiedDate: new Date().toISOString(), // Default, will be updated
            tmdbId: row.tmdbId ? String(row.tmdbId) : null,
            tmdbMediaType: row.tmdbMediaType || null,
            keywords: Array.isArray(row.keywords) ? row.keywords : [],
            tmdb_collection_id: row.tmdb_collection_id ? parseInt(row.tmdb_collection_id, 10) : null,
            tmdb_collection_name: row.tmdb_collection_name || null,
            director_info: row.director_info || null,
            full_cast: Array.isArray(row.full_cast) ? row.full_cast : [],
            production_companies: Array.isArray(row.production_companies) ? row.production_companies : [],
            tmdb_vote_average: row.tmdb_vote_average ? parseFloat(row.tmdb_vote_average) : null,
            tmdb_vote_count: row.tmdb_vote_count ? parseInt(row.tmdb_vote_count, 10) : null,
            runtime: row.runtime ? parseInt(row.runtime, 10) : null,
        };
        
        // Parse lastModifiedDate carefully
        if (row.lastModifiedDate) {
            try {
                const parsedLMD = new Date(row.lastModifiedDate);
                if (!isNaN(parsedLMD.getTime())) {
                    newEntry.lastModifiedDate = parsedLMD.toISOString();
                } else {
                    console.warn(`Invalid lastModifiedDate '${row.lastModifiedDate}' for entry ${newEntry.Name}, using current time.`);
                }
            } catch (e) {
                console.warn(`Error parsing lastModifiedDate '${row.lastModifiedDate}' for entry ${newEntry.Name}, using current time.`, e);
            }
        }

        // Parse watchHistory
        if (Array.isArray(row.watchHistory)) {
            newEntry.watchHistory = row.watchHistory.map(wh => {
                if (typeof wh === 'object' && wh !== null) {
                    return {
                        watchId: (wh.watchId && uuidRegex.test(wh.watchId)) ? wh.watchId : generateUUID(),
                        date: String(wh.date || ''),
                        rating: String(wh.rating || ''),
                        notes: String(wh.notes || '')
                    };
                }
                return null;
            }).filter(Boolean); // Remove any nulls from malformed items
        }

        // Parse relatedEntries (ensure it's an array of strings/UUIDs)
        if (Array.isArray(row.relatedEntries)) {
            newEntry.relatedEntries = row.relatedEntries.filter(id => typeof id === 'string' && uuidRegex.test(id));
        }
        
        // Handle known alternative casings or older property names if necessary
        // This is a simplified direct mapping assuming JSON keys match `newEntry` keys mostly.
        // If importing CSVs with different headers, the previous complex mapping logic would be needed for CSVs.
        // For JSON import, we assume the structure is closer to our target.

        // Example of handling a very old specific field if it was different in some JSONs:
        // if (row.hasOwnProperty('OldRatingFieldName')) {
        //     newEntry.overallRating = String(row.OldRatingFieldName || '');
        // }


        // Ensure numeric fields are valid numbers or null
        ['Year', 'tmdb_collection_id', 'tmdb_vote_count', 'runtime'].forEach(key => {
            if (newEntry[key] !== null && newEntry[key] !== undefined && newEntry[key] !== '') {
                const parsed = parseInt(newEntry[key], 10);
                newEntry[key] = isNaN(parsed) ? null : parsed;
            } else {
                newEntry[key] = null;
            }
        });
        if (newEntry.tmdb_vote_average !== null && newEntry.tmdb_vote_average !== undefined && newEntry.tmdb_vote_average !== '') {
            const parsed = parseFloat(newEntry.tmdb_vote_average);
            newEntry.tmdb_vote_average = isNaN(parsed) ? null : parsed;
        } else {
            newEntry.tmdb_vote_average = null;
        }


        return newEntry;
    }).filter(Boolean); // Filter out any null entries from malformed rows

    processedEntriesFromFile.forEach(fileEntry => {
        const existingEntryIndex = movieData.findIndex(localEntry => localEntry && localEntry.id === fileEntry.id);

        if (existingEntryIndex !== -1) {
            const localEntry = movieData[existingEntryIndex];
            const localLMDTime = new Date(localEntry.lastModifiedDate || 0).getTime();
            const fileLMDTime = new Date(fileEntry.lastModifiedDate || 0).getTime();

            const localComparable = { ...localEntry, lastModifiedDate: null, id: null }; // Exclude LMD and ID for content diff
            const fileComparable = { ...fileEntry, lastModifiedDate: null, id: null };
            const isContentDifferent = JSON.stringify(localComparable) !== JSON.stringify(fileComparable);

            if (fileLMDTime > localLMDTime || (fileLMDTime === localLMDTime && isContentDifferent)) {
                // Merge strategy: fileEntry takes precedence for simple fields.
                // For arrays, if fileEntry's array is empty but local is not, prefer local.
                const mergedEntry = { ...localEntry, ...fileEntry };

                ['watchHistory', 'relatedEntries', 'keywords', 'full_cast', 'production_companies'].forEach(key => {
                    if (Array.isArray(localEntry[key]) && localEntry[key].length > 0 && (!Array.isArray(fileEntry[key]) || fileEntry[key].length === 0)) {
                        mergedEntry[key] = localEntry[key];
                    } else if (Array.isArray(fileEntry[key])) { // If file has array (even empty), use it
                        mergedEntry[key] = fileEntry[key];
                    } else { // If neither has a valid array, default to empty
                        mergedEntry[key] = [];
                    }
                });
                // For director_info (object or null)
                if (localEntry.director_info && !fileEntry.director_info) {
                    mergedEntry.director_info = localEntry.director_info;
                } else {
                    mergedEntry.director_info = fileEntry.director_info || null;
                }
                
                mergedEntry.lastModifiedDate = new Date(Math.max(localLMDTime, fileLMDTime)).toISOString();

                movieData[existingEntryIndex] = mergedEntry;
                updatedCount++;
            } else {
                skippedCount++;
            }
        } else {
            movieData.push(fileEntry);
            appendedCount++;
        }
    });

    if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();

    if (currentSortColumn && typeof sortMovies === 'function') {
        sortMovies(currentSortColumn, currentSortDirection);
    } else {
        currentSortColumn = 'Name'; currentSortDirection = 'asc';
        if (typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
    }

    if (typeof renderTable === 'function') renderTable();
    if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();

    if (currentSupabaseUser && (appendedCount > 0 || updatedCount > 0) && typeof comprehensiveSync === 'function') {
        showLoading("Syncing imported data to cloud...");
        await comprehensiveSync(true);
        hideLoading();
    }

    const initialMsgEl = document.getElementById('initialMessage');
    if (initialMsgEl && movieData.length > 0) initialMsgEl.style.display = 'none';

    let message = `"${fileName}" processed. ${appendedCount} entries appended, ${updatedCount} entries updated.`;
    if (skippedCount > 0) message += ` ${skippedCount} entries skipped (local was newer/identical or data was malformed).`;
    message += ` Total entries: ${movieData.length}.`;
    showToast("File Processed", message, "success", 7000);
}

// The rest of second.js (handleFileUpload, generateAndDownloadFile, TMDB functions, ui-genre-select functions)
// would remain largely the same unless specific issues are identified in them.
// The key change here is to make processUploadedDataToAppend more directly map JSON structure.
/**
 * Generates and downloads a CSV or JSON file of the current movie data.
 * @param {'csv'|'json'} downloadType The desired file type for download.
 */
function generateAndDownloadFile(downloadType) {
    if (!Array.isArray(movieData) || movieData.length === 0) {
        showToast("No Data", `No data to download.`, "info"); return;
    }
    let fileContent, fileMimeType, fileName;

    const dataForExportProcessing = JSON.parse(JSON.stringify(movieData)); // Deep copy

    if (downloadType === 'csv') {
        const dataToExportForCsv = dataForExportProcessing.map(movie => {
            const exportRow = {};
            const latestWatch = typeof getLatestWatchInstance === 'function' ? getLatestWatchInstance(movie.watchHistory || []) : null;

            CSV_HEADERS.forEach(headerKey => {
                // Determine the actual property name from the headerKey
                // e.g., "Poster URL" -> "Poster URL", "overallRating" -> "overallRating"
                // "Watch History (JSON)" in CSV_HEADERS implies 'watchHistory' property in movie object
                const propertyName = headerKey.replace(/\s*\(JSON\)\s*$/, '');

                if (movie.hasOwnProperty(propertyName)) {
                    const value = movie[propertyName];
                    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                        exportRow[headerKey] = JSON.stringify(value);
                    } else if (value !== undefined && value !== null) {
                        exportRow[headerKey] = String(value);
                    } else {
                        exportRow[headerKey] = '';
                    }
                } else if (headerKey === "Last Watched Date") {
                    exportRow[headerKey] = latestWatch && latestWatch.date ? latestWatch.date : '';
                } else if (headerKey === "Last Watch Rating") {
                    exportRow[headerKey] = latestWatch && (latestWatch.rating !== undefined && latestWatch.rating !== null) ? String(latestWatch.rating) : '';
                } else {
                    exportRow[headerKey] = ''; // Default for missing properties or unhandled derived fields
                }
            });
            return exportRow;
        });
        fileContent = Papa.unparse({ fields: CSV_HEADERS, data: dataToExportForCsv }, { quotes: true, newline: "\r\n" });
        fileMimeType = 'text/csv;charset=utf-8;';
        fileName = 'keepmoviez_log.csv';
    } else if (downloadType === 'json') {
        // For JSON, export the movieData as is (after deep copy for safety)
        fileContent = JSON.stringify(dataForExportProcessing, null, 2);
        fileMimeType = 'application/json;charset=utf-8;';
        fileName = 'keepmoviez_log.json';
    } else {
        showToast("Download Error", "Invalid download type specified.", "error"); return;
    }

    const blob = new Blob([fileContent], { type: fileMimeType });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        try {
            link.click();
            showToast("Download Started", `${fileName} is downloading.`, "success");
        } catch (e) {
            console.error("Error triggering download:", e);
            showToast("Download Failed", "Automatic download failed. Try again or check browser settings.", "error");
        } finally {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href); // Important for memory management
        }
    } else if (navigator.msSaveBlob) { // IE10+
        navigator.msSaveBlob(blob, fileName);
        showToast("Download Started", `${fileName} is downloading.`, "success");
    } else { // Fallback for older browsers
        try {
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (!newWindow) { // Popup blocker might prevent this
                throw new Error("Popup blocked. Could not open file for manual saving.");
            }
            // Cannot reliably revokeObjectURL here as user needs to save manually.
            // Modern browsers should use the download attribute path.
            showToast("Manual Save Required", "Your file opened in a new tab. Please save it manually.", "info", 7000);
        } catch (e) {
             console.error("Error with fallback download:", e);
             showToast("Download Failed", `Your browser does not support automatic downloads. Error: ${e.message}`, "error");
        }
    }
}


// js/tmdb-api.js

/**
 * Generic function to make direct calls to the TMDB API.
 */
async function callTmdbApiDirect(endpoint, params = {}) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_NOW_MOVED_TO_SUPABASE_FUNCTION' || TMDB_API_KEY === 'YOUR ACTUAL TMDB API KEY HERE' || TMDB_API_KEY.length < 30) {
        const errorMessage = "TMDB API Key is not configured or invalid. Online search functionality is disabled.";
        console.error(errorMessage);
        if (typeof showToast === 'function' && typeof DO_NOT_SHOW_AGAIN_KEYS !== 'undefined') {
            showToast("API Key Missing", errorMessage, "error", 0, DO_NOT_SHOW_AGAIN_KEYS.TMDB_API_KEY_WARNING);
        }
        throw new Error(errorMessage); // Propagate error to calling function
    }

    const queryParams = new URLSearchParams(params);
    queryParams.append("api_key", TMDB_API_KEY);

    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.status_message || `TMDB API Error (${response.status}) for endpoint ${endpoint}.`;
            console.error("TMDB API Error:", response.status, data);
            throw new Error(errorMsg);
        }
        return data;
    } catch (error) {
        // Don't re-throw the "API Key Missing" error if that was the original cause
        if (error.message.includes("TMDB API Key is not configured")) {
            throw error; // Re-throw to be caught by specific handlers
        }
        console.error(`Error fetching from TMDB direct (${endpoint}):`, error);
        throw new Error(`Network or TMDB API error: ${error.message || 'Unknown error'}`);
    }
}


/**
 * Fetches movie/TV show information from TMDB based on the input name and optional year.
 */
async function fetchMovieInfoFromTmdb() {
    // Ensure formFieldsGlob and its properties are accessible
    if (!formFieldsGlob || !formFieldsGlob.name || !formFieldsGlob.name.value) {
        if (typeof showToast === 'function') showToast("Input Needed", "Movie/Series name input not found.", "error");
        if (typeof hideLoading === 'function') hideLoading();
        return;
    }
    const query = formFieldsGlob.name.value.trim();
    if (!query) {
        if (typeof showToast === 'function') showToast("Input Needed", "Enter movie/series name to search.", "info");
        if (typeof hideLoading === 'function') hideLoading();
        return;
    }

    const tmdbResultsEl = document.getElementById('tmdbSearchResults');
    if (tmdbResultsEl) {
        tmdbResultsEl.innerHTML = '<div class="list-group-item text-muted"><i>Searching TMDB...</i></div>';
        tmdbResultsEl.style.display = 'block';
    }

    const tmdbSearchYearEl = document.getElementById('tmdbSearchYear');
    const searchYear = tmdbSearchYearEl ? tmdbSearchYearEl.value : '';
    let results = [];

    try {
        if (searchYear) {
            const movieParams = { query: query, primary_release_year: searchYear };
            const tvParams = { query: query, first_air_date_year: searchYear };

            // Using Promise.allSettled to ensure both searches complete even if one fails
            const [movieSearch, tvSearch] = await Promise.allSettled([
                callTmdbApiDirect('/search/movie', movieParams),
                callTmdbApiDirect('/search/tv', tvParams)
            ]);

            const movieData = movieSearch.status === 'fulfilled' ? movieSearch.value.results : [];
            const tvData = tvSearch.status === 'fulfilled' ? tvSearch.value.results : [];
            
            results = [
                ...movieData.map(item => ({ ...item, media_type: 'movie' })),
                ...tvData.map(item => ({ ...item, media_type: 'tv' }))
            ];
        } else {
            const multiData = await callTmdbApiDirect('/search/multi', { query: query });
            results = multiData.results || [];
        }
        displayTmdbResults(results);
    } catch (error) {
        console.error("Error fetching from TMDB (direct search):", error);
        if (tmdbResultsEl) tmdbResultsEl.innerHTML = `<div class="list-group-item text-danger">Search Error: ${error.message}</div>`;
        if (!error.message.includes("TMDB API Key is not configured")) { // Avoid double toast for API key
            if (typeof showToast === 'function') showToast("TMDB Search Error", `Failed: ${error.message}`, "error");
        }
    } finally {
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Displays TMDB search results in a dropdown list.
 */
function displayTmdbResults(results) {
    const tmdbResultsDiv = document.getElementById('tmdbSearchResults');
    if (!tmdbResultsDiv) return;
    tmdbResultsDiv.innerHTML = '';

    const filteredResults = results.filter(item =>
        (item.media_type === 'movie' || item.media_type === 'tv') && (item.title || item.name)
    );

    if (filteredResults.length === 0) {
        tmdbResultsDiv.innerHTML = '<div class="list-group-item text-muted">No relevant results found. Try refining your search or year.</div>';
        tmdbResultsDiv.style.display = 'block';
        return;
    }

    filteredResults.slice(0, 10).forEach(item => { // Limit to 10 results for performance
        const title = item.title || item.name;
        const releaseDate = item.release_date || item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : 'https://via.placeholder.com/40x60?text=N/A';
        const overview = item.overview ? (item.overview.substring(0, 100) + (item.overview.length > 100 ? '...' : '')) : 'No overview.';


        const resultItem = document.createElement('div');
        resultItem.className = 'list-group-item list-group-item-action search-results-item d-flex align-items-start p-2'; // Use align-items-start for better layout with overview
        resultItem.innerHTML = `
            <img src="${posterPath}" class="tmdb-poster-thumb mr-2" alt="Poster for ${title}" style="width:50px; height:auto;">
            <div class="flex-grow-1">
                ${item.media_type === 'tv' ? '<i class="fas fa-tv text-info mr-1" title="TV Series"></i>' : '<i class="fas fa-film text-warning mr-1" title="Movie"></i>'}
                <strong>${title}</strong> <span class="text-muted">(${year})</span>
                <p class="mb-0 mt-1 text-muted small">${overview}</p>
            </div>`;
        resultItem.addEventListener('click', () => {
            applyTmdbSelection(item);
            tmdbResultsDiv.innerHTML = '';
            tmdbResultsDiv.style.display = 'none';
        });
        tmdbResultsDiv.appendChild(resultItem);
    });
    tmdbResultsDiv.style.display = 'block';
}

/**
 * Applies the selected TMDB search result's details to the form fields.
 * Fetches detailed info: keywords, cast, crew, production companies, collection, runtime.
 */
async function applyTmdbSelection(item) {
    if (!formFieldsGlob) {
        console.error("formFieldsGlob not initialized. Cannot apply TMDB selection.");
        return;
    }
    if (typeof showLoading === 'function') showLoading("Fetching details for TMDB selection...");

    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : '';

    let tmdbGenres = [], tmdbCountryISO = '', tmdbLanguage = '', tmdbKeywords = [];
    let tmdbPosterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${item.poster_path}` : '';
    let tmdbCast = [], tmdbDirector = null, tmdbProductionCompanies = [];
    let tmdbVoteAverage = null, tmdbVoteCount = null, tmdbRuntime = null;
    let tmdbCollectionId = null, tmdbCollectionName = null;
    let detailData = {};

    try {
        detailData = await callTmdbApiDirect(`/${item.media_type}/${item.id}`, { append_to_response: 'keywords,credits,collection' });

        if (detailData.genres) tmdbGenres = detailData.genres.map(g => g.name);

        if (detailData.production_countries && detailData.production_countries.length > 0) {
            tmdbCountryISO = detailData.production_countries[0].iso_3166_1 || '';
        } else if (detailData.origin_country && detailData.origin_country.length > 0) {
             tmdbCountryISO = detailData.origin_country[0] || '';
        }

        if (detailData.original_language) {
            const langObj = (detailData.spoken_languages || []).find(l => l.iso_639_1 === detailData.original_language);
            tmdbLanguage = langObj ? (langObj.english_name || langObj.name || detailData.original_language.toUpperCase()) : detailData.original_language.toUpperCase();
        } else if (detailData.spoken_languages && detailData.spoken_languages.length > 0) {
             tmdbLanguage = detailData.spoken_languages[0].english_name || detailData.spoken_languages[0].name;
        }


        if (detailData.keywords) {
            const keywordsData = detailData.keywords.keywords || detailData.keywords.results || [];
            tmdbKeywords = keywordsData.map(k => ({ id: k.id, name: k.name }));
        }

        if (detailData.poster_path) tmdbPosterPath = `${TMDB_IMAGE_BASE_URL}w500${detailData.poster_path}`;

        if (detailData.credits) {
            if (detailData.credits.cast) {
                tmdbCast = detailData.credits.cast.slice(0, 15).map(c => ({ id: c.id, name: c.name, character: c.character, profile_path: c.profile_path, order: c.order })); // Top 15, include order
            }
            if (detailData.credits.crew) {
                const directorObj = detailData.credits.crew.find(c => c.job === 'Director');
                if (directorObj) tmdbDirector = { id: directorObj.id, name: directorObj.name, profile_path: directorObj.profile_path, job: directorObj.job };
            }
        }

        if (detailData.production_companies) {
            tmdbProductionCompanies = detailData.production_companies.map(pc => ({ id: pc.id, name: pc.name, logo_path: pc.logo_path, origin_country: pc.origin_country }));
        }

        tmdbVoteAverage = item.vote_average || detailData.vote_average || null;
        tmdbVoteCount = item.vote_count || detailData.vote_count || null;
        if (item.media_type === 'movie') tmdbRuntime = detailData.runtime || null;

        if (detailData.belongs_to_collection) {
            tmdbCollectionId = detailData.belongs_to_collection.id;
            tmdbCollectionName = detailData.belongs_to_collection.name;
        }

    } catch (error) {
        console.error("Error fetching TMDB item details (direct):", error);
        if (!error.message.includes("TMDB API Key is not configured") && typeof showToast === 'function') {
            showToast("TMDB Detail Error", `Could not fetch detailed info: ${error.message}`, "warning");
        }
    }

    // Populate form fields
    if (formFieldsGlob.name) formFieldsGlob.name.value = item.title || item.name || formFieldsGlob.name.value;
    if (formFieldsGlob.category) formFieldsGlob.category.value = item.media_type === 'movie' ? 'Movie' : (item.media_type === 'tv' ? 'Series' : 'Special');
    if (formFieldsGlob.year) formFieldsGlob.year.value = year;
    if (formFieldsGlob.country) formFieldsGlob.country.value = tmdbCountryISO;
    if (formFieldsGlob.language) formFieldsGlob.language.value = tmdbLanguage;
    if (formFieldsGlob.posterUrl) formFieldsGlob.posterUrl.value = tmdbPosterPath;
    if (item.overview && formFieldsGlob.description) formFieldsGlob.description.value = item.overview;

    const tmdbIdInput = document.getElementById('tmdbId');
    const tmdbMediaTypeInput = document.getElementById('tmdbMediaType');
    if (tmdbIdInput) tmdbIdInput.value = item.id;
    if (tmdbMediaTypeInput) tmdbMediaTypeInput.value = item.media_type;

    if (tmdbGenres.length > 0 && typeof selectedGenres !== 'undefined' && typeof renderGenreTags === 'function' && typeof populateGenreDropdown === 'function') {
        const currentSelectedGenres = new Set(selectedGenres); // Use global selectedGenres
        tmdbGenres.forEach(tmdbGenreName => {
            const matchedLocalGenre = UNIQUE_ALL_GENRES.find(localGenre =>
                String(localGenre).toLowerCase() === String(tmdbGenreName).toLowerCase().replace(/-/g, ' ')
            );
            if (matchedLocalGenre) {
                currentSelectedGenres.add(matchedLocalGenre);
            } else { // If no exact match, try a looser match or add as new if system allows
                const looselyMatched = UNIQUE_ALL_GENRES.find(g => g.toLowerCase() === tmdbGenreName.toLowerCase());
                if (looselyMatched) currentSelectedGenres.add(looselyMatched);
                // else console.warn(`TMDB Genre "${tmdbGenreName}" not found in local ALL_GENRES.`);
            }
        });
        selectedGenres = Array.from(currentSelectedGenres).sort(); // Update global selectedGenres
        renderGenreTags();
        populateGenreDropdown(); // Refresh dropdown
    }

    const entryFormEl = document.getElementById('entryForm');
    if (entryFormEl) { // Cache fetched TMDB data on the form element itself
        entryFormEl._tempTmdbData = {
            keywords: tmdbKeywords,
            full_cast: tmdbCast, // Changed from 'cast' to 'full_cast' to match property name
            director_info: tmdbDirector, // Changed from 'director' to 'director_info'
            production_companies: tmdbProductionCompanies,
            tmdb_vote_average: tmdbVoteAverage, // Changed from 'vote_average'
            tmdb_vote_count: tmdbVoteCount,     // Changed from 'vote_count'
            runtime: tmdbRuntime,
            tmdb_collection_id: tmdbCollectionId,
            tmdb_collection_name: tmdbCollectionName
        };
    }
    if (typeof showToast === 'function') showToast("Info Applied", `${item.title || item.name} details pre-filled. Review and save.`, "info", 3000);
    if (typeof hideLoading === 'function') hideLoading();
}


/**
 * Fetches credits (cast and director) for a given TMDB ID and media type.
 * Note: This is less used now as `applyTmdbSelection` fetches credits via `append_to_response`.
 * Kept for potential direct use or future features.
 */
async function fetchTmdbCredits(mediaType, mediaId) {
    if (!mediaType || !mediaId) return null;
    try {
        const data = await callTmdbApiDirect(`/${mediaType}/${mediaId}/credits`);
        return data; // Contains cast and crew
    } catch (error) {
        console.error(`Error fetching TMDB credits for ${mediaType}/${mediaId} (direct):`, error);
        if (!error.message.includes("TMDB API Key is not configured") && typeof showToast === 'function') {
           showToast("TMDB Credits Error", `Could not fetch cast/crew: ${error.message}`, "warning");
        }
        return null;
    }
}

/**
 * Fetches collection (franchise) details if a movie belongs to one.
 * Note: Less used directly, as `applyTmdbSelection` gets collection info.
 */
async function fetchTmdbCollection(mediaId, mediaType) {
    if (mediaType !== 'movie' || !mediaId) return null; // Collections are typically for movies
    try {
        // First get movie details to find belongs_to_collection
        const movieDetails = await callTmdbApiDirect(`/movie/${mediaId}`);
        if (movieDetails && movieDetails.belongs_to_collection && movieDetails.belongs_to_collection.id) {
            const collectionId = movieDetails.belongs_to_collection.id;
            // Then fetch the full collection details
            const collectionDetails = await callTmdbApiDirect(`/collection/${collectionId}`);
            return collectionDetails;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching TMDB collection for movie ${mediaId} (direct):`, error);
        return null;
    }
}

/**
 * Fetches keywords for a TMDB entry.
 * Note: Less used directly, as `applyTmdbSelection` gets keywords.
 */
async function fetchTmdbKeywords(mediaType, mediaId) {
    if (!mediaType || !mediaId) return [];
    try {
        const data = await callTmdbApiDirect(`/${mediaType}/${mediaId}/keywords`);
        return data.keywords || data.results || []; // TMDB API varies: sometimes 'keywords', sometimes 'results' for TV
    } catch (error) {
        console.error(`Error fetching TMDB keywords for ${mediaType}/${mediaId} (direct):`, error);
        return [];
    }
}

/**
 * Fetches a person's details from TMDB (for the person details modal).
 * @param {number} personId TMDB person ID.
 * @returns {Promise<object|null>} Person details including profile path, bio, and combined credits.
 */
async function fetchTmdbPersonDetails(personId) {
    if (!personId) return null;
    try {
        // Fetch main details + movie_credits, tv_credits, images
        const data = await callTmdbApiDirect(`/person/${personId}`, { append_to_response: 'combined_credits,images' });
        return data;
    } catch (error) {
        console.error(`Error fetching TMDB person details for ID ${personId}:`, error);
        if (!error.message.includes("TMDB API Key is not configured") && typeof showToast === 'function') {
           showToast("TMDB Person Error", `Could not fetch person details: ${error.message}`, "warning");
        }
        return null;
    }
}


// js/ui-genre-select.js

/**
 * Renders the selected genres as interactive tags in the input container.
 */
function renderGenreTags() {
    const genreInputContainer = document.getElementById('genreInputContainer');
    if (!genreInputContainer) {
        console.warn("Genre input container 'genreInputContainer' not found.");
        return;
    }
    const searchInput = genreInputContainer.querySelector('#genreSearchInput'); // Must exist

    // Clear existing tags (all children except the search input)
    Array.from(genreInputContainer.children).forEach(child => {
        if (child !== searchInput) { // Compare element references
            genreInputContainer.removeChild(child);
        }
    });

    if (!Array.isArray(selectedGenres)) selectedGenres = []; // Ensure selectedGenres is an array

    selectedGenres.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag badge badge-info mr-1 mb-1 p-2'; // Using Bootstrap badge for styling
        tag.textContent = genre;
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'close ml-2 text-white'; // Bootstrap close button, adjusted margin
        closeBtn.innerHTML = '<span aria-hidden="true">×</span>'; // More accessible span
        closeBtn.setAttribute('aria-label', `Remove genre ${genre}`);
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeGenre(genre);
        });
        tag.appendChild(closeBtn);
        // Insert tag before search input if searchInput exists, otherwise append
        if (searchInput) {
            genreInputContainer.insertBefore(tag, searchInput);
        } else {
            genreInputContainer.appendChild(tag);
        }
    });
     // If no genres selected and search input exists, ensure search input is visible or placeholder text is there
    if (searchInput) {
        searchInput.placeholder = selectedGenres.length === 0 ? "Click to add genres..." : "Search or add more...";
    }
}


/**
 * Adds a genre to the selected genres list and re-renders the tags.
 */
function addGenre(genre) {
    if (!Array.isArray(selectedGenres)) selectedGenres = [];
    if (genre && typeof genre === 'string' && !selectedGenres.includes(genre)) {
        selectedGenres.push(genre);
        selectedGenres.sort();
        renderGenreTags();
    }
}

/**
 * Removes a genre from the selected genres list and re-renders the tags.
 */
function removeGenre(genre) {
    if (!Array.isArray(selectedGenres)) selectedGenres = [];
    selectedGenres = selectedGenres.filter(g => g !== genre);
    renderGenreTags();

    const genreDropdownEl = document.getElementById('genreDropdown');
    if (genreDropdownEl && genreDropdownEl.style.display === 'block') { // Check if dropdown is visible
        filterGenreDropdown(); // Refresh dropdown
    }
}

/**
 * Populates or re-populates the genre dropdown based on a filter text.
 */
function populateGenreDropdown(filterText = "") {
    const genreItemsContainer = document.getElementById('genreItemsContainer');
    if (!genreItemsContainer) {
        console.warn("Genre items container 'genreItemsContainer' not found for dropdown.");
        return;
    }
    genreItemsContainer.innerHTML = '';

    const lowerFilterText = String(filterText || "").toLowerCase().trim();
    const availableGenres = UNIQUE_ALL_GENRES.filter(genre => // Use UNIQUE_ALL_GENRES
        !selectedGenres.includes(genre) &&
        (lowerFilterText === "" || String(genre).toLowerCase().includes(lowerFilterText))
    ).sort();

    if (availableGenres.length === 0) {
        const item = document.createElement('span'); // Use span for non-actionable item
        item.className = 'list-group-item text-muted small';
        if (lowerFilterText !== "" && !UNIQUE_ALL_GENRES.some(g => String(g).toLowerCase().includes(lowerFilterText))) {
            item.textContent = 'No matching genres found.';
        } else if (lowerFilterText !== "" && UNIQUE_ALL_GENRES.filter(g => !selectedGenres.includes(g)).length === 0) {
             item.textContent = 'All matching genres already selected.';
        }
        else {
             item.textContent = 'All available genres are selected or no genres defined.';
        }
        genreItemsContainer.appendChild(item);
    } else {
        availableGenres.forEach(genre => {
            const item = document.createElement('a');
            item.href = '#'; // Necessary for link behavior but action prevented
            item.className = 'list-group-item list-group-item-action dropdown-item py-1'; // Slimmer items
            item.textContent = genre;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addGenre(genre);
                const searchInputEl = document.getElementById('genreSearchInput');
                if (searchInputEl) {
                    searchInputEl.value = ''; // Clear search
                    searchInputEl.focus(); // Keep focus for easy adding of more genres
                }
                filterGenreDropdown(); // Refresh available genres in dropdown
            });
            genreItemsContainer.appendChild(item);
        });
    }
}


/**
 * Triggers a filter and re-population of the genre dropdown.
 */
function filterGenreDropdown() {
    const searchInputEl = document.getElementById('genreSearchInput');
    if (searchInputEl) {
        populateGenreDropdown(searchInputEl.value);
    } else {
        populateGenreDropdown(); // Populate with no filter if input is missing
    }
}