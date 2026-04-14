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

// ==================== IMAGE PREVIEW ====================
// Show a preview of the selected image before uploading
const artistImage = document.getElementById('artistImage');

if (artistImage) {
    artistImage.addEventListener('change', (e) => {
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

// ==================== CREATE ARTIST ====================
const createArtistBtn = document.getElementById('createArtistBtn');

if (createArtistBtn) {
    createArtistBtn.addEventListener('click', async () => {
        // Get values from input fields
        const name = document.getElementById('artistName').value.trim();
        const description = document.getElementById('artistDescription').value.trim();
        const imageFile = document.getElementById('artistImage').files[0];

        // Check if all fields are filled
        if (!name || !description) {
            showError('Please fill in all fields');
            return;
        }

        // Create FormData to send text and file together
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        // Only append image if one was selected
        if (imageFile) {
            formData.append('profileImage', imageFile);
        }

        try {
            // Disable button to prevent double submission
            createArtistBtn.disabled = true;
            createArtistBtn.textContent = 'Creating...';

            // Send request to backend
            const response = await fetch('/api/artists', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.message);
                return;
            }

            // Show success message and clear the form
            showSuccess('Artist created successfully');
            document.getElementById('artistName').value = '';
            document.getElementById('artistDescription').value = '';
            document.getElementById('artistImage').value = '';
            document.getElementById('imagePreview').classList.remove('visible');

        } catch (error) {
            showError('Failed to create artist. Please try again.');
        } finally {
            // Re-enable button
            createArtistBtn.disabled = false;
            createArtistBtn.textContent = 'Create Artist';
        }
    });
}

// ==================== LOGOUT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.location.href = '../login.html';
});