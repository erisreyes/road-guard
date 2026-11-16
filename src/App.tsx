import { useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from './config';
import { useDetector } from './useDetector';
import { chime, unlockAudio } from './chime';
import './styles.css';

type Level = 'clear' | 'caution' | 'danger';

const LABEL: Record<Level, string> = { clear: 'Clear', caution: 'Person ahead', danger: 'Stop' };
const LIT: Record<Level, number> = { clear: 1, caution: 2, danger: 3 };

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const [level, setLevel] = useState<Level>('clear');
  const lastHazardAt = useRef(0);
  const lastChimeAt = useRef(0);
  const { ready, frame, latencyMs } = useDetector(videoRef, running);

  const nearest = useMemo(
    () => frame.people.filter((p) => p.inPath).sort((a, b) => a.distanceM - b.distanceM)[0],
    [frame],
  );

  // Turn the nearest person into an alert level, with a short hold to avoid flicker.
  useEffect(() => {
    const now = performance.now();
    let next: Level = 'clear';
    if (nearest) {
      if (nearest.distanceM <= CONFIG.dangerM) next = 'danger';
      else if (nearest.distanceM <= CONFIG.cautionM) next = 'caution';
    }
    if (next !== 'clear') {
      lastHazardAt.current = now;
      setLevel(next);
      const gap = next === 'danger' ? 1000 : 2500;
      if (!muted && now - lastChimeAt.current > gap) {
        chime(next);
        lastChimeAt.current = now;
      }
    } else if (now - lastHazardAt.current > CONFIG.holdMs) {
      setLevel('clear');
    }
  }, [frame, nearest, muted]);

  // Keep the screen on, and re-request after the app returns to the foreground.
  useEffect(() => {
    if (!running) return;
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try { lock = (await navigator.wakeLock?.request('screen')) ?? null; } catch { /* unsupported */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void request(); };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [running]);

  async function start() {
    setError('');
    try {
      unlockAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setRunning(true);
    } catch {
      setError('Camera unavailable. Allow camera access and open the app over HTTPS.');
    }
  }

  const sub =
    level === 'clear'
      ? running ? 'No pedestrians in your path' : 'Tap Start to begin'
      : nearest ? `About ${Math.round(nearest.distanceM)} m in your path` : 'Person ahead';

  return (
    <main className="app" data-level={level}>
      <section className="camera">
        <div className="frame" style={{ aspectRatio: `${frame.vw} / ${frame.vh}` }}>
          <video ref={videoRef} playsInline muted autoPlay />
          {frame.people.map((p, i) => (
            <div
              key={i}
              className={`box ${p.inPath ? 'in-path' : ''}`}
              style={{
                left: `${(p.x / frame.vw) * 100}%`,
                top: `${(p.y / frame.vh) * 100}%`,
                width: `${(p.w / frame.vw) * 100}%`,
                height: `${(p.h / frame.vh) * 100}%`,
              }}
            >
              <span>Person · {Math.round(p.score * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="chip"><i className={running ? 'live' : ''} />{running ? 'Camera live' : 'Camera off'}</div>
        {!running && (
          <div className="start">
            <button onClick={start} disabled={!ready}>{ready ? 'Start' : 'Loading detector…'}</button>
            {error && <p role="alert">{error}</p>}
          </div>
        )}
      </section>

      <aside className="panel">
        <div className="card status">
          <h2>Status</h2>
          <p className="word">{LABEL[level]}</p>
          <p className="muted">{sub}</p>
          <div className="bars">
            {[1, 2, 3].map((n) => <span key={n} className={n <= LIT[level] ? `lit lit-${n}` : ''} />)}
          </div>
        </div>
        <dl className="card rows">
          <div><dt>People detected</dt><dd>{frame.people.length}</dd></div>
          <div><dt>Nearest (est.)</dt><dd>{nearest ? `~${Math.round(nearest.distanceM)} m` : '—'}</dd></div>
          <div className="extra"><dt>Alert distance</dt><dd>{CONFIG.cautionM} m</dd></div>
        </dl>
        <dl className="card rows sys">
          <div><dt>Model</dt><dd>On device</dd></div>
          <div><dt>Latency</dt><dd>{running ? `${latencyMs} ms` : '—'}</dd></div>
          <div><dt>Chime</dt><dd>{muted ? 'Muted' : 'On'}</dd></div>
        </dl>
        <div className="spacer" />
        <div className="actions">
          <button onClick={() => setMuted((m) => !m)}>{muted ? 'Unmute chime' : 'Mute chime'}</button>
        </div>
      </aside>

      <div className="glow" aria-hidden="true" />
    </main>
  );
}
