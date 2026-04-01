import React from 'react';

export default function Applications() {
    return (
        <div className="animation-fade-in max-w-7xl mx-auto">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Applications</h2>
                <p className="text-gray-500 font-medium mt-1">Track the status of your submitted job applications</p>
            </div>
            
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4 text-primary-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No active applications found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">You have not submitted any job applications yet. Visit the Vacancies page to explore open roles.</p>
                <a href="/vacancies" className="bg-primary-50 text-primary-700 hover:bg-primary hover:text-white font-bold py-3 px-8 rounded-xl transition-colors">
                    Browse Vacancies
                </a>
            </div>
        </div>
    );
}
