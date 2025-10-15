// 🔥 UPDATED: Enhanced AuthContext with socket support and user persistence
import { createContext, useState, useEffect, useContext } from "react";
import { connectSocket, disconnectSocket } from "../utils/socket";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Fetch current user if token exists but user doesn't
            if (!user) {
                fetchCurrentUser();
            } else {
                setLoading(false);
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            // Connect socket when user logs in
            connectSocket(user.id, user.role);
        } else {
            localStorage.removeItem('user');
            // Disconnect socket when user logs out
            disconnectSocket();
        }
    }, [user]);

    const fetchCurrentUser = async () => {
        try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (data) => {
        setUser(data.user);
        setToken(data.token);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{user, token, login, logout, updateUser, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

// 🔥 Custom hook to use auth context
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export { AuthContext, AuthProvider, useAuth };