// ==================== PLAYER STATE ====================
// Store the current song and playlist being played
let currentSong = null;
let currentPlaylist = [];
let currentIndex = 0;
let isPlaying = false;

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

// ==================== PLAY SONG ====================
// This function is called from any page to play a song
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

    // Update player UI to show song info
    const playerLeft = document.getElementById('playerLeft');
    const playerCenter = document.getElementById('playerCenter');
    const playerRight = document.getElementById('playerRight');

    // Show song image, name and artist in player left
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

    // Update play button to show pause icon
    document.getElementById('playBtn').innerHTML = '&#9646;&#9646;';

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
        document.getElementById('playBtn').innerHTML = '&#9654;';
    } else {
        audio.play();
        isPlaying = true;
        document.getElementById('playBtn').innerHTML = '&#9646;&#9646;';
    }
});

// ==================== PREVIOUS SONG ====================
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPlaylist.length === 0) return;

    // Go to previous song or loop back to last song
    currentIndex = currentIndex > 0 ? currentIndex - 1 : currentPlaylist.length - 1;
    window.playSong(currentPlaylist[currentIndex], currentPlaylist);
});

// ==================== NEXT SONG ====================
document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPlaylist.length === 0) return;

    // Go to next song or loop back to first song
    currentIndex = currentIndex < currentPlaylist.length - 1 ? currentIndex + 1 : 0;
    window.playSong(currentPlaylist[currentIndex], currentPlaylist);
});

// ==================== AUTO PLAY NEXT ====================
// When a song ends, automatically play the next one
audio.addEventListener('ended', () => {
    if (currentPlaylist.length === 0) return;
    currentIndex = currentIndex < currentPlaylist.length - 1 ? currentIndex + 1 : 0;
    window.playSong(currentPlaylist[currentIndex], currentPlaylist);
});

// ==================== PROGRESS BAR ====================
// Update progress bar and time as song plays
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;

    // Calculate progress percentage
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;

    // Update current time display
    document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
    document.getElementById('totalTime').textContent = formatTime(audio.duration);
});

// Click on progress bar to seek to that position
document.getElementById('progressBar').addEventListener('click', (e) => {
    if (!audio.duration) return;

    // Calculate where user clicked on the bar
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    // Seek to that position in the song
    audio.currentTime = percentage * audio.duration;
});

// ==================== VOLUME ====================
// Click on volume bar to change volume
document.getElementById('volumeBar').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    // Set audio volume (0 to 1)
    audio.volume = percentage;
    document.getElementById('volumeFill').style.width = `${percentage * 100}%`;
});

// Mute / unmute button
document.getElementById('volumeBtn').addEventListener('click', () => {
    if (audio.muted) {
        audio.muted = false;
        document.getElementById('volumeBtn').innerHTML = '&#9836;';
    } else {
        audio.muted = true;
        document.getElementById('volumeBtn').innerHTML = '&#128263;';
    }
});