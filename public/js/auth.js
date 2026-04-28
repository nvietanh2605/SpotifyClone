// ==================== HELPER FUNCTIONS ====================

// Save token and user info to localStorage after login
const saveUserData = (token, role, name) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
};

// Show error message on the page
const showError = (message) => {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('visible');
    }
};

// Hide error message
const hideError = () => {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.classList.remove('visible');
    }
};

// Show success message on the page
const showSuccess = (message) => {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('visible');
    }
};

// ==================== LOGIN ====================
const loginBtn = document.getElementById('loginBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        // Get values from input fields
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Hide any previous error messages
        hideError();

        // Check if fields are filled
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        try {
            // Send login request to backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Show error message from server
                showError(data.message);
                return;
            }

            // Save user data to localStorage
            saveUserData(data.token, data.role, data.name);

            // Redirect based on role
            if (data.role === 'admin') {
                // Admin goes to admin dashboard
                window.location.href = 'admin/admin.html';
            } else {
                // Regular user goes to home page
                window.location.href = 'index.html';
            }

        } catch (error) {
            showError('Something went wrong. Please try again.');
        }
    });
}

// ==================== REGISTER ====================
const registerBtn = document.getElementById('registerBtn');

if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        // Get values from input fields
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Hide any previous error messages
        hideError();

        // Check if all fields are filled
        if (!name || !email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Check if password is at least 6 characters
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        try {
            // Send register request to backend
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Show error message from server
                showError(data.message);
                return;
            }

            // Show success message and redirect to login after 2 seconds
            showSuccess(data.message);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            showError('Something went wrong. Please try again.');
        }
    });
}