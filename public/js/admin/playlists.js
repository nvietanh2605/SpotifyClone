// ==================== CHECK ADMIN ACCESS ====================
// Redirect to login if no token or user is not admin
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') {
    window.location.href = '../login.html';
}

// ==================== VARIABLES ====================
// Store the created playlist ID after creation
let createdPlaylistId = null;

// ==================== HELPER FUNCTIONS ====================
// Show success alert message
const showSuccess = (message) => {
    const alert = document.getElementById('successAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 6000);
};

// Show error alert message
const showError = (message) => {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

// ==================== LOAD ARTISTS INTO DROPDOWN ====================
// Fetch all artists and populate the publisher dropdown
const loadArtists = async () => {
    try {
        const response = await fetch('/api/artists', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const artists = await response.json();
        const publisherSelect = document.getElementById('publisherSelect');

        if (!publisherSelect) return;

        // Add each artist as an option in the dropdown
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist._id;
            option.textContent = artist.name;
            publisherSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load artists:', error);
    }
};

// ==================== IMAGE PREVIEW ====================
// Show a preview of the selected playlist image
const playlistImage = document.getElementById('playlistImage');

if (playlistImage) {
    playlistImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('imagePreview');
                preview.src = event.target.result;
                preview.classList.add('visible');
            };
            reader.readAsDataURL(file);
        }
    });
}

// ==================== CREATE PLAYLIST ====================
const createPlaylistBtn = document.getElementById('createPlaylistBtn');

if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', async () => {
        // Get values from input fields
        const name = document.getElementById('playlistName').value.trim();
        const publisher = document.getElementById('publisherSelect').value;
        const imageFile = document.getElementById('playlistImage').files[0];

        // Check if playlist name is provided
        if (!name) {
            showError('Please enter a playlist name');
            return;
        }

        // Check if publisher is selected
        if (!publisher) {
            showError('Please select a publisher artist');
            return;
        }

        // Create FormData to send text and file together
        const formData = new FormData();
        formData.append('name', name);
        formData.append('publisher', publisher);

        // Only append image if one was selected
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            // Disable button and show loading state
            createPlaylistBtn.disabled = true;
            createPlaylistBtn.textContent = 'Creating...';

            // Send request to backend
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.message);
                // Re-enable button if there was an error
                createPlaylistBtn.disabled = false;
                createPlaylistBtn.textContent = 'Create Playlist';
                return;
            }

            // Store the created playlist ID
            createdPlaylistId = data.playlist._id;

            // Show the playlist builder section first
            document.getElementById('playlistBuilder').style.display = 'block';

            // Show success notification after a short delay so it is visible
            setTimeout(() => {
                showSuccess('Playlist created successfully! Now add songs to it.');
            }, 100);

            // Permanently disable the create form to prevent creating another playlist
            createPlaylistBtn.disabled = true;
            createPlaylistBtn.textContent = 'Playlist Created';
            document.getElementById('playlistName').disabled = true;
            document.getElementById('playlistImage').disabled = true;
            document.getElementById('publisherSelect').disabled = true;

        } catch (error) {
            showError('Failed to create playlist. Please try again.');
            // Re-enable button if there was an error
            createPlaylistBtn.disabled = false;
            createPlaylistBtn.textContent = 'Create Playlist';
        }
    });
}

// ==================== SEARCH SONGS ====================
// Search for songs to add to the playlist
const songSearchBtn = document.getElementById('songSearchBtn');

if (songSearchBtn) {
    songSearchBtn.addEventListener('click', () => {
        const keyword = document.getElementById('songSearchInput').value.trim();
        searchSongs(keyword);
    });

    // Also search when Enter key is pressed
    document.getElementById('songSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const keyword = document.getElementById('songSearchInput').value.trim();
            searchSongs(keyword);
        }
    });
}

// Fetch songs matching the keyword and display results
const searchSongs = async (keyword) => {
    if (!keyword) {
        showError('Please enter a search keyword');
        return;
    }

    try {
        const response = await fetch(`/api/songs/search?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const songs = data.songs || [];
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '';

        // If no results found
        if (songs.length === 0) {
            resultsDiv.innerHTML = '<p style="color: #b3b3b3; font-size: 14px;">No songs found</p>';
            return;
        }

        // Display each song result with an Add button
        songs.forEach(song => {
            const row = document.createElement('div');
            row.classList.add('song-result-row');

            row.innerHTML = `
                <div class="song-info">
                    <img
                        src="${song.image !== 'default-song.png' ? '/uploads/images/' + song.image : '/uploads/images/default-song.png'}"
                        alt="${song.name}"
                        onerror="this.src='/uploads/images/default-song.png'"
                    />
                    <div>
                        <div class="song-name">${song.name}</div>
                        <div class="song-artist">${song.artist ? song.artist.name : 'Unknown'}</div>
                    </div>
                </div>
                <button class="add-btn" data-song-id="${song._id}" data-song-name="${song.name}" data-song-artist="${song.artist ? song.artist.name : 'Unknown'}" data-song-image="${song.image}">
                    Add
                </button>
            `;

            resultsDiv.appendChild(row);
        });

        // Add event listeners to all Add buttons
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', () => addSongToPlaylist(
                btn.dataset.songId,
                btn.dataset.songName,
                btn.dataset.songArtist,
                btn.dataset.songImage
            ));
        });

    } catch (error) {
        showError('Failed to search songs. Please try again.');
    }
};

// ==================== ADD SONG TO PLAYLIST ====================
// Add a selected song to the created playlist
const addSongToPlaylist = async (songId, songName, songArtist, songImage) => {
    if (!createdPlaylistId) {
        showError('Please create a playlist first');
        return;
    }

    try {
        const response = await fetch(`/api/playlists/${createdPlaylistId}/songs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ songId })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message);
            return;
        }

        // Show the added song in the playlist songs list
        const playlistSongsDiv = document.getElementById('playlistSongs');

        const row = document.createElement('div');
        row.classList.add('song-result-row');
        row.dataset.songId = songId;

        row.innerHTML = `
            <div class="song-info">
                <img
                    src="${songImage !== 'default-song.png' ? '/uploads/images/' + songImage : '/uploads/images/default-song.png'}"
                    alt="${songName}"
                    onerror="this.src='/uploads/images/default-song.png'"
                />
                <div>
                    <div class="song-name">${songName}</div>
                    <div class="song-artist">${songArtist}</div>
                </div>
            </div>
            <button class="remove-btn" data-song-id="${songId}">Remove</button>
        `;

        playlistSongsDiv.appendChild(row);

        // Add event listener to remove button
        row.querySelector('.remove-btn').addEventListener('click', () => {
            removeSongFromPlaylist(songId, row);
        });

        showSuccess(`${songName} added to playlist`);

    } catch (error) {
        showError('Failed to add song. Please try again.');
    }
};

// ==================== REMOVE SONG FROM PLAYLIST ====================
const removeSongFromPlaylist = async (songId, rowElement) => {
    if (!createdPlaylistId) return;

    try {
        const response = await fetch(`/api/playlists/${createdPlaylistId}/songs/${songId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message);
            return;
        }

        // Remove the row from the UI
        rowElement.remove();
        showSuccess('Song removed from playlist');

    } catch (error) {
        showError('Failed to remove song. Please try again.');
    }
};

// ==================== LOGOUT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.location.href = '../login.html';
});

// ==================== INITIALIZE ====================
// Load artists dropdown when page loads
loadArtists();