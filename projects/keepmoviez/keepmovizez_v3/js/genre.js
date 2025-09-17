/* genre.js */
/**
 * Renders the selected genres as interactive tags in the input container.
 */
function renderGenreTags() {
    const genreInputContainer = document.getElementById('genreInputContainer');
    if (!genreInputContainer) {
        console.warn("Genre input container 'genreInputContainer' not found.");
        return;
    }
    const searchInput = genreInputContainer.querySelector('#genreSearchInput'); // Must exist

    // Clear existing tags (all children except the search input)
    Array.from(genreInputContainer.children).forEach(child => {
        if (child !== searchInput) { // Compare element references
            genreInputContainer.removeChild(child);
        }
    });

    if (!Array.isArray(selectedGenres)) selectedGenres = []; // Ensure selectedGenres is an array

    selectedGenres.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag badge badge-info mr-1 mb-1 p-2'; // Using Bootstrap badge for styling
        tag.textContent = genre;
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'close ml-2 text-white'; // Bootstrap close button, adjusted margin
        closeBtn.innerHTML = '<span aria-hidden="true">×</span>'; // More accessible span
        closeBtn.setAttribute('aria-label', `Remove genre ${genre}`);
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeGenre(genre);
        });
        tag.appendChild(closeBtn);
        // Insert tag before search input if searchInput exists, otherwise append
        if (searchInput) {
            genreInputContainer.insertBefore(tag, searchInput);
        } else {
            genreInputContainer.appendChild(tag);
        }
    });
     // If no genres selected and search input exists, ensure search input is visible or placeholder text is there
    if (searchInput) {
        searchInput.placeholder = selectedGenres.length === 0 ? "Click to add genres..." : "Search or add more...";
    }
}


/**
 * Adds a genre to the selected genres list and re-renders the tags.
 */
function addGenre(genre) {
    if (!Array.isArray(selectedGenres)) selectedGenres = [];
    if (genre && typeof genre === 'string' && !selectedGenres.includes(genre)) {
        selectedGenres.push(genre);
        selectedGenres.sort();
        renderGenreTags();
    }
}

/**
 * Removes a genre from the selected genres list and re-renders the tags.
 */
function removeGenre(genre) {
    if (!Array.isArray(selectedGenres)) selectedGenres = [];
    selectedGenres = selectedGenres.filter(g => g !== genre);
    renderGenreTags();

    const genreDropdownEl = document.getElementById('genreDropdown');
    if (genreDropdownEl && genreDropdownEl.style.display === 'block') { // Check if dropdown is visible
        filterGenreDropdown(); // Refresh dropdown
    }
}

/**
 * Populates or re-populates the genre dropdown based on a filter text.
 */
function populateGenreDropdown(filterText = "") {
    const genreItemsContainer = document.getElementById('genreItemsContainer');
    if (!genreItemsContainer) {
        console.warn("Genre items container 'genreItemsContainer' not found for dropdown.");
        return;
    }
    genreItemsContainer.innerHTML = '';

    const lowerFilterText = String(filterText || "").toLowerCase().trim();
    const availableGenres = UNIQUE_ALL_GENRES.filter(genre => // Use UNIQUE_ALL_GENRES
        !selectedGenres.includes(genre) &&
        (lowerFilterText === "" || String(genre).toLowerCase().includes(lowerFilterText))
    ).sort();

    if (availableGenres.length === 0) {
        const item = document.createElement('span'); // Use span for non-actionable item
        item.className = 'list-group-item text-muted small';
        if (lowerFilterText !== "" && !UNIQUE_ALL_GENRES.some(g => String(g).toLowerCase().includes(lowerFilterText))) {
            item.textContent = 'No matching genres found.';
        } else if (lowerFilterText !== "" && UNIQUE_ALL_GENRES.filter(g => !selectedGenres.includes(g)).length === 0) {
             item.textContent = 'All matching genres already selected.';
        }
        else {
             item.textContent = 'All available genres are selected or no genres defined.';
        }
        genreItemsContainer.appendChild(item);
    } else {
        availableGenres.forEach(genre => {
            const item = document.createElement('a');
            item.href = '#'; // Necessary for link behavior but action prevented
            item.className = 'list-group-item list-group-item-action dropdown-item py-1'; // Slimmer items
            item.textContent = genre;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addGenre(genre);
                const searchInputEl = document.getElementById('genreSearchInput');
                if (searchInputEl) {
                    searchInputEl.value = ''; // Clear search
                    searchInputEl.focus(); // Keep focus for easy adding of more genres
                }
                filterGenreDropdown(); // Refresh available genres in dropdown
            });
            genreItemsContainer.appendChild(item);
        });
    }
}


/**
 * Triggers a filter and re-population of the genre dropdown.
 */
function filterGenreDropdown() {
    const searchInputEl = document.getElementById('genreSearchInput');
    if (searchInputEl) {
        populateGenreDropdown(searchInputEl.value);
    } else {
        populateGenreDropdown(); // Populate with no filter if input is missing
    }
}
