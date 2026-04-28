// ==================== SEARCH FUNCTION ====================
// Search for songs and artists by keyword
const searchContent = async (keyword) => {
    if (!keyword) return;

    try {
        const response = await fetch(`/api/songs/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        const songs = data.songs || [];
        const artists = data.artists || [];

        const songResultsSection = document.getElementById('songResultsSection');
        const artistResultsSection = document.getElementById('artistResultsSection');
        const songResults = document.getElementById('songResults');
        const artistResults = document.getElementById('artistResults');
        const noResults = document.getElementById('noResults');

        // Hide all sections first
        songResultsSection.style.display = 'none';
        artistResultsSection.style.display = 'none';
        noResults.style.display = 'none';

        // If no results at all
        if (songs.length === 0 && artists.length === 0) {
            noResults.style.display = 'block';
            return;
        }

        // ==================== DISPLAY SONGS ====================
        if (songs.length > 0) {
            songResultsSection.style.display = 'block';
            songResults.innerHTML = '';

            songs.forEach(song => {
                const row = document.createElement('div');
                row.classList.add('song-row');

                row.innerHTML = `
                    <img
                        src="${song.image !== 'default-song.png' ? '/uploads/images/' + song.image : '/uploads/images/default-song.png'}"
                        alt="${song.name}"
                        onerror="this.src='/uploads/images/default-song.png'"
                    />
                    <div class="song-info">
                        <div class="song-name">${song.name}</div>
                        <div class="song-artist">${song.artist ? song.artist.name : 'Unknown'}</div>
                    </div>
                    <div class="song-genre">${song.genre}</div>
                `;

                // Play song when clicked
                row.addEventListener('click', () => {
                    const currentToken = localStorage.getItem('token');
                    if (!currentToken) {
                        document.getElementById('loginWallOverlay').classList.add('visible');
                        return;
                    }
                    window.playSong(song, songs);
                });

                songResults.appendChild(row);
            });
        }

        // ==================== DISPLAY ARTISTS ====================
        if (artists.length > 0) {
            artistResultsSection.style.display = 'block';
            artistResults.innerHTML = '';

            artists.forEach(artist => {
                const card = document.createElement('a');
                card.classList.add('artist-card');
                card.href = `artist.html?id=${artist._id}`;

                card.innerHTML = `
                    <img
                        src="${artist.profileImage !== 'default-artist.png' ? '/uploads/images/' + artist.profileImage : '/uploads/images/default-artist.png'}"
                        alt="${artist.name}"
                        onerror="this.src='/uploads/images/default-artist.png'"
                    />
                    <div class="artist-info">
                        <div class="artist-name">${artist.name}</div>
                        <div class="artist-type">Artist</div>
                    </div>
                `;

                artistResults.appendChild(card);
            });
        }

    } catch (error) {
        console.error('Search failed:', error);
    }
};

// ==================== NAVBAR SEARCH INPUT ====================
// Listen for typing in the navbar search bar on the search page
const navSearchInput = document.getElementById('navSearchInput');
if (navSearchInput) {
    let searchTimeout;
    navSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const keyword = navSearchInput.value.trim();
            if (keyword) {
                searchContent(keyword);
            } else {
                document.getElementById('songResultsSection').style.display = 'none';
                document.getElementById('artistResultsSection').style.display = 'none';
                document.getElementById('noResults').style.display = 'none';
            }
        }, 400);
    });
}

// ==================== AUTO SEARCH FROM URL ====================
// When redirected from navbar search, auto run the search
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKeyword = urlParams.get('keyword');
    if (urlKeyword) {
        const navInput = document.getElementById('navSearchInput');
        if (navInput) navInput.value = urlKeyword;
        setTimeout(() => searchContent(urlKeyword), 100);
    }
});