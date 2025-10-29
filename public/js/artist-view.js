// public/js/artist-view.js
// Taraneh Smart Player v2.1 – تمیز، بدون خطا، مدرن، کامل

class TaranehSmartPlayer {
  constructor() {
    this.audio = document.getElementById('global-audio');
    this.playButtons = document.querySelectorAll('.play-btn');
    this.player = null;
    this.currentSong = null;
    this.durationCache = new Map();
    this.analyser = null;
    this.waveformCanvas = null;
    this.volume = 0.7;

    if (!this.audio) return;
    window.smartPlayer = window.smartPlayer || this;
    this.init();
  }

  init() {
    this.bindAudioEvents();
    this.setupPlayButtons();
    this.setupKeyboardShortcuts();
    this.requestNotificationPermission();
    this.loadSavedState(); // بعد از bind و setup
  }

  createPlayer() {
    if (this.player) return;

    const player = document.createElement('div');
    player.id = 'taraneh-player';
    player.className = `
      fixed inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent
      backdrop-blur-xl text-white z-50 border-t border-white/10
      shadow-2xl transform translate-y-full transition-all duration-500 ease-out
      flex flex-col h-24 md:h-20
    `;

    player.innerHTML = `
      <!-- Waveform -->
      <div class="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <canvas id="waveform-canvas" class="w-full h-full"></canvas>
      </div>

      <div class="relative flex items-center justify-between h-full px-4 md:px-8 max-w-screen-2xl mx-auto z-10">

        <!-- Song Info -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <img src="/default-cover.jpg" alt="Cover" id="player-cover"
               class="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-xl ring-2 ring-white/20">
          <div class="min-w-0">
            <div id="player-title" class="font-bold text-sm md:text-base truncate bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
              در حال بارگذاری...
            </div>
            <div id="player-artist" class="text-xs md:text-sm text-gray-300 truncate">ترانه‌جو</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-3 md:gap-5">
          <button id="prev-btn" class="control-btn" aria-label="قبلی">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 12l8.5-6-8.5-6v12z"/></svg>
          </button>
          <button id="play-pause-btn" class="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 
                                            hover:from-teal-600 hover:to-cyan-700 shadow-xl flex items-center justify-center 
                                            transition-all duration-200 active:scale-95">
            <svg class="w-7 h-7 play-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg class="w-7 h-7 pause-icon hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <button id="next-btn" class="control-btn" aria-label="بعدی">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <!-- Progress -->
        <div class="hidden md:flex items-center gap-3 flex-1 mx-6">
          <span id="current-time" class="text-xs font-mono text-gray-400">0:00</span>
          <div id="progress-container" class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
            <div id="progress-bar" class="h-full bg-gradient-to-r from-teal-400 to-cyan-500 w-0 transition-all duration-300"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 shadow-lg"></div>
          </div>
          <span id="duration" class="text-xs font-mono text-gray-400">0:00</span>
        </div>

        <!-- Volume + Download -->
        <div class="hidden lg:flex items-center gap-3">
          <button id="volume-btn" class="control-btn" aria-label="صدا">
            <svg class="w-5 h-5 volume-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            <svg class="w-5 h-5 mute-icon hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81l2.04 2.04L19.73 21l1.27-1.27-16-16zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          </button>
          <div id="volume-container" class="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer opacity-0 invisible transition-opacity">
            <div id="volume-bar" class="h-full bg-gradient-to-r from-teal-400 to-cyan-500" style="width:70%"></div>
          </div>

          <div class="relative group">
            <button id="download-player-btn" class="control-btn flex items-center gap-1" data-url="#" data-title="آهنگ">
              <svg class="w-5 h-5 download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <svg class="w-5 h-5 cancel-icon hidden text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              <span id="download-player-text" class="text-xs">دانلود</span>
            </button>
            <div id="download-player-progress" class="absolute inset-0 h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full opacity-0 transition-opacity" style="width:0%"></div>
          </div>
        </div>

        <button id="close-player" class="control-btn" aria-label="بستن">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(player);
    this.player = player;

    // Cache
    this.playPauseBtn = player.querySelector('#play-pause-btn');
    this.playIcon = player.querySelector('.play-icon');
    this.pauseIcon = player.querySelector('.pause-icon');
    this.titleEl = player.querySelector('#player-title');
    this.artistEl = player.querySelector('#player-artist');
    this.coverEl = player.querySelector('#player-cover');
    this.currentTimeEl = player.querySelector('#current-time');
    this.durationEl = player.querySelector('#duration');
    this.progressContainer = player.querySelector('#progress-container');
    this.progressBar = player.querySelector('#progress-bar');
    this.downloadBtn = player.querySelector('#download-player-btn');
    this.downloadProgress = player.querySelector('#download-player-progress');
    this.downloadText = player.querySelector('#download-player-text');
    this.downloadIcon = player.querySelector('.download-icon');
    this.cancelIcon = player.querySelector('.cancel-icon');
    this.volumeBtn = player.querySelector('#volume-btn');
    this.volumeContainer = player.querySelector('#volume-container');
    this.volumeBar = player.querySelector('#volume-bar');
    this.waveformCanvas = player.querySelector('#waveform-canvas');

    // Events
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    player.querySelector('#prev-btn').addEventListener('click', () => this.prevSong());
    player.querySelector('#next-btn').addEventListener('click', () => this.nextSong());
    player.querySelector('#close-player').addEventListener('click', () => this.hide());
    this.progressContainer?.addEventListener('click', e => this.seek(e));
    this.volumeBtn.addEventListener('click', () => this.toggleVolume());
    this.volumeContainer.addEventListener('click', e => this.setVolume(e));
    this.downloadBtn.addEventListener('click', e => this.handleDownloadClick(e));

    // Waveform
    this.initWaveform();

    // Show
    requestAnimationFrame(() => {
      player.classList.remove('translate-y-full');
    });
  }

  bindAudioEvents() {
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.nextSong());
    this.audio.addEventListener('play', () => this.setPlaying(true));
    this.audio.addEventListener('pause', () => this.setPlaying(false));
    this.audio.volume = this.volume;
  }

  setupPlayButtons() {
    this.playButtons.forEach(btn => {
      const src = btn.dataset.src;
      if (src) this.loadSongDuration(src, btn);

      btn.addEventListener('click', () => {
        this.playSong(btn.dataset.src, btn.dataset.title, btn.dataset.artist, btn.dataset.cover);
        this.highlightButton(btn);
      });

      const downloadBtn = btn.closest('.song-item')?.querySelector('.download-btn');
      if (downloadBtn) {
        const progressEl = downloadBtn.parentElement.querySelector('.download-progress');
        const textEl = downloadBtn.querySelector('.download-text');
        const iconEl = downloadBtn.querySelector('.download-icon');
        const cancelEl = downloadBtn.querySelector('.cancel-icon');

        downloadBtn.addEventListener('click', e => {
          e.preventDefault();
          const url = downloadBtn.dataset.url;
          const title = downloadBtn.dataset.title;
          if (progressEl.dataset.controller) {
            this.cancelDownload(progressEl, textEl, iconEl, cancelEl, progressEl.dataset.controller);
            delete progressEl.dataset.controller;
          } else {
            this.startDownload(url, title, progressEl, textEl, iconEl, cancelEl);
          }
        });
      }
    });
  }

  loadSongDuration(src, btn) {
    if (this.durationCache.has(src)) {
      this.updateButtonDuration(btn, this.durationCache.get(src));
      return;
    }

    const span = document.createElement('span');
    span.className = 'text-xs text-gray-500 ml-2';
    span.textContent = 'در حال بارگذاری...';
    btn.parentElement.appendChild(span);

    const temp = new Audio(src);
    temp.preload = 'metadata';
    temp.addEventListener('loadedmetadata', () => {
      const duration = temp.duration;
      this.durationCache.set(src, duration);
      this.updateButtonDuration(btn, duration);
      temp.remove();
    });
    temp.addEventListener('error', () => {
      span.textContent = 'نامشخص';
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
    if (!src) return;

    if (this.currentSong?.src === src && !this.audio.paused) {
      this.audio.pause();
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
    const index = Array.from(this.playButtons).findIndex(b => b.dataset.src === this.currentSong?.src);
    const prev = this.playButtons[index - 1] || this.playButtons[this.playButtons.length - 1];
    prev?.click();
  }

  nextSong() {
    const index = Array.from(this.playButtons).findIndex(b => b.dataset.src === this.currentSong?.src);
    const next = this.playButtons[index + 1] || this.playButtons[0];
    next?.click();
  }

  updateUI(title, artist, cover) {
    this.titleEl.textContent = title || 'نامشخص';
    this.artistEl.textContent = artist || 'ناشناس';
    this.coverEl.src = cover || '/default-cover.jpg';
    this.downloadBtn.dataset.url = this.currentSong.src;
    this.downloadBtn.dataset.title = title;
  }

  highlightButton(activeBtn) {
    this.playButtons.forEach(b => {
      b.classList.remove('bg-teal-600', 'text-white');
      b.classList.add('bg-gray-800', 'text-gray-400');
    });
    activeBtn.classList.remove('bg-gray-800', 'text-gray-400');
    activeBtn.classList.add('bg-teal-600', 'text-white');
  }

  hide() {
    if (!this.player) return;
    this.player.classList.add('translate-y-full');
    setTimeout(() => {
      this.player.remove();
      this.player = null;
      this.audio.pause();
      this.audio.src = '';
    }, 500);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // --- دانلود ---
  handleDownloadClick(e) {
    e.preventDefault();
    if (!this.currentSong?.src) return;

    const controller = this.downloadProgress.dataset.controller;
    if (controller) {
      this.cancelDownload(this.downloadProgress, this.downloadText, this.downloadIcon, this.cancelIcon, controller);
      delete this.downloadProgress.dataset.controller;
    } else {
      this.startDownload(
        this.currentSong.src,
        this.currentSong.title,
        this.downloadProgress,
        this.downloadText,
        this.downloadIcon,
        this.cancelIcon
      );
    }
  }

  startDownload(url, title, progressEl, textEl, iconEl, cancelIconEl) {
    progressEl.style.width = '0%';
    progressEl.classList.remove('opacity-0');
    textEl.textContent = '0%';
    iconEl.classList.add('hidden');
    cancelIconEl.classList.remove('hidden');

    const controller = new AbortController();
    progressEl.dataset.controller = controller;

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        const total = parseInt(res.headers.get('content-length'), 10);
        let loaded = 0;
        const chunks = [];
        const reader = res.body.getReader();

        const pump = () => reader.read().then(({ done, value }) => {
          if (done) {
            const blob = new Blob(chunks, { type: 'audio/mpeg' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${title}.mp3`;
            a.click();
            URL.revokeObjectURL(a.href);
            this.showNotification('دانلود کامل شد!', `"${title}" دانلود شد.`);
            this.resetDownloadUI(progressEl, textEl, iconEl, cancelIconEl);
            return;
          }
          chunks.push(value);
          loaded += value.byteLength;
          const percent = total ? Math.round((loaded / total) * 100) : 0;
          progressEl.style.width = `${percent}%`;
          textEl.textContent = `${percent}%`;
          return pump();
        });
        return pump();
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          textEl.textContent = 'خطا';
          setTimeout(() => this.resetDownloadUI(progressEl, textEl, iconEl, cancelIconEl), 1500);
        }
      });
  }

  cancelDownload(progressEl, textEl, iconEl, cancelIconEl, controller) {
    controller?.abort();
    this.resetDownloadUI(progressEl, textEl, iconEl, cancelIconEl);
  }

  resetDownloadUI(progressEl, textEl, iconEl, cancelIconEl) {
    progressEl.style.width = '0%';
    progressEl.classList.add('opacity-0');
    textEl.textContent = 'دانلود';
    iconEl.classList.remove('hidden');
    cancelIconEl.classList.add('hidden');
  }

  showNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  }

  toggleVolume() {
    this.volumeContainer.classList.toggle('opacity-0');
    this.volumeContainer.classList.toggle('invisible');
  }

  setVolume(e) {
    const rect = this.volumeContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const vol = Math.max(0, Math.min(1, pos));
    this.audio.volume = vol;
    this.volume = vol;
    this.volumeBar.style.width = `${vol * 100}%`;
    this.volumeBtn.querySelector('.volume-icon').classList.toggle('hidden', vol === 0);
    this.volumeBtn.querySelector('.mute-icon').classList.toggle('hidden', vol !== 0);
  }

  initWaveform() {
    const canvas = this.waveformCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const draw = () => {
      if (!this.audio || this.audio.paused) return;
      const data = new Uint8Array(128);
      this.getAnalyser().getByteFrequencyData(data);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.6)';
      ctx.beginPath();

      const w = canvas.width / data.length * 2.5;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const h = (data[i] / 255) * canvas.height * 0.5;
        ctx.moveTo(x, canvas.height / 2 - h / 2);
        ctx.lineTo(x, canvas.height / 2 + h / 2);
        x += w + 1;
      }
      ctx.stroke();
      requestAnimationFrame(draw);
    };

    this.audio.addEventListener('play', () => requestAnimationFrame(draw));
  }

  getAnalyser() {
    if (this.analyser) return this.analyser;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(this.audio);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    return this.analyser;
  }

  saveState() {
    if (!this.currentSong) return;
    localStorage.setItem('taraneh-player-state', JSON.stringify({
      src: this.currentSong.src,
      title: this.currentSong.title,
      artist: this.currentSong.artist,
      cover: this.currentSong.cover,
      currentTime: this.audio.currentTime,
      volume: this.audio.volume
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
          this.audio.volume = state.volume || 0.7;
          this.volume = state.volume || 0.7;
        }, 300);
      }
    } catch (e) {}
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (!this.player || e.target.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); this.togglePlayPause(); }
      if (e.key === 'ArrowLeft') this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
      if (e.key === 'ArrowRight') this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
      if (e.key === 'm') this.audio.muted = !this.audio.muted;
      if (e.key === 'd') this.downloadBtn?.click();
    });
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('global-audio')) {
    // اگر هنوز ساخته نشده، بساز و در window ذخیره کن
    window.smartPlayer = window.smartPlayer || new TaranehSmartPlayer();
  }
});

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});