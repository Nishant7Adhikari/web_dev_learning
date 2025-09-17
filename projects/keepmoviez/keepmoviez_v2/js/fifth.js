// js/supabase-sync.js

/**
 * Converts a local movie entry to a format suitable for Supabase.
 */
function localEntryToSupabaseFormat(localEntry, userId) {
    if (!localEntry || !localEntry.id || !userId) {
        console.error("Invalid input to localEntryToSupabaseFormat: Missing localEntry, entry.id, or userId.", { localEntry, userId });
        return null;
    }

    let lastModified = localEntry.lastModifiedDate || new Date().toISOString();
    try {
        const dateObj = new Date(lastModified);
        if (isNaN(dateObj.getTime())) throw new Error(`Invalid date value: ${lastModified}`);
        lastModified = dateObj.toISOString();
    } catch (e) {
        console.warn(`Invalid lastModifiedDate for entry ${localEntry.id} ('${localEntry.Name || 'N/A'}'), using current time. Original: ${localEntry.lastModifiedDate}. Error: ${e.message}`);
        lastModified = new Date().toISOString();
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    const watchHistoryWithUUIDs = (localEntry.watchHistory || []).map(wh => {
        if (!wh || typeof wh !== 'object') return null;
        const ratingValue = (wh.rating !== null && wh.rating !== undefined && String(wh.rating).trim() !== '') ? parseFloat(wh.rating) : null;
        return {
            ...wh,
            watchId: (wh.watchId && uuidRegex.test(wh.watchId)) ? wh.watchId : generateUUID(),
            rating: isNaN(ratingValue) ? null : ratingValue 
        };
    }).filter(Boolean);

    const parseNumeric = (value, isFloat = false) => {
        if (value === null || value === undefined || String(value).trim() === '') return null;
        const num = isFloat ? parseFloat(value) : parseInt(value, 10);
        return isNaN(num) ? null : num;
    };

    const supabaseRow = {
        id: localEntry.id,
        user_id: userId,
        name: localEntry.Name || 'Untitled Entry',
        category: localEntry.Category || 'Movie',
        genre: localEntry.Genre || '', 
        status: localEntry.Status || 'To Watch',
        continue_details: localEntry['Continue Details'] || null,
        recommendation: localEntry.Recommendation || null,
        overall_rating: parseNumeric(localEntry.overallRating, true), 
        personal_recommendation: localEntry.personalRecommendation || null,
        language: localEntry.Language || null,
        year: parseNumeric(localEntry.Year),
        country: localEntry.Country || null,
        description: localEntry.Description || null,
        poster_url: localEntry['Poster URL'] || null,
        watch_history: watchHistoryWithUUIDs, 
        related_entries: Array.isArray(localEntry.relatedEntries) ? localEntry.relatedEntries : [], 
        do_not_recommend_daily: localEntry.doNotRecommendDaily || false,
        last_modified_date: lastModified,
        tmdb_id: parseNumeric(localEntry.tmdbId),
        tmdb_media_type: localEntry.tmdbMediaType || null,
        keywords: Array.isArray(localEntry.keywords) ? localEntry.keywords : [], 
        tmdb_collection_id: parseNumeric(localEntry.tmdb_collection_id),
        tmdb_collection_name: localEntry.tmdb_collection_name || null,
        director_info: localEntry.director_info || null, 
        full_cast: Array.isArray(localEntry.full_cast) ? localEntry.full_cast : [], 
        production_companies: Array.isArray(localEntry.production_companies) ? localEntry.production_companies : [], 
        tmdb_vote_average: parseNumeric(localEntry.tmdb_vote_average, true),
        tmdb_vote_count: parseNumeric(localEntry.tmdb_vote_count),
        runtime: parseNumeric(localEntry.runtime)
    };
    return supabaseRow;
}

/**
 * Converts a Supabase entry to the local movieData format.
 */
function supabaseEntryToLocalFormat(supabaseEntry) {
    if (!supabaseEntry || !supabaseEntry.id) {
        console.error("Invalid Supabase entry passed to supabaseEntryToLocalFormat.", supabaseEntry);
        return null;
    }
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    const watchHistoryWithUUIDs = (supabaseEntry.watch_history || []).map(wh => {
        if (!wh || typeof wh !== 'object') return null;
        return {
            ...wh,
            watchId: (wh.watchId && uuidRegex.test(wh.watchId)) ? wh.watchId : generateUUID(),
            rating: (wh.rating !== null && wh.rating !== undefined) ? String(wh.rating) : ''
        };
    }).filter(Boolean);

    const formatNumericToString = (value) => (value !== null && value !== undefined) ? String(value) : '';

    return {
        id: supabaseEntry.id,
        Name: supabaseEntry.name || 'Untitled (from Cloud)',
        Category: supabaseEntry.category || 'Movie',
        Genre: supabaseEntry.genre || '',
        Status: supabaseEntry.status || 'To Watch',
        'Continue Details': supabaseEntry.continue_details || '',
        Recommendation: supabaseEntry.recommendation || '',
        overallRating: formatNumericToString(supabaseEntry.overall_rating),
        personalRecommendation: supabaseEntry.personal_recommendation || '',
        Language: supabaseEntry.language || '',
        Year: formatNumericToString(supabaseEntry.year),
        Country: supabaseEntry.country || '',
        Description: supabaseEntry.description || '',
        'Poster URL': supabaseEntry.poster_url || '',
        watchHistory: watchHistoryWithUUIDs,
        relatedEntries: Array.isArray(supabaseEntry.related_entries) ? supabaseEntry.related_entries : [],
        doNotRecommendDaily: supabaseEntry.do_not_recommend_daily || false,
        lastModifiedDate: supabaseEntry.last_modified_date ? new Date(supabaseEntry.last_modified_date).toISOString() : new Date(0).toISOString(),
        tmdbId: formatNumericToString(supabaseEntry.tmdb_id),
        tmdbMediaType: supabaseEntry.tmdb_media_type || null,
        keywords: Array.isArray(supabaseEntry.keywords) ? supabaseEntry.keywords : [],
        tmdb_collection_id: supabaseEntry.tmdb_collection_id !== null ? supabaseEntry.tmdb_collection_id : null, 
        tmdb_collection_name: supabaseEntry.tmdb_collection_name || null,
        director_info: supabaseEntry.director_info || null,
        full_cast: Array.isArray(supabaseEntry.full_cast) ? supabaseEntry.full_cast : [],
        production_companies: Array.isArray(supabaseEntry.production_companies) ? supabaseEntry.production_companies : [],
        tmdb_vote_average: supabaseEntry.tmdb_vote_average !== null ? parseFloat(supabaseEntry.tmdb_vote_average) : null, 
        tmdb_vote_count: supabaseEntry.tmdb_vote_count !== null ? parseInt(supabaseEntry.tmdb_vote_count) : null, 
        runtime: supabaseEntry.runtime !== null ? parseInt(supabaseEntry.runtime) : null 
    };
}

/**
 * Creates a canonical string representation of a movie entry for comparison.
 */
function getComparableEntryString(entry) {
    if (!entry || typeof entry !== 'object') return JSON.stringify(entry);
    
    const tempEntry = JSON.parse(JSON.stringify(entry)); 
    delete tempEntry.lastModifiedDate;
    delete tempEntry.source; 

    if (Array.isArray(tempEntry.watchHistory)) {
        tempEntry.watchHistory.sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return String(a.notes || '').localeCompare(String(b.notes || ''));
        });
    }
    if (Array.isArray(tempEntry.full_cast)) {
        tempEntry.full_cast.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name || '').localeCompare(String(b.name || '')));
    }
    if (Array.isArray(tempEntry.keywords)) {
        tempEntry.keywords.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }
    if (Array.isArray(tempEntry.production_companies)) {
        tempEntry.production_companies.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }
    if (Array.isArray(tempEntry.relatedEntries)) { 
        tempEntry.relatedEntries.sort();
    }

    const canonicalizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
        const sortedObj = {};
        Object.keys(obj).sort().forEach(key => {
            sortedObj[key] = canonicalizeObject(obj[key]); 
        });
        return sortedObj;
    };

    if (tempEntry.director_info) {
        tempEntry.director_info = canonicalizeObject(tempEntry.director_info);
    }
    
    const sortedKeys = Object.keys(tempEntry).sort();
    const canonicalObject = {};
    for (const key of sortedKeys) {
        canonicalObject[key] = tempEntry[key];
    }
    return JSON.stringify(canonicalObject);
}


/**
 * Performs a comprehensive two-way synchronization.
 */
async function comprehensiveSync(silent = false) {
    if (!window.supabaseClient || !currentSupabaseUser) {
        if (!silent) showToast("Not Logged In", "Please log in to sync data with the cloud.", "error");
        return { success: false, error: "Not logged in" };
    }

    if (!silent) showLoading("Syncing data with cloud (Comprehensive)...");

    try {
        const { data: remoteEntriesRaw, error: fetchError } = await window.supabaseClient
            .from('movie_entries')
            .select('*')
            .eq('user_id', currentSupabaseUser.id);

        if (fetchError) {
            console.error("Sync: Could not fetch cloud data:", fetchError);
            throw new Error(`Sync: Fetch cloud data failed: ${fetchError.message} (Code: ${fetchError.code})`);
        }
        
        const remoteEntries = remoteEntriesRaw.map(supabaseEntryToLocalFormat).filter(Boolean);
        const originalLocalMovieDataForComparison = JSON.parse(JSON.stringify(movieData)); 
        const mergedDataMap = new Map();
        const localChangesToPushSet = new Set(); 
        let localDataWasUpdatedByPullDirectly = false;


        originalLocalMovieDataForComparison.forEach(localEntry => {
            if (!localEntry || !localEntry.id) return;
            const lmd = localEntry.lastModifiedDate ? new Date(localEntry.lastModifiedDate).toISOString() : new Date(0).toISOString();
            mergedDataMap.set(localEntry.id, { ...localEntry, lastModifiedDate: lmd });
        });

        remoteEntries.forEach(remoteEntry => {
            if (!remoteEntry || !remoteEntry.id) return;
            
            const entryInMap = mergedDataMap.get(remoteEntry.id);
            const remoteLMDTime = new Date(remoteEntry.lastModifiedDate || 0).getTime();

            if (entryInMap) {
                const mapEntryLMDTime = new Date(entryInMap.lastModifiedDate || 0).getTime();
                const mapEntryContentString = getComparableEntryString(entryInMap);
                const remoteContentString = getComparableEntryString(remoteEntry);
                const isContentDifferent = mapEntryContentString !== remoteContentString;

                if (remoteLMDTime > mapEntryLMDTime) {
                    mergedDataMap.set(remoteEntry.id, { ...remoteEntry });
                    localDataWasUpdatedByPullDirectly = true;
                } else if (mapEntryLMDTime > remoteLMDTime) {
                    localChangesToPushSet.add(entryInMap.id);
                } else { 
                    if (isContentDifferent) {
                        console.warn(`Sync CONFLICT (ID: ${remoteEntry.id}, Name: "${entryInMap.Name || 'N/A'}"): Timestamps identical, content differs. Current strategy: Prioritizing current local/merged version for push.`);
                        localChangesToPushSet.add(entryInMap.id); 
                    }
                }
            } else { 
                mergedDataMap.set(remoteEntry.id, { ...remoteEntry });
                localDataWasUpdatedByPullDirectly = true;
            }
        });

        originalLocalMovieDataForComparison.forEach(localOriginal => {
            if (!localOriginal || !localOriginal.id) return;
            if (!remoteEntries.some(re => re && re.id === localOriginal.id)) {
                localChangesToPushSet.add(localOriginal.id);
                if (!mergedDataMap.has(localOriginal.id)) mergedDataMap.set(localOriginal.id, { ...localOriginal });
            }
        });
        
        const finalMergedMovieData = Array.from(mergedDataMap.values());

        const sortedFinal = JSON.parse(JSON.stringify(finalMergedMovieData)).sort((a,b) => (a.id || "").localeCompare(b.id || ""));
        const sortedOriginalLocalAtStart = JSON.parse(JSON.stringify(originalLocalMovieDataForComparison)).sort((a,b) => (a.id || "").localeCompare(b.id || ""));

        let localMovieDataArrayChanged = false;
        if (JSON.stringify(sortedFinal) !== JSON.stringify(sortedOriginalLocalAtStart)) {
            movieData = finalMergedMovieData;
            localMovieDataArrayChanged = true;
        }
        
        if (localMovieDataArrayChanged) {
            if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
            if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
            else { currentSortColumn = 'Name'; currentSortDirection = 'asc'; if(typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); }
            if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
            if (!silent && typeof renderTable === 'function') renderTable();
            if (!silent) showToast("Local Data Updated", "Local cache has been updated based on cloud data or merge.", "info");
        }

        const entriesToUpsertToSupabase = [];
        localChangesToPushSet.forEach(idToPush => {
            const entry = mergedDataMap.get(idToPush); 
            if (entry) {
                const supabaseFormattedEntry = localEntryToSupabaseFormat(entry, currentSupabaseUser.id);
                if (supabaseFormattedEntry) {
                    entriesToUpsertToSupabase.push(supabaseFormattedEntry);
                }
            }
        });

        // Simplified: Deletions are handled by items *not* being in `entriesToUpsertToSupabase`
        // if they were previously on the cloud. This relies on the local state being the "source of truth"
        // for what should exist. If an item is deleted locally, it won't be in `localChangesToPushSet`
        // (unless it was re-added). It also won't be in `mergedDataMap` if `movieData` was already updated.
        // For explicit deletion propagation, `performDeleteEntry` in third.js should make a direct Supabase call.
        // This comprehensiveSync will then primarily handle new items, updates, and items deleted on *other* clients.

        if (entriesToUpsertToSupabase.length > 0) {
            if (!silent) showLoading(`Pushing ${entriesToUpsertToSupabase.length} changes to cloud...`);
            const CHUNK_SIZE_UPSERT = 50;
            for (let i = 0; i < entriesToUpsertToSupabase.length; i += CHUNK_SIZE_UPSERT) {
                const chunk = entriesToUpsertToSupabase.slice(i, i + CHUNK_SIZE_UPSERT);
                const { error: upsertError } = await window.supabaseClient
                    .from('movie_entries')
                    .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
                
                if (upsertError) {
                    console.error("Supabase upsert error:", upsertError, "Problematic chunk sample keys:", chunk[0] ? Object.keys(chunk[0]) : "N/A");
                    let detailedMessage = `Sync: Cloud update error: ${upsertError.message} (Code: ${upsertError.code}).`;
                    if (upsertError.details) detailedMessage += ` Details: ${upsertError.details}.`;
                    if (String(upsertError.message).toLowerCase().includes("column") && String(upsertError.message).toLowerCase().includes("does not exist")) {
                         detailedMessage += " CRITICAL SCHEMA MISMATCH: Ensure all columns exist in your 'movie_entries' table with correct data types (JSONB, INT, TEXT, etc.).";
                    }
                    throw new Error(detailedMessage);
                }
            }
            if (!silent) showToast("Cloud Synced", `${entriesToUpsertToSupabase.length} entries successfully synced to cloud.`, "success");
        }

        // This condition needs to be re-evaluated based on how deletions are handled.
        // If deletions are handled outside this sync, this message might be misleading.
        if (!silent && !localMovieDataArrayChanged && entriesToUpsertToSupabase.length === 0 /* && no_cloud_deletions_were_needed */) {
            showToast("All Synced", "Data is up-to-date locally and in the cloud.", "info");
        }
        return { success: true, pushed: entriesToUpsertToSupabase.length, pulledOrUpdatedLocally: localMovieDataArrayChanged };

    } catch (error) {
        console.error("Error during comprehensiveSync:", error);
        if (!silent) showToast("Sync Failed", `${error.message}`, "error", 10000);
        return { success: false, error: error.message };
    } finally {
        if (!silent) hideLoading();
        if (typeof renderTable === 'function') renderTable(); // Always render after sync attempt
    }
}


async function syncDataFromSupabase(isInitialLoad = false, silent = false) {
    if (!window.supabaseClient || !currentSupabaseUser) {
        if (!isInitialLoad && !silent) showToast("Not Logged In", "Please log in to fetch cloud data.", "info");
        return false;
    }

    if (!isInitialLoad && !silent) showLoading("Fetching data from cloud...");

    try {
        const { data: remoteEntriesRaw, error } = await window.supabaseClient
            .from('movie_entries')
            .select('*')
            .eq('user_id', currentSupabaseUser.id);

        if (error) {
            console.error("Fetch from Supabase error:", error);
            throw new Error(`Could not fetch data: ${error.message} (Code: ${error.code})`);
        }

        const remoteEntries = remoteEntriesRaw.map(supabaseEntryToLocalFormat).filter(Boolean);
        let changesMadeToLocalData = false;

        if (isInitialLoad && movieData.length === 0) {
            movieData = remoteEntries;
            changesMadeToLocalData = remoteEntries.length > 0;
            if (!silent && remoteEntries.length > 0) showToast("Data Loaded", "Data successfully loaded from the cloud.", "success");
            else if (!silent && remoteEntries.length === 0) showToast("No Cloud Data", "Your cloud account is empty. Add some entries!", "info");
        } else { 
            const mergedMap = new Map();
            movieData.forEach(le => { if(le && le.id) mergedMap.set(le.id, le); });
            
            remoteEntries.forEach(re => {
                if (!re || !re.id) return;
                const localVersion = mergedMap.get(re.id);
                if (localVersion) {
                    const localLMD = new Date(localVersion.lastModifiedDate || 0).getTime();
                    const remoteLMD = new Date(re.lastModifiedDate || 0).getTime();
                    const localContent = getComparableEntryString(localVersion);
                    const remoteContent = getComparableEntryString(re);

                    if (remoteLMD > localLMD || (remoteLMD === localLMD && localContent !== remoteContent)) {
                        mergedMap.set(re.id, re);
                    }
                } else {
                    mergedMap.set(re.id, re);
                }
            });

            const newLocalData = Array.from(mergedMap.values());
            const oldLocalSortedString = JSON.stringify([...movieData].sort((a,b)=>(a.id||"").localeCompare(b.id||"")));
            const newLocalSortedString = JSON.stringify([...newLocalData].sort((a,b)=>(a.id||"").localeCompare(b.id||"")));

            if(oldLocalSortedString !== newLocalSortedString){
                movieData = newLocalData;
                changesMadeToLocalData = true;
                if (!silent) showToast("Data Synced", "Local cache updated from the cloud.", "success");
            } else {
                 if (!silent && !isInitialLoad) showToast("Up to Date", "Local cache is already up-to-date with the cloud.", "info");
            }
        }
        
        if (changesMadeToLocalData || (isInitialLoad && movieData.length > 0)) {
            if(typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
            if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
            else { currentSortColumn = 'Name'; currentSortDirection = 'asc'; if(typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); }
            if(typeof saveToIndexedDB === 'function') await saveToIndexedDB();
            if(typeof renderTable === 'function') renderTable();
        }
        return true;

    } catch (error) {
        console.error("Error syncing from Supabase:", error);
        if (!isInitialLoad && !silent) showToast("Sync Failed", `From Cloud: ${error.message}`, "error", 7000);
        return false;
    } finally {
        if (!isInitialLoad && !silent) hideLoading();
    }
}


// js/auth.js
// ... (auth.js content remains the same as previously approved)
let currentSupabaseUser = null;
let supabaseSession = null;

async function initAuth() {
    showLoading("Initializing application...");
    const authForm = document.getElementById('supabaseAuthForm');
    const authErrorDiv = document.getElementById('authError');
    const loggedInUserEmailSpan = document.getElementById('loggedInUserEmail');
    const authMessageEl = document.getElementById('authMessage');

    try {
        if (authErrorDiv) authErrorDiv.style.display = 'none';

        if (!window.supabaseClient) {
            showToast("Offline Mode", "Cloud features are disabled. Supabase client not available.", "error", 0);
            if (authContainer) authContainer.style.display = 'flex';
            if (authForm) authForm.style.display = 'none';
            if (authMessageEl) authMessageEl.textContent = 'Cloud service (Supabase) is not configured or failed to load. Application running in local-only mode if data exists, otherwise limited functionality.';
            if(typeof openDatabase === 'function') await openDatabase();
            if(typeof loadFromIndexedDB === 'function') movieData = await loadFromIndexedDB();
            else movieData = [];

            if (movieData.length > 0) {
                 console.log("Supabase unavailable. Loaded data from local cache for offline use.");
                 showToast("Offline Mode", "Working with local data. Cloud sync disabled.", "warning");
                 if (appContent) appContent.style.display = 'block';
                 if (authContainer) authContainer.style.display = 'none';
                 if (typeof renderTable === 'function') renderTable();
                 if (typeof populateGenreDropdown === 'function') populateGenreDropdown();
                 if (typeof updateSyncButtonState === 'function') updateSyncButtonState();
            } else {
                 console.log("Supabase unavailable. No local data found.");
                 if (appContent) appContent.style.display = 'none';
                 if (authContainer) authContainer.style.display = 'flex';
            }
            return; 
        }

        window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
            console.log("Supabase auth state changed. Event:", _event, "Session:", session ? "Exists" : "Null");
            const previousUserId = currentSupabaseUser ? currentSupabaseUser.id : null;
            supabaseSession = session;
            currentSupabaseUser = session?.user || null;
            const newUserId = currentSupabaseUser ? currentSupabaseUser.id : null;

            if (previousUserId !== newUserId) {
                console.log("User state change detected. Old user ID:", previousUserId, "New user ID:", newUserId);
                if (typeof updateSyncButtonState === 'function') updateSyncButtonState();

                if (currentSupabaseUser) {
                    if (loggedInUserEmailSpan && currentSupabaseUser.email) {
                        loggedInUserEmailSpan.textContent = currentSupabaseUser.email;
                        loggedInUserEmailSpan.style.display = 'inline';
                    }
                    if ((authContainer && authContainer.style.display !== 'none') || !isAppContentVisible()) {
                        if(typeof openDatabase === 'function') await openDatabase();
                        if(typeof startApp === 'function') await startApp();
                        else console.error("CRITICAL: startApp function not found after login.");
                    }
                } else {
                    if (loggedInUserEmailSpan) loggedInUserEmailSpan.style.display = 'none';
                    if (typeof lockApp === 'function') lockApp("Session ended or user logged out. Please log in again.");
                    else console.error("CRITICAL: lockApp function not found for logout.");
                }
            } else if (currentSupabaseUser && _event === "TOKEN_REFRESHED") {
                 console.log("Supabase token refreshed for user:", currentSupabaseUser.email);
            } else if (_event === "SIGNED_IN" && currentSupabaseUser && !isAppContentVisible()){
                console.log("Explicit SIGNED_IN event, app not visible. Attempting to start app.");
                if(typeof openDatabase === 'function') await openDatabase();
                if(typeof startApp === 'function') await startApp();
            } else if (_event === "INITIAL_SESSION" && !currentSupabaseUser && !session) {
                console.log("INITIAL_SESSION event: No active session. Auth screen should be visible.");
                if (authContainer && authContainer.style.display !== 'flex') authContainer.style.display = 'flex';
            }
        });

        const { data: { session: initialSession }, error: sessionError } = await window.supabaseClient.auth.getSession();

        if (sessionError) {
            console.error("Error getting initial Supabase session:", sessionError);
            showToast("Auth Error", "Could not connect to authentication service. Check network.", "error");
            if (authContainer) authContainer.style.display = 'flex';
        }
        setTimeout(() => {
            if (!isAppContentVisible() && (!authContainer || authContainer.style.display === 'none') && !currentSupabaseUser) {
                console.warn("Auth state not fully resolved by listener, forcing auth screen display.");
                if (authContainer) authContainer.style.display = 'flex';
                if (loggedInUserEmailSpan) loggedInUserEmailSpan.style.display = 'none';
                if (typeof updateSyncButtonState === 'function') updateSyncButtonState();
            }
        }, 500); 


    } catch (error) {
        console.error("Authentication initialization failed catastrophically:", error);
        showToast("Initialization Error", `Could not initialize application: ${error.message}`, "error", 0);
        if (authContainer) {
            authContainer.style.display = 'flex';
            if (authMessageEl) authMessageEl.textContent = `A critical error occurred: ${error.message}. Please refresh.`;
        }
        if (authForm) authForm.style.display = 'none';
    } finally {
        hideLoading(); 
    }
}

function isAppContentVisible() {
    return appContent && appContent.style.display === 'block';
}

function lockApp(message = "Session locked. Please log in.") {
    console.log("Locking app. Message:", message);
    if (isAppLocked && document.getElementById('authMessage')?.textContent === message) return;
    isAppLocked = true;
    if (typeof destroyCharts === 'function') destroyCharts();
    if (appContent) appContent.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    const authMessageEl = document.getElementById('authMessage');
    if (authMessageEl) authMessageEl.textContent = message;
    const passwordInput = document.getElementById('supabasePassword');
    if (passwordInput) passwordInput.value = '';
    const authErrorDiv = document.getElementById('authError');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }
    if (window.isMultiSelectMode && typeof window.disableMultiSelectMode === 'function') {
        window.disableMultiSelectMode();
    }
    showToast("Session Ended", message, "warning", 5000);
    clearTimeout(inactivityTimer);
    hideLoading();
}

async function startApp() {
    if (!currentSupabaseUser) {
        console.error("startApp called without a Supabase user. Locking app.");
        lockApp("Authentication required to start the application.");
        hideLoading();
        return;
    }
    if (isAppContentVisible() && !isAppLocked) {
        console.log("startApp called, but app content already visible. Performing a silent sync check.");
        showLoading("Refreshing data silently...");
        try {
            if (typeof comprehensiveSync === 'function') await comprehensiveSync(true);
        } catch (error) {
            console.error("Error during silent sync on app re-start:", error);
        } finally {
            hideLoading();
        }
        return;
    }

    showLoading("Starting application and loading data...");
    try {
        if (authContainer) authContainer.style.display = 'none';
        if (appContent) appContent.style.display = 'block';

        if (typeof loadFromIndexedDB === 'function') {
            movieData = await loadFromIndexedDB();
            console.log(`Loaded ${movieData.length} entries from local cache for user ${currentSupabaseUser.id}.`);
        } else {
            movieData = [];
            console.error("loadFromIndexedDB function missing. Cannot load local data.");
        }

        if (typeof comprehensiveSync === 'function') {
            await comprehensiveSync(movieData.length > 0); 
        } else {
            console.error("comprehensiveSync function missing. Cannot sync with cloud.");
            showToast("Sync Error", "Cloud synchronization function is not available.", "error");
        }
        
        if (typeof migrateVeryOldLocalStorageData === 'function') await migrateVeryOldLocalStorageData();

        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        currentSortColumn = 'Name'; currentSortDirection = 'asc';
        if (typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
        if (typeof renderTable === 'function') renderTable();
        if (typeof populateGenreDropdown === 'function') populateGenreDropdown();

        if (formFieldsGlob && formFieldsGlob.status && typeof toggleConditionalFields === 'function') {
            toggleConditionalFields();
        }

        if (Math.random() * PRANK_TOAST_CHANCE < 1 && typeof DO_NOT_SHOW_AGAIN_KEYS !== 'undefined') {
            showToast("System Update", "Calibrating Flux Capacitor...", "info", 2000, DO_NOT_SHOW_AGAIN_KEYS.FLUX_CAPACITOR);
            setTimeout(() => showToast("System Update", "Flux Capacitor nominal. Recommendation engine online!", "success", 3000), 2500);
        }

        isAppLocked = false;
        if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        if (typeof updateSyncButtonState === 'function') updateSyncButtonState();
        console.log("Application started successfully for user:", currentSupabaseUser.email);
    } catch (error) {
        console.error("Error during startApp:", error);
        showToast("App Start Failed", `Could not start application: ${error.message}`, "error");
        lockApp(`Failed to start: ${error.message}`); 
    } finally {
        hideLoading();
    }
}

async function supabaseSignInUser(email, password) {
    if (!window.supabaseClient) {
        showToast("Service Unavailable", "Cloud authentication service is not available.", "error");
        return null;
    }
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
        showToast("Login Successful", "Welcome back! Loading your data...", "success");
        return data.user; 
    } catch (e) {
        console.error("Sign in exception:", e);
        if (authErrorDiv) { authErrorDiv.textContent = "An unexpected error occurred during sign in."; authErrorDiv.style.display = 'block'; }
        showToast("Login Failed", "An unexpected error occurred.", "error");
        return null;
    } finally {
        hideLoading();
    }
}

async function supabaseSignUpUser(email, password) {
    if (!window.supabaseClient) {
        showToast("Service Unavailable", "Cloud sign up service is not available.", "error");
        return null;
    }
    showLoading("Creating account...");
    const authErrorDiv = document.getElementById('authError');
    const authMessageEl = document.getElementById('authMessage');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }
    if (authMessageEl) authMessageEl.textContent = 'Please sign in or create an account to continue.';

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
        if (error) {
            if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
            showToast("Signup Failed", error.message, "error");
            return null;
        }

        if (data.user && !data.session && data.user.identities && data.user.identities.length > 0 && data.user.email_confirmed_at === null) {
            if (authMessageEl) authMessageEl.textContent = 'Confirmation email sent! Please verify your email address, then log in.';
            showToast("Signup Almost Done!", "Please check your email to confirm your account, then log in.", "info", 10000);
        } else if (data.user && data.session) {
            showToast("Signup Successful!", "Account created and logged in!", "success");
        } else if (data.user && data.user.email_confirmed_at) {
            if (authMessageEl) authMessageEl.textContent = 'Account already confirmed. Please log in.';
            showToast("Account Exists", "Your account is already confirmed. Please log in.", "info");
        } else {
            if (authMessageEl) authMessageEl.textContent = 'There was an issue with signup. If you already have an account, try logging in. Otherwise, check your email for confirmation or try again.';
            showToast("Signup Issue", "Could not complete signup. Please check details or try logging in.", "warning");
        }
        return data.user; 
    } catch (e) {
        console.error("Sign up exception:", e);
        if (authErrorDiv) { authErrorDiv.textContent = "An unexpected error occurred during sign up."; authErrorDiv.style.display = 'block'; }
        showToast("Signup Failed", "An unexpected error occurred.", "error");
        return null;
    } finally {
        hideLoading();
    }
}

async function supabaseSignOutUser() {
    if (!window.supabaseClient) {
        showToast("Service Unavailable", "Cloud service not available for sign out.", "error");
        return;
    }
    if (!currentSupabaseUser) {
        if (typeof lockApp === 'function') lockApp("Already signed out.");
        return;
    }

    showLoading("Signing out...");
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            showToast("Logout Error", error.message, "error");
        } else {
            showToast("Logout Successful", "You have been signed out.", "info");
            movieData = [];
            if (typeof clearLocalMovieCache === 'function') await clearLocalMovieCache();
            if (typeof renderTable === 'function') renderTable();
        }
    } catch (e) {
        console.error("Sign out exception:", e);
        showToast("Logout Error", "An unexpected error occurred during sign out.", "error");
    } finally {
        hideLoading();
    }
}

async function supabaseSendPasswordResetEmail(email) {
    if (!window.supabaseClient) {
        showToast("Service Unavailable", "Password reset service not available.", "error");
        return false;
    }
    if (!email || !email.includes('@')) {
        showToast("Input Required", "Please enter a valid email address.", "warning");
        return false;
    }
    showLoading("Sending password reset email...");
    const authErrorDiv = document.getElementById('authError');
    const authMessageEl = document.getElementById('authMessage');
    if (authErrorDiv) { authErrorDiv.textContent = ''; authErrorDiv.style.display = 'none'; }

    let redirectToUrl = window.location.origin;
    if (!redirectToUrl.startsWith('http')) redirectToUrl = `https://${redirectToUrl}`; 

    try {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: redirectToUrl });
        if (error) {
            if (authErrorDiv) { authErrorDiv.textContent = error.message; authErrorDiv.style.display = 'block'; }
            showToast("Password Reset Failed", error.message, "error");
            return false;
        } else {
            if (authMessageEl) authMessageEl.textContent = 'Password reset email sent. Check your inbox (and spam folder).';
            showToast("Password Reset Email Sent", "If an account exists for this email, a password reset link has been sent.", "success", 7000);
            return true;
        }
    } catch (e) {
        console.error("Password reset exception:", e);
        if (authErrorDiv) { authErrorDiv.textContent = "An unexpected error occurred during password reset."; authErrorDiv.style.display = 'block'; }
        showToast("Password Reset Failed", "An unexpected error occurred.", "error");
        return false;
    } finally {
        hideLoading();
    }
}

async function eraseAllData() {
    const scopeElement = document.getElementById('eraseDataScope');
    if (!scopeElement) { showToast("Error", "Erase scope UI element not found.", "error"); return; }
    const scope = scopeElement.value;

    if (!confirm(`ERASING DATA: You are about to erase data for scope: "${scope}". This action is IRREVERSIBLE. Are you absolutely sure?`)) {
        $('#confirmEraseDataModal').modal('hide'); return;
    }

    let message = "", eraseLocalCache = false, eraseCloudData = false;

    if (scope === 'local') { message = "Erasing local device cache..."; eraseLocalCache = true; }
    else if (scope === 'cloud') {
        if (!currentSupabaseUser) { showToast("Not Logged In", "Cannot erase cloud data. Please log in first.", "error"); $('#confirmEraseDataModal').modal('hide'); return; }
        message = "Erasing all cloud account data..."; eraseCloudData = true;
    } else if (scope === 'both') {
        message = "Erasing local cache and cloud account data..."; eraseLocalCache = true;
        if (currentSupabaseUser) eraseCloudData = true;
        else showToast("Cloud Skipped", "Not logged into cloud. Only local cache will be erased.", "warning", 4000);
    } else { showToast("Error", "Invalid erase scope selected.", "error"); $('#confirmEraseDataModal').modal('hide'); return; }

    showLoading(message);
    try {
        if (eraseLocalCache) {
            if (typeof clearLocalMovieCache === 'function') await clearLocalMovieCache();
            movieData = []; 
            const keysToClear = [ DAILY_RECOMMENDATION_ID_KEY, DAILY_RECOMMENDATION_DATE_KEY, DAILY_REC_SKIP_COUNT_KEY, ...(typeof DO_NOT_SHOW_AGAIN_KEYS === 'object' ? Object.values(DO_NOT_SHOW_AGAIN_KEYS) : []) ];
            keysToClear.forEach(key => { if(key) localStorage.removeItem(key);});
            showToast("Local Cache Erased", "All local cached data has been deleted.", "warning", undefined, DO_NOT_SHOW_AGAIN_KEYS.DATA_ERASED);
        }

        if (eraseCloudData && currentSupabaseUser && window.supabaseClient) {
            const { error: deleteError } = await window.supabaseClient
                .from('movie_entries').delete().eq('user_id', currentSupabaseUser.id);
            if (deleteError) {
                console.error("Cloud data erase failed:", deleteError);
                throw new Error(`Cloud data erase failed: ${deleteError.message} (Code: ${deleteError.code})`);
            }
            showToast("Cloud Data Erased", "All cloud data for your account has been deleted.", "warning");
        }

        $('#confirmEraseDataModal').modal('hide');
        if (typeof renderTable === 'function') renderTable();

        if (eraseLocalCache && !eraseCloudData && currentSupabaseUser && typeof syncDataFromSupabase === 'function') {
            showToast("Local Data Cleared", "Fetching fresh data from cloud...", "info");
            await syncDataFromSupabase(true, false);
        }
    } catch (error) {
        console.error("Error erasing data:", error);
        showToast("Erase Failed", `Failed to erase data: ${error.message}.`, "error", 7000);
    } finally {
        hideLoading();
    }
}