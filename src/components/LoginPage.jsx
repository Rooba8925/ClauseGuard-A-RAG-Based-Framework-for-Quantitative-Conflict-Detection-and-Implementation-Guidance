import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, User, Lock, ArrowLeft, Users, ShieldCheck, ChevronRight } from 'lucide-react';

const CREDENTIALS = [
  { username: 'employee1', password: 'Emp1@Guard', role: 'employee', displayName: 'Employee 1', roleLabel: 'Engineering Employee' },
  { username: 'employee2', password: 'Emp2@Guard', role: 'employee', displayName: 'Employee 2', roleLabel: 'Engineering Employee' },
  { username: 'employee3', password: 'Emp3@Guard', role: 'employee', displayName: 'Employee 3', roleLabel: 'Engineering Employee' },
  { username: 'admin', password: 'Admin@CG2024', role: 'admin', displayName: 'Administrator', roleLabel: 'System Administrator' },
];

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null); // null | 'admin' | 'employee'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setError('');
    setPassword('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('Admin@CG2024');
    } else {
      setUsername('employee1');
      setPassword('Emp1@Guard');
    }
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const matched = CREDENTIALS.find(
      c => c.username.toLowerCase() === username.trim().toLowerCase() && c.password === password
    );

    if (matched) {
      if (selectedRole && matched.role !== selectedRole) {
        setError(
          matched.role === 'admin'
            ? 'This account has Admin privileges. Please sign in via the Admin portal.'
            : 'This is an Employee account. Please sign in via the Employee portal.'
        );
        setIsLoading(false);
        return;
      }
      onLogin({
        role: matched.role,
        displayName: matched.displayName,
        roleLabel: matched.roleLabel,
        username: matched.username
      });
    } else {
      setError('Invalid username or password.');
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: selectedRole ? '440px' : '620px', display: 'flex', flexDirection: 'column', gap: '22px', transition: 'all 0.3s ease' }}>

        {/* ClauseGuard Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(2,132,199,0.28)', margin: '0 auto 14px',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src="/clauseguard-icon.png" alt="ClauseGuard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            ClauseGuard
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>
            Standards Verification System
          </p>
        </div>

        {/* ── STEP 1: SELECT ROLES SCREEN ── */}
        {!selectedRole && (
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px',
            padding: '34px 32px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                Select Role to Sign In
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Please choose your portal to access your respective dashboard
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              {/* Admin Role Card */}
              <div
                onClick={() => handleSelectRole('admin')}
                style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '22px 20px',
                  cursor: 'pointer',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(2,132,199,0.14)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <img src="/admin-logo.png" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    Admin
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                    Monitor registered employees, query sessions, and audit verification history
                  </p>
                </div>
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#0284c7',
                  fontSize: '0.82rem',
                  fontWeight: '700'
                }}>
                  <span>Admin Sign In</span>
                  <ChevronRight size={15} />
                </div>
              </div>

              {/* Employee Role Card */}
              <div
                onClick={() => handleSelectRole('employee')}
                style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '22px 20px',
                  cursor: 'pointer',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(5,150,105,0.14)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.1)'
                }}>
                  <img src="/employee-logo.png" alt="Employee" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    Employee
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                    Upload dual PDFs, execute spaCy NER queries, compare standards & review decisions
                  </p>
                </div>
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#059669',
                  fontSize: '0.82rem',
                  fontWeight: '700'
                }}>
                  <span>Employee Sign In</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: ROLE-SPECIFIC LOGIN FORM ── */}
        {selectedRole && (
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px',
            padding: '32px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)'
          }}>
            {/* Top Bar with Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handleBackToRoles}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.82rem', fontWeight: '700', padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                <ArrowLeft size={16} /> Select Role
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: selectedRole === 'admin' ? '#eff6ff' : '#ecfdf5',
                border: `1px solid ${selectedRole === 'admin' ? '#bfdbfe' : '#a7f3d0'}`
              }}>
                {selectedRole === 'admin' ? (
                  <img src="/admin-logo.png" alt="Admin" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                ) : (
                  <img src="/employee-logo.png" alt="Employee" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                )}
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: '800',
                  color: selectedRole === 'admin' ? '#0284c7' : '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {selectedRole === 'admin' ? 'Admin Portal' : 'Employee Portal'}
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>
              {selectedRole === 'admin' ? 'Admin Sign In' : 'Employee Sign In'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Username — dynamically labeled as Admin Name or Employee Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>
                  {selectedRole === 'admin' ? 'Admin Name' : 'Employee Name'}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder={selectedRole === 'admin' ? 'Enter admin name' : 'Enter employee name'}
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px',
                      border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '9px',
                      fontSize: '0.88rem', color: '#0f172a', background: '#f8fafc',
                      outline: 'none', fontFamily: 'inherit'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter password"
                    required
                    style={{
                      width: '100%', padding: '10px 38px 10px 38px',
                      border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '9px',
                      fontSize: '0.88rem', color: '#0f172a', background: '#f8fafc',
                      outline: 'none', fontFamily: 'inherit'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '9px 12px', fontSize: '0.8rem', color: '#b91c1c', fontWeight: '600' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', padding: '12px',
                  background: isLoading
                    ? '#94a3b8'
                    : selectedRole === 'admin'
                      ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                      : 'linear-gradient(135deg, #059669, #0284c7)',
                  color: '#fff', border: 'none', borderRadius: '9px',
                  fontSize: '0.92rem', fontWeight: '800', cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: isLoading ? 'none' : '0 4px 14px rgba(2,132,199,0.28)',
                  transition: 'all 0.2s ease', marginTop: '6px'
                }}
              >
                {isLoading ? (
                  <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Authenticating...</>
                ) : (
                  <><LogIn size={15} /> Sign In</>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
