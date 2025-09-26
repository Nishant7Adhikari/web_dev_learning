/* io2.js (Complete & Reimagined) */

let smartImportState = {
    fileName: '',
    analyzedEntries: [],
    newEntries: [],
    updateEntries: [],
    overwriteEntries: [],
    skippedEntries: []
};

// Main function to start the smart import process
async function initiateSmartImport(dataFromFile, fileName) {
    // 1. Reset state and analyze the file against the current library
    smartImportState = {
        fileName: fileName,
        analyzedEntries: [],
        newEntries: [],
        updateEntries: [],
        overwriteEntries: [],
        skippedEntries: []
    };

    // Create maps for efficient lookups
    const localIdMap = new Map(movieData.map(entry => [entry.id, entry]));
    const localTmdbIdMap = new Map(movieData.filter(entry => entry.tmdbId).map(entry => [entry.tmdbId, entry]));
    const localNameYearMap = new Map(movieData.map(entry => [`${(entry.Name || '').toLowerCase()}|${entry.Year || ''}`, entry]));

    for (const row of dataFromFile) {
        if (typeof row !== 'object' || row === null || !row.Name) {
            smartImportState.skippedEntries.push({ entry: row, reason: 'Invalid or missing Name' });
            continue;
        }

        const fileEntry = normalizeImportedRow(row);
        let match = null;
        let matchType = 'none';

        // Hierarchy of matching
        if (fileEntry.id && localIdMap.has(fileEntry.id)) {
            match = localIdMap.get(fileEntry.id);
            matchType = 'UUID Match';
        } else if (fileEntry.tmdbId && localTmdbIdMap.has(fileEntry.tmdbId)) {
            match = localTmdbIdMap.get(fileEntry.tmdbId);
            matchType = 'TMDB ID Match';
        } else {
            const nameYearKey = `${(fileEntry.Name || '').toLowerCase()}|${fileEntry.Year || ''}`;
            if (localNameYearMap.has(nameYearKey)) {
                match = localNameYearMap.get(nameYearKey);
                matchType = 'Name + Year Match';
            }
        }

        smartImportState.analyzedEntries.push({ fileEntry, existingEntry: match, matchType });
    }

    // 2. Populate and show the modal
    populateImportSummary();
    hideLoading();
    $('#smartImportModal').modal('show');

    // 3. Set up event listeners for the modal buttons
    $('#confirmImportBtn').off('click').on('click', processSmartImport);
    $('#cancelImportBtn').off('click').on('click', () => {
        showToast("Import Canceled", "No changes were made to your library.", "info");
    });
}

// Populates the summary text in the modal
function populateImportSummary() {
    const summaryDiv = document.getElementById('importSummary');
    const { analyzedEntries } = smartImportState;
    
    const newCount = analyzedEntries.filter(e => e.matchType === 'none').length;
    const matchCount = analyzedEntries.filter(e => e.matchType !== 'none').length;
    const skippedCount = smartImportState.skippedEntries.length;
    const totalCount = analyzedEntries.length + skippedCount;

    summaryDiv.innerHTML = `
        <h5>Analysis of "${smartImportState.fileName}"</h5>
        <ul class="list-group">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Total Rows in File
                <span class="badge badge-secondary badge-pill">${totalCount}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <i class="fas fa-plus-circle text-success mr-2"></i> New Entries Found
                <span class="badge badge-success badge-pill">${newCount}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <i class="fas fa-sync-alt text-info mr-2"></i> Potential Matches Found
                <span class="badge badge-info badge-pill">${matchCount}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <i class="fas fa-exclamation-triangle text-warning mr-2"></i> Invalid/Skipped Rows
                <span class="badge badge-warning badge-pill">${skippedCount}</span>
            </li>
        </ul>
    `;
}

// This function executes when the user clicks "Process Import"
async function processSmartImport() {
    showLoading("Importing data...");
    const strategy = $('input[name="importStrategy"]:checked').val();
    const { analyzedEntries } = smartImportState;

    let appendedCount = 0;
    let updatedCount = 0;
    
    for (const item of analyzedEntries) {
        const { fileEntry, existingEntry, matchType } = item;

        if (matchType === 'none') {
            // It's a new entry, always add it.
            movieData.push(fileEntry);
            appendedCount++;
        } else {
            // It's a match, apply the chosen strategy.
            if (strategy === 'update_matches') {
                const existingLMD = new Date(existingEntry.lastModifiedDate || 0).getTime();
                const fileLMD = new Date(fileEntry.lastModifiedDate || 0).getTime();
                if (fileLMD > existingLMD) {
                    const index = movieData.findIndex(e => e.id === existingEntry.id);
                    if (index !== -1) {
                        movieData[index] = { ...existingEntry, ...fileEntry, id: existingEntry.id };
                        updatedCount++;
                    }
                }
            } else if (strategy === 'overwrite_all') {
                const index = movieData.findIndex(e => e.id === existingEntry.id);
                if (index !== -1) {
                    movieData[index] = { ...existingEntry, ...fileEntry, id: existingEntry.id }; // Keep original ID
                    updatedCount++;
                }
            }
            // If strategy is 'append_new', we do nothing with matches.
        }
    }

    if (appendedCount > 0 || updatedCount > 0) {
        recalculateAndApplyAllRelationships();
        sortMovies(currentSortColumn, currentSortDirection);
        await saveToIndexedDB();
        renderMovieCards();
        if (currentSupabaseUser) {
            await comprehensiveSync(true); // Silently sync changes to the cloud
        }
        showToast("Import Complete", `${appendedCount} new entries added, ${updatedCount} entries updated.`, "success");
    } else {
        showToast("Import Complete", "No changes were made based on your selected strategy.", "info");
    }

    $('#smartImportModal').modal('hide');
    hideLoading();
}


// Helper to standardize an imported row into our app's data structure
function normalizeImportedRow(row) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    let entryId = row.id || row.Id || row.ID;
    if (!entryId || typeof entryId !== 'string' || !uuidRegex.test(entryId)) {
        entryId = generateUUID();
    }

    const newEntry = {
        id: entryId,
        Name: String(row.Name || '').trim(),
        Category: String(row.Category || 'Movie').trim(),
        Genre: String(row.Genre || '').trim(),
        Status: String(row.Status || 'To Watch').trim(),
        seasonsCompleted: row.seasonsCompleted || null,
        currentSeasonEpisodesWatched: row.currentSeasonEpisodesWatched || null,
        Recommendation: String(row.Recommendation || '').trim(),
        overallRating: String(row.overallRating || '').trim(),
        personalRecommendation: String(row.personalRecommendation || '').trim(),
        Language: String(row.Language || '').trim(),
        Year: String(row.Year || '').trim(),
        Country: String(row.Country || '').trim(),
        Description: String(row.Description || '').trim(),
        'Poster URL': String(row['Poster URL'] || row.poster_url || '').trim(),
        watchHistory: [],
        relatedEntries: [],
        lastModifiedDate: row.lastModifiedDate || new Date().toISOString(),
        tmdbId: String(row.tmdbId || '').trim() || null,
        tmdbMediaType: row.tmdbMediaType || null,
    };
    
    // Attempt to parse watch history if it's a valid JSON string
    if (typeof row.watchHistory === 'string' && row.watchHistory.startsWith('[')) {
        try {
            newEntry.watchHistory = JSON.parse(row.watchHistory);
        } catch (e) { /* ignore parse error */ }
    } else if (Array.isArray(row.watchHistory)) {
        newEntry.watchHistory = row.watchHistory;
    }

    return newEntry;
}

// Legacy function, no longer directly used by file upload but kept for reference or other potential uses.
function generateAndDownloadFile(downloadType) {
    if (!Array.isArray(movieData) || movieData.length === 0) {
        showToast("No Data", `No data to download.`, "info"); return;
    }
    let fileContent, fileMimeType, fileName;
    const dataForExportProcessing = JSON.parse(JSON.stringify(movieData));

    if (downloadType === 'csv') {
        fileContent = Papa.unparse(dataForExportProcessing, { header: true });
        fileMimeType = 'text/csv;charset=utf-8;';
        fileName = 'keepmoviez_log.csv';
    } else if (downloadType === 'json') {
        fileContent = JSON.stringify(dataForExportProcessing, null, 2);
        fileMimeType = 'application/json;charset=utf-8;';
        fileName = 'keepmoviez_log.json';
    } else {
        return;
    }

    const blob = new Blob([fileContent], { type: fileMimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}