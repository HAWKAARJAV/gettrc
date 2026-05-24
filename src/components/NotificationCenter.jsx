import { useEffect, useRef, useState } from 'react';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchNotifications, markNotificationRead } from '../notifications/notificationService';
import { subscribeToApplicationRefresh } from '../workflow/refreshApplication';

const NOTIF_POLL_MS = 20_000; // keep in sync with workspace polling interval

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);

  async function loadNotifications(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true);
      const userId = localStorage.getItem('trc_user_id');
      if (!userId) { setNotifications([]); return; }
      const notes = await fetchNotifications(userId);
      if (!mountedRef.current) return;
      setNotifications(notes || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (mountedRef.current && showSpinner) setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadNotifications(true);
    return () => { mountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh notifications when the workspace emits an in-tab refresh event
  useEffect(() => {
    const unsubscribe = subscribeToApplicationRefresh(() => {
      loadNotifications(false);
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll so the bell badge updates when admin pushes a status change from
  // a different browser/tab (same interval as useRetailWorkspace).
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadNotifications(false);
    }, NOTIF_POLL_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unread = notifications.filter(n => !n.read_at).length;

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (e) {
      console.error(e);
    }
  }

  function resolveNotificationPath(notification) {
    if (notification.action_url) return notification.action_url;
    if (!notification.application_id) return null;
    const base = location.pathname.startsWith('/corporate') ? '/corporate' : '/retail';
    return `${base}/applications/${notification.application_id}?panel=audit`;
  }

  async function handleOpenNotification(notification) {
    if (!notification.read_at) {
      await handleMarkRead(notification.id);
    }
    const path = resolveNotificationPath(notification);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Notifications">
        🔔 {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 999 }}>{unread}</span>}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, width: 360, background: '#fff', border: '1px solid #E6EAF0', borderRadius: 8, boxShadow: '0 20px 60px rgba(9,26,61,.12)', zIndex: 1400 }}>
          <div style={{ padding: 12, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800 }}>Notifications</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{unread} unread</div>
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 12, display: 'grid', gap: 8 }}>
                <SkeletonCard height={56} />
                <SkeletonCard height={56} />
                <SkeletonCard height={56} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 12 }}>
                <EmptyState
                  title="No notifications yet"
                  message="Important workflow updates, advisor messages, and admin actions will appear here."
                  cta={{ label: 'Refresh', onClick: () => loadNotifications(true) }}
                />
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleOpenNotification(n)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleOpenNotification(n)} style={{ width: '100%', textAlign: 'left', padding: 12, borderBottom: '1px solid #F3F4F6', background: n.read_at ? '#fff' : '#FFFBEB', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{n.body}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {!n.read_at && <button onClick={(event) => { event.stopPropagation(); handleMarkRead(n.id); }} style={{ padding: 8, borderRadius: 8, background: '#0F2557', color: '#fff', border: 'none' }}>Mark read</button>}
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
