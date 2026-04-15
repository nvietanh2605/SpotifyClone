// ==================== LOAD LIBRARY ====================
// Load followed artists and saved playlists into the sidebar
const loadLibrary = async () => {
    const token = localStorage.getItem('token');

    // If user is not logged in, do not load library
    if (!token) return;

    try {
        const response = await fetch('/api/users/library', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const libraryItems = document.getElementById('libraryItems');
        libraryItems.innerHTML = '';

        // ==================== FOLLOWED ARTISTS ====================
        if (data.followedArtists && data.followedArtists.length > 0) {
            data.followedArtists.forEach(artist => {
                const item = document.createElement('a');
                item.classList.add('library-item');
                item.href = `artist.html?id=${artist._id}`;

                item.innerHTML = `
                    <img
                        src="${artist.profileImage !== 'default-artist.png' ? '/uploads/images/' + artist.profileImage : '/uploads/images/default-artist.png'}"
                        alt="${artist.name}"
                        onerror="this.src='/uploads/images/default-artist.png'"
                        style="border-radius: 50%;"
                    />
                    <div class="library-item-info">
                        <span class="library-item-name">${artist.name}</span>
                        <span class="library-item-type">Artist</span>
                    </div>
                `;

                libraryItems.appendChild(item);
            });
        }

        // ==================== SAVED PLAYLISTS ====================
        if (data.savedPlaylists && data.savedPlaylists.length > 0) {
            data.savedPlaylists.forEach(playlist => {
                const item = document.createElement('a');
                item.classList.add('library-item');
                item.href = `playlist.html?id=${playlist._id}`;

                item.innerHTML = `
                    <img
                        src="${playlist.image !== 'default-playlist.png' ? '/uploads/images/' + playlist.image : '/uploads/images/default-playlist.png'}"
                        alt="${playlist.name}"
                        onerror="this.src='/uploads/images/default-playlist.png'"
                    />
                    <div class="library-item-info">
                        <span class="library-item-name">${playlist.name}</span>
                        <span class="library-item-type">Playlist</span>
                    </div>
                `;

                libraryItems.appendChild(item);
            });
        }

        // ==================== USER OWN PLAYLISTS ====================
        // Also load playlists created by the user
        const playlistResponse = await fetch('/api/playlists/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (playlistResponse.ok) {
            const myPlaylists = await playlistResponse.json();

            myPlaylists.forEach(playlist => {
                // Check if playlist is already in saved playlists to avoid duplicates
                const alreadyShown = data.savedPlaylists &&
                    data.savedPlaylists.some(p => p._id === playlist._id);

                if (!alreadyShown) {
                    const item = document.createElement('a');
                    item.classList.add('library-item');
                    item.href = `playlist.html?id=${playlist._id}`;

                    item.innerHTML = `
                        <img
                            src="${playlist.image !== 'default-playlist.png' ? '/uploads/images/' + playlist.image : '/uploads/images/default-playlist.png'}"
                            alt="${playlist.name}"
                            onerror="this.src='/uploads/images/default-playlist.png'"
                        />
                        <div class="library-item-info">
                            <span class="library-item-name">${playlist.name}</span>
                            <span class="library-item-type">Your Playlist</span>
                        </div>
                    `;

                    libraryItems.appendChild(item);
                }
            });
        }

        // Show message if library is empty
        if (libraryItems.children.length === 0) {
            libraryItems.innerHTML = `
                <p style="color: #b3b3b3; font-size: 13px; padding: 8px;">
                    Follow artists and save playlists to see them here
                </p>
            `;
        }

    } catch (error) {
        console.error('Failed to load library:', error);
    }
};

// ==================== NAVBAR SETUP ====================
// Set up navbar elements that appear on every user page
const setupNavbar = () => {
    const name = localStorage.getItem('name');
    const token = localStorage.getItem('token');

    // Set user name and avatar initial in navbar
    if (name) {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        if (userNameEl) userNameEl.textContent = name;
        if (userAvatarEl) userAvatarEl.textContent = name.charAt(0).toUpperCase();
    }

    // Settings dropdown toggle
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', () => {
            settingsDropdown.classList.toggle('visible');
            document.getElementById('notificationDropdown')?.classList.remove('visible');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            window.location.href = 'login.html';
        });
    }

    // Close login wall popup
    const closeLoginWall = document.getElementById('closeLoginWall');
    if (closeLoginWall) {
        closeLoginWall.addEventListener('click', () => {
            document.getElementById('loginWallOverlay').classList.remove('visible');
        });
    }

    // Create playlist button in library
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', () => {
            if (!token) {
                document.getElementById('loginWallOverlay')?.classList.add('visible');
                return;
            }
            window.location.href = 'playlist.html?action=create';
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.settings-wrapper')) {
            document.getElementById('settingsDropdown')?.classList.remove('visible');
        }
        if (!e.target.closest('.notification-wrapper')) {
            document.getElementById('notificationDropdown')?.classList.remove('visible');
        }
    });
};

// ==================== INITIALIZE ====================
// Run setup and load library when page loads
setupNavbar();
loadLibrary();