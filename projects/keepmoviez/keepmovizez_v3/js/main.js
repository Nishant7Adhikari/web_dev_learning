/* main.js */

function incrementLocalStorageCounter(key) {
    if (!key) return;
    let count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (count + 1).toString());
}

function recordUniqueDateForAchievement(key) {
    if (!key) return;
    const today = new Date().toISOString().slice(0, 10);
    let dates = [];
    try {
        dates = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(dates)) dates = [];
    } catch (e) {
        console.warn(`Could not parse localStorage key ${key} for unique dates, resetting. Error: ${e}`);
        dates = [];
    }

    if (!dates.includes(today)) {
        dates.push(today);
        // Optional: Limit array size to prevent excessive storage, e.g., last 365 days
        // if (dates.length > 365) dates = dates.slice(-365);
        localStorage.setItem(key, JSON.stringify(dates));
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeDOMElements === 'function') initializeDOMElements();
    else {
        document.body.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Critical Error: Application UI cannot be initialized. Please refresh or contact support.</p>';
        console.error("CRITICAL: initializeDOMElements function not found.");
        return;
    }
    showLoading("Loading application setup...");

    // --- Theme Setup ---
    const menuThemeToggleBtn = document.getElementById('menuThemeToggleBtn');
    const body = document.body;
    const LIGHT_THEME = 'light-theme';
    const DARK_THEME = 'dark-theme';
    const THEME_STORAGE_KEY = 'currentTheme';

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
        body.classList.add(savedTheme);
        if (menuThemeToggleBtn) {
            const themeIcon = menuThemeToggleBtn.querySelector('i');
            if (themeIcon) {
                if (savedTheme === DARK_THEME) themeIcon.classList.replace('fa-sun', 'fa-moon');
                else themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        }
    } else {
        body.classList.add(LIGHT_THEME);
        if (menuThemeToggleBtn) {
            const themeIcon = menuThemeToggleBtn.querySelector('i');
            if (themeIcon) themeIcon.classList.add('fa-sun');
        }
    }
    if (typeof initializeTableScrolling === 'function') initializeTableScrolling();


    // --- Off-Canvas Menu Logic ---
    const appMenu = document.getElementById('appMenu');
    const appMenuBackdrop = document.getElementById('appMenuBackdrop');
    const navbarToggler = document.querySelector('.navbar-toggler[data-target="#appMenu"]');
    const menuCloseButton = appMenu ? appMenu.querySelector('.offcanvas-header .close') : null;

    function openMenu() {
        if (appMenu && appMenuBackdrop) {
            appMenu.classList.add('show');
            appMenuBackdrop.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            const menuEmailEl = document.getElementById('menuLoggedInUserEmail');
            const menuOnlineStatusEl = document.getElementById('menuOnlineStatusIndicator');
            if (menuEmailEl) menuEmailEl.textContent = currentSupabaseUser?.email || 'Not Logged In';
            if (menuOnlineStatusEl) {
                const isOnline = navigator.onLine;
                menuOnlineStatusEl.textContent = isOnline ? 'Online' : 'Offline';
                menuOnlineStatusEl.classList.toggle('badge-success', isOnline);
                menuOnlineStatusEl.classList.toggle('badge-danger', !isOnline);
            }
        }
    }

    function closeMenu() {
        if (appMenu && appMenuBackdrop) {
            appMenu.classList.remove('show');
            appMenuBackdrop.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    if (navbarToggler) {
        navbarToggler.addEventListener('click', (e) => {
            e.stopPropagation(); openMenu();
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    }
    if (menuCloseButton) {
        menuCloseButton.addEventListener('click', () => {
            closeMenu(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    }
    if (appMenuBackdrop) {
        appMenuBackdrop.addEventListener('click', () => {
            closeMenu(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    }
    if (appMenu) {
        appMenu.querySelectorAll('[data-dismiss-menu="true"]').forEach(item => {
            item.addEventListener('click', closeMenu);
        });
    }

    if (menuThemeToggleBtn) {
        menuThemeToggleBtn.addEventListener('click', () => {
            let currentBgColor, targetThemeClass;
            const themeIcon = menuThemeToggleBtn.querySelector('i');

            if (body.classList.contains(DARK_THEME)) {
                 currentBgColor = getComputedStyle(body).getPropertyValue('--body-bg-gradient-start').trim();
                 body.classList.remove(DARK_THEME); body.classList.add(LIGHT_THEME);
                 targetThemeClass = LIGHT_THEME;
            } else {
                 currentBgColor = getComputedStyle(body).getPropertyValue('--body-bg-gradient-start').trim();
                 body.classList.remove(LIGHT_THEME); body.classList.add(DARK_THEME);
                 targetThemeClass = DARK_THEME;
            }

            if (window.themeTransitionOverlay) {
                themeTransitionOverlay.style.backgroundColor = currentBgColor;
                themeTransitionOverlay.classList.add('active');
                setTimeout(() => {
                    localStorage.setItem(THEME_STORAGE_KEY, targetThemeClass);
                    if (themeIcon) {
                        if (targetThemeClass === DARK_THEME) themeIcon.classList.replace('fa-sun', 'fa-moon');
                        else themeIcon.classList.replace('fa-moon', 'fa-sun');
                    }
                    const newTargetBgColor = getComputedStyle(document.body).getPropertyValue('--body-bg-gradient-start').trim();
                    themeTransitionOverlay.style.backgroundColor = newTargetBgColor;
                }, 50);
                setTimeout(() => themeTransitionOverlay.classList.remove('active'), 550);
            } else {
                 localStorage.setItem(THEME_STORAGE_KEY, targetThemeClass);
                 if (themeIcon) {
                    if (targetThemeClass === DARK_THEME) themeIcon.classList.replace('fa-sun', 'fa-moon');
                    else themeIcon.classList.replace('fa-moon', 'fa-sun');
                 }
            }
            closeMenu();
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    }

    const menuCsvFileUploader = document.getElementById('menuCsvFileUploader');
    if (menuCsvFileUploader) {
        menuCsvFileUploader.addEventListener('change', async (e) => {
            closeMenu(); showLoading("Processing uploaded file...");
            try { if (typeof handleFileUpload === 'function') await handleFileUpload(e); }
            catch (error) { console.error("Error during file upload handling:", error); showToast("Upload Error", `Error: ${error.message}`, "error"); }
            finally { hideLoading(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
        });
    }

    const entryForm = document.getElementById('entryForm');
    if (entryForm) entryForm.addEventListener('submit', async (e) => {
        try { if (typeof handleFormSubmit === 'function') await handleFormSubmit(e); }
        catch (error) { console.error("Error submitting form:", error); showToast("Save Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });

    const movieNameInput = document.getElementById('movieName');
    if (movieNameInput) {
        movieNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('searchTmdbBtn')?.click(); }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    }

    if (typeof $ !== 'undefined') {
        $('#addNewEntryBtn').on('click', () => { if (typeof prepareAddModal === 'function') prepareAddModal(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        $('#menuDownloadCsvBtn').on('click', () => { if (typeof generateAndDownloadFile === 'function') generateAndDownloadFile('csv'); closeMenu(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        $('#menuDownloadJsonBtn').on('click', () => { if (typeof generateAndDownloadFile === 'function') generateAndDownloadFile('json'); closeMenu(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        $('#menuEraseDataBtn').on('click', () => { if (typeof prepareEraseDataModal === 'function') prepareEraseDataModal(); closeMenu(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });

        $('button[data-target="#dailyRecommendationModal"]').on('click', async () => {
            // closeMenu(); // Already handled by data-dismiss-menu
            showLoading("Fetching Daily Recommendation...");
            try { if (typeof displayDailyRecommendationModal === 'function') await displayDailyRecommendationModal(); else console.warn("displayDailyRecommendationModal not defined."); }
            catch(e){ console.error(e); showToast("Error", "Could not load daily recommendation.", "error");}
            finally { hideLoading(); }
        });
        $('button[data-target="#personalizedSuggestionsModal"]').on('click', async () => {
            // closeMenu();
            showLoading("Fetching Personalized Suggestions...");
            try { if (typeof displayPersonalizedSuggestionsModal === 'function') await displayPersonalizedSuggestionsModal(); else console.warn("displayPersonalizedSuggestionsModal not defined."); }
            catch(e){ console.error(e); showToast("Error", "Could not load suggestions.", "error");}
            finally { hideLoading(); }
        });
        $('button[data-target="#achievementsModal"]').on('click', async () => {
            // closeMenu();
            showLoading("Loading Achievements...");
            try { if (typeof displayAchievementsModal === 'function') await displayAchievementsModal(); else console.warn("displayAchievementsModal not defined."); }
            catch(e){ console.error(e); showToast("Error", "Could not load achievements.", "error");}
            finally { hideLoading(); }
        });
        $('button[data-target="#chartsModal"]').on('click', async () => {
            // closeMenu();
            showLoading("Loading Charts...");
            try { if (typeof displayChartsModal === 'function') await displayChartsModal(); else console.warn("displayChartsModal not defined."); }
            catch(e){ console.error(e); showToast("Error", "Could not load charts.", "error");}
            finally { hideLoading(); }
        });
        $('button[data-target="#detailedStatsModal"]').on('click', async () => {
            // closeMenu();
            showLoading("Loading Detailed Statistics...");
            try { if (typeof displayDetailedStatsModal === 'function') await displayDetailedStatsModal(); else console.warn("displayDetailedStatsModal not defined."); }
            catch(e){ console.error(e); showToast("Error", "Could not load detailed stats.", "error");}
            finally { hideLoading(); }
        });

        $('#detailedStatsModal').on('show.bs.modal', async () => {
            // Content population now handled by displayDetailedStatsModal
            incrementLocalStorageCounter('stats_modal_opened_count_achievement'); // This is correct
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });

        $(document).on('click', '#detailsModal .person-link, #detailsModal .related-item-link', async function(e) { /* ...unchanged... */
            e.preventDefault();
            const movieId = $(this).data('movie-id');
            const personId = $(this).data('person-id');
            const personName = $(this).data('person-name');
            const currentDetailsModal = $('#detailsModal');
            try {
                if (movieId && typeof openDetailsModal === 'function') {
                    currentDetailsModal.modal('hide');
                    await new Promise(resolve => currentDetailsModal.one('hidden.bs.modal', resolve));
                    await openDetailsModal(movieId);
                } else if (personId && personName && typeof openPersonDetailsModal === 'function') {
                    currentDetailsModal.modal('hide');
                    await new Promise(resolve => currentDetailsModal.one('hidden.bs.modal', resolve));
                    await openPersonDetailsModal(personId, personName);
                }
            } catch (error) { console.error("Error opening modal from contextual link:", error); showToast("Navigation Error", "Could not open details.", "error"); hideLoading();
            } finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
        });
        $(document).on('click', '#personDetailsModal .person-filmography-link', async function(e) { /* ...unchanged... */
            e.preventDefault();
            const movieId = $(this).data('movie-id');
            const personModal = $('#personDetailsModal');
            try {
                if (movieId && typeof openDetailsModal === 'function') {
                    personModal.modal('hide');
                    await new Promise(resolve => personModal.one('hidden.bs.modal', resolve));
                    await openDetailsModal(movieId);
                }
            } catch (error) { console.error("Error opening filmography link:", error); showToast("Navigation Error", "Could not open details.", "error"); hideLoading();
            } finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
        });
        $(document).on('click', '#viewTmdbPersonBtn', function() { /* ...unchanged... */
            const tmdbUrl = $(this).data('tmdb-url');
            if (tmdbUrl) window.open(tmdbUrl, '_blank');
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        $(document).on('click', '#findSimilarBtn', function() { /* ...updated... */
            const movieId = $(this).data('current-movie-id');
            if (movieId && typeof displayPersonalizedSuggestionsModal === 'function') {
                $('#detailsModal').modal('hide');
                // The modal opening is now handled by the menu item for personalized suggestions
                // We just need to ensure displayPersonalizedSuggestionsModal is called with sourceMovieId
                $('#detailsModal').one('hidden.bs.modal', async () => {
                    showLoading("Finding similar entries...");
                    $('#personalizedSuggestionsModal').modal('show'); // Manually show the modal
                    // Wait for modal to be shown before populating, or ensure display func handles it
                    $('#personalizedSuggestionsModal').one('shown.bs.modal', async () => {
                         await displayPersonalizedSuggestionsModal(movieId); // Pass movieId
                         hideLoading();
                    });
                });
            } else {
                hideLoading(); // In case of no movieId or function
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        $(document).on('click', '.toast-header .dynamic-toast-buttons .btn-link', function() { /* ...unchanged... */
            const key = $(this).data('do-not-show-again-key');
            if (key && typeof DO_NOT_SHOW_AGAIN_KEYS !== 'undefined' && Object.values(DO_NOT_SHOW_AGAIN_KEYS).includes(key)) {
                localStorage.setItem(key, 'true'); $(this).closest('.toast').toast('hide');
                showToast("Preference Saved", "This notification type won't show again.", "info", 2500);
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        $('[data-toggle="tooltip"]').tooltip();

        // --- NEW/FIXED EVENT LISTENERS ---
        
        // FIX: Ensure tooltips (like "Why This?") are initialized when the suggestion modal is shown.
        $('#personalizedSuggestionsModal').on('shown.bs.modal', function () {
            $(this).find('[data-toggle="tooltip"]').tooltip('dispose').tooltip();
        });
        
        // FIX: Show achievement details in a toast when a badge is clicked.
        $(document).on('click', '.achievement-badge', function() {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            const badge = $(this);
            const name = badge.data('name');
            const description = badge.data('description');
            const progress = badge.data('progress');
            const threshold = badge.data('threshold');
            const isAchieved = badge.data('achieved') === true; // Strict boolean check
        
            const statusText = isAchieved ? `Status: Completed!` : `Status: ${progress} / ${threshold}`;
            // Uses <br> because utils.js showToast now supports HTML
            const fullMessage = `${description}<br><br><strong>${statusText}</strong>`;
            
            showToast(name, fullMessage, 'info', 50000); // 5 second toast
        });
        
        // FIX: Handle manual linking and delinking from the buttons in the details modal.
        $(document).on('click', '#detailsModal .link-btn, #detailsModal .delink-btn', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            const button = $(this);
            const currentMovieId = button.data('current-movie-id');
            const targetMovieId = button.data('target-movie-id');
            const action = button.hasClass('link-btn') ? 'link' : 'delink';
        
            if (currentMovieId && targetMovieId && typeof handleManualLinkAction === 'function') {
                await handleManualLinkAction(currentMovieId, targetMovieId, action);
            } else {
                console.error("Missing movie IDs or handler for link/delink action.", { currentMovieId, targetMovieId });
                showToast("Error", "Could not perform link/delink action.", "error");
            }
        });

    } else { console.warn("jQuery not loaded."); }

    const confirmEraseDataBtn = document.getElementById('confirmEraseDataBtn');
    if (confirmEraseDataBtn) confirmEraseDataBtn.addEventListener('click', async () => { /* ...unchanged... */
        try { if(typeof eraseAllData === 'function') await eraseAllData(); }
        catch (error) { console.error("Error during data erase confirmation:", error); showToast("Erase Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });
    const checkRepairDataBtn = document.getElementById('checkRepairDataBtn');
    if (checkRepairDataBtn) checkRepairDataBtn.addEventListener('click', async () => { /* ...unchanged... */
        try { if(typeof performDataCheckAndRepair === 'function') await performDataCheckAndRepair(); }
        catch (error) { console.error("Error during data check/repair:", error); showToast("Repair Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { $('#confirmEraseDataModal').modal('hide'); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });

    const filterInputNavbar = document.getElementById('filterInputNavbar');
    if (filterInputNavbar) {
        filterInputNavbar.addEventListener('input', debounce(e => {
            filterQuery = e.target.value.toLowerCase().trim();
            if (typeof renderTable === 'function') renderTable();
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }, 250));
    }

    if (formFieldsGlob && formFieldsGlob.status) {
        formFieldsGlob.status.addEventListener('change', () => { if (typeof toggleConditionalFields === 'function') toggleConditionalFields(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    }

    const searchTmdbBtn = document.getElementById('searchTmdbBtn');
    if (searchTmdbBtn) searchTmdbBtn.addEventListener('click', async () => { /* ...unchanged... */
        try { if (typeof fetchMovieInfoFromTmdb === 'function') await fetchMovieInfoFromTmdb(); }
        catch (error) { console.error("Error during TMDB search button click:", error); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });

    const genreInputContainerEl = document.getElementById('genreInputContainer'); /* ...unchanged listeners... */
    const genreDropdownEl = document.getElementById('genreDropdown');
    const genreSearchInputEl = document.getElementById('genreSearchInput');
    if (genreInputContainerEl && genreDropdownEl && genreSearchInputEl) {
        genreSearchInputEl.addEventListener('input', () => { if (typeof filterGenreDropdown === 'function') filterGenreDropdown(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        genreInputContainerEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.closest('.close')) return;
            genreDropdownEl.style.display = 'block'; genreInputContainerEl.classList.add('focus-within');
            if (typeof populateGenreDropdown === 'function') populateGenreDropdown(genreSearchInputEl.value);
            setTimeout(() => genreSearchInputEl.focus(), 0);
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        document.addEventListener('click', (e) => { if (genreDropdownEl.style.display === 'block' && !genreInputContainerEl.contains(e.target) && !genreDropdownEl.contains(e.target)) { genreDropdownEl.style.display = 'none'; genreInputContainerEl.classList.remove('focus-within'); } });
    }

    const relatedEntriesNamesInput = formFieldsGlob?.relatedEntriesNames; /* ...unchanged listeners... */
    const relatedEntriesSuggestionsContainer = formFieldsGlob?.relatedEntriesSuggestions;
    if (relatedEntriesNamesInput && relatedEntriesSuggestionsContainer) {
        relatedEntriesNamesInput.addEventListener('input', debounce(() => { if (typeof populateRelatedEntriesSuggestions === 'function') populateRelatedEntriesSuggestions(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }, 300));
        relatedEntriesNamesInput.addEventListener('focus', () => { if (typeof populateRelatedEntriesSuggestions === 'function') populateRelatedEntriesSuggestions(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        document.addEventListener('click', (e) => { if (relatedEntriesSuggestionsContainer.style.display === 'block' && !relatedEntriesNamesInput.contains(e.target) && !relatedEntriesSuggestionsContainer.contains(e.target)) { relatedEntriesSuggestionsContainer.style.display = 'none'; } });
    }

    const movieTableBody = document.getElementById('movieTableBody'); /* ...unchanged listeners... */
    if (movieTableBody) {
        movieTableBody.addEventListener('click', (event) => { if(typeof handleTableRowClick === 'function') handleTableRowClick(event); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        movieTableBody.addEventListener('mousedown', (event) => {if(typeof handleTableRowMouseDown === 'function') handleTableRowMouseDown(event); });
        movieTableBody.addEventListener('mouseup', (event) => {if(typeof handleTableRowMouseUp === 'function') handleTableRowMouseUp(event); });
        movieTableBody.addEventListener('touchstart', (event) => {if(typeof handleTableRowMouseDown === 'function') handleTableRowMouseDown(event); }, {passive: true});
        movieTableBody.addEventListener('touchend', (event) => {if(typeof handleTableRowMouseUp === 'function') handleTableRowMouseUp(event); });
        movieTableBody.addEventListener('touchmove', () => { if(longPressTimer) clearTimeout(longPressTimer); });
        movieTableBody.addEventListener('mouseover', (event) => {if(typeof handleTableRowHoverPrank === 'function') handleTableRowHoverPrank(event);});
    }

    document.querySelectorAll('.table th[data-column]').forEach(header => { /* ...unchanged... */
        header.addEventListener('click', function() {
            const column = this.dataset.column;
            if (typeof currentSortColumn !== 'undefined' && typeof sortMovies === 'function' && typeof renderTable === 'function') {
                if (currentSortColumn === column) currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                else { currentSortColumn = column; currentSortDirection = 'asc'; }
                sortMovies(currentSortColumn, currentSortDirection); renderTable();
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });
    });

    const toggleAddWatchBtn = document.getElementById('toggleAddWatchInstanceFormBtn'); /* ...unchanged listeners... */
    if (toggleAddWatchBtn) toggleAddWatchBtn.addEventListener('click', () => { if(typeof prepareAddWatchInstanceForm === 'function') prepareAddWatchInstanceForm(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    const saveWatchBtn = document.getElementById('saveWatchInstanceBtn');
    if (saveWatchBtn) saveWatchBtn.addEventListener('click', () => { if(typeof saveOrUpdateWatchInstance === 'function') saveOrUpdateWatchInstance(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    const cancelWatchBtn = document.getElementById('cancelWatchInstanceBtn');
    if (cancelWatchBtn) cancelWatchBtn.addEventListener('click', () => { if(typeof closeWatchInstanceForm === 'function') closeWatchInstanceForm(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    const watchHistoryListEl = document.getElementById('watchHistoryList');
    if (watchHistoryListEl) watchHistoryListEl.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-watch-btn'); const deleteBtn = e.target.closest('.delete-watch-btn');
        if (editBtn && editBtn.dataset.watchid && typeof prepareEditWatchInstanceForm === 'function') prepareEditWatchInstanceForm(editBtn.dataset.watchid);
        else if (deleteBtn && deleteBtn.dataset.watchid && typeof deleteWatchInstanceFromList === 'function') deleteWatchInstanceFromList(deleteBtn.dataset.watchid);
        if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
    });

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn'); /* ...unchanged... */
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', async () => {
        try { if (isMultiSelectMode && typeof performBatchDelete === 'function') await performBatchDelete(); else if (typeof performDeleteEntry === 'function') await performDeleteEntry(); }
        catch (error) { console.error("Error during delete confirmation:", error); showToast("Delete Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });
    const confirmDuplicateSaveBtn = document.getElementById('confirmDuplicateSaveBtn'); /* ...unchanged... */
    if (confirmDuplicateSaveBtn) confirmDuplicateSaveBtn.addEventListener('click', async () => {
        try { if (pendingEntryForConfirmation && typeof proceedWithEntrySave === 'function') { await proceedWithEntrySave(pendingEntryForConfirmation, pendingEditIdForConfirmation); $('#duplicateNameConfirmModal').modal('hide'); } }
        catch (error) { console.error("Error saving duplicate entry:", error); showToast("Save Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });
    const cancelDuplicateSaveBtn = document.getElementById('cancelDuplicateSaveBtn'); /* ...unchanged... */
    if (cancelDuplicateSaveBtn) cancelDuplicateSaveBtn.addEventListener('click', () => { pendingEntryForConfirmation = null; pendingEditIdForConfirmation = null; $('#duplicateNameConfirmModal').modal('hide'); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });

    const exportStatsPdfBtn = document.getElementById('exportStatsPdfBtn'); /* ...updated... */
    if(exportStatsPdfBtn) exportStatsPdfBtn.addEventListener('click', async () => {
        try { if (typeof exportStatsAsPdf === 'function') await exportStatsAsPdf('#detailedStatsModal .modal-content', 'KeepMovieZ_Detailed_Stats.pdf'); else console.warn("exportStatsAsPdf function not defined."); }
        catch (error) { console.error("Error exporting PDF:", error); showToast("Export Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });

    const supabaseLoginBtn = document.getElementById('supabaseLoginBtn'); /* ...unchanged listeners... */
    const supabaseSignupBtn = document.getElementById('supabaseSignupBtn');
    const supabasePasswordResetBtn = document.getElementById('supabasePasswordResetBtn');
    const menuSupabaseLogoutBtn = document.getElementById('menuSupabaseLogoutBtn');
    if(supabaseLoginBtn) supabaseLoginBtn.addEventListener('click', async () => { const emailEl = document.getElementById('supabaseEmail'); const passwordEl = document.getElementById('supabasePassword'); if(emailEl && passwordEl && emailEl.value && passwordEl.value && typeof supabaseSignInUser === 'function') await supabaseSignInUser(emailEl.value, passwordEl.value); else showToast("Input Missing", "Email and Password required.", "warning"); });
    if(supabaseSignupBtn) supabaseSignupBtn.addEventListener('click', async () => { const emailEl = document.getElementById('supabaseEmail'); const passwordEl = document.getElementById('supabasePassword'); if(emailEl && passwordEl && emailEl.value && passwordEl.value && typeof supabaseSignUpUser === 'function') await supabaseSignUpUser(emailEl.value, passwordEl.value); else showToast("Input Missing", "Email and Password required.", "warning"); });
    if(supabasePasswordResetBtn) supabasePasswordResetBtn.addEventListener('click', async () => { const emailEl = document.getElementById('supabaseEmail'); if(emailEl && emailEl.value && typeof supabaseSendPasswordResetEmail === 'function') await supabaseSendPasswordResetEmail(emailEl.value); else showToast("Input Missing", "Email required for password reset.", "warning"); });
    if(menuSupabaseLogoutBtn) menuSupabaseLogoutBtn.addEventListener('click', async () => { if(typeof supabaseSignOutUser === 'function') { await supabaseSignOutUser(); closeMenu(); } });
    const authFormInputs = document.querySelectorAll('#supabaseAuthForm input[type="email"], #supabaseAuthForm input[type="password"]');
    authFormInputs.forEach(input => { input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('supabaseLoginBtn')?.click(); } }); });

    const menuSyncDataBtn = document.getElementById('menuSyncDataBtn');
    if(menuSyncDataBtn) menuSyncDataBtn.addEventListener('click', async () => {
        closeMenu(); if (!currentSupabaseUser) { showToast("Login Required", "Please log in to sync data.", "info"); return; }
        showToast("Sync Initiated", "Performing two-way sync with cloud...", "info");
        if(typeof comprehensiveSync === 'function') {
            const syncResult = await comprehensiveSync();
            if (syncResult && syncResult.success) incrementLocalStorageCounter('sync_count_achievement'); // Corrected: increment after successful sync
        }
    });

    const batchEditForm = document.getElementById('batchEditForm'); /* ...unchanged listeners... */
    if(batchEditForm) batchEditForm.addEventListener('submit', async (e) => {
        try { if(typeof handleBatchEditFormSubmit === 'function') await handleBatchEditFormSubmit(e); }
        catch (error) { console.error("Error batch edit form submit:", error); showToast("Batch Edit Error", `Failed: ${error.message}`, "error"); hideLoading(); }
        finally { if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }
    });
    const batchEditSelectedBtn = document.getElementById('batchEditSelectedBtn');
    if (batchEditSelectedBtn) batchEditSelectedBtn.addEventListener('click', () => { if(typeof prepareBatchEditModal === 'function') prepareBatchEditModal(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    const batchDeleteSelectedBtn = document.getElementById('batchDeleteSelectedBtn');
    if (batchDeleteSelectedBtn) batchDeleteSelectedBtn.addEventListener('click', () => { if(typeof showDeleteConfirmationModal === 'function') showDeleteConfirmationModal(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    const cancelMultiSelectBtn = document.getElementById('cancelMultiSelectBtn');
    if (cancelMultiSelectBtn) cancelMultiSelectBtn.addEventListener('click', () => { if(typeof disableMultiSelectMode === 'function') disableMultiSelectMode(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'input'].forEach(eventType =>
        document.addEventListener(eventType, () => {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            if (currentSupabaseUser && !isAppLocked) {
                 recordUniqueDateForAchievement('app_usage_dates_achievement'); // Corrected: function is defined at top
            }
        }, { passive: true })
    );

    const updateOnlineStatusDisplay = () => { /* ...unchanged... */
        const isOnline = navigator.onLine;
        const menuOnlineStatusEl = document.getElementById('menuOnlineStatusIndicator');
        if (menuOnlineStatusEl) { menuOnlineStatusEl.textContent = isOnline ? 'Online' : 'Offline'; menuOnlineStatusEl.classList.toggle('badge-success', isOnline); menuOnlineStatusEl.classList.toggle('badge-danger', !isOnline); }
    };
    window.addEventListener('online', async () => { /* ...unchanged, uses incrementLocalStorageCounter... */
        updateOnlineStatusDisplay(); showToast("Connection Restored", "You are back online.", "success", 3000);
        if (currentSupabaseUser && typeof comprehensiveSync === 'function') { console.log("Back online, attempting silent comprehensive sync."); const syncResult = await comprehensiveSync(true); if (syncResult && syncResult.success) incrementLocalStorageCounter('sync_count_achievement'); }
    });
    window.addEventListener('offline', () => { updateOnlineStatusDisplay(); showToast("Offline Mode", "No internet connection. Changes saved locally.", "warning", 5000); });
    updateOnlineStatusDisplay();

    if ('serviceWorker' in navigator) { /* ...unchanged... */
        window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').then(reg => console.log('SW registered.', reg.scope)).catch(err => console.log('SW reg failed: ', err)); });
    }

    if (typeof initAuth === 'function') initAuth();
    else { console.error("CRITICAL: initAuth function not found."); showLoading("Critical Error: App cannot start."); const authContainerEl = document.getElementById('authContainer'); if (authContainerEl) { authContainerEl.innerHTML = "<div class='auth-card text-center'><p class='text-danger lead'>Critical error. Refresh page.</p></div>"; authContainerEl.style.display = 'flex'; }}
});

// --- Multi-select Mode Functions --- (Unchanged)
function enableMultiSelectMode() { if (isMultiSelectMode) return; isMultiSelectMode = true; selectedEntryIds = []; if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI(); showToast("Multi-select Mode", "Long-press or click rows to select.", "info", 3000); }
window.disableMultiSelectMode = function() { if (!isMultiSelectMode) return; isMultiSelectMode = false; selectedEntryIds = []; if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI(); if (typeof renderTable === 'function') renderTable(); }
function toggleEntrySelection(entryId) { if (!isMultiSelectMode || !entryId) return; const index = selectedEntryIds.indexOf(entryId); if (index > -1) selectedEntryIds.splice(index, 1); else selectedEntryIds.push(entryId); if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI(); const row = document.querySelector(`#movieTableBody tr[data-movie-id="${entryId}"]`); if (row) row.classList.toggle('selected', selectedEntryIds.includes(entryId)); }
function updateMultiSelectUI() { const actionBar = document.getElementById('multiSelectActionsBar'); const addNewBtn = document.getElementById('addNewEntryBtn'); const countSpan = document.getElementById('multiSelectCount'); const bottomNav = document.getElementById('bottomNav'); if (!actionBar || !addNewBtn || !countSpan || !bottomNav) { console.warn("Multi-select UI elements not found."); return; } if (isMultiSelectMode) { actionBar.style.display = 'flex'; addNewBtn.style.display = 'none'; countSpan.textContent = `${selectedEntryIds.length} selected`; bottomNav.classList.remove('center-add-btn'); actionBar.querySelectorAll('button').forEach(btn => { if (btn.id !== 'cancelMultiSelectBtn') btn.disabled = selectedEntryIds.length === 0; }); } else { actionBar.style.display = 'none'; addNewBtn.style.display = 'flex'; countSpan.textContent = `0 selected`; bottomNav.classList.add('center-add-btn'); }}
function handleTableRowClick(event) { const targetRow = event.target.closest('tr'); if (!targetRow || !targetRow.dataset || !targetRow.dataset.movieId) return; const movieId = targetRow.dataset.movieId; if (isMultiSelectMode) { if (event.target.closest('.btn-action')) return; toggleEntrySelection(movieId); } else { const actionButton = event.target.closest('.btn-action'); if (actionButton) { if (actionButton.classList.contains('view-btn') && typeof openDetailsModal === 'function') openDetailsModal(movieId); else if (actionButton.classList.contains('edit-btn') && typeof prepareEditModal === 'function') prepareEditModal(movieId); else if (actionButton.classList.contains('delete-btn') && typeof showDeleteConfirmationModal === 'function') showDeleteConfirmationModal(movieId); else if (actionButton.classList.contains('watch-later-btn') && typeof markWatchLater === 'function') markWatchLater(movieId); else if (actionButton.classList.contains('mark-watched-btn') && typeof markEntryAsWatched === 'function') markEntryAsWatched(movieId); } else { if (typeof openDetailsModal === 'function') openDetailsModal(movieId); }}}
let touchstartX = 0; let touchstartY = 0; const SWIPE_THRESHOLD = 10;
function handleTableRowMouseDown(event) { const targetRow = event.target.closest('tr'); if (!targetRow || !targetRow.dataset || !targetRow.dataset.movieId || event.target.closest('button, a, input, select, textarea')) { if(longPressTimer) clearTimeout(longPressTimer); return; } if (event.type === 'touchstart') { touchstartX = event.changedTouches[0].screenX; touchstartY = event.changedTouches[0].screenY; } if (longPressTimer) clearTimeout(longPressTimer); longPressTimer = setTimeout(() => { if (!isMultiSelectMode) enableMultiSelectMode(); toggleEntrySelection(targetRow.dataset.movieId); longPressTimer = null; }, LONG_PRESS_DURATION); }
function handleTableRowMouseUp(event) { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; if (event.type === 'touchend') { const touchendX = event.changedTouches[0].screenX; const touchendY = event.changedTouches[0].screenY; if (Math.abs(touchendX - touchstartX) > SWIPE_THRESHOLD || Math.abs(touchendY - touchstartY) > SWIPE_THRESHOLD) return; } }}

// updateSyncButtonState function (ensure this is the primary one, or remove if duplicated in first.js)
// This version targets menu elements.
function updateSyncButtonState() {
    const menuSyncDataBtn = document.getElementById('menuSyncDataBtn');
    const menuSupabaseLogoutBtn = document.getElementById('menuSupabaseLogoutBtn');
    const menuLoggedInUserEmailSpan = document.getElementById('menuLoggedInUserEmail');
    const isLoggedInToSupabase = currentSupabaseUser !== null;

    if (menuSyncDataBtn) { menuSyncDataBtn.disabled = !isLoggedInToSupabase; menuSyncDataBtn.title = isLoggedInToSupabase ? "Sync with Cloud" : "Login to enable cloud sync"; }
    if (menuSupabaseLogoutBtn) { menuSupabaseLogoutBtn.style.display = isLoggedInToSupabase ? 'block' : 'none'; }
    if (menuLoggedInUserEmailSpan) {
         if (isLoggedInToSupabase && currentSupabaseUser && currentSupabaseUser.email) menuLoggedInUserEmailSpan.textContent = currentSupabaseUser.email;
         else menuLoggedInUserEmailSpan.textContent = 'Not Logged In';
    }
    if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI(); // Update multi-select bar based on login too if needed
}

async function markWatchLater(movieId) { /* ...unchanged... */
    const movieIndex = movieData.findIndex(m => m && m.id === movieId); if (movieIndex === -1) { showToast("Error", "Movie not found.", "error"); return; }
    const movie = movieData[movieIndex]; if (movie.Status !== 'To Watch') { showToast("Info", `"${movie.Name}" not 'To Watch'.`, "info"); return; }
    movie.Status = 'Continue'; movie['Continue Details'] = movie['Continue Details'] || 'Started Watching';
    const today = new Date().toISOString().slice(0, 10); const latestWatch = getLatestWatchInstance(movie.watchHistory);
    if (!latestWatch || new Date(latestWatch.date).toISOString().slice(0, 10) !== today) { const newWatchInstance = { watchId: generateUUID(), date: today, rating: '', notes: 'Quick started.' }; if (!Array.isArray(movie.watchHistory)) movie.watchHistory = []; movie.watchHistory.push(newWatchInstance); }
    else { if (!latestWatch.notes.includes('Quick started')) latestWatch.notes = (latestWatch.notes ? latestWatch.notes + "; " : "") + "Marked 'Continue'."; }
    movie.lastModifiedDate = new Date().toISOString(); if (currentSupabaseUser && !isAppLocked) recordUniqueDateForAchievement('app_usage_dates_achievement');
    showLoading(`Updating "${movie.Name}"...`);
    try { recalculateAndApplyAllRelationships(); if (currentSortColumn) sortMovies(currentSortColumn, currentSortDirection); renderTable(); await saveToIndexedDB(); showToast("Status Updated", `"${movie.Name}" is 'Continue Watching'.`, "success"); if (currentSupabaseUser) { const syncResult = await comprehensiveSync(true); if (syncResult && syncResult.success) incrementLocalStorageCounter('sync_count_achievement'); }}
    catch (error) { console.error("Error in markWatchLater:", error); showToast("Update Error", "Could not update.", "error"); } finally { hideLoading(); }
}
async function markEntryAsWatched(movieId) { /* ...unchanged... */
    const movieIndex = movieData.findIndex(m => m && m.id === movieId); if (movieIndex === -1) { showToast("Error", "Movie not found.", "error"); return; }
    const movie = movieData[movieIndex]; if (movie.Status === 'Watched') { showToast("Info", `"${movie.Name}" already 'Watched'.`, "info"); return; }
    movie.Status = 'Watched'; movie['Continue Details'] = '';
    const today = new Date().toISOString().slice(0, 10); let latestWatch = getLatestWatchInstance(movie.watchHistory);
    if (!latestWatch || new Date(latestWatch.date).toISOString().slice(0, 10) !== today) { const newWatchInstance = { watchId: generateUUID(), date: today, rating: movie.overallRating || '', notes: 'Quick marked Watched.' }; if (!Array.isArray(movie.watchHistory)) movie.watchHistory = []; movie.watchHistory.push(newWatchInstance); }
    else { if (!latestWatch.notes.includes('Quick marked Watched')) latestWatch.notes = (latestWatch.notes ? latestWatch.notes + "; " : "") + "Finished."; if (movie.overallRating && latestWatch.rating === '') latestWatch.rating = movie.overallRating; }
    movie.lastModifiedDate = new Date().toISOString(); if (currentSupabaseUser && !isAppLocked) recordUniqueDateForAchievement('app_usage_dates_achievement');
    showLoading(`Updating "${movie.Name}"...`);
    try { recalculateAndApplyAllRelationships(); if (currentSortColumn) sortMovies(currentSortColumn, currentSortDirection); renderTable(); await saveToIndexedDB(); showToast("Status Updated", `"${movie.Name}" is 'Watched'.`, "success"); if (currentSupabaseUser) { const syncResult = await comprehensiveSync(true); if (syncResult && syncResult.success) incrementLocalStorageCounter('sync_count_achievement'); }}
    catch (error) { console.error("Error in markEntryAsWatched:", error); showToast("Update Error", "Could not update.", "error"); } finally { hideLoading(); }
}
let lastFlickerTime = 0; const FLICKER_COOLDOWN = 20 * 1000;
function handleTableRowHoverPrank(event) { /* ...unchanged... */
    const targetCell = event.target.closest('td'); if (!targetCell || targetCell.cellIndex !== 0 || isMultiSelectMode) return;
    const now = Date.now(); if (now - lastFlickerTime < FLICKER_COOLDOWN) return;
    if (Math.random() * PRANK_TITLE_FLICKER_CHANCE < 1) {
        lastFlickerTime = now; const originalText = targetCell.textContent; let prankText = originalText; const lowerOriginal = originalText.toLowerCase();
        const pranks = { "godfather": "The Codfather", "star wars": "Jar Jar's Excellent Adventure", "matrix": "The Glitch In Time", "inception": "Dream A Little Dream", "pulp fiction": "Royale With Cheese", "interstellar": "Cornfield Maze Runner", "shrek": "Ogre The Top", "avengers": "Superhero Hangout" };
        for (const key in pranks) { if (lowerOriginal.includes(key)) { prankText = pranks[key]; break; } }
        if (prankText === originalText && originalText.length > 5) prankText = originalText.replace(/[aeiou]/gi, (m) => 'aeiouAEIOU'[(('aeiouAEIOU'.indexOf(m) + 1) % 5) + (m === m.toUpperCase() ? 5 : 0)]);
        if (prankText !== originalText) { targetCell.style.transition = 'opacity 0.05s ease-in-out, transform 0.1s ease-in-out'; const applyPrank = () => { targetCell.style.opacity = '0.7'; targetCell.style.transform = 'scale(1.02)'; targetCell.textContent = prankText; }; const revertPrank = () => { targetCell.style.opacity = '1'; targetCell.style.transform = 'scale(1)'; targetCell.textContent = originalText; }; applyPrank(); setTimeout(revertPrank, 150); setTimeout(() => { applyPrank(); setTimeout(revertPrank, 150); }, 350); }
    }
}
