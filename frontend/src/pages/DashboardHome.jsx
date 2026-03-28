import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, PauseCircle, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
    const { user, api } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        designPending: 0,
        designInProcess: 0,
        plateProcess: 0,
        completed: 0,
        recentJobs: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard');
                setStats({
                    total: data.total,
                    designPending: data.designPending,
                    designInProcess: data.designInProcess,
                    plateProcess: data.plateProcess,
                    completed: data.completed,
                    recentJobs: data.recentJobs || []
                });
            } catch (error) {
                console.error("Failed to fetch dashboard metrics");
            }
        };
        fetchStats();
    }, [api]);

    const StatCard = ({ title, count, icon, color }) => (
        <div className="glass-panel animate-fade-in stat-card">
            <div className="stat-card-header">
                <p className="stat-card-title">{title}</p>
                {React.cloneElement(icon, { color, className: 'stat-card-icon' })}
            </div>
            <h3 className="stat-card-value">{count}</h3>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'var(--success)';
            case 'Design Pending': return 'var(--warning)';
            case 'Design Hold': return '#f43f5e';
            case 'Plate Process': return '#a855f7';
            default: return 'var(--info)';
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header className="dashboard-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>Welcome back, {user?.fullName || user?.username}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening in your factory today.</p>
                </div>
                <Link to="/jobs/new" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', whiteSpace: 'nowrap' }}>New Job</Link>
            </header>

            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard title="Total Jobs" count={stats.total} icon={<Activity />} color="var(--primary-accent)" />
                <StatCard title="Design Pending" count={stats.designPending} icon={<Clock />} color="var(--warning)" />
                <StatCard title="Design In Process" count={stats.designInProcess} icon={<Activity />} color="var(--info)" />
                <StatCard title="Plate Process" count={stats.plateProcess} icon={<PauseCircle />} color="#a855f7" />
                <StatCard title="Completed" count={stats.completed} icon={<CheckCircle2 />} color="var(--success)" />
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>Recent Jobs</h2>
                    <Link to="/jobs" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View all jobs &rarr;</Link>
                </div>
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <div className="table-responsive-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Job ID</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Customer</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Date</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentJobs.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent jobs</td></tr>
                                ) : (
                                    stats.recentJobs.map(job => {
                                        const displayId = job.jobId.startsWith('ALM') ? job.jobId : `ALM${job.jobId.padStart(6, '0')}`;
                                        return (
                                            <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{displayId}</td>
                                                <td style={{ padding: '1rem 1.5rem' }}>{job.customer}</td>
                                                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{new Date(job.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: '500',
                                                        background: `${getStatusColor(job.status)}20`, color: getStatusColor(job.status)
                                                    }}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                    <Link to={`/jobs/view/${job.id}`} style={{ fontSize: '0.875rem', fontWeight: '500' }}>View Details</Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
