import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [salonId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        // Only update state if data actually changed to prevent unnecessary re-renders
        setNotifications(json.data);
      }
    } catch (e) {
      console.error('Error fetching notifications during polling:', e);
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
        setNotifications(prev => prev.map(n => n.id === notifId ? { 
          ...n, 
          type: 'BOOKING_ACCEPTED', 
          title: 'Booking Accepted',
          booking_status: 'confirmed' 
        } : n));
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
        setNotifications(prev => prev.map(n => n.id === notifId ? { 
          ...n, 
          type: 'BOOKING_REJECTED', 
          title: 'Booking Rejected', 
          message: reason,
          booking_status: 'rejected' 
        } : n));
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
    </div>
  );
}
