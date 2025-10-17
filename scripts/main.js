document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;

    hamburgerMenu.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        body.classList.toggle('no-scroll');
    });

    // Close sidebar when clicking outside of it
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                sidebar.classList.remove('active');
                body.classList.remove('no-scroll');
            }
        }
    });
    
    // Handle artist card clicks
    const artistCards = document.querySelectorAll('.artist-card');
    artistCards.forEach(card => {
        card.addEventListener('click', function() {
            const artist = this.getAttribute('data-artist');
            window.location.href = `artists/${artist}.html`;
        });
    });
});