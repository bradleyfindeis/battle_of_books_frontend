import { useTeamDashboard } from './dashboard/useTeamDashboard';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { WelcomeCard } from './dashboard/WelcomeCard';
import { DailyQuestion } from './dashboard/DailyQuestion';
import { ActivitiesSection } from './dashboard/ActivitiesSection';
import { Recommendations } from './dashboard/Recommendations';
import { ReadingProgress, EditProgressModal } from './dashboard/ReadingProgress';
import { TeamReadingGoal } from './dashboard/TeamReadingGoal';
import { WeeklySummary } from './dashboard/WeeklySummary';
import { FeatureLinks } from './dashboard/FeatureLinks';

export function TeamDashboard() {
  const d = useTeamDashboard();

  if (!d.user || !d.team) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader
        user={d.user}
        team={d.team}
        streak={d.streak}
        activeToday={d.activeToday}
        showAvatarPicker={d.showAvatarPicker}
        setShowAvatarPicker={d.setShowAvatarPicker}
        avatarSaving={d.avatarSaving}
        handleSelectAvatar={d.handleSelectAvatar}
        handleSelectAvatarColor={d.handleSelectAvatarColor}
        handleLogout={d.handleLogout}
        handleExitDemo={d.handleExitDemo}
        isDemoMode={d.isDemoMode}
      />

      {d.toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-slide-up-toast"
          role="status"
          aria-live="polite"
        >
          {d.toastMessage}
        </div>
      )}

      <div className="px-4 pb-8 mx-auto max-w-7xl">
        {d.loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
          </div>
        ) : (
          <>
            {d.isNewUser && (
              <div className="animate-fade-in-up stagger-1">
                <WelcomeCard username={d.user.username} onDismiss={d.dismissWelcome} />
              </div>
            )}

            {d.dailyQ && (
              <div className={`animate-fade-in-up stagger-2 transition-opacity duration-500 ${d.dailyDismissing ? 'opacity-0' : ''}`}>
                <DailyQuestion
                  dailyQ={d.dailyQ}
                  dailySelectedId={d.dailySelectedId}
                  setDailySelectedId={d.setDailySelectedId}
                  dailyRevealed={d.dailyRevealed}
                  dailyExpanded={d.dailyExpanded}
                  setDailyExpanded={d.setDailyExpanded}
                  dailySubmitting={d.dailySubmitting}
                  handleDailyAnswer={d.handleDailyAnswer}
                />
              </div>
            )}

            <div className="animate-fade-in-up stagger-3">
              <ActivitiesSection
                team={d.team}
                matchingGameHighScore={d.matchingGameHighScore}
                flashcardDeckTimesCompleted={d.flashcardDeckTimesCompleted}
                quizHighScore={d.quizHighScore}
                sortedTeammates={d.sortedTeammates}
                challengeableTeammates={d.challengeableTeammates}
                onlineUserIds={d.onlineUserIds}
                challengeSubmitting={d.challengeSubmitting}
                onChallenge={d.handleChallenge}
              />
            </div>

            <div className="animate-fade-in-up stagger-4">
              <Recommendations recommendations={d.recommendations} />
            </div>

            {d.user.role !== 'team_lead' && (
              <div className="animate-fade-in-up stagger-5">
                <ReadingProgress
                  myBooks={d.myBooks}
                  onEditProgress={d.openEditProgress}
                />
              </div>
            )}

            {d.teamReading && (
              <div className="animate-fade-in-up stagger-6">
                <TeamReadingGoal
                  teamReading={d.teamReading}
                  currentUserId={d.user.id}
                />
              </div>
            )}

            {d.weeklySummary && (
              <div className="animate-fade-in-up stagger-7">
                <WeeklySummary weeklySummary={d.weeklySummary} />
              </div>
            )}

            <div className="animate-fade-in-up stagger-8">
              <FeatureLinks team={d.team} />
            </div>

            {d.user.role !== 'team_lead' && d.editProgressAssignment && (
              <EditProgressModal
                assignment={d.editProgressAssignment}
                status={d.editProgressStatus}
                setStatus={d.setEditProgressStatus}
                notes={d.editProgressNotes}
                setNotes={d.setEditProgressNotes}
                percent={d.editProgressPercent}
                setPercent={d.setEditProgressPercent}
                submitting={d.editProgressSubmitting}
                error={d.editProgressError}
                onSave={d.handleSaveProgress}
                onClose={d.closeEditProgress}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
