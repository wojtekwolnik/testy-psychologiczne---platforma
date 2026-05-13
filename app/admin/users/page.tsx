'use client';

import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser, createUser, UserData } from '../../actions/userActions';
import { FaTrash, FaUser, FaUserShield, FaPlus, FaTimes } from 'react-icons/fa';

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'therapist' as 'admin' | 'therapist'
    });
    const [creating, setCreating] = useState(false);

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

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

        try {
            await deleteUser(id);
            setUsers(users.filter(user => user.id !== id));
        } catch (err) {
            alert('Błąd podczas usuwania użytkownika.');
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

    if (loading) return <div className="p-8">Ładowanie użytkowników...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Użytkownikami</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <FaPlus /> Dodaj Użytkownika
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                            <th className="p-4 font-semibold">Użytkownik</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Rola</th>
                            <th className="p-4 font-semibold">Data Rejestracji</th>
                            <th className="p-4 font-semibold text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                                        {user.role === 'admin' ? <FaUserShield /> : <FaUser />}
                                    </div>
                                    {user.username || 'Brak nazwy'}
                                </td>
                                <td className="p-4 text-slate-600">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-teal-100 text-teal-700'
                                        }`}>
                                        {user.role === 'admin' ? 'Administrator' : 'Terapeuta'}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                                        title="Usuń użytkownika"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    Brak użytkowników w bazie.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Nowy Użytkownik</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa Użytkownika</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-slate-300 rounded"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-2 border border-slate-300 rounded"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hasło</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full p-2 border border-slate-300 rounded"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rola</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded"
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
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 bg-[var(--primary-color)] text-white rounded hover:opacity-90 disabled:opacity-50"
                                >
                                    {creating ? 'Tworzenie...' : 'Utwórz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
