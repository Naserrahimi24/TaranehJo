document.addEventListener('DOMContentLoaded', function() {
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerArt = document.getElementById('player-art');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    let currentSong = null;
    let isPlaying = false;
    let audio = new Audio();

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function loadSong(song) {
        if (!song) return;
        currentSong = song;
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        playerArt.src = `https://picsum.photos/seed/${song.title}/50/50.jpg`;
        
        // Using a sample audio URL
        audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
            progressBar.max = audio.duration;
        });

        audio.addEventListener('timeupdate', () => {
            progressBar.value = audio.currentTime;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        });

        playSong();
    }

    function playSong() {
        isPlaying = true;
        playPauseBtn.textContent = 'توقف';
        audio.play();
    }

    function pauseSong() {
        isPlaying = false;
        playPauseBtn.textContent = 'پخش';
        audio.pause();
    }

    playPauseBtn.addEventListener('click', () => {
        if (!currentSong) {
            alert('لطفاً ابتدا یک آهنگ را انتخاب کنید');
            return;
        }
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    });

    progressBar.addEventListener('input', () => {
        audio.currentTime = progressBar.value;
    });

    // Make loadSong globally accessible
    window.playSong = loadSong;
});