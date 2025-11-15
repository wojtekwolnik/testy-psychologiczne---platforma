
import React, { useState, useEffect } from 'react';
import { fetchUsers, saveUser, deleteUser } from '../services/apiClient';
import type { User } from './types';
import { UserRole } from './types';
import { PlusIcon, EditIcon, TrashIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';


const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
        setIsLoading(true);
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
    } catch(err) {
        setError("Nie udało się załadować użytkowników.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenModal = (user: Partial<User> | null = null) => {
    setCurrentUser(user || { role: UserRole.Therapist, twoFactorEnabled: true });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSaveUser = async () => {
    setModalError('');
    if (!currentUser || !currentUser.name || !currentUser.email || !currentUser.role) {
        setModalError('Wszystkie pola są wymagane.');
        return;
    }
    
    // Validate password for new user
    if (!currentUser.id && (!currentUser.password || currentUser.password.length < 6)) {
        setModalError('Hasło jest wymagane dla nowego użytkownika i musi mieć co najmniej 6 znaków.');
        return;
    }

    // Validate password for existing user, only if it's being changed
    if (currentUser.id && currentUser.password && currentUser.password.length > 0 && currentUser.password.length < 6) {
        setModalError('Nowe hasło musi mieć co najmniej 6 znaków.');
        return;
    }


    const userToSave: User = {
        id: currentUser.id || `user-${Date.now()}`,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        twoFactorEnabled: currentUser.twoFactorEnabled || false,
        password: currentUser.password, // Pass password only if it's set
    };
    await saveUser(userToSave);
    handleCloseModal();
    loadUsers();
  };

  const confirmDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    loadUsers();
  }

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Zarządzanie użytkownikami</h1>
          <p className="opacity-80 mt-1">Dodawaj, edytuj i usuwaj konta w systemie.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 transition-colors"
        >
          <PlusIcon />
          Dodaj użytkownika
        </button>
      </div>

      <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--background-color)] text-sm font-semibold opacity-70">
              <tr className="text-[var(--text-color)]">
                <th className="p-4">Imię i Nazwisko</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rola</th>
                <th className="p-4">2FA Aktywne</th>
                <th className="p-4">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (<tr><td colSpan={5} className="p-8 text-center">Ładowanie...</td></tr>) 
              : error ? (<tr><td colSpan={5} className="p-8 text-center text-[var(--error-color)]">{error}</td></tr>)
              : users.map(user => (
                <tr key={user.id} className="border-b border-[var(--border-color)] hover:bg-[var(--background-color)]">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === UserRole.Admin ? 'bg-[var(--admin-background-color)] text-[var(--admin-color)]' : 'bg-[var(--therapist-background-color)] text-[var(--therapist-color)]'}`}>{user.role}</span></td>
                  <td className="p-4"><span className={`font-bold ${user.twoFactorEnabled ? 'text-[var(--success-color)]' : 'text-[var(--error-color)]'}`}>{user.twoFactorEnabled ? 'Tak' : 'Nie'}</span></td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => handleOpenModal(user)} className="p-2 opacity-70 hover:opacity-100"><EditIcon/></button>
                    <button onClick={() => setUserToDelete(user.id)} className="p-2 text-[var(--error-color)] hover:opacity-80"><TrashIcon/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--secondary-color)] rounded-lg shadow-xl p-8 w-full max-w-md text-[var(--text-color)]">
                <h2 className="text-2xl font-bold mb-6">{currentUser.id ? 'Edytuj użytkownika' : 'Dodaj użytkownika'}</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Imię i Nazwisko" value={currentUser.name || ''} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} className="w-full p-2 border rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] border-[var(--border-color)]" />
                    <input type="email" placeholder="Adres email" value={currentUser.email || ''} onChange={e => setCurrentUser({...currentUser, email: e.target.value})} className="w-full p-2 border rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] border-[var(--border-color)]" />
                    <input 
                      type="password" 
                      placeholder={currentUser.id ? "Nowe hasło (zostaw puste, aby nie zmieniać)" : "Hasło (min. 6 znaków)"} 
                      onChange={e => setCurrentUser({...currentUser, password: e.target.value})} 
                      className="w-full p-2 border rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] border-[var(--border-color)]" 
                    />
                    <select value={currentUser.role} onChange={e => setCurrentUser({...currentUser, role: e.target.value as UserRole.Admin | UserRole.Therapist})} className="w-full p-2 border rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] border-[var(--border-color)]">
                        <option value={UserRole.Therapist}>Terapeuta</option>
                        <option value={UserRole.Admin}>Administrator</option>
                    </select>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={currentUser.twoFactorEnabled || false} onChange={e => setCurrentUser({...currentUser, twoFactorEnabled: e.target.checked})} className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                        <span>Wymagaj uwierzytelniania dwuskładnikowego (2FA)</span>
                    </label>
                </div>
                {modalError && <p className="text-[var(--error-color)] text-sm mt-4">{modalError}</p>}
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg">Anuluj</button>
                    <button onClick={handleSaveUser} className="px-4 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] rounded-lg">Zapisz</button>
                </div>
            </div>
        </div>
      )}
    </div>
    <ActionConfirmModal 
      isOpen={!!userToDelete}
      onCancel={() => setUserToDelete(null)}
      onConfirm={() => {
        if(userToDelete) confirmDeleteUser(userToDelete);
        setUserToDelete(null);
      }}
      title="Potwierdź usunięcie użytkownika"
      message="Czy na pewno chcesz trwale usunąć tego użytkownika? Tej operacji nie można cofnąć."
      confirmText="Usuń"
    />
    </>
  );
};

export default UserManagement;
