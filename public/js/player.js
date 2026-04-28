// ==================== PLAYER STATE ====================
let currentSong = null;
let currentPlaylist = [];
let currentIndex = 0;
let isPlaying = false;
let isLooping = false;

// Get the hidden audio element
const audio = document.getElementById('audioPlayer');

// ==================== FORMAT TIME ====================
// Convert seconds to mm:ss format
const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ==================== UPDATE PLAY/PAUSE ICONS ====================
// Switch between play and pause icons
const updatePlayPauseIcon = (playing) => {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    if (!playIcon || !pauseIcon) return;
    if (playing) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
};

// ==================== PLAY SONG ====================
window.playSong = async (song, playlist = []) => {
    const token = localStorage.getItem('token');

    // Show login wall if user is not logged in
    if (!token) {
        document.getElementById('loginWallOverlay').classList.add('visible');
        return;
    }

    // Update current song and playlist
    currentSong = song;
    currentPlaylist = playlist.length > 0 ? playlist : [song];
    currentIndex = currentPlaylist.findIndex(s => s._id === song._id);

    const playerLeft = document.getElementById('playerLeft');
    const playerCenter = document.getElementById('playerCenter');
    const playerRight = document.getElementById('playerRight');

    // Show song info in player left section
    playerLeft.innerHTML = `
        <img
            src="${song.image !== 'default-song.png' ? '/uploads/images/' + song.image : '/uploads/images/default-song.png'}"
            alt="${song.name}"
            onerror="this.src='/uploads/images/default-song.png'"
        />
        <div class="player-song-info">
            <span class="player-song-name">${song.name}</span>
            <span class="player-song-artist">${song.artist ? song.artist.name : 'Unknown'}</span>
        </div>
    `;

    // Show player controls and volume
    playerCenter.style.display = 'flex';
    playerRight.style.display = 'flex';

    // Set audio source and play
    audio.src = `/uploads/songs/${song.audioFile}`;
    audio.play();
    isPlaying = true;

    // Update play/pause icon to show pause
    updatePlayPauseIcon(true);

    // Increment stream count in the background
    try {
        await fetch(`/api/songs/${song._id}/stream`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Failed to update stream count:', error);
    }
};

// ==================== PLAY / PAUSE ====================
document.getElementById('playBtn').addEventListener('click', () => {
    if (!currentSong) return;

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        updatePlayPauseIcon(false);
    } else {
        audio.play();
        isPlaying = true;
        updatePlayPauseIcon(true);
    }
});

// ==================== PREVIOUS SONG ====================
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPlaylist.length === 0) return;
    currentIndex = currentIndex > 0 ? currentIndex - 1 : currentPlaylist.length - 1;
    window.playSong(currentPlaylist[currentIndex], currentPlaylist);
});

// ==================== NEXT SONG ====================
document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPlaylist.length === 0) return;
    currentIndex = currentIndex < currentPlaylist.length - 1 ? currentIndex + 1 : 0;
    window.playSong(currentPlaylist[currentIndex], currentPlaylist);
});

// ==================== LOOP BUTTON ====================
document.getElementById('loopBtn').addEventListener('click', () => {
    isLooping = !isLooping;
    const loopBtn = document.getElementById('loopBtn');

    if (isLooping) {
        // Activate loop - highlight button green
        loopBtn.classList.add('active');
        loopBtn.title = 'Loop on';
    } else {
        // Deactivate loop
        loopBtn.classList.remove('active');
        loopBtn.title = 'Loop off';
    }
});

// ==================== AUTO PLAY NEXT ====================
// When song ends, loop current song or play next
audio.addEventListener('ended', () => {
    if (isLooping) {
        // Loop: replay the same song from the beginning
        audio.currentTime = 0;
        audio.play();
    } else {
        // No loop: play the next song
        if (currentPlaylist.length === 0) return;
        currentIndex = currentIndex < currentPlaylist.length - 1 ? currentIndex + 1 : 0;
        window.playSong(currentPlaylist[currentIndex], currentPlaylist);
    }
});

// ==================== PROGRESS BAR ====================
// Update progress bar as song plays
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
    document.getElementById('totalTime').textContent = formatTime(audio.duration);
});

// Click on progress bar to seek
document.getElementById('progressBar').addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * audio.duration;
});

// ==================== VOLUME ====================
document.getElementById('volumeBar').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.volume = percentage;
    document.getElementById('volumeFill').style.width = `${percentage * 100}%`;
});

// Mute / unmute
document.getElementById('volumeBtn').addEventListener('click', () => {
    audio.muted = !audio.muted;
});