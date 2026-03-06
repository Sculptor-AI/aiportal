import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteUserById,
  getAllUsers,
  getDashboardStats,
  updateUserDetails,
  updateUserStatus
} from '../services/authService';
import AdminLoginModal from '../components/AdminLoginModal';

const STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  banned: 'Banned'
};

const ROLE_LABELS = {
  admin: 'Admin',
  user: 'User'
};

const AdminContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  min-width: 0;
  color: ${props => props.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  transition: padding-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  padding-left: ${props => (props.$collapsed ? '0' : '300px')};

  @media (max-width: 1024px) {
    padding-left: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 40px 80px;

  @media (max-width: 768px) {
    padding: 32px 20px 60px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 40px;

  @media (max-width: 880px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  letter-spacing: -0.01em;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.$primary ? (props.theme.accentBackground || props.theme.primary) : (props.theme.inputBackground || props.theme.sidebar)};
  color: ${props => props.$primary ? '#fff' : props.theme.text};
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.16s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.$primary ? `0 6px 16px ${(props.theme.accentColor || props.theme.primary)}33` : 'none'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatLabel = styled.span`
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
`;

const StatValue = styled.span`
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 180px 180px auto;
  gap: 10px;
  margin-bottom: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrap = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 11px 12px 11px 38px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.sidebar};
  color: ${props => props.theme.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}22`};
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.55;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.sidebar};
  color: ${props => props.theme.text};
  cursor: pointer;
`;

const Banner = styled.div`
  border-radius: 10px;
  border: 1px solid ${props => props.$error ? '#fca5a5' : '#86efac'};
  background: ${props => props.$error ? '#7f1d1d26' : '#14532d26'};
  color: ${props => props.$error ? '#fecaca' : '#dcfce7'};
  padding: 11px 13px;
  margin-bottom: 14px;
  font-size: 0.9rem;
`;

const TableWrap = styled.div`
  border: 1px solid ${props => props.theme.border};
  border-radius: 14px;
  overflow: hidden;
  background: ${props => props.theme.sidebar};
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
`;

const THead = styled.thead`
  background: ${props => props.theme.inputBackground || props.theme.background};
`;

const Th = styled.th`
  text-align: left;
  padding: 13px 14px;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.75;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Tr = styled.tr`
  border-bottom: 1px solid ${props => props.theme.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme.inputBackground || 'rgba(255,255,255,0.04)'};
  }
`;

const Td = styled.td`
  padding: 13px 14px;
  vertical-align: middle;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  background: ${props => props.$color};
  flex-shrink: 0;
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const UserName = styled.span`
  font-size: 0.96rem;
  font-weight: 600;
`;

const UserEmail = styled.span`
  font-size: 0.82rem;
  opacity: 0.72;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const RoleBadge = styled(Badge)`
  background: ${props => props.$role === 'admin' ? '#1d4ed8' : '#475569'};
  color: #fff;
`;

const StatusBadge = styled(Badge)`
  background: ${props => {
    if (props.$status === 'active') return '#059669';
    if (props.$status === 'pending') return '#d97706';
    if (props.$status === 'suspended') return '#b45309';
    if (props.$status === 'banned') return '#dc2626';
    return '#475569';
  }};
  color: #fff;
`;

const RowActions = styled.div`
  display: flex;
  gap: 7px;
  justify-content: flex-end;
`;

const MiniButton = styled.button`
  border: 1px solid ${props => props.$danger ? '#ef4444' : props.theme.border};
  background: ${props => props.$danger ? '#7f1d1d22' : (props.theme.inputBackground || props.theme.sidebar)};
  color: ${props => props.$danger ? '#ef4444' : props.theme.text};
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  border: 1px dashed ${props => props.theme.border};
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  opacity: 0.85;
  background: ${props => props.theme.sidebar};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const Modal = styled.div`
  width: min(640px, 92vw);
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 14px;
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px 14px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
`;

const ModalBody = styled.div`
  padding: 16px 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.75;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 11px;
  border-radius: 9px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.text};
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 0.84rem;
  opacity: 0.76;
`;

const ModalFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.background};
`;

const FootRight = styled.div`
  display: flex;
  gap: 8px;
`;

const getAvatarInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || '?';

const getAvatarColor = (name = '') => {
  const colors = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#f97316'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getTimeAgo = (dateString) => {
  if (!dateString) return 'Never';
  const now = new Date();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diff = Math.max(0, now.getTime() - date.getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
};

const normalizeApiUser = (user) => {
  const name = user.username || user.name || 'Unknown';
  const role = user.role === 'admin' ? 'admin' : 'user';
  const status = ['active', 'pending', 'suspended', 'banned'].includes(user.status)
    ? user.status
    : 'active';

  return {
    id: user.id,
    username: name,
    email: user.email || '',
    role,
    status,
    lastActive: getTimeAgo(user.last_login || user.updated_at),
    createdAt: formatDate(user.created_at),
    avatar: getAvatarInitials(name),
    avatarColor: getAvatarColor(name)
  };
};

const AdminPage = ({ collapsed }) => {
  const { adminUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    suspendedUsers: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'user',
    status: 'active',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingUserId, setWorkingUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!adminUser) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getDashboardStats()
      ]);

      setUsers((usersData || []).map(normalizeApiUser));
      setDashboardStats(statsData || {
        totalUsers: 0,
        pendingUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        suspendedUsers: 0
      });
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (!adminUser) return;
    loadData(false);
  }, [adminUser, loadData]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter(user => {
      const matchesSearch =
        !query ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const beginEdit = (user) => {
    setError('');
    setSuccess('');
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      newPassword: ''
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm({
      username: '',
      email: '',
      role: 'user',
      status: 'active',
      newPassword: ''
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const isSelf = editingUser.id === adminUser?.id;

    if (isSelf && editForm.role !== editingUser.role) {
      setError('You cannot change your own admin role.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const detailUpdates = {};
      if (editForm.username.trim() !== editingUser.username) {
        detailUpdates.username = editForm.username.trim();
      }
      if (editForm.email.trim() !== editingUser.email) {
        detailUpdates.email = editForm.email.trim();
      }
      if (editForm.newPassword.trim()) {
        detailUpdates.password = editForm.newPassword.trim();
      }
      if (editForm.role !== editingUser.role) {
        detailUpdates.role = editForm.role;
      }

      if (Object.keys(detailUpdates).length > 0) {
        await updateUserDetails(editingUser.id, detailUpdates);
      }

      if (editForm.status !== editingUser.status) {
        await updateUserStatus(editingUser.id, editForm.status);
      }

      closeEdit();
      await loadData(true);
      setSuccess('User updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const quickStatusChange = async (user, nextStatus) => {
    if (!user || user.status === nextStatus) return;
    if (user.id === adminUser?.id) {
      setError('You cannot change your own account status.');
      return;
    }

    if (nextStatus === 'banned') {
      const ok = window.confirm(`Ban ${user.username}? This will revoke active sessions and API keys.`);
      if (!ok) return;
    }

    setWorkingUserId(user.id);
    setError('');
    setSuccess('');

    try {
      await updateUserStatus(user.id, nextStatus);
      await loadData(true);
      setSuccess(`${user.username} is now ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setWorkingUserId(null);
    }
  };

  const deleteUser = async (user) => {
    if (!user) return;
    if (user.id === adminUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }

    const ok = window.confirm(`Delete ${user.username}? This action is permanent.`);
    if (!ok) return;

    setWorkingUserId(user.id);
    setError('');
    setSuccess('');

    try {
      await deleteUserById(user.id);
      await loadData(true);
      if (editingUser?.id === user.id) {
        closeEdit();
      }
      setSuccess(`${user.username} was deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setWorkingUserId(null);
    }
  };

  if (!adminUser) {
    return (
      <AdminContainer $collapsed={collapsed}>
        <ContentWrapper>
          <EmptyState>
            <h2>Admin access required</h2>
            <p style={{ marginBottom: '16px' }}>Log in with an administrator account to manage users.</p>
            <Button $primary onClick={() => setShowAdminLogin(true)}>Admin login</Button>
          </EmptyState>
        </ContentWrapper>
        <AdminLoginModal
          isOpen={showAdminLogin}
          onClose={() => setShowAdminLogin(false)}
        />
      </AdminContainer>
    );
  }

  return (
    <AdminContainer $collapsed={collapsed}>
      <ContentWrapper>
        {error && <Banner $error>{error}</Banner>}
        {success && <Banner>{success}</Banner>}

        <Header>
          <HeaderLeft>
            <Title>Admin panel</Title>
            <Subtitle>User access, account status, and role controls.</Subtitle>
          </HeaderLeft>
          <HeaderButtons>
            <Button onClick={() => loadData(true)} disabled={refreshing || loading}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </HeaderButtons>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatLabel>Total users</StatLabel>
            <StatValue>{dashboardStats.totalUsers || 0}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Admins</StatLabel>
            <StatValue>{dashboardStats.adminUsers || 0}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Active</StatLabel>
            <StatValue>{dashboardStats.activeUsers || 0}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Pending</StatLabel>
            <StatValue>{dashboardStats.pendingUsers || 0}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Suspended or banned</StatLabel>
            <StatValue>{dashboardStats.suspendedUsers || 0}</StatValue>
          </StatCard>
        </StatsGrid>

        <Controls>
          <SearchWrap>
            <SearchIcon aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </SearchIcon>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search username, email, role, status"
            />
          </SearchWrap>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </Select>

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>

          <Button onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setRoleFilter('all');
          }}>
            Clear filters
          </Button>
        </Controls>

        {loading && users.length === 0 ? (
          <EmptyState>Loading users...</EmptyState>
        ) : filteredUsers.length === 0 ? (
          <EmptyState>No users match the current filters.</EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Last active</Th>
                  <Th>Created</Th>
                  <Th style={{ textAlign: 'right' }}>Actions</Th>
                </tr>
              </THead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isBusy = workingUserId === user.id || saving;
                  const isSelf = user.id === adminUser?.id;

                  return (
                    <Tr key={user.id}>
                      <Td>
                        <UserCell>
                          <Avatar $color={user.avatarColor}>{user.avatar}</Avatar>
                          <UserMeta>
                            <UserName>{user.username}</UserName>
                            <UserEmail>{user.email}</UserEmail>
                          </UserMeta>
                        </UserCell>
                      </Td>
                      <Td>
                        <RoleBadge $role={user.role}>
                          {ROLE_LABELS[user.role] || user.role}
                        </RoleBadge>
                      </Td>
                      <Td>
                        <StatusBadge $status={user.status}>
                          {STATUS_LABELS[user.status] || user.status}
                        </StatusBadge>
                      </Td>
                      <Td>{user.lastActive}</Td>
                      <Td>{user.createdAt}</Td>
                      <Td>
                        <RowActions>
                          <MiniButton onClick={() => beginEdit(user)} disabled={isBusy}>
                            Edit
                          </MiniButton>
                          {user.status === 'active' ? (
                            <MiniButton
                              onClick={() => quickStatusChange(user, 'suspended')}
                              disabled={isBusy || isSelf}
                            >
                              Suspend
                            </MiniButton>
                          ) : (
                            <MiniButton
                              onClick={() => quickStatusChange(user, 'active')}
                              disabled={isBusy || isSelf}
                            >
                              Activate
                            </MiniButton>
                          )}
                          <MiniButton
                            $danger
                            onClick={() => deleteUser(user)}
                            disabled={isBusy || isSelf}
                          >
                            Delete
                          </MiniButton>
                        </RowActions>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </ContentWrapper>

      {editingUser && (
        <ModalOverlay onClick={closeEdit}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Edit user</ModalTitle>
              <Button onClick={closeEdit}>Close</Button>
            </ModalHead>

            <ModalBody>
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                />
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email"
                />
              </Field>

              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={editForm.role}
                  disabled={editingUser.id === adminUser?.id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={editForm.status}
                  disabled={editingUser.id === adminUser?.id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </Select>
              </Field>

              <Field>
                <FieldLabel>New password (optional)</FieldLabel>
                <Input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Leave empty to keep current password"
                />
              </Field>

              <FullWidth>
                <InfoText>
                  Created: {editingUser.createdAt} | Last active: {editingUser.lastActive}
                </InfoText>
                {editingUser.id === adminUser?.id && (
                  <InfoText style={{ marginTop: '6px' }}>
                    Your own role and status cannot be changed from this view.
                  </InfoText>
                )}
              </FullWidth>
            </ModalBody>

            <ModalFoot>
              <MiniButton
                $danger
                disabled={editingUser.id === adminUser?.id || saving}
                onClick={() => deleteUser(editingUser)}
              >
                Delete user
              </MiniButton>
              <FootRight>
                <Button onClick={closeEdit} disabled={saving}>Cancel</Button>
                <Button $primary onClick={handleSaveUser} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </FootRight>
            </ModalFoot>
          </Modal>
        </ModalOverlay>
      )}
    </AdminContainer>
  );
};

export default AdminPage;
