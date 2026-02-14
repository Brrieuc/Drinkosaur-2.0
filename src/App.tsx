import React, { useState, useEffect } from 'react';
import { Background } from './components/Background';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';
import { AddDrink } from './components/AddDrink';
import { DrinkList } from './components/DrinkList';
import { Social } from './components/Social';
import { OnboardingTour } from './components/OnboardingTour';
import { InstallPwaGuide } from './components/InstallPwaGuide';
import { FriendProfileModal } from './components/FriendProfileModal';
import { GlobalDashboard } from './components/GlobalDashboard';
import { AppView, Drink, UserProfile } from './types';
import { LayoutDashboard, PlusCircle, History, User, CheckCircle, AlertOctagon, Users, Loader2, X, Mail } from 'lucide-react';
import { useUser } from './hooks/useUser';
import { useDrinks } from './hooks/useDrinks';
import { useSocial } from './hooks/useSocial';
import { useGroups } from './hooks/useGroups';
import { useAuth } from './hooks/useAuth';
import useBacCalculator from './hooks/useBacCalculator';
import { useAwards } from './hooks/useAwards';
import { ComputedAward } from './constants/awards';
import { useAwardNotifications } from './hooks/useAwardNotifications';
import { useGlobalStats } from './hooks/useGlobalStats';
import { HelmetProvider } from 'react-helmet-async';

const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'warning' }) => (
  <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-bounce-in flex items-center gap-3 ${type === 'warning' ? 'bg-red-500/20 border-red-500/30 text-red-100' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100'
    }`}>
    {type === 'warning' ? <AlertOctagon size={20} /> : <CheckCircle size={20} />}
    <span className="font-bold text-sm text-center">{message}</span>
  </div>
);

const App: React.FC = () => {
  // -- State --
  const [view, setView] = useState<AppView>(AppView.SETTINGS);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'warning' } | null>(null);
  const { user: authUser } = useAuth();

  // Custom Hooks
  const [user, saveUser, uploadAvatar] = useUser();
  const [drinks, setDrinks] = useDrinks();
  const { bacStatus, statusChangeToast } = useBacCalculator(drinks, user as UserProfile);

  const [selectedFriend, setSelectedFriend] = useState<{
    status: any;
    profile: UserProfile;
    drinks: Drink[];
  } | null>(null);

  // Social Hook
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    addFriendByUsername,
    addFriendByUid,
    respondToRequest,
    removeFriend,
    refreshSocial,
    suggestions,
    getSuggestions,
    fetchFriendData,
    cancelRequest,
    loading: socialLoading
  } = useSocial(bacStatus, user as UserProfile, drinks);

  const {
    groups,
    groupInvites,
    createGroup,
    acceptGroupInvite,
    declineGroupInvite,
    leaveGroup,
    fetchGroupMembersStatus,
    inviteMemberToGroup,
    updateGroupIcon,
    updateGroupSettings,
    fetchGroupPendingInvites
  } = useGroups();

  const {
    awards,
    loading: awardsLoading,
    selectedMonth: awardsMonth,
    fetchGroupAwards,
    claimAward,
    appLaunch
  } = useAwards();

  const {
    awardNotifications,
    markAwardAsRead,
    unreadAwardCount
  } = useAwardNotifications(groups);

  const {
    liveStats,
    monthlyStats,
    loadingLive,
    loadingMonthly,
    fetchLiveStats,
    fetchMonthlyStats,
  } = useGlobalStats();

  const handleSelectFriend = async (uid: string) => {
    const friendStatus = friends.find(f => f.uid === uid);
    if (!friendStatus) return;

    try {
      const data = await fetchFriendData(uid);
      setSelectedFriend({
        status: friendStatus,
        profile: data.profile,
        drinks: data.drinks
      });
    } catch (err) {
      console.error(err);
      setToast({ msg: 'Error loading friend profile', type: 'warning' });
    }
  };

  const { signIn, signInAnonymous, signInWithEmail, signUpWithEmail, loading: authLoading, error: authError } = useAuth();
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // -- Rendering Logic Gate (moved below hooks) --





  // Handle toast from BAC changes
  useEffect(() => {
    if (statusChangeToast) {
      setToast(statusChangeToast);
      setTimeout(() => setToast(null), 5000);
    }
  }, [statusChangeToast]);

  // Handle Invitation Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      sessionStorage.setItem('pending_referral', refParam);
    }

    const pendingRef = sessionStorage.getItem('pending_referral');

    if (pendingRef && user.isSetup && !socialLoading) {
      const handleReferral = async () => {
        try {
          await addFriendByUsername(pendingRef);
          setToast({
            msg: user.language === 'fr' ? `Demande d'ami envoyée à @${pendingRef} !` : `Friend request sent to @${pendingRef}!`,
            type: 'success'
          });
          sessionStorage.removeItem('pending_referral');
          // Clean up URL if still there
          if (window.location.search.includes('ref=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err: any) {
          // If already friends or request exists, just clear the pending ref
          if (err.message === "Already friends" || err.message === "Request already sent") {
            sessionStorage.removeItem('pending_referral');
          } else {
            console.error("Referral error:", err);
          }
        }
      };

      handleReferral();
    }
  }, [user.isSetup, socialLoading, addFriendByUsername]);



  // -- Effects --
  useEffect(() => {
    if (user.isSetup && view === AppView.SETTINGS) {
      setView(AppView.DASHBOARD);
    }
  }, [user.isSetup]);

  // -- SECURITY GATES (Must follow all hooks) --
  if (!authUser && !authLoading) {
    return (
      <div className="relative w-full h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 overflow-hidden">
        <Background />
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-12 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-3xl rounded-[40px] flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.5)] border-4 border-white/20 animate-float mb-4 relative group cursor-pointer hover:border-blue-400/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 group-hover:opacity-100 opacity-0 transition-opacity" />
              <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3GwalK-_8qkiqtJ9wxjVPg7C3VGn-slPe3XK-DNhm4iSq2f0VBeOEjanUW_uoncmzZu74szYMJhs_o8xYV0RU3g-HZTflVBgh9Tj8wSy43r1MiQrgyrp8HIQJyP6wBQu5bT5tFCrLhskSvzeL8flCHnZ6T-7kheSEkcwm6fQuSGZE-LKrBq6KbB_pg4k/s16000/drinkosaur.png" alt="Drinkosaur" className="w-full h-full object-cover scale-110" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">DRINKOSAUR</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Alcoolémie & Amis</p>
          </div>

          <div className="w-full space-y-4">
            {/* Email Auth Form — always visible on mobile, togglable on desktop */}
            {(showEmailAuth || isMobile) ? (
              <div className="w-full bg-white/5 p-6 rounded-[28px] border border-white/10 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-black italic text-xl">{isSignUp ? "Créer un compte" : "Connexion"}</h3>
                  {!isMobile && (
                    <button onClick={() => setShowEmailAuth(false)} className="text-white/30 hover:text-white"><X size={20} /></button>
                  )}
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (isSignUp) signUpWithEmail(email, password);
                  else signInWithEmail(email, password);
                }} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                    required
                    minLength={6}
                  />
                  <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/40 active:scale-95 transition-all">
                    {isSignUp ? "S'inscrire" : "Se connecter"}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] text-white/40 font-bold uppercase tracking-widest hover:text-white transition-colors">
                    {isSignUp ? "J'ai déjà un compte" : "Créer un compte"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop: Google as primary */}
                <button
                  onClick={signIn}
                  className="w-full py-5 bg-white text-black rounded-[24px] font-black text-lg transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  Se connecter avec Google
                </button>
                <button
                  onClick={() => setShowEmailAuth(true)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-[24px] font-bold text-sm transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
                >
                  <Mail size={20} />
                  Adresse Email
                </button>
              </>
            )}

            {/* Guest login + Google fallback on mobile */}
            <div className="flex flex-col gap-3">
              <button
                onClick={signInAnonymous}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-[24px] font-bold text-sm transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
              >
                <User size={20} />
                Continuer en tant qu'invité
              </button>
              {isMobile && (
                <button
                  onClick={signIn}
                  className="text-[10px] text-white/20 font-bold uppercase tracking-widest hover:text-white/40 transition-colors mt-1"
                >
                  Ou se connecter avec Google (desktop recommandé)
                </button>
              )}
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-shake mt-4">
                <p className="text-red-400 text-[10px] font-bold leading-relaxed">{authError}</p>
              </div>
            )}
            <p className="text-[10px] text-white/20 font-medium px-4">
              En vous connectant, vos données sont synchronisées de manière sécurisée sur le cloud.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading && !authUser) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white/20" size={48} />
      </div>
    );
  }

  if (authUser && !user.isSetup) {
    return (
      <div className="relative w-full h-screen bg-[#050505] text-white flex flex-col pt-[env(safe-area-inset-top)]">
        <Background />
        <div className="relative z-10 flex-1 overflow-hidden">
          <Settings
            user={user as UserProfile}
            onSave={async (newProfile) => {
              const result = await saveUser(newProfile);
              if (!result.success) {
                setToast({ msg: result.error || 'Error', type: 'warning' });
                setTimeout(() => setToast(null), 3000);
              }
            }}
            onUploadAvatar={uploadAvatar}
          />
        </div>
        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    );
  }



  // -- Handlers --
  const handleAddDrink = (drink: Drink) => {
    setDrinks(prev => [...prev, drink]);
    setView(AppView.DASHBOARD);

    const msg = user.language === 'fr' ? 'Consommation ajoutée !' : 'Drink logged!';
    setToast({ msg, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveDrink = (id: string) => {
    setDrinks(prev => prev.filter(d => d.id !== id));
  };




  // -- Navigation Bar --
  const navText = {
    history: user.language === 'fr' ? 'Historique' : 'History',
    monitor: user.language === 'fr' ? 'Moniteur' : 'Monitor',
    social: user.language === 'fr' ? 'Amis' : 'Friends',
    globe: user.language === 'fr' ? 'Global' : 'Global',
    add: user.language === 'fr' ? 'Ajouter' : 'Add Drink',
    settings: user.language === 'fr' ? 'Paramètres' : 'Settings'
  };

  const NavButton = ({ target, icon: Icon, label, hasBadge }: { target: AppView, icon: any, label: string, hasBadge?: boolean }) => (
    <button
      onClick={() => setView(target)}
      aria-label={label}
      className={`relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${view === target
        ? 'text-white bg-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)] border border-white/20'
        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
        }`}
    >
      <Icon
        size={22}
        strokeWidth={view === target ? 2.5 : 2}
        className={`transition-transform duration-300 ${view === target ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''}`}
      />
      {hasBadge && (
        <div className="absolute top-2 right-2 flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-[#1a1a2e]"></span>
        </div>
      )}
      {view === target && (
        <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_white]" />
      )}
    </button>
  );

  const hasSocialNotification = incomingRequests.length > 0 || groupInvites.length > 0;
  const hasSettingsNotification = false; // For future config as requested
  const hasHistoryNotification = false;
  const hasDashboardNotification = false; // Already handled in Dashboard header button but adding for Nav too if needed


  return (
    <HelmetProvider>
      <div
        className="relative w-full h-screen text-white overflow-hidden flex flex-col font-sans selection:bg-fuchsia-500/30"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <Background />

        {/* ONBOARDING TOUR */}
        {/* PWA INSTALL GUIDE */}
        {user.isSetup && !user.hasSeenPwaInstallGuide && (
          <InstallPwaGuide
            language={user.language}
            onComplete={() => {
              saveUser({ ...user, hasSeenPwaInstallGuide: true });
            }}
          />
        )}

        {/* ONBOARDING TOUR */}
        {user.isSetup && user.hasSeenPwaInstallGuide && !user.hasSeenTour && (
          <OnboardingTour
            language={user.language}
            onComplete={() => {
              saveUser({ ...user, hasSeenTour: true });
            }}
          />
        )}

        {/* TOAST NOTIFICATION */}
        {toast && <Toast message={toast.msg} type={toast.type} />}

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {view === AppView.SETTINGS && (
            <Settings
              user={user as UserProfile}
              onSave={async (newProfile) => {
                const result = await saveUser(newProfile);
                if (!result.success) {
                  setToast({ msg: result.error || 'Error', type: 'warning' });
                  setTimeout(() => setToast(null), 3000);
                }
              }}
              onUploadAvatar={uploadAvatar}
              wonAwards={user.wonAwards || []}
              selectedBadges={user.selectedBadges || []}
              drinks={drinks}
              onUpdateBadges={async (badges) => {
                const result = await saveUser({ selectedBadges: badges });
                if (result.success) {
                  setToast({ msg: user.language === 'fr' ? 'Badges mis à jour !' : 'Badges updated!', type: 'success' });
                } else {
                  setToast({ msg: result.error || 'Error', type: 'warning' });
                }
                setTimeout(() => setToast(null), 3000);
              }}
            />
          )}

          {view === AppView.SOCIAL && (
            <>
              <Social
                friends={friends}
                requests={incomingRequests}
                myProfile={user as UserProfile}
                myBac={bacStatus}
                myUid={authUser?.uid || ''}
                isAnonymous={(authUser as any)?.isAnonymous}
                onAddFriend={addFriendByUsername}
                onAddFriendByUid={addFriendByUid}
                onRespondRequest={respondToRequest}
                onRemoveFriend={removeFriend}
                onRefresh={refreshSocial}
                onSelectFriend={handleSelectFriend}
                suggestions={suggestions}
                onFetchSuggestions={getSuggestions}
                loading={socialLoading}
                language={user.language}
                groups={groups}
                groupInvites={groupInvites}
                onCreateGroup={createGroup}
                onAcceptGroupInvite={acceptGroupInvite}
                onDeclineGroupInvite={declineGroupInvite}
                onLeaveGroup={leaveGroup}
                onFetchGroupStatus={fetchGroupMembersStatus}
                onInviteToGroup={inviteMemberToGroup}
                onUpdateGroupIcon={updateGroupIcon}
                onUpdateGroupSettings={updateGroupSettings}
                onFetchGroupInvites={fetchGroupPendingInvites}
                awards={awards}
                awardsLoading={awardsLoading}
                awardsMonth={awardsMonth}
                onFetchGroupAwards={(groupId: string, month: number, year: number) => fetchGroupAwards(groupId, month, year, user.language)}
                onClaimAward={(groupId: string, award: ComputedAward) => claimAward(authUser?.uid || '', groupId, award)}
                onOpenGlobal={() => setView(AppView.GLOBE)}
                outgoingRequests={outgoingRequests}
                onCancelRequest={cancelRequest}
                appLaunch={appLaunch}
              />
              {selectedFriend && (
                <FriendProfileModal
                  friend={selectedFriend.status}
                  friendDrinks={selectedFriend.drinks}
                  friendProfile={selectedFriend.profile}
                  onClose={() => setSelectedFriend(null)}
                  language={user.language}
                />
              )}
            </>
          )}

          {view === AppView.DASHBOARD && (
            <Dashboard
              status={bacStatus}
              language={user.language}
              drinks={drinks}
              user={user as UserProfile}
              incomingRequests={incomingRequests}
              groupInvites={groupInvites}
              onRespondRequest={respondToRequest}
              onAcceptGroup={acceptGroupInvite}
              onDeclineGroup={declineGroupInvite}
              awardNotifications={awardNotifications}
              onMarkAwardRead={markAwardAsRead}
              unreadAwardCount={unreadAwardCount}
              awards={awards}
              awardsLoading={awardsLoading}
              awardsMonth={awardsMonth}
              onFetchGroupAwards={(groupId: string, month: number, year: number) => fetchGroupAwards(groupId, month, year, user.language)}
              myUid={authUser?.uid || ''}
            />
          )}

          {view === AppView.GLOBE && (
            <GlobalDashboard
              liveStats={liveStats}
              monthlyStats={monthlyStats}
              loadingLive={loadingLive}
              loadingMonthly={loadingMonthly}
              onFetchLive={() => fetchLiveStats(authUser?.uid || '')}
              onFetchMonthly={() => fetchMonthlyStats(authUser?.uid || '')}
              language={user.language}
              myUid={authUser?.uid || ''}
            />
          )}

          {view === AppView.ADD_DRINK && (
            <AddDrink onAdd={handleAddDrink} onClose={() => setView(AppView.DASHBOARD)} language={user.language} />
          )}

          {view === AppView.HISTORY && (
            <DrinkList drinks={drinks} onRemove={handleRemoveDrink} language={user.language} />
          )}
        </main>

        {/* Gradient Overlay for Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent pointer-events-none z-40" />

        {/* Floating Bottom Navigation */}
        {
          user.isSetup && (
            <div
              className="fixed left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
              style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="glass-panel-3d rounded-[32px] p-2 flex items-center gap-1 shadow-2xl backdrop-blur-xl pointer-events-auto border-white/20">
                <NavButton target={AppView.HISTORY} icon={History} label={navText.history} hasBadge={hasHistoryNotification} />
                <NavButton target={AppView.DASHBOARD} icon={LayoutDashboard} label={navText.monitor} hasBadge={hasDashboardNotification} />

                <div className="mx-1">
                  <button
                    onClick={() => setView(AppView.ADD_DRINK)}
                    aria-label={navText.add}
                    className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-white to-gray-200 text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all border-4 border-white/10"
                  >
                    <PlusCircle size={28} className="text-black/80" strokeWidth={2.5} />
                  </button>
                </div>

                <NavButton target={AppView.SOCIAL} icon={Users} label={navText.social} hasBadge={hasSocialNotification} />
                {/* Global button moved to Social tab header */}
                <NavButton target={AppView.SETTINGS} icon={User} label={navText.settings} hasBadge={hasSettingsNotification} />
              </div>
            </div>
          )
        }
      </div >
    </HelmetProvider>
  );
};

export default App;
