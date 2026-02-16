import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Ban, Mail, Loader2, Send } from 'lucide-react';
import { Background } from './Background';

// We need a way to send an appeal. The user is logged in but banned.
// We can use a specific function from useAdmin or useUser, or just a direct firestore call here if simple.
// Since useAdmin is for admins, let's use a simple direct update here or add 'submitAppeal' to useUser?
// useUser is good but might require the user to be fully loaded which might be blocked by App.tsx logic.
// Let's implement the logic here using useUser's saveUser or similar.

interface BannedScreenProps {
    user: UserProfile;
    onAppealSent?: () => void;
}

// Importing db to send appeal directly to avoid circular dependency orcomplex hooks
import { doc, updateDoc, db } from '../firebase';

export const BannedScreen: React.FC<BannedScreenProps> = ({ user }) => {
    const [appealMessage, setAppealMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendAppeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appealMessage.trim() || !user.uid) return;

        setSending(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                banAppealMessage: appealMessage,
                banAppealTimestamp: Date.now()
            });
            setSent(true);
        } catch (err) {
            console.error("Error sending appeal:", err);
            alert("Failed to send appeal. Please try again later.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center p-6">
            <Background />

            <div className="relative z-10 w-full max-w-md bg-[#1a1a1a]/90 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-2xl animate-bounce-in text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <Ban size={40} className="text-red-500" />
                </div>

                <h1 className="text-3xl font-black uppercase text-red-500 mb-2">Account Banned</h1>
                <p className="text-white/60 mb-8 font-medium">
                    Access to Drinkosaur has been restricted for this account.
                </p>

                {user.banReason && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8 text-left">
                        <p className="text-[10px] uppercase font-bold text-red-400 mb-1">Reason for ban</p>
                        <p className="text-sm font-bold text-white/90">{user.banReason}</p>
                    </div>
                )}

                {!sent ? (
                    <form onSubmit={handleSendAppeal} className="space-y-4">
                        <div className="text-left">
                            <label className="text-[10px] uppercase font-bold text-white/40 block mb-2 pl-1">
                                Appeal to Admin
                            </label>
                            <textarea
                                value={appealMessage}
                                onChange={(e) => setAppealMessage(e.target.value)}
                                placeholder="Explain why your ban should be lifted..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-red-500/50 outline-none min-h-[120px] resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-4 bg-white hover:bg-gray-200 text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            {sending ? 'Sending...' : 'Submit Appeal'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 animate-fade-in">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Mail size={20} />
                            </div>
                            <h3 className="text-emerald-400 font-bold uppercase text-sm">Appeal Sent</h3>
                            <p className="text-xs text-emerald-200/60 leading-relaxed">
                                Your message has been sent to the administrators. You will be notified if your account access is restored.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[10px] text-white/20 font-mono">User ID: {user.uid}</p>
                </div>
            </div>
        </div>
    );
};
