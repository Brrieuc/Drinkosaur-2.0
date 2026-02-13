import React, { useState, useMemo, useRef, useEffect } from 'react';
import { calculateBac } from '../services/bacService';
import { METABOLISM_RATE, THEME_COLORS } from '../constants';
import { FriendStatus, UserProfile, BacStatus, FriendGroup } from '../types';
import { FriendRequest } from '../hooks/useSocial';
import { ComputedAward } from '../constants/awards';
import { AwardsModal } from './AwardsModal';
import {
    UserPlus, Loader2, AlertTriangle, Trash2, Check, X, LogOut,
    Bell, Trophy, Medal, RefreshCw, Sparkles, Share2, Users, Plus, ChevronLeft, Edit2, Shield, Globe, Eye, EyeOff
} from 'lucide-react';

interface SocialProps {
    friends: FriendStatus[];
    requests: FriendRequest[];
    myProfile: UserProfile;
    myBac: BacStatus;
    myUid: string;
    isAnonymous?: boolean;
    onAddFriend: (username: string) => Promise<any>;
    onAddFriendByUid: (uid: string) => Promise<any>;
    onRespondRequest: (requestId: string, accept: boolean) => Promise<void>;
    onRemoveFriend: (uid: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    onSelectFriend: (uid: string) => void;
    suggestions: any[];
    onFetchSuggestions: () => Promise<void>;
    loading: boolean;
    language: 'en' | 'fr';

    // Group Props
    groups: FriendGroup[];
    groupInvites: FriendGroup[];
    onCreateGroup: (name: string, friendIds: string[], icon?: string) => Promise<any>;
    onAcceptGroupInvite: (groupId: string) => Promise<void>;
    onDeclineGroupInvite: (groupId: string) => Promise<void>;
    onLeaveGroup: (groupId: string) => Promise<void>;
    onFetchGroupStatus: (groupId: string) => Promise<FriendStatus[]>;
    onInviteToGroup: (groupId: string, friendIds: string[]) => Promise<void>;
    onUpdateGroupIcon: (groupId: string, icon: string) => Promise<void>;
    onUpdateGroupSettings: (groupId: string, settings: { showInGlobalRanking?: boolean; memberListPublic?: boolean }) => Promise<void>;

    // Awards Props
    awards: ComputedAward[];
    awardsLoading: boolean;
    awardsMonth: { month: number; year: number };
    onFetchGroupAwards: (groupId: string, month: number, year: number) => void;
}

enum SocialTab {
    FRIENDS = 'FRIENDS',
    GROUPS = 'GROUPS'
}

export const Social: React.FC<SocialProps> = (props) => {
    const {
        friends,
        requests,
        myProfile,
        myBac,
        myUid,
        isAnonymous,
        onAddFriend,
        onAddFriendByUid,
        onRespondRequest,
        onRemoveFriend,
        onRefresh,
        onSelectFriend,
        suggestions,
        onFetchSuggestions,
        loading,
        language,
        groups,
        groupInvites,
        onCreateGroup,
        onAcceptGroupInvite,
        onDeclineGroupInvite,
        onLeaveGroup,
        onFetchGroupStatus,
        onInviteToGroup,
        onUpdateGroupIcon,
        onUpdateGroupSettings,
        awards,
        awardsLoading,
        awardsMonth,
        onFetchGroupAwards
    } = props;

    const [searchUsername, setSearchUsername] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // --- PULL TO REFRESH STATES ---
    const [startY, setStartY] = useState(0);
    const [pullOffset, setPullOffset] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const REFRESH_THRESHOLD = 80;

    const [activeTab, setActiveTab] = useState<SocialTab>(SocialTab.FRIENDS);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [groupRanking, setGroupRanking] = useState<FriendStatus[]>([]);
    const [loadingGroup, setLoadingGroup] = useState(false);

    // Create Group State
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [newGroupIcon, setNewGroupIcon] = useState('🥂');

    const GROUP_ICONS = ['🥂', '🍻', '🍷', '🥃', '🍸', '🍹', '🍾', '🦖', '🦕', '🔥', '⚡️', '🎱', '🎲', '🎮', '⚽️', '🏠', '🏖', '🏔'];

    // Invite to Group State
    const [isInvitingToGroup, setIsInvitingToGroup] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showAwardsModal, setShowAwardsModal] = useState(false);
    const [isSoberExpanded, setIsSoberExpanded] = useState(false);

    // Live update for ranking
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(i);
    }, []);

    const t = useMemo(() => ({
        title: language === 'fr' ? 'Social' : 'Social',
        friendsTab: language === 'fr' ? 'Amis' : 'Friends',
        groupsTab: language === 'fr' ? 'Groupes' : 'Groups',
        leaderboard: language === 'fr' ? 'Classement' : 'Leaderboard',
        suggestions: language === 'fr' ? 'Suggestions' : 'Suggestions',
        commonFriends: (n: number) => language === 'fr' ? `${n} amis en commun` : `${n} mutual friends`,
        addDesc: language === 'fr' ? 'Ajoutez un ami par son pseudo.' : 'Add a friend by their username.',
        addPlaceholder: language === 'fr' ? 'pseudo' : 'username',
        addButton: language === 'fr' ? 'Ajouter' : 'Add',
        inviteTitle: language === 'fr' ? 'Rejoins-moi sur Drinkosaur !' : 'Join me on Drinkosaur!',
        inviteBody: (username: string) => language === 'fr' ? `Santé ! Ajoute-moi sur Drinkosaur pour suivre mon taux d'alcool en direct : @${username}` : `Cheers! Add me on Drinkosaur to follow my BAC live: @${username}`,
        inviteSuccess: language === 'fr' ? 'Lien d\'invitation copié !' : 'Invite link copied!',
        guestSocialTitle: language === 'fr' ? 'Mode Social Verrouillé' : 'Social Mode Locked',
        guestSocialDesc: language === 'fr' ? 'Pour ajouter des amis et voir leur alcoolémie en direct, vous devez être connecté avec un compte Google.' : 'To add friends and see their live BAC, you must be logged in with a Google account.',
        guestSocialButton: language === 'fr' ? 'Se connecter maintenant' : 'Sign in now',
        empty: language === 'fr' ? 'Aucun ami pour le moment.' : 'No friends yet.',
        emptyGroups: language === 'fr' ? 'Vous n\'avez pas encore de groupes.' : 'No groups yet.',
        live: language === 'fr' ? 'EN DIRECT' : 'LIVE',
        requests: language === 'fr' ? 'Demandes en attente' : 'Pending Requests',
        groupInvites: language === 'fr' ? 'Invitations de groupes' : 'Group Invitations',
        accept: language === 'fr' ? 'Accepter' : 'Accept',
        decline: language === 'fr' ? 'Refuser' : 'Decline',
        you: language === 'fr' ? 'Moi' : 'Me',
        pull: language === 'fr' ? 'Tirez pour rafraîchir' : 'Pull to refresh',
        release: language === 'fr' ? 'Relâchez pour rafraîchir' : 'Release to refresh',
        createGroup: language === 'fr' ? 'Créer un groupe' : 'Create Group',
        groupName: language === 'fr' ? 'Nom du groupe' : 'Group Name',
        selectFriends: language === 'fr' ? 'Inviter des amis' : 'Invite Friends',
        cancel: language === 'fr' ? 'Annuler' : 'Cancel',
        create: language === 'fr' ? 'Créer' : 'Create',
        leaveGroup: language === 'fr' ? 'Quitter' : 'Leave group',
        addMembers: language === 'fr' ? 'Ajouter des membres' : 'Add Members',
        confirmAddFriend: language === 'fr' ? 'Ajouter cet utilisateur en ami ?' : 'Add this user as friend?',
        invite: language === 'fr' ? 'Inviter' : 'Invite'
    }), [language]);

    if (isAnonymous) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent -z-10" />
                <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10 mb-8 shadow-2xl animate-float backdrop-blur-xl">
                    <Users size={40} className="text-blue-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">{t.guestSocialTitle}</h2>
                <p className="text-white/40 text-sm font-bold mb-10 leading-relaxed max-w-xs">{t.guestSocialDesc}</p>

                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
                >
                    {t.guestSocialButton}
                </button>
            </div>
        );
    }

    const handleAdd = async (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();
        const trimmed = typeof e === 'string' ? e : searchUsername.trim();
        if (!trimmed) return;

        setIsAdding(true);
        setError(null);
        setSuccess(null);

        try {
            await onAddFriend(trimmed);
            setSuccess(language === 'fr' ? 'Demande envoyée !' : 'Request sent!');
            setSearchUsername('');
            setShowSuggestions(false);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Error adding friend');
        } finally {
            setIsAdding(false);
        }
    };

    const handleInvite = async () => {
        const username = myProfile.username || 'user';
        const inviteUrl = `${window.location.origin}?ref=${username}`;
        const shareData = {
            title: t.inviteTitle,
            text: t.inviteBody(username),
            url: inviteUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share failed', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${inviteUrl}`);
                setSuccess(t.inviteSuccess);
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError('Failed to copy');
            }
        }
    };

    // --- LEADERBOARD LOGIC ---
    const ranking = useMemo(() => {
        const liveFriends = friends.map(f => {
            let currentBac = f.currentBac;
            let statusMessage = f.statusMessage;
            let color = f.color;

            // 1. Recalculation complète si on a les données (Précision maximale)
            if (f.drinks && f.drinks.length > 0 && f.weightKg) {
                const live = calculateBac(f.drinks, {
                    weightKg: f.weightKg,
                    gender: f.gender,
                    drinkingSpeed: f.drinkingSpeed || 'average',
                    language: language
                } as UserProfile);
                currentBac = live.currentBac;
                statusMessage = live.statusMessage;
                color = live.color;
            }
            // 2. Décroissance linéaire si données manquantes ou obsolètes (Données asynchrones)
            else if (f.lastUpdate && f.currentBac > 0) {
                const hoursPassed = (Date.now() - f.lastUpdate) / (1000 * 60 * 60);
                const reduction = hoursPassed * METABOLISM_RATE;
                currentBac = Math.max(0, f.currentBac - reduction);

                // Si l'utilisateur est devenu sobre par le temps
                if (currentBac === 0) {
                    statusMessage = language === 'fr' ? 'Sobre' : 'Sober';
                    color = THEME_COLORS.safe;
                }
            }

            return {
                ...f,
                currentBac,
                statusMessage,
                color
            };
        });

        const me: FriendStatus = {
            uid: 'me',
            displayName: myProfile.username || t.you,
            photoURL: myProfile.customPhotoURL || myProfile.photoURL,
            currentBac: myBac.currentBac,
            color: myBac.color,
            statusMessage: myBac.statusMessage,
            lastUpdate: Date.now(),
            drinks: [],
            weightKg: myProfile.weightKg,
            gender: myProfile.gender,
            drinkingSpeed: myProfile.drinkingSpeed
        };

        return [...liveFriends, me].sort((a, b) => b.currentBac - a.currentBac);
    }, [friends, myBac, myProfile, t.you, tick, language]);

    // --- HELPERS ---
    const renderBac = (bac: number) => {
        if (language === 'fr') {
            return (
                <span className="flex items-baseline justify-end">
                    {(bac * 10).toFixed(2)}
                    <span className="text-[10px] ml-1 opacity-70 font-sans font-bold">g/L</span>
                </span>
            );
        }
        return (
            <span className="flex items-baseline justify-end">
                {bac.toFixed(3)}
                <span className="text-[10px] ml-0.5 opacity-70 font-sans font-bold">%</span>
            </span>
        );
    };

    // --- PULL TO REFRESH HANDLERS ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0) {
            setStartY(e.touches[0].clientY);
        } else {
            setStartY(0);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === 0 || isRefreshing) return;
        const moveY = e.touches[0].clientY;
        const diff = moveY - startY;
        if (diff > 0) {
            const offset = Math.min(diff * 0.4, 150);
            setPullOffset(offset);
            if (offset > 10 && e.cancelable) e.preventDefault();
        }
    };

    const handleTouchEnd = async () => {
        if (pullOffset >= REFRESH_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullOffset(REFRESH_THRESHOLD);
            try {
                await onRefresh();
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullOffset(0);
                    setStartY(0);
                }, 500);
            }
        } else {
            setPullOffset(0);
            setStartY(0);
        }
    };

    return (
        <div
            ref={scrollRef}
            className="flex-1 flex flex-col p-6 pb-40 overflow-y-auto no-scrollbar animate-fade-in touch-pan-y scroll-smooth"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none transition-transform duration-200"
                style={{
                    height: REFRESH_THRESHOLD,
                    transform: `translateY(${pullOffset - REFRESH_THRESHOLD}px)`,
                    opacity: pullOffset / REFRESH_THRESHOLD
                }}
            >
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
                    <RefreshCw
                        size={16}
                        className={`text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{ transform: !isRefreshing ? `rotate(${pullOffset * 2}deg)` : 'none' }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {isRefreshing ? 'Refreshing...' : (pullOffset >= REFRESH_THRESHOLD ? t.release : t.pull)}
                    </span>
                </div>
            </div>

            <div
                className="transition-transform duration-200 ease-out"
                style={{ transform: `translateY(${pullOffset}px)` }}
            >
                <h2 className="text-3xl font-extrabold mb-6 tracking-tight flex items-center gap-3 text-white">
                    <Users className="text-blue-400" /> {t.title}
                </h2>

                {/* --- TABS --- */}
                <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
                    <button
                        onClick={() => { setActiveTab(SocialTab.FRIENDS); setSelectedGroupId(null); }}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === SocialTab.FRIENDS ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/40 hover:text-white/60'}`}
                    >
                        {t.friendsTab}
                    </button>
                    <button
                        onClick={() => setActiveTab(SocialTab.GROUPS)}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === SocialTab.GROUPS ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/40 hover:text-white/60'}`}
                    >
                        {t.groupsTab}
                    </button>
                </div>

                {activeTab === SocialTab.FRIENDS ? (
                    <div className="animate-fade-in">
                        <p className="text-white/50 text-sm mb-6">{t.addDesc}</p>

                        {/* --- ADD FRIEND FORM --- */}
                        <form onSubmit={handleAdd} className="relative mb-10">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30 font-bold">@</span>
                                    <input
                                        type="text"
                                        value={searchUsername}
                                        onFocus={() => {
                                            setShowSuggestions(true);
                                            onFetchSuggestions();
                                        }}
                                        onChange={(e) => setSearchUsername(e.target.value)}
                                        placeholder={t.addPlaceholder}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium shadow-inner"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isAdding || !searchUsername.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                                    <span className="hidden sm:inline">{t.addButton}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInvite}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 rounded-2xl text-white/60 hover:text-white transition-all active:scale-95 flex items-center justify-center group"
                                    title="Invite a friend"
                                    aria-label="Invite a friend"
                                >
                                    <Share2 size={24} className="group-hover:text-blue-400 transition-colors" />
                                </button>
                            </div>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-down">
                                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                                            <Sparkles size={10} className="text-amber-400" /> {t.suggestions}
                                        </span>
                                        <button onClick={() => setShowSuggestions(false)} className="text-white/20 hover:text-white">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                                        {suggestions.map(s => (
                                            <button
                                                key={s.uid}
                                                onClick={() => handleAdd(s.username)}
                                                className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                                            >
                                                <img src={s.photoURL || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full border border-white/10" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm truncate text-white">@{s.username}</div>
                                                    <div className="text-[10px] text-emerald-400 font-bold uppercase">{t.commonFriends(s.commonCount)}</div>
                                                </div>
                                                <UserPlus size={16} className="text-blue-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && <div className="absolute -bottom-7 left-2 flex items-center gap-2 text-red-400 text-xs animate-shake"><AlertTriangle size={12} /> {error}</div>}
                            {success && <div className="absolute -bottom-7 left-2 text-emerald-400 text-xs animate-fade-in">{success}</div>}
                        </form>

                        {/* --- PENDING REQUESTS --- */}
                        {requests.length > 0 && (
                            <div className="mb-10 animate-fade-in-up">
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Bell size={14} /> {t.requests}
                                </h3>
                                <div className="space-y-3">
                                    {requests.map((req) => (
                                        <div key={req.id} className="glass-panel-3d p-4 rounded-3xl flex items-center gap-4 bg-blue-500/5 border-blue-500/20">
                                            <img src={req.fromPhoto || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold truncate text-white">@{req.fromName}</h4>
                                                <p className="text-[10px] text-white/30 uppercase font-black">Want to be friends</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => onRespondRequest(req.id, false)} className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all" aria-label={t.decline}><X size={20} /></button>
                                                <button onClick={() => onRespondRequest(req.id, true)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all" aria-label={t.accept}><Check size={20} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- LEADERBOARD --- */}
                        <div className="mb-10">
                            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Trophy size={14} className="text-amber-500" /> {t.leaderboard}
                            </h3>

                            <div className="space-y-3">
                                {ranking.filter(p => p.currentBac > 0).map((player, index) => {
                                    const isMe = player.uid === 'me' || player.uid === myUid;
                                    const rank = index + 1;
                                    return (
                                        <div
                                            key={player.uid}
                                            onClick={() => !isMe && onSelectFriend(player.uid === 'me' ? myUid : player.uid)}
                                            className={`glass-panel-3d p-4 rounded-3xl flex items-center gap-4 transition-all relative overflow-hidden ${isMe ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' : 'hover:bg-white/5 cursor-pointer active:scale-[0.98]'}`}
                                        >
                                            <div className="w-8 flex justify-center items-center font-black text-lg italic text-white/20">
                                                {rank === 1 ? <Medal size={24} className="text-amber-400" /> : rank === 2 ? <Medal size={24} className="text-slate-300" /> : rank === 3 ? <Medal size={24} className="text-amber-700" /> : rank}
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full animate-pulse opacity-20" style={{ backgroundColor: player.color }} />
                                                <img src={player.photoURL || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border-2 relative z-10 shadow-lg object-cover" style={{ borderColor: player.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold truncate text-left ${isMe ? 'text-blue-400' : 'text-white'}`}>
                                                    @{player.displayName} {isMe && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-1 font-black">VOUS</span>}
                                                </h3>
                                                <p className="text-[10px] text-white/30 truncate uppercase font-black tracking-widest text-left">{player.statusMessage}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="text-xl font-black font-mono leading-none tracking-tighter" style={{ color: player.color }}>{renderBac(player.currentBac)}</div>
                                                {!isMe && <button onClick={(e) => { e.stopPropagation(); onRemoveFriend(player.uid); }} className="mt-1 p-1 text-white/5 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>}
                                            </div>
                                        </div>
                                    );
                                })}

                                {ranking.filter(p => p.currentBac === 0).length > 0 && (
                                    <div className="mt-8">
                                        <button
                                            onClick={() => setIsSoberExpanded(!isSoberExpanded)}
                                            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                                        >
                                            <span className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                                {language === 'fr' ? 'Amis sobres' : 'Sober friends'} ({ranking.filter(p => p.currentBac === 0).length})
                                            </span>
                                            <ChevronLeft size={16} className={`text-white/20 transition-transform duration-300 ${isSoberExpanded ? '-rotate-90' : 'rotate-180'}`} />
                                        </button>

                                        {isSoberExpanded && (
                                            <div className="space-y-3 mt-3 animate-fade-in">
                                                {ranking.filter(p => p.currentBac === 0).map((player) => {
                                                    const isMe = player.uid === 'me' || player.uid === myUid;
                                                    return (
                                                        <div
                                                            key={player.uid}
                                                            onClick={() => !isMe && onSelectFriend(player.uid === 'me' ? myUid : player.uid)}
                                                            className={`glass-panel-3d p-4 rounded-3xl flex items-center gap-4 transition-all relative overflow-hidden opacity-60 hover:opacity-100 ${isMe ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' : 'hover:bg-white/5 cursor-pointer'}`}
                                                        >
                                                            <div className="w-8 flex justify-center items-center font-black text-lg italic text-white/10">•</div>
                                                            <div className="relative">
                                                                <img src={player.photoURL || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full border-2 border-white/10 relative z-10 grayscale-[0.5]" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-left">
                                                                <h3 className={`font-bold truncate text-sm italic ${isMe ? 'text-blue-400' : 'text-white/60'}`}>
                                                                    @{player.displayName}
                                                                </h3>
                                                                <p className="text-[9px] text-white/20 truncate uppercase font-extrabold tracking-widest">{player.statusMessage}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <div className="text-sm font-black text-white/20">{renderBac(player.currentBac)}</div>
                                                                {!isMe && <button onClick={(e) => { e.stopPropagation(); onRemoveFriend(player.uid); }} className="mt-1 p-1 text-white/5 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!loading && friends.length === 0 && (
                                <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10 px-6">
                                    <p className="text-white/30 text-sm font-medium">{t.empty}</p>
                                </div>
                            )}
                            {loading && friends.length === 0 && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/20" size={32} /></div>}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {selectedGroupId ? (
                            <div className="space-y-6">
                                <button onClick={() => setSelectedGroupId(null)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest">
                                    <ChevronLeft size={16} /> {t.groupsTab}
                                </button>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowIconPicker(!showIconPicker)}
                                                className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-3xl transition-all border border-white/10 relative group"
                                            >
                                                {groups.find(g => g.id === selectedGroupId)?.icon || '👥'}
                                                <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-lg p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit2 size={10} className="text-white" />
                                                </div>
                                            </button>

                                            {showIconPicker && (
                                                <div className="absolute top-14 left-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-wrap gap-2 w-48 animate-fade-in">
                                                    {GROUP_ICONS.map(icon => (
                                                        <button
                                                            key={icon}
                                                            onClick={async () => {
                                                                await onUpdateGroupIcon(selectedGroupId!, icon);
                                                                setShowIconPicker(false);
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            {icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-3xl font-black text-white">{groups.find(g => g.id === selectedGroupId)?.name}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAwardsModal(true)}
                                            className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all shadow-lg shadow-amber-500/10"
                                            title={language === 'fr' ? 'Awards du mois' : 'Monthly Awards'}
                                        >
                                            <Trophy size={16} />
                                        </button>
                                        <button onClick={() => setIsInvitingToGroup(true)} className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"><UserPlus size={16} /></button>
                                        <button onClick={() => { onLeaveGroup(selectedGroupId); setSelectedGroupId(null); }} className="p-2 bg-white/5 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"><LogOut size={16} /></button>
                                    </div>
                                </div>

                                {/* Group Privacy Settings — only visible to creator */}
                                {groups.find(g => g.id === selectedGroupId)?.creatorId === myUid && (
                                    <div className="glass-panel-3d rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield size={14} className="text-purple-400" />
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                {language === 'fr' ? 'Confidentialité du groupe' : 'Group Privacy'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-cyan-400" />
                                                <div>
                                                    <p className="text-xs font-bold text-white">
                                                        {language === 'fr' ? 'Visible dans les classements' : 'Show in global rankings'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const g = groups.find(g => g.id === selectedGroupId);
                                                    const newVal = !(g?.showInGlobalRanking !== false);
                                                    onUpdateGroupSettings(selectedGroupId!, { showInGlobalRanking: newVal });
                                                }}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${(groups.find(g => g.id === selectedGroupId)?.showInGlobalRanking !== false) ? 'bg-emerald-500' : 'bg-white/10'
                                                    }`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${(groups.find(g => g.id === selectedGroupId)?.showInGlobalRanking !== false) ? 'left-5' : 'left-0.5'
                                                    }`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {(groups.find(g => g.id === selectedGroupId)?.memberListPublic)
                                                    ? <Eye size={14} className="text-emerald-400" />
                                                    : <EyeOff size={14} className="text-red-400" />}
                                                <div>
                                                    <p className="text-xs font-bold text-white">
                                                        {language === 'fr' ? 'Liste des membres publique' : 'Public member list'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const g = groups.find(g => g.id === selectedGroupId);
                                                    const newVal = !(g?.memberListPublic === true);
                                                    onUpdateGroupSettings(selectedGroupId!, { memberListPublic: newVal });
                                                }}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${(groups.find(g => g.id === selectedGroupId)?.memberListPublic === true) ? 'bg-emerald-500' : 'bg-white/10'
                                                    }`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${(groups.find(g => g.id === selectedGroupId)?.memberListPublic === true) ? 'left-5' : 'left-0.5'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {loadingGroup ? (
                                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/20" size={40} /></div>
                                ) : (
                                    <div className="space-y-3">
                                        {groupRanking.map((player, index) => {
                                            const isMe = player.uid === myUid;
                                            const rank = index + 1;
                                            const isFriend = friends.some(f => f.uid === player.uid);
                                            return (
                                                <div
                                                    key={player.uid}
                                                    onClick={() => {
                                                        if (isMe) return;
                                                        if (isFriend) {
                                                            onSelectFriend(player.uid);
                                                        } else {
                                                            if (window.confirm(t.confirmAddFriend)) {
                                                                onAddFriendByUid(player.uid);
                                                            }
                                                        }
                                                    }}
                                                    className={`glass-panel-3d p-4 rounded-3xl flex items-center gap-4 transition-all relative overflow-hidden ${isMe ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5 cursor-pointer'}`}
                                                >
                                                    <div className="w-8 flex justify-center items-center font-black text-lg italic text-white/20">{rank === 1 ? <Medal size={24} className="text-amber-400" /> : rank === 2 ? <Medal size={24} className="text-slate-300" /> : rank === 3 ? <Medal size={24} className="text-amber-700" /> : rank}</div>
                                                    <div className="relative">
                                                        <div className="absolute inset-0 rounded-full animate-pulse opacity-20" style={{ backgroundColor: player.color }} />
                                                        <img src={player.photoURL || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border-2 relative z-10 shadow-lg object-cover" style={{ borderColor: player.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <h3 className="font-bold truncate text-white italic">@{player.displayName}</h3>
                                                        <p className="text-[10px] text-white/30 truncate uppercase font-black tracking-widest">{player.statusMessage}</p>
                                                    </div>
                                                    <div className="text-xl font-black font-mono tracking-tighter" style={{ color: player.color }}>{renderBac(player.currentBac)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <button onClick={() => setIsCreatingGroup(true)} className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Plus size={20} /> {t.createGroup}
                                </button>

                                {groupInvites.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">{t.groupInvites}</h3>
                                        {groupInvites.map(invite => (
                                            <div key={invite.id} className="glass-panel-3d p-4 rounded-3xl flex items-center justify-between bg-emerald-500/5 border-emerald-500/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-lg">{invite.icon || <Users size={20} className="text-emerald-400" />}</div>
                                                    <span className="font-black text-white">{invite.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => onDeclineGroupInvite(invite.id)} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-red-400 transition-colors"><X size={20} /></button>
                                                    <button onClick={() => onAcceptGroupInvite(invite.id)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><Check size={20} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">{language === 'fr' ? 'Mes Groupes' : 'My Groups'}</h3>
                                    {groups.length === 0 ? (
                                        <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10 px-6">
                                            <p className="text-white/30 text-sm italic font-medium">{t.emptyGroups}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {groups.map(group => (
                                                <button
                                                    key={group.id}
                                                    onClick={async () => {
                                                        setSelectedGroupId(group.id);
                                                        setLoadingGroup(true);
                                                        try {
                                                            const status = await onFetchGroupStatus(group.id);
                                                            setGroupRanking(status);
                                                        } finally {
                                                            setLoadingGroup(false);
                                                        }
                                                    }}
                                                    className="glass-panel-3d p-6 rounded-[32px] flex items-center justify-between hover:bg-white/5 transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-2xl">{group.icon || <Users size={28} className="text-blue-400" />}</div>
                                                        <div>
                                                            <h4 className="font-black text-lg text-white leading-tight">{group.name}</h4>
                                                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">{group.memberIds.length} membres</p>
                                                        </div>
                                                    </div>
                                                    <ChevronLeft size={20} className="rotate-180 text-white/20" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- CREATE GROUP MODAL --- */}
            {isCreatingGroup && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end animate-fade-in">
                    <div className="w-full bg-[#0a0a0a] rounded-t-[40px] p-8 border-t border-white/10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-white">{t.createGroup}</h3>
                            <button onClick={() => setIsCreatingGroup(false)} className="p-2 bg-white/5 rounded-full text-white/40"><X size={24} /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 text-left block">{t.groupName}</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Ex: Soirée Loft #202"
                                    className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                                />
                            </div>

                            {/* Icon Picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 text-left block">Icône</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {GROUP_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setNewGroupIcon(icon)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all flex-shrink-0 ${newGroupIcon === icon ? 'bg-white text-black scale-110 shadow-lg' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 block">{t.selectFriends}</label>
                                <div className="space-y-2">
                                    {friends.length === 0 ? <p className="text-white/20 text-xs italic p-4 text-center">{t.empty}</p> : (
                                        friends.map(friend => {
                                            const isSelected = selectedFriendIds.includes(friend.uid);
                                            return (
                                                <button
                                                    key={friend.uid}
                                                    onClick={() => setSelectedFriendIds(prev => isSelected ? prev.filter(id => id !== friend.uid) : [...prev, friend.uid])}
                                                    className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all border ${isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                >
                                                    <img src={friend.photoURL || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                                                    <span className="flex-1 text-left font-bold truncate text-white italic">@{friend.displayName}</span>
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500' : 'bg-white/10'}`}>{isSelected && <Check size={16} className="text-white" />}</div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 pb-10">
                                <button onClick={() => setIsCreatingGroup(false)} className="flex-1 py-5 rounded-3xl font-black text-white/40 uppercase tracking-widest active:scale-95 transition-all">{t.cancel}</button>
                                <button
                                    disabled={!newGroupName.trim() || selectedFriendIds.length === 0}
                                    onClick={async () => {
                                        await onCreateGroup(newGroupName, selectedFriendIds, newGroupIcon);
                                        setIsCreatingGroup(false);
                                        setNewGroupName('');
                                        setSelectedFriendIds([]);
                                        setNewGroupIcon('🥂');
                                        setActiveTab(SocialTab.GROUPS);
                                    }}
                                    className="flex-[2] bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-20"
                                >
                                    {t.create}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- INVITE TO GROUP MODAL --- */}
            {isInvitingToGroup && selectedGroupId && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end animate-fade-in">
                    <div className="w-full bg-[#0a0a0a] rounded-t-[40px] p-8 border-t border-white/10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-white">{t.addMembers}</h3>
                            <button onClick={() => { setIsInvitingToGroup(false); setSelectedFriendIds([]); }} className="p-2 bg-white/5 rounded-full text-white/40"><X size={24} /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 block">{t.selectFriends}</label>
                                <div className="space-y-2">
                                    {friends.filter(f => !groupRanking.some(member => member.uid === f.uid)).length === 0 ? (
                                        <p className="text-white/20 text-xs italic p-4 text-center">{t.empty}</p>
                                    ) : (
                                        friends
                                            .filter(f => !groupRanking.some(member => member.uid === f.uid))
                                            .map(friend => {
                                                const isSelected = selectedFriendIds.includes(friend.uid);
                                                return (
                                                    <button
                                                        key={friend.uid}
                                                        onClick={() => setSelectedFriendIds(prev => isSelected ? prev.filter(id => id !== friend.uid) : [...prev, friend.uid])}
                                                        className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all border ${isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                    >
                                                        <img src={friend.photoURL || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                                                        <span className="flex-1 text-left font-bold truncate text-white italic">@{friend.displayName}</span>
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500' : 'bg-white/10'}`}>{isSelected && <Check size={16} className="text-white" />}</div>
                                                    </button>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 pb-10">
                                <button onClick={() => { setIsInvitingToGroup(false); setSelectedFriendIds([]); }} className="flex-1 py-5 rounded-3xl font-black text-white/40 uppercase tracking-widest active:scale-95 transition-all">{t.cancel}</button>
                                <button
                                    disabled={selectedFriendIds.length === 0}
                                    onClick={async () => {
                                        await onInviteToGroup(selectedGroupId, selectedFriendIds);
                                        setIsInvitingToGroup(false);
                                        setSelectedFriendIds([]);
                                    }}
                                    className="flex-[2] bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-20"
                                >
                                    {t.invite}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- AWARDS MODAL --- */}
            {showAwardsModal && selectedGroupId && (
                <AwardsModal
                    groupId={selectedGroupId}
                    groupName={groups.find(g => g.id === selectedGroupId)?.name || ''}
                    awards={awards}
                    loading={awardsLoading}
                    selectedMonth={awardsMonth}
                    onFetchAwards={onFetchGroupAwards}
                    onClose={() => setShowAwardsModal(false)}
                    language={language}
                    myUid={myUid}
                />
            )}
        </div>
    );
};
