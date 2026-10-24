import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DICT, LANGS, detectLang, type Lang } from './i18n';

/* ------------------------------------------------------------------ */
/* 样本：DR-VCTK 复合片段，device 为输入，after 由 Takeweave 100% 跑出      */
/* ------------------------------------------------------------------ */

type Sample = {
  id: string;
  speaker: string;
  condition: string;
  channel: string;
  seconds: number;
  before: string;
  after: string;
  reference: string;
};

const SAMPLES: Sample[] = [
  {
    id: 's1',
    speaker: 'p226',
    condition: 'Office1 · ClosedWindow',
    channel: 'ch1',
    seconds: 10,
    before: '/audio/takeweave/s1-before.m4a',
    after: '/audio/takeweave/s1-after.m4a',
    reference: '/audio/takeweave/s1-reference.m4a',
  },
  {
    id: 's2',
    speaker: 'p230',
    condition: 'Office1 · OpenedWindow',
    channel: 'ch4',
    seconds: 10,
    before: '/audio/takeweave/s2-before.m4a',
    after: '/audio/takeweave/s2-after.m4a',
    reference: '/audio/takeweave/s2-reference.m4a',
  },
  {
    id: 's3',
    speaker: 'p239',
    condition: 'Office1 · OpenedWindow',
    channel: 'ch8',
    seconds: 10,
    before: '/audio/takeweave/s3-before.m4a',
    after: '/audio/takeweave/s3-after.m4a',
    reference: '/audio/takeweave/s3-reference.m4a',
  },
  {
    id: 's4',
    speaker: 'p254',
    condition: 'Office1 · OpenedWindow',
    channel: 'ch5',
    seconds: 10,
    before: '/audio/takeweave/s4-before.m4a',
    after: '/audio/takeweave/s4-after.m4a',
    reference: '/audio/takeweave/s4-reference.m4a',
  },
  {
    id: 's5',
    speaker: 'p244',
    condition: 'Office1 · OpenedWindow',
    channel: 'ch2',
    seconds: 10,
    before: '/audio/takeweave/s5-before.m4a',
    after: '/audio/takeweave/s5-after.m4a',
    reference: '/audio/takeweave/s5-reference.m4a',
  },
];

type TrackKey = 'before' | 'after' | 'reference';
const TRACKS: TrackKey[] = ['before', 'after', 'reference'];

/* ------------------------------------------------------------------ */
/* 音频工具                                                             */
/* ------------------------------------------------------------------ */

const dbfs = (v: number) => (v <= 0 ? -Infinity : 20 * Math.log10(v));

function envelope(buffer: AudioBuffer, buckets: number): Float32Array {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / buckets));
  const out = new Float32Array(buckets);
  for (let i = 0; i < buckets; i++) {
    const start = i * step;
    const end = Math.min(data.length, start + step);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const a = Math.abs(data[j]);
      if (a > peak) peak = a;
    }
    out[i] = peak;
  }
  return out;
}

function noiseFloorDb(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const frame = Math.floor(buffer.sampleRate * 0.02);
  if (frame < 1) return -Infinity;
  const rms: number[] = [];
  for (let i = 0; i + frame <= data.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) sum += data[j] * data[j];
    rms.push(Math.sqrt(sum / frame));
  }
  if (!rms.length) return -Infinity;
  rms.sort((a, b) => a - b);
  const quiet = rms.slice(0, Math.max(1, Math.floor(rms.length * 0.1)));
  return dbfs(quiet[Math.floor(quiet.length / 2)]);
}

function peakDb(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > peak) peak = a;
  }
  return dbfs(peak);
}

function clippedRatio(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  let n = 0;
  for (let i = 0; i < data.length; i++) if (Math.abs(data[i]) >= 0.999) n++;
  return n / data.length;
}

function makeCtx(): AudioContext {
  const C =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new C();
}

/* ------------------------------------------------------------------ */
/* 波形                                                                 */
/* ------------------------------------------------------------------ */

function Waveform({
  env,
  progress,
  active,
}: {
  env: Float32Array | null;
  progress: number;
  active: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cvs.clientWidth;
    const h = cvs.clientHeight;
    if (!w || !h) return;
    cvs.width = Math.floor(w * dpr);
    cvs.height = Math.floor(h * dpr);
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const css = getComputedStyle(cvs);
    const copper = css.getPropertyValue('--tw-copper').trim() || '#a34a29';
    const ink = css.getPropertyValue('--tw-ink-soft').trim() || '#8a8781';
    const faint = css.getPropertyValue('--tw-ink-faint').trim() || '#c9c6bf';

    if (!env) {
      ctx.fillStyle = faint;
      ctx.fillRect(0, h / 2 - 0.5, w, 1);
      return;
    }

    const n = env.length;
    const barW = w / n;
    const mid = h / 2;
    const cutoff = Math.floor(n * progress);

    /* 基线：静音处只留一条线，不画装饰性波形 */
    ctx.fillStyle = faint;
    ctx.fillRect(0, mid - 0.5, w, 1);

    for (let i = 0; i < n; i++) {
      const amp = env[i] * (h / 2) * 0.92;
      if (amp < 0.5) continue;
      if (!active) ctx.fillStyle = faint;
      else if (i <= cutoff) ctx.fillStyle = copper;
      else ctx.fillStyle = ink;
      ctx.fillRect(i * barW, mid - amp, Math.max(0.7, barW - 0.7), amp * 2);
    }
  }, [env, progress, active]);

  return <canvas ref={ref} className="tw-wave" />;
}

/* ------------------------------------------------------------------ */
/* A/B 试听                                                             */
/* ------------------------------------------------------------------ */

function Compare({ lang }: { lang: Lang }) {
  const t = DICT[lang].listen;
  const [index, setIndex] = useState(0);
  const [track, setTrack] = useState<TrackKey>('before');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [blind, setBlind] = useState(false);
  const [swap, setSwap] = useState(false);
  const [guess, setGuess] = useState<TrackKey | null>(null);
  const [envs, setEnvs] = useState<Record<string, Float32Array>>({});
  const [failed, setFailed] = useState(false);

  const sample = SAMPLES[index];
  const refs = {
    before: useRef<HTMLAudioElement | null>(null),
    after: useRef<HTMLAudioElement | null>(null),
    reference: useRef<HTMLAudioElement | null>(null),
  };
  const raf = useRef<number | null>(null);

  const label = useCallback(
    (k: TrackKey) => (k === 'before' ? t.before : k === 'after' ? t.after : t.reference),
    [t]
  );

  /* 盲听只在 before / after 之间随机交换，reference 不参与 */
  const slotOf = useCallback(
    (k: TrackKey): string => {
      if (!blind) return label(k);
      if (k === 'reference') return t.reference;
      if (k === 'before') return swap ? 'B' : 'A';
      return swap ? 'A' : 'B';
    },
    [blind, swap, label, t]
  );

  /* 解码波形 */
  useEffect(() => {
    let dead = false;
    const urls = TRACKS.map((k) => sample[k]).filter((u) => !envs[u]);
    if (!urls.length) return;
    const ctx = makeCtx();
    Promise.all(
      urls.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        return [url, envelope(await ctx.decodeAudioData(await res.arrayBuffer()), 240)] as const;
      })
    )
      .then((pairs) => {
        if (dead) return;
        setEnvs((prev) => {
          const next = { ...prev };
          for (const [u, e] of pairs) next[u] = e;
          return next;
        });
      })
      .catch(() => !dead && setFailed(true))
      .finally(() => void ctx.close().catch(() => {}));
    return () => {
      dead = true;
    };
  }, [sample, envs]);

  /* 进度 */
  useEffect(() => {
    const tick = () => {
      const el = refs[track].current;
      if (el && el.duration) {
        setProgress(el.currentTime / el.duration);
        setElapsed(el.currentTime);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [track]);

  const allEls = useCallback(() => TRACKS.map((k) => refs[k].current), []);

  /* 换样本时复位 */
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setElapsed(0);
    setGuess(null);
    setTrack('before');
    setSwap(Math.random() < 0.5);
    allEls().forEach((el) => {
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    });
  }, [index, allEls]);

  const applyMute = useCallback((active: TrackKey) => {
    TRACKS.forEach((k) => {
      const el = refs[k].current;
      if (el) el.muted = k !== active;
    });
  }, []);

  const playAll = useCallback(
    async (active: TrackKey, from: number) => {
      const els = allEls();
      els.forEach((el) => {
        if (el) el.currentTime = from;
      });
      applyMute(active);
      try {
        await Promise.all(els.map((el) => (el ? el.play() : Promise.resolve())));
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    },
    [allEls, applyMute]
  );

  const toggle = useCallback(async () => {
    const cur = refs[track].current;
    if (!cur) return;
    if (playing) {
      allEls().forEach((el) => el?.pause());
      setPlaying(false);
    } else {
      await playAll(track, cur.currentTime || 0);
    }
  }, [playing, track, allEls, playAll]);

  const switchTo = useCallback(
    async (next: TrackKey) => {
      const at = refs[track].current?.currentTime ?? 0;
      setTrack(next);
      allEls().forEach((el) => {
        if (el) el.currentTime = at;
      });
      applyMute(next);
      if (playing) await playAll(next, at);
    },
    [track, playing, allEls, applyMute, playAll]
  );

  const seek = useCallback(
    (ratio: number) => {
      const cur = refs[track].current;
      if (!cur || !cur.duration) return;
      const at = Math.max(0, Math.min(1, ratio)) * cur.duration;
      allEls().forEach((el) => {
        if (el) el.currentTime = at;
      });
      setProgress(at / cur.duration);
      setElapsed(at);
    },
    [track, allEls]
  );

  /* 键盘 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        void toggle();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        const i = TRACKS.indexOf(track);
        const n = e.code === 'ArrowLeft' ? (i + 2) % 3 : (i + 1) % 3;
        void switchTo(TRACKS[n]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, switchTo, track]);

  const onEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    setElapsed(0);
    allEls().forEach((el) => {
      if (el) el.currentTime = 0;
    });
  }, [allEls]);

  const hint = useMemo(
    () => ({ before: t.beforeHint, after: t.afterHint, reference: t.referenceHint }),
    [t]
  );

  return (
    <div className="tw-compare">
      <div className="tw-samples">
        <p className="tw-eyebrow">{t.samples}</p>
        <ol className="tw-sample-list">
          {SAMPLES.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={`tw-sample ${i === index ? 'is-on' : ''}`}
                onClick={() => setIndex(i)}
                aria-current={i === index}
              >
                <span className="tw-sample-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="tw-sample-txt">
                  <span className="tw-sample-sp">{s.speaker}</span>
                  <span className="tw-sample-cond">
                    {s.condition} · {s.channel}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="tw-stage">
        <div className="tw-stage-top">
          <p className="tw-stage-meta">{t.meta(String(sample.seconds))}</p>
          <button
            type="button"
            className={`tw-chip ${blind ? 'is-on' : ''}`}
            onClick={() => {
              setBlind((v) => !v);
              setGuess(null);
              setSwap(Math.random() < 0.5);
            }}
          >
            {blind ? t.blindOn : t.blind}
          </button>
        </div>

        {failed && (
          <p className="tw-alert" role="alert">
            {t.loadError}
          </p>
        )}

        <div className="tw-tracks">
          {TRACKS.map((k) => (
            <button
              key={k}
              type="button"
              className={`tw-track ${track === k ? 'is-on' : ''}`}
              onClick={() => void switchTo(k)}
            >
              <span className="tw-track-head">
                <span className="tw-track-name">{slotOf(k)}</span>
                {!blind && <span className="tw-track-hint">{hint[k]}</span>}
              </span>
              {envs[sample[k]] ? (
                <Waveform env={envs[sample[k]]} progress={progress} active={track === k} />
              ) : (
                <span className="tw-wave tw-shimmer" />
              )}
            </button>
          ))}
        </div>

        <div
          className="tw-scrub"
          role="slider"
          tabIndex={0}
          aria-label="progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - r.left) / r.width);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') seek(progress + 0.05);
            if (e.key === 'ArrowDown') seek(progress - 0.05);
          }}
        >
          <span className="tw-scrub-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div className="tw-transport">
          <button type="button" className="tw-btn tw-btn-solid" onClick={() => void toggle()}>
            {playing ? (
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <rect x="3.5" y="2.5" width="3.2" height="11" fill="currentColor" />
                <rect x="9.3" y="2.5" width="3.2" height="11" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <path d="M4 2.5v11l9.5-5.5z" fill="currentColor" />
              </svg>
            )}
            {playing ? t.pause : t.play}
          </button>
          <span className="tw-count">
            {elapsed.toFixed(2)}<span className="tw-count-sep">/</span>{sample.seconds.toFixed(2)}
          </span>
        </div>

        {blind && (
          <div className="tw-guess">
            {guess === null ? (
              <>
                <span className="tw-guess-q">{t.guessQ}</span>
                {(['A', 'B'] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className="tw-btn"
                    onClick={() => setGuess(slot === (swap ? 'B' : 'A') ? 'before' : 'after')}
                  >
                    {t.guessPick} {slot}
                  </button>
                ))}
              </>
            ) : (
              <span className={`tw-guess-r ${guess === 'after' ? 'is-ok' : ''}`}>
                {guess === 'after' ? t.guessRight : t.guessWrong}{' '}
                {swap ? t.guessReveal(t.after, t.before) : t.guessReveal(t.before, t.after)}
              </span>
            )}
          </div>
        )}

        <p className="tw-note">
          <kbd>Space</kbd> <kbd>←</kbd> <kbd>→</kbd> {t.keys}
        </p>
        <p className="tw-note">{t.loudness}</p>

        {TRACKS.map((k) => (
          <audio
            key={k}
            ref={refs[k]}
            src={sample[k]}
            preload="metadata"
            muted={track !== k}
            onEnded={k === track ? onEnded : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 自带素材                                                             */
/* ------------------------------------------------------------------ */

type Analysis = {
  name: string;
  seconds: number;
  sampleRate: number;
  channels: number;
  peak: number;
  floor: number;
  clip: number;
  url: string;
  env: Float32Array;
};

function BringYourOwn({ lang }: { lang: Lang }) {
  const t = DICT[lang].own;
  const [mode, setMode] = useState<'upload' | 'record'>('upload');
  const [a, setA] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [rec, setRec] = useState(false);
  const [level, setLevel] = useState(0);
  const [secs, setSecs] = useState(0);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const cleanup = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((x) => x.stop());
    stream.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);
  useEffect(() => () => { if (a) URL.revokeObjectURL(a.url); }, [a]);

  const analyse = useCallback(async (blob: Blob, name: string) => {
    setBusy(true);
    setErr(null);
    try {
      const ctx = makeCtx();
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      const next: Analysis = {
        name,
        seconds: decoded.duration,
        sampleRate: decoded.sampleRate,
        channels: decoded.numberOfChannels,
        peak: peakDb(decoded),
        floor: noiseFloorDb(decoded),
        clip: clippedRatio(decoded),
        url: URL.createObjectURL(blob),
        env: envelope(decoded, 240),
      };
      await ctx.close();
      setA((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return next;
      });
    } catch {
      setErr(t.errDecode);
    } finally {
      setBusy(false);
    }
  }, [t]);

  const onFile = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      if (f.size > 40 * 1024 * 1024) return setErr(t.errSize);
      void analyse(f, f.name);
    },
    [analyse, t]
  );

  const start = useCallback(async () => {
    setErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      stream.current = s;
      const ctx = makeCtx();
      ctxRef.current = ctx;
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(s).connect(an);
      const buf = new Float32Array(an.fftSize);
      const meter = () => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
        raf.current = requestAnimationFrame(meter);
      };
      raf.current = requestAnimationFrame(meter);

      chunks.current = [];
      const r = new MediaRecorder(s);
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        cleanup();
        setLevel(0);
        void analyse(blob, `take-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`);
      };
      r.start();
      recRef.current = r;
      setRec(true);
      setSecs(0);
      timer.current = window.setInterval(() => setSecs((x) => x + 1), 1000);
    } catch {
      setErr(t.errMic);
      cleanup();
    }
  }, [analyse, cleanup, t]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setRec(false);
  }, []);

  const verdict = useMemo(() => {
    if (!a) return null;
    if (a.clip > 0.001) return { tone: 'bad', text: t.vClip };
    if (a.seconds < 1.5) return { tone: 'warn', text: t.vShort };
    const snr = a.peak - a.floor;
    const n = snr.toFixed(0);
    if (snr < 20) return { tone: 'bad', text: t.vLowSnr(n) };
    if (snr < 35) return { tone: 'warn', text: t.vTypical(n) };
    return { tone: 'ok', text: t.vClean(n) };
  }, [a, t]);

  const metrics = a
    ? [
        { k: t.mDuration, v: a.seconds.toFixed(2), u: t.sec },
        { k: t.mRate, v: String(a.sampleRate), u: 'Hz' },
        { k: t.mChannels, v: String(a.channels), u: '' },
        { k: t.mPeak, v: Number.isFinite(a.peak) ? a.peak.toFixed(1) : '—', u: 'dBFS' },
        { k: t.mFloor, v: Number.isFinite(a.floor) ? a.floor.toFixed(1) : '—', u: 'dBFS' },
        { k: t.mClip, v: (a.clip * 100).toFixed(3), u: '%' },
      ]
    : [];

  return (
    <div className="tw-byo">
      <div className="tw-byo-bar">
        <div className="tw-seg" role="tablist">
          {(['upload', 'record'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`tw-seg-btn ${mode === m ? 'is-on' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'upload' ? t.tabUpload : t.tabRecord}
            </button>
          ))}
        </div>
        <p className="tw-byo-priv">{t.privacy}</p>
      </div>

      {mode === 'upload' ? (
        <div
          className={`tw-drop ${drag ? 'is-drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          <p className="tw-drop-t">{t.dropTitle}</p>
          <p className="tw-drop-s">{t.dropSub}</p>
          <button type="button" className="tw-btn" onClick={() => fileRef.current?.click()}>
            {t.dropPick}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="tw-rec">
          <div className="tw-meter" aria-hidden="true">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="tw-meter-bar"
                style={{
                  transform: `scaleY(${
                    rec ? Math.max(0.06, Math.min(1, level * (1.5 - Math.abs(i - 16) / 26))) : 0.06
                  })`,
                }}
              />
            ))}
          </div>
          <p className="tw-rec-time">
            {rec
              ? `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
              : t.recIdle}
          </p>
          <button
            type="button"
            className={`tw-btn ${rec ? 'tw-btn-rec' : ''}`}
            onClick={() => (rec ? stop() : void start())}
          >
            {rec ? t.recStop : t.recStart}
          </button>
          <p className="tw-note tw-note-c">{t.recTip}</p>
        </div>
      )}

      {err && (
        <p className="tw-alert" role="alert">
          {err}
        </p>
      )}

      {busy && (
        <div className="tw-analysing">
          <span className="tw-wave tw-shimmer" />
        </div>
      )}

      {!busy && !a && !err && <p className="tw-empty">{t.empty}</p>}

      {!busy && a && (
        <div className="tw-result">
          <div className="tw-result-bar">
            <span className="tw-result-name">{a.name}</span>
            <audio src={a.url} controls className="tw-result-audio" />
          </div>
          <Waveform env={a.env} progress={0} active />
          <dl className="tw-metrics">
            {metrics.map((m) => (
              <div key={m.k} className="tw-metric">
                <dt>{m.k}</dt>
                <dd>
                  <span className="tw-metric-v">{m.v}</span>
                  {m.u && <span className="tw-metric-u">{m.u}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {verdict && <p className={`tw-verdict is-${verdict.tone}`}>{verdict.text}</p>}
          <div className="tw-next">
            <p className="tw-eyebrow">{t.nextT}</p>
            <p className="tw-next-s">{t.nextS}</p>
            <div className="tw-next-a">
              <a
                className="tw-btn tw-btn-solid"
                href="mailto:chen@yuxiangchen.dev?subject=Takeweave%20sample"
              >
                {t.nextSend}
              </a>
              <a className="tw-btn" href={a.url} download={a.name}>
                {t.nextDownload}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 页面                                                                 */
/* ------------------------------------------------------------------ */

const STORE = 'takeweave-lang';

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let next: Lang | null = null;
    try {
      const saved = localStorage.getItem(STORE);
      if (saved === 'zh' || saved === 'en') next = saved;
    } catch {
      /* 隐私模式下读不到，忽略 */
    }
    setLang(next ?? detectLang());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    try {
      localStorage.setItem(STORE, lang);
    } catch {
      /* 忽略 */
    }
  }, [lang, ready]);

  const d = DICT[lang];

  /* 滚动入场。IO 不可用或迟迟不触发时兜底显示，绝不把内容永久藏起来 */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    const showAll = () => els.forEach((el) => el.classList.add('is-in'));

    if (typeof IntersectionObserver === 'undefined') {
      showAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));

    const fallback = window.setTimeout(showAll, 1600);
    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, [lang]);

  return (
    <>
      <header className="tw-nav">
        <a className="tw-brand" href="/">
          <WeaveMark />
          Takeweave
        </a>
        <nav className="tw-nav-links">
          <a href="#listen">{d.nav.listen}</a>
          <a href="#own">{d.nav.own}</a>
          <a href="#limits">{d.nav.limits}</a>
        </nav>
        <div className="tw-seg tw-seg-sm" role="group" aria-label={d.nav.lang}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`tw-seg-btn ${lang === l.code ? 'is-on' : ''}`}
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main>
        <section className="tw-hero" data-reveal>
          <div className="tw-hero-l">
            <p className="tw-eyebrow">{d.hero.kicker}</p>
            <h1 className="tw-h1">{d.hero.title}</h1>
            <p className="tw-lede">{d.hero.lede}</p>
            <div className="tw-hero-a">
              <a className="tw-btn tw-btn-solid" href="#listen">
                {d.hero.ctaListen}
              </a>
              <a className="tw-btn" href="#own">
                {d.hero.ctaOwn}
              </a>
            </div>
          </div>
          <aside className="tw-hero-r">
            <dl className="tw-facts">
              {d.hero.facts.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
            <p className="tw-note">{d.hero.factsNote}</p>
          </aside>
        </section>

        <section className="tw-section" id="listen" data-reveal>
          <div className="tw-section-head">
            <span className="tw-num">{d.listen.num}</span>
            <div>
              <p className="tw-eyebrow">{d.listen.eyebrow}</p>
              <h2 className="tw-h2">{d.listen.title}</h2>
              <p className="tw-lede">{d.listen.lede}</p>
            </div>
          </div>
          <Compare lang={lang} />
        </section>

        <section className="tw-section" id="own" data-reveal>
          <div className="tw-section-head">
            <span className="tw-num">{d.own.num}</span>
            <div>
              <p className="tw-eyebrow">{d.own.eyebrow}</p>
              <h2 className="tw-h2">{d.own.title}</h2>
              <p className="tw-lede">{d.own.lede}</p>
            </div>
          </div>
          <BringYourOwn lang={lang} />
        </section>

        <section className="tw-section" id="limits" data-reveal>
          <div className="tw-section-head">
            <span className="tw-num">{d.limits.num}</span>
            <div>
              <p className="tw-eyebrow">{d.limits.eyebrow}</p>
              <h2 className="tw-h2">{d.limits.title}</h2>
              <p className="tw-lede">{d.limits.lede}</p>
            </div>
          </div>
          <dl className="tw-limits">
            {d.limits.items.map((it, i) => (
              <div key={it.h} className="tw-limit" style={{ ['--i' as string]: i }}>
                <dt>{it.h}</dt>
                <dd>{it.p}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="tw-cta" data-reveal>
          <h2 className="tw-h2">{d.cta.title}</h2>
          <p className="tw-lede">{d.cta.lede}</p>
          <a
            className="tw-btn tw-btn-solid"
            href="mailto:chen@yuxiangchen.dev?subject=Takeweave%20beta"
          >
            {d.cta.button}
          </a>
        </section>
      </main>

      <footer className="tw-foot">
        <span>{d.foot}</span>
        <a href="/">yuxiangchen.dev</a>
      </footer>
    </>
  );
}

/* 品牌标记：两条交错折带，不用麦克风或波形 */
function WeaveMark() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" className="tw-mark">
      <path
        d="M4 7.5c4.2 0 4.2 9 8.4 9s4.2-9 8.4-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M4 16.5c4.2 0 4.2-9 8.4-9s4.2 9 8.4 9"
        fill="none"
        stroke="var(--tw-copper)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
