import React, { useState, useEffect } from "react";
import axios from "axios";
import { Building2, CheckCircle, Trash2, Search, Globe, Loader2 } from "lucide-react";
import "../../styles/Company.css";

const API = "http://localhost:5000/api";

const CompaniesTab = () => {
  const [search, setSearch] = useState("");
  const [localCompanies, setLocalCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API}/companies`);
      setLocalCompanies(res.data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyStatus = async (companyId, newStatus) => {
    try {
      await axios.put(`${API}/companies/${companyId}/status`, { status: newStatus });
      fetchCompanies();
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const filteredCompanies = localCompanies.filter(company =>
    company.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    company.companyTitle?.toLowerCase().includes(search.toLowerCase()) ||
    company.companyWebsite?.toLowerCase().includes(search.toLowerCase()) ||
    company.adminNotes?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = { pending: "status-badge pending", approved: "status-badge approved", rejected: "status-badge rejected" };
    return badges[status] || "status-badge";
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} color="#2563eb" />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="admin-main-container">

      {/* Metrics */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon">🏢</div>
          <div>
            <div className="metric-number">{localCompanies.length}</div>
            <div className="metric-label">Total Companies</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div>
            <div className="metric-number">{localCompanies.filter(c => c.status === "pending").length}</div>
            <div className="metric-label">Pending Review</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div>
            <div className="metric-number">{localCompanies.filter(c => c.status === "approved").length}</div>
            <div className="metric-label">Approved</div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="admin-dashboard-card">
        <div className="table-header-section">
          <div className="table-title">Company Directory</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '3px 12px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
            {localCompanies.length} Total • {filteredCompanies.length} Visible
          </span>
        </div>

        {/* Search */}
        <div className="search-container mb-8">
          <Search size={16} color="#9ca3af" />
          <input
            className="search-input"
            placeholder="Search company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="companies-table-container">
          <div className="table-header-row">
            <div className="table-header-cell">Company</div>
            <div className="table-header-cell">Title</div>
            <div className="table-header-cell">Website</div>
            <div className="table-header-cell">Recruiter ID</div>
            <div className="table-header-cell">Status</div>
            <div className="table-header-cell">Admin Notes</div>
            <div className="table-header-cell" style={{ textAlign: 'center' }}>Actions</div>
          </div>

          {filteredCompanies.map(company => (
            <div key={company._id} className="company-row">

              {/* Company */}
              <div className="company-cell">
                <div className={`company-logo ${company.status}`}>
                  {company.companyName?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-xl text-gray-900">{company.companyName}</div>
                  <div className="text-sm text-gray-500">{new Date(company.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Title */}
              <div className="company-cell" style={{ fontSize: 13, color: '#374151' }}>
                {company.companyTitle}
              </div>

              {/* Website */}
              <div className="company-cell">
                <a
                  href={company.companyWebsite?.startsWith("http") ? company.companyWebsite : `https://${company.companyWebsite}`}
                  target="_blank"
                  rel="noreferrer"
                  className="website-link"
                >
                  <Globe size={14} />
                  {company.companyWebsite}
                </a>
              </div>

              {/* Recruiter ID */}
              <div className="company-cell" style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                {company.recruiterId?.toString().slice(-10)}
              </div>

              {/* Status */}
              <div className="company-cell">
                <span className={getStatusBadge(company.status)}>{company.status?.toUpperCase()}</span>
              </div>

              {/* Admin Notes */}
              <div className="company-cell" style={{ fontSize: 13, color: '#6b7280' }}>
                {company.adminNotes || "—"}
              </div>

              {/* Actions */}
              <div className="company-cell" style={{ justifyContent: 'center' }}>
                <div className="action-buttons">
                  <button
                    onClick={() => updateCompanyStatus(company._id, "approved")}
                    disabled={company.status === "approved"}
                    className="action-btn approve-btn"
                    title="Approve"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => updateCompanyStatus(company._id, "rejected")}
                    disabled={company.status === "rejected"}
                    className="action-btn reject-btn"
                    title="Reject"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            </div>
          ))}

          {filteredCompanies.length === 0 && (
            <div className="empty-state">
              <Building2 className="empty-icon" />
              <div className="empty-title">No Companies Found</div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CompaniesTab;