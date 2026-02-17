import React, { useState, useRef } from 'react';
import { UserProfile, WonAward, LeaderboardVisibility } from '../types';
import { Save, User, Globe, Zap, LogOut, Camera, ChevronRight, Settings as SettingsIcon, ArrowLeft, Loader2, Shield, Calendar, Trophy, HelpCircle, UserPlus, Bell, FileText, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ImageCropper } from './ImageCropper';
import { TrophyHall } from './TrophyHall';
import heic2any from 'heic2any';
import { DrinkosaurPass, ProfilePhoto } from './DrinkosaurPass';
import { CharitySupport } from './CharitySupport';
import { LegalModal } from './LegalModals';
import { Drink } from '../types';
import { SafeComponent } from './SafeComponent';

interface SettingsProps {
  user: UserProfile;
  onSave: (user: Partial<UserProfile>) => void;
  onUploadAvatar: (base64: string) => Promise<string>;
  wonAwards?: WonAward[];
  selectedBadges?: string[];
  onUpdateBadges?: (badges: string[]) => void;
  drinks?: Drink[];
  notificationPermission?: NotificationPermission;
  onRequestNotification?: () => void;
}

type TranslationKey = 'profileTitle' | 'settingsTitle' | 'desc' | 'advancedDesc' | 'weight' | 'sex' | 'male' | 'female' | 'lang' | 'speed' | 'speedDesc' | 'slow' | 'average' | 'fast' | 'habit' | 'habitDesc' | 'habitLow' | 'habitAverage' | 'habitHigh' | 'habitChronic' | 'habitLowHint' | 'habitAverageHint' | 'habitHighHint' | 'habitChronicHint' | 'save' | 'sync' | 'syncDesc' | 'signIn' | 'signOut' | 'loggedIn' | 'stayConnected' | 'username' | 'usernameDesc' | 'photo' | 'advancedBtn' | 'backBtn' | 'errorWeight' | 'errorUsername' | 'birthDate' | 'birthDateDesc' | 'underageTitle' | 'underageMsg' | 'errorBirthDate' | 'privacy' | 'photoVisible' | 'photoVisibleDesc';

export const Settings: React.FC<SettingsProps> = ({ user, onSave, onUploadAvatar, wonAwards = [], selectedBadges = [], onUpdateBadges, drinks = [], notificationPermission, onRequestNotification }) => {
  const [showAdvanced, setShowAdvanced] = useState(!user.isSetup);
  const [showTrophyHall, setShowTrophyHall] = useState(false);
  const [weight, setWeight] = useState(user.weightKg || 70);
  const [gender, setGender] = useState<'male' | 'female'>(user.gender);
  const [language, setLanguage] = useState<'en' | 'fr'>(user.language || 'en');
  const [drinkingSpeed, setDrinkingSpeed] = useState<'slow' | 'average' | 'fast'>(user.drinkingSpeed || 'average');
  const [habitLevel, setHabitLevel] = useState<'low' | 'average' | 'high' | 'chronic'>(user.habitLevel || 'average');
  const [username, setUsername] = useState(user.username || '');
  const [customPhotoURL, setCustomPhotoURL] = useState(user.customPhotoURL || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [leaderboardVisibility, setLeaderboardVisibility] = useState<LeaderboardVisibility>(user.leaderboardVisibility || 'public');
  const [allowGlobalRequests, setAllowGlobalRequests] = useState(user.allowGlobalRequests !== false);
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'about' | null>(null);

  // Pivot: Sync local state when user profile updates (e.g. initial load)
  React.useEffect(() => {
    if (user.customPhotoURL) setCustomPhotoURL(user.customPhotoURL);
  }, [user.customPhotoURL]);

  // Image Selection & Cropping
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Hook
  const { user: authUser, loading: authLoading, signIn, linkEmailToAccount, changePassword, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLinkEmail, setShowLinkEmail] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkMessage, setLinkMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [stayConnected, setStayConnected] = useState(() => {
    return window.localStorage.getItem('drinkosaur_stay_connected') !== 'false';
  });

  const handleToggleStayConnected = (val: boolean) => {
    setStayConnected(val);
    window.localStorage.setItem('drinkosaur_stay_connected', val.toString());
  };

  const getAge = (dateStr: string): number => {
    if (!dateStr) return -1;
    const birth = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSave = () => {
    // Robust validation
    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      alert(t.errorUsername);
      return;
    }

    if (!weight || weight < 30 || weight > 250) {
      alert(t.errorWeight);
      return;
    }

    // Date of birth validation
    if (!birthDate) {
      alert(t.errorBirthDate);
      return;
    }

    const age = getAge(birthDate);
    if (age < 18) {
      // Don't block, just show warning — they can fix the date
      alert(t.underageMsg);
      return;
    }

    onSave({
      weightKg: weight,
      gender,
      language,
      drinkingSpeed,
      habitLevel,
      stayConnected,
      username: cleanUsername,
      customPhotoURL,
      birthDate,
      isSetup: true,
      // Force public visibility as per new requirements
      photoVisibleToFriends: true,
      badgesPublic: true,
      groupListVisibility: 'visible'
    });
    if (user.isSetup) setShowAdvanced(false);
  };

  const handleGoogleLogin = async () => {
    setIsSyncing(true);
    await signIn();
    setIsSyncing(false);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      let file = e.target.files[0];

      // Handle HEIC from iPhones
      const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';

      if (isHEIC) {
        setIsConverting(true);
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          });
          file = new File(
            [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob],
            file.name.replace(/\.[^/.]+$/, "") + ".jpg",
            { type: "image/jpeg" }
          );
        } catch (err) {
          console.error("HEIC conversion error:", err);
        } finally {
          setIsConverting(false);
        }
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => setSelectedImage(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBase64: string) => {
    setSelectedImage(null);
    setIsUploading(true);
    console.log("[Settings] handleCropComplete called, showAdvanced:", showAdvanced);
    try {
      const url = await onUploadAvatar(croppedBase64);
      console.log("[Settings] Upload returned URL:", url);
      setCustomPhotoURL(url);
      // Auto save the new photo URL if we are already in profile view
      if (!showAdvanced) {
        console.log("[Settings] Auto-saving customPhotoURL to profile");
        onSave({
          customPhotoURL: url
        });
      } else {
        console.log("[Settings] showAdvanced is true — photo will be saved on next manual Save");
      }
    } catch (e) {
      console.error("[Settings] Upload failed:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const t: Record<TranslationKey, string> = {
    en: {
      profileTitle: "My Profile",
      settingsTitle: "Calculations Settings",
      desc: "Customize your Drinkosaur experience.",
      advancedDesc: "These details are used to calibrate your BAC estimation correctly.",
      weight: "Weight (kg)",
      sex: "Biological Sex",
      male: "Male",
      female: "Female",
      lang: "Language",
      speed: "Drinking Speed",
      speedDesc: "How fast do you finish a drink?",
      slow: "Slow",
      average: "Average",
      fast: "Fast",
      habit: "Alcohol Habit",
      habitDesc: "How often do you drink? (Induces MEOS for faster elimination)",
      habitLow: "Occasional",
      habitAverage: "Moderate",
      habitHigh: "Frequent",
      habitChronic: "Expert",
      habitLowHint: "< 1 / month",
      habitAverageHint: "1-2 / week",
      habitHighHint: "3-5 / week",
      habitChronicHint: "Daily",
      save: "Save Changes",
      sync: "Cloud Sync",
      syncDesc: "Connect to save your data.",
      signIn: "Sign in with Google",
      signOut: "Sign Out",
      loggedIn: "Signed in as",
      stayConnected: "Stay connected",
      username: "Username",
      usernameDesc: "Others can add you with @username",
      photo: "Custom Avatar URL",
      advancedBtn: "Advanced Settings",
      backBtn: "Back to Profile",
      errorWeight: "Please enter a valid weight (30-250kg)",
      errorUsername: "Username must be at least 3 characters",
      birthDate: "Date of birth",
      birthDateDesc: "Required to verify you are of legal drinking age",
      underageTitle: "Age Restriction",
      underageMsg: "You must be at least 18 years old to use Drinkosaur. Please come back when you reach the legal age!",
      errorBirthDate: "Please enter your date of birth",
      privacy: "Privacy",
      photoVisible: "Photo visible to friends",
      photoVisibleDesc: "Your friends can see your profile photo"
    },
    fr: {
      profileTitle: "Mon Profil",
      settingsTitle: "Réglages de Calcul",
      desc: "Personnalisez votre expérience Drinkosaur.",
      advancedDesc: "Ces détails permettent de calibrer le calcul de votre alcoolémie.",
      weight: "Poids (kg)",
      sex: "Sexe Biologique",
      male: "Homme",
      female: "Femme",
      lang: "Langue",
      speed: "Vitesse de consommation",
      speedDesc: "À quelle vitesse finissez-vous un verre ?",
      slow: "Lent",
      average: "Moyen",
      fast: "Rapide",
      habit: "Habitude de consommation",
      habitDesc: "Fréquence de consommation (influence la vitesse d'élimination)",
      habitLow: "Occasionnel",
      habitAverage: "Régulier",
      habitHigh: "Fréquent",
      habitChronic: "Expert",
      habitLowHint: "< 1 / mois",
      habitAverageHint: "1-2 / semaine",
      habitHighHint: "3-5 / semaine",
      habitChronicHint: "Quotidien",
      save: "Enregistrer",
      sync: "Synchronisation Cloud",
      syncDesc: "Connectez-vous pour sauvegarder vos données.",
      signIn: "Se connecter avec Google",
      signOut: "Se déconnecter",
      loggedIn: "Connecté en tant que",
      stayConnected: "Rester connecté",
      username: "Pseudo",
      usernameDesc: "Les autres peuvent vous ajouter avec @pseudo",
      photo: "Lien Photo de Profil",
      advancedBtn: "Réglages de calcul",
      backBtn: "Retour au profil",
      errorWeight: "Veuillez entrer un poids valide (30-250kg)",
      errorUsername: "Le pseudo doit faire au moins 3 caractères",
      birthDate: "Date de naissance",
      birthDateDesc: "Nécessaire pour vérifier que vous avez l'âge légal",
      underageTitle: "Restriction d'âge",
      underageMsg: "Vous devez avoir au moins 18 ans pour utiliser Drinkosaur. Revenez quand vous aurez atteint l'âge légal !",
      errorBirthDate: "Veuillez entrer votre date de naissance",
      privacy: "Confidentialité",
      photoVisible: "Photo visible par les amis",
      photoVisibleDesc: "Vos amis peuvent voir votre photo de profil"
    }
  }[language] as any;

  const renderAuthSection = () => {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center p-6 bg-black/20 rounded-xl">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      );
    }

    // Detect linked providers
    const providers = authUser?.providerData?.map((p: any) => p.providerId) || [];
    const hasGoogle = providers.includes('google.com');
    const hasPassword = providers.includes('password');

    return (
      <div className="space-y-4">
        {authUser ? (
          <>
            <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={customPhotoURL || authUser.photoURL || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border border-white/20 object-cover"
                />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">{t.loggedIn}</span>
                  <span className="text-xs font-medium truncate text-white/90">{authUser.email}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Connected Methods */}
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                {language === 'fr' ? 'Méthodes de connexion' : 'Sign-in methods'}
              </span>
              <div className="space-y-2">
                {hasGoogle && (
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">Google</p>
                      <p className="text-[10px] text-white/30 truncate">{authUser.email}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                )}
                {hasPassword && (
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{language === 'fr' ? 'Email / Mot de passe' : 'Email / Password'}</p>
                      <p className="text-[10px] text-white/30 truncate">{authUser.email}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Change (only if email/password is linked) */}
            {hasPassword && (
              <>
                {showLinkEmail ? (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/60">
                        {language === 'fr' ? 'Changer le mot de passe' : 'Change password'}
                      </span>
                      <button onClick={() => { setShowLinkEmail(false); setLinkMessage(null); }} className="text-white/30 hover:text-white text-xs">✕</button>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsLinking(true);
                      setLinkMessage(null);
                      const result = await changePassword(linkEmail, linkPassword);
                      setLinkMessage({ text: result.message, success: result.success });
                      setIsLinking(false);
                      if (result.success) {
                        setLinkEmail('');
                        setLinkPassword('');
                        setTimeout(() => { setShowLinkEmail(false); setLinkMessage(null); }, 2000);
                      }
                    }} className="space-y-2">
                      <input
                        type="password"
                        placeholder={language === 'fr' ? 'Mot de passe actuel' : 'Current password'}
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                        required
                      />
                      <input
                        type="password"
                        placeholder={language === 'fr' ? 'Nouveau mot de passe (min. 6 car.)' : 'New password (min. 6 chars)'}
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                        required
                        minLength={6}
                      />
                      <button
                        type="submit"
                        disabled={isLinking}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLinking ? "..." : (language === 'fr' ? 'Modifier' : 'Update')}
                      </button>
                    </form>
                    {linkMessage && (
                      <div className={`text-[10px] font-bold p-2 rounded-lg ${linkMessage.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {linkMessage.text}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLinkEmail(true)}
                    className="w-full py-2 text-[10px] text-white/30 font-bold uppercase tracking-widest hover:text-white/50 transition-colors mt-2"
                  >
                    {language === 'fr' ? '🔑 Changer le mot de passe' : '🔑 Change password'}
                  </button>
                )}
              </>
            )}

            {/* Link Email (only if NOT already linked) */}
            {!hasPassword && (
              <>
                {showLinkEmail ? (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/60">
                        {language === 'fr' ? 'Ajouter un accès Email' : 'Add Email access'}
                      </span>
                      <button onClick={() => { setShowLinkEmail(false); setLinkMessage(null); }} className="text-white/30 hover:text-white text-xs">✕</button>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed">
                      {language === 'fr'
                        ? "Ajoutez un email et mot de passe pour vous connecter depuis n'importe quel appareil, même sur mobile."
                        : 'Add an email and password to sign in from any device, including mobile.'}
                    </p>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsLinking(true);
                      setLinkMessage(null);
                      const result = await linkEmailToAccount(linkEmail, linkPassword);
                      setLinkMessage({ text: result.message, success: result.success });
                      setIsLinking(false);
                      if (result.success) {
                        setLinkEmail('');
                        setLinkPassword('');
                      }
                    }} className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                        required
                      />
                      <input
                        type="password"
                        placeholder={language === 'fr' ? 'Mot de passe (min. 6 car.)' : 'Password (min. 6 chars)'}
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                        required
                        minLength={6}
                      />
                      <button
                        type="submit"
                        disabled={isLinking}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLinking ? "..." : (language === 'fr' ? 'Lier cet email' : 'Link this email')}
                      </button>
                    </form>
                    {linkMessage && (
                      <div className={`text-[10px] font-bold p-2 rounded-lg ${linkMessage.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {linkMessage.text}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLinkEmail(true)}
                    className="w-full py-2 text-[10px] text-white/30 font-bold uppercase tracking-widest hover:text-white/50 transition-colors mt-2"
                  >
                    {language === 'fr' ? '+ Ajouter un accès Email / Mot de passe' : '+ Add Email / Password access'}
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <button
            onClick={handleGoogleLogin}
            disabled={isSyncing}
            className="w-full py-3 bg-white text-black hover:bg-gray-100 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {isSyncing ? "..." : <><svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>{t.signIn}</>}
          </button>
        )}

        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-white/50">{t.stayConnected}</span>
          <button
            onClick={() => handleToggleStayConnected(!stayConnected)}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${stayConnected ? 'bg-blue-500' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${stayConnected ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>
    );
  }

  // --- Simplified Profile View ---
  if (!showAdvanced) {
    return (
      <div className="w-full h-full flex flex-col p-6 pb-40 overflow-y-auto no-scrollbar animate-fade-in relative">
        {selectedImage && (
          <ImageCropper
            image={selectedImage}
            onCropComplete={handleCropComplete}
            onClose={() => setSelectedImage(null)}
          />
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*,.heic"
          className="hidden"
        />

        <div className="flex flex-col items-center mt-8 mb-8">
          <div className="relative mb-6">
            <div
              className={`w-40 h-40 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl relative group transition-all ${isUploading || isConverting ? 'cursor-wait' : 'cursor-pointer active:scale-95'}`}
              onClick={() => !isUploading && !isConverting && fileInputRef.current?.click()}
              role="button"
              aria-label="Change profile photo"
            >
              {(isUploading || isConverting) ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 px-2 text-center">
                    {isConverting ? 'Optimizing' : 'Uploading'}
                  </span>
                </div>
              ) : null}
              <ProfilePhoto
                photoURL={customPhotoURL || authUser?.photoURL || undefined}
                effect={user.drinkosaurPassConfig?.profileEffect}
                size="w-40 h-40"
                className={`transition-transform group-hover:scale-110 ${(isUploading || isConverting) ? 'opacity-30 blur-sm' : ''}`}
                rounded="rounded-full"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center z-30">
                <Camera className="w-10 h-10 text-white/0 group-hover:text-white/100 transition-all scale-50 group-hover:scale-100" />
              </div>
            </div>

            {/* Always visible Camera Badge for mobile discovery */}
            {!isUploading && !isConverting && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl border-4 border-[#050505] shadow-xl active:scale-90 transition-all z-30"
                aria-label="Change profile photo"
              >
                <Camera size={20} className="text-white" />
              </button>
            )}

            {authUser && !isUploading && (
              <div
                className="absolute -top-2 -left-2 bg-gradient-to-br from-emerald-400 to-teal-600 p-2 rounded-xl border-4 border-[#050505] shadow-lg"
                title="Google Synchronized"
              >
                <Globe size={14} className="text-white" />
              </div>
            )}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">@{username || 'joueur'}</h2>
          <p className="text-white/60 text-sm mt-2 font-medium">{authUser?.email || 'Mode local (non-synchronisé)'}</p>
        </div>

        <div className="space-y-4">
          <div className="glass-panel-3d p-6 rounded-[32px] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon size={20} className="text-blue-400" /> {t.profileTitle}
              </h3>
            </div>
            {renderAuthSection()}
          </div>

          {/* Drinkosaur Pass Button */}
          <button
            onClick={() => setShowPass(true)}
            className="w-full relative h-48 rounded-[32px] overflow-hidden group shadow-2xl active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 z-0">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
                DRINKOPASS
              </h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                {language === 'fr' ? 'Afficher ma carte joueur' : 'View Player Card'}
              </p>
            </div>
            {/* Holographic effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000 z-20 pointer-events-none"></div>
          </button>

          {/* Render Drinkosaur Pass Modal */}
          {showPass && (
            <DrinkosaurPass
              user={user}
              wonAwards={wonAwards}
              drinks={drinks}
              onSave={(updates) => {
                onSave(updates);
                // Don't close automatically on save, let user enjoy layout
              }}
              onClose={() => setShowPass(false)}
              language={language}
            />
          )}

          {/* Trophy Hall Button */}
          <button
            onClick={() => setShowTrophyHall(true)}
            className="w-full glass-panel-3d p-6 rounded-[32px] flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 rounded-2xl group-hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                <Trophy size={24} className="text-amber-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white leading-tight text-lg">{language === 'fr' ? 'Hall des Trophées' : 'Trophy Hall'}</p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider font-bold">
                  {wonAwards.length} {language === 'fr' ? 'trophées remportés' : 'trophies earned'}
                </p>
              </div>
            </div>
            <ChevronRight className="text-white/20 group-hover:text-amber-400/40 transition-colors" />
          </button>

          {/* Trophy Hall Modal */}
          {showTrophyHall && (
            <TrophyHall
              wonAwards={wonAwards}
              selectedBadges={selectedBadges}
              onUpdateBadges={(badges) => {
                onUpdateBadges?.(badges);
              }}
              onClose={() => setShowTrophyHall(false)}
              language={language}
            />
          )}

          {/* Charity Support Component - Wrapped in SafeComponent to prevent ad-related crashes */}
          <SafeComponent>
            <CharitySupport
              user={user}
              onUpdateUser={onSave}
              language={language}
            />
          </SafeComponent>

          {/* Privacy Section */}
          <div className="glass-panel-3d p-6 rounded-[32px] space-y-5">
            <button
              onClick={() => setIsPrivacyExpanded(!isPrivacyExpanded)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield size={20} className="text-purple-400" /> {t.privacy}
              </h3>
              <ChevronRight size={20} className={`text-white/20 transition-transform duration-300 ${isPrivacyExpanded ? '-rotate-90' : 'rotate-90'}`} />
            </button>

            {isPrivacyExpanded && (
              <div className="space-y-5 animate-fade-in">

                {/* Global Ranking Visibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className={leaderboardVisibility === 'public' ? 'text-cyan-400' : 'text-white/30'} />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {language === 'fr' ? 'Apparaître dans le classement global' : 'Appear in Global Ranking'}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-0.5">
                        {language === 'fr' ? 'Votre score sera visible par toute la communauté' : 'Your score will be visible to the entire community'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = leaderboardVisibility === 'public' ? 'hidden' : 'public';
                      setLeaderboardVisibility(newVal);
                      onSave({ leaderboardVisibility: newVal });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${leaderboardVisibility === 'public' ? 'bg-cyan-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${leaderboardVisibility === 'public' ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* Allow Global Friend Requests */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus size={18} className={allowGlobalRequests ? 'text-emerald-400' : 'text-white/30'} />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {language === 'fr' ? 'Demandes d\'amis du classement' : 'Leaderboard Friend Requests'}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-0.5">
                        {language === 'fr' ? 'Autoriser les inconnus du classement à vous ajouter' : 'Allow strangers from leaderboard to add you'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !allowGlobalRequests;
                      setAllowGlobalRequests(newVal);
                      onSave({ allowGlobalRequests: newVal });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${allowGlobalRequests ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allowGlobalRequests ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <p className="text-[10px] text-white/30 font-medium italic mt-4 bg-white/5 p-3 rounded-xl border border-white/5">
                  {language === 'fr'
                    ? "Note : Votre photo de profil et vos badges sont publics par défaut pour faciliter les interactions sociales."
                    : "Note: Your profile photo and badges are public by default to facilitate social interactions."}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAdvanced(true)}
            className="w-full glass-panel-3d p-6 rounded-[32px] flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                <Zap size={24} className="text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white leading-tight text-lg">{t.advancedBtn}</p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider font-bold">{t.weight}, {t.sex}, {t.speed}</p>
              </div>
            </div>
            <ChevronRight className="text-white/20 group-hover:text-white transition-colors" />
          </button>

          {/* Help & News Button */}
          <a
            href="https://x.com/brieucpec"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full glass-panel-3d p-6 rounded-[32px] flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-sky-500/10 rounded-2xl group-hover:bg-sky-500/20 transition-colors border border-sky-500/20">
                <HelpCircle size={24} className="text-sky-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white leading-tight text-lg">{language === 'fr' ? 'Aide & Actualités' : 'Help & News'}</p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider font-bold">
                  {language === 'fr' ? 'Status, Mises à jour, Support' : 'Status, Updates, Support'}
                </p>
              </div>
            </div>
            <ChevronRight className="text-white/20 group-hover:text-sky-400/40 transition-colors" />
          </a>

          {/* Admin Dashboard Button (Only for Admins) */}
          {user.isAdmin && (
            <button
              onClick={() => (window as any)._openAdminDashboard && (window as any)._openAdminDashboard()}
              className="w-full glass-panel-3d p-6 rounded-[32px] flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-red-500/10 border border-red-500/20 mb-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-red-500/10 rounded-2xl group-hover:bg-red-500/20 transition-colors border border-red-500/20">
                  <Shield size={24} className="text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-red-100 leading-tight text-lg">Admin Dashboard</p>
                  <p className="text-xs text-red-500/60 mt-1 uppercase tracking-wider font-bold">
                    Manage Players & Data
                  </p>
                </div>
              </div>
              <ChevronRight className="text-red-500/40 group-hover:text-red-500 transition-colors" />
            </button>
          )}

          {/* Notifications Button */}
          <button
            onClick={() => onRequestNotification?.()}
            className="w-full glass-panel-3d p-6 rounded-[32px] flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl transition-colors border ${notificationPermission === 'granted' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                <Bell size={24} className={notificationPermission === 'granted' ? 'text-emerald-400' : 'text-blue-400'} />
              </div>
              <div className="text-left">
                <p className="font-bold text-white leading-tight text-lg">
                  {language === 'fr' ? 'Notifications Push' : 'Push Notifications'}
                </p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider font-bold">
                  {notificationPermission === 'granted'
                    ? (language === 'fr' ? 'Activées ✅' : 'Enabled ✅')
                    : (language === 'fr' ? 'Cliquer pour activer' : 'Click to enable')}
                </p>
              </div>
            </div>
            {notificationPermission !== 'granted' && <ChevronRight className="text-white/20 group-hover:text-blue-400/40 transition-colors" />}
          </button>

          {/* Legal Section */}
          <div className="pt-8 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveLegalModal('privacy')}
              className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Shield size={12} /> {language === 'fr' ? 'Confidentialité' : 'Privacy'}
            </button>
            <button
              onClick={() => setActiveLegalModal('terms')}
              className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={12} /> {language === 'fr' ? 'Conditions' : 'Terms'}
            </button>
            <button
              onClick={() => setActiveLegalModal('about')}
              className="col-span-2 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Info size={12} /> {language === 'fr' ? 'À propos & Contact' : 'About & Contact'}
            </button>
          </div>
        </div>

        {/* Legal Modals */}
        {activeLegalModal && (
          <LegalModal
            type={activeLegalModal}
            language={language}
            onClose={() => setActiveLegalModal(null)}
          />
        )}

        {/* Footer Credits */}
        <div className="mt-12 mb-8 flex justify-center opacity-30 select-none">
          <p
            onClick={() => {
              // Secret Developer Mode Trigger
              const now = Date.now();
              const taps = (window as any)._devTaps || [];
              const recentTaps = taps.filter((t: number) => now - t < 2000); // 2 seconds window
              recentTaps.push(now);
              (window as any)._devTaps = recentTaps;

              if (recentTaps.length >= 7) {
                (window as any)._devTaps = []; // Reset
                const pin = prompt("🔐 DEVELOPER MODE ACCESS\nEnter PIN:");
                if (pin === "DRINKOSAUR_DEV") {
                  onSave({ isAdmin: true });
                  alert("✅ Developer Mode Unlocked! You are now an Admin.");
                  window.location.reload(); // Force refresh to update UI state
                } else if (pin) {
                  alert("⛔ Access Denied");
                }
              }
            }}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-white cursor-default active:text-blue-500 transition-colors"
          >
            v2.0 • ©<a href="https://brieucpecqueraux.blogspot.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors pointer-events-auto">Brieuc Pecqueraux</a>
          </p>
        </div>
      </div>

    );
  }

  // --- Detailed Settings View ---
  return (
    <div className="w-full h-full flex flex-col p-6 pb-40 overflow-y-auto no-scrollbar animate-fade-in-up">
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onClose={() => setSelectedImage(null)}
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*,.heic"
        className="hidden"
      />

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setShowAdvanced(false)}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black tracking-tight">{t.settingsTitle}</h2>
      </div>

      <div className="glass-panel-3d p-4 md:p-8 rounded-[40px] space-y-8 mb-8 border-t-white/30">
        <div className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60 ml-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <User size={12} /> {t.username}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-lg">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pseudo"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-base font-bold text-white focus:border-blue-500/50 outline-none transition-all shadow-inner min-w-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60 ml-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <Calendar size={12} /> {t.birthDate}
              </label>
              <p className="text-[10px] text-white/30 ml-2 font-medium">{t.birthDateDesc}</p>
              <div className="relative w-full">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-base font-bold text-white focus:border-blue-500/50 outline-none transition-all shadow-inner [color-scheme:dark] min-w-0 appearance-none"
                />
              </div>
              {birthDate && getAge(birthDate) < 18 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mt-2">
                  <p className="text-red-300 text-sm font-bold flex items-center gap-2">
                    <Shield size={16} /> {t.underageTitle}
                  </p>
                  <p className="text-red-300/70 text-xs mt-1">{t.underageMsg}</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Language Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white/60 ml-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">
              <Globe size={12} /> {t.lang}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`py-4 rounded-2xl font-black border transition-all ${language === 'en' ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`py-4 rounded-2xl font-black border transition-all ${language === 'fr' ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Français
              </button>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white/60 ml-2 uppercase tracking-widest text-[10px]">{t.weight}</label>
            <div className="relative">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-5 text-2xl font-black text-white outline-none focus:border-blue-500/50 transition-all text-center"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-white/20 text-xl italic">KG</span>
            </div>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setGender('male')}
              className={`py-5 rounded-2xl font-black border transition-all ${gender === 'male' ? 'bg-blue-500/20 border-blue-500 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 text-white/20 hover:text-white/40'}`}
            >
              {t.male}
            </button>
            <button
              onClick={() => setGender('female')}
              className={`py-5 rounded-2xl font-black border transition-all ${gender === 'female' ? 'bg-pink-500/20 border-pink-500 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'bg-white/5 border-white/10 text-white/20 hover:text-white/40'}`}
            >
              {t.female}
            </button>
          </div>

          {/* Drinking Speed */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white/60 ml-2 flex items-center gap-2 uppercase tracking-widest text-[10px]"><Zap size={12} /> {t.speed}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'average', 'fast'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setDrinkingSpeed(s)}
                  className={`py-4 rounded-xl text-[10px] font-black border uppercase tracking-tighter transition-all ${drinkingSpeed === s ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md' : 'bg-white/5 border-white/10 text-white/20'}`}
                >
                  {t[s]}
                </button>
              ))}
            </div>
          </div>
          {/* Drinking Habit */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white/60 ml-2 flex items-center gap-2 uppercase tracking-widest text-[10px]"><Zap size={12} /> {t.habit}</label>
            <p className="text-[10px] text-white/30 ml-2 font-medium">{t.habitDesc}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['low', 'average', 'high', 'chronic'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setHabitLevel(h)}
                  className={`py-3 px-2 rounded-xl border uppercase tracking-tighter transition-all flex flex-col items-center justify-center gap-0.5 ${habitLevel === h ? 'bg-blue-500/20 border-blue-500 text-blue-200 shadow-md' : 'bg-white/5 border-white/10 text-white/20'}`}
                >
                  <span className="text-[10px] font-black">
                    {t[`habit${h.charAt(0).toUpperCase() + h.slice(1)}` as TranslationKey]}
                  </span>
                  <span className={`text-[8px] font-bold opacity-60 ${habitLevel === h ? 'text-blue-300' : 'text-white/20'}`}>
                    {t[`habit${h.charAt(0).toUpperCase() + h.slice(1)}Hint` as TranslationKey]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-6 rounded-[32px] text-xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
          >
            <Save size={24} /> {t.save}
          </button>
        </div>

        {/* Footer Credits */}
        <div className="mt-12 mb-8 flex justify-center opacity-30 select-none">
          <p
            onClick={() => {
              // Secret Developer Mode Trigger
              const now = Date.now();
              const taps = (window as any)._devTaps || [];
              const recentTaps = taps.filter((t: number) => now - t < 2000); // 2 seconds window
              recentTaps.push(now);
              (window as any)._devTaps = recentTaps;

              if (recentTaps.length >= 7) {
                (window as any)._devTaps = []; // Reset
                const pin = prompt("🔐 DEVELOPER MODE ACCESS\nEnter PIN:");
                if (pin === "DRINKOSAUR_DEV") {
                  onSave({ isAdmin: true });
                  alert("✅ Developer Mode Unlocked! You are now an Admin.");
                  window.location.reload(); // Force refresh to update UI state
                } else if (pin) {
                  alert("⛔ Access Denied");
                }
              }
            }}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-white cursor-default active:text-blue-500 transition-colors"
          >
            v2.0 • ©<a href="https://brieucpecqueraux.blogspot.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors pointer-events-auto">Brieuc Pecqueraux</a>
          </p>
        </div>
      </div>
    </div>

  );
};
