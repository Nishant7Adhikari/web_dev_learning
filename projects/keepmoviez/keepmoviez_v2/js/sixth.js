// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeDOMElements === 'function') initializeDOMElements();
    else {
        document.body.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Critical Error: Application UI cannot be initialized. Please refresh or contact support.</p>';
        console.error("CRITICAL: initializeDOMElements function not found.");
        return;
    }
    showLoading("Loading application setup...");

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;
    const body = document.body;
    const LIGHT_THEME = 'light-theme';
    const DARK_THEME = 'dark-theme';
    const THEME_STORAGE_KEY = 'currentTheme';

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
        body.classList.add(savedTheme);
        if (themeIcon) {
            if (savedTheme === DARK_THEME) themeIcon.classList.replace('fa-sun', 'fa-moon');
            else themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    } else {
        body.classList.add(LIGHT_THEME);
        if (themeIcon) themeIcon.classList.add('fa-sun');
    }
    if (typeof initializeTableScrolling === 'function') initializeTableScrolling();

    // --- Helper function for achievement tracking ---
    function incrementLocalStorageCounter(key) {
        let count = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, (count + 1).toString());
    }

    function recordUniqueDateForAchievement(key) {
        const today = new Date().toISOString().slice(0, 10);
        let dates = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(dates)) dates = [];
        if (!dates.includes(today)) {
            dates.push(today);
            // Optional: Limit array size to prevent excessive storage, e.g., last 365 days
            // if (dates.length > 365) dates = dates.slice(-365);
            localStorage.setItem(key, JSON.stringify(dates));
        }
    }


    // --- Event Listeners (App features) ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            let currentBgColor, targetBgColor, targetThemeClass;
            const isDark = body.classList.contains(DARK_THEME);
            const computedStyle = getComputedStyle(body);
            const lightBg = computedStyle.getPropertyValue('--body-bg-gradient-start').trim() || "rgb(249, 249, 249)";
            const darkBg = computedStyle.getPropertyValue('--body-bg-gradient-start').trim() || "rgb(42, 42, 42)";

            if (document.body.classList.contains('dark-theme')) {
                 currentBgColor = getComputedStyle(document.body).getPropertyValue('--body-bg-gradient-start').trim();
                 document.body.classList.remove('dark-theme');
                 document.body.classList.add('light-theme');
                 targetBgColor = getComputedStyle(document.body).getPropertyValue('--body-bg-gradient-start').trim();
                 document.body.classList.remove('light-theme');
                 document.body.classList.add('dark-theme');
                 targetThemeClass = LIGHT_THEME;
            } else {
                 currentBgColor = getComputedStyle(document.body).getPropertyValue('--body-bg-gradient-start').trim();
                 document.body.classList.remove('light-theme');
                 document.body.classList.add('dark-theme');
                 targetBgColor = getComputedStyle(document.body).getPropertyValue('--body-bg-gradient-start').trim();
                 document.body.classList.remove('dark-theme');
                 document.body.classList.add('light-theme');
                 targetThemeClass = DARK_THEME;
            }


            if (window.themeTransitionOverlay) {
                themeTransitionOverlay.style.backgroundColor = currentBgColor;
                themeTransitionOverlay.classList.add('active');
                setTimeout(() => {
                    body.classList.remove(LIGHT_THEME, DARK_THEME); body.classList.add(targetThemeClass);
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
                 body.classList.remove(LIGHT_THEME, DARK_THEME); body.classList.add(targetThemeClass);
                 localStorage.setItem(THEME_STORAGE_KEY, targetThemeClass);
                 if (themeIcon) {
                    if (targetThemeClass === DARK_THEME) themeIcon.classList.replace('fa-sun', 'fa-moon');
                    else themeIcon.classList.replace('fa-moon', 'fa-sun');
                 }
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    }

    const csvFileUploader = document.getElementById('csvFileUploader');
    if (csvFileUploader) {
        csvFileUploader.addEventListener('change', async (e) => {
            showLoading("Processing uploaded file...");
            try {
                if (typeof handleFileUpload === 'function') await handleFileUpload(e);
            } catch (error) {
                console.error("Error during file upload handling:", error);
                showToast("Upload Error", `An unexpected error occurred: ${error.message}`, "error");
            } finally {
                hideLoading();
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });
        csvFileUploader.addEventListener('click', (e) => { if(e.target) e.target.value = null; if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    }

    const entryForm = document.getElementById('entryForm');
    if (entryForm) entryForm.addEventListener('submit', async (e) => {
        try {
            if (typeof handleFormSubmit === 'function') await handleFormSubmit(e);
        } catch (error) {
            console.error("Error during form submission:", error);
            showToast("Save Error", `Failed to save entry: ${error.message}`, "error");
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
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
        $('#downloadCsvActualBtn').on('click', () => { if (typeof generateAndDownloadFile === 'function') generateAndDownloadFile('csv'); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        $('#downloadJsonActualBtn').on('click', () => { if (typeof generateAndDownloadFile === 'function') generateAndDownloadFile('json'); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        $('#clearLocalStorageBtn').on('click', () => { if (typeof prepareEraseDataModal === 'function') prepareEraseDataModal(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });

        $('#statsModal').on('show.bs.modal', async () => {
            showLoading("Generating statistics...");
            try {
                if (typeof showStatisticsModal === 'function') {
                    await showStatisticsModal();
                    incrementLocalStorageCounter('stats_modal_opened_count_achievement'); // Track stats modal open
                }
            } catch (error) {
                console.error("Error showing statistics modal:", error);
                showToast("Stats Error", "Could not load statistics.", "error");
            } finally {
                hideLoading();
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });
        $('#statsTab a[data-toggle="tab"]').on('shown.bs.tab', async (e) => {
            const targetId = $(e.target).attr('id');
            showLoading("Loading tab content...");
            try {
                if (targetId === 'charts-tab' && typeof renderCharts === 'function' && typeof globalStatsData !== 'undefined') {
                    renderCharts(globalStatsData);
                } else if (targetId === 'recommendations-tab' && typeof renderRecommendationsContent === 'function') {
                    await renderRecommendationsContent();
                }
            } catch (error) {
                console.error("Error rendering tab content:", error);
                showToast("Tab Error", "Could not load tab content.", "error");
            } finally {
                hideLoading();
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });
        $(document).on('click', '#detailsModal .person-link, #detailsModal .related-item-link', async function(e) {
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
            } catch (error) {
                console.error("Error opening modal from contextual link:", error);
                showToast("Navigation Error", "Could not open details.", "error");
                hideLoading();
            } finally {
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });

        $(document).on('click', '#personDetailsModal .person-filmography-link', async function(e) {
            e.preventDefault();
            const movieId = $(this).data('movie-id');
            const personModal = $('#personDetailsModal');
            try {
                if (movieId && typeof openDetailsModal === 'function') {
                    personModal.modal('hide');
                    await new Promise(resolve => personModal.one('hidden.bs.modal', resolve));
                    await openDetailsModal(movieId);
                }
            } catch (error) {
                console.error("Error opening filmography link:", error);
                showToast("Navigation Error", "Could not open details.", "error");
                hideLoading();
            } finally {
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });


        $(document).on('click', '#viewTmdbPersonBtn', function() {
            const tmdbUrl = $(this).data('tmdb-url');
            if (tmdbUrl) window.open(tmdbUrl, '_blank');
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });

        $(document).on('click', '#findSimilarBtn', function() {
            const movieId = $(this).data('current-movie-id');
            if (movieId && typeof generatePersonalizedRecommendations === 'function') {
                showLoading("Finding similar entries...");
                $('#detailsModal').modal('hide');
                $('#statsModal').modal('show');
                $('#statsModal').one('shown.bs.modal', () => {
                    $('#recommendations-tab').tab('show');
                    hideLoading();
                });
            } else {
                hideLoading();
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });

        $(document).on('click', '.toast-header .dynamic-toast-buttons .btn-link', function() {
            const key = $(this).data('do-not-show-again-key');
            if (key && typeof DO_NOT_SHOW_AGAIN_KEYS !== 'undefined' && Object.values(DO_NOT_SHOW_AGAIN_KEYS).includes(key)) {
                localStorage.setItem(key, 'true'); $(this).closest('.toast').toast('hide');
                showToast("Preference Saved", "This notification type won't show again.", "info", 2500);
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        $('[data-toggle="tooltip"]').tooltip();

    } else { console.warn("jQuery not loaded. Some Bootstrap components or dynamic event listeners may not work as expected."); }


    const confirmEraseDataBtn = document.getElementById('confirmEraseDataBtn');
    if (confirmEraseDataBtn) confirmEraseDataBtn.addEventListener('click', async () => {
        try {
            if(typeof eraseAllData === 'function') await eraseAllData();
        } catch (error) {
            console.error("Error during data erase confirmation:", error);
            showToast("Erase Error", `Failed to erase: ${error.message}`, "error");
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
    });

    const checkRepairDataBtn = document.getElementById('checkRepairDataBtn');
    if (checkRepairDataBtn) checkRepairDataBtn.addEventListener('click', async () => {
        try {
            if(typeof performDataCheckAndRepair === 'function') await performDataCheckAndRepair();
        } catch (error) {
            console.error("Error during data check/repair:", error);
            showToast("Repair Error", `Failed: ${error.message}`, "error");
            hideLoading();
        } finally {
            $('#confirmEraseDataModal').modal('hide');
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
    });

    const filterInput = document.getElementById('filterInput');
    if (filterInput) {
        filterInput.addEventListener('input', debounce(e => {
            filterQuery = e.target.value.toLowerCase().trim();
            if (typeof renderTable === 'function') renderTable();
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }, 250));
    }

    if (formFieldsGlob && formFieldsGlob.status) {
        formFieldsGlob.status.addEventListener('change', () => { if (typeof toggleConditionalFields === 'function') toggleConditionalFields(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
    }

    const searchTmdbBtn = document.getElementById('searchTmdbBtn');
    if (searchTmdbBtn) searchTmdbBtn.addEventListener('click', async () => {
        try {
            if (typeof fetchMovieInfoFromTmdb === 'function') {
                await fetchMovieInfoFromTmdb();
            }
        } catch (error) {
            console.error("Error during TMDB search button click:", error);
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
    });


    const genreInputContainerEl = document.getElementById('genreInputContainer');
    const genreDropdownEl = document.getElementById('genreDropdown');
    const genreSearchInputEl = document.getElementById('genreSearchInput');
    if (genreInputContainerEl && genreDropdownEl && genreSearchInputEl) {
        genreSearchInputEl.addEventListener('input', () => { if (typeof filterGenreDropdown === 'function') filterGenreDropdown(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        genreInputContainerEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.closest('.close')) return;
            genreDropdownEl.style.display = 'block';
            genreInputContainerEl.classList.add('focus-within');
            if (typeof populateGenreDropdown === 'function') populateGenreDropdown(genreSearchInputEl.value);
            setTimeout(() => genreSearchInputEl.focus(), 0);
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        document.addEventListener('click', (e) => {
            if (genreDropdownEl.style.display === 'block' && !genreInputContainerEl.contains(e.target) && !genreDropdownEl.contains(e.target)) {
                genreDropdownEl.style.display = 'none';
                genreInputContainerEl.classList.remove('focus-within');
            }
        });
    }

    const relatedEntriesNamesInput = formFieldsGlob?.relatedEntriesNames;
    const relatedEntriesSuggestionsContainer = formFieldsGlob?.relatedEntriesSuggestions;
    if (relatedEntriesNamesInput && relatedEntriesSuggestionsContainer) {
        relatedEntriesNamesInput.addEventListener('input', debounce(() => { if (typeof populateRelatedEntriesSuggestions === 'function') populateRelatedEntriesSuggestions(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); }, 300));
        relatedEntriesNamesInput.addEventListener('focus', () => { if (typeof populateRelatedEntriesSuggestions === 'function') populateRelatedEntriesSuggestions(); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        document.addEventListener('click', (e) => {
            if (relatedEntriesSuggestionsContainer.style.display === 'block' && !relatedEntriesNamesInput.contains(e.target) && !relatedEntriesSuggestionsContainer.contains(e.target)) {
                relatedEntriesSuggestionsContainer.style.display = 'none';
            }
        });
    }

    const movieTableBody = document.getElementById('movieTableBody');
    if (movieTableBody) {
        movieTableBody.addEventListener('click', (event) => { if(typeof handleTableRowClick === 'function') handleTableRowClick(event); if (typeof resetInactivityTimer === 'function') resetInactivityTimer(); });
        movieTableBody.addEventListener('mousedown', (event) => {if(typeof handleTableRowMouseDown === 'function') handleTableRowMouseDown(event); });
        movieTableBody.addEventListener('mouseup', (event) => {if(typeof handleTableRowMouseUp === 'function') handleTableRowMouseUp(event); });
        movieTableBody.addEventListener('touchstart', (event) => {if(typeof handleTableRowMouseDown === 'function') handleTableRowMouseDown(event); }, {passive: true});
        movieTableBody.addEventListener('touchend', (event) => {if(typeof handleTableRowMouseUp === 'function') handleTableRowMouseUp(event); });
        movieTableBody.addEventListener('touchmove', () => { if(longPressTimer) clearTimeout(longPressTimer); });
        movieTableBody.addEventListener('mouseover', (event) => {if(typeof handleTableRowHoverPrank === 'function') handleTableRowHoverPrank(event);});
    }

    document.querySelectorAll('.table th[data-column]').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.column;
            if (typeof currentSortColumn !== 'undefined' && typeof sortMovies === 'function' && typeof renderTable === 'function') {
                if (currentSortColumn === column) currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                else { currentSortColumn = column; currentSortDirection = 'asc'; }
                sortMovies(currentSortColumn, currentSortDirection);
                renderTable();
                if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
            }
        });
    });

    const toggleAddWatchBtn = document.getElementById('toggleAddWatchInstanceFormBtn');
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

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', async () => {
        try {
            if (isMultiSelectMode && typeof performBatchDelete === 'function') await performBatchDelete();
            else if (typeof performDeleteEntry === 'function') await performDeleteEntry();
        } catch (error) {
            console.error("Error during delete confirmation:", error);
            showToast("Delete Error", `Failed to delete: ${error.message}`, "error");
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
    });
    const confirmDuplicateSaveBtn = document.getElementById('confirmDuplicateSaveBtn');
    if (confirmDuplicateSaveBtn) confirmDuplicateSaveBtn.addEventListener('click', async () => {
        try {
            if (pendingEntryForConfirmation && typeof proceedWithEntrySave === 'function') {
                await proceedWithEntrySave(pendingEntryForConfirmation, pendingEditIdForConfirmation);
                $('#duplicateNameConfirmModal').modal('hide');
            }
        } catch (error) {
            console.error("Error saving duplicate entry:", error);
            showToast("Save Error", `Failed: ${error.message}`, "error");
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
    });
    const cancelDuplicateSaveBtn = document.getElementById('cancelDuplicateSaveBtn');
    if (cancelDuplicateSaveBtn) cancelDuplicateSaveBtn.addEventListener('click', () => {
        pendingEntryForConfirmation = null; pendingEditIdForConfirmation = null;
        $('#duplicateNameConfirmModal').modal('hide'); if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
    });

    const exportStatsPdfBtn = document.getElementById('exportStatsPdfBtn');
    if(exportStatsPdfBtn) exportStatsPdfBtn.addEventListener('click', async () => {
        try {
            if (typeof exportStatsAsPdf === 'function') await exportStatsAsPdf();
        } catch (error) {
            console.error("Error exporting PDF:", error);
            showToast("Export Error", `Failed: ${error.message}`, "error");
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
    });


    const supabaseLoginBtn = document.getElementById('supabaseLoginBtn');
    const supabaseSignupBtn = document.getElementById('supabaseSignupBtn');
    const supabasePasswordResetBtn = document.getElementById('supabasePasswordResetBtn');
    const supabaseLogoutBtnMain = document.getElementById('supabaseLogoutBtnMain');

    if(supabaseLoginBtn) supabaseLoginBtn.addEventListener('click', async () => {
        const emailEl = document.getElementById('supabaseEmail'); const passwordEl = document.getElementById('supabasePassword');
        if(emailEl && passwordEl && emailEl.value && passwordEl.value && typeof supabaseSignInUser === 'function') await supabaseSignInUser(emailEl.value, passwordEl.value);
        else showToast("Input Missing", "Email and Password required.", "warning");
    });
    if(supabaseSignupBtn) supabaseSignupBtn.addEventListener('click', async () => {
        const emailEl = document.getElementById('supabaseEmail'); const passwordEl = document.getElementById('supabasePassword');
        if(emailEl && passwordEl && emailEl.value && passwordEl.value && typeof supabaseSignUpUser === 'function') await supabaseSignUpUser(emailEl.value, passwordEl.value);
        else showToast("Input Missing", "Email and Password required.", "warning");
    });
    if(supabasePasswordResetBtn) supabasePasswordResetBtn.addEventListener('click', async () => {
        const emailEl = document.getElementById('supabaseEmail');
        if(emailEl && emailEl.value && typeof supabaseSendPasswordResetEmail === 'function') await supabaseSendPasswordResetEmail(emailEl.value);
        else showToast("Input Missing", "Email required for password reset.", "warning");
    });
    if(supabaseLogoutBtnMain) supabaseLogoutBtnMain.addEventListener('click', async () => { if(typeof supabaseSignOutUser === 'function') await supabaseSignOutUser(); });

    const authFormInputs = document.querySelectorAll('#supabaseAuthForm input[type="email"], #supabaseAuthForm input[type="password"]');
    authFormInputs.forEach(input => {
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('supabaseLoginBtn')?.click(); } });
    });

    const syncDataBtn = document.getElementById('syncDataBtn');
    if(syncDataBtn) syncDataBtn.addEventListener('click', async () => {
        if (!currentSupabaseUser) { showToast("Login Required", "Please log in to sync data.", "info"); return; }
        showToast("Sync Initiated", "Performing two-way sync with cloud...", "info");
        if(typeof comprehensiveSync === 'function') {
            const syncResult = await comprehensiveSync();
            if (syncResult && syncResult.success) { // Assuming comprehensiveSync returns an object with a success flag
                incrementLocalStorageCounter('sync_count_achievement'); // Track sync count
            }
        }
    });

    const batchEditForm = document.getElementById('batchEditForm');
    if(batchEditForm) batchEditForm.addEventListener('submit', async (e) => {
        try {
            if(typeof handleBatchEditFormSubmit === 'function') await handleBatchEditFormSubmit(e);
        } catch (error) {
            console.error("Error during batch edit form submit:", error);
            showToast("Batch Edit Error", `Failed: ${error.message}`, "error");
            hideLoading();
        } finally {
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        }
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
            // Record app usage for active days achievement
            if (currentSupabaseUser && !isAppLocked) { // Only track if user is logged in and app is active
                 recordUniqueDateForAchievement('app_usage_dates_achievement');
            }
        }, { passive: true })
    );

    const updateOnlineStatus = async () => {
        const isOnline = navigator.onLine;
        if (onlineStatusIndicator) {
            onlineStatusIndicator.textContent = isOnline ? 'Online' : 'Offline';
            onlineStatusIndicator.classList.toggle('badge-success', isOnline);
            onlineStatusIndicator.classList.toggle('badge-danger', !isOnline);
        }
        if (isOnline) {
            showToast("Connection Restored", "You are back online.", "success", 3000);
            if (currentSupabaseUser && typeof comprehensiveSync === 'function') {
                console.log("Back online, attempting silent comprehensive sync.");
                const syncResult = await comprehensiveSync(true);
                if (syncResult && syncResult.success) {
                    incrementLocalStorageCounter('sync_count_achievement');
                }
            }
        } else {
            showToast("Offline Mode", "No internet connection. Changes will be saved locally.", "warning", 5000);
        }
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();


    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => console.log('PWA ServiceWorker registration successful, scope: ', registration.scope))
                .catch(error => console.log('PWA ServiceWorker registration failed: ', error));
        });
    }

    if (typeof initAuth === 'function') {
        initAuth();
    } else {
         console.error("CRITICAL: initAuth function not found. Application cannot start.");
         showLoading("Critical Error: App cannot start.");
         const authContainerEl = document.getElementById('authContainer');
         if (authContainerEl) {
             authContainerEl.innerHTML = "<div class='auth-card text-center'><p class='text-danger lead'>A critical error occurred preventing the app from starting. Please try refreshing the page. If the problem persists, contact support.</p></div>";
             authContainerEl.style.display = 'flex';
         }
    }
});

// --- Multi-select Mode Functions ---
function enableMultiSelectMode() {
    if (isMultiSelectMode) return;
    isMultiSelectMode = true;
    selectedEntryIds = [];
    if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI();
    showToast("Multi-select Mode", "Long-press or click rows to select for batch actions.", "info", 3000);
}

window.disableMultiSelectMode = function() {
    if (!isMultiSelectMode) return;
    isMultiSelectMode = false;
    selectedEntryIds = [];
    if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI();
    if (typeof renderTable === 'function') renderTable();
}

function toggleEntrySelection(entryId) {
    if (!isMultiSelectMode || !entryId) return;

    const index = selectedEntryIds.indexOf(entryId);
    if (index > -1) selectedEntryIds.splice(index, 1);
    else selectedEntryIds.push(entryId);

    if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI();
    const row = document.querySelector(`#movieTableBody tr[data-movie-id="${entryId}"]`);
    if (row) row.classList.toggle('selected', selectedEntryIds.includes(entryId));
}

function updateMultiSelectUI() {
    const actionBar = document.getElementById('multiSelectActionsBar');
    const addNewBtn = document.getElementById('addNewEntryBtn');
    const countSpan = document.getElementById('multiSelectCount');
    const bottomNav = document.getElementById('bottomNav');

    if (!actionBar || !addNewBtn || !countSpan || !bottomNav) {
        console.warn("Multi-select UI elements not found, cannot update UI state.");
        return;
    }

    if (isMultiSelectMode) {
        actionBar.style.display = 'flex';
        addNewBtn.style.display = 'none';
        countSpan.textContent = `${selectedEntryIds.length} selected`;
        bottomNav.classList.remove('center-add-btn');
        actionBar.querySelectorAll('button').forEach(btn => {
            if (btn.id !== 'cancelMultiSelectBtn') {
                btn.disabled = selectedEntryIds.length === 0;
            }
        });
    } else {
        actionBar.style.display = 'none';
        addNewBtn.style.display = 'flex';
        countSpan.textContent = `0 selected`;
        bottomNav.classList.add('center-add-btn');
    }
}


function handleTableRowClick(event) {
    const targetRow = event.target.closest('tr');
    if (!targetRow || !targetRow.dataset || !targetRow.dataset.movieId) return;

    const movieId = targetRow.dataset.movieId;

    if (isMultiSelectMode) {
        if (event.target.closest('.btn-action')) return;
        toggleEntrySelection(movieId);
    } else {
        const actionButton = event.target.closest('.btn-action');
        if (actionButton) {
            if (actionButton.classList.contains('view-btn') && typeof openDetailsModal === 'function') openDetailsModal(movieId);
            else if (actionButton.classList.contains('edit-btn') && typeof prepareEditModal === 'function') prepareEditModal(movieId);
            else if (actionButton.classList.contains('delete-btn') && typeof showDeleteConfirmationModal === 'function') showDeleteConfirmationModal(movieId);
            else if (actionButton.classList.contains('watch-later-btn') && typeof markWatchLater === 'function') markWatchLater(movieId);
            else if (actionButton.classList.contains('mark-watched-btn') && typeof markEntryAsWatched === 'function') markEntryAsWatched(movieId);
        } else {
            if (typeof openDetailsModal === 'function') openDetailsModal(movieId);
        }
    }
}

let touchstartX = 0;
let touchstartY = 0;
const SWIPE_THRESHOLD = 10;

function handleTableRowMouseDown(event) {
    const targetRow = event.target.closest('tr');
    if (!targetRow || !targetRow.dataset || !targetRow.dataset.movieId || event.target.closest('button, a, input, select, textarea')) {
        if(longPressTimer) clearTimeout(longPressTimer);
        return;
    }

    if (event.type === 'touchstart') {
        touchstartX = event.changedTouches[0].screenX;
        touchstartY = event.changedTouches[0].screenY;
    }

    if (longPressTimer) clearTimeout(longPressTimer);

    longPressTimer = setTimeout(() => {
        if (!isMultiSelectMode) {
            enableMultiSelectMode();
        }
        toggleEntrySelection(targetRow.dataset.movieId);
        longPressTimer = null;
    }, LONG_PRESS_DURATION);
}

function handleTableRowMouseUp(event) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        if (event.type === 'touchend') {
            const touchendX = event.changedTouches[0].screenX;
            const touchendY = event.changedTouches[0].screenY;
            if (Math.abs(touchendX - touchstartX) > SWIPE_THRESHOLD || Math.abs(touchendY - touchstartY) > SWIPE_THRESHOLD) {
                return;
            }
        }
    }
}


function updateSyncButtonState() {
    const syncDataBtn = document.getElementById('syncDataBtn');
    const supabaseLogoutBtnMain = document.getElementById('supabaseLogoutBtnMain');
    const loggedInUserEmailSpan = document.getElementById('loggedInUserEmail');

    const isLoggedInToSupabase = currentSupabaseUser !== null;

    if (syncDataBtn) {
        syncDataBtn.disabled = !isLoggedInToSupabase;
        syncDataBtn.title = isLoggedInToSupabase ? "Sync with Cloud" : "Login to enable cloud sync";
    }
    if (supabaseLogoutBtnMain) {
        supabaseLogoutBtnMain.style.display = isLoggedInToSupabase ? 'inline-block' : 'none';
    }
    if (loggedInUserEmailSpan) {
         if (isLoggedInToSupabase && currentSupabaseUser && currentSupabaseUser.email) {
            loggedInUserEmailSpan.textContent = currentSupabaseUser.email;
            loggedInUserEmailSpan.style.display = 'inline';
        } else {
            loggedInUserEmailSpan.textContent = '';
            loggedInUserEmailSpan.style.display = 'none';
        }
    }
    if (typeof updateMultiSelectUI === 'function') updateMultiSelectUI();
}


async function markWatchLater(movieId) {
    const movieIndex = movieData.findIndex(m => m && m.id === movieId);
    if (movieIndex === -1) { showToast("Error", "Movie not found to mark as 'Continue'.", "error"); return; }

    const movie = movieData[movieIndex];
    if (movie.Status !== 'To Watch') {
        showToast("Info", `"${movie.Name}" is already past 'To Watch' status.`, "info");
        return;
    }

    movie.Status = 'Continue';
    movie['Continue Details'] = movie['Continue Details'] || 'Started Watching';

    const today = new Date().toISOString().slice(0, 10);
    const newWatchInstance = { watchId: generateUUID(), date: today, rating: '', notes: 'Quick started watching via action button.' };
    if (!Array.isArray(movie.watchHistory)) movie.watchHistory = [];
    movie.watchHistory.push(newWatchInstance);
    movie.lastModifiedDate = new Date().toISOString();

    // Record app usage for active days achievement
    if (currentSupabaseUser && !isAppLocked) {
         recordUniqueDateForAchievement('app_usage_dates_achievement');
    }

    showLoading(`Updating "${movie.Name}"...`);
    try {
        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
        if (typeof renderTable === 'function') renderTable();
        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        showToast("Status Updated", `"${movie.Name}" is now 'Continue Watching'.`, "success");
        if (currentSupabaseUser && typeof comprehensiveSync === 'function') {
            const syncResult = await comprehensiveSync(true);
            if (syncResult && syncResult.success) incrementLocalStorageCounter('sync_count_achievement');
        }
    } catch (error) {
        console.error("Error in markWatchLater:", error);
        showToast("Update Error", "Could not update entry.", "error");
    } finally {
        hideLoading();
    }
}

async function markEntryAsWatched(movieId) {
    const movieIndex = movieData.findIndex(m => m && m.id === movieId);
    if (movieIndex === -1) { showToast("Error", "Movie not found to mark as 'Watched'.", "error"); return; }

    const movie = movieData[movieIndex];
    if (movie.Status === 'Watched') {
        showToast("Info", `"${movie.Name}" is already marked as 'Watched'.`, "info");
        return;
    }

    movie.Status = 'Watched';
    movie['Continue Details'] = '';

    const today = new Date().toISOString().slice(0, 10);
    const latestWatch = typeof getLatestWatchInstance === 'function' ? getLatestWatchInstance(movie.watchHistory) : null;
    if (!latestWatch || latestWatch.date !== today) {
        const newWatchInstance = { watchId: generateUUID(), date: today, rating: movie.overallRating || '', notes: 'Quick marked as Watched via action button.' };
        if (!Array.isArray(movie.watchHistory)) movie.watchHistory = [];
        movie.watchHistory.push(newWatchInstance);
    } else if (latestWatch && !latestWatch.notes.includes('Quick marked as Watched')) {
        latestWatch.notes = (latestWatch.notes ? latestWatch.notes + "; " : "") + "Finished watching.";
    }
    movie.lastModifiedDate = new Date().toISOString();

    // Record app usage for active days achievement
    if (currentSupabaseUser && !isAppLocked) {
        recordUniqueDateForAchievement('app_usage_dates_achievement');
    }


    showLoading(`Updating "${movie.Name}"...`);
    try {
        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
        if (typeof renderTable === 'function') renderTable();
        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        showToast("Status Updated", `"${movie.Name}" is now 'Watched'.`, "success");
        if (currentSupabaseUser && typeof comprehensiveSync === 'function') {
             const syncResult = await comprehensiveSync(true);
             if (syncResult && syncResult.success) incrementLocalStorageCounter('sync_count_achievement');
        }
    } catch (error) {
        console.error("Error in markEntryAsWatched:", error);
        showToast("Update Error", "Could not update entry.", "error");
    } finally {
        hideLoading();
    }
}

let lastFlickerTime = 0;
const FLICKER_COOLDOWN = 20 * 1000;

function handleTableRowHoverPrank(event) {
    const targetCell = event.target.closest('td');
    if (!targetCell || targetCell.cellIndex !== 0 || isMultiSelectMode) return;

    const now = Date.now();
    if (now - lastFlickerTime < FLICKER_COOLDOWN) return;

    if (Math.random() * PRANK_TITLE_FLICKER_CHANCE < 1) {
        lastFlickerTime = now;
        const originalText = targetCell.textContent;
        let prankText = originalText;
        const lowerOriginal = originalText.toLowerCase();

        const pranks = { "godfather": "The Codfather", "star wars": "Jar Jar's Excellent Adventure", "matrix": "The Glitch In Time", "inception": "Dream A Little Dream", "pulp fiction": "Royale With Cheese", "interstellar": "Cornfield Maze Runner", "shrek": "Ogre The Top", "avengers": "Superhero Hangout" };
        for (const key in pranks) { if (lowerOriginal.includes(key)) { prankText = pranks[key]; break; } }

        if (prankText === originalText && originalText.length > 5) {
            prankText = originalText.replace(/[aeiou]/gi, (m) => 'aeiouAEIOU'[(('aeiouAEIOU'.indexOf(m) + 1) % 5) + (m === m.toUpperCase() ? 5 : 0)]);
        }

        if (prankText !== originalText) {
            targetCell.style.transition = 'opacity 0.05s ease-in-out, transform 0.1s ease-in-out';
            const applyPrank = () => { targetCell.style.opacity = '0.7'; targetCell.style.transform = 'scale(1.02)'; targetCell.textContent = prankText; };
            const revertPrank = () => { targetCell.style.opacity = '1'; targetCell.style.transform = 'scale(1)'; targetCell.textContent = originalText; };
            applyPrank(); setTimeout(revertPrank, 150);
            setTimeout(() => { applyPrank(); setTimeout(revertPrank, 150); }, 350);
        }
    }
}