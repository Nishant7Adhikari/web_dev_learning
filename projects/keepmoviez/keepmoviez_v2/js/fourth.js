// js/ui-stats.js

// Helper function to generate dynamic colors for charts
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

// Function to destroy all existing Chart.js instances
function destroyCharts() {
    for (const chartId in chartInstances) {
        if (chartInstances[chartId] && typeof chartInstances[chartId].destroy === 'function') {
            chartInstances[chartId].destroy();
        }
        delete chartInstances[chartId];
    }
}

// Function to render the charts
function renderCharts(statsData) {
    destroyCharts();

    if (!statsData || Object.keys(statsData).length === 0) {
        console.warn("No stats data provided to renderCharts.");
        $('.stats-chart-container canvas').each(function() {
            $(this).hide();
            let msgEl = $(this).parent().find('.chart-no-data-message');
            if (!msgEl.length) {
                msgEl = $('<p class="text-muted text-center chart-no-data-message p-3"></p>');
                $(this).parent().append(msgEl);
            }
            msgEl.text('Statistics data not available.').show();
        });
        return;
    }

    const chartTextColor = getComputedStyle(document.body).getPropertyValue('--body-text-color').trim() || '#333';
    const gridColor = getComputedStyle(document.body).getPropertyValue('--table-border-color').trim() || 'rgba(0,0,0,0.1)';

    const renderSingleChart = (canvasId, type, chartLabels, chartDataSets, options, noDataMessage) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas element with ID '${canvasId}' not found.`);
            return;
        }
        const parentContainer = canvas.parentNode;
        let messageElement = parentContainer.querySelector('.chart-no-data-message');
        if (!messageElement) {
            messageElement = document.createElement('p');
            messageElement.className = 'text-muted text-center chart-no-data-message p-3';
            parentContainer.appendChild(messageElement);
        }

        const hasData = chartLabels && chartLabels.length > 0 && chartDataSets &&
                        chartDataSets.some(dataset => dataset.data && dataset.data.some(val => (typeof val === 'number' && val !== 0) || (typeof val === 'string' && val !== '')));

        if (hasData) {
            canvas.style.display = 'block';
            messageElement.style.display = 'none';

            let chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: (type === 'pie' || type === 'doughnut' || type ==='radar'),
                        position: 'top',
                        labels: { color: chartTextColor, font: { size: 10 } }
                    },
                    tooltip: {
                        enabled: true, mode: 'index', intersect: false,
                        backgroundColor: getComputedStyle(document.body).getPropertyValue('--card-bg').trim() || '#fff',
                        titleColor: getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#007bff',
                        bodyColor: chartTextColor,
                        borderColor: gridColor, borderWidth: 1
                    },
                    title: { display: false }
                },
                scales: {
                    x: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor, font: {size: 9} }, grid: { color: gridColor } },
                    y: { display: (type === 'bar' || type === 'line'), ticks: { color: chartTextColor }, grid: { color: gridColor }, beginAtZero: true }
                },
                ...options
            };

            if (type === 'radar') {
                chartOptions.scales = {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: { color: chartTextColor, font: { size: 10, weight: '500' } },
                        ticks: { backdropColor: 'transparent', color: chartTextColor, stepSize: 1, font: {size:8} }
                    }
                };
            }

            const styledChartDataSets = chartDataSets.map((dataset, index) => {
                let bgColors, borderColors;
                if (type === 'pie' || type === 'doughnut' || type === 'radar') {
                    bgColors = generateColors(dataset.data.length, 0.8);
                    borderColors = bgColors.map(color => color.replace(/,\s*\d?\.?\d+\)/, ', 1)'));
                } else {
                    bgColors = generateColors(chartDataSets.length, 0.6)[index % generateColors(chartDataSets.length).length];
                    borderColors = String(bgColors).replace(/,\s*\d?\.?\d+\)/, ', 1)');
                }
                return { ...dataset, backgroundColor: dataset.backgroundColor || bgColors, borderColor: dataset.borderColor || borderColors, borderWidth: dataset.borderWidth || (type === 'line' ? 2 : 1.5), fill: dataset.fill !== undefined ? dataset.fill : (type === 'line' || type === 'radar'), tension: dataset.tension !== undefined ? dataset.tension : (type === 'line' ? 0.3 : 0), };
            });

            chartInstances[canvasId] = new Chart(canvas.getContext('2d'), { type: type, data: { labels: chartLabels, datasets: styledChartDataSets }, options: chartOptions });
        } else {
            canvas.style.display = 'none';
            messageElement.textContent = noDataMessage || 'No data available for this chart.';
            messageElement.style.display = 'block';
        }
    };

    renderSingleChart('chartWatchInstancesByYear', 'bar',
        (statsData.watchesByYear || []).map(d => d.year).reverse(),
        [{ label: 'Watch Instances', data: (statsData.watchesByYear || []).map(d => d.instances).reverse() }],
        { scales: { y: { title: { display: true, text: 'Number of Watches', color: chartTextColor } }, x: { title: { display: true, text: 'Year', color: chartTextColor } } } },
        'No watch instances recorded by year.');

    const topGenresForChart = (statsData.topSingleGenres || []).slice(0, 10);
    renderSingleChart('chartMoviesPerGenre', 'bar',
        topGenresForChart.map(d => d.label),
        [{ label: 'Entries', data: topGenresForChart.map(d => d.value) }],
        { indexAxis: 'y', scales: { x: { title: { display: true, text: 'Number of Entries', color: chartTextColor } }, y: { ticks:{ font:{size:10}}}}, plugins:{legend: {display: false}} },
        'No genre data for watched entries.');

    renderSingleChart('chartOverallRatingDistribution', 'doughnut',
        (statsData.overallRatingDistributionData || []).map(d => d.label),
        [{ label: 'Entries', data: (statsData.overallRatingDistributionData || []).map(d => d.value) }],
        { plugins: { title: { display: true, text: 'Overall Entry Rating Distribution', color: chartTextColor, font: {size: 14} } } },
        'No overall rating data.');

    renderSingleChart('chartWatchInstanceRatingDistribution', 'pie',
        (statsData.watchInstanceRatingDistributionData || []).map(d => d.label),
        [{ label: 'Watches', data: (statsData.watchInstanceRatingDistributionData || []).map(d => d.value) }],
        { plugins: { title: { display: true, text: 'Individual Watch Rating Distribution', color: chartTextColor, font: {size: 14} } } },
        'No individual watch rating data.');

    renderSingleChart('chartMovieStatusBreakdown', 'pie',
        (statsData.statuses || []).map(d => d.label),
        [{ label: 'Entries', data: (statsData.statuses || []).map(d => d.value) }],
        { plugins: { title: { display: true, text: 'Entry Status Breakdown', color: chartTextColor, font: {size: 14} } } },
        'No entry status data.');

    renderSingleChart('chartLanguageDistribution', 'doughnut',
        (statsData.topLanguages || []).map(d => d.label),
        [{ label: 'Entries', data: (statsData.topLanguages || []).map(d => d.value) }],
        { plugins: { title: { display: true, text: 'Top 10 Languages (Watched)', color: chartTextColor, font: {size: 14} }, legend: { position: 'right'} } },
        'No language data for watched entries.');

    renderSingleChart('chartCountryDistribution', 'doughnut',
        (statsData.topCountries || []).map(d => d.label),
        [{ label: 'Entries', data: (statsData.topCountries || []).map(d => d.value) }],
        { plugins: { title: { display: true, text: 'Top 10 Countries (Watched)', color: chartTextColor, font: {size: 14} }, legend: { position: 'right'} } },
        'No country data for watched entries.');

    const sortedMonthlyActivityForChart = [...(statsData.watchesByMonth || [])].sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
    renderSingleChart('chartWatchActivityOverTime', 'line',
        sortedMonthlyActivityForChart.map(d => d.month_year_label),
        [{ label: 'Watch Instances', data: sortedMonthlyActivityForChart.map(d => d.instances) }],
        { scales: { y: { title: { display: true, text: 'Watch Instances', color: chartTextColor } }, x: { title: { display: true, text: 'Month/Year', color: chartTextColor } } } },
        'No monthly watch activity data.');

    const sortedMonthlyAvgRatingDataForChart = (statsData.watchesByMonth || [])
        .filter(d => d.avg_rating !== 'N/A' && !isNaN(parseFloat(d.avg_rating)))
        .sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
    renderSingleChart('chartAvgRatingOverTime', 'line',
        sortedMonthlyAvgRatingDataForChart.map(d => d.month_year_label),
        [{ label: 'Avg. Rating', data: sortedMonthlyAvgRatingDataForChart.map(d => parseFloat(d.avg_rating)), spanGaps: true }],
        { scales: { y: { min: 1, max: 5, title: { display: true, text: 'Average Rating', color: chartTextColor }, ticks:{stepSize:0.5} }, x: { title: { display: true, text: 'Month/Year', color: chartTextColor } } } },
        'No average rating over time data (ensure ratings are recorded).');

    const radarGenresForChart = (statsData.avgRatingByGenre || []).filter(d => d.value !== 'N/A' && !isNaN(parseFloat(d.value))).slice(0, 7);
    if (radarGenresForChart.length >= 3) {
        renderSingleChart('chartRatingByGenreRadar', 'radar',
            radarGenresForChart.map(d => d.label),
            [{ label: 'Average Overall Rating', data: radarGenresForChart.map(d => parseFloat(d.value)) }],
            { plugins: {title: {display:true, text: 'Avg. Rating by Genre (Top 7)', color:chartTextColor, font: {size: 14}}}},
            'No rated genre data for radar chart.');
    } else { renderSingleChart('chartRatingByGenreRadar', 'radar', [], [{}], {}, 'Not enough (min 3) rated genre data for radar chart.');}
}


async function showStatisticsModal() {
    if (!Array.isArray(movieData) || movieData.length === 0) {
        $('#statsModal .modal-body .tab-pane').empty().append('<p class="text-center text-muted p-3">No data available to generate statistics. Add some entries first!</p>');
        $('.stats-chart-container canvas').each(function() {
            $(this).hide();
            let msgEl = $(this).parent().find('.chart-no-data-message');
            if (!msgEl.length) {
                 msgEl = $('<p class="text-muted text-center chart-no-data-message p-3"></p>');
                $(this).parent().append(msgEl);
            }
            msgEl.text('No data to display.').show();
        });
        $('#statsTotalEntries, #statsTotalTitlesWatched, #statsTotalWatchInstances').text('0');
        $('#statsAvgOverallRating, #statsToWatchCompletion, #avgMonthlyPace, #estimatedCompletionTime').text('N/A');
        $('#toWatchProgressBar').css('width', '0%').attr('aria-valuenow', '0');
        $('#watchedCountProgress, #totalRelevantCountProgress').text('0');
        destroyCharts();
        globalStatsData = { achievementData: {} }; // Initialize with empty achievementData
        if (typeof generateBadgesAndAchievements === 'function') generateBadgesAndAchievements(globalStatsData.achievementData);
        return;
    }

    try {
        const populateList = (elementId, dataArray, valueSuffix = '', maxItems = 0, itemClass = 'list-group-item d-flex justify-content-between align-items-center p-2') => {
            const listEl = $(`#${elementId}`);
            if (!listEl.length) { console.warn(`List element #${elementId} not found.`); return; }
            listEl.empty();
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                listEl.append(`<li class="${itemClass} text-muted">No data available.</li>`); return;
            }
            const itemsToDisplay = maxItems > 0 ? dataArray.slice(0, maxItems) : dataArray;
            itemsToDisplay.forEach(item => {
                const label = item.label || 'N/A';
                const valueDisplay = (item.value !== undefined && item.value !== null) ? item.value : 'N/A';
                listEl.append(`<li class="${itemClass}">${label} <span class="badge badge-primary badge-pill">${valueDisplay}${valueSuffix}</span></li>`);
            });
        };

        const populateTable = (tableBodySelector, dataRows, columns) => {
            const tableBodyEl = $(tableBodySelector);
            if (!tableBodyEl.length) { console.warn(`Table body ${tableBodySelector} not found.`); return; }
            tableBodyEl.empty();
            if (!Array.isArray(dataRows) || dataRows.length === 0) {
                tableBodyEl.append(`<tr><td colspan="${columns.length}" class="text-center text-muted p-2">No data available.</td></tr>`); return;
            }
            dataRows.forEach(row => {
                const tr = $('<tr>');
                columns.forEach(col => {
                    let cellData = row[col.key];
                    let cellHtml = (cellData !== undefined && cellData !== null) ? cellData : 'N/A';
                    if (col.key === 'avg_rating' && typeof cellData === 'string' && cellData !== 'N/A') {
                        cellHtml = `${renderStars(cellData)} (${cellData})`;
                    } else if (col.key === 'unique_titles' && cellData instanceof Set) {
                        cellHtml = cellData.size;
                    }
                    tr.append($('<td>').html(String(cellHtml)));
                });
                tableBodyEl.append(tr);
            });
        };

        globalStatsData = {};
        // Basic Stats
        let currentTotalEntries = movieData.length;
        let currentTotalWatchInstances = 0, currentTotalTitlesWatchedCount = 0, currentSumOverallRatings = 0, currentRatedEntriesCount = 0;
        let currentToWatchCount = 0, currentActualWatchedCount = 0, currentActuallyRatedCount = 0;

        // Detailed Stats
        const categories = {}, statuses = {}, overallRatingCounts = {'1':0,'2':0,'3':0,'4':0,'5':0,'N/A':0};
        const watchInstanceRatingCounts = {'1':0,'2':0,'3':0,'4':0,'5':0,'N/A':0};
        const singleGenreCounts = {}, watchedGenreCounts = {}, genreRatingsSum = {}, genreRatedEntriesCount = {};
        const genreCombinations = {}, watchesByYear = {}, watchesByMonth = {};
        const countryCounts = {}, watchedCountryCounts = {}, languageCounts = {}, watchedLanguageCounts = {};
        const avgOverallRatingByCategory = {}, actorWatchCounts = {}, directorWatchCounts = {}, productionCompanyCounts = {};
        const uniqueCountriesWatched = new Set(), uniqueLanguagesWatched = new Set(), uniqueGenresWatched = new Set(), uniqueDecadesWatched = new Set();
        let distinctTitlesRewatchedCount = 0, maxSingleTitleRewatchCount = 0;
        let longSeriesCompletedCount = 0; // Assuming "long series" means > 50 episodes, and "completed" implies status 'Watched'
        let pre1980WatchedCount = 0, recent5YearsWatchedCount = 0;
        let titlesWithHighRec = 0, titlesForAnyone = 0;
        let statusContinueActiveCount = 0;
        let detailedDescriptionCount = 0, posterUrlPresentCount = 0;
        let tmdbCollectionStreakCount = 0; // Max streak for one collection
        const tmdbCollectionEntries = {}; // { collectionId: [movieId1, movieId2] }
        let directorStreakCount = 0; // Max streak for one director
        const directorEntries = {}; // { directorId: [movieId1, movieId2] }
        let studioStreakCount = 0; // Max streak for one studio
        const studioEntries = {}; // { studioId: [movieId1, movieId2] }
        let manualLinksCount = 0;
        let hiddenGemCount = 0;
        let allStatusesPresent = { "To Watch":0, "Watched":0, "Continue":0, "Unwatched":0 };

        const rewatchCountsPerTitle = {}; // { movieId: count }

        movieData.forEach(movie => {
            if (!movie || !movie.id) return;

            // Update status counts for 'allStatusesPresent'
            if (movie.Status && allStatusesPresent.hasOwnProperty(movie.Status)) {
                allStatusesPresent[movie.Status]++;
            }

            if (movie.Status === 'To Watch') currentToWatchCount++;
            if (movie.Status === 'Watched') currentActualWatchedCount++;
            if (movie.Status === 'Continue') statusContinueActiveCount++;


            const isConsideredWatched = (movie.Status === 'Watched' || movie.Status === 'Continue');
            if (isConsideredWatched) {
                currentTotalTitlesWatchedCount++;
                if (movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating))) {
                    currentSumOverallRatings += parseFloat(movie.overallRating);
                    currentRatedEntriesCount++;
                }
                if(movie.Genre) {
                    String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean).forEach(g => {
                        watchedGenreCounts[g] = (watchedGenreCounts[g] || 0) + 1;
                        uniqueGenresWatched.add(g);
                    });
                }
                if(movie.Country) String(movie.Country).split(',').map(c => String(c).trim()).filter(Boolean).forEach(c => { watchedCountryCounts[c] = (watchedCountryCounts[c] || 0) + 1; uniqueCountriesWatched.add(c); });
                if(movie.Language) String(movie.Language).split(',').map(l => String(l).trim()).filter(Boolean).forEach(l => { watchedLanguageCounts[l] = (watchedLanguageCounts[l] || 0) + 1; uniqueLanguagesWatched.add(l); });

                if (Array.isArray(movie.full_cast)) movie.full_cast.slice(0,5).forEach(p => { if(p && p.name) actorWatchCounts[p.name] = (actorWatchCounts[p.name] || 0) + 1;});
                if (movie.director_info && movie.director_info.name) {
                    directorWatchCounts[movie.director_info.name] = (directorWatchCounts[movie.director_info.name] || 0) + 1;
                    if (movie.director_info.id) { // For director streak
                        directorEntries[movie.director_info.id] = (directorEntries[movie.director_info.id] || 0) + 1;
                    }
                }
                if (Array.isArray(movie.production_companies)) movie.production_companies.forEach(c => {
                     if(c && c.name) productionCompanyCounts[c.name] = (productionCompanyCounts[c.name] || 0) + 1;
                     if(c && c.id) { // For studio streak
                        studioEntries[c.id] = (studioEntries[c.id] || 0) + 1;
                     }
                });

                if (movie.Year && !isNaN(parseInt(movie.Year))) {
                    const year = parseInt(movie.Year);
                    const decade = Math.floor(year / 10) * 10;
                    uniqueDecadesWatched.add(decade);
                    if (year < 1980) pre1980WatchedCount++;
                    if (year >= (new Date().getFullYear() - 5)) recent5YearsWatchedCount++;
                }

                if (movie.tmdb_collection_id) { // For franchise follower
                    tmdbCollectionEntries[movie.tmdb_collection_id] = (tmdbCollectionEntries[movie.tmdb_collection_id] || 0) + 1;
                }

                if (movie.tmdb_vote_count && movie.tmdb_vote_count < 1000 && movie.tmdb_vote_average && movie.tmdb_vote_average > 7.0) {
                    hiddenGemCount++;
                }

            }

            categories[movie.Category || 'N/A'] = (categories[movie.Category || 'N/A'] || 0) + 1;
            statuses[movie.Status || 'N/A'] = (statuses[movie.Status || 'N/A'] || 0) + 1;
            const orKey = String(movie.overallRating !== '' && movie.overallRating !== null ? movie.overallRating : 'N/A');
            overallRatingCounts[orKey] = (overallRatingCounts[orKey] || 0) + 1;
            if(orKey !== 'N/A') currentActuallyRatedCount++;

            if(movie.Category){
                avgOverallRatingByCategory[movie.Category] = avgOverallRatingByCategory[movie.Category] || {sum:0, count:0};
                if(movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating))){
                    avgOverallRatingByCategory[movie.Category].sum += parseFloat(movie.overallRating);
                    avgOverallRatingByCategory[movie.Category].count++;
                }
            }

            if(Array.isArray(movie.watchHistory)){
                currentTotalWatchInstances += movie.watchHistory.length;
                if (movie.watchHistory.length > 1) { // Count for rewatched distinct titles
                    rewatchCountsPerTitle[movie.id] = (rewatchCountsPerTitle[movie.id] || 0) + movie.watchHistory.length;
                }
                movie.watchHistory.forEach(wh => {
                    if(!wh || !wh.date) return;
                    const wirKey = String(wh.rating !== '' && wh.rating !== null ? wh.rating : 'N/A');
                    watchInstanceRatingCounts[wirKey] = (watchInstanceRatingCounts[wirKey] || 0) + 1;
                    try{
                        const d = new Date(wh.date);
                        const y = d.getFullYear().toString();
                        const m = d.getMonth();
                        const ymISO = `${y}-${(m + 1).toString().padStart(2, '0')}`;
                        const myLabel = `${d.toLocaleString('default', { month: 'short' })} ${y}`;

                        watchesByYear[y] = watchesByYear[y] || {instances:0, titles:new Set(), ratingsSum:0, ratedCount:0};
                        watchesByYear[y].instances++; watchesByYear[y].titles.add(movie.Name);
                        if(wh.rating && wh.rating !== '' && !isNaN(parseFloat(wh.rating))){ watchesByYear[y].ratingsSum += parseFloat(wh.rating); watchesByYear[y].ratedCount++; }

                        watchesByMonth[ymISO] = watchesByMonth[ymISO] || {month_year_iso: ymISO, month_year_label: myLabel, instances:0, titles:new Set(), ratingsSum:0, ratedCount:0};
                        watchesByMonth[ymISO].instances++; watchesByMonth[ymISO].titles.add(movie.Name);
                        if(wh.rating && wh.rating !== '' && !isNaN(parseFloat(wh.rating))){ watchesByMonth[ymISO].ratingsSum += parseFloat(wh.rating); watchesByMonth[ymISO].ratedCount++; }
                    } catch(e){ console.warn("Error parsing watch date for stats:", wh.date, e); }
                });
            }

            if(movie.Genre){
                const genres = String(movie.Genre).split(',').map(g => String(g).trim()).filter(Boolean);
                genres.forEach(g => {
                    singleGenreCounts[g] = (singleGenreCounts[g] || 0) + 1;
                    if(movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating))){
                        genreRatingsSum[g] = (genreRatingsSum[g] || 0) + parseFloat(movie.overallRating);
                        genreRatedEntriesCount[g] = (genreRatedEntriesCount[g] || 0) + 1;
                    }
                });
                if(genres.length > 1) genreCombinations[genres.sort().join(' + ')] = (genreCombinations[genres.sort().join(' + ')] || 0) + 1;
            }
            if(movie.Country) String(movie.Country).split(',').map(c => String(c).trim()).filter(Boolean).forEach(c => countryCounts[c] = (countryCounts[c] || 0) + 1);
            if(movie.Language) String(movie.Language).split(',').map(l => String(l).trim()).filter(Boolean).forEach(l => languageCounts[l] = (languageCounts[l] || 0) + 1);

            if (movie.Recommendation === 'Highly Recommended') titlesWithHighRec++;
            if (movie.personalRecommendation === 'Watch with Anyone') titlesForAnyone++;

            if (movie.Description && movie.Description.length > 100) detailedDescriptionCount++;
            if (movie['Poster URL']) posterUrlPresentCount++;
            if (Array.isArray(movie.relatedEntries)) manualLinksCount += movie.relatedEntries.length / 2; // Each link involves two entries

            // For "Series Loyalty" (long series) - this is a placeholder. More complex logic needed.
            // Example: if (movie.Category === 'Series' && movie.Status === 'Watched' && (movie.totalEpisodes || 0) > 50) longSeriesCompletedCount++;
        });

        distinctTitlesRewatchedCount = Object.keys(rewatchCountsPerTitle).length;
        maxSingleTitleRewatchCount = Object.values(rewatchCountsPerTitle).reduce((max, count) => Math.max(max, count), 0);

        // Calculate max streaks
        tmdbCollectionStreakCount = Object.values(tmdbCollectionEntries).reduce((max, count) => Math.max(max, count), 0);
        directorStreakCount = Object.values(directorEntries).reduce((max, count) => Math.max(max, count), 0);
        studioStreakCount = Object.values(studioEntries).reduce((max, count) => Math.max(max, count), 0);


        // --- Populate globalStatsData (used by UI and charts) ---
        globalStatsData.totalEntries = currentTotalEntries;
        globalStatsData.totalTitlesWatched = currentTotalTitlesWatchedCount;
        globalStatsData.totalWatchInstances = currentTotalWatchInstances;
        globalStatsData.avgOverallRating = currentRatedEntriesCount > 0 ? (currentSumOverallRatings / currentRatedEntriesCount).toFixed(2) : 'N/A';
        const totalRelevantForProgress = currentTotalEntries - (statuses['Unwatched'] || 0);
        globalStatsData.toWatchCompletion = totalRelevantForProgress > 0 ? ((currentTotalTitlesWatchedCount / totalRelevantForProgress) * 100).toFixed(1) : '0';
        globalStatsData.watchedCountProgress = currentTotalTitlesWatchedCount;
        globalStatsData.totalRelevantCountProgress = totalRelevantForProgress;
        const monthlyActivity = Object.values(watchesByMonth).sort((a, b) => new Date(a.month_year_iso) - new Date(b.month_year_iso));
        const last12Months = monthlyActivity.slice(-12);
        const totalWatchesLast12 = last12Months.reduce((sum, m) => sum + m.instances, 0);
        globalStatsData.avgMonthlyPace = last12Months.length > 0 ? (totalWatchesLast12 / last12Months.length).toFixed(1) : 'N/A';
        if (currentToWatchCount > 0 && globalStatsData.avgMonthlyPace !== 'N/A' && parseFloat(globalStatsData.avgMonthlyPace) > 0) {
            const monthsToComplete = currentToWatchCount / parseFloat(globalStatsData.avgMonthlyPace);
            globalStatsData.estimatedCompletionTime = monthsToComplete < 12 ? `${monthsToComplete.toFixed(1)} months` : `${(monthsToComplete / 12).toFixed(1)} years`;
        } else { globalStatsData.estimatedCompletionTime = 'N/A'; }
        globalStatsData.categories = Object.entries(categories).map(([l, v]) => ({ label:l, value:v })).sort((a,b) => b.value - a.value);
        globalStatsData.statuses = Object.entries(statuses).map(([l, v]) => ({ label:l, value:v })).sort((a,b) => b.value - a.value);
        globalStatsData.topRatedGenresOverall = Object.keys(genreRatingsSum).map(g => ({label: g, value: genreRatedEntriesCount[g] >= 2 ? (genreRatingsSum[g] / genreRatedEntriesCount[g]).toFixed(2) : 'N/A', count: genreRatedEntriesCount[g]})).filter(g => g.value !== 'N/A').sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
        globalStatsData.watchesByYear = Object.keys(watchesByYear).map(y => ({year: y, instances: watchesByYear[y].instances, unique_titles: watchesByYear[y].titles, avg_rating: watchesByYear[y].ratedCount > 0 ? (watchesByYear[y].ratingsSum / watchesByYear[y].ratedCount).toFixed(2) : 'N/A'})).sort((a, b) => parseInt(b.year) - parseInt(a.year));
        globalStatsData.watchesByMonth = Object.values(watchesByMonth).map(m => ({...m, avg_rating: m.ratedCount > 0 ? (m.ratingsSum / m.ratedCount).toFixed(2) : 'N/A'})).sort((a,b) => new Date(b.month_year_iso) - new Date(a.month_year_iso));
        globalStatsData.topSingleGenres = Object.entries(singleGenreCounts).map(([l, v]) => ({ label:l, value:v })).sort((a, b) => b.value - a.value);
        globalStatsData.avgRatingByGenre = Object.keys(genreRatingsSum).map(g => ({label: g, value: genreRatedEntriesCount[g] >= 1 ? (genreRatingsSum[g] / genreRatedEntriesCount[g]).toFixed(2) : 'N/A', count: genreRatedEntriesCount[g]})).filter(g => g.value !== 'N/A').sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
        globalStatsData.genreCombinations = Object.entries(genreCombinations).map(([l,v])=>({label:l, value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
        globalStatsData.overallRatingDistributionData = []; ['5','4','3','2','1','N/A'].forEach(k => { if(overallRatingCounts[k] > 0) globalStatsData.overallRatingDistributionData.push({label: getRatingTextLabel(k), value: overallRatingCounts[k]}); });
        globalStatsData.watchInstanceRatingDistributionData = []; ['5','4','3','2','1','N/A'].forEach(k => { if(watchInstanceRatingCounts[k] > 0) globalStatsData.watchInstanceRatingDistributionData.push({label: getRatingTextLabel(k), value: watchInstanceRatingCounts[k]}); });
        globalStatsData.avgOverallRatingByCategory = Object.entries(avgOverallRatingByCategory).map(([cat, data])=>({label:cat, value: data.count > 0 ? `${(data.sum/data.count).toFixed(2)} avg (${data.count} entries)` : `N/A (0 entries)`})).sort((a,b)=>{ const valA = String(a.value).match(/[\d.]+/); const valB = String(b.value).match(/[\d.]+/); return (valB ? parseFloat(valB[0]) : -1) - (valA ? parseFloat(valA[0]) : -1); });
        globalStatsData.topCountries = Object.entries(watchedCountryCounts).map(([l,v])=>({label:getCountryFullName(l), value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
        globalStatsData.topLanguages = Object.entries(watchedLanguageCounts).map(([l,v])=>({label:l, value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
        globalStatsData.mostWatchedActors = Object.entries(actorWatchCounts).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
        globalStatsData.mostWatchedDirectors = Object.entries(directorWatchCounts).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
        globalStatsData.mostFrequentProductionCompanies = Object.entries(productionCompanyCounts).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value).slice(0,10);
        const studioRatingSums = {}, studioRatedCounts = {};
        movieData.forEach(movie => {
            if (movie.overallRating && movie.overallRating !== '' && !isNaN(parseFloat(movie.overallRating)) && Array.isArray(movie.production_companies)) {
                movie.production_companies.forEach(c => { if(c && c.name){ studioRatingSums[c.name] = (studioRatingSums[c.name]||0) + parseFloat(movie.overallRating); studioRatedCounts[c.name] = (studioRatedCounts[c.name]||0) + 1;}});
            }
        });
        globalStatsData.avgRatingByStudio = Object.keys(studioRatingSums).map(n=>({label:n,value:studioRatedCounts[n]>=2?(studioRatingSums[n]/studioRatedCounts[n]).toFixed(2):'N/A',count:studioRatedCounts[n]})).filter(s=>s.value!=='N/A').sort((a,b)=>parseFloat(b.value)-parseFloat(a.value)).slice(0,10);


        // --- Achievement Specific Stats (to be passed to generateBadgesAndAchievements) ---
        globalStatsData.achievementData = {
            total_entries: currentTotalEntries,
            total_titles_watched: currentTotalTitlesWatchedCount,
            distinct_titles_rewatched: distinctTitlesRewatchedCount,
            single_title_rewatch_max: maxSingleTitleRewatchCount,
            category_watched_counts: {}, // Will be populated: { Movie: X, Series: Y, ... }
            long_series_watched_count: longSeriesCompletedCount, // Placeholder
            genre_watched_counts: watchedGenreCounts,
            genre_variety_count: uniqueGenresWatched.size,
            rated_titles_count: currentActuallyRatedCount,
            specific_rating_counts: overallRatingCounts, // { '5': X, '4': Y, ... }
            recommendation_level_counts: { "Highly Recommended": titlesWithHighRec }, // Add others if needed
            personal_audience_counts: { "Watch with Anyone": titlesForAnyone }, // Add others if needed
            decade_variety_count: uniqueDecadesWatched.size,
            pre_year_watched_counts: { "1980": pre1980WatchedCount },
            recent_years_watched_counts: { "5": recent5YearsWatchedCount },
            status_counts: statuses, // { Watched: X, Continue: Y, ... }
            status_continue_active_count: statusContinueActiveCount,
            country_variety_count: uniqueCountriesWatched.size,
            language_variety_count: uniqueLanguagesWatched.size,
            detailed_description_counts: { "100": detailedDescriptionCount },
            poster_url_present_count: posterUrlPresentCount,
            tmdb_collection_streak_max: tmdbCollectionStreakCount,
            director_streak_max: directorStreakCount,
            studio_streak_max: studioStreakCount,
            manual_links_pairs_count: manualLinksCount,
            hidden_gem_counts: { "1000_7.0": hiddenGemCount },
            all_statuses_present_check: (allStatusesPresent["To Watch"] > 0 && allStatusesPresent["Watched"] > 0 && allStatusesPresent["Continue"] > 0 && allStatusesPresent["Unwatched"] > 0),
            // These need external tracking, so pass placeholder or load from localStorage in generateBadges
            sync_count: parseInt(localStorage.getItem('sync_count_achievement') || '0'),
            stats_modal_opened_count: parseInt(localStorage.getItem('stats_modal_opened_count_achievement') || '0'),
            active_days_count: (JSON.parse(localStorage.getItem('app_usage_dates_achievement') || '[]')).length,
            time_of_day_watch_counts: {
                night: localStorage.getItem('night_owl_achieved') ? 1 : 0,
                early_morning: localStorage.getItem('early_bird_achieved') ? 1 : 0,
            },
            daily_recommendation_watched_count: parseInt(localStorage.getItem('daily_rec_watched_achievement') || '0'),
            // More complex streaks like perfect_week_7 and weekend_warrior_3 need dedicated logic, not simple counts here.
            // They can be calculated within generateBadgesAndAchievements or passed if pre-calculated
        };
        // Populate category_watched_counts for achievementData
        UNIQUE_ALL_GENRES.forEach(genre => {
            if (!globalStatsData.achievementData.genre_watched_counts[genre]) {
                 globalStatsData.achievementData.genre_watched_counts[genre] = 0;
            }
        });
        ['Movie', 'Series', 'Documentary', 'Special'].forEach(cat => {
            globalStatsData.achievementData.category_watched_counts[cat] = movieData.filter(m => m.Category === cat && (m.Status === 'Watched' || m.Status === 'Continue')).length;
        });


        // --- Update UI Elements ---
        $('#statsTotalEntries').text(globalStatsData.totalEntries);
        $('#statsTotalTitlesWatched').text(globalStatsData.totalTitlesWatched);
        $('#statsTotalWatchInstances').text(globalStatsData.totalWatchInstances);
        $('#statsAvgOverallRating').html(`${renderStars(globalStatsData.avgOverallRating)} (${globalStatsData.avgOverallRating})`);
        $('#statsToWatchCompletion').text(globalStatsData.toWatchCompletion + '%');
        $('#toWatchProgressBar').css('width', `${globalStatsData.toWatchCompletion}%`).attr('aria-valuenow', globalStatsData.toWatchCompletion);
        $('#watchedCountProgress').text(globalStatsData.watchedCountProgress);
        $('#totalRelevantCountProgress').text(globalStatsData.totalRelevantCountProgress);
        $('#avgMonthlyPace').text(globalStatsData.avgMonthlyPace !== 'N/A' ? `${globalStatsData.avgMonthlyPace} entries/month` : 'N/A');
        $('#estimatedCompletionTime').text(globalStatsData.estimatedCompletionTime);

        populateList('statsByCategory', globalStatsData.categories);
        populateList('statsByStatus', globalStatsData.statuses);
        populateList('statsTopRatedGenresOverall', globalStatsData.topRatedGenresOverall, ' avg rating', 5);
        populateTable('#statsWatchesByYear tbody', globalStatsData.watchesByYear, [{key:'year', header:'Year'}, {key:'instances', header:'Instances'}, {key:'unique_titles', header:'Unique Titles'}, {key:'avg_rating', header:'Avg. Rating'}]);
        populateTable('#statsWatchesByMonth tbody', globalStatsData.watchesByMonth.slice(0,12), [{key:'month_year_label', header:'Month'}, {key:'instances', header:'Instances'}, {key:'unique_titles', header:'Unique Titles'}, {key:'avg_rating', header:'Avg. Rating'}]);
        populateList('statsTopSingleGenres', globalStatsData.topSingleGenres, ' entries', 10);
        populateList('statsAvgRatingByGenre', globalStatsData.avgRatingByGenre, ' avg rating', 10);
        populateList('statsGenreCombinations', globalStatsData.genreCombinations, ' entries', 10);
        populateList('statsByOverallRating', globalStatsData.overallRatingDistributionData);
        populateList('statsByWatchInstanceRating', globalStatsData.watchInstanceRatingDistributionData);
        populateList('statsAvgOverallRatingByCategory', globalStatsData.avgOverallRatingByCategory);
        populateList('statsAvgRatingByStudio', globalStatsData.avgRatingByStudio, ' avg rating', 10);
        populateList('statsTopCountries', globalStatsData.topCountries, ' entries', 10);
        populateList('statsTopLanguages', globalStatsData.topLanguages, ' entries', 10);
        populateList('statsMostWatchedActors', globalStatsData.mostWatchedActors, ' appearances in watched titles');
        populateList('statsMostWatchedDirectors', globalStatsData.mostWatchedDirectors, ' films watched');
        populateList('statsMostFrequentProductionCompanies', globalStatsData.mostFrequentProductionCompanies, ' entries watched');

        if (typeof generateBadgesAndAchievements === 'function') generateBadgesAndAchievements(globalStatsData.achievementData);

        if (!$('#statsTab .nav-link.active').length || !['charts-tab', 'recommendations-tab'].includes($('#statsTab .nav-link.active').attr('id'))) {
            $('#statsTab a[href="#stats-summary"]').tab('show');
        }
        const activeTabId = $('#statsTab .nav-link.active').attr('id');
        if (activeTabId === 'charts-tab' && typeof renderCharts === 'function') {
            renderCharts(globalStatsData);
        } else if (activeTabId === 'recommendations-tab' && typeof renderRecommendationsContent === 'function') {
            await renderRecommendationsContent();
        }

    } catch (error) {
        console.error("Error calculating statistics:", error);
        showToast("Stats Error", "Failed to calculate statistics.", "error");
    }
}


function generateBadgesAndAchievements(achievementStats) {
    const achievementBadgesContainer = $('#achievementBadges');
    if (!achievementBadgesContainer.length) { console.warn("Achievement badges container not found."); return; }
    achievementBadgesContainer.empty();

    if (!achievementStats || !ACHIEVEMENTS || ACHIEVEMENTS.length === 0) {
        achievementBadgesContainer.html('<p class="text-muted small">No achievements configured or stats unavailable.</p>');
        return;
    }

    let achievedCountForMeta = 0;
    const achievementsToDisplay = [];

    ACHIEVEMENTS.forEach(achievement => {
        let isAchieved = false;
        let progress = 0;
        let total = achievement.threshold;

        // Skip meta achievements in the first pass
        if (achievement.type === 'meta_achievement_count') {
            achievementsToDisplay.push({ ...achievement, progress: 0, isAchieved: false }); // Add for later processing
            return;
        }

        switch (achievement.type) {
            case 'total_entries': progress = achievementStats.total_entries || 0; break;
            case 'total_titles_watched': progress = achievementStats.total_titles_watched || 0; break;
            case 'distinct_titles_rewatched': progress = achievementStats.distinct_titles_rewatched || 0; break;
            case 'single_title_rewatch_count': progress = achievementStats.single_title_rewatch_max || 0; break;
            case 'category_watched_count': progress = (achievementStats.category_watched_counts && achievementStats.category_watched_counts[achievement.category]) || 0; break;
            case 'long_series_watched_count': progress = achievementStats.long_series_watched_count || 0; break; // Needs complex calc
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
            case 'active_days_count': progress = achievementStats.active_days_count || 0; break; // Tracked via localStorage
            case 'weekend_watch_streak': progress = 0; break; // Needs complex calc
            case 'country_variety_count': progress = achievementStats.country_variety_count || 0; break;
            case 'language_variety_count': progress = achievementStats.language_variety_count || 0; break;
            case 'sync_count': progress = achievementStats.sync_count || 0; break; // Tracked via localStorage
            case 'stats_modal_opened_count': progress = achievementStats.stats_modal_opened_count || 0; break; // Tracked via localStorage
            case 'time_of_day_watch': progress = (achievementStats.time_of_day_watch_counts && achievementStats.time_of_day_watch_counts[achievement.period]) || 0; break; // Tracked via localStorage
            case 'detailed_description_count': progress = (achievementStats.detailed_description_counts && achievementStats.detailed_description_counts[achievement.minLength.toString()]) || 0; break;
            case 'poster_url_present_count': progress = achievementStats.poster_url_present_count || 0; break;
            case 'tmdb_collection_streak_count': progress = achievementStats.tmdb_collection_streak_max || 0; break; // Max from one collection
            case 'tmdb_collection_completed_count': progress = 0; break; // Needs complex calc
            case 'director_streak_count': progress = achievementStats.director_streak_max || 0; break; // Max from one director
            case 'studio_streak_count': progress = achievementStats.studio_streak_max || 0; break; // Max from one studio
            case 'manual_links_count': progress = achievementStats.manual_links_pairs_count || 0; break;
            case 'genre_streak_short_term': progress = 0; break; // Needs complex calc
            case 'hidden_gem_count': progress = (achievementStats.hidden_gem_counts && achievementStats.hidden_gem_counts[`${achievement.tmdbVotesMax}_${achievement.tmdbRatingMin}`]) || 0; break;
            case 'daily_recommendation_watched_count': progress = achievementStats.daily_recommendation_watched_count || 0; break; // Tracked via localStorage
            case 'consecutive_daily_watch_streak': progress = 0; break; // Needs complex calc
            case 'all_statuses_present': progress = achievementStats.all_statuses_present_check ? 1 : 0; total = 1; break;
            default: console.warn("Unknown achievement type for calculation:", achievement.type, achievement.id); break;
        }
        isAchieved = progress >= achievement.threshold;
        if(isAchieved) achievedCountForMeta++;

        achievementsToDisplay.push({ ...achievement, progress, isAchieved });
    });

    // Second pass for meta achievements
    achievementsToDisplay.forEach(ach => {
        if (ach.type === 'meta_achievement_count') {
            ach.progress = achievedCountForMeta;
            ach.isAchieved = ach.progress >= ach.threshold;
        }
    });

    // Sort: achieved first, then by progress percentage descending, then alphabetically
    achievementsToDisplay.sort((a,b) => {
        if (a.isAchieved !== b.isAchieved) return a.isAchieved ? -1 : 1;
        const progressA = a.progress / (a.threshold || 1);
        const progressB = b.progress / (b.threshold || 1);
        if (progressB !== progressA) return progressB - progressA;
        return a.name.localeCompare(b.name);
    });


    achievementsToDisplay.forEach(achievement => {
        const badgeHtml = `
            <div class="achievement-badge ${achievement.isAchieved ? 'achieved' : 'locked'} m-2 p-2 rounded text-center" 
                 title="${achievement.isAchieved ? achievement.name : `${achievement.name} (${achievement.progress}/${achievement.threshold})`}"
                 data-description="${achievement.description}"
                 data-name="${achievement.name}"
                 data-progress="${achievement.progress}"
                 data-threshold="${achievement.threshold}"
                 data-achieved="${achievement.isAchieved}">
                <i class="${achievement.icon} fa-2x mb-1 ${achievement.isAchieved ? 'text-warning' : 'text-muted'}"></i><br>
                <span class="d-block small font-weight-bold">${achievement.name}</span>
                <small class="d-block text-muted">${achievement.isAchieved ? 'Achieved!' : `${achievement.progress} / ${achievement.threshold}`}</small>
            </div>`;
        achievementBadgesContainer.append(badgeHtml);
    });

    if(achievementsToDisplay.length === 0) {
        achievementBadgesContainer.html('<p class="text-muted small">No achievements to display.</p>');
    }

    // Add click listener for showing description toast
    achievementBadgesContainer.off('click', '.achievement-badge').on('click', '.achievement-badge', function() {
        const name = $(this).data('name');
        const description = $(this).data('description');
        const progress = $(this).data('progress');
        const threshold = $(this).data('threshold');
        const achieved = $(this).data('achieved') === true || $(this).data('achieved') === "true"; // Ensure boolean comparison

        let toastMessage = description;
        if (!achieved) {
            toastMessage += ` (Progress: ${progress}/${threshold})`;
        }
        showToast(name, toastMessage, achieved ? 'success' : 'info', 5000);
    });
}


async function exportStatsAsPdf() {
    const statsModalContent = document.querySelector('#statsModal .modal-content');
    if (!statsModalContent) {
        showToast("Export Error", "Stats modal content not found.", "error");
        if(typeof hideLoading === 'function') hideLoading();
        return;
    }
    showToast("Exporting PDF", "Preparing PDF... this might take a moment.", "info", 5000);

    try {
        const activeTabHref = $('#statsTab .nav-link.active').attr('href');
        $('#statsTabContent .tab-pane').addClass('show active');

        if (typeof renderCharts === 'function' && globalStatsData) {
            renderCharts(globalStatsData);
        }
        await new Promise(resolve => setTimeout(resolve, 1500));

        $(statsModalContent).find('.modal-header .close, .modal-footer button, .nav-tabs, #refreshRecommendationsBtnStats, .skip-daily-rec, .mark-completed-daily-rec, .btn-why-this').hide();

        const originalWidth = statsModalContent.style.width;
        statsModalContent.style.width = '1100px';

        const canvas = await html2canvas(statsModalContent, { scale: 1.5, useCORS: true, logging: false, windowWidth: statsModalContent.scrollWidth, windowHeight: statsModalContent.scrollHeight });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;

        const orientation = canvas.width > canvas.height ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;

        let imgWidthPDF, imgHeightPDF;
        if ((pdfWidth / canvasAspectRatio) <= pdfHeight) {
            imgWidthPDF = pdfWidth; imgHeightPDF = pdfWidth / canvasAspectRatio;
        } else {
            imgHeightPDF = pdfHeight; imgWidthPDF = pdfHeight * canvasAspectRatio;
        }

        const xOffset = (pdfWidth - imgWidthPDF) / 2;
        const yOffset = (pdfHeight - imgHeightPDF) / 2;

        pdf.addImage(imgData, 'PNG', xOffset > 0 ? xOffset : 0, yOffset > 0 ? yOffset : 0, imgWidthPDF, imgHeightPDF);
        pdf.save('KeepMovieZ_Stats_Report.pdf');
        showToast("PDF Exported", "Your stats report has been downloaded.", "success");

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast("PDF Export Error", `Failed to create PDF: ${error.message}. Check console for details.`, "error", 7000);
    } finally {
        statsModalContent.style.width = originalWidth;
        const activeTabHrefOriginal = $('#statsTab .nav-link.active').attr('href'); // This might be undefined if tab was changed
        $('#statsTabContent .tab-pane').removeClass('show active');
        if (activeTabHrefOriginal && $(`#statsTabContent ${activeTabHrefOriginal}`).length) {
            $(`#statsTabContent ${activeTabHrefOriginal}`).addClass('show active');
        } else if (activeTabHref && $(`#statsTabContent ${activeTabHref}`).length) { // Fallback to the one captured before manipulation
            $(`#statsTabContent ${activeTabHref}`).addClass('show active');
        }
        else {
             $('#statsTabContent .tab-pane:first-child').addClass('show active');
        }
        $(statsModalContent).find('.modal-header .close, .modal-footer button, .nav-tabs, #refreshRecommendationsBtnStats, .skip-daily-rec, .mark-completed-daily-rec, .btn-why-this').show();
    }
}

let lastShownPersonalizedSuggestionId = null;

async function generatePersonalizedRecommendations(sourceMovieId = null) {
    const recommendationsListEl = document.getElementById('recommendationsList');
    const recommendationsListTitleEl = document.getElementById('recommendationsListTitle');

    if (!recommendationsListEl || !recommendationsListTitleEl) {
        console.warn("Personalized recommendations UI elements not found.");
        if(recommendationsListEl) recommendationsListEl.innerHTML = '<p class="text-danger p-3">Error: UI elements for recommendations are missing.</p>';
        return;
    }

    recommendationsListEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Analyzing your preferences...</p>';
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        let baseEntries = [];
        const exclusionIds = new Set();
        if (!sourceMovieId && lastShownPersonalizedSuggestionId) {
            exclusionIds.add(lastShownPersonalizedSuggestionId);
        }


        if (sourceMovieId) {
            const sourceMovie = movieData.find(m => m && m.id === sourceMovieId);
            if (!sourceMovie || !sourceMovie.tmdbId) {
                recommendationsListEl.innerHTML = '<p class="text-center text-muted p-3">Source movie details not found or TMDB data missing for "More Like This" feature.</p>';
                recommendationsListTitleEl.textContent = 'More Like This';
                return;
            }
            baseEntries = [sourceMovie];
            exclusionIds.add(sourceMovie.id);
            recommendationsListTitleEl.textContent = `More Like "${sourceMovie.Name}"`;
        } else {
            baseEntries = movieData.filter(movie =>
                movie && (movie.Status === 'Watched' || movie.Status === 'Continue') &&
                (parseFloat(movie.overallRating) >= 4) && movie.tmdbId
            );
            movieData.forEach(m => { if (m && (m.Status === 'Watched' || m.Status === 'Continue')) exclusionIds.add(m.id); });
            recommendationsListTitleEl.textContent = `Personalized Suggestion`;
        }

        if (baseEntries.length === 0 && !sourceMovieId) {
            recommendationsListEl.innerHTML = '<p class="text-center text-muted p-3">Rate at least one movie 4+ stars (with TMDB info) to get personalized suggestions, or use "Find Similar" from a movie\'s details page.</p>';
            return;
        }

        const baseProfile = { genres: new Set(), keywords: new Set(), actors: new Map(), directors: new Map(), companies: new Map() };
        baseEntries.forEach(movie => {
            if(movie.Genre) String(movie.Genre).toLowerCase().split(',').map(g => g.trim()).filter(Boolean).forEach(g => baseProfile.genres.add(g));
            if(Array.isArray(movie.keywords)) movie.keywords.forEach(kw => { if(kw && kw.id) baseProfile.keywords.add(kw.id);});
            if(Array.isArray(movie.full_cast)) movie.full_cast.slice(0,5).forEach(p => { if(p && p.id) baseProfile.actors.set(p.id, (baseProfile.actors.get(p.id) || 0) + 1);});
            if(movie.director_info && movie.director_info.id) baseProfile.directors.set(movie.director_info.id, (baseProfile.directors.get(movie.director_info.id) || 0) + 1);
            if(Array.isArray(movie.production_companies)) movie.production_companies.slice(0,3).forEach(c => { if(c && c.id) baseProfile.companies.set(c.id, (baseProfile.companies.get(c.id) || 0) + 1);});
        });

        const toWatchCandidates = movieData.filter(movie =>
            movie && movie.Status === 'To Watch' && movie.tmdbId && movie.Name && !exclusionIds.has(movie.id)
        );

        if (toWatchCandidates.length === 0) {
            let message = 'No suitable "To Watch" entries found for suggestions. Add more movies with TMDB info!';
            if (!sourceMovieId && lastShownPersonalizedSuggestionId) {
                 message = 'Tried to find a new suggestion, but no other suitable "To Watch" entries found. Add more movies!';
                 const lastSuggestion = movieData.find(m => m.id === lastShownPersonalizedSuggestionId);
                 if (lastSuggestion) {
                    recommendationsListEl.innerHTML = '';
                    renderPersonalizedRecommendationItem({movie: lastSuggestion, score: 0, whyThis: ["Previously suggested"]}, recommendationsListEl);
                    return;
                 }
            }
            recommendationsListEl.innerHTML = `<p class="text-center text-muted p-3">${message}</p>`;
            return;
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

            if (score > 1.5) {
                scoredRecommendations.push({ movie: candidate, score, whyThis: [...new Set(whyThis)].slice(0,3) });
            }
        });

        scoredRecommendations.sort((a, b) => b.score - a.score);
        recommendationsListEl.innerHTML = '';

        if (scoredRecommendations.length === 0) {
            recommendationsListEl.innerHTML = '<p class="text-center text-muted p-3">Couldn\'t find strong matches in your "To Watch" list. Try rating more movies or fetching TMDB details for existing ones!</p>';
            lastShownPersonalizedSuggestionId = null;
            return;
        }

        const topRecommendation = scoredRecommendations[0];
        renderPersonalizedRecommendationItem(topRecommendation, recommendationsListEl);
        if (!sourceMovieId) {
            lastShownPersonalizedSuggestionId = topRecommendation.movie.id;
        }


    } catch (error) {
        console.error("Error generating personalized recommendations:", error);
        recommendationsListEl.innerHTML = '<p class="text-danger p-3">An error occurred while generating suggestions. Please try again.</p>';
        lastShownPersonalizedSuggestionId = null;
    }
}

function renderPersonalizedRecommendationItem(rec, parentElement) {
    const movie = rec.movie;
    const recItem = document.createElement('div');
    recItem.className = 'recommendation-item list-group-item p-3 mb-2 shadow-sm rounded';
    const whyThisText = rec.whyThis && rec.whyThis.length > 0 ? rec.whyThis.join('; ') : 'Matches your taste profile.';
    recItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${movie.Name} <small class="text-muted">(${movie.Year || 'N/A'})</small></h5>
            ${rec.score > 0 ? `<small class="text-success font-weight-bold" title="Relevance Score">Score: ${rec.score.toFixed(1)}</small>` : ''}
        </div>
        <p class="mb-1 text-muted small"><strong>Category:</strong> ${movie.Category || 'N/A'} | <strong>Genre:</strong> ${movie.Genre || 'N/A'}</p>
        <p class="mb-2 text-muted small">${(movie.Description || 'No description available.').substring(0, 120)}${movie.Description && movie.Description.length > 120 ? '...' : ''}</p>
        <div class="d-flex justify-content-between align-items-center mt-2">
            <button class="btn btn-sm btn-outline-secondary btn-why-this" data-toggle="tooltip" data-html="true" data-placement="top" title="${whyThisText.replace(/"/g, '"').replace(/\n/g, '<br>')}"><i class="fas fa-question-circle"></i> Why This?</button>
            <div>
                <button class="btn btn-sm btn-info view-btn mr-2" data-movie-id="${movie.id}" title="View Details"><i class="fas fa-eye"></i> View</button>
            </div>
        </div>
    `;
    recItem.querySelector('.view-btn').addEventListener('click', function() {
        $('#statsModal').modal('hide');
        $('#statsModal').one('hidden.bs.modal', () => openDetailsModal(this.dataset.movieId));
    });
    $(recItem).find('.btn-why-this').tooltip();
    parentElement.appendChild(recItem);
}

async function refreshPersonalizedRecommendations() {
    const recommendationsListEl = document.getElementById('recommendationsList');
    if (recommendationsListEl) {
        recommendationsListEl.innerHTML = '<p class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Refreshing suggestion...</p>';
    }
    await generatePersonalizedRecommendations();
}

function getDailyRecommendationMovie() {
    const today = new Date().toISOString().slice(0, 10);
    const lastRecDate = localStorage.getItem(DAILY_RECOMMENDATION_DATE_KEY);
    let dailyRecId = localStorage.getItem(DAILY_RECOMMENDATION_ID_KEY);
    let dailyRecSkipCount = parseInt(localStorage.getItem(DAILY_REC_SKIP_COUNT_KEY) || '0');

    if (lastRecDate !== today) {
        dailyRecId = null; dailyRecSkipCount = 0;
        localStorage.setItem(DAILY_RECOMMENDATION_DATE_KEY, today);
        localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, '0');
        localStorage.removeItem(DO_NOT_SHOW_AGAIN_KEYS.DAILY_RECOMMENDATION_INTRO + '_shown_today');
    }

    if (dailyRecSkipCount >= MAX_DAILY_SKIPS) {
        return { message: `You've used all ${MAX_DAILY_SKIPS} daily pick skips for today. Check back tomorrow!`, movie: null, dailyRecSkipCount };
    }

    let movie = dailyRecId ? movieData.find(m => m && m.id === dailyRecId && m.Status === 'To Watch' && !(m.doNotRecommendDaily && new Date(m.lastModifiedDate || 0).toISOString().slice(0,10) === today) ) : null;

    if (!movie) {
        const eligibleMovies = movieData.filter(m =>
            m && (m.Category === 'Movie' || m.Category === 'Documentary' || m.Category === 'Series') &&
            m.Status === 'To Watch' &&
            (!Array.isArray(m.watchHistory) || m.watchHistory.length === 0) &&
            !(m.doNotRecommendDaily && new Date(m.lastModifiedDate || 0).toISOString().slice(0,10) === today) &&
            (m.tmdb_vote_average === null || m.tmdb_vote_average >= 5.5 || (m.tmdb_vote_count || 0) < 50)
        );

        if (eligibleMovies.length === 0) {
            return { message: 'No suitable "To Watch" entries found for a daily pick. Add more, or check back after watching some!', movie: null, dailyRecSkipCount };
        }
        movie = eligibleMovies[Math.floor(Math.random() * eligibleMovies.length)];
        dailyRecId = movie.id;
        localStorage.setItem(DAILY_RECOMMENDATION_ID_KEY, dailyRecId);
    }

    const introKey = DO_NOT_SHOW_AGAIN_KEYS.DAILY_RECOMMENDATION_INTRO;
    const introShownTodayKey = introKey + '_shown_today';
    if(lastRecDate !== today && !localStorage.getItem(introKey) && !localStorage.getItem(introShownTodayKey)) {
        showToast("Your Daily Pick!", "Check out today's movie recommendation in the Stats & Insights > Suggestions tab. You can skip it a few times or mark it watched!", "info", 7000, introKey);
        localStorage.setItem(introShownTodayKey, 'true');
    }
    return { message: null, movie, dailyRecSkipCount };
}

async function renderRecommendationsContent() {
    const dailyRecommendationSectionEl = document.getElementById('dailyRecommendationSection');
    const recommendationsListEl = document.getElementById('recommendationsList');
    const recommendationsListTitleEl = document.getElementById('recommendationsListTitle');
    const refreshPersonalizedBtnEl = document.getElementById('refreshRecommendationsBtnStats');

    if (!dailyRecommendationSectionEl) { console.warn("Daily recommendation section element not found."); }
    if (!recommendationsListEl || !recommendationsListTitleEl) {
        console.warn("Personalized recommendations list or title element not found.");
    }

    if (dailyRecommendationSectionEl) {
        dailyRecommendationSectionEl.innerHTML = '';
        const { message: dailyRecMsg, movie: dailyRecMovie, dailyRecSkipCount } = getDailyRecommendationMovie();

        if (dailyRecMovie) {
            dailyRecommendationSectionEl.innerHTML = `
                <h5 class="mt-3">Your Daily Pick! <small class="text-muted">(Skips left: ${MAX_DAILY_SKIPS - dailyRecSkipCount})</small></h5>
                <div class="recommendation-item daily-pick list-group-item p-3 shadow-sm rounded">
                    <div class="d-flex w-100 justify-content-between">
                         <h5 class="mb-1">${dailyRecMovie.Name} <small class="text-muted">(${dailyRecMovie.Year || 'N/A'})</small></h5>
                         ${dailyRecMovie.tmdb_vote_average ? `<small class="text-info" title="TMDB Rating">TMDB: ${dailyRecMovie.tmdb_vote_average.toFixed(1)} <i class="fas fa-star text-warning"></i></small>` : ''}
                    </div>
                    <p class="mb-1 text-muted small"><strong>Category:</strong> ${dailyRecMovie.Category || 'N/A'} | <strong>Genre:</strong> ${dailyRecMovie.Genre || 'N/A'}</p>
                    <p class="mb-2 text-muted small">${(dailyRecMovie.Description || 'No description available.').substring(0, 120)}${dailyRecMovie.Description && dailyRecMovie.Description.length > 120 ? '...' : ''}</p>
                    <div class="text-right mt-2">
                        <button class="btn btn-sm btn-warning skip-daily-rec mr-2" data-movie-id="${dailyRecMovie.id}" title="Skip this pick for today"><i class="fas fa-forward"></i> Skip</button>
                        <button class="btn btn-sm btn-info view-btn mr-2" data-movie-id="${dailyRecMovie.id}" title="View Details"><i class="fas fa-eye"></i> View</button>
                        <button class="btn btn-sm btn-success mark-completed-daily-rec" data-movie-id="${dailyRecMovie.id}" title="Mark as Watched"><i class="fas fa-check-circle"></i> Watched It!</button>
                    </div>
                </div>`;
            dailyRecommendationSectionEl.querySelector('.view-btn').addEventListener('click', function() { $('#statsModal').modal('hide'); $('#statsModal').one('hidden.bs.modal', () => openDetailsModal(this.dataset.movieId)); });
            dailyRecommendationSectionEl.querySelector('.mark-completed-daily-rec').addEventListener('click', markDailyRecCompleted);
            dailyRecommendationSectionEl.querySelector('.skip-daily-rec').addEventListener('click', markDailyRecSkipped);
        } else {
            dailyRecommendationSectionEl.innerHTML = `<h5 class="mt-3">Daily Pick</h5><p class="text-center text-muted p-3">${dailyRecMsg}</p>`;
        }
    }

    if (refreshPersonalizedBtnEl) {
        refreshPersonalizedBtnEl.removeEventListener('click', refreshPersonalizedRecommendations);
        refreshPersonalizedBtnEl.addEventListener('click', refreshPersonalizedRecommendations);
    }

    await generatePersonalizedRecommendations();
}

async function markDailyRecCompleted(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const movieId = button.dataset.movieId;
    if (!movieId) return;

    showLoading("Marking daily pick as watched...");
    try {
        const movieIndex = movieData.findIndex(m => m && m.id === movieId);
        if (movieIndex === -1) { showToast("Error", "Daily pick movie not found.", "error"); return; }

        const movie = movieData[movieIndex];
        movie.Status = 'Watched';
        const today = new Date().toISOString().slice(0, 10);
        const newWatchInstance = { watchId: generateUUID(), date: today, rating: movie.overallRating || '3', notes: 'Completed from Daily Pick' };
        if (!Array.isArray(movie.watchHistory)) movie.watchHistory = [];
        movie.watchHistory.push(newWatchInstance);
        if (!movie.overallRating || movie.overallRating === '') movie.overallRating = '3';
        movie.lastModifiedDate = new Date().toISOString();
        movie.doNotRecommendDaily = true; // Mark specifically for daily rec system

        localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, MAX_DAILY_SKIPS.toString()); // Used up daily pick
        localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY); // Clear current daily pick
        
        // Track for 'Daily Devotee' achievement
        let dailyRecWatchedCount = parseInt(localStorage.getItem('daily_rec_watched_achievement') || '0');
        localStorage.setItem('daily_rec_watched_achievement', (dailyRecWatchedCount + 1).toString());


        if (typeof recalculateAndApplyAllRelationships === 'function') recalculateAndApplyAllRelationships();
        if (currentSortColumn && typeof sortMovies === 'function') sortMovies(currentSortColumn, currentSortDirection);
        if (typeof renderTable === 'function') renderTable();
        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        showToast("Daily Pick Watched!", `"${movie.Name}" marked as watched. No more daily picks today.`, "success", 4000);

        if (currentSupabaseUser && typeof comprehensiveSync === 'function') await comprehensiveSync(true);
        if (typeof renderRecommendationsContent === 'function') await renderRecommendationsContent();
    } catch (error) {
        console.error("Error marking daily rec completed:", error);
        showToast("Update Error", "Could not update daily pick.", "error");
    } finally {
        hideLoading();
    }
}

async function markDailyRecSkipped(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const movieId = button.dataset.movieId;
    if (!movieId) return;

    showLoading("Skipping daily pick...");
    try {
        const movieIndex = movieData.findIndex(m => m && m.id === movieId);
        if (movieIndex === -1) { showToast("Error", "Daily pick movie not found to skip.", "error"); return; }

        const movie = movieData[movieIndex];
        movie.lastModifiedDate = new Date().toISOString();
        movie.doNotRecommendDaily = true; // Mark it so it's not picked again today by the randomizer if other skips remain

        let dailyRecSkipCount = parseInt(localStorage.getItem(DAILY_REC_SKIP_COUNT_KEY) || '0');
        dailyRecSkipCount++;
        localStorage.setItem(DAILY_REC_SKIP_COUNT_KEY, dailyRecSkipCount.toString());
        localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY); // Force a new pick next time getDaily is called (if skips remain)

        if (typeof saveToIndexedDB === 'function') await saveToIndexedDB();
        showToast("Daily Pick Skipped", `"${movie.Name}" skipped. You have ${MAX_DAILY_SKIPS - dailyRecSkipCount} skips left today.`, "info", 2000);

        if (currentSupabaseUser && typeof comprehensiveSync === 'function') await comprehensiveSync(true);
        if (typeof renderRecommendationsContent === 'function') await renderRecommendationsContent();
    } catch (error) {
        console.error("Error skipping daily rec:", error);
        showToast("Update Error", "Could not skip daily pick.", "error");
    } finally {
        hideLoading();
    }
}