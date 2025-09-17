/* reporting.js */
function generateColors(count, alpha = 0.7) {
    const colors = [];
    const baseHues = [200, 30, 260, 60, 150, 330, 90, 0, 230, 180, 45, 280, 120, 20, 300, 100];
    const saturation = 70;
    const lightness = 55;
    for (let i = 0; i < count; i++) {
        const hue = (baseHues[i % baseHues.length] + (Math.floor(i / baseHues.length) * 13)) % 360;
        colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`);
    }
    return colors;
}

function destroyCharts(chartInstanceObject = chartInstances) {
    for (const chartId in chartInstanceObject) {
        if (chartInstanceObject[chartId] && typeof chartInstanceObject[chartId].destroy === 'function') {
            chartInstanceObject[chartId].destroy();
        }
        delete chartInstanceObject[chartId];
    }
}

// --- UI Display Functions for Modals ---

async function displayDailyRecommendationModal() {
    const modalBody = document.getElementById('dailyRecommendationModalBody');
    if (!modalBody) { console.warn("Daily recommendation modal body not found."); return; }
    modalBody.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Finding your daily pick...</p>';

    const { message: dailyRecMsg, movie: dailyRecMovie, dailyRecSkipCount } = getDailyRecommendationMovie();

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

        modalBody.querySelector('.view-btn-modal').addEventListener('click', function () {
            $('#dailyRecommendationModal').modal('hide');
            $('#dailyRecommendationModal').one('hidden.bs.modal', () => openDetailsModal(this.dataset.movieId));
        });
        modalBody.querySelector('.mark-completed-daily-rec-modal').addEventListener('click', async function (event) {
            await window.markDailyRecCompleted(event);
            $('#dailyRecommendationModal').modal('hide');
        });
        modalBody.querySelector('.skip-daily-rec-modal').addEventListener('click', window.markDailyRecSkipped);

    } else {
        modalBody.innerHTML = `<p class="text-center text-muted p-3">${dailyRecMsg}</p>`;
    }
}

// ### SUGGESTION ENGINE V2 ###
let suggestionCache = {
    seedMovieId: null,
    suggestions: [],
    source: null, // 'tmdb', 'local_fallback'
    localSearchPerformed: false
};

async function displayPersonalizedSuggestionsModal(sourceMovieId = null) {
    const listEl = document.getElementById('recommendationsListModal');
    const titleEl = document.getElementById('recommendationsListTitleModal');
    if (!listEl || !titleEl) return;

    suggestionCache = { seedMovieId: null, suggestions: [], source: null, localSearchPerformed: false };
    $('#refreshRecommendationsBtnModal').prop('disabled', false).show();

    if (sourceMovieId) {
        suggestionCache.source = 'focused';
        const seedMovie = movieData.find(m => m.id === sourceMovieId);
        if (seedMovie) {
            titleEl.textContent = `Because you liked "${seedMovie.Name}"...`;
            listEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Finding similar titles...</p>';
            await fetchAndCacheSuggestions(sourceMovieId);
            await renderNextSuggestion();
        }
    } else {
        suggestionCache.source = 'general';
        titleEl.textContent = 'Choose a Spark for Your Suggestions';
        listEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Finding your top titles...</p>';
        $('#refreshRecommendationsBtnModal').hide();
        
        const potentialSeeds = movieData.filter(m => 
            m.Status === 'Watched' && (
                parseFloat(m.overallRating) === 5 ||
                (m.Recommendation === 'Highly Recommended' && parseFloat(m.overallRating) >= 4)
            )
        ).sort((a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate));

        if (potentialSeeds.length > 0) {
            renderSeedSelectionScreen(potentialSeeds);
        } else {
            listEl.innerHTML = '<div class="list-group-item text-muted small p-3">Rate more movies with 5 stars or as "Highly Recommended" to unlock personalized suggestions.</div>';
        }
    }
}

function renderSeedSelectionScreen(seeds) {
    const listEl = document.getElementById('recommendationsListModal');
    listEl.innerHTML = '';
    
    seeds.forEach(seed => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action recommendation-seed-item';
        item.dataset.seedId = seed.id;
        item.innerHTML = `
            <h6>${seed.Name}</h6>
            <small class="text-muted">
                ${renderStars(seed.overallRating)} 
                ${seed.Recommendation === 'Highly Recommended' ? `| <i class="fas fa-thumbs-up text-success"></i> Highly Recommended` : ''}
            </small>`;
        
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const selectedSeedId = e.currentTarget.dataset.seedId;
            const selectedSeed = movieData.find(m => m.id === selectedSeedId);
            const titleEl = document.getElementById('recommendationsListTitleModal');
            if (selectedSeed && titleEl) {
                $('#refreshRecommendationsBtnModal').show();
                titleEl.textContent = `Because you liked "${selectedSeed.Name}"...`;
                listEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Finding recommendations...</p>';
                await fetchAndCacheSuggestions(selectedSeedId);
                await renderNextSuggestion();
            }
        });
        listEl.appendChild(item);
    });
}

async function fetchAndCacheSuggestions(seedMovieId) {
    const seedMovie = movieData.find(m => m.id === seedMovieId);
    if (!seedMovie || !seedMovie.tmdbId) {
        showToast("Fallback Active", "No TMDB ID for seed. Finding similar titles in your library.", "info");
        suggestionCache.suggestions = findSimilarByLocalCalculation(seedMovie);
        suggestionCache.source = 'local_fallback';
        suggestionCache.localSearchPerformed = true;
        return;
    }

    try {
        const data = await callTmdbApiDirect(`/movie/${seedMovie.tmdbId}/recommendations`);
        const recommendations = data.results || [];
        
        if (recommendations.length === 0) {
            throw new Error("No recommendations returned from TMDB.");
        }

        const loggedTmdbIds = new Set(movieData.map(m => m.tmdbId).filter(Boolean));
        const newSuggestions = recommendations.filter(rec => rec.id && !loggedTmdbIds.has(String(rec.id)));
        
        suggestionCache = { seedMovieId, suggestions: newSuggestions, source: 'tmdb', localSearchPerformed: false };

    } catch (error) {
        console.warn("TMDB suggestion fetch failed:", error.message, "Activating local fallback.");
        showToast("Fallback Active", "TMDB search failed. Finding similar titles in your library.", "info");
        suggestionCache.suggestions = findSimilarByLocalCalculation(seedMovie);
        suggestionCache.source = 'local_fallback';
        suggestionCache.localSearchPerformed = true;
    }
}

async function renderNextSuggestion() {
    const listEl = document.getElementById('recommendationsListModal');
    const refreshBtn = $('#refreshRecommendationsBtnModal');

    if (suggestionCache.suggestions && suggestionCache.suggestions.length > 0) {
        const nextSuggestion = suggestionCache.suggestions.shift();
        await renderSuggestionCard(nextSuggestion, listEl);
        refreshBtn.prop('disabled', false);
    } else {
        if (suggestionCache.source === 'tmdb' && !suggestionCache.localSearchPerformed) {
            // TMDB cache exhausted, now try local fallback
            const seedMovie = movieData.find(m => m.id === suggestionCache.seedMovieId);
            showToast("Phase 2", "Finding more suggestions from your own 'To Watch' list.", "info");
            suggestionCache.suggestions = findSimilarByLocalCalculation(seedMovie);
            suggestionCache.source = 'local_fallback';
            suggestionCache.localSearchPerformed = true;
            await renderNextSuggestion(); // Recursive call to render the first local result
        } else {
            const seedMovie = movieData.find(m => m.id === suggestionCache.seedMovieId);
            const seedName = seedMovie ? ` for "${seedMovie.Name}"` : "";
            listEl.innerHTML = `<div class="list-group-item text-center text-muted small p-3">No more suggestions${seedName}. Try another seed!</div>`;
            refreshBtn.prop('disabled', true);
        }
    }
}

async function renderSuggestionCard(suggestionData, targetElement) {
    targetElement.innerHTML = '';
    
    const isFromTmdb = !suggestionData.hasOwnProperty('id'); // Local entries have our UUID 'id'
    const name = suggestionData.title || suggestionData.name || suggestionData.Name;
    const releaseDate = suggestionData.release_date || suggestionData.first_air_date || suggestionData.Year;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const overview = suggestionData.overview || suggestionData.Description || 'No description available.';
    const voteAvg = suggestionData.vote_average || suggestionData.tmdb_vote_average;
    
    const card = document.createElement('div');
    card.className = 'recommendation-item list-group-item p-3 shadow-sm rounded';
    card.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${name} <small class="text-muted">(${year})</small></h6>
            ${voteAvg ? `<small class="text-info" title="TMDB Rating">TMDB: ${voteAvg.toFixed(1)} <i class="fas fa-star text-warning"></i></small>` : ''}
        </div>
        <p class="mb-2 text-muted small">${overview.substring(0, 150)}${overview.length > 150 ? '...' : ''}</p>
        <div class="text-right mt-2">
            <button class="btn btn-sm btn-info view-details-btn"><i class="fas fa-eye"></i> View Details</button>
            ${isFromTmdb ? `<button class="btn btn-sm btn-primary add-to-list-btn"><i class="fas fa-plus-circle"></i> Add to List</button>` : ''}
        </div>
    `;

    card.querySelector('.view-details-btn').addEventListener('click', async () => {
        $('#personalizedSuggestionsModal').modal('hide');
        $('#personalizedSuggestionsModal').one('hidden.bs.modal', () => {
            if (isFromTmdb) {
                openDetailsModal(null, suggestionData); // Pass TMDB object
            } else {
                openDetailsModal(suggestionData.id); // Pass local ID
            }
        });
    });

    if (isFromTmdb) {
        card.querySelector('.add-to-list-btn').addEventListener('click', async () => {
            showLoading(`Adding "${name}"...`);
            try {
                await prepareAddModal();
                await applyTmdbSelection(suggestionData);
                $('#personalizedSuggestionsModal').modal('hide');
                $('#entryModal').modal('show');
            } catch(e){
                showToast("Error", "Could not prepare the entry form.", "error");
            } finally {
                hideLoading();
            }
        });
    }

    targetElement.appendChild(card);
}

// ### NEW FALLBACK ENGINE ###
function findSimilarByLocalCalculation(seedMovie) {
    if (!seedMovie) return [];

    const seedKeywords = new Set((seedMovie.keywords || []).map(k => k.id));
    const seedGenres = new Set((seedMovie.Genre || "").split(',').map(g => g.trim()).filter(Boolean));
    const seedDirectorId = seedMovie.director_info?.id;
    const seedActorIds = new Set((seedMovie.full_cast || []).slice(0, 5).map(a => a.id));
    const seedStudioIds = new Set((seedMovie.production_companies || []).slice(0,3).map(s => s.id));

    const candidates = movieData.filter(m => 
        m.id !== seedMovie.id && m.Status === 'To Watch'
    );

    const scoredCandidates = candidates.map(candidate => {
        let similarityScore = 0;

        // Director Match (High Value)
        if (seedDirectorId && candidate.director_info?.id === seedDirectorId) {
            similarityScore += 10;
        }

        // Genre Match
        const candidateGenres = new Set((candidate.Genre || "").split(',').map(g => g.trim()).filter(Boolean));
        const sharedGenres = [...seedGenres].filter(g => candidateGenres.has(g));
        if (sharedGenres.length > 0) {
            similarityScore += 5; // Base score for any genre match
            if (sharedGenres.length > 1) {
                similarityScore += (sharedGenres.length - 1) * 2; // Bonus for more matches
            }
        }

        // Keyword Match
        const candidateKeywords = new Set((candidate.keywords || []).map(k => k.id));
        const sharedKeywordsCount = [...seedKeywords].filter(k => candidateKeywords.has(k)).length;
        similarityScore += sharedKeywordsCount * 3;

        // Actor Match (Top 5)
        const candidateActorIds = new Set((candidate.full_cast || []).slice(0, 5).map(a => a.id));
        const sharedActorsCount = [...seedActorIds].filter(a => candidateActorIds.has(a)).length;
        similarityScore += sharedActorsCount * 4;

        // Studio Match
        const candidateStudioIds = new Set((candidate.production_companies || []).slice(0, 3).map(s => s.id));
        const sharedStudiosCount = [...seedStudioIds].filter(s => candidateStudioIds.has(s)).length;
        similarityScore += sharedStudiosCount * 2;
        
        return { ...candidate, similarityScore };
    });

    return scoredCandidates
        .filter(c => c.similarityScore >= 5) // Minimum threshold for a decent match
        .sort((a, b) => b.similarityScore - a.similarityScore);
}


function displayAchievementsModal() {
    const badgesContainer = document.getElementById('achievementBadgesModal');
    if (!badgesContainer) { console.warn("Achievements modal badges container not found."); return; }
    badgesContainer.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Calculating achievements...</p>';

    const statsForAchievements = calculateAllStatistics(movieData);
    generateBadgesAndAchievements(statsForAchievements, badgesContainer);
}

const chartsModalChartInstances = {};
async function displayChartsModal() {
    const modalBody = document.getElementById('chartsModalBody');
    if (!modalBody) { console.warn("Charts modal body not found."); return; }

    destroyCharts(chartsModalChartInstances);

    if (Object.keys(globalStatsData).length === 0 || globalStatsData.totalEntries === 0) {
        globalStatsData = calculateAllStatistics(movieData);
    }

    if (Object.keys(globalStatsData).length === 0 || globalStatsData.totalEntries === 0) {
        modalBody.innerHTML = '<div class="col-12"><p class="text-center text-muted p-3">No data for charts. Add some entries first!</p></div>';
        return;
    }

    renderChartsForModal(globalStatsData, chartsModalChartInstances);
}

async function displayDetailedStatsModal() {
    const modal = document.getElementById('detailedStatsModal');
    if (!modal) { console.warn("Detailed stats modal not found."); return; }

    modal.querySelectorAll('#detailedStatsTabContent ul, #detailedStatsTabContent ol, #detailedStatsModal table tbody').forEach(el => el.innerHTML = '');
    modal.querySelectorAll('#detailedStatsTabContent p span').forEach(el => el.textContent = 'N/A');

    if (Object.keys(globalStatsData).length === 0 || globalStatsData.totalEntries === 0) {
        globalStatsData = calculateAllStatistics(movieData);
    }

    if (Object.keys(globalStatsData).length === 0 || globalStatsData.totalEntries === 0) {
        modal.querySelector('#stats-summary-detailed').innerHTML = '<p class="text-center text-muted p-3">No data available.</p>';
        if (typeof $ !== 'undefined') $('#detailedStatsTab a[href="#stats-summary-detailed"]').tab('show');
        return;
    }

    const stats = globalStatsData;

    const populateList = (elementId, dataArray, maxItems = 0) => {
        const listEl = document.getElementById(elementId);
        if (!listEl) return;
        listEl.innerHTML = '';
        const itemsToShow = maxItems > 0 ? dataArray.slice(0, maxItems) : dataArray;
        if (itemsToShow.length === 0) { listEl.innerHTML = `<li class="list-group-item text-muted small">N/A</li>`; return; }
        itemsToShow.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `${item.label} <span class="badge badge-primary badge-pill">${item.value}</span>`;
            listEl.appendChild(li);
        });
    };

    const populateTable = (tableId, dataRows, columnDefs) => {
        const table = document.getElementById(tableId);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (dataRows.length === 0) {
            const cols = columnDefs.length;
            tbody.innerHTML = `<tr><td colspan="${cols}" class="text-center text-muted small">N/A</td></tr>`;
            return;
        }
        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            columnDefs.forEach(def => {
                const td = document.createElement('td');
                td.setAttribute('data-label', def.label);
                td.innerHTML = row[def.key] !== undefined && row[def.key] !== null ? row[def.key] : 'N/A';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    };

    document.getElementById('statsTotalEntries').textContent = stats.totalEntries;
    document.getElementById('statsTotalTitlesWatched').textContent = stats.totalTitlesWatched;
    document.getElementById('statsTotalWatchInstances').textContent = stats.totalWatchInstances;
    document.getElementById('statsTotalWatchTime').textContent = stats.totalWatchTime;
    document.getElementById('statsAvgOverallRating').innerHTML = `${renderStars(stats.avgOverallRating)} (${stats.avgOverallRating})`;
    populateList('statsByCategory', stats.categories);
    populateList('statsByStatus', stats.statuses);
    populateList('statsTopRatedGenresOverall', stats.topRatedGenresOverall.map(g => ({ label: g.label, value: `${g.value} avg (${g.count})` })), 5);

    const toWatchCount = stats.statuses.find(s => s.label === 'To Watch')?.value || 0;
    const watchedCount = stats.statuses.find(s => s.label === 'Watched')?.value || 0;
    const totalForProgress = toWatchCount + watchedCount;
    const progressPercent = totalForProgress > 0 ? ((watchedCount / totalForProgress) * 100).toFixed(1) : 0;
    document.getElementById('statsToWatchCompletion').textContent = `${progressPercent}%`;
    document.getElementById('toWatchProgressBar').style.width = `${progressPercent}%`;
    document.getElementById('toWatchProgressBar').setAttribute('aria-valuenow', progressPercent);
    document.getElementById('watchedCountProgress').textContent = watchedCount;
    document.getElementById('totalRelevantCountProgress').textContent = totalForProgress;
    document.getElementById('avgMonthlyPace').textContent = stats.avgMonthlyPace || 'N/A';
    document.getElementById('estimatedCompletionTime').textContent = stats.estimatedCompletionTime || 'N/A';

    populateTable('statsWatchesByYear', stats.watchesByYear, [{ key: 'year', label: 'Year' }, { key: 'instances', label: 'Instances' }, { key: 'unique_titles', label: 'Unique Titles' }, { key: 'avg_rating', label: 'Avg. Rating' }]);
    populateTable('statsWatchesByMonth', stats.watchesByMonth.slice(0, 12), [{ key: 'month_year_label', label: 'Month' }, { key: 'instances', label: 'Instances' }, { key: 'unique_titles', label: 'Unique Titles' }]);

    populateList('statsTopSingleGenres', stats.topSingleGenres.slice(0, 10));
    populateList('statsAvgRatingByGenre', stats.topRatedGenresOverall.slice(0, 10).map(g => ({ label: g.label, value: `${g.value} avg (${g.count})` })), 10);
    populateList('genreCombinations', stats.genreCombinations);

    populateList('statsByOverallRating', stats.overallRatingDistributionData);
    populateList('statsByWatchInstanceRating', stats.watchInstanceRatingDistributionData);
    populateList('statsAvgOverallRatingByCategory', stats.avgOverallRatingByCategory);

    populateList('statsMostWatchedActors', stats.mostWatchedActors);
    populateList('statsMostWatchedDirectors', stats.mostWatchedDirectors);
    populateList('statsMostFrequentProductionCompanies', stats.mostFrequentProductionCompanies);
    populateList('statsAvgRatingByStudio', stats.avgRatingByStudio.map(s => ({ label: s.label, value: `${s.value} avg (${s.count})` })), 5);

    populateList('statsTopCountries', stats.topCountries);
    populateList('statsTopLanguages', stats.topLanguages);

    if (typeof $ !== 'undefined' && !$('#detailedStatsTab .nav-link.active').length) {
        $('#detailedStatsTab a[href="#stats-summary-detailed"]').tab('show');
    }
}

function renderChartsForModal(statsData, chartInstanceObj) {
    destroyCharts(chartInstanceObj);
    const chartsModalBody = document.getElementById('chartsModalBody');
    if (!chartsModalBody) { return; }

    const chartTextColor = getComputedStyle(document.body).getPropertyValue('--body-text-color').trim() || '#333';
    const gridColor = getComputedStyle(document.body).getPropertyValue('--table-border-color').trim() || 'rgba(0,0,0,0.1)';

    const renderSingleChart = (canvasId, type, chartLabels, chartDataSets, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const hasData = chartLabels && chartLabels.length > 0 && chartDataSets.some(ds => ds.data && ds.data.length > 0);

        if (hasData) {
            let chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: (type === 'pie' || type === 'doughnut' || type === 'radar'), labels: { color: chartTextColor } } }, scales: { x: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor }, grid: { color: gridColor } }, y: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor }, grid: { color: gridColor }, beginAtZero: true } }, ...options };
            if (type === 'radar') chartOptions.scales = { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: chartTextColor, font: { size: 10 } }, ticks: { backdropColor: 'transparent', color: chartTextColor, stepSize: 1, min: 0, max: 5 } } };
            const styledChartDataSets = chartDataSets.map((dataset) => ({ ...dataset, backgroundColor: generateColors(dataset.data.length, 0.8), borderColor: generateColors(dataset.data.length, 1), borderWidth: 1.5, tension: 0.3 }));
            chartInstanceObj[canvasId] = new Chart(ctx, { type, data: { labels: chartLabels, datasets: styledChartDataSets }, options: chartOptions });
        }
    };

    renderSingleChart('chartModalWatchInstancesByYear', 'bar', (statsData.watchesByYear || []).map(d => d.year).reverse(), [{ label: 'Watch Instances', data: (statsData.watchesByYear || []).map(d => d.instances).reverse() }]);
    const topGenresForChart = (statsData.topSingleGenres || []).slice(0, 10);
    renderSingleChart('chartModalMoviesPerGenre', 'bar', topGenresForChart.map(d => d.label), [{ label: 'Entries', data: topGenresForChart.map(d => d.value) }], { indexAxis: 'y' });
    renderSingleChart('chartModalOverallRatingDistribution', 'doughnut', (statsData.overallRatingDistributionData || []).map(d => d.label), [{ data: (statsData.overallRatingDistributionData || []).map(d => d.value) }]);
    renderSingleChart('chartModalWatchInstanceRatingDistribution', 'pie', (statsData.watchInstanceRatingDistributionData || []).map(d => d.label), [{ data: (statsData.watchInstanceRatingDistributionData || []).map(d => d.value) }]);
    renderSingleChart('chartModalMovieStatusBreakdown', 'pie', (statsData.statuses || []).map(d => d.label), [{ data: (statsData.statuses || []).map(d => d.value) }]);
    renderSingleChart('chartModalLanguageDistribution', 'doughnut', (statsData.topLanguages || []).map(d => d.label), [{ data: (statsData.topLanguages || []).map(d => d.value) }]);
    renderSingleChart('chartModalCountryDistribution', 'doughnut', (statsData.topCountries || []).map(d => d.label), [{ data: (statsData.topCountries || []).map(d => d.value) }]);
    const sortedMonthly = [...(statsData.watchesByMonth || [])].slice(0, 12).sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
    renderSingleChart('chartModalWatchActivityOverTime', 'line', sortedMonthly.map(d => d.month_year_label), [{ label: 'Watch Instances', data: sortedMonthly.map(d => d.instances) }]);
    const ratedGenres = (statsData.topRatedGenresOverall || []).filter(g => g.count >= 2).slice(0, 7);
    if (ratedGenres.length >= 3) renderSingleChart('chartModalRatingByGenreRadar', 'radar', ratedGenres.map(d => d.label), [{ label: 'Average Overall Rating', data: ratedGenres.map(d => parseFloat(d.value)) }]);
}

function generateBadgesAndAchievements(achievementStats, container) {
    if (!container) return;
    container.innerHTML = '';
    let achievedCountForMeta = 0;
    const achievementsToDisplay = ACHIEVEMENTS.map(ach => {
        // Pass the entire stats object to checkAchievement
        const { isAchieved, progress } = checkAchievement(ach, achievementStats);
        if (isAchieved && ach.type !== 'meta_achievement_count') achievedCountForMeta++;
        return { ...ach, isAchieved, progress };
    });

    // We need to update the stats object for the meta achievements check
    const statsForMeta = { ...achievementStats, unlockedCountForMeta: achievedCountForMeta };

    achievementsToDisplay.forEach(ach => {
        if (ach.type === 'meta_achievement_count') {
            const { isAchieved, progress } = checkAchievement(ach, statsForMeta);
            ach.progress = progress;
            ach.isAchieved = isAchieved;
        }
    });

    achievementsToDisplay.sort((a, b) => (b.isAchieved - a.isAchieved) || ((b.progress / (b.threshold || 1)) - (a.progress / (a.threshold || 1))) || a.name.localeCompare(b.name));

    achievementsToDisplay.forEach(ach => {
        const titleText = `${ach.name} - ${ach.description} (${ach.isAchieved ? 'Completed!' : `${ach.progress} / ${ach.threshold}`})`;
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${ach.isAchieved ? 'achieved' : 'locked'}`;
        badge.title = titleText;
        badge.dataset.description = ach.description;
        badge.dataset.name = ach.name;
        badge.dataset.progress = ach.progress;
        badge.dataset.threshold = ach.threshold;
        badge.dataset.achieved = ach.isAchieved;

        badge.innerHTML = ach.isAchieved
    ? `<span class="fa-stack fa-2x">
           <i class="fas fa-trophy fa-stack-2x"></i>
       </span>
       <span>${ach.name}</span>`
    : `<span class="fa-stack fa-2x">
           <i class="${ach.icon} fa-stack-2x"></i>
       </span>
       <span>${ach.name}</span>`;
        container.appendChild(badge);
    });
}

// START CHUNK: PDF Export Function
async function exportStatsAsPdf(filename = 'KeepMovizEZ_Report.pdf') {
    if (!globalStatsData || !globalStatsData.totalEntries) {
        showToast("Export Error", "No statistics data available to export.", "error"); 
        return;
    }
    showLoading("Generating Your Comprehensive PDF Report...");
    await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to update

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 14;
        let yPos = 22;

        const addHeaderAndFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8); 
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10);
                doc.text(`KeepMovizEZ Report | ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
            }
        };

        const renderChartOffscreen = async (type, chartLabels, chartDataSets, options = {}) => {
            const offscreenCanvas = document.createElement('canvas');
            // Use higher resolution for better PDF quality
            offscreenCanvas.width = 800;
            offscreenCanvas.height = 600;

            const chartTextColor = '#333'; // Use a fixed color for PDF consistency
            const gridColor = '#e0e0e0';
            
            let chartOptions = {
                responsive: false,
                animation: false, // Important for static rendering
                plugins: { legend: { display: true, labels: { color: chartTextColor, font: { size: 18 } } } },
                scales: { x: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor }, grid: { color: gridColor } }, y: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor }, grid: { color: gridColor }, beginAtZero: true } },
                ...options
            };
            if (type === 'radar') chartOptions.scales = { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: chartTextColor, font: { size: 14 } }, ticks: { backdropColor: 'transparent', color: chartTextColor, stepSize: 1, min: 0, max: 5 } } };

            const chart = new Chart(offscreenCanvas.getContext('2d'), {
                type,
                data: {
                    labels: chartLabels,
                    datasets: chartDataSets.map(ds => ({
                        ...ds,
                        backgroundColor: generateColors(ds.data.length, 0.8),
                        borderColor: generateColors(ds.data.length, 1),
                        borderWidth: 1.5,
                        tension: 0.3
                    }))
                },
                options: chartOptions
            });

            // Wait for chart to render. A small timeout is often needed.
            await new Promise(resolve => setTimeout(resolve, 250)); 
            const imgData = chart.toBase64Image();
            chart.destroy();
            return imgData;
        };

        // --- PAGE 1: TITLE, SUMMARY & KEY CHARTS ---
        doc.setFontSize(18); doc.setTextColor(44, 62, 80); doc.text("Statistics Report", margin, yPos);
        yPos += 13;
        doc.setFontSize(12); doc.text("Overall Summary", margin, yPos);
        yPos += 5;

        doc.autoTable({
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            body: [
                ['Total Entries in Log', globalStatsData.totalEntries],
                ['Total Titles Watched', globalStatsData.totalTitlesWatched],
                ['Total Individual Watch Instances', globalStatsData.totalWatchInstances],
                ['Estimated Total Watch Time', globalStatsData.totalWatchTime],
                ['Average Overall Rating (Watched)', `${globalStatsData.avgOverallRating} / 5`],
            ]
        });
        yPos = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(12); doc.text("Visual Overview", margin, yPos);
        yPos += 5;
        
        const chartImage1 = await renderChartOffscreen('pie', globalStatsData.statuses.map(d => d.label), [{ data: globalStatsData.statuses.map(d => d.value) }]);
        const chartImage2 = await renderChartOffscreen('doughnut', globalStatsData.overallRatingDistributionData.map(d => d.label), [{ data: globalStatsData.overallRatingDistributionData.map(d => d.value) }]);

        if (chartImage1) doc.addImage(chartImage1, 'PNG', margin, yPos, 80, 60);
        if (chartImage2) doc.addImage(chartImage2, 'PNG', pageWidth - 80 - margin, yPos, 80, 60);
        
        // --- PAGE 2: DETAILED BREAKDOWNS ---
        doc.addPage();
        yPos = 22;
        doc.setFontSize(12); doc.setTextColor(44, 62, 80); doc.text("Detailed Breakdowns", margin, yPos);
        yPos += 8;

        const tableWidth = (pageWidth - (margin * 2) - 10) / 2;
        doc.autoTable({ startY: yPos, head: [['Category', 'Count']], body: globalStatsData.categories.map(item => [item.label, item.value]), theme: 'striped', headStyles: { fillColor: [44, 62, 80] }, margin: { right: pageWidth - margin - tableWidth } });
        doc.autoTable({ startY: yPos, head: [['Top 10 Countries', 'Count']], body: globalStatsData.topCountries.slice(0, 10).map(item => [item.label, item.value]), theme: 'striped', headStyles: { fillColor: [44, 62, 80] }, margin: { left: margin + tableWidth + 10 } });
        yPos = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(11); doc.text("Watch Activity by Year", margin, yPos);
        yPos += 5;
        doc.autoTable({ startY: yPos, head: [['Year', 'Instances', 'Unique Titles', 'Avg. Rating']], body: globalStatsData.watchesByYear.slice(0, 20).map(r => [r.year, r.instances, r.unique_titles, r.avg_rating]), theme: 'grid', headStyles: { fillColor: [44, 62, 80] } });
        
        // --- PAGE 3: PEOPLE & PRODUCTION ---
        doc.addPage();
        yPos = 22;
        doc.setFontSize(12); doc.setTextColor(44, 62, 80); doc.text("People & Production", margin, yPos);
        yPos += 8;
        
        doc.autoTable({ startY: yPos, head: [['Top 10 Watched Actors', 'Appearances']], body: globalStatsData.mostWatchedActors.slice(0, 10).map(item => [item.label, item.value]), theme: 'striped', headStyles: { fillColor: [44, 62, 80] }, margin: { right: pageWidth / 2 + 5 } });
        doc.autoTable({ startY: yPos, head: [['Top 10 Watched Directors', 'Films']], body: globalStatsData.mostWatchedDirectors.slice(0, 10).map(item => [item.label, item.value]), theme: 'striped', headStyles: { fillColor: [44, 62, 80] }, margin: { left: pageWidth / 2 + 5 } });
        yPos = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(11); doc.text("Top 10 Production Companies", margin, yPos);
        yPos += 5;
        doc.autoTable({ startY: yPos, head: [['Company', 'Count']], body: globalStatsData.mostFrequentProductionCompanies.slice(0, 10).map(item => [item.label, item.value]), theme: 'grid', headStyles: { fillColor: [44, 62, 80] } });

        // --- PAGE 4: VISUAL DATA ---
        doc.addPage();
        yPos = 22;
        doc.setFontSize(12); doc.setTextColor(44, 62, 80); doc.text("Visual Data Insights", margin, yPos);
        yPos += 8;

        const chartImage3 = await renderChartOffscreen('bar', globalStatsData.watchesByYear.map(d => d.year).reverse(), [{ label: 'Watch Instances', data: globalStatsData.watchesByYear.map(d => d.instances).reverse() }]);
        const topGenresForChart = globalStatsData.topSingleGenres.slice(0, 10);
        const chartImage4 = await renderChartOffscreen('bar', topGenresForChart.map(d => d.label), [{ label: 'Entries', data: topGenresForChart.map(d => d.value) }], { indexAxis: 'y' });
        
        if (chartImage3) doc.addImage(chartImage3, 'PNG', margin, yPos, (pageWidth - margin * 2), 80);
        yPos += 90;
        if (chartImage4) doc.addImage(chartImage4, 'PNG', margin, yPos, (pageWidth - margin * 2), 100);

        // --- PAGE 5: ACHIEVEMENTS ---
        doc.addPage();
        yPos = 22;
        doc.setFontSize(12); doc.setTextColor(44, 62, 80); doc.text("Achievements Unlocked", margin, yPos);
        yPos += 10;

        const unlockedAchievements = [];
        ACHIEVEMENTS.forEach(ach => {
            const { isAchieved } = checkAchievement(ach, globalStatsData);
            if (isAchieved) unlockedAchievements.push([ach.name, ach.description]);
        });

        if (unlockedAchievements.length > 0) {
            doc.autoTable({ startY: yPos, head: [['Achievement', 'Description']], body: unlockedAchievements, theme: 'grid', headStyles: { fillColor: [44, 62, 80] } });
        } else {
            doc.setFontSize(10).setTextColor(100).text("No achievements unlocked yet. Keep watching!", margin, yPos);
        }

        addHeaderAndFooter();
        doc.save(filename);
        showToast("PDF Exported", `${filename} has been generated.`, "success");

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast("PDF Export Error", `Failed: ${error.message}. Check console for details.`, "error", 7000);
    } finally {
        hideLoading();
    }
}
// END CHUNK: PDF Export function 

// START CHUNK: Daily Recommendation Logic
function getDailyRecommendationMovie() {
    let message = "No recommendations available. Try adding more movies to your 'To Watch' list!";
    const today = new Date().toISOString().slice(0, 10);
    const lastRecDate = localStorage.getItem(DAILY_RECOMMENDATION_DATE_KEY);
    const lastRecId = localStorage.getItem(DAILY_RECOMMENDATION_ID_KEY);
    let dailyRecSkipCount = parseInt(localStorage.getItem(DAILY_REC_SKIP_COUNT_KEY) || '0');

    // If it's a new day, reset the skip counter and the last known recommendation ID
    if (lastRecDate !== today) {
        dailyRecSkipCount = 0;
        localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, '0');
        localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY);
    }

    if (lastRecDate === today && dailyRecSkipCount >= MAX_DAILY_SKIPS) {
        return { message: "You've skipped the maximum number of daily recommendations. Check back tomorrow!", movie: null, dailyRecSkipCount };
    }

    // Check if a valid recommendation already exists for today
    if (lastRecDate === today && lastRecId) {
        const existingRec = movieData.find(m => m.id === lastRecId && m.Status === 'To Watch' && !m.doNotRecommendDaily);
        if (existingRec) {
            return { message: "Success", movie: existingRec, dailyRecSkipCount };
        }
    }

    // If we are here, we need to generate a new recommendation for today
    const toWatchList = movieData.filter(m => m.Status === 'To Watch' && !m.doNotRecommendDaily);
    if (toWatchList.length === 0) return { message, movie: null, dailyRecSkipCount };

    // Make sure we don't pick the same movie that was just skipped or became invalid
    const potentialPicks = toWatchList.filter(m => m.id !== lastRecId);
    const listToPickFrom = potentialPicks.length > 0 ? potentialPicks : toWatchList;

    const recommendedMovie = listToPickFrom[Math.floor(Math.random() * listToPickFrom.length)];

    localStorage.setItem(DAILY_RECOMMENDATION_ID_KEY, recommendedMovie.id);
    localStorage.setItem(DAILY_RECOMMENDATION_DATE_KEY, today);

    // Only show the introductory toast on the very first recommendation of the day
    if (lastRecDate !== today) {
        showToast("Daily Recommendation", "Here is your pick for today!", "info", 4000, DO_NOT_SHOW_AGAIN_KEYS.DAILY_RECOMMENDATION_INTRO);
    }
    
    return { message: "Success", movie: recommendedMovie, dailyRecSkipCount };
}
//END CHUNK: Daily Recommendation Logic
