import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, Edit2, Check, X } from 'lucide-react';

export default function Settings() {
    const { api, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ username: '', fullName: '', password: '', role: 'Designer' });

    // Ensure non-admins default to 'profile' tab instead of 'users'
    const [activeTab, setActiveTab] = useState(user?.role === 'Admin' ? 'users' : 'profile');

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // Config states
    const [options, setOptions] = useState({ color: [], material: [], finishing: [], winding: [] });
    const [newOptionNames, setNewOptionNames] = useState({ color: '', material: '', finishing: '', winding: '' });

    useEffect(() => {
        fetchUsers();
        fetchAllOptions();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchAllOptions = async () => {
        try {
            const [c, m, f, w] = await Promise.all([
                api.get('/settings/color'),
                api.get('/settings/material'),
                api.get('/settings/finishing'),
                api.get('/settings/winding')
            ]);
            setOptions({ color: c.data, material: m.data, finishing: f.data, winding: w.data });
        } catch (error) { console.error(error); }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            setFormData({ username: '', fullName: '', password: '', role: 'Designer' });
            fetchUsers();
        } catch (error) { alert(error.response?.data?.error || 'Failed to create user'); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) { alert(error.response?.data?.error || 'Failed to delete user'); }
    };

    const handleAddOption = async (e, type) => {
        e.preventDefault();
        try {
            await api.post(`/settings/${type}`, { name: newOptionNames[type] });
            setNewOptionNames(prev => ({ ...prev, [type]: '' }));
            fetchAllOptions();
        } catch (error) { alert(error.response?.data?.error || 'Failed to add option'); }
    };

    const handleDeleteOption = async (type, id) => {
        if (!window.confirm("Delete this option?")) return;
        try {
            await api.delete(`/settings/${type}/${id}`);
            fetchAllOptions();
        } catch (error) { alert('Failed to delete option'); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return alert("New passwords do not match.");
        }

        try {
            const res = await api.patch('/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            alert(res.data.message || "Password updated successfully!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update password.");
        }
    };

    const [editingOption, setEditingOption] = useState({ type: null, id: null, name: '' });

    const handleEditOption = async (type, id) => {
        try {
            await api.put(`/settings/${type}/${id}`, { name: editingOption.name });
            setEditingOption({ type: null, id: null, name: '' });
            fetchAllOptions();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update option');
        }
    };

    const renderOptionManager = (type, title, data) => (
        <div className="glass-panel" key={type} style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{title}</h3>

            <form onSubmit={(e) => handleAddOption(e, type)} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                    type="text" className="input-field" placeholder={`New ${title}...`}
                    value={newOptionNames[type] || ''}
                    onChange={e => setNewOptionNames(prev => ({ ...prev, [type]: e.target.value }))}
                    required
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1rem' }}><PlusCircle size={18} /></button>
            </form>

            <ul style={{ listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                {data.map(opt => {
                    const isEditing = editingOption.type === type && editingOption.id === opt.id;
                    return (
                        <li key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, marginRight: '1rem' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                                        value={editingOption.name}
                                        onChange={(e) => setEditingOption(prev => ({ ...prev, name: e.target.value }))}
                                        autoFocus
                                    />
                                    <button onClick={() => handleEditOption(type, opt.id)} style={{ color: 'var(--success)' }}><Check size={16} /></button>
                                    <button onClick={() => setEditingOption({ type: null, id: null, name: '' })} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span>{opt.name}</span>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => setEditingOption({ type, id: opt.id, name: opt.name })} style={{ color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteOption(type, opt.id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>System Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: '1.6', marginTop: '0.8rem' }}>Admin options for users and general configuration.</p>
            </header>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('profile')}
                    style={{ padding: '0.5rem 1rem', color: activeTab === 'profile' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontWeight: activeTab === 'profile' ? '600' : '500', borderBottom: activeTab === 'profile' ? '2px solid var(--primary-accent)' : 'none' }}>
                    My Profile
                </button>
                {user?.role === 'Admin' && (
                    <>
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{ padding: '0.5rem 1rem', color: activeTab === 'users' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontWeight: activeTab === 'users' ? '600' : '500', borderBottom: activeTab === 'users' ? '2px solid var(--primary-accent)' : 'none' }}>
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            style={{ padding: '0.5rem 1rem', color: activeTab === 'config' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontWeight: activeTab === 'config' ? '600' : '500', borderBottom: activeTab === 'config' ? '2px solid var(--primary-accent)' : 'none' }}>
                            Form Configurations
                        </button>
                    </>
                )}
            </div>

            {activeTab === 'profile' && (
                <div style={{ maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Change Password</h2>
                    <form onSubmit={handleChangePassword} className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Password</label>
                            <input type="password" name="currentPassword" className="input-field" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
                            <input type="password" name="newPassword" className="input-field" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
                            <input type="password" name="confirmPassword" className="input-field" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                            Update Password
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'users' && user?.role === 'Admin' && (
                <div className="grid-users">
                    {/* User Form Col */}
                    <div>
                        {user?.role === 'Admin' ? (
                            <>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create New User</h2>
                                <form onSubmit={handleCreateUser} className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Login Username</label>
                                        <input type="text" name="username" className="input-field" placeholder="e.g. jdoe" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                        <input type="text" name="fullName" className="input-field" placeholder="e.g. John Doe" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                                        <input type="password" name="password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role</label>
                                        <select name="role" className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required>
                                            <option value="Admin">Admin</option>
                                            <option value="Designer">Designer</option>
                                            <option value="Client Relations">Client Relations</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                                        <PlusCircle size={18} /> Add User
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>You do not have permission to create users.</p>
                            </div>
                        )}
                    </div>

                    {/* Users List Col */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>System Users</h2>
                        <div className="glass-panel" style={{ overflow: 'hidden' }}>
                            <div className="table-responsive-wrapper">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                                            <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Login</th>
                                            <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Full Name</th>
                                            <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Role</th>
                                            <th style={{ padding: '1rem 1.5rem', fontWeight: '500', textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                                        ) : (
                                            users.map(u => (
                                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }}>
                                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{u.username}</td>
                                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{u.fullName || u.username}</td>
                                                    <td style={{ padding: '1rem 1.5rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem',
                                                            background: u.role === 'Admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                                            color: u.role === 'Admin' ? 'var(--warning)' : 'var(--primary-accent)',
                                                            border: `1px solid ${u.role === 'Admin' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(99, 102, 241, 0.5)'}`
                                                        }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        {user?.role === 'Admin' && (
                                                            <button
                                                                onClick={async () => {
                                                                    const newPass = window.prompt(`Enter new password for ${u.username}:`);
                                                                    if (!newPass) return;
                                                                    if (newPass.length < 6) return alert('Password must be at least 6 characters.');
                                                                    try {
                                                                        await api.patch(`/users/${u.id}/reset-password`, { newPassword: newPass });
                                                                        alert('Password reset successfully.');
                                                                    } catch (err) {
                                                                        alert(err.response?.data?.error || 'Failed to reset password');
                                                                    }
                                                                }}
                                                                style={{ color: 'var(--warning)', background: 'transparent', cursor: 'pointer', border: 'none', padding: '0.25rem' }}
                                                                title="Reset Password"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                                                            </button>
                                                        )}
                                                        {user?.role === 'Admin' && u.id !== user.id && (
                                                            <button onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--error)', background: 'transparent', cursor: 'pointer', border: 'none', padding: '0.25rem' }} title="Delete user">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'config' && user?.role === 'Admin' && (
                <div className="grid-responsive">
                    {renderOptionManager('color', 'Colors', options.color)}
                    {renderOptionManager('material', 'Materials', options.material)}
                    {renderOptionManager('winding', 'Winding Types', options.winding)}
                    {renderOptionManager('finishing', 'Finishing Types', options.finishing)}
                </div>
            )}
        </div>
    );
}
