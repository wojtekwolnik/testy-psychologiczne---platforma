
import React, { useState, useEffect } from 'react';
import { getAllUsers, saveUser, deleteUser } from '../services/apiClient';
import type { User } from './types';
import { UserRole } from './types';
import { PlusIcon, EditIcon, TrashIcon, ShieldCheckIcon } from './common/Icons'; // NOWY IMPORT
import ActionConfirmModal from './common/ActionConfirmModal';

// ZALĄŻEK MODALA DO KONFIGURACJI 2FA
const Enable2FAModal: React.FC<{ user: User; onClose: () => void; }> = ({ user, onClose }) => {
    const [qrCode, setQrCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // TODO: Zaimplementować endpoint `generate2FASecret(userId)` w apiClient
        // Ten endpoint powinien zwrócić { secret, qrCodeDataUrl }
        const fetch2FAData = async () => {
            // Symulacja: w rzeczywistości serwer wygeneruje kod QR
            setQrCode('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/TwojaAplikacja:admin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TwojaAplikacja');
        };
        fetch2FAData();
    }, [user.id]);

    const handleVerifyAndEnable = async () => {
        // TODO: Zaimplementować endpoint `verifyAndEnable2FA({ userId, code })`
        // Serwer weryfikuje kod i jeśli jest poprawny, oznacza 2FA jako aktywne dla użytkownika.
        if (/^\d{6}$/.test(verificationCode)) {
            alert("2FA zostało aktywowane! (Symulacja)");
            onClose();
        } else {
            setError("Nieprawidłowy kod weryfikacyjny.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Konfiguracja Weryfikacji Dwuetapowej (2FA)</h2>
                <p className="text-slate-600 mb-4">Zeskanuj poniższy kod QR za pomocą aplikacji uwierzytelniającej, takiej jak Google Authenticator.</p>
                {qrCode ? (
                    <img src={qrCode} alt="QR Code dla 2FA" className="mx-auto border-4 border-white shadow-lg" />
                ) : (
                    <div className="w-48 h-48 bg-gray-200 mx-auto animate-pulse rounded-lg"></div>
                )}
                <p className="text-slate-600 my-4">Następnie wprowadź 6-cyfrowy kod wygenerowany przez aplikację, aby zakończyć konfigurację.</p>
                <input 
                    type="text" 
                    maxLength={6} 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full p-3 text-center text-2xl tracking-[.5em] font-mono border-2 border-slate-300 rounded-lg"
                    placeholder="------"
                />
                {error && <p className="text-red-500 mt-2">{error}</p>}
                 <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Anuluj</button>
                    <button type="button" onClick={handleVerifyAndEnable} className="px-5 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Aktywuj 2FA</button>
                </div>
            </div>
        </div>
    );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false); // NOWY STAN

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError("Nie udało się załadować użytkowników.");
    } finally { setIsLoading(false); }
  };

  const handleSave = async (user: User) => {
    try {
      const saved = await saveUser(user);
      if (selectedUser) {
        setUsers(users.map(u => u.id === saved.id ? saved : u));
      } else {
        setUsers([...users, saved]);
      }
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) { setError("Nie udało się zapisać użytkownika."); }
  };
  
  const handleDelete = async (userId: string) => {
      try {
        await deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      } catch (err) { setError("Nie udało się usunąć użytkownika."); }
  };

  const openAddModal = () => { setSelectedUser(null); setIsModalOpen(true); };
  const openEditModal = (user: User) => { setSelectedUser(user); setIsModalOpen(true); };
  const openDeleteModal = (user: User) => { setSelectedUser(user); setIsDeleteModalOpen(true); };
  // NOWA FUNKCJA
  const open2FAModal = (user: User) => { setSelectedUser(user); setIs2FAModalOpen(true); };

  if (isLoading) return <div>Ładowanie...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Zarządzanie Użytkownikami</h1>
        <button onClick={openAddModal} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"><PlusIcon /> Dodaj Użytkownika</button>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
              <th className="p-4 text-left font-semibold text-gray-600">Nazwa</th>
              <th className="p-4 text-left font-semibold text-gray-600">Email</th>
              <th className="p-4 text-left font-semibold text-gray-600">Rola</th>
              <th className="p-4 text-left font-semibold text-gray-600">2FA</th>
              <th className="p-4 text-left font-semibold text-gray-600">Akcje</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">{users.map(user => (
              <tr key={user.id}> 
                <td className="p-4">{user.fullName}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></td>
                <td className="p-4 text-center">
                    {user.twoFactorEnabled ? 
                        <span className="text-green-600"><ShieldCheckIcon className="inline-block"/></span> : 
                        <span className="text-gray-400">Wyłączone</span>
                    }
                </td>
                <td className="p-4 flex gap-1">
                  <button onClick={() => openEditModal(user)} className="p-2 text-gray-500 hover:text-blue-600" title="Edytuj"><EditIcon /></button>
                  {/* NOWY PRZYCISK DO KONFIGURACJI 2FA */}
                  <button onClick={() => open2FAModal(user)} className="p-2 text-gray-500 hover:text-green-600" title="Konfiguruj 2FA"><ShieldCheckIcon/></button>
                  <button onClick={() => openDeleteModal(user)} className="p-2 text-gray-500 hover:text-red-600" title="Usuń"><TrashIcon /></button>
                </td>
              </tr>
            ))}</tbody>
        </table>
      </div>

      {isModalOpen && <UserFormModal user={selectedUser} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
      {isDeleteModalOpen && selectedUser && <ActionConfirmModal title="Potwierdź usunięcie" message={`Czy na pewno chcesz usunąć użytkownika ${selectedUser.fullName}?`} onConfirm={() => handleDelete(selectedUser.id)} onCancel={() => setIsDeleteModalOpen(false)} />}
      {is2FAModalOpen && selectedUser && <Enable2FAModal user={selectedUser} onClose={() => setIs2FAModalOpen(false)} />} 
    </div>
  );
};

// Ten komponent pozostaje na razie bez zmian, ale w przyszłości można by tu dodać opcję resetowania 2FA
const UserFormModal: React.FC<{ user: User | null; onSave: (user: User) => void; onClose: () => void; }> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<User>>({ fullName: user?.fullName || '', email: user?.email || '', role: user?.role || UserRole.Therapist });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.fullName || !formData.email) { alert("Proszę wypełnić wszystkie pola."); return; } onSave(formData as User); };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{user ? 'Edytuj Użytkownika' : 'Dodaj Użytkownika'}</h2>
                <form onSubmit={handleSubmit}><div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">Imię i Nazwisko</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"/></div><div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">Adres E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"/></div><div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">Rola</label><select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white"><option value={UserRole.Admin}>Administrator</option><option value={UserRole.Therapist}>Terapeuta</option></select></div><div className="flex justify-end gap-4"><button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Anuluj</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg">Zapisz</button></div></form>
            </div>
        </div>
    );
};

export default UserManagement;
