import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const AdminContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
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
  
  ${props => props.role === 'ADMIN' ? `
    background-color: #3b82f6;
    color: white;
  ` : `
    background-color: #10b981;
    color: white;
  `}
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

// Mock user data similar to the image
const mockUsers = [
  {
    id: 1,
    name: 'admin',
    email: `admin${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '2 hours ago',
    createdAt: 'August 20, 2024',
    avatar: 'A',
    avatarColor: '#f59e0b'
  },
  {
    id: 2,
    name: 'Nick',
    email: `nick${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '12 minutes ago',
    createdAt: 'August 23, 2024',
    avatar: 'N',
    avatarColor: '#f59e0b'
  },
  {
    id: 3,
    name: 'Kellen Heraty',
    email: `kellen${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '7 days ago',
    createdAt: 'August 26, 2024',
    avatar: 'KH',
    avatarColor: '#8b5cf6'
  },
  {
    id: 4,
    name: 'Chase Culbertson',
    email: `chase${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: 'a few seconds ago',
    createdAt: 'August 26, 2024',
    avatar: 'CC',
    avatarColor: '#10b981'
  },
  {
    id: 5,
    name: 'Michael Wang',
    email: `michael${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '5 days ago',
    createdAt: 'August 29, 2024',
    avatar: 'MW',
    avatarColor: '#f59e0b'
  },
  {
    id: 6,
    name: 'Johan Novak',
    email: `johan${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'USER',
    lastActive: 'a month ago',
    createdAt: 'September 11, 2024',
    avatar: 'JN',
    avatarColor: '#f59e0b'
  },
  {
    id: 7,
    name: 'Raphael Denuit',
    email: `raphael${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'USER',
    lastActive: '5 months ago',
    createdAt: 'September 13, 2024',
    avatar: 'RD',
    avatarColor: '#f59e0b'
  },
  {
    id: 8,
    name: 'Dave Miller',
    email: `dave${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '8 days ago',
    createdAt: 'September 17, 2024',
    avatar: 'DM',
    avatarColor: '#f59e0b'
  },
  {
    id: 9,
    name: 'Heather Butler',
    email: `heather${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '16 days ago',
    createdAt: 'September 17, 2024',
    avatar: 'HB',
    avatarColor: '#f59e0b'
  },
  {
    id: 10,
    name: 'Camila Calkins',
    email: `camila${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '5 months ago',
    createdAt: 'September 18, 2024',
    avatar: 'CC',
    avatarColor: '#f59e0b'
  },
  {
    id: 11,
    name: 'Julia Hu',
    email: `julia${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'ADMIN',
    lastActive: '12 days ago',
    createdAt: 'September 19, 2024',
    avatar: 'JH',
    avatarColor: '#f59e0b'
  },
  {
    id: 12,
    name: 'Smriti Siva',
    email: `smriti${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'USER',
    lastActive: '6 months ago',
    createdAt: 'September 20, 2024',
    avatar: 'SS',
    avatarColor: '#f59e0b'
  },
  {
    id: 13,
    name: 'Natalie Gan',
    email: `natalie${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'USER',
    lastActive: '9 months ago',
    createdAt: 'September 20, 2024',
    avatar: 'NG',
    avatarColor: '#f59e0b'
  },
  {
    id: 14,
    name: 'Matthew K.',
    email: `matthew${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'USER',
    lastActive: '5 months ago',
    createdAt: 'September 20, 2024',
    avatar: 'MK',
    avatarColor: '#f59e0b'
  }
];

const AdminPage = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: '',
    email: '',
    name: '',
    newPassword: ''
  });

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
    setEditForm({
      role: user.role,
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

  const handleSaveUser = () => {
    if (editingUser) {
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { ...user, role: editForm.role, email: editForm.email, name: editForm.name }
          : user
      );
      setUsers(updatedUsers);
      handleCloseModal();
    }
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AdminContainer>
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
                  <RoleBadge role={user.role}>{user.role}</RoleBadge>
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
                <option value="USER">User</option>
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