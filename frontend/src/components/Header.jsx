import useAuthStore from '../store/authStore';

export default function Header() {
    const user = useAuthStore(state => state.user);
    
    return (
        <header className="bg-white shadow-sm h-20 flex items-center justify-between px-8 z-10 sticky top-0">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
                <span className="bg-primary-50 text-primary-600 p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </span>
                State Department for Petroleum
            </h1>
            <div className="flex items-center space-x-6">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">{user?.username || 'Guest User'}</p>
                    <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">{user?.role || 'Applicant'}</p>
                </div>
                <button className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-100 text-primary-700 font-extrabold text-lg border-2 border-primary-200 hover:ring-4 hover:ring-primary-50 transition-all shadow-inner">
                    {user?.username?.charAt(0).toUpperCase() || 'G'}
                </button>
            </div>
        </header>
    );
}
