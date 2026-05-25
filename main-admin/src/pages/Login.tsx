import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await auth.login(email, password);
    if (ok) {
      navigate('/');
    } else {
      setError('Invalid superadmin credentials');
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: '0 0 10px', fontSize: '24px', color: '#111' }}>Super Admin Portal</h1>
        <p style={{ margin: '0 0 30px', color: '#666', fontSize: '14px' }}>Sign in to manage Glowup globally.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', color: '#333' }}>
            Email
            <input 
              value={email} onChange={e => setEmail(e.target.value)} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#111' }} 
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', color: '#333' }}>
            Password
            <input 
              type="password" value={password} onChange={e => setPassword(e.target.value)} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#111' }} 
            />
          </label>
          {error && <div style={{ color: '#d32f2f', fontSize: '13px' }}>{error}</div>}
          <button type="submit" style={{ padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
            Sign in
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#888', background: '#fafafa', padding: '15px', borderRadius: '8px' }}>
          <strong>Demo credentials:</strong><br/>
          superadmin@glowup.test<br/>
          superadmin123
        </div>
      </div>
    </div>
  );
}