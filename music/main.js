let allSongs = [];
let filteredSongs = [];

// DOM Elements
const songsGrid = document.getElementById('songsGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const totalSongsCount = document.getElementById('totalSongsCount');
const topArtistsList = document.getElementById('topArtistsList');

// Fetch data
async function init() {
  try {
    const response = await fetch('./likes.json');
    const data = await response.json();
    
    // Add original index to preserve 'recently liked' order
    allSongs = data.map((song, index) => ({ ...song, originalIndex: index }));
    filteredSongs = [...allSongs];
    
    updateStats();
    renderGrid();
    
    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    
    // Playback delegation
    songsGrid.addEventListener('click', handlePlayback);
    
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

// Render the grid of song cards
function renderGrid() {
  loading.classList.add('hidden');
  
  if (filteredSongs.length === 0) {
    songsGrid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  
  noResults.classList.add('hidden');
  
  const html = filteredSongs.map(song => {
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
  
  songsGrid.innerHTML = html;
}

// Update sidebar stats
function updateStats() {
  totalSongsCount.innerText = allSongs.length.toLocaleString();
  
  const artistCounts = {};
  allSongs.forEach(song => {
    if (song.artist && song.artist !== "Unknown Artist") {
      artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    }
  });
  
  const sortedArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  topArtistsList.innerHTML = sortedArtists.map(([artist, count]) => `
    <li class="artist-item">
      <span class="artist-name" title="${escapeHtml(artist)}">${escapeHtml(artist)}</span>
      <span class="artist-count">${count}</span>
    </li>
  `).join('');
}

// Handlers
function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  filteredSongs = allSongs.filter(song => 
    song.title.toLowerCase().includes(term) || 
    song.artist.toLowerCase().includes(term)
  );
  handleSort(); // Re-apply sort after filtering
}

function handleSort() {
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
  
  renderGrid();
}

let currentlyPlayingContainer = null;

function handlePlayback(e) {
  const container = e.target.closest('.thumbnail-container');
  if (!container) return;

  const videoId = container.dataset.videoId;
  if (!videoId) return;

  // If clicking on the already playing container, ignore or stop? 
  // Let's just let the iframe handle its own pauses, so we do nothing if it's already playing.
  if (container.classList.contains('playing')) return;

  // Stop currently playing
  if (currentlyPlayingContainer && currentlyPlayingContainer !== container) {
    const oldThumbUrl = currentlyPlayingContainer.dataset.thumbnailUrl;
    currentlyPlayingContainer.innerHTML = `
      <img src="${oldThumbUrl}" class="thumbnail" loading="lazy" />
      <div class="play-overlay">
        <svg class="play-icon" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    `;
    currentlyPlayingContainer.classList.remove('playing');
  }

  // Play new one
  container.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  container.classList.add('playing');
  currentlyPlayingContainer = container;
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
