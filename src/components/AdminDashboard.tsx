import React, { useEffect, useState } from 'react';
import { UserProfile, Drink } from '../types';
import { useAdmin } from '../hooks/useAdmin';
import { Search, Loader2, Save, Trash2, Ban, ShieldCheck, ArrowLeft, RefreshCw, Edit2, X, Mail, CheckSquare, RotateCcw } from 'lucide-react';

interface AdminDashboardProps {
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const { adminGetAllUsers, adminUpdateUser, adminWipeDrinks, adminGetUserDrinks, adminUpdateDrink, adminDeleteDrink, adminDeleteDrinks, adminRestoreDrink, adminGetDeletedDrinks, adminBanUser, adminUnbanUser, adminDismissAppeal, adminSendMessage, loading } = useAdmin();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Drinks Management State
    const [userDrinks, setUserDrinks] = useState<Drink[]>([]);
    const [loadingDrinks, setLoadingDrinks] = useState(false);
    const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
    const [selectedDrinkIds, setSelectedDrinkIds] = useState<Set<string>>(new Set());
    const [viewDeletedDrinks, setViewDeletedDrinks] = useState(false);
    const [deletedDrinks, setDeletedDrinks] = useState<Drink[]>([]);

    // Ban Logic
    const [showBanModal, setShowBanModal] = useState(false);
    const [banReason, setBanReason] = useState('');

    // Stats editing state
    const [editWeight, setEditWeight] = useState(0);
    const [editGender, setEditGender] = useState<'male' | 'female'>('male');

    // Message Modal State
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageBody, setMessageBody] = useState('');

    // View management
    const [viewMode, setViewMode] = useState<'users' | 'appeals'>('users');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        let baseUsers = users;
        if (viewMode === 'appeals') {
            baseUsers = users.filter(u => u.banAppealMessage && u.isBanned);
        }

        if (!searchTerm) {
            setFilteredUsers(baseUsers);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredUsers(baseUsers.filter(u =>
                (u.username?.toLowerCase().includes(lower)) ||
                (u.displayName?.toLowerCase().includes(lower)) ||
                (u.uid?.includes(lower))
            ));
        }
    }, [searchTerm, users, viewMode]);

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
        setSelectedDrinkIds(new Set());
        setViewDeletedDrinks(false);
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



    const handleBulkDelete = async () => {
        if (!selectedUser?.uid || selectedDrinkIds.size === 0) return;
        if (!window.confirm(`Delete ${selectedDrinkIds.size} drinks?`)) return;

        const ids = Array.from(selectedDrinkIds);
        const success = await adminDeleteDrinks(selectedUser.uid, ids, userDrinks);

        if (success) {
            setUserDrinks(prev => prev.filter(d => !selectedDrinkIds.has(d.id)));
            setSelectedDrinkIds(new Set());
        }
    };

    const handleRestoreDrink = async (drink: Drink) => {
        if (!selectedUser?.uid) return;
        const success = await adminRestoreDrink(selectedUser.uid, drink, userDrinks);
        if (success) {
            setDeletedDrinks(prev => prev.filter(d => d.id !== drink.id));
            setUserDrinks(prev => [...prev, drink].sort((a, b) => b.timestamp - a.timestamp)); // Optimistic update
        }
    };

    const toggleDrinkSelection = (id: string) => {
        const newSet = new Set(selectedDrinkIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedDrinkIds(newSet);
    };

    const loadDeletedDrinks = async () => {
        if (!selectedUser?.uid) return;
        setViewDeletedDrinks(true);
        const deleted = await adminGetDeletedDrinks(selectedUser.uid);
        setDeletedDrinks(deleted.sort((a, b) => (b as any).deletedAt - (a as any).deletedAt));
    };

    const handleBanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser?.uid) return;

        // Two step confirmation for ban
        if (!window.confirm("Step 1/2: Are you sure you want to ban this user?")) return;
        if (!window.confirm("Step 2/2: Confirm ban. The user will be locked out immediately.")) return;

        const success = await adminBanUser(selectedUser.uid, banReason);
        if (success) {
            alert("User banned successfully.");
            setShowBanModal(false);
            setBanReason('');
            loadUsers();
            setSelectedUser(prev => prev ? { ...prev, isBanned: true, banReason } : null);
        }
    };

    const handleDismissAppeal = async () => {
        if (!selectedUser?.uid) return;
        if (!window.confirm("Reject and dismiss this appeal? The user will remain banned, but the appeal message will be cleared from your inbox.")) return;

        const success = await adminDismissAppeal(selectedUser.uid);

        if (success) {
            alert("Appeal dismissed.");
            loadUsers();
            setSelectedUser(prev => prev ? { ...prev, banAppealMessage: undefined, banAppealTimestamp: undefined } : null);
        }
    };

    const handleUnban = async () => {
        if (!selectedUser?.uid) return;
        if (!window.confirm("Accept appeal and unban this user?")) return;

        const success = await adminUnbanUser(selectedUser.uid);
        if (success) {
            alert("User unbanned.");
            loadUsers();
            setSelectedUser(prev => prev ? { ...prev, isBanned: false, banReason: undefined, banAppealMessage: undefined, banAppealTimestamp: undefined } : null);
        }
    };

    const handleWipeDrinksConfirm = async () => {
        if (!selectedUser?.uid) return;
        // Two step confirmation
        if (!window.confirm("Step 1/2: WARNING. You are about to delete ALL drinks.")) return;
        if (!window.confirm("Step 2/2: FINAL CONFIRMATION. This cannot be undone easily.")) return;

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

    // Old simple toggle replaced by handleBanSubmit and handleUnban
    /* const handleToggleBan = ... */

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

    const appealCount = users.filter(u => u.banAppealMessage && u.isBanned).length;


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

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                <button
                    onClick={() => setViewMode('users')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'users' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                >
                    Users
                </button>
                <button
                    onClick={() => setViewMode('appeals')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'appeals' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white/60'}`}
                >
                    Appeals
                    {appealCount > 0 && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${viewMode === 'appeals' ? 'bg-white text-orange-500' : 'bg-orange-500 text-white'}`}>
                            {appealCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* User List & Search */}
                <div className={`flex-1 flex flex-col gap-4 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder={viewMode === 'users' ? "Search users..." : "Search appeals..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:border-red-500/50 outline-none transition-all"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {loading && users.length === 0 ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-red-500" /></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center p-8 text-white/20 font-bold uppercase tracking-widest text-xs">
                                {viewMode === 'users' ? 'No users found' : 'No pending appeals'}
                            </div>
                        ) : filteredUsers.map(user => (
                            <div
                                key={user.uid || Math.random()}
                                onClick={() => handleSelectUser(user)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5 flex items-center gap-3 ${selectedUser?.uid === user.uid ? (viewMode === 'appeals' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-red-500/10 border-red-500/50') : 'bg-black/20 border-white/5'}`}
                            >
                                <div className="relative">
                                    <img
                                        src={user.customPhotoURL || user.photoURL || 'https://via.placeholder.com/40'}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full bg-white/10 object-cover"
                                    />
                                    {user.banAppealMessage && user.isBanned && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-black" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm truncate">@{user.username || 'Unnamed'}</p>
                                        {user.isAdmin && <ShieldCheck size={12} className="text-red-500" />}
                                        {user.isBanned && <Ban size={12} className="text-gray-500" />}
                                    </div>
                                    <p className="text-[10px] text-white/40 truncate">{user.uid}</p>
                                </div>
                                <div className="text-right">
                                    {viewMode === 'appeals' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-orange-400 capitalize">Pending Appeal</span>
                                            <span className="text-[8px] text-white/20">{user.banAppealTimestamp ? new Date(user.banAppealTimestamp).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[10px] font-bold text-white/60">{user.habitLevel || 'N/A'}</p>
                                            {user.weightKg && <p className="text-[10px] text-white/30">{user.weightKg}kg</p>}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-white/20 text-center">{filteredUsers.length} {viewMode === 'users' ? 'users' : 'appeals'} found</p>
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
                                className="w-20 h-20 rounded-full bg-black/40 border-2 border-white/10 object-cover"
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

                                    <div className="flex items-center gap-2">
                                        {!viewDeletedDrinks ? (
                                            <>
                                                <button
                                                    onClick={loadDeletedDrinks}
                                                    className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/40 hover:text-white transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 size={10} /> View Deleted
                                                </button>
                                                {selectedDrinkIds.size > 0 && (
                                                    <button
                                                        onClick={handleBulkDelete}
                                                        className="text-[10px] bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded text-red-300 transition-colors flex items-center gap-1 animate-fade-in"
                                                    >
                                                        <Trash2 size={10} /> Delete ({selectedDrinkIds.size})
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setViewDeletedDrinks(false)}
                                                className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 px-2 py-1 rounded text-blue-300 transition-colors flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} /> View Active
                                            </button>
                                        )}
                                    </div>
                                </h3>
                                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden max-h-80 overflow-y-auto">
                                    {viewDeletedDrinks ? (
                                        // Deleted Drinks View
                                        deletedDrinks.length === 0 ? (
                                            <div className="p-4 text-center text-[10px] text-white/30">Trash is empty</div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {deletedDrinks.map((drink: any) => (
                                                    <div key={drink.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors opacity-60">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-lg grayscale">
                                                                {drink.icon || '🍺'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white line-through">{drink.name}</p>
                                                                <p className="text-[10px] text-white/30">Deleted: {new Date(drink.deletedAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRestoreDrink(drink)}
                                                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        // Active Drinks View
                                        loadingDrinks ? (
                                            <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-white/30" /></div>
                                        ) : userDrinks.length === 0 ? (
                                            <div className="p-4 text-center text-[10px] text-white/30">No drinks recorded</div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {userDrinks.map(drink => (
                                                    <div key={drink.id} className={`p-3 flex items-center justify-between hover:bg-white/5 transition-colors group ${selectedDrinkIds.has(drink.id) ? 'bg-blue-500/10' : ''}`}>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => toggleDrinkSelection(drink.id)}
                                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedDrinkIds.has(drink.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 hover:border-white/40'}`}
                                                            >
                                                                {selectedDrinkIds.has(drink.id) && <CheckSquare size={12} />}
                                                            </button>
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
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Unban Appeal Message (if any) */}
                            {selectedUser.banAppealMessage && selectedUser.isBanned && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 animate-bounce-in ring-1 ring-orange-500/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-orange-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Mail size={14} /> Pending Appeal
                                        </h3>
                                        <span className="text-[10px] text-white/20 font-mono">
                                            {selectedUser.banAppealTimestamp ? new Date(selectedUser.banAppealTimestamp).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 rounded-lg p-3 mb-4">
                                        <p className="text-white/90 text-sm font-medium italic">"{selectedUser.banAppealMessage}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUnban}
                                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <ShieldCheck size={14} /> Accept
                                        </button>
                                        <button
                                            onClick={handleDismissAppeal}
                                            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                    onClick={handleWipeDrinksConfirm}
                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> Wipe All Drinks
                                </button>

                                {selectedUser.isBanned ? (
                                    <button
                                        onClick={handleUnban}
                                        className="w-full py-3 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ShieldCheck size={16} /> Unban User
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowBanModal(true)}
                                        className="w-full py-3 border border-gray-500/20 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Ban size={16} /> Ban User
                                    </button>
                                )}

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
            {/* Ban Modal */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-red-500/20 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-bounce-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                                <Ban size={20} /> Ban User
                            </h3>
                            <button onClick={() => setShowBanModal(false)} className="text-white/40 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-white/60">
                            This will restrict access for <span className="font-bold text-white">@{selectedUser?.username}</span> immediately.
                            They will see the reason you provide below.
                        </p>
                        <form onSubmit={handleBanSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Reason for Ban</label>
                                <textarea
                                    value={banReason}
                                    onChange={e => setBanReason(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-red-500 outline-none min-h-[100px]"
                                    placeholder="e.g. Violation of terms, harassment..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-red-900/20"
                            >
                                Proceed to Confirmation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
