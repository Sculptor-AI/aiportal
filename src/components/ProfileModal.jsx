import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

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
  z-index: 100;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px ${props => props.theme.shadow};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ProfileSection = styled.div`
  margin-bottom: 24px;
`;

const ProfileHeader = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 500;
  border-bottom: 1px solid ${props => props.theme.border}40;
  padding-bottom: 8px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${props => props.theme.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin-right: 16px;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const Username = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const JoinDate = styled.p`
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: ${props => props.theme.text}80;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${props => props.theme.border}20;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: ${props => props.theme.text}80;
`;

const LogoutButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  width: 100%;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #d32f2f;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const ProfileModal = ({ closeModal }) => {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
      closeModal();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };
  
  // Get first letter of username for avatar
  const avatarLetter = user.username.charAt(0).toUpperCase();
  
  return (
    <ModalOverlay onClick={handleOutsideClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Your Profile</ModalTitle>
          <CloseButton onClick={closeModal}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <ProfileSection>
            <UserInfo>
              <Avatar>{avatarLetter}</Avatar>
              <UserDetails>
                <Username>{user.username}</Username>
                <JoinDate>Member since {formatDate(user.createdAt)}</JoinDate>
              </UserDetails>
            </UserInfo>
          </ProfileSection>
          
          <ProfileSection>
            <ProfileHeader>Account Information</ProfileHeader>
            <InfoItem>
              <InfoLabel>Username</InfoLabel>
              <InfoValue>{user.username}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Join Date</InfoLabel>
              <InfoValue>{formatDate(user.createdAt)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Theme</InfoLabel>
              <InfoValue>{user.settings?.theme || 'Light'}</InfoValue>
            </InfoItem>
          </ProfileSection>
          
          <LogoutButton onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log Out
          </LogoutButton>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ProfileModal;