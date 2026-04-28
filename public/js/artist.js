// ==================== ARTIST PAGE SETUP ====================
const token = localStorage.getItem('token');

// Get artist ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const artistId = urlParams.get('id');

// Redirect to home if no artist ID is provided
if (!artistId) {
    window.location.href = 'index.html';
}

// ==================== LOAD ARTIST DETAILS ====================
const loadArtist = async () => {
    try {
        // Fetch artist details from API
        const response = await fetch(`/api/artists/${artistId}`);

        if (!response.ok) {
            window.location.href = 'index.html';
            return;
        }

        const artist = await response.json();

        // Update page title
        document.title = `Hexagon - ${artist.name}`;

        // Update artist header info
        document.getElementById('artistName').textContent = artist.name;
        document.getElementById('artistDescription').textContent = artist.description;
        document.getElementById('artistFollowers').textContent =
            `${artist.followers.toLocaleString()} followers`;

        // Update artist image
        const artistImage = document.getElementById('artistImage');
        if (artist.profileImage && artist.profileImage !== 'default-artist.png') {
            artistImage.src = `/uploads/images/${artist.profileImage}`;
        } else {
            artistImage.src = '/uploads/images/default-artist.png';
        }
        artistImage.onerror = () => {
            artistImage.src = '/uploads/images/default-artist.png';
        };

        // Update background gradient with a darker color
        document.getElementById('artistHeader').style.background =
            'linear-gradient(180deg, #535353 0%, #121212 100%)';

    } catch (error) {
        console.error('Failed to load artist:', error);
    }
};

// ==================== LOAD ARTIST SONGS ====================
const loadArtistSongs = async () => {
    try {
        // Search for all songs by this artist
        const response = await fetch(`/api/songs/search?keyword=${artistId}`);
        const data = await response.json();

        // Get songs where artist ID matches
        const allSongsResponse = await fetch('/api/songs');
        const allSongs = await allSongsResponse.json();

        // Filter songs that belong to this artist
        const artistSongs = allSongs.filter(song =>
            song.artist && song.artist._id === artistId
        );

        const songsList = document.getElementById('artistSongsList');
        songsList.innerHTML = '';

        // Show message if no songs found
        if (artistSongs.length === 0) {
            songsList.innerHTML = `
                <p style="color: #b3b3b3; font-size: 14px;">
                    No songs uploaded yet
                </p>
            `;
            return;
        }

        // Display each song
        artistSongs.forEach(song => {
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
                    <div class="song-genre">${song.genre}</div>
                </div>
                <div class="song-streams">${song.streamCount.toLocaleString()} streams</div>
            `;

            // Play song when clicked
            row.addEventListener('click', () => {
                if (!token) {
                    document.getElementById('loginWallOverlay').classList.add('visible');
                    return;
                }
                window.playSong(song, artistSongs);
            });

            songsList.appendChild(row);
        });

    } catch (error) {
        console.error('Failed to load artist songs:', error);
    }
};

// ==================== FOLLOW / UNFOLLOW ====================
const loadFollowStatus = async () => {
    // Only check follow status if user is logged in
    if (!token) return;

    try {
        const response = await fetch(`/api/artists/${artistId}/follow-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const followBtn = document.getElementById('followBtn');

        // Update button based on follow status
        if (data.isFollowing) {
            followBtn.textContent = 'Following';
            followBtn.classList.add('following');
        } else {
            followBtn.textContent = 'Follow';
            followBtn.classList.remove('following');
        }

    } catch (error) {
        console.error('Failed to load follow status:', error);
    }
};

// Handle follow / unfollow button click
document.getElementById('followBtn').addEventListener('click', async () => {
    if (!token) {
        document.getElementById('loginWallOverlay').classList.add('visible');
        return;
    }

    try {
        const response = await fetch(`/api/artists/${artistId}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const followBtn = document.getElementById('followBtn');

        // Update button and follower count based on new follow status
        if (data.isFollowing) {
            followBtn.textContent = 'Following';
            followBtn.classList.add('following');
        } else {
            followBtn.textContent = 'Follow';
            followBtn.classList.remove('following');
        }

        // Reload artist to update follower count
        loadArtist();

        // Reload library to reflect follow change
        loadLibrary();

    } catch (error) {
        console.error('Failed to follow/unfollow artist:', error);
    }
});

// ==================== LOAD ARTIST PLAYLISTS ====================
const loadArtistPlaylists = async () => {
    try {
        const response = await fetch('/api/playlists/public');
        const playlists = await response.json();

        // Filter playlists where publisher matches this artist
        const artistPlaylists = playlists.filter(playlist =>
            playlist.publisher && playlist.publisher._id === artistId
        );

        // Hide section if no playlists found
        if (artistPlaylists.length === 0) return;

        // Show the section
        document.getElementById('artistPlaylistsSection').style.display = 'block';

        const grid = document.getElementById('artistPlaylistsGrid');
        grid.innerHTML = '';

        artistPlaylists.forEach(playlist => {
            const card = document.createElement('a');
            card.classList.add('card');
            card.href = `playlist.html?id=${playlist._id}`;

            card.innerHTML = `
                <img
                    src="${playlist.image !== 'default-playlist.png' ? '/uploads/images/' + playlist.image : '/uploads/images/default-playlist.png'}"
                    alt="${playlist.name}"
                    onerror="this.src='/uploads/images/default-playlist.png'"
                />
                <div class="card-name">${playlist.name}</div>
                <div class="card-desc">${playlist.songs.length} songs</div>
            `;

            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Failed to load artist playlists:', error);
    }
};

// ==================== INITIALIZE ====================
// Load all artist data when page loads
loadArtist();
loadArtistSongs();
loadFollowStatus();
loadArtistPlaylists();