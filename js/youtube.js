// YouTube music source via the official IFrame Player API.
// Audio can't be analysed cross-origin, so we only use it as a clock for the beat grid.

let apiReady = null;
function loadAPI() {
  apiReady ||= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { apiReady = null; reject(new Error('無法載入 YouTube API')); };
    document.head.appendChild(s);
  });
  return apiReady;
}

export function parseYouTubeId(input) {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1, 12) || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const ERRORS = {
  2: '影片 ID 無效', 5: '播放器錯誤', 100: '找不到影片或已設為私人',
  101: '此影片不允許嵌入播放', 150: '此影片不允許嵌入播放',
};

export class YouTubeSource {
  constructor(elementId, { onState, onError, onReady } = {}) {
    this.elementId = elementId;
    this.player = null;
    this.playing = false;
    this.t = 0;
    this.cb = { onState, onError, onReady };
  }

  async load(id) {
    const YT = await loadAPI();
    this.t = 0;
    if (this.player) {
      this.player.cueVideoById(id);
      return;
    }
    await new Promise((resolve) => {
      this.player = new YT.Player(this.elementId, {
        videoId: id,
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { resolve(); this.cb.onReady?.(); },
          onStateChange: (e) => {
            this.playing = e.data === YT.PlayerState.PLAYING;
            this.cb.onState?.(e.data, this.playing);
          },
          onError: (e) => this.cb.onError?.(ERRORS[e.data] || `YouTube 錯誤 ${e.data}`),
        },
      });
    });
  }

  get ready() { return !!this.player?.playVideo; }
  get title() { return this.player?.getVideoData?.().title || ''; }
  play() { this.player?.playVideo(); }
  pause() { this.player?.pauseVideo(); }
  seek(t) { this.player?.seekTo(t, true); this.t = t; }

  // Smoothed playback time: extrapolate between the player's coarse time updates.
  time(dt) {
    if (!this.ready) return 0;
    const raw = this.player.getCurrentTime() || 0;
    if (!this.playing) { this.t = raw; return raw; }
    const rate = this.player.getPlaybackRate?.() || 1;
    this.t += dt * rate;
    const err = raw - this.t;
    if (Math.abs(err) > 0.3) this.t = raw;
    else this.t += err * 0.08;
    return this.t;
  }
}
