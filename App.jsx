import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';

/* ─── constants ─────────────────────────────────────────────────────── */
const SERVER_URL = 'http://localhost:3001';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Add your TURN server here for production:
    // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
  ],
};

const COUNTRIES = [
  { name: 'India', flag: '🇮🇳' }, { name: 'USA', flag: '🇺🇸' },
  { name: 'UK', flag: '🇬🇧' }, { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Germany', flag: '🇩🇪' }, { name: 'France', flag: '🇫🇷' },
  { name: 'Japan', flag: '🇯🇵' }, { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' }, { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Mexico', flag: '🇲🇽' }, { name: 'Italy', flag: '🇮🇹' },
  { name: 'Spain', flag: '🇪🇸' }, { name: 'Russia', flag: '🇷🇺' },
  { name: 'Nigeria', flag: '🇳🇬' }, { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Egypt', flag: '🇪🇬' }, { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Argentina', flag: '🇦🇷' }, { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Philippines', flag: '🇵🇭' }, { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Netherlands', flag: '🇳🇱' }, { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Norway', flag: '🇳🇴' }, { name: 'Poland', flag: '🇵🇱' },
  { name: 'Saudi Arabia', flag: '🇸🇦' }, { name: 'UAE', flag: '🇦🇪' },
  { name: 'China', flag: '🇨🇳' }, { name: 'Singapore', flag: '🇸🇬' },
];

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#14b8a6',
  '#f59e0b','#3b82f6','#ef4444','#10b981',
  '#f97316','#06b6d4','#a855f7','#22c55e',
];

/* ─── tiny helpers ───────────────────────────────────────────────────── */
const avatarColor = name =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const formatTime = s => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

/* ─── sub-components ─────────────────────────────────────────────────── */
function Avatar({ name, size = 40, style: extra = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
      ...extra,
    }}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
      background: '#1e1e3a', border: '1px solid #6366f1',
      borderRadius: 10, padding: '8px 18px',
      color: '#a78bfa', fontSize: 13, fontWeight: 600, zIndex: 9999,
      boxShadow: '0 4px 24px rgba(99,102,241,.3)',
      pointerEvents: 'none',
    }}>
      {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SCREEN 1 – Age verification
═══════════════════════════════════════════════════════════════════════ */
function AgeVerify({ onConfirm }) {
  const checks = [
    'I am 18 years of age or older',
    'I agree to the Terms of Service & Privacy Policy',
    'I understand this platform contains live adult interactions',
    'I will not share explicit content or harass other users',
  ];
  return (
    <div style={S.page}>
      <div style={{ maxWidth: 420, width: '100%', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔞</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Age Verification Required
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          ConnectWorld hosts live video conversations with real strangers.{' '}
          <strong style={{ color: '#a78bfa' }}>You must be 18+</strong> to continue.
        </p>
        <div style={{ background: '#0e0e24', border: '1px solid #1e1e3a', borderRadius: 14, padding: '18px 22px', marginBottom: 22, textAlign: 'left' }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < checks.length - 1 ? 11 : 0 }}>
              <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span>
              <span style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </div>
        <button onClick={onConfirm} style={{ ...S.btnPrimary, width: '100%', marginBottom: 10, fontSize: 15 }}>
          ✓ &nbsp; I confirm I am 18 or older — Enter
        </button>
        <button onClick={() => window.location.reload()} style={{ ...S.btnGhost, width: '100%' }}>
          ✗ &nbsp; I am under 18 — Exit
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SCREEN 2 – Login / profile setup
═══════════════════════════════════════════════════════════════════════ */
function Login({ onLogin }) {
  const [name, setName]         = useState('');
  const [gender, setGender]     = useState('male');
  const [countryIdx, setCountry] = useState(0);
  const [city, setCity]         = useState('');
  const [email, setEmail]       = useState('');
  const [err, setErr]           = useState('');

  const submit = (gmailMode = false) => {
    if (!name.trim())  { setErr('Enter your display name.'); return; }
    if (!city.trim())  { setErr('Enter your city.'); return; }
    const c = COUNTRIES[countryIdx];
    onLogin({
      name: name.trim(),
      gender,
      country: `${c.flag} ${c.name}`,
      city: city.trim(),
      email: gmailMode
        ? `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
        : email.trim() || 'user@example.com',
    });
  };

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 420, width: '100%', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🌐</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 5px', letterSpacing: '-0.5px' }}>
            ConnectWorld
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Meet real people from every corner of the world
          </p>
        </div>

        <div style={{ background: '#0e0e24', border: '1px solid #1e1e3a', borderRadius: 18, padding: 26 }}>
          {err && (
            <div style={{ background: '#3f0e10', border: '1px solid #7f1d1d', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
              <span style={{ color: '#fca5a5', fontSize: 13 }}>⚠ {err}</span>
            </div>
          )}

          <Field label="Display Name">
            <input style={S.input} placeholder="How strangers will see you"
              value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          </Field>

          <Field label="I am">
            <div style={{ display: 'flex', gap: 8 }}>
              {['male', 'female'].map(g => (
                <button key={g} onClick={() => setGender(g)} style={{
                  flex: 1, padding: '9px 0',
                  background: gender === g ? (g === 'male' ? 'rgba(59,130,246,.25)' : 'rgba(236,72,153,.25)') : '#07071a',
                  border: `1px solid ${gender === g ? (g === 'male' ? '#3b82f6' : '#ec4899') : '#1e1e3a'}`,
                  borderRadius: 9, color: gender === g ? '#fff' : '#6b7280',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}>
                  {g === 'male' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Country">
            <select style={{ ...S.input, cursor: 'pointer' }}
              value={countryIdx} onChange={e => setCountry(+e.target.value)}>
              {COUNTRIES.map((c, i) => (
                <option key={i} value={i}>{c.flag} {c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="City">
            <input style={S.input} placeholder="Your city"
              value={city} onChange={e => { setCity(e.target.value); setErr(''); }} />
          </Field>

          <Field label="Email">
            <input style={S.input} placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </Field>

          <button onClick={() => submit(false)} style={{ ...S.btnPrimary, width: '100%', marginBottom: 10 }}>
            Enter ConnectWorld →
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: '#1e1e3a' }} />
            <span style={{ color: '#374151', fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#1e1e3a' }} />
          </div>

          <button onClick={() => submit(true)} style={{
            width: '100%', padding: '11px 0', background: '#fff', border: 'none',
            borderRadius: 10, color: '#1f2937', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p style={{ color: '#374151', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
          You must be 18+ to use this platform. Be kind to everyone.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SCREEN 3 – Main video-chat app
═══════════════════════════════════════════════════════════════════════ */
function MainApp({ user, onLogout }) {
  /* ── Socket & WebRTC refs ──────────────────────────────────────────── */
  const socketRef    = useRef(null);
  const peerRef      = useRef(null);
  const localStream  = useRef(null);
  const localVideoEl  = useRef(null);
  const remoteVideoEl = useRef(null);

  /* ── UI state ──────────────────────────────────────────────────────── */
  const [status, setStatus]         = useState('idle'); // idle | searching | connected
  const [stranger, setStranger]     = useState(null);
  const [genderFilter, setGender]   = useState('both');
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [friends, setFriends]       = useState([]);
  const [history, setHistory]       = useState([]);
  const [panel, setPanel]           = useState(null); // null | 'friends' | 'history'
  const [videoOff, setVideoOff]     = useState(false);
  const [audioOff, setAudioOff]     = useState(false);
  const [timer, setTimer]           = useState(0);
  const [onlineCount, setOnline]    = useState(0);
  const [toast, setToast]           = useState('');
  const [mediaError, setMediaError] = useState('');
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const timerRef  = useRef(null);
  const chatEnd   = useRef(null);
  const savedGender = useRef(genderFilter);

  const notify = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  /* ── Get camera/mic on mount ────────────────────────────────────────── */
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStream.current = stream;
        if (localVideoEl.current) {
          localVideoEl.current.srcObject = stream;
          await localVideoEl.current.play().catch(() => {});
        }
      } catch (e) {
        setMediaError(`Camera/mic error: ${e.message}. Grant permission and reload.`);
      }
    })();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  /* ── Socket.io connection ───────────────────────────────────────────── */
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', {
        name:    user.name,
        gender:  user.gender,
        country: user.country,
        city:    user.city,
      });
      fetchOnline();
    });

    socket.on('waiting', () => setStatus('searching'));

    socket.on('matched', ({ partner, initiator }) => {
      setStranger(partner);
      setMessages([]);
      setRemoteHasVideo(false);
      setStatus('connected');
      notify(`Connected to ${partner.name} from ${partner.country}! 🎉`);
      createPeer(initiator);
    });

    socket.on('signal', sig => {
      peerRef.current?.signal(sig);
    });

    socket.on('chat-message', ({ text }) => {
      setMessages(prev => [...prev, { id: Date.now() + Math.random(), from: 'stranger', text }]);
    });

    socket.on('partner-left', () => {
      notify('Stranger disconnected.');
      cleanupPeer();
      setStranger(prev => { if (prev) addHistory(prev); return null; });
      setStatus('idle');
      setMessages([]);
    });

    socket.on('skipped',    () => setStatus('searching'));
    socket.on('chat-ended', () => setStatus('idle'));

    const interval = setInterval(fetchOnline, 15000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fetch live online count ────────────────────────────────────────── */
  const fetchOnline = async () => {
    try {
      const r = await fetch(`${SERVER_URL}/api/stats`);
      const d = await r.json();
      setOnline(d.online);
    } catch { /* server may not be reachable yet */ }
  };

  /* ── Connection timer ───────────────────────────────────────────────── */
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  /* ── Chat scroll ─────────────────────────────────────────────────────── */
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── keep savedGender ref in sync ────────────────────────────────────── */
  useEffect(() => { savedGender.current = genderFilter; }, [genderFilter]);

  /* ── WebRTC helpers ─────────────────────────────────────────────────── */
  const createPeer = useCallback((initiator) => {
    cleanupPeer();
    const peer = new SimplePeer({
      initiator,
      stream:  localStream.current,
      trickle: true,
      config:  ICE_SERVERS,
    });

    peer.on('signal', sig => socketRef.current?.emit('signal', sig));

    peer.on('stream', remoteStream => {
      setRemoteHasVideo(true);
      if (remoteVideoEl.current) {
        remoteVideoEl.current.srcObject = remoteStream;
        remoteVideoEl.current.play().catch(() => {});
      }
    });

    peer.on('error', err => console.warn('Peer error:', err));
    peer.on('close', () => { setRemoteHasVideo(false); });

    peerRef.current = peer;
  }, []);

  const cleanupPeer = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    setRemoteHasVideo(false);
    if (remoteVideoEl.current) remoteVideoEl.current.srcObject = null;
  }, []);

  /* ── Video/audio toggles ────────────────────────────────────────────── */
  const toggleVideo = () => {
    localStream.current?.getVideoTracks().forEach(t => { t.enabled = videoOff; });
    setVideoOff(v => !v);
  };
  const toggleAudio = () => {
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = audioOff; });
    setAudioOff(a => !a);
  };

  /* ── Actions ────────────────────────────────────────────────────────── */
  const startSearch = () => {
    setStatus('searching');
    setMessages([]);
    socketRef.current?.emit('find-stranger', { genderFilter });
  };

  const skip = () => {
    if (stranger) addHistory(stranger);
    cleanupPeer();
    setStranger(null);
    setMessages([]);
    socketRef.current?.emit('skip');
    setTimeout(() => socketRef.current?.emit('find-stranger', { genderFilter: savedGender.current }), 400);
  };

  const endChat = () => {
    if (stranger) addHistory(stranger);
    cleanupPeer();
    setStranger(null);
    setMessages([]);
    socketRef.current?.emit('end-chat');
    setStatus('idle');
  };

  const cancelSearch = () => {
    socketRef.current?.emit('cancel-search');
    setStatus('idle');
  };

  const sendMsg = () => {
    if (!input.trim() || status !== 'connected') return;
    const text = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), from: 'me', text }]);
    setInput('');
    socketRef.current?.emit('chat-message', { text });
  };

  const addFriend = s => {
    if (friends.find(f => f.id === s.socketId)) { notify('Already in your friends!'); return; }
    setFriends(prev => [...prev, { ...s, id: s.socketId, addedAt: new Date().toLocaleString() }]);
    notify(`${s.name} added to friends 🎉`);
  };

  const removeFriend = id => {
    setFriends(prev => prev.filter(f => f.id !== id));
    notify('Removed from friends.');
  };

  const addHistory = s => {
    setHistory(prev => {
      if (prev.find(p => p.socketId === s.socketId)) return prev;
      return [{ ...s, at: new Date().toLocaleString() }, ...prev].slice(0, 30);
    });
  };

  const isFriend = stranger && friends.find(f => f.id === stranger.socketId);

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ height: '100vh', background: '#07071a', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>
      <Toast msg={toast} />

      {/* ── Header ── */}
      <header style={{ background: '#0a0a20', borderBottom: '1px solid #1a1a30', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌐</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px' }}>ConnectWorld</span>
          <div style={{ background: '#0f2a1a', border: '1px solid #1a4a2a', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}>
              {onlineCount > 0 ? `${onlineCount} online` : 'Live'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <HeaderBtn active={panel === 'friends'} onClick={() => setPanel(panel === 'friends' ? null : 'friends')}>
            👥 Friends
            {friends.length > 0 && <Badge color="#ec4899">{friends.length}</Badge>}
          </HeaderBtn>
          <HeaderBtn active={panel === 'history'} onClick={() => setPanel(panel === 'history' ? null : 'history')}>
            🌍 History
            {history.length > 0 && <span style={{ color: '#6b7280', fontSize: 11 }}>({history.length})</span>}
          </HeaderBtn>
          <div style={{ width: 1, height: 22, background: '#1e1e3a' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e0e24', border: '1px solid #1e1e3a', borderRadius: 20, padding: '4px 10px 4px 6px' }}>
            <Avatar name={user.name} size={26} />
            <span style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{user.name}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{user.gender === 'male' ? '♂' : '♀'}</span>
          </div>
          <button onClick={onLogout} style={{ ...S.btnGhost, padding: '5px 10px', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Side panel ── */}
        {panel && (
          <aside style={{ width: 270, background: '#0a0a20', borderRight: '1px solid #1a1a30', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #1a1a30', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                {panel === 'friends' ? `👥 Friends (${friends.length})` : `🌍 Connected People (${history.length})`}
              </span>
              <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {panel === 'friends' && (
                friends.length === 0
                  ? <EmptyState icon="👥" text="No friends yet. Add people while you chat!" />
                  : friends.map(f => (
                    <PersonCard key={f.id} person={f} onRemove={() => removeFriend(f.id)} showRemove />
                  ))
              )}
              {panel === 'history' && (
                history.length === 0
                  ? <EmptyState icon="🌍" text="No history yet. Start chatting!" />
                  : history.map((p, i) => (
                    <PersonCard key={i} person={p} showTime />
                  ))
              )}
            </div>
          </aside>
        )}

        {/* ── Center ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Video area ── */}
          <div style={{ padding: '12px 14px 8px', display: 'flex', gap: 10, flexShrink: 0 }}>

            {/* Stranger video */}
            <div style={{ flex: 1, background: '#0a0a20', borderRadius: 16, border: '1px solid #1a1a30', position: 'relative', overflow: 'hidden', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

              {/* Real remote video */}
              <video ref={remoteVideoEl} autoPlay playsInline
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: remoteHasVideo ? 'block' : 'none' }} />

              {/* Overlay / placeholder */}
              {!remoteHasVideo && (
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                  {status === 'idle' && (
                    <>
                      <div style={{ fontSize: 52, marginBottom: 10, opacity: 0.15 }}>👤</div>
                      <p style={{ color: '#374151', fontSize: 14 }}>Stranger video will appear here</p>
                    </>
                  )}
                  {status === 'searching' && (
                    <>
                      <Spinner />
                      <p style={{ color: '#818cf8', fontSize: 16, fontWeight: 700, margin: '12px 0 4px' }}>Finding your next match...</p>
                      <p style={{ color: '#374151', fontSize: 12 }}>
                        Searching {genderFilter === 'both' ? 'worldwide' : `for ${genderFilter}`}
                      </p>
                    </>
                  )}
                  {status === 'connected' && stranger && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${avatarColor(stranger.name)}18 0%, transparent 70%)` }} />
                      <div style={{ position: 'relative' }}>
                        <Avatar name={stranger.name} size={80}
                          style={{ margin: '0 auto 10px', border: '3px solid rgba(255,255,255,.12)', boxShadow: `0 0 24px ${avatarColor(stranger.name)}44` }} />
                        <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, margin: '0 0 3px', letterSpacing: '-0.3px' }}>{stranger.name}</p>
                        <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 6px' }}>{stranger.country} · {stranger.city}</p>
                        <GenderPill gender={stranger.gender} />
                        <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>Camera not available / connecting…</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* HUD overlays (shown when connected) */}
              {status === 'connected' && stranger && (
                <>
                  <div style={{ position: 'absolute', top: 11, left: 11, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 5, letterSpacing: '1px', zIndex: 5 }}>
                    ● LIVE
                  </div>
                  <div style={{ position: 'absolute', top: 11, right: 11, background: 'rgba(0,0,0,.6)', color: '#e5e7eb', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, zIndex: 5 }}>
                    {formatTime(timer)}
                  </div>
                  <div style={{ position: 'absolute', bottom: 11, left: 11, zIndex: 5 }}>
                    <GenderPill gender={stranger.gender} />
                  </div>
                  <button onClick={() => addFriend(stranger)} style={{
                    position: 'absolute', bottom: 11, right: 11, zIndex: 5,
                    background: isFriend ? 'rgba(74,222,128,.2)' : 'rgba(99,102,241,.85)',
                    border: `1px solid ${isFriend ? '#4ade80' : '#6366f1'}`,
                    borderRadius: 20, padding: '5px 12px',
                    color: isFriend ? '#4ade80' : '#fff',
                    fontSize: 11, cursor: 'pointer', fontWeight: 700,
                  }}>
                    {isFriend ? '✓ Friends' : '+ Add Friend'}
                  </button>
                  {remoteHasVideo && (
                    <div style={{ position: 'absolute', bottom: 44, left: 11, zIndex: 5, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                      {stranger.name}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* My video */}
            <div style={{ width: 165, background: '#0a0a20', borderRadius: 14, border: '1px solid #1a1a30', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <video ref={localVideoEl} autoPlay playsInline muted
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: videoOff ? 'none' : 'block', transform: 'scaleX(-1)' }} />
              {videoOff && (
                <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
                  <Avatar name={user.name} size={50} style={{ margin: '0 auto 8px' }} />
                  <p style={{ color: '#9ca3af', fontSize: 11, margin: 0 }}>Camera off</p>
                </div>
              )}

              {/* Controls */}
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5 }}>
                <CtrlBtn on={!videoOff} onClick={toggleVideo} onIcon="📹" offIcon="🚫" />
                <CtrlBtn on={!audioOff} onClick={toggleAudio} onIcon="🎤" offIcon="🔇" />
              </div>
              <div style={{ position: 'absolute', top: 8, left: 8, color: '#374151', fontSize: 10, fontWeight: 700, zIndex: 5 }}>You</div>
            </div>
          </div>

          {/* Media error */}
          {mediaError && (
            <div style={{ margin: '0 14px', background: '#3f0e10', border: '1px solid #7f1d1d', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
              <span style={{ color: '#fca5a5', fontSize: 12 }}>📵 {mediaError}</span>
            </div>
          )}

          {/* ── Controls bar ── */}
          <div style={{ padding: '7px 14px', background: '#0a0a1f', borderTop: '1px solid #1a1a30', borderBottom: '1px solid #1a1a30', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>SHOW:</span>
            {[
              { val: 'both',    label: '⚤ Both' },
              { val: 'males',   label: '♂ Males' },
              { val: 'females', label: '♀ Females' },
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setGender(val)} style={{
                padding: '5px 11px', borderRadius: 20,
                background: genderFilter === val ? '#6366f1' : '#0e0e24',
                border: `1px solid ${genderFilter === val ? '#6366f1' : '#1e1e3a'}`,
                color: genderFilter === val ? '#fff' : '#9ca3af',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{label}</button>
            ))}

            <div style={{ flex: 1 }} />

            {status === 'idle' && (
              <button onClick={startSearch} style={{ ...S.btnPrimary, padding: '8px 24px', fontSize: 14, boxShadow: '0 4px 18px rgba(99,102,241,.35)' }}>
                🚀 Start Connection
              </button>
            )}
            {status === 'searching' && (
              <button onClick={cancelSearch} style={{ ...S.btnGhost, padding: '8px 18px' }}>
                ✕ Cancel
              </button>
            )}
            {status === 'connected' && (
              <>
                <button onClick={skip} style={{ padding: '8px 20px', background: 'rgba(245,158,11,.15)', border: '1px solid #f59e0b', borderRadius: 10, color: '#f59e0b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  ⏭ Skip
                </button>
                <button onClick={endChat} style={{ padding: '8px 20px', background: 'rgba(239,68,68,.15)', border: '1px solid #ef4444', borderRadius: 10, color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  ✕ End Chat
                </button>
              </>
            )}
          </div>

          {/* ── Chat ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '10px 14px 12px' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', margin: 'auto 0', paddingTop: 20 }}>
                  <p style={{ color: '#1f2937', fontSize: 13 }}>
                    {status === 'idle'      ? '💬 Messages appear here once connected' :
                     status === 'searching' ? '🔍 Looking for someone…' :
                     '👋 Say hello!'}
                  </p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                  {msg.from === 'stranger' && stranger && (
                    <Avatar name={stranger.name} size={24} style={{ flexShrink: 0 }} />
                  )}
                  <div style={{
                    maxWidth: '65%', padding: '8px 12px',
                    borderRadius: msg.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.from === 'me' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#0e0e24',
                    color: '#fff', fontSize: 14, lineHeight: 1.5,
                    border: msg.from === 'me' ? 'none' : '1px solid #1e1e3a',
                  }}>
                    {msg.text}
                  </div>
                  {msg.from === 'me' && (
                    <Avatar name={user.name} size={24} style={{ flexShrink: 0 }} />
                  )}
                </div>
              ))}
              <div ref={chatEnd} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                placeholder={status === 'connected' ? `Message ${stranger?.name ?? 'stranger'}…` : 'Connect to start chatting…'}
                value={input}
                disabled={status !== 'connected'}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
                style={{ flex: 1, padding: '10px 14px', background: '#0e0e24', border: '1px solid #1e1e3a', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', opacity: status !== 'connected' ? 0.45 : 1 }}
              />
              <button onClick={sendMsg} disabled={status !== 'connected'} style={{
                padding: '10px 16px', background: status === 'connected' ? '#6366f1' : '#1e1e3a',
                border: 'none', borderRadius: 12, color: '#fff', cursor: status === 'connected' ? 'pointer' : 'default', fontSize: 18,
              }}>
                ➤
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #07071a; }
        ::-webkit-scrollbar-thumb { background: #1e1e3a; border-radius: 4px; }
        input::placeholder { color: #374151; }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99,102,241,.2); }
        select { appearance: none; }
        select option { background: #0e0e24; }
      `}</style>
    </div>
  );
}

/* ─── small reusable components ─────────────────────────────────────── */
function HeaderBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 8,
      background: active ? '#6366f1' : '#0e0e24',
      border: `1px solid ${active ? '#6366f1' : '#1e1e3a'}`,
      color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      {children}
    </button>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{ background: color, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function GenderPill({ gender }) {
  const isMale = gender === 'male';
  return (
    <span style={{
      background: isMale ? 'rgba(59,130,246,.2)' : 'rgba(236,72,153,.2)',
      color: isMale ? '#60a5fa' : '#f472b6',
      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
    }}>
      {isMale ? '♂ Male' : '♀ Female'}
    </span>
  );
}

function CtrlBtn({ on, onClick, onIcon, offIcon }) {
  return (
    <button onClick={onClick} style={{
      width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 13,
      background: on ? 'rgba(255,255,255,.08)' : 'rgba(239,68,68,.25)',
      border: `1px solid ${on ? '#1e1e3a' : '#ef4444'}`, color: '#fff',
    }}>
      {on ? onIcon : offIcon}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 48 }}>
      <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.2 }}>{icon}</div>
      <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function PersonCard({ person, onRemove, showRemove, showTime }) {
  return (
    <div style={{ background: '#0e0e24', borderRadius: 12, padding: '9px 11px', marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={person.name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', margin: 0, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {person.name}
          </p>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 11 }}>
            {person.country}{person.city ? ` · ${person.city}` : ''}
          </p>
        </div>
        {person.gender && <GenderPill gender={person.gender} />}
        {showRemove && (
          <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 15, padding: 2 }}>✕</button>
        )}
      </div>
      {showTime && person.at && (
        <p style={{ color: '#374151', margin: '5px 0 0', fontSize: 10 }}>{person.at}</p>
      )}
    </div>
  );
}

/* ─── shared styles ─────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh', background: '#07071a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '1rem',
  },
  input: {
    width: '100%', padding: '10px 13px', background: '#07071a',
    border: '1px solid #1e1e3a', borderRadius: 9, color: '#fff',
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
  },
  btnPrimary: {
    padding: '11px 22px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', borderRadius: 10, color: '#fff', fontSize: 14,
    fontWeight: 700, cursor: 'pointer', letterSpacing: '0.2px',
  },
  btnGhost: {
    padding: '11px 22px', background: 'transparent',
    border: '1px solid #2a2a3e', borderRadius: 10, color: '#6b7280',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   ROOT – screen router
═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState('age'); // age | login | main
  const [user, setUser]     = useState(null);

  if (screen === 'age')   return <AgeVerify  onConfirm={() => setScreen('login')} />;
  if (screen === 'login') return <Login onLogin={u => { setUser(u); setScreen('main'); }} />;
  return <MainApp user={user} onLogout={() => { setUser(null); setScreen('login'); }} />;
}
