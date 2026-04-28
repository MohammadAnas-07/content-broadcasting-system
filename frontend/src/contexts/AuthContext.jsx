import { createContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('cbs_token') || null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADED':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILED':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: validate existing token
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('cbs_token');
      if (!token) {
        dispatch({ type: 'AUTH_FAILED' });
        return;
      }
      try {
        const res = await authService.getMe();
        // Backend returns { success, data: { user } }, service unwraps Axios .data
        const user = res.data?.user || res.data;
        dispatch({
          type: 'AUTH_LOADED',
          payload: { user, token },
        });
      } catch {
        localStorage.removeItem('cbs_token');
        localStorage.removeItem('cbs_user');
        dispatch({ type: 'AUTH_FAILED' });
      }
    }
    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const { token, user } = res.data;
    localStorage.setItem('cbs_token', token);
    localStorage.setItem('cbs_user', JSON.stringify(user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    return user;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authService.register(formData);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cbs_token');
    localStorage.removeItem('cbs_user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
