import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './pages.css'

type Props = {
  user: any
  onLogout: () => void
}

type TeamMember = {
  id: string
  email: string
  role: string
}

export default function TeamPage({ user, onLogout }: Props) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.getTeam();
      setTeam(res.data || []);
    } catch (err) {
      console.error("Failed to fetch team", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <Layout user={user?.email || 'Admin'} onLogout={onLogout}>
      <div className="page-root container">
        <div className="page-header">
          <div>
            <h1>Team Members</h1>
            <div className="subtitle">{team.length} staff members in your salon</div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading team members...</p></div>
        ) : team.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No team members yet</h3>
            <p>Your team members will appear here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email Address</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.email}</td>
                  <td>
                    <span className={`badge ${t.role}`}>{t.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
