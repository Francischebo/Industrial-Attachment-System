import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Profile() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [profile, setProfile] = useState({});
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);
    const [documents, setDocuments] = useState([]);

    const fetchData = async () => {
        try {
            const [profRes, eduRes, expRes, docRes] = await Promise.all([
                api.get('accounts/profile/').catch(() => ({ data: {} })),
                api.get('accounts/education/').catch(() => ({ data: [] })),
                api.get('accounts/experience/').catch(() => ({ data: [] })),
                api.get('accounts/documents/').catch(() => ({ data: [] }))
            ]);
            setProfile(profRes.data);
            setEducation(Array.isArray(eduRes.data) ? eduRes.data : eduRes.data.results || []);
            setExperience(Array.isArray(expRes.data) ? expRes.data : expRes.data.results || []);
            setDocuments(Array.isArray(docRes.data) ? docRes.data : docRes.data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // General Info Handlers
    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('accounts/profile/', profile);
            alert('General Information saved successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to save profile');
        }
        setSaving(false);
    };

    // Generic Add/Delete handlers for Education/Experience
    const addItem = async (endpoint, payload, stateUpdater, stateArray) => {
        try {
            const res = await api.post(`accounts/${endpoint}/`, payload);
            stateUpdater([...stateArray, res.data]);
        } catch (error) {
            console.error(error);
            alert(`Failed to add ${endpoint}`);
        }
    };
    
    const deleteItem = async (endpoint, id, stateUpdater, stateArray) => {
        try {
            await api.delete(`accounts/${endpoint}/${id}/`);
            stateUpdater(stateArray.filter(item => item.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    // Document Handlers
    const handleFileUpload = async (document_type, file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are allowed.');
            return;
        }
        const formData = new FormData();
        formData.append('document_type', document_type);
        formData.append('file', file);
        
        try {
            // If already exists, we might need to delete old or handle uniqueness
            const existing = documents.find(d => d.document_type === document_type);
            if (existing) {
                await api.delete(`accounts/documents/${existing.id}/`);
            }
            const res = await api.post('accounts/documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocuments(prev => [...prev.filter(d => d.document_type !== document_type), res.data]);
            alert(`${document_type.replace('_', ' ')} uploaded successfully`);
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
    );

    const tabs = [
        { id: 'general', label: 'General Information' },
        { id: 'education', label: 'Education' },
        { id: 'experience', label: 'Work Experience' },
        { id: 'files', label: 'Files & Documents' }
    ];

    let requiredDocuments = [];
    if (profile.opportunity_type === 'INTERNSHIP') {
        requiredDocuments = ['NATIONAL_ID', 'KRA_PIN', 'SHA_CARD', 'NSSF_CARD', 'BIRTH_CERT', 'ACADEMIC_CERT', 'SECRETS_ACT_FORM', 'PSIP_FORM', 'PASSPORT_PHOTOS', 'ATM_CARD'];
    } else if (profile.opportunity_type === 'ATTACHMENT') {
        requiredDocuments = ['COVER_LETTER', 'INSTITUTION_INTRO', 'RESUME', 'TRANSCRIPT', 'GOOD_CONDUCT', 'STUDENT_INSURANCE', 'STUDENT_ID', 'NATIONAL_ID', 'NEXT_OF_KIN_ID'];
    }

    return (
        <div className="max-w-6xl mx-auto animation-fade-in relative">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Applicant Profile</h2>
                <p className="text-gray-500 font-medium mt-1">Complete all required sections to enable job applications.</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col space-y-2 relative z-10">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 p-8 md:p-12">
                    
                    {/* General Section */}
                    {activeTab === 'general' && (
                        <form onSubmit={saveProfile} className="animation-fade-in">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">General Information (Required)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                                    <input type="text" name="middle_name" value={profile.middle_name || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                    <input type="date" name="dob" value={profile.dob || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                    <select name="gender" value={profile.gender || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required>
                                        <option value="">Select Gender</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label>
                                    <select name="marital_status" value={profile.marital_status || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required>
                                        <option value="">Select Status</option>
                                        <option value="SINGLE">Single</option>
                                        <option value="MARRIED">Married</option>
                                        <option value="DIVORCED">Divorced</option>
                                        <option value="WIDOWED">Widowed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">National ID Number</label>
                                    <input type="text" name="id_number" value={profile.id_number || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                    <input type="text" name="phone_number" value={profile.phone_number || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Address</label>
                                    <input type="text" name="postal_address" value={profile.postal_address || ''} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                                    <input type="text" name="nationality" value={profile.nationality || 'Kenyan'} onChange={handleProfileChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" required />
                                </div>
                            </div>
                            <button type="submit" disabled={saving} className="bg-primary hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save General Info'}
                            </button>
                        </form>
                    )}

                    {/* Education Section */}
                    {activeTab === 'education' && (
                        <div className="animation-fade-in">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Education Qualifications (Required)</h3>
                            
                            <form className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8" onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                addItem('education', Object.fromEntries(fd), setEducation, education);
                                e.target.reset();
                            }}>
                                <h4 className="font-bold mb-4">Add New Education</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input type="text" name="institution" placeholder="Institution Name" className="p-3 border rounded-xl" required />
                                    <input type="text" name="qualification" placeholder="Qualification (e.g. BSc, Diploma)" className="p-3 border rounded-xl" required />
                                    <input type="text" name="field_of_study" placeholder="Field of Study" className="p-3 border rounded-xl" required />
                                    <input type="text" name="grade_award" placeholder="Grade/Award (e.g. First Class)" className="p-3 border rounded-xl" required />
                                    <input type="date" name="start_date" className="p-3 border rounded-xl" required />
                                    <div className="flex items-center space-x-2">
                                         <input type="date" name="end_date" className="p-3 border rounded-xl flex-1" />
                                         <label className="text-sm"><input type="checkbox" name="is_current" className="mr-1"/> Current</label>
                                    </div>
                                </div>
                                <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold">Add Education</button>
                            </form>

                            <div className="space-y-4">
                                {education.map(edu => (
                                    <div key={edu.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:shadow-sm">
                                        <div>
                                            <h5 className="font-bold text-gray-800">{edu.institution}</h5>
                                            <p className="text-sm text-gray-500">{edu.qualification} - {edu.grade_award}</p>
                                        </div>
                                        <button onClick={() => deleteItem('education', edu.id, setEducation, education)} className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                                    </div>
                                ))}
                                {education.length === 0 && <p className="text-gray-400">No education added yet.</p>}
                            </div>
                        </div>
                    )}

                    {/* Experience Section */}
                    {activeTab === 'experience' && (
                        <div className="animation-fade-in">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Work Experience / Volunteer (Optional)</h3>
                            
                            <form className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8" onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                addItem('experience', Object.fromEntries(fd), setExperience, experience);
                                e.target.reset();
                            }}>
                                <h4 className="font-bold mb-4">Add New Experience</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input type="text" name="organization" placeholder="Employer / Organization" className="p-3 border rounded-xl" required />
                                    <input type="text" name="job_title" placeholder="Job Title / Role" className="p-3 border rounded-xl" required />
                                    <input type="text" name="employer_contact" placeholder="Employer Contact (Phone/Email)" className="p-3 border rounded-xl" />
                                    <input type="date" name="start_date" className="p-3 border rounded-xl" required />
                                    <div className="flex items-center space-x-2">
                                         <input type="date" name="end_date" className="p-3 border rounded-xl flex-1" />
                                         <label className="text-sm"><input type="checkbox" name="is_current" className="mr-1"/> Current</label>
                                    </div>
                                    <textarea name="responsibilities" placeholder="Key Responsibilities" className="p-3 border rounded-xl md:col-span-2" rows="3"></textarea>
                                </div>
                                <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded-xl font-bold">Add Experience</button>
                            </form>

                            <div className="space-y-4">
                                {experience.map(exp => (
                                    <div key={exp.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:shadow-sm">
                                        <div>
                                            <h5 className="font-bold text-gray-800">{exp.job_title} at {exp.organization}</h5>
                                            <p className="text-sm text-gray-500">{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}</p>
                                        </div>
                                        <button onClick={() => deleteItem('experience', exp.id, setExperience, experience)} className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files Section */}
                    {activeTab === 'files' && (
                        <div className="animation-fade-in">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Files & Documents (Required)</h3>
                            <p className="text-sm text-gray-500 mb-6">Upload each of the following required documents. <strong className="text-red-500">Only PDF files are accepted.</strong></p>
                            
                            <div className="space-y-6">
                                {requiredDocuments.map(docType => {
                                    const uploaded = documents.find(d => d.document_type === docType);
                                    return (
                                        <div key={docType} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-gray-200 rounded-xl bg-gray-50">
                                            <div className="mb-4 md:mb-0">
                                                <h5 className="font-bold text-gray-800">{docType.replace(/_/g, ' ')}</h5>
                                                {uploaded ? (
                                                    <span className="text-green-600 text-sm font-bold flex items-center mt-1">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                        Uploaded
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 text-sm font-bold mt-1 block">Missing Required File</span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {uploaded && (
                                                    <button onClick={() => deleteItem('documents', uploaded.id, setDocuments, documents)} className="text-red-500 hover:bg-white px-3 py-1 rounded text-sm font-bold border border-red-200">Remove</button>
                                                )}
                                                <label className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors text-sm">
                                                    {uploaded ? 'Replace PDF' : 'Upload PDF'}
                                                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(docType, e.target.files[0])} />
                                                </label>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
