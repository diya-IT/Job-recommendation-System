import { Building2, Users, Star, TrendingUp, CheckCircle, MapPin, X } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Overview.css";

const API_BASE = "http://localhost:5000/api";

const StatCard = ({ label, value, icon: Icon, trend, color }) => (
  <div className="glass-stat-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className={`w-20 ${color}`} style={{ borderRadius: 12 }}>
        <Icon size={22} color="white" />
      </div>
      {trend && <TrendingUp size={16} color="#10b981" />}
    </div>
    <div>
      <p className="text-6xl">{value}</p>
      <p className="text-3xl">{label}</p>
    </div>
  </div>
);

const OverviewTab = () => {
  const [companies, setCompanies] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, listRes, skillRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/adcompany/Stats`),
        axios.get(`${API_BASE}/adcompany/count`),
        axios.get(`${API_BASE}/skillmaster/count`),
        axios.get(`${API_BASE}/admin/users/counts`)
      ]);
      setTotalCompanies(statsRes.data.total || 0);
      setApprovedCount(statsRes.data.approved || 0);
      setPendingCount(statsRes.data.pending || 0);
      setCompanies(listRes.data || []);
      setSkillsCount(skillRes.data.count || 0);
      setUsersCount(userRes.data.active || userRes.data.count || 0);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleApprove = async (company) => {
    try { await axios.put(`${API_BASE}/admin/companies/${company._id}/approve`); fetchDashboard(); }
    catch (err) { console.error("Approve error", err); }
  };

  const handleReject = async (company) => {
    try { await axios.delete(`${API_BASE}/admin/companies/${company._id}`); fetchDashboard(); }
    catch (err) { console.error("Reject error", err); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="common-gradient-bg">

      {/* ===== PLATFORM STATS ===== */}
      <div className="dashboard-container">
        <div className="container-header">
          <h1 className="navy-header">Platform Overview</h1>
          <span className="emerald-accent">{approvedCount} approved • {pendingCount} pending</span>
        </div>

        <div className="metrics-grid">
          <StatCard
            label="Total Companies"
            value={totalCompanies}
            icon={Building2}
            color="bg-gradient-to-r from-blue-500 to-indigo-600"
            trend
          />
          <StatCard
            label="Approved Companies"
            value={approvedCount}
            icon={CheckCircle}
            color="bg-gradient-to-r from-emerald-500 to-teal-600"
            trend
          />
          <StatCard
            label="Active Users"
            value={usersCount}
            icon={Users}
            color="bg-gradient-to-r from-purple-500 to-pink-500"
            trend
          />
          <StatCard
            label="Skills Mastered"
            value={skillsCount}
            icon={Star}
            color="bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
      </div>

      {/* ===== PENDING APPROVALS ===== */}
      <div className="dashboard-container">
        <div className="container-header">
          <h1 className="royal-purple-header">Pending Approvals</h1>
          <span className="amber-accent">{pendingCount} companies awaiting review</span>
        </div>

        {pendingCount > 0 ? (
          <div className="pending-cards-grid">
            {companies.filter(c => c.status === "pending").map(c => (
              <div key={c._id} className="glass-modern-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="text-2xl font-bold" style={{ marginBottom: 4 }}>{c.companyName}</h3>
                    <p className="text-gray-600" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                      <MapPin size={14} /> {c.location || 'Location not set'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="reject-btn" onClick={() => handleReject(c)} title="Reject">
                      <X size={16} />
                    </button>
                    <button className="approve-btn" onClick={() => handleApprove(c)} title="Approve">
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>All Approved</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>No companies are pending review.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default OverviewTab;