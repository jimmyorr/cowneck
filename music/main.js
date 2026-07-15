let allSongs = [];
let filteredSongs = [];
let currentPage = 1;
const pageSize = 50;

// DOM Elements
const songsGrid = document.getElementById('songsGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const totalSongsCount = document.getElementById('totalSongsCount');
const topArtistsList = document.getElementById('topArtistsList');
const bottomPlayer = document.getElementById('bottomPlayer');
const playerThumbnail = document.getElementById('playerThumbnail');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const sentinel = document.getElementById('sentinel');
const chartContainer = document.getElementById('chartContainer');
const tabButtons = document.querySelectorAll('.tab-btn');
const hiddenGemsToggle = document.getElementById('hiddenGemsToggle');

let currentView = 'grid';
let chartInstance = null;

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    if (currentPage * pageSize < filteredSongs.length) {
      currentPage++;
      renderGrid(false);
    }
  }
}, { rootMargin: '200px' });

// Observe sentinel when available
if (sentinel) observer.observe(sentinel);

// YouTube Player Setup
let ytPlayer;
let isPlayerReady = false;

// Load YT IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('ytplayer', {
    height: '1',
    width: '1',
    videoId: '',
    playerVars: {
      'playsinline': 1,
      'autoplay': 1,
      'controls': 0
    },
    events: {
      'onReady': () => {
        isPlayerReady = true;
        playPauseBtn.disabled = false;
      },
      'onStateChange': onPlayerStateChange
    }
  });
};

function onPlayerStateChange(event) {
  // YT.PlayerState.PLAYING = 1
  if (event.data === 1) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
}

playPauseBtn.addEventListener('click', () => {
  if (!isPlayerReady || !ytPlayer) return;
  const state = ytPlayer.getPlayerState();
  if (state === 1) { // Playing
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
});

// Fetch data
async function init() {
  try {
    const response = await fetch('./likes.json');
    const data = await response.json();
    
    // Add original index to preserve 'recently liked' order
    allSongs = data.map((song, index) => ({ ...song, originalIndex: index }));
    filteredSongs = [...allSongs];
    
    updateStats();
    renderGrid(true);
    
    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    
    // Playback delegation
    songsGrid.addEventListener('click', handlePlayback);
    
    // Top Artist click filter
    topArtistsList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const artistName = li.querySelector('.artist-name').innerText;
      searchInput.value = artistName;
      handleSearch();
    });

    // Chart Toggle
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active tab styling
        tabButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        currentView = e.target.dataset.view;
        
        if (currentView === 'insights') {
          chartContainer.classList.remove('hidden');
          songsGrid.classList.add('hidden');
          sentinel.classList.add('hidden');
          renderChart();
        } else if (currentView === 'artists') {
          chartContainer.classList.remove('hidden');
          songsGrid.classList.add('hidden');
          sentinel.classList.add('hidden');
          renderArtistChart();
        } else {
          chartContainer.classList.add('hidden');
          songsGrid.classList.remove('hidden');
          sentinel.classList.remove('hidden');
        }
      });
    });
    
    // Hidden Gems Toggle
    hiddenGemsToggle.addEventListener('change', () => {
      handleSearch();
    });
    
  } catch (error) {
    console.error("Failed to load likes.json", error);
    loading.innerText = "Error loading data. Make sure likes.json is in the public directory.";
  }
}

// URL Generators
function getVideoUrl(videoId) {
  return `https://music.youtube.com/watch?v=${videoId}`;
}

function getChannelUrl(channelId) {
  return `https://music.youtube.com/channel/${channelId}`;
}

function getArtistColor(artistName) {
  if (!artistName) return '#ff0000';
  let hash = 0;
  for (let i = 0; i < artistName.length; i++) {
    hash = artistName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

// Render the Insights Chart
function renderChart() {
  if (chartInstance) chartInstance.destroy();
  
  const ctx = document.getElementById('insightsChart').getContext('2d');
  
  const scatterData = filteredSongs
    .map(song => ({
      x: allSongs.length - song.originalIndex,
      y: parseViews(song.views),
      song: song
    }))
    .filter(item => item.y > 0);

  chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Liked Songs',
        data: scatterData,
        backgroundColor: scatterData.map(item => getArtistColor(item.song.artist)),
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Chronological Order (Oldest → Newest)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          max: filteredSongs.length
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'Views' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const item = context.raw.song;
              return `${item.title} by ${item.artist} - ${item.views}`;
            }
          }
        },
        legend: { display: false }
      }
    }
  });
}

// Render the Artist Bubble Chart
function renderArtistChart() {
  if (chartInstance) chartInstance.destroy();
  
  const ctx = document.getElementById('insightsChart').getContext('2d');
  
  // Group by artist
  const artistMap = {};
  filteredSongs.forEach(song => {
    if (!song.artist || song.artist === "Unknown Artist") return;
    if (!artistMap[song.artist]) {
      artistMap[song.artist] = { count: 0, totalViews: 0, minIndex: song.originalIndex, maxIndex: song.originalIndex };
    }
    artistMap[song.artist].count += 1;
    artistMap[song.artist].totalViews += parseViews(song.views);
    if (song.originalIndex < artistMap[song.artist].minIndex) artistMap[song.artist].minIndex = song.originalIndex;
    if (song.originalIndex > artistMap[song.artist].maxIndex) artistMap[song.artist].maxIndex = song.originalIndex;
  });
  
  const topArtists = Object.entries(artistMap)
    .map(([artist, stats]) => ({
      artist: artist,
      count: stats.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topArtists.map(item => item.artist),
      datasets: [{
        label: 'Number of liked songs',
        data: topArtists.map(item => item.count),
        backgroundColor: topArtists.map(item => getArtistColor(item.artist)),
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Number of liked songs' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          grid: { display: false },
          ticks: { autoSkip: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Render the grid of song cards
function renderGrid(reset = true) {
  if (reset) {
    currentPage = 1;
    songsGrid.innerHTML = '';
  }

  loading.classList.add('hidden');
  
  if (filteredSongs.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }
  
  noResults.classList.add('hidden');
  
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageSongs = filteredSongs.slice(start, end);
  
  const html = pageSongs.map(song => {
    const videoUrl = getVideoUrl(song.video_id);
    const channelUrl = getChannelUrl(song.channel_id);
    const thumbnailUrl = `https://i.ytimg.com/vi/${song.video_id}/mqdefault.jpg`;
    
    return `
      <div class="song-card">
        <div class="thumbnail-container" data-video-id="${song.video_id}" data-thumbnail-url="${thumbnailUrl}" style="cursor: pointer;">
          <img src="${thumbnailUrl}" alt="${escapeHtml(song.title)}" class="thumbnail" loading="lazy" />
          <div class="play-overlay">
            <svg class="play-icon" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div class="song-info">
          <a href="${videoUrl}" target="_blank" class="song-title" title="${escapeHtml(song.title)}">
            ${escapeHtml(song.title)}
          </a>
          <a href="${channelUrl}" target="_blank" class="song-artist" title="${escapeHtml(song.artist)}">
            ${escapeHtml(song.artist)}
          </a>
          ${song.views ? `<span class="song-meta">${escapeHtml(song.views)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  if (reset) {
    songsGrid.innerHTML = html;
  } else {
    songsGrid.insertAdjacentHTML('beforeend', html);
  }
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // easeOutExpo for a really snappy but smooth slowdown
    const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = Math.floor(easeOut * (end - start) + start);
    obj.innerText = current.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerText = end.toLocaleString();
    }
  };
  window.requestAnimationFrame(step);
}

// Update sidebar stats
function updateStats() {
  const targetTotal = allSongs.length;
  animateValue(totalSongsCount, 0, targetTotal, 800);
  
  const artistCounts = {};
  allSongs.forEach(song => {
    if (song.artist && song.artist !== "Unknown Artist") {
      artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    }
  });
  
  const sortedArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100);
    
  topArtistsList.innerHTML = sortedArtists.map(([artist, count]) => `
    <li class="artist-item">
      <span class="artist-name" title="${escapeHtml(artist)}">${escapeHtml(artist)}</span>
      <span class="artist-count">${count}</span>
    </li>
  `).join('');
}

// Filter and sort the songs array
function filterAndSortSongs() {
  const searchTerm = searchInput.value.toLowerCase();
  const sortBy = sortSelect.value;
  const isHiddenGems = hiddenGemsToggle.checked;

  filteredSongs = allSongs.filter(song => {
    // Hidden Gems filter (< 100k views)
    if (isHiddenGems && parseViews(song.views) >= 100000) {
      return false;
    }
    const matchesSearch = song.title.toLowerCase().includes(searchTerm) || 
                          (song.artist && song.artist.toLowerCase().includes(searchTerm));
    return matchesSearch;
  });

  handleSort(false); // Sort but don't re-render here
}

// Handlers
function handleSearch() {
  currentPage = 1;
  filterAndSortSongs();
  renderGrid(true);
  if (currentView === 'insights') {
    renderChart();
  } else if (currentView === 'artists') {
    renderArtistChart();
  }
}

function handleSort(shouldRender = true) {
  const sortBy = sortSelect.value;
  
  filteredSongs.sort((a, b) => {
    switch (sortBy) {
      case 'titleAsc':
        return a.title.localeCompare(b.title);
      case 'titleDesc':
        return b.title.localeCompare(a.title);
      case 'artistAsc':
        return a.artist.localeCompare(b.artist);
      case 'viewsDesc':
        return parseViews(b.views) - parseViews(a.views);
      case 'recent':
      default:
        return a.originalIndex - b.originalIndex;
    }
  });
  if (shouldRender) {
    renderGrid(true);
    if (currentView === 'insights') {
      renderChart();
    } else if (currentView === 'artists') {
      renderArtistChart();
    }
  }
}

function handlePlayback(e) {
  const container = e.target.closest('.thumbnail-container');
  if (!container) return;

  const videoId = container.dataset.videoId;
  if (!videoId) return;
  
  // Find song details from allSongs or from closest elements
  const card = container.closest('.song-card');
  const title = card.querySelector('.song-title').innerText;
  const artist = card.querySelector('.song-artist').innerText;
  const thumbUrl = container.dataset.thumbnailUrl;

  // Show player
  bottomPlayer.classList.remove('hidden');

  // Update UI
  playerThumbnail.src = thumbUrl;
  playerTitle.innerText = title;
  playerArtist.innerText = artist;

  // Load and play video using API
  if (isPlayerReady && ytPlayer) {
    ytPlayer.loadVideoById(videoId);
  }
}

// Utilities
function parseViews(viewStr) {
  if (!viewStr) return 0;
  let numStr = viewStr.replace(/[^0-9.KMBkmb]/g, '');
  let multiplier = 1;
  if (numStr.toUpperCase().includes('K')) multiplier = 1000;
  if (numStr.toUpperCase().includes('M')) multiplier = 1000000;
  if (numStr.toUpperCase().includes('B')) multiplier = 1000000000;
  
  let val = parseFloat(numStr.replace(/[KMBkmb]/g, ''));
  return isNaN(val) ? 0 : val * multiplier;
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Start
init();
