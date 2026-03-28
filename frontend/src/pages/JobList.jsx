import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JobList() {
    const { api, user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterDesigner, setFilterDesigner] = useState('');
    const [filterClientRelations, setFilterClientRelations] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortBy, setSortBy] = useState('dateDesc');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/jobs');
            setJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived options & filtered jobs
    const uniqueDesigners = [...new Set(jobs.map(job => job.designer?.fullName || job.designer?.username || 'Unassigned'))];
    const uniqueClientRelations = [...new Set(jobs.map(job => job.clientRelations?.fullName || job.clientRelations?.username || 'Unassigned'))];
    const uniqueStatuses = ['Design Pending', 'Designing', 'Design Hold', 'Approved', 'Plate Process', 'Completed'];

    const filteredJobs = jobs.filter(job => {
        const matchSearch = searchTerm === '' ||
            (job.jobId && String(job.jobId).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (job.customer && String(job.customer).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (job.jobName && String(job.jobName).toLowerCase().includes(searchTerm.toLowerCase()));

        let matchDate = true;
        if (filterDate !== '') {
            if (job.date) {
                const jobDate = new Date(job.date);
                const formattedJobDate = jobDate.getFullYear() + '-' + String(jobDate.getMonth() + 1).padStart(2, '0') + '-' + String(jobDate.getDate()).padStart(2, '0');
                matchDate = formattedJobDate === filterDate;
            } else {
                matchDate = false;
            }
        }

        const designerName = job.designer?.fullName || job.designer?.username || 'Unassigned';
        const matchDesigner = filterDesigner === '' || designerName === filterDesigner;

        const clientRelationsName = job.clientRelations?.fullName || job.clientRelations?.username || 'Unassigned';
        const matchClientRelations = filterClientRelations === '' || clientRelationsName === filterClientRelations;

        const matchStatus = filterStatus === '' || job.status === filterStatus;

        return matchSearch && matchDate && matchDesigner && matchClientRelations && matchStatus;
    });

    // Sort filtered jobs
    filteredJobs.sort((a, b) => {
        if (sortBy === 'dateDesc') {
            return new Date(b.date) - new Date(a.date);
        } else if (sortBy === 'dateAsc') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'jobIdAsc') {
            return String(a.jobId).localeCompare(String(b.jobId), undefined, { numeric: true });
        } else if (sortBy === 'jobIdDesc') {
            return String(b.jobId).localeCompare(String(a.jobId), undefined, { numeric: true });
        } else if (sortBy === 'customerAsc') {
            return String(a.customer).localeCompare(String(b.customer));
        } else if (sortBy === 'customerDesc') {
            return String(b.customer).localeCompare(String(a.customer));
        }
        return 0; // fallback if nothing matches
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'var(--success)';
            case 'Design Pending': return 'var(--warning)';
            case 'Plate Process': return '#a855f7';
            default: return 'var(--info)';
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem' }}>All Jobs</h1>
                <Link to="/jobs/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PlusCircle size={18} /> New Job
                </Link>
            </header>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by Job ID or Customer..."
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <input
                        type="date"
                        className="input-field"
                        title="Filter by Date"
                        style={{ width: 'auto' }}
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />

                    <select
                        className="input-field"
                        style={{ width: 'auto' }}
                        value={filterDesigner}
                        onChange={e => setFilterDesigner(e.target.value)}
                    >
                        <option value="">All Designers</option>
                        {uniqueDesigners.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        className="input-field"
                        style={{ width: 'auto' }}
                        value={filterClientRelations}
                        onChange={e => setFilterClientRelations(e.target.value)}
                    >
                        <option value="">All Client Relations</option>
                        {uniqueClientRelations.map(cr => <option key={cr} value={cr}>{cr}</option>)}
                    </select>

                    <select
                        className="input-field"
                        style={{ width: 'auto' }}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        className="input-field"
                        style={{ width: 'auto', fontWeight: 'bold' }}
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="dateDesc">Sort: Date (Newest)</option>
                        <option value="dateAsc">Sort: Date (Oldest)</option>
                        <option value="jobIdDesc">Sort: Job ID (Descending)</option>
                        <option value="jobIdAsc">Sort: Job ID (Ascending)</option>
                        <option value="customerAsc">Sort: Customer (A-Z)</option>
                        <option value="customerDesc">Sort: Customer (Z-A)</option>
                    </select>

                    {(searchTerm || filterDate || filterDesigner || filterClientRelations || filterStatus || sortBy !== 'dateDesc') && (
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterDate('');
                                setFilterDesigner('');
                                setFilterClientRelations('');
                                setFilterStatus('');
                                setSortBy('dateDesc');
                            }}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Job ID</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Customer</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Date</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Designer</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Client Relations</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading jobs...</td></tr>
                            ) : filteredJobs.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No jobs found.</td></tr>
                            ) : (
                                filteredJobs.map(job => {
                                    const displayId = job.jobId.startsWith('ALM') ? job.jobId : `ALM${job.jobId.padStart(6, '0')}`;
                                    return (
                                        <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{displayId}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{job.customer}</td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{new Date(job.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{job.designer?.fullName || job.designer?.username || 'Unassigned'}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{job.clientRelations?.fullName || job.clientRelations?.username || 'Unassigned'}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <select
                                                    value={job.status}
                                                    onChange={async (e) => {
                                                        try {
                                                            await api.patch(`/jobs/${job.id}/status`, { status: e.target.value });
                                                            fetchJobs();
                                                        } catch (err) { alert('Failed to update status'); }
                                                    }}
                                                    style={{
                                                        padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)',
                                                        fontSize: '0.875rem', fontWeight: '500',
                                                        background: `${getStatusColor(job.status)}20`,
                                                        color: getStatusColor(job.status),
                                                        border: `1px solid ${getStatusColor(job.status)}50`,
                                                        outline: 'none', cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="Design Pending" style={{ color: 'initial' }}>Design Pending</option>
                                                    <option value="Designing" style={{ color: 'initial' }}>Designing</option>
                                                    <option value="Design Hold" style={{ color: 'initial' }}>Design Hold</option>
                                                    <option value="Approved" style={{ color: 'initial' }}>Approved</option>
                                                    <option value="Plate Process" style={{ color: 'initial' }}>Plate Process</option>
                                                    <option value="Completed" style={{ color: 'initial' }}>Completed</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <Link
                                                    to={`/jobs/view/${job.id}`}
                                                    className="btn-primary"
                                                    style={{ display: 'inline-block', padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginRight: '0.5rem', textDecoration: 'none' }}
                                                >View</Link>
                                                <Link
                                                    to={`/jobs/edit/${job.id}`}
                                                    className="btn-secondary"
                                                    style={{ display: 'inline-block', padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginRight: '0.5rem', textDecoration: 'none' }}
                                                >Edit</Link>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to delete this job?')) {
                                                            try {
                                                                await api.delete(`/jobs/${job.id}`);
                                                                fetchJobs();
                                                            } catch (err) { alert('Failed to delete job'); }
                                                        }
                                                    }}
                                                >Delete</button>
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
    );
}
