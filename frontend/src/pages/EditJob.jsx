import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EditJob() {
    const { id } = useParams();
    const { api, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Dynamic dropdown states
    const [options, setOptions] = useState({ color: [], material: [], finishing: [], winding: [] });
    // User states for dropdowns
    const [designers, setDesigners] = useState([]);
    const [clientRelations, setClientRelations] = useState([]);

    const [formData, setFormData] = useState({
        jobId: '',
        date: '',
        customer: '',
        jobName: '',
        width: '',
        height: '',
        die: '',
        colours: '',
        material: '',
        windingDirection: '',
        finishing: '',
        designerId: '',
        clientRelationsId: ''
    });

    useEffect(() => {
        const fetchDependenciesAndJob = async () => {
            try {
                const [colors, materials, windings, finishes, users, jobRes] = await Promise.all([
                    api.get('/settings/color'),
                    api.get('/settings/material'),
                    api.get('/settings/winding'),
                    api.get('/settings/finishing'),
                    api.get('/users'),
                    api.get(`/jobs/${id}`)
                ]);

                setOptions({ color: colors.data, material: materials.data, winding: windings.data, finishing: finishes.data });

                let des = users.data.filter(u => u.role === 'Designer');
                let cr = users.data.filter(u => u.role === 'Client Relations');

                // If the current user is a Designer, they can only select themselves.
                if (user?.role === 'Designer') {
                    des = des.filter(u => u.id === user.id);
                }
                // If the current user is Client Relations, they can only select themselves.
                else if (user?.role === 'Client Relations') {
                    cr = cr.filter(u => u.id === user.id);
                }

                setDesigners(des);
                setClientRelations(cr);

                const data = jobRes.data;
                const formattedDate = new Date(data.date).toISOString().split('T')[0];

                // Parse previous size "100x200" or just default "" if somehow empty
                const [w, h] = data.size ? data.size.split('x') : ['', ''];

                // Remove ALM from jobId just in case it was stored with it previously
                const cleanJobId = data.jobId.replace(/\D/g, '').slice(-6).padStart(6, '0');

                setFormData({
                    ...data,
                    jobId: cleanJobId,
                    date: formattedDate,
                    width: w || '',
                    height: h || '',
                    designerId: data.designerId.toString(),
                    clientRelationsId: data.clientRelationsId.toString()
                });

            } catch (error) {
                console.error("Failed to fetch job", error);
                alert("Failed to load job details");
                navigate('/jobs');
            } finally {
                setLoading(false);
            }
        };
        fetchDependenciesAndJob();
    }, [id, api, navigate]);

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'jobId') {
            value = value.replace(/\D/g, '').slice(0, 6);
        } else if (typeof value === 'string' && ['customer', 'jobName', 'die'].includes(e.target.name)) {
            value = value.toUpperCase();
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.jobId.length !== 6) {
                alert('Job ID must be exactly 6 digits');
                return;
            }

            const payload = {
                ...formData,
                size: `${formData.width}x${formData.height}`
            };

            await api.put(`/jobs/${id}`, payload);
            navigate('/jobs');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to update job. Please try again.');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem' }}>Edit Job: ALM{formData.jobId}</h1>
            </header>

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
                <div className="grid-responsive grid-form" style={{ marginBottom: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Job ID (6 Digits)</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <span style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)' }}>ALM</span>
                            <input type="text" name="jobId" style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }} placeholder="123456" value={formData.jobId} onChange={handleChange} required />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Date</label>
                        <input type="date" name="date" className="input-field" value={formData.date} onChange={handleChange} required />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Customer</label>
                        <input type="text" name="customer" className="input-field" value={formData.customer} onChange={handleChange} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Job Name</label>
                        <input type="text" name="jobName" className="input-field" value={formData.jobName} onChange={handleChange} required />
                    </div>

                    <div className="col-span-2-responsive">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Size (in mm)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="number" name="width" className="input-field" placeholder="Width" value={formData.width} onChange={handleChange} required />
                            <span style={{ color: 'var(--text-muted)' }}>x</span>
                            <input type="number" name="height" className="input-field" placeholder="Height" value={formData.height} onChange={handleChange} required />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Die</label>
                            <select
                                name="die"
                                className="input-field"
                                value={['NEW', 'CORELINER'].includes(formData.die) || !formData.die ? formData.die : 'CUSTOM'}
                                onChange={(e) => {
                                    if (e.target.value !== 'CUSTOM') {
                                        setFormData(prev => {
                                            const nextData = { ...prev, die: e.target.value };
                                            if (e.target.value === 'CORELINER') {
                                                nextData.width = '0';
                                                nextData.height = '0';
                                                nextData.material = 'Woodfree';
                                                nextData.windingDirection = '1, SL-Clockwise';
                                                nextData.finishing = 'None';
                                            }
                                            return nextData;
                                        });
                                    } else {
                                        setFormData(prev => ({ ...prev, die: '' })); // clear for custom typing
                                    }
                                }}
                            >
                                <option value="">Select Option</option>
                                <option value="NEW">NEW</option>
                                <option value="CORELINER">CORELINER</option>
                                <option value="CUSTOM">CUSTOM...</option>
                            </select>
                        </div>
                        {(!['NEW', 'CORELINER', ''].includes(formData.die) || formData.die === '') && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Custom Die</label>
                                <input
                                    type="text"
                                    name="die"
                                    className="input-field"
                                    placeholder="Enter Custom Die..."
                                    value={['NEW', 'CORELINER'].includes(formData.die) ? '' : formData.die}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="col-span-2-responsive" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Colours</label>
                            <select
                                name="colours"
                                className="input-field"
                                value={options.color.some(c => c.name === formData.colours) || !formData.colours ? formData.colours : 'CUSTOM'}
                                onChange={(e) => {
                                    if (e.target.value !== 'CUSTOM') {
                                        setFormData(prev => ({ ...prev, colours: e.target.value }));
                                    } else {
                                        setFormData(prev => ({ ...prev, colours: '' }));
                                    }
                                }}
                            >
                                <option value="">Select Option</option>
                                {options.color.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                <option value="CUSTOM">CUSTOM...</option>
                            </select>
                        </div>
                        {(!options.color.some(c => c.name === formData.colours) || formData.colours === '') && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Custom Colour</label>
                                <input
                                    type="text"
                                    name="colours"
                                    className="input-field"
                                    placeholder="Enter Custom Colour..."
                                    value={options.color.some(c => c.name === formData.colours) ? '' : formData.colours}
                                    onChange={handleChange}
                                    required={!options.color.some(c => c.name === formData.colours)}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Material</label>
                        <select name="material" className="input-field" value={formData.material} onChange={handleChange} required>
                            <option value="">Select Option</option>
                            {options.material.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Winding Direction</label>
                        <select name="windingDirection" className="input-field" value={formData.windingDirection} onChange={handleChange} required>
                            <option value="">Select Option</option>
                            {options.winding.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Finishing</label>
                        <select name="finishing" className="input-field" value={formData.finishing} onChange={handleChange} required>
                            <option value="">Select Option</option>
                            {options.finishing.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Designer</label>
                        <select name="designerId" className="input-field" value={formData.designerId} onChange={handleChange} required>
                            {designers.map(d => <option key={d.id} value={d.id}>{d.fullName || d.username}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Client Relations</label>
                        <select name="clientRelationsId" className="input-field" value={formData.clientRelationsId} onChange={handleChange} required>
                            {clientRelations.map(c => <option key={c.id} value={c.id}>{c.fullName || c.username}</option>)}
                        </select>
                    </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" className="btn-secondary" onClick={() => navigate('/jobs')}>Cancel</button>
                    <button type="submit" className="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    );
}
