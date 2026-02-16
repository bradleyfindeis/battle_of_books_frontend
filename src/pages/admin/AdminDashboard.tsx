import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { StatsResponse, InviteCode, Team, BookList, BookListItem, AdminQuizQuestion, TeamLeadInfo } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export function AdminDashboard() {
  const { logout, setDemoSession } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeCustom, setNewCodeCustom] = useState('');
  const [bookLists, setBookLists] = useState<BookList[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingList, setEditingList] = useState<BookList | null>(null);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamInviteCodeId, setNewTeamInviteCodeId] = useState<number | ''>('');
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamInviteCodeId, setEditTeamInviteCodeId] = useState<number | ''>('');
  const [showAddTeammate, setShowAddTeammate] = useState(false);
  const [newTeammateUsername, setNewTeammateUsername] = useState('');
  const [newTeammatePin, setNewTeammatePin] = useState('');
  const [showAddTeamLead, setShowAddTeamLead] = useState(false);
  const [newTeamLeadUsername, setNewTeamLeadUsername] = useState('');
  const [newTeamLeadEmail, setNewTeamLeadEmail] = useState('');
  const [newTeamLeadPassword, setNewTeamLeadPassword] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editMemberUsername, setEditMemberUsername] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<AdminQuizQuestion[]>([]);
  const [quizQuestionsLoading, setQuizQuestionsLoading] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCorrectBookId, setNewQuestionCorrectBookId] = useState<number | ''>('');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionCorrectBookId, setEditQuestionCorrectBookId] = useState<number | ''>('');
  const [showQuizQuestionsModal, setShowQuizQuestionsModal] = useState(false);
  const [resettingCredentialUserId, setResettingCredentialUserId] = useState<number | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [credentialSuccessMessage, setCredentialSuccessMessage] = useState<string | null>(null);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialError, setCredentialError] = useState('');
  const [showAssignExistingLead, setShowAssignExistingLead] = useState(false);
  const [allTeamLeads, setAllTeamLeads] = useState<TeamLeadInfo[]>([]);
  const [assignLeadLoading, setAssignLeadLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsData, codesData, teamsData, listsData] = await Promise.all([
        api.adminGetStats(),
        api.adminGetInviteCodes(),
        api.adminGetTeams(),
        api.adminGetBookLists().catch(() => [] as BookList[]),
      ]);
      setStats(statsData);
      setCodes(codesData);
      setTeams(teamsData);
      setBookLists(listsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookLists = async () => {
    try {
      const lists = await api.adminGetBookLists();
      setBookLists(lists);
    } catch {
      setBookLists([]);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const list = await api.adminCreateBookList(newListName);
      setShowCreateListModal(false);
      setNewListName('');
      await loadBookLists();
      setEditingListId(list.id);
      const full = await api.adminGetBookList(list.id);
      setEditingList(full);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateListName = async (id: number, name: string) => {
    if (!editingList) return;
    try {
      await api.adminUpdateBookList(id, { name });
      setEditingList({ ...editingList, name });
      await loadBookLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async (id: number) => {
    if (!confirm('Delete this book list? This cannot be undone.')) return;
    try {
      await api.adminDeleteBookList(id);
      setEditingListId(null);
      setEditingList(null);
      await loadBookLists();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditList = async (id: number) => {
    try {
      const list = await api.adminGetBookList(id);
      setEditingListId(id);
      setEditingList(list);
      setQuizQuestions([]);
      setEditingQuestionId(null);
      setShowAddQuestion(false);
      setShowQuizQuestionsModal(false);
      setNewQuestionText('');
      setNewQuestionCorrectBookId('');
    } catch (err) {
      console.error(err);
    }
  };

  const openQuizQuestionsModal = () => {
    if (editingListId == null) return;
    setShowQuizQuestionsModal(true);
    setShowAddQuestion(false);
    setEditingQuestionId(null);
    loadQuizQuestions(editingListId);
  };

  const closeQuizQuestionsModal = () => {
    setShowQuizQuestionsModal(false);
    setShowAddQuestion(false);
    setEditingQuestionId(null);
    setEditQuestionText('');
    setEditQuestionCorrectBookId('');
    setNewQuestionText('');
    setNewQuestionCorrectBookId('');
  };

  const loadQuizQuestions = async (listId: number) => {
    setQuizQuestionsLoading(true);
    try {
      const questions = await api.adminGetQuizQuestions(listId);
      setQuizQuestions(questions);
    } catch {
      setQuizQuestions([]);
    } finally {
      setQuizQuestionsLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingListId == null || !newQuestionText.trim() || newQuestionCorrectBookId === '') return;
    try {
      const q = await api.adminCreateQuizQuestion(
        editingListId,
        newQuestionText.trim(),
        Number(newQuestionCorrectBookId)
      );
      setQuizQuestions((prev) => [...prev, q].sort((a, b) => a.position - b.position));
      setNewQuestionText('');
      setNewQuestionCorrectBookId('');
      setShowAddQuestion(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQuestion = async (questionId: number, text: string, correctBookId: number) => {
    if (editingListId == null) return;
    try {
      const q = await api.adminUpdateQuizQuestion(editingListId, questionId, {
        question_text: text,
        correct_book_list_item_id: correctBookId,
      });
      setQuizQuestions((prev) =>
        prev.map((x) => (x.id === questionId ? q : x)).sort((a, b) => a.position - b.position)
      );
      setEditingQuestionId(null);
      setEditQuestionText('');
      setEditQuestionCorrectBookId('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (editingListId == null || !confirm('Delete this question?')) return;
    try {
      await api.adminDeleteQuizQuestion(editingListId, questionId);
      setQuizQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
        setEditQuestionText('');
        setEditQuestionCorrectBookId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditQuestion = (q: AdminQuizQuestion) => {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.question_text);
    setEditQuestionCorrectBookId(q.correct_book_list_item_id);
  };

  const handleAddBookToList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingListId == null || !newBookTitle.trim()) return;
    try {
      await api.adminAddBookToList(editingListId, newBookTitle.trim(), newBookAuthor.trim() || undefined);
      setNewBookTitle('');
      setNewBookAuthor('');
      const full = await api.adminGetBookList(editingListId);
      setEditingList(full);
      await loadBookLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBookInList = async (bookId: number, title: string, author: string) => {
    if (editingListId == null) return;
    try {
      await api.adminUpdateBookInList(editingListId, bookId, { title: title.trim(), author: author.trim() || undefined });
      if (editingList) {
        setEditingList({
          ...editingList,
          books: (editingList.books || []).map((b) =>
            b.id === bookId ? { ...b, title: title.trim(), author: author.trim() || undefined } : b
          ),
        });
      }
      setEditingBookId(null);
      setEditBookTitle('');
      setEditBookAuthor('');
      await loadBookLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveBookFromList = async (bookId: number) => {
    if (editingListId == null || !confirm('Remove this book from the list?')) return;
    try {
      await api.adminRemoveBookFromList(editingListId, bookId);
      if (editingList) {
        setEditingList({
          ...editingList,
          books: (editingList.books || []).filter((b) => b.id !== bookId),
        });
      }
      await loadBookLists();
      loadQuizQuestions(editingListId);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await api.adminGetTeams();
      setTeams(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamInviteCodeId === '') return;
    try {
      await api.adminCreateTeam(newTeamName.trim(), Number(newTeamInviteCodeId));
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamInviteCodeId('');
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openViewTeam = async (id: number) => {
    try {
      const team = await api.adminGetTeam(id);
      setViewingTeam(team);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditTeam = async (team: Team) => {
    try {
      const full = await api.adminGetTeam(team.id);
      setEditingTeam(full);
      setEditTeamName(full.name);
      setEditTeamInviteCodeId(full.invite_code_id ?? '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || editTeamInviteCodeId === '') return;
    try {
      await api.adminUpdateTeam(editingTeam.id, {
        name: editTeamName.trim(),
        invite_code_id: Number(editTeamInviteCodeId),
      });
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetTeamLead = async (userId: number | null) => {
    if (!editingTeam) return;
    try {
      await api.adminUpdateTeam(editingTeam.id, { team_lead_id: userId ?? null });
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !newTeammateUsername.trim()) return;
    try {
      await api.adminCreateTeamUser(editingTeam.id, {
        username: newTeammateUsername.trim(),
        role: 'teammate',
        pin: newTeammatePin.trim() || undefined,
      });
      setNewTeammateUsername('');
      setNewTeammatePin('');
      setShowAddTeammate(false);
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTeamLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingTeam ||
      !newTeamLeadUsername.trim() ||
      !newTeamLeadEmail.trim() ||
      !newTeamLeadPassword ||
      newTeamLeadPassword.length < 6
    )
      return;
    try {
      await api.adminCreateTeamUser(editingTeam.id, {
        username: newTeamLeadUsername.trim(),
        email: newTeamLeadEmail.trim(),
        role: 'team_lead',
        password: newTeamLeadPassword,
      });
      setNewTeamLeadUsername('');
      setNewTeamLeadEmail('');
      setNewTeamLeadPassword('');
      setShowAddTeamLead(false);
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAssignExistingLead = async () => {
    if (!showAssignExistingLead) {
      try {
        const leads = await api.adminGetTeamLeads();
        setAllTeamLeads(leads);
      } catch (err) {
        console.error(err);
      }
    }
    setShowAssignExistingLead(!showAssignExistingLead);
  };

  const handleAssignExistingLead = async (userId: number) => {
    if (!editingTeam) return;
    setAssignLeadLoading(true);
    try {
      await api.adminAssignExistingLead(editingTeam.id, userId);
      setShowAssignExistingLead(false);
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLeadLoading(false);
    }
  };

  const handleUpdateMemberUsername = async (userId: number, username: string) => {
    if (!editingTeam) return;
    try {
      await api.adminUpdateTeamUser(editingTeam.id, userId, { username: username.trim() });
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      setEditingMemberId(null);
      setEditMemberUsername('');
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!editingTeam || !confirm('Remove this user from the team? This cannot be undone.')) return;
    try {
      await api.adminDeleteTeamUser(editingTeam.id, userId);
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      setEditingMemberId(null);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const clearCredentialResetState = () => {
    setResettingCredentialUserId(null);
    setResetNewPassword('');
    setResetNewPin('');
    setCredentialSuccessMessage(null);
    setCredentialError('');
  };

  const handleResetCredential = async (e: React.FormEvent, userId: number, isTeamLead: boolean) => {
    e.preventDefault();
    if (!editingTeam) return;
    setCredentialError('');
    setCredentialLoading(true);
    try {
      if (isTeamLead) {
        if (!resetNewPassword.trim() || resetNewPassword.length < 6) {
          setCredentialError('Password must be at least 6 characters');
          setCredentialLoading(false);
          return;
        }
        await api.adminResetTeamUserCredential(editingTeam.id, userId, { new_password: resetNewPassword });
        setCredentialSuccessMessage('Password updated successfully.');
      } else {
        const body = resetNewPin.replace(/\D/g, '').length === 4
          ? { new_pin: resetNewPin.replace(/\D/g, '') }
          : {};
        const res = await api.adminResetTeamUserCredential(editingTeam.id, userId, body);
        if (res.pin) {
          setCredentialSuccessMessage(`New PIN: ${res.pin} — copy it; it won't be shown again.`);
        } else {
          setCredentialSuccessMessage('PIN updated successfully.');
        }
      }
      setResettingCredentialUserId(null);
      setResetNewPassword('');
      setResetNewPin('');
      setCredentialError('');
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && typeof (err as { response?: { data?: { errors?: string[] } } }).response?.data?.errors === 'object'
        ? ((err as { response: { data: { errors: string[] } } }).response.data.errors?.join(', ') || 'Failed to reset credential')
        : 'Failed to reset credential';
      setCredentialError(msg);
    } finally {
      setCredentialLoading(false);
    }
  };

  const handlePromoteToTeamLead = async (userId: number) => {
    if (!editingTeam) return;
    try {
      await api.adminUpdateTeamUser(editingTeam.id, userId, { role: 'team_lead' });
      const updated = await api.adminGetTeam(editingTeam.id);
      setEditingTeam(updated);
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Delete this team? This will remove the team and its members and books.')) return;
    try {
      await api.adminDeleteTeam(id);
      setViewingTeam((t) => (t?.id === id ? null : t));
      setEditingTeam((t) => (t?.id === id ? null : t));
      await loadTeams();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const handleViewAsTeammate = async () => {
    setDemoError('');
    setDemoLoading(true);
    try {
      const data = await api.adminGetDemoTeammateSession();
      flushSync(() => setDemoSession(data));
      navigate('/team/dashboard');
    } catch (err: unknown) {
      setDemoError(err instanceof Error ? err.message : 'Could not start teammate demo. Run API seeds if needed.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCreateInviteCode(newCodeName, newCodeCustom || undefined);
    setShowCreateModal(false);
    setNewCodeName('');
    setNewCodeCustom('');
    loadData();
  };

  const toggleCodeActive = async (id: number, active: boolean) => {
    await api.adminUpdateInviteCode(id, { active: !active });
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight">Battle of the Books – Admin</h1>
          <div className="flex items-center gap-3">
            {demoError && (
              <span className="text-sm text-red-600" role="alert">{demoError}</span>
            )}
            <button
              type="button"
              onClick={handleViewAsTeammate}
              disabled={demoLoading}
              className="px-3 py-2 text-sm font-medium text-primary-700 rounded-lg border border-primary-300 bg-primary-50 hover:bg-primary-100 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition disabled:opacity-50"
            >
              {demoLoading ? 'Loading…' : 'View as teammate'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-stone-700 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-2xl shadow border-l-4 border-primary-500">
            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Total Teams</div>
            <div className="mt-1 text-3xl font-bold text-stone-900">{stats?.total_teams ?? 0}</div>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow border-l-4 border-primary-500">
            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Team Leads</div>
            <div className="mt-1 text-3xl font-bold text-stone-900">{stats?.total_team_leads ?? 0}</div>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow border-l-4 border-primary-500">
            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Teammates</div>
            <div className="mt-1 text-3xl font-bold text-stone-900">{stats?.total_teammates ?? 0}</div>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow border-l-4 border-primary-500">
            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Books Assigned</div>
            <div className="mt-1 text-3xl font-bold text-stone-900">{stats?.total_assignments ?? 0}</div>
          </div>
        </div>
        {stats && (
          <div className="p-6 mb-8 bg-white rounded-2xl shadow">
            <h2 className="mb-4 text-lg font-semibold text-stone-900">Reading Progress</h2>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <div className="flex flex-col items-center rounded-lg bg-amber-50 px-6 py-4 min-w-[7rem]">
                <div className="text-3xl font-bold text-amber-600">{stats.assignments_by_status.assigned}</div>
                <div className="text-sm font-medium text-stone-600">Not Started</div>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-primary-50 px-6 py-4 min-w-[7rem]">
                <div className="text-3xl font-bold text-primary-600">{stats.assignments_by_status.in_progress}</div>
                <div className="text-sm font-medium text-stone-600">In Progress</div>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-emerald-50 px-6 py-4 min-w-[7rem]">
                <div className="text-3xl font-bold text-emerald-600">{stats.assignments_by_status.completed}</div>
                <div className="text-sm font-medium text-stone-600">Completed</div>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow">
            <div className="flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50/50">
              <h2 className="text-lg font-semibold text-stone-900">Invite Codes</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
              >
                + New Code
              </button>
            </div>
            <div className="p-4">
              {codes.map((code) => (
                <div key={code.id} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 font-mono text-sm font-semibold bg-stone-100 rounded text-stone-800">
                      {code.code}
                    </code>
                    <span className="text-stone-600">{code.name}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-stone-500">{code.uses_count} uses</span>
                    <button
                      type="button"
                      onClick={() => toggleCodeActive(code.id, code.active)}
                      className={`px-2 py-1 rounded text-xs font-medium focus:ring-2 focus:ring-offset-1 outline-none ${code.active ? 'bg-emerald-100 text-emerald-800 focus:ring-emerald-300' : 'bg-red-100 text-red-800 focus:ring-red-300'}`}
                    >
                      {code.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
              {codes.length === 0 && <p className="py-6 text-center text-stone-500">No invite codes yet</p>}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow">
            <div className="flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50/50">
              <h2 className="text-lg font-semibold text-stone-900">Teams</h2>
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
              >
                + New team
              </button>
            </div>
            <div className="p-4">
              {teams.map((team) => (
                <div key={team.id} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-stone-900">{team.name}</span>
                    {team.team_lead && <span className="ml-2 text-stone-600">({team.team_lead.username})</span>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-stone-500">{team.teammate_count} members</span>
                    <button
                      type="button"
                      onClick={() => openViewTeam(team.id)}
                      className="px-2 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded focus:ring-2 focus:ring-primary outline-none transition"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTeam(team)}
                      className="px-2 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded focus:ring-2 focus:ring-primary outline-none transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded focus:ring-2 focus:ring-red outline-none transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="py-6 text-center text-stone-500">No teams yet</p>}
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white rounded-2xl shadow">
          <div className="flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50/50">
            <h2 className="text-lg font-semibold text-stone-900">Book lists (Groups)</h2>
            <button
              type="button"
              onClick={() => setShowCreateListModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
            >
              + New book list
            </button>
          </div>
          <div className="p-4">
            {bookLists.length === 0 ? (
              <p className="py-6 text-center text-stone-500">No book lists yet. Create one so Team Leads can choose a group.</p>
            ) : (
              <div className="space-y-2">
                {bookLists.map((list) => (
                  <div
                    key={list.id}
                    className="flex justify-between items-center py-3 px-4 rounded-lg border border-stone-100 hover:bg-stone-50/50"
                  >
                    <div>
                      <span className="font-medium text-stone-900">{list.name}</span>
                      <span className="ml-2 text-sm text-stone-500">
                        {(list.books?.length ?? list.book_count ?? 0)} books
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditList(list.id)}
                        className="px-2 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded focus:ring-2 focus:ring-primary outline-none transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteList(list.id)}
                        className="px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded focus:ring-2 focus:ring-red outline-none transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-stone-900">Create Invite Code</h2>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label htmlFor="code-name" className="block mb-1 text-sm font-medium text-stone-700">
                  Name *
                </label>
                <input
                  id="code-name"
                  type="text"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  placeholder="e.g., Lincoln Elementary 2025"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="code-custom" className="block mb-1 text-sm font-medium text-stone-700">
                  Custom Code (optional)
                </label>
                <input
                  id="code-custom"
                  type="text"
                  value={newCodeCustom}
                  onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase())}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg font-mono transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-stone-900">New team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label htmlFor="team-name" className="block mb-1 text-sm font-medium text-stone-700">
                  Name *
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Lincoln Elementary 5th Grade"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="team-invite-code" className="block mb-1 text-sm font-medium text-stone-700">
                  Invite code *
                </label>
                <select
                  id="team-invite-code"
                  value={newTeamInviteCodeId}
                  onChange={(e) => setNewTeamInviteCodeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                >
                  <option value="">Select invite code</option>
                  {codes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateTeamModal(false); setNewTeamName(''); setNewTeamInviteCodeId(''); }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900">Team details</h2>
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="text-stone-500 hover:text-stone-700 focus:ring-2 focus:ring-primary outline-none rounded"
              >
                Close
              </button>
            </div>
            <dl className="space-y-2">
              <div><dt className="text-sm font-medium text-stone-500">Name</dt><dd className="text-stone-900">{viewingTeam.name}</dd></div>
              <div><dt className="text-sm font-medium text-stone-500">Invite code</dt><dd className="text-stone-900">{viewingTeam.invite_code ?? '—'}</dd></div>
              <div><dt className="text-sm font-medium text-stone-500">Team lead</dt><dd className="text-stone-900">{viewingTeam.team_lead ? viewingTeam.team_lead.username : '—'}</dd></div>
              <div><dt className="text-sm font-medium text-stone-500">Teammates</dt><dd className="text-stone-900">{viewingTeam.teammate_count} members</dd></div>
            </dl>
            {viewingTeam.teammates && viewingTeam.teammates.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-stone-700 mb-2">Members</h3>
                <ul className="space-y-1">
                  {viewingTeam.teammates.map((u) => (
                    <li key={u.id} className="text-sm text-stone-900">{u.username}</li>
                  ))}
                </ul>
              </div>
            )}
            {viewingTeam.books && viewingTeam.books.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-stone-700 mb-2">Books</h3>
                <ul className="space-y-1">
                  {viewingTeam.books.map((b) => (
                    <li key={b.id} className="text-sm text-stone-900">{b.title}{b.author ? ` — ${b.author}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => { setViewingTeam(null); openEditTeam(viewingTeam); }}
                className="px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 focus:ring-2 focus:ring-primary outline-none transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => { handleDeleteTeam(viewingTeam.id); setViewingTeam(null); }}
                className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red outline-none transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8 bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-stone-900">Edit team</h2>
            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div>
                <label htmlFor="edit-team-name" className="block mb-1 text-sm font-medium text-stone-700">
                  Name *
                </label>
                <input
                  id="edit-team-name"
                  type="text"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-team-invite-code" className="block mb-1 text-sm font-medium text-stone-700">
                  Invite code *
                </label>
                <select
                  id="edit-team-invite-code"
                  value={editTeamInviteCodeId}
                  onChange={(e) => setEditTeamInviteCodeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                >
                  <option value="">Select invite code</option>
                  {codes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditingTeam(null); setEditTeamName(''); setEditTeamInviteCodeId(''); setShowAddTeammate(false); setShowAddTeamLead(false); setEditingMemberId(null); clearCredentialResetState(); }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Save name & invite code
                </button>
              </div>
            </form>

            {(credentialSuccessMessage || credentialError) && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${credentialError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`} role="alert">
                {credentialSuccessMessage ?? credentialError}
                <button type="button" onClick={() => { setCredentialSuccessMessage(null); setCredentialError(''); }} className="ml-2 underline focus:ring-2 focus:ring-primary outline-none rounded">Dismiss</button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-stone-200">
              <h3 className="text-sm font-semibold text-stone-800 mb-2">Team lead</h3>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <select
                  value={editingTeam.team_lead?.id ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    handleSetTeamLead(v === '' ? null : Number(v));
                  }}
                  className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="">No team lead</option>
                  {[
                    ...(editingTeam.team_lead ? [editingTeam.team_lead] : []),
                    ...(editingTeam.teammates ?? []),
                  ].map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}{editingTeam.team_lead?.id === u.id ? ' (team lead)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowAddTeamLead(!showAddTeamLead); setShowAssignExistingLead(false); }}
                  className="px-2 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                >
                  {showAddTeamLead ? 'Cancel' : '+ Add new team lead'}
                </button>
                <button
                  type="button"
                  onClick={() => { handleToggleAssignExistingLead(); setShowAddTeamLead(false); }}
                  className="px-2 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                >
                  {showAssignExistingLead ? 'Cancel' : '+ Assign existing lead'}
                </button>
                {editingTeam.team_lead && resettingCredentialUserId !== editingTeam.team_lead.id && (
                  <button
                    type="button"
                    onClick={() => { setResettingCredentialUserId(editingTeam.team_lead!.id); setCredentialSuccessMessage(null); setCredentialError(''); }}
                    className="px-2 py-1.5 text-sm font-medium text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50"
                  >
                    Reset password
                  </button>
                )}
              </div>
              {editingTeam.team_lead && resettingCredentialUserId === editingTeam.team_lead.id && (
                <form onSubmit={(e) => handleResetCredential(e, editingTeam.team_lead!.id, true)} className="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                  <label className="block text-xs font-medium text-stone-700">New password (min 6 characters)</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="New password"
                    minLength={6}
                    className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={credentialLoading} className="px-2 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50">Save password</button>
                    <button type="button" onClick={clearCredentialResetState} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">Cancel</button>
                  </div>
                </form>
              )}
              {showAddTeamLead && (
                <form onSubmit={handleAddTeamLead} className="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                  <input
                    type="text"
                    value={newTeamLeadUsername}
                    onChange={(e) => setNewTeamLeadUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                    required
                  />
                  <input
                    type="email"
                    value={newTeamLeadEmail}
                    onChange={(e) => setNewTeamLeadEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                    required
                  />
                  <input
                    type="password"
                    value={newTeamLeadPassword}
                    onChange={(e) => setNewTeamLeadPassword(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    minLength={6}
                    className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-2 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700">Add team lead</button>
                    <button type="button" onClick={() => { setShowAddTeamLead(false); setNewTeamLeadUsername(''); setNewTeamLeadEmail(''); setNewTeamLeadPassword(''); }} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">Cancel</button>
                  </div>
                </form>
              )}
              {showAssignExistingLead && (
                <div className="mt-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
                  <label className="block text-xs font-medium text-stone-700">Select an existing team lead</label>
                  {(() => {
                    const teamUserEmails = new Set([
                      ...(editingTeam.team_lead ? [editingTeam.team_lead.email] : []),
                      ...(editingTeam.teammates ?? []).map((u) => u.email),
                    ].filter(Boolean));
                    const available = allTeamLeads.filter(
                      (l) => !teamUserEmails.has(l.email) && l.team_id !== editingTeam.id
                    );
                    const uniqueByEmail = available.filter(
                      (l, i, arr) => arr.findIndex((x) => x.email === l.email) === i
                    );
                    if (uniqueByEmail.length === 0) {
                      return <p className="text-sm text-stone-500">No available team leads to assign.</p>;
                    }
                    return (
                      <div className="space-y-1">
                        {uniqueByEmail.map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            disabled={assignLeadLoading}
                            onClick={() => handleAssignExistingLead(lead.id)}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg border border-indigo-100 bg-white hover:bg-indigo-50 transition disabled:opacity-50"
                          >
                            <span className="font-medium text-stone-900">{lead.username}</span>
                            <span className="text-stone-500 ml-1">({lead.email})</span>
                            <span className="text-stone-400 ml-1">-- leads: {lead.team_name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  <button type="button" onClick={() => setShowAssignExistingLead(false)} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">Cancel</button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-stone-200">
              <h3 className="text-sm font-semibold text-stone-800 mb-2">Team members (teammates)</h3>
              <ul className="space-y-2 mb-2">
                {(editingTeam.teammates ?? []).map((u) => (
                  <li key={u.id} className="flex flex-col gap-2 py-2 px-3 rounded border border-stone-100 bg-stone-50/50">
                    {editingMemberId === u.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleUpdateMemberUsername(u.id, editMemberUsername); }}
                        className="flex flex-1 gap-2"
                      >
                        <input
                          type="text"
                          value={editMemberUsername}
                          onChange={(e) => setEditMemberUsername(e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-sm"
                        />
                        <button type="submit" className="px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded">Save</button>
                        <button type="button" onClick={() => { setEditingMemberId(null); setEditMemberUsername(''); }} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded">Cancel</button>
                      </form>
                    ) : resettingCredentialUserId === u.id ? (
                      <form onSubmit={(e) => handleResetCredential(e, u.id, false)} className="p-2 rounded bg-white border border-stone-200 space-y-2">
                        <label className="block text-xs font-medium text-stone-700">New PIN (4 digits) or leave blank to generate random</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={resetNewPin}
                          onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="0000"
                          maxLength={4}
                          className="w-24 px-2 py-1.5 border border-stone-300 rounded text-sm font-mono"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <button type="submit" disabled={credentialLoading} className="px-2 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50">
                            {resetNewPin.replace(/\D/g, '').length === 4 ? 'Set PIN' : 'Generate random PIN'}
                          </button>
                          <button type="button" onClick={clearCredentialResetState} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-stone-900">{u.username}</span>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => handlePromoteToTeamLead(u.id)} className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded">Make team lead</button>
                            <button type="button" onClick={() => { setEditingMemberId(u.id); setEditMemberUsername(u.username); }} className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded">Edit</button>
                            <button type="button" onClick={() => { setResettingCredentialUserId(u.id); setCredentialSuccessMessage(null); setCredentialError(''); }} className="px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded">Reset PIN</button>
                            <button type="button" onClick={() => handleRemoveMember(u.id)} className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded">Remove</button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {!showAddTeammate ? (
                <button
                  type="button"
                  onClick={() => setShowAddTeammate(true)}
                  className="px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                >
                  + Add teammate
                </button>
              ) : (
                <form onSubmit={handleAddTeammate} className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                  <input
                    type="text"
                    value={newTeammateUsername}
                    onChange={(e) => setNewTeammateUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                    required
                  />
                  <input
                    type="text"
                    value={newTeammatePin}
                    onChange={(e) => setNewTeammatePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="PIN (4 digits, optional)"
                    maxLength={4}
                    className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-2 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700">Add teammate</button>
                    <button type="button" onClick={() => { setShowAddTeammate(false); setNewTeammateUsername(''); setNewTeammatePin(''); }} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {showCreateListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-stone-900">New book list</h2>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label htmlFor="list-name" className="block mb-1 text-sm font-medium text-stone-700">
                  Name *
                </label>
                <input
                  id="list-name"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Medium 20 Book List 3-4 Grades 2025-26"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateListModal(false); setNewListName(''); }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingListId != null && editingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900">Edit book list</h2>
              <button
                type="button"
                onClick={() => { setEditingListId(null); setEditingList(null); setEditingBookId(null); closeQuizQuestionsModal(); }}
                className="text-stone-500 hover:text-stone-700 focus:ring-2 focus:ring-primary outline-none rounded"
              >
                Close
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="edit-list-name" className="block mb-1 text-sm font-medium text-stone-700">
                List name
              </label>
              <div className="flex gap-2">
                <input
                  id="edit-list-name"
                  type="text"
                  value={editingList.name}
                  onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                  onBlur={() => handleUpdateListName(editingList.id, editingList.name)}
                  className="flex-1 px-3 py-2.5 border border-stone-300 rounded-lg transition focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-stone-700 mb-2">Books</h3>
              <form onSubmit={handleAddBookToList} className="flex flex-wrap gap-2 mb-3">
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Title"
                  className="flex-1 min-w-[8rem] px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <input
                  type="text"
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  placeholder="Author"
                  className="flex-1 min-w-[8rem] px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary outline-none transition"
                >
                  Add book
                </button>
              </form>
              <ul className="space-y-2">
                {(editingList.books || []).map((book: BookListItem) => (
                  <li key={book.id} className="flex justify-between items-center py-2 px-3 rounded border border-stone-100 bg-stone-50/50">
                    {editingBookId === book.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleUpdateBookInList(book.id, editBookTitle, editBookAuthor); }}
                        className="flex flex-1 gap-2 flex-wrap"
                      >
                        <input
                          type="text"
                          value={editBookTitle}
                          onChange={(e) => setEditBookTitle(e.target.value)}
                          placeholder="Title"
                          className="flex-1 min-w-[6rem] px-2 py-1.5 border border-stone-300 rounded text-sm outline-none"
                        />
                        <input
                          type="text"
                          value={editBookAuthor}
                          onChange={(e) => setEditBookAuthor(e.target.value)}
                          placeholder="Author"
                          className="flex-1 min-w-[6rem] px-2 py-1.5 border border-stone-300 rounded text-sm outline-none"
                        />
                        <button type="submit" className="px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded">Save</button>
                        <button type="button" onClick={() => { setEditingBookId(null); setEditBookTitle(''); setEditBookAuthor(''); }} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded">Cancel</button>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-stone-900">{book.title}</span>
                          {book.author && <span className="text-sm text-stone-600 ml-2">— {book.author}</span>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setEditingBookId(book.id); setEditBookTitle(book.title); setEditBookAuthor(book.author || ''); }}
                            className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBookFromList(book.id)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {(editingList.books?.length ?? 0) === 0 && (
                <p className="py-2 text-sm text-stone-500">No books in this list yet. Add one above.</p>
              )}
            </div>
            <div className="mb-4 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={openQuizQuestionsModal}
                disabled={(editingList.books?.length ?? 0) === 0}
                className="px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 focus:ring-2 focus:ring-primary outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Manage quiz questions
              </button>
              {(editingList.books?.length ?? 0) === 0 && (
                <p className="mt-2 text-xs text-stone-500">Add books to this list first.</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleDeleteList(editingList.id)}
                className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red outline-none transition"
              >
                Delete this list
              </button>
            </div>
          </div>
        </div>
      )}
      {showQuizQuestionsModal && editingListId != null && editingList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-stone-200 shrink-0">
              <h2 className="text-xl font-bold text-stone-900">Quiz questions</h2>
              <button
                type="button"
                onClick={closeQuizQuestionsModal}
                className="text-stone-500 hover:text-stone-700 focus:ring-2 focus:ring-primary outline-none rounded px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm text-stone-600 mb-4">
                Add &quot;In which book…?&quot; questions and choose the correct book (answer) for each.
              </p>
              {(editingList.books?.length ?? 0) === 0 ? (
                <p className="py-2 text-sm text-stone-500">Add books to this list first, then add questions.</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAddQuestion(!showAddQuestion)}
                    className="px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 focus:ring-2 focus:ring-primary outline-none transition mb-4"
                  >
                    {showAddQuestion ? 'Cancel' : '+ Add question'}
                  </button>
                  {showAddQuestion && (
                    <form onSubmit={handleAddQuestion} className="mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">Question</label>
                        <textarea
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          placeholder="In which book does..."
                          rows={2}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">Correct answer (book)</label>
                        <select
                          value={newQuestionCorrectBookId}
                          onChange={(e) => setNewQuestionCorrectBookId(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        >
                          <option value="">Select book</option>
                          {(editingList.books || []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title}{b.author ? ` — ${b.author}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="px-2 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700">
                          Save question
                        </button>
                        <button type="button" onClick={() => { setShowAddQuestion(false); setNewQuestionText(''); setNewQuestionCorrectBookId(''); }} className="px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  {quizQuestionsLoading ? (
                    <p className="py-4 text-sm text-stone-500">Loading questions…</p>
                  ) : quizQuestions.length === 0 ? (
                    <p className="py-4 text-sm text-stone-500">No questions yet. Add one above.</p>
                  ) : (
                    <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                      {quizQuestions.map((q) => (
                        <li key={q.id} className="py-2 px-3 rounded border border-stone-100 bg-stone-50/50 text-sm">
                          {editingQuestionId === q.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateQuestion(q.id, editQuestionText, Number(editQuestionCorrectBookId));
                              }}
                              className="space-y-2"
                            >
                              <textarea
                                value={editQuestionText}
                                onChange={(e) => setEditQuestionText(e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm outline-none"
                                required
                              />
                              <select
                                value={editQuestionCorrectBookId}
                                onChange={(e) => setEditQuestionCorrectBookId(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
                                required
                              >
                                <option value="">Select book</option>
                                {(editingList.books || []).map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.title}{b.author ? ` — ${b.author}` : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-1">
                                <button type="submit" className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded">Save</button>
                                <button type="button" onClick={() => { setEditingQuestionId(null); setEditQuestionText(''); setEditQuestionCorrectBookId(''); }} className="px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="text-stone-900">{q.question_text}</div>
                              <div className="mt-1 text-stone-600 text-xs">
                                Correct answer: <span className="font-medium">{q.correct_book_list_item?.title ?? '—'}</span>
                                {q.correct_book_list_item?.author && <span> — {q.correct_book_list_item.author}</span>}
                              </div>
                              <div className="mt-2 flex gap-1">
                                <button type="button" onClick={() => startEditQuestion(q)} className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded">Edit</button>
                                <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded">Delete</button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
