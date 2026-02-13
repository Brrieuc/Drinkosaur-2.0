import React, { useState } from 'react';
import { FriendGroup } from '../types';
import { FriendRequest } from '../hooks/useSocial';
import { AwardNotification } from '../hooks/useAwardNotifications';
import { ComputedAward } from '../constants/awards';
import { AwardsModal } from './AwardsModal';
import { X, Bell, UserPlus, Users, Check, Trophy } from 'lucide-react';

interface NotificationsModalProps {
    requests: FriendRequest[];
    invites: FriendGroup[];
    onClose: () => void;
    onRespondRequest: (requestId: string, accept: boolean) => void;
    onAcceptGroup: (groupId: string) => void;
    onDeclineGroup: (groupId: string) => void;
    language?: 'en' | 'fr';
    // Award notification props
    awardNotifications: AwardNotification[];
    onMarkAwardRead: (notificationId: string) => void;
    awards: ComputedAward[];
    awardsLoading: boolean;
    awardsMonth: { month: number; year: number };
    onFetchGroupAwards: (groupId: string, month: number, year: number) => void;
    myUid: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    requests,
    invites,
    onClose,
    onRespondRequest,
    onAcceptGroup,
    onDeclineGroup,
    language = 'en',
    awardNotifications,
    onMarkAwardRead,
    awards,
    awardsLoading,
    awardsMonth,
    onFetchGroupAwards,
    myUid
}) => {
    const isFrench = language === 'fr';
    const [openAwardsNotif, setOpenAwardsNotif] = useState<AwardNotification | null>(null);

    const t = {
        title: isFrench ? 'Notifications' : 'Notifications',
        friendRequests: isFrench ? 'Demandes d\'amis' : 'Friend Requests',
        groupInvites: isFrench ? 'Invitations de groupe' : 'Group Invites',
        awards: 'Awards',
        empty: isFrench ? 'Aucune notification' : 'No notifications',
        accept: isFrench ? 'Accepter' : 'Accept',
        decline: isFrench ? 'Refuser' : 'Decline',
        friendRequestDesc: isFrench ? 'veut être ami' : 'wants to be friends',
        groupInviteDesc: isFrench ? 'vous invite à rejoindre' : 'invites you to join'
    };

    const hasContent = requests.length > 0 || invites.length > 0 || awardNotifications.length > 0;

    const handleOpenAwardNotif = (notif: AwardNotification) => {
        onMarkAwardRead(notif.id);
        setOpenAwardsNotif(notif);
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fade-in" onClick={onClose}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                <div
                    className="relative w-full max-w-lg bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] rounded-t-[40px] border-t border-white/10 shadow-[0_-10px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxHeight: '85vh' }}
                >
                    {/* Glow decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pb-2 relative z-10">
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-2xl">
                                <Bell size={22} className="text-blue-400" />
                            </div>
                            {t.title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 pt-4 overflow-y-auto no-scrollbar relative z-10" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                        {!hasContent ? (
                            <div className="text-center py-12">
                                <Bell size={48} className="text-white/20 mx-auto mb-4" />
                                <p className="text-white/40 font-bold">{t.empty}</p>
                            </div>
                        ) : (
                            <div className="space-y-8">

                                {/* Award Notifications — Shown first for visibility */}
                                {awardNotifications.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <Trophy size={14} className="text-amber-400" /> {t.awards}
                                        </h3>
                                        <div className="space-y-3">
                                            {awardNotifications.map((notif) => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => handleOpenAwardNotif(notif)}
                                                    className={`w-full text-left glass-panel-3d p-4 rounded-3xl flex items-center gap-4 transition-all active:scale-[0.98] relative overflow-hidden group ${notif.isRead
                                                            ? 'opacity-50 bg-white/[0.02]'
                                                            : 'bg-amber-500/5 border-amber-500/20'
                                                        }`}
                                                >
                                                    {/* Unread glow effect */}
                                                    {!notif.isRead && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 animate-pulse pointer-events-none" />
                                                    )}

                                                    {/* Icon */}
                                                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${notif.isRead
                                                            ? 'bg-white/5 border-white/10 text-white/30'
                                                            : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400'
                                                        }`}>
                                                        {notif.groupIcon ? (
                                                            <span className="text-2xl">{notif.groupIcon}</span>
                                                        ) : (
                                                            <Trophy size={22} />
                                                        )}
                                                        {/* Unread dot */}
                                                        {!notif.isRead && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#1a1a2e] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                                        )}
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 min-w-0 relative">
                                                        <p className={`text-sm font-bold leading-snug ${notif.isRead ? 'text-white/40' : 'text-white'}`}>
                                                            {isFrench
                                                                ? <>🦕 Drinkosaur au rapport ! Les awards du groupe "<span className="text-amber-400 font-black">{notif.groupName}</span>" sont révélées !</>
                                                                : <>🦕 Drinkosaur reporting! Awards for group "<span className="text-amber-400 font-black">{notif.groupName}</span>" are revealed!</>
                                                            }
                                                        </p>
                                                        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-1.5">
                                                            {new Intl.DateTimeFormat(isFrench ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' }).format(
                                                                new Date(notif.year, notif.month)
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Arrow */}
                                                    <div className={`text-white/20 group-hover:text-white/40 transition-colors shrink-0 ${notif.isRead ? '' : 'text-amber-400/40'}`}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="9 18 15 12 9 6"></polyline>
                                                        </svg>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Friend Requests */}
                                {requests.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <UserPlus size={14} /> {t.friendRequests}
                                        </h3>
                                        <div className="space-y-3">
                                            {requests.map((req) => (
                                                <div key={req.id} className="glass-panel-3d p-4 rounded-3xl flex items-center gap-4 bg-blue-500/5 border-blue-500/20">
                                                    <img src={req.fromPhoto || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold truncate text-white">@{req.fromName}</h4>
                                                        <p className="text-[10px] text-white/30 uppercase font-black">{t.friendRequestDesc}</p>
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

                                {/* Group Invites */}
                                {invites.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <Users size={14} /> {t.groupInvites}
                                        </h3>
                                        <div className="space-y-3">
                                            {invites.map((group) => (
                                                <div key={group.id} className="glass-panel-3d p-4 rounded-3xl flex items-center gap-4 bg-purple-500/5 border-purple-500/20">
                                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-300">
                                                        <Users size={24} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold truncate text-white">{group.name}</h4>
                                                        <p className="text-[10px] text-white/30 uppercase font-black">{t.groupInviteDesc}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => onDeclineGroup(group.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all" aria-label={t.decline}><X size={20} /></button>
                                                        <button onClick={() => onAcceptGroup(group.id)} className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all" aria-label={t.accept}><Check size={20} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Awards Modal — opened from notification click */}
            {openAwardsNotif && (
                <AwardsModal
                    groupId={openAwardsNotif.groupId}
                    groupName={openAwardsNotif.groupName}
                    awards={awards}
                    loading={awardsLoading}
                    selectedMonth={awardsMonth}
                    onFetchAwards={onFetchGroupAwards}
                    onClose={() => setOpenAwardsNotif(null)}
                    language={language as 'en' | 'fr'}
                    myUid={myUid}
                />
            )}
        </>
    );
};
