const audio = document.getElementById('audio');
const player = document.getElementById('spotify-player');
const playToggle = document.getElementById('play-toggle');
const progress = document.getElementById('progress');
const volume = document.getElementById('volume');
const title = document.getElementById('player-title');
const artist = document.getElementById('player-artist');
const currentTime = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playerDownload = document.getElementById('player-download');
const followBtn = document.getElementById('follow-btn');
const followersCount = document.getElementById('followers-count');
const totalLikes = document.getElementById('total-likes');
const totalPlays = document.getElementById('total-plays');
const scrollTop = document.getElementById('scroll-top');
const closePlayer = document.getElementById('close-player');

const tracks = [];
let currentIndex = -1;
let currentPlayBtn = null;
let followers = parseInt(localStorage.getItem('followers_aslani') || '0');
let allLikes = parseInt(localStorage.getItem('totalLikes_aslani') || '0');
let allPlays = parseInt(localStorage.getItem('totalPlays_aslani') || '0');
let isFollowing = localStorage.getItem('isFollowing_aslani') === 'true';

followersCount.textContent = followers;
totalLikes.textContent = allLikes;
totalPlays.textContent = allPlays;

if (isFollowing) {
    followBtn.classList.add('following');
    followBtn.textContent = 'لغو دنبال کردن';
}

followBtn.addEventListener('click', () => {
    isFollowing = !isFollowing;
    followers += isFollowing ? 1 : -1;
    followersCount.textContent = followers;
    localStorage.setItem('followers_aslani', followers);
    localStorage.setItem('isFollowing_aslani', isFollowing);
    followBtn.classList.toggle('following');
    followBtn.textContent = isFollowing ? 'لغو دنبال کردن' : 'دنبال کردن';
});

const songItems = document.querySelectorAll('.song-item');
songItems.forEach((item, index) => {
    const url = item.dataset.url;
    const songTitle = item.querySelector('h4').textContent;
    const songArtist = item.querySelector('p').textContent;
    if (url) {
        tracks.push({ url, title: songTitle, artist: songArtist });
    }

    // محاسبه و نمایش مدت زمان آهنگ
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
        const duration = tempAudio.duration;
        item.querySelector('.song-duration').textContent = formatTime(duration);
    });

    // مدیریت دانلود
    const downloadBtn = item.querySelector('.download-btn');
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        downloadBtn.classList.add('downloaded');
        downloadBtn.innerHTML = '<i class="fas fa-check"></i>';
        const link = document.createElement('a');
        link.href = url;
        link.download = songTitle + '.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // مدیریت لایک
    const likeBadge = item.querySelector('.like-badge');
    const likeCount = item.querySelector('.like-count');
    likeBadge.addEventListener('click', () => {
        let count = parseInt(likeCount.textContent);
        count += 1;
        allLikes += 1;
        likeCount.textContent = count;
        totalLikes.textContent = allLikes;
        localStorage.setItem('totalLikes_aslani', allLikes);
        likeBadge.classList.add('liked');
        setTimeout(() => likeBadge.classList.remove('liked'), 500);
    });

    // پخش آهنگ
    const playBtn = item.querySelector('.play-btn');
    playBtn.addEventListener('click', () => {
        if (!url) return;
        if (currentPlayBtn && currentPlayBtn !== playBtn) {
            currentPlayBtn.classList.remove('playing');
            currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        if (audio.src === url && !audio.paused) {
            audio.pause();
            playBtn.classList.remove('playing');
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            player.classList.remove('active');
        } else {
            audio.src = url;
            title.textContent = songTitle;
            artist.textContent = songArtist;
            playerDownload.href = url;
            playerDownload.download = songTitle + '.mp3';
            playerDownload.classList.remove('downloaded');
            playerDownload.innerHTML = '<i class="fas fa-download"></i>';
            player.classList.add('active');
            audio.play().catch(() => {});
            playBtn.classList.add('playing');
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            currentPlayBtn = playBtn;
            currentIndex = index;
            allPlays += 1;
            totalPlays.textContent = allPlays;
            localStorage.setItem('totalPlays_aslani', allPlays);
        }
    });

    // انیمیشن لیست
    item.style.animationDelay = `${index * 0.05}s`;
});

function playIndex(i) {
    if (i < 0 || i >= tracks.length) return;
    currentIndex = i;
    const item = songItems[i];
    const playBtn = item.querySelector('.play-btn');
    if (currentPlayBtn && currentPlayBtn !== playBtn) {
        currentPlayBtn.classList.remove('playing');
        currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    audio.src = tracks[i].url;
    title.textContent = tracks[i].title;
    artist.textContent = tracks[i].artist;
    playerDownload.href = tracks[i].url;
    playerDownload.download = tracks[i].title + '.mp3';
    playerDownload.classList.remove('downloaded');
    playerDownload.innerHTML = '<i class="fas fa-download"></i>';
    player.classList.add('active');
    audio.play().catch(() => {});
    playBtn.classList.add('playing');
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    currentPlayBtn = playBtn;
    allPlays += 1;
    totalPlays.textContent = allPlays;
    localStorage.setItem('totalPlays_aslani', allPlays);
}

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentIndex < tracks.length - 1) playIndex(currentIndex + 1);
});
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentIndex > 0) playIndex(currentIndex - 1);
});

playToggle.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        if (currentPlayBtn) {
            currentPlayBtn.classList.add('playing');
            currentPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    } else {
        audio.pause();
        if (currentPlayBtn) {
            currentPlayBtn.classList.remove('playing');
            currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
});

audio.addEventListener('play', () => {
    playToggle.innerHTML = '<i class="fas fa-pause"></i>';
});
audio.addEventListener('pause', () => {
    playToggle.innerHTML = '<i class="fas fa-play"></i>';
});

audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration)) {
        progress.value = (audio.currentTime / audio.duration) * 100;
        currentTime.textContent = formatTime(audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    if (!isNaN(audio.duration)) {
        progress.max = 100;
        durationEl.textContent = formatTime(audio.duration);
    }
});

progress.addEventListener('input', e => {
    audio.currentTime = (e.target.value / 100) * audio.duration;
});

volume.addEventListener('input', e => {
    audio.volume = e.target.value;
});

audio.addEventListener('ended', () => {
    if (currentPlayBtn) {
        currentPlayBtn.classList.remove('playing');
        currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    if (currentIndex < tracks.length - 1) playIndex(currentIndex + 1);
});

playerDownload.addEventListener('click', (e) => {
    e.preventDefault();
    playerDownload.classList.add('downloaded');
    playerDownload.innerHTML = '<i class="fas fa-check"></i>';
    const link = document.createElement('a');
    link.href = playerDownload.href;
    link.download = title.textContent + '.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

closePlayer.addEventListener('click', () => {
    player.classList.remove('active');
    audio.pause();
    if (currentPlayBtn) {
        currentPlayBtn.classList.remove('playing');
        currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Scroll to top
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTop.classList.add('show');
    } else {
        scrollTop.classList.remove('show');
    }
});

scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});