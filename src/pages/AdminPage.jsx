import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, updateUserStatus, updateUserDetails, getDashboardStats } from '../services/authService';
import AdminLoginModal from '../components/AdminLoginModal';

const AdminContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
  width: ${props => (props.$collapsed ? '100%' : 'calc(100% - 320px)')};
  margin-left: ${props => (props.$collapsed ? '0' : '320px')};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

const Header = styled.div`
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserCount = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  margin-left: 20px;
  opacity: 0.7;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SearchInput = styled.input`
  background-color: ${props => props.theme.inputBackground || props.theme.sidebar};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 10px 40px 10px 15px;
  border-radius: 8px;
  font-size: 1rem;
  width: 300px;
  transition: all 0.2s ease;

  &::placeholder {
    color: ${props => props.theme.textSecondary || '#888'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007bff'};
    box-shadow: 0 0 0 3px ${props => props.theme.primary || '#007bff'}20;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.textSecondary || '#888'};
  pointer-events: none;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const AddButton = styled.button`
  background-color: ${props => props.theme.primary || '#007bff'};
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.primaryHover || '#0056b3'};
    transform: translateY(-1px);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${props => props.theme.sidebar};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.thead`
  background-color: ${props => props.theme.inputBackground || props.theme.background};
`;

const TableHeaderCell = styled.th`
  padding: 15px 20px;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.theme.textSecondary || '#888'};
  border-bottom: 1px solid ${props => props.theme.border};

  &:last-child {
    text-align: right;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.inputBackground || 'rgba(255, 255, 255, 0.05)'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.border};
  }
`;

const TableCell = styled.td`
  padding: 15px 20px;
  vertical-align: middle;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  text-transform: uppercase;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 500;
  font-size: 1rem;
`;

const UserEmail = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary || '#888'};
`;

const RoleBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    if (props.$role === 'ADMIN') {
      return `
        background-color: #3b82f6;
        color: white;
      `;
    } else if (props.$status === 'pending') {
      return `
        background-color: #f59e0b;
        color: white;
      `;
    } else {
      return `
        background-color: #10b981;
        color: white;
      `;
    }
  }}
`;

const TimeText = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary || '#888'};
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  padding: 30px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: ${props => props.theme.text};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary || '#888'};
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.text};
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const UserProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const LargeAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24px;
  color: white;
  text-transform: uppercase;
`;

const UserProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserProfileName = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 5px 0;
`;

const UserProfileDate = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary || '#888'};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${props => props.theme.textSecondary || '#888'};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background-color: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007bff'};
    box-shadow: 0 0 0 3px ${props => props.theme.primary || '#007bff'}20;
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || '#888'};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background-color: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007bff'};
    box-shadow: 0 0 0 3px ${props => props.theme.primary || '#007bff'}20;
  }

  option {
    background-color: ${props => props.theme.inputBackground || props.theme.background};
    color: ${props => props.theme.text};
  }
`;

const SaveButton = styled.button`
  background-color: ${props => props.theme.primary || '#007bff'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  float: right;
  margin-top: 10px;

  &:hover {
    background-color: ${props => props.theme.primaryHover || '#0056b3'};
    transform: translateY(-1px);
  }
`;

const ClickableText = styled.span`
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

// Helper function to generate user avatar initials
const getAvatarInitials = (name) => {
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
};

// Helper function to generate avatar color
const getAvatarColor = (name) => {
  const colors = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#f97316'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper function to get time ago
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'a few seconds ago';
};

const AdminPage = ({ collapsed }) => {
  const { adminUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: '',
    email: '',
    name: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    adminUsers: 0
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Load users and dashboard stats on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!adminUser) return;

      try {
        setLoading(true);
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getDashboardStats()
        ]);

        // Transform user data to match the expected format
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.status === 'admin' ? 'ADMIN' : 'USER',
          status: user.status,
          lastActive: getTimeAgo(user.last_login || user.updated_at),
          createdAt: formatDate(user.created_at),
          avatar: getAvatarInitials(user.username),
          avatarColor: getAvatarColor(user.username),
          is_active: user.is_active
        }));

        setUsers(transformedUsers);
        setDashboardStats(statsData);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adminUser]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    
    // Set the role based on status
    let formRole;
    if (user.status === 'admin') {
      formRole = 'ADMIN';
    } else if (user.status === 'pending') {
      formRole = 'PENDING';
    } else {
      formRole = 'USER';
    }
    
    setEditForm({
      role: formRole,
      email: user.email,
      name: user.name,
      newPassword: ''
    });
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setEditForm({
      role: '',
      email: '',
      name: '',
      newPassword: ''
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      
      // Prepare updates object
      const updates = {};
      if (editForm.email !== editingUser.email) {
        updates.email = editForm.email;
      }
      if (editForm.name !== editingUser.name) {
        updates.username = editForm.name;
      }
      if (editForm.newPassword.trim()) {
        updates.password = editForm.newPassword;
      }

      // Update user details if there are changes
      if (Object.keys(updates).length > 0) {
        await updateUserDetails(editingUser.id, updates);
      }

      // Update user status/role if changed
      let newStatus;
      if (editForm.role === 'ADMIN') {
        newStatus = 'admin';
      } else if (editForm.role === 'PENDING') {
        newStatus = 'pending';
      } else {
        newStatus = 'active';
      }
      
      if (newStatus !== editingUser.status) {
        await updateUserStatus(editingUser.id, newStatus);
      }

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              role: editForm.role, 
              email: editForm.email, 
              name: editForm.name,
              status: newStatus
            }
          : user
      );
      setUsers(updatedUsers);
      handleCloseModal();
    } catch (err) {
      setError(err.message);
      console.error('Failed to update user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show admin login modal if admin is not authenticated
  if (!adminUser) {
    return (
      <AdminContainer $collapsed={collapsed}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Admin Access Required</h2>
          <p>Please log in as an administrator to access this page.</p>
          <button
            onClick={() => setShowAdminLogin(true)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Admin Login
          </button>
        </div>
        <AdminLoginModal 
          isOpen={showAdminLogin} 
          onClose={() => setShowAdminLogin(false)} 
        />
      </AdminContainer>
    );
  }

  // Show loading state
  if (loading && users.length === 0) {
    return (
      <AdminContainer $collapsed={collapsed}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p>Fetching user data...</p>
        </div>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer $collapsed={collapsed}>
      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          Error: {error}
        </div>
      )}
      <Header>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Users
          </Title>
          <UserCount>{filteredUsers.length}</UserCount>
        </div>
        <SearchContainer>
          <SearchWrapper>
            <SearchInput
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </SearchIcon>
          </SearchWrapper>
          <AddButton>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </AddButton>
        </SearchContainer>
      </Header>

      <Table>
        <TableHeader>
          <tr>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Last Active</TableHeaderCell>
            <TableHeaderCell>Created At</TableHeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {filteredUsers.map(user => (
            <TableRow key={user.id}>
              <TableCell>
                <ClickableText onClick={() => handleEditUser(user)}>
                  <RoleBadge $role={user.role} $status={user.status}>
                    {user.status === 'pending' ? 'PENDING' : user.role}
                  </RoleBadge>
                </ClickableText>
              </TableCell>
              <TableCell>
                <UserInfo>
                  <Avatar style={{ backgroundColor: user.avatarColor }}>
                    {user.avatar}
                  </Avatar>
                  <ClickableText onClick={() => handleEditUser(user)}>
                    <UserName>{user.name}</UserName>
                  </ClickableText>
                </UserInfo>
              </TableCell>
              <TableCell>
                <UserEmail>{user.email}</UserEmail>
              </TableCell>
              <TableCell>
                <TimeText>{user.lastActive}</TimeText>
              </TableCell>
              <TableCell>
                <TimeText>{user.createdAt}</TimeText>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit User Modal */}
      {editingUser && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContainer onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Edit User</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>

            <UserProfileSection>
              <LargeAvatar style={{ backgroundColor: editingUser.avatarColor }}>
                {editingUser.avatar}
              </LargeAvatar>
              <UserProfileInfo>
                <UserProfileName>{editingUser.name}</UserProfileName>
                <UserProfileDate>Created at {editingUser.createdAt}</UserProfileDate>
              </UserProfileInfo>
            </UserProfileSection>

            <FormGroup>
              <FormLabel>Role</FormLabel>
              <FormSelect
                value={editForm.role}
                onChange={(e) => handleFormChange('role', e.target.value)}
              >
                <option value="ADMIN">Admin</option>
                <option value="USER">Active User</option>
                <option value="PENDING">Pending User</option>
              </FormSelect>
            </FormGroup>

            <FormGroup>
              <FormLabel>Email</FormLabel>
              <FormInput
                type="email"
                value={editForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>Name</FormLabel>
              <FormInput
                type="text"
                value={editForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter user name"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>New Password</FormLabel>
              <FormInput
                type="password"
                value={editForm.newPassword}
                onChange={(e) => handleFormChange('newPassword', e.target.value)}
                placeholder="Enter New Password"
              />
            </FormGroup>

            <SaveButton onClick={handleSaveUser}>
              Save
            </SaveButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AdminContainer>
  );
};

export default AdminPage; 