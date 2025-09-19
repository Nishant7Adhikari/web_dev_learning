// js/constants.js


// Supabase Constants
const SUPABASE_URL = 'plsceholder';
const SUPABASE_ANON_KEY = 'placeholder';

// TMDB API Key
const TMDB_API_KEY = 'placeholder';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// IndexedDB Constants
const DB_NAME = 'KeepMovieZ_UserCacheDB_V1';
const DB_VERSION = 1;
const STORE_NAME = 'movieEntries';
const IDB_USER_DATA_KEY = 'userMovieData';

// Auth & Data Constants
const MIGRATION_FLAG_KEY = 'keepMovieZ_supabaseMigrationDone';

// Recommendation Constants
const DAILY_RECOMMENDATION_ID_KEY = 'dailyRecommendationId_v2';
const DAILY_RECOMMENDATION_DATE_KEY = 'dailyRecommendationDate_v2';
const DAILY_REC_SKIP_COUNT_KEY = 'dailyRecSkipCount_v2';
const MAX_DAILY_SKIPS = 5;
const MAX_PERSONALIZED_RECS = 1 ; // Changed to 1 as per your request

// Toast "Don't show again" keys
const DO_NOT_SHOW_AGAIN_KEYS = {
    ENTRY_ADDED: 'dnsa_entryAdded',
    ENTRY_UPDATED: 'dnsa_entryUpdated',
    ENTRY_DELETED: 'dnsa_entryDeleted',
    DATA_ERASED: 'dnsa_dataErased',
    FLUX_CAPACITOR: 'dnsa_fluxCapacitor',
    TMDB_API_KEY_WARNING: 'dnsa_tmdbApiKeyWarning',
    DAILY_RECOMMENDATION_INTRO: 'dnsa_dailyRecIntro',
    LOCAL_CACHE_CORRUPT_CLEARED: 'dnsa_localCacheCorruptCleared',
    DATA_INTEGRITY_ISSUES_FOUND: 'dnsa_dataIntegrityIssuesFound',
};

const CSV_HEADERS = [
    "id", "Name", "Category", "Genre", "Status", "Continue Details",
    "Recommendation", "overallRating", "personalRecommendation",
    "Language", "Year", "Country", "Description", "Poster URL",
    "watchHistory",
    "relatedEntries",
    "Last Watched Date", "Last Watch Rating",
    "lastModifiedDate",
    "tmdbId", "tmdbMediaType",
    "keywords",
    "tmdb_collection_id", "tmdb_collection_name", "director_info", "full_cast",
    "production_companies", "tmdb_vote_average", "tmdb_vote_count", "runtime"
];

const countryCodeToNameMap = {
    "US": "United States", "NP": "Nepal", "GB": "United Kingdom", "CA": "Canada", "AU": "Australia",
    "IN": "India", "JP": "Japan", "KR": "South Korea", "FR": "France",
    "DE": "Germany", "ES": "Spain", "IT": "Italy", "CN": "China",
    "BR": "Brazil", "MX": "Mexico", "AR": "Argentina", "RU": "Russia",
    "UK": "United Kingdom", "BD": "Bangladesh", "PK": "Pakistan", "LK": "Sri Lanka",
    "AF": "Afghanistan", "IR": "Iran", "IQ": "Iraq", "SA": "Saudi Arabia",
    "AE": "United Arab Emirates", "EG": "Egypt", "ZA": "South Africa", "NG": "Nigeria",
    "KE": "Kenya", "ET": "Ethiopia", "GH": "Ghana", "TZ": "Tanzania",
    "SE": "Sweden", "NO": "Norway", "DK": "Denmark", "FI": "Finland",
    "IS": "Iceland", "NL": "Netherlands", "BE": "Belgium", "CH": "Switzerland",
    "AT": "Austria", "PL": "Poland", "CZ": "Czech Republic", "HU": "Hungary",
    "GR": "Greece", "PT": "Portugal", "IE": "Ireland", "NZ": "New Zealand",
    "SG": "Singapore", "MY": "Malaysia", "TH": "Thailand", "ID": "Indonesia",
    "PH": "Philippines", "VN": "Vietnam", "HK": "Hong Kong", "TW": "Taiwan",
    "CL": "Chile", "CO": "Colombia", "PE": "Peru", "VE": "Venezuela",
    "CU": "Cuba", "PY": "Paraguay", "UY": "Uruguay", "EC": "Ecuador",
    "BO": "Bolivia", "DO": "Dominican Republic", "PR": "Puerto Rico"
};

const ALL_GENRES = [ "Action", "Adventure", "Animation", "Anime", "Anthology", "Biopic",
    "Comedy", "Crime", "Cyberpunk", "Dark", "Disaster", "Documentary",
    "Drama", "Fantasy", "Feel Good", "Game/Sports", "Heist", "Historical", "Romance",
    "Horror", "Legal Drama", "Magic", "Medical Drama", "Musical", "Mystery",
    "Police/Military", "Political", "Post Apocalyptic", "Psychological", "Road Movie",
    "Rom-Com", "Sci-Fi", "Short Film", "Si-Fi",
    "Silent Film", "Slice of Life", "Supernatural", "Superpower", "Survival", "Suspenseful",
    "Thriller", "Time Travel", "Tragedy", "Uplifting", "War", "Web Series", "Wholesome", "Work/School", "Zombie"
].sort();
const UNIQUE_ALL_GENRES = [...new Set(ALL_GENRES.map(g => g.toLowerCase() === 'si-fi' ? 'Sci-Fi' : g))].sort();


const INACTIVITY_TIMEOUT_MS = 7 * 60 * 1000;
const LONG_PRESS_DURATION = 500;

const PRANK_TITLE_FLICKER_CHANCE = 500;
const PRANK_TOAST_CHANCE = 100;
const PRANK_ERROR_CHANCE = 200;

const ACHIEVEMENTS = [
    // I. Core Milestones
    // Entry Addition
    { id: 'entry_add_25', name: 'The Collector (Easy)', description: 'Add 25 entries.', type: 'total_entries', threshold: 25, icon: 'fas fa-box' },
    { id: 'entry_add_100', name: 'The Archivist (Medium)', description: 'Add 100 entries.', type: 'total_entries', threshold: 100, icon: 'fas fa-boxes' },
    { id: 'entry_add_500', name: 'The Hoarder (Hard)', description: 'Add 500 entries.', type: 'total_entries', threshold: 500, icon: 'fas fa-archive' },
    { id: 'entry_add_1000', name: 'Digital Librarian (Legendary)', description: 'Add 1000 entries.', type: 'total_entries', threshold: 1000, icon: 'fas fa-database' },
    // Titles Watched (Overall)
    { id: 'watched_overall_10', name: 'Getting Started (Easy)', description: 'Watch 10 titles.', type: 'total_titles_watched', threshold: 10, icon: 'fas fa-eye' },
    { id: 'watched_overall_50', name: 'Couch Potato (Medium)', description: 'Watch 50 titles.', type: 'total_titles_watched', threshold: 50, icon: 'fas fa-tv' },
    { id: 'watched_overall_200', name: 'Seasoned Viewer (Hard)', description: 'Watch 200 titles.', type: 'total_titles_watched', threshold: 200, icon: 'fas fa-film' },
    { id: 'watched_overall_500', name: 'Cinema Connoisseur (Legendary)', description: 'Watch 500 titles.', type: 'total_titles_watched', threshold: 500, icon: 'fas fa-ticket-alt' },
    // True Rewatcher (Distinct Titles Rewatched)
    { id: 'rewatched_distinct_3', name: 'Déjà Viewer (Easy)', description: 'Rewatch 3 distinct titles.', type: 'distinct_titles_rewatched', threshold: 3, icon: 'fas fa-redo' },
    { id: 'rewatched_distinct_10', name: 'Repeat Offender (Medium)', description: 'Rewatch 10 distinct titles.', type: 'distinct_titles_rewatched', threshold: 10, icon: 'fas fa-history' },
    { id: 'rewatched_distinct_25', name: 'Familiar Favorite Fan (Hard)', description: 'Rewatch 25 distinct titles.', type: 'distinct_titles_rewatched', threshold: 25, icon: 'fas fa-heart-circle-check' },
    // Movie Marathoner (Rewatching a Single Specific Movie)
    { id: 'single_rewatch_3', name: 'Encore! (Easy)', description: 'Watch the same movie 3 times.', type: 'single_title_rewatch_count', threshold: 3, icon: 'fas fa-bullseye' },
    { id: 'single_rewatch_5', name: 'Dedicated Viewer (Medium)', description: 'Watch the same movie 5 times.', type: 'single_title_rewatch_count', threshold: 5, icon: 'fas fa-heart' },
    { id: 'single_rewatch_10', name: 'Ultimate Fan (Hard)', description: 'Watch the same movie 10 times.', type: 'single_title_rewatch_count', threshold: 10, icon: 'fas fa-crown' },

    // II. Category-Specific Achievements
    // Movie Buff
    { id: 'movie_watched_10', name: 'Movie Goer (Easy)', description: 'Watch 10 Movies.', type: 'category_watched_count', category: 'Movie', threshold: 10, icon: 'fas fa-film' },
    { id: 'movie_watched_50', name: 'Movie Maniac (Medium)', description: 'Watch 50 Movies.', type: 'category_watched_count', category: 'Movie', threshold: 50, icon: 'fas fa-film' },
    { id: 'movie_watched_150', name: 'Film Fanatic (Hard)', description: 'Watch 150 Movies.', type: 'category_watched_count', category: 'Movie', threshold: 150, icon: 'fas fa-film' },
    // Series Fan
    { id: 'series_watched_5', name: 'Episode Explorer (Easy)', description: 'Watch 5 Series (completed or started).', type: 'category_watched_count', category: 'Series', threshold: 5, icon: 'fas fa-tv' },
    { id: 'series_watched_20', name: 'Binge Watcher (Medium)', description: 'Watch 20 Series (completed or started).', type: 'category_watched_count', category: 'Series', threshold: 20, icon: 'fas fa-tv' },
    { id: 'series_watched_50', name: 'Series Specialist (Hard)', description: 'Watch 50 Series (completed or started).', type: 'category_watched_count', category: 'Series', threshold: 50, icon: 'fas fa-tv' },
    // Series Loyalty (Completing Long Series) - Logic for "long series" to be defined in checking function
    { id: 'long_series_1', name: 'Commitment Ceremony (Easy)', description: 'Complete 1 long series.', type: 'long_series_watched_count', threshold: 1, icon: 'fas fa-user-clock' },
    { id: 'long_series_3', name: 'Saga Survivor (Medium)', description: 'Complete 3 long series.', type: 'long_series_watched_count', threshold: 3, icon: 'fas fa-calendar-check' },
    { id: 'long_series_5', name: 'Epic Journey (Hard)', description: 'Complete 5 long series.', type: 'long_series_watched_count', threshold: 5, icon: 'fas fa-scroll' },
    // Documentary Devotee
    { id: 'docu_watched_5', name: 'Truth Seeker (Easy)', description: 'Watch 5 Documentaries.', type: 'category_watched_count', category: 'Documentary', threshold: 5, icon: 'fas fa-book-open' },
    { id: 'docu_watched_15', name: 'Fact Finder (Medium)', description: 'Watch 15 Documentaries.', type: 'category_watched_count', category: 'Documentary', threshold: 15, icon: 'fas fa-search' },
    { id: 'docu_watched_30', name: 'Reality Scholar (Hard)', description: 'Watch 30 Documentaries.', type: 'category_watched_count', category: 'Documentary', threshold: 30, icon: 'fas fa-microscope' },
    // Special Appreciator
    { id: 'special_watched_3', name: 'One-Off Wonder (Easy)', description: 'Watch 3 Specials.', type: 'category_watched_count', category: 'Special', threshold: 3, icon: 'fas fa-star' },
    { id: 'special_watched_10', name: 'Event Viewer (Medium)', description: 'Watch 10 Specials.', type: 'category_watched_count', category: 'Special', threshold: 10, icon: 'fas fa-calendar-star' },

    // III. Genre Mastery
    // Action Aficionado
    { id: 'action_watched_10', name: 'Adrenaline Junkie (Easy)', description: 'Watch 10 Action titles.', type: 'genre_watched_count', genre: 'Action', threshold: 10, icon: 'fas fa-bomb' },
    { id: 'action_watched_30', name: 'Explosion Expert (Medium)', description: 'Watch 30 Action titles.', type: 'genre_watched_count', genre: 'Action', threshold: 30, icon: 'fas fa-fighter-jet' },
    { id: 'action_watched_75', name: 'Action Hero (Hard)', description: 'Watch 75 Action titles.', type: 'genre_watched_count', genre: 'Action', threshold: 75, icon: 'fas fa-fist-raised' },
    // Comedy Connoisseur
    { id: 'comedy_watched_10', name: 'Giggle Getter (Easy)', description: 'Watch 10 Comedy titles.', type: 'genre_watched_count', genre: 'Comedy', threshold: 10, icon: 'fas fa-laugh-beam' },
    { id: 'comedy_watched_30', name: 'Humor Honcho (Medium)', description: 'Watch 30 Comedy titles.', type: 'genre_watched_count', genre: 'Comedy', threshold: 30, icon: 'fas fa-smile-wink' },
    { id: 'comedy_watched_75', name: 'Comedy Legend (Hard)', description: 'Watch 75 Comedy titles.', type: 'genre_watched_count', genre: 'Comedy', threshold: 75, icon: 'fas fa-theater-masks' },
    // Drama Devotee
    { id: 'drama_watched_10', name: 'Emotion Explorer (Easy)', description: 'Watch 10 Drama titles.', type: 'genre_watched_count', genre: 'Drama', threshold: 10, icon: 'fas fa-sad-tear' },
    { id: 'drama_watched_30', name: 'Story Seeker (Medium)', description: 'Watch 30 Drama titles.', type: 'genre_watched_count', genre: 'Drama', threshold: 30, icon: 'fas fa-book' },
    { id: 'drama_watched_75', name: 'Dramatic Depths (Hard)', description: 'Watch 75 Drama titles.', type: 'genre_watched_count', genre: 'Drama', threshold: 75, icon: 'fas fa-feather-alt' },
    // Sci-Fi Sage
    { id: 'scifi_watched_10', name: 'Future Fan (Easy)', description: 'Watch 10 Sci-Fi titles.', type: 'genre_watched_count', genre: 'Sci-Fi', threshold: 10, icon: 'fas fa-rocket' },
    { id: 'scifi_watched_30', name: 'Tech Tinkerer (Medium)', description: 'Watch 30 Sci-Fi titles.', type: 'genre_watched_count', genre: 'Sci-Fi', threshold: 30, icon: 'fas fa-microchip' },
    { id: 'scifi_watched_75', name: 'Galaxy Guardian (Hard)', description: 'Watch 75 Sci-Fi titles.', type: 'genre_watched_count', genre: 'Sci-Fi', threshold: 75, icon: 'fas fa-user-astronaut' },
    // Horror Hound
    { id: 'horror_watched_10', name: 'Spook Seeker (Easy)', description: 'Watch 10 Horror titles.', type: 'genre_watched_count', genre: 'Horror', threshold: 10, icon: 'fas fa-ghost' },
    { id: 'horror_watched_30', name: 'Fright Fan (Medium)', description: 'Watch 30 Horror titles.', type: 'genre_watched_count', genre: 'Horror', threshold: 30, icon: 'fas fa-spider' },
    { id: 'horror_watched_75', name: 'Fearless Fiend (Hard)', description: 'Watch 75 Horror titles.', type: 'genre_watched_count', genre: 'Horror', threshold: 75, icon: 'fas fa-skull-crossbones' },
    // Fantasy Fanatic
    { id: 'fantasy_watched_10', name: 'Magic Believer (Easy)', description: 'Watch 10 Fantasy titles.', type: 'genre_watched_count', genre: 'Fantasy', threshold: 10, icon: 'fas fa-hat-wizard' },
    { id: 'fantasy_watched_30', name: 'Dragon Rider (Medium)', description: 'Watch 30 Fantasy titles.', type: 'genre_watched_count', genre: 'Fantasy', threshold: 30, icon: 'fas fa-dragon' },
    { id: 'fantasy_watched_75', name: 'Realm Ruler (Hard)', description: 'Watch 75 Fantasy titles.', type: 'genre_watched_count', genre: 'Fantasy', threshold: 75, icon: 'fas fa-dungeon' },
    // Thriller Tracker
    { id: 'thriller_watched_10', name: 'Suspense Starter (Easy)', description: 'Watch 10 Thriller titles.', type: 'genre_watched_count', genre: 'Thriller', threshold: 10, icon: 'fas fa-bolt' },
    { id: 'thriller_watched_30', name: 'Edge of Seat (Medium)', description: 'Watch 30 Thriller titles.', type: 'genre_watched_count', genre: 'Thriller', threshold: 30, icon: 'fas fa-user-secret' },
    { id: 'thriller_watched_75', name: 'Master of Suspense (Hard)', description: 'Watch 75 Thriller titles.', type: 'genre_watched_count', genre: 'Thriller', threshold: 75, icon: 'fas fa-low-vision' }, // Or fas fa-eye-slash
    // Animation Admirer
    { id: 'animation_watched_10', name: 'Cartoon Cadet (Easy)', description: 'Watch 10 Animation titles.', type: 'genre_watched_count', genre: 'Animation', threshold: 10, icon: 'fas fa-mouse-pointer' }, // or fas fa-pencil-ruler
    { id: 'animation_watched_30', name: 'Cel Champion (Medium)', description: 'Watch 30 Animation titles.', type: 'genre_watched_count', genre: 'Animation', threshold: 30, icon: 'fas fa-palette' },
    { id: 'animation_watched_75', name: 'Animation Ace (Hard)', description: 'Watch 75 Animation titles.', type: 'genre_watched_count', genre: 'Animation', threshold: 75, icon: 'fas fa-film' }, // Reusing, or something like fas fa-magic
    // Romance Reviewer
    { id: 'romance_watched_10', name: 'Heartfelt Hopeful (Easy)', description: 'Watch 10 Romance titles.', type: 'genre_watched_count', genre: 'Romance', threshold: 10, icon: 'fas fa-heart' },
    { id: 'romance_watched_30', name: 'Love Linguist (Medium)', description: 'Watch 30 Romance titles.', type: 'genre_watched_count', genre: 'Romance', threshold: 30, icon: 'fas fa-kiss-wink-heart' },
    { id: 'romance_watched_75', name: 'Cupid\'s Confidant (Hard)', description: 'Watch 75 Romance titles.', type: 'genre_watched_count', genre: 'Romance', threshold: 75, icon: 'fas fa-dove' },
    // Niche Genre Explorer
    { id: 'hist_watched_5', name: 'Historical Buff', description: 'Watch 5 Historical titles.', type: 'genre_watched_count', genre: 'Historical', threshold: 5, icon: 'fas fa-landmark' },
    { id: 'musical_watched_5', name: 'Musical Maestro', description: 'Watch 5 Musical titles.', type: 'genre_watched_count', genre: 'Musical', threshold: 5, icon: 'fas fa-music' },
    { id: 'mystery_watched_5', name: 'Mystery Solver', description: 'Watch 5 Mystery titles.', type: 'genre_watched_count', genre: 'Mystery', threshold: 5, icon: 'fas fa-search' }, // or fas fa-question-circle
    { id: 'crime_watched_5', name: 'Crime Scene Investigator', description: 'Watch 5 Crime titles.', type: 'genre_watched_count', genre: 'Crime', threshold: 5, icon: 'fas fa-balance-scale' }, // or fas fa-fingerprint
    // Genre Versatility
    { id: 'genre_variety_5', name: 'Genre Dabbler (Easy)', description: 'Watch titles from 5 different genres.', type: 'genre_variety_count', threshold: 5, icon: 'fas fa-random' },
    { id: 'genre_variety_10', name: 'Genre Hopper (Medium)', description: 'Watch titles from 10 different genres.', type: 'genre_variety_count', threshold: 10, icon: 'fas fa-palette' },
    { id: 'genre_variety_20', name: 'Genre Chameleon (Hard)', description: 'Watch titles from 20 different genres.', type: 'genre_variety_count', threshold: 20, icon: 'fas fa-swatchbook' },

    // IV. Rating & Recommendation Achievements
    // The Critic
    { id: 'rated_10', name: 'Budding Reviewer (Easy)', description: 'Rate 10 titles.', type: 'rated_titles_count', threshold: 10, icon: 'fas fa-star-half-alt' },
    { id: 'rated_50', name: 'Opinionated Viewer (Medium)', description: 'Rate 50 titles.', type: 'rated_titles_count', threshold: 50, icon: 'fas fa-pen-nib' },
    { id: 'rated_150', name: 'Distinguished Rater (Hard)', description: 'Rate 150 titles.', type: 'rated_titles_count', threshold: 150, icon: 'fas fa-award' },
    // Five-Star General
    { id: 'fivestar_5', name: 'Gold Star Giver (Easy)', description: 'Rate 5 titles with 5 stars.', type: 'specific_rating_count', rating: '5', threshold: 5, icon: 'fas fa-star' }, // color gold implied
    { id: 'fivestar_15', name: 'Perfectionist (Medium)', description: 'Rate 15 titles with 5 stars.', type: 'specific_rating_count', rating: '5', threshold: 15, icon: 'fas fa-star' },
    { id: 'fivestar_30', name: 'Gold Standard (Hard)', description: 'Rate 30 titles with 5 stars.', type: 'specific_rating_count', rating: '5', threshold: 30, icon: 'fas fa-medal' },
    // Curator (Highly Recommended)
    { id: 'highly_rec_5', name: 'Good Taste (Easy)', description: 'Mark 5 titles as "Highly Recommended".', type: 'recommendation_level_count', recommendation: 'Highly Recommended', threshold: 5, icon: 'fas fa-thumbs-up' },
    { id: 'highly_rec_15', name: 'Top Tier Tastes (Medium)', description: 'Mark 15 titles as "Highly Recommended".', type: 'recommendation_level_count', recommendation: 'Highly Recommended', threshold: 15, icon: 'fas fa-poll-h' },
    { id: 'highly_rec_30', name: 'Elite Recommender (Hard)', description: 'Mark 30 titles as "Highly Recommended".', type: 'recommendation_level_count', recommendation: 'Highly Recommended', threshold: 30, icon: 'fas fa-certificate' },
    // Sharer (Personal Audience - "Watch with Anyone")
    { id: 'share_anyone_10', name: 'Crowd Pleaser (Easy)', description: 'Mark 10 titles as "Watch with Anyone".', type: 'personal_audience_count', personalAudience: 'Watch with Anyone', threshold: 10, icon: 'fas fa-users' },
    { id: 'share_anyone_25', name: 'Social Butterfly (Medium)', description: 'Mark 25 titles as "Watch with Anyone".', type: 'personal_audience_count', personalAudience: 'Watch with Anyone', threshold: 25, icon: 'fas fa-user-friends' },
    { id: 'share_anyone_50', name: 'Universal Appeal (Hard)', description: 'Mark 50 titles as "Watch with Anyone".', type: 'personal_audience_count', personalAudience: 'Watch with Anyone', threshold: 50, icon: 'fas fa-handshake' },

    // V. Temporal & Completion Achievements
    // Decade Explorer
    { id: 'decade_variety_3', name: 'Time Traveler (Easy)', description: 'Watch titles from 3 different decades.', type: 'decade_variety_count', threshold: 3, icon: 'fas fa-calendar-alt' },
    { id: 'decade_variety_5', name: 'Century Spanner (Medium)', description: 'Watch titles from 5 different decades.', type: 'decade_variety_count', threshold: 5, icon: 'fas fa-history' },
    { id: 'decade_variety_10', name: 'Epoch Voyager (Hard)', description: 'Watch titles from 10 different decades.', type: 'decade_variety_count', threshold: 10, icon: 'fas fa-hourglass-half' },
    // Classic Connoisseur
    { id: 'classic_connoisseur_10', name: 'Classic Connoisseur', description: 'Watch 10 titles released before 1980.', type: 'pre_year_watched_count', year: 1980, threshold: 10, icon: 'fas fa-film' }, // old film reel icon
    // Contemporary Critic
    { id: 'contemporary_critic_25', name: 'Contemporary Critic', description: 'Watch 25 titles released in the last 5 years.', type: 'recent_years_watched_count', yearsAgo: 5, threshold: 25, icon: 'fas fa-glasses' },
    // Backlog Buster (Marked as "Watched")
    { id: 'backlog_watched_20', name: 'List Clearer (Easy)', description: 'Mark 20 entries as Watched.', type: 'status_count', status: 'Watched', threshold: 20, icon: 'fas fa-check-double' },
    { id: 'backlog_watched_75', name: 'Queue Conqueror (Medium)', description: 'Mark 75 entries as Watched.', type: 'status_count', status: 'Watched', threshold: 75, icon: 'fas fa-clipboard-check' },
    { id: 'backlog_watched_200', name: 'Completionist Prime (Hard)', description: 'Mark 200 entries as Watched.', type: 'status_count', status: 'Watched', threshold: 200, icon: 'fas fa-tasks' }, // fas fa-flag-checkered
    // Persistent Progress (Simultaneously in "Continue" status)
    { id: 'continue_active_3', name: 'Juggler (Easy)', description: 'Have 3 titles in "Continue" status.', type: 'status_count_active', status: 'Continue', threshold: 3, icon: 'fas fa-stream' },
    { id: 'continue_active_7', name: 'Multi-Tasker (Medium)', description: 'Have 7 titles in "Continue" status.', type: 'status_count_active', status: 'Continue', threshold: 7, icon: 'fas fa-layer-group' },
    { id: 'continue_active_12', name: 'Serial Watcher (Hard)', description: 'Have 12 titles in "Continue" status.', type: 'status_count_active', status: 'Continue', threshold: 12, icon: 'fas fa-infinity' },
    // Daily Dedication (Requires external tracking of unique usage days)
    { id: 'active_days_7', name: 'Regular User (Easy)', description: 'Use the app on 7 different days.', type: 'active_days_count', threshold: 7, icon: 'fas fa-calendar-day' },
    { id: 'active_days_30', name: 'Consistent Viewer (Medium)', description: 'Use the app on 30 different days.', type: 'active_days_count', threshold: 30, icon: 'fas fa-calendar-alt' },
    { id: 'active_days_90', name: 'Habitual User (Hard)', description: 'Use the app on 90 different days.', type: 'active_days_count', threshold: 90, icon: 'fas fa-user-clock' },
    // Weekend Warrior
    { id: 'weekend_warrior_3', name: 'Weekend Warrior', description: 'Watch 3 titles over a single weekend (Sat/Sun).', type: 'weekend_watch_streak', threshold: 3, icon: 'fas fa-calendar-week' },

    // VI. Geographical & Linguistic Achievements
    // Globetrotter
    { id: 'country_variety_5', name: 'World Curious (Easy)', description: 'Watch titles from 5 different countries.', type: 'country_variety_count', threshold: 5, icon: 'fas fa-globe-americas' },
    { id: 'country_variety_10', name: 'World Cinema Wanderer (Medium)', description: 'Watch titles from 10 different countries.', type: 'country_variety_count', threshold: 10, icon: 'fas fa-map-marked-alt' },
    { id: 'country_variety_20', name: 'International Film Diplomat (Hard)', description: 'Watch titles from 20 different countries.', type: 'country_variety_count', threshold: 20, icon: 'fas fa-passport' },
    // Polyglot Viewer
    { id: 'lang_variety_3', name: 'Language Sampler (Easy)', description: 'Watch titles in 3 different languages.', type: 'language_variety_count', threshold: 3, icon: 'fas fa-language' },
    { id: 'lang_variety_7', name: 'Linguistic Explorer (Medium)', description: 'Watch titles in 7 different languages.', type: 'language_variety_count', threshold: 7, icon: 'fas fa-comments' },
    { id: 'lang_variety_12', name: 'Master of Subtitles (Hard)', description: 'Watch titles in 12 different languages.', type: 'language_variety_count', threshold: 12, icon: 'fas fa-closed-captioning' },

    // VII. Feature Usage & Fun Achievements (Many need new tracking)
    // Sync Savvy
    { id: 'sync_5', name: 'Sync Starter (Easy)', description: 'Perform cloud sync 5 times.', type: 'sync_count', threshold: 5, icon: 'fas fa-sync-alt' },
    { id: 'sync_25', name: 'Cloud Connector (Medium)', description: 'Perform cloud sync 25 times.', type: 'sync_count', threshold: 25, icon: 'fas fa-cloud-upload-alt' },
    { id: 'sync_100', name: 'Sync Sensei (Hard)', description: 'Perform cloud sync 100 times.', type: 'sync_count', threshold: 100, icon: 'fas fa-server' },
    // Statistically Speaking
    { id: 'stats_opened_10', name: 'Data Dabbler (Easy)', description: 'Open the Stats modal 10 times.', type: 'stats_modal_opened_count', threshold: 10, icon: 'fas fa-chart-bar' },
    { id: 'stats_opened_50', name: 'Insight Seeker (Medium)', description: 'Open the Stats modal 50 times.', type: 'stats_modal_opened_count', threshold: 50, icon: 'fas fa-calculator' },
    { id: 'stats_opened_150', name: 'Chart Champion (Hard)', description: 'Open the Stats modal 150 times.', type: 'stats_modal_opened_count', threshold: 150, icon: 'fas fa-chart-pie' },
    // Time-based watches
    { id: 'night_owl_watch', name: 'Night Owl', description: 'Log a watch instance between 12 AM and 4 AM.', type: 'time_of_day_watch', period: 'night', threshold: 1, icon: 'fas fa-moon' },
    { id: 'early_bird_watch', name: 'Early Bird', description: 'Log a watch instance between 5 AM and 8 AM.', type: 'time_of_day_watch', period: 'early_morning', threshold: 1, icon: 'fas fa-sun' },
    // Description Detailer
    { id: 'desc_detail_10', name: 'Word Weaver (Easy)', description: 'Write descriptions >100 characters for 10 entries.', type: 'detailed_description_count', minLength: 100, threshold: 10, icon: 'fas fa-file-alt' },
    { id: 'desc_detail_30', name: 'Story Scribe (Medium)', description: 'Write descriptions >100 characters for 30 entries.', type: 'detailed_description_count', minLength: 100, threshold: 30, icon: 'fas fa-pen-fancy' },
    { id: 'desc_detail_75', name: 'Lore Master (Hard)', description: 'Write descriptions >100 characters for 75 entries.', type: 'detailed_description_count', minLength: 100, threshold: 75, icon: 'fas fa-book-reader' },
    // Poster Perfect
    { id: 'poster_25', name: 'Image Importer (Easy)', description: 'Ensure 25 entries have a Poster URL.', type: 'poster_url_present_count', threshold: 25, icon: 'fas fa-image' },
    { id: 'poster_100', name: 'Gallery Curator (Medium)', description: 'Ensure 100 entries have a Poster URL.', type: 'poster_url_present_count', threshold: 100, icon: 'fas fa-images' },
    { id: 'poster_250', name: 'Visual Virtuoso (Hard)', description: 'Ensure 250 entries have a Poster URL.', type: 'poster_url_present_count', threshold: 250, icon: 'fas fa-photo-video' },
    // Franchise Follower
    { id: 'franchise_3', name: 'Trilogy Tracker (Easy)', description: 'Watch 3 movies from the same TMDB collection.', type: 'tmdb_collection_streak_count', threshold: 3, icon: 'fas fa-project-diagram' },
    { id: 'franchise_5', name: 'Saga Seeker (Medium)', description: 'Watch 5 movies from the same TMDB collection.', type: 'tmdb_collection_streak_count', threshold: 5, icon: 'fas fa-sitemap' },
    { id: 'franchise_all_5plus', name: 'Collection Completer (Hard)', description: 'Watch all movies from a TMDB collection of 5+ entries.', type: 'tmdb_collection_completed_count', minCollectionSize: 5, threshold: 1, icon: 'fas fa-check-circle' },
    // Director's Portfolio
    { id: 'director_3', name: 'Director Dabbler (Easy)', description: 'Watch 3 movies by the same director.', type: 'director_streak_count', threshold: 3, icon: 'fas fa-video' },
    { id: 'director_5', name: 'Auteur Admirer (Medium)', description: 'Watch 5 movies by the same director.', type: 'director_streak_count', threshold: 5, icon: 'fas fa-user-tie' },
    { id: 'director_10', name: 'Director Devotee (Hard)', description: 'Watch 10 movies by the same director.', type: 'director_streak_count', threshold: 10, icon: 'fas fa-film' }, // Reusing film or clapperboard
    // Studio Sampler
    { id: 'studio_3', name: 'Studio Scout (Easy)', description: 'Watch 3 movies from the same major production company.', type: 'studio_streak_count', threshold: 3, icon: 'fas fa-industry' },
    { id: 'studio_7', name: 'Production Pro (Medium)', description: 'Watch 7 movies from the same major production company.', type: 'studio_streak_count', threshold: 7, icon: 'fas fa-building' },
    { id: 'studio_15', name: 'Mogul Monitor (Hard)', description: 'Watch 15 movies from the same major production company.', type: 'studio_streak_count', threshold: 15, icon: 'fas fa-city' },
    // Linked In
    { id: 'links_5', name: 'Connector (Easy)', description: 'Manually link 5 pairs of related entries.', type: 'manual_links_count', threshold: 5, icon: 'fas fa-link' },
    { id: 'links_15', name: 'Networker (Medium)', description: 'Manually link 15 pairs of related entries.', type: 'manual_links_count', threshold: 15, icon: 'fas fa-network-wired' },
    { id: 'links_30', name: 'Web Weaver (Hard)', description: 'Manually link 30 pairs of related entries.', type: 'manual_links_count', threshold: 30, icon: 'fas fa-project-diagram' }, // Reusing
    // Themed Spree
    { id: 'themed_spree_3', name: 'Themed Spree', description: 'Watch 3 movies of the same specific genre within 7 days.', type: 'genre_streak_short_term', count: 3, days: 7, threshold: 1, icon: 'fas fa-tags' },
    // Hidden Gem Hunter
    { id: 'hidden_gem_3', name: 'Gem Finder (Easy)', description: 'Watch 3 movies with <1000 TMDB votes but TMDB rating > 7.0.', type: 'hidden_gem_count', tmdbVotesMax: 1000, tmdbRatingMin: 7.0, threshold: 3, icon: 'fas fa-search-dollar' },
    { id: 'hidden_gem_7', name: 'Diamond in Rough (Medium)', description: 'Watch 7 movies with <1000 TMDB votes but TMDB rating > 7.0.', type: 'hidden_gem_count', tmdbVotesMax: 1000, tmdbRatingMin: 7.0, threshold: 7, icon: 'fas fa-gem' },
    { id: 'hidden_gem_15', name: 'Treasure Hunter (Hard)', description: 'Watch 15 movies with <1000 TMDB votes but TMDB rating > 7.0.', type: 'hidden_gem_count', tmdbVotesMax: 1000, tmdbRatingMin: 7.0, threshold: 15, icon: 'fas fa-map-pin' },
    // Daily Devotee
    { id: 'daily_rec_watched_5', name: 'Daily Dabbler (Easy)', description: 'Watch the Daily Recommendation 5 times.', type: 'daily_recommendation_watched_count', threshold: 5, icon: 'fas fa-gift' },
    { id: 'daily_rec_watched_15', name: 'Picky Pro (Medium)', description: 'Watch the Daily Recommendation 15 times.', type: 'daily_recommendation_watched_count', threshold: 15, icon: 'fas fa-calendar-star' },
    { id: 'daily_rec_watched_30', name: 'Suggestion Sovereign (Hard)', description: 'Watch the Daily Recommendation 30 times.', type: 'daily_recommendation_watched_count', threshold: 30, icon: 'fas fa-crown' }, // Reusing
    // Perfect Week
    { id: 'perfect_week_7', name: 'Perfect Week', description: 'Log a watched item every day for 7 consecutive days.', type: 'consecutive_daily_watch_streak', threshold: 7, icon: 'fas fa-calendar-check' },
    // Full House
    { id: 'full_house_status', name: 'Full House', description: 'Have at least one entry in each main status: "To Watch", "Watched", "Continue", "Unwatched".', type: 'all_statuses_present', threshold: 1, icon: 'fas fa-layer-group' },

    // VIII. "Meta" Achievements
    { id: 'meta_bronze_10', name: 'Bronze Collector', description: 'Achieve 10 other achievements.', type: 'meta_achievement_count', threshold: 10, icon: 'fas fa-trophy' }, // Color can be handled in CSS if needed
    { id: 'meta_silver_25', name: 'Silver Collector', description: 'Achieve 25 other achievements.', type: 'meta_achievement_count', threshold: 25, icon: 'fas fa-trophy' },
    { id: 'meta_gold_50', name: 'Gold Collector', description: 'Achieve 50 other achievements.', type: 'meta_achievement_count', threshold: 50, icon: 'fas fa-trophy' },
    { id: 'meta_platinum_75', name: 'Platinum Collector', description: 'Achieve 75 other achievements.', type: 'meta_achievement_count', threshold: 75, icon: 'fas fa-trophy' },
    { id: 'meta_diamond_100', name: 'Diamond Collector', description: 'Achieve 100+ other achievements.', type: 'meta_achievement_count', threshold: 100, icon: 'fas fa-trophy' },
];


// js/supabase-client.js

let supabase = null;

try {
    if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' &&
        SUPABASE_URL && SUPABASE_ANON_KEY &&
        SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
            console.log("Supabase client initialized successfully.");
        } else {
            console.error("Supabase JS library (V2) not found or createClient is not a function. Ensure it's correctly included in index.html before this script.");
        }
    } else {
        console.warn("SUPABASE_URL or SUPABASE_ANON_KEY is not configured correctly in constants.js. Supabase features will be disabled.");
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
    supabase = null;
}

window.supabaseClient = supabase;

// js/dom-elements.js

let selectedEntryIds = [];
var isMultiSelectMode = false;
let longPressTimer = null;

let loadingOverlay, themeTransitionOverlay, authContainer, appContent, onlineStatusIndicator;
let formFieldsGlob = {};
let watchInstanceFormFields = {};

let movieData = [];
let currentSortColumn = 'Name';
let currentSortDirection = 'asc';
let filterQuery = '';
let selectedGenres = [];

let movieIdToDelete = null;
let pendingEntryForConfirmation = null;
let pendingEditIdForConfirmation = null;

const chartInstances = {};
let globalStatsData = {};

let db;
let isAppLocked = false;
let inactivityTimer;

function initializeDOMElements() {
    loadingOverlay = document.getElementById('loadingOverlay');
    themeTransitionOverlay = document.getElementById('themeTransitionOverlay');
    authContainer = document.getElementById('authContainer');
    appContent = document.getElementById('appContent');
    onlineStatusIndicator = document.getElementById('onlineStatusIndicator');

    formFieldsGlob = {
        name: document.getElementById('movieName'),
        category: document.getElementById('category'),
        status: document.getElementById('status'),
        continueDetails: document.getElementById('continueDetails'),
        recommendation: document.getElementById('recommendation'),
        overallRating: document.getElementById('overallRating'),
        personalRecommendation: document.getElementById('personalRecommendation'),
        description: document.getElementById('description'),
        language: document.getElementById('language'),
        year: document.getElementById('year'),
        country: document.getElementById('country'),
        posterUrl: document.getElementById('posterUrl'),
        tmdbId: document.getElementById('tmdbId'),
        tmdbMediaType: document.getElementById('tmdbMediaType'),
        tmdbSearchYear: document.getElementById('tmdbSearchYear'),
        relatedEntriesNames: document.getElementById('relatedEntriesNames'),
        relatedEntriesSuggestions: document.getElementById('relatedEntriesSuggestions')
    };

    watchInstanceFormFields = {
        date: document.getElementById('watchDate'),
        rating: document.getElementById('watchRating'),
        notes: document.getElementById('watchNotes')
    };

    const criticalElements = { loadingOverlay, themeTransitionOverlay, authContainer, appContent, onlineStatusIndicator, ...formFieldsGlob, ...watchInstanceFormFields };
    let missingCritical = false;
    for (const key in criticalElements) {
        if (!criticalElements[key]) {
            console.error(`CRITICAL DOM ERROR: Element for '${key}' (ID: ${key.replace(/([A-Z])/g, "-$1").toLowerCase()}) not found.`);
            missingCritical = true;
        }
    }
    if (missingCritical) {
        if (authContainer) authContainer.innerHTML = "<div class='auth-card'><p class='text-danger text-center'>Critical application error: UI elements missing. Please contact support or try refreshing.</p></div>";
        if (appContent) appContent.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
    }
}


// js/utils.js

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
    if (currentSupabaseUser && !isAppLocked) {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log("Inactivity timeout. Locking app.");
            if (typeof lockApp === 'function') {
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
        let hasDragged = false;

        tableResponsiveDiv.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target.closest('button, a, input, select, textarea, .btn-action, .watch-later-btn')) {
                isMouseDownForScroll = false; return;
            }
            if (isMultiSelectMode) {
                isMouseDownForScroll = false; return;
            }
            isMouseDownForScroll = true;
            hasDragged = false;
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
            const walk = (x - startX) * 1.5;
            tableResponsiveDiv.scrollLeft = scrollLeftStart - walk;
            if (Math.abs(walk) > 5) hasDragged = true;
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
        });
    } else {
        console.warn("'.table-responsive' element not found for scroll enhancements.");
    }
}

/**
 * Maps a two-letter country code to a full country name.
 * @param {string} code The two-letter country code or potentially a full name.
 * @returns {string} The full country name or the original input if not a recognized code or already a full name.
 */
function getCountryFullName(code) {
    if (!code || typeof code !== 'string') return code || 'N/A';

    const upperCode = code.toUpperCase().trim();

    if (countryCodeToNameMap[upperCode]) { // Exact code match (e.g., "US" -> "United States")
        return countryCodeToNameMap[upperCode];
    }

    // Check if the input might be a full name already by trying to find a code for it
    for (const [mapCode, mapName] of Object.entries(countryCodeToNameMap)) {
        if (mapName.toUpperCase() === upperCode) {
            return mapName; // It's already a known full name, return it as is (original casing)
        }
    }

    // If it's not a known code and not a known full name, return the original input (trimmed)
    return code.trim();
}


function showToast(title, message, type = 'info', delayMs, doNotShowAgainKey = null) {
    if (doNotShowAgainKey && localStorage.getItem(doNotShowAgainKey) === 'true') {
        return;
    }

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
        alert(`${title}: ${message}`);
        return;
    }

    const toastElement = $('#appToast');
    if (!toastElement.length) { console.warn("Toast element #appToast not found"); return; }

    if (delayMs === undefined) {
        switch (type) {
            case 'success': delayMs = 3000; break;
            case 'error': delayMs = 6000; break;
            case 'warning': delayMs = 4500; break;
            case 'info': default: delayMs = 3500; break;
        }
    }

    toastElement.find('#toastTitle').text(title || 'Notification');
    toastElement.find('#toastBody').text(message || '');

    const toastHeader = toastElement.find('.toast-header');
    toastHeader.removeClass ( (index, className) => (className.match (/(^|\s)bg-\S+/g) || []).join(' ') );
    toastHeader.removeClass('text-white text-dark');

    let headerBgClass = 'bg-primary';
    let headerTextColorClass = 'text-white';

    switch (type) {
        case 'success': headerBgClass = 'bg-success'; break;
        case 'error': headerBgClass = 'bg-danger'; break;
        case 'warning': headerBgClass = 'bg-warning'; headerTextColorClass = 'text-dark'; break;
        case 'info': headerBgClass = 'bg-info'; break;
    }
    toastHeader.addClass(headerBgClass).addClass(headerTextColorClass);

    toastHeader.find('.dynamic-toast-buttons').remove();
    if (doNotShowAgainKey) {
        const dnsaContainer = $('<div class="dynamic-toast-buttons ml-2"></div>');
        const dnsaBtn = $(`<button type="button" class="btn btn-sm btn-link p-0" title="Don't show this notification again">
                              <i class="fas fa-eye-slash"></i>
                           </button>`);
        dnsaBtn.data('do-not-show-again-key', doNotShowAgainKey);
        dnsaBtn.css('color', 'inherit');
        dnsaContainer.append(dnsaBtn);
        toastHeader.children('.mr-auto').after(dnsaContainer);
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

    const roundedRating = Math.round(numRating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
        if (roundedRating >= i) {
            starsHtml += `<i class="fas fa-star"></i>`;
        } else if (roundedRating >= i - 0.5) {
            starsHtml += `<i class="fas fa-star-half-alt"></i>`;
        } else {
            starsHtml += `<i class="far fa-star"></i>`;
        }
    }
    starsHtml += '</span>';
    return starsHtml;
}

function getRatingTextLabel(rating) {
    if (rating === null || rating === undefined || String(rating).trim() === "" || String(rating).toLowerCase() === "n/a") return 'Not Rated';
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) return 'Invalid Rating';
    if (numRating === 0 && String(rating).trim() === "0") return '0 Stars';
    if (numRating === 0) return 'Not Rated';

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
    const lastCharIsSeparator = /[;,]\s*$/.test(inputString);
    let finalized = [];
    let current = '';
    if (lastCharIsSeparator) {
        finalized = parts;
    } else {
        current = parts.pop() || '';
        finalized = parts;
    }
    return { finalized, current };
}

function populateRelatedEntriesSuggestions() {
    if (!formFieldsGlob || !formFieldsGlob.relatedEntriesNames || !formFieldsGlob.relatedEntriesSuggestions) {
        return;
    }

    const relatedEntriesNamesInput = formFieldsGlob.relatedEntriesNames;
    const relatedEntriesSuggestionsContainer = formFieldsGlob.relatedEntriesSuggestions;

    const inputValue = relatedEntriesNamesInput.value;
    const { finalized: currentFinalizedNames, current: currentSearchTerm } = parseInputForAutocomplete(inputValue);

    relatedEntriesSuggestionsContainer.innerHTML = '';

    if (currentSearchTerm.length < 2) {
        relatedEntriesSuggestionsContainer.style.display = 'none';
        return;
    }

    const lowerSearchTerm = currentSearchTerm.toLowerCase();
    const currentEditIdEl = document.getElementById('editEntryId');
    const currentEditId = currentEditIdEl ? currentEditIdEl.value : null;

    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array, cannot populate suggestions.");
        relatedEntriesSuggestionsContainer.style.display = 'none';
        return;
    }

    const matchedMovies = movieData.filter(movie =>
        movie && movie.id && movie.Name &&
        movie.id !== currentEditId &&
        String(movie.Name).toLowerCase().includes(lowerSearchTerm) &&
        !currentFinalizedNames.some(n => String(n).toLowerCase() === String(movie.Name).toLowerCase())
    ).slice(0, 7);

    if (matchedMovies.length === 0) {
        relatedEntriesSuggestionsContainer.style.display = 'none';
        return;
    }

    matchedMovies.forEach(movie => {
        const suggestionItem = document.createElement('a');
        suggestionItem.href = '#';
        suggestionItem.className = 'list-group-item list-group-item-action autocomplete-item p-2';
        suggestionItem.textContent = movie.Name;
        suggestionItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = [...currentFinalizedNames, movie.Name].join(', ') + ', ';
            relatedEntriesNamesInput.value = newValue;
            relatedEntriesSuggestionsContainer.style.display = 'none';
            relatedEntriesNamesInput.focus();
            populateRelatedEntriesSuggestions();
        });
        relatedEntriesSuggestionsContainer.appendChild(suggestionItem);
    });

    relatedEntriesSuggestionsContainer.style.display = 'block';
}

// js/indexeddb.js

async function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.error("IndexedDB not supported by this browser.");
            showToast("Browser Incompatible", "Local data storage (IndexedDB) is not supported. App may not work correctly.", "error");
            return reject("IndexedDB not supported.");
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const tempDb = event.target.result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                tempDb.createObjectStore(STORE_NAME);
            }
            console.log("IndexedDB upgrade needed and processed.");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("IndexedDB opened successfully.");
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            showToast("Local Cache Error", "Could not open local data cache. Offline features might be limited.", "error");
            reject(event.target.error);
        };
    });
}


async function clearLocalMovieCache() {
    if (!db) {
        console.error("Database not open. Cannot clear cache.");
        try {
            await openDatabase();
            if (!db) return Promise.reject("Database could not be opened to clear cache.");
        } catch (error) {
            return Promise.reject("Failed to open database to clear cache.");
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log("Local movie cache cleared from IndexedDB.");
                resolve();
            };
            request.onerror = (event) => {
                console.error("Error clearing local movie cache from IndexedDB:", event.target.error);
                reject(event.target.error);
            };
        } catch (e) {
            console.error("Exception during IndexedDB clear transaction:", e);
            reject(e);
        }
    });
}


// js/data-manager.js

async function saveToIndexedDB() {
    if (!db) {
        console.warn("IndexedDB not open. Attempting to open before saving...");
        try {
            await openDatabase();
            if (!db) {
                 showToast("Local Save Failed", "Cannot connect to local database. Changes not saved locally.", "error");
                 return;
            }
        } catch (e) {
            showToast("Local Save Failed", `Error connecting to local database: ${e.message}. Changes not saved.`, "error");
            return;
        }
    }
    if (!Array.isArray(movieData)) {
        console.error("movieData is not an array. Cannot save to IndexedDB.");
        showToast("Data Error", "Invalid data format. Cannot save locally.", "error");
        return;
    }

    try {
        const dataToStore = JSON.stringify(movieData);
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(dataToStore, IDB_USER_DATA_KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                console.error("Error saving to IndexedDB (local cache):", event.target.error);
                showToast("Local Cache Error", "Could not save data locally.", "warning");
                reject(event.target.error);
            };
            transaction.onerror = (event) => {
                console.error("IndexedDB transaction error during save:", event.target.error);
                reject(event.target.error);
            };
        });
    } catch (e) {
        console.error("Exception during IndexedDB save process:", e);
        showToast("Local Cache Error", `Could not save data locally due to an exception: ${e.message}`, "warning");
        return Promise.reject(e);
    }
}

async function loadFromIndexedDB() {
    if (!db) {
        console.warn("IndexedDB not open. Attempting to open before loading...");
        try {
            await openDatabase();
            if (!db) return [];
        } catch (e) {
            console.error("Failed to open database for loading:", e);
            return [];
        }
    }
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(IDB_USER_DATA_KEY);

        return await new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const jsonData = event.target.result;
                if (jsonData) {
                    try {
                        const parsedData = JSON.parse(jsonData);
                        resolve(Array.isArray(parsedData) ? parsedData : []);
                    } catch (e) {
                        console.error("Error parsing cached data from IndexedDB:", e);
                        showToast("Cache Corrupt", "Local cache was corrupt and has been cleared. Please sync with cloud if possible.", "error", 0, DO_NOT_SHOW_AGAIN_KEYS.LOCAL_CACHE_CORRUPT_CLEARED);
                        const writeTransaction = db.transaction([STORE_NAME], 'readwrite');
                        const writeStore = writeTransaction.objectStore(STORE_NAME);
                        writeStore.delete(IDB_USER_DATA_KEY);
                        resolve([]);
                    }
                } else {
                    resolve([]);
                }
            };
            request.onerror = (event) => {
                console.error("Error fetching from IndexedDB (local cache):", event.target.error);
                showToast("Local Cache Error", "Failed to load data from local cache.", "error");
                reject(event.target.error);
            };
        });
    } catch (e) {
        console.error("IndexedDB local cache load process failed:", e);
        showToast("Local Cache Error", "Failed to load data from local cache.", "error");
        return [];
    }
}

async function migrateVeryOldLocalStorageData() {
    try {
        const ancientLocalStorageKey = 'myMovieTrackerData';
        const storedData = localStorage.getItem(ancientLocalStorageKey);

        if (storedData) {
            console.log("Found very old localStorage data. Attempting to parse.");
            let parsedData;
            try {
                parsedData = JSON.parse(storedData);
            } catch (e) {
                console.error("Could not parse very old localStorage data. Removing it.", e);
                localStorage.removeItem(ancientLocalStorageKey);
                showToast("Old Data Cleanup", "Invalid old data found in localStorage and removed.", "warning");
                return false;
            }

            if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.warn("Data from very old localStorage version found. This data is NOT automatically migrated. Please use CSV/JSON import if this data is important. The old data has been removed from localStorage to prevent issues.", parsedData.slice(0, 5));
                showToast("Old Data Found & Removed", "Remnants of a very old data version were cleared from localStorage. Please use import if needed.", "info", 7000);
            }
            localStorage.removeItem(ancientLocalStorageKey);

            localStorage.removeItem(DAILY_RECOMMENDATION_ID_KEY.replace('_v2', ''));
            localStorage.removeItem(DAILY_RECOMMENDATION_DATE_KEY.replace('_v2', ''));
            localStorage.removeItem(DAILY_REC_SKIP_COUNT_KEY.replace('_v2', ''));
            return true;
        }
    } catch (e) {
        console.error("Error during very old localStorage data cleanup:", e);
    }
    return false;
}

function recalculateAndApplyAllRelationships() {
    if (!Array.isArray(movieData) || movieData.length === 0) return;

    const adj = new Map();
    const movieIds = new Set(movieData.map(m => m.id));

    movieData.forEach(movie => {
        if (!movie || !movie.id) return;
        if (!adj.has(movie.id)) adj.set(movie.id, new Set());

        const validRelatedIds = (movie.relatedEntries || [])
            .filter(id => id && movieIds.has(id) && id !== movie.id);

        validRelatedIds.forEach(relatedId => {
            adj.get(movie.id).add(relatedId);
            if (!adj.has(relatedId)) adj.set(relatedId, new Set());
            adj.get(relatedId).add(movie.id);
        });
        movie.relatedEntries = validRelatedIds;
    });

    const visited = new Set();
    const allComponents = [];

    movieData.forEach(movie => {
        if (!movie || !movie.id || visited.has(movie.id)) return;

        const currentComponent = new Set();
        const queue = [movie.id];
        visited.add(movie.id);

        let head = 0;
        while(head < queue.length) {
            const nodeId = queue[head++];
            if(!nodeId) continue;
            currentComponent.add(nodeId);

            const neighbors = adj.get(nodeId) || new Set();
            neighbors.forEach(neighborId => {
                if (neighborId && !visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            });
        }
        if (currentComponent.size > 0) allComponents.push(Array.from(currentComponent));
    });

    movieData.forEach(movie => {
        if (!movie || !movie.id) return;
        const component = allComponents.find(comp => comp.includes(movie.id));
        if (component) {
            movie.relatedEntries = component.filter(id => id && id !== movie.id && movieIds.has(id));
        } else {
            movie.relatedEntries = (movie.relatedEntries || []).filter(id => id && id !== movie.id && movieIds.has(id));
        }
    });
}
