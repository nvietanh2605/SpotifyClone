// ==================== CHECK ADMIN ACCESS ====================
// Redirect to login if no token or user is not admin
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') {
    window.location.href = '../login.html';
}

// ==================== HELPER FUNCTIONS ====================
// Show success alert message
const showSuccess = (message) => {
    const alert = document.getElementById('successAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

// Show error alert message
const showError = (message) => {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

// ==================== LOAD ARTISTS INTO DROPDOWN ====================
// Fetch all artists from API and populate the artist dropdown
const loadArtists = async (selectedArtistId = null) => {
    try {
        const response = await fetch('/api/artists', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const artists = await response.json();
        const artistSelect = document.getElementById('artistSelect');

        // Clear existing options except the first one
        artistSelect.innerHTML = '<option value="">Select an artist</option>';

        // Add each artist as an option
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist._id;
            option.textContent = artist.name;

            // Pre-select the current artist if editing
            if (selectedArtistId && artist._id === selectedArtistId) {
                option.selected = true;
            }

            artistSelect.appendChild(option);
        });

    } catch (error) {
        showError('Failed to load artists. Please try again.');
    }
};

// ==================== IMAGE PREVIEW ====================
// Show a preview of the selected image before uploading
const songImage = document.getElementById('songImage');

if (songImage) {
    songImage.addEventListener('change', (e) => {
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

// ==================== UPLOAD SONG ====================
const uploadSongBtn = document.getElementById('uploadSongBtn');

if (uploadSongBtn) {
    uploadSongBtn.addEventListener('click', async () => {
        // Get values from input fields
        const name = document.getElementById('songName').value.trim();
        const artist = document.getElementById('artistSelect').value;
        const genre = document.getElementById('genreSelect').value;
        const imageFile = document.getElementById('songImage').files[0];
        const audioFile = document.getElementById('audioFile').files[0];

        // Check if all required fields are filled
        if (!name || !artist || !genre) {
            showError('Please fill in all fields');
            return;
        }

        // Check if audio file is selected
        if (!audioFile) {
            showError('Please upload an audio file');
            return;
        }

        // Create FormData to send text and files together
        const formData = new FormData();
        formData.append('name', name);
        formData.append('artist', artist);
        formData.append('genre', genre);
        formData.append('audioFile', audioFile);

        // Only append image if one was selected
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            // Disable button to prevent double submission
            uploadSongBtn.disabled = true;
            uploadSongBtn.textContent = 'Uploading...';

            // Send request to backend
            const response = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.message);
                return;
            }

            // Show success and clear the form
            showSuccess('Song uploaded successfully');
            document.getElementById('songName').value = '';
            document.getElementById('songImage').value = '';
            document.getElementById('audioFile').value = '';
            document.getElementById('artistSelect').value = '';
            document.getElementById('genreSelect').value = '';
            document.getElementById('imagePreview').classList.remove('visible');

        } catch (error) {
            showError('Failed to upload song. Please try again.');
        } finally {
            // Re-enable button
            uploadSongBtn.disabled = false;
            uploadSongBtn.textContent = 'Upload Song';
        }
    });
}

// ==================== EDIT SONG ====================
const saveSongBtn = document.getElementById('saveSongBtn');

if (saveSongBtn) {
    // Get the song ID stored by dashboard.js
    const songId = localStorage.getItem('editSongId');

    if (!songId) {
        window.location.href = 'admin.html';
    }

    // Load the song details into the form
    const loadSongDetails = async () => {
        try {
            const response = await fetch(`/api/songs/${songId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const song = await response.json();

            // Fill in the form fields with current song data
            document.getElementById('songName').value = song.name;
            document.getElementById('streamCount').value = song.streamCount;
            document.getElementById('genreSelect').value = song.genre;

            // Show current song image
            if (song.image && song.image !== 'default-song.png') {
                const preview = document.getElementById('imagePreview');
                preview.src = `/uploads/images/${song.image}`;
                preview.classList.add('visible');
            }

            // Load artists and pre-select current artist
            await loadArtists(song.artist._id);

        } catch (error) {
            showError('Failed to load song details. Please try again.');
        }
    };

    // Save changes to the song
    saveSongBtn.addEventListener('click', async () => {
        // Get updated values from form
        const name = document.getElementById('songName').value.trim();
        const artist = document.getElementById('artistSelect').value;
        const genre = document.getElementById('genreSelect').value;
        const streamCount = document.getElementById('streamCount').value;
        const imageFile = document.getElementById('songImage').files[0];

        // Check if all fields are filled
        if (!name || !artist || !genre) {
            showError('Please fill in all fields');
            return;
        }

        // Create FormData with updated values
        const formData = new FormData();
        formData.append('name', name);
        formData.append('artist', artist);
        formData.append('genre', genre);
        formData.append('streamCount', streamCount);

        // Only append image if a new one was selected
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            // Disable button to prevent double submission
            saveSongBtn.disabled = true;
            saveSongBtn.textContent = 'Saving...';

            // Send update request to backend
            const response = await fetch(`/api/songs/${songId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.message);
                return;
            }

            // Show success and redirect back to dashboard after 2 seconds
            showSuccess('Song updated successfully');
            setTimeout(() => {
                localStorage.removeItem('editSongId');
                window.location.href = 'admin.html';
            }, 2000);

        } catch (error) {
            showError('Failed to update song. Please try again.');
        } finally {
            saveSongBtn.disabled = false;
            saveSongBtn.textContent = 'Save Changes';
        }
    });

    // Initialize the edit form
    loadSongDetails();
}

// ==================== INITIALIZE UPLOAD PAGE ====================
// Load artists dropdown when on upload song page
if (uploadSongBtn) {
    loadArtists();
}

// ==================== LOGOUT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.location.href = '../login.html';
});