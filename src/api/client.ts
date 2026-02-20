import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.PROD
  ? 'https://battle-of-books-api.onrender.com'
  : '/api';
// Types based on our API
export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: 'teammate' | 'team_lead';
  team_id: number;
  pin_reset_required?: boolean;
  avatar_emoji?: string | null;
  avatar_color?: string | null;
}

export interface Team {
  id: number;
  name: string;
  created_at?: string;
  teammate_count: number;
  invite_code?: string | null;
  invite_code_id?: number;
  book_list_id?: number | null;
  book_list?: { id: number; name: string } | null;
  leaderboard_enabled?: boolean;
  team_lead?: User | null;
  teammates?: User[];
  books?: Book[];
}

export interface Book {
  id: number;
  title: string;
  author?: string | null;
  team_id: number;
  assignments?: BookAssignment[];
}

export interface BookAssignment {
  id: number;
  user_id: number;
  book_id: number;
  status: 'assigned' | 'in_progress' | 'completed';
  progress_notes?: string | null;
  progress_percent?: number | null;
  book?: Book;
  user?: { id: number; username: string };
}

export interface BookListItem {
  id: number;
  title: string;
  author?: string | null;
}

export interface BookList {
  id: number;
  name: string;
  book_count?: number;
  books?: BookListItem[];
}

export interface InviteCode {
  id: number;
  code: string;
  name: string;
  max_uses?: number | null;
  uses_count: number;
  expires_at?: string | null;
  active: boolean;
  available: boolean;
  created_at?: string;
  teams?: Team[];
}

export interface Admin {
  id: number;
  email: string;
}

export interface ManagedTeam {
  id: number;
  name: string;
}

export interface TeamLeadInfo {
  id: number;
  username: string;
  email: string;
  team_id: number;
  team_name: string;
  managed_team_count: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  team: Team;
  pin_reset_required: boolean;
  managed_teams?: ManagedTeam[];
}

export interface AdminAuthResponse {
  token: string;
  admin: Admin;
}

export interface StatsResponse {
  total_teams: number;
  total_users: number;
  total_team_leads: number;
  total_teammates: number;
  total_books: number;
  total_assignments: number;
  assignments_by_status: {
    assigned: number;
    in_progress: number;
    completed: number;
  };
  active_invite_codes: number;
  teams_created_this_week: number;
}

// Matching Game
export interface MatchingGameAttempt {
  correct_count: number;
  total_count: number;
  score: number;
  created_at?: string;
}

export interface MatchingGameMeResponse {
  high_score: number;
  attempts: MatchingGameAttempt[];
}

export interface MatchingGameTeammateStats {
  user_id: number;
  username: string;
  attempt_count: number;
  high_score: number;
  attempts: MatchingGameAttempt[];
}

export interface MatchingGameTeamStatsResponse {
  teammates: MatchingGameTeammateStats[];
}

export interface MatchingGameAttemptResponse {
  high_score: number;
}

// Flashcard Deck (flip cards)
export interface FlashcardDeckMeResponse {
  times_started: number;
  times_completed: number;
}

export interface FlashcardDeckTeammateStats {
  user_id: number;
  username: string;
  times_started: number;
  times_completed: number;
}

export interface FlashcardDeckTeamStatsResponse {
  teammates: FlashcardDeckTeammateStats[];
}

// Quiz
export interface QuizChoice {
  id: number;
  title: string;
  author?: string | null;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: number;
  question_text: string;
  position: number;
  difficulty: QuizDifficulty;
  correct_book_list_item_id: number;
  choices: QuizChoice[];
}

export interface AdminQuizQuestion {
  id: number;
  question_text: string;
  position: number;
  difficulty: QuizDifficulty;
  correct_book_list_item_id: number;
  correct_book_list_item: BookListItem;
}

export interface QuizAttemptResponse {
  high_score: number;
  attempt_id: number;
}

export interface QuizAttempt {
  correct_count: number;
  total_count: number;
  created_at?: string;
}

export interface QuizMeResponse {
  high_score: number;
  attempts: QuizAttempt[];
  latest_attempt_id?: number | null;
}

export interface QuizTeammateStats {
  user_id: number;
  username: string;
  attempt_count: number;
  high_score: number;
  attempts: QuizAttempt[];
}

export interface QuizTeamStatsResponse {
  teammates: QuizTeammateStats[];
}

// Head-to-head quiz match
export interface ChallengeableTeammate {
  id: number;
  username: string;
  avatar_emoji?: string | null;
  avatar_color?: string | null;
  online: boolean;
}

export type QuizMatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type QuizMatchPhase =
  | 'waiting_opponent'
  | 'question_show'
  | 'first_responder_answered'
  | 'second_responder_can_answer'
  | 'between_questions'
  | 'completed';

export interface QuizMatchCurrentQuestion {
  id: number;
  question_text: string;
  correct_book_list_item_id: number;
  choices: QuizChoice[];
  first_responder_id: number;
  /** When true, first responder got title right; steal is author-only (1 pt each if second gets author right). */
  steal_author_only?: boolean;
  /** When steal_author_only, book dropdown is locked to this id. */
  locked_book_list_item_id?: number;
}

export interface QuizMatchQuestionResult {
  question_index: number;
  quiz_question_id: number;
  question_text: string;
  correct_book_title: string | null;
  correct_book_author: string | null;
  first_responder_id: number;
  first_responder_username: string;
  second_responder_id: number;
  second_responder_username: string;
  first_responder_correct: boolean;
  second_responder_correct: boolean | null;
}

export interface QuizMatchState {
  id: number;
  status: QuizMatchStatus;
  phase: QuizMatchPhase;
  challenger_id: number;
  challenger_username: string;
  challenger_avatar?: string | null;
  challenger_avatar_color?: string | null;
  invited_opponent_id: number;
  invited_opponent_username: string;
  invited_opponent_avatar?: string | null;
  invited_opponent_avatar_color?: string | null;
  opponent_id: number | null;
  opponent_username: string | null;
  opponent_avatar?: string | null;
  opponent_avatar_color?: string | null;
  challenger_score: number;
  opponent_score: number;
  current_question_index: number;
  total_questions: number;
  difficulty?: QuizDifficulty | null;
  current_question: QuizMatchCurrentQuestion | null;
  phase_entered_at?: string | null;
  question_results?: QuizMatchQuestionResult[];
  last_answer?: { correct: boolean; respondent_id: number; points: number };
}

// Badges
export interface Badge {
  key: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  progress: string | null;
}

export interface BadgesResponse {
  badges: Badge[];
}

// Streak
export interface StreakResponse {
  streak: number;
  active_today: boolean;
}

// Weekly Summary
export interface WeeklySummaryResponse {
  week_start: string;
  quizzes_completed: number;
  quiz_avg_score: number;
  matches_played: number;
  matches_won: number;
  books_finished: number;
  days_active: number;
}

// Personal Progress
export interface ProgressQuizAttempt {
  correct_count: number;
  total_count: number;
  created_at: string;
}

export interface ProgressAssignment {
  book_title: string;
  book_author: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  progress_percent: number;
}

export interface MyProgressResponse {
  quiz: {
    total_attempts: number;
    high_score: number;
    max_possible: number;
    avg_percent: number;
    recent: ProgressQuizAttempt[];
  };
  matches: {
    total: number;
    wins: number;
    losses: number;
    ties: number;
  };
  reading: {
    books_completed: number;
    books_total: number;
    assignments: ProgressAssignment[];
  };
  activity: {
    total_active_days: number;
    current_streak: number;
    recent_dates: string[];
  };
}

// Team Reading Progress
export interface TeamReadingTeammate {
  user_id: number;
  username: string;
  avatar_emoji?: string | null;
  avatar_color?: string | null;
  books_assigned: number;
  books_completed: number;
  avg_progress: number;
}

export interface TeamReadingProgressResponse {
  total_assignments: number;
  completed_count: number;
  in_progress_count: number;
  avg_progress: number;
  teammates: TeamReadingTeammate[];
  recently_completed: { username: string; book_title: string; completed_at: string }[];
}

// Daily spotlight question
export interface DailyQuestionChoice {
  id: number;
  title: string;
  author: string;
}

export interface DailyQuestionResponse {
  available: boolean;
  question_id?: number;
  question_text?: string;
  difficulty?: QuizDifficulty;
  choices?: DailyQuestionChoice[];
  already_answered?: boolean;
  my_choice_id?: number;
  correct?: boolean;
  correct_answer_id?: number;
  team_answered?: number;
  team_correct?: number;
}

export interface DailyQuestionAnswerResponse {
  correct: boolean;
  correct_answer_id: number;
  team_answered: number;
  team_correct: number;
}

// Leaderboard
export interface LeaderboardEntry {
  user_id: number;
  username: string;
  avatar_emoji?: string | null;
  avatar_color?: string | null;
  role: 'teammate' | 'team_lead';
  quiz_high_score: number;
  quiz_avg_score: number;
  quiz_attempt_count: number;
  match_wins: number;
  match_losses: number;
  books_completed: number;
  books_assigned: number;
  avg_reading_progress: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

// Session state returned by GET /auth/session
export interface SessionResponse {
  user?: User;
  team?: Team;
  admin?: Admin;
  managed_teams?: ManagedTeam[];
  pin_reset_required?: boolean;
  token?: string;
  admin_token?: string;
}

// ─── Refresh interceptor state ──────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

const TOKEN_KEYS = { user: 'bob_user_token', admin: 'bob_admin_token' } as const;

class ApiClient {
  private client: AxiosInstance;
  private userToken: string | null = sessionStorage.getItem(TOKEN_KEYS.user);
  private adminToken: string | null = sessionStorage.getItem(TOKEN_KEYS.admin);

  setUserToken(token: string | null) {
    this.userToken = token;
    if (token) sessionStorage.setItem(TOKEN_KEYS.user, token);
    else sessionStorage.removeItem(TOKEN_KEYS.user);
  }

  setAdminToken(token: string | null) {
    this.adminToken = token;
    if (token) sessionStorage.setItem(TOKEN_KEYS.admin, token);
    else sessionStorage.removeItem(TOKEN_KEYS.admin);
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    this.client.interceptors.request.use((config) => {
      const token = this.adminToken || this.userToken;
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: on 401, attempt a token refresh then retry
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't try to refresh if the refresh endpoint itself failed
          if (originalRequest.url === '/auth/refresh') {
            return Promise.reject(error);
          }

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => this.client(originalRequest));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
            processQueue(null);
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ── Session management ──────────────────────────────────────────────────
  async getSession(): Promise<SessionResponse> {
    const res = await this.client.get<SessionResponse>('/auth/session');
    if (res.data.token) this.setUserToken(res.data.token);
    if (res.data.admin_token) this.setAdminToken(res.data.admin_token);
    return res.data;
  }

  async refreshSession(): Promise<void> {
    await this.client.post('/auth/refresh');
  }

  async logout(): Promise<void> {
    try {
      await this.client.delete('/auth/logout');
    } catch {
      // Best-effort; clear local state regardless
    }
    this.setUserToken(null);
    this.setAdminToken(null);
  }

  async clearUserSession(): Promise<void> {
    await this.client.delete('/auth/user_session');
    this.setUserToken(null);
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  async login(username: string, teamId: number, passwordOrPin: string): Promise<AuthResponse> {
    const res = await this.client.post('/login', { username, team_id: teamId, password: passwordOrPin });
    this.setUserToken(res.data.token);
    return res.data;
  }

  async register(inviteCode: string, teamName: string, username: string, email: string, password: string) {
    const res = await this.client.post('/register', {
      invite_code: inviteCode,
      team_name: teamName,
      username,
      email,
      password,
      password_confirmation: password,
    });
    if (res.data.token) this.setUserToken(res.data.token);
    return res.data;
  }

  async createNewTeam(inviteCode: string, teamName: string): Promise<AuthResponse> {
    const res = await this.client.post('/create_team', {
      invite_code: inviteCode,
      team_name: teamName,
    });
    if (res.data.token) this.setUserToken(res.data.token);
    return res.data;
  }

  async resetPin(newPin: string) {
    return this.client.post('/reset_pin', { new_pin: newPin });
  }

  async updatePassword(newPassword: string) {
    return this.client.post('/reset_pin', { new_password: newPassword });
  }

  async validateCode(code: string) {
    const res = await this.client.get(`/validate_code/${code}`);
    return res.data;
  }

  async getTeams() {
    const res = await this.client.get('/teams');
    return res.data;
  }

  async getMe(): Promise<{ user: User; team: Team; managed_teams?: ManagedTeam[] }> {
    const res = await this.client.get('/me');
    return res.data;
  }

  async switchTeam(teamId: number): Promise<AuthResponse> {
    const res = await this.client.post('/switch_team', { team_id: teamId });
    if (res.data.token) this.setUserToken(res.data.token);
    return res.data;
  }

  // Teammates
  async getTeammates(): Promise<User[]> {
    const res = await this.client.get('/teammates');
    return res.data;
  }

  async createTeammate(username: string, pin?: string) {
    const payload = pin != null && pin !== '' ? { username, pin } : { username };
    const res = await this.client.post('/teammates', payload);
    return res.data;
  }

  async updateTeammate(id: number, username: string): Promise<User> {
    const res = await this.client.patch(`/teammates/${id}`, { teammate: { username } });
    return res.data;
  }

  async resetTeammatePin(id: number, newPin?: string): Promise<{ user: User; pin: string; message?: string }> {
    const res = await this.client.post(`/teammates/${id}/reset_pin`, newPin != null && newPin.length === 4 ? { new_pin: newPin } : {});
    return res.data;
  }

  async deleteTeammate(id: number) {
    return this.client.delete(`/teammates/${id}`);
  }

  // Books
  async getBooks(): Promise<Book[]> {
    const res = await this.client.get('/books');
    return res.data;
  }

  async createBook(title: string, author?: string) {
    const res = await this.client.post('/books', { title, author });
    return res.data;
  }

  async deleteBook(id: number) {
    return this.client.delete(`/books/${id}`);
  }

  // Assignments
  async getAssignments(): Promise<BookAssignment[]> {
    const res = await this.client.get('/book_assignments');
    return res.data;
  }

  async getMyBooks(): Promise<BookAssignment[]> {
    const res = await this.client.get('/my_books');
    return res.data;
  }

  async createAssignment(userId: number, bookId: number) {
    const res = await this.client.post('/book_assignments', { user_id: userId, book_id: bookId });
    return res.data;
  }

  async updateAssignment(id: number, status: string, progressNotes?: string, progressPercent?: number) {
    const res = await this.client.patch(`/book_assignments/${id}`, { status, progress_notes: progressNotes, progress_percent: progressPercent });
    return res.data;
  }

  async deleteAssignment(id: number) {
    return this.client.delete(`/book_assignments/${id}`);
  }

  // Admin
  async adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
    const res = await this.client.post('/admin/login', { email, password });
    this.setAdminToken(res.data.token);
    return res.data;
  }

  async adminGetMe(): Promise<Admin> {
    const res = await this.client.get<Admin>('/admin/me');
    return res.data;
  }

  /** Admin only: get a demo teammate session (seeded team + Medium 20 Book List 3-4). Does not set localStorage. */
  async adminGetDemoTeammateSession(): Promise<AuthResponse> {
    const res = await this.client.post('/admin/demo_teammate');
    if (res.data.token) this.setUserToken(res.data.token);
    return res.data;
  }

  async adminGetStats(): Promise<StatsResponse> {
    const res = await this.client.get('/admin/stats');
    return res.data;
  }

  async adminGetInviteCodes(): Promise<InviteCode[]> {
    const res = await this.client.get('/admin/invite_codes');
    return res.data;
  }

  async adminCreateInviteCode(name: string, code?: string, maxUses?: number) {
    const res = await this.client.post('/admin/invite_codes', { name, code, max_uses: maxUses });
    return res.data;
  }

  async adminUpdateInviteCode(id: number, data: { active?: boolean; max_uses?: number }) {
    const res = await this.client.patch(`/admin/invite_codes/${id}`, data);
    return res.data;
  }

  async adminDeleteInviteCode(id: number) {
    return this.client.delete(`/admin/invite_codes/${id}`);
  }

  async adminGetTeams(): Promise<Team[]> {
    const res = await this.client.get('/admin/teams');
    return res.data;
  }

  async adminGetTeam(id: number): Promise<Team> {
    const res = await this.client.get(`/admin/teams/${id}`);
    return res.data;
  }

  async adminCreateTeam(name: string, inviteCodeId: number): Promise<Team> {
    const res = await this.client.post('/admin/teams', { name, invite_code_id: inviteCodeId });
    return res.data;
  }

  async adminUpdateTeam(
    id: number,
    data: { name?: string; invite_code_id?: number; team_lead_id?: number | null }
  ): Promise<Team> {
    const res = await this.client.patch(`/admin/teams/${id}`, data);
    return res.data;
  }

  async adminCreateTeamUser(
    teamId: number,
    data: { username: string; role: 'teammate' | 'team_lead'; email?: string; password?: string; pin?: string }
  ): Promise<{ user: User }> {
    const res = await this.client.post(`/admin/teams/${teamId}/users`, data);
    return res.data;
  }

  async adminUpdateTeamUser(
    teamId: number,
    userId: number,
    data: { username?: string; role?: 'teammate' | 'team_lead'; email?: string }
  ): Promise<User> {
    const res = await this.client.patch(`/admin/teams/${teamId}/users/${userId}`, data);
    return res.data;
  }

  async adminDeleteTeamUser(teamId: number, userId: number): Promise<void> {
    await this.client.delete(`/admin/teams/${teamId}/users/${userId}`);
  }

  async adminResetTeamUserCredential(
    teamId: number,
    userId: number,
    data: { new_password?: string; new_pin?: string }
  ): Promise<{ user: User; pin?: string }> {
    const res = await this.client.post(`/admin/teams/${teamId}/users/${userId}/reset_credential`, data);
    return res.data;
  }

  async adminDeleteTeam(id: number): Promise<void> {
    await this.client.delete(`/admin/teams/${id}`);
  }

  async adminGetTeamLeads(): Promise<TeamLeadInfo[]> {
    const res = await this.client.get('/admin/team_leads');
    return res.data;
  }

  async adminAssignExistingLead(teamId: number, userId: number): Promise<Team> {
    const res = await this.client.post(`/admin/teams/${teamId}/assign_existing_lead`, { user_id: userId });
    return res.data;
  }

  // Admin: book lists (groups)
  async adminGetBookLists(): Promise<BookList[]> {
    const res = await this.client.get('/admin/book_lists');
    return res.data;
  }

  async adminCreateBookList(name: string): Promise<BookList> {
    const res = await this.client.post('/admin/book_lists', { name });
    return res.data;
  }

  async adminGetBookList(id: number): Promise<BookList> {
    const res = await this.client.get(`/admin/book_lists/${id}`);
    return res.data;
  }

  async adminUpdateBookList(id: number, data: { name: string }): Promise<BookList> {
    const res = await this.client.patch(`/admin/book_lists/${id}`, data);
    return res.data;
  }

  async adminDeleteBookList(id: number): Promise<void> {
    await this.client.delete(`/admin/book_lists/${id}`);
  }

  async adminAddBookToList(listId: number, title: string, author?: string): Promise<BookListItem> {
    const res = await this.client.post(`/admin/book_lists/${listId}/books`, { title, author });
    return res.data;
  }

  async adminUpdateBookInList(listId: number, bookId: number, data: { title: string; author?: string }): Promise<BookListItem> {
    const res = await this.client.patch(`/admin/book_lists/${listId}/books/${bookId}`, data);
    return res.data;
  }

  async adminRemoveBookFromList(listId: number, bookId: number): Promise<void> {
    await this.client.delete(`/admin/book_lists/${listId}/books/${bookId}`);
  }

  // Admin: quiz questions for a book list
  async adminGetQuizQuestions(bookListId: number): Promise<AdminQuizQuestion[]> {
    const res = await this.client.get<AdminQuizQuestion[]>(`/admin/book_lists/${bookListId}/questions`);
    return res.data;
  }

  async adminCreateQuizQuestion(
    bookListId: number,
    questionText: string,
    correctBookListItemId: number,
    difficulty?: QuizDifficulty
  ): Promise<AdminQuizQuestion> {
    const body: Record<string, unknown> = {
      question_text: questionText,
      correct_book_list_item_id: correctBookListItemId,
    };
    if (difficulty) body.difficulty = difficulty;
    const res = await this.client.post<AdminQuizQuestion>(`/admin/book_lists/${bookListId}/questions`, body);
    return res.data;
  }

  async adminUpdateQuizQuestion(
    bookListId: number,
    questionId: number,
    data: { question_text?: string; correct_book_list_item_id?: number; difficulty?: QuizDifficulty }
  ): Promise<AdminQuizQuestion> {
    const res = await this.client.patch<AdminQuizQuestion>(
      `/admin/book_lists/${bookListId}/questions/${questionId}`,
      {
        question_text: data.question_text,
        correct_book_list_item_id: data.correct_book_list_item_id,
        difficulty: data.difficulty,
      }
    );
    return res.data;
  }

  async adminDeleteQuizQuestion(bookListId: number, questionId: number): Promise<void> {
    await this.client.delete(`/admin/book_lists/${bookListId}/questions/${questionId}`);
  }

  // Team Lead: list available book lists for "choose list"
  async getBookLists(): Promise<BookList[]> {
    const res = await this.client.get('/book_lists');
    return res.data;
  }

  async updateMyTeamBookList(bookListId: number): Promise<Team> {
    const res = await this.client.patch<Team>('/my_team', { book_list_id: bookListId });
    return res.data;
  }

  async updateMyTeamSettings(settings: { leaderboard_enabled?: boolean }): Promise<Team> {
    const res = await this.client.patch<Team>('/my_team', settings);
    return res.data;
  }

  // Quiz
  async getQuizQuestions(
    bookListId: number,
    options?: { mode?: 'all' | 'my_books'; difficulty?: QuizDifficulty }
  ): Promise<QuizQuestion[]> {
    const params = new URLSearchParams();
    if (options?.mode) params.set('mode', options.mode);
    if (options?.difficulty) params.set('difficulty', options.difficulty);
    const qs = params.toString();
    const url = `/book_lists/${bookListId}/quiz_questions${qs ? `?${qs}` : ''}`;
    const res = await this.client.get<QuizQuestion[]>(url);
    return res.data;
  }

  async startQuizAttempt(
    bookListId: number,
    totalCount: number
  ): Promise<{ attempt_id: number }> {
    const res = await this.client.post<{ attempt_id: number }>('/quiz/attempt/start', {
      book_list_id: bookListId,
      total_count: totalCount,
    });
    return res.data;
  }

  async submitQuizAttempt(
    bookListId: number,
    correctCount: number,
    totalCount: number,
    attemptId?: number
  ): Promise<QuizAttemptResponse> {
    const body: Record<string, number> = {
      book_list_id: bookListId,
      correct_count: correctCount,
      total_count: totalCount,
    };
    if (attemptId != null) {
      body.attempt_id = attemptId;
    }
    const res = await this.client.post<QuizAttemptResponse>('/quiz/attempt', body);
    return res.data;
  }

  async getMyQuizStats(): Promise<QuizMeResponse> {
    const res = await this.client.get<QuizMeResponse>('/quiz/me');
    return res.data;
  }

  async getTeamQuizStats(): Promise<QuizTeamStatsResponse> {
    const res = await this.client.get<QuizTeamStatsResponse>('/quiz/team_stats');
    return res.data;
  }

  async submitQuizChallenge(
    quizAttemptId: number,
    quizQuestionId: number,
    chosenBookListItemId: number,
    pageNumber: string,
    justification: string
  ): Promise<{ upheld: boolean; new_correct_count: number; high_score: number }> {
    const res = await this.client.post<{
      upheld: boolean;
      new_correct_count: number;
      high_score: number;
    }>('/quiz/challenge', {
      quiz_attempt_id: quizAttemptId,
      quiz_question_id: quizQuestionId,
      chosen_book_list_item_id: chosenBookListItemId,
      page_number: pageNumber,
      justification,
    });
    return res.data;
  }

  // Avatar
  async updateMyAvatar(avatarEmoji: string | null, avatarColor?: string | null): Promise<User> {
    const body: Record<string, string | null> = { avatar_emoji: avatarEmoji };
    if (avatarColor !== undefined) body.avatar_color = avatarColor;
    const res = await this.client.patch<User>('/my_avatar', body);
    return res.data;
  }

  // Badges
  async getMyBadges(): Promise<BadgesResponse> {
    const res = await this.client.get<BadgesResponse>('/my_badges');
    return res.data;
  }

  // Streak
  async getMyStreak(): Promise<StreakResponse> {
    const res = await this.client.get<StreakResponse>('/my_streak');
    return res.data;
  }

  // Weekly Summary
  async getMyWeeklySummary(): Promise<WeeklySummaryResponse> {
    const res = await this.client.get<WeeklySummaryResponse>('/my_weekly_summary');
    return res.data;
  }

  // Personal Progress
  async getMyProgress(): Promise<MyProgressResponse> {
    const res = await this.client.get<MyProgressResponse>('/my_progress');
    return res.data;
  }

  // Team Reading Progress
  async getTeamReadingProgress(): Promise<TeamReadingProgressResponse> {
    const res = await this.client.get<TeamReadingProgressResponse>('/team_reading_progress');
    return res.data;
  }

  // Daily question
  async getDailyQuestion(): Promise<DailyQuestionResponse> {
    const res = await this.client.get<DailyQuestionResponse>('/daily_question');
    return res.data;
  }

  async answerDailyQuestion(bookListItemId: number): Promise<DailyQuestionAnswerResponse> {
    const res = await this.client.post<DailyQuestionAnswerResponse>('/daily_question/answer', { book_list_item_id: bookListItemId });
    return res.data;
  }

  // Match history
  async getMatchHistory(): Promise<(QuizMatchState & { created_at: string })[]> {
    const res = await this.client.get<(QuizMatchState & { created_at: string })[]>('/quiz_matches/history');
    return res.data;
  }

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardResponse> {
    const res = await this.client.get<LeaderboardResponse>('/leaderboard');
    return res.data;
  }

  // Head-to-head quiz match
  async getChallengeableTeammates(): Promise<ChallengeableTeammate[]> {
    const res = await this.client.get<ChallengeableTeammate[]>('/quiz/challengeable_teammates');
    return res.data;
  }

  async createQuizMatch(opponentId: number, difficulty?: QuizDifficulty): Promise<QuizMatchState> {
    const body: Record<string, unknown> = { opponent_id: opponentId };
    if (difficulty) body.difficulty = difficulty;
    const res = await this.client.post<QuizMatchState>('/quiz_matches', body);
    return res.data;
  }

  async joinQuizMatch(matchId: number): Promise<QuizMatchState> {
    const res = await this.client.post<QuizMatchState>(`/quiz_matches/${matchId}/join`);
    return res.data;
  }

  async declineQuizMatch(matchId: number): Promise<void> {
    await this.client.post(`/quiz_matches/${matchId}/decline`);
  }

  async getQuizMatch(matchId: number): Promise<QuizMatchState> {
    const res = await this.client.get<QuizMatchState>(`/quiz_matches/${matchId}`);
    return res.data;
  }

  async getPendingQuizMatchInvite(): Promise<QuizMatchState | null> {
    const res = await this.client.get<QuizMatchState | null>('/quiz_matches/pending_invite');
    return res.data;
  }

  async submitQuizMatchAnswer(
    matchId: number,
    questionIndex: number,
    bookListItemId: number,
    authorChoiceId: number
  ): Promise<QuizMatchState & { last_answer?: { correct: boolean; points: number } }> {
    const res = await this.client.post(`/quiz_matches/${matchId}/answer`, {
      question_index: questionIndex,
      book_list_item_id: bookListItemId,
      author_choice_id: authorChoiceId,
    });
    return res.data;
  }

  async submitQuizMatchTimeout(matchId: number): Promise<QuizMatchState> {
    const res = await this.client.post<QuizMatchState>(`/quiz_matches/${matchId}/timeout`);
    return res.data;
  }

  // Matching Game
  async submitMatchingGameAttempt(
    correctCount: number,
    totalCount: number,
    score: number
  ): Promise<MatchingGameAttemptResponse> {
    try {
      const res = await this.client.post<MatchingGameAttemptResponse>('/flashcards/attempt', {
        correct_count: correctCount,
        total_count: totalCount,
        score,
      });
      return res.data;
    } catch {
      const key = 'matching_game_high_score';
      const prev = Number(localStorage.getItem(key)) || 0;
      const high_score = Math.max(prev, score);
      localStorage.setItem(key, String(high_score));
      return { high_score };
    }
  }

  async getMyMatchingGameStats(): Promise<MatchingGameMeResponse> {
    try {
      const res = await this.client.get<MatchingGameMeResponse>('/flashcards/me');
      return res.data;
    } catch {
      const high_score = Number(localStorage.getItem('matching_game_high_score')) || 0;
      return { high_score, attempts: [] };
    }
  }

  async getTeamMatchingGameStats(): Promise<MatchingGameTeamStatsResponse> {
    try {
      const res = await this.client.get<MatchingGameTeamStatsResponse>('/flashcards/team_stats');
      return res.data;
    } catch {
      return { teammates: [] };
    }
  }

  // Flashcard Deck (flip cards)
  async recordFlashcardDeckStart(): Promise<void> {
    try {
      await this.client.post('/flashcard_deck/start');
    } catch {
      const key = 'flashcard_deck_times_started';
      const prev = Number(localStorage.getItem(key)) || 0;
      localStorage.setItem(key, String(prev + 1));
    }
  }

  async recordFlashcardDeckComplete(): Promise<void> {
    try {
      await this.client.post('/flashcard_deck/complete');
    } catch {
      const key = 'flashcard_deck_times_completed';
      const prev = Number(localStorage.getItem(key)) || 0;
      localStorage.setItem(key, String(prev + 1));
    }
  }

  async getMyFlashcardDeckStats(): Promise<FlashcardDeckMeResponse> {
    try {
      const res = await this.client.get<FlashcardDeckMeResponse>('/flashcard_deck/me');
      return res.data;
    } catch {
      const started = Number(localStorage.getItem('flashcard_deck_times_started')) || 0;
      const completed = Number(localStorage.getItem('flashcard_deck_times_completed')) || 0;
      return { times_started: started, times_completed: completed };
    }
  }

  async getTeamFlashcardDeckStats(): Promise<FlashcardDeckTeamStatsResponse> {
    try {
      const res = await this.client.get<FlashcardDeckTeamStatsResponse>('/flashcard_deck/team_stats');
      return res.data;
    } catch {
      return { teammates: [] };
    }
  }
}

export const api = new ApiClient();
