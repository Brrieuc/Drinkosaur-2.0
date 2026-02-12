
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Save, User, Globe, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onSave }) => {
  const [weight, setWeight] = useState(user.weightKg || 70);
  const [gender, setGender] = useState<'male' | 'female'>(user.gender);
  const [language, setLanguage] = useState<'en' | 'fr'>(user.language || 'en');
  const [drinkingSpeed, setDrinkingSpeed] = useState<'slow' | 'average' | 'fast'>(user.drinkingSpeed || 'average');

  // Auth Hook
  const { user: authUser, loading: authLoading, signIn, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = () => {
    onSave({
      weightKg: weight,
      gender,
      language,
      drinkingSpeed,
      isSetup: true
    });
  };

  const handleGoogleLogin = async () => {
    setIsSyncing(true);
    await signIn();
    setIsSyncing(false);
  };

  const t = {
    en: {
      title: "Profile",
      desc: "To accurately estimate your alcohol level (BAC), Drinkosaur needs a few details. This data stays on your device unless you sync.",
      weight: "Weight (kg)",
      sex: "Biological Sex",
      male: "Male",
      female: "Female",
      lang: "Language",
      speed: "Drinking Speed",
      speedDesc: "How fast do you usually finish a drink?",
      slow: "Slow",
      avg: "Average",
      fast: "Fast",
      save: "Save Profile",
      sync: "Cloud Sync",
      syncDesc: "Sign in with Google to save your data across devices.",
      signIn: "Sign in with Google",
      signOut: "Sign Out",
      loggedIn: "Signed in as"
    },
    fr: {
      title: "Profil",
      desc: "Pour estimer votre alcoolémie (BAC), Drinkosaur a besoin de quelques détails. Vos données restent sur votre appareil sauf si vous synchronisez.",
      weight: "Poids (kg)",
      sex: "Sexe Biologique",
      male: "Homme",
      female: "Femme",
      lang: "Langue",
      speed: "Vitesse de consommation",
      speedDesc: "À quelle vitesse finissez-vous un verre ?",
      slow: "Lent",
      avg: "Moyen",
      fast: "Rapide",
      save: "Enregistrer",
      sync: "Synchronisation Cloud",
      syncDesc: "Connectez-vous avec Google pour sauvegarder vos données partout.",
      signIn: "Se connecter avec Google",
      signOut: "Se déconnecter",
      loggedIn: "Connecté en tant que"
    }
  }[language];

  const renderAuthSection = () => {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center p-6 bg-black/20 rounded-xl">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      );
    }

    if (authUser) {
      return (
        <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            {authUser.photoURL ? (
              <img src={authUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                {authUser.displayName ? authUser.displayName[0] : 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-white/40">{t.loggedIn}</span>
              <span className="text-sm font-medium truncate text-white/90">{authUser.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-red-400"
            title={t.signOut}
          >
            <LogOut size={18} />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleGoogleLogin}
        disabled={isSyncing}
        className="w-full py-3 bg-white text-black hover:bg-gray-100 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
      >
        {isSyncing ? (
          <span className="animate-pulse">Connecting...</span>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            {t.signIn}
          </>
        )}
      </button>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 animate-fade-in-up pb-32 overflow-y-auto no-scrollbar">
      <div className="glass-panel p-8 rounded-[40px] text-white my-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/10 rounded-full">
            <User className="w-6 h-6 text-pink-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
        </div>

        <p className="text-white/60 mb-8 text-sm leading-relaxed">
          {t.desc}
        </p>

        {/* --- Google Auth Section --- */}
        <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="font-semibold text-white/90 mb-1 flex items-center gap-2">
            <Globe size={16} className="text-blue-400" /> {t.sync}
          </h3>
          <p className="text-xs text-white/50 mb-4">{t.syncDesc}</p>

          {renderAuthSection()}
        </div>


        <div className="space-y-6">

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-2 flex items-center gap-2">
              <Globe size={14} /> {t.lang}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`py-3 rounded-2xl text-md font-medium transition-all duration-300 border ${language === 'en'
                  ? 'bg-white/20 border-white text-white shadow-lg'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`py-3 rounded-2xl text-md font-medium transition-all duration-300 border ${language === 'fr'
                  ? 'bg-white/20 border-white text-white shadow-lg'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                Français
              </button>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/10 my-4" />

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-2">{t.weight}</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-xl font-semibold text-white focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-white/20"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-2">{t.sex}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGender('male')}
                className={`py-4 rounded-2xl text-lg font-medium transition-all duration-300 border ${gender === 'male'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                {t.male}
              </button>
              <button
                onClick={() => setGender('female')}
                className={`py-4 rounded-2xl text-lg font-medium transition-all duration-300 border ${gender === 'female'
                  ? 'bg-pink-500/20 border-pink-500 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                {t.female}
              </button>
            </div>
          </div>

          {/* Drinking Speed */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-2 flex items-center gap-2">
              <Zap size={14} /> {t.speed}
            </label>
            <p className="text-xs text-white/40 ml-2 mb-2">{t.speedDesc}</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDrinkingSpeed('slow')}
                className={`py-3 rounded-2xl text-sm font-medium transition-all duration-300 border ${drinkingSpeed === 'slow'
                  ? 'bg-green-500/20 border-green-500 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                🐢 {t.slow}
              </button>
              <button
                onClick={() => setDrinkingSpeed('average')}
                className={`py-3 rounded-2xl text-sm font-medium transition-all duration-300 border ${drinkingSpeed === 'average'
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                🚶 {t.avg}
              </button>
              <button
                onClick={() => setDrinkingSpeed('fast')}
                className={`py-3 rounded-2xl text-sm font-medium transition-all duration-300 border ${drinkingSpeed === 'fast'
                  ? 'bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                  }`}
              >
                🐇 {t.fast}
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-8 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white py-4 rounded-2xl text-lg font-bold shadow-lg shadow-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
