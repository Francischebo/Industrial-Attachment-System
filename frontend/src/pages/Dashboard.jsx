import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AdminAnalytics from '../components/AdminAnalytics';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function Dashboard({ children }) {
    const user = useAuthStore(state => state.user);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            api.get('accounts/profile/')
               .then(res => setProfile(res.data))
               .catch(err => console.error(err))
               .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleSelectOpportunity = async (type) => {
        try {
            const res = await api.patch('accounts/profile/', { opportunity_type: type });
            setProfile(res.data);
        } catch(err) {
            console.error(err);
            alert("Failed to save preference. Make sure you are logged in.");
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col transition-all duration-300">
                <Header />
                <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50 relative">
                    {loading && !children && (
                        <div className="absolute inset-0 flex justify-center items-center bg-gray-50/80 z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    )}
                    {children || (
                        user?.role === 'ADMIN' ? (
                            <AdminAnalytics />
                        ) : profile?.opportunity_type === 'NONE' || !profile?.opportunity_type ? (
                            <div className="max-w-5xl mx-auto animation-fade-in text-center mt-6">
                                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Select Your Career Path</h2>
                                <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">Please formally select the opportunity type you are applying for. This choice will permanently configure your profile's mandatory document requirements.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                    <button onClick={() => handleSelectOpportunity('ATTACHMENT')} className="bg-white border-2 border-gray-100 hover:border-primary-400 hover:shadow-2xl rounded-3xl p-10 transition-all duration-300 group shadow-sm block w-full outline-none focus:ring-4 focus:ring-primary-100">
                                        <h3 className="text-3xl font-black text-gray-800 mb-4 group-hover:text-primary-600 transition-colors">Industrial Attachment</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed mb-6">For continuing students requiring practical field experience as part of their prevailing academic coursework.</p>
                                        <div className="space-y-4 border-t border-gray-100 pt-6">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Mandatory Validations:</p>
                                            <ul className="text-sm text-gray-600 space-y-2 font-bold opacity-80">
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Institution Intro Letter</li>
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Student Insurance Cover</li>
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Good Conduct Certificate</li>
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Transcript & Student ID</li>
                                            </ul>
                                        </div>
                                    </button>
                                    
                                    <button onClick={() => handleSelectOpportunity('INTERNSHIP')} className="bg-white border-2 border-gray-100 hover:border-primary-400 hover:shadow-2xl rounded-3xl p-10 transition-all duration-300 group shadow-sm block w-full outline-none focus:ring-4 focus:ring-primary-100">
                                        <h3 className="text-3xl font-black text-gray-800 mb-4 group-hover:text-primary-600 transition-colors">Youth Internship</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed mb-6">For youth graduates seeking to acquire accelerated professional skills and direct exposure in the public service.</p>
                                        <div className="space-y-4 border-t border-gray-100 pt-6">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Mandatory Validations:</p>
                                            <ul className="text-sm text-gray-600 space-y-2 font-bold opacity-80">
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> KRA, SHA & NSSF Cards</li>
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Academic & Birth Certificates</li>
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Official Secrets Act Form</li>
                                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> PSIP Intern Biodata Form</li>
                                            </ul>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-7xl mx-auto animation-fade-in">
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Welcome, {user?.username || 'User'}!</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-primary hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-gray-500 text-sm font-bold tracking-wider uppercase">Applications</h3>
                                            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-black text-gray-800">12</p>
                                        <p className="text-sm text-green-500 mt-2 font-medium">↑ 2 submitted this week</p>
                                    </div>
                                    <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-primary hover:shadow-md transition-shadow">
                                         <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-gray-500 text-sm font-bold tracking-wider uppercase">Profile Setup</h3>
                                            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-primary-600">80% Complete</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                            <div className="bg-primary h-2.5 rounded-full" style={{width: '80%'}}></div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-primary hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-gray-500 text-sm font-bold tracking-wider uppercase">Latest Action</h3>
                                            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800 mt-1">Shortlisted</p>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">IT Intern - State Dept.</p>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </main>
            </div>
        </div>
    );
}
