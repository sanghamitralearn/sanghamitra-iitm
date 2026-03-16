document.addEventListener('DOMContentLoaded', () => {
    function loadNavbar() {
        fetch('navbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load navbar: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                document.getElementById('navbar-placeholder').innerHTML = data;
                checkAuth(); // After loading navbar, check authentication status
                console.log("Navbar loaded and authentication checked");
            })
            .catch(error => console.error('Error loading navbar:', error));
    }

    function checkAuth() {
        fetch('https://sanghamitra-learnworld.vercel.app/api/check-auth', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to check authentication: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const authButton = document.getElementById('authButton');
            if (data.authenticated) {
                console.log("User is authenticated");
                authButton.textContent = 'Logout';
                authButton.classList.remove('btn-success');
                authButton.classList.add('btn-danger');
                authButton.onclick = async (event) => {
                    event.preventDefault();
                    console.log("Logout button clicked");
                    const confirmLogout = window.confirm("Do you really want to logout?");
                    if (confirmLogout) {
                        try {
                            const response = await fetch('https://sanghamitra-learnworld.vercel.app/api/logout', {
                                method: 'GET',
                                credentials: 'include'
                            });

                            if (response.ok) {
                                console.log("Logout successful");
                                // Clear sessionId cookie
                                document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; SameSite=None';
                                location.replace('../index.html');
                            } else {
                                console.error('Logout failed');
                            }
                        } catch (error) {
                            console.error('Error during logout:', error);
                        }
                    } else {
                        console.log("Logout cancelled");
                    }
                };
            } else {
                console.log("User is not authenticated");
                authButton.textContent = 'Login';
                authButton.classList.remove('btn-danger');
                authButton.classList.add('btn-success');
                authButton.onclick = () => {
                    window.location.href = '../user_login.html';
                };
            }
        })
        .catch(error => console.error('Error checking authentication:', error));
    }

    loadNavbar(); // Initial load of navbar and authentication status
});
