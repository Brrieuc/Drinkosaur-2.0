import React, { useState, useEffect, useCallback } from 'react';
import { Background } from './components/Background';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';
import { AddDrink } from './components/AddDrink';
import { DrinkList } from './components/DrinkList';
import { Social } from './components/Social';
import { OnboardingTour } from './components/OnboardingTour';
import { FriendProfileModal } from './components/FriendProfileModal';
import { AppView, Drink, UserProfile } from './types';
import { LayoutDashboard, PlusCircle, History, User, CheckCircle, AlertOctagon, Users } from 'lucide-react';
import { useUser } from './hooks/useUser';
import { useDrinks } from './hooks/useDrinks';
import { useSocial } from './hooks/useSocial';
import useBacCalculator from './hooks/useBacCalculator';

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
    addFriendByUsername,
    respondToRequest,
    removeFriend,
    refreshSocial,
    suggestions,
    getSuggestions,
    fetchFriendData,
    loading: socialLoading
  } = useSocial(bacStatus, user as UserProfile);

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

  const getHistoryData = useCallback(() => {
    if (drinks.length === 0) return [];
    const points = [];
    const now = Date.now();
    for (let i = 4; i >= 0; i--) {
      const t = now - (i * 60 * 60 * 1000);
      points.push({ time: t, bac: 0 });
    }
    return points;
  }, [drinks]);


  // -- Navigation Bar --
  const navText = {
    history: user.language === 'fr' ? 'Historique' : 'History',
    monitor: user.language === 'fr' ? 'Moniteur' : 'Monitor',
    social: user.language === 'fr' ? 'Amis' : 'Friends',
    add: user.language === 'fr' ? 'Ajouter' : 'Add Drink',
    settings: user.language === 'fr' ? 'Paramètres' : 'Settings'
  };

  const NavButton = ({ target, icon: Icon, label }: { target: AppView, icon: any, label: string }) => (
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
      {view === target && (
        <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_white]" />
      )}
    </button>
  );

  return (
    <div
      className="relative w-full h-screen text-white overflow-hidden flex flex-col font-sans selection:bg-fuchsia-500/30"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <Background />

      {/* ONBOARDING TOUR */}
      {user.isSetup && !user.hasSeenTour && (
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
          />
        )}

        {view === AppView.SOCIAL && (
          <>
            <Social
              friends={friends}
              requests={incomingRequests}
              myProfile={user as UserProfile}
              myBac={bacStatus}
              onAddFriend={addFriendByUsername}
              onRespondRequest={respondToRequest}
              onRemoveFriend={removeFriend}
              onRefresh={refreshSocial}
              onSelectFriend={handleSelectFriend}
              suggestions={suggestions}
              onFetchSuggestions={getSuggestions}
              loading={socialLoading}
              language={user.language}
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
            historyData={getHistoryData()}
            language={user.language}
            drinks={drinks}
            user={user as UserProfile}
          />
        )}

        {view === AppView.ADD_DRINK && (
          <AddDrink onAdd={handleAddDrink} onClose={() => setView(AppView.DASHBOARD)} language={user.language} />
        )}

        {view === AppView.HISTORY && (
          <DrinkList drinks={drinks} onRemove={handleRemoveDrink} language={user.language} />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      {user.isSetup && (
        <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="glass-panel-3d rounded-[32px] p-2 flex items-center gap-1 shadow-2xl backdrop-blur-xl pointer-events-auto">
            <NavButton target={AppView.HISTORY} icon={History} label={navText.history} />
            <NavButton target={AppView.DASHBOARD} icon={LayoutDashboard} label={navText.monitor} />

            <div className="mx-1">
              <button
                onClick={() => setView(AppView.ADD_DRINK)}
                aria-label={navText.add}
                className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-white to-gray-200 text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all border-4 border-white/10"
              >
                <PlusCircle size={28} className="text-black/80" strokeWidth={2.5} />
              </button>
            </div>

            <NavButton target={AppView.SOCIAL} icon={Users} label={navText.social} />
            <NavButton target={AppView.SETTINGS} icon={User} label={navText.settings} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
