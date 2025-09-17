
/* utils.js */
function showLoading(message = "Loading...") {
    if (!loadingOverlay) loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        console.warn("Loading overlay element not found. Cannot show loading indicator.");
        return;
    }
    loadingOverlay.classList.remove('hidden');
    const loadingTextElement = loadingOverlay.querySelector('p');
    if (loadingTextElement) {
        loadingTextElement.textContent = message;
    } else {
        console.warn("Loading text element within overlay not found.");
    }
}

function hideLoading() {
    if (!loadingOverlay) loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function resetInactivityTimer() {
    if (currentSupabaseUser && !isAppLocked) { // Check currentSupabaseUser from auth.js (or make it global here)
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log("Inactivity timeout. Locking app.");
            if (typeof lockApp === 'function') { // lockApp will be in fifth.js or sixth.js
                 lockApp("Session timed out due to inactivity. Please log in again.");
            } else {
                console.error("lockApp function not found. Cannot lock app on inactivity.");
            }
        }, INACTIVITY_TIMEOUT_MS);
    }
}

function initializeTableScrolling() {
    const tableResponsiveDiv = document.querySelector('.table-responsive');

    if (tableResponsiveDiv) {
        tableResponsiveDiv.addEventListener('keydown', function(e) {
            if (e.target !== tableResponsiveDiv && e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault(); this.scrollLeft -= 100;
            } else if (e.key === 'ArrowRight') {
                e.preventDefault(); this.scrollLeft += 100;
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });

        let isMouseDownForScroll = false;
        let startX, scrollLeftStart;
        // let hasDragged = false; // Commented out as not strictly used for functionality

        tableResponsiveDiv.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target.closest('button, a, input, select, textarea, .btn-action, .watch-later-btn')) {
                isMouseDownForScroll = false; return;
            }
            if (isMultiSelectMode) { // isMultiSelectMode is global
                isMouseDownForScroll = false; return;
            }
            isMouseDownForScroll = true;
            // hasDragged = false; // Commented out
            tableResponsiveDiv.classList.add('active-drag-scroll');
            startX = e.pageX - tableResponsiveDiv.offsetLeft;
            scrollLeftStart = tableResponsiveDiv.scrollLeft;
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });

        const endDragScroll = () => {
            if (isMouseDownForScroll) {
                isMouseDownForScroll = false;
                tableResponsiveDiv.classList.remove('active-drag-scroll');
            }
        };

        tableResponsiveDiv.addEventListener('mouseleave', endDragScroll);
        tableResponsiveDiv.addEventListener('mouseup', () => {
            endDragScroll();
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
        tableResponsiveDiv.addEventListener('mousemove', (e) => {
            if (!isMouseDownForScroll) return;
            e.preventDefault();
            const x = e.pageX - tableResponsiveDiv.offsetLeft;
            const walk = (x - startX) * 1.5; // Adjust multiplier for scroll speed
            tableResponsiveDiv.scrollLeft = scrollLeftStart - walk;
            // if (Math.abs(walk) > 5) hasDragged = true; // Commented out
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    } else {
        console.warn("'.table-responsive' element not found for scroll enhancements.");
    }
}

function getCountryFullName(code) {
    if (!code || typeof code !== 'string') return code || 'N/A';
    const upperCode = code.toUpperCase().trim();
    if (countryCodeToNameMap[upperCode]) return countryCodeToNameMap[upperCode];
    for (const [mapCode, mapName] of Object.entries(countryCodeToNameMap)) {
        if (mapName.toUpperCase() === upperCode) return mapName;
    }
    return code.trim();
}

function showToast(title, message, type = 'info', delayMs, doNotShowAgainKey = null) {
    if (doNotShowAgainKey && localStorage.getItem(doNotShowAgainKey) === 'true') return;

    if (type === 'error' && (Math.random() * PRANK_ERROR_CHANCE < 1)) {
        const prankMessages = [
            "Oops! Looks like the hamsters powering the server took a coffee break.",
            "Error 404: Motivation not found. Just kidding, something broke.",
            "My apologies! A pixel decided to rebel. Try again!",
            "Uh oh! My circuits are feeling a bit shy right now. Give it another go.",
            "The digital gremlins are at it again. We're on it!",
            "Whoops! I spilled some virtual coffee. Fixing it now!"
        ];
        message = prankMessages[Math.floor(Math.random() * prankMessages.length)];
        title = "Unexpected Hiccup!";
    }

    if (typeof $ === 'undefined' || typeof $.fn.toast === 'undefined') {
        console.warn("jQuery or Bootstrap Toast component not found. Toast cannot be shown. Message:", title, message);
        alert(`${title}: ${message}`); // Fallback
        return;
    }

    const toastElement = $('#appToast');
    if (!toastElement.length) { console.warn("Toast element #appToast not found"); return; }

    if (delayMs === undefined) { // Default delays
        switch (type) {
            case 'success': delayMs = 3000; break;
            case 'error': delayMs = 6000; break;
            case 'warning': delayMs = 4500; break;
            case 'info': default: delayMs = 3500; break;
        }
    }

    toastElement.find('#toastTitle').text(title || 'Notification');
    // MODIFIED: Use .html() to allow formatted messages (e.g., with <br>)
    toastElement.find('#toastBody').html(message || '');

    const toastHeader = toastElement.find('.toast-header');
    // Clear existing Bootstrap background/text color classes
    toastHeader.removeClass ( (index, className) => (className.match (/(^|\s)bg-\S+/g) || []).join(' ') );
    toastHeader.removeClass('text-white text-dark'); // Ensure text color classes are also removed

    let headerBgClass = 'bg-primary'; // Default Bootstrap primary
    let headerTextColorClass = 'text-white'; // Default text for primary

    switch (type) {
        case 'success': headerBgClass = 'bg-success'; break; // text-white is fine
        case 'error': headerBgClass = 'bg-danger'; break;   // text-white is fine
        case 'warning': headerBgClass = 'bg-warning'; headerTextColorClass = 'text-dark'; break; // Bootstrap warning usually needs dark text
        case 'info': headerBgClass = 'bg-info'; break;     // text-white is fine
    }
    toastHeader.addClass(headerBgClass).addClass(headerTextColorClass);

    // Handle "Don't show again" button
    toastHeader.find('.dynamic-toast-buttons').remove(); // Clear previous dynamic buttons
    if (doNotShowAgainKey) {
        const dnsaContainer = $('<div class="dynamic-toast-buttons ml-2"></div>'); // Container for dynamic buttons
        const dnsaBtn = $(`<button type="button" class="btn btn-sm btn-link p-0" title="Don't show this notification again">
                              <i class="fas fa-eye-slash"></i>
                           </button>`);
        dnsaBtn.data('do-not-show-again-key', doNotShowAgainKey);
        dnsaBtn.css('color', 'inherit'); // Inherit color from header for visibility
        dnsaContainer.append(dnsaBtn);
        toastHeader.children('.mr-auto').after(dnsaContainer); // Insert after the title
    }

    toastElement.toast({ delay: delayMs, autohide: delayMs > 0 });
    toastElement.toast('show');
}

function renderStars(rating) {
    if (rating === null || rating === undefined || String(rating).trim() === "" || String(rating).toLowerCase() === "n/a") {
        return '<span class="text-muted small">N/A</span>';
    }
    let starsHtml = '<span class="star-rating">';
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) return '<span class="text-muted small" title="Invalid Rating Value">Invalid</span>';

    const roundedRating = Math.round(numRating * 2) / 2; // Round to nearest 0.5
    for (let i = 1; i <= 5; i++) {
        if (roundedRating >= i) starsHtml += `<i class="fas fa-star"></i>`;
        else if (roundedRating >= i - 0.5) starsHtml += `<i class="fas fa-star-half-alt"></i>`;
        else starsHtml += `<i class="far fa-star"></i>`;
    }
    starsHtml += '</span>';
    return starsHtml;
}

function getRatingTextLabel(rating) {
    if (rating === null || rating === undefined || String(rating).trim() === "" || String(rating).toLowerCase() === "n/a") return 'Not Rated';
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) return 'Invalid Rating';
    if (numRating === 0 && String(rating).trim() === "0") return '0 Stars'; // Handle literal "0"
    if (numRating === 0) return 'Not Rated'; // Treat 0 as Not Rated unless explicitly "0"

    const label = `${numRating % 1 === 0 ? numRating : numRating.toFixed(1)} Star${numRating !== 1 ? 's' : ''}`;
    return label;
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments where crypto.randomUUID is not available
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function parseInputForAutocomplete(inputString) {
    if (typeof inputString !== 'string') return { finalized: [], current: '' };
    const parts = inputString.split(/,\s*|\s*;\s*/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) {
        return { finalized: [], current: '' };
    }
    const lastCharIsSeparator = /[;,]\s*$/.test(inputString); // Check if string ends with a separator
    let finalized = [];
    let current = '';
    if (lastCharIsSeparator) {
        finalized = parts; // All parts are finalized
    } else {
        current = parts.pop() || ''; // Last part is current term for suggestion
        finalized = parts;
    }
    return { finalized, current };
}

function populateRelatedEntriesSuggestions() {
    if (!formFieldsGlob || !formFieldsGlob.relatedEntriesNames || !formFieldsGlob.relatedEntriesSuggestions) {
        console.warn("Related entries UI elements not found for autocomplete.");
        return;
    }

    const relatedEntriesNamesInput = formFieldsGlob.relatedEntriesNames;
    const relatedEntriesSuggestionsContainer = formFieldsGlob.relatedEntriesSuggestions;

    const inputValue = relatedEntriesNamesInput.value;
    const { finalized: currentFinalizedNames, current: currentSearchTerm } = parseInputForAutocomplete(inputValue);

    relatedEntriesSuggestionsContainer.innerHTML = ''; // Clear previous suggestions

    if (currentSearchTerm.length < 2) { // Min length to trigger suggestions
        relatedEntriesSuggestionsContainer.style.display = 'none';
        return;
    }

    const lowerSearchTerm = currentSearchTerm.toLowerCase();
    const currentEditIdEl = document.getElementById('editEntryId');
    const currentEditId = currentEditIdEl ? currentEditIdEl.value : null; // ID of entry being edited, if any

    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array, cannot populate suggestions.");
        relatedEntriesSuggestionsContainer.style.display = 'none';
        return;
    }

    const matchedMovies = movieData.filter(movie =>
        movie && movie.id && movie.Name && // Ensure movie and its properties exist
        movie.id !== currentEditId && // Don't suggest the movie being edited
        String(movie.Name).toLowerCase().includes(lowerSearchTerm) && // Match search term
        !currentFinalizedNames.some(n => String(n).toLowerCase() === String(movie.Name).toLowerCase()) // Not already selected
    ).slice(0, 10); // Limit suggestions

    if (matchedMovies.length === 0) {
        relatedEntriesSuggestionsContainer.style.display = 'none';
        return;
    }

    matchedMovies.forEach(movie => {
        const suggestionItem = document.createElement('a');
        suggestionItem.href = '#'; // Prevent page jump
        suggestionItem.className = 'list-group-item list-group-item-action autocomplete-item p-2'; // Basic styling
        suggestionItem.textContent = movie.Name;
        suggestionItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Construct new input value: finalized names + selected suggestion + separator for next entry
            const newValue = [...currentFinalizedNames, movie.Name].join(', ') + ', ';
            relatedEntriesNamesInput.value = newValue;
            relatedEntriesSuggestionsContainer.style.display = 'none'; // Hide suggestions
            relatedEntriesNamesInput.focus(); // Keep focus on input for next entry
            populateRelatedEntriesSuggestions(); // Re-evaluate for new current term (which should be empty now)
        });
        relatedEntriesSuggestionsContainer.appendChild(suggestionItem);
    });

    relatedEntriesSuggestionsContainer.style.display = 'block';
}
