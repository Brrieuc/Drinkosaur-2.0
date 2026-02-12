
import React, { useState, useMemo, useRef } from 'react';
import { FriendStatus, UserProfile, BacStatus } from '../types';
import { FriendRequest } from '../hooks/useSocial';
import { UserPlus, Loader2, Beer, AlertTriangle, Trash2, Check, X, Bell, Trophy, Medal, RefreshCw } from 'lucide-react';

interface SocialProps {
    friends: FriendStatus[];
    requests: FriendRequest[];
    myProfile: UserProfile;
    myBac: BacStatus;
    onAddFriend: (username: string) => Promise<any>;
    onRespondRequest: (requestId: string, accept: boolean) => Promise<void>;
    onRemoveFriend: (uid: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    loading: boolean;
    language: 'en' | 'fr';
}

export const Social: React.FC<SocialProps> = ({
    friends,
    requests,
    myProfile,
    myBac,
    onAddFriend,
    onRespondRequest,
    onRemoveFriend,
    onRefresh,
    loading,
    language
}) => {
    const [searchUsername, setSearchUsername] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // --- PULL TO REFRESH STATES ---
    const [startY, setStartY] = useState(0);
    const [pullOffset, setPullOffset] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const REFRESH_THRESHOLD = 80;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchUsername.trim();
        if (!trimmed) return;

        setIsAdding(true);
        setError(null);
        setSuccess(null);

        try {
            await onAddFriend(trimmed);
            setSuccess(language === 'fr' ? 'Demande envoyée !' : 'Request sent!');
            setSearchUsername('');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Error adding friend');
        } finally {
            setIsAdding(false);
        }
    };

    const t = {
        title: language === 'fr' ? 'Mes Amis' : 'Friends',
        leaderboard: language === 'fr' ? 'Classement' : 'Leaderboard',
        addDesc: language === 'fr' ? 'Ajoutez un ami par son pseudo.' : 'Add a friend by their username.',
        addPlaceholder: language === 'fr' ? 'pseudo' : 'username',
        addButton: language === 'fr' ? 'Ajouter' : 'Add',
        empty: language === 'fr' ? 'Aucun ami pour le moment.' : 'No friends yet.',
        live: language === 'fr' ? 'EN DIRECT' : 'LIVE',
        requests: language === 'fr' ? 'Demandes en attente' : 'Pending Requests',
        accept: language === 'fr' ? 'Accepter' : 'Accept',
        decline: language === 'fr' ? 'Refuser' : 'Decline',
        you: language === 'fr' ? 'Moi' : 'Me',
        pull: language === 'fr' ? 'Tirez pour rafraîchir' : 'Pull to refresh',
        release: language === 'fr' ? 'Relâchez pour rafraîchir' : 'Release to refresh'
    };

    // --- LEADERBOARD LOGIC ---
    const ranking = useMemo(() => {
        const me: FriendStatus = {
            uid: 'me',
            displayName: myProfile.username || t.you,
            photoURL: myProfile.customPhotoURL || myProfile.photoURL,
            currentBac: myBac.currentBac,
            color: myBac.color,
            statusMessage: myBac.statusMessage,
            lastUpdate: Date.now()
        };

        return [...friends, me].sort((a, b) => b.currentBac - a.currentBac);
    }, [friends, myBac, myProfile, t.you]);

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
            // Apply resistance
            const offset = Math.min(diff * 0.4, 150);
            setPullOffset(offset);
            if (offset > 10) {
                // Prevent default only if we are actually pulling
                if (e.cancelable) e.preventDefault();
            }
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
            className="flex-1 flex flex-col p-6 pb-40 overflow-y-auto no-scrollbar animate-fade-in touch-pan-y"
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
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight flex items-center gap-3">
                    <Beer className="text-amber-400" /> {t.title}
                </h2>
                <p className="text-white/50 text-sm mb-8">{t.addDesc}</p>

                {/* --- ADD FRIEND FORM --- */}
                <form onSubmit={handleAdd} className="relative mb-10">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30 font-bold">@</span>
                            <input
                                type="text"
                                value={searchUsername}
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
                    </div>

                    {error && (
                        <div className="absolute -bottom-7 left-2 flex items-center gap-2 text-red-400 text-xs animate-shake">
                            <AlertTriangle size={12} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="absolute -bottom-7 left-2 text-emerald-400 text-xs animate-fade-in">
                            {success}
                        </div>
                    )}
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
                                        <h4 className="font-bold truncate">@{req.fromName}</h4>
                                        <p className="text-[10px] text-white/30 uppercase font-black">Want to be friends</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onRespondRequest(req.id, false)}
                                            className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button
                                            onClick={() => onRespondRequest(req.id, true)}
                                            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                                        >
                                            <Check size={20} />
                                        </button>
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
                        {ranking.map((player, index) => {
                            const isMe = player.uid === 'me';
                            const rank = index + 1;

                            return (
                                <div
                                    key={player.uid}
                                    className={`glass-panel-3d p-4 rounded-3xl flex items-center gap-4 transition-all relative overflow-hidden ${isMe ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' : 'hover:bg-white/5'}`}
                                >
                                    {/* Rank Number / Icon */}
                                    <div className="w-8 flex justify-center items-center font-black text-lg italic text-white/20">
                                        {rank === 1 ? <Medal size={24} className="text-amber-400" /> : rank === 2 ? <Medal size={24} className="text-slate-300" /> : rank === 3 ? <Medal size={24} className="text-amber-700" /> : rank}
                                    </div>

                                    {/* Avatar with BAC pulse */}
                                    <div className="relative">
                                        <div
                                            className="absolute inset-0 rounded-full animate-pulse opacity-20"
                                            style={{ backgroundColor: player.color }}
                                        />
                                        {player.photoURL ? (
                                            <img src={player.photoURL} alt={player.displayName} className="w-12 h-12 rounded-full border-2 relative z-10 shadow-lg object-cover" style={{ borderColor: player.color }} />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold relative z-10 border-2" style={{ borderColor: player.color }}>
                                                {player.displayName[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold truncate ${isMe ? 'text-blue-400' : 'text-white'}`}>
                                                @{player.displayName} {isMe && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-1 font-black">VOUS</span>}
                                            </h3>
                                        </div>
                                        <p className="text-[10px] text-white/30 truncate uppercase font-black tracking-widest">{player.statusMessage}</p>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <div
                                            className="text-2xl font-black font-mono leading-none tracking-tighter"
                                            style={{ color: player.color }}
                                        >
                                            {player.currentBac.toFixed(2)}
                                        </div>
                                        {!isMe && (
                                            <button
                                                onClick={() => onRemoveFriend(player.uid)}
                                                className="mt-1 p-1 text-white/5 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!loading && friends.length === 0 && (
                        <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10 px-6">
                            <p className="text-white/30 text-sm">{t.empty}</p>
                        </div>
                    )}

                    {loading && friends.length === 0 && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-white/20" size={32} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
