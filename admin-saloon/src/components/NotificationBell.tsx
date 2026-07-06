import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/apiBase';
import { io } from 'socket.io-client';
import './NotificationBell.css';

interface Notification {
  id: string;
  salon_id: string;
  booking_id: string;
  customer_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  customer_name?: string;
  service_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  payment_method?: string;
  booking_status?: string;
}

interface ToastNotification extends Notification {
  toastId: number;
}

export default function NotificationBell({ salonId }: { salonId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling every 10 seconds as a fallback
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [salonId]);

  useEffect(() => {
    if (!salonId) return;

    // Connect to the socket server
    const socketUrl = API_BASE_URL.replace('/api/v1', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[socket] Connected to server, joining room salon_' + salonId);
      socket.emit('joinSalon', salonId);
    });

    socket.on('newBooking', (data: { notification: Notification; booking: any }) => {
      console.log('[socket] newBooking event received:', data);

      // Append new notification to list if it doesn't already exist
      setNotifications(prev => {
        if (prev.some(n => n.id === data.notification.id)) return prev;
        return [data.notification, ...prev];
      });
      setHasOpened(false); // Show badge again for new notification

      // Show floating toast popup
      const toastId = Date.now();
      setToasts(prev => [...prev, { ...data.notification, toastId }]);

      // Auto-remove toast after 10 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
      }, 10000);

      // Dispatch custom event to notify Bookings/Dashboard pages
      window.dispatchEvent(new CustomEvent('booking-update', { detail: data }));
    });

    socket.on('bookingUpdated', (data: { booking: any }) => {
      console.log('[socket] bookingUpdated event received:', data);

      // Update matching notification in list
      setNotifications(prev => prev.map(n => {
        if (n.booking_id === data.booking.id) {
          const isRejected = data.booking.booking_status === 'rejected';
          const isConfirmed = data.booking.booking_status === 'confirmed';
          return {
            ...n,
            booking_status: data.booking.booking_status,
            type: isRejected ? 'BOOKING_REJECTED' : isConfirmed ? 'BOOKING_ACCEPTED' : n.type,
            title: isRejected ? 'Booking Rejected' : isConfirmed ? 'Booking Accepted' : n.title,
            message: isRejected ? (data.booking.rejection_reason || n.message) : n.message
          };
        }
        return n;
      }));

      // Background refresh to guarantee consistency
      fetchNotifications();

      // Dispatch custom event to notify Bookings/Dashboard pages
      window.dispatchEvent(new CustomEvent('booking-update', { detail: data }));
    });

    socket.on('disconnect', () => {
      console.log('[socket] Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, [salonId]);

  // Click outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-bell-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDropdown]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleRead = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    setHasOpened(true);
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    // Update local state first for instant response
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    // Perform API calls in the background
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    for (const n of unread) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleDropdown = () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) {
      handleMarkAllRead();
    }
  };

  const handleAccept = async (bookingId: string, notifId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { 
          ...n, 
          type: 'BOOKING_ACCEPTED', 
          title: 'Booking Accepted',
          booking_status: 'confirmed' 
        } : n));
        
        // Notify other windows/components
        window.dispatchEvent(new CustomEvent('booking-update'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (bookingId: string, notifId: string) => {
    const reason = prompt("Please enter a rejection reason:");
    if (!reason) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { 
          ...n, 
          type: 'BOOKING_REJECTED', 
          title: 'Booking Rejected', 
          message: reason,
          booking_status: 'rejected' 
        } : n));

        // Notify other windows/components
        window.dispatchEvent(new CustomEvent('booking-update'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notification-bell-container">
      <button className="bell-btn" onClick={handleToggleDropdown}>
        🔔
        {unreadCount > 0 && !hasOpened && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="dropdown">
          <h4>Notifications</h4>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications.</p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notification-item ${!n.is_read ? 'unread' : ''}`} 
                  onClick={() => !n.is_read && handleRead(n.id)}
                >
                  <div className="notif-header">
                    <strong>{n.title}</strong>
                    <span className={`status-tag ${n.booking_status}`}>
                      {n.booking_status}
                    </span>
                  </div>
                  <p className="notif-msg">{n.message}</p>
                  
                  {/* Detailed Booking Information */}
                  <div className="booking-details">
                    <div><strong>Customer:</strong> {n.customer_name || 'N/A'}</div>
                    <div><strong>Service:</strong> {n.service_name || 'N/A'}</div>
                    <div>
                      <strong>Date/Time:</strong> {n.appointment_date ? new Date(n.appointment_date).toLocaleDateString() : ''} {n.appointment_time}
                    </div>
                  </div>
                  
                  <small className="notif-time">{new Date(n.created_at).toLocaleString()}</small>
                  
                  {n.booking_status === 'pending' && (
                    <div className="actions">
                      <button onClick={(e) => { e.stopPropagation(); handleAccept(n.booking_id, n.id); }}>Accept</button>
                      <button className="reject" onClick={(e) => { e.stopPropagation(); handleReject(n.booking_id, n.id); }}>Decline</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification Containers */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.toastId} className="toast-card">
            <div className="toast-header">
              <strong>🔔 New Booking Request</strong>
              <button 
                className="toast-close" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setToasts(prev => prev.filter(x => x.toastId !== t.toastId)); 
                }}
              >
                &times;
              </button>
            </div>
            <div className="toast-body">
              <p>{t.message}</p>
              <div className="toast-booking-info">
                <div><strong>Customer:</strong> {t.customer_name || 'N/A'}</div>
                <div><strong>Service:</strong> {t.service_name || 'N/A'}</div>
                <div><strong>Time:</strong> {t.appointment_time || 'N/A'}</div>
              </div>
            </div>
            <div className="toast-actions">
              <button 
                className="toast-accept-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept(t.booking_id, t.id);
                  setToasts(prev => prev.filter(x => x.toastId !== t.toastId));
                }}
              >
                Accept
              </button>
              <button 
                className="toast-reject-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(t.booking_id, t.id);
                  setToasts(prev => prev.filter(x => x.toastId !== t.toastId));
                }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
