// ==================== ACCOUNT PAGE SETUP ====================
const token = localStorage.getItem('token');

// Redirect to login if not logged in
if (!token) {
    window.location.href = 'login.html';
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

// ==================== LOAD ACCOUNT DETAILS ====================
// Fetch user profile from API and display on page
const loadAccountDetails = async () => {
    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();

        // Update avatar with first letter of name
        const avatar = document.getElementById('accountAvatar');
        if (avatar) {
            avatar.textContent = user.name.charAt(0).toUpperCase();
        }

        // Update name
        const nameEl = document.getElementById('accountName');
        if (nameEl) {
            nameEl.textContent = user.name;
        }

        // Update email
        const emailEl = document.getElementById('accountEmail');
        if (emailEl) {
            emailEl.textContent = user.email;
        }

        // Update stats - number of artists following
        const followingCount = document.getElementById('followingCount');
        if (followingCount) {
            followingCount.textContent = user.followedArtists ?
                user.followedArtists.length : 0;
        }

        // Update stats - number of playlists saved
        const playlistCount = document.getElementById('playlistCount');
        if (playlistCount) {
            playlistCount.textContent = user.savedPlaylists ?
                user.savedPlaylists.length : 0;
        }

    } catch (error) {
        console.error('Failed to load account details:', error);
        showError('Failed to load account details. Please try again.');
    }
};

// ==================== INITIALIZE ====================
// Load account details when page loads
loadAccountDetails();