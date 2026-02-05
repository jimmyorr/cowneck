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
    nextPageToken: null,
    totalResults: null,
    showInsights: false,
    isFetchAll: false
};

// --- DOM Elements ---
const dom = {
    authIndicator: document.getElementById('auth-indicator'),
    authButton: document.getElementById('auth-button'),
    authText: document.getElementById('auth-text'),
    heroAuthButton: document.getElementById('hero-auth-button'),
    signoutButton: document.getElementById('signout-button'),

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
    copyIdsButton: document.getElementById('copy-ids-button'),
    loadAllButton: document.getElementById('load-all-button'),
    insightsToggle: document.getElementById('insights-toggle'),
    analyticsContainer: document.getElementById('analytics-container'),
    topChannelsList: document.getElementById('top-channels-list'),
    categoriesList: document.getElementById('categories-list'),

    scrollSentinel: document.getElementById('infinite-scroll-sentinel'),

    backToTop: document.getElementById('back-to-top'),

    videoTemplate: document.getElementById('video-card-template'),
    skeletonTemplate: document.getElementById('skeleton-template')
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
                    saveToken(resp);
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

function saveToken(resp) {
    const tokenData = {
        ...resp,
        expires_at: Date.now() + (resp.expires_in * 1000)
    };
    localStorage.setItem('yt_dislikes_token', JSON.stringify(tokenData));
}

function loadToken() {
    const data = localStorage.getItem('yt_dislikes_token');
    if (!data) return null;
    try {
        const tokenData = JSON.parse(data);
        // If it's expiring in less than 5 minutes, consider it expired
        if (Date.now() > (tokenData.expires_at - 300000)) {
            localStorage.removeItem('yt_dislikes_token');
            return null;
        }
        return tokenData;
    } catch (e) {
        return null;
    }
}

function checkReady() {
    if (state.gapiInited && state.gisInited) {
        const token = loadToken();
        if (token && !state.isAuthenticated) {
            window.gapi.client.setToken(token);
            state.isAuthenticated = true;
            render();
            fetchDislikes();
        } else {
            render(); // Update UI to enable buttons
        }
    }
}

function setupEventListeners() {
    dom.authButton.addEventListener('click', handleAuthClick);
    dom.heroAuthButton.addEventListener('click', handleAuthClick);
    dom.signoutButton.addEventListener('click', handleSignout);

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

    dom.copyIdsButton.addEventListener('click', handleCopyIds);
    dom.loadAllButton.addEventListener('click', handleLoadAll);
    dom.insightsToggle.addEventListener('click', () => {
        state.showInsights = !state.showInsights;
        render();
    });

    // Infinite Scroll Observer
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && state.nextPageToken && !state.loading && !state.debouncedSearchTerm) {
            handleLoadMore();
        }
    }, { threshold: 0.1 });

    observer.observe(dom.scrollSentinel);

    // Back to Top Logic
    dom.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            dom.backToTop.classList.remove('opacity-0', 'pointer-events-none');
            dom.backToTop.classList.add('opacity-100');
        } else {
            dom.backToTop.classList.add('opacity-0', 'pointer-events-none');
            dom.backToTop.classList.remove('opacity-100');
        }
    });
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
        // Use prompt: '' to avoid forcing the consent screen if already granted
        state.tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignout() {
    // Clear Google API token
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            console.log('Token revoked');
        });
        window.gapi.client.setToken(null);
    }

    // Clear local storage
    localStorage.removeItem('yt_dislikes_token');

    // Reset state
    state.isAuthenticated = false;
    state.videos = [];
    state.filteredVideos = [];
    state.nextPageToken = null;
    state.searchTerm = '';
    state.debouncedSearchTerm = '';

    // Clear UI
    dom.searchInput.value = '';

    render();
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
        const total = response.result.pageInfo?.totalResults || null;

        if (isLoadMore) {
            state.videos = [...state.videos, ...items];
        } else {
            state.videos = items;
        }

        state.nextPageToken = nextToken;
        state.totalResults = total;
        filterVideos();

        // If we are in "Load All" mode, fetch the next page immediately
        if (state.isFetchAll) {
            if (state.nextPageToken) {
                fetchDislikes(state.nextPageToken);
            } else {
                state.isFetchAll = false;
                triggerCelebration();
            }
        }
    } catch (err) {
        console.error("Fetch error", err);
        if (err?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('yt_dislikes_token');
            state.isAuthenticated = false;
            render();
        }
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

function handleLoadAll() {
    if (state.nextPageToken && !state.loading) {
        state.isFetchAll = true;
        fetchDislikes(state.nextPageToken);
    }
}

async function handleCopyIds() {
    if (state.filteredVideos.length === 0) return;

    const ids = state.filteredVideos.map(v => v.id).join('\n');

    try {
        await navigator.clipboard.writeText(ids);

        // Visual feedback
        const originalBg = dom.copyIdsButton.innerHTML;
        dom.copyIdsButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
        `;
        dom.copyIdsButton.classList.add('border-green-500');

        setTimeout(() => {
            dom.copyIdsButton.innerHTML = originalBg;
            dom.copyIdsButton.classList.remove('border-green-500');
        }, 2000);

    } catch (err) {
        console.error('Failed to copy IDs:', err);
        showError('Failed to copy to clipboard.');
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
            case 'duration-long':
                return parseDuration(b.contentDetails.duration) - parseDuration(a.contentDetails.duration);
            case 'upload-old':
                return new Date(a.snippet.publishedAt) - new Date(b.snippet.publishedAt);
            case 'comments-most':
                return parseInt(b.statistics.commentCount || 0) - parseInt(a.statistics.commentCount || 0);
            case 'views-high':
                return parseInt(b.statistics.viewCount || 0) - parseInt(a.statistics.viewCount || 0);
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
        dom.authButton.classList.remove('opacity-50', 'cursor-not-allowed');

        dom.heroAuthButton.disabled = false;
        dom.heroAuthButton.textContent = 'Connect YouTube account';
        dom.heroAuthButton.classList.remove('opacity-50');

        dom.authText.textContent = 'Sign in';
    } else {
        dom.authButton.disabled = true;
        dom.heroAuthButton.disabled = true;
        dom.heroAuthButton.textContent = 'Initializing...';
        dom.authText.textContent = 'Loading...';
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
    let countText = '';
    const currentCount = state.filteredVideos.length;
    const totalCount = state.totalResults;
    const fmt = (n) => new Intl.NumberFormat().format(n);

    if (!state.debouncedSearchTerm) {
        if (state.nextPageToken) {
            if (totalCount && totalCount > currentCount) {
                countText = `${fmt(currentCount)} of about ${fmt(totalCount)} videos loaded · Scroll for more`;
            } else {
                countText = `${fmt(currentCount)} videos loaded · Scroll for more`;
            }
        } else {
            countText = `All ${fmt(currentCount)} videos loaded`;
        }
    } else {
        countText = `Found ${fmt(currentCount)} videos`;
    }

    dom.resultsCount.textContent = countText;

    // Load All Button State
    if (state.nextPageToken && !state.debouncedSearchTerm) {
        dom.loadAllButton.classList.remove('hidden');
        if (state.isFetchAll) {
            dom.loadAllButton.textContent = 'Loading all...';
            dom.loadAllButton.disabled = true;
            dom.loadAllButton.classList.add('opacity-50');
        } else {
            dom.loadAllButton.textContent = 'Load all';
            dom.loadAllButton.disabled = false;
            dom.loadAllButton.classList.remove('opacity-50');
        }
    } else {
        dom.loadAllButton.classList.add('hidden');
    }

    // Insights State
    if (state.showInsights) {
        dom.analyticsContainer.classList.remove('hidden');
        dom.insightsToggle.classList.add('bg-black', 'text-white');
        renderAnalytics();
    } else {
        dom.analyticsContainer.classList.add('hidden');
        dom.insightsToggle.classList.remove('bg-black', 'text-white');
    }

    // Loading & Empty States
    if (state.isAuthenticated) {
        if (state.loading && !isLoadMore) {
            dom.emptyState.classList.add('hidden');
            dom.videoGrid.classList.remove('hidden');
            renderSkeletons();
        } else if (state.videos.length === 0) {
            dom.emptyState.classList.remove('hidden');
            dom.videoGrid.classList.add('hidden');
        } else {
            dom.emptyState.classList.add('hidden');
            dom.videoGrid.classList.remove('hidden');

            // Re-render the full list to ensure sorting/filtering is accurate
            renderVideoList();
        }

        // Infinite Scroll Sentinel
        if (state.nextPageToken && !state.debouncedSearchTerm) {
            dom.scrollSentinel.classList.remove('hidden');
            if (state.loading && isLoadMore) {
                dom.scrollSentinel.innerHTML = `
                    <div class="loading-spinner inline-block w-4 h-4 border-2 border-gray-100 border-t-gray-400 rounded-full mr-2 align-middle"></div>
                    <span>Loading more...</span>
                `;
            } else {
                dom.scrollSentinel.textContent = 'Scroll for more';
            }
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
        const chName = video.snippet.channelTitle || 'Unknown channel';
        const chId = video.snippet.channelId;

        if (chId && !isDeleted) {
            channelEl.innerHTML = `<a href="https://www.youtube.com/channel/${chId}" target="_blank" class="hover:text-black hover:underline">${highlightMatch(chName, state.debouncedSearchTerm)}</a>`;
        } else {
            channelEl.innerHTML = highlightMatch(chName, state.debouncedSearchTerm);
        }

        // Dynamic Metadata
        const metadataEl = clone.querySelector('.dynamic-metadata');
        metadataEl.textContent = isDeleted ? 'No stats' : getDynamicMetadata(video);

        dom.videoGrid.appendChild(clone);
    });
}

function triggerCelebration() {
    if (window.confetti) {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#000000', '#666666']
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#000000', '#666666']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

function renderSkeletons() {
    dom.videoGrid.innerHTML = '';
    // Show 12 skeleton cards (typical grid count)
    for (let i = 0; i < 12; i++) {
        const clone = dom.skeletonTemplate.content.cloneNode(true);
        dom.videoGrid.appendChild(clone);
    }
}

function renderAnalytics() {
    if (state.videos.length === 0) return;

    const data = calculateAnalytics();

    // Render Top Channels
    dom.topChannelsList.innerHTML = data.topChannels.map(ch => {
        const display = ch.id ?
            `<a href="https://www.youtube.com/channel/${ch.id}" target="_blank" class="hover:underline truncate pr-2">${ch.name}</a>` :
            `<span class="truncate pr-2">${ch.name}</span>`;

        return `
            <div class="flex justify-between items-center text-sm">
                ${display}
                <span class="font-medium bg-gray-200 px-1.5 rounded text-[10px]">${ch.count}</span>
            </div>
        `;
    }).join('');

    const categoryNames = {
        '1': 'Film', '2': 'Autos', '10': 'Music', '15': 'Pets', '17': 'Sports',
        '20': 'Gaming', '22': 'Blogs', '23': 'Comedy', '24': 'Entertainment',
        '25': 'News', '26': 'Howto', '27': 'Education', '28': 'Tech',
        'deleted': 'Unavailable'
    };

    dom.categoriesList.innerHTML = data.topCategories.map(cat => `
        <div class="space-y-1">
            <div class="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                <span>${categoryNames[cat.id] || 'Other'}</span>
                <span>${Math.round(cat.percent)}%</span>
            </div>
            <div class="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                <div class="bg-gray-400 h-full" style="width: ${cat.percent}%"></div>
            </div>
        </div>
    `).join('');
}

function calculateAnalytics() {
    const channels = {};
    const categories = {};

    state.videos.forEach(v => {
        const isDeleted = checkIfDeleted(v);

        // Channels
        const chName = (isDeleted && !v.snippet?.channelTitle) ? 'Unavailable' : (v.snippet?.channelTitle || 'Unknown');
        const chId = v.snippet?.channelId;

        if (!channels[chName]) {
            channels[chName] = { count: 0, id: isDeleted ? null : chId };
        }
        channels[chName].count++;

        // Categories
        const catId = isDeleted ? 'deleted' : (v.snippet?.categoryId || 'unknown');
        categories[catId] = (categories[catId] || 0) + 1;
    });

    const topChannels = Object.entries(channels)
        .map(([name, info]) => ({ name, count: info.count, id: info.id }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const topCategories = Object.entries(categories)
        .map(([id, count]) => ({ id, count, percent: (count / state.videos.length) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    return { topChannels, topCategories };
}

function getDynamicMetadata(video) {
    const compact = (n) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(n || 0);
    const full = (n) => new Intl.NumberFormat('en-US').format(n || 0);

    switch (state.sortBy) {
        case 'views-high':
            return `${compact(video.statistics?.viewCount)} views`;
        case 'duration-long':
            return formatDuration(video.contentDetails?.duration);
        case 'upload-old':
            return new Date(video.snippet?.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        case 'comments-most':
            return `${compact(video.statistics?.commentCount)} comments`;
        default:
            // For Recent, Channel, Title, Deleted, etc.
            return `${compact(video.statistics?.viewCount)} views`;
    }
}

function formatDuration(duration) {
    if (!duration) return '0:00';
    const totalSeconds = parseDuration(duration);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `;
    }
    return `${m}:${s.toString().padStart(2, '0')} `;
}

function highlightMatch(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function parseDuration(duration) {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

// Start
init();
