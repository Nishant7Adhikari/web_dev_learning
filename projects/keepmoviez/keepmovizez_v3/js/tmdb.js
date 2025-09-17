/* tmdb.js */
/**
 * Generic function to make direct calls to the TMDB API.
 */
async function callTmdbApiDirect(endpoint, params = {}) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_NOW_MOVED_TO_SUPABASE_FUNCTION' || TMDB_API_KEY === 'YOUR ACTUAL TMDB API KEY HERE' || TMDB_API_KEY.length < 30) {
        const errorMessage = "TMDB API Key is not configured or invalid. Online search functionality is disabled.";
        console.error(errorMessage);
        if (typeof showToast === 'function' && typeof DO_NOT_SHOW_AGAIN_KEYS !== 'undefined') {
            showToast("API Key Missing", errorMessage, "error", 0, DO_NOT_SHOW_AGAIN_KEYS.TMDB_API_KEY_WARNING);
        }
        throw new Error(errorMessage); // Propagate error to calling function
    }

    const queryParams = new URLSearchParams(params);
    queryParams.append("api_key", TMDB_API_KEY);

    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.status_message || `TMDB API Error (${response.status}) for endpoint ${endpoint}.`;
            console.error("TMDB API Error:", response.status, data);
            throw new Error(errorMsg);
        }
        return data;
    } catch (error) {
        // Don't re-throw the "API Key Missing" error if that was the original cause
        if (error.message.includes("TMDB API Key is not configured")) {
            throw error; // Re-throw to be caught by specific handlers
        }
        console.error(`Error fetching from TMDB direct (${endpoint}):`, error);
        throw new Error(`Network or TMDB API error: ${error.message || 'Unknown error'}`);
    }
}


/**
 * Fetches movie/TV show information from TMDB based on the input name and optional year.
 */
async function fetchMovieInfoFromTmdb() {
    // Ensure formFieldsGlob and its properties are accessible
    if (!formFieldsGlob || !formFieldsGlob.name || !formFieldsGlob.name.value) {
        if (typeof showToast === 'function') showToast("Input Needed", "Movie/Series name input not found.", "error");
        if (typeof hideLoading === 'function') hideLoading();
        return;
    }
    const query = formFieldsGlob.name.value.trim();
    if (!query) {
        if (typeof showToast === 'function') showToast("Input Needed", "Enter movie/series name to search.", "info");
        if (typeof hideLoading === 'function') hideLoading();
        return;
    }

    const tmdbResultsEl = document.getElementById('tmdbSearchResults');
    if (tmdbResultsEl) {
        tmdbResultsEl.innerHTML = '<div class="list-group-item text-muted"><i>Searching TMDB...</i></div>';
        tmdbResultsEl.style.display = 'block';
    }

    const tmdbSearchYearEl = document.getElementById('tmdbSearchYear');
    const searchYear = tmdbSearchYearEl ? tmdbSearchYearEl.value : '';
    let results = [];

    try {
        if (searchYear) {
            const movieParams = { query: query, primary_release_year: searchYear };
            const tvParams = { query: query, first_air_date_year: searchYear };

            // Using Promise.allSettled to ensure both searches complete even if one fails
            const [movieSearch, tvSearch] = await Promise.allSettled([
                callTmdbApiDirect('/search/movie', movieParams),
                callTmdbApiDirect('/search/tv', tvParams)
            ]);

            const movieData = movieSearch.status === 'fulfilled' ? movieSearch.value.results : [];
            const tvData = tvSearch.status === 'fulfilled' ? tvSearch.value.results : [];
            
            results = [
                ...movieData.map(item => ({ ...item, media_type: 'movie' })),
                ...tvData.map(item => ({ ...item, media_type: 'tv' }))
            ];
        } else {
            const multiData = await callTmdbApiDirect('/search/multi', { query: query });
            results = multiData.results || [];
        }
        displayTmdbResults(results);
    } catch (error) {
        console.error("Error fetching from TMDB (direct search):", error);
        if (tmdbResultsEl) tmdbResultsEl.innerHTML = `<div class="list-group-item text-danger">Search Error: ${error.message}</div>`;
        if (!error.message.includes("TMDB API Key is not configured")) { // Avoid double toast for API key
            if (typeof showToast === 'function') showToast("TMDB Search Error", `Failed: ${error.message}`, "error");
        }
    } finally {
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Displays TMDB search results in a dropdown list.
 */
function displayTmdbResults(results) {
    const tmdbResultsDiv = document.getElementById('tmdbSearchResults');
    if (!tmdbResultsDiv) return;
    tmdbResultsDiv.innerHTML = '';

    const filteredResults = results.filter(item =>
        (item.media_type === 'movie' || item.media_type === 'tv') && (item.title || item.name)
    );

    if (filteredResults.length === 0) {
        tmdbResultsDiv.innerHTML = '<div class="list-group-item text-muted">No relevant results found. Try refining your search or year.</div>';
        tmdbResultsDiv.style.display = 'block';
        return;
    }

    filteredResults.slice(0, 10).forEach(item => { // Limit to 10 results for performance
        const title = item.title || item.name;
        const releaseDate = item.release_date || item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : 'https://via.placeholder.com/40x60?text=N/A';
        const overview = item.overview ? (item.overview.substring(0, 100) + (item.overview.length > 100 ? '...' : '')) : 'No overview.';


        const resultItem = document.createElement('div');
        resultItem.className = 'list-group-item list-group-item-action search-results-item d-flex align-items-start p-2'; // Use align-items-start for better layout with overview
        resultItem.innerHTML = `
            <img src="${posterPath}" class="tmdb-poster-thumb mr-2" alt="Poster for ${title}" style="width:50px; height:auto;">
            <div class="flex-grow-1">
                ${item.media_type === 'tv' ? '<i class="fas fa-tv text-info mr-1" title="TV Series"></i>' : '<i class="fas fa-film text-warning mr-1" title="Movie"></i>'}
                <strong>${title}</strong> <span class="text-muted">(${year})</span>
                <p class="mb-0 mt-1 text-muted small">${overview}</p>
            </div>`;
        resultItem.addEventListener('click', () => {
            applyTmdbSelection(item);
            tmdbResultsDiv.innerHTML = '';
            tmdbResultsDiv.style.display = 'none';
        });
        tmdbResultsDiv.appendChild(resultItem);
    });
    tmdbResultsDiv.style.display = 'block';
}

/**
 * Applies the selected TMDB search result's details to the form fields.
 * Fetches detailed info: keywords, cast, crew, production companies, collection, runtime.
 */
async function applyTmdbSelection(item) {
    if (!formFieldsGlob) {
        console.error("formFieldsGlob not initialized. Cannot apply TMDB selection.");
        return;
    }
    if (typeof showLoading === 'function') showLoading("Fetching details for TMDB selection...");

    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : '';

    let tmdbGenres = [], tmdbCountryISO = '', tmdbLanguage = '', tmdbKeywords = [];
    let tmdbPosterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${item.poster_path}` : '';
    let tmdbCast = [], tmdbDirector = null, tmdbProductionCompanies = [];
    let tmdbVoteAverage = null, tmdbVoteCount = null, tmdbRuntime = null;
    let tmdbCollectionId = null, tmdbCollectionName = null;
    let detailData = {};

    try {
        detailData = await callTmdbApiDirect(`/${item.media_type}/${item.id}`, { append_to_response: 'keywords,credits,collection' });

        if (detailData.genres) tmdbGenres = detailData.genres.map(g => g.name);

        if (detailData.production_countries && detailData.production_countries.length > 0) {
            tmdbCountryISO = detailData.production_countries[0].iso_3166_1 || '';
        } else if (detailData.origin_country && detailData.origin_country.length > 0) {
             tmdbCountryISO = detailData.origin_country[0] || '';
        }

        if (detailData.original_language) {
            const langObj = (detailData.spoken_languages || []).find(l => l.iso_639_1 === detailData.original_language);
            tmdbLanguage = langObj ? (langObj.english_name || langObj.name || detailData.original_language.toUpperCase()) : detailData.original_language.toUpperCase();
        } else if (detailData.spoken_languages && detailData.spoken_languages.length > 0) {
             tmdbLanguage = detailData.spoken_languages[0].english_name || detailData.spoken_languages[0].name;
        }


        if (detailData.keywords) {
            const keywordsData = detailData.keywords.keywords || detailData.keywords.results || [];
            tmdbKeywords = keywordsData.map(k => ({ id: k.id, name: k.name }));
        }

        if (detailData.poster_path) tmdbPosterPath = `${TMDB_IMAGE_BASE_URL}w500${detailData.poster_path}`;

        if (detailData.credits) {
            if (detailData.credits.cast) {
                tmdbCast = detailData.credits.cast.slice(0, 15).map(c => ({ id: c.id, name: c.name, character: c.character, profile_path: c.profile_path, order: c.order })); // Top 15, include order
            }
            if (detailData.credits.crew) {
                const directorObj = detailData.credits.crew.find(c => c.job === 'Director');
                if (directorObj) tmdbDirector = { id: directorObj.id, name: directorObj.name, profile_path: directorObj.profile_path, job: directorObj.job };
            }
        }

        if (detailData.production_companies) {
            tmdbProductionCompanies = detailData.production_companies.map(pc => ({ id: pc.id, name: pc.name, logo_path: pc.logo_path, origin_country: pc.origin_country }));
        }

        tmdbVoteAverage = item.vote_average || detailData.vote_average || null;
        tmdbVoteCount = item.vote_count || detailData.vote_count || null;
        if (item.media_type === 'movie') tmdbRuntime = detailData.runtime || null;

        if (detailData.belongs_to_collection) {
            tmdbCollectionId = detailData.belongs_to_collection.id;
            tmdbCollectionName = detailData.belongs_to_collection.name;
        }

    } catch (error) {
        console.error("Error fetching TMDB item details (direct):", error);
        if (!error.message.includes("TMDB API Key is not configured") && typeof showToast === 'function') {
            showToast("TMDB Detail Error", `Could not fetch detailed info: ${error.message}`, "warning");
        }
    }

    // Populate form fields
    if (formFieldsGlob.name) formFieldsGlob.name.value = item.title || item.name || formFieldsGlob.name.value;
    if (formFieldsGlob.category) formFieldsGlob.category.value = item.media_type === 'movie' ? 'Movie' : (item.media_type === 'tv' ? 'Series' : 'Special');
    if (formFieldsGlob.year) formFieldsGlob.year.value = year;
    if (formFieldsGlob.country) formFieldsGlob.country.value = tmdbCountryISO;
    if (formFieldsGlob.language) formFieldsGlob.language.value = tmdbLanguage;
    if (formFieldsGlob.posterUrl) formFieldsGlob.posterUrl.value = tmdbPosterPath;
    if (item.overview && formFieldsGlob.description) formFieldsGlob.description.value = item.overview;

    const tmdbIdInput = document.getElementById('tmdbId');
    const tmdbMediaTypeInput = document.getElementById('tmdbMediaType');
    if (tmdbIdInput) tmdbIdInput.value = item.id;
    if (tmdbMediaTypeInput) tmdbMediaTypeInput.value = item.media_type;

    if (tmdbGenres.length > 0 && typeof selectedGenres !== 'undefined' && typeof renderGenreTags === 'function' && typeof populateGenreDropdown === 'function') {
        const currentSelectedGenres = new Set(selectedGenres); // Use global selectedGenres
        tmdbGenres.forEach(tmdbGenreName => {
            const matchedLocalGenre = UNIQUE_ALL_GENRES.find(localGenre =>
                String(localGenre).toLowerCase() === String(tmdbGenreName).toLowerCase().replace(/-/g, ' ')
            );
            if (matchedLocalGenre) {
                currentSelectedGenres.add(matchedLocalGenre);
            } else { // If no exact match, try a looser match or add as new if system allows
                const looselyMatched = UNIQUE_ALL_GENRES.find(g => g.toLowerCase() === tmdbGenreName.toLowerCase());
                if (looselyMatched) currentSelectedGenres.add(looselyMatched);
                // else console.warn(`TMDB Genre "${tmdbGenreName}" not found in local ALL_GENRES.`);
            }
        });
        selectedGenres = Array.from(currentSelectedGenres).sort(); // Update global selectedGenres
        renderGenreTags();
        populateGenreDropdown(); // Refresh dropdown
    }

    const entryFormEl = document.getElementById('entryForm');
    if (entryFormEl) { // Cache fetched TMDB data on the form element itself
        entryFormEl._tempTmdbData = {
            keywords: tmdbKeywords,
            full_cast: tmdbCast, // Changed from 'cast' to 'full_cast' to match property name
            director_info: tmdbDirector, // Changed from 'director' to 'director_info'
            production_companies: tmdbProductionCompanies,
            tmdb_vote_average: tmdbVoteAverage, // Changed from 'vote_average'
            tmdb_vote_count: tmdbVoteCount,     // Changed from 'vote_count'
            runtime: tmdbRuntime,
            tmdb_collection_id: tmdbCollectionId,
            tmdb_collection_name: tmdbCollectionName
        };
    }
    if (typeof showToast === 'function') showToast("Info Applied", `${item.title || item.name} details pre-filled. Review and save.`, "info", 3000);
    if (typeof hideLoading === 'function') hideLoading();
}


/**
 * Fetches credits (cast and director) for a given TMDB ID and media type.
 * Note: This is less used now as `applyTmdbSelection` fetches credits via `append_to_response`.
 * Kept for potential direct use or future features.
 */
async function fetchTmdbCredits(mediaType, mediaId) {
    if (!mediaType || !mediaId) return null;
    try {
        const data = await callTmdbApiDirect(`/${mediaType}/${mediaId}/credits`);
        return data; // Contains cast and crew
    } catch (error) {
        console.error(`Error fetching TMDB credits for ${mediaType}/${mediaId} (direct):`, error);
        if (!error.message.includes("TMDB API Key is not configured") && typeof showToast === 'function') {
           showToast("TMDB Credits Error", `Could not fetch cast/crew: ${error.message}`, "warning");
        }
        return null;
    }
}

/**
 * Fetches collection (franchise) details if a movie belongs to one.
 * Note: Less used directly, as `applyTmdbSelection` gets collection info.
 */
async function fetchTmdbCollection(mediaId, mediaType) {
    if (mediaType !== 'movie' || !mediaId) return null; // Collections are typically for movies
    try {
        // First get movie details to find belongs_to_collection
        const movieDetails = await callTmdbApiDirect(`/movie/${mediaId}`);
        if (movieDetails && movieDetails.belongs_to_collection && movieDetails.belongs_to_collection.id) {
            const collectionId = movieDetails.belongs_to_collection.id;
            // Then fetch the full collection details
            const collectionDetails = await callTmdbApiDirect(`/collection/${collectionId}`);
            return collectionDetails;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching TMDB collection for movie ${mediaId} (direct):`, error);
        return null;
    }
}

/**
 * Fetches keywords for a TMDB entry.
 * Note: Less used directly, as `applyTmdbSelection` gets keywords.
 */
async function fetchTmdbKeywords(mediaType, mediaId) {
    if (!mediaType || !mediaId) return [];
    try {
        const data = await callTmdbApiDirect(`/${mediaType}/${mediaId}/keywords`);
        return data.keywords || data.results || []; // TMDB API varies: sometimes 'keywords', sometimes 'results' for TV
    } catch (error) {
        console.error(`Error fetching TMDB keywords for ${mediaType}/${mediaId} (direct):`, error);
        return [];
    }
}

/**
 * Fetches a person's details from TMDB (for the person details modal).
 * @param {number} personId TMDB person ID.
 * @returns {Promise<object|null>} Person details including profile path, bio, and combined credits.
 */
async function fetchTmdbPersonDetails(personId) {
    if (!personId) return null;
    try {
        // Fetch main details + movie_credits, tv_credits, images
        const data = await callTmdbApiDirect(`/person/${personId}`, { append_to_response: 'combined_credits,images' });
        return data;
    } catch (error) {
        console.error(`Error fetching TMDB person details for ID ${personId}:`, error);
        if (!error.message.includes("TMDB API Key is not configured") && typeof showToast === 'function') {
           showToast("TMDB Person Error", `Could not fetch person details: ${error.message}`, "warning");
        }
        return null;
    }
}
