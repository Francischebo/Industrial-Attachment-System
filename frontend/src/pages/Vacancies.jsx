import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function Vacancies() {
    const navigate = useNavigate();
    const [vacancies, setVacancies] = useState([]);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const userRole = useAuthStore(state => state.user?.role || 'APPLICANT');
    const [successMessage, setSuccessMessage] = useState('');

    // Admin Job Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        job_type: 'JOB_OPENING',
        location: '',
        deadline: ''
    });

    useEffect(() => {
        fetchJobs();
           
        if (userRole === 'APPLICANT') {
            checkProfileCompleteness();
        } else {
            setCheckingProfile(false);
        }
    }, [userRole]);

    const fetchJobs = () => {
        api.get('careers/jobs/')
           .then(res => setVacancies(res.data.results || res.data))
           .catch(err => console.error("Error fetching jobs:", err));
    };

    const checkProfileCompleteness = async () => {
        try {
            const [profRes, eduRes, docRes] = await Promise.all([
                api.get('accounts/profile/').catch(() => ({ data: {} })),
                api.get('accounts/education/').catch(() => ({ data: [] })),
                api.get('accounts/documents/').catch(() => ({ data: [] }))
            ]);
            
            const p = profRes.data;
            const hasGeneral = Boolean(p.middle_name && p.dob && p.gender && p.marital_status && p.id_number && p.phone_number && p.postal_address && p.nationality);
            
            const edu = Array.isArray(eduRes.data) ? eduRes.data : eduRes.data.results || [];
            const hasEdu = edu.length > 0;
            
            const docs = Array.isArray(docRes.data) ? docRes.data : docRes.data.results || [];
            const reqDocs = ['COVER_LETTER', 'INSTITUTION_INTRO', 'RESUME', 'TRANSCRIPT', 'GOOD_CONDUCT', 'STUDENT_INSURANCE', 'STUDENT_ID', 'NATIONAL_ID', 'NEXT_OF_KIN_ID'];
            const hasDocs = reqDocs.every(rt => docs.some(d => d.document_type === rt));
            
            setIsProfileComplete(hasGeneral && hasEdu && hasDocs);
        } catch (error) {
            console.error("Error checking profile completion", error);
        } finally {
            setCheckingProfile(false);
        }
    };

    const applyForJob = async (jobId) => {
        try {
            await api.post('careers/applications/', { job: jobId, cover_letter: 'Standard application' });
            setSuccessMessage('Your application has been safely submitted and is now under automated review.');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert('Failed to apply. You might have already applied or your profile does not meet the minimum ATS requirements.');
        }
    };

    // Admin Functions
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setEditMode(false);
        setCurrentJobId(null);
        setFormData({
            title: '',
            description: '',
            requirements: '',
            job_type: 'JOB_OPENING',
            location: '',
            deadline: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (job) => {
        setEditMode(true);
        setCurrentJobId(job.id);
        setFormData({
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            job_type: job.job_type,
            location: job.location,
            deadline: new Date(job.deadline).toISOString().slice(0, 16)
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this vacancy? This action cannot be undone.")) return;
        try {
            await api.delete(`careers/jobs/${jobId}/`);
            setVacancies(prev => prev.filter(j => j.id !== jobId));
        } catch (error) {
            console.error("Failed to delete job", error);
            alert("Failed to delete job.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            if (editMode && currentJobId) {
                const res = await api.put(`careers/jobs/${currentJobId}/`, formData);
                setVacancies(prev => prev.map(j => j.id === currentJobId ? res.data : j));
            } else {
                const res = await api.post('careers/jobs/', formData);
                setVacancies(prev => [res.data, ...prev]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving job", error);
            alert("Failed to save the job posting. Ensure all fields are valid.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animation-fade-in max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8">
            {/* Success Alert popup */}
            {successMessage && (
                <div className="fixed top-20 right-4 md:right-8 z-50 animation-fade-in bg-green-50 border-l-4 border-green-500 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-sm flex items-start border border-y-green-200 border-r-green-200">
                    <svg className="w-6 h-6 text-green-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                        <h4 className="text-green-800 font-bold mb-1">Application Submitted!</h4>
                        <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="ml-4 text-green-500 hover:text-green-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Available Vacancies</h2>
                    <p className="text-gray-500 font-medium mt-1">Explore and apply for open positions</p>
                </div>
                {userRole === 'ADMIN' && (
                    <button 
                        onClick={openCreateModal}
                        className="bg-primary hover:bg-primary-600 shadow-[0_4px_14px_0_rgba(227,188,117,0.39)] hover:shadow-[0_6px_20px_rgba(227,188,117,0.23)] hover:-translate-y-0.5 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200"
                    >
                        + Post Vacancy
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
                {vacancies.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
                        <div className="bg-gray-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <p className="text-xl text-gray-500 font-bold">No vacancies open at the moment.</p>
                        <p className="text-gray-400 mt-2 font-medium">Please check back later.</p>
                    </div>
                 ) : null}
                 
                {vacancies.map(job => (
                    <div key={job.id} className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -z-10 opacity-50 group-hover:bg-primary-100 transition-colors"></div>
                        <div>
                            <div className="flex justify-between items-start mb-4 gap-3">
                                <h3 className="font-extrabold text-xl text-gray-900 group-hover:text-primary-700 transition-colors leading-tight break-words">{job.title}</h3>
                                <span className="text-[10px] sm:text-xs bg-primary-50 text-primary-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-primary-100 whitespace-nowrap shrink-0">
                                    {job.job_type.replace('_', ' ')}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600 mb-5 font-semibold bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <span className="truncate max-w-[120px]" title={job.location}>{job.location}</span>
                                </span>
                                <span className="text-gray-300 hidden sm:inline">|</span> 
                                <span className="flex items-center text-red-500 bg-red-50 px-2 py-0.5 rounded ml-auto sm:ml-0">
                                    <svg className="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Due: {new Date(job.deadline).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{job.description}</p>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100/80">
                            {userRole === 'APPLICANT' && (
                                <button 
                                    onClick={() => {
                                        if (!isProfileComplete) {
                                            alert("Your profile is incomplete. Please fill out all required fields (General, Education, and 5 PDFs) in the Profile page before applying.");
                                            navigate('/profile');
                                            return;
                                        }
                                        applyForJob(job.id);
                                    }} 
                                    disabled={checkingProfile}
                                    className={`w-full font-bold py-3.5 rounded-xl transition-all duration-300 shadow-sm ${
                                        checkingProfile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                        !isProfileComplete ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200' :
                                        'bg-primary-50 hover:bg-primary text-primary-700 hover:text-white border border-primary-200 hover:border-transparent hover:shadow-[0_4px_14px_0_rgba(227,188,117,0.39)] hover:-translate-y-0.5'
                                    }`}>
                                    {checkingProfile ? 'Evaluating Profile...' : (!isProfileComplete ? 'Complete Profile to Apply' : 'Submit Application')}
                                </button>
                            )}
                            
                            {userRole === 'ADMIN' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => openEditModal(job)}
                                        className="col-span-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-400 hover:text-white border border-yellow-200 font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(job.id)}
                                        className="col-span-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        Delete
                                    </button>
                                    <button 
                                        onClick={() => navigate('/manage-jobs')}
                                        className="col-span-2 bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 font-bold py-2.5 rounded-lg transition-all shadow-sm text-sm"
                                    >
                                        View Applications
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Admin Create/Edit Modal */}
            {isModalOpen && userRole === 'ADMIN' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animation-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto relative border-t-8 border-t-primary-500 flex flex-col max-h-[90vh]">
                        
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 shrink-0">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center">
                                {editMode ? (
                                    <><svg className="w-6 h-6 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> Edit Job Posting</>
                                ) : (
                                    <><svg className="w-6 h-6 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> Create New Vacancy</>
                                )}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full p-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="jobForm" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                                        <input 
                                            type="text" 
                                            name="title" 
                                            required 
                                            value={formData.title} 
                                            onChange={handleInputChange}
                                            placeholder="e.g. Senior Software Engineer"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium transition-colors"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                                        <select 
                                            name="job_type" 
                                            value={formData.job_type} 
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium cursor-pointer"
                                        >
                                            <option value="JOB_OPENING">Job Opening</option>
                                            <option value="ATTACHMENT">Attachment</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Application Deadline</label>
                                        <input 
                                            type="datetime-local" 
                                            name="deadline" 
                                            required 
                                            value={formData.deadline} 
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                        <input 
                                            type="text" 
                                            name="location" 
                                            required 
                                            value={formData.location} 
                                            onChange={handleInputChange}
                                            placeholder="e.g. Nairobi CBD, Kenya (or Remote)"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Job Description</label>
                                        <textarea 
                                            name="description" 
                                            required 
                                            rows="4"
                                            value={formData.description} 
                                            onChange={handleInputChange}
                                            placeholder="Describe the role, impact, and daily responsibilities..."
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium resize-y"
                                        ></textarea>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Requirements (ATS Keywords)</label>
                                        <div className="text-xs text-primary-600 mb-2 font-medium bg-primary-50 p-2 rounded inline-flex items-center">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Our ATS will cross-reference these precise words against applicant profiles.
                                        </div>
                                        <textarea 
                                            name="requirements" 
                                            required 
                                            rows="4"
                                            value={formData.requirements} 
                                            onChange={handleInputChange}
                                            placeholder="e.g. Bachelor Degree Computer Science Python React Postgres Django..."
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium resize-y"
                                        ></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="jobForm"
                                disabled={isSubmitting}
                                className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-sm flex items-center ${
                                    isSubmitting ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary sm:hover:-translate-y-0.5 hover:shadow-md'
                                }`}
                            >
                                {isSubmitting ? (
                                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</>
                                ) : (
                                    <>{editMode ? 'Save Changes' : 'Publish Vacancy'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

