import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Mock data for demonstration - replace with actual API calls
const mockUsers = [
  {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    registrationDate: '2024-01-15',
    lastActive: '2024-01-20',
    status: 'active',
    role: 'user',
    totalChats: 45,
    totalMessages: 1250
  },
  {
    id: 2,
    username: 'jane_smith',
    email: 'jane@example.com',
    registrationDate: '2024-01-10',
    lastActive: '2024-01-19',
    status: 'active',
    role: 'user',
    totalChats: 32,
    totalMessages: 890
  },
  {
    id: 3,
    username: 'admin_user',
    email: 'admin@example.com',
    registrationDate: '2023-12-01',
    lastActive: '2024-01-20',
    status: 'active',
    role: 'admin',
    totalChats: 12,
    totalMessages: 156
  },
  {
    id: 4,
    username: 'suspended_user',
    email: 'suspended@example.com',
    registrationDate: '2024-01-08',
    lastActive: '2024-01-12',
    status: 'suspended',
    role: 'user',
    totalChats: 8,
    totalMessages: 45
  }
];

const AdminOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const AdminContainer = styled.div`
  background-color: ${props => 
    props.theme.name === 'dark' || props.theme.name === 'oled' ? 
    '#222' : 
    props.theme.sidebar || props.theme.background || '#f5f5f7'};
  color: ${props => props.theme.text};
  border-radius: 16px;
  width: 95%;
  max-width: 1400px;
  height: 90vh;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 2px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    box-shadow: none;
  `}
`;

const AdminHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid ${props => props.theme.border};
  
  ${props => props.theme.name === 'retro' && `
    padding: 4px 8px;
    background-color: ${props.theme.windowTitleBarBackground};
    color: ${props.theme.windowTitleBarText};
    border-bottom: 1px solid ${props.theme.buttonShadowDark};
  `}
`;

const AdminTitle = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: ${props => props.theme.primary};
  
  ${props => props.theme.name === 'retro' && `
    font-size: 1.2rem;
    color: ${props.theme.windowTitleBarText};
  `}
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
  opacity: 0.7;
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 50%;
  
  ${props => props.theme.name === 'retro' && `
    background-color: ${props.theme.buttonFace};
    border: 1px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    border-radius: 0;
    width: 20px;
    height: 20px;
    font-size: 12px;
    opacity: 1;
    color: black;
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    }
  `}
  
  &:hover {
    opacity: 1;
    background: rgba(0,0,0,0.05);
    
    ${props => props.theme.name === 'retro' && `
      background-color: ${props.theme.buttonFace};
    `}
  }
`;

const AdminContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid ${props => props.theme.border};
  gap: 20px;
  flex-wrap: wrap;
  
  ${props => props.theme.name === 'retro' && `
    padding: 8px;
    border-bottom: 1px solid ${props.theme.buttonShadowDark};
  `}
`;

const SearchInput = styled.input`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  min-width: 300px;
  
  ${props => props.theme.name === 'retro' && `
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    border-radius: 0;
    padding: 4px 8px;
  `}
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
  
  &::placeholder {
    color: ${props => props.theme.text}66;
  }
`;

const FilterSelect = styled.select`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  
  ${props => props.theme.name === 'retro' && `
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    border-radius: 0;
    padding: 4px 8px;
  `}
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const ActionButton = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$variant === 'danger' ? '#dc3545' : props.theme.primary};
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'retro' && `
    background-color: ${props.theme.buttonFace};
    color: ${props.theme.buttonText};
    border: 1px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    border-radius: 0;
    padding: 4px 12px;
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    }
  `}
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    
    ${props => props.theme.name === 'retro' && `
      transform: none;
      opacity: 1;
    `}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 30px;
  padding: 15px 30px;
  background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? 
    'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  border-bottom: 1px solid ${props => props.theme.border};
  
  ${props => props.theme.name === 'retro' && `
    padding: 4px 8px;
    background: ${props.theme.sidebar};
    border-bottom: 1px solid ${props.theme.buttonShadowDark};
  `}
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${props => props.theme.primary};
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 0.85rem;
    color: ${props => props.theme.text}88;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const UsersTable = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 0 30px 30px;
  
  ${props => props.theme.name === 'retro' && `
    margin: 0 8px 8px;
  `}
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 200px 150px 120px 120px 150px 120px;
  gap: 15px;
  padding: 15px 20px;
  background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? 
    'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.theme.text}CC;
  position: sticky;
  top: 0;
  z-index: 10;
  
  ${props => props.theme.name === 'retro' && `
    background: ${props.theme.buttonFace};
    border: 1px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    border-radius: 0;
    padding: 4px 8px;
  `}
`;

const UserRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 200px 150px 120px 120px 150px 120px;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  transition: background 0.2s ease;
  align-items: center;
  
  ${props => props.theme.name === 'retro' && `
    padding: 4px 8px;
    border-bottom: 1px solid ${props.theme.buttonShadowDark};
  `}
  
  &:hover {
    background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? 
      'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 1px solid ${props.theme.buttonShadowDark};
  `}
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.$status) {
      case 'active':
        return `
          background: #d4edda;
          color: #155724;
        `;
      case 'suspended':
        return `
          background: #f8d7da;
          color: #721c24;
        `;
      case 'inactive':
        return `
          background: #fff3cd;
          color: #856404;
        `;
      default:
        return `
          background: #e2e3e5;
          color: #6c757d;
        `;
    }
  }}
  
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 1px solid ${props.theme.buttonShadowDark};
  `}
`;

const RoleBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.$role === 'admin' ? '#e1f5fe' : '#f5f5f5'};
  color: ${props => props.$role === 'admin' ? '#01579b' : '#666'};
  
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 1px solid ${props.theme.buttonShadowDark};
  `}
`;

const ActionMenu = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionMenuButton = styled.button`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? 
    'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  color: ${props => props.theme.text};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'retro' && `
    background-color: ${props.theme.buttonFace};
    border: 1px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    border-radius: 0;
    color: ${props.theme.buttonText};
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    }
  `}
  
  &:hover {
    background: ${props => props.theme.primary}22;
    color: ${props => props.theme.primary};
    
    ${props => props.theme.name === 'retro' && `
      background-color: ${props.theme.buttonFace};
      color: ${props.theme.buttonText};
    `}
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const UserDetailModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${props => props.theme.sidebar};
  border-radius: 12px;
  padding: 30px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 200;
  
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 2px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    padding: 8px;
  `}
`;

const AdminPanel = ({ closeModal }) => {
  const [users, setUsers] = useState(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleUserAction = (action, userId) => {
    // Placeholder for user actions - would call backend APIs
    console.log(`Action: ${action} for user: ${userId}`);
    
    switch (action) {
      case 'view':
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        setShowUserDetail(true);
        break;
      case 'suspend':
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: 'suspended' } : user
        ));
        break;
      case 'activate':
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        ));
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this user?')) {
          setUsers(prev => prev.filter(user => user.id !== userId));
        }
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) return;
    
    const actionText = action === 'delete' ? 'delete' : action;
    if (window.confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} selected users?`)) {
      // Placeholder for bulk actions - would call backend APIs
      console.log(`Bulk action: ${action} for users:`, selectedUsers);
      
      switch (action) {
        case 'suspend':
          setUsers(prev => prev.map(user => 
            selectedUsers.includes(user.id) ? { ...user, status: 'suspended' } : user
          ));
          break;
        case 'activate':
          setUsers(prev => prev.map(user => 
            selectedUsers.includes(user.id) ? { ...user, status: 'active' } : user
          ));
          break;
        case 'delete':
          setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
          break;
        default:
          break;
      }
      
      setSelectedUsers([]);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  return (
    <AdminOverlay>
      <AdminContainer>
        <AdminHeader>
          <AdminTitle>User Management</AdminTitle>
          <CloseButton onClick={closeModal}>×</CloseButton>
        </AdminHeader>

        <StatsBar>
          <StatItem>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </StatItem>
          <StatItem>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </StatItem>
          <StatItem>
            <div className="stat-value">{stats.suspended}</div>
            <div className="stat-label">Suspended</div>
          </StatItem>
          <StatItem>
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </StatItem>
        </StatsBar>

        <AdminContent>
          <ControlsBar>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <SearchInput
                type="text"
                placeholder="Search users by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FilterSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </FilterSelect>
              <FilterSelect
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </FilterSelect>
            </div>
            
            {selectedUsers.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <ActionButton onClick={() => handleBulkAction('activate')}>
                  Activate Selected ({selectedUsers.length})
                </ActionButton>
                <ActionButton onClick={() => handleBulkAction('suspend')}>
                  Suspend Selected
                </ActionButton>
                <ActionButton 
                  $variant="danger" 
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete Selected
                </ActionButton>
              </div>
            )}
          </ControlsBar>

          <UsersTable>
            <TableHeader>
              <Checkbox
                type="checkbox"
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={handleSelectAll}
              />
              <div>User</div>
              <div>Email</div>
              <div>Registration</div>
              <div>Status</div>
              <div>Role</div>
              <div>Last Active</div>
              <div>Actions</div>
            </TableHeader>

            {filteredUsers.map(user => (
              <UserRow key={user.id}>
                <Checkbox
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserSelect(user.id)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserAvatar>
                    {user.username.charAt(0).toUpperCase()}
                  </UserAvatar>
                  <div>
                    <div style={{ fontWeight: '500' }}>{user.username}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {user.totalChats} chats • {user.totalMessages} messages
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem' }}>{user.email}</div>
                <div style={{ fontSize: '0.9rem' }}>{user.registrationDate}</div>
                <StatusBadge $status={user.status}>{user.status}</StatusBadge>
                <RoleBadge $role={user.role}>{user.role}</RoleBadge>
                <div style={{ fontSize: '0.9rem' }}>{user.lastActive}</div>
                <ActionMenu>
                  <ActionMenuButton onClick={() => handleUserAction('view', user.id)}>
                    View
                  </ActionMenuButton>
                  {user.status === 'active' ? (
                    <ActionMenuButton onClick={() => handleUserAction('suspend', user.id)}>
                      Suspend
                    </ActionMenuButton>
                  ) : (
                    <ActionMenuButton onClick={() => handleUserAction('activate', user.id)}>
                      Activate
                    </ActionMenuButton>
                  )}
                  <ActionMenuButton onClick={() => handleUserAction('delete', user.id)}>
                    Delete
                  </ActionMenuButton>
                </ActionMenu>
              </UserRow>
            ))}
          </UsersTable>
        </AdminContent>

        {showUserDetail && selectedUser && (
          <UserDetailModal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>User Details</h3>
              <CloseButton onClick={() => setShowUserDetail(false)}>×</CloseButton>
            </div>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <strong>Username:</strong> {selectedUser.username}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>Registration Date:</strong> {selectedUser.registrationDate}
              </div>
              <div>
                <strong>Last Active:</strong> {selectedUser.lastActive}
              </div>
              <div>
                <strong>Status:</strong> <StatusBadge $status={selectedUser.status}>{selectedUser.status}</StatusBadge>
              </div>
              <div>
                <strong>Role:</strong> <RoleBadge $role={selectedUser.role}>{selectedUser.role}</RoleBadge>
              </div>
              <div>
                <strong>Total Chats:</strong> {selectedUser.totalChats}
              </div>
              <div>
                <strong>Total Messages:</strong> {selectedUser.totalMessages}
              </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <ActionButton onClick={() => handleUserAction('suspend', selectedUser.id)}>
                {selectedUser.status === 'active' ? 'Suspend User' : 'Activate User'}
              </ActionButton>
              <ActionButton $variant="danger" onClick={() => handleUserAction('delete', selectedUser.id)}>
                Delete User
              </ActionButton>
            </div>
          </UserDetailModal>
        )}
      </AdminContainer>
    </AdminOverlay>
  );
};

export default AdminPanel;