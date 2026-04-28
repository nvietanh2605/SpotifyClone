// ==================== LOAD NOTIFICATIONS ====================
// Fetch notifications from API and display in the bell dropdown
const loadNotifications = async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Only load notifications for regular users, not admin
    if (!token || role === 'admin') return;

    try {
        const response = await fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const notificationList = document.getElementById('notificationList');
        const badge = document.getElementById('notificationBadge');

        if (!notificationList || !badge) return;

        // Update the unread count badge on bell icon
        if (data.unreadCount > 0) {
            badge.textContent = data.unreadCount;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }

        // Clear existing notifications
        notificationList.innerHTML = '';

        // Show empty message if no notifications
        if (data.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    No notifications yet
                </div>
            `;
            return;
        }

        // Display each notification
        data.notifications.forEach(notification => {
            const item = document.createElement('div');
            item.classList.add('notification-item');

            // Add unread class if notification has not been read
            if (!notification.isRead) {
                item.classList.add('unread');
            }

            // Format the time the notification was created
            const time = new Date(notification.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            item.innerHTML = `
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${time}</div>
            `;

            notificationList.appendChild(item);
        });

    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
};

// ==================== BELL ICON CLICK ====================
// Toggle notification dropdown and mark all as read when opened
const bellBtn = document.getElementById('bellBtn');
const notificationDropdown = document.getElementById('notificationDropdown');

if (bellBtn && notificationDropdown) {
    bellBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('token');

        // Toggle dropdown visibility
        notificationDropdown.classList.toggle('visible');

        // If dropdown is now visible, mark all notifications as read
        if (notificationDropdown.classList.contains('visible') && token) {
            try {
                await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Hide the unread badge after marking as read
                const badge = document.getElementById('notificationBadge');
                if (badge) badge.classList.remove('visible');

                // Remove unread styling from all notification items
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });

            } catch (error) {
                console.error('Failed to mark notifications as read:', error);
            }
        }
    });
}

// ==================== INITIALIZE ====================
// Load notifications when page loads
loadNotifications();