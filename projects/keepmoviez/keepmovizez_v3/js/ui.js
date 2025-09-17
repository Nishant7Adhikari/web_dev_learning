/* ui.js */// --- UI Watch History Functions ---
// These functions interact with elements within the entry modal,
// which has not structurally changed its watch history section.
// They rely on global: generateUUID, showToast, renderStars, watchInstanceFormFields.

function getLatestWatchInstance(watchHistoryArray) {
    if (!Array.isArray(watchHistoryArray) || watchHistoryArray.length === 0) return null;
    const validHistory = watchHistoryArray.filter(wh => wh && wh.date && !isNaN(new Date(wh.date).getTime()));
    if (validHistory.length === 0) return null;
    return [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

function renderWatchHistoryUI(entryWatchHistory = []) {
    const listEl = document.getElementById('watchHistoryList');
    if (!listEl) { console.warn("Element 'watchHistoryList' not found for UI rendering."); return; }
    listEl.innerHTML = '';
    if (!Array.isArray(entryWatchHistory) || entryWatchHistory.length === 0) {
        listEl.innerHTML = '<p class="text-muted p-2 small">No watch records yet. Add one below!</p>'; return;
    }
    [...entryWatchHistory].filter(wh => wh && wh.date).sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(wh => {
            const item = document.createElement('div');
            item.className = 'watch-history-item list-group-item list-group-item-action flex-column align-items-start p-2 mb-1';
            const watchId = wh.watchId || generateUUID(); if (!wh.watchId) wh.watchId = watchId;
            item.innerHTML = `<div class="d-flex w-100 justify-content-between"><h6 class="mb-1">${wh.date ? new Date(wh.date).toLocaleDateString() : 'Invalid Date'}</h6><small>${renderStars(wh.rating)}</small></div><p class="mb-1 text-muted small">${wh.notes || 'No notes.'}</p><div class="text-right"><button type="button" class="btn btn-sm btn-outline-info edit-watch-btn mr-1" data-watchid="${watchId}" title="Edit"><i class="fas fa-edit"></i></button><button type="button" class="btn btn-sm btn-outline-danger delete-watch-btn" data-watchid="${watchId}" title="Delete"><i class="fas fa-trash"></i></button></div>`;
            listEl.appendChild(item);
        });
}

function prepareAddWatchInstanceForm() {
    const editingWatchIdEl = document.getElementById('editingWatchId');
    const watchInstanceFormTitleEl = document.getElementById('watchInstanceFormTitle');
    const addWatchInstanceFormEl = document.getElementById('addWatchInstanceForm');
    const toggleAddWatchInstanceFormBtnEl = document.getElementById('toggleAddWatchInstanceFormBtn');
    if (editingWatchIdEl) editingWatchIdEl.value = '';
    if (watchInstanceFormTitleEl) watchInstanceFormTitleEl.textContent = 'Add New Watch Record';
    if (watchInstanceFormFields) {
        if (watchInstanceFormFields.date) watchInstanceFormFields.date.value = new Date().toISOString().split('T')[0];
        if (watchInstanceFormFields.rating) watchInstanceFormFields.rating.value = '';
        if (watchInstanceFormFields.notes) watchInstanceFormFields.notes.value = '';
    }
    if (addWatchInstanceFormEl) addWatchInstanceFormEl.style.display = 'block';
    if (toggleAddWatchInstanceFormBtnEl) toggleAddWatchInstanceFormBtnEl.style.display = 'none';
    if (watchInstanceFormFields && watchInstanceFormFields.date) watchInstanceFormFields.date.focus();
}

function prepareEditWatchInstanceForm(watchId) {
    const currentWatchHistoryEl = document.getElementById('currentWatchHistory');
    if (!currentWatchHistoryEl || !watchInstanceFormFields) { console.warn("Required elements for editing watch instance not found."); return; }
    let currentHistory = [];
    try { currentHistory = JSON.parse(currentWatchHistoryEl.value || '[]'); if (!Array.isArray(currentHistory)) currentHistory = []; }
    catch (e) { console.error("Error parsing currentWatchHistory JSON:", e); showToast("Error", "Could not load watch history for editing.", "error"); return; }
    const instanceToEdit = currentHistory.find(wh => wh && wh.watchId === watchId);
    if (instanceToEdit) {
        const editingWatchIdEl = document.getElementById('editingWatchId');
        const watchInstanceFormTitleEl = document.getElementById('watchInstanceFormTitle');
        const addWatchInstanceFormEl = document.getElementById('addWatchInstanceForm');
        const toggleAddWatchInstanceFormBtnEl = document.getElementById('toggleAddWatchInstanceFormBtn');
        if (editingWatchIdEl) editingWatchIdEl.value = instanceToEdit.watchId;
        if (watchInstanceFormTitleEl) watchInstanceFormTitleEl.textContent = 'Edit Watch Record';
        if (watchInstanceFormFields.date) watchInstanceFormFields.date.value = instanceToEdit.date || '';
        if (watchInstanceFormFields.rating) watchInstanceFormFields.rating.value = instanceToEdit.rating || '';
        if (watchInstanceFormFields.notes) watchInstanceFormFields.notes.value = instanceToEdit.notes || '';
        if (addWatchInstanceFormEl) addWatchInstanceFormEl.style.display = 'block';
        if (toggleAddWatchInstanceFormBtnEl) toggleAddWatchInstanceFormBtnEl.style.display = 'none';
        if (watchInstanceFormFields.date) watchInstanceFormFields.date.focus();
    } else { showToast("Error", "Could not find the watch record to edit.", "error"); }
}

function closeWatchInstanceForm() {
    const addWatchInstanceFormEl = document.getElementById('addWatchInstanceForm');
    const toggleAddWatchInstanceFormBtnEl = document.getElementById('toggleAddWatchInstanceFormBtn');
    const editingWatchIdEl = document.getElementById('editingWatchId');
    if (addWatchInstanceFormEl) addWatchInstanceFormEl.style.display = 'none';
    if (toggleAddWatchInstanceFormBtnEl) toggleAddWatchInstanceFormBtnEl.style.display = 'block';
    if (editingWatchIdEl) editingWatchIdEl.value = '';
    if (watchInstanceFormFields) {
        if (watchInstanceFormFields.date) watchInstanceFormFields.date.value = '';
        if (watchInstanceFormFields.rating) watchInstanceFormFields.rating.value = '';
        if (watchInstanceFormFields.notes) watchInstanceFormFields.notes.value = '';
    }
}

function saveOrUpdateWatchInstance() {
    if (!watchInstanceFormFields || !watchInstanceFormFields.date) { console.warn("Watch instance form fields not available."); return; }
    const watchDate = watchInstanceFormFields.date.value;
    if (!watchDate) { showToast("Validation Error", "Watch Date is required.", "error"); if (watchInstanceFormFields.date) watchInstanceFormFields.date.focus(); return; }
    if (new Date(watchDate) > new Date()) { showToast("Validation Error", "Watch Date cannot be in the future.", "error"); if (watchInstanceFormFields.date) watchInstanceFormFields.date.focus(); return; }
    const currentWatchHistoryEl = document.getElementById('currentWatchHistory');
    const editingWatchIdEl = document.getElementById('editingWatchId');
    if (!currentWatchHistoryEl || !editingWatchIdEl) { console.warn("Required history/ID elements not found for saving watch instance."); return; }
    let currentHistory = [];
    try { currentHistory = JSON.parse(currentWatchHistoryEl.value || '[]'); if (!Array.isArray(currentHistory)) currentHistory = []; }
    catch (e) { console.error("Error parsing currentWatchHistory JSON:", e); showToast("Error", "Could not save watch record due to history data error.", "error"); return; }
    const editingId = editingWatchIdEl.value;
    const newOrUpdatedInstance = {
        watchId: editingId || generateUUID(), date: watchDate,
        rating: watchInstanceFormFields.rating ? watchInstanceFormFields.rating.value : '',
        notes: watchInstanceFormFields.notes ? watchInstanceFormFields.notes.value.trim() : ''
    };
    if (editingId) currentHistory = currentHistory.map(wh => (wh && wh.watchId === editingId) ? newOrUpdatedInstance : wh);
    else currentHistory.push(newOrUpdatedInstance);
    currentWatchHistoryEl.value = JSON.stringify(currentHistory);
    renderWatchHistoryUI(currentHistory); closeWatchInstanceForm();
    showToast("Watch Record", editingId ? "Watch record updated." : "New watch record added.", "success");
}

function deleteWatchInstanceFromList(watchId) {
    if (!confirm("Are you sure you want to delete this watch record? This action cannot be undone.")) return;
    const currentWatchHistoryEl = document.getElementById('currentWatchHistory');
    if (!currentWatchHistoryEl) { console.warn("Current watch history element not found for deletion."); return; }
    let currentHistory = [];
    try { currentHistory = JSON.parse(currentWatchHistoryEl.value || '[]'); if (!Array.isArray(currentHistory)) currentHistory = []; }
    catch (e) { console.error("Error parsing currentWatchHistory JSON:", e); showToast("Error", "Could not delete watch record due to history data error.", "error"); return; }
    const initialLength = currentHistory.length;
    currentHistory = currentHistory.filter(wh => wh && wh.watchId !== watchId);
    if (currentHistory.length < initialLength) {
        currentWatchHistoryEl.value = JSON.stringify(currentHistory); renderWatchHistoryUI(currentHistory);
        showToast("Watch Record Deleted", "The watch record has been removed.", "warning");
    } else { showToast("Not Found", "The watch record to delete was not found.", "info"); }
}


// --- UI Table Functions ---
// Relies on global: movieData, filterQuery, currentSortColumn, currentSortDirection,
// isMultiSelectMode, selectedEntryIds,
// and functions: getLatestWatchInstance, renderStars, getCountryFullName, updateSortIcons.

function sortMovies(column, direction) {
    if (!Array.isArray(movieData)) { console.error("movieData is not an array. Cannot sort."); return; }
    movieData.sort((a, b) => {
        if (!a && !b) return 0; if (!a) return direction === 'asc' ? 1 : -1; if (!b) return direction === 'asc' ? -1 : 1;
        let valA, valB;
        switch (column) {
            case 'LastWatchedDate':
                const latestA = getLatestWatchInstance(a.watchHistory); const latestB = getLatestWatchInstance(b.watchHistory);
                valA = latestA && latestA.date ? new Date(latestA.date).getTime() : (direction === 'asc' ? Infinity : -Infinity);
                valB = latestB && latestB.date ? new Date(latestB.date).getTime() : (direction === 'asc' ? Infinity : -Infinity);
                break;
            case 'lastModifiedDate':
                valA = a.lastModifiedDate ? new Date(a.lastModifiedDate).getTime() : (direction === 'asc' ? -Infinity : Infinity);
                valB = b.lastModifiedDate ? new Date(b.lastModifiedDate).getTime() : (direction === 'asc' ? -Infinity : Infinity);
                break;
            case 'Year':
                valA = a.Year && String(a.Year).trim() !== '' ? parseInt(a.Year, 10) : NaN;
                valB = b.Year && String(b.Year).trim() !== '' ? parseInt(b.Year, 10) : NaN;
                if (isNaN(valA)) valA = direction === 'asc' ? Infinity : -Infinity;
                if (isNaN(valB)) valB = direction === 'asc' ? Infinity : -Infinity;
                break;
            case 'overallRating':
                valA = a.overallRating && a.overallRating !== '' ? parseFloat(a.overallRating) : NaN;
                valB = b.overallRating && b.overallRating !== '' ? parseFloat(b.overallRating) : NaN;
                if (isNaN(valA)) valA = -1; if (isNaN(valB)) valB = -1;
                break;
            default:
                valA = String(a[column] || '').toLowerCase().trim(); valB = String(b[column] || '').toLowerCase().trim();
                if (valA === '' || valA === 'n/a') valA = '\uffff'; if (valB === '' || valB === 'n/a') valB = '\uffff';
                break;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1; if (valA > valB) return direction === 'asc' ? 1 : -1;
        const nameA = String(a.Name || '').toLowerCase(); const nameB = String(b.Name || '').toLowerCase();
        if (nameA < nameB) return -1; if (nameA > nameB) return 1;
        return 0;
    });
}

function renderTable() {
    const movieTableBody = document.getElementById('movieTableBody');
    const initialMessage = document.getElementById('initialMessage');
    if (!movieTableBody) { console.error("CRITICAL: movieTableBody element not found."); return; }
    movieTableBody.innerHTML = '';

    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array. Cannot render table.");
        if (initialMessage) { initialMessage.style.display = 'block'; initialMessage.innerHTML = '<p class="text-danger">Error: Movie data is corrupted.</p>'; }
        return;
    }

    // Update initial message based on whether filter is active or data is truly empty
    if (initialMessage) {
        if (movieData.length === 0 && !filterQuery) {
            initialMessage.style.display = 'block';
            // Ensure the message reflects the new way to upload
            const pElements = initialMessage.getElementsByTagName('p');
            if (pElements.length > 1) {
                pElements[1].innerHTML = "Your movie log is currently empty. Add your first entry using the '+' button below, or upload an existing collection using the \"Append CSV/JSON\" button in the menu.";
            }
        } else {
            initialMessage.style.display = 'none';
        }
    }


    let filteredData = movieData;
    if (filterQuery) {
        const lowerFilterQuery = filterQuery.toLowerCase();
        filteredData = movieData.filter(movie => {
            if (!movie) return false;
            return Object.values(movie).some(val => {
                if (typeof val === 'string' || typeof val === 'number') return String(val).toLowerCase().includes(lowerFilterQuery);
                if (Array.isArray(val)) {
                    return val.some(item => {
                        if (typeof item === 'string') return item.toLowerCase().includes(lowerFilterQuery);
                        if (typeof item === 'object' && item && item.name && typeof item.name === 'string' && val !== movie.keywords) return item.name.toLowerCase().includes(lowerFilterQuery);
                        if (typeof item === 'object' && item && item.notes && typeof item.notes === 'string') return item.notes.toLowerCase().includes(lowerFilterQuery);
                        return false;
                    });
                }
                if (val && typeof val === 'object' && val.name && typeof val.name === 'string' && val === movie.director_info) return val.name.toLowerCase().includes(lowerFilterQuery);
                return false;
            });
        });
    }

    if (filteredData.length === 0) {
        if (movieData.length > 0 && filterQuery) { // Data exists, but filter yields no results
            const row = movieTableBody.insertRow(); const cell = row.insertCell();
            const headerCount = document.querySelector('#movieTableBody')?.closest('table')?.querySelectorAll('thead th').length || 13;
            cell.colSpan = headerCount; cell.textContent = "No entries match your search criteria."; cell.className = "text-center text-muted py-3";
        }
        // If movieData.length is 0 and no filter, initialMessage handles it.
        updateSortIcons(); return;
    }

    const fragment = document.createDocumentFragment();
    filteredData.forEach(movie => {
        if (!movie || !movie.id) return;
        const row = document.createElement('tr'); row.dataset.movieId = movie.id;
        if (isMultiSelectMode && selectedEntryIds.includes(movie.id)) row.classList.add('selected');
        const latestWatch = getLatestWatchInstance(movie.watchHistory || []);
        const addCell = (content, title = null, isHtml = false) => { const cell = row.insertCell(); if (isHtml) cell.innerHTML = content; else cell.textContent = content; if (title) cell.title = title; return cell; };
        addCell(movie.Name || 'N/A', movie.Name); addCell(movie.Category || 'N/A');
        const genreText = movie.Genre || 'N/A'; addCell(genreText.length > 30 ? genreText.substring(0, 27) + '...' : genreText, genreText.length > 30 ? genreText : null);
        let statusText = movie.Status || 'N/A'; if (movie.Status === 'Continue' && movie['Continue Details']) statusText += ` (${movie['Continue Details']})`;
        addCell(statusText);
        addCell((movie.Status === 'Watched' || movie.Status === 'Continue' ? movie.Recommendation : '') || 'N/A');
        addCell((movie.Status === 'Watched' || movie.Status === 'Continue' ? renderStars(movie.overallRating) : 'N/A'), null, true);
        addCell(latestWatch && latestWatch.date ? new Date(latestWatch.date).toLocaleDateString() : 'N/A');
        addCell(movie.Language || 'N/A'); addCell(movie.Year || 'N/A');
        addCell(getCountryFullName(movie.Country) || 'N/A');
        const descText = movie.Description || 'N/A'; addCell(descText.length > 50 ? descText.substring(0,47) + '...' : descText, descText.length > 50 ? descText: null);
        addCell(movie.lastModifiedDate ? new Date(movie.lastModifiedDate).toLocaleDateString() : 'N/A');
        const actionsCell = row.insertCell(); actionsCell.className = 'text-nowrap actions-cell text-center';
        actionsCell.innerHTML = `<button class="btn btn-sm btn-outline-info btn-action view-btn mr-1" title="View Details" data-movie-id="${movie.id}"><i class="fas fa-eye"></i></button><button class="btn btn-sm btn-outline-primary btn-action edit-btn mr-1" title="Edit Entry" data-movie-id="${movie.id}"><i class="fas fa-edit"></i></button>`;
        if (movie.Status === 'To Watch') actionsCell.innerHTML += `<button class="btn btn-sm btn-outline-success btn-action watch-later-btn mr-1" title="Quick Start Watching" data-movie-id="${movie.id}"><i class="fas fa-play"></i></button>`;
        else if (movie.Status === 'Continue') actionsCell.innerHTML += `<button class="btn btn-sm btn-outline-success btn-action mark-watched-btn mr-1" title="Quick Mark as Watched" data-movie-id="${movie.id}"><i class="fas fa-check-circle"></i></button>`;
        actionsCell.innerHTML += `<button class="btn btn-sm btn-outline-danger btn-action delete-btn" title="Delete Entry" data-movie-id="${movie.id}"><i class="fas fa-trash-alt"></i></button>`;
        fragment.appendChild(row);
    });
    movieTableBody.appendChild(fragment);
    updateSortIcons();
}

function updateSortIcons() {
    document.querySelectorAll('.table th i.fas').forEach(icon => {
        const th = icon.closest('th');
        if (th && th.dataset.column) {
            if (th.dataset.column === currentSortColumn) icon.className = `fas fa-sort-${currentSortDirection === 'asc' ? 'up' : 'down'}`;
            else icon.className = 'fas fa-sort';
        }
    });
}


// --- UI Modals Functions ---
// Relies on global: formFieldsGlob, movieData, selectedGenres, currentSupabaseUser,
// pendingEntryForConfirmation, pendingEditIdForConfirmation, movieIdToDelete,
// isMultiSelectMode, selectedEntryIds, countryCodeToNameMap, DO_NOT_SHOW_AGAIN_KEYS,
// and functions: generateUUID, showToast, hideLoading, renderGenreTags, populateGenreDropdown,
// renderWatchHistoryUI, closeWatchInstanceForm, toggleConditionalFields, parseInputForAutocomplete,
// recalculateAndApplyAllRelationships, sortMovies, renderTable, saveToIndexedDB, comprehensiveSync,
// getLatestWatchInstance, renderStars, fetchTmdbPersonDetails.

function prepareAddModal() {
    const entryModalLabel = document.getElementById('entryModalLabel');
    const entryForm = document.getElementById('entryForm');
    if (entryModalLabel) entryModalLabel.textContent = 'Add New Entry';
    if (entryForm) { entryForm.reset(); entryForm._tempTmdbData = {}; }
    if (document.getElementById('editEntryId')) document.getElementById('editEntryId').value = '';
    if (document.getElementById('tmdbId')) document.getElementById('tmdbId').value = '';
    if (document.getElementById('tmdbMediaType')) document.getElementById('tmdbMediaType').value = '';
    if (document.getElementById('currentWatchHistory')) document.getElementById('currentWatchHistory').value = '[]';
    const tmdbResultsEl = document.getElementById('tmdbSearchResults');
    if (tmdbResultsEl) { tmdbResultsEl.innerHTML = ''; tmdbResultsEl.style.display = 'none'; }
    if (formFieldsGlob && formFieldsGlob.relatedEntriesNames) formFieldsGlob.relatedEntriesNames.value = '';
    if (formFieldsGlob && formFieldsGlob.relatedEntriesSuggestions) { formFieldsGlob.relatedEntriesSuggestions.innerHTML = ''; formFieldsGlob.relatedEntriesSuggestions.style.display = 'none'; }
    if (formFieldsGlob && formFieldsGlob.tmdbSearchYear) formFieldsGlob.tmdbSearchYear.value = '';
    selectedGenres = []; renderGenreTags();
    const genreSearchInputEl = document.getElementById('genreSearchInput'); if (genreSearchInputEl) genreSearchInputEl.value = '';
    populateGenreDropdown();
    const genreDropdownEl = document.getElementById('genreDropdown'); const genreInputContainerEl = document.getElementById('genreInputContainer');
    if(genreDropdownEl) genreDropdownEl.style.display = 'none'; if(genreInputContainerEl) genreInputContainerEl.classList.remove('focus-within');
    renderWatchHistoryUI([]); closeWatchInstanceForm(); toggleConditionalFields();
    $('#entryModal').modal('show'); if (formFieldsGlob && formFieldsGlob.name) formFieldsGlob.name.focus();
}

function prepareEditModal(id) {
    const movie = movieData.find(m => m && m.id === id);
    if (!movie) { showToast("Error", "Entry not found for editing.", "error"); return; }
    const entryModalLabel = document.getElementById('entryModalLabel');
    const entryForm = document.getElementById('entryForm');
    if (entryModalLabel) entryModalLabel.textContent = `Edit: ${movie.Name || 'Entry'}`;
    if (entryForm) entryForm.reset();
    if (document.getElementById('editEntryId')) document.getElementById('editEntryId').value = movie.id;
    if (formFieldsGlob) {
        formFieldsGlob.name.value = movie.Name || ''; formFieldsGlob.category.value = movie.Category || 'Movie';
        formFieldsGlob.status.value = movie.Status || 'To Watch'; formFieldsGlob.continueDetails.value = movie['Continue Details'] || '';
        formFieldsGlob.recommendation.value = movie.Recommendation || ''; formFieldsGlob.overallRating.value = movie.overallRating || '';
        formFieldsGlob.personalRecommendation.value = movie.personalRecommendation || ''; formFieldsGlob.language.value = movie.Language || '';
        formFieldsGlob.year.value = movie.Year || ''; formFieldsGlob.country.value = movie.Country || '';
        formFieldsGlob.description.value = movie.Description || ''; formFieldsGlob.posterUrl.value = movie['Poster URL'] || '';
        if (formFieldsGlob.tmdbSearchYear) formFieldsGlob.tmdbSearchYear.value = '';
        const relatedNames = (movie.relatedEntries || []).map(relatedId => movieData.find(m => m && m.id === relatedId)?.Name).filter(Boolean).join(', ');
        formFieldsGlob.relatedEntriesNames.value = relatedNames;
    }
    if (document.getElementById('tmdbId')) document.getElementById('tmdbId').value = movie.tmdbId || '';
    if (document.getElementById('tmdbMediaType')) document.getElementById('tmdbMediaType').value = movie.tmdbMediaType || '';
    if (entryForm) {
        entryForm._tempTmdbData = { keywords: movie.keywords || [], full_cast: movie.full_cast || [], director_info: movie.director_info || null, production_companies: movie.production_companies || [], tmdb_vote_average: movie.tmdb_vote_average !== null ? movie.tmdb_vote_average : null, tmdb_vote_count: movie.tmdb_vote_count !== null ? movie.tmdb_vote_count : null, runtime: movie.runtime !== null ? movie.runtime : null, tmdb_collection_id: movie.tmdb_collection_id !== null ? movie.tmdb_collection_id : null, tmdb_collection_name: movie.tmdb_collection_name || null };
    }
    if (formFieldsGlob && formFieldsGlob.relatedEntriesSuggestions) { formFieldsGlob.relatedEntriesSuggestions.innerHTML = ''; formFieldsGlob.relatedEntriesSuggestions.style.display = 'none'; }
    selectedGenres = movie.Genre ? String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean) : [];
    renderGenreTags(); const genreSearchInputEl = document.getElementById('genreSearchInput'); if(genreSearchInputEl) genreSearchInputEl.value = '';
    populateGenreDropdown();
    if (document.getElementById('currentWatchHistory')) document.getElementById('currentWatchHistory').value = JSON.stringify(movie.watchHistory || []);
    renderWatchHistoryUI(movie.watchHistory || []); closeWatchInstanceForm();
    const tmdbResultsEl = document.getElementById('tmdbSearchResults'); if (tmdbResultsEl) { tmdbResultsEl.innerHTML = ''; tmdbResultsEl.style.display = 'none'; }
    const genreDropdownEl = document.getElementById('genreDropdown'); const genreInputContainerEl = document.getElementById('genreInputContainer');
    if(genreDropdownEl) genreDropdownEl.style.display = 'none'; if(genreInputContainerEl) genreInputContainerEl.classList.remove('focus-within');
    toggleConditionalFields(); $('#entryModal').modal('show');
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!formFieldsGlob) { console.error("formFieldsGlob not initialized!"); return; }
    showLoading("Saving entry...");
    try {
        const nameValue = formFieldsGlob.name.value.trim();
        if (!nameValue) { showToast("Validation Error", "Name is required.", "error"); formFieldsGlob.name.focus(); hideLoading(); return; }
        const yearVal = formFieldsGlob.year.value.trim();
        if (yearVal && (isNaN(parseInt(yearVal)) || parseInt(yearVal) < 1800 || parseInt(yearVal) > new Date().getFullYear() + 20)) {
            showToast("Validation Error", "Valid year required.", "error"); formFieldsGlob.year.focus(); hideLoading(); return;
        }
        const currentHistoryEl = document.getElementById('currentWatchHistory'); if (!currentHistoryEl) { hideLoading(); return; }
        const { finalized: namesArray } = parseInputForAutocomplete(formFieldsGlob.relatedEntriesNames.value.trim());
        const directRelatedEntriesIds = namesArray.map(name => movieData.find(m => m && m.Name && String(m.Name).toLowerCase() === String(name).toLowerCase())?.id).filter(id => id);
        const tmdbIdInput = document.getElementById('tmdbId'); const tmdbMediaTypeInput = document.getElementById('tmdbMediaType');
        const entryFormEl = document.getElementById('entryForm'); const cachedTmdbData = entryFormEl && entryFormEl._tempTmdbData ? entryFormEl._tempTmdbData : {};
        const countryInput = formFieldsGlob.country.value.trim(); let countryCodeToStore = countryInput.toUpperCase();
        if (countryInput.length > 3) { for (const [code, name] of Object.entries(countryCodeToNameMap)) { if (name.toLowerCase() === countryInput.toLowerCase()) { countryCodeToStore = code; break; } } }
        const entry = {
            Name: nameValue, Category: formFieldsGlob.category.value, Genre: Array.isArray(selectedGenres) ? selectedGenres.join(', ') : '', Status: formFieldsGlob.status.value,
            'Continue Details': formFieldsGlob.status.value === 'Continue' ? formFieldsGlob.continueDetails.value.trim() : '',
            Recommendation: (formFieldsGlob.status.value === 'Watched' || formFieldsGlob.status.value === 'Continue') ? formFieldsGlob.recommendation.value : '',
            overallRating: (formFieldsGlob.status.value === 'Watched' || formFieldsGlob.status.value === 'Continue') ? formFieldsGlob.overallRating.value : '',
            personalRecommendation: formFieldsGlob.personalRecommendation.value, Language: formFieldsGlob.language.value.trim(), Year: yearVal, Country: countryCodeToStore,
            Description: formFieldsGlob.description.value.trim(), 'Poster URL': formFieldsGlob.posterUrl.value.trim(),
            watchHistory: JSON.parse(currentHistoryEl.value || '[]'), relatedEntries: [...new Set(directRelatedEntriesIds)],
            lastModifiedDate: new Date().toISOString(), doNotRecommendDaily: false,
            tmdbId: tmdbIdInput && tmdbIdInput.value ? tmdbIdInput.value : null, tmdbMediaType: tmdbMediaTypeInput && tmdbMediaTypeInput.value ? tmdbMediaTypeInput.value : null,
            keywords: cachedTmdbData.keywords || [], tmdb_collection_id: cachedTmdbData.tmdb_collection_id !== undefined ? cachedTmdbData.tmdb_collection_id : null,
            tmdb_collection_name: cachedTmdbData.tmdb_collection_name || null, director_info: cachedTmdbData.director_info || null,
            full_cast: cachedTmdbData.full_cast || [], production_companies: cachedTmdbData.production_companies || [],
            tmdb_vote_average: cachedTmdbData.tmdb_vote_average !== undefined ? cachedTmdbData.tmdb_vote_average : null,
            tmdb_vote_count: cachedTmdbData.tmdb_vote_count !== undefined ? cachedTmdbData.tmdb_vote_count : null,
            runtime: cachedTmdbData.runtime !== undefined ? cachedTmdbData.runtime : null
        };
        const editIdEl = document.getElementById('editEntryId'); const editId = editIdEl ? editIdEl.value : null;
        if (editId) { const existingEntry = movieData.find(m => m && m.id === editId); if (existingEntry && typeof existingEntry.doNotRecommendDaily === 'boolean') entry.doNotRecommendDaily = existingEntry.doNotRecommendDaily; }
        const isDuplicate = movieData.some(m => m && m.Name && String(m.Name).toLowerCase() === entry.Name.toLowerCase() && m.id !== editId);
        if (isDuplicate) { pendingEntryForConfirmation = entry; pendingEditIdForConfirmation = editId; $('#duplicateNameConfirmModal').modal('show'); hideLoading(); return; }
        await proceedWithEntrySave(entry, editId);
    } catch (error) { console.error("Error in handleFormSubmit:", error); showToast("Save Error", `Error: ${error.message}`, "error"); hideLoading(); }
}

async function proceedWithEntrySave(entryToSave, idToEdit) {
    try {
        let isNewEntry = false;
        if (!idToEdit) { entryToSave.id = entryToSave.id || generateUUID(); movieData.push(entryToSave); isNewEntry = true; showToast("Entry Added", `"${entryToSave.Name}" added.`, "success", undefined, DO_NOT_SHOW_AGAIN_KEYS.ENTRY_ADDED); }
        else { const existingIndex = movieData.findIndex(m => m && m.id === idToEdit); if (existingIndex !== -1) { movieData[existingIndex] = { ...movieData[existingIndex], ...entryToSave, id: idToEdit }; showToast("Entry Updated", `"${entryToSave.Name}" updated.`, "success", undefined, DO_NOT_SHOW_AGAIN_KEYS.ENTRY_UPDATED); } else { showToast("Update Error", "Entry to update not found.", "error"); hideLoading(); return; } }
        recalculateAndApplyAllRelationships();
        if (currentSortColumn) sortMovies(currentSortColumn, currentSortDirection); else { currentSortColumn = 'Name'; currentSortDirection = 'asc'; sortMovies(currentSortColumn, currentSortDirection); }
        renderTable(); await saveToIndexedDB(); $('#entryModal').modal('hide');
        pendingEntryForConfirmation = null; pendingEditIdForConfirmation = null;
        if (currentSupabaseUser && typeof comprehensiveSync === 'function') await comprehensiveSync(true);
    } catch (error) { console.error("Error in proceedWithEntrySave:", error); showToast("Save Error", `Error: ${error.message}`, "error"); }
    finally { hideLoading(); }
}

function showDeleteConfirmationModal(id = null) {
    const deleteModalMessage = document.getElementById('deleteModalMessage');
    const batchDeleteOptionsDiv = document.getElementById('batchDeleteOptions');
    if (isMultiSelectMode && selectedEntryIds.length > 0) {
        movieIdToDelete = null;
        if(deleteModalMessage) deleteModalMessage.textContent = `Delete ${selectedEntryIds.length} selected entries? This cannot be undone.`;
        if(batchDeleteOptionsDiv) batchDeleteOptionsDiv.style.display = 'block';
        const cloudOnlyRadio = document.getElementById('deleteCloudOnly'); const bothRadio = document.getElementById('deleteBoth'); const localOnlyRadio = document.getElementById('deleteLocalOnly');
        if(cloudOnlyRadio) cloudOnlyRadio.disabled = !currentSupabaseUser; if(bothRadio) bothRadio.disabled = !currentSupabaseUser;
        if(!currentSupabaseUser) { if(localOnlyRadio) localOnlyRadio.checked = true; } else { if(bothRadio) bothRadio.checked = true; }
    } else if (id) {
        movieIdToDelete = id;
        const movie = movieData.find(m => m && m.id === id); const movieName = movie && movie.Name ? `"${movie.Name}"` : "this entry";
        if(deleteModalMessage) deleteModalMessage.textContent = `Delete ${movieName}? This cannot be undone.`;
        if(batchDeleteOptionsDiv) batchDeleteOptionsDiv.style.display = 'none';
    } else { showToast("Error", "No entry specified for deletion.", "error"); return; }
    $('#confirmDeleteModal').modal('show');
}

async function performDeleteEntry() {
    if (!movieIdToDelete) { showToast("Error", "No entry selected.", "error"); $('#confirmDeleteModal').modal('hide'); return; }
    showLoading("Deleting entry...");
    try {
        const deletedMovieId = movieIdToDelete; const movieName = movieData.find(m => m && m.id === deletedMovieId)?.Name || "The entry";
        movieData.forEach(movie => { if (movie && movie.relatedEntries && movie.relatedEntries.includes(deletedMovieId)) { movie.relatedEntries = movie.relatedEntries.filter(id => id !== deletedMovieId); movie.lastModifiedDate = new Date().toISOString(); }});
        movieData = movieData.filter(m => m && m.id !== deletedMovieId);
        recalculateAndApplyAllRelationships(); renderTable(); await saveToIndexedDB();
        showToast("Entry Deleted", `${movieName} removed locally.`, "warning", undefined, DO_NOT_SHOW_AGAIN_KEYS.ENTRY_DELETED);
        if (currentSupabaseUser && window.supabaseClient) {
            const { error } = await window.supabaseClient.from('movie_entries').delete().match({ id: deletedMovieId, user_id: currentSupabaseUser.id });
            if (error) { console.error("Supabase delete error (single):", error); showToast("Cloud Delete Failed", `Could not remove from cloud: ${error.message}.`, "error", 7000); }
            else { showToast("Cloud Synced", `${movieName} also removed from cloud.`, "success"); }
        }
    } catch (error) { console.error("Error deleting entry:", error); showToast("Delete Failed", `Error: ${error.message}`, "error", 7000);
    } finally { movieIdToDelete = null; $('#confirmDeleteModal').modal('hide'); hideLoading(); }
}

async function performBatchDelete() {
    if (!isMultiSelectMode || selectedEntryIds.length === 0) return;
    const deleteScopeRadio = document.querySelector('input[name="deleteScope"]:checked');
    if (!deleteScopeRadio) { showToast("Error", "Select delete scope.", "error"); return; }
    const deleteScope = deleteScopeRadio.value; const idsToDelete = [...selectedEntryIds]; const numToDelete = idsToDelete.length;
    showLoading(`Deleting ${numToDelete} entries (${deleteScope})...`);
    try {
        if (deleteScope === 'local' || deleteScope === 'both') {
            idsToDelete.forEach(deletedId => { movieData.forEach(movie => { if (movie && movie.relatedEntries && movie.relatedEntries.includes(deletedId)) { movie.relatedEntries = movie.relatedEntries.filter(id => id !== deletedId); movie.lastModifiedDate = new Date().toISOString(); }});});
            movieData = movieData.filter(m => m && !idsToDelete.includes(m.id));
            recalculateAndApplyAllRelationships(); await saveToIndexedDB();
            showToast("Local Deletion", `${numToDelete} entries removed locally.`, "warning");
        }
        if ((deleteScope === 'cloud' || deleteScope === 'both') && currentSupabaseUser && window.supabaseClient) {
            const CHUNK_SIZE = 100;
            for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
                const chunkIds = idsToDelete.slice(i, i + CHUNK_SIZE);
                const { error } = await window.supabaseClient.from('movie_entries').delete().in('id', chunkIds).eq('user_id', currentSupabaseUser.id);
                if (error) { console.error("Batch cloud delete error:", error); showToast("Cloud Delete Failed", `Some entries not removed from cloud: ${error.message}.`, "error", 7000); }
            }
            if (!idsToDelete.some(id => movieData.find(m => m.id === id))) showToast("Cloud Deletion", `${numToDelete} entries processed for cloud deletion.`, "success");
        } else if (deleteScope === 'cloud' && (!currentSupabaseUser || !window.supabaseClient)) showToast("Cloud Skipped", "Not logged in. Cannot delete from cloud.", "warning");
    } catch (error) { console.error("Batch delete error:", error); showToast("Batch Delete Failed", `Error: ${error.message}.`, "error", 7000);
    } finally { renderTable(); if (typeof disableMultiSelectMode === 'function') disableMultiSelectMode(); $('#confirmDeleteModal').modal('hide'); hideLoading(); }
}

async function openDetailsModal(id) {
    showLoading("Loading details...");
    try {
        const movie = movieData.find(m => m && m.id === id);
        if (!movie) { showToast("Error", "Entry details not found.", "error"); hideLoading(); return; }
        const setText = (elementId, text) => { const el = document.getElementById(elementId); if (el) el.textContent = text || 'N/A'; };
        const setHtml = (elementId, html) => { const el = document.getElementById(elementId); if (el) el.innerHTML = html || '<span class="text-muted small">N/A</span>'; };
        const toggleGroup = (groupId, condition, textContentElementId, text) => { const groupEl = $(`#${groupId}`); const textEl = document.getElementById(textContentElementId); if (groupEl.length) groupEl.toggle(!!condition); if (textEl && condition) textEl.textContent = text || 'N/A'; };
        const toggleGroupHtml = (groupId, condition, htmlContentElementId, html) => { const groupEl = $(`#${groupId}`); const htmlEl = document.getElementById(htmlContentElementId); if (groupEl.length) groupEl.toggle(!!condition); if (htmlEl && condition) htmlEl.innerHTML = html || '<span class="text-muted small">N/A</span>'; };
        setText('detailsName', movie.Name); setText('detailsCategory', movie.Category); setText('detailsGenre', movie.Genre); setText('detailsStatus', movie.Status);
        toggleGroup('detailsContinueGroup', movie.Status === 'Continue' && movie['Continue Details'], 'detailsContinue', movie['Continue Details']);
        toggleGroup('detailsRuntimeGroup', movie.runtime && movie.runtime > 0, 'detailsRuntime', `${movie.runtime} minutes`);
        const isWatchedOrContinue = (movie.Status === 'Watched' || movie.Status === 'Continue');
        toggleGroup('detailsRecommendationGroup', isWatchedOrContinue && movie.Recommendation, 'detailsRecommendation', movie.Recommendation);
        toggleGroupHtml('detailsOverallRatingGroup', isWatchedOrContinue && movie.overallRating, 'detailsOverallRating', renderStars(movie.overallRating));
        toggleGroup('detailsPersonalRecommendationGroup', movie.personalRecommendation, 'detailsPersonalRecommendation', movie.personalRecommendation);
        setText('detailsLanguage', movie.Language); setText('detailsYear', movie.Year); setText('detailsCountry', getCountryFullName(movie.Country));
        setText('detailsDescription', movie.Description); setText('detailsLastModified', movie.lastModifiedDate ? new Date(movie.lastModifiedDate).toLocaleString() : 'N/A');
        const keywordsSectionP = document.getElementById('detailsKeywords')?.closest('p'); if (keywordsSectionP) keywordsSectionP.style.display = (movie.keywords && movie.keywords.length > 0) ? 'block' : 'none';
        if (movie.keywords && movie.keywords.length > 0) setText('detailsKeywords', movie.keywords.map(k => k.name).join(', ')); else setText('detailsKeywords', 'N/A');
        const tmdbRatingCondition = typeof movie.tmdb_vote_average === 'number' && movie.tmdb_vote_count && movie.tmdb_vote_count > 0;
        const tmdbRatingHtml = tmdbRatingCondition ? `${movie.tmdb_vote_average.toFixed(1)}/10 <small>(${movie.tmdb_vote_count} votes)</small>` : 'N/A';
        toggleGroupHtml('detailsTMDBRatingGroup', tmdbRatingCondition, 'detailsTMDBRating', tmdbRatingHtml);
        const detailsPoster = $('#detailsPoster'); const noPosterMessage = $('#noPosterMessage');
        if (movie['Poster URL']) { detailsPoster.attr('src', movie['Poster URL']).removeClass('d-none'); noPosterMessage.addClass('d-none'); }
        else { detailsPoster.attr('src', 'icons/placeholder-poster.png').removeClass('d-none'); noPosterMessage.text('No Poster Provided').removeClass('d-none'); }
        const whSection = $('#detailsWatchHistorySection'); const whList = $('#detailsWatchHistoryList'); whList.empty();
        if (movie.watchHistory && movie.watchHistory.length > 0) { whSection.show(); [...movie.watchHistory].filter(wh => wh && wh.date).sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(wh => { whList.append(`<li class="list-group-item p-2"><strong>${new Date(wh.date).toLocaleDateString()}</strong> - ${renderStars(wh.rating)}${wh.notes ? `<br><small class="text-muted">Notes: ${wh.notes}</small>` : ''}</li>`); }); }
        else { whSection.hide(); }
        const castCrewSection = $('#detailsCastCrewSection'); const castCrewSeparator = $('#castCrewSeparator'); $('#detailsDirector').html('N/A'); $('#detailsCastList').empty();
        let castCrewVisible = false;
        if (movie.director_info && movie.director_info.name) { $('#detailsDirector').html(`<a href="#" class="person-link" data-person-id="${movie.director_info.id}" data-person-name="${movie.director_info.name}">${movie.director_info.name}</a>`); castCrewVisible = true; }
        if (movie.full_cast && movie.full_cast.length > 0) { const castListEl = $('#detailsCastList'); movie.full_cast.slice(0, 10).forEach(member => { if (member && member.name) castListEl.append(`<div class="col-md-4 col-6 mb-2 person-list-item"><a href="#" class="person-link" data-person-id="${member.id}" data-person-name="${member.name}">${member.name}</a> <small class="text-muted">(${member.character || 'N/A'})</small></div>`); }); castCrewVisible = true; }
        castCrewSection.toggle(castCrewVisible); castCrewSeparator.toggle(castCrewVisible);
        const enhancedRelatedSection = $('#detailsEnhancedRelatedSection'); const enhancedRelatedSeparator = $('#enhancedRelatedSeparator'); const manualLinksGroup = $('#detailsManualLinksGroup'); const manualLinksSeparator = $('#manualLinksSeparator');
        $('#detailsFranchiseGroup').hide().find('#detailsFranchiseList').empty(); $('#detailsDirectorGroup').hide().find('#detailsSameDirectorList').empty(); $('#detailsStudioGroup').hide().find('#detailsStudioList').empty(); manualLinksGroup.hide().find('#detailsManualLinksList').empty();
        let hasContextualLinks = false;
        const createLinkButton = (targetMovieId, currentMovieId, isLinked) => { const btnClass = isLinked ? 'btn-outline-danger delink-btn' : 'btn-outline-success link-btn'; const btnIcon = isLinked ? 'fa-unlink' : 'fa-link'; const btnText = isLinked ? 'Delink' : 'Link'; return `<button class="btn btn-sm ${btnClass} ml-2 py-0 px-1" style="font-size: 0.7rem;" data-target-movie-id="${targetMovieId}" data-current-movie-id="${currentMovieId}" title="${btnText}"><i class="fas ${btnIcon}"></i></button>`; };
        const populateContextualList = (listElementSelector, headerElementSelector, headerTextBase, sourceItems, linkType, currentMovie) => { const listEl = $(listElementSelector); const headerEl = headerElementSelector ? $(headerElementSelector) : null; if(listEl.length === 0 || (headerElementSelector && (!headerEl || headerEl.length === 0)) || !sourceItems || sourceItems.length === 0) return false; listEl.empty(); if(headerEl && headerEl.length) headerEl.text(headerTextBase); const sortedSourceItems = [...sourceItems].sort((a, b) => (parseInt(b.Year) || 0) - (parseInt(a.Year) || 0) || String(a.Name || '').localeCompare(String(b.Name || ''))); let itemsAdded = 0; sortedSourceItems.forEach(relMovie => { if (relMovie.id === currentMovie.id) return; const isLinked = currentMovie.relatedEntries && currentMovie.relatedEntries.includes(relMovie.id); const linkButtonHtml = createLinkButton(relMovie.id, currentMovie.id, isLinked); listEl.append(`<li><a href="#" class="related-item-link" data-movie-id="${relMovie.id}">${relMovie.Name} (${relMovie.Year || 'N/A'})</a> ${linkButtonHtml}</li>`); itemsAdded++; }); if (itemsAdded > 0) { listEl.closest('.related-group').show(); return true; } else { listEl.closest('.related-group').hide(); } return false; };
        if (movie.tmdb_collection_id && movie.tmdb_collection_name) { const collectionMoviesInLog = movieData.filter(m => m && m.id !== movie.id && m.tmdb_collection_id === movie.tmdb_collection_id); if(populateContextualList('#detailsFranchiseList', '#detailsFranchiseName', `${movie.tmdb_collection_name} (Franchise/Collection)`, collectionMoviesInLog, 'franchise', movie)) hasContextualLinks = true; }
        if (movie.director_info && movie.director_info.id && movie.director_info.name) { const otherByDirector = movieData.filter(m => m && m.id !== movie.id && m.director_info && m.director_info.id === movie.director_info.id); if(populateContextualList('#detailsSameDirectorList', '#detailsSameDirectorName', `More by ${movie.director_info.name} (Director)`, otherByDirector, 'director', movie)) hasContextualLinks = true; }
        if (movie.production_companies && movie.production_companies.length > 0) { const mainCompany = movie.production_companies[0]; if (mainCompany && mainCompany.id) { const otherByCompany = movieData.filter(m => m && m.id !== movie.id && m.production_companies && m.production_companies.some(pc => pc.id === mainCompany.id)); if(populateContextualList('#detailsStudioList', '#detailsStudioName', `More by ${mainCompany.name || 'Studio'}`, otherByCompany, 'studio', movie)) hasContextualLinks = true; }}
        const manuallyLinkedMovies = (movie.relatedEntries || []).map(id => movieData.find(m => m && m.id === id)).filter(Boolean); if(populateContextualList('#detailsManualLinksList', null, '', manuallyLinkedMovies, 'manual', movie)) { hasContextualLinks = true; manualLinksGroup.show(); if (manualLinksSeparator && manualLinksSeparator.length) manualLinksSeparator.show(); } else { manualLinksGroup.hide(); if (manualLinksSeparator && manualLinksSeparator.length) manualLinksSeparator.hide(); }
        enhancedRelatedSection.toggle(hasContextualLinks); enhancedRelatedSeparator.toggle( $('#detailsFranchiseGroup').is(':visible') || $('#detailsDirectorGroup').is(':visible') || $('#detailsStudioGroup').is(':visible') || manualLinksGroup.is(':visible') );
        const findSimilarBtn = $('#findSimilarBtn');
        if (isWatchedOrContinue && movie.tmdbId) { findSimilarBtn.data('current-movie-id', movie.id).show(); } else { findSimilarBtn.hide(); }
        $('#detailsModal').modal('show');
    } catch (error) { console.error("Error in openDetailsModal:", error); showToast("Details Error", `Error: ${error.message}`, "error");
    } finally { hideLoading(); }
}

async function handleManualLinkAction(currentMovieId, targetMovieId, action) {
    showLoading(`${action === 'link' ? 'Linking' : 'Delinking'} entry...`);
    try {
        const currentMovie = movieData.find(m => m && m.id === currentMovieId);
        const targetMovie = movieData.find(m => m && m.id === targetMovieId);
        if (!currentMovie || !targetMovie) { showToast("Error", "One or both movies not found.", "error"); return; }
        currentMovie.relatedEntries = currentMovie.relatedEntries || []; targetMovie.relatedEntries = targetMovie.relatedEntries || [];
        if (action === 'link') { if (!currentMovie.relatedEntries.includes(targetMovieId)) currentMovie.relatedEntries.push(targetMovieId); if (!targetMovie.relatedEntries.includes(currentMovieId)) targetMovie.relatedEntries.push(currentMovieId); }
        else { currentMovie.relatedEntries = currentMovie.relatedEntries.filter(id => id !== targetMovieId); targetMovie.relatedEntries = targetMovie.relatedEntries.filter(id => id !== currentMovieId); }
        const now = new Date().toISOString(); currentMovie.lastModifiedDate = now; targetMovie.lastModifiedDate = now;
        await saveToIndexedDB(); renderTable();
        if ($('#detailsModal').is(':visible')) await openDetailsModal(currentMovieId);
        showToast("Link Updated", `Entry ${action === 'link' ? 'linked' : 'delinked'}.`, "success");
        if (currentSupabaseUser) await comprehensiveSync(true);
    } catch (error) { console.error(`Error manual ${action}:`, error); showToast("Link Error", `Failed to ${action}: ${error.message}`, "error");
    } finally { hideLoading(); }
}

async function openPersonDetailsModal(personId, personName) {
    showLoading(`Fetching details for ${personName}...`);
    try {
        const personDetailsModal = $('#personDetailsModal'); const personDetailsModalLabel = $('#personDetailsModalLabel');
        const personProfileImage = $('#personProfileImage'); const noPersonImageMessage = $('#noPersonImageMessage');
        const personBio = $('#personBio'); const personFilmographyList = $('#personFilmographyList'); const viewTmdbPersonBtn = $('#viewTmdbPersonBtn');
        if (!personDetailsModal.length || !personDetailsModalLabel.length || !personProfileImage.length || !noPersonImageMessage.length || !personBio.length || !personFilmographyList.length || !viewTmdbPersonBtn.length) { console.error("Person Details Modal elements missing."); hideLoading(); return; }
        personDetailsModalLabel.text(personName || 'Person Details'); personProfileImage.addClass('d-none').attr('src', '');
        noPersonImageMessage.removeClass('d-none').text('No Image'); personBio.text('Loading bio...');
        personFilmographyList.empty().append('<li class="text-muted small">Loading filmography...</li>'); viewTmdbPersonBtn.hide();
        const personData = await fetchTmdbPersonDetails(personId); // From second.js
        if (personData) {
            let profilePath = personData.profile_path; if (personData.images && personData.images.profiles && personData.images.profiles.length > 0) profilePath = personData.images.profiles[0].file_path;
            if (profilePath) { personProfileImage.attr('src', `${TMDB_IMAGE_BASE_URL}w185${profilePath}`).removeClass('d-none'); noPersonImageMessage.addClass('d-none'); }
            else { personProfileImage.addClass('d-none').attr('src','icons/placeholder-person.png'); noPersonImageMessage.text('No Profile Image').removeClass('d-none'); }
            personBio.text(personData.biography || 'No biography from TMDB.');
            const sanitizedName = String(personName || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            viewTmdbPersonBtn.data('tmdb-url', `https://www.themoviedb.org/person/${personId}-${sanitizedName}`).show();
            personFilmographyList.empty();
            if (personData.combined_credits && (personData.combined_credits.cast.length > 0 || personData.combined_credits.crew.length > 0)) {
                const credits = [...personData.combined_credits.cast, ...personData.combined_credits.crew];
                const uniqueCredits = Array.from(new Map(credits.map(c => [c.id, c])).values());
                const filmographyInLog = uniqueCredits.map(credit => { const loggedEntry = movieData.find(entry => entry && String(entry.tmdbId) === String(credit.id) && entry.tmdbMediaType === credit.media_type); if (loggedEntry) return { ...loggedEntry, role: credit.job || credit.character || (credit.department ? `Crew (${credit.department})` : 'Participant'), release_year: credit.release_date ? new Date(credit.release_date).getFullYear() : (credit.first_air_date ? new Date(credit.first_air_date).getFullYear() : 'N/A') }; return null; }).filter(Boolean).sort((a,b) => (parseInt(b.release_year) || -Infinity) - (parseInt(a.release_year) || -Infinity));
                if (filmographyInLog.length > 0) filmographyInLog.forEach(entry => personFilmographyList.append(`<li><a href="#" class="person-filmography-link" data-movie-id="${entry.id}">${entry.Name} (${entry.release_year}) - <small class="text-muted">${entry.role}</small></a></li>`));
                else personFilmographyList.append('<li class="text-muted small">No entries with this person in your log.</li>');
            } else personFilmographyList.append('<li class="text-muted small">No filmography from TMDB.</li>');
        } else { personBio.text('Could not fetch details.'); personFilmographyList.empty().append('<li class="text-muted small">Could not load filmography.</li>'); }
        personDetailsModal.modal('show');
    } catch (error) { console.error("Error in openPersonDetailsModal:", error); if(document.getElementById('personBio')) document.getElementById('personBio').textContent = `Error: ${error.message}`; if(document.getElementById('personFilmographyList')) document.getElementById('personFilmographyList').innerHTML = `<li class="text-danger small">Error: ${error.message}</li>`;
    } finally { hideLoading(); }
}

function toggleConditionalFields() {
    if (!formFieldsGlob || !formFieldsGlob.status) return;
    const status = formFieldsGlob.status.value;
    const continueDetailsGroup = document.getElementById('continueDetailsGroup');
    const recommendationGroup = document.getElementById('recommendationGroup');
    const overallRatingGroup = document.getElementById('overallRatingGroup');
    const watchHistorySection = document.getElementById('watchHistorySection');
    const watchHistorySeparator = document.getElementById('watchHistorySeparator');
    const showForContinue = (status === 'Continue');
    const showForWatchedOrContinue = (status === 'Watched' || status === 'Continue');
    if (continueDetailsGroup) { $(continueDetailsGroup).toggle(showForContinue); if (!showForContinue && formFieldsGlob.continueDetails) formFieldsGlob.continueDetails.value = ''; }
    if (recommendationGroup) { $(recommendationGroup).toggle(showForWatchedOrContinue); if (!showForWatchedOrContinue && formFieldsGlob.recommendation) formFieldsGlob.recommendation.value = ''; }
    if (overallRatingGroup) { $(overallRatingGroup).toggle(showForWatchedOrContinue); if (!showForWatchedOrContinue && formFieldsGlob.overallRating) formFieldsGlob.overallRating.value = ''; }
    if (watchHistorySection) $(watchHistorySection).toggle(showForWatchedOrContinue);
    if (watchHistorySeparator) $(watchHistorySeparator).toggle(showForWatchedOrContinue);
}

function prepareEraseDataModal(defaultScope = 'local') {
    const eraseScopeSelect = document.getElementById('eraseDataScope');
    const eraseScopeWarning = document.getElementById('eraseScopeWarning');
    if (!eraseScopeSelect || !eraseScopeWarning) { console.warn("Erase data modal elements not found."); return; }
    eraseScopeSelect.value = defaultScope;
    function updateEraseWarning() {
        const selectedScope = eraseScopeSelect.value; let warningText = "";
        if (selectedScope === 'local') warningText = "PERMANENTLY ERASE data from THIS DEVICE'S CACHE ONLY. Cloud account (if any) untouched.";
        else if (selectedScope === 'cloud') { if (!currentSupabaseUser) warningText = "Not logged in. This will do nothing."; else warningText = `PERMANENTLY ERASE ALL entries from YOUR CLOUD ACCOUNT (${currentSupabaseUser.email}). Local data remains until next sync.`; }
        else if (selectedScope === 'both') warningText = "PERMANENTLY ERASE data from THIS DEVICE'S CACHE AND YOUR CLOUD ACCOUNT (if logged in).";
        eraseScopeWarning.textContent = warningText; eraseScopeWarning.className = `text-danger small p-2 mt-2 rounded ${selectedScope === 'cloud' || selectedScope === 'both' ? 'border border-danger' : 'border border-warning'}`;
    }
    eraseScopeSelect.removeEventListener('change', updateEraseWarning); eraseScopeSelect.addEventListener('change', updateEraseWarning);
    updateEraseWarning(); $('#confirmEraseDataModal').modal('show');
}

async function performDataCheckAndRepair() {
    showLoading("Performing data integrity checks...");
    try {
        let issuesFoundTexts = []; let changesMade = false;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
        for (let i = movieData.length - 1; i >= 0; i--) {
            let entry = movieData[i]; if (!entry) { issuesFoundTexts.push(`Entry at index ${i} was null. Removed.`); movieData.splice(i, 1); changesMade = true; continue; }
            let entryModifiedInLoop = false;
            if (!entry.id || !uuidRegex.test(entry.id)) { const oldId = entry.id; entry.id = generateUUID(); issuesFoundTexts.push(`Entry "${entry.Name || oldId || 'Unnamed'}" (Old ID: ${oldId}): Invalid ID. New: ${entry.id}.`); entryModifiedInLoop = true; }
            if (!entry.Name || String(entry.Name).trim() === '') issuesFoundTexts.push(`Entry ID ${entry.id}: Missing Name.`);
            if (!entry.Category || !['Movie', 'Series', 'Documentary', 'Special'].includes(entry.Category)) { issuesFoundTexts.push(`Entry "${entry.Name}": Invalid Category ('${entry.Category}'). Set to 'Movie'.`); entry.Category = 'Movie'; entryModifiedInLoop = true; }
            if (entry.watchHistory && Array.isArray(entry.watchHistory)) { entry.watchHistory.forEach(wh => { if (wh && (!wh.watchId || !uuidRegex.test(wh.watchId))) { issuesFoundTexts.push(`Entry "${entry.Name}": Watch (Date: ${wh.date||'N/A'}) invalid watchId. Assigned new.`); wh.watchId = generateUUID(); entryModifiedInLoop = true; }});}
            if (entryModifiedInLoop) { entry.lastModifiedDate = new Date().toISOString(); changesMade = true; }
        }
        if (changesMade) recalculateAndApplyAllRelationships();
        let message = issuesFoundTexts.length > 0 ? `Data check complete. ${issuesFoundTexts.length} issue(s):\n\n${issuesFoundTexts.join('\n')}` : "Data check complete. No issues found!";
        if (changesMade) { message += `\n\nIssues auto-repaired. Changes saved locally. Syncing.`; await saveToIndexedDB(); renderTable(); if (currentSupabaseUser) await comprehensiveSync(true); }
        if (issuesFoundTexts.length > 3) { alert(message); showToast("Data Issues Found", `Details in alert (${issuesFoundTexts.length} issues).`, "warning", 0, DO_NOT_SHOW_AGAIN_KEYS.DATA_INTEGRITY_ISSUES_FOUND); }
        else if (issuesFoundTexts.length > 0) showToast("Data Issues Found", message.replace(/\n/g, '<br/>'), "warning", 10000, DO_NOT_SHOW_AGAIN_KEYS.DATA_INTEGRITY_ISSUES_FOUND);
        else showToast("Data Integrity Check", "No issues found!", "success", 4000);
    } catch (error) { console.error("Error during data check/repair:", error); showToast("Repair Error", `Failed: ${error.message}`, "error");
    } finally { hideLoading(); }
}

function prepareBatchEditModal() {
    if (!isMultiSelectMode || selectedEntryIds.length === 0) { showToast("No Selection", "Select entries to batch edit.", "info"); return; }
    const batchEditForm = document.getElementById('batchEditForm'); const batchEditCount = document.getElementById('batchEditCount');
    if (batchEditForm) batchEditForm.reset(); if (batchEditCount) batchEditCount.textContent = selectedEntryIds.length;
    $('#batchEditModal').modal('show');
}

async function handleBatchEditFormSubmit(event) {
    event.preventDefault();
    if (!isMultiSelectMode || selectedEntryIds.length === 0) { showToast("Error", "No entries selected or multi-select not active.", "error"); return; }
    showLoading(`Applying batch edits to ${selectedEntryIds.length} entries...`);
    try {
        const newCategory = document.getElementById('batchEditCategory').value;
        const newLanguage = document.getElementById('batchEditLanguage').value.trim();
        const newYear = document.getElementById('batchEditYear').value.trim();
        const newCountry = document.getElementById('batchEditCountry').value.trim().toUpperCase();
        let changesMadeCount = 0; const currentLMD = new Date().toISOString();
        selectedEntryIds.forEach(id => {
            const entryIndex = movieData.findIndex(m => m && m.id === id);
            if (entryIndex !== -1) {
                let entryModified = false;
                if (newCategory && movieData[entryIndex].Category !== newCategory) { movieData[entryIndex].Category = newCategory; entryModified = true; }
                if (newLanguage && movieData[entryIndex].Language !== newLanguage) { movieData[entryIndex].Language = newLanguage; entryModified = true; }
                if (newYear && movieData[entryIndex].Year !== newYear) { movieData[entryIndex].Year = newYear; entryModified = true; }
                if (newCountry && movieData[entryIndex].Country !== newCountry) { movieData[entryIndex].Country = newCountry; entryModified = true; }
                if (entryModified) { movieData[entryIndex].lastModifiedDate = currentLMD; changesMadeCount++; }
            }
        });
        if (changesMadeCount > 0) {
            await saveToIndexedDB(); renderTable(); showToast("Batch Edit Complete", `${changesMadeCount} entries updated locally.`, "success");
            if (currentSupabaseUser) await comprehensiveSync(true);
        } else showToast("No Changes Applied", "No fields changed.", "info");
        $('#batchEditModal').modal('hide'); if (typeof disableMultiSelectMode === 'function') disableMultiSelectMode();
    } catch (error) { console.error("Error in handleBatchEditFormSubmit:", error); showToast("Batch Edit Error", `Error: ${error.message}`, "error");
    } finally { hideLoading(); }
}
