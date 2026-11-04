'use client';

import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser, createUser, updateUserDetails, UserData } from '../../actions/userActions';
import { FaTrash, FaUser, FaUserShield, FaPlus, FaTimes, FaKey } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: currentUser } = useAuth();

    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'therapist' as 'admin' | 'therapist'
    });
    const [creating, setCreating] = useState(false);

    // Edit / Change Password Modal State
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        role: 'therapist' as 'admin' | 'therapist',
        password: '',
        confirmPassword: ''
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // Delete & Transfer Modal State
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [transferMode, setTransferMode] = useState<'transfer' | 'purge'>('transfer');
    const [transferTargetId, setTransferTargetId] = useState<string>('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            setError('Nie udało się załadować użytkowników.');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (target: UserData) => {
        setUserToDelete(target);
        setDeleteError('');
        const candidates = users.filter(u => u.id !== target.id);
        const preferred = candidates.find(u => u.id === currentUser?.id) || candidates[0];
        setTransferTargetId(preferred ? preferred.id : '');
        setTransferMode(candidates.length > 0 ? 'transfer' : 'purge');
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        setDeleting(true);
        setDeleteError('');
        try {
            const targetId = transferMode === 'transfer' && transferTargetId ? transferTargetId : undefined;
            await deleteUser(userToDelete.id, targetId);
            setUserToDelete(null);
            await loadUsers();
        } catch (err: any) {
            setDeleteError(err?.message || 'Błąd podczas usuwania użytkownika.');
        } finally {
            setDeleting(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const createdUser = await createUser(newUser);
            setUsers([createdUser, ...users]);
            setIsCreateModalOpen(false);
            setNewUser({ username: '', email: '', password: '', role: 'therapist' });
        } catch (err) {
            alert('Nie udało się utworzyć użytkownika. Sprawdź czy email nie jest już zajęty.');
        } finally {
            setCreating(false);
        }
    };

    const openEditModal = (user: UserData) => {
        setEditingUser(user);
        setEditForm({
            username: user.username || '',
            email: user.email,
            role: (user.role as 'admin' | 'therapist') || 'therapist',
            password: '',
            confirmPassword: ''
        });
        setEditError('');
        setEditSuccess('');
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setEditError('');
        setEditSuccess('');

        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            setEditError('Podane hasła nie są identyczne.');
            return;
        }

        if (editForm.password && editForm.password.length < 6) {
            setEditError('Nowe hasło musi mieć co najmniej 6 znaków.');
            return;
        }

        setSavingEdit(true);
        try {
            const res = await updateUserDetails(editingUser.id, {
                username: editForm.username,
                email: editForm.email,
                role: editForm.role,
                password: editForm.password || undefined,
            });

            if (!res.success || !res.user) {
                setEditError(res.error || 'Nie udało się zapisać zmian.');
            } else {
                await loadUsers();
                setEditSuccess('Zmiany zostały zapisane pomyślnie.');
                setEditForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
                setTimeout(() => {
                    setEditingUser(null);
                }, 900);
            }
        } catch (err) {
            setEditError('Wystąpił błąd podczas zapisywania zmian.');
        } finally {
            setSavingEdit(false);
        }
    };

    if (loading) return <div className="p-8 text-text">Ładowanie użytkowników...</div>;
    if (error) return <div className="p-8 text-error">{error}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto text-text">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-text">Zarządzanie Użytkownikami</h1>
                    <p className="text-text-muted mt-1">Dodawaj konta terapeutów, zarządzaj uprawnieniami i przekazuj kody dostępu.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary text-primary-contrast font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                >
                    <FaPlus /> Dodaj Użytkownika
                </button>
            </div>

            <div className="bg-surface/90 rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/60 border-b border-border text-text-muted text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Użytkownik</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Rola</th>
                                <th className="p-4 font-semibold">Przypisane zasoby</th>
                                <th className="p-4 font-semibold">Data Rejestracji</th>
                                <th className="p-4 font-semibold text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-sm">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-background/50 transition-colors">
                                    <td className="p-4 font-medium text-text flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                                            {user.role === 'admin' ? <FaUserShield /> : <FaUser />}
                                        </div>
                                        <div>
                                            <span>{user.username || 'Brak nazwy'}</span>
                                            {currentUser?.id === user.id && (
                                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                                                    Ty
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-text-muted">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                                            ? 'bg-accent/20 text-accent border border-accent/30'
                                            : 'bg-primary/20 text-primary border border-primary/30'
                                            }`}>
                                            {user.role === 'admin' ? 'Administrator' : 'Terapeuta'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-text-muted">
                                        <span className="inline-block mr-3">Aktywne kody: <strong className="text-text">{user.activeCodesCount ?? 0}</strong></span>
                                        <span className="inline-block">Wyniki: <strong className="text-text">{user.resultsCount ?? 0}</strong></span>
                                    </td>
                                    <td className="p-4 text-text-muted text-sm">
                                        {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="inline-flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-primary hover:bg-primary/15 px-3 py-1.5 rounded-lg border border-primary/30 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                                                title="Zmień hasło lub dane użytkownika"
                                            >
                                                <FaKey className="text-xs" />
                                                <span>Zmień hasło / Edytuj</span>
                                            </button>
                                            {currentUser?.id !== user.id && (
                                                <button
                                                    onClick={() => openDeleteModal(user)}
                                                    className="text-error hover:bg-error/15 p-2 rounded-lg border border-error/20 transition-colors"
                                                    title="Usuń użytkownika (z opcją przekazania jego kodów)"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted">
                                        Brak użytkowników w bazie.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete User & Transfer Codes Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 text-text">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-text">Usuwanie konta: {userToDelete.username || userToDelete.email}</h2>
                            <button onClick={() => setUserToDelete(null)} className="text-text-muted hover:text-text">
                                <FaTimes />
                            </button>
                        </div>

                        <p className="text-sm text-text-muted mb-4">
                            Ten użytkownik posiada obecnie <strong className="text-text">{userToDelete.activeCodesCount ?? 0}</strong> aktywnych kodów dostępu oraz <strong className="text-text">{userToDelete.resultsCount ?? 0}</strong> zapisanych wyników badań.
                        </p>

                        <div className="space-y-3 bg-background/60 p-4 rounded-xl border border-border mb-5">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="transferMode"
                                    checked={transferMode === 'transfer'}
                                    onChange={() => setTransferMode('transfer')}
                                    className="mt-1 accent-[var(--primary-color)]"
                                />
                                <div className="flex-1 text-sm">
                                    <span className="font-semibold text-text block">Przekaż kody dostępu i wyniki innemu terapeucie (Zalecane)</span>
                                    <span className="text-xs text-text-muted block mt-0.5">Wygenerowane kody dostępu pozostaną ważne i przejdą na konto wybranego poniżej terapeuty.</span>
                                    {transferMode === 'transfer' && (
                                        <select
                                            value={transferTargetId}
                                            onChange={e => setTransferTargetId(e.target.value)}
                                            className="mt-2.5 w-full p-2.5 rounded-lg border border-border bg-input-bg text-input-text text-sm"
                                        >
                                            {users.filter(u => u.id !== userToDelete.id).map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.username || u.email} ({u.role === 'admin' ? 'Administrator' : 'Terapeuta'})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-border/50">
                                <input
                                    type="radio"
                                    name="transferMode"
                                    checked={transferMode === 'purge'}
                                    onChange={() => setTransferMode('purge')}
                                    className="mt-1 accent-red-500"
                                />
                                <div className="flex-1 text-sm">
                                    <span className="font-semibold text-error block">Usuń konto wraz ze wszystkimi jego kodami i wynikami</span>
                                    <span className="text-xs text-text-muted block mt-0.5">Wszystkie niewykorzystane kody i wyniki przypisane do tego terapeuty zostaną bezpowrotnie skasowane.</span>
                                </div>
                            </label>
                        </div>

                        {deleteError && (
                            <div className="p-3 mb-4 bg-error/15 border border-error/30 text-error text-xs rounded-lg">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 text-sm text-text-muted hover:bg-background rounded-lg border border-border"
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting || (transferMode === 'transfer' && !transferTargetId)}
                                className="px-5 py-2 text-sm font-bold bg-error text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {deleting ? 'Usuwanie...' : (transferMode === 'transfer' ? 'Przekaż zasoby i usuń konto' : 'Usuń konto i zasoby')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 text-text">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text">Nowy Użytkownik</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-text-muted hover:text-text">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1">Nazwa Użytkownika</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1">Hasło</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1">Rola</label>
                                <select
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'therapist' })}
                                >
                                    <option value="therapist">Terapeuta</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm text-text-muted hover:bg-background rounded-lg border border-border"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2 text-sm font-bold bg-primary text-primary-contrast rounded-lg hover:opacity-90 disabled:opacity-50"
                                >
                                    {creating ? 'Tworzenie...' : 'Utwórz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User / Change Password Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 text-text">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text">
                                {currentUser?.id === editingUser.id ? 'Zmień swoje hasło / dane' : `Edycja: ${editingUser.username || editingUser.email}`}
                            </h2>
                            <button onClick={() => setEditingUser(null)} className="text-text-muted hover:text-text">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1">Nazwa Użytkownika</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={editForm.username}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>

                            {currentUser?.id !== editingUser.id && (
                                <div>
                                    <label className="block text-xs font-medium text-text-muted mb-1">Rola</label>
                                    <select
                                        className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'therapist' })}
                                    >
                                        <option value="therapist">Terapeuta</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            )}

                            <div className="border-t border-border pt-4 mt-2">
                                <label className="block text-xs font-semibold text-text mb-1">
                                    Nowe hasło <span className="font-normal text-text-muted">(zostaw puste, jeśli nie zmieniasz)</span>
                                </label>
                                <input
                                    type="password"
                                    minLength={6}
                                    placeholder="Wpisz nowe hasło (min. 6 znaków)"
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                />
                            </div>

                            {editForm.password && (
                                <div>
                                    <label className="block text-xs font-medium text-text-muted mb-1">Powtórz nowe hasło</label>
                                    <input
                                        type="password"
                                        minLength={6}
                                        placeholder="Powtórz nowe hasło"
                                        className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                        value={editForm.confirmPassword}
                                        onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                    />
                                </div>
                            )}

                            {editError && (
                                <div className="p-3 bg-error/15 border border-error/30 text-error text-xs rounded-lg">
                                    {editError}
                                </div>
                            )}

                            {editSuccess && (
                                <div className="p-3 bg-primary/15 border border-primary/30 text-primary text-xs rounded-lg">
                                    {editSuccess}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-sm text-text-muted hover:bg-background rounded-lg border border-border"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="px-5 py-2 text-sm font-bold bg-primary text-primary-contrast rounded-lg hover:opacity-90 disabled:opacity-50"
                                >
                                    {savingEdit ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
