import { useState, useEffect } from 'react';
import { Users as UsersIcon, UserCheck, UserX, Mail, Calendar, Trash2, Eye, EyeOff, UserPlus, KeyRound, ShieldCheck } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import { apiFetch } from '../../utils/api';

const Users = () => {
  const isMasterAdmin = localStorage.getItem('userIsMasterAdmin') === 'true';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({ total: 0, learners: 0, admins: 0 });
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createMessageType, setCreateMessageType] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/users');

      if (response.status === 403) {
        setUsers([]);
        setUserStats({ total: 0, learners: 0, admins: 0 });
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
      
      const stats = {
        total: data.length,
        learners: data.filter(u => u.role === 'Learner').length,
        admins: data.filter(u => u.role === 'Admin').length
      };
      setUserStats(stats);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateMessage('Please fill name, email, and password.');
      setCreateMessageType('error');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateMessage('');
      setCreateMessageType('');

      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });

      const data = await response.json();
      if (!response.ok) {
        setCreateMessage(data.message || 'Failed to create user');
        setCreateMessageType('error');
        return;
      }

      setCreateForm({ name: '', email: '', password: '', role: 'Admin' });
      setCreateMessage('User created successfully.');
      setCreateMessageType('success');
      await fetchUsers();
    } catch (error) {
      setCreateMessage('Failed to create user');
      setCreateMessageType('error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      fetchUsers();
      setSelectedUser(null);
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      {!isMasterAdmin && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          User management is available only for the master admin account.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Users</h1>
        <p className="text-slate-600 mt-1">Manage learners and administrators</p>
      </div>

      {isMasterAdmin && (
        <form onSubmit={handleCreateUser} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <UserPlus className="h-5 w-5 text-teal-600" />
                Add User Manually
              </h2>
              <p className="mt-1 text-sm text-slate-500">Create learner or admin accounts directly from master dashboard.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Full Name
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <UserCheck className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Asha Verma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email Address
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@dlcms.ac.in"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Temporary Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <KeyRound className="h-4 w-4 text-slate-400" />
                <input
                  type={showTempPassword ? 'text' : 'password'}
                  placeholder="Set initial password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowTempPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={showTempPassword ? 'Hide password' : 'Show password'}
                >
                  {showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Learner">Learner</option>
                </select>
              </div>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create User'}
            </button>
            {createMessage && (
              <p className={`rounded-lg px-3 py-2 text-sm ${
                createMessageType === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {createMessage}
              </p>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-slate-900">{userStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Learners</p>
              <p className="text-3xl font-bold text-slate-900">{userStats.learners}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Administrators</p>
              <p className="text-3xl font-bold text-slate-900">{userStats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name or email..."
          containerClassName="mb-4"
        />

        <div className="flex gap-2">
          <span className="text-sm font-semibold text-slate-700 py-2">Filter by role:</span>
          <div className="flex gap-2 flex-wrap">
            {['all', 'Learner', 'Admin'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filterRole === role
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {role === 'all' ? 'All Users' : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
          <p className="text-slate-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'Admin'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">{selectedUser.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedUser.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Role</label>
                <p className="mt-1 text-sm font-medium text-slate-900">{selectedUser.role}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Member Since</label>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {selectedUser.createdAt ? formatDate(selectedUser.createdAt) : 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">User ID</label>
                <p className="mt-1 text-sm font-mono text-slate-600 break-all">{selectedUser._id}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteUser(selectedUser._id);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
