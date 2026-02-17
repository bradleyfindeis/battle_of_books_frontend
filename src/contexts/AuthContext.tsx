import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { AuthResponse } from '../api/client';
import { AuthContext } from './useAuth';
import type { AuthState } from './useAuth';

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
    const checkSession = async () => {
      try {
        const session = await api.getSession();
        const hasUser = !!session.user;
        const hasAdmin = !!session.admin;

        if (hasUser && hasAdmin) {
          // Both sessions exist: demo mode (admin demoing as a user)
          setState({
            user: session.user!,
            team: session.team!,
            admin: session.admin!,
            managedTeams: session.managed_teams ?? [],
            isLoading: false,
            isAuthenticated: true,
            isAdmin: false,
            pinResetRequired: session.pin_reset_required || false,
            isDemoMode: true,
          });
        } else if (hasUser) {
          setState({
            user: session.user!,
            team: session.team!,
            admin: null,
            managedTeams: session.managed_teams ?? [],
            isLoading: false,
            isAuthenticated: true,
            isAdmin: false,
            pinResetRequired: session.pin_reset_required || false,
            isDemoMode: false,
          });
        } else if (hasAdmin) {
          setState({
            user: null,
            team: null,
            admin: session.admin!,
            managedTeams: [],
            isLoading: false,
            isAuthenticated: false,
            isAdmin: true,
            pinResetRequired: false,
            isDemoMode: false,
          });
        } else {
          // No active session
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        // Session check failed entirely
        setState((s) => ({ ...s, isLoading: false }));
      }
    };
    checkSession();
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
    setState({
      user: data.user,
      team: data.team,
      admin: state.admin,
      managedTeams: [],
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      pinResetRequired: data.pin_reset_required ?? false,
      isDemoMode: true,
    });
  };

  const exitDemo = async () => {
    // Update state immediately so navigation works before the API call resolves
    setState({
      user: null,
      team: null,
      admin: state.admin ?? { id: 0, email: '' },
      managedTeams: [],
      isLoading: false,
      isAuthenticated: false,
      isAdmin: true,
      pinResetRequired: false,
      isDemoMode: false,
    });
    try {
      await api.clearUserSession();
    } catch {
      // Best effort; cookies are cleared server-side
    }
  };

  const logout = async () => {
    await api.logout();
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
    try {
      const data = await api.getMe();
      setState((s) => ({
        ...s,
        user: data.user,
        team: data.team,
        managedTeams: data.managed_teams ?? s.managedTeams,
        pinResetRequired: data.user.pin_reset_required ?? false,
      }));
    } catch {
      // Session may have expired
    }
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
