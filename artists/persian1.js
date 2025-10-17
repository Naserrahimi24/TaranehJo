document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const playToggle = document.getElementById('play-toggle');
    const progress = document.getElementById('progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const volume = document.getElementById('volume');
    const player = document.getElementById('music-player');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCover = document.getElementById('player-cover');
    const playerDownload = document.getElementById('player-download');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const closeBtn = document.getElementById('close-player');
    const followBtn = document.getElementById('follow-btn');
    const followersCount = document.getElementById('followers-count');
    const totalLikes = document.getElementById('total-likes');
    const totalPlays = document.getElementById('total-plays');
    const scrollTopBtn = document.getElementById('scroll-top');
    let currentSong = null;
    let playlist = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let followers = 0;
    let totalLikesCount = 0;
    let totalPlaysCount = 0;

    // Initialize playlist from song items
    document.querySelectorAll('.song-item').forEach((song, index) => {
        const url = song.getAttribute('data-url');
        const title = song.querySelector('h4').textContent;
        const artist = song.querySelector('p').textContent.split(' - ')[0];
        playlist.push({ url, title, artist, element: song, index });

        // Set song duration
        const audioTemp = new Audio(url);
        audioTemp.addEventListener('loadedmetadata', () => {
            const duration = formatTime(audioTemp.duration);
            song.querySelector('.song-duration').textContent = duration;
        });
    });

    // Play button click
    document.querySelectorAll('.play-btn').forEach(button => {
        button.addEventListener('click', () => {
            const songItem = button.closest('.song-item');
            const songUrl = songItem.getAttribute('data-url');
            const songIndex = playlist.findIndex(song => song.url === songUrl);

            if (currentSong === songUrl && isPlaying) {
                pauseSong();
            } else {
                playSong(songIndex);
            }
        });
    });

    // Like button click
    document.querySelectorAll('.like-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            const songItem = badge.closest('.song-item');
            const likeCountElement = badge.querySelector('.like-count');
            let likeCount = parseInt(likeCountElement.textContent);
            const isLiked = badge.classList.contains('liked');

            if (!isLiked) {
                likeCount++;
                totalLikesCount++;
                badge.classList.add('liked');
            } else {
                likeCount--;
                totalLikesCount--;
                badge.classList.remove('liked');
            }

            likeCountElement.textContent = likeCount;
            totalLikes.textContent = totalLikesCount;
        });
    });

    // Follow button
    followBtn.addEventListener('click', () => {
        if (!followBtn.classList.contains('following')) {
            followers++;
            followBtn.textContent = 'دنبال شده';
            followBtn.classList.add('following');
        } else {
            followers--;
            followBtn.textContent = 'دنبال کردن';
            followBtn.classList.remove('following');
        }
        followersCount.textContent = followers;
    });

    // Play song
    function playSong(index) {
        currentSongIndex = index;
        currentSong = playlist[index].url;
        audio.src = currentSong;
        audio.play();
        isPlaying = true;
        player.classList.add('active');
        playToggle.querySelector('i').classList.remove('fa-play');
        playToggle.querySelector('i').classList.add('fa-pause');
        playerTitle.textContent = playlist[index].title;
        playerArtist.textContent = playlist[index].artist;
        playerDownload.setAttribute('href', currentSong);
        updatePlayButton(playlist[index].element, true);
        totalPlaysCount++;
        totalPlays.textContent = totalPlaysCount;

        // Update all play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            const songItem = btn.closest('.song-item');
            const isCurrent = songItem.getAttribute('data-url') === currentSong;
            btn.classList.toggle('playing', isCurrent && isPlaying);
        });
    }

    // Pause song
    function pauseSong() {
        audio.pause();
        isPlaying = false;
        playToggle.querySelector('i').classList.remove('fa-pause');
        playToggle.querySelector('i').classList.add('fa-play');
        updatePlayButton(playlist[currentSongIndex].element, false);
    }

    // Update play button state
    function updatePlayButton(songElement, isPlaying) {
        const playBtn = songElement.querySelector('.play-btn');
        playBtn.classList.toggle('playing', isPlaying);
    }

    // Toggle play/pause
    playToggle.addEventListener('click', () => {
        if (isPlaying) {
            pauseSong();
        } else {
            audio.play();
            isPlaying = true;
            playToggle.querySelector('i').classList.remove('fa-play');
            playToggle.querySelector('i').classList.add('fa-pause');
            updatePlayButton(playlist[currentSongIndex].element, true);
        }
    });

    // Previous and Next buttons
    prevBtn.addEventListener('click', () => {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        playSong(currentSongIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        playSong(currentSongIndex);
    });

    // Close player
    closeBtn.addEventListener('click', () => {
        pauseSong();
        player.classList.remove('active');
    });

    // Update progress
    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        const progressPercent = (currentTime / duration) * 100;
        progress.value = progressPercent;
        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    });

    // Seek
    progress.addEventListener('input', () => {
        const seekTime = (progress.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });

    // Volume control
    volume.addEventListener('input', () => {
        audio.volume = volume.value;
    });

    // Auto play next song
    audio.addEventListener('ended', () => {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        playSong(currentSongIndex);
    });

    // Format time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Scroll to top button
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('show', window.scrollY > 300);
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Set initial duration
    audio.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audio.duration);
    });
});