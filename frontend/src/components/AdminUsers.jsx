import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaSpinner, FaSearch } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../utils/api';
import { useToast } from './Toast';
import { TableSkeleton } from './LoadingSkeleton';
import '../styles/AdminUsers.css';

const roles = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'driver', label: 'Drivers' },
  { value: 'customer', label: 'Customers' }
];

const statusFilters = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: users = [], isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['admin-users', { roleFilter, statusFilter }],
    queryFn: async () => {
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (statusFilter !== 'all') {
        params.active = statusFilter === 'active' ? 'true' : 'false';
      }
      return authAPI.getUsers(params);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => authAPI.updateUserRole(id, role),
    onSuccess: () => {
      showToast('User role updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (mutationError) => {
      showToast(mutationError.message || 'Failed to update user role', 'error');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => authAPI.toggleUserStatus(id, isActive),
    onSuccess: (_, variables) => {
      showToast(`User ${variables.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (mutationError) => {
      showToast(mutationError.message || 'Failed to update user status', 'error');
    }
  });

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowered = searchTerm.toLowerCase();
    return users.filter((user) =>
      user.name?.toLowerCase().includes(lowered) ||
      user.email?.toLowerCase().includes(lowered)
    );
  }, [users, searchTerm]);

  const handleRoleChange = (id, role) => {
    updateRoleMutation.mutate({ id, role });
  };

  const handleToggleStatus = (id, isActive) => {
    toggleStatusMutation.mutate({ id, isActive });
  };

  const renderRoleBadge = (role) => {
    const badgeMap = {
      admin: 'primary',
      driver: 'success',
      customer: 'info'
    };

    return <span className={`badge badge-${badgeMap[role] || 'secondary'}`}>{role}</span>;
  };

  const renderStatusPill = (isActive) => (
    <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const isMutating = updateRoleMutation.isPending || toggleStatusMutation.isPending;

  return (
    <motion.div
      className="admin-users-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="users-header">
        <h2><FaUsers /> Manage Users</h2>
        <div className="users-filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="filter-selectors">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roles.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusFilters.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : isError ? (
        <div className="error-state">
          <p>{error.message || 'Failed to load users'}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="no-users">
          <FaUsers size={64} color="var(--gray)" />
          <h3>No users found</h3>
          <p>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                  >
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="user-name">{user.name}</p>
                          <p className="user-email">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="role-dropdown"
                        value={user.role}
                        onChange={(event) => handleRoleChange(user._id, event.target.value)}
                        disabled={isMutating}
                      >
                        <option value="admin">👑 Admin</option>
                        <option value="driver">🚗 Driver</option>
                        <option value="customer">👤 Customer</option>
                      </select>
                    </td>
                    <td>{renderStatusPill(user.isActive)}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <motion.button
                          className={`btn btn-${user.isActive ? 'danger' : 'success'}`}
                          onClick={() => handleToggleStatus(user._id, !user.isActive)}
                          disabled={isMutating}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === user._id ? (
                            <FaSpinner className="spinner" />
                          ) : (
                            user.isActive ? 'Deactivate' : 'Activate'
                          )}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="loading-overlay">
          <FaSpinner className="spinner" /> Refreshing...
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsers;