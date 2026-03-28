import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Download, Eye } from 'lucide-react';

export default function SvgAutomation() {
    const { api } = useAuth();

    const [rawSvg, setRawSvg] = useState('');
    const [previewSvg, setPreviewSvg] = useState('');
    const svgRef = useRef(null);
    const [searchParams] = useSearchParams();

    const [variables, setVariables] = useState({
        'JOB ID': '',
        'DATE': new Date().toISOString().split('T')[0],
        'LAST UPDATE': new Date().toISOString().split('T')[0],
        'CUSTOMER': '',
        'JOB NAME': '',
        'DESIGNER': 'SELECT',
        'CLIENT RELATIONS': 'SELECT',
        'MATERIAL': 'SELECT',
        'SIZE': '',
        'COLOURS': 'SELECT',
        'WINDING DIRECTION': 'SELECT',
        'FINISHING': 'SELECT',
        'DIE': 'SELECT'
    });

    const [customInputs, setCustomInputs] = useState({
        COLOURS: '',
        DIE: '',
        SIZE_W: '',
        SIZE_H: ''
    });

    const [users, setUsers] = useState([]);
    const [options, setOptions] = useState({ color: [], material: [], finishing: [], winding: [] });

    // Fetch initial settings and the master SVG file
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch settings
                const [u, c, m, f, w] = await Promise.all([
                    api.get('/users'),
                    api.get('/settings/color'),
                    api.get('/settings/material'),
                    api.get('/settings/finishing'),
                    api.get('/settings/winding')
                ]);
                setUsers(u.data || []);
                setOptions({
                    color: c.data || [],
                    material: m.data || [],
                    finishing: f.data || [],
                    winding: w.data || []
                });

                // Fetch built-in Master SVG
                const svgResponse = await fetch('/master_template.svg');
                if (svgResponse.ok) {
                    const text = await svgResponse.text();
                    setRawSvg(text);
                }
            } catch (error) { console.error("Error fetching dependencies", error); }
        };
        fetchData();
    }, [api]);

    // Update variables based on custom SIZE inputs
    useEffect(() => {
        if (customInputs.SIZE_W && customInputs.SIZE_H) {
            setVariables(prev => ({ ...prev, 'SIZE': `W${customInputs.SIZE_W}xH${customInputs.SIZE_H}mm` }));
        } else {
            setVariables(prev => ({ ...prev, 'SIZE': '' }));
        }
    }, [customInputs.SIZE_W, customInputs.SIZE_H]);

    // Live Preview Engine: Parse rawSvg and render to a robust state string
    useEffect(() => {
        if (!rawSvg) return;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawSvg, "image/svg+xml");

            doc.querySelectorAll("text").forEach(textNode => {
                const currentContent = textNode.textContent.trim();
                const prefix = currentContent.split(":")[0]?.trim(); // e.g. "JOB ID"

                // Format dates
                const formatDate = (dateStr) => {
                    if (!dateStr) return '';
                    const [y, m, d] = dateStr.split('-');
                    return `${d}-${m}-${y}`;
                };

                let newText = null;

                if (prefix === "JOB ID") newText = `JOB ID : ${(variables['JOB ID'] || '').toUpperCase()}`;
                else if (prefix === "CUSTOMER") newText = `CUSTOMER : ${(variables['CUSTOMER'] || '').toUpperCase()}`;
                else if (prefix === "JOB NAME") newText = `JOB NAME : ${(variables['JOB NAME'] || '').toUpperCase()}`;
                else if (prefix === "DESIGNER" && variables['DESIGNER'] !== 'SELECT') newText = `DESIGNER : ${(variables['DESIGNER'] || '').toUpperCase()}`;
                else if (prefix === "CLIENT RELATIONS" && variables['CLIENT RELATIONS'] !== 'SELECT') newText = `CLIENT RELATIONS : ${(variables['CLIENT RELATIONS'] || '').toUpperCase()}`;
                else if (prefix === "FINISHING" && variables['FINISHING'] !== 'SELECT') newText = `FINISHING : ${(variables['FINISHING'] || '').toUpperCase()}`;
                else if (prefix === "MATERIAL" && variables['MATERIAL'] !== 'SELECT') newText = `MATERIAL : ${(variables['MATERIAL'] || '').toUpperCase()}`;
                else if (prefix === "COLOURS" && variables['COLOURS'] !== 'SELECT') newText = `COLOURS : ${(variables['COLOURS'] || '').toUpperCase()}`;
                else if (prefix === "WINDING DIRECTION" && variables['WINDING DIRECTION'] !== 'SELECT') newText = `WINDING DIRECTION : ${(variables['WINDING DIRECTION'] || '').toUpperCase()}`;
                else if (prefix === "DIE" && variables['DIE'] !== 'SELECT') newText = `DIE : ${(variables['DIE'] || '').toUpperCase()}`;
                else if (prefix === "SIZE") {
                    if (variables['DIE'] === 'CORELINER') newText = `SIZE : `;
                    else if (variables['SIZE']) newText = `SIZE : ${(variables['SIZE'] || '').toUpperCase()}`;
                }
                else if (prefix === "DATE") newText = `DATE : ${formatDate(variables['DATE'])}`;
                else if (prefix === "LAST UPDATE") newText = `LAST UPDATE : ${formatDate(variables['LAST UPDATE'])}`;

                if (newText !== null) {
                    const tspan = textNode.querySelector('tspan');
                    if (tspan) {
                        tspan.textContent = newText;
                    } else {
                        textNode.textContent = newText;
                    }
                }
            });

            const serializer = new XMLSerializer();
            const updatedSvgString = serializer.serializeToString(doc.documentElement);
            setPreviewSvg(updatedSvgString);

        } catch (e) {
            console.error("Error creating live preview SVG mapping", e);
        }
    }, [variables, rawSvg]);

    const handleVarChange = (e) => {
        const { name, value } = e.target;
        let newValue = (name === 'DATE' || name === 'LAST UPDATE') ? value : value.toUpperCase();

        if (name === 'JOB ID') {
            const num = value.replace(/[^0-9]/g, "");
            // Only pad if they blur or just let them type it normally, actually let's just prefix ALM and let them type the numbers
            newValue = num ? "ALM" + num : "";
        }

        setVariables(prev => {
            const nextVars = { ...prev, [name]: newValue };
            if (name === 'DIE' && newValue === 'CORELINER') {
                nextVars['MATERIAL'] = 'WOODFREE';
                nextVars['WINDING DIRECTION'] = '1, SL-CLOCKWISE';
                nextVars['FINISHING'] = 'NONE';
            }
            return nextVars;
        });

        // Clear custom inputs if a dropdown was selected
        if (name === 'COLOURS' && value !== 'SELECT') setCustomInputs(prev => ({ ...prev, COLOURS: '' }));
        if (name === 'DIE' && value !== 'SELECT') {
            if (newValue === 'CORELINER') {
                setCustomInputs(prev => ({ ...prev, DIE: '', SIZE_W: '0', SIZE_H: '0' }));
            } else {
                setCustomInputs(prev => ({ ...prev, DIE: '' }));
            }
        }
    };

    const handleCustomChange = (e) => {
        const { name, value } = e.target;
        setCustomInputs(prev => ({ ...prev, [name]: value.toUpperCase() }));

        if (name === 'COLOURS' || name === 'DIE') {
            setVariables(prev => ({ ...prev, [name]: value.toUpperCase() }));
        }
    };

    const setDateToday = (field) => {
        setVariables(prev => ({ ...prev, [field]: new Date().toISOString().split('T')[0] }));
    };

    const generateFileName = () => {
        const die = variables['DIE'];
        const designer = variables['DESIGNER'];

        let suf = "";
        const designerUser = users.find(u => u.fullName === designer || u.username === designer);
        const designerNameToCheck = designerUser?.fullName?.toUpperCase() || designer.toUpperCase();

        if (designerNameToCheck.startsWith('MUJEEB RAHMAN')) suf = " _ M";
        else if (designerNameToCheck.startsWith('MUHAMMED RAZI')) suf = " _ R";
        else if (designerNameToCheck.startsWith('NIVEDITHA') || designerNameToCheck.startsWith('NIVEDIHTA')) suf = " _ N";
        else if (designerNameToCheck.startsWith('NAVEEN KRISHNA')) suf = " _ NK";
        else if (designerUser && designerUser.fullName) {
            const parts = designerUser.fullName.split(' ');
            suf = " _ " + parts.map(p => p[0]).join('').toUpperCase();
        } else if (designer !== 'SELECT') {
            suf = " _ " + designer.substring(0, 2).toUpperCase();
        }

        let parts = [
            variables['JOB ID'],
            variables['CUSTOMER'],
            variables['JOB NAME']
        ];

        if (die !== 'CORELINER' && variables['SIZE']) {
            parts.push("JS " + variables['SIZE'].replace(/\s+/g, ""));
        }

        return (parts.filter(Boolean).join(" _ ") + suf).toUpperCase();
    };

    const [customFilename, setCustomFilename] = useState('');

    // Generate filename dynamically whenever dependents change, unless custom is set
    useEffect(() => {
        const generated = generateFileName();
        setCustomFilename(generated);
    }, [variables, customInputs, users]);

    const handleDownload = () => {
        if (!variables['JOB ID']) return alert('Please enter JOB ID');
        if (!previewSvg) return;

        // Set Last Update to today right before downloading
        const today = new Date().toISOString().split('T')[0];
        setVariables(prev => ({ ...prev, 'LAST UPDATE': today }));

        // Apply LAST UPDATE just to the downloaded file right away since state takes a cycle to reflect
        const parser = new DOMParser();
        const doc = parser.parseFromString(previewSvg, "image/svg+xml");

        doc.querySelectorAll("text").forEach(textNode => {
            const currentContent = textNode.textContent.trim();
            const prefix = currentContent.split(":")[0]?.trim();
            if (prefix === "LAST UPDATE") {
                const [y, m, d] = today.split('-');
                const newText = `LAST UPDATE : ${d}-${m}-${y}`;
                const tspan = textNode.querySelector('tspan');
                if (tspan) tspan.textContent = newText;
                else textNode.textContent = newText;
            }
        });

        const serializer = new XMLSerializer();
        const xml = serializer.serializeToString(doc.documentElement);
        // Using "application/octet-stream" instead of "image/svg+xml" to prevent browsers 
        // from blocking the SVG download over non-HTTPS connections (like local network IP)
        const blob = new Blob(['<?xml version="1.0"?>\n' + xml], { type: "application/octet-stream" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = 'none';
        a.href = url;
        a.download = `${customFilename || generateFileName()}.svg`;
        document.body.appendChild(a);
        a.click();

        // Small delay to ensure the browser has time to start the download
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    // Pad Job ID with 0s up to 6 digits on blur, then auto-fill data if job exists
    const handleJobIdBlur = async (optionalJobId = null) => {
        // If an event object is passed, extract value, else use string, else use state
        let passedId = null;
        if (optionalJobId && typeof optionalJobId === 'object' && optionalJobId.target) {
            passedId = optionalJobId.target.value;
        } else if (typeof optionalJobId === 'string') {
            passedId = optionalJobId;
        }

        const idToProcess = passedId || variables['JOB ID'];
        if (!idToProcess) return;

        const num = idToProcess.replace(/^ALM/i, "");
        if (!num) return;

        // Display format: ALM + 6 digits
        const paddedId = "ALM" + num.padStart(6, '0');
        setVariables(prev => ({
            ...prev,
            'JOB ID': paddedId
        }));

        try {
            // Database format: just the 6 digits
            const dbJobId = num.padStart(6, '0');
            const res = await api.get(`/jobs/jobId/${dbJobId}`);
            if (res.data) {
                const job = res.data;
                const parseDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

                // Construct size values loosely matching 'WxH' or 'W100xH200mm' or '100x200'
                let size_w = '';
                let size_h = '';
                if (job.size && job.size.includes('x')) {
                    const parts = job.size.split('x');
                    size_w = parts[0].replace(/[^0-9.]/g, ''); // Extract just numbers (e.g. from 'W100' or '100')
                    size_h = parts[1].replace(/[^0-9.]/g, ''); // Extract just numbers (e.g. from 'H200mm' or '200')
                }

                setCustomInputs({
                    COLOURS: '',
                    DIE: '',
                    SIZE_W: size_w,
                    SIZE_H: size_h
                });

                setVariables(prev => ({
                    ...prev,
                    'CUSTOMER': job.customer || '',
                    'JOB NAME': job.jobName || '',
                    'DESIGNER': job.designer?.fullName || job.designer?.username || 'SELECT',
                    'CLIENT RELATIONS': job.clientRelations?.fullName || job.clientRelations?.username || 'SELECT',
                    'FINISHING': job.finishing?.toUpperCase() || 'SELECT',
                    'MATERIAL': job.material?.toUpperCase() || 'SELECT',
                    'COLOURS': job.colours?.toUpperCase() || 'SELECT',
                    'WINDING DIRECTION': job.windingDirection?.toUpperCase() || 'SELECT',
                    'DIE': job.die?.toUpperCase() || 'SELECT',
                    'DATE': parseDate(job.date) || prev['DATE'],
                    'LAST UPDATE': parseDate(job.lastUpdate) || prev['LAST UPDATE'],
                    // SIZE is auto-calculated by the useEffect watching customInputs
                }));
            }
        } catch (error) {
            // Ignore 404s (job might not exist yet), but log others
            if (error.response?.status !== 404) {
                console.error("Error fetching job details:", error);
            }
        }
    };

    // Auto-load if opened with a jobId in URL (e.g. after creating a new job)
    useEffect(() => {
        const urlJobId = searchParams.get('jobId');
        if (urlJobId) {
            handleJobIdBlur(urlJobId);
        }
    }, [searchParams]);

    // Handle auto-download when redirected from Create Job
    const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
    useEffect(() => {
        const shouldAutoDownload = searchParams.get('autoDownload') === 'true';
        const urlJobId = searchParams.get('jobId');

        // Check if we are supposed to download, we haven't yet, the preview SVG exists, 
        // and some JOB ID has been successfully populated into state (indicating data load finished)
        if (shouldAutoDownload && !hasAutoDownloaded && previewSvg && variables['JOB ID']) {
            // Check if the loaded JOB ID loosely matches the URL ID to ensure we don't download empty templates
            const numPartUrl = urlJobId.replace(/[^0-9]/g, '');
            const numPartState = variables['JOB ID'].replace(/[^0-9]/g, '');

            if (numPartUrl && numPartState && parseInt(numPartUrl, 10) === parseInt(numPartState, 10)) {
                // Delay to ensure the DOM and SVG XML serializer have the absolute latest state
                setTimeout(() => {
                    handleDownload();
                    setHasAutoDownloaded(true);
                }, 800);
            }
        }
    }, [searchParams, previewSvg, variables, hasAutoDownloaded]);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Master File Live Automation</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Instantly fill variables into the Accurate Master File template and download the active SVG.</p>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Left Col: Live Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', order: 2 }}>
                    <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'var(--primary-accent)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                                    <Eye color="white" size={20} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Live Preview</h2>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }}>
                                <div style={{ flex: 1, maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SVG File Name</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={customFilename}
                                            onChange={(e) => setCustomFilename(e.target.value.toUpperCase())}
                                            placeholder="Generated File Name..."
                                            style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                        />
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={() => {
                                                if (navigator.clipboard) {
                                                    navigator.clipboard.writeText(customFilename).then(() => {
                                                        alert("Copied to clipboard!");
                                                    }).catch(err => {
                                                        console.error("Async: Could not copy text: ", err);
                                                    });
                                                } else {
                                                    // Fallback for non-HTTPS (e.g. HTTP over local network IP)
                                                    const textArea = document.createElement("textarea");
                                                    textArea.value = customFilename;
                                                    document.body.appendChild(textArea);
                                                    textArea.focus();
                                                    textArea.select();
                                                    try {
                                                        document.execCommand('copy');
                                                        alert("Copied to clipboard!");
                                                    } catch (err) {
                                                        console.error('Fallback: Oops, unable to copy', err);
                                                    }
                                                    document.body.removeChild(textArea);
                                                }
                                            }}
                                            title="Copy File Name"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <button onClick={handleDownload} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end', height: '42px', padding: '0 1rem' }}>
                                    <Download size={18} />
                                    Download SVG
                                </button>
                            </div>
                        </div>

                        <div
                            ref={svgRef}
                            style={{
                                border: '2px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                background: 'white', // SVG needs white bg usually
                                overflow: 'auto',
                                maxHeight: '800px',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                            dangerouslySetInnerHTML={{ __html: previewSvg || '<p style="color: black; padding: 2rem;">Loading Master Template...</p>' }}
                        />
                    </div>
                </div>

                {/* Right Col: Mapping Fields */}
                <div className="glass-panel" style={{ padding: '2rem', order: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'var(--info)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                            <CheckCircle color="white" size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Map Variables</h2>
                    </div>

                    <div className="grid-responsive">
                        <div className="col-span-2-responsive">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>JOB ID (Number Only)</label>
                            <input
                                type="text"
                                name="JOB ID"
                                className="input-field"
                                placeholder="ALM000000"
                                value={variables['JOB ID'].replace(/^ALM/i, "")}
                                onChange={handleVarChange}
                                onBlur={handleJobIdBlur}
                            />
                            {variables['JOB ID'] && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Formatted: {variables['JOB ID']}</span>}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CUSTOMER</label>
                            <input type="text" name="CUSTOMER" className="input-field" value={variables['CUSTOMER']} onChange={handleVarChange} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>JOB NAME</label>
                            <input type="text" name="JOB NAME" className="input-field" value={variables['JOB NAME']} onChange={handleVarChange} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DESIGNER</label>
                            <select name="DESIGNER" className="input-field" value={variables['DESIGNER']} onChange={handleVarChange}>
                                <option value="SELECT">SELECT</option>
                                {users.filter(u => u.role === 'Designer' || u.role === 'Admin').map(u => (
                                    <option key={u.id} value={u.fullName}>{u.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CLIENT RELATIONS</label>
                            <select name="CLIENT RELATIONS" className="input-field" value={variables['CLIENT RELATIONS']} onChange={handleVarChange}>
                                <option value="SELECT">SELECT</option>
                                {users.filter(u => u.role === 'Client Relations' || u.role === 'Admin').map(u => (
                                    <option key={u.id} value={u.fullName}>{u.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>FINISHING</label>
                            <select name="FINISHING" className="input-field" value={variables['FINISHING']} onChange={handleVarChange}>
                                <option value="SELECT">SELECT</option>
                                {options.finishing.map(o => <option key={o.id} value={o.name.toUpperCase()}>{o.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>MATERIAL</label>
                            <select name="MATERIAL" className="input-field" value={variables['MATERIAL']} onChange={handleVarChange}>
                                <option value="SELECT">SELECT</option>
                                {options.material.map(o => <option key={o.id} value={o.name.toUpperCase()}>{o.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="col-span-2-responsive" style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>COLOURS</label>
                                <select name="COLOURS" className="input-field" value={customInputs.COLOURS ? 'SELECT' : variables['COLOURS']} onChange={handleVarChange}>
                                    <option value="SELECT">SELECT</option>
                                    {options.color.map(o => <option key={o.id} value={o.name.toUpperCase()}>{o.name.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>OR CUSTOM COLOUR</label>
                                <input type="text" name="COLOURS" className="input-field" placeholder="Custom..." value={customInputs.COLOURS} onChange={handleCustomChange} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>WINDING DIRECTION</label>
                            <select name="WINDING DIRECTION" className="input-field" value={variables['WINDING DIRECTION']} onChange={handleVarChange}>
                                <option value="SELECT">SELECT</option>
                                {options.winding.map(o => <option key={o.id} value={o.name.toUpperCase()}>{o.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DIE</label>
                                <select name="DIE" className="input-field" value={customInputs.DIE ? 'SELECT' : variables['DIE']} onChange={handleVarChange}>
                                    <option value="SELECT">SELECT</option>
                                    <option value="NEW">NEW</option>
                                    <option value="CORELINER">CORELINER</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CUSTOM</label>
                                <input type="text" name="DIE" className="input-field" placeholder="Die..." value={customInputs.DIE} onChange={handleCustomChange} />
                            </div>
                        </div>

                        <div className="col-span-2-responsive" style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SIZE (W)</label>
                                <input type="number" name="SIZE_W" className="input-field" placeholder="Width" value={customInputs.SIZE_W} onChange={handleCustomChange} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SIZE (H)</label>
                                <input type="number" name="SIZE_H" className="input-field" placeholder="Height" value={customInputs.SIZE_H} onChange={handleCustomChange} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <span style={{ marginLeft: '0.5rem', alignSelf: 'center', color: 'var(--text-muted)' }}>{variables['SIZE']}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DATE</label>
                                <input type="date" name="DATE" className="input-field" value={variables['DATE']} onChange={handleVarChange} />
                            </div>
                            <button className="btn-secondary" style={{ alignSelf: 'flex-end', padding: '0.5rem 0.75rem' }} onClick={() => setDateToday('DATE')}>TODAY</button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>LAST UPDATE</label>
                                <input type="date" name="LAST UPDATE" className="input-field" value={variables['LAST UPDATE']} onChange={handleVarChange} />
                            </div>
                            <button className="btn-secondary" style={{ alignSelf: 'flex-end', padding: '0.5rem 0.75rem' }} onClick={() => setDateToday('LAST UPDATE')}>TODAY</button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
