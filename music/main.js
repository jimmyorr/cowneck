let allSongs = [];
let filteredSongs = [];

// DOM Elements
const songsGrid = document.getElementById('songsGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const platformToggle = document.getElementById('platformToggle');
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
    platformToggle.addEventListener('change', renderGrid);
    
  } catch (error) {
    console.error("Failed to load likes.json", error);
    loading.innerText = "Error loading data. Make sure likes.json is in the public directory.";
  }
}

// URL Generators
function getVideoUrl(videoId) {
  const isMusic = platformToggle.checked;
  return isMusic 
    ? `https://music.youtube.com/watch?v=${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
}

function getChannelUrl(channelId) {
  const isMusic = platformToggle.checked;
  return isMusic
    ? `https://music.youtube.com/channel/${channelId}`
    : `https://www.youtube.com/channel/${channelId}`;
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
        <a href="${videoUrl}" target="_blank" class="thumbnail-container">
          <img src="${thumbnailUrl}" alt="${escapeHtml(song.title)}" class="thumbnail" loading="lazy" />
          <div class="play-overlay">
            <svg class="play-icon" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </a>
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
