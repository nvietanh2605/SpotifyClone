// ==================== PLAYLIST PAGE SETUP ====================
const token = localStorage.getItem('token');

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const playlistId = urlParams.get('id');
const action = urlParams.get('action');

// Store current playlist data
let currentPlaylistData = null;

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

// ==================== CREATE PLAYLIST MODE ====================
if (action === 'create') {
    if (!token) {
        window.location.href = 'login.html';
    }

    document.getElementById('pageContent').innerHTML = `
        <div class="create-playlist-form">
            <h1>Create Playlist</h1>

            <div class="alert alert-success" id="createSuccessAlert"></div>
            <div class="alert alert-error" id="createErrorAlert"></div>

            <div class="form-group">
                <label for="playlistImage">Playlist Image</label>
                <input type="file" id="playlistImage" accept="image/*" />
                <img class="image-preview" id="imagePreview" src="" alt="Preview" />
            </div>

            <div class="form-group">
                <label for="playlistName">Playlist Name</label>
                <input type="text" id="playlistName" placeholder="Enter playlist name" />
            </div>

            <button class="btn-primary" id="createPlaylistSubmitBtn">Create Playlist</button>
        </div>

        <div id="songSearchSection" style="display: none;">
            <div class="playlist-song-search">
                <h2>Add Songs to Playlist</h2>
                <div class="search-bar">
                    <input type="text" id="songSearchInput" placeholder="Search by song name, artist or genre..." />
                    <button id="songSearchBtn">Search</button>
                </div>
                <div id="songSearchResults"></div>
            </div>

            <div class="playlist-songs">
                <h2>Songs in Playlist</h2>
                <div id="playlistSongsList"></div>
            </div>
        </div>
    `;

    // Image preview
    document.getElementById('playlistImage').addEventListener('change', (e) => {
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

    // Create playlist
    let createdPlaylistId = null;

    document.getElementById('createPlaylistSubmitBtn').addEventListener('click', async () => {
        const name = document.getElementById('playlistName').value.trim();
        const imageFile = document.getElementById('playlistImage').files[0];

        if (!name) {
            showCreateAlert('error', 'Please enter a playlist name');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        if (imageFile) formData.append('image', imageFile);

        try {
            const btn = document.getElementById('createPlaylistSubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Creating...';

            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showCreateAlert('error', data.message);
                btn.disabled = false;
                btn.textContent = 'Create Playlist';
                return;
            }

            createdPlaylistId = data.playlist._id;
            showCreateAlert('success', 'Playlist created successfully! Now add songs to it.');

            // Show song search section
            document.getElementById('songSearchSection').style.display = 'block';

            // Disable create form
            document.getElementById('playlistName').disabled = true;
            document.getElementById('playlistImage').disabled = true;
            btn.disabled = true;
            btn.textContent = 'Playlist Created';

            // Reload library
            loadLibrary();

        } catch (error) {
            showCreateAlert('error', 'Failed to create playlist. Please try again.');
            const btn = document.getElementById('createPlaylistSubmitBtn');
            btn.disabled = false;
            btn.textContent = 'Create Playlist';
        }
    });

    // Search songs
    document.getElementById('songSearchBtn').addEventListener('click', () => {
        const keyword = document.getElementById('songSearchInput').value.trim();
        searchSongsForPlaylist(keyword);
    });

    document.getElementById('songSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSongsForPlaylist(document.getElementById('songSearchInput').value.trim());
        }
    });

    const searchSongsForPlaylist = async (keyword) => {
        if (!keyword) return;

        try {
            const response = await fetch(`/api/songs/search?keyword=${encodeURIComponent(keyword)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            const songs = data.songs || [];
            const resultsDiv = document.getElementById('songSearchResults');
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

            document.querySelectorAll('.add-btn').forEach(btn => {
                btn.addEventListener('click', () => addSongToNewPlaylist(
                    btn.dataset.songId,
                    btn.dataset.songName,
                    btn.dataset.songArtist,
                    btn.dataset.songImage
                ));
            });

        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const addSongToNewPlaylist = async (songId, songName, songArtist, songImage) => {
        if (!createdPlaylistId) return;

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
                showCreateAlert('error', data.message);
                return;
            }

            const playlistSongsList = document.getElementById('playlistSongsList');
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

            playlistSongsList.appendChild(row);

            row.querySelector('.remove-btn').addEventListener('click', () => {
                removeFromNewPlaylist(songId, row);
            });

            showCreateAlert('success', `${songName} added to playlist`);

        } catch (error) {
            console.error('Failed to add song:', error);
        }
    };

    const removeFromNewPlaylist = async (songId, rowElement) => {
        if (!createdPlaylistId) return;
        try {
            const response = await fetch(`/api/playlists/${createdPlaylistId}/songs/${songId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                rowElement.remove();
                showCreateAlert('success', 'Song removed from playlist');
            }
        } catch (error) {
            console.error('Failed to remove song:', error);
        }
    };

    const showCreateAlert = (type, message) => {
        const alertId = type === 'success' ? 'createSuccessAlert' : 'createErrorAlert';
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.textContent = message;
            alert.classList.add('visible');
            setTimeout(() => alert.classList.remove('visible'), 3000);
        }
    };

// ==================== VIEW PLAYLIST MODE ====================
} else if (playlistId) {

    const loadPlaylist = async () => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`);

            if (!response.ok) {
                window.location.href = 'index.html';
                return;
            }

            const playlist = await response.json();
            currentPlaylistData = playlist;

            // Update page title
            document.title = `Hexagon - ${playlist.name}`;

            // ==================== RENDER PLAYLIST HEADER ====================
            document.getElementById('pageContent').innerHTML = `
                <div class="playlist-header">
                    <img
                        id="playlistHeaderImage"
                        src="${playlist.image !== 'default-playlist.png' ? '/uploads/images/' + playlist.image : '/uploads/images/default-playlist.png'}"
                        alt="${playlist.name}"
                        onerror="this.src='/uploads/images/default-playlist.png'"
                    />
                    <div class="playlist-header-info">
                        <span class="playlist-type">Playlist</span>
                        <h1 class="playlist-name" id="playlistHeaderName">${playlist.name}</h1>
                        ${playlist.publisher ? `<span class="playlist-publisher">Published by ${playlist.publisher.name}</span>` : ''}
                        <span class="playlist-count" id="playlistHeaderCount">${playlist.songs.length} songs</span>
                    </div>
                </div>

                <div class="playlist-actions" id="playlistActions"></div>

                <div class="playlist-songs">
                    <h2>Songs</h2>
                    <div id="playlistSongsList"></div>
                </div>
            `;

            // ==================== SHOW CORRECT BUTTONS ====================
            const actionsDiv = document.getElementById('playlistActions');

            if (playlist.type === 'user') {
                // User playlist - show Edit and Delete buttons
                actionsDiv.innerHTML = `
                    <button class="edit-btn" id="editBtn">Edit Playlist</button>
                    <button class="delete-btn" id="deleteBtn">Delete Playlist</button>
                `;

                // Edit button - show edit form
                document.getElementById('editBtn').addEventListener('click', () => {
                    const editForm = document.getElementById('editForm');
                    editForm.classList.toggle('visible');

                    // Pre fill the name field
                    document.getElementById('editPlaylistName').value = playlist.name;
                });

                // Cancel edit button
                document.getElementById('cancelEditBtn').addEventListener('click', () => {
                    document.getElementById('editForm').classList.remove('visible');
                });

                // Save edit button
                document.getElementById('saveEditBtn').addEventListener('click', async () => {
                    const newName = document.getElementById('editPlaylistName').value.trim();
                    const newImage = document.getElementById('editPlaylistImage').files[0];

                    if (!newName) {
                        showError('Please enter a playlist name');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('name', newName);
                    if (newImage) formData.append('image', newImage);

                    try {
                        const btn = document.getElementById('saveEditBtn');
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
                            btn.disabled = false;
                            btn.textContent = 'Save Changes';
                            return;
                        }

                        // Update the header with new name and image
                        document.getElementById('playlistHeaderName').textContent = newName;
                        if (newImage && data.playlist.image) {
                            document.getElementById('playlistHeaderImage').src =
                                `/uploads/images/${data.playlist.image}`;
                        }

                        // Hide edit form
                        document.getElementById('editForm').classList.remove('visible');

                        // Update page title
                        document.title = `Hexagon - ${newName}`;

                        // Reload library to reflect name change
                        loadLibrary();

                        showSuccess('Playlist updated successfully!');

                    } catch (error) {
                        showError('Failed to update playlist. Please try again.');
                    } finally {
                        const btn = document.getElementById('saveEditBtn');
                        btn.disabled = false;
                        btn.textContent = 'Save Changes';
                    }
                });

                // Delete button - show confirmation modal
                document.getElementById('deleteBtn').addEventListener('click', () => {
                    document.getElementById('deleteModal').classList.add('visible');
                });

            } else if (playlist.type === 'admin') {
                // Admin playlist - show Save to Library button
                if (token) {
                    const userResponse = await fetch('/api/users/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const userData = await userResponse.json();
                    const isSaved = userData.savedPlaylists &&
                        userData.savedPlaylists.some(p => p._id === playlistId || p === playlistId);

                    const saveBtn = document.createElement('button');
                    saveBtn.classList.add('save-btn');
                    saveBtn.textContent = isSaved ? 'Saved to Library' : 'Add to Library';
                    if (isSaved) saveBtn.classList.add('saved');

                    saveBtn.addEventListener('click', async () => {
                        try {
                            const response = await fetch(`/api/playlists/${playlistId}/save`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            const data = await response.json();

                            if (data.isSaved) {
                                saveBtn.textContent = 'Saved to Library';
                                saveBtn.classList.add('saved');
                            } else {
                                saveBtn.textContent = 'Add to Library';
                                saveBtn.classList.remove('saved');
                            }

                            loadLibrary();

                        } catch (error) {
                            console.error('Failed to save playlist:', error);
                        }
                    });

                    actionsDiv.appendChild(saveBtn);
                }
            }

            // ==================== DISPLAY SONGS ====================
            const songsList = document.getElementById('playlistSongsList');

            if (playlist.songs.length === 0) {
                songsList.innerHTML = `
                    <p style="color: #b3b3b3; font-size: 14px;">
                        No songs in this playlist yet
                    </p>
                `;
            } else {
                playlist.songs.forEach(song => {
                    const row = document.createElement('div');
                    row.classList.add('song-row');
                    row.dataset.songId = song._id;

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
                        <div class="song-streams">${song.streamCount.toLocaleString()} streams</div>
                        ${playlist.type === 'user' ? `<button class="remove-song-btn" data-song-id="${song._id}">Remove</button>` : ''}
                    `;

                    // Play song when row is clicked
                    row.addEventListener('click', (e) => {
                        // Don't play if remove button was clicked
                        if (e.target.classList.contains('remove-song-btn')) return;

                        if (!token) {
                            document.getElementById('loginWallOverlay').classList.add('visible');
                            return;
                        }
                        window.playSong(song, playlist.songs);
                    });

                    songsList.appendChild(row);
                });

                // Add remove song listeners for user playlists
                if (playlist.type === 'user') {
                    document.querySelectorAll('.remove-song-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const songId = btn.dataset.songId;

                            try {
                                const response = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });

                                if (response.ok) {
                                    // Remove the row from UI
                                    const row = document.querySelector(`.song-row[data-song-id="${songId}"]`);
                                    if (row) row.remove();

                                    // Update song count
                                    const countEl = document.getElementById('playlistHeaderCount');
                                    if (countEl) {
                                        const current = parseInt(countEl.textContent);
                                        countEl.textContent = `${current - 1} songs`;
                                    }

                                    showSuccess('Song removed from playlist');
                                }
                            } catch (error) {
                                showError('Failed to remove song. Please try again.');
                            }
                        });
                    });
                }
            }

        } catch (error) {
            console.error('Failed to load playlist:', error);
        }
    };

    // ==================== DELETE CONFIRMATION ====================
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Reload library and redirect to home
                loadLibrary();
                window.location.href = 'index.html';
            } else {
                const data = await response.json();
                showError(data.message);
                document.getElementById('deleteModal').classList.remove('visible');
            }
        } catch (error) {
            showError('Failed to delete playlist. Please try again.');
        }
    });

    // Cancel delete
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').classList.remove('visible');
    });

    // Load the playlist
    loadPlaylist();

} else {
    // No ID and no action redirect to home
    window.location.href = 'index.html';
}