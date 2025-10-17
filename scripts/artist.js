document.addEventListener('DOMContentLoaded', function() {
    // --- مدیریت مودال اشتراک ---
    const modal = document.getElementById('subscription-modal');
    const closeBtn = document.querySelector('.close');

    // رویداد برای دکمه‌های پخش قفل شده
    const lockedButtons = document.querySelectorAll('.play-btn.locked');
    lockedButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
    });

    // بستن مودال با کلیک روی ضربدر
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // بستن مودال با کلیک خارج از آن
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- مدیریت دکمه پخش آهنگ ---
    const playButtons = document.querySelectorAll('.play-btn:not(.locked)');
playButtons.forEach(button => {
    button.addEventListener('click', function() {
        const songTitle = this.getAttribute('data-song-title');
        const songArtist = this.getAttribute('data-song-artist');
        const songUrl = this.getAttribute('data-song-url'); // آدرس را می‌خوانیم

        if (window.playSong) {
            // آدرس را هم به تابع پخش ارسال می‌کنیم
            window.playSong({ title: songTitle, artist: songArtist, url: songUrl });
        }
    });
});
    // --- مدیریت دکمه دانلود ---
    const downloadButtons = document.querySelectorAll('.download-btn');
downloadButtons.forEach(button => {
    button.addEventListener('click', function() {
        const songTitle = this.getAttribute('data-song-title');
        const songArtist = this.getAttribute('data-song-artist');
        const songUrl = this.getAttribute('data-song-url'); // آدرس را می‌خوانیم
        
        let downloadedSongs = JSON.parse(localStorage.getItem('downloadedSongs')) || [];
        
        if (!downloadedSongs.find(s => s.title === songTitle && s.artist === songArtist)) {
            // آدرس را هم همراه با اطلاعات دیگر ذخیره می‌کنیم
            downloadedSongs.push({ title: songTitle, artist: songArtist, url: songUrl });
            localStorage.setItem('downloadedSongs', JSON.stringify(downloadedSongs));
            // ...
        }
    });
});
    // --- مدیریت دکمه افزودن به پلی‌لیست ---
    const addToPlaylistButtons = document.querySelectorAll('.add-to-playlist-btn');
    addToPlaylistButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songTitle = this.getAttribute('data-song-title');
            const songArtist = this.getAttribute('data-song-artist');
            
            let playlists = JSON.parse(localStorage.getItem('playlists')) || {};
            
            if (Object.keys(playlists).length === 0) {
                alert('شما هنوز هیچ پلی‌لیستی نساخته‌اید! ابتدا به صفحه "کتابخانه من" بروید و یک پلی‌لیست بسازید.');
                return;
            }

            // ایجاد مودال برای انتخاب پلی‌لیست
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>افزودن به پلی‌لیست</h2>
                    <div class="playlist-list">
                        ${Object.keys(playlists).map(name => `
                            <button class="playlist-option" data-playlist="${name}">${name}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // مدیریت رویدادهای مودال
            modal.querySelector('.close').onclick = () => document.body.removeChild(modal);
            modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
            
            modal.querySelectorAll('.playlist-option').forEach(option => {
                option.addEventListener('click', function() {
                    const playlistName = this.getAttribute('data-playlist');
                    playlists[playlistName].push({ title: songTitle, artist: songArtist });
                    localStorage.setItem('playlists', JSON.stringify(playlists));
                    alert(`${songTitle} به پلی‌لیست "${playlistName}" اضافه شد.`);
                    document.body.removeChild(modal);
                });
            });
        });
    });

    // --- مدیریت دکمه دنبال کردن ---
    const followBtn = document.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', function() {
            if (this.textContent === 'دنبال کردن') {
                this.textContent = 'دنبال شده';
                this.style.backgroundColor = 'var(--primary-color)';
                this.style.color = 'white';
                this.style.borderColor = 'var(--primary-color)';
            } else {
                this.textContent = 'دنبال کردن';
                this.style.backgroundColor = '';
                this.style.color = '';
                this.style.borderColor = '';
            }
        });
    }
});