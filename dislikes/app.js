// --- Configuration ---
const CLIENT_ID = '932685095666-31l2s1psd94msj2a59d2ok7m4dfj3922.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';

// --- State ---
const state = {
    gapiInited: false,
    gisInited: false,
    tokenClient: null,
    isAuthenticated: false,
    videos: [],
    filteredVideos: [],
    loading: false,
    isLoadMore: false,
    error: null,
    searchTerm: '',
    debouncedSearchTerm: '',
    sortBy: 'date-new',
    nextPageToken: null
};

// --- DOM Elements ---
const dom = {
    authIndicator: document.getElementById('auth-indicator'),
    authButton: document.getElementById('auth-button'),
    authIconLoading: document.getElementById('auth-icon-loading'),
    authIconLogin: document.getElementById('auth-icon-login'),
    authText: document.getElementById('auth-text'),
    heroAuthButton: document.getElementById('hero-auth-button'),

    viewWelcome: document.getElementById('view-welcome'),
    viewContent: document.getElementById('view-content'),

    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),

    resultsCount: document.getElementById('results-count'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),

    contentLoader: document.getElementById('content-loader'),
    emptyState: document.getElementById('empty-state'),
    videoGrid: document.getElementById('video-grid'),

    scrollSentinel: document.getElementById('infinite-scroll-sentinel'),

    videoTemplate: document.getElementById('video-card-template')
};

// --- Initialization ---

function init() {
    initGapi();
    initGis();
    setupEventListeners();
    render();
}

function initGapi() {
    const checkGapi = setInterval(() => {
        if (window.gapi) {
            clearInterval(checkGapi);
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    state.gapiInited = true;
                    checkReady();
                } catch (err) {
                    console.error(err);
                    showError("Failed to initialize Google API client.");
                }
            });
        }
    }, 100);
}

function initGis() {
    const checkGis = setInterval(() => {
        if (window.google) {
            clearInterval(checkGis);
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: async (resp) => {
                    if (resp.error) {
                        showError('Authorization failed: ' + resp.error);
                        return;
                    }
                    state.isAuthenticated = true;
                    render();
                    fetchDislikes();
                },
            });
            state.tokenClient = client;
            state.gisInited = true;
            checkReady();
        }
    }, 100);
}

function checkReady() {
    if (state.gapiInited && state.gisInited) {
        render(); // Update UI to enable buttons
    }
}

function setupEventListeners() {
    dom.authButton.addEventListener('click', handleAuthClick);
    dom.heroAuthButton.addEventListener('click', handleAuthClick);

    const debouncedSearch = debounce((value) => {
        state.debouncedSearchTerm = value;
        filterVideos();
        render();
    }, 300);

    dom.searchInput.addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        debouncedSearch(e.target.value);
    });

    dom.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        filterVideos();
        render();
    });

    // Infinite Scroll Observer
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && state.nextPageToken && !state.loading && !state.debouncedSearchTerm) {
            handleLoadMore();
        }
    }, { threshold: 0.1 });

    observer.observe(dom.scrollSentinel);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function checkIfDeleted(video) {
    // Check for flags we might have set via onerror
    if (video._is404) return true;

    // Check status part (requires 'status' in part parameter)
    if (video.status) {
        if (video.status.uploadStatus === 'deleted' || video.status.uploadStatus === 'rejected') return true;
        if (video.status.privacyStatus === 'private') return true;
    }

    // Check for specific common localized strings or missing snippets
    if (!video.snippet) return true;

    const title = video.snippet.title || '';
    const lowerTitle = title.toLowerCase();

    // Common localized strings for deleted/private videos
    if (lowerTitle.includes('deleted video')) return true;
    if (lowerTitle.includes('private video')) return true;
    if (lowerTitle.includes('unavailable video')) return true;

    // Check for missing thumbnails
    if (!video.snippet.thumbnails || Object.keys(video.snippet.thumbnails).length === 0) return true;

    // Check for missing statistics
    if (!video.statistics || !video.statistics.viewCount) return true;

    return false;
}

function handleAuthClick() {
    if (state.tokenClient) {
        if (window.gapi.client.getToken() === null) {
            state.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            state.tokenClient.requestAccessToken({ prompt: '' });
        }
    }
}

// --- Logic ---

async function fetchDislikes(pageToken = null) {
    const isLoadMore = !!pageToken;
    setLoading(true, isLoadMore);
    setError(null);
    try {
        const response = await window.gapi.client.youtube.videos.list({
            'myRating': 'dislike',
            'part': 'snippet,contentDetails,statistics,status',
            'maxResults': 50,
            'pageToken': pageToken || ''
        });

        const items = response.result.items || [];
        const nextToken = response.result.nextPageToken || null;

        if (isLoadMore) {
            state.videos = [...state.videos, ...items];
        } else {
            state.videos = items;
        }

        state.nextPageToken = nextToken;
        filterVideos();
    } catch (err) {
        console.error("Fetch error", err);
        setError(err?.result?.error?.message || "Failed to fetch disliked videos.");
    } finally {
        setLoading(false, isLoadMore);
    }
}

function handleLoadMore() {
    if (state.nextPageToken) {
        fetchDislikes(state.nextPageToken);
    }
}

function filterVideos() {
    let results = [...state.videos];

    // Search
    if (state.debouncedSearchTerm) {
        const lower = state.debouncedSearchTerm.toLowerCase();
        results = results.filter(v =>
            v.snippet.title.toLowerCase().includes(lower) ||
            v.snippet.channelTitle.toLowerCase().includes(lower)
        );
    }

    // Sort
    results.sort((a, b) => {
        switch (state.sortBy) {
            case 'date-new':
                // YouTube returns myRating: dislike sorted by rating date desc by default
                // But if we want to be explicit, we rely on the order in state.videos
                // which is chronological from the API.
                return 0;
            case 'views-high':
                return parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount);
            case 'channel-az':
                return a.snippet.channelTitle.localeCompare(b.snippet.channelTitle);
            case 'title-az':
                return a.snippet.title.localeCompare(b.snippet.title);
            case 'deleted-first':
                const isADeleted = checkIfDeleted(a);
                const isBDeleted = checkIfDeleted(b);
                if (isADeleted && !isBDeleted) return -1;
                if (!isADeleted && isBDeleted) return 1;
                return 0;
            case 'content-type':
                const isAMusic = a.snippet?.categoryId === '10';
                const isBMusic = b.snippet?.categoryId === '10';
                if (!isAMusic && isBMusic) return -1;
                if (isAMusic && !isBMusic) return 1;
                return 0;
            default:
                return 0;
        }
    });

    state.filteredVideos = results;
}

function setLoading(isLoading, isLoadMore = false) {
    state.loading = isLoading;
    state.isLoadMore = isLoadMore;
    render();
}

function setError(err) {
    state.error = err;
    render();
}

function showError(msg) {
    setError(msg);
}

// --- Rendering ---

function render() {
    const isReady = state.gapiInited && state.gisInited;
    const isLoadMore = state.isLoadMore;

    // Auth Buttons
    if (isReady) {
        dom.authButton.disabled = false;
        dom.authButton.classList.remove('bg-slate-200', 'text-slate-400', 'cursor-not-allowed');
        dom.authButton.classList.add('bg-slate-900', 'text-white', 'hover:bg-slate-800', 'shadow-md', 'hover:shadow-lg');

        dom.heroAuthButton.disabled = false;
        dom.heroAuthButton.textContent = 'Connect YouTube account';
        dom.heroAuthButton.classList.remove('bg-slate-200', 'text-slate-400');
        dom.heroAuthButton.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700', 'shadow-xl', 'shadow-red-200');

        dom.authIconLoading.classList.add('hidden');
        dom.authIconLogin.classList.remove('hidden');
        dom.authText.textContent = 'Sign in';
    } else {
        dom.authButton.disabled = true;
        dom.heroAuthButton.disabled = true;
        dom.heroAuthButton.textContent = 'Initializing...';

        dom.authIconLoading.classList.remove('hidden');
        dom.authIconLogin.classList.add('hidden');
        dom.authText.textContent = 'Loading API...';
    }

    // Auth State Views
    if (state.isAuthenticated) {
        dom.viewWelcome.classList.add('hidden');
        dom.viewContent.classList.remove('hidden');

        dom.authIndicator.classList.remove('hidden');

        // Hide sign-in button in header when authenticated if desired, 
        // but user might want to switch accounts. 
        // Current design keeps it but maybe we change text?
        // For now, let's just update the views.
        dom.authButton.classList.add('hidden'); // Hide header login button when auth'd
    } else {
        dom.viewWelcome.classList.remove('hidden');
        dom.viewContent.classList.add('hidden');
        dom.authIndicator.classList.add('hidden');
        dom.authButton.classList.remove('hidden');
    }

    // Error
    if (state.error) {
        dom.errorContainer.classList.remove('hidden');
        dom.errorMessage.textContent = state.error;
    } else {
        dom.errorContainer.classList.add('hidden');
    }

    // Results Count
    dom.resultsCount.textContent = `Showing ${state.filteredVideos.length} videos`;

    // Loading & Empty States
    if (state.isAuthenticated) {
        if (state.loading && !isLoadMore) {
            dom.contentLoader.classList.remove('hidden');
            dom.emptyState.classList.add('hidden');
            dom.videoGrid.classList.add('hidden');
        } else if (state.videos.length === 0) {
            dom.contentLoader.classList.add('hidden');
            dom.emptyState.classList.remove('hidden');
            dom.videoGrid.classList.add('hidden');
            // If we have videos but matched 0 with filter, we should show grid empty or different message?
            // The original code showed "No disliked videos found" only if videos.length === 0
            // If filteredVideos is empty but videos has items, we just show empty grid.
        } else {
            dom.contentLoader.classList.add('hidden');
            dom.emptyState.classList.add('hidden');
            dom.videoGrid.classList.remove('hidden');

            // Re-render the full list to ensure sorting/filtering is accurate
            renderVideoList();
        }

        // Infinite Scroll Sentinel
        if (state.nextPageToken && !state.debouncedSearchTerm) {
            dom.scrollSentinel.classList.remove('hidden');
        } else {
            dom.scrollSentinel.classList.add('hidden');
        }
    }
}

function renderVideoList() {
    dom.videoGrid.innerHTML = '';

    state.filteredVideos.forEach(video => {
        const clone = dom.videoTemplate.content.cloneNode(true);

        const title = video.snippet.title;
        const isDeleted = checkIfDeleted(video);
        const isMusic = video.snippet.categoryId === '10';
        const thumbnail = video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url;
        const viewCount = video.statistics?.viewCount
            ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(video.statistics.viewCount)
            : 'N/A';

        // Image & Link
        const img = clone.querySelector('.video-thumbnail');
        const overlay = clone.querySelector('.deleted-overlay');

        img.src = thumbnail || '';
        img.alt = title;

        if (isDeleted) {
            overlay.classList.remove('hidden');
        }

        // 404 check (thumbnail doesn't exist)
        img.onerror = () => {
            if (!video._is404) {
                video._is404 = true;
                // If the user is currently sorting by deleted, we should refresh the list
                if (state.sortBy === 'deleted-first') {
                    filterVideos();
                    renderVideoList();
                }
            }
            overlay.classList.remove('hidden');
            img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // Transparent pixel
        };

        const link = clone.querySelector('.video-link');
        link.href = `https://www.youtube.com/watch?v=${video.id}`;

        // Title & Music Icon
        const titleEl = clone.querySelector('.video-title');
        titleEl.innerHTML = highlightMatch(title, state.debouncedSearchTerm);

        if (isMusic) {
            clone.querySelector('.music-badge').classList.remove('hidden');
        }

        // Channel Info
        const channelEl = clone.querySelector('.channel-title');
        channelEl.innerHTML = highlightMatch(video.snippet.channelTitle || 'Unknown channel', state.debouncedSearchTerm);
        clone.querySelector('.view-count').textContent = isDeleted ? 'No stats available' : `${viewCount} views`;

        dom.videoGrid.appendChild(clone);
    });
}

function highlightMatch(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-red-100 text-red-700 px-0.5 rounded">$1</mark>');
}

// Start
init();
