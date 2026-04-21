import { create } from 'zustand';

// Helper to safely parse user from localStorage
const getPersistedUser = () => {
    try {
        const item = localStorage.getItem('user');
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

const useAuthStore = create((set) => ({
    user: getPersistedUser(),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    setAuth: (user, token) => {
        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    }
}));

export default useAuthStore;
