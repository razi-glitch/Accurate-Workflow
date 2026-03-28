import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Layers, PlusCircle, Folder, Settings, LogOut, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const NavItem = ({ to, icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className="nav-item"
                style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    marginBottom: '0.5rem', fontWeight: isActive ? '600' : '500',
                    transition: 'all var(--transition-fast)'
                }}
            >
                <div className="nav-item-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    {React.cloneElement(icon, { size: 20 })}
                </div>
                {label}
            </Link>
        );
    };

    return (
        <div className="layout-container">
            <aside
                className="sidebar-nav"
                style={{
                    width: '280px',
                    background: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column',
                    padding: '1.5rem',
                }}
            >
                <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: 'var(--primary-accent)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <Layers color="white" size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Core Flow</h2>
                </div>

                <nav style={{ flex: 1 }} className="nav-menu">
                    <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
                    <NavItem to="/jobs" icon={<Folder />} label="All Jobs" />
                    <NavItem to="/jobs/new" icon={<PlusCircle />} label="Create Job" />
                    <NavItem to="/svg" icon={<Home />} label="SVG Automation" />

                    <div style={{ marginTop: '2rem' }}>
                        <p className="nav-section-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>System</p>
                        <NavItem to="/settings" icon={<Settings />} label="Settings" />
                    </div>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {(user?.fullName || user?.username)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.fullName || user?.username}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
                        </div>
                    </div>
                    <button
                        className="logout-button"
                        onClick={logout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', width: '100%', borderRadius: 'var(--radius-md)', transition: 'background var(--transition-fast)' }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{ background: 'var(--bg-color)' }}>
                <Outlet />
            </main>
        </div>
    );
}
