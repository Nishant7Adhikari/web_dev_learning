/* io2.js */
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
