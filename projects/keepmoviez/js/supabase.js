// supabase.js

// START CHUNK: 1: Supabase Data Transformation Helpers
// --- This chunk remains unchanged. ---
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
    const runtimeValue = (typeof localEntry.runtime === 'object' || typeof localEntry.runtime === 'number') ? localEntry.runtime : parseNumeric(localEntry.runtime);
    const supabaseRow = {
        id: localEntry.id, user_id: userId, name: localEntry.Name || 'Untitled Entry', category: localEntry.Category || 'Movie', genre: localEntry.Genre || '', status: localEntry.Status || 'To Watch',
        seasons_completed: parseNumeric(localEntry.seasonsCompleted), current_season_episodes_watched: parseNumeric(localEntry.currentSeasonEpisodesWatched),
        recommendation: localEntry.Recommendation || null, overall_rating: parseNumeric(localEntry.overallRating, true),
        personal_recommendation: localEntry.personalRecommendation || null, language: localEntry.Language || null, year: parseNumeric(localEntry.Year), country: localEntry.Country || null,
        description: localEntry.Description || null, poster_url: localEntry['Poster URL'] || null, watch_history: watchHistoryWithUUIDs,
        related_entries: Array.isArray(localEntry.relatedEntries) ? localEntry.relatedEntries : [], do_not_recommend_daily: localEntry.doNotRecommendDaily || false,
        last_modified_date: lastModified, tmdb_id: parseNumeric(localEntry.tmdbId), tmdb_media_type: localEntry.tmdbMediaType || null,
        keywords: Array.isArray(localEntry.keywords) ? localEntry.keywords : [], tmdb_collection_id: parseNumeric(localEntry.tmdb_collection_id),
        tmdb_collection_name: localEntry.tmdb_collection_name || null, tmdb_collection_total_parts: parseNumeric(localEntry.tmdb_collection_total_parts), director_info: localEntry.director_info || null,
        full_cast: Array.isArray(localEntry.full_cast) ? localEntry.full_cast : [], production_companies: Array.isArray(localEntry.production_companies) ? localEntry.production_companies : [],
        tmdb_vote_average: parseNumeric(localEntry.tmdb_vote_average, true), tmdb_vote_count: parseNumeric(localEntry.tmdb_vote_count), runtime: runtimeValue,
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
    const formatNumericToString = (value) => (value !== null && value !== undefined && typeof value !== 'object') ? String(value) : '';
    let localRuntime = null;
    if (typeof supabaseEntry.runtime === 'number') { localRuntime = supabaseEntry.runtime; } else if (typeof supabaseEntry.runtime === 'object' && supabaseEntry.runtime !== null) { localRuntime = supabaseEntry.runtime; }
    return {
        id: supabaseEntry.id, Name: supabaseEntry.name || 'Untitled (from Cloud)', Category: supabaseEntry.category || 'Movie', Genre: supabaseEntry.genre || '', Status: supabaseEntry.status || 'To Watch',
        seasonsCompleted: supabaseEntry.seasons_completed, currentSeasonEpisodesWatched: supabaseEntry.current_season_episodes_watched,
        Recommendation: supabaseEntry.recommendation || '', overallRating: formatNumericToString(supabaseEntry.overall_rating),
        personalRecommendation: supabaseEntry.personal_recommendation || '', Language: supabaseEntry.language || '', Year: formatNumericToString(supabaseEntry.year),
        Country: supabaseEntry.country || '', Description: supabaseEntry.description || '', 'Poster URL': supabaseEntry.poster_url || '',
        watchHistory: watchHistoryWithUUIDs, relatedEntries: Array.isArray(supabaseEntry.related_entries) ? supabaseEntry.related_entries : [],
        doNotRecommendDaily: supabaseEntry.do_not_recommend_daily || false, lastModifiedDate: supabaseEntry.last_modified_date ? new Date(supabaseEntry.last_modified_date).toISOString() : new Date(0).toISOString(),
        tmdbId: formatNumericToString(supabaseEntry.tmdb_id), tmdbMediaType: supabaseEntry.tmdb_media_type || null,
        keywords: Array.isArray(supabaseEntry.keywords) ? supabaseEntry.keywords : [],
        tmdb_collection_id: supabaseEntry.tmdb_collection_id !== null ? supabaseEntry.tmdb_collection_id : null,
        tmdb_collection_name: supabaseEntry.tmdb_collection_name || null, tmdb_collection_total_parts: supabaseEntry.tmdb_collection_total_parts, director_info: supabaseEntry.director_info || null,
        full_cast: Array.isArray(supabaseEntry.full_cast) ? supabaseEntry.full_cast : [],
        production_companies: Array.isArray(supabaseEntry.production_companies) ? supabaseEntry.production_companies : [],
        tmdb_vote_average: supabaseEntry.tmdb_vote_average !== null ? parseFloat(supabaseEntry.tmdb_vote_average) : null,
        tmdb_vote_count: supabaseEntry.tmdb_vote_count !== null ? parseInt(supabaseEntry.tmdb_vote_count) : null,
        runtime: localRuntime,
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
// END CHUNK: 1

//START CHUNK: 2: Comprehensive Two-Way Sync
// --- This chunk remains unchanged. ---
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
            if (!silent && typeof renderMovieCards === 'function') renderMovieCards();
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
        if (typeof renderMovieCards === 'function') renderMovieCards();
    }
}
// END CHUNK: 2

// START CHUNK: 3: Authentication and Application State
let currentSupabaseUser = null;

async function initAuth() {
    showLoading("Initializing...");
    try {
        if (!window.supabaseClient) {
            await resetAppForLogout("Cloud service is not available. Running in offline mode.");
            return;
        }

        const handleUserSession = async (user) => {
            if (user) {
                // This is the new, robust startup sequence
                try {
                    console.log("User session active. Opening local database...");
                    await openDatabase(); // Explicitly open and wait for DB connection
                    console.log("Local database is ready. Initializing main application...");
                    await initializeApp(); // Now, initialize the rest of the app
                } catch (dbError) {
                    console.error("CRITICAL: Could not open IndexedDB.", dbError);
                    await resetAppForLogout(`Failed to connect to local database: ${dbError.message}`);
                }
            } else {
                const message = "Your session has ended. Please log in.";
                await resetAppForLogout(message);
            }
        };

        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user || null;
            // Prevent re-initialization if user is already logged in and active
            if (user?.id === currentSupabaseUser?.id && appContent.style.display === 'block') {
                return;
            }
            currentSupabaseUser = user;
            if (typeof updateSyncButtonState === 'function') updateSyncButtonState();

            if (event === 'SIGNED_OUT') {
                await resetAppForLogout("You have been logged out.");
            } else {
                await handleUserSession(user);
            }
        });

        // Check for existing session on initial load
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        currentSupabaseUser = session?.user || null;
        if (typeof updateSyncButtonState === 'function') updateSyncButtonState();

        if (!session) {
            await resetAppForLogout("Please log in to continue.");
        }
        // Note: The onAuthStateChange listener will fire with 'INITIAL_SESSION'
        // and trigger handleUserSession if a session exists, so we don't need to call it twice.

    } catch (error) {
        console.error("Authentication initialization failed:", error);
        await resetAppForLogout(`Auth init failed: ${error.message}`);
    }
}

async function initializeApp() {
    // This function now assumes the database connection is already OPEN.
    showLoading("Loading your collection...");
    try {
        if (authContainer) authContainer.style.display = 'none';
        if (appContent) appContent.style.display = 'block';

        try {
            // This call is now safe because openDatabase() was called first.
            movieData = await loadFromIndexedDB();
            console.log(`Loaded ${movieData.length} entries from local cache.`);
        } catch (loadError) {
            console.error("CRITICAL: Failed to load data from IndexedDB during init.", loadError);
            showToast("Local Cache Error", "Could not read local data. Clearing cache and re-syncing from cloud.", "error", 7000);
            if (typeof clearLocalMovieCache === 'function') await clearLocalMovieCache();
            movieData = [];
        }

        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        sortMovies(currentSortColumn, currentSortDirection);
        if (typeof renderMovieCards === 'function') renderMovieCards();
        if (typeof populateGenreDropdown === 'function') populateGenreDropdown();
        
        console.log("Application started for:", currentSupabaseUser.email);
        
        showToast("Syncing...", "Checking for updates from the cloud.", "info", 2000);
        await comprehensiveSync(true);

        await window.checkAndNotifyNewAchievements(true);

        if (typeof migrateVeryOldLocalStorageData === 'function') {
            await migrateVeryOldLocalStorageData();
        }
    } catch (error) {
        console.error("Critical error during app initialization:", error);
        showToast("Application Start Failed", `Error: ${error.message}`, "error", 0);
        await resetAppForLogout(`Failed to start: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function resetAppForLogout(message) {
    console.log("Resetting application UI. Message:", message);
    movieData = [];
    currentSupabaseUser = null;
    if (typeof clearLocalMovieCache === 'function') await clearLocalMovieCache();
    if (typeof destroyCharts === 'function') destroyCharts(chartInstances);
    if (window.isMultiSelectMode && typeof window.disableMultiSelectMode === 'function') window.disableMulti-select-actions-bar();
    if (typeof $ !== 'undefined' && $.fn.modal) $('.modal.show').modal('hide');
    document.getElementById('appMenu')?.classList.remove('show');
    document.getElementById('appMenuBackdrop')?.classList.remove('show');
    if (typeof renderMovieCards === 'function') renderMovieCards();
    if (appContent) appContent.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    
    const authMessageEl = document.getElementById('authMessage');
    if (authMessageEl) authMessageEl.textContent = message;
    const passwordInput = document.getElementById('supabasePassword');
    if (passwordInput) passwordInput.value = '';
    const authErrorDiv = document.getElementById('authError');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }

    showToast("Session Ended", message, "info");
    hideLoading();
}
// END CHUNK: 3

//START CHUNK: 4: User Authentication Actions
// --- This chunk remains unchanged. ---
async function supabaseSignInUser(email, password) {
    const authErrorDiv = document.getElementById('authError');
    if(authErrorDiv) authErrorDiv.style.display = 'none';
    showLoading("Signing in...");
    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
    } catch (error) {
        console.error("Sign in error:", error);
        if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
        showToast("Login Failed", error.message, "error");
    } finally {
        hideLoading();
    }
}
async function supabaseSignUpUser(email, password) {
    const authErrorDiv = document.getElementById('authError');
    if(authErrorDiv) authErrorDiv.style.display = 'none';
    showLoading("Creating account...");
    try {
        const { error } = await window.supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        showToast("Account Created", "Please check your email to verify your account.", "success", 10000);
        const authMessageEl = document.getElementById('authMessage');
        if (authMessageEl) authMessageEl.textContent = "Verification email sent! Please check your inbox.";
    } catch (error) {
        console.error("Sign up error:", error);
        if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
        showToast("Sign Up Failed", error.message, "error");
    } finally {
        hideLoading();
    }
}
async function supabaseSignOutUser() {
    showLoading("Signing out...");
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error && error.name !== 'AuthSessionMissingError') throw error;
    } catch (error) {
        console.error("Sign out error:", error);
        showToast("Logout Error", error.message, "error");
    } finally {
        hideLoading();
    }
}
async function supabaseSendPasswordResetEmail(email) {
    const authErrorDiv = document.getElementById('authError');
    if(authErrorDiv) authErrorDiv.style.display = 'none';
    showLoading("Sending reset link...");
    try {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.href, });
        if (error) throw error;
        showToast("Check Your Email", "A password reset link has been sent.", "success", 8000);
        const authMessageEl = document.getElementById('authMessage');
        if (authMessageEl) authMessageEl.textContent = "Password reset link sent! Please check your inbox.";
    } catch (error) {
        console.error("Password reset error:", error);
        if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
        showToast("Reset Failed", error.message, "error");
    } finally {
        hideLoading();
    }
}
// END CHUNK: 4

//START CHUNK: 5: High-Level Data Actions
// --- This chunk remains unchanged. ---
async function eraseAllData() {
    const scopeElement = document.getElementById('eraseDataScope'); if (!scopeElement) { showToast("Error", "Erase scope UI missing.", "error"); return; }
    const scope = scopeElement.value;
    if (!confirm(`ERASING DATA: Scope: "${scope}". This is IRREVERSIBLE. Are you sure?`)) { $('#confirmEraseDataModal').modal('hide'); return; }
    let message = "", eraseLocalCache = false, eraseCloudData = false;
    if (scope === 'local') { message = "Erasing local cache..."; eraseLocalCache = true; }
    else if (scope === 'cloud') { if (!currentSupabaseUser) { showToast("Not Logged In", "Cannot erase cloud data.", "error"); $('#confirmEraseDataModal').modal('hide'); return; } message = "Erasing cloud data..."; eraseCloudData = true; }
    else if (scope === 'both') { message = "Erasing local and cloud data..."; eraseLocalCache = true; if (currentSupabaseUser) eraseCloudData = true; else showToast("Cloud Skipped", "Not logged in. Only local erased.", "warning", 4000); }
    else { showToast("Error", "Invalid erase scope.", "error"); $('#confirmEraseDataModal').modal('hide'); return; }
    showLoading(message);
    try {
        if (eraseLocalCache) { if (typeof clearLocalMovieCache === 'function') await clearLocalMovieCache(); movieData = []; const keysToClear = [ DAILY_RECOMMENDATION_ID_KEY, DAILY_RECOMMENDATION_DATE_KEY, DAILY_REC_SKIP_COUNT_KEY, ...(typeof DO_NOT_SHOW_AGAIN_KEYS === 'object' ? Object.values(DO_NOT_SHOW_AGAIN_KEYS) : []) ]; keysToClear.forEach(key => { if(key) localStorage.removeItem(key);}); showToast("Local Cache Erased", "Local data deleted.", "warning", undefined, DO_NOT_SHOW_AGAIN_KEYS.DATA_ERASED); }
        if (eraseCloudData && currentSupabaseUser && window.supabaseClient) { const { error: deleteError } = await window.supabaseClient.from('movie_entries').delete().eq('user_id', currentSupabaseUser.id); if (deleteError) { console.error("Cloud data erase failed:", deleteError); throw new Error(`Cloud erase failed: ${deleteError.message}`); } showToast("Cloud Data Erased", "Cloud data deleted.", "warning"); }
        $('#confirmEraseDataModal').modal('hide'); 
        if (typeof renderMovieCards === 'function') renderMovieCards();
        if (eraseLocalCache && !eraseCloudData && currentSupabaseUser && typeof comprehensiveSync === 'function') { showToast("Local Cleared", "Fetching fresh data from cloud...", "info"); await comprehensiveSync(true); }
    } catch (error) { console.error("Error erasing data:", error); showToast("Erase Failed", `Failed: ${error.message}.`, "error", 7000);
    } finally { hideLoading(); }
}
// END CHUNK: 5
