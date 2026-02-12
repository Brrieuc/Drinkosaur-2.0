
import React, { useState } from 'react';
import { FriendStatus } from '../types';
import { FriendRequest } from '../hooks/useSocial';
import { UserPlus, Loader2, Beer, AlertTriangle, Trash2, Check, X, Bell } from 'lucide-react';

interface SocialProps {
    friends: FriendStatus[];
    requests: FriendRequest[];
    onAddFriend: (username: string) => Promise<any>;
    onRespondRequest: (requestId: string, accept: boolean) => Promise<void>;
    onRemoveFriend: (uid: string) => Promise<void>;
    loading: boolean;
    language: 'en' | 'fr';
}

export const Social: React.FC<SocialProps> = ({ friends, requests, onAddFriend, onRespondRequest, onRemoveFriend, loading, language }) => {
    const [searchUsername, setSearchUsername] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
        addDesc: language === 'fr' ? 'Ajoutez un ami par son pseudo.' : 'Add a friend by their username.',
        addPlaceholder: language === 'fr' ? 'pseudo' : 'username',
        addButton: language === 'fr' ? 'Ajouter' : 'Add',
        empty: language === 'fr' ? 'Aucun ami pour le moment.' : 'No friends yet.',
        live: language === 'fr' ? 'EN DIRECT' : 'LIVE',
        requests: language === 'fr' ? 'Demandes en attente' : 'Pending Requests',
        accept: language === 'fr' ? 'Accepter' : 'Accept',
        decline: language === 'fr' ? 'Refuser' : 'Decline',
    };

    return (
        <div className="flex-1 flex flex-col p-6 pb-40 overflow-y-auto no-scrollbar animate-fade-in">
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
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
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

            {/* --- FRIENDS LIST --- */}
            <div className="space-y-4">
                {loading && friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/20">
                        <Loader2 className="animate-spin mb-4" size={40} />
                    </div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-white/30">{t.empty}</p>
                    </div>
                ) : (
                    friends.map((friend) => (
                        <div key={friend.uid} className="glass-panel-3d p-4 rounded-3xl flex items-center gap-4 group hover:bg-white/5 transition-all">
                            {/* Avatar with BAC pulse */}
                            <div className="relative">
                                <div
                                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                                    style={{ backgroundColor: friend.color }}
                                />
                                {friend.photoURL ? (
                                    <img src={friend.photoURL} alt={friend.displayName} className="w-14 h-14 rounded-full border-2 relative z-10 shadow-lg object-cover" style={{ borderColor: friend.color }} />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold relative z-10 border-2" style={{ borderColor: friend.color }}>
                                        {friend.displayName[0]}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold truncate">@{friend.displayName}</h3>
                                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded leading-none shrink-0 border border-emerald-500/30">
                                        {t.live}
                                    </span>
                                </div>
                                <p className="text-xs text-white/50 truncate italic">"{friend.statusMessage}"</p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div
                                    className="text-2xl font-black font-mono leading-none"
                                    style={{ color: friend.color }}
                                >
                                    {friend.currentBac.toFixed(2)}
                                </div>
                                <button
                                    onClick={() => onRemoveFriend(friend.uid)}
                                    className="p-2 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
