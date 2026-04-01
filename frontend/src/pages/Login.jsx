import { useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const setAuth = useAuthStore(state => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('accounts/login/', credentials);
            const userData = data.user || { username: credentials.username };
            setAuth(userData, data.access);
            
            if (userData.role === 'ADMIN') {
                navigate('/manage-jobs');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-primary-100">
            <div className="w-full max-w-md mx-4">
                <form onSubmit={handleSubmit} className="glass p-10 rounded-2xl">
                    <div className="text-center mb-10">
                        <div className="mx-auto w-full flex items-center justify-center mb-6">
                            <img src="/logo.png" alt="Ministry Logo" className="h-[75px] object-contain drop-shadow-sm" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="text-sm text-gray-600 mt-2 font-medium">State Department for Petroleum Career Portal</p>
                    </div>
                    <div className="space-y-5">
                        <div className="relative">
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Username</label>
                            <input
                                type="text" placeholder="Enter your username"
                                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 focus:outline-none transition-all placeholder-gray-400"
                                value={credentials.username}
                                onChange={e => setCredentials({...credentials, username: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Password</label>
                            <input
                                type="password" placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 focus:outline-none transition-all placeholder-gray-400"
                                value={credentials.password}
                                onChange={e => setCredentials({...credentials, password: e.target.value})}
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(227,188,117,0.39)] hover:shadow-[0_6px_20px_rgba(227,188,117,0.23)] hover:-translate-y-0.5 transition-all duration-200 mt-2">
                            Sign In to Portal
                        </button>
                    </div>
                    <div className="mt-8 text-center border-t border-gray-200 pt-6">
                        <p className="text-gray-600 text-sm">
                            Don't have an account?{' '}
                            <a href="/register" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                                Create one here
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
