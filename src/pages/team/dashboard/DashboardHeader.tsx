import { useEffect, useRef } from 'react';
import type { User, Team } from '../../../api/client';

const AVATAR_OPTIONS = [
  '\u{1F98A}', '\u{1F43C}', '\u{1F981}', '\u{1F42F}', '\u{1F43B}', '\u{1F428}', '\u{1F438}', '\u{1F435}',
  '\u{1F984}', '\u{1F432}', '\u{1F985}', '\u{1F42C}', '\u{1F98B}', '\u{1F419}', '\u{1F989}', '\u{1F43A}',
  '\u{1F431}', '\u{1F436}', '\u{1F430}', '\u{1F42E}', '\u{1F437}', '\u{1F414}', '\u{1F427}', '\u{1F422}',
  '\u{1F988}', '\u{1F99C}', '\u{1F9A9}', '\u{1F41D}', '\u{1F31F}', '\u26A1', '\u{1F525}', '\u{1F308}',
];

const COLOR_OPTIONS = [
  { hex: '#fecaca', label: 'Red' },
  { hex: '#fed7aa', label: 'Orange' },
  { hex: '#fde68a', label: 'Amber' },
  { hex: '#fef08a', label: 'Yellow' },
  { hex: '#d9f99d', label: 'Lime' },
  { hex: '#a7f3d0', label: 'Emerald' },
  { hex: '#99f6e4', label: 'Teal' },
  { hex: '#a5f3fc', label: 'Cyan' },
  { hex: '#bae6fd', label: 'Sky' },
  { hex: '#bfdbfe', label: 'Blue' },
  { hex: '#c7d2fe', label: 'Indigo' },
  { hex: '#ddd6fe', label: 'Violet' },
  { hex: '#e9d5ff', label: 'Purple' },
  { hex: '#f5d0fe', label: 'Fuchsia' },
  { hex: '#fbcfe8', label: 'Pink' },
  { hex: '#fecdd3', label: 'Rose' },
];

interface DashboardHeaderProps {
  user: User;
  team: Team;
  streak: number;
  activeToday: boolean;
  showAvatarPicker: boolean;
  setShowAvatarPicker: (fn: (v: boolean) => boolean) => void;
  avatarSaving: boolean;
  handleSelectAvatar: (emoji: string | null) => void;
  handleSelectAvatarColor: (color: string | null) => void;
  handleLogout: () => void;
  handleExitDemo?: () => void;
  isDemoMode: boolean;
}

export function DashboardHeader({
  user,
  team,
  streak,
  activeToday,
  showAvatarPicker,
  setShowAvatarPicker,
  avatarSaving,
  handleSelectAvatar,
  handleSelectAvatarColor,
  handleLogout,
  handleExitDemo,
  isDemoMode,
}: DashboardHeaderProps) {
  const avatarBg = user.avatar_color || undefined;
  const avatarContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAvatarPicker) return;

    function handleClickOutside(e: MouseEvent) {
      if (avatarContainerRef.current && !avatarContainerRef.current.contains(e.target as Node)) {
        setShowAvatarPicker(() => false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAvatarPicker, setShowAvatarPicker]);

  return (
    <>
      <nav className="bg-white border-b shadow-sm border-stone-200">
        <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
          <div className="flex gap-2 items-center">
            {isDemoMode && handleExitDemo && (
              <button
                type="button"
                onClick={handleExitDemo}
                className="px-3 py-2 text-sm font-medium rounded-lg border transition duration-200 outline-none text-primary-700 border-primary-300 bg-primary-50 hover:bg-primary-100 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Exit demo
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium bg-white rounded-lg border transition duration-200 outline-none text-stone-700 border-stone-300 hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="px-4 pt-8 mx-auto max-w-7xl">
        <div className="flex gap-4 justify-between items-start mb-6">
          <div className="flex gap-3 items-center">
            <div className="relative" ref={avatarContainerRef}>
              <button
                type="button"
                onClick={() => setShowAvatarPicker((v) => !v)}
                className="flex justify-center items-center w-11 h-11 text-2xl rounded-full border-2 transition border-stone-200 hover:border-primary-300 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                style={avatarBg ? { backgroundColor: avatarBg } : undefined}
                title="Change avatar"
                aria-label="Change avatar"
              >
                {user.avatar_emoji || '\u{1F60A}'}
              </button>
              {showAvatarPicker && (
                <div className="absolute left-0 top-full z-50 p-3 mt-2 w-72 bg-white rounded-xl border shadow-lg origin-top-left border-stone-200 animate-scale-in">
                  <p className="mb-2 text-xs font-medium text-stone-500">Choose your avatar</p>
                  <div className="grid grid-cols-8 gap-1">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        disabled={avatarSaving}
                        onClick={() => handleSelectAvatar(emoji)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition hover:bg-primary-100 ${
                          user.avatar_emoji === emoji ? 'bg-primary-200 ring-2 ring-primary-400' : ''
                        } disabled:opacity-50`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 mb-2 text-xs font-medium text-stone-500">Background color</p>
                  <div className="grid grid-cols-8 gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={avatarSaving}
                        onClick={() => handleSelectAvatarColor(c.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 disabled:opacity-50 ${
                          user.avatar_color === c.hex ? 'border-stone-900 ring-2 ring-primary-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                        aria-label={`${c.label} background`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2 items-center mt-3">
                    {user.avatar_color && (
                      <button
                        type="button"
                        disabled={avatarSaving}
                        onClick={() => handleSelectAvatarColor(null)}
                        className="text-xs transition text-stone-500 hover:text-stone-700 disabled:opacity-50"
                      >
                        Remove color
                      </button>
                    )}
                    {user.avatar_emoji && (
                      <button
                        type="button"
                        disabled={avatarSaving}
                        onClick={() => handleSelectAvatar(null)}
                        className="text-xs transition text-stone-500 hover:text-stone-700 disabled:opacity-50"
                      >
                        Remove avatar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Team: {team.name}</h2>
              <p className="text-sm text-stone-500">
                Signed in as {user.username}
                {user.role === 'team_lead' && (
                  <span className="ml-2 text-stone-400">&middot; Team ID: {team.id} (use with your password to sign in)</span>
                )}
              </p>
            </div>
          </div>
          {streak > 0 && (
            <div
              className="flex gap-2 items-center px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 shrink-0 animate-scale-in"
              title={activeToday ? 'You\'ve been active today!' : 'Complete an activity today to keep your streak going!'}
            >
              <span className="text-xl" aria-hidden>{'\u{1F525}'}</span>
              <div className="text-right">
                <p className="text-sm font-bold leading-tight text-amber-800">{streak}-day streak</p>
                <p className="text-xs text-amber-600">
                  {activeToday ? 'Active today' : 'Do an activity to keep it!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
