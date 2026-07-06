import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../services/apiBase';
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

export default function NotificationBell({ salonId }: { salonId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchNotifications();

    const socketUrl = API_BASE_URL.replace('/api/v1', '');
    const newSocket = io(socketUrl, {
      withCredentials: true,
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinSalon', salonId);
    });

    newSocket.on('newBooking', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      // Play sound
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [salonId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
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
      console.error(e);
    }
  };

  const handleRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
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

  const handleAccept = async (bookingId: string, notifId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, type: 'BOOKING_ACCEPTED', title: 'Booking Accepted' } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (bookingId: string, notifId: string) => {
    const reason = prompt("Please enter a rejection reason:");
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, type: 'BOOKING_REJECTED', title: 'Booking Rejected', message: reason } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notification-bell-container">
      <button className="bell-btn" onClick={() => setShowDropdown(!showDropdown)}>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="dropdown">
          <h4>Notifications</h4>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p>No notifications.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`} onClick={() => !n.is_read && handleRead(n.id)}>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                  
                  {n.type === 'NEW_BOOKING' && (
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
    </div>
  );
}
