// ==================== CHECK ADMIN ACCESS ====================
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') {
    window.location.href = '../login.html';
}

// ==================== VARIABLES ====================
let selectedPlaylistId = null;

// ==================== HELPER FUNCTIONS ====================
const showSuccess = (message) => {
    const alert = document.getElementById('successAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

const showError = (message) => {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

// ==================== DETECT WHICH PAGE WE ARE ON ====================
const isEditPage = window.location.pathname.includes('edit-playlist.html');
const isListPage = window.location.pathname.includes('playlists.html');

// ==================== PLAYLIST LIST PAGE ====================
if (isListPage) {

    // Load all admin playlists
    const loadPlaylists = async () => {
        try {
            const response = await fetch('/api/playlists/admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const playlists = await response.json();
            const tbody = document.getElementById('playlistsTableBody');
            tbody.innerHTML = '';

            if (playlists.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #b3b3b3; padding: 32px;">
                            No playlists created yet
                        </td>
                    </tr>
                `;
                return;
            }

            playlists.forEach((playlist, index) => {
                const tr = document.createElement('tr');
                tr.dataset.playlistId = playlist._id;

                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <img
                            class="song-image"
                            src="${playlist.image !== 'default-playlist.png' ? '/uploads/images/' + playlist.image : '/uploads/images/default-playlist.png'}"
                            alt="${playlist.name}"
                            onerror="this.src='/uploads/images/default-playlist.png'"
                        />
                    </td>
                    <td class="song-name">${playlist.name}</td>
                    <td class="song-artist">${playlist.publisher ? playlist.publisher.name : 'No publisher'}</td>
                    <td class="song-streams">${playlist.songs.length} songs</td>
                `;

                // Highlight row when clicked
                tr.addEventListener('click', () => {
                    document.querySelectorAll('.songs-table tr').forEach(row => {
                        row.classList.remove('selected');
                    });
                    tr.classList.add('selected');
                    selectedPlaylistId = playlist._id;
                });

                tbody.appendChild(tr);
            });

        } catch (error) {
            showError('Failed to load playlists. Please try again.');
        }
    };

    // Edit button - redirect to edit page
    document.getElementById('editBtn').addEventListener('click', () => {
        if (!selectedPlaylistId) {
            showError('Please select a playlist to edit');
            return;
        }
        localStorage.setItem('editPlaylistId', selectedPlaylistId);
        window.location.href = 'edit-playlist.html';
    });

    // Delete button - show confirmation modal
    document.getElementById('deleteBtn').addEventListener('click', () => {
        if (!selectedPlaylistId) {
            showError('Please select a playlist to delete');
            return;
        }
        document.getElementById('deleteModal').classList.add('visible');
    });

    // Cancel delete
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').classList.remove('visible');
    });

    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/playlists/${selectedPlaylistId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            document.getElementById('deleteModal').classList.remove('visible');

            if (!response.ok) {
                showError(data.message);
                return;
            }

            showSuccess('Playlist deleted successfully');
            selectedPlaylistId = null;
            loadPlaylists();

        } catch (error) {
            showError('Failed to delete playlist. Please try again.');
        }
    });

    // Initialize
    loadPlaylists();
}

// ==================== EDIT PLAYLIST PAGE ====================
if (isEditPage) {

    const playlistId = localStorage.getItem('editPlaylistId');

    if (!playlistId) {
        window.location.href = 'playlists.html';
    }

    // ==================== LOAD ARTISTS INTO DROPDOWN ====================
    const loadArtists = async (selectedArtistId = null) => {
        try {
            const response = await fetch('/api/artists', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const artists = await response.json();
            const publisherSelect = document.getElementById('publisherSelect');
            publisherSelect.innerHTML = '<option value="">Select a publisher artist</option>';

            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist._id;
                option.textContent = artist.name;
                if (selectedArtistId && artist._id === selectedArtistId) {
                    option.selected = true;
                }
                publisherSelect.appendChild(option);
            });
        } catch (error) {
            showError('Failed to load artists.');
        }
    };

    // ==================== LOAD PLAYLIST DETAILS ====================
    const loadPlaylistDetails = async () => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const playlist = await response.json();

            // Fill in form fields
            document.getElementById('playlistName').value = playlist.name;

            // Show current image
            if (playlist.image && playlist.image !== 'default-playlist.png') {
                document.getElementById('imagePreview').src = `/uploads/images/${playlist.image}`;
            }

            // Load artists and pre-select current publisher
            await loadArtists(playlist.publisher ? playlist.publisher._id : null);

            // Load current songs in playlist
            loadCurrentSongs(playlist.songs);

        } catch (error) {
            showError('Failed to load playlist details.');
        }
    };

    // ==================== LOAD CURRENT SONGS ====================
    const loadCurrentSongs = (songs) => {
        const playlistSongsDiv = document.getElementById('playlistSongs');
        playlistSongsDiv.innerHTML = '';

        if (songs.length === 0) {
            playlistSongsDiv.innerHTML = '<p style="color: #b3b3b3; font-size: 14px;">No songs yet</p>';
            return;
        }

        songs.forEach(song => {
            const row = document.createElement('div');
            row.classList.add('song-result-row');
            row.dataset.songId = song._id;

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
                <button class="remove-btn" data-song-id="${song._id}">Remove</button>
            `;

            row.querySelector('.remove-btn').addEventListener('click', () => {
                removeSongFromPlaylist(song._id, row);
            });

            playlistSongsDiv.appendChild(row);
        });
    };

    // ==================== IMAGE PREVIEW ====================
    document.getElementById('playlistImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('imagePreview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // ==================== SAVE PLAYLIST CHANGES ====================
    document.getElementById('savePlaylistBtn').addEventListener('click', async () => {
        const name = document.getElementById('playlistName').value.trim();
        const publisher = document.getElementById('publisherSelect').value;
        const imageFile = document.getElementById('playlistImage').files[0];

        if (!name) {
            showError('Please enter a playlist name');
            return;
        }

        if (!publisher) {
            showError('Please select a publisher artist');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('publisher', publisher);
        if (imageFile) formData.append('image', imageFile);

        try {
            const btn = document.getElementById('savePlaylistBtn');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.message);
                return;
            }

            showSuccess('Playlist updated successfully!');
            setTimeout(() => {
                localStorage.removeItem('editPlaylistId');
                window.location.href = 'playlists.html';
            }, 2000);

        } catch (error) {
            showError('Failed to update playlist. Please try again.');
        } finally {
            const btn = document.getElementById('savePlaylistBtn');
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    });

    // ==================== SEARCH SONGS ====================
    document.getElementById('songSearchBtn').addEventListener('click', () => {
        const keyword = document.getElementById('songSearchInput').value.trim();
        searchSongs(keyword);
    });

    document.getElementById('songSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSongs(document.getElementById('songSearchInput').value.trim());
        }
    });

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

            if (songs.length === 0) {
                resultsDiv.innerHTML = '<p style="color: #b3b3b3; font-size: 14px;">No songs found</p>';
                return;
            }

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

            // Add event listeners to all add buttons
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
    const addSongToPlaylist = async (songId, songName, songArtist, songImage) => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}/songs`, {
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

            // Add song to the right panel
            const playlistSongsDiv = document.getElementById('playlistSongs');

            // Remove empty message if present
            const emptyMsg = playlistSongsDiv.querySelector('p');
            if (emptyMsg) emptyMsg.remove();

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
        try {
            const response = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.message);
                return;
            }

            rowElement.remove();
            showSuccess('Song removed from playlist');

        } catch (error) {
            showError('Failed to remove song. Please try again.');
        }
    };

    // ==================== INITIALIZE ====================
    loadPlaylistDetails();
}

// ==================== LOGOUT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.location.href = '../login.html';
});