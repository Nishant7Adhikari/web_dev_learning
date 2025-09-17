// js/ui-watch-history.js
// ... (no changes here, keep as is) ...
/**
 * Finds the latest watch instance from a movie's watch history.
 * @param {Array<Object>} watchHistoryArray The array of watch history objects.
 * @returns {Object|null} The latest watch instance or null if none.
 */
function getLatestWatchInstance(watchHistoryArray) {
    if (!Array.isArray(watchHistoryArray) || watchHistoryArray.length === 0) return null;
    const validHistory = watchHistoryArray.filter(wh => wh && wh.date && !isNaN(new Date(wh.date).getTime()));
    if (validHistory.length === 0) return null;
    return [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

/**
 * Renders the watch history list in the entry modal.
 * @param {Array<Object>} entryWatchHistory The watch history array for the current entry.
 */
function renderWatchHistoryUI(entryWatchHistory = []) {
    const listEl = document.getElementById('watchHistoryList');
    if (!listEl) {
        console.warn("Element 'watchHistoryList' not found for UI rendering.");
        return;
    }
    listEl.innerHTML = '';

    if (!Array.isArray(entryWatchHistory) || entryWatchHistory.length === 0) {
        listEl.innerHTML = '<p class="text-muted p-2 small">No watch records yet. Add one below!</p>';
        return;
    }

    [...entryWatchHistory]
        .filter(wh => wh && wh.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(wh => {
            const item = document.createElement('div');
            item.className = 'watch-history-item list-group-item list-group-item-action flex-column align-items-start p-2 mb-1';
            const watchId = wh.watchId || generateUUID();
            if (!wh.watchId) wh.watchId = watchId;

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${wh.date ? new Date(wh.date).toLocaleDateString() : 'Invalid Date'}</h6>
                    <small>${renderStars(wh.rating)}</small>
                </div>
                <p class="mb-1 text-muted small">${wh.notes || 'No notes for this watch.'}</p>
                <div class="text-right">
                    <button type="button" class="btn btn-sm btn-outline-info edit-watch-btn mr-1" data-watchid="${watchId}" title="Edit Watch Record"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-watch-btn" data-watchid="${watchId}" title="Delete Watch Record"><i class="fas fa-trash"></i></button>
                </div>`;
            listEl.appendChild(item);
        });
}

/**
 * Prepares the watch instance form for adding a new record.
 */
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

/**
 * Prepares the watch instance form for editing an existing record.
 */
function prepareEditWatchInstanceForm(watchId) {
    const currentWatchHistoryEl = document.getElementById('currentWatchHistory');
    if (!currentWatchHistoryEl || !watchInstanceFormFields) {
        console.warn("Required elements for editing watch instance not found.");
        return;
    }

    let currentHistory = [];
    try {
        currentHistory = JSON.parse(currentWatchHistoryEl.value || '[]');
        if (!Array.isArray(currentHistory)) currentHistory = [];
    } catch (e) {
        console.error("Error parsing currentWatchHistory JSON:", e);
        showToast("Error", "Could not load watch history for editing.", "error");
        return;
    }

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
    } else {
        showToast("Error", "Could not find the watch record to edit.", "error");
    }
}

/**
 * Closes the watch instance form and resets it.
 */
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

/**
 * Saves or updates a watch instance based on the form data.
 */
function saveOrUpdateWatchInstance() {
    if (!watchInstanceFormFields || !watchInstanceFormFields.date) {
        console.warn("Watch instance form fields not available.");
        return;
    }
    const watchDate = watchInstanceFormFields.date.value;
    if (!watchDate) {
        showToast("Validation Error", "Watch Date is required.", "error");
        if (watchInstanceFormFields.date) watchInstanceFormFields.date.focus();
        return;
    }
    if (new Date(watchDate) > new Date()) {
        showToast("Validation Error", "Watch Date cannot be in the future.", "error");
        if (watchInstanceFormFields.date) watchInstanceFormFields.date.focus();
        return;
    }

    const currentWatchHistoryEl = document.getElementById('currentWatchHistory');
    const editingWatchIdEl = document.getElementById('editingWatchId');
    if (!currentWatchHistoryEl || !editingWatchIdEl) {
        console.warn("Required history/ID elements not found for saving watch instance.");
        return;
    }

    let currentHistory = [];
    try {
        currentHistory = JSON.parse(currentWatchHistoryEl.value || '[]');
        if (!Array.isArray(currentHistory)) currentHistory = [];
    } catch (e) {
        console.error("Error parsing currentWatchHistory JSON:", e);
        showToast("Error", "Could not save watch record due to history data error.", "error");
        return;
    }

    const editingId = editingWatchIdEl.value;

    const newOrUpdatedInstance = {
        watchId: editingId || generateUUID(),
        date: watchDate,
        rating: watchInstanceFormFields.rating ? watchInstanceFormFields.rating.value : '',
        notes: watchInstanceFormFields.notes ? watchInstanceFormFields.notes.value.trim() : ''
    };

    if (editingId) {
        currentHistory = currentHistory.map(wh => (wh && wh.watchId === editingId) ? newOrUpdatedInstance : wh);
    } else {
        currentHistory.push(newOrUpdatedInstance);
    }

    currentWatchHistoryEl.value = JSON.stringify(currentHistory);
    renderWatchHistoryUI(currentHistory);
    closeWatchInstanceForm();
    showToast("Watch Record", editingId ? "Watch record updated successfully." : "New watch record added.", "success");
}

/**
 * Deletes a watch instance from the list.
 */
function deleteWatchInstanceFromList(watchId) {
    if (!confirm("Are you sure you want to delete this watch record? This action cannot be undone.")) return;

    const currentWatchHistoryEl = document.getElementById('currentWatchHistory');
    if (!currentWatchHistoryEl) {
        console.warn("Current watch history element not found for deletion.");
        return;
    }

    let currentHistory = [];
    try {
        currentHistory = JSON.parse(currentWatchHistoryEl.value || '[]');
        if (!Array.isArray(currentHistory)) currentHistory = [];
    } catch (e) {
        console.error("Error parsing currentWatchHistory JSON:", e);
        showToast("Error", "Could not delete watch record due to history data error.", "error");
        return;
    }

    const initialLength = currentHistory.length;
    currentHistory = currentHistory.filter(wh => wh && wh.watchId !== watchId);

    if (currentHistory.length < initialLength) {
        currentWatchHistoryEl.value = JSON.stringify(currentHistory);
        renderWatchHistoryUI(currentHistory);
        showToast("Watch Record Deleted", "The watch record has been removed.", "warning");
    } else {
        showToast("Not Found", "The watch record to delete was not found.", "info");
    }
}


// js/ui-table.js

/**
 * Sorts the movie data by a given column and direction.
 */
function sortMovies(column, direction) {
    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array. Cannot sort.");
        return;
    }

    movieData.sort((a, b) => {
        if (!a && !b) return 0;
        if (!a) return direction === 'asc' ? 1 : -1;
        if (!b) return direction === 'asc' ? -1 : 1;

        let valA, valB;

        switch (column) {
            case 'LastWatchedDate':
                const latestA = typeof getLatestWatchInstance === 'function' ? getLatestWatchInstance(a.watchHistory) : null;
                const latestB = typeof getLatestWatchInstance === 'function' ? getLatestWatchInstance(b.watchHistory) : null;
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
                if (isNaN(valA)) valA = -1; 
                if (isNaN(valB)) valB = -1;
                break;
            case 'Name': case 'Category': case 'Status': case 'Recommendation':
            case 'Language': case 'Country':
                valA = String(a[column] || '').toLowerCase().trim();
                valB = String(b[column] || '').toLowerCase().trim();
                if (valA === '' || valA === 'n/a') valA = '\uffff'; 
                if (valB === '' || valB === 'n/a') valB = '\uffff';
                break;
            default: 
                valA = String(a[column] || '').toLowerCase().trim();
                valB = String(b[column] || '').toLowerCase().trim();
                break;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;

        const nameA = String(a.Name || '').toLowerCase();
        const nameB = String(b.Name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
}


/**
 * Renders the movie data into the HTML table, applying filters and sorting.
 */
function renderTable() {
    const movieTableBody = document.getElementById('movieTableBody');
    const initialMessage = document.getElementById('initialMessage');
    if (!movieTableBody) { console.error("CRITICAL: movieTableBody element not found. Table cannot be rendered."); return; }

    movieTableBody.innerHTML = '';

    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array. Cannot render table.");
        if (initialMessage) {
            initialMessage.style.display = 'block';
            initialMessage.innerHTML = '<p class="text-danger">Error: Movie data is not available or corrupted.</p>';
        }
        return;
    }

    if (initialMessage) {
      initialMessage.style.display = (movieData.length === 0 && !filterQuery) ? 'block' : 'none';
      if (movieData.length > 0) initialMessage.style.display = 'none';
    }

    let filteredData = movieData;
    if (filterQuery) {
        const lowerFilterQuery = filterQuery.toLowerCase();
        filteredData = movieData.filter(movie => {
            if (!movie) return false;
            return Object.values(movie).some(val => {
                if (typeof val === 'string' || typeof val === 'number') {
                    return String(val).toLowerCase().includes(lowerFilterQuery);
                }
                if (Array.isArray(val)) {
                    return val.some(item => {
                        if (typeof item === 'string') return item.toLowerCase().includes(lowerFilterQuery);
                        if (typeof item === 'object' && item && item.name && typeof item.name === 'string' && val !== movie.keywords) { 
                            return item.name.toLowerCase().includes(lowerFilterQuery);
                        }
                        if (typeof item === 'object' && item && item.notes && typeof item.notes === 'string') {
                             return item.notes.toLowerCase().includes(lowerFilterQuery);
                        }
                        return false;
                    });
                }
                if (val && typeof val === 'object' && val.name && typeof val.name === 'string' && val === movie.director_info) {
                    return val.name.toLowerCase().includes(lowerFilterQuery);
                }
                return false;
            });
        });
    }

    const noResultsRow = () => {
        const row = movieTableBody.insertRow();
        const cell = row.insertCell();
        const headerCount = document.querySelector('#movieTableBody')?.closest('table')?.querySelectorAll('thead th').length || 13;
        cell.colSpan = headerCount;
        cell.textContent = "No entries match your search criteria.";
        cell.className = "text-center text-muted py-3";
    };

    if (filteredData.length === 0) {
        if (movieData.length > 0 && filterQuery) {
            noResultsRow();
        } else if (movieData.length === 0 && !filterQuery) {
            if (initialMessage && initialMessage.style.display === 'none') {
                initialMessage.style.display = 'block';
            }
        }
        updateSortIcons();
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredData.forEach(movie => {
        if (!movie || !movie.id) return;

        const row = document.createElement('tr');
        row.dataset.movieId = movie.id;
        if (isMultiSelectMode && selectedEntryIds.includes(movie.id)) {
            row.classList.add('selected');
        }

        const latestWatch = typeof getLatestWatchInstance === 'function' ? getLatestWatchInstance(movie.watchHistory || []) : null;

        const addCell = (content, title = null, isHtml = false) => {
            const cell = row.insertCell();
            if (isHtml) cell.innerHTML = content;
            else cell.textContent = content;
            if (title) cell.title = title;
            return cell;
        };

        addCell(movie.Name || 'N/A', movie.Name);
        addCell(movie.Category || 'N/A');
        const genreText = movie.Genre || 'N/A';
        addCell(genreText.length > 30 ? genreText.substring(0, 27) + '...' : genreText, genreText.length > 30 ? genreText : null);
        
        let statusText = movie.Status || 'N/A';
        if (movie.Status === 'Continue' && movie['Continue Details']) statusText += ` (${movie['Continue Details']})`;
        addCell(statusText);
        
        addCell((movie.Status === 'Watched' || movie.Status === 'Continue' ? movie.Recommendation : '') || 'N/A');
        addCell((movie.Status === 'Watched' || movie.Status === 'Continue' ? renderStars(movie.overallRating) : 'N/A'), null, true);
        addCell(latestWatch && latestWatch.date ? new Date(latestWatch.date).toLocaleDateString() : 'N/A');
        addCell(movie.Language || 'N/A');
        addCell(movie.Year || 'N/A');
        addCell(typeof getCountryFullName === 'function' ? getCountryFullName(movie.Country) : (movie.Country || 'N/A'));
        const descText = movie.Description || 'N/A';
        addCell(descText.length > 50 ? descText.substring(0,47) + '...' : descText, descText.length > 50 ? descText: null);
        addCell(movie.lastModifiedDate ? new Date(movie.lastModifiedDate).toLocaleDateString() : 'N/A');

        const actionsCell = row.insertCell();
        actionsCell.className = 'text-nowrap actions-cell text-center';
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-sm btn-outline-info btn-action view-btn mr-1';
        viewBtn.title = 'View Details';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.dataset.movieId = movie.id;
        actionsCell.appendChild(viewBtn);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary btn-action edit-btn mr-1';
        editBtn.title = 'Edit Entry';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.dataset.movieId = movie.id;
        actionsCell.appendChild(editBtn);
        
        if (movie.Status === 'To Watch') {
            const watchLaterBtn = document.createElement('button');
            watchLaterBtn.className = 'btn btn-sm btn-outline-success btn-action watch-later-btn mr-1';
            watchLaterBtn.title = 'Quick Start Watching (Sets to Continue)';
            watchLaterBtn.innerHTML = '<i class="fas fa-play"></i>';
            watchLaterBtn.dataset.movieId = movie.id;
            actionsCell.appendChild(watchLaterBtn);
        } else if (movie.Status === 'Continue') {
            const markWatchedBtn = document.createElement('button');
            markWatchedBtn.className = 'btn btn-sm btn-outline-success btn-action mark-watched-btn mr-1';
            markWatchedBtn.title = 'Quick Mark as Watched';
            markWatchedBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
            markWatchedBtn.dataset.movieId = movie.id;
            actionsCell.appendChild(markWatchedBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger btn-action delete-btn';
        deleteBtn.title = 'Delete Entry';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.dataset.movieId = movie.id;
        actionsCell.appendChild(deleteBtn);

        fragment.appendChild(row);
    });
    movieTableBody.appendChild(fragment);
    updateSortIcons();
}

/**
 * Updates the sort icons on table headers.
 */
function updateSortIcons() {
    document.querySelectorAll('.table th i.fas').forEach(icon => {
        const th = icon.closest('th');
        if (th && th.dataset.column) {
            if (th.dataset.column === currentSortColumn) {
                icon.className = `fas fa-sort-${currentSortDirection === 'asc' ? 'up' : 'down'}`;
            } else {
                icon.className = 'fas fa-sort';
            }
        }
    });
}


// js/ui-modals.js
/**
 * Prepares the entry modal for adding a new movie entry.
 */
function prepareAddModal() {
    const entryModalLabel = document.getElementById('entryModalLabel');
    const entryForm = document.getElementById('entryForm');
    const editEntryIdEl = document.getElementById('editEntryId');
    const tmdbIdInput = document.getElementById('tmdbId');
    const tmdbMediaTypeInput = document.getElementById('tmdbMediaType');
    const currentHistoryEl = document.getElementById('currentWatchHistory');
    const tmdbResultsEl = document.getElementById('tmdbSearchResults');

    if (entryModalLabel) entryModalLabel.textContent = 'Add New Entry';
    if (entryForm) {
        entryForm.reset();
        entryForm._tempTmdbData = {};
    }
    if (editEntryIdEl) editEntryIdEl.value = '';
    if (tmdbIdInput) tmdbIdInput.value = '';
    if (tmdbMediaTypeInput) tmdbMediaTypeInput.value = '';
    if (currentHistoryEl) currentHistoryEl.value = '[]';

    if (tmdbResultsEl) {
        tmdbResultsEl.innerHTML = '';
        tmdbResultsEl.style.display = 'none';
    }
    if (formFieldsGlob && formFieldsGlob.relatedEntriesNames) formFieldsGlob.relatedEntriesNames.value = '';
    if (formFieldsGlob && formFieldsGlob.relatedEntriesSuggestions) {
        formFieldsGlob.relatedEntriesSuggestions.innerHTML = '';
        formFieldsGlob.relatedEntriesSuggestions.style.display = 'none';
    }
    if (formFieldsGlob && formFieldsGlob.tmdbSearchYear) formFieldsGlob.tmdbSearchYear.value = '';

    selectedGenres = [];
    if (typeof renderGenreTags === 'function') renderGenreTags();
    const genreSearchInputEl = document.getElementById('genreSearchInput');
    if (genreSearchInputEl) genreSearchInputEl.value = '';
    if (typeof populateGenreDropdown === 'function') populateGenreDropdown();
    const genreDropdownEl = document.getElementById('genreDropdown');
    const genreInputContainerEl = document.getElementById('genreInputContainer');
    if(genreDropdownEl) genreDropdownEl.style.display = 'none';
    if(genreInputContainerEl) genreInputContainerEl.classList.remove('focus-within');

    if (typeof renderWatchHistoryUI === 'function') renderWatchHistoryUI([]);
    if (typeof closeWatchInstanceForm === 'function') closeWatchInstanceForm();
    if (typeof toggleConditionalFields === 'function') toggleConditionalFields();

    $('#entryModal').modal('show');
    if (formFieldsGlob && formFieldsGlob.name) formFieldsGlob.name.focus();
}


/**
 * Prepares the entry modal for editing an existing movie entry.
 */
function prepareEditModal(id) {
    const movie = movieData.find(m => m && m.id === id);
    if (!movie) { showToast("Error", "Entry not found for editing.", "error"); return; }

    const entryModalLabel = document.getElementById('entryModalLabel');
    const entryForm = document.getElementById('entryForm');
    const editEntryIdEl = document.getElementById('editEntryId');
    const tmdbResultsEl = document.getElementById('tmdbSearchResults');
    const currentHistoryEl = document.getElementById('currentWatchHistory');
    const tmdbIdInput = document.getElementById('tmdbId');
    const tmdbMediaTypeInput = document.getElementById('tmdbMediaType');

    if (entryModalLabel) entryModalLabel.textContent = `Edit: ${movie.Name || 'Entry'}`;
    if (entryForm) entryForm.reset();
    if (editEntryIdEl) editEntryIdEl.value = movie.id;

    if (formFieldsGlob) {
        formFieldsGlob.name.value = movie.Name || '';
        formFieldsGlob.category.value = movie.Category || 'Movie';
        formFieldsGlob.status.value = movie.Status || 'To Watch';
        formFieldsGlob.continueDetails.value = movie['Continue Details'] || '';
        formFieldsGlob.recommendation.value = movie.Recommendation || '';
        formFieldsGlob.overallRating.value = movie.overallRating || '';
        formFieldsGlob.personalRecommendation.value = movie.personalRecommendation || '';
        formFieldsGlob.language.value = movie.Language || '';
        formFieldsGlob.year.value = movie.Year || '';
        formFieldsGlob.country.value = movie.Country || '';
        formFieldsGlob.description.value = movie.Description || '';
        formFieldsGlob.posterUrl.value = movie['Poster URL'] || '';
        if (formFieldsGlob.tmdbSearchYear) formFieldsGlob.tmdbSearchYear.value = '';

        const relatedNames = (movie.relatedEntries || [])
            .map(relatedId => movieData.find(m => m && m.id === relatedId)?.Name)
            .filter(Boolean).join(', ');
        formFieldsGlob.relatedEntriesNames.value = relatedNames;
    }
    if (tmdbIdInput) tmdbIdInput.value = movie.tmdbId || '';
    if (tmdbMediaTypeInput) tmdbMediaTypeInput.value = movie.tmdbMediaType || '';

    if (entryForm) {
        entryForm._tempTmdbData = {
            keywords: movie.keywords || [],
            full_cast: movie.full_cast || [],
            director_info: movie.director_info || null,
            production_companies: movie.production_companies || [],
            tmdb_vote_average: movie.tmdb_vote_average !== null ? movie.tmdb_vote_average : null,
            tmdb_vote_count: movie.tmdb_vote_count !== null ? movie.tmdb_vote_count : null,
            runtime: movie.runtime !== null ? movie.runtime : null,
            tmdb_collection_id: movie.tmdb_collection_id !== null ? movie.tmdb_collection_id : null,
            tmdb_collection_name: movie.tmdb_collection_name || null
        };
    }

    if (formFieldsGlob && formFieldsGlob.relatedEntriesSuggestions) {
        formFieldsGlob.relatedEntriesSuggestions.innerHTML = '';
        formFieldsGlob.relatedEntriesSuggestions.style.display = 'none';
    }

    selectedGenres = movie.Genre ? String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean) : [];
    if (typeof renderGenreTags === 'function') renderGenreTags();
    const genreSearchInputEl = document.getElementById('genreSearchInput');
    if(genreSearchInputEl) genreSearchInputEl.value = '';
    if (typeof populateGenreDropdown === 'function') populateGenreDropdown();

    if (currentHistoryEl) currentHistoryEl.value = JSON.stringify(movie.watchHistory || []);
    if (typeof renderWatchHistoryUI === 'function') renderWatchHistoryUI(movie.watchHistory || []);
    if (typeof closeWatchInstanceForm === 'function') closeWatchInstanceForm();

    if (tmdbResultsEl) { tmdbResultsEl.innerHTML = ''; tmdbResultsEl.style.display = 'none'; }
    const genreDropdownEl = document.getElementById('genreDropdown');
    const genreInputContainerEl = document.getElementById('genreInputContainer');
    if(genreDropdownEl) genreDropdownEl.style.display = 'none';
    if(genreInputContainerEl) genreInputContainerEl.classList.remove('focus-within');

    if (typeof toggleConditionalFields === 'function') toggleConditionalFields();
    $('#entryModal').modal('show');
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!formFieldsGlob) { console.error("formFieldsGlob not initialized!"); return; }
    showLoading("Saving entry...");

    try {
        const nameValue = formFieldsGlob.name.value.trim();
        if (!nameValue) {
            showToast("Validation Error", "Name is a required field.", "error");
            formFieldsGlob.name.focus();
            hideLoading(); return;
        }

        const yearVal = formFieldsGlob.year.value.trim();
        if (yearVal && (isNaN(parseInt(yearVal)) || parseInt(yearVal) < 1800 || parseInt(yearVal) > new Date().getFullYear() + 20)) {
            showToast("Validation Error", "Please enter a valid year (e.g., 1800 - current + 20).", "error");
            formFieldsGlob.year.focus();
            hideLoading(); return;
        }
        const currentHistoryEl = document.getElementById('currentWatchHistory');
        if (!currentHistoryEl) { hideLoading(); return; }

        const { finalized: namesArray } = parseInputForAutocomplete(formFieldsGlob.relatedEntriesNames.value.trim());
        const directRelatedEntriesIds = namesArray
            .map(name => movieData.find(m => m && m.Name && String(m.Name).toLowerCase() === String(name).toLowerCase())?.id)
            .filter(id => id);

        const tmdbIdInput = document.getElementById('tmdbId');
        const tmdbMediaTypeInput = document.getElementById('tmdbMediaType');
        const entryFormEl = document.getElementById('entryForm');
        const cachedTmdbData = entryFormEl && entryFormEl._tempTmdbData ? entryFormEl._tempTmdbData : {};
        
        const countryInput = formFieldsGlob.country.value.trim();
        let countryCodeToStore = countryInput.toUpperCase();
        if (countryInput.length > 3) { // Attempt to convert full name to code
            for (const [code, name] of Object.entries(countryCodeToNameMap)) {
                if (name.toLowerCase() === countryInput.toLowerCase()) {
                    countryCodeToStore = code; 
                    break;
                }
            }
        }


        const entry = {
            Name: nameValue,
            Category: formFieldsGlob.category.value,
            Genre: Array.isArray(selectedGenres) ? selectedGenres.join(', ') : '',
            Status: formFieldsGlob.status.value,
            'Continue Details': formFieldsGlob.status.value === 'Continue' ? formFieldsGlob.continueDetails.value.trim() : '',
            Recommendation: (formFieldsGlob.status.value === 'Watched' || formFieldsGlob.status.value === 'Continue') ? formFieldsGlob.recommendation.value : '',
            overallRating: (formFieldsGlob.status.value === 'Watched' || formFieldsGlob.status.value === 'Continue') ? formFieldsGlob.overallRating.value : '',
            personalRecommendation: formFieldsGlob.personalRecommendation.value,
            Language: formFieldsGlob.language.value.trim(),
            Year: yearVal,
            Country: countryCodeToStore,
            Description: formFieldsGlob.description.value.trim(),
            'Poster URL': formFieldsGlob.posterUrl.value.trim(),
            watchHistory: JSON.parse(currentHistoryEl.value || '[]'),
            relatedEntries: [...new Set(directRelatedEntriesIds)],
            lastModifiedDate: new Date().toISOString(),
            doNotRecommendDaily: false,
            tmdbId: tmdbIdInput && tmdbIdInput.value ? tmdbIdInput.value : null,
            tmdbMediaType: tmdbMediaTypeInput && tmdbMediaTypeInput.value ? tmdbMediaTypeInput.value : null,
            keywords: cachedTmdbData.keywords || [], 
            tmdb_collection_id: cachedTmdbData.tmdb_collection_id !== undefined ? cachedTmdbData.tmdb_collection_id : null,
            tmdb_collection_name: cachedTmdbData.tmdb_collection_name || null,
            director_info: cachedTmdbData.director_info || null,
            full_cast: cachedTmdbData.full_cast || [],
            production_companies: cachedTmdbData.production_companies || [],
            tmdb_vote_average: cachedTmdbData.tmdb_vote_average !== undefined ? cachedTmdbData.tmdb_vote_average : null,
            tmdb_vote_count: cachedTmdbData.tmdb_vote_count !== undefined ? cachedTmdbData.tmdb_vote_count : null,
            runtime: cachedTmdbData.runtime !== undefined ? cachedTmdbData.runtime : null
        };

        const editIdEl = document.getElementById('editEntryId');
        const editId = editIdEl ? editIdEl.value : null;
        if (editId) {
            const existingEntry = movieData.find(m => m && m.id === editId);
            if (existingEntry && typeof existingEntry.doNotRecommendDaily === 'boolean') {
                entry.doNotRecommendDaily = existingEntry.doNotRecommendDaily;
            }
        }

        const isDuplicate = movieData.some(m => m && m.Name && String(m.Name).toLowerCase() === entry.Name.toLowerCase() && m.id !== editId);

        if (isDuplicate) {
            pendingEntryForConfirmation = entry;
            pendingEditIdForConfirmation = editId;
            $('#duplicateNameConfirmModal').modal('show');
            hideLoading(); return;
        }

        await proceedWithEntrySave(entry, editId);
    } catch (error) {
        console.error("Error in handleFormSubmit:", error);
        showToast("Save Error", `An unexpected error occurred: ${error.message}`, "error");
        hideLoading(); 
    }
}

async function proceedWithEntrySave(entryToSave, idToEdit) {
    try {
        let isNewEntry = false;
        if (!idToEdit) {
            entryToSave.id = entryToSave.id || generateUUID();
            movieData.push(entryToSave);
            isNewEntry = true;
            showToast("Entry Added", `"${entryToSave.Name}" has been successfully added.`, "success", undefined, DO_NOT_SHOW_AGAIN_KEYS.ENTRY_ADDED);
        } else {
            const existingIndex = movieData.findIndex(m => m && m.id === idToEdit);
            if (existingIndex !== -1) {
                movieData[existingIndex] = { ...movieData[existingIndex], ...entryToSave, id: idToEdit };
                showToast("Entry Updated", `"${entryToSave.Name}" has been successfully updated.`, "success", undefined, DO_NOT_SHOW_AGAIN_KEYS.ENTRY_UPDATED);
            } else {
                showToast("Update Error", "Could not find the entry to update. It might have been deleted.", "error");
                hideLoading(); return;
            }
        }

        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
        else { currentSortColumn = 'Name'; currentSortDirection = 'asc'; if (typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); }

        if (typeof renderTable === 'function') renderTable();
        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        $('#entryModal').modal('hide');

        pendingEntryForConfirmation = null;
        pendingEditIdForConfirmation = null;
        
        if (currentSupabaseUser && typeof comprehensiveSync === 'function') {
            await comprehensiveSync(true); 
        }
    } catch (error) {
        console.error("Error in proceedWithEntrySave:", error);
        showToast("Save Error", `An unexpected error occurred during save: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

function showDeleteConfirmationModal(id = null) {
    const deleteModalMessage = document.getElementById('deleteModalMessage');
    const batchDeleteOptionsDiv = document.getElementById('batchDeleteOptions');
    
    if (isMultiSelectMode && selectedEntryIds.length > 0) {
        movieIdToDelete = null; // Clear single delete context
        if(deleteModalMessage) deleteModalMessage.textContent = `Are you sure you want to permanently delete ${selectedEntryIds.length} selected entries? This action cannot be undone.`;
        if(batchDeleteOptionsDiv) batchDeleteOptionsDiv.style.display = 'block'; // Show scope options for batch
        
        const cloudOnlyRadio = document.getElementById('deleteCloudOnly');
        const bothRadio = document.getElementById('deleteBoth');
        const localOnlyRadio = document.getElementById('deleteLocalOnly');

        if(cloudOnlyRadio) cloudOnlyRadio.disabled = !currentSupabaseUser;
        if(bothRadio) bothRadio.disabled = !currentSupabaseUser;
        
        if(!currentSupabaseUser) { // Default to local if not logged in
            if(localOnlyRadio) localOnlyRadio.checked = true;
        } else { // Default to both if logged in
            if(bothRadio) bothRadio.checked = true;
        }
    } else if (id) {
        movieIdToDelete = id; // Set for single delete
        const movie = movieData.find(m => m && m.id === id);
        const movieName = movie && movie.Name ? `"${movie.Name}"` : "this entry";
        if(deleteModalMessage) deleteModalMessage.textContent = `Are you sure you want to permanently delete ${movieName}? This action cannot be undone.`;
        if(batchDeleteOptionsDiv) batchDeleteOptionsDiv.style.display = 'none'; // Hide scope for single delete (always local+cloud if logged in)
    } else {
        showToast("Error", "No entry specified for deletion.", "error");
        return;
    }
    $('#confirmDeleteModal').modal('show');
}

async function performDeleteEntry() { // For single entry deletion
    if (!movieIdToDelete) {
        showToast("Error", "No entry selected for deletion.", "error");
        $('#confirmDeleteModal').modal('hide');
        return;
    }
    
    showLoading("Deleting entry...");
    try {
        const deletedMovieId = movieIdToDelete;
        const movieName = movieData.find(m => m && m.id === deletedMovieId)?.Name || "The entry";
        
        // 1. Update local in-memory data
        movieData.forEach(movie => {
            if (movie && movie.relatedEntries && movie.relatedEntries.includes(deletedMovieId)) {
                movie.relatedEntries = movie.relatedEntries.filter(id => id !== deletedMovieId);
                movie.lastModifiedDate = new Date().toISOString(); // Update LMD of related entries
            }
        });
        movieData = movieData.filter(m => m && m.id !== deletedMovieId);
        
        // 2. Update local UI and save to IndexedDB
        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        if (typeof renderTable === 'function') renderTable();
        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        
        showToast("Entry Deleted", `${movieName} removed locally.`, "warning", undefined, DO_NOT_SHOW_AGAIN_KEYS.ENTRY_DELETED);

        // 3. Delete from Supabase if logged in
        if (currentSupabaseUser && window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('movie_entries')
                .delete()
                .match({ id: deletedMovieId, user_id: currentSupabaseUser.id });

            if (error) {
                console.error("Supabase delete error (single):", error);
                showToast("Cloud Delete Failed", `Could not remove ${movieName} from cloud: ${error.message}. Local data deleted. Try syncing.`, "error", 7000);
            } else {
                showToast("Cloud Synced", `${movieName} also removed from cloud.`, "success");
            }
        }
    } catch (error) {
        console.error("Error during delete entry:", error);
        showToast("Delete Failed", `Could not delete: ${error.message}`, "error", 7000);
    } finally {
        movieIdToDelete = null;
        $('#confirmDeleteModal').modal('hide');
        hideLoading();
    }
}

async function performBatchDelete() { // For multiple selected entries
    if (!isMultiSelectMode || selectedEntryIds.length === 0) return;

    const deleteScopeRadio = document.querySelector('input[name="deleteScope"]:checked');
    if (!deleteScopeRadio) {
        showToast("Error", "Please select a delete scope (local, cloud, or both).", "error");
        return;
    }
    const deleteScope = deleteScopeRadio.value;
    const idsToDelete = [...selectedEntryIds]; // Copy the array
    const numToDelete = idsToDelete.length;

    showLoading(`Deleting ${numToDelete} entries (${deleteScope})...`);
    
    try {
        // 1. Local Deletion (if scope includes local)
        if (deleteScope === 'local' || deleteScope === 'both') {
            idsToDelete.forEach(deletedId => {
                movieData.forEach(movie => { // Update relatedEntries in other movies
                    if (movie && movie.relatedEntries && movie.relatedEntries.includes(deletedId)) {
                        movie.relatedEntries = movie.relatedEntries.filter(id => id !== deletedId);
                        movie.lastModifiedDate = new Date().toISOString();
                    }
                });
            });
            movieData = movieData.filter(m => m && !idsToDelete.includes(m.id)); // Remove from main data array
            
            if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
            if (typeof saveToIndexedDB === 'function') await saveToIndexedDB(); // Save changes to local DB
            showToast("Local Deletion", `${numToDelete} entries removed locally.`, "warning");
        }

        // 2. Cloud Deletion (if scope includes cloud and user is logged in)
        if ((deleteScope === 'cloud' || deleteScope === 'both') && currentSupabaseUser && window.supabaseClient) {
            const CHUNK_SIZE = 100; // Supabase might have limits on `in` filter array size
            for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
                const chunkIds = idsToDelete.slice(i, i + CHUNK_SIZE);
                const { error } = await window.supabaseClient
                    .from('movie_entries')
                    .delete()
                    .in('id', chunkIds)
                    .eq('user_id', currentSupabaseUser.id);
                if (error) {
                    console.error("Batch cloud delete error:", error);
                    showToast("Cloud Delete Failed", `Some entries might not have been removed from cloud: ${error.message}. Try syncing.`, "error", 7000);
                    // Optionally break or collect errors
                }
            }
            if (!idsToDelete.some(id => movieData.find(m => m.id === id))) { // Check if all were successfully deleted from cloud (indirectly)
                 showToast("Cloud Deletion", `${numToDelete} entries process for cloud deletion.`, "success");
            }
        } else if (deleteScope === 'cloud' && (!currentSupabaseUser || !window.supabaseClient)) {
            showToast("Cloud Skipped", "Not logged in or cloud service unavailable. Cannot delete from cloud.", "warning");
        }

    } catch (error) {
        console.error("Batch delete error:", error);
        showToast("Batch Delete Failed", `Error: ${error.message}. Data might be out of sync.`, "error", 7000);
    } finally {
        if (typeof renderTable === 'function') renderTable(); // Update table UI
        if (typeof disableMultiSelectMode === 'function') disableMultiSelectMode(); // Exit multi-select mode
        $('#confirmDeleteModal').modal('hide');
        hideLoading();
    }
}


async function openDetailsModal(id) {
    showLoading("Loading details...");
    try {
        const movie = movieData.find(m => m && m.id === id);
        if (!movie) { showToast("Error", "Entry details not found.", "error"); hideLoading(); return; }

        const setText = (elementId, text) => { const el = document.getElementById(elementId); if (el) el.textContent = text || 'N/A'; else console.warn(`Element ${elementId} not found.`);};
        const setHtml = (elementId, html) => { const el = document.getElementById(elementId); if (el) el.innerHTML = html || '<span class="text-muted small">N/A</span>'; else console.warn(`Element ${elementId} not found.`);};
        const toggleGroup = (groupId, condition, textContentElementId, text) => { const groupEl = $(`#${groupId}`); const textEl = document.getElementById(textContentElementId); if (groupEl.length) groupEl.toggle(!!condition); if (textEl && condition) textEl.textContent = text || 'N/A'; };
        const toggleGroupHtml = (groupId, condition, htmlContentElementId, html) => { const groupEl = $(`#${groupId}`); const htmlEl = document.getElementById(htmlContentElementId); if (groupEl.length) groupEl.toggle(!!condition); if (htmlEl && condition) htmlEl.innerHTML = html || '<span class="text-muted small">N/A</span>'; };

        setText('detailsName', movie.Name);
        setText('detailsCategory', movie.Category);
        setText('detailsGenre', movie.Genre);
        setText('detailsStatus', movie.Status);
        toggleGroup('detailsContinueGroup', movie.Status === 'Continue' && movie['Continue Details'], 'detailsContinue', movie['Continue Details']);
        toggleGroup('detailsRuntimeGroup', movie.runtime && movie.runtime > 0, 'detailsRuntime', `${movie.runtime} minutes`);
        
        const isWatchedOrContinue = (movie.Status === 'Watched' || movie.Status === 'Continue');
        toggleGroup('detailsRecommendationGroup', isWatchedOrContinue && movie.Recommendation, 'detailsRecommendation', movie.Recommendation);
        toggleGroupHtml('detailsOverallRatingGroup', isWatchedOrContinue && movie.overallRating, 'detailsOverallRating', renderStars(movie.overallRating));
        toggleGroup('detailsPersonalRecommendationGroup', movie.personalRecommendation, 'detailsPersonalRecommendation', movie.personalRecommendation);
        
        setText('detailsLanguage', movie.Language);
        setText('detailsYear', movie.Year);
        setText('detailsCountry', typeof getCountryFullName === 'function' ? getCountryFullName(movie.Country) : movie.Country);
        setText('detailsDescription', movie.Description);
        setText('detailsLastModified', movie.lastModifiedDate ? new Date(movie.lastModifiedDate).toLocaleString() : 'N/A');

        const keywordsSectionP = document.getElementById('detailsKeywords')?.closest('p');
        if (keywordsSectionP) keywordsSectionP.style.display = 'none';
        
        const tmdbRatingCondition = typeof movie.tmdb_vote_average === 'number' && movie.tmdb_vote_count && movie.tmdb_vote_count > 0;
        const tmdbRatingHtml = tmdbRatingCondition ? `${movie.tmdb_vote_average.toFixed(1)}/10 <small>(${movie.tmdb_vote_count} votes)</small>` : 'N/A';
        toggleGroupHtml('detailsTMDBRatingGroup', tmdbRatingCondition, 'detailsTMDBRating', tmdbRatingHtml);

        const detailsPoster = $('#detailsPoster');
        const noPosterMessage = $('#noPosterMessage');
        if (movie['Poster URL']) {
            detailsPoster.attr('src', movie['Poster URL']).removeClass('d-none');
            noPosterMessage.addClass('d-none');
        } else {
            detailsPoster.attr('src', 'icons/placeholder-poster.png').removeClass('d-none');
            noPosterMessage.text('No Poster Provided').removeClass('d-none');
        }

        const whSection = $('#detailsWatchHistorySection');
        const whList = $('#detailsWatchHistoryList');
        whList.empty();
        if (movie.watchHistory && movie.watchHistory.length > 0) {
            whSection.show();
            [...movie.watchHistory]
                .filter(wh => wh && wh.date)
                .sort((a,b) => new Date(b.date) - new Date(a.date))
                .forEach(wh => {
                    whList.append(`<li class="list-group-item p-2"><strong>${new Date(wh.date).toLocaleDateString()}</strong> - ${renderStars(wh.rating)}${wh.notes ? `<br><small class="text-muted">Notes: ${wh.notes}</small>` : ''}</li>`);
                });
        } else { whSection.hide(); }

        const castCrewSection = $('#detailsCastCrewSection');
        const castCrewSeparator = $('#castCrewSeparator');
        $('#detailsDirector').html('N/A');
        $('#detailsCastList').empty();
        
        let castCrewVisible = false;
        if (movie.director_info && movie.director_info.name) {
            $('#detailsDirector').html(`<a href="#" class="person-link" data-person-id="${movie.director_info.id}" data-person-name="${movie.director_info.name}">${movie.director_info.name}</a>`);
            castCrewVisible = true;
        }
        if (movie.full_cast && movie.full_cast.length > 0) {
            const castListEl = $('#detailsCastList');
            movie.full_cast.slice(0, 10).forEach(member => {
                if (member && member.name) {
                    castListEl.append(`<div class="col-md-4 col-6 mb-2 person-list-item"><a href="#" class="person-link" data-person-id="${member.id}" data-person-name="${member.name}">${member.name}</a> <small class="text-muted">(${member.character || 'N/A'})</small></div>`);
                }
            });
            castCrewVisible = true;
        }
        castCrewSection.toggle(castCrewVisible);
        castCrewSeparator.toggle(castCrewVisible);

        const enhancedRelatedSection = $('#detailsEnhancedRelatedSection');
        const enhancedRelatedSeparator = $('#enhancedRelatedSeparator');
        const manualLinksGroup = $('#detailsManualLinksGroup'); 
        const manualLinksSeparator = $('#manualLinksSeparator'); 


        $('#detailsFranchiseGroup').hide().find('#detailsFranchiseList').empty();
        $('#detailsDirectorGroup').hide().find('#detailsSameDirectorList').empty();
        $('#detailsStudioGroup').hide().find('#detailsStudioList').empty();
        manualLinksGroup.hide().find('#detailsManualLinksList').empty(); 
        let hasContextualLinks = false;

        const createLinkButton = (targetMovieId, currentMovieId, isLinked) => {
            const btnClass = isLinked ? 'btn-outline-danger delink-btn' : 'btn-outline-success link-btn';
            const btnIcon = isLinked ? 'fa-unlink' : 'fa-link';
            const btnText = isLinked ? 'Delink' : 'Link';
            return `<button class="btn btn-sm ${btnClass} ml-2 py-0 px-1" style="font-size: 0.7rem;" data-target-movie-id="${targetMovieId}" data-current-movie-id="${currentMovieId}" title="${btnText} from this entry's manual links"><i class="fas ${btnIcon}"></i></button>`;
        };
        
        const populateContextualList = (listElementSelector, headerElementSelector, headerTextBase, sourceItems, linkType, currentMovie) => {
            const listEl = $(listElementSelector);
            const headerEl = headerElementSelector ? $(headerElementSelector) : null; 
            if(listEl.length === 0 || (headerElementSelector && (!headerEl || headerEl.length === 0)) || !sourceItems || sourceItems.length === 0) return false;

            listEl.empty();
            if(headerEl && headerEl.length) headerEl.text(headerTextBase);
            
            const sortedSourceItems = [...sourceItems].sort((a, b) => {
                const yearA = parseInt(a.Year) || 0;
                const yearB = parseInt(b.Year) || 0;
                if (yearB !== yearA) return yearB - yearA; 
                return String(a.Name || '').localeCompare(String(b.Name || '')); 
            });

            let itemsAdded = 0;
            sortedSourceItems.forEach(relMovie => {
                if (relMovie.id === currentMovie.id) return; 
                const isLinked = currentMovie.relatedEntries && currentMovie.relatedEntries.includes(relMovie.id);
                const linkButtonHtml = createLinkButton(relMovie.id, currentMovie.id, isLinked);
                listEl.append(`<li><a href="#" class="related-item-link" data-movie-id="${relMovie.id}">${relMovie.Name} (${relMovie.Year || 'N/A'})</a> ${linkButtonHtml}</li>`);
                itemsAdded++;
            });
            if (itemsAdded > 0) {
                listEl.closest('.related-group').show();
                return true;
            } else {
                listEl.closest('.related-group').hide(); 
            }
            return false;
        };

        if (movie.tmdb_collection_id && movie.tmdb_collection_name) {
            const collectionMoviesInLog = movieData.filter(m => m && m.id !== movie.id && m.tmdb_collection_id === movie.tmdb_collection_id);
            if(populateContextualList('#detailsFranchiseList', '#detailsFranchiseName', `${movie.tmdb_collection_name} (Franchise/Collection)`, collectionMoviesInLog, 'franchise', movie)) hasContextualLinks = true;
        }
        if (movie.director_info && movie.director_info.id && movie.director_info.name) {
            const otherByDirector = movieData.filter(m => m && m.id !== movie.id && m.director_info && m.director_info.id === movie.director_info.id);
            if(populateContextualList('#detailsSameDirectorList', '#detailsSameDirectorName', `More by ${movie.director_info.name} (Director)`, otherByDirector, 'director', movie)) hasContextualLinks = true;
        }
        if (movie.production_companies && movie.production_companies.length > 0) {
            const mainCompany = movie.production_companies[0];
            if (mainCompany && mainCompany.id) {
                const otherByCompany = movieData.filter(m => m && m.id !== movie.id && m.production_companies && m.production_companies.some(pc => pc.id === mainCompany.id));
                if(populateContextualList('#detailsStudioList', '#detailsStudioName', `More by ${mainCompany.name || 'Studio'}`, otherByCompany, 'studio', movie)) hasContextualLinks = true;
            }
        }
        
        const manuallyLinkedMovies = (movie.relatedEntries || []).map(id => movieData.find(m => m && m.id === id)).filter(Boolean);
        if(populateContextualList('#detailsManualLinksList', null, '', manuallyLinkedMovies, 'manual', movie)) {
            hasContextualLinks = true; 
            manualLinksGroup.show(); 
            if (manualLinksSeparator && manualLinksSeparator.length) manualLinksSeparator.show();
        } else {
            manualLinksGroup.hide(); 
            if (manualLinksSeparator && manualLinksSeparator.length) manualLinksSeparator.hide();
        }

        enhancedRelatedSection.toggle(hasContextualLinks); 
        enhancedRelatedSeparator.toggle(
            $('#detailsFranchiseGroup').is(':visible') ||
            $('#detailsDirectorGroup').is(':visible') ||
            $('#detailsStudioGroup').is(':visible') ||
            manualLinksGroup.is(':visible')
        );


        const findSimilarBtn = $('#findSimilarBtn');
        if (isWatchedOrContinue && movie.tmdbId) {
            findSimilarBtn.data('current-movie-id', movie.id).show();
        } else {
            findSimilarBtn.hide();
        }

        $('#detailsModal').modal('show');

    } catch (error) {
        console.error("Error in openDetailsModal:", error);
        showToast("Details Error", `Could not load details: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

async function handleManualLinkAction(currentMovieId, targetMovieId, action) {
    showLoading(`${action === 'link' ? 'Linking' : 'Delinking'} entry...`);
    try {
        const currentMovie = movieData.find(m => m && m.id === currentMovieId);
        const targetMovie = movieData.find(m => m && m.id === targetMovieId);

        if (!currentMovie || !targetMovie) {
            showToast("Error", "One or both movies not found.", "error");
            return;
        }

        currentMovie.relatedEntries = currentMovie.relatedEntries || [];
        targetMovie.relatedEntries = targetMovie.relatedEntries || [];

        if (action === 'link') {
            if (!currentMovie.relatedEntries.includes(targetMovieId)) {
                currentMovie.relatedEntries.push(targetMovieId);
            }
            if (!targetMovie.relatedEntries.includes(currentMovieId)) {
                targetMovie.relatedEntries.push(currentMovieId);
            }
        } else { 
            currentMovie.relatedEntries = currentMovie.relatedEntries.filter(id => id !== targetMovieId);
            targetMovie.relatedEntries = targetMovie.relatedEntries.filter(id => id !== currentMovieId);
        }
        
        const now = new Date().toISOString();
        currentMovie.lastModifiedDate = now;
        targetMovie.lastModifiedDate = now;

        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        if (typeof renderTable === 'function') renderTable(); 

        if ($('#detailsModal').is(':visible')) { 
            await openDetailsModal(currentMovieId); 
        }

        showToast("Link Updated", `Entry ${action === 'link' ? 'linked' : 'delinked'} successfully.`, "success");
        if (currentSupabaseUser && typeof comprehensiveSync === 'function') await comprehensiveSync(true);

    } catch (error) {
        console.error(`Error during manual ${action}:`, error);
        showToast("Link Error", `Failed to ${action} entry: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

$(document).on('click', '#detailsModal .link-btn, #detailsModal .delink-btn', async function(e) { 
    e.preventDefault();
    e.stopPropagation(); 
    const currentMovieId = $(this).data('current-movie-id');
    const targetMovieId = $(this).data('target-movie-id');
    const action = $(this).hasClass('link-btn') ? 'link' : 'delink';
    await handleManualLinkAction(currentMovieId, targetMovieId, action); 
    if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
});


async function openPersonDetailsModal(personId, personName) {
    showLoading(`Fetching details for ${personName}...`);
    try {
        const personDetailsModal = $('#personDetailsModal');
        const personDetailsModalLabel = $('#personDetailsModalLabel');
        const personProfileImage = $('#personProfileImage');
        const noPersonImageMessage = $('#noPersonImageMessage');
        const personBio = $('#personBio');
        const personFilmographyList = $('#personFilmographyList');
        const viewTmdbPersonBtn = $('#viewTmdbPersonBtn');

        if (!personDetailsModal.length || !personDetailsModalLabel.length || !personProfileImage.length || !noPersonImageMessage.length || !personBio.length || !personFilmographyList.length || !viewTmdbPersonBtn.length) {
            console.error("One or more elements for Person Details Modal are missing.");
            hideLoading(); return;
        }

        personDetailsModalLabel.text(personName || 'Person Details');
        personProfileImage.addClass('d-none').attr('src', '');
        noPersonImageMessage.removeClass('d-none').text('No Image Available');
        personBio.text('Loading biography...');
        personFilmographyList.empty().append('<li class="text-muted small">Loading filmography...</li>');
        viewTmdbPersonBtn.hide();


        const personData = await fetchTmdbPersonDetails(personId);

        if (personData) {
            let profilePath = personData.profile_path;
            if (personData.images && personData.images.profiles && personData.images.profiles.length > 0) {
                profilePath = personData.images.profiles[0].file_path;
            }
            if (profilePath) {
                personProfileImage.attr('src', `${TMDB_IMAGE_BASE_URL}w185${profilePath}`).removeClass('d-none');
                noPersonImageMessage.addClass('d-none');
            } else {
                personProfileImage.addClass('d-none').attr('src','icons/placeholder-person.png');
                noPersonImageMessage.text('No Profile Image Available').removeClass('d-none');
            }
            personBio.text(personData.biography || 'No biography available from TMDB.');

            const sanitizedName = String(personName || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            viewTmdbPersonBtn.data('tmdb-url', `https://www.themoviedb.org/person/${personId}-${sanitizedName}`).show();

            personFilmographyList.empty();
            if (personData.combined_credits && (personData.combined_credits.cast.length > 0 || personData.combined_credits.crew.length > 0)) {
                const credits = [...personData.combined_credits.cast, ...personData.combined_credits.crew];
                const uniqueCredits = Array.from(new Map(credits.map(c => [c.id, c])).values());

                const filmographyInLog = uniqueCredits
                    .map(credit => {
                        const loggedEntry = movieData.find(entry => entry && String(entry.tmdbId) === String(credit.id) && entry.tmdbMediaType === credit.media_type);
                        if (loggedEntry) {
                            return {
                                ...loggedEntry,
                                role: credit.job || credit.character || (credit.department ? `Crew (${credit.department})` : 'Participant'),
                                release_year: credit.release_date ? new Date(credit.release_date).getFullYear() : (credit.first_air_date ? new Date(credit.first_air_date).getFullYear() : 'N/A')
                            };
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .sort((a,b) => (parseInt(b.release_year) || -Infinity) - (parseInt(a.release_year) || -Infinity));

                if (filmographyInLog.length > 0) {
                    filmographyInLog.forEach(entry => {
                        personFilmographyList.append(`<li><a href="#" class="person-filmography-link" data-movie-id="${entry.id}">${entry.Name} (${entry.release_year}) - <small class="text-muted">${entry.role}</small></a></li>`);
                    });
                } else {
                    personFilmographyList.append('<li class="text-muted small">No entries featuring this person found in your current log.</li>');
                }
            } else {
                personFilmographyList.append('<li class="text-muted small">No filmography data available from TMDB.</li>');
            }
        } else {
            personBio.text('Could not fetch details for this person from TMDB.');
            personFilmographyList.empty().append('<li class="text-muted small">Could not load filmography.</li>');
        }
        personDetailsModal.modal('show');
    } catch (error) {
        console.error("Error in openPersonDetailsModal:", error);
        if(document.getElementById('personBio')) document.getElementById('personBio').textContent = `Failed to load person details: ${error.message}`;
        if(document.getElementById('personFilmographyList')) document.getElementById('personFilmographyList').innerHTML = `<li class="text-danger small">Error loading filmography: ${error.message}</li>`;
    } finally {
        hideLoading();
    }
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

    if (continueDetailsGroup) {
        $(continueDetailsGroup).toggle(showForContinue);
        if (!showForContinue && formFieldsGlob.continueDetails) formFieldsGlob.continueDetails.value = '';
    }
    if (recommendationGroup) {
        $(recommendationGroup).toggle(showForWatchedOrContinue);
        if (!showForWatchedOrContinue && formFieldsGlob.recommendation) formFieldsGlob.recommendation.value = '';
    }
    if (overallRatingGroup) {
        $(overallRatingGroup).toggle(showForWatchedOrContinue);
        if (!showForWatchedOrContinue && formFieldsGlob.overallRating) formFieldsGlob.overallRating.value = '';
    }
    if (watchHistorySection) $(watchHistorySection).toggle(showForWatchedOrContinue);
    if (watchHistorySeparator) $(watchHistorySeparator).toggle(showForWatchedOrContinue);
}

function prepareEraseDataModal(defaultScope = 'local') {
    const eraseScopeSelect = document.getElementById('eraseDataScope');
    const eraseScopeWarning = document.getElementById('eraseScopeWarning');

    if (!eraseScopeSelect || !eraseScopeWarning) { console.warn("Erase data modal elements not found."); return; }
    eraseScopeSelect.value = defaultScope;

    function updateEraseWarning() {
        const selectedScope = eraseScopeSelect.value;
        let warningText = "";
        if (selectedScope === 'local') {
            warningText = "This will PERMANENTLY ERASE data from THIS DEVICE'S CACHE ONLY. Your cloud account data (if any) will remain untouched.";
        } else if (selectedScope === 'cloud') {
            if (!currentSupabaseUser) warningText = "You are not logged into a cloud account. This option will do nothing.";
            else warningText = `This will PERMANENTLY ERASE ALL movie entries from YOUR CLOUD ACCOUNT (${currentSupabaseUser.email}). Local data remains until next sync.`;
        } else if (selectedScope === 'both') {
            warningText = "This will PERMANENTLY ERASE data from THIS DEVICE'S CACHE AND YOUR CLOUD ACCOUNT (if logged in). This is a comprehensive data removal.";
        }
        eraseScopeWarning.textContent = warningText;
        eraseScopeWarning.className = `text-danger small p-2 mt-2 rounded ${selectedScope === 'cloud' || selectedScope === 'both' ? 'border border-danger' : 'border border-warning'}`;
    }

    eraseScopeSelect.removeEventListener('change', updateEraseWarning);
    eraseScopeSelect.addEventListener('change', updateEraseWarning);
    updateEraseWarning();
    $('#confirmEraseDataModal').modal('show');
}

async function performDataCheckAndRepair() {
    showLoading("Performing data integrity checks...");
    try {
        let issuesFoundTexts = [];
        let changesMade = false;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

        for (let i = movieData.length - 1; i >= 0; i--) {
            let entry = movieData[i];
            if (!entry) {
                issuesFoundTexts.push(`Entry at original index ${i} was null/undefined. Removed.`);
                movieData.splice(i, 1);
                changesMade = true;
                continue;
            }
            let entryModifiedInLoop = false;
            if (!entry.id || !uuidRegex.test(entry.id)) {
                const oldId = entry.id;
                entry.id = generateUUID();
                issuesFoundTexts.push(`Entry "${entry.Name || oldId || 'Unnamed'}" (Old ID: ${oldId}): Invalid/missing ID. Assigned new: ${entry.id}.`);
                entryModifiedInLoop = true;
            }
            if (!entry.Name || String(entry.Name).trim() === '') {
                issuesFoundTexts.push(`Entry ID ${entry.id}: Missing Name. Please edit manually.`);
            }
            if (!entry.Category || !['Movie', 'Series', 'Documentary', 'Special'].includes(entry.Category)) {
                issuesFoundTexts.push(`Entry ID ${entry.id} ("${entry.Name}"): Invalid Category ('${entry.Category}'). Set to 'Movie'.`);
                entry.Category = 'Movie';
                entryModifiedInLoop = true;
            }
            if (entry.watchHistory && Array.isArray(entry.watchHistory)) {
                entry.watchHistory.forEach(wh => {
                    if (wh && (!wh.watchId || !uuidRegex.test(wh.watchId))) {
                        issuesFoundTexts.push(`Entry "${entry.Name}": Watch history (Date: ${wh.date||'N/A'}) had invalid watchId. Assigned new.`);
                        wh.watchId = generateUUID();
                        entryModifiedInLoop = true;
                    }
                });
            }
            if (entryModifiedInLoop) {
                entry.lastModifiedDate = new Date().toISOString();
                changesMade = true;
            }
        }

        if (changesMade && typeof recalculateAndApplyAllRelationships === 'function') {
            recalculateAndApplyAllRelationships();
        }

        let message = issuesFoundTexts.length > 0 ?
            `Data integrity check complete. ${issuesFoundTexts.length} issue(s) found:\n\n${issuesFoundTexts.join('\n')}` :
            "Data integrity check complete. No issues found!";

        if (changesMade) {
            message += `\n\nSome issues were auto-repaired. Changes saved locally. Syncing to cloud if applicable.`;
            if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
            if (typeof renderTable === 'function') renderTable();
            if (currentSupabaseUser && typeof comprehensiveSync === 'function') {
                await comprehensiveSync(true);
            }
        }

        if (issuesFoundTexts.length > 3) {
            alert(message);
            showToast("Data Issues Found", `Check details in alert (${issuesFoundTexts.length} issues). Some auto-repaired.`, "warning", 0, DO_NOT_SHOW_AGAIN_KEYS.DATA_INTEGRITY_ISSUES_FOUND);
        } else if (issuesFoundTexts.length > 0) {
            showToast("Data Issues Found", message.replace(/\n/g, '<br/>'), "warning", 10000, DO_NOT_SHOW_AGAIN_KEYS.DATA_INTEGRITY_ISSUES_FOUND);
        } else {
            showToast("Data Integrity Check", "No data integrity issues found!", "success", 4000);
        }
    } catch (error) {
        console.error("Error during data check/repair:", error);
        showToast("Repair Error", `Failed: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

function prepareBatchEditModal() {
    if (!isMultiSelectMode || selectedEntryIds.length === 0) {
        showToast("No Selection", "Please select entries from the table to batch edit.", "info");
        return;
    }
    const batchEditForm = document.getElementById('batchEditForm');
    const batchEditCount = document.getElementById('batchEditCount');
    if (batchEditForm) batchEditForm.reset();
    if (batchEditCount) batchEditCount.textContent = selectedEntryIds.length;
    $('#batchEditModal').modal('show');
}

async function handleBatchEditFormSubmit(event) {
    event.preventDefault();
    if (!isMultiSelectMode || selectedEntryIds.length === 0) {
        showToast("Error", "No entries selected or multi-select mode not active.", "error");
        return;
    }

    showLoading(`Applying batch edits to ${selectedEntryIds.length} entries...`);
    try {
        const newCategory = document.getElementById('batchEditCategory').value;
        const newLanguage = document.getElementById('batchEditLanguage').value.trim();
        const newYear = document.getElementById('batchEditYear').value.trim();
        const newCountry = document.getElementById('batchEditCountry').value.trim().toUpperCase();

        let changesMadeCount = 0;
        const currentLMD = new Date().toISOString();
        selectedEntryIds.forEach(id => {
            const entryIndex = movieData.findIndex(m => m && m.id === id);
            if (entryIndex !== -1) {
                let entryModified = false;
                if (newCategory && movieData[entryIndex].Category !== newCategory) { movieData[entryIndex].Category = newCategory; entryModified = true; }
                if (newLanguage && movieData[entryIndex].Language !== newLanguage) { movieData[entryIndex].Language = newLanguage; entryModified = true; }
                if (newYear && movieData[entryIndex].Year !== newYear) { movieData[entryIndex].Year = newYear; entryModified = true; }
                if (newCountry && movieData[entryIndex].Country !== newCountry) { movieData[entryIndex].Country = newCountry; entryModified = true; }

                if (entryModified) {
                    movieData[entryIndex].lastModifiedDate = currentLMD;
                    changesMadeCount++;
                }
            }
        });

        if (changesMadeCount > 0) {
            if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
            if (typeof renderTable === 'function') renderTable();
            showToast("Batch Edit Complete", `${changesMadeCount} entries updated locally.`, "success");

            if (currentSupabaseUser && typeof comprehensiveSync === 'function') {
                await comprehensiveSync(true);
            }
        } else {
            showToast("No Changes Applied", "No fields were changed, or selected values matched existing data.", "info");
        }

        $('#batchEditModal').modal('hide');
        if (typeof disableMultiSelectMode === 'function') disableMultiSelectMode();
    } catch (error) {
        console.error("Error in handleBatchEditFormSubmit:", error);
        showToast("Batch Edit Error", `An unexpected error occurred: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}