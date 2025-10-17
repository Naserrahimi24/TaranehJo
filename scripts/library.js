document.addEventListener('DOMContentLoaded', function() {
    const downloadedSongsList = document.getElementById('downloaded-songs-list');
    const playlistsContainer = document.getElementById('playlists-container');
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const playlistNameInput = document.getElementById('playlist-name-input');

    // تابع برای رندر کردن آهنگ‌های دانلود شده
    function renderDownloadedSongs() {
        const songs = JSON.parse(localStorage.getItem('downloadedSongs')) || [];
        if (songs.length === 0) {
            downloadedSongsList.innerHTML = '<p>شما هنوز آهنگی دانلود نکرده‌اید.</p>';
            return;
        }
        downloadedSongsList.innerHTML = songs.map((song, index) => `
    <div class="song-item">
        ...
        <div class="song-actions">
            <button class="play-btn" data-song-title="${song.title}" data-song-artist="${song.artist}" data-song-url="${song.url}">پخش</button>
        </div>
    </div>
`).join('');

// و در ادامه، بخش اتصال رویدادها هم باید آدرس را بخواند
downloadedSongsList.querySelectorAll('.play-btn').forEach(button => {
    button.addEventListener('click', function() {
        const songTitle = this.getAttribute('data-song-title');
        const songArtist = this.getAttribute('data-song-artist');
        const songUrl = this.getAttribute('data-song-url'); // این خط اضافه شد

        if (window.playSong) {
            window.playSong({ title: songTitle, artist: songArtist, url: songUrl });
        }
    });
});
        // اتصال رویدادهای پخش به دکمه‌های جدید
        downloadedSongsList.querySelectorAll('.play-btn').forEach(button => {
            button.addEventListener('click', function() {
                const songTitle = this.getAttribute('data-song-title');
                const songArtist = this.getAttribute('data-song-artist');
                if (window.playSong) {
                    window.playSong({ title: songTitle, artist: songArtist });
                }
            });
        });
    }

    // تابع برای رندر کردن پلی‌لیست‌ها
    function renderPlaylists() {
        const playlists = JSON.parse(localStorage.getItem('playlists')) || {};
        if (Object.keys(playlists).length === 0) {
            playlistsContainer.innerHTML = '<p>شما هنوز پلی‌لیستی نساخته‌اید.</p>';
            return;
        }

        playlistsContainer.innerHTML = Object.entries(playlists).map(([name, songs]) => `
            <div class="playlist-card">
                <h3>${name}</h3>
                <div class="song-list">
                    ${songs.length > 0 ? songs.map((song, index) => `
                        <div class="song-item">
                            <div class="song-number">${index + 1}</div>
                            <div class="song-info">
                                <h4 class="song-title">${song.title}</h4>
                                <p class="song-artist">${song.artist}</p>
                            </div>
                            <div class="song-actions">
                                <button class="play-btn" data-song-title="${song.title}" data-song-artist="${song.artist}">پخش</button>
                            </div>
                        </div>
                    `).join('') : '<p style="padding: 15px; color: var(--text-secondary);">این پلی‌لیست خالی است.</p>'}
                </div>
            </div>
        `).join('');

        // اتصال رویدادهای پخش
        playlistsContainer.querySelectorAll('.play-btn').forEach(button => {
            button.addEventListener('click', function() {
                const songTitle = this.getAttribute('data-song-title');
                const songArtist = this.getAttribute('data-song-artist');
                if (window.playSong) {
                    window.playSong({ title: songTitle, artist: songArtist });
                }
            });
        });
    }

    // رویداد ساخت پلی‌لیست جدید
    createPlaylistBtn.addEventListener('click', function() {
        const name = playlistNameInput.value.trim();
        if (!name) {
            alert('لطفاً نام پلی‌لیست را وارد کنید.');
            return;
        }
        let playlists = JSON.parse(localStorage.getItem('playlists')) || {};
        if (playlists[name]) {
            alert('یک پلی‌لیست با این نام وجود دارد.');
            return;
        }
        playlists[name] = [];
        localStorage.setItem('playlists', JSON.stringify(playlists));
        playlistNameInput.value = '';
        renderPlaylists();
        alert(`پلی‌لیست "${name}" با موفقیت ساخته شد.`);
    });

    // بارگذاری اولیه
    renderDownloadedSongs();
    renderPlaylists();
});