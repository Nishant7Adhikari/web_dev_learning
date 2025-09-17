// --- START OF FILE supabase.js ---

// --- Supabase Sync Helper Functions
function localEntryToSupabaseFormat(localEntry, userId) {
    if (!localEntry || !localEntry.id || !userId) { console.error("Invalid input to localEntryToSupabaseFormat", { localEntry, userId }); return null; }
    let lastModified = localEntry.lastModifiedDate || new Date().toISOString();
    try { const dateObj = new Date(lastModified); if (isNaN(dateObj.getTime())) throw new Error(`Invalid date: ${lastModified}`); lastModified = dateObj.toISOString(); }
    catch (e) { console.warn(`Invalid lastModifiedDate for ${localEntry.id}, using current. Original: ${localEntry.lastModifiedDate}. Error: ${e.message}`); lastModified = new Date().toISOString(); }
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    const watchHistoryWithUUIDs = (localEntry.watchHistory || []).map(wh => {
        if (!wh || typeof wh !== 'object') return null;
        const ratingValue = (wh.rating !== null && wh.rating !== undefined && String(wh.rating).trim() !== '') ? parseFloat(wh.rating) : null;
        return { ...wh, watchId: (wh.watchId && uuidRegex.test(wh.watchId)) ? wh.watchId : generateUUID(), rating: isNaN(ratingValue) ? null : ratingValue };
    }).filter(Boolean);
    const parseNumeric = (value, isFloat = false) => { if (value === null || value === undefined || String(value).trim() === '') return null; const num = isFloat ? parseFloat(value) : parseInt(value, 10); return isNaN(num) ? null : num; };
    const supabaseRow = {
        id: localEntry.id, user_id: userId, name: localEntry.Name || 'Untitled Entry', category: localEntry.Category || 'Movie', genre: localEntry.Genre || '', status: localEntry.Status || 'To Watch',
        continue_details: localEntry['Continue Details'] || null, recommendation: localEntry.Recommendation || null, overall_rating: parseNumeric(localEntry.overallRating, true),
        personal_recommendation: localEntry.personalRecommendation || null, language: localEntry.Language || null, year: parseNumeric(localEntry.Year), country: localEntry.Country || null,
        description: localEntry.Description || null, poster_url: localEntry['Poster URL'] || null, watch_history: watchHistoryWithUUIDs,
        related_entries: Array.isArray(localEntry.relatedEntries) ? localEntry.relatedEntries : [], do_not_recommend_daily: localEntry.doNotRecommendDaily || false,
        last_modified_date: lastModified, tmdb_id: parseNumeric(localEntry.tmdbId), tmdb_media_type: localEntry.tmdbMediaType || null,
        keywords: Array.isArray(localEntry.keywords) ? localEntry.keywords : [], tmdb_collection_id: parseNumeric(localEntry.tmdb_collection_id),
        tmdb_collection_name: localEntry.tmdb_collection_name || null, director_info: localEntry.director_info || null,
        full_cast: Array.isArray(localEntry.full_cast) ? localEntry.full_cast : [], production_companies: Array.isArray(localEntry.production_companies) ? localEntry.production_companies : [],
        tmdb_vote_average: parseNumeric(localEntry.tmdb_vote_average, true), tmdb_vote_count: parseNumeric(localEntry.tmdb_vote_count), runtime: parseNumeric(localEntry.runtime)
    };
    return supabaseRow;
}

function supabaseEntryToLocalFormat(supabaseEntry) {
    if (!supabaseEntry || !supabaseEntry.id) { console.error("Invalid Supabase entry to supabaseEntryToLocalFormat.", supabaseEntry); return null; }
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    const watchHistoryWithUUIDs = (supabaseEntry.watch_history || []).map(wh => {
        if (!wh || typeof wh !== 'object') return null;
        return { ...wh, watchId: (wh.watchId && uuidRegex.test(wh.watchId)) ? wh.watchId : generateUUID(), rating: (wh.rating !== null && wh.rating !== undefined) ? String(wh.rating) : '' };
    }).filter(Boolean);
    const formatNumericToString = (value) => (value !== null && value !== undefined) ? String(value) : '';
    return {
        id: supabaseEntry.id, Name: supabaseEntry.name || 'Untitled (from Cloud)', Category: supabaseEntry.category || 'Movie', Genre: supabaseEntry.genre || '', Status: supabaseEntry.status || 'To Watch',
        'Continue Details': supabaseEntry.continue_details || '', Recommendation: supabaseEntry.recommendation || '', overallRating: formatNumericToString(supabaseEntry.overall_rating),
        personalRecommendation: supabaseEntry.personal_recommendation || '', Language: supabaseEntry.language || '', Year: formatNumericToString(supabaseEntry.year),
        Country: supabaseEntry.country || '', Description: supabaseEntry.description || '', 'Poster URL': supabaseEntry.poster_url || '',
        watchHistory: watchHistoryWithUUIDs, relatedEntries: Array.isArray(supabaseEntry.related_entries) ? supabaseEntry.related_entries : [],
        doNotRecommendDaily: supabaseEntry.do_not_recommend_daily || false, lastModifiedDate: supabaseEntry.last_modified_date ? new Date(supabaseEntry.last_modified_date).toISOString() : new Date(0).toISOString(),
        tmdbId: formatNumericToString(supabaseEntry.tmdb_id), tmdbMediaType: supabaseEntry.tmdb_media_type || null,
        keywords: Array.isArray(supabaseEntry.keywords) ? supabaseEntry.keywords : [],
        tmdb_collection_id: supabaseEntry.tmdb_collection_id !== null ? supabaseEntry.tmdb_collection_id : null,
        tmdb_collection_name: supabaseEntry.tmdb_collection_name || null, director_info: supabaseEntry.director_info || null,
        full_cast: Array.isArray(supabaseEntry.full_cast) ? supabaseEntry.full_cast : [],
        production_companies: Array.isArray(supabaseEntry.production_companies) ? supabaseEntry.production_companies : [],
        tmdb_vote_average: supabaseEntry.tmdb_vote_average !== null ? parseFloat(supabaseEntry.tmdb_vote_average) : null,
        tmdb_vote_count: supabaseEntry.tmdb_vote_count !== null ? parseInt(supabaseEntry.tmdb_vote_count) : null,
        runtime: supabaseEntry.runtime !== null ? parseInt(supabaseEntry.runtime) : null
    };
}

function getComparableEntryString(entry) {
    if (!entry || typeof entry !== 'object') return JSON.stringify(entry);
    const tempEntry = JSON.parse(JSON.stringify(entry)); delete tempEntry.lastModifiedDate; delete tempEntry.source;
    if (Array.isArray(tempEntry.watchHistory)) { tempEntry.watchHistory.sort((a, b) => { const dateA = new Date(a.date || 0).getTime(); const dateB = new Date(b.date || 0).getTime(); if (dateA !== dateB) return dateA - dateB; return String(a.notes || '').localeCompare(String(b.notes || '')); }); }
    if (Array.isArray(tempEntry.full_cast)) { tempEntry.full_cast.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name || '').localeCompare(String(b.name || ''))); }
    if (Array.isArray(tempEntry.keywords)) { tempEntry.keywords.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))); }
    if (Array.isArray(tempEntry.production_companies)) { tempEntry.production_companies.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))); }
    if (Array.isArray(tempEntry.relatedEntries)) { tempEntry.relatedEntries.sort(); }
    const canonicalizeObject = (obj) => { if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj; const sortedObj = {}; Object.keys(obj).sort().forEach(key => { sortedObj[key] = canonicalizeObject(obj[key]); }); return sortedObj; };
    if (tempEntry.director_info) tempEntry.director_info = canonicalizeObject(tempEntry.director_info);
    const sortedKeys = Object.keys(tempEntry).sort(); const canonicalObject = {};
    for (const key of sortedKeys) { canonicalObject[key] = tempEntry[key]; }
    return JSON.stringify(canonicalObject);
}

// --- Core Sync Functions ---
async function comprehensiveSync(silent = false) {
    if (!window.supabaseClient || !currentSupabaseUser) {
        if (!silent) showToast("Not Logged In", "Please log in to sync data.", "error");
        return { success: false, error: "Not logged in" };
    }
    if (!silent) showLoading("Syncing data (Comprehensive)...");
    try {
        const { data: remoteEntriesRaw, error: fetchError } = await window.supabaseClient.from('movie_entries').select('*').eq('user_id', currentSupabaseUser.id);
        if (fetchError) { console.error("Sync: Fetch cloud data failed:", fetchError); throw new Error(`Sync: Fetch cloud data failed: ${fetchError.message} (Code: ${fetchError.code})`);}
        const remoteEntries = remoteEntriesRaw.map(supabaseEntryToLocalFormat).filter(Boolean);
        const originalLocalMovieDataForComparison = JSON.parse(JSON.stringify(movieData));
        const mergedDataMap = new Map(); const localChangesToPushSet = new Set();
        let localDataWasUpdatedByPullDirectly = false;

        originalLocalMovieDataForComparison.forEach(localEntry => { if (!localEntry || !localEntry.id) return; const lmd = localEntry.lastModifiedDate ? new Date(localEntry.lastModifiedDate).toISOString() : new Date(0).toISOString(); mergedDataMap.set(localEntry.id, { ...localEntry, lastModifiedDate: lmd }); });
        remoteEntries.forEach(remoteEntry => {
            if (!remoteEntry || !remoteEntry.id) return;
            const entryInMap = mergedDataMap.get(remoteEntry.id); const remoteLMDTime = new Date(remoteEntry.lastModifiedDate || 0).getTime();
            if (entryInMap) {
                const mapEntryLMDTime = new Date(entryInMap.lastModifiedDate || 0).getTime();
                const mapEntryContentString = getComparableEntryString(entryInMap); const remoteContentString = getComparableEntryString(remoteEntry);
                const isContentDifferent = mapEntryContentString !== remoteContentString;
                if (remoteLMDTime > mapEntryLMDTime) { mergedDataMap.set(remoteEntry.id, { ...remoteEntry }); localDataWasUpdatedByPullDirectly = true; }
                else if (mapEntryLMDTime > remoteLMDTime) { localChangesToPushSet.add(entryInMap.id); }
                else { if (isContentDifferent) { console.warn(`Sync CONFLICT (ID: ${remoteEntry.id}, Name: "${entryInMap.Name || 'N/A'}"): Timestamps identical, content differs. Prioritizing current local/merged for push.`); localChangesToPushSet.add(entryInMap.id); }}
            } else { mergedDataMap.set(remoteEntry.id, { ...remoteEntry }); localDataWasUpdatedByPullDirectly = true; }
        });
        originalLocalMovieDataForComparison.forEach(localOriginal => { if (!localOriginal || !localOriginal.id) return; if (!remoteEntries.some(re => re && re.id === localOriginal.id)) { localChangesToPushSet.add(localOriginal.id); if (!mergedDataMap.has(localOriginal.id)) mergedDataMap.set(localOriginal.id, { ...localOriginal }); }});
        const finalMergedMovieData = Array.from(mergedDataMap.values());
        const sortedFinal = JSON.parse(JSON.stringify(finalMergedMovieData)).sort((a,b) => (a.id || "").localeCompare(b.id || ""));
        const sortedOriginalLocalAtStart = JSON.parse(JSON.stringify(originalLocalMovieDataForComparison)).sort((a,b) => (a.id || "").localeCompare(b.id || ""));
        let localMovieDataArrayChanged = false;
        if (JSON.stringify(sortedFinal) !== JSON.stringify(sortedOriginalLocalAtStart)) { movieData = finalMergedMovieData; localMovieDataArrayChanged = true; }
        if (localMovieDataArrayChanged) {
            if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
            if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); else { currentSortColumn = 'Name'; currentSortDirection = 'asc'; if(typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); }
            if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
            if (!silent && typeof renderTable === 'function') renderTable();
            if (!silent) showToast("Local Data Updated", "Local cache updated from cloud or merge.", "info");
        }
        const entriesToUpsertToSupabase = [];
        localChangesToPushSet.forEach(idToPush => { const entry = mergedDataMap.get(idToPush); if (entry) { const supabaseFormattedEntry = localEntryToSupabaseFormat(entry, currentSupabaseUser.id); if (supabaseFormattedEntry) entriesToUpsertToSupabase.push(supabaseFormattedEntry); }});
        if (entriesToUpsertToSupabase.length > 0) {
            if (!silent) showLoading(`Pushing ${entriesToUpsertToSupabase.length} changes to cloud...`);
            const CHUNK_SIZE_UPSERT = 50;
            for (let i = 0; i < entriesToUpsertToSupabase.length; i += CHUNK_SIZE_UPSERT) {
                const chunk = entriesToUpsertToSupabase.slice(i, i + CHUNK_SIZE_UPSERT);
                const { error: upsertError } = await window.supabaseClient.from('movie_entries').upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
                if (upsertError) { console.error("Supabase upsert error:", upsertError, "Chunk sample keys:", chunk[0] ? Object.keys(chunk[0]) : "N/A"); let detailedMessage = `Sync: Cloud update error: ${upsertError.message} (Code: ${upsertError.code}).`; if (upsertError.details) detailedMessage += ` Details: ${upsertError.details}.`; if (String(upsertError.message).toLowerCase().includes("column") && String(upsertError.message).toLowerCase().includes("does not exist")) { detailedMessage += " CRITICAL SCHEMA MISMATCH: Ensure all columns exist in 'movie_entries' table with correct data types."; } throw new Error(detailedMessage); }
            }
            if (!silent) showToast("Cloud Synced", `${entriesToUpsertToSupabase.length} entries synced to cloud.`, "success");
        }
        if (!silent && !localMovieDataArrayChanged && entriesToUpsertToSupabase.length === 0) { showToast("All Synced", "Data up-to-date locally and in cloud.", "info"); }
        return { success: true, pushed: entriesToUpsertToSupabase.length, pulledOrUpdatedLocally: localMovieDataArrayChanged };
    } catch (error) {
        console.error("Error during comprehensiveSync:", error);
        if (!silent) showToast("Sync Failed", `${error.message}`, "error", 10000);
        return { success: false, error: error.message };
    } finally {
        if (!silent) hideLoading();
        if (typeof renderTable === 'function') renderTable();
    }
}

async function syncDataFromSupabase(isInitialLoad = false, silent = false) {
    if (!window.supabaseClient || !currentSupabaseUser) { if (!isInitialLoad && !silent) showToast("Not Logged In", "Please log in to fetch cloud data.", "info"); return false; }
    if (!isInitialLoad && !silent) showLoading("Fetching data from cloud...");
    try {
        const { data: remoteEntriesRaw, error } = await window.supabaseClient.from('movie_entries').select('*').eq('user_id', currentSupabaseUser.id);
        if (error) { console.error("Fetch from Supabase error:", error); throw new Error(`Could not fetch data: ${error.message} (Code: ${error.code})`); }
        const remoteEntries = remoteEntriesRaw.map(supabaseEntryToLocalFormat).filter(Boolean);
        let changesMadeToLocalData = false;
        if (isInitialLoad && movieData.length === 0) {
            movieData = remoteEntries; changesMadeToLocalData = remoteEntries.length > 0;
            if (!silent && remoteEntries.length > 0) showToast("Data Loaded", "Data loaded from cloud.", "success");
            else if (!silent && remoteEntries.length === 0) showToast("No Cloud Data", "Cloud account is empty.", "info");
        } else {
            const mergedMap = new Map(); movieData.forEach(le => { if(le && le.id) mergedMap.set(le.id, le); });
            remoteEntries.forEach(re => {
                if (!re || !re.id) return; const localVersion = mergedMap.get(re.id);
                if (localVersion) {
                    const localLMD = new Date(localVersion.lastModifiedDate || 0).getTime(); const remoteLMD = new Date(re.lastModifiedDate || 0).getTime();
                    const localContent = getComparableEntryString(localVersion); const remoteContent = getComparableEntryString(re);
                    if (remoteLMD > localLMD || (remoteLMD === localLMD && localContent !== remoteContent)) mergedMap.set(re.id, re);
                } else mergedMap.set(re.id, re);
            });
            const newLocalData = Array.from(mergedMap.values());
            const oldLocalSortedString = JSON.stringify([...movieData].sort((a,b)=>(a.id||"").localeCompare(b.id||"")));
            const newLocalSortedString = JSON.stringify([...newLocalData].sort((a,b)=>(a.id||"").localeCompare(b.id||"")));
            if(oldLocalSortedString !== newLocalSortedString){ movieData = newLocalData; changesMadeToLocalData = true; if (!silent) showToast("Data Synced", "Local cache updated from cloud.", "success"); }
            else { if (!silent && !isInitialLoad) showToast("Up to Date", "Local cache already up-to-date.", "info"); }
        }
        if (changesMadeToLocalData || (isInitialLoad && movieData.length > 0)) {
            if(typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
            if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); else { currentSortColumn = 'Name'; currentSortDirection = 'asc'; if(typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); }
            if(typeof saveToIndexedDB === 'function') await saveToIndexedDB();
            if(typeof renderTable === 'function') renderTable();
        }
        return true;
    } catch (error) {
        console.error("Error syncing from Supabase:", error);
        if (!isInitialLoad && !silent) showToast("Sync Failed", `From Cloud: ${error.message}`, "error", 7000);
        return false;
    } finally { if (!isInitialLoad && !silent) hideLoading(); }
}


// --- Authentication Functions ---
// Relies on global: supabaseClient, currentSupabaseUser, supabaseSession, authContainer, appContent,
// showLoading, hideLoading, showToast, movieData, isAppLocked, inactivityTimer,
// and functions: openDatabase, loadFromIndexedDB, startApp, lockApp, clearLocalMovieCache,
// renderTable, populateGenreDropdown, comprehensiveSync, migrateVeryOldLocalStorageData,
// recalculateAndApplyAllRelationships, sortMovies, toggleConditionalFields, destroyCharts,
// disableMultiSelectMode, resetInactivityTimer, updateSyncButtonState (from sixth.js).

let currentSupabaseUser = null; // Stays in this file as it's central to auth logic
let supabaseSession = null;     // Stays in this file

async function initAuth() {
    showLoading("Initializing application...");
    const authForm = document.getElementById('supabaseAuthForm');
    const authErrorDiv = document.getElementById('authError');
    const authMessageEl = document.getElementById('authMessage');

    try {
        if (authErrorDiv) authErrorDiv.style.display = 'none';

        if (!window.supabaseClient) {
            showToast("Offline Mode", "Cloud features disabled. Supabase client unavailable.", "error", 0);
            if (authContainer) authContainer.style.display = 'flex';
            if (authForm) authForm.style.display = 'none';
            if (authMessageEl) authMessageEl.textContent = 'Cloud service unavailable. App running in local-only mode.';
            if(typeof openDatabase === 'function') await openDatabase();
            if(typeof loadFromIndexedDB === 'function') movieData = await loadFromIndexedDB(); else movieData = [];
            if (movieData.length > 0) {
                 console.log("Supabase unavailable. Loaded local data.");
                 showToast("Offline Mode", "Working with local data. Cloud sync disabled.", "warning");
                 if (appContent) appContent.style.display = 'block'; if (authContainer) authContainer.style.display = 'none';
                 if (typeof renderTable === 'function') renderTable(); if (typeof populateGenreDropdown === 'function') populateGenreDropdown();
                 if (typeof updateSyncButtonState === 'function') updateSyncButtonState(); // Will update menu buttons
            } else { console.log("Supabase unavailable. No local data."); if (appContent) appContent.style.display = 'none'; if (authContainer) authContainer.style.display = 'flex'; }
            return;
        }

        // 1. Get initial session FIRST
        console.log("Fetching initial Supabase session...");
        const { data: { session: initialSession }, error: sessionError } = await window.supabaseClient.auth.getSession();

        if (sessionError) {
            console.error("Error getting initial Supabase session:", sessionError);
            showToast("Auth Error", "Could not connect to auth service.", "error");
            if (authContainer) authContainer.style.display = 'flex';
            // If session error, treat as logged out.
            if (currentSupabaseUser) { // If we thought we were logged in, log out.
                console.log("Session error, forcing logout state.");
                supabaseSession = null;
                currentSupabaseUser = null;
                if (typeof lockApp === 'function') lockApp("Authentication service error.");
                else console.error("CRITICAL: lockApp function not found.");
            }
        } else {
            // Process the initial session
            supabaseSession = initialSession;
            currentSupabaseUser = initialSession?.user || null;
            console.log("Initial session obtained:", currentSupabaseUser ? currentSupabaseUser.email : "No user");

            // Decide whether to start the app or show the auth form
            if (currentSupabaseUser) {
                console.log("User found from initial session. Starting app.");
                if (typeof startApp === 'function') await startApp();
                else console.error("CRITICAL: startApp function not found.");
            } else {
                console.log("No user found from initial session. Showing auth form.");
                if (typeof lockApp === 'function') lockApp("Please sign in.");
                else console.error("CRITICAL: lockApp function not found.");
            }
        }

        // 2. Set up the auth state change listener AFTER processing initial session
        window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
            console.log("Supabase auth state change. Event:", _event, "Session:", session ? "Exists" : "Null");
            const previousUserId = currentSupabaseUser ? currentSupabaseUser.id : null;

            // Update global state based on the new session
            supabaseSession = session;
            currentSupabaseUser = session?.user || null;
            const newUserId = currentSupabaseUser ? currentSupabaseUser.id : null;

            // Handle state transitions
            if (previousUserId !== newUserId) {
                console.log("User state change detected. Old User ID:", previousUserId, "New User ID:", newUserId);
                if (typeof updateSyncButtonState === 'function') updateSyncButtonState(); // Update menu based on login/logout

                if (currentSupabaseUser) {
                    // If user logs in or session becomes active while auth UI was showing
                    console.log("User logged in or session active. Starting app.");
                    if (typeof startApp === 'function') await startApp();
                    else console.error("CRITICAL: startApp function not found.");
                } else {
                    // If user logs out or session becomes inactive
                    console.log("User logged out or session inactive. Locking app.");
                    if (typeof lockApp === 'function') lockApp("Session ended or user logged out.");
                    else console.error("CRITICAL: lockApp function not found.");
                }
            } else if (currentSupabaseUser && _event === "TOKEN_REFRESHED") {
                console.log("Supabase token refreshed for:", currentSupabaseUser.email);
                // The Supabase JS client should handle updating its internal tokens.
                // If you manually store tokens, you'd update them here too.
            } else if (_event === "SIGNED_IN" && currentSupabaseUser && !isAppContentVisible()){
                 // This case might catch an explicit SIGNED_IN event if the app wasn't already showing content
                 console.log("Explicit SIGNED_IN event, app not yet visible. Starting app.");
                 if (typeof startApp === 'function') await startApp();
                 else console.error("CRITICAL: startApp function not found.");
            }
            // If it's INITIAL_SESSION and currentSupabaseUser is null, the initial getSession() should have handled it.
            // Subsequent INITIAL_SESSION events shouldn't typically happen unless there's a reload or similar.
        });

    } catch (error) {
        console.error("Auth init failed:", error);
        showToast("Init Error", `App init error: ${error.message}`, "error", 0);
        if (authContainer) {
            authContainer.style.display = 'flex';
            if (authMessageEl) authMessageEl.textContent = `Critical error: ${error.message}. Please refresh.`;
        }
        if (authForm) authForm.style.display = 'none';
    } finally {
        hideLoading();
    }
}

function isAppContentVisible() { return appContent && appContent.style.display === 'block'; }

function lockApp(message = "Session locked. Please log in.") {
    console.log("Locking app. Message:", message);
    const appMenu = document.getElementById('appMenu'); // Get menu reference
    const appMenuBackdrop = document.getElementById('appMenuBackdrop'); // Get backdrop
    
    // Close menu if open
    if (appMenu && appMenu.classList.contains('show')) {
        appMenu.classList.remove('show');
        if (appMenuBackdrop) appMenuBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Close any open Bootstrap modals robustly
    if (typeof $ !== 'undefined' && $.fn.modal) {
        $('.modal.show').modal('hide');
    }

    // Prevent multiple lock messages / state changes if already locked
    if (isAppLocked && document.getElementById('authMessage')?.textContent === message) return;
    isAppLocked = true;

    if (typeof destroyCharts === 'function') {
        destroyCharts(); // Default global chartInstances
        if (typeof chartsModalChartInstances !== 'undefined') destroyCharts(chartsModalChartInstances); // Specific for charts modal
    }
    if (appContent) appContent.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    const authMessageEl = document.getElementById('authMessage'); if (authMessageEl) authMessageEl.textContent = message;
    const passwordInput = document.getElementById('supabasePassword'); if (passwordInput) passwordInput.value = '';
    const authErrorDiv = document.getElementById('authError'); if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }
    if (window.isMultiSelectMode && typeof window.disableMultiSelectMode === 'function') window.disableMultiSelectMode();
    
    showToast("Session Ended", message, "warning", 5000);
    
    clearTimeout(inactivityTimer);
    hideLoading();
}

async function startApp() {
    if (!currentSupabaseUser) { console.error("startApp called without a user. Locking app."); lockApp("Auth required."); hideLoading(); return; }
    
    // If app content is already visible and not locked, just do a silent sync check.
    if (isAppContentVisible() && !isAppLocked) {
        console.log("startApp: App content already visible. Performing silent sync check.");
        showLoading("Refreshing data silently...");
        try {
            // Pass true for silent, and potentially update UI if data changed.
            const syncResult = await comprehensiveSync(true);
            // If syncResult.pulledOrUpdatedLocally is true, you might want to re-render.
            if (syncResult.pulledOrUpdatedLocally && typeof renderTable === 'function') {
                renderTable(); // Re-render if local data was updated
            }
        }
        catch (error) { console.error("Error during silent sync on app re-start:", error); }
        finally { hideLoading(); }
        return;
    }
    
    // If app content is not visible or app is locked, proceed with full startup.
    showLoading("Starting application and loading data...");
    try {
        // Ensure auth UI is hidden and app content is shown
        if (authContainer) authContainer.style.display = 'none';
        if (appContent) appContent.style.display = 'block';

        // Load from local cache first
        if (typeof loadFromIndexedDB === 'function') {
            movieData = await loadFromIndexedDB();
            console.log(`Loaded ${movieData.length} entries from local cache for ${currentSupabaseUser.id}.`);
        } else {
            movieData = [];
            console.error("loadFromIndexedDB function is missing. Cannot load local cache.");
        }

        // Then, sync with the cloud
        if (typeof comprehensiveSync === 'function') {
            // comprehensiveSync handles loading from cloud, merging, and updating local data/cache
            const syncResult = await comprehensiveSync(movieData.length > 0); // Pass true for silent if local cache has data
            if (!syncResult.success) {
                // If sync failed critically, we might want to lock the app.
                // However, we've already loaded local data, so maybe just warn.
                console.warn("Comprehensive sync failed. App may have stale data:", syncResult.error);
                showToast("Sync Warning", `Cloud sync failed: ${syncResult.error}. Local data may be out of date.`, "warning", 7000);
            }
        } else {
            console.error("comprehensiveSync function is missing. Cloud sync disabled.");
            showToast("Sync Error", "Cloud sync unavailable. Working with local data only.", "error");
        }

        // Perform other app initializations
        if (typeof migrateVeryOldLocalStorageData === 'function') await migrateVeryOldLocalStorageData();
        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        
        // Apply sorting and rendering
        currentSortColumn = 'Name'; // Default sort
        currentSortDirection = 'asc';
        if (typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
        if (typeof renderTable === 'function') renderTable();
        if (typeof populateGenreDropdown === 'function') populateGenreDropdown();
        
        // Toggle conditional fields if they exist
        if (formFieldsGlob && formFieldsGlob.status && typeof toggleConditionalFields === 'function') toggleConditionalFields();
        
        // Random toast (optional)
        // if (Math.random() * PRANK_TOAST_CHANCE < 1 && typeof DO_NOT_SHOW_AGAIN_KEYS !== 'undefined') {
        //     showToast("System Update", "Calibrating Flux Capacitor...", "info", 2000, DO_NOT_SHOW_AGAIN_KEYS.FLUX_CAPACITOR);
        //     setTimeout(() => showToast("System Update", "Flux Capacitor nominal!", "success", 3000), 2500);
        // }

        // Reset app state
        isAppLocked = false;
        if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        if (typeof updateSyncButtonState === 'function') updateSyncButtonState(); // Update menu buttons based on logged-in state

        console.log("Application started successfully for:", currentSupabaseUser.email);

    } catch (error) {
        console.error("Error during startApp:", error);
        showToast("App Start Failed", `Error: ${error.message}`, "error");
        lockApp(`Failed to start: ${error.message}`); // Lock the app if startup fails critically
    } finally {
        hideLoading();
    }
}

async function supabaseSignInUser(email, password) {
    if (!window.supabaseClient) { showToast("Service Unavailable", "Cloud auth unavailable.", "error"); return null; }
    showLoading("Signing in...");
    const authErrorDiv = document.getElementById('authError');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
            showToast("Login Failed", error.message, "error");
            return null;
        }
        // Upon successful sign-in, the onAuthStateChange listener should handle starting the app.
        // We don't need to call startApp() here directly, as the listener will catch the session change.
        showToast("Login Successful", "Welcome! Loading your data...", "success");
        return data.user;
    }
    catch (e) {
        console.error("Sign in exception:", e);
        if (authErrorDiv) { authErrorDiv.textContent = "Unexpected error during sign in."; authErrorDiv.style.display = 'block'; }
        showToast("Login Failed", "Unexpected error.", "error");
        return null;
    }
    finally { hideLoading(); }
}

async function supabaseSignUpUser(email, password) {
    if (!window.supabaseClient) { showToast("Service Unavailable", "Cloud sign up unavailable.", "error"); return null; }
    showLoading("Creating account...");
    const authErrorDiv = document.getElementById('authError');
    const authMessageEl = document.getElementById('authMessage');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }
    if (authMessageEl) authMessageEl.textContent = 'Please sign in or create an account.';
    try {
        const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
        if (error) {
            if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
            showToast("Signup Failed", error.message, "error");
            return null;
        }
        
        // Provide feedback based on signup outcome
        if (data.user && !data.session && data.user.email_confirmed_at === null) {
            // User created, but email not confirmed, no session yet.
            if (authMessageEl) authMessageEl.textContent = 'Confirmation email sent! Verify email, then log in.';
            showToast("Signup Almost Done!", "Check email to confirm account, then log in.", "info", 10000);
        } else if (data.user && data.session) {
            // User created and automatically logged in. onAuthStateChange will handle app start.
            showToast("Signup Successful!", "Account created and logged in!", "success");
        } else if (data.user && data.user.email_confirmed_at) {
            // User already existed and was confirmed. Prompt login.
            if (authMessageEl) authMessageEl.textContent = 'Account confirmed. Please log in.';
            showToast("Account Exists", "Account confirmed. Please log in.", "info");
        } else {
            // Fallback for other scenarios
            if (authMessageEl) authMessageEl.textContent = 'Issue with signup. Try logging in or check email.';
            showToast("Signup Issue", "Could not complete signup. Check details or log in.", "warning");
        }
        return data.user;
    } catch (e) {
        console.error("Sign up exception:", e);
        if (authErrorDiv) { authErrorDiv.textContent = "Unexpected error during sign up."; authErrorDiv.style.display = 'block'; }
        showToast("Signup Failed", "Unexpected error.", "error");
        return null;
    }
    finally { hideLoading(); }
}

async function supabaseSignOutUser() {
    if (!window.supabaseClient) { showToast("Service Unavailable", "Cloud service unavailable.", "error"); return; }
    // Check if we are already signed out to prevent unnecessary operations
    if (!currentSupabaseUser) {
        if (typeof lockApp === 'function') lockApp("Already signed out.");
        return;
    }
    showLoading("Signing out...");
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error("Supabase sign out error:", error);
            showToast("Logout Error", error.message, "error");
        } else {
            showToast("Logout Successful", "You have been signed out.", "info");
            // The onAuthStateChange listener will handle the rest (clearing data, locking app)
            // when the session becomes null.
        }
    } catch (e) {
        console.error("Sign out exception:", e);
        showToast("Logout Error", "Unexpected error during sign out.", "error");
    } finally {
        hideLoading();
    }
}

async function supabaseSendPasswordResetEmail(email) {
    if (!window.supabaseClient) { showToast("Service Unavailable", "Password reset unavailable.", "error"); return false; }
    if (!email || !email.includes('@')) { showToast("Input Required", "Valid email required.", "warning"); return false; }
    showLoading("Sending password reset email...");
    const authErrorDiv = document.getElementById('authError');
    const authMessageEl = document.getElementById('authMessage');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }
    
    // Determine the redirect URL for the password reset confirmation page
    // Ensure this URL is configured in your Supabase Auth settings -> Email Templates
    let redirectToUrl = window.location.origin;
    if (!redirectToUrl.startsWith('http')) redirectToUrl = `https://${redirectToUrl}`;
    // You might want to append a specific path like '/auth/reset-password'
    // redirectToUrl = `${redirectToUrl}/auth/reset-password`;

    try {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            // The redirectTo option is crucial for Supabase to know where to send the user after reset.
            // This URL must be allowed in your Supabase project's Auth settings -> Redirect URLs.
            redirectTo: redirectToUrl
        });
        if (error) {
            if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
            showToast("Password Reset Failed", error.message, "error");
            return false;
        } else {
            if (authMessageEl) authMessageEl.textContent = 'Password reset email sent. Check inbox/spam.';
            showToast("Password Reset Email Sent", "If an account exists for this email, a reset link has been sent.", "success", 7000);
            return true;
        }
    }
    catch (e) {
        console.error("Password reset exception:", e);
        if (authErrorDiv) { authErrorDiv.textContent = "Unexpected error during password reset."; authErrorDiv.style.display = 'block'; }
        showToast("Password Reset Failed", "Unexpected error.", "error");
        return false;
    }
    finally { hideLoading(); }
}

async function eraseAllData() {
    const scopeElement = document.getElementById('eraseDataScope');
    if (!scopeElement) { showToast("Error", "Erase scope UI element not found.", "error"); return; }
    const scope = scopeElement.value;
    
    // Use Bootstrap modal's confirm mechanism or a simple confirm
    const confirmEraseModal = $('#confirmEraseDataModal');
    if (!confirmEraseModal.length) {
        if (!confirm(`ERASING DATA: Scope: "${scope}". This action is IRREVERSIBLE. Are you sure you want to proceed?`)) {
            return;
        }
    } else {
        // Assuming the modal has a confirmation button that triggers this logic
        // and a way to close it afterwards.
        // If this function is called directly from a button inside the modal,
        // you'd likely want to close the modal after operations.
    }

    let message = "", eraseLocalCache = false, eraseCloudData = false;

    if (scope === 'local') {
        message = "Erasing local cache...";
        eraseLocalCache = true;
    } else if (scope === 'cloud') {
        if (!currentSupabaseUser) {
            showToast("Not Logged In", "Cannot erase cloud data. Please log in first.", "error");
            if (confirmEraseModal.length) confirmEraseModal.modal('hide');
            return;
        }
        message = "Erasing cloud data...";
        eraseCloudData = true;
    } else if (scope === 'both') {
        message = "Erasing local and cloud data...";
        eraseLocalCache = true;
        if (currentSupabaseUser) {
            eraseCloudData = true;
        } else {
            showToast("Cloud Data Skipped", "Not logged in. Only local data will be erased.", "warning", 4000);
        }
    } else {
        showToast("Error", "Invalid erase scope selected.", "error");
        if (confirmEraseModal.length) confirmEraseModal.modal('hide');
        return;
    }

    showLoading(message);
    try {
        if (eraseLocalCache) {
            if (typeof clearLocalMovieCache === 'function') await clearLocalMovieCache();
            movieData = []; // Clear in-memory data
            
            // Clear relevant localStorage keys that might hold state or cached data
            const keysToClear = [
                'movieDataCache', // Assuming this is how you cache movie data in localStorage
                'genreCache',     // Example: cache for genres
                'lastSyncTime',
                'currentSortColumn', 'currentSortDirection',
                // Include any other local state keys managed by your app
                // For example, if you use DO_NOT_SHOW_AGAIN_KEYS for toasts:
                ...(typeof DO_NOT_SHOW_AGAIN_KEYS === 'object' ? Object.values(DO_NOT_SHOW_AGAIN_KEYS) : [])
            ];
            keysToClear.forEach(key => { if(key) localStorage.removeItem(key); });
            
            showToast("Local Cache Erased", "All local data deleted.", "warning", undefined, DO_NOT_SHOW_AGAIN_KEYS.DATA_ERASED);
        }

        if (eraseCloudData && currentSupabaseUser && window.supabaseClient) {
            console.log(`Attempting to delete all 'movie_entries' for user: ${currentSupabaseUser.id}`);
            const { error: deleteError } = await window.supabaseClient
                .from('movie_entries')
                .delete()
                .eq('user_id', currentSupabaseUser.id);
            
            if (deleteError) {
                console.error("Cloud data erase failed:", deleteError);
                throw new Error(`Cloud erase failed: ${deleteError.message} (Code: ${deleteError.code})`);
            }
            showToast("Cloud Data Erased", "All your data has been removed from the cloud.", "warning");
        }

        // Close modal if it was used
        if (confirmEraseModal.length) confirmEraseModal.modal('hide');
        
        // Refresh UI
        if (typeof renderTable === 'function') renderTable();
        
        // If only local was erased, try to fetch fresh data from cloud (if logged in)
        if (eraseLocalCache && !eraseCloudData && currentSupabaseUser && typeof syncDataFromSupabase === 'function') {
            showToast("Local Cleared", "Fetching fresh data from cloud...", "info");
            await syncDataFromSupabase(true, false); // isInitialLoad = true, silent = false
        } else if (eraseLocalCache && !currentSupabaseUser) {
             // If local cleared and not logged in, ensure auth screen is shown.
             if(typeof lockApp === 'function') lockApp("Local data cleared. Please sign in.");
        }

    } catch (error) {
        console.error("Error during data erase operation:", error);
        showToast("Erase Failed", `Operation failed: ${error.message}.`, "error", 7000);
    } finally {
        hideLoading();
    }
}

// --- END OF FILE supabase.js ---