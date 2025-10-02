/* ui.js */
// START CHUNK: Image Lazy Loader
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.onload = () => {
                    img.classList.add('loaded');
                };
            }
            observer.unobserve(img);
        }
    });
}, { rootMargin: "0px 0px 200px 0px" });
// END CHUNK: Image Lazy Loader

// START CHUNK: Watch History Management (UI)
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

async function saveOrUpdateWatchInstance() {
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

    await checkAndNotifyNewAchievements();
}

async function deleteWatchInstanceFromList(watchId) {
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
        await checkAndNotifyNewAchievements();
    } else { showToast("Not Found", "The watch record to delete was not found.", "info"); }
}
// END CHUNK: Watch History Management (UI)

// START CHUNK: Main View Rendering
function sortMovies(column, direction) {
    if (!Array.isArray(movieData)) { console.error("movieData is not an array. Cannot sort."); return; }
    movieData.sort((a, b) => {
        if (!a && !b) return 0; if (!a) return 1; if (!b) return -1;
        let valA, valB;
        const ascEmpty = Infinity;
        const descEmpty = -Infinity;

        switch (column) {
            case 'LastWatchedDate':
                const latestA = getLatestWatchInstance(a.watchHistory);
                const latestB = getLatestWatchInstance(b.watchHistory);
                valA = latestA ? new Date(latestA.date).getTime() : (direction === 'asc' ? ascEmpty : descEmpty);
                valB = latestB ? new Date(latestB.date).getTime() : (direction === 'asc' ? ascEmpty : descEmpty);
                break;
            case 'lastModifiedDate':
                valA = a.lastModifiedDate ? new Date(a.lastModifiedDate).getTime() : (direction === 'asc' ? ascEmpty : descEmpty);
                valB = b.lastModifiedDate ? new Date(b.lastModifiedDate).getTime() : (direction === 'asc' ? ascEmpty : descEmpty);
                break;
            case 'Year':
                valA = a.Year && !isNaN(parseInt(a.Year, 10)) ? parseInt(a.Year, 10) : (direction === 'asc' ? ascEmpty : descEmpty);
                valB = b.Year && !isNaN(parseInt(b.Year, 10)) ? parseInt(b.Year, 10) : (direction === 'asc' ? ascEmpty : descEmpty);
                break;
            case 'overallRating':
                valA = a.overallRating && a.overallRating !== '' ? parseFloat(a.overallRating) : -1;
                valB = b.overallRating && b.overallRating !== '' ? parseFloat(b.overallRating) : -1;
                break;
            default:
                valA = String(a[column] || '').toLowerCase().trim();
                valB = String(b[column] || '').toLowerCase().trim();
                break;
        }
        
        let comparison = 0;
        if (valA < valB) comparison = -1;
        else if (valA > valB) comparison = 1;

        if (comparison === 0 && column !== 'Name') {
            const nameA = String(a.Name || '').toLowerCase();
            const nameB = String(b.Name || '').toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        }
        
        return direction === 'asc' ? comparison : -comparison;
    });
}

function applyFilters(data) {
    // --- MODIFIED: Added a filter to always exclude soft-deleted items ---
    let filteredData = data.filter(m => !m.is_deleted);

    if (filterQuery) {
        const lowerFilterQuery = filterQuery.toLowerCase();
        filteredData = filteredData.filter(movie => {
            if (!movie) return false;
            return (movie.Name && String(movie.Name).toLowerCase().includes(lowerFilterQuery)) ||
                   (movie.Year && String(movie.Year).toLowerCase().includes(lowerFilterQuery)) ||
                   (movie.Status && String(movie.Status).toLowerCase().includes(lowerFilterQuery)) ||
                   (movie.Genre && String(movie.Genre).toLowerCase().includes(lowerFilterQuery));
        });
    }
    
    if (activeFilters.category !== 'all') filteredData = filteredData.filter(m => m.Category === activeFilters.category);
    if (activeFilters.country !== 'all') filteredData = filteredData.filter(m => m.Country === activeFilters.country);
    if (activeFilters.language !== 'all') filteredData = filteredData.filter(m => m.Language === activeFilters.language);
    
    if (activeFilters.genres.length > 0) {
        filteredData = filteredData.filter(m => {
            if (!m.Genre) return false;
            const movieGenres = m.Genre.split(',').map(g => g.trim());
            if (activeFilters.genreLogic === 'AND') {
                return activeFilters.genres.every(filterGenre => movieGenres.includes(filterGenre));
            } else { // OR logic
                return activeFilters.genres.some(filterGenre => movieGenres.includes(filterGenre));
            }
        });
    }

    return filteredData;
}

function renderMovieCards() {
    const cardContainer = document.getElementById('movieCardContainer');
    const initialMessage = document.getElementById('initialMessage');
    if (!cardContainer) { console.error("CRITICAL: movieCardContainer element not found."); return; }
    cardContainer.innerHTML = '';

    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array. Cannot render cards.");
        if (initialMessage) {
            initialMessage.style.display = 'block';
            initialMessage.innerHTML = '<p class="text-danger">Error: Movie data is corrupted.</p>';
        }
        return;
    }

    const filteredData = applyFilters(movieData);

    if (initialMessage) {
        initialMessage.style.display = (movieData.filter(m => !m.is_deleted).length === 0) ? 'block' : 'none';
    }

    if (filteredData.length === 0) {
        if (movieData.filter(m => !m.is_deleted).length > 0) {
            cardContainer.innerHTML = `<div class="col-12 text-center text-muted py-5"><h4>No Entries Found</h4><p>No entries match your current search and filter criteria.</p></div>`;
        }
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredData.forEach(movie => {
        if (!movie || !movie.id) return;

        const latestWatch = getLatestWatchInstance(movie.watchHistory || []);
        const posterUrl = movie['Poster URL'] || 'icons/placeholder-poster.png';
        const statusClass = `status-${String(movie.Status || 'unwatched').toLowerCase().replace(/\s+/g, '-')}`;
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.movieId = movie.id;
        if (isMultiSelectMode && selectedEntryIds.includes(movie.id)) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="card-thumbnail">
                <img data-src="${posterUrl}" alt="Poster for ${movie.Name}" class="lazy">
                <span class="card-year-badge">${movie.Year || 'N/A'}</span>
            </div>
            <div class="card-content">
                <div>
                    <div class="card-header">
                        <span class="card-title" title="${movie.Name}">${movie.Name || 'N/A'}</span>
                    </div>
                    <div class="card-info">
                        <span class="status-badge ${statusClass}">${movie.Status || 'N/A'}</span>
                        ${renderStars(movie.overallRating)}
                    </div>
                </div>
                <div class="card-footer">
                    <span class="card-last-watched">
                        <i class="fas fa-history" title="Last Watched"></i>
                        ${latestWatch && latestWatch.date ? new Date(latestWatch.date).toLocaleDateString() : 'N/A'}
                    </span>
                    <div class="card-actions">
                         <button class="btn btn-sm btn-outline-info btn-action view-btn" title="View Details" data-movie-id="${movie.id}"><i class="fas fa-eye"></i></button>
                         <button class="btn btn-sm btn-outline-primary btn-action edit-btn" title="Edit Entry" data-movie-id="${movie.id}"><i class="fas fa-edit"></i></button>
                         <button class="btn btn-sm btn-outline-danger btn-action delete-btn" title="Delete Entry" data-movie-id="${movie.id}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
        fragment.appendChild(card);
    });

    cardContainer.appendChild(fragment);

    cardContainer.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}
// END CHUNK: Main View Rendering 

// START CHUNK: Filter Modal UI
function populateFilterModalOptions() {
    const activeMovieData = movieData.filter(m => !m.is_deleted);
    const categories = [...new Set(activeMovieData.map(m => m.Category).filter(Boolean))].sort();
    const countries = [...new Set(activeMovieData.map(m => m.Country).filter(Boolean))].sort((a,b) => getCountryFullName(a).localeCompare(getCountryFullName(b)));
    const languages = [...new Set(activeMovieData.map(m => m.Language).filter(Boolean))].sort();

    const populateSelect = (elementId, options, allLabel) => {
        const select = document.getElementById(elementId);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = `<option value="all">${allLabel}</option>`;
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt;
            optionEl.textContent = elementId === 'filterCountry' ? getCountryFullName(opt) : opt;
            select.appendChild(optionEl);
        });
        select.value = currentValue;
    };

    populateSelect('filterCategory', categories, 'All Categories');
    populateSelect('filterCountry', countries, 'All Countries');
    populateSelect('filterLanguage', languages, 'All Languages');
    
    document.getElementById('filterCategory').value = activeFilters.category;
    document.getElementById('filterCountry').value = activeFilters.country;
    document.getElementById('filterLanguage').value = activeFilters.language;
    document.getElementById('sortColumn').value = currentSortColumn;
    document.getElementById('sortDirection').value = currentSortDirection;
    
    const genreLogicRadio = document.querySelector(`input[name="filterGenreLogic"][value="${activeFilters.genreLogic}"]`);
    if (genreLogicRadio) genreLogicRadio.checked = true;

    selectedFilterGenres = [...activeFilters.genres];
    renderFilterGenreTags();
    populateFilterGenreDropdown();
}

function resetFilters() {
    activeFilters = { category: 'all', country: 'all', language: 'all', genres: [], genreLogic: 'AND' };
    selectedFilterGenres = [];
    filterQuery = '';
    document.getElementById('filterInputNavbar').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';

    currentSortColumn = 'Name';
    currentSortDirection = 'asc';
    
    const form = document.getElementById('filterSortForm');
    if (form) form.reset();

    sortMovies(currentSortColumn, currentSortDirection);
    renderMovieCards();
    showToast("Filters Cleared", "Showing all entries.", "info");
}

function renderFilterGenreTags() {
    const container = document.getElementById('filterGenreContainer');
    const searchInput = document.getElementById('filterGenreSearchInput');
    if (!container || !searchInput) return;
    
    Array.from(container.children).forEach(child => {
        if (child.classList.contains('genre-tag')) container.removeChild(child);
    });

    selectedFilterGenres.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.textContent = genre;
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'close';
        closeBtn.innerHTML = '<span aria-hidden="true">×</span>';
        closeBtn.onclick = (e) => { e.stopPropagation(); removeFilterGenre(genre); };
        tag.appendChild(closeBtn);
        container.insertBefore(tag, searchInput);
    });
    
    searchInput.placeholder = selectedFilterGenres.length === 0 ? "Click to add genres..." : "";
}

function addFilterGenre(genre) {
    if (genre && !selectedFilterGenres.includes(genre)) {
        selectedFilterGenres.push(genre);
        selectedFilterGenres.sort();
        renderFilterGenreTags();
    }
}

function removeFilterGenre(genre) {
    selectedFilterGenres = selectedFilterGenres.filter(g => g !== genre);
    renderFilterGenreTags();
    const filterGenreItemsContainer = document.getElementById('filterGenreItemsContainer');
    if(filterGenreItemsContainer && filterGenreItemsContainer.classList.contains('show')) {
        populateFilterGenreDropdown();
    }
}

function populateFilterGenreDropdown() {
    const container = document.getElementById('filterGenreItemsContainer');
    const searchInput = document.getElementById('filterGenreSearchInput');
    if (!container || !searchInput) return;
    container.innerHTML = '';
    const filterText = searchInput.value.toLowerCase().trim();
    
    const allKnownGenres = [...new Set(movieData.filter(m => !m.is_deleted).flatMap(m => m.Genre ? m.Genre.split(',').map(g => g.trim()) : []).filter(Boolean))];
    const availableGenres = [...new Set([...UNIQUE_ALL_GENRES, ...allKnownGenres])]
        .filter(g => 
            !selectedFilterGenres.includes(g) &&
            g.toLowerCase().includes(filterText)
        ).sort();
    
    if (availableGenres.length === 0 && filterText) {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action py-1 text-success';
        item.innerHTML = `<i class="fas fa-plus-circle mr-2"></i> Add filter genre: "${filterText}"`;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            addFilterGenre(filterText);
            searchInput.value = '';
            populateFilterGenreDropdown();
            searchInput.focus();
        });
        container.appendChild(item);
    } else {
        availableGenres.forEach(genre => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action py-1';
            item.textContent = genre;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                addFilterGenre(genre);
                searchInput.value = '';
                populateFilterGenreDropdown();
                searchInput.focus();
            });
            container.appendChild(item);
        });
    }
}
// END CHUNK: Filter Modal UI

/* ui.js */

// START CHUNK: Modal Preparation and Display Logic
window.prepareAddModal = function() {
    const entryModalLabel = document.querySelector('#entryModal .modal-title');
    const entryForm = document.getElementById('entryForm');
    if (entryModalLabel) entryModalLabel.textContent = 'Add New Entry';
    if (entryForm) { entryForm.reset(); entryForm._tempTmdbData = {}; }
    document.getElementById('editEntryId').value = '';
    document.getElementById('tmdbId').value = '';
    document.getElementById('tmdbMediaType').value = '';
    document.getElementById('currentWatchHistory').value = '[]';
    const tmdbResultsEl = document.getElementById('tmdbSearchResults');
    if (tmdbResultsEl) { tmdbResultsEl.innerHTML = ''; tmdbResultsEl.style.display = 'none'; }
    formFieldsGlob.relatedEntriesNames.value = '';
    formFieldsGlob.relatedEntriesSuggestions.innerHTML = ''; formFieldsGlob.relatedEntriesSuggestions.style.display = 'none';
    formFieldsGlob.tmdbSearchYear.value = '';
    selectedGenres = []; renderGenreTags();
    document.getElementById('genreSearchInput').value = '';
    populateGenreDropdown();
    document.getElementById('genreItemsContainer').classList.remove('show');
    renderWatchHistoryUI([]); closeWatchInstanceForm(); toggleConditionalFields();
    $('#entryModal').modal('show');
    $('#entryModal').one('shown.bs.modal', () => formFieldsGlob.name.focus());
}

window.prepareEditModal = function(id) {
    const movie = movieData.find(m => m && m.id === id);
    if (!movie) { showToast("Error", "Entry not found for editing.", "error"); return; }
    const entryModalLabel = document.querySelector('#entryModal .modal-title');
    const entryForm = document.getElementById('entryForm');
    if (entryModalLabel) entryModalLabel.textContent = `Edit: ${movie.Name || 'Entry'}`;
    if (entryForm) entryForm.reset();
    document.getElementById('editEntryId').value = movie.id;

    formFieldsGlob.name.value = movie.Name || ''; formFieldsGlob.category.value = movie.Category || 'Movie';
    formFieldsGlob.status.value = movie.Status || 'To Watch';
    formFieldsGlob.recommendation.value = movie.Recommendation || ''; formFieldsGlob.overallRating.value = movie.overallRating || '';
    formFieldsGlob.personalRecommendation.value = movie.personalRecommendation || ''; formFieldsGlob.language.value = movie.Language || '';
    formFieldsGlob.seasonsCompleted.value = movie.seasonsCompleted || '';
    formFieldsGlob.currentSeasonEpisodesWatched.value = movie.currentSeasonEpisodesWatched || '';
    formFieldsGlob.year.value = movie.Year || ''; formFieldsGlob.country.value = movie.Country || '';
    formFieldsGlob.description.value = movie.Description || ''; formFieldsGlob.posterUrl.value = movie['Poster URL'] || '';
    formFieldsGlob.tmdbSearchYear.value = '';
    
    if (movie.Category === 'Series' && typeof movie.runtime === 'object' && movie.runtime) {
        formFieldsGlob.runtimeSeriesSeasons.value = movie.runtime.seasons || '';
        formFieldsGlob.runtimeSeriesEpisodes.value = movie.runtime.episodes || '';
        formFieldsGlob.runtimeSeriesAvgEp.value = movie.runtime.episode_run_time || '';
    } else if (typeof movie.runtime === 'number') {
        formFieldsGlob.runtimeMovie.value = movie.runtime;
    }
    
    const relatedNames = (movie.relatedEntries || []).map(relatedId => movieData.find(m => m && m.id === relatedId)?.Name).filter(Boolean).join(', ');
    formFieldsGlob.relatedEntriesNames.value = relatedNames;
    
    document.getElementById('tmdbId').value = movie.tmdbId || '';
    document.getElementById('tmdbMediaType').value = movie.tmdbMediaType || '';
    
    if (entryForm) {
        entryForm._tempTmdbData = { 
            keywords: movie.keywords || [], full_cast: movie.full_cast || [], director_info: movie.director_info || null, 
            production_companies: movie.production_companies || [], tmdb_vote_average: movie.tmdb_vote_average, 
            tmdb_vote_count: movie.tmdb_vote_count, runtime: movie.runtime, tmdb_collection_id: movie.tmdb_collection_id, 
            tmdb_collection_name: movie.tmdb_collection_name
        };
    }
    
    formFieldsGlob.relatedEntriesSuggestions.innerHTML = ''; formFieldsGlob.relatedEntriesSuggestions.style.display = 'none';
    selectedGenres = movie.Genre ? String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean) : [];
    renderGenreTags();
    document.getElementById('genreSearchInput').value = '';
    populateGenreDropdown();
    document.getElementById('genreItemsContainer').classList.remove('show');
    document.getElementById('currentWatchHistory').value = JSON.stringify(movie.watchHistory || []);
    renderWatchHistoryUI(movie.watchHistory || []); closeWatchInstanceForm();
    const tmdbResultsEl = document.getElementById('tmdbSearchResults'); if (tmdbResultsEl) { tmdbResultsEl.innerHTML = ''; tmdbResultsEl.style.display = 'none'; }
    toggleConditionalFields(); $('#entryModal').modal('show');
}

window.showDeleteConfirmationModal = function(id = null) {
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

window.openDetailsModal = async function(id = null, tmdbObject = null) {
    showLoading("Loading details...");
    try {
        let sourceData, isLocalEntry, fullDetails;

        if (id) {
            sourceData = movieData.find(m => m && m.id === id);
            isLocalEntry = true;
            if (!sourceData) {
                showToast("Error", "Entry details not found.", "error");
                return;
            }
            fullDetails = sourceData;
        } else if (tmdbObject) {
            sourceData = tmdbObject;
            isLocalEntry = false;
            fullDetails = await callTmdbApiDirect(`/${sourceData.media_type}/${sourceData.id}`, { append_to_response: 'keywords,credits,collection' });
            if (!fullDetails) {
                 showToast("Error", "Could not fetch full TMDB details.", "error");
                 return;
            }
        } else {
            showToast("Error", "No entry specified to view.", "error");
            return;
        }

        const displayObject = {
            name: fullDetails.Name || fullDetails.title || fullDetails.name || 'Details',
            year: fullDetails.Year || (fullDetails.release_date || fullDetails.first_air_date || '').substring(0, 4) || 'N/A',
            description: fullDetails.Description || fullDetails.overview || 'N/A',
            posterUrl: fullDetails['Poster URL'] || (fullDetails.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${fullDetails.poster_path}` : null),
            category: fullDetails.Category || (fullDetails.media_type === 'tv' ? 'Series' : 'Movie'),
            genre: fullDetails.Genre || (fullDetails.genres || []).map(g => g.name).join(', ') || 'N/A',
            language: fullDetails.Language || (fullDetails.spoken_languages || []).map(l => l.english_name).join(', ') || 'N/A',
            country: fullDetails.Country ? getCountryFullName(fullDetails.Country) : (fullDetails.production_countries || []).map(c => c.name).join(', ') || 'N/A',
            status: isLocalEntry ? fullDetails.Status : 'Not in Library',
            overallRating: isLocalEntry ? fullDetails.overallRating : null,
            recommendation: isLocalEntry ? fullDetails.Recommendation : null,
            personalRecommendation: isLocalEntry ? fullDetails.personalRecommendation : null,
            lastModifiedDate: isLocalEntry ? (fullDetails.lastModifiedDate ? new Date(fullDetails.lastModifiedDate).toLocaleString() : 'N/A') : null,
            tmdbVoteAvg: fullDetails.tmdb_vote_average || fullDetails.vote_average,
            tmdbVoteCount: fullDetails.tmdb_vote_count || fullDetails.vote_count,
            keywords: fullDetails.keywords?.keywords || fullDetails.keywords?.results || fullDetails.keywords || [],
            director: fullDetails.director_info || fullDetails.credits?.crew?.find(c => c.job === 'Director'),
            cast: fullDetails.full_cast || fullDetails.credits?.cast || [],
            watchHistory: isLocalEntry ? fullDetails.watchHistory : [],
            seasonsCompleted: isLocalEntry ? fullDetails.seasonsCompleted : null,
            currentSeasonEpisodesWatched: isLocalEntry ? fullDetails.currentSeasonEpisodesWatched : null,
            runtimeData: fullDetails.runtime,
            relatedEntries: isLocalEntry ? fullDetails.relatedEntries : [] // Added for the fix
        };

        const setText = (selector, text) => { const el = document.querySelector(selector); if (el) el.textContent = text || 'N/A'; };
        const setHtml = (selector, html) => { const el = document.querySelector(selector); if (el) el.innerHTML = html || 'N/A'; };
        const toggle = (selector, condition) => $(selector).toggle(!!condition);

        $('#detailsModal .modal-title').text(displayObject.name);
        
        if (displayObject.posterUrl) {
            $('#detailsPoster').attr('src', displayObject.posterUrl).removeClass('d-none');
            $('#noPosterMessage').addClass('d-none');
        } else {
            $('#detailsPoster').addClass('d-none');
            $('#noPosterMessage').text('No Poster Available').removeClass('d-none');
        }

        setText('#detailsYear', displayObject.year);
        setText('#detailsDescription', displayObject.description);
        setText('#detailsCategory', displayObject.category);
        setText('#detailsGenre', displayObject.genre);
        setText('#detailsLanguage', displayObject.language);
        setText('#detailsCountry', displayObject.country);

        let runtimeText = 'N/A';
        if (typeof displayObject.runtimeData === 'number' && displayObject.runtimeData > 0) {
            const hours = Math.floor(displayObject.runtimeData / 60);
            const minutes = displayObject.runtimeData % 60;
            runtimeText = `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
        } else if (typeof displayObject.runtimeData === 'object' && displayObject.runtimeData !== null) {
            const { seasons, episodes, episode_run_time } = displayObject.runtimeData;
            const parts = [];
            if (seasons) parts.push(`<strong>Seasons:</strong> ${seasons}`);
            if (episodes) parts.push(`<strong>Episodes:</strong> ${episodes}`);
            if (episode_run_time) parts.push(`<strong>Avg. Ep:</strong> ${episode_run_time}m`);
            if (parts.length > 0) runtimeText = parts.join(' | ');
        }
        toggle('#detailsRuntimeGroup', runtimeText !== 'N/A');
        setHtml('#detailsRuntime', runtimeText);
        
        const hasTmdbRating = typeof displayObject.tmdbVoteAvg === 'number' && displayObject.tmdbVoteCount > 0;
        toggle('#detailsTMDBRatingGroup', hasTmdbRating);
        if (hasTmdbRating) {
            setHtml('#detailsTMDBRating', `${displayObject.tmdbVoteAvg.toFixed(1)}/10 <small>(${displayObject.tmdbVoteCount} votes)</small>`);
        }
        
        toggle('#detailsKeywords', displayObject.keywords.length > 0);
        if (displayObject.keywords.length > 0) {
            setText('#detailsKeywords', displayObject.keywords.map(k => k.name).join(', '));
        }

        const hasDirector = !!displayObject.director;
        const hasCast = displayObject.cast.length > 0;
        toggle('#detailsCastCrewSection, #castCrewSeparator', hasDirector || hasCast);
        if (hasDirector) {
            setHtml('#detailsDirector', `<a href="#" class="person-link" data-person-id="${displayObject.director.id}" data-person-name="${displayObject.director.name}">${displayObject.director.name}</a>`);
        } else {
            setText('#detailsDirector', 'N/A');
        }
        const castListEl = $('#detailsCastList').empty();
        if (hasCast) {
            displayObject.cast.slice(0, 10).forEach(member => {
                if (member && member.name) castListEl.append(`<div class="col-md-4 col-6 mb-2 person-list-item"><a href="#" class="person-link" data-person-id="${member.id}" data-person-name="${member.name}">${member.name}</a> <small class="text-muted">(${member.character || 'N/A'})</small></div>`);
            });
        }
        
        // --- START: RELATED ENTRIES FIX ---
        const manualLinksList = $('#detailsManualLinksList').empty();
        const hasManualLinks = isLocalEntry && displayObject.relatedEntries && displayObject.relatedEntries.length > 0;
        toggle('#detailsManualLinksGroup, #manualLinksSeparator', hasManualLinks);
        if (hasManualLinks) {
            displayObject.relatedEntries.forEach(relatedId => {
                const relatedMovie = movieData.find(m => m && m.id === relatedId);
                if (relatedMovie) {
                    manualLinksList.append(`<li><a href="#" class="related-item-link" data-movie-id="${relatedMovie.id}">${relatedMovie.Name}</a></li>`);
                }
            });
        }
        // --- END: RELATED ENTRIES FIX ---

        toggle('#detailsStatus', isLocalEntry);
        setText('#detailsStatus', displayObject.status);
        const isWatchedOrContinue = isLocalEntry && (displayObject.status === 'Watched' || displayObject.status === 'Continue');
        toggle('#detailsRecommendationGroup', isWatchedOrContinue && !!displayObject.recommendation);
        setText('#detailsRecommendation', displayObject.recommendation);
        toggle('#detailsOverallRatingGroup', isWatchedOrContinue && !!displayObject.overallRating);
        setHtml('#detailsOverallRating', renderStars(displayObject.overallRating));
        toggle('#detailsPersonalRecommendationGroup', isLocalEntry && !!displayObject.personalRecommendation);
        setText('#detailsPersonalRecommendation', displayObject.personalRecommendation);
        toggle('#detailsLastModified', isLocalEntry);
        setText('#detailsLastModified', displayObject.lastModifiedDate);

        const isContinueStatus = isLocalEntry && displayObject.status === 'Continue';
        toggle('#detailsContinueGroup', isContinueStatus);
        if (isContinueStatus) {
            setText('#detailsContinue', `Season ${(displayObject.seasonsCompleted || 0) + 1}, Ep ${displayObject.currentSeasonEpisodesWatched || '?'}`);
        }

        const whList = $('#detailsWatchHistoryList').empty();
        toggle('#detailsWatchHistorySection', isLocalEntry && displayObject.watchHistory.length > 0);
        if(isLocalEntry && displayObject.watchHistory.length > 0) {
            [...displayObject.watchHistory].filter(wh => wh && wh.date).sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(wh => {
                whList.append(`<li class="list-group-item p-2"><strong>${new Date(wh.date).toLocaleDateString()}</strong> - ${renderStars(wh.rating)}${wh.notes ? `<br><small class="text-muted">Notes: ${wh.notes}</small>` : ''}</li>`);
            });
        }
        
        toggle('#findSimilarBtn', isLocalEntry && !!fullDetails.tmdbId && isWatchedOrContinue);
        $('#findSimilarBtn').data('current-movie-id', isLocalEntry ? fullDetails.id : null);
        
        toggle('#detailsModalAddBtn', !isLocalEntry);
        $('#detailsModalAddBtn').data('tmdbObject', isLocalEntry ? null : sourceData);

        $('#detailsModal').modal('show');
    } catch (error) { 
        console.error("Error in openDetailsModal:", error); 
        showToast("Details Error", `Error: ${error.message}`, "error");
    } finally { 
        hideLoading(); 
    }
};

window.openPersonDetailsModal = async function(personId, personName) {
    showLoading(`Fetching details for ${personName}...`);
    try {
        const personDetailsModal = $('#personDetailsModal');
        personDetailsModal.find('.modal-title').text(personName || 'Person Details');
        $('#personBio').text('Loading bio...');
        $('#personFilmographyList').empty().append('<li class="text-muted small">Loading filmography...</li>');
        $('#viewTmdbPersonBtn').hide();

        personDetailsModal.modal('show');

        const personData = await fetchTmdbPersonDetails(personId);
        if (personData) {
            const profilePath = personData.profile_path || (personData.images?.profiles?.[0]?.file_path);
            if (profilePath) { $('#personProfileImage').attr('src', `${TMDB_IMAGE_BASE_URL}w185${profilePath}`).removeClass('d-none'); $('#noPersonImageMessage').addClass('d-none'); }
            else { $('#personProfileImage').addClass('d-none'); $('#noPersonImageMessage').text('No Profile Image').removeClass('d-none'); }
            
            $('#personBio').text(personData.biography || 'No biography from TMDB.');
            $('#viewTmdbPersonBtn').data('tmdb-url', `https://www.themoviedb.org/person/${personId}`).show();
            
            const filmographyList = $('#personFilmographyList').empty();
            const credits = [...(personData.combined_credits?.cast || []), ...(personData.combined_credits?.crew || [])];
            const uniqueCredits = Array.from(new Map(credits.map(c => [c.id, c])).values());
            const filmographyInLog = uniqueCredits.map(credit => {
                const loggedEntry = movieData.find(entry => entry && String(entry.tmdbId) === String(credit.id) && entry.tmdbMediaType === credit.media_type);
                if (loggedEntry) return { ...loggedEntry, role: credit.job || credit.character || 'N/A', release_year: (credit.release_date || credit.first_air_date)?.substring(0,4) || 'N/A' };
                return null;
            }).filter(Boolean).sort((a,b) => (b.release_year.localeCompare(a.release_year)));

            if (filmographyInLog.length > 0) filmographyInLog.forEach(entry => filmographyList.append(`<li><a href="#" class="person-filmography-link" data-movie-id="${entry.id}">${entry.Name} (${entry.release_year}) - <small class="text-muted">${entry.role}</small></a></li>`));
            else filmographyList.append('<li class="text-muted small">No entries with this person in your log.</li>');
        } else {
            $('#personBio').text('Could not fetch details.');
            $('#personFilmographyList').empty().append('<li class="text-muted small">Could not load filmography.</li>');
        }
    } catch (error) {
        console.error("Error in openPersonDetailsModal:", error);
        showToast("TMDB Person Error", `Could not fetch person details: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

window.prepareEraseDataModal = function(defaultScope = 'local') {
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

window.prepareBatchEditModal = function() {
    if (!isMultiSelectMode || selectedEntryIds.length === 0) { showToast("No Selection", "Select entries to batch edit.", "info"); return; }
    const batchEditForm = document.getElementById('batchEditForm');
    if (batchEditForm) {
        batchEditForm.reset();
        batchEditForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
    const batchEditCount = document.getElementById('batchEditCount');
    if (batchEditCount) batchEditCount.textContent = selectedEntryIds.length;
    $('#batchEditModal').modal('show');
}
// END CHUNK: Modal Preparation and Display Logic

// START CHUNK: Conditional Field Toggling
function toggleConditionalFields() {
    if (!formFieldsGlob || !formFieldsGlob.status) return;
    const status = formFieldsGlob.status.value;
    const category = formFieldsGlob.category.value;
    const isWatchedOrContinue = (status === 'Watched' || status === 'Continue');
    const isContinueSeries = (status === 'Continue' && category === 'Series');

    $('#seriesContinueGroup').toggle(isContinueSeries);
    $('#recommendationGroup, #overallRatingGroup, #watchHistorySection, #watchHistorySeparator').toggle(isWatchedOrContinue);

    const isSeries = category === 'Series';
    $('#movieRuntimeGroup').toggle(!isSeries);
    $('#seriesRuntimeGroup').toggle(isSeries);
}

function updateSyncButtonState() {
    if (typeof menuSyncDataBtn !== 'undefined' && menuSyncDataBtn) {
        const isLoggedIn = !!currentSupabaseUser;
        menuSyncDataBtn.disabled = !isLoggedIn;
        if (isLoggedIn) {
            menuSyncDataBtn.style.opacity = '1';
            menuSyncDataBtn.setAttribute('title', 'Sync data with the cloud');
        } else {
            menuSyncDataBtn.style.opacity = '0.5';
            menuSyncDataBtn.setAttribute('title', 'Log in to sync data');
        }
    }
}
// END CHUNK: Conditional Field Toggling

// START CHUNK: Download Details as PNG
function getGenreGradient(genre) {
    const primaryGenre = (genre || '').split(',')[0].trim().toLowerCase();
    const gradients = {
        'action': ['#ff4e50', '#f9d423'],
        'adventure': ['#2193b0', '#6dd5ed'],
        'comedy': ['#f9d423', '#96e6a1'],
        'drama': ['#3a6186', '#89253e'],
        'fantasy': ['#6a3093', '#a044ff'],
        'horror': ['#434343', '#cb2d3e'],
        'thriller': ['#2c3e50', '#bdc3c7'],
        'mystery': ['#3a6186', '#89253e'],
        'crime': ['#434343', '#2c3e50'],
        'romance': ['#e55d87', '#5fc3e4'],
        'science fiction': ['#141e30', '#243b55'],
        'animation': ['#5fc3e4', '#e55d87'],
        'documentary': ['#4ca1af', '#c4e0e5'],
        'default': ['#4b6cb7', '#182848']
    };
    return gradients[primaryGenre] || gradients['default'];
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' ');
    let line = '';
    let lineCount = 0;
    const maxLines = 2;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            if (lineCount >= maxLines - 1) {
                line = line.trim() + '...';
                context.fillText(line, x, y);
                return y + lineHeight;
            }
            context.fillText(line.trim(), x, y);
            line = words[n] + ' ';
            y += lineHeight;
            lineCount++;
        } else {
            line = testLine;
        }
    }
    context.fillText(line.trim(), x, y);
    return y + lineHeight;
}

function drawStarsOnCanvas(ctx, x, y, ratingString, size = 30) {
    const ratingValue = (ratingString.match(/fas fa-star/g) || []).length + (ratingString.match(/fa-star-half-alt/g) || []).length * 0.5;
    if (isNaN(ratingValue) || ratingValue === 0) return;

    for (let i = 0; i < 5; i++) {
        ctx.font = `900 ${size}px "Font Awesome 5 Free"`;
        const starChar = '\uf005';
        ctx.fillStyle = i < ratingValue ? '#FFD700' : 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(starChar, x + i * (size + 8), y);
    }
}

function showShareOptionsModal(blob, fileName) {
    $('#shareOptionsModal').remove();

    const file = new File([blob], fileName, { type: 'image/png' });
    const shareData = { files: [file], title: `Check out this movie!`, text: `Tracked with KeepMovizEZ` };
    const canShare = navigator.share && navigator.canShare && navigator.canShare(shareData);

    let modalBodyHtml = `
        <div class="text-center">
            <img src="${URL.createObjectURL(blob)}" class="img-fluid rounded mb-3" style="max-height: 300px;" alt="Image Preview">
        </div>
        <div class="d-grid gap-2">
            ${canShare ? '<button id="shareGeneratedImageBtn" class="btn btn-success btn-lg mb-2"><i class="fas fa-share-alt"></i> Share Image</button>' : ''}
            <button id="downloadGeneratedImageBtn" class="btn btn-primary btn-lg"><i class="fas fa-download"></i> Download PNG</button>
        </div>
    `;

    const modalHtml = `
        <div class="modal fade" id="shareOptionsModal" tabindex="-1" role="dialog">
          <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Image Generated</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              </div>
              <div class="modal-body">${modalBodyHtml}</div>
            </div>
          </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const shareModal = $('#shareOptionsModal');
    shareModal.modal('show');

    const downloadBtn = document.getElementById('downloadGeneratedImageBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Image Downloaded', `${fileName} has been saved.`, 'success');
            shareModal.modal('hide');
        });
    }

    if (canShare) {
        const shareBtn = document.getElementById('shareGeneratedImageBtn');
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    showToast('Share Failed', 'Could not share image. Try downloading it instead.', 'warning');
                }
            } finally {
                shareModal.modal('hide');
            }
        });
    }

    shareModal.on('hidden.bs.modal', function() { $(this).remove(); });
}

window.downloadDetailsAsPNG = async function() {
    const detailsModal = document.getElementById('detailsModal');
    if (!detailsModal) return;

    const modalTitle = detailsModal.querySelector('.modal-title').textContent;
    const posterImg = document.getElementById('detailsPoster');
    const posterSrc = posterImg && !posterImg.classList.contains('d-none') ? posterImg.src : null;

    const details = {
        name: modalTitle,
        genre: document.getElementById('detailsGenre')?.textContent || 'N/A',
        year: document.getElementById('detailsYear')?.textContent || 'N/A',
        runtime: document.getElementById('detailsRuntime')?.innerHTML.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'N/A',
        ratingHTML: document.getElementById('detailsOverallRating')?.innerHTML || '',
    };
    
    showLoading("Generating Shareable Image...");

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        const [color1, color2] = getGenreGradient(details.genre);
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.font = `bold 60px 'Poppins', Arial`;
        ctx.textAlign = 'center';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        const watermarkText = 'KeepMovizEZ';
        for (let y = -canvas.height; y < canvas.height * 1.5; y += 150) {
            for (let x = -canvas.width; x < canvas.width * 1.5; x += 400) {
                ctx.fillText(watermarkText, x, y);
            }
        }
        ctx.restore();

        let yOffset = 70;
        if (posterSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = () => { console.warn("Could not load poster image for canvas."); resolve(); };
                img.src = posterSrc.includes('?') ? posterSrc : posterSrc + '?not-from-cache-please';
            });

            if (img.complete && img.naturalHeight !== 0) {
                 const maxWidth = canvas.width * 0.45;
                const maxHeight = canvas.height * 0.55;
                let { width, height } = img;
                if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
                if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
                const posterX = (canvas.width - width) / 2;

                ctx.save();
                ctx.translate(posterX + width / 2, yOffset + height / 2);
                ctx.rotate(2 * Math.PI / 180);
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 40;
                ctx.shadowOffsetY = 15;
                roundRect(ctx, -width / 2 - 15, -height / 2 - 15, width + 30, height + 30, 25);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.drawImage(img, -width / 2, -height / 2, width, height);
                ctx.restore();
                yOffset += height + 70;
            } else { yOffset += 50; }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.font = `bold 72px 'Poppins', Arial`;
        yOffset = wrapText(ctx, details.name, canvas.width / 2, yOffset, canvas.width - 120, 80);
        
        ctx.font = `38px 'Poppins', Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        const infoLine = `🗓️ ${details.year}  •  🎬 ${details.genre.split(',')[0]}  •  ⏱️ ${details.runtime}`;
        ctx.fillText(infoLine, canvas.width / 2, yOffset + 30);
        yOffset += 130;

        if (details.ratingHTML && !details.ratingHTML.includes('N/A')) {
            const ratingBoxWidth = 450;
            const ratingBoxHeight = 150;
            const ratingBoxX = (canvas.width - ratingBoxWidth) / 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 15;
            roundRect(ctx, ratingBoxX, yOffset, ratingBoxWidth, ratingBoxHeight, 20);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.font = `32px 'Poppins', Arial`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('My Rating', canvas.width / 2, yOffset + 55);

            drawStarsOnCanvas(ctx, ratingBoxX + 95, yOffset + 115, details.ratingHTML, 48);
        }
        
        const safeName = details.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeName}_details.png`;

        canvas.toBlob( (blob) => {
            if (!blob) { showToast('Error', 'Could not create image blob.', 'error'); return; }
            showShareOptionsModal(blob, fileName);
        }, 'image/png');

    } catch (error) {
        console.error('Error generating PNG:', error);
        showToast('Download Error', `Failed to generate image: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
// END CHUNK: Download Details as PNG
