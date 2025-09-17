// Helper function to generate dynamic colors for charts (remains the same)
function generateColors(count, alpha = 0.7) {
    const colors = [];
    const baseHues = [200, 30, 260, 60, 150, 330, 90, 0, 230, 180, 45, 280, 120, 20, 300, 100, 20, 350, 75, 135, 215, 290, 5, 170];
    const saturation = 70;
    const lightness = 55;
    for (let i = 0; i < count; i++) {
        const hue = (baseHues[i % baseHues.length] + (Math.floor(i / baseHues.length) * 13)) % 360;
        colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`);
    }
    return colors;
}

// Function to destroy Chart.js instances for a given tracking object
function destroyCharts(chartInstanceObject = chartInstances) {
    for (const chartId in chartInstanceObject) {
        if (chartInstanceObject[chartId] && typeof chartInstanceObject[chartId].destroy === 'function') {
            chartInstanceObject[chartId].destroy();
        }
        delete chartInstanceObject[chartId];
    }
}

// --- Main Statistics Calculation Function ---
function calculateAllStatistics(currentMovieData) {
    if (!Array.isArray(currentMovieData) || currentMovieData.length === 0) {
        console.warn("No movie data provided to calculateAllStatistics.");
        return {
            totalEntries: 0, totalTitlesWatched: 0, totalWatchInstances: 0, avgOverallRating: 'N/A',
            toWatchCompletion: '0', watchedCountProgress: 0, totalRelevantCountProgress: 0,
            avgMonthlyPace: 'N/A', estimatedCompletionTime: 'N/A',
            categories: [], statuses: [], topRatedGenresOverall: [], watchesByYear: [], watchesByMonth: [],
            topSingleGenres: [], avgRatingByGenre: [], genreCombinations: [],
            overallRatingDistributionData: [], watchInstanceRatingDistributionData: [],
            avgOverallRatingByCategory: [], topCountries: [], topLanguages: [],
            mostWatchedActors: [], mostWatchedDirectors: [], mostFrequentProductionCompanies: [],
            avgRatingByStudio: [],
            achievementData: { /* Ensure all expected keys for achievements are present with default/zero values */
                total_entries: 0, total_titles_watched: 0, distinct_titles_rewatched: 0, single_title_rewatch_max: 0,
                category_watched_counts: {}, long_series_watched_count: 0, genre_watched_counts: {}, genre_variety_count: 0,
                rated_titles_count: 0, specific_rating_counts: {}, recommendation_level_counts: {}, personal_audience_counts: {},
                decade_variety_count: 0, pre_year_watched_counts: {}, recent_years_watched_counts: {},
                status_counts: {}, status_continue_active_count: 0, active_days_count: 0, country_variety_count: 0, language_variety_count: 0,
                detailed_description_counts: {}, poster_url_present_count: 0, tmdb_collection_streak_max: 0, director_streak_max: 0,
                studio_streak_max: 0, manual_links_pairs_count: 0, hidden_gem_counts: {}, all_statuses_present_check: false,
                sync_count: 0, stats_modal_opened_count: 0, time_of_day_watch_counts: {}, daily_recommendation_watched_count: 0
            }
        };
    }

    const stats = { achievementData: {} }; // Initialize globalStatsData structure

    let currentTotalEntries = currentMovieData.length;
    let currentTotalWatchInstances = 0, currentTotalTitlesWatchedCount = 0, currentSumOverallRatings = 0, currentRatedEntriesCount = 0;
    let currentToWatchCount = 0, currentActualWatchedCount = 0, currentActuallyRatedCount = 0;
    const categories = {}, statuses = {}, overallRatingCounts = {'1':0,'2':0,'3':0,'4':0,'5':0,'N/A':0};
    const watchInstanceRatingCounts = {'1':0,'2':0,'3':0,'4':0,'5':0,'N/A':0};
    const singleGenreCounts = {}, watchedGenreCounts = {}, genreRatingsSum = {}, genreRatedEntriesCount = {};
    const genreCombinations = {}, watchesByYear = {}, watchesByMonth = {};
    const countryCounts = {}, watchedCountryCounts = {}, languageCounts = {}, watchedLanguageCounts = {};
    const avgOverallRatingByCategory = {}, actorWatchCounts = {}, directorWatchCounts = {}, productionCompanyCounts = {};
    const uniqueCountriesWatched = new Set(), uniqueLanguagesWatched = new Set(), uniqueGenresWatched = new Set(), uniqueDecadesWatched = new Set();
    let distinctTitlesRewatchedCount = 0, maxSingleTitleRewatchCount = 0;
    let longSeriesCompletedCount = 0;
    let pre1980WatchedCount = 0, recent5YearsWatchedCount = 0;
    let titlesWithHighRec = 0, titlesForAnyone = 0;
    let statusContinueActiveCount = 0;
    let detailedDescriptionCount = 0, posterUrlPresentCount = 0;
    let tmdbCollectionStreakCount = 0; const tmdbCollectionEntries = {};
    let directorStreakCount = 0; const directorEntries = {};
    let studioStreakCount = 0; const studioEntries = {};
    let manualLinksCount = 0; let hiddenGemCount = 0;
    let allStatusesPresent = { "To Watch":0, "Watched":0, "Continue":0, "Unwatched":0 };
    const rewatchCountsPerTitle = {};

    currentMovieData.forEach(movie => {
        if (!movie || !movie.id) return;
        if (movie.Status && allStatusesPresent.hasOwnProperty(movie.Status)) allStatusesPresent[movie.Status]++;
        if (movie.Status === 'To Watch') currentToWatchCount++;
        if (movie.Status === 'Watched') currentActualWatchedCount++;
        if (movie.Status === 'Continue') statusContinueActiveCount++;
        const isConsideredWatched = (movie.Status === 'Watched' || movie.Status === 'Continue');
        if (isConsideredWatched) {
            currentTotalTitlesWatchedCount++;
            if (movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating))) { currentSumOverallRatings += parseFloat(movie.overallRating); currentRatedEntriesCount++; }
            if(movie.Genre) String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean).forEach(g => { watchedGenreCounts[g] = (watchedGenreCounts[g] || 0) + 1; uniqueGenresWatched.add(g); });
            if(movie.Country) String(movie.Country).split(',').map(c => String(c).trim()).filter(Boolean).forEach(c => { watchedCountryCounts[c] = (watchedCountryCounts[c] || 0) + 1; uniqueCountriesWatched.add(c); });
            if(movie.Language) String(movie.Language).split(',').map(l => String(l).trim()).filter(Boolean).forEach(l => { watchedLanguageCounts[l] = (watchedLanguageCounts[l] || 0) + 1; uniqueLanguagesWatched.add(l); });
            if (Array.isArray(movie.full_cast)) movie.full_cast.slice(0,5).forEach(p => { if(p && p.name) actorWatchCounts[p.name] = (actorWatchCounts[p.name] || 0) + 1;});
            if (movie.director_info && movie.director_info.name) { directorWatchCounts[movie.director_info.name] = (directorWatchCounts[movie.director_info.name] || 0) + 1; if (movie.director_info.id) directorEntries[movie.director_info.id] = (directorEntries[movie.director_info.id] || 0) + 1; }
            if (Array.isArray(movie.production_companies)) movie.production_companies.forEach(c => { if(c && c.name) productionCompanyCounts[c.name] = (productionCompanyCounts[c.name] || 0) + 1; if(c && c.id) studioEntries[c.id] = (studioEntries[c.id] || 0) + 1; });
            if (movie.Year && !isNaN(parseInt(movie.Year))) { const year = parseInt(movie.Year); const decade = Math.floor(year / 10) * 10; uniqueDecadesWatched.add(decade); if (year < 1980) pre1980WatchedCount++; if (year >= (new Date().getFullYear() - 5)) recent5YearsWatchedCount++; }
            if (movie.tmdb_collection_id) tmdbCollectionEntries[movie.tmdb_collection_id] = (tmdbCollectionEntries[movie.tmdb_collection_id] || 0) + 1;
            if (movie.tmdb_vote_count && movie.tmdb_vote_count < 1000 && movie.tmdb_vote_average && movie.tmdb_vote_average > 7.0) hiddenGemCount++;
        }
        categories[movie.Category || 'N/A'] = (categories[movie.Category || 'N/A'] || 0) + 1;
        statuses[movie.Status || 'N/A'] = (statuses[movie.Status || 'N/A'] || 0) + 1;
        const orKey = String(movie.overallRating !== '' && movie.overallRating !== null ? movie.overallRating : 'N/A');
        overallRatingCounts[orKey] = (overallRatingCounts[orKey] || 0) + 1;
        if(orKey !== 'N/A') currentActuallyRatedCount++;
        if(movie.Category){ avgOverallRatingByCategory[movie.Category] = avgOverallRatingByCategory[movie.Category] || {sum:0, count:0}; if(movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating))){ avgOverallRatingByCategory[movie.Category].sum += parseFloat(movie.overallRating); avgOverallRatingByCategory[movie.Category].count++; }}
        if(Array.isArray(movie.watchHistory)){
            currentTotalWatchInstances += movie.watchHistory.length;
            if (movie.watchHistory.length > 1) rewatchCountsPerTitle[movie.id] = (rewatchCountsPerTitle[movie.id] || 0) + movie.watchHistory.length;
            movie.watchHistory.forEach(wh => {
                if(!wh || !wh.date) return;
                const wirKey = String(wh.rating !== '' && wh.rating !== null ? wh.rating : 'N/A');
                watchInstanceRatingCounts[wirKey] = (watchInstanceRatingCounts[wirKey] || 0) + 1;
                try{ const d = new Date(wh.date); const y = d.getFullYear().toString(); const m = d.getMonth(); const ymISO = `${y}-${(m + 1).toString().padStart(2, '0')}`; const myLabel = `${d.toLocaleString('default', { month: 'short' })} ${y}`; watchesByYear[y] = watchesByYear[y] || {instances:0, titles:new Set(), ratingsSum:0, ratedCount:0}; watchesByYear[y].instances++; watchesByYear[y].titles.add(movie.Name); if(wh.rating && wh.rating !== '' && !isNaN(parseFloat(wh.rating))){ watchesByYear[y].ratingsSum += parseFloat(wh.rating); watchesByYear[y].ratedCount++; } watchesByMonth[ymISO] = watchesByMonth[ymISO] || {month_year_iso: ymISO, month_year_label: myLabel, instances:0, titles:new Set(), ratingsSum:0, ratedCount:0}; watchesByMonth[ymISO].instances++; watchesByMonth[ymISO].titles.add(movie.Name); if(wh.rating && wh.rating !== '' && !isNaN(parseFloat(wh.rating))){ watchesByMonth[ymISO].ratingsSum += parseFloat(wh.rating); watchesByMonth[ymISO].ratedCount++; }} catch(e){ console.warn("Error parsing watch date for stats:", wh.date, e); }
            });
        }
        if(movie.Genre){ const genres = String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean); genres.forEach(g => { singleGenreCounts[g] = (singleGenreCounts[g] || 0) + 1; if(movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating))){ genreRatingsSum[g] = (genreRatingsSum[g] || 0) + parseFloat(movie.overallRating); genreRatedEntriesCount[g] = (genreRatedEntriesCount[g] || 0) + 1; }}); if(genres.length > 1) genreCombinations[genres.sort().join(' + ')] = (genreCombinations[genres.sort().join(' + ')] || 0) + 1; }
        if(movie.Country) String(movie.Country).split(',').map(c => String(c).trim()).filter(Boolean).forEach(c => countryCounts[c] = (countryCounts[c] || 0) + 1);
        if(movie.Language) String(movie.Language).split(',').map(l => String(l).trim()).filter(Boolean).forEach(l => languageCounts[l] = (languageCounts[l] || 0) + 1);
        if (movie.Recommendation === 'Highly Recommended') titlesWithHighRec++;
        if (movie.personalRecommendation === 'Safe to share') titlesForAnyone++;
        if (movie.Description && movie.Description.length > 100) detailedDescriptionCount++;
        if (movie['Poster URL']) posterUrlPresentCount++;
        if (Array.isArray(movie.relatedEntries)) manualLinksCount += movie.relatedEntries.length / 2;
    });

    distinctTitlesRewatchedCount = Object.keys(rewatchCountsPerTitle).length;
    maxSingleTitleRewatchCount = Object.values(rewatchCountsPerTitle).reduce((max, count) => Math.max(max, count), 0);
    tmdbCollectionStreakCount = Object.values(tmdbCollectionEntries).reduce((max, count) => Math.max(max, count), 0);
    directorStreakCount = Object.values(directorEntries).reduce((max, count) => Math.max(max, count), 0);
    studioStreakCount = Object.values(studioEntries).reduce((max, count) => Math.max(max, count), 0);

    stats.totalEntries = currentTotalEntries; stats.totalTitlesWatched = currentTotalTitlesWatchedCount; stats.totalWatchInstances = currentTotalWatchInstances;
    stats.avgOverallRating = currentRatedEntriesCount > 0 ? (currentSumOverallRatings / currentRatedEntriesCount).toFixed(2) : 'N/A';
    const totalRelevantForProgress = currentTotalEntries - (statuses['Unwatched'] || 0);
    stats.toWatchCompletion = totalRelevantForProgress > 0 ? ((currentTotalTitlesWatchedCount / totalRelevantForProgress) * 100).toFixed(1) : '0';
    stats.watchedCountProgress = currentTotalTitlesWatchedCount; stats.totalRelevantCountProgress = totalRelevantForProgress;
    const monthlyActivity = Object.values(watchesByMonth).sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
    const last12Months = monthlyActivity.slice(-12); const totalWatchesLast12 = last12Months.reduce((sum, m) => sum + m.instances, 0);
    stats.avgMonthlyPace = last12Months.length > 0 ? (totalWatchesLast12 / last12Months.length).toFixed(1) : 'N/A';
    if (currentToWatchCount > 0 && stats.avgMonthlyPace !== 'N/A' && parseFloat(stats.avgMonthlyPace) > 0) { const monthsToComplete = currentToWatchCount / parseFloat(stats.avgMonthlyPace); stats.estimatedCompletionTime = monthsToComplete < 12 ? `${monthsToComplete.toFixed(1)} months` : `${(monthsToComplete / 12).toFixed(1)} years`; } else { stats.estimatedCompletionTime = 'N/A'; }
    stats.categories = Object.entries(categories).map(([l, v]) => ({ label:l, value:v })).sort((a,b) => b.value - a.value);
    stats.statuses = Object.entries(statuses).map(([l, v]) => ({ label:l, value:v })).sort((a,b) => b.value - a.value);
    stats.topRatedGenresOverall = Object.keys(genreRatingsSum).map(g => ({label: g, value: genreRatedEntriesCount[g] >= 2 ? (genreRatingsSum[g] / genreRatedEntriesCount[g]).toFixed(2) : 'N/A', count: genreRatedEntriesCount[g]})).filter(g => g.value !== 'N/A').sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    stats.watchesByYear = Object.keys(watchesByYear).map(y => ({year: y, instances: watchesByYear[y].instances, unique_titles: watchesByYear[y].titles, avg_rating: watchesByYear[y].ratedCount > 0 ? (watchesByYear[y].ratingsSum / watchesByYear[y].ratedCount).toFixed(2) : 'N/A'})).sort((a, b) => parseInt(b.year) - parseInt(a.year));
    stats.watchesByMonth = Object.values(watchesByMonth).map(m => ({...m, avg_rating: m.ratedCount > 0 ? (m.ratingsSum / m.ratedCount).toFixed(2) : 'N/A'})).sort((a,b) => new Date(b.month_year_iso) - new Date(a.month_year_iso));
    stats.topSingleGenres = Object.entries(singleGenreCounts).map(([l, v]) => ({ label:l, value:v })).sort((a, b) => b.value - a.value);
    stats.avgRatingByGenre = Object.keys(genreRatingsSum).map(g => ({label: g, value: genreRatedEntriesCount[g] >= 1 ? (genreRatingsSum[g] / genreRatedEntriesCount[g]).toFixed(2) : 'N/A', count: genreRatedEntriesCount[g]})).filter(g => g.value !== 'N/A').sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    stats.genreCombinations = Object.entries(genreCombinations).map(([l,v])=>({label:l, value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
    stats.overallRatingDistributionData = []; ['5','4','3','2','1','N/A'].forEach(k => { if(overallRatingCounts[k] > 0) stats.overallRatingDistributionData.push({label: getRatingTextLabel(k), value: overallRatingCounts[k]}); }); // getRatingTextLabel is global
    stats.watchInstanceRatingDistributionData = []; ['5','4','3','2','1','N/A'].forEach(k => { if(watchInstanceRatingCounts[k] > 0) stats.watchInstanceRatingDistributionData.push({label: getRatingTextLabel(k), value: watchInstanceRatingCounts[k]}); });
    stats.avgOverallRatingByCategory = Object.entries(avgOverallRatingByCategory).map(([cat, data])=>({label:cat, value: data.count > 0 ? `${(data.sum/data.count).toFixed(2)} avg (${data.count} entries)` : `N/A (0 entries)`})).sort((a,b)=>{ const valA = String(a.value).match(/[\d.]+/); const valB = String(b.value).match(/[\d.]+/); return (valB ? parseFloat(valB[0]) : -1) - (valA ? parseFloat(valA[0]) : -1); });
    stats.topCountries = Object.entries(watchedCountryCounts).map(([l,v])=>({label:getCountryFullName(l), value:v})).sort((a,b)=>b.value-a.value).slice(0,10); // getCountryFullName is global
    stats.topLanguages = Object.entries(watchedLanguageCounts).map(([l,v])=>({label:l, value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
    stats.mostWatchedActors = Object.entries(actorWatchCounts).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
    stats.mostWatchedDirectors = Object.entries(directorWatchCounts).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
    stats.mostFrequentProductionCompanies = Object.entries(productionCompanyCounts).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
    const studioRatingSums = {}, studioRatedCounts = {};
    currentMovieData.forEach(movie => { if (movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating)) && Array.isArray(movie.production_companies)) { movie.production_companies.forEach(c => { if(c && c.name){ studioRatingSums[c.name] = (studioRatingSums[c.name]||0) + parseFloat(movie.overallRating); studioRatedCounts[c.name] = (studioRatedCounts[c.name]||0) + 1;}}); }});
    stats.avgRatingByStudio = Object.keys(studioRatingSums).map(n=>({label:n,value:studioRatedCounts[n]>=2?(studioRatingSums[n]/studioRatedCounts[n]).toFixed(2):'N/A',count:studioRatedCounts[n]})).filter(s=>s.value!=='N/A').sort((a,b)=>parseFloat(b.value)-parseFloat(a.value)).slice(0,10);
    stats.achievementData = { total_entries: currentTotalEntries, total_titles_watched: currentTotalTitlesWatchedCount, distinct_titles_rewatched: distinctTitlesRewatchedCount, single_title_rewatch_max: maxSingleTitleRewatchCount, category_watched_counts: {}, long_series_watched_count: longSeriesCompletedCount, genre_watched_counts: watchedGenreCounts, genre_variety_count: uniqueGenresWatched.size, rated_titles_count: currentActuallyRatedCount, specific_rating_counts: overallRatingCounts, recommendation_level_counts: { "Highly Recommended": titlesWithHighRec }, personal_audience_counts: { "safe to share": titlesForAnyone }, decade_variety_count: uniqueDecadesWatched.size, pre_year_watched_counts: { "1980": pre1980WatchedCount }, recent_years_watched_counts: { "5": recent5YearsWatchedCount }, status_counts: statuses, status_continue_active_count: statusContinueActiveCount, country_variety_count: uniqueCountriesWatched.size, language_variety_count: uniqueLanguagesWatched.size, detailed_description_counts: { "100": detailedDescriptionCount }, poster_url_present_count: posterUrlPresentCount, tmdb_collection_streak_max: tmdbCollectionStreakCount, director_streak_max: directorStreakCount, studio_streak_max: studioStreakCount, manual_links_pairs_count: manualLinksCount, hidden_gem_counts: { "1000_7.0": hiddenGemCount }, all_statuses_present_check: (allStatusesPresent["To Watch"] > 0 && allStatusesPresent["Watched"] > 0 && allStatusesPresent["Continue"] > 0 && allStatusesPresent["Unwatched"] > 0), sync_count: parseInt(localStorage.getItem('sync_count_achievement') || '0'), stats_modal_opened_count: parseInt(localStorage.getItem('stats_modal_opened_count_achievement') || '0'), active_days_count: (JSON.parse(localStorage.getItem('app_usage_dates_achievement') || '[]')).length, time_of_day_watch_counts: { night: localStorage.getItem('night_owl_achieved') ? 1 : 0, early_morning: localStorage.getItem('early_bird_achieved') ? 1 : 0, }, daily_recommendation_watched_count: parseInt(localStorage.getItem('daily_rec_watched_achievement') || '0'), };
    UNIQUE_ALL_GENRES.forEach(genre => { if (!stats.achievementData.genre_watched_counts[genre]) stats.achievementData.genre_watched_counts[genre] = 0; }); // UNIQUE_ALL_GENRES is global
    ['Movie', 'Series', 'Documentary', 'Special'].forEach(cat => { stats.achievementData.category_watched_counts[cat] = currentMovieData.filter(m => m.Category === cat && (m.Status === 'Watched' || m.Status === 'Continue')).length; });

    return stats;
}


// --- New Display Functions for Modals ---
async function displayDailyRecommendationModal() {
    const modalBody = document.getElementById('dailyRecommendationModalBody');
    if (!modalBody) { console.warn("Daily recommendation modal body not found."); return; }
    modalBody.innerHTML = '<p class="text-center text-muted p-3">Loading daily recommendation...</p>';

    const { message: dailyRecMsg, movie: dailyRecMovie, dailyRecSkipCount } = getDailyRecommendationMovie(); // getDailyRecommendationMovie is global

    if (dailyRecMovie) {
        modalBody.innerHTML = `
            <h5 class="mt-1">Your Daily Pick! <small class="text-muted">(Skips left: ${MAX_DAILY_SKIPS - dailyRecSkipCount})</small></h5>
            <div class="recommendation-item daily-pick list-group-item p-3 shadow-sm rounded">
                <div class="d-flex w-100 justify-content-between">
                     <h6 class="mb-1">${dailyRecMovie.Name} <small class="text-muted">(${dailyRecMovie.Year || 'N/A'})</small></h6>
                     ${dailyRecMovie.tmdb_vote_average ? `<small class="text-info" title="TMDB Rating">TMDB: ${dailyRecMovie.tmdb_vote_average.toFixed(1)} <i class="fas fa-star text-warning"></i></small>` : ''}
                </div>
                <p class="mb-1 text-muted small"><strong>Category:</strong> ${dailyRecMovie.Category || 'N/A'} | <strong>Genre:</strong> ${dailyRecMovie.Genre || 'N/A'}</p>
                <p class="mb-2 text-muted small">${(dailyRecMovie.Description || 'No description available.').substring(0, 150)}${dailyRecMovie.Description && dailyRecMovie.Description.length > 150 ? '...' : ''}</p>
                <div class="text-right mt-2">
                    <button class="btn btn-sm btn-warning skip-daily-rec-modal mr-2" data-movie-id="${dailyRecMovie.id}" title="Skip this pick for today"><i class="fas fa-forward"></i> Skip</button>
                    <button class="btn btn-sm btn-info view-btn-modal mr-2" data-movie-id="${dailyRecMovie.id}" title="View Details"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-sm btn-success mark-completed-daily-rec-modal" data-movie-id="${dailyRecMovie.id}" title="Mark as Watched"><i class="fas fa-check-circle"></i> Watched It!</button>
                </div>
            </div>`;
        modalBody.querySelector('.view-btn-modal').addEventListener('click', function() {
            $('#dailyRecommendationModal').modal('hide');
            $('#dailyRecommendationModal').one('hidden.bs.modal', () => openDetailsModal(this.dataset.movieId)); // openDetailsModal is global
        });
        modalBody.querySelector('.mark-completed-daily-rec-modal').addEventListener('click', async function(event) {
            await markDailyRecCompleted(event); // markDailyRecCompleted is global
            $('#dailyRecommendationModal').modal('hide');
        });
        modalBody.querySelector('.skip-daily-rec-modal').addEventListener('click', async function(event) {
            await markDailyRecSkipped(event); // markDailyRecSkipped is global
            showLoading("Getting next pick..."); // showLoading is global
            await displayDailyRecommendationModal(); // Re-render this modal
            hideLoading(); // hideLoading is global
        });
    } else {
        modalBody.innerHTML = `<p class="text-center text-muted p-3">${dailyRecMsg}</p>`;
    }
    if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
}

async function displayPersonalizedSuggestionsModal(sourceMovieId = null) {
    const listEl = document.getElementById('recommendationsListModal');
    const titleEl = document.getElementById('recommendationsListTitleModal');
    const refreshBtn = document.getElementById('refreshRecommendationsBtnModal');

    if (!listEl || !titleEl) { console.warn("Engine Suggestions modal elements not found."); if(listEl) listEl.innerHTML = '<p class="text-danger">UI Error.</p>'; return; }

    listEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Analyzing preferences...</p>';
    
    await generatePersonalizedRecommendations(sourceMovieId, listEl, titleEl); // Defined below

    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            listEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Refreshing...</p>';
            await generatePersonalizedRecommendations(null, listEl, titleEl); // Refresh always general
        };
    }
    if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
}

async function displayAchievementsModal() {
    const badgesContainer = document.getElementById('achievementBadgesModal');
    if (!badgesContainer) { console.warn("Achievements modal badges container not found."); return; }

    badgesContainer.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Calculating achievements...</p>';
    
    if (!globalStatsData.achievementData || Object.keys(globalStatsData.achievementData).length === 0) {
        globalStatsData = calculateAllStatistics(movieData); // movieData is global
    }
    generateBadgesAndAchievements(globalStatsData.achievementData, badgesContainer); // Defined below, pass DOM element
    if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
}

const chartsModalChartInstances = {};

async function displayChartsModal() {
    const modalBody = document.getElementById('chartsModalBody');
    if (!modalBody) { console.warn("Charts modal body not found."); return; }

    destroyCharts(chartsModalChartInstances);
    modalBody.querySelectorAll('canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        let msgEl = canvas.parentNode.querySelector('.chart-no-data-message'); if (msgEl) msgEl.remove();
    });

    if (!globalStatsData.totalEntries && typeof movieData !== 'undefined') { // Check movieData too
        globalStatsData = calculateAllStatistics(movieData);
    }

    if (Object.keys(globalStatsData).length === 0 || globalStatsData.totalEntries === 0) {
        modalBody.innerHTML = '<p class="text-center text-muted p-3">No data for charts. Add entries first!</p>';
        if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
        return;
    }

    renderChartsForModal(globalStatsData, chartsModalChartInstances); // Defined below
    if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
}

async function displayDetailedStatsModal() {
    const modal = document.getElementById('detailedStatsModal');
    if (!modal) { console.warn("Detailed stats modal not found."); return;}
    // Clear previous content robustly
    modal.querySelectorAll('#detailedStatsTabContent .tab-pane ul, #detailedStatsTabContent .tab-pane ol, #detailedStatsTabContent .tab-pane table tbody').forEach(el => el.innerHTML = '');
    modal.querySelectorAll('#detailedStatsTabContent .tab-pane p span').forEach(el => el.textContent = 'N/A');
    const progressBar = modal.querySelector('#toWatchProgressBar');
    if(progressBar) { progressBar.style.width = '0%'; progressBar.setAttribute('aria-valuenow', '0'); }

    if (!globalStatsData.totalEntries && typeof movieData !== 'undefined') {
        globalStatsData = calculateAllStatistics(movieData);
    }

    if (Object.keys(globalStatsData).length === 0 || globalStatsData.totalEntries === 0) {
        const summaryPane = modal.querySelector('#stats-summary-detailed');
        if (summaryPane) summaryPane.innerHTML = '<p class="text-center text-muted p-3">No data available. Add entries.</p>';
        $('#detailedStatsTab a[href="#stats-summary-detailed"]').tab('show'); // Requires jQuery
        if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
        return;
    }

    const populateList = (elementId, dataArray, valueSuffix = '', maxItems = 0, itemClass = 'list-group-item d-flex justify-content-between align-items-center p-2') => { const listEl = modal.querySelector(`#${elementId}`); if (!listEl) { console.warn(`List element #${elementId} not found in detailed stats.`); return; } listEl.innerHTML = ''; if (!Array.isArray(dataArray) || dataArray.length === 0) { listEl.innerHTML = `<li class="${itemClass} text-muted">No data.</li>`; return; } const itemsToDisplay = maxItems > 0 ? dataArray.slice(0, maxItems) : dataArray; itemsToDisplay.forEach(item => { const label = item.label || 'N/A'; const valueDisplay = (item.value !== undefined && item.value !== null) ? item.value : 'N/A'; listEl.insertAdjacentHTML('beforeend', `<li class="${itemClass}">${label} <span class="badge badge-primary badge-pill">${valueDisplay}${valueSuffix}</span></li>`); }); };
    const populateTable = (tableBodySelector, dataRows, columns) => { const tableBodyEl = modal.querySelector(tableBodySelector); if (!tableBodyEl) { console.warn(`Table body ${tableBodySelector} not found in detailed stats.`); return; } tableBodyEl.innerHTML = ''; if (!Array.isArray(dataRows) || dataRows.length === 0) { tableBodyEl.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-muted p-2">No data.</td></tr>`; return; } dataRows.forEach(row => { const tr = document.createElement('tr'); columns.forEach(col => { let cellData = row[col.key]; let cellHtml = (cellData !== undefined && cellData !== null) ? cellData : 'N/A'; if (col.key === 'avg_rating' && typeof cellData === 'string' && cellData !== 'N/A') cellHtml = `${renderStars(cellData)} (${cellData})`; else if (col.key === 'unique_titles' && cellData instanceof Set) cellHtml = cellData.size; const td = document.createElement('td'); td.innerHTML = String(cellHtml); tr.appendChild(td); }); tableBodyEl.appendChild(tr); }); };

    modal.querySelector('#statsTotalEntries').textContent = globalStatsData.totalEntries;
    modal.querySelector('#statsTotalTitlesWatched').textContent = globalStatsData.totalTitlesWatched;
    modal.querySelector('#statsTotalWatchInstances').textContent = globalStatsData.totalWatchInstances;
    modal.querySelector('#statsAvgOverallRating').innerHTML = `${renderStars(globalStatsData.avgOverallRating)} (${globalStatsData.avgOverallRating})`; // renderStars global
    populateList('statsByCategory', globalStatsData.categories); populateList('statsByStatus', globalStatsData.statuses);
    populateList('statsTopRatedGenresOverall', globalStatsData.topRatedGenresOverall.slice(0,5), ' avg rating', 5);
    modal.querySelector('#statsToWatchCompletion').textContent = globalStatsData.toWatchCompletion + '%';
    if(progressBar) { progressBar.style.width = `${globalStatsData.toWatchCompletion}%`; progressBar.setAttribute('aria-valuenow', globalStatsData.toWatchCompletion); }
    modal.querySelector('#watchedCountProgress').textContent = globalStatsData.watchedCountProgress;
    modal.querySelector('#totalRelevantCountProgress').textContent = globalStatsData.totalRelevantCountProgress;
    modal.querySelector('#avgMonthlyPace').textContent = globalStatsData.avgMonthlyPace !== 'N/A' ? `${globalStatsData.avgMonthlyPace} entries/month` : 'N/A';
    modal.querySelector('#estimatedCompletionTime').textContent = globalStatsData.estimatedCompletionTime;
    populateTable('#statsWatchesByYear tbody', globalStatsData.watchesByYear, [{key:'year'}, {key:'instances'}, {key:'unique_titles'}, {key:'avg_rating'}]);
    populateTable('#statsWatchesByMonth tbody', globalStatsData.watchesByMonth.slice(0,12), [{key:'month_year_label'}, {key:'instances'}, {key:'unique_titles'}, {key:'avg_rating'}]);
    populateList('statsTopSingleGenres', globalStatsData.topSingleGenres.slice(0,10), ' entries', 10);
    populateList('statsAvgRatingByGenre', globalStatsData.avgRatingByGenre.slice(0,10), ' avg rating', 10);
    populateList('statsGenreCombinations', globalStatsData.genreCombinations, ' entries', 10);
    populateList('statsByOverallRating', globalStatsData.overallRatingDistributionData);
    populateList('statsByWatchInstanceRating', globalStatsData.watchInstanceRatingDistributionData);
    populateList('statsAvgOverallRatingByCategory', globalStatsData.avgOverallRatingByCategory);
    populateList('statsMostWatchedActors', globalStatsData.mostWatchedActors, ' appearances');
    populateList('statsMostWatchedDirectors', globalStatsData.mostWatchedDirectors, ' films');
    populateList('statsMostFrequentProductionCompanies', globalStatsData.mostFrequentProductionCompanies, ' entries');
    populateList('statsAvgRatingByStudio', globalStatsData.avgRatingByStudio.slice(0,5), ' avg rating', 5);
    populateList('statsTopCountries', globalStatsData.topCountries, ' entries', 10);
    populateList('statsTopLanguages', globalStatsData.topLanguages, ' entries', 10);

    if (!$('#detailedStatsTab .nav-link.active').length && typeof $ !== 'undefined') $('#detailedStatsTab a[href="#stats-summary-detailed"]').tab('show');
    if (typeof incrementLocalStorageCounter === 'function') incrementLocalStorageCounter('stats_modal_opened_count_achievement');
}


// --- Chart Rendering (Adapted for specific modal) ---
function renderChartsForModal(statsData, chartInstanceObj) {
    destroyCharts(chartInstanceObj);
    const chartsModalBody = document.getElementById('chartsModalBody');
    if (!chartsModalBody) { console.warn("Charts modal body not found for rendering charts."); return; }

    if (!statsData || Object.keys(statsData).length === 0 || statsData.totalEntries === 0) {
        chartsModalBody.querySelectorAll('canvas').forEach(canvas => {
            canvas.style.display = 'none';
            let msgEl = canvas.parentNode.querySelector('.chart-no-data-message');
            if (!msgEl) { msgEl = document.createElement('p'); msgEl.className = 'text-muted text-center chart-no-data-message p-3'; canvas.parentNode.appendChild(msgEl); }
            msgEl.textContent = 'Statistics data not available.'; msgEl.style.display = 'block';
        });
        return;
    }

    const chartTextColor = getComputedStyle(document.body).getPropertyValue('--body-text-color').trim() || '#333';
    const gridColor = getComputedStyle(document.body).getPropertyValue('--table-border-color').trim() || 'rgba(0,0,0,0.1)';

    const renderSingleChart = (canvasId, type, chartLabels, chartDataSets, options, noDataMessage) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) { console.warn(`Canvas element with ID '${canvasId}' not found.`); return; }
        const parentContainer = canvas.parentNode;
        let messageElement = parentContainer.querySelector('.chart-no-data-message');
        if (!messageElement) { messageElement = document.createElement('p'); messageElement.className = 'text-muted text-center chart-no-data-message p-3'; parentContainer.appendChild(messageElement); }
        const hasData = chartLabels && chartLabels.length > 0 && chartDataSets && chartDataSets.some(dataset => dataset.data && dataset.data.some(val => (typeof val === 'number' && val !== 0) || (typeof val === 'string' && val !== '')));
        if (hasData) {
            canvas.style.display = 'block'; messageElement.style.display = 'none';
            let chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: (type === 'pie' || type === 'doughnut' || type ==='radar'), position: 'top', labels: { color: chartTextColor, font: { size: 10 } } }, tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: getComputedStyle(document.body).getPropertyValue('--card-bg').trim() || '#fff', titleColor: getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#007bff', bodyColor: chartTextColor, borderColor: gridColor, borderWidth: 1 }, title: { display: false } }, scales: { x: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor, font: {size: 9} }, grid: { color: gridColor } }, y: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor }, grid: { color: gridColor }, beginAtZero: true } }, ...options };
            if (type === 'radar') chartOptions.scales = { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: chartTextColor, font: { size: 10, weight: '500' } }, ticks: { backdropColor: 'transparent', color: chartTextColor, stepSize: 1, font: {size:8} } } };
            const styledChartDataSets = chartDataSets.map((dataset, index) => { let bgColors, borderColors; if (type === 'pie' || type === 'doughnut' || type === 'radar') { bgColors = generateColors(dataset.data.length, 0.8); borderColors = bgColors.map(color => color.replace(/,\s*\d?\.?\d+\)/, ', 1)')); } else { bgColors = generateColors(chartDataSets.length, 0.6)[index % generateColors(chartDataSets.length).length]; borderColors = String(bgColors).replace(/,\s*\d?\.?\d+\)/, ', 1)'); } return { ...dataset, backgroundColor: dataset.backgroundColor || bgColors, borderColor: dataset.borderColor || borderColors, borderWidth: dataset.borderWidth || (type === 'line' ? 2 : 1.5), fill: dataset.fill !== undefined ? dataset.fill : (type === 'line' || type === 'radar'), tension: dataset.tension !== undefined ? dataset.tension : (type === 'line' ? 0.3 : 0), }; });
            chartInstanceObj[canvasId] = new Chart(canvas.getContext('2d'), { type: type, data: { labels: chartLabels, datasets: styledChartDataSets }, options: chartOptions });
        } else { canvas.style.display = 'none'; messageElement.textContent = noDataMessage || 'No data available.'; messageElement.style.display = 'block'; }
    };

    renderSingleChart('chartModalWatchInstancesByYear', 'bar', (statsData.watchesByYear || []).map(d => d.year).reverse(), [{ label: 'Watch Instances', data: (statsData.watchesByYear || []).map(d => d.instances).reverse() }], { scales: { y: { title: { display: true, text: 'Number of Watches', color: chartTextColor } }, x: { title: { display: true, text: 'Year', color: chartTextColor } } } }, 'No watch instances by year.');
    const topGenresForChart = (statsData.topSingleGenres || []).slice(0, 10);
    renderSingleChart('chartModalMoviesPerGenre', 'bar', topGenresForChart.map(d => d.label), [{ label: 'Entries', data: topGenresForChart.map(d => d.value) }], { indexAxis: 'y', scales: { x: { title: { display: true, text: 'Number of Entries', color: chartTextColor } }, y: { ticks:{ font:{size:10}}}}, plugins:{legend: {display: false}} }, 'No genre data.');
    renderSingleChart('chartModalOverallRatingDistribution', 'doughnut', (statsData.overallRatingDistributionData || []).map(d => d.label), [{ label: 'Entries', data: (statsData.overallRatingDistributionData || []).map(d => d.value) }], { plugins: { title: { display: false } } }, 'No overall ratings.');
    renderSingleChart('chartModalWatchInstanceRatingDistribution', 'pie', (statsData.watchInstanceRatingDistributionData || []).map(d => d.label), [{ label: 'Watches', data: (statsData.watchInstanceRatingDistributionData || []).map(d => d.value) }], { plugins: { title: { display: false } } }, 'No individual watch ratings.');
    renderSingleChart('chartModalMovieStatusBreakdown', 'pie', (statsData.statuses || []).map(d => d.label), [{ label: 'Entries', data: (statsData.statuses || []).map(d => d.value) }], { plugins: { title: { display: false } } }, 'No status data.');
    renderSingleChart('chartModalLanguageDistribution', 'doughnut', (statsData.topLanguages || []).map(d => d.label), [{ label: 'Entries', data: (statsData.topLanguages || []).map(d => d.value) }], { plugins: { title: { display: false }, legend: { position: 'right'} } }, 'No language data.');
    renderSingleChart('chartModalCountryDistribution', 'doughnut', (statsData.topCountries || []).map(d => d.label), [{ label: 'Entries', data: (statsData.topCountries || []).map(d => d.value) }], { plugins: { title: { display: false }, legend: { position: 'right'} } }, 'No country data.');
    const sortedMonthlyActivityForChart = [...(statsData.watchesByMonth || [])].sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
    renderSingleChart('chartModalWatchActivityOverTime', 'line', sortedMonthlyActivityForChart.map(d => d.month_year_label), [{ label: 'Watch Instances', data: sortedMonthlyActivityForChart.map(d => d.instances) }], { scales: { y: { title: { display: true, text: 'Watch Instances', color: chartTextColor } }, x: { title: { display: true, text: 'Month/Year', color: chartTextColor } } } }, 'No monthly activity.');
    const sortedMonthlyAvgRatingDataForChart = (statsData.watchesByMonth || []).filter(d => d.avg_rating !== 'N/A' && !isNaN(parseFloat(d.avg_rating))).sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
    renderSingleChart('chartModalAvgRatingOverTime', 'line', sortedMonthlyAvgRatingDataForChart.map(d => d.month_year_label), [{ label: 'Avg. Rating', data: sortedMonthlyAvgRatingDataForChart.map(d => parseFloat(d.avg_rating)), spanGaps: true }], { scales: { y: { min: 1, max: 5, title: { display: true, text: 'Average Rating', color: chartTextColor }, ticks:{stepSize:0.5} }, x: { title: { display: true, text: 'Month/Year', color: chartTextColor } } } }, 'No avg. rating over time.');
    const radarGenresForChart = (statsData.avgRatingByGenre || []).filter(d => d.value !== 'N/A' && !isNaN(parseFloat(d.value))).slice(0, 7);
    if (radarGenresForChart.length >= 3) renderSingleChart('chartModalRatingByGenreRadar', 'radar', radarGenresForChart.map(d => d.label), [{ label: 'Average Overall Rating', data: radarGenresForChart.map(d => parseFloat(d.value)) }], { plugins: {title: {display:false}}}, 'Not enough rated genre data.');
    else renderSingleChart('chartModalRatingByGenreRadar', 'radar', [], [{}], {}, 'Not enough (min 3) rated genre data for radar.');
}


// --- Achievements (Corrected from your feedback) ---
function generateBadgesAndAchievements(achievementStats, containerElementDOM) {
    if (!containerElementDOM) { console.warn("Achievement badges container DOM element not found."); return; }
    containerElementDOM.innerHTML = ''; // Vanilla JS to clear

    if (!achievementStats || typeof achievementStats !== 'object' || !ACHIEVEMENTS || ACHIEVEMENTS.length === 0) { // ACHIEVEMENTS is global
        containerElementDOM.innerHTML = '<p class="text-muted small p-3">No achievements configured or stats unavailable.</p>'; return;
    }
    let achievedCountForMeta = 0; const achievementsToDisplay = [];
    ACHIEVEMENTS.forEach(achievement => {
        if (achievement.type === 'meta_achievement_count') { achievementsToDisplay.push({ ...achievement, progress: 0, isAchieved: false }); return; }
        let isAchieved = false; let progress = 0; let total = achievement.threshold;
        switch (achievement.type) {
            case 'total_entries': progress = achievementStats.total_entries || 0; break;
            case 'total_titles_watched': progress = achievementStats.total_titles_watched || 0; break;
            case 'distinct_titles_rewatched': progress = achievementStats.distinct_titles_rewatched || 0; break;
            case 'single_title_rewatch_count': progress = achievementStats.single_title_rewatch_max || 0; break;
            case 'category_watched_count': progress = (achievementStats.category_watched_counts && achievementStats.category_watched_counts[achievement.category]) || 0; break;
            case 'long_series_watched_count': progress = achievementStats.long_series_watched_count || 0; break;
            case 'genre_watched_count': progress = (achievementStats.genre_watched_counts && achievementStats.genre_watched_counts[achievement.genre]) || 0; break;
            case 'genre_variety_count': progress = achievementStats.genre_variety_count || 0; break;
            case 'rated_titles_count': progress = achievementStats.rated_titles_count || 0; break;
            case 'specific_rating_count': progress = (achievementStats.specific_rating_counts && achievementStats.specific_rating_counts[achievement.rating]) || 0; break;
            case 'recommendation_level_count': progress = (achievementStats.recommendation_level_counts && achievementStats.recommendation_level_counts[achievement.recommendation]) || 0; break;
            case 'personal_audience_count': progress = (achievementStats.personal_audience_counts && achievementStats.personal_audience_counts[achievement.personalAudience]) || 0; break;
            case 'decade_variety_count': progress = achievementStats.decade_variety_count || 0; break;
            case 'pre_year_watched_count': progress = (achievementStats.pre_year_watched_counts && achievementStats.pre_year_watched_counts[achievement.year.toString()]) || 0; break;
            case 'recent_years_watched_count': progress = (achievementStats.recent_years_watched_counts && achievementStats.recent_years_watched_counts[achievement.yearsAgo.toString()]) || 0; break;
            case 'status_count': progress = (achievementStats.status_counts && achievementStats.status_counts[achievement.status]) || 0; break;
            case 'status_count_active': progress = achievement.status === 'Continue' ? (achievementStats.status_continue_active_count || 0) : 0; break;
            case 'active_days_count': progress = achievementStats.active_days_count || 0; break;
            case 'country_variety_count': progress = achievementStats.country_variety_count || 0; break;
            case 'language_variety_count': progress = achievementStats.language_variety_count || 0; break;
            case 'sync_count': progress = achievementStats.sync_count || 0; break;
            case 'stats_modal_opened_count': progress = achievementStats.stats_modal_opened_count || 0; break;
            case 'time_of_day_watch': progress = (achievementStats.time_of_day_watch_counts && achievementStats.time_of_day_watch_counts[achievement.period]) || 0; break;
            case 'detailed_description_count': progress = (achievementStats.detailed_description_counts && achievementStats.detailed_description_counts[achievement.minLength.toString()]) || 0; break;
            case 'poster_url_present_count': progress = achievementStats.poster_url_present_count || 0; break;
            case 'tmdb_collection_streak_count': progress = achievementStats.tmdb_collection_streak_max || 0; break;
            case 'director_streak_count': progress = achievementStats.director_streak_max || 0; break;
            case 'studio_streak_count': progress = achievementStats.studio_streak_max || 0; break;
            case 'manual_links_count': progress = achievementStats.manual_links_pairs_count || 0; break;
            case 'hidden_gem_count': progress = (achievementStats.hidden_gem_counts && achievementStats.hidden_gem_counts[`${achievement.tmdbVotesMax}_${achievement.tmdbRatingMin}`]) || 0; break;
            case 'daily_recommendation_watched_count': progress = achievementStats.daily_recommendation_watched_count || 0; break;
            case 'all_statuses_present': progress = achievementStats.all_statuses_present_check ? 1 : 0; total = 1; break;
            default: break;
        }
        isAchieved = progress >= achievement.threshold; if(isAchieved) achievedCountForMeta++;
        achievementsToDisplay.push({ ...achievement, progress, isAchieved });
    });
    achievementsToDisplay.forEach(ach => { if (ach.type === 'meta_achievement_count') { ach.progress = achievedCountForMeta; ach.isAchieved = ach.progress >= ach.threshold; }});
    achievementsToDisplay.sort((a,b) => { if (a.isAchieved !== b.isAchieved) return a.isAchieved ? -1 : 1; const pA = a.progress / (a.threshold || 1); const pB = b.progress / (b.threshold || 1); if (pB !== pA) return pB - pA; return a.name.localeCompare(b.name); });
    achievementsToDisplay.forEach(achievement => {
        const badgeHtml = `<div class="achievement-badge ${achievement.isAchieved ? 'achieved' : 'locked'} m-2 p-2 rounded text-center" title="${achievement.isAchieved ? achievement.name : `${achievement.name} (${achievement.progress}/${achievement.threshold})`}" data-description="${achievement.description}" data-name="${achievement.name}" data-progress="${achievement.progress}" data-threshold="${achievement.threshold}" data-achieved="${achievement.isAchieved}"><i class="${achievement.icon} fa-2x mb-1 ${achievement.isAchieved ? 'text-warning' : 'text-muted'}"></i><br><span class="d-block small font-weight-bold">${achievement.name}</span><small class="d-block text-muted">${achievement.isAchieved ? 'Achieved!' : `${achievement.progress} / ${achievement.threshold}`}</small></div>`;
        containerElementDOM.insertAdjacentHTML('beforeend', badgeHtml); // Use vanilla JS
    });
    if(achievementsToDisplay.length === 0) containerElementDOM.innerHTML = '<p class="text-muted small p-3">No achievements.</p>';
    // Click listener for badges is handled by event delegation in sixth.js
}

// --- Personalized Recommendations (Adapted for modal) ---
let lastShownPersonalizedSuggestionId = null;

async function generatePersonalizedRecommendations(sourceMovieId = null, listElement, titleElement) {
    if (!listElement || !titleElement) { console.warn("Missing list or title element for personalized recs."); if(listElement) listElement.innerHTML = '<p class="text-danger">UI Error.</p>'; return; }
    listElement.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Analyzing...</p>';
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
        let baseEntries = []; const exclusionIds = new Set();
        if (!sourceMovieId && lastShownPersonalizedSuggestionId) exclusionIds.add(lastShownPersonalizedSuggestionId);
        if (sourceMovieId) {
            const sourceMovie = movieData.find(m => m && m.id === sourceMovieId); // movieData is global
            if (!sourceMovie || !sourceMovie.tmdbId) { listElement.innerHTML = '<p class="text-center text-muted p-3">Source movie details not found or TMDB data missing.</p>'; titleElement.textContent = 'More Like This'; return; }
            baseEntries = [sourceMovie]; exclusionIds.add(sourceMovie.id); titleElement.textContent = `More Like "${sourceMovie.Name}"`;
        } else {
            baseEntries = movieData.filter(movie => movie && (movie.Status === 'Watched' || movie.Status === 'Continue') && (parseFloat(movie.overallRating) >= 4) && movie.tmdbId);
            movieData.forEach(m => { if (m && (m.Status === 'Watched' || m.Status === 'Continue')) exclusionIds.add(m.id); });
            titleElement.textContent = `Top Suggestions`;
        }
        if (baseEntries.length === 0 && !sourceMovieId) { listElement.innerHTML = '<p class="text-center text-muted p-3">Rate movies 4+ stars or use "Find Similar" for suggestions.</p>'; return; }
        const baseProfile = { genres: new Set(), keywords: new Set(), actors: new Map(), directors: new Map(), companies: new Map() };
        baseEntries.forEach(movie => {
            if(movie.Genre) String(movie.Genre).toLowerCase().split(',').map(g=>g.trim()).filter(Boolean).forEach(g => baseProfile.genres.add(g));
            if(Array.isArray(movie.keywords)) movie.keywords.forEach(kw => { if(kw && kw.id) baseProfile.keywords.add(kw.id);});
            if(Array.isArray(movie.full_cast)) movie.full_cast.slice(0,5).forEach(p => { if(p && p.id) baseProfile.actors.set(p.id, (baseProfile.actors.get(p.id) || 0) + 1);});
            if(movie.director_info && movie.director_info.id) baseProfile.directors.set(movie.director_info.id, (baseProfile.directors.get(movie.director_info.id) || 0) + 1);
            if(Array.isArray(movie.production_companies)) movie.production_companies.slice(0,3).forEach(c => { if(c && c.id) baseProfile.companies.set(c.id, (baseProfile.companies.get(c.id) || 0) + 1);});
        });
        const toWatchCandidates = movieData.filter(movie => movie && movie.Status === 'To Watch' && movie.tmdbId && movie.Name && !exclusionIds.has(movie.id));
        if (toWatchCandidates.length === 0) {
            let message = 'No suitable "To Watch" entries found. Add more movies!';
            if (!sourceMovieId && lastShownPersonalizedSuggestionId) { message = 'Tried new suggestion, but no other "To Watch" entries found.'; const lastSuggestion = movieData.find(m => m.id === lastShownPersonalizedSuggestionId); if (lastSuggestion) { listElement.innerHTML = ''; renderPersonalizedRecommendationItem({movie: lastSuggestion, score: 0, whyThis: ["Previously suggested."]}, listElement); return; }}
            listElement.innerHTML = `<p class="text-center text-muted p-3">${message}</p>`; return;
        }
        const scoredRecommendations = [];
        toWatchCandidates.forEach(candidate => {
            let score = 0; const whyThis = [];
            const candGenres = new Set((String(candidate.Genre||'').toLowerCase().split(',').map(g=>g.trim()).filter(Boolean)));
            const candKeywords = new Set((candidate.keywords||[]).map(kw=>kw.id).filter(Boolean));
            const candActors = new Set((candidate.full_cast||[]).slice(0,5).map(p=>p.id).filter(Boolean));
            const candDirector = candidate.director_info ? candidate.director_info.id : null;
            const candCompanies = new Set((candidate.production_companies||[]).slice(0,3).map(c=>c.id).filter(Boolean));
            candGenres.forEach(g => { if(baseProfile.genres.has(g)) { score += 3; whyThis.push(`Genre: ${g.charAt(0).toUpperCase() + g.slice(1)}`);}});
            candKeywords.forEach(kw => { if(baseProfile.keywords.has(kw)) { score += 2; const kwName = (candidate.keywords.find(k=>k.id===kw) || {}).name; if(kwName) whyThis.push(`Keyword: ${kwName}`);}});
            candActors.forEach(a => { if(baseProfile.actors.has(a)) { score += (1 * Math.min(baseProfile.actors.get(a),2)); const actorName = (candidate.full_cast.find(p=>p.id===a) || {}).name; if(actorName) whyThis.push(`Actor: ${actorName}`);}});
            if(candDirector && baseProfile.directors.has(candDirector)) { score += (2.5 * Math.min(baseProfile.directors.get(candDirector),2)); if(candidate.director_info && candidate.director_info.name) whyThis.push(`Director: ${candidate.director_info.name}`);}
            candCompanies.forEach(c => { if(baseProfile.companies.has(c)) {score += 1.5; const compName = (candidate.production_companies.find(pc=>pc.id===c) || {}).name; if(compName) whyThis.push(`Studio: ${compName}`);}});
            if (candidate.tmdb_vote_average && candidate.tmdb_vote_count && candidate.tmdb_vote_count > 100) { score += (candidate.tmdb_vote_average / 5); whyThis.push(`TMDB Rating: ${candidate.tmdb_vote_average.toFixed(1)} (${candidate.tmdb_vote_count} votes)`);}
            if (score > 1.5) scoredRecommendations.push({ movie: candidate, score, whyThis: [...new Set(whyThis)].slice(0,3) });
        });
        scoredRecommendations.sort((a, b) => b.score - a.score);
        listElement.innerHTML = '';
        if (scoredRecommendations.length === 0) { listElement.innerHTML = '<p class="text-center text-muted p-3">Couldn\'t find strong matches. Try rating more or fetching TMDB details.</p>'; lastShownPersonalizedSuggestionId = null; return; }
        const topN = sourceMovieId ? scoredRecommendations.slice(0, Math.min(5, scoredRecommendations.length)) : [scoredRecommendations[0]];
        topN.forEach(rec => renderPersonalizedRecommendationItem(rec, listElement));
        if (!sourceMovieId && topN.length > 0) lastShownPersonalizedSuggestionId = topN[0].movie.id;
        else if (sourceMovieId && topN.length === 0) listElement.innerHTML = '<p class="text-center text-muted p-3">No similar "To Watch" items found.</p>';
    } catch (error) { console.error("Error generating personalized recommendations:", error); listElement.innerHTML = '<p class="text-danger p-3">Error generating suggestions.</p>'; lastShownPersonalizedSuggestionId = null; }
}

function renderPersonalizedRecommendationItem(rec, parentElement) {
    const movie = rec.movie; const recItem = document.createElement('div');
    recItem.className = 'recommendation-item list-group-item p-3 mb-2 shadow-sm rounded';
    const whyThisText = rec.whyThis && rec.whyThis.length > 0 ? rec.whyThis.join('; ') : 'Matches your taste profile.';
    recItem.innerHTML = `<div class="d-flex w-100 justify-content-between"><h6 class="mb-1">${movie.Name} <small class="text-muted">(${movie.Year || 'N/A'})</small></h6>${rec.score > 0 ? `<small class="text-success font-weight-bold" title="Relevance Score">Score: ${rec.score.toFixed(1)}</small>` : ''}</div><p class="mb-1 text-muted small"><strong>Category:</strong> ${movie.Category || 'N/A'} | <strong>Genre:</strong> ${movie.Genre || 'N/A'}</p><p class="mb-2 text-muted small">${(movie.Description || 'No description.').substring(0, 120)}${movie.Description && movie.Description.length > 120 ? '...' : ''}</p><div class="d-flex justify-content-between align-items-center mt-2"><button class="btn btn-sm btn-outline-secondary btn-why-this" data-toggle="tooltip" data-html="true" data-placement="top" title="${whyThisText.replace(/"/g, '"').replace(/\n/g, '<br>')}"><i class="fas fa-question-circle"></i> Why This?</button><div><button class="btn btn-sm btn-info view-btn-modal mr-2" data-movie-id="${movie.id}" title="View Details"><i class="fas fa-eye"></i> View</button></div></div>`;
    recItem.querySelector('.view-btn-modal').addEventListener('click', function() {
        const currentOpenModal = $('.modal.show').attr('id'); // Requires jQuery
        if (currentOpenModal) $(`#${currentOpenModal}`).modal('hide');
        $(`#${currentOpenModal || 'personalizedSuggestionsModal'}`).one('hidden.bs.modal', () => openDetailsModal(this.dataset.movieId)); // openDetailsModal is global
    });
    if (typeof $ !== 'undefined') $(recItem).find('.btn-why-this').tooltip(); // Requires jQuery for tooltip
    parentElement.appendChild(recItem);
}

// --- Daily Recommendation (Logic remains, rendering adapted) ---
// Relies on global: localStorage, MAX_DAILY_SKIPS, DAILY_RECOMMENDATION_DATE_KEY, etc., movieData,
// showToast, DO_NOT_SHOW_AGAIN_KEYS, generateUUID, openDetailsModal, markDailyRecCompleted, markDailyRecSkipped,
// showLoading, hideLoading, incrementLocalStorageCounter.
function getDailyRecommendationMovie() { /* ... unchanged ... */
    const today = new Date().toISOString().slice(0, 10); const lastRecDate = localStorage.getItem(DAILY_RECOMMENDATION_DATE_KEY);
    let dailyRecId = localStorage.getItem(DAILY_RECOMMENDATION_ID_KEY); let dailyRecSkipCount = parseInt(localStorage.getItem(DAILY_REC_SKIP_COUNT_KEY) || '0');
    if (lastRecDate !== today) { dailyRecId = null; dailyRecSkipCount = 0; localStorage.setItem(DAILY_RECOMMENDATION_DATE_KEY, today); localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, '0'); localStorage.removeItem(DO_NOT_SHOW_AGAIN_KEYS.DAILY_RECOMMENDATION_INTRO + '_shown_today'); }
    if (dailyRecSkipCount >= MAX_DAILY_SKIPS) return { message: `All ${MAX_DAILY_SKIPS} daily pick skips used. Check back tomorrow!`, movie: null, dailyRecSkipCount };
    let movie = dailyRecId ? movieData.find(m => m && m.id === dailyRecId && m.Status === 'To Watch' && !(m.doNotRecommendDaily && new Date(m.lastModifiedDate || 0).toISOString().slice(0,10) === today) ) : null;
    if (!movie) { const eligibleMovies = movieData.filter(m => m && (m.Category === 'Movie' || m.Category === 'Documentary' || m.Category === 'Series') && m.Status === 'To Watch' && (!Array.isArray(m.watchHistory) || m.watchHistory.length === 0) && !(m.doNotRecommendDaily && new Date(m.lastModifiedDate || 0).toISOString().slice(0,10) === today) && (m.tmdb_vote_average === null || m.tmdb_vote_average >= 5.5 || (m.tmdb_vote_count || 0) < 50) ); if (eligibleMovies.length === 0) return { message: 'No suitable "To Watch" entries for a daily pick.', movie: null, dailyRecSkipCount }; movie = eligibleMovies[Math.floor(Math.random() * eligibleMovies.length)]; dailyRecId = movie.id; localStorage.setItem(DAILY_RECOMMENDATION_ID_KEY, dailyRecId); }
    const introKey = DO_NOT_SHOW_AGAIN_KEYS.DAILY_RECOMMENDATION_INTRO; const introShownTodayKey = introKey + '_shown_today';
    if(lastRecDate !== today && !localStorage.getItem(introKey) && !localStorage.getItem(introShownTodayKey)) { showToast("Your Daily Pick!", "Check out today's movie recommendation (Menu > Insights > Daily Recommendation).", "info", 7000, introKey); localStorage.setItem(introShownTodayKey, 'true'); }
    return { message: null, movie, dailyRecSkipCount };
}
async function markDailyRecCompleted(event) { /* ... unchanged, relies on globals ... */
    const button = event.target.closest('button'); if (!button) return; const movieId = button.dataset.movieId; if (!movieId) return; showLoading("Marking daily pick as watched...");
    try { const movieIndex = movieData.findIndex(m => m && m.id === movieId); if (movieIndex === -1) { showToast("Error", "Daily pick movie not found.", "error"); return; } const movie = movieData[movieIndex]; movie.Status = 'Watched'; const today = new Date().toISOString().slice(0, 10); const newWatchInstance = { watchId: generateUUID(), date: today, rating: movie.overallRating || '3', notes: 'Completed from Daily Pick' }; if (!Array.isArray(movie.watchHistory)) movie.watchHistory = []; movie.watchHistory.push(newWatchInstance); if (!movie.overallRating || movie.overallRating === '') movie.overallRating = '3'; movie.lastModifiedDate = new Date().toISOString(); movie.doNotRecommendDaily = true; localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, MAX_DAILY_SKIPS.toString()); localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY); let dailyRecWatchedCount = parseInt(localStorage.getItem('daily_rec_watched_achievement') || '0'); localStorage.setItem('daily_rec_watched_achievement', (dailyRecWatchedCount + 1).toString()); if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships(); if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection); if (typeof renderTable === 'function') renderTable(); if (typeof saveToIndexedDB === 'function') await saveToIndexedDB(); showToast("Daily Pick Watched!", `"${movie.Name}" marked watched.`, "success", 4000); if (currentSupabaseUser && typeof comprehensiveSync === 'function') await comprehensiveSync(true); }
    catch (error) { console.error("Error marking daily rec completed:", error); showToast("Update Error", "Could not update daily pick.", "error"); } finally { hideLoading(); }
}
async function markDailyRecSkipped(event) { /* ... unchanged, relies on globals ... */
    const button = event.target.closest('button'); if (!button) return; const movieId = button.dataset.movieId; if (!movieId) return; showLoading("Skipping daily pick...");
    try { const movieIndex = movieData.findIndex(m => m && m.id === movieId); if (movieIndex === -1) { showToast("Error", "Daily pick movie not found.", "error"); return; } const movie = movieData[movieIndex]; movie.lastModifiedDate = new Date().toISOString(); movie.doNotRecommendDaily = true; let dailyRecSkipCount = parseInt(localStorage.getItem(DAILY_REC_SKIP_COUNT_KEY) || '0'); dailyRecSkipCount++; localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, dailyRecSkipCount.toString()); localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY); if (typeof saveToIndexedDB === 'function') await saveToIndexedDB(); showToast("Daily Pick Skipped", `"${movie.Name}" skipped. ${MAX_DAILY_SKIPS - dailyRecSkipCount} skips left.`, "info", 2000); if (currentSupabaseUser && typeof comprehensiveSync === 'function') await comprehensiveSync(true); }
    catch (error) { console.error("Error skipping daily rec:", error); showToast("Update Error", "Could not skip daily pick.", "error"); } finally { hideLoading(); }
}

// PDF Export (relies on globals and html2canvas, jsPDF)
async function exportStatsAsPdf(modalContentSelector, filename = 'KeepMovieZ_Report.pdf') {
    const contentToExport = document.querySelector(modalContentSelector);
    if (!contentToExport) { showToast("Export Error", "Content for PDF export not found.", "error"); hideLoading(); return; }
    showLoading("Exporting PDF...");
    try {
        const activeTabPaneQuery = `${modalContentSelector} .tab-content .tab-pane.active`;
        const allTabPanesQuery = `${modalContentSelector} .tab-content .tab-pane`;
        const activeTabPane = $(activeTabPaneQuery); // Using jQuery for Bootstrap tab interactions
        const allTabPanes = $(allTabPanesQuery);
        allTabPanes.addClass('show active'); // Show all tabs for capture

        if (modalContentSelector.includes('chartsModal') && typeof renderChartsForModal === 'function' && typeof globalStatsData !== 'undefined' && typeof chartsModalChartInstances !== 'undefined') {
             renderChartsForModal(globalStatsData, chartsModalChartInstances);
        }
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for rendering

        $(contentToExport).find('.modal-header .close, .modal-footer button, .nav-tabs, #refreshRecommendationsBtnModal, .skip-daily-rec-modal, .mark-completed-daily-rec-modal, .btn-why-this').hide();
        const originalWidth = contentToExport.style.width; contentToExport.style.width = '1100px';
        const canvas = await html2canvas(contentToExport, { scale: 1.5, useCORS: true, logging: false, windowWidth: contentToExport.scrollWidth, windowHeight: contentToExport.scrollHeight });
        const imgData = canvas.toDataURL('image/png'); const { jsPDF } = window.jspdf;
        const orientation = canvas.width > canvas.height ? 'l' : 'p'; const pdf = new jsPDF(orientation, 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height; let imgWidthPDF, imgHeightPDF;
        if ((pdfWidth / canvasAspectRatio) <= pdfHeight) { imgWidthPDF = pdfWidth; imgHeightPDF = pdfWidth / canvasAspectRatio; }
        else { imgHeightPDF = pdfHeight; imgWidthPDF = pdfHeight * canvasAspectRatio; }
        const xOffset = (pdfWidth - imgWidthPDF) / 2; const yOffset = (pdfHeight - imgHeightPDF) / 2;
        pdf.addImage(imgData, 'PNG', xOffset > 0 ? xOffset : 0, yOffset > 0 ? yOffset : 0, imgWidthPDF, imgHeightPDF);
        pdf.save(filename); showToast("PDF Exported", `${filename} downloaded.`, "success");
    } catch (error) { console.error('Error exporting PDF:', error); showToast("PDF Export Error", `Failed: ${error.message}.`, "error", 7000);
    } finally {
        contentToExport.style.width = originalWidth;
        allTabPanes.removeClass('show active');
        if (activeTabPane.length) activeTabPane.addClass('show active'); else $(allTabPanesQuery + ':first-child').addClass('show active');
        $(contentToExport).find('.modal-header .close, .modal-footer button, .nav-tabs, #refreshRecommendationsBtnModal, .skip-daily-rec-modal, .mark-completed-daily-rec-modal, .btn-why-this').show();
        hideLoading();
    }
}
