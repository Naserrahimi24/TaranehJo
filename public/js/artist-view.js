// public/js/artist-view.js
// پلیر حرفه‌ای + دانلود با پیشرفت + لغو + نوتیفیکیشن

class TaranehSmartPlayer {
  constructor() {
    this.audio = document.getElementById('global-audio');
    this.playButtons = document.querySelectorAll('.play-btn');
    this.player = null;
    this.currentSong = null;
    this.durationCache = new Map();

    if (!this.audio || this.playButtons.length === 0) return;

    this.init();
  }

  init() {
    this.bindAudioEvents();
    this.setupPlayButtons();
    this.loadSavedState();
  }

  createPlayer() {
    if (this.player) return;

    const player = document.createElement('div');
    player.id = 'taraneh-player';
    player.className = 'fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg text-white shadow-2xl z-50 transform translate-y-full transition-transform duration-300';
    player.style.height = '78px';

    player.innerHTML = `
      <div class="flex items-center justify-between h-full px-3 md:px-6 max-w-screen-xl mx-auto">
        <!-- Song Info -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <img src="/default-cover.jpg" alt="Cover" id="player-cover" class="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-lg">
          <div class="min-w-0">
            <div id="player-title" class="font-bold text-sm md:text-base truncate">در حال بارگذاری...</div>
            <div id="player-artist" class="text-xs md:text-sm text-gray-400 truncate">ترانه‌جو</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2 md:gap-4">
          <button id="prev-btn" class="text-gray-400 hover:text-white transition p-2" aria-label="قبلی">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 12l8.5-6-8.5-6v12z"/></svg>
          </button>
          <button id="play-pause-btn" class="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl transition transform active:scale-95">
            <svg class="w-6 h-6 md:w-7 md:h-7 ml-0.5" id="play-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg class="w-6 h-6 md:w-7 md:h-7 hidden" id="pause-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <button id="next-btn" class="text-gray-400 hover:text-white transition p-2" aria-label="بعدی">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <!-- Progress + Time -->
        <div class="hidden md:flex items-center gap-2 flex-1 mx-4">
          <span id="current-time" class="text-xs text-gray-400">0:00</span>
          <div id="progress-container" class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer group">
            <div id="progress-bar" class="h-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-300 relative" style="width:0%">
              <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
            </div>
          </div>
          <span id="duration" class="text-xs text-gray-400">0:00</span>
        </div>

        <!-- Download Button with Cancel & Progress -->
        <div class="relative group hidden md:flex">
          <button id="download-player-btn" 
                  class="flex items-center gap-1 text-gray-400 hover:text-white transition p-2"
                  data-url="#"
                  data-title="آهنگ">
            <svg class="w-5 h-5 md:w-6 md:h-6 download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <svg class="w-5 h-5 md:w-6 md:h-6 cancel-icon hidden text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            <span id="download-player-text" class="hidden lg:inline text-sm">دانلود</span>
          </button>
          <div id="download-player-progress" class="absolute inset-0 h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg opacity-0 transition-opacity pointer-events-none" style="width:0%"></div>
        </div>

        <!-- Close Button -->
        <button id="close-player" class="text-gray-400 hover:text-white transition p-2" aria-label="بستن">
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(player);
    this.player = player;

    // Cache elements
    this.playPauseBtn = player.querySelector('#play-pause-btn');
    this.playIcon = player.querySelector('#play-icon');
    this.pauseIcon = player.querySelector('#pause-icon');
    this.titleEl = player.querySelector('#player-title');
    this.artistEl = player.querySelector('#player-artist');
    this.coverEl = player.querySelector('#player-cover');
    this.currentTimeEl = player.querySelector('#current-time');
    this.durationEl = player.querySelector('#duration');
    this.progressContainer = player.querySelector('#progress-container');
    this.progressBar = player.querySelector('#progress-bar');
    this.downloadBtn = player.querySelector('#download-player-btn');
    this.downloadPlayerProgress = player.querySelector('#download-player-progress');
    this.downloadPlayerText = player.querySelector('#download-player-text');
    this.downloadPlayerIcon = player.querySelector('.download-icon');
    this.downloadPlayerCancelIcon = player.querySelector('.cancel-icon');

    // Events
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    player.querySelector('#prev-btn').addEventListener('click', () => this.prevSong());
    player.querySelector('#next-btn').addEventListener('click', () => this.nextSong());
    player.querySelector('#close-player').addEventListener('click', () => this.hide());
    this.progressContainer?.addEventListener('click', (e) => this.seek(e));

    // دانلود در پلیر
    this.downloadBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.currentSong?.src) return;

      if (this.downloadPlayerProgress.dataset.controller) {
        const controller = this.downloadPlayerProgress.dataset.controller;
        this.cancelDownload(this.downloadPlayerProgress, this.downloadPlayerText, this.downloadPlayerIcon, this.downloadPlayerCancelIcon, controller);
        delete this.downloadPlayerProgress.dataset.controller;
      } else {
        this.startDownload(
          this.currentSong.src,
          this.currentSong.title,
          this.downloadPlayerProgress,
          this.downloadPlayerText,
          this.downloadPlayerIcon,
          this.downloadPlayerCancelIcon
        );
      }
    });

    requestAnimationFrame(() => player.classList.remove('translate-y-full'));
  }

  bindAudioEvents() {
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.nextSong());
    this.audio.addEventListener('play', () => this.setPlaying(true));
    this.audio.addEventListener('pause', () => this.setPlaying(false));
  }

  setupPlayButtons() {
    this.playButtons.forEach(btn => {
      const src = btn.dataset.src;
      this.loadSongDuration(src, btn);

      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        const artist = btn.dataset.artist;
        const cover = btn.dataset.cover;
        this.playSong(src, title, artist, cover);
        this.highlightButton(btn);
      });

      // دانلود در لیست
      const downloadBtn = btn.parentElement.querySelector('.download-btn');
      if (!downloadBtn) return;

      const progressEl = downloadBtn.parentElement.querySelector('.download-progress');
      const textEl = downloadBtn.querySelector('.download-text');
      const iconEl = downloadBtn.querySelector('.download-icon');
      const cancelIconEl = downloadBtn.querySelector('.cancel-icon');

      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = downloadBtn.dataset.url;
        const title = downloadBtn.dataset.title;

        if (progressEl.dataset.controller) {
          const controller = progressEl.dataset.controller;
          this.cancelDownload(progressEl, textEl, iconEl, cancelIconEl, controller);
          delete progressEl.dataset.controller;
        } else {
          this.startDownload(url, title, progressEl, textEl, iconEl, cancelIconEl);
        }
      });
    });
  }

  loadSongDuration(src, btn) {
    if (this.durationCache.has(src)) {
      this.updateButtonDuration(btn, this.durationCache.get(src));
      return;
    }

    const durationSpan = document.createElement('span');
    durationSpan.className = 'text-xs text-gray-500 ml-2';
    durationSpan.textContent = 'در حال بارگذاری...';
    btn.parentElement.appendChild(durationSpan);

    const tempAudio = new Audio(src);
    tempAudio.preload = 'metadata';
    tempAudio.addEventListener('loadedmetadata', () => {
      const duration = tempAudio.duration;
      this.durationCache.set(src, duration);
      this.updateButtonDuration(btn, duration);
    });
    tempAudio.addEventListener('error', () => {
      durationSpan.textContent = 'نامشخص';
    });
  }

  updateButtonDuration(btn, duration) {
    let span = btn.parentElement.querySelector('span.text-xs');
    if (!span) {
      span = document.createElement('span');
      span.className = 'text-xs text-gray-500 ml-2';
      btn.parentElement.appendChild(span);
    }
    span.textContent = this.formatTime(duration);
  }

  playSong(src, title, artist, cover) {
    if (this.currentSong?.src === src) {
      this.togglePlayPause();
      return;
    }

    this.createPlayer();
    this.currentSong = { src, title, artist, cover };
    this.audio.src = src;
    this.updateUI(title, artist, cover);
    this.audio.play().catch(() => {});
    this.saveState();
  }

  togglePlayPause() {
    this.audio.paused ? this.audio.play() : this.audio.pause();
  }

  setPlaying(playing) {
    this.playIcon.classList.toggle('hidden', playing);
    this.pauseIcon.classList.toggle('hidden', !playing);
  }

  updateProgress() {
    if (!this.audio.duration) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.progressBar.style.width = `${percent}%`;
    this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
  }

  updateDuration() {
    this.durationEl.textContent = this.formatTime(this.audio.duration);
  }

  seek(e) {
    const rect = this.progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = Math.max(0, Math.min(pos * this.audio.duration, this.audio.duration));
  }

  prevSong() {
    const currentIndex = Array.from(this.playButtons).findIndex(b => b.dataset.src === this.currentSong?.src);
    const prevBtn = this.playButtons[currentIndex - 1] || this.playButtons[this.playButtons.length - 1];
    if (prevBtn) prevBtn.click();
  }

  nextSong() {
    const currentIndex = Array.from(this.playButtons).findIndex(b => b.dataset.src === this.currentSong?.src);
    const nextBtn = this.playButtons[currentIndex + 1] || this.playButtons[0];
    if (nextBtn) nextBtn.click();
  }

  updateUI(title, artist, cover) {
    this.titleEl.textContent = title;
    this.artistEl.textContent = artist;
    this.coverEl.src = cover || '/default-cover.jpg';

    if (this.downloadBtn && this.currentSong) {
      this.downloadBtn.dataset.url = this.currentSong.src;
      this.downloadBtn.dataset.title = title;
    }
  }

  highlightButton(activeBtn) {
    this.playButtons.forEach(b => {
      b.classList.remove('bg-teal-600', 'text-white');
      b.classList.add('bg-gray-700', 'text-gray-300');
    });
    activeBtn.classList.remove('bg-gray-700', 'text-gray-300');
    activeBtn.classList.add('bg-teal-600', 'text-white');
  }

  hide() {
    if (this.player) {
      this.player.classList.add('translate-y-full');
      setTimeout(() => {
        this.player.remove();
        this.player = null;
        this.audio.pause();
        this.audio.src = '';
      }, 300);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // --- دانلود با پیشرفت + لغو + نوتیفیکیشن ---
  startDownload(url, title, progressEl, textEl, iconEl, cancelIconEl) {
    if (!progressEl || !textEl) return;

    progressEl.style.width = '0%';
    progressEl.classList.remove('opacity-0');
    textEl.textContent = '0%';
    iconEl.classList.add('hidden');
    cancelIconEl.classList.remove('hidden');

    const controller = new AbortController();
    const signal = controller.signal;
    const chunks = [];

    fetch(url, { signal })
      .then(response => {
        if (!response.ok) throw new Error('Network error');
        const total = parseInt(response.headers.get('content-length'), 10);
        let loaded = 0;

        const reader = response.body.getReader();

        const pump = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              const blob = new Blob(chunks, { type: 'audio/mpeg' });
              const blobUrl = URL.createObjectURL(blob);

              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = `${title}.mp3`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);

              this.showDownloadCompleteNotification(title);

              progressEl.style.width = '100%';
              setTimeout(() => {
                progressEl.classList.add('opacity-0');
                textEl.textContent = 'دانلود';
                iconEl.classList.remove('hidden');
                cancelIconEl.classList.add('hidden');
              }, 600);
              return;
            }

            chunks.push(value);
            loaded += value.byteLength;
            const percent = total ? Math.round((loaded / total) * 100) : 0;
            progressEl.style.width = `${percent}%`;
            textEl.textContent = `${percent}%`;

            return pump();
          });
        };

        return pump();
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          this.cancelDownload(progressEl, textEl, iconEl, cancelIconEl);
        } else {
          console.error('Download failed:', err);
          progressEl.classList.add('opacity-0');
          textEl.textContent = 'خطا';
          setTimeout(() => {
            textEl.textContent = 'دانلود';
            iconEl.classList.remove('hidden');
            cancelIconEl.classList.add('hidden');
          }, 1500);
        }
      });

    progressEl.dataset.controller = controller;
  }

  cancelDownload(progressEl, textEl, iconEl, cancelIconEl, controller) {
    if (controller) controller.abort();
    progressEl.style.width = '0%';
    progressEl.classList.add('opacity-0');
    textEl.textContent = 'دانلود';
    iconEl.classList.remove('hidden');
    cancelIconEl.classList.add('hidden');
  }

  showDownloadCompleteNotification(title) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notification = new Notification('دانلود کامل شد!', {
      body: `آهنگ "${title}" با موفقیت دانلود شد.`,
      icon: '/icon-192.png',
      tag: 'download-complete',
      renotify: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  }

  saveState() {
    if (!this.currentSong) return;
    localStorage.setItem('taraneh-player-state', JSON.stringify({
      src: this.currentSong.src,
      title: this.currentSong.title,
      artist: this.currentSong.artist,
      cover: this.currentSong.cover,
      currentTime: this.audio.currentTime
    }));
  }

  loadSavedState() {
    const saved = localStorage.getItem('taraneh-player-state');
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      const btn = document.querySelector(`.play-btn[data-src="${state.src}"]`);
      if (btn) {
        setTimeout(() => {
          btn.click();
          this.audio.currentTime = state.currentTime;
        }, 500);
      }
    } catch (e) { /* ignore */ }
  }
}

// راه‌اندازی
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('global-audio')) {
    new TaranehSmartPlayer();
  }
});