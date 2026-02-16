import { createContext, useContext } from 'react';
import type { User, Team, Admin, ManagedTeam } from '../api/client';

export interface AuthState {
  user: User | null;
  team: Team | null;
  admin: Admin | null;
  managedTeams: ManagedTeam[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  pinResetRequired: boolean;
  isDemoMode: boolean;
}

export interface AuthContextType extends AuthState {
  login: (username: string, teamId: number, pinCode: string) => Promise<void>;
  register: (inviteCode: string, teamName: string, username: string, email: string, password: string) => Promise<{ team_id?: number; username?: string }>;
  adminLogin: (email: string, password: string) => Promise<void>;
  setDemoSession: (data: import('../api/client').AuthResponse) => void;
  exitDemo: () => void;
  logout: () => void;
  resetPin: (newPin: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  switchTeam: (teamId: number) => Promise<void>;
  createTeam: (inviteCode: string, teamName: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
