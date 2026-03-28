import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  token: null,
  user: null,
  loading: true,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        error: null,
        loading: false,
      };
    
    case 'LOGIN_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        user: null,
        error: null,
      };
    
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.payload,
        loading: false,
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children, apiBaseURL }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Create API instance with auth header
  const api = axios.create({
    baseURL: apiBaseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add token to all requests if available
  api.interceptors.request.use((config) => {
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
    return config;
  });

  // Restore token on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        if (savedToken) {
          dispatch({ type: 'RESTORE_TOKEN', payload: savedToken });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Failed to restore token:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    bootstrapAsync();
  }, []);

  // Login action
  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Save token
      await AsyncStorage.setItem('authToken', token);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current user
  const getCurrentUser = async () => {
    if (!state.token) return null;
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  };

  const value = {
    state,
    api, // Expose API client with auth headers
    login,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
