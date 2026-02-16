import React, { useEffect, useState } from 'react';
import { UserProfile, Drink } from '../types';
import { useAdmin } from '../hooks/useAdmin';
import { Search, Loader2, Save, Trash2, Ban, ShieldCheck, ArrowLeft, RefreshCw, Edit2, X, Mail } from 'lucide-react';

interface AdminDashboardProps {
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const { adminGetAllUsers, adminUpdateUser, adminWipeDrinks, adminToggleBan, adminGetUserDrinks, adminUpdateDrink, adminDeleteDrink, adminSendMessage, loading } = useAdmin();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Drinks Management State
    const [userDrinks, setUserDrinks] = useState<Drink[]>([]);
    const [loadingDrinks, setLoadingDrinks] = useState(false);
    const [editingDrink, setEditingDrink] = useState<Drink | null>(null);

    // Stats editing state
    const [editWeight, setEditWeight] = useState(0);
    const [editGender, setEditGender] = useState<'male' | 'female'>('male');

    // Message Modal State
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageBody, setMessageBody] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers(users);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(u =>
                (u.username?.toLowerCase().includes(lower)) ||
                (u.displayName?.toLowerCase().includes(lower)) ||
                (u.uid?.includes(lower))
            ));
        }
    }, [searchTerm, users]);

    const loadUsers = async () => {
        const data = await adminGetAllUsers();
        setUsers(data);
    };

    const handleSelectUser = async (user: UserProfile) => {
        setSelectedUser(user);
        setEditWeight(user.weightKg || 70);
        setEditGender(user.gender || 'male');

        // Load drinks
        if (user.uid) {
            setLoadingDrinks(true);
            const drinks = await adminGetUserDrinks(user.uid);
            setUserDrinks(drinks.sort((a, b) => b.timestamp - a.timestamp));
            setLoadingDrinks(false);
        } else {
            setUserDrinks([]);
        }
    };

    const handleSaveStats = async () => {
        if (!selectedUser?.uid) return;
        const success = await adminUpdateUser(selectedUser.uid, {
            weightKg: editWeight,
            gender: editGender
        });

        if (success) {
            alert("User stats updated successfully");
            loadUsers(); // refresh list
            // Update local selected user
            setSelectedUser(prev => prev ? { ...prev, weightKg: editWeight, gender: editGender } : null);
        } else {
            alert("Failed to update user");
        }
    };

    const handleWipeDrinks = async () => {
        if (!selectedUser?.uid) return;
        const success = await adminWipeDrinks(selectedUser.uid);
        if (success) {
            alert("Drinks wiped successfully");
            setUserDrinks([]);
        }
    };

    const handleDeleteDrink = async (drinkId: string) => {
        if (!selectedUser?.uid) return;
        const success = await adminDeleteDrink(selectedUser.uid, drinkId, userDrinks);
        if (success) {
            setUserDrinks(prev => prev.filter(d => d.id !== drinkId));
        }
    };

    const handleUpdateDrink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser?.uid || !editingDrink) return;

        const success = await adminUpdateDrink(selectedUser.uid, editingDrink, userDrinks);
        if (success) {
            setUserDrinks(prev => prev.map(d => d.id === editingDrink.id ? editingDrink : d).sort((a, b) => b.timestamp - a.timestamp));
            setEditingDrink(null);
        }
    };

    const handleToggleBan = async () => {
        if (!selectedUser?.uid) return;
        const success = await adminToggleBan(selectedUser.uid, selectedUser.isBanned);
        if (success) {
            const newStatus = !selectedUser.isBanned;
            alert(`User ${newStatus ? 'BANNED' : 'UNBANNED'}`);
            loadUsers();
            setSelectedUser(prev => prev ? { ...prev, isBanned: newStatus } : null);
        }
    };

    const handleToggleAdmin = async () => {
        if (!selectedUser?.uid) return;
        if (!window.confirm(`Make ${selectedUser.username} an ADMIN?`)) return;

        const newStatus = !selectedUser.isAdmin;
        const success = await adminUpdateUser(selectedUser.uid, { isAdmin: newStatus });
        if (success) {
            alert(`User admin status: ${newStatus}`);
            loadUsers();
            setSelectedUser(prev => prev ? { ...prev, isAdmin: newStatus } : null);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser?.uid || !messageTitle || !messageBody) return;

        const success = await adminSendMessage(selectedUser.uid, messageTitle, messageBody);
        if (success) {
            alert("Message sent!");
            setShowMessageModal(false);
            setMessageTitle('');
            setMessageBody('');
        }
    };


    return (
        <div className="w-full h-full flex flex-col bg-[#050505] text-white p-4 pt-[env(safe-area-inset-top)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <ShieldCheck size={24} /> Admin Dashboard
                </h1>
                <button onClick={loadUsers} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Reload Users">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* User List & Search */}
                <div className={`flex-1 flex flex-col gap-4 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="Search users (username, uid)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:border-red-500/50 outline-none transition-all"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {loading && users.length === 0 ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-red-500" /></div>
                        ) : filteredUsers.map(user => (
                            <div
                                key={user.uid || Math.random()}
                                onClick={() => handleSelectUser(user)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5 flex items-center gap-3 ${selectedUser?.uid === user.uid ? 'bg-red-500/10 border-red-500/50' : 'bg-black/20 border-white/5'}`}
                            >
                                <img
                                    src={user.customPhotoURL || user.photoURL || 'https://via.placeholder.com/40'}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full bg-white/10 object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm truncate">@{user.username || 'Unnamed'}</p>
                                        {user.isAdmin && <ShieldCheck size={12} className="text-red-500" />}
                                        {user.isBanned && <Ban size={12} className="text-gray-500" />}
                                    </div>
                                    <p className="text-[10px] text-white/40 truncate">{user.uid}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-white/60">{user.habitLevel || 'N/A'}</p>
                                    {user.weightKg && <p className="text-[10px] text-white/30">{user.weightKg}kg</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-white/20 text-center">{filteredUsers.length} users found</p>
                </div>

                {/* User Details Panel */}
                {selectedUser ? (
                    <div className="flex-1 md:flex-[1.5] bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto animate-fade-in flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <button className="md:hidden p-2 -ml-2 text-white/40" onClick={() => setSelectedUser(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <img
                                src={selectedUser.customPhotoURL || selectedUser.photoURL || 'https://via.placeholder.com/80'}
                                alt="avatar"
                                className="w-20 h-20 rounded-[24px] bg-black/40 border-2 border-white/10 object-cover"
                            />
                            <div>
                                <h2 className="text-2xl font-black">@{selectedUser.username}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedUser.isAdmin && <span className="text-[10px] bg-red-500 px-2 py-0.5 rounded text-white font-bold">ADMIN</span>}
                                    {selectedUser.isBanned && <span className="text-[10px] bg-gray-500 px-2 py-0.5 rounded text-white font-bold">BANNED</span>}
                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 font-mono">{selectedUser.uid}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Stats Editor */}
                            <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                <h3 className="text-sm font-bold uppercase text-white/40">Physical Stats</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase text-white/30 font-bold block mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={editWeight}
                                            onChange={(e) => setEditWeight(Number(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-white/30 font-bold block mb-1">Gender</label>
                                        <select
                                            value={editGender}
                                            onChange={(e) => setEditGender(e.target.value as 'male' | 'female')}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-bold"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveStats}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>

                            {/* Raw Data Preview */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold uppercase text-white/40">Raw Data</h3>
                                <pre className="text-[10px] text-white/60 font-mono bg-black/40 p-4 rounded-xl overflow-x-auto max-h-40 border border-white/5">
                                    {JSON.stringify(selectedUser, null, 2)}
                                </pre>
                            </div>

                            {/* Drinks History */}
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <h3 className="text-sm font-bold uppercase text-white/40 flex items-center justify-between">
                                    Drink History
                                    <span className="text-[10px] bg-white/10 px-2 rounded-full text-white">{userDrinks.length}</span>
                                </h3>
                                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden max-h-80 overflow-y-auto">
                                    {loadingDrinks ? (
                                        <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-white/30" /></div>
                                    ) : userDrinks.length === 0 ? (
                                        <div className="p-4 text-center text-[10px] text-white/30">No drinks recorded</div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {userDrinks.map(drink => (
                                                <div key={drink.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">
                                                            {drink.icon || '🍺'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-white">{drink.name}</p>
                                                            <p className="text-[10px] text-white/40 flex items-center gap-2">
                                                                <span>{drink.volumeMl}ml</span>
                                                                <span>•</span>
                                                                <span>{drink.abv}%</span>
                                                                <span>•</span>
                                                                <span>{new Date(drink.timestamp).toLocaleDateString()}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setEditingDrink(drink)}
                                                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDrink(drink.id)}
                                                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Communication */}
                            <div className="space-y-3 mt-auto pt-6 border-t border-white/10">
                                <h3 className="text-sm font-bold uppercase text-blue-400/60">Communication</h3>
                                <button
                                    onClick={() => setShowMessageModal(true)}
                                    className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Mail size={16} /> Send Message
                                </button>
                            </div>

                            {/* Dangerous Actions */}
                            <div className="space-y-3 mt-6 pt-6 border-t border-white/10">
                                <h3 className="text-sm font-bold uppercase text-red-500/60">Danger Zone</h3>

                                <button
                                    onClick={handleWipeDrinks}
                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> Wipe All Drinks
                                </button>

                                <button
                                    onClick={handleToggleBan}
                                    className={`w-full py-3 border rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors ${selectedUser.isBanned
                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                        : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border-gray-500/20'
                                        }`}
                                >
                                    <Ban size={16} /> {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                                </button>

                                <button
                                    onClick={handleToggleAdmin}
                                    className="w-full py-3 bg-transparent text-white/20 hover:text-white/50 text-[10px] uppercase font-bold transition-colors"
                                >
                                    {selectedUser.isAdmin ? 'Revoke Admin Access' : 'Grant Admin Access'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-[1.5] items-center justify-center text-white/20 font-bold uppercase tracking-widest text-sm bg-white/5 rounded-2xl border border-white/5">
                        Select a user to view details
                    </div>
                )}
            </div>

            {/* Edit Drink Modal */}
            {editingDrink && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-bounce-in">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">Edit Drink</h3>
                            <button onClick={() => setEditingDrink(null)} className="text-white/40 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateDrink} className="space-y-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingDrink.name}
                                    onChange={e => setEditingDrink({ ...editingDrink, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Volume (ml)</label>
                                    <input
                                        type="number"
                                        value={editingDrink.volumeMl}
                                        onChange={e => setEditingDrink({ ...editingDrink, volumeMl: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">ABV (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editingDrink.abv}
                                        onChange={e => setEditingDrink({ ...editingDrink, abv: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs mt-2"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-bounce-in">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Mail className="text-blue-400" size={20} />
                                Send Message
                            </h3>
                            <button onClick={() => setShowMessageModal(false)} className="text-white/40 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-white/60">
                            Sending to: <span className="font-bold text-white">@{selectedUser?.username}</span>
                        </p>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={messageTitle}
                                    onChange={e => setMessageTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                    placeholder="Important Update"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Message</label>
                                <textarea
                                    value={messageBody}
                                    onChange={e => setMessageBody(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none min-h-[120px]"
                                    placeholder="Type your message here..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-blue-900/20"
                            >
                                Send Notification
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
