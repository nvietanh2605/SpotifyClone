// ==================== CHECK ADMIN ACCESS ====================
// Redirect to login if no token or user is not admin
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') {
    window.location.href = '../login.html';
}

// ==================== VARIABLES ====================
// Store the currently selected song ID
let selectedSongId = null;

// ==================== HELPER FUNCTIONS ====================
// Show success alert message
const showSuccess = (message) => {
    const alert = document.getElementById('successAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    // Hide after 3 seconds
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

// Show error alert message
const showError = (message) => {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.add('visible');
    setTimeout(() => alert.classList.remove('visible'), 3000);
};

// ==================== LOAD SONGS ====================
// Load all songs from the API and display in the table
const loadSongs = async (keyword = '') => {
    try {
        let url = '/api/songs';

        // If there is a search keyword, use search endpoint
        if (keyword) {
            url = `/api/songs/search?keyword=${encodeURIComponent(keyword)}`;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        // If searching, data has songs array, otherwise data is the array
        const songs = keyword ? data.songs : data;

        // Get the table body element
        const tbody = document.getElementById('songsTableBody');
        tbody.innerHTML = '';

        // If no songs found
        if (songs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #b3b3b3; padding: 32px;">
                        No songs found
                    </td>
                </tr>
            `;
            return;
        }

        // Loop through songs and create table rows
        songs.forEach((song, index) => {
            const tr = document.createElement('tr');
            tr.dataset.songId = song._id;

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <img
                        class="song-image"
                        src="${song.image !== 'default-song.png' ? '/uploads/images/' + song.image : '/uploads/images/default-song.png'}"
                        alt="${song.name}"
                        onerror="this.src='/uploads/images/default-song.png'"
                    />
                </td>
                <td class="song-name">${song.name}</td>
                <td class="song-artist">${song.artist ? song.artist.name : 'Unknown'}</td>
                <td>${song.genre}</td>
                <td class="song-streams">${song.streamCount.toLocaleString()}</td>
            `;

            // Highlight row when clicked
            tr.addEventListener('click', () => {
                // Remove selected class from all rows
                document.querySelectorAll('.songs-table tr').forEach(row => {
                    row.classList.remove('selected');
                });

                // Add selected class to clicked row
                tr.classList.add('selected');
                selectedSongId = song._id;
            });

            tbody.appendChild(tr);
        });

    } catch (error) {
        showError('Failed to load songs. Please try again.');
    }
};

// ==================== SEARCH ====================
// Search songs when search button is clicked
document.getElementById('searchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('searchInput').value.trim();
    loadSongs(keyword);
});

// Also search when Enter key is pressed in search input
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const keyword = document.getElementById('searchInput').value.trim();
        loadSongs(keyword);
    }
});

// ==================== EDIT BUTTON ====================
// Redirect to edit page with selected song ID
document.getElementById('editBtn').addEventListener('click', () => {
    if (!selectedSongId) {
        showError('Please select a song to edit');
        return;
    }
    // Store selected song ID in localStorage for edit page to use
    localStorage.setItem('editSongId', selectedSongId);
    window.location.href = 'edit-song.html';
});

// ==================== DELETE BUTTON ====================
// Show delete confirmation modal
document.getElementById('deleteBtn').addEventListener('click', () => {
    if (!selectedSongId) {
        showError('Please select a song to delete');
        return;
    }
    // Show the confirmation modal
    document.getElementById('deleteModal').classList.add('visible');
});

// Cancel delete - close modal
document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.remove('visible');
});

// Confirm delete - delete the song
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`/api/songs/${selectedSongId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        // Close the modal
        document.getElementById('deleteModal').classList.remove('visible');

        if (!response.ok) {
            showError(data.message);
            return;
        }

        // Show success message and reload songs
        showSuccess(data.message);
        selectedSongId = null;
        loadSongs();

    } catch (error) {
        showError('Failed to delete song. Please try again.');
    }
});

// ==================== LOGOUT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    // Redirect to login page
    window.location.href = '../login.html';
});

// ==================== INITIALIZE ====================
// Load all songs when page first loads
loadSongs();