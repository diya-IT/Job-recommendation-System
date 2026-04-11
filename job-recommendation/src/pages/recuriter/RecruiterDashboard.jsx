import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ErrorBoundary from './ErrorBoundary';
import "../../styles/RecruiterDashboard.css";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const RecruiterDashboard = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editSkillsInput, setEditSkillsInput] = useState('');

  const [showCompanyApprovalModal, setShowCompanyApprovalModal] = useState(false);
  const [showApprovalCelebration, setShowApprovalCelebration] = useState(false);
  const [showPostJobCelebration, setShowPostJobCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasApprovedCompany, setHasApprovedCompany] = useState(false);

  const [jobForm, setJobForm] = useState({
    jobName: '', jobTitle: '', jobDescription: '', skills: [], experience: '', companyId: ''
  });
  const [skillsInput, setSkillsInput] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [profile, setProfile] = useState({
    name: 'TechFlow Inc.',
    email: 'recruiter@techflow.com',
    role: 'Senior Recruiter',
    avatar: 'https://ui-avatars.com/api/?name=Tech+Recruiter&background=2563eb&color=fff'
  });

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const storedUserString = localStorage.getItem("user");
        if (!storedUserString) { navigate('/login'); return; }
        const user = JSON.parse(storedUserString);
        if (!user.id) { console.error("No ID in localStorage user:", user); return; }

        try {
          const profileRes = await axios.get(`http://localhost:5000/api/user/${user.id}`);
          setProfile({
            name: profileRes.data.name || profileRes.data.fullName || 'TechFlow Inc.',
            email: profileRes.data.email || 'recruiter@techflow.com',
            role: profileRes.data.role || 'Senior Recruiter',
            avatar: profileRes.data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileRes.data.name || "Tech Recruiter")}&background=2563eb&color=fff`
          });
        } catch (error) { console.error("Profile fetch failed:", error); }

        try {
          const companiesRes = await axios.get(`http://localhost:5000/api/reccompanies/${user.id}`);
          const companiesData = companiesRes.data.data || [];
          setCompanies(companiesData);
          const approvedCompanies = companiesData.filter(c => c.status?.toLowerCase() === 'approved');
          const isNowApproved = approvedCompanies.length > 0;
          setHasApprovedCompany(isNowApproved);
          if (isNowApproved) {
            setShowCompanyApprovalModal(false);
            const celebrationShown = sessionStorage.getItem(`approval_celebrated_${user.id}`);
            if (!celebrationShown) {
              setShowApprovalCelebration(true);
              sessionStorage.setItem(`approval_celebrated_${user.id}`, 'true');
              setTimeout(() => setShowApprovalCelebration(false), 6000);
            }
          } else {
            setShowCompanyApprovalModal(true);
          }
        } catch (error) {
          console.error("Companies fetch failed:", error);
          setHasApprovedCompany(false);
          setShowCompanyApprovalModal(true);
        }

        try {
          const jobsRes = await axios.get(`http://localhost:5000/api/jobs/${user.id}`);
          setJobs(jobsRes.data || []);
        } catch (error) { console.error("Jobs fetch failed:", error); }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // ================= MEMOIZED STATS =================
  const activeJobsCount = useMemo(() => jobs.filter(j => j.status?.toLowerCase() === 'active').length, [jobs]);
  const totalMatches = useMemo(() => jobs.reduce((sum, j) => sum + (j.applicants || 0), 0), [jobs]);
  const avgMatchRate = useMemo(() => jobs.length > 0 ? Math.round(totalMatches / jobs.length) : 0, [jobs, totalMatches]);

  // ================= HANDLERS =================
  const handleProfileInputChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await fetch(`http://localhost:5000/api/users/edit/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      localStorage.setItem("user", JSON.stringify({ ...user, ...profile }));
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 3000);
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Profile save failed:", err);
      alert("Failed to save profile. Try again.");
    }
  };

  const handleJobInputChange = (e) => setJobForm({ ...jobForm, [e.target.name]: e.target.value });

  const addSkill = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return;
    if (jobForm.skills.includes(s)) return setSkillsInput('');
    setJobForm({ ...jobForm, skills: [...jobForm.skills, s] });
    setSkillsInput('');
  };

  const removeSkill = (skill) => setJobForm({ ...jobForm, skills: jobForm.skills.filter(s => s !== skill) });

  const handleSkillsKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillsInput); }
    else if (e.key === 'Backspace' && !skillsInput && jobForm.skills.length) removeSkill(jobForm.skills[jobForm.skills.length - 1]);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!jobForm.jobName || !jobForm.jobTitle || !jobForm.skills.length || !jobForm.experience || !jobForm.companyId) {
      alert('Please fill all required fields including company, and add at least one skill.'); return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    const experienceNum = parseFloat(jobForm.experience);
    if (isNaN(experienceNum) || experienceNum < 0) { alert('Experience must be a valid number.'); return; }
    try {
      const response = await axios.post('http://localhost:5000/api/jobs', { ...jobForm, experience: experienceNum, recruiterId: user.id });
      setJobs([response.data.job, ...jobs]);
      setShowPostJobModal(false);
      setJobForm({ jobName: '', jobTitle: '', jobDescription: '', skills: [], experience: '', companyId: '' });
      setSkillsInput('');
      setShowPostJobCelebration(true);
      setTimeout(() => setShowPostJobCelebration(false), 5000);
      setActiveTab('jobs');
    } catch (err) {
      console.error("Error posting job:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to post job.");
    }
  };

  const handleOpenEditModal = (job) => {
    let expString = '';
    if (job.experience && typeof job.experience === 'object') {
      const { years = 0, months = 0 } = job.experience;
      if (years && months) expString = `${years} years ${months} months`;
      else if (years) expString = `${years} years`;
      else if (months) expString = `${months} months`;
    } else { expString = job.experience || ''; }
    setEditingJob({ ...job, companyId: job.companyId?._id || job.companyId || '', experience: expString, skills: [...(job.skills || [])] });
    setEditSkillsInput('');
    setShowEditJobModal(true);
  };

  const handleEditJobInputChange = (e) => setEditingJob({ ...editingJob, [e.target.name]: e.target.value });

  const addEditSkill = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return;
    if ((editingJob.skills || []).includes(s)) return setEditSkillsInput('');
    setEditingJob({ ...editingJob, skills: [...(editingJob.skills || []), s] });
    setEditSkillsInput('');
  };

  const removeEditSkill = (skill) => setEditingJob({ ...editingJob, skills: editingJob.skills.filter(s => s !== skill) });

  const handleEditSkillsKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEditSkill(editSkillsInput); }
    else if (e.key === 'Backspace' && !editSkillsInput && (editingJob.skills || []).length) removeEditSkill(editingJob.skills[editingJob.skills.length - 1]);
  };

  const handleSaveEditJob = async (e) => {
    e.preventDefault();
    if (!editingJob.jobName || !editingJob.jobTitle || !(editingJob.skills || []).length || !editingJob.experience) {
      alert('Please fill all required fields and add at least one skill.'); return;
    }
    try {
      const payload = {
        jobName: editingJob.jobName, jobTitle: editingJob.jobTitle, jobDescription: editingJob.jobDescription,
        skills: editingJob.skills || [], experience: editingJob.experience, companyId: editingJob.companyId || undefined,
      };
      const response = await axios.put(`http://localhost:5000/api/jobs/${editingJob._id}`, payload);
      setJobs(jobs.map(j => j._id === editingJob._id ? (response.data.job || editingJob) : j));
      setShowEditJobModal(false);
      setEditingJob(null);
      alert('✅ Job updated successfully!');
    } catch (err) {
      console.error("Error updating job:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to update job.");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
      alert('Job deleted successfully!');
    } catch (err) { console.error("Error deleting job:", err); alert('Failed to delete job.'); }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    navigate('/login');
  }, [navigate]);

  const getCompanyName = (companyId) => {
    if (!companyId) return 'N/A';
    const company = companies.find(c => c._id === companyId || c._id?.$oid === companyId);
    return company ? company.companyName : 'N/A';
  };

  const getCompanyStatus = (company) => {
    const status = company.status || 'pending';
    switch (status.toLowerCase()) {
      case 'approved': return { text: 'Approved', color: 'success' };
      case 'rejected': return { text: 'Rejected', color: 'danger' };
      default: return { text: 'Pending', color: 'warning' };
    }
  };

  const canPostJobs = hasApprovedCompany;

  const refreshCompanyStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const companiesRes = await axios.get(`http://localhost:5000/api/reccompanies/${user.id}`);
      const companiesData = companiesRes.data.data || [];
      setCompanies(companiesData);
      const approvedCompanies = companiesData.filter(c => c.status?.toLowerCase() === 'approved');
      const isNowApproved = approvedCompanies.length > 0;
      setHasApprovedCompany(isNowApproved);
      if (isNowApproved) {
        setShowCompanyApprovalModal(false);
        sessionStorage.removeItem(`approval_celebrated_${user.id}`);
        setShowApprovalCelebration(true);
        sessionStorage.setItem(`approval_celebrated_${user.id}`, 'true');
        setTimeout(() => setShowApprovalCelebration(false), 6000);
        alert('🎉 Great! You now have approved companies. You can post jobs now!');
      } else {
        alert('⏳ Still waiting for admin approval. Keep checking!');
      }
    } catch (error) {
      console.error("❌ Refresh failed:", error.response?.data || error.message);
      alert('Failed to refresh status. Please try again.');
    }
  };

  const getJobAvatarClass = (jobName) => {
    const ch = jobName?.charAt(0).toLowerCase();
    if (!ch) return 'rd-job-avatar-orange-bg';
    if ('ab'.includes(ch)) return 'rd-job-avatar-blue-bg';
    if ('cd'.includes(ch)) return 'rd-job-avatar-purple-bg';
    if ('ef'.includes(ch)) return 'rd-job-avatar-cyan-bg';
    return 'rd-job-avatar-orange-bg';
  };

  // helper: today's date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="rd-dashboard-wrapper">

      {/* ── Keyframes (inline so they always load) ── */}
      <style>{`
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(30px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes popIn    { 0%{transform:scale(0.88);opacity:0} 70%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
        @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }

        .pj-card {
          background:#fff;
          border-radius:14px;
          padding:20px;
          border:1px solid #e5e7eb;
          box-shadow:0 1px 4px rgba(0,0,0,0.06);
          display:flex;
          flex-direction:column;
          transition:transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pj-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.1); }

        .pj-edit-btn {
          flex:1; padding:9px 0; border-radius:9px;
          border:1.5px solid #2563eb; background:transparent;
          color:#2563eb; font-size:13px; font-weight:600;
          cursor:pointer; transition:background 0.15s, color 0.15s;
          display:flex; align-items:center; justify-content:center; gap:5px;
          font-family:inherit;
        }
        .pj-edit-btn:hover { background:#2563eb; color:#fff; }

        .pj-delete-btn {
          flex:1; padding:9px 0; border-radius:9px;
          border:1.5px solid #ef4444; background:transparent;
          color:#ef4444; font-size:13px; font-weight:600;
          cursor:pointer; transition:background 0.15s, color 0.15s;
          display:flex; align-items:center; justify-content:center; gap:5px;
          font-family:inherit;
        }
        .pj-delete-btn:hover { background:#ef4444; color:#fff; }
      `}</style>

      {/* ===== SUCCESS TOAST ===== */}
      {showSuccessCard && (
        <div className="rd-success-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Profile updated successfully!
        </div>
      )}

      {/* ===== APPROVAL CELEBRATION ===== */}
      {showApprovalCelebration && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.3s ease' }}
          onClick={() => setShowApprovalCelebration(false)}>
          <div style={{ background:'#fff', borderRadius:'20px', padding:'48px 40px', maxWidth:'480px', width:'90%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', position:'relative', animation:'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:'80px', height:'80px', background:'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 0 10px rgba(34,197,94,0.1)', fontSize:'36px' }}>✓</div>
            <h2 style={{ fontSize:'24px', fontWeight:'800', color:'#111827', marginBottom:'10px' }}>🎉 You're Approved!</h2>
            <p style={{ color:'#6b7280', fontSize:'15px', lineHeight:'1.6', marginBottom:'6px' }}>Your company has been <strong style={{ color:'#16a34a' }}>approved by the admin</strong>.</p>
            <p style={{ color:'#9ca3af', fontSize:'14px', marginBottom:'28px' }}>You can now post jobs and start hiring top talent! 🚀</p>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'14px', marginBottom:'24px', textAlign:'left' }}>
              {companies.filter(c => c.status?.toLowerCase() === 'approved').map(company => (
                <div key={company._id?.$oid || company._id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 0' }}>
                  <span style={{ width:'30px', height:'30px', background:'#16a34a', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'13px' }}>{company.companyName?.charAt(0).toUpperCase() || 'C'}</span>
                  <div>
                    <p style={{ color:'#111827', fontWeight:'600', margin:0, fontSize:'13px' }}>{company.companyName}</p>
                    <p style={{ color:'#16a34a', margin:0, fontSize:'11px' }}>✅ Approved</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowApprovalCelebration(false)} style={{ background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'white', border:'none', borderRadius:'10px', padding:'13px 36px', fontSize:'15px', fontWeight:'700', cursor:'pointer', width:'100%', boxShadow:'0 4px 16px rgba(34,197,94,0.3)', fontFamily:'inherit' }}>🎯 Start Posting Jobs</button>
            <p style={{ color:'#9ca3af', fontSize:'12px', marginTop:'12px' }}>Click anywhere outside to dismiss</p>
          </div>
        </div>
      )}

      {/* ===== POST JOB CELEBRATION ===== */}
      {showPostJobCelebration && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.3s ease' }}
          onClick={() => setShowPostJobCelebration(false)}>
          {[...Array(18)].map((_, i) => (
            <div key={i} style={{ position:'absolute', left:`${Math.random()*100}%`, top:'-20px', width:`${8+Math.random()*8}px`, height:`${8+Math.random()*8}px`, background:['#2563eb','#22c55e','#f59e0b','#ec4899','#8b5cf6','#06b6d4'][i%6], borderRadius:Math.random()>0.5?'50%':'2px', animation:`confettiFall ${2+Math.random()*3}s ${Math.random()*1.5}s ease-in forwards`, pointerEvents:'none' }} />
          ))}
          <div style={{ background:'#fff', borderRadius:'20px', padding:'44px 38px', maxWidth:'440px', width:'90%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', position:'relative', animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:'84px', height:'84px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 0 10px rgba(37,99,235,0.1)', fontSize:'38px' }}>🚀</div>
            <h2 style={{ fontSize:'22px', fontWeight:'800', color:'#111827', marginBottom:'8px' }}>Job Posted Successfully!</h2>
            <p style={{ color:'#6b7280', fontSize:'14px', lineHeight:'1.6', marginBottom:'6px' }}>Your job is now <strong style={{ color:'#2563eb' }}>live and visible</strong> to candidates.</p>
            <p style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'28px' }}>Top talent is already being matched! 🎯</p>
            {jobs.length > 0 && (
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'10px', padding:'14px', marginBottom:'24px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', minWidth:'40px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'16px' }}>{jobs[0]?.jobName?.charAt(0).toUpperCase()||'J'}</div>
                <div>
                  <p style={{ color:'#111827', fontWeight:'700', margin:0, fontSize:'14px' }}>{jobs[0]?.jobTitle||'New Job'}</p>
                  <p style={{ color:'#2563eb', margin:'2px 0 0', fontSize:'12px' }}>✅ Active · {jobs[0]?.skills?.slice(0,2).join(', ')}{jobs[0]?.skills?.length>2?'...':''}</p>
                </div>
              </div>
            )}
            <button onClick={() => setShowPostJobCelebration(false)} style={{ background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'white', border:'none', borderRadius:'10px', padding:'13px 36px', fontSize:'15px', fontWeight:'700', cursor:'pointer', width:'100%', boxShadow:'0 4px 16px rgba(37,99,235,0.3)', fontFamily:'inherit' }}>🎯 View Posted Jobs</button>
            <p style={{ color:'#9ca3af', fontSize:'12px', marginTop:'12px' }}>Click anywhere outside to dismiss</p>
          </div>
        </div>
      )}

      {/* ===== COMPANY APPROVAL MODAL ===== */}
      {showCompanyApprovalModal && (
        <div className="rd-modal-overlay" style={{ zIndex:10000 }}>
          <div className="rd-modal-content rd-company-approval-modal" style={{ maxWidth:'700px', maxHeight:'90vh', overflowY:'auto' }}>
            <div className="rd-modal-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/><path d="M12 8v5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#f59e0b"/></svg>
                Company Approval Required
              </h2>
              <button className="rd-modal-close" onClick={() => {}} disabled style={{ opacity:0.4, cursor:'not-allowed' }}>×</button>
            </div>
            <div className="rd-company-approval-content">
              <div className="rd-warning-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 9v4"/><path d="M12 16h.01"/>
                </svg>
              </div>
              <h3>Your companies need admin approval</h3>
              <p className="rd-approval-message">You cannot post jobs until at least one of your companies has <strong>"approved"</strong> status. This modal will automatically disappear once an admin approves your company.</p>
              {companies.length > 0 ? (
                <div className="rd-approval-companies-list">
                  <h4>Your Companies ({companies.length}):</h4>
                  <div className="rd-companies-status-grid">
                    {companies.map(company => {
                      const statusInfo = getCompanyStatus(company);
                      return (
                        <div key={company._id?.$oid || company._id} className="rd-company-status-item">
                          <div className="rd-company-status-header">
                            <div className={`rd-company-avatar rd-${statusInfo.color}`}>{company.companyName?.charAt(0).toUpperCase() || 'C'}</div>
                            <div className="rd-company-status-details">
                              <span className={`rd-company-status-badge rd-status-${statusInfo.color}`}>{statusInfo.text}</span>
                              {company.adminNotes && statusInfo.color === 'danger' && <p className="rd-admin-notes">Admin Notes: {company.adminNotes}</p>}
                            </div>
                          </div>
                          <div className="rd-company-info">
                            <h5>{company.companyName}</h5>
                            <p>{company.companyTitle}</p>
                            {company.companyWebsite && <a href={company.companyWebsite} target="_blank" rel="noopener noreferrer" className="rd-company-website">🌐 {company.companyWebsite}</a>}
                            <p className="rd-company-date">Updated: {new Date(company.updatedAt || company.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rd-no-companies"><p>❌ No companies found. Please submit companies for admin review first.</p></div>
              )}
              <div className="rd-approval-actions">
                <button className="rd-secondary-btn" onClick={refreshCompanyStatus}>🔄 Refresh Status</button>
              </div>
              <div className="rd-approval-footer">
                <p><strong>Status: ❌ Waiting for Admin Approval</strong><br/><small style={{ fontWeight:'400', color:'#6b7280' }}>This modal will auto-close when you get approved ✅</small></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className="rd-sidebar">
        {/* Logo */}
        <div className="rd-sidebar-header">
          <div className="rd-logo-section">
            <div className="rd-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="12" rx="3"/>
                <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
              </svg>
            </div>
            <span className="rd-logo-text">Skill<span>Hire</span></span>
          </div>
        </div>

        {/* Profile */}
        <div className="rd-sidebar-profile">
          <div className="rd-profile-image-container">
            <img src={profile.avatar} className="rd-profile-image" alt="Profile" />
            <div className="rd-profile-status"></div>
          </div>
          <div className="rd-profile-info">
            {isEditingProfile ? (
              <form className="rd-profile-edit-form" onSubmit={e => { e.preventDefault(); handleSaveProfile(); }}>
                <input name="name" value={profile.name} onChange={handleProfileInputChange} className="rd-profile-input" placeholder="Name" />
                <input name="email" value={profile.email} onChange={handleProfileInputChange} className="rd-profile-input" placeholder="Email" />
                <div className="rd-profile-edit-actions">
                  <button type="button" className="rd-cancel-btn" style={{ padding:'7px 14px', fontSize:'12px' }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                  <button type="submit" className="rd-submit-btn" style={{ padding:'7px 14px', fontSize:'12px' }}>Save</button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="rd-profile-name">{profile.name}</h3>
                <p className="rd-profile-email">{profile.email}</p>
                <span className="rd-profile-role">{profile.role}</span>
              </>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="rd-sidebar-nav">
          <button className="rd-edit-profile-btn" onClick={() => setIsEditingProfile(!isEditingProfile)}>
            {isEditingProfile ? '✕ Close Edit' : '✎ Edit Profile'}
          </button>

          {[
            { id:'overview', label:'Overview', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
            { id:'jobs',     label:'Job Management', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 4 0v2"/></svg> },
            { id:'insights', label:'Analytics', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l4-8 4 4 4-6 4 6"/></svg> },
          ].map(item => (
            <button key={item.id} className={`rd-nav-item ${activeTab === item.id ? 'rd-nav-item-active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <button className="rd-logout-btn" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </aside>

      {/* ===== MAIN WRAPPER ===== */}
      <div className="rd-main-wrapper">

        {/* Header */}
        <header className="rd-header">
          <div>
            <h2 className="rd-page-title-header">
              {activeTab === 'overview' && 'Recruiter Dashboard'}
              {activeTab === 'jobs'     && 'Job Management'}
              {activeTab === 'insights' && 'Analytics & Insights'}
            </h2>
            <p className="rd-header-subtitle">{today}</p>
          </div>
          <div className="rd-header-right">
            <div className="rd-search-bar">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#9CA3AF" strokeWidth="2"/><path d="M13.5 13.5L17 17" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/></svg>
              <input type="text" placeholder="Search..." />
            </div>
            <div className="rd-notification-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
                <path d="M15 17H20L18.595 15.595A2.5 2.5 0 0 1 18 14.152V11a6 6 0 0 0-12 0v3.152a2.5 2.5 0 0 1-.595 1.595L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9"/>
              </svg>
              <span className="rd-notification-badge">3</span>
            </div>
            <div className="rd-header-avatar">
              <img src={profile.avatar} alt="avatar" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="rd-main-content">
          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ width:'40px', height:'40px', border:'3px solid #dbeafe', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ color:'#6b7280', fontWeight:'600' }}>Loading your dashboard...</p>
            </div>
          ) : (
            <>
              {/* ===== OVERVIEW TAB ===== */}
              {activeTab === 'overview' && (
                <>
                  {/* Welcome Banner */}
                  <div className="rd-title-section">
                    <div>
                      <h2 className="rd-page-title">
                        Welcome back, {profile.name !== 'TechFlow Inc.' ? profile.name : 'Recruiter'} 👋
                      </h2>
                      <p className="rd-page-subtitle">
                        {canPostJobs ? 'Your dashboard is ready. Post a job to get started.' : 'Company approval pending — contact admin to activate posting.'}
                      </p>
                    </div>
                    <div className="rd-action-buttons">
                      <button
                        className={`rd-post-job-btn ${!canPostJobs ? 'rd-disabled-btn' : ''}`}
                        onClick={() => { if (canPostJobs) setShowPostJobModal(true); }}
                        disabled={!canPostJobs}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        {canPostJobs ? 'Post a Job' : 'Approval Required'}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rd-stats-grid">
                    {/* Active Jobs */}
                    <div className="rd-stat-card">
                      <div className="rd-stat-header">
                        <div>
                          <p className="rd-stat-label">Active Jobs</p>
                          <h3 className="rd-stat-value">{activeJobsCount}</h3>
                          <p className="rd-stat-description">Currently posted</p>
                        </div>
                        <div className="rd-stat-icon rd-stat-icon-blue">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="7" width="14" height="10" rx="1"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Total Applicants */}
                    <div className="rd-stat-card">
                      <div className="rd-stat-header">
                        <div>
                          <p className="rd-stat-label">Total Applicants</p>
                          <h3 className="rd-stat-value">{totalMatches}</h3>
                          <p className="rd-stat-description">Qualified candidates</p>
                        </div>
                        <div className="rd-stat-icon rd-stat-icon-cyan">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 20c0-1.657-2.239-3-5-3s-5 1.343-5 3M21 17c0-1.263-1.338-2.326-3.162-2.719M3 17c0-1.263 1.338-2.326 3.162-2.719M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zm4 1.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Avg Matches */}
                    <div className="rd-stat-card">
                      <div className="rd-stat-header">
                        <div>
                          <p className="rd-stat-label">Avg. Matches / Job</p>
                          <h3 className="rd-stat-value">{avgMatchRate}</h3>
                          <p className="rd-stat-description">Skill alignment rate</p>
                        </div>
                        <div className="rd-stat-icon rd-stat-icon-blue-light">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 7l5 5-5 5M6 7l5 5-5 5"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Jobs */}
                  <div className="rd-content-grid">
                    <div className="rd-recent-jobs-card">
                      <div className="rd-card-header-with-action">
                        <div className="rd-card-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 4 0v2"/></svg>
                          <h3>Recent Job Posts</h3>
                        </div>
                        <button className="rd-view-all-btn" onClick={() => setActiveTab('jobs')}>View All →</button>
                      </div>

                      {jobs.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'40px 20px' }}>
                          <div style={{ fontSize:'50px', marginBottom:'12px' }}>📋</div>
                          <p style={{ color:'#9ca3af', fontSize:'14px' }}>No jobs posted yet.</p>
                        </div>
                      ) : jobs.slice(0, 3).map(job => (
                        <div key={job._id} className="rd-recent-job-item">
                          <h4>{job.jobTitle || 'Untitled Job'}</h4>
                          <div className="rd-job-skills">
                            {(job.skills || []).slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="rd-skill-tag">{skill}</span>
                            ))}
                            {(job.skills?.length || 0) > 3 && (
                              <span className="rd-skill-tag">+{job.skills.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ===== JOBS TAB ===== */}
              {activeTab === 'jobs' && (
                <div className="rd-tab-content">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                    <div>
                      <h2>Job Management</h2>
                      <p style={{ color:'#6b7280', fontSize:'13px', marginTop:'3px' }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
                    </div>
                    <button
                      className={`rd-post-job-btn ${!canPostJobs ? 'rd-disabled-btn' : ''}`}
                      onClick={() => { if (canPostJobs) setShowPostJobModal(true); }}
                      disabled={!canPostJobs}
                      style={{ fontSize:'13px', padding:'9px 18px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      Post New Job
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'80px 20px' }}>
                      <div style={{ fontSize:'64px', marginBottom:'16px' }}>📋</div>
                      <h3 style={{ color:'#374151', marginBottom:'8px', fontSize:'20px', fontWeight:'700' }}>No jobs posted yet</h3>
                      <p style={{ color:'#9ca3af', fontSize:'14px' }}>
                        {!canPostJobs ? 'Get your company approved first!' : 'Click "+ Post New Job" above to get started!'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'18px' }}>
                      {jobs.map((job, index) => (
                        <div key={job._id || index} className="pj-card" style={{ animation:`popIn 0.3s ease ${index * 0.05}s both` }}>
                          {/* Header */}
                          <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'12px' }}>
                            <div className={`rd-job-avatar-small ${getJobAvatarClass(job.jobTitle)}`}
                              style={{ width:'46px', height:'46px', minWidth:'46px', borderRadius:'11px', fontSize:'18px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              {job.jobTitle?.charAt(0).toUpperCase() || 'J'}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <h4 style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'700', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {job.jobTitle || 'Untitled Job'}
                              </h4>
                              {job.jobName && (
                                <p style={{ margin:0, fontSize:'12px', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.jobName}</p>
                              )}
                            </div>
                            <span className={`rd-status-badge rd-status-${(job.status || 'active').toLowerCase()}`} style={{ fontSize:'10px', whiteSpace:'nowrap', flexShrink:0 }}>
                              {job.status?.toLowerCase() === 'approved' ? '✅ Live' : job.status?.toLowerCase() === 'pending' ? '⏳ Pending' : 'Active'}
                            </span>
                          </div>

                          {/* Description */}
                          {job.jobDescription && (
                            <p style={{ margin:'0 0 10px', fontSize:'12px', color:'#6b7280', lineHeight:'1.5', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                              {job.jobDescription}
                            </p>
                          )}

                          {/* Meta */}
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'10px', fontSize:'12px', color:'#9ca3af' }}>
                            <span>⏱ {job.experience ? `${job.experience.years||0}.${job.experience.months||0} yrs` : '0-2 yrs'} exp</span>
                            <span>👥 {job.applicants || 0} applicants</span>
                            {job.matchedUsers?.length > 0 && <span>🤝 {job.matchedUsers.length} matched</span>}
                            <span>📅 {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>

                          {/* Skills */}
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'14px' }}>
                            {(job.skills || []).slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="rd-skill-tag-small">{skill}</span>
                            ))}
                            {(job.skills?.length || 0) > 4 && (
                              <span className="rd-skill-tag-small">+{job.skills.length - 4} more</span>
                            )}
                          </div>

                          <div style={{ height:'1px', background:'#f3f4f6', margin:'0 0 12px' }} />

                          {/* Actions */}
                          <div style={{ display:'flex', gap:'8px' }}>
                            <button className="pj-edit-btn" onClick={() => handleOpenEditModal(job)} style={{ flex:1 }}>✏️ Edit</button>
                            <button className="pj-delete-btn" onClick={() => handleDeleteJob(job._id)} style={{ flex:1 }}>🗑️ Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== INSIGHTS TAB ===== */}
              {activeTab === 'insights' && (
                <div className="rd-tab-content">
                  <h2>Analytics & Insights</h2>
                  <p style={{ color:'#6b7280', marginTop:'12px', fontSize:'14px', lineHeight:'1.6' }}>
                    Coming soon! This section will display analytics about your job posts and candidates.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== POST JOB MODAL ===== */}
      {showPostJobModal && canPostJobs && (
        <div className="rd-modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="rd-modal-content" onClick={e => e.stopPropagation()}>
            <div className="rd-modal-header">
              <h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 4 0v2"/></svg>
                Post New Job
              </h2>
              <button className="rd-modal-close" onClick={() => setShowPostJobModal(false)}>×</button>
            </div>
            <form onSubmit={handlePostJob}>
              <div className="rd-form-group">
                <label>Job Name *</label>
                <input type="text" name="jobName" value={jobForm.jobName} onChange={handleJobInputChange} placeholder="e.g. Frontend Developer" required />
              </div>
              <div className="rd-form-group">
                <label>Job Title *</label>
                <input type="text" name="jobTitle" value={jobForm.jobTitle} onChange={handleJobInputChange} placeholder="e.g. Senior React Developer" required />
              </div>
              <div className="rd-form-group">
                <label>Company * <span className="rd-approved-only">Approved only</span></label>
                <select name="companyId" value={jobForm.companyId} onChange={handleJobInputChange} required>
                  <option value="">Select Approved Company</option>
                  {companies.filter(c => c.status?.toLowerCase() === 'approved').map(company => (
                    <option key={company._id?.$oid || company._id} value={company._id?.$oid || company._id}>{company.companyName}</option>
                  ))}
                </select>
              </div>
              <div className="rd-form-group">
                <label>Job Description *</label>
                <textarea name="jobDescription" value={jobForm.jobDescription} onChange={handleJobInputChange} rows="4" placeholder="Describe the role and responsibilities..." required />
              </div>
              <div className="rd-form-group">
                <label>Skills Required *</label>
                <div className="rd-skills-input-container">
                  {jobForm.skills.map(skill => (
                    <span key={skill} className="rd-skill-chip">{skill}<button type="button" onClick={() => removeSkill(skill)}>×</button></span>
                  ))}
                  <input type="text" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} onKeyDown={handleSkillsKeyDown} placeholder="Type skill + Enter" />
                </div>
              </div>
              <div className="rd-form-group">
                <label>Experience Required *</label>
                <input type="text" name="experience" value={jobForm.experience} onChange={handleJobInputChange} placeholder="e.g., 2-5 years" required />
              </div>
              <div className="rd-modal-actions">
                <button type="button" className="rd-cancel-btn" onClick={() => setShowPostJobModal(false)}>Cancel</button>
                <button type="submit" className="rd-submit-btn">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT JOB MODAL ===== */}
      {showEditJobModal && editingJob && (
        <div className="rd-modal-overlay" onClick={() => { setShowEditJobModal(false); setEditingJob(null); }}>
          <div className="rd-modal-content" onClick={e => e.stopPropagation()}>
            <div className="rd-modal-header">
              <h2>✏️ Edit Job</h2>
              <button className="rd-modal-close" onClick={() => { setShowEditJobModal(false); setEditingJob(null); }}>×</button>
            </div>
            <form onSubmit={handleSaveEditJob}>
              <div className="rd-form-group">
                <label>Job Name *</label>
                <input type="text" name="jobName" value={editingJob.jobName || ''} onChange={handleEditJobInputChange} required />
              </div>
              <div className="rd-form-group">
                <label>Job Title *</label>
                <input type="text" name="jobTitle" value={editingJob.jobTitle || ''} onChange={handleEditJobInputChange} required />
              </div>
              <div className="rd-form-group">
                <label>Company <span className="rd-approved-only">Approved only</span></label>
                <select name="companyId" value={editingJob.companyId || ''} onChange={handleEditJobInputChange}>
                  <option value="">Select Approved Company</option>
                  {companies.filter(c => c.status?.toLowerCase() === 'approved').map(company => (
                    <option key={company._id?.$oid || company._id} value={company._id?.$oid || company._id}>{company.companyName}</option>
                  ))}
                </select>
              </div>
              <div className="rd-form-group">
                <label>Job Description</label>
                <textarea name="jobDescription" value={editingJob.jobDescription || ''} onChange={handleEditJobInputChange} rows="4" />
              </div>
              <div className="rd-form-group">
                <label>Skills Required *</label>
                <div className="rd-skills-input-container">
                  {(editingJob.skills || []).map(skill => (
                    <span key={skill} className="rd-skill-chip">{skill}<button type="button" onClick={() => removeEditSkill(skill)}>×</button></span>
                  ))}
                  <input type="text" value={editSkillsInput} onChange={e => setEditSkillsInput(e.target.value)} onKeyDown={handleEditSkillsKeyDown} placeholder="Type skill + Enter" />
                </div>
              </div>
              <div className="rd-form-group">
                <label>Experience Required *</label>
                <input type="text" name="experience" value={editingJob.experience || ''} onChange={handleEditJobInputChange} placeholder="e.g., 2-5 years" required />
              </div>
              <div className="rd-modal-actions">
                <button type="button" className="rd-cancel-btn" onClick={() => { setShowEditJobModal(false); setEditingJob(null); }}>Cancel</button>
                <button type="submit" className="rd-submit-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecruiterDashboard;