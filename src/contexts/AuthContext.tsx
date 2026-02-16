import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { AuthResponse } from '../api/client';
import { AuthContext } from './useAuth';
import type { AuthState } from './useAuth';

const ADMIN_TOKEN_RESTORE_KEY = 'adminTokenRestore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    team: null,
    admin: null,
    managedTeams: [],
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    pinResetRequired: false,
    isDemoMode: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    if (token) {
      api.getMe()
        .then((data) => {
          setState({
            user: data.user,
            team: data.team,
            admin: null,
            managedTeams: data.managed_teams ?? [],
            isLoading: false,
            isAuthenticated: true,
            isAdmin: false,
            pinResetRequired: data.user.pin_reset_required || false,
            isDemoMode: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setState((s) => ({ ...s, isLoading: false }));
        });
    } else if (adminToken) {
      queueMicrotask(() => {
        setState({
          user: null,
          team: null,
          admin: { id: 0, email: '' },
          managedTeams: [],
          isLoading: false,
          isAuthenticated: false,
          isAdmin: true,
          pinResetRequired: false,
          isDemoMode: false,
        });
      });
    } else {
      queueMicrotask(() => setState((s) => ({ ...s, isLoading: false })));
    }
  }, []);

  const login = async (username: string, teamId: number, pinCode: string) => {
    const data = await api.login(username, teamId, pinCode);
    const meData = await api.getMe();
    setState({
      user: data.user,
      team: data.team,
      admin: null,
      managedTeams: meData.managed_teams ?? [],
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      pinResetRequired: data.pin_reset_required,
      isDemoMode: false,
    });
  };

  const register = async (inviteCode: string, teamName: string, username: string, email: string, password: string) => {
    const data = await api.register(inviteCode, teamName, username, email, password);
    const meData = await api.getMe();
    setState({
      user: data.user,
      team: data.team,
      admin: null,
      managedTeams: meData.managed_teams ?? [],
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      pinResetRequired: false,
      isDemoMode: false,
    });
    return { team_id: data.team?.id, username: data.user?.username };
  };

  const adminLogin = async (email: string, password: string) => {
    const data = await api.adminLogin(email, password);
    setState({
      user: null,
      team: null,
      admin: data.admin,
      managedTeams: [],
      isLoading: false,
      isAuthenticated: false,
      isAdmin: true,
      pinResetRequired: false,
      isDemoMode: false,
    });
  };

  const setDemoSession = (data: AuthResponse) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      sessionStorage.setItem(ADMIN_TOKEN_RESTORE_KEY, adminToken);
      localStorage.removeItem('adminToken');
    }
    localStorage.setItem('token', data.token);
    setState({
      user: data.user,
      team: data.team,
      admin: null,
      managedTeams: [],
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      pinResetRequired: data.pin_reset_required ?? false,
      isDemoMode: true,
    });
  };

  const exitDemo = () => {
    localStorage.removeItem('token');
    const adminToken = sessionStorage.getItem(ADMIN_TOKEN_RESTORE_KEY);
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
      sessionStorage.removeItem(ADMIN_TOKEN_RESTORE_KEY);
    }
    setState({
      user: null,
      team: null,
      admin: { id: 0, email: '' },
      managedTeams: [],
      isLoading: false,
      isAuthenticated: false,
      isAdmin: true,
      pinResetRequired: false,
      isDemoMode: false,
    });
  };

  const logout = () => {
    api.logout();
    setState({
      user: null,
      team: null,
      admin: null,
      managedTeams: [],
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      pinResetRequired: false,
      isDemoMode: false,
    });
  };

  const resetPin = async (newPin: string) => {
    await api.resetPin(newPin);
    setState((s) => ({ ...s, pinResetRequired: false }));
  };

  const refreshMe = async () => {
    if (!localStorage.getItem('token')) return;
    const data = await api.getMe();
    setState((s) => ({
      ...s,
      user: data.user,
      team: data.team,
      managedTeams: data.managed_teams ?? s.managedTeams,
      pinResetRequired: data.user.pin_reset_required ?? false,
    }));
  };

  const switchTeam = async (teamId: number) => {
    const data = await api.switchTeam(teamId);
    setState((s) => ({
      ...s,
      user: data.user,
      team: data.team,
      managedTeams: data.managed_teams ?? s.managedTeams,
      pinResetRequired: data.pin_reset_required ?? false,
    }));
  };

  const createTeam = async (inviteCode: string, teamName: string) => {
    const data = await api.createNewTeam(inviteCode, teamName);
    setState({
      user: data.user,
      team: data.team,
      admin: null,
      managedTeams: data.managed_teams ?? [],
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      pinResetRequired: false,
      isDemoMode: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, adminLogin, setDemoSession, exitDemo, logout, resetPin, refreshMe, switchTeam, createTeam }}>
      {children}
    </AuthContext.Provider>
  );
}
