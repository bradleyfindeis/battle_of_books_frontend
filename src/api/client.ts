import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Types based on our API
export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: 'teammate' | 'team_lead';
  team_id: number;
  pin_reset_required?: boolean;
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

export interface AuthResponse {
  token: string;
  user: User;
  team: Team;
  pin_reset_required: boolean;
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

export interface QuizQuestion {
  id: number;
  question_text: string;
  position: number;
  correct_book_list_item_id: number;
  choices: QuizChoice[];
}

export interface AdminQuizQuestion {
  id: number;
  question_text: string;
  position: number;
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
  invited_opponent_id: number;
  invited_opponent_username: string;
  opponent_id: number | null;
  opponent_username: string | null;
  challenger_score: number;
  opponent_score: number;
  current_question_index: number;
  total_questions: number;
  current_question: QuizMatchCurrentQuestion | null;
  phase_entered_at?: string | null;
  question_results?: QuizMatchQuestionResult[];
  last_answer?: { correct: boolean; respondent_id: number; points: number };
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const isAdminRequest = typeof config.url === 'string' && config.url.includes('/admin/');
      const token = isAdminRequest
        ? localStorage.getItem('adminToken')
        : (localStorage.getItem('token') || localStorage.getItem('adminToken'));
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async login(username: string, teamId: number, passwordOrPin: string): Promise<AuthResponse> {
    const res = await this.client.post('/login', { username, team_id: teamId, password: passwordOrPin });
    localStorage.setItem('token', res.data.token);
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
    localStorage.setItem('token', res.data.token);
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

  async getMe() {
    const res = await this.client.get('/me');
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

  async resetTeammatePin(id: number): Promise<{ user: User; pin: string; message?: string }> {
    const res = await this.client.post(`/teammates/${id}/reset_pin`);
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

  async updateAssignment(id: number, status: string, progressNotes?: string) {
    const res = await this.client.patch(`/book_assignments/${id}`, { status, progress_notes: progressNotes });
    return res.data;
  }

  async deleteAssignment(id: number) {
    return this.client.delete(`/book_assignments/${id}`);
  }

  // Admin
  async adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
    const res = await this.client.post('/admin/login', { email, password });
    localStorage.setItem('adminToken', res.data.token);
    return res.data;
  }

  /** Admin only: get a demo teammate session (seeded team + Medium 20 Book List 3-4). Does not set localStorage. */
  async adminGetDemoTeammateSession(): Promise<AuthResponse> {
    const res = await this.client.post('/admin/demo_teammate');
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

  async adminDeleteTeam(id: number): Promise<void> {
    await this.client.delete(`/admin/teams/${id}`);
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
    correctBookListItemId: number
  ): Promise<AdminQuizQuestion> {
    const res = await this.client.post<AdminQuizQuestion>(`/admin/book_lists/${bookListId}/questions`, {
      question_text: questionText,
      correct_book_list_item_id: correctBookListItemId,
    });
    return res.data;
  }

  async adminUpdateQuizQuestion(
    bookListId: number,
    questionId: number,
    data: { question_text?: string; correct_book_list_item_id?: number }
  ): Promise<AdminQuizQuestion> {
    const res = await this.client.patch<AdminQuizQuestion>(
      `/admin/book_lists/${bookListId}/questions/${questionId}`,
      {
        question_text: data.question_text,
        correct_book_list_item_id: data.correct_book_list_item_id,
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

  // Quiz
  async getQuizQuestions(
    bookListId: number,
    options?: { mode?: 'all' | 'my_books' }
  ): Promise<QuizQuestion[]> {
    const params = new URLSearchParams();
    if (options?.mode) params.set('mode', options.mode);
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

  // Head-to-head quiz match
  async getChallengeableTeammates(): Promise<ChallengeableTeammate[]> {
    const res = await this.client.get<ChallengeableTeammate[]>('/quiz/challengeable_teammates');
    return res.data;
  }

  async createQuizMatch(opponentId: number): Promise<QuizMatchState> {
    const res = await this.client.post<QuizMatchState>('/quiz_matches', { opponent_id: opponentId });
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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
  }
}

export const api = new ApiClient();
