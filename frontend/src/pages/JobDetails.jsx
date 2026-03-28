import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Edit, Calendar, User, Layout, Eye, Hash, MapPin, Wind, CheckCircle, PenTool } from 'lucide-react';

export default function JobDetails() {
    const { id } = useParams();
    const { api, user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const { data } = await api.get(`/jobs/${id}`);
                setJob(data);
            } catch (error) {
                console.error("Failed to fetch job", error);
                alert("Failed to load job details");
                navigate('/jobs');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id, api, navigate]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;
    if (!job) return null;

    const displayId = job.jobId.startsWith('ALM') ? job.jobId : `ALM${job.jobId.padStart(6, '0')}`;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'var(--success)';
            case 'Design Pending': return 'var(--warning)';
            case 'Design Hold': return '#f43f5e';
            case 'Plate Process': return '#a855f7';
            default: return 'var(--info)';
        }
    };

    const DetailRow = ({ icon, label, value }) => (
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', marginRight: '1rem', display: 'flex' }}>
                {icon}
            </div>
            <div style={{ width: '150px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {label}
            </div>
            <div style={{ flex: 1, fontWeight: '500', color: 'var(--text-primary)' }}>
                {value}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.5rem', display: 'flex' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.875rem', margin: 0 }}>{job.jobName}</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Customer: {job.customer}</p>
                </div>
                <div>
                    <span style={{
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: '600',
                        background: `${getStatusColor(job.status)}20`, color: getStatusColor(job.status),
                        border: `1px solid ${getStatusColor(job.status)}50`
                    }}>
                        {job.status}
                    </span>
                </div>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Job Overview</h2>
                    <Link to={`/jobs/edit/${job.id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Edit size={16} /> Edit Job
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <DetailRow icon={<Hash size={20} />} label="Job ID" value={displayId} />
                    <DetailRow icon={<Calendar size={20} />} label="Date Created" value={new Date(job.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
                    <DetailRow icon={<Layout size={20} />} label="Size (W x H)" value={job.size || 'Not specified'} />
                    <DetailRow icon={<PenTool size={20} />} label="Die" value={job.die || 'None'} />

                    {/* Visual Specs */}
                    <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Production Specifications</h3>
                        <div className="grid-responsive">
                            <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colours</div>
                                <div style={{ fontWeight: '500', marginTop: '0.25rem' }}>{job.colours}</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material</div>
                                <div style={{ fontWeight: '500', marginTop: '0.25rem' }}>{job.material}</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Winding Direction</div>
                                <div style={{ fontWeight: '500', marginTop: '0.25rem' }}>{job.windingDirection}</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Finishing</div>
                                <div style={{ fontWeight: '500', marginTop: '0.25rem' }}>{job.finishing}</div>
                            </div>
                        </div>
                    </div>

                    <DetailRow icon={<User size={20} />} label="Assigned Designer" value={job.designer?.fullName || job.designer?.username || 'Unassigned'} />
                    <DetailRow icon={<User size={20} />} label="Client Relations" value={job.clientRelations?.fullName || job.clientRelations?.username || 'Unassigned'} />

                </div>
            </div>
        </div>
    );
}
