// C:\Users\japes\OneDrive\Desktop\call\online-meeting-app-frontend\src\components\meetingStyles.js
// Shared CSS for all MeetUp AI components — import in MeetingPage.jsx

export const MEETING_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html { height: 100%; background: #050810; }

  .meeting-root {
    font-family: 'Syne', sans-serif;
    background: #050810;
    color: #e2e8f0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  .meeting-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }
  .meeting-root::after {
    content: '';
    position: fixed;
    top: -40%; left: -20%;
    width: 60%; height: 80%;
    background: radial-gradient(ellipse, rgba(0, 180, 255, 0.06) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  /* TOP BAR */
  .topbar {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 56px;
    background: rgba(5, 8, 16, 0.9);
    border-bottom: 1px solid rgba(0, 212, 255, 0.12);
    backdrop-filter: blur(12px);
  }
  .topbar-logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; color: #00d4ff;
  }
  .topbar-logo-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #00d4ff;
    box-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff80;
    animation: pulse-dot 2s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
  }
  .topbar-meta {
    display: flex; align-items: center; gap: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: rgba(226, 232, 240, 0.45);
  }
  .topbar-time { color: rgba(226, 232, 240, 0.7); letter-spacing: 0.05em; }
  .meeting-id-badge {
    padding: 4px 10px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 4px;
    background: rgba(0, 212, 255, 0.05);
    color: #00d4ff; letter-spacing: 0.08em; font-size: 11px;
  }

  /* LAYOUT */
  .main-layout { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 1; }

  /* VIDEO AREA */
  .video-area {
    flex: 1; display: flex; flex-direction: column;
    gap: 12px; padding: 20px; overflow: hidden;
  }
  .video-primary {
    flex: 1; position: relative; border-radius: 16px; overflow: hidden;
    background: #0a0e1a;
    border: 1px solid rgba(0, 212, 255, 0.15);
    box-shadow: 0 0 40px rgba(0, 212, 255, 0.05), inset 0 0 60px rgba(0,0,0,0.6);
  }
  .video-primary::before {
    content: '';
    position: absolute; inset: 0; border-radius: 16px; padding: 1px;
    background: linear-gradient(135deg, rgba(0,212,255,0.3), transparent 40%, transparent 60%, rgba(120,80,255,0.2));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
  }
  .video-cam-off {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; height: 100%; gap: 16px;
  }
  .avatar-ring { position: relative; width: 100px; height: 100px; }
  .avatar-ring::before {
    content: ''; position: absolute; inset: -4px; border-radius: 50%;
    background: conic-gradient(#00d4ff, #7850ff, #00d4ff);
    animation: spin-ring 4s linear infinite;
  }
  @keyframes spin-ring {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .avatar-inner {
    position: relative; z-index: 1;
    width: 100px; height: 100px; border-radius: 50%;
    background: linear-gradient(135deg, #0a1628, #12213a);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; font-weight: 800; color: #00d4ff;
    border: 3px solid #050810;
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
  }
  .video-name-tag {
    position: absolute; bottom: 14px; left: 14px;
    display: flex; align-items: center; gap: 8px;
    background: rgba(5, 8, 16, 0.85);
    border: 1px solid rgba(0, 212, 255, 0.2);
    backdrop-filter: blur(8px);
    padding: 6px 12px; border-radius: 8px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
  }
  .name-mic-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22c55e; box-shadow: 0 0 8px #22c55e;
  }
  .name-mic-dot.muted { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
  .video-badge-top {
    position: absolute; top: 14px; right: 14px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.25);
    border-radius: 6px; padding: 4px 10px;
    font-size: 11px; color: #00d4ff;
    font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em;
  }

  /* =========================================
     THUMBNAIL STRIP
     FIXED: height increased to 220px so 190px
     cards + button fit without clipping.
     overflow-y must be visible so the View
     button (absolute positioned) is not cut.
  ========================================= */
  .thumb-strip {
    display: flex;
    gap: 10px;
    height: 120px;        /* was 110px — was clipping cards */
    flex-shrink: 0;
    overflow-x: auto;
    overflow-y: visible;  /* was hidden — was clipping the View button */
    padding-bottom: 4px;
  }
  .thumb-strip::-webkit-scrollbar { height: 3px; }
  .thumb-strip::-webkit-scrollbar-track { background: transparent; }
  .thumb-strip::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }

  .thumb-card {
    flex-shrink: 0;
    min-width: 95px;
    width: 95px;
    border-radius: 10px;
    background: #0a0e1a;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: visible;    /* was hidden — was clipping the View button */
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s;
  }
  .thumb-card:hover { border-color: rgba(0, 212, 255, 0.35); transform: translateY(-2px); }
  .thumb-card.speaking { border-color: #22c55e; box-shadow: 0 0 12px rgba(34, 197, 94, 0.3); }

  /* Active/viewing state */
  .thumb-card.thumb-active {
    border: 2px solid #6366f1 !important;
    box-shadow: 0 0 14px rgba(99, 102, 241, 0.5);
  }
  .thumb-card.thumb-active .thumb-name { color: #a5b4fc; }

  .thumb-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #1a2540, #0d1a2e);
    border: 1.5px solid rgba(0, 212, 255, 0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #7dd3fc;
  }

  .thumb-name {
    position: absolute;
    bottom: 38px;         /* was 22px — moved up to make room for View button */
    left: 0;
    right: 0;
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    background: rgba(0,0,0,0.55);
    padding: 2px 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .thumb-mic { position: absolute; top: 5px; right: 6px; font-size: 10px; opacity: 0.6; }
  @keyframes speak-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
    50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  }
  .speaking-ring { animation: speak-ring 1.2s ease-in-out infinite; border-color: rgba(34, 197, 94, 0.6) !important; }

  /* SIDEBAR */
  .sidebar {
    width: 300px; display: flex; flex-direction: column;
    background: rgba(8, 12, 22, 0.95);
    border-left: 1px solid rgba(0, 212, 255, 0.1);
    backdrop-filter: blur(12px);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden; flex-shrink: 0;
  }
  .sidebar.closed { width: 0; }
  .sidebar-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
  .sidebar-tab {
    flex: 1; padding: 14px 0; background: none; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(226, 232, 240, 0.35); transition: color 0.2s, background 0.2s;
    position: relative;
  }
  .sidebar-tab.active { color: #00d4ff; background: rgba(0, 212, 255, 0.05); }
  .sidebar-tab.active::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
  }

  /* PARTICIPANTS */
  .participants-list {
    flex: 1; overflow-y: auto; padding: 14px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .participants-list::-webkit-scrollbar { width: 4px; }
  .participants-list::-webkit-scrollbar-track { background: transparent; }
  .participants-list::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
  .participant-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px; transition: background 0.2s, border-color 0.2s;
  }
  .participant-row:hover { background: rgba(0, 212, 255, 0.05); border-color: rgba(0, 212, 255, 0.15); }
  .p-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, #0d1f3c, #162640);
    border: 1.5px solid rgba(0, 212, 255, 0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #7dd3fc; flex-shrink: 0;
  }
  .p-info { flex: 1; }
  .p-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
  .p-status { font-size: 10px; color: rgba(226,232,240,0.4); font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
  .host-badge {
    font-size: 9px; padding: 2px 7px;
    background: rgba(0, 212, 255, 0.12); color: #00d4ff;
    border: 1px solid rgba(0, 212, 255, 0.25); border-radius: 4px;
    letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700;
  }

  /* View button inside participant row */
  .p-view-btn {
    font-size: 10px; padding: 3px 9px;
    background: rgba(99, 102, 241, 0.12);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 5px; cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600;
    transition: background 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .p-view-btn:hover { background: rgba(99, 102, 241, 0.25); border-color: rgba(99, 102, 241, 0.5); }
  .p-view-btn.viewing {
    background: rgba(99, 102, 241, 0.3);
    border-color: #6366f1;
    color: #fff;
  }

  /* CHAT */
  .chat-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
  .chat-bubble { max-width: 88%; display: flex; flex-direction: column; gap: 2px; animation: msg-in 0.25s ease; }
  @keyframes msg-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .chat-bubble.self { align-self: flex-end; align-items: flex-end; }
  .chat-bubble.other { align-self: flex-start; align-items: flex-start; }
  .bubble-text { padding: 9px 13px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
  .chat-bubble.self .bubble-text {
    background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff;
    border-bottom-right-radius: 3px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
  }
  .chat-bubble.other .bubble-text {
    background: rgba(255,255,255,0.06); color: #cbd5e1;
    border: 1px solid rgba(255,255,255,0.07); border-bottom-left-radius: 3px;
  }
  .bubble-meta { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: rgba(226,232,240,0.3); padding: 0 4px; }
  .chat-input-row {
    display: flex; gap: 8px; padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
  }
  .chat-input {
    flex: 1; background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    padding: 9px 13px; font-size: 13px; font-family: 'Syne', sans-serif;
    color: #e2e8f0; outline: none; transition: border-color 0.2s, background 0.2s;
  }
  .chat-input:focus { border-color: rgba(0, 212, 255, 0.4); background: rgba(0, 212, 255, 0.05); }
  .chat-input::placeholder { color: rgba(226,232,240,0.25); }
  .chat-send-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, #0284c7, #0369a1);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; transition: opacity 0.2s, transform 0.15s; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
  }
  .chat-send-btn:hover { opacity: 0.85; transform: scale(0.96); }
  .chat-send-btn:active { transform: scale(0.92); }

  /* ALERTS */
  .alerts-panel {
    flex-shrink: 0; padding: 12px 14px;
    border-top: 1px solid rgba(239,68,68,0.15);
    background: rgba(239,68,68,0.03);
  }
  .alerts-header { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
  .alerts-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(248, 113, 113, 0.8); }
  .alert-item {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #fca5a5;
    line-height: 1.4; animation: alert-in 0.3s ease;
  }
  @keyframes alert-in {
    from { opacity: 0; transform: translateX(8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .no-alerts { font-size: 11px; color: rgba(226,232,240,0.2); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }

  /* CONTROL BAR */
  .control-bar {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: center;
    gap: 6px; padding: 8px 16px;
    background: rgba(5, 8, 16, 0.95);
    border-top: 1px solid rgba(0, 212, 255, 0.1);
    backdrop-filter: blur(12px); flex-shrink: 0;
  }
  .ctrl-btn { display: flex; flex-direction: column; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 0 6px; }
  .ctrl-icon {
    width: 38px; height: 38px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; transition: transform 0.15s, box-shadow 0.2s;
    border: 1px solid transparent;
  }
  .ctrl-btn:hover .ctrl-icon { transform: translateY(-2px); }
  .ctrl-btn:active .ctrl-icon { transform: scale(0.93); }
  .ctrl-icon.on { background: rgba(0, 212, 255, 0.1); border-color: rgba(0, 212, 255, 0.2); box-shadow: 0 0 16px rgba(0, 212, 255, 0.1); }
  .ctrl-icon.off { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
  .ctrl-icon.neutral { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
  .ctrl-icon.active-state { background: rgba(0, 212, 255, 0.15); border-color: rgba(0, 212, 255, 0.4); box-shadow: 0 0 20px rgba(0, 212, 255, 0.2); }
  .ctrl-label { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(226,232,240,0.4); }
  .ctrl-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.07); margin: 0 6px; flex-shrink: 0; }
  .end-btn {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; transition: transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
    margin: 0 12px; flex-shrink: 0;
  }
  .end-btn:hover { transform: scale(1.06); box-shadow: 0 6px 28px rgba(220, 38, 38, 0.7); }
  .end-btn:active { transform: scale(0.95); }
  .meeting-timer { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(226,232,240,0.4); letter-spacing: 0.08em; }
  .screen-share-btn { display: flex; flex-direction: column; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 0 6px; }
  .screen-share-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(120, 80, 255, 0.1);
    border: 1px solid rgba(120, 80, 255, 0.25);
    display: flex; align-items: center; justify-content: center; font-size: 18px;
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .screen-share-btn:hover .screen-share-icon { transform: translateY(-2px); box-shadow: 0 0 20px rgba(120, 80, 255, 0.3); }
`;