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
const bottomPlayer = document.getElementById('bottomPlayer');
const playerThumbnail = document.getElementById('playerThumbnail');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');

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
    renderGrid();
    
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
    .slice(0, 100);
    
  topArtistsList.innerHTML = sortedArtists.map(([artist, count]) => `
    <li class="artist-item">
      <span class="artist-name" title="${escapeHtml(artist)}">${escapeHtml(artist)}</span>
      <span class="artist-count">${count}</span>
    </li>
  `).join('');
}

// Handlers
function handleSearch() {
  const query = searchInput.value.toLowerCase();
  filteredSongs = allSongs.filter(song => 
    song.title.toLowerCase().includes(query) || 
    song.artist.toLowerCase().includes(query)
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
