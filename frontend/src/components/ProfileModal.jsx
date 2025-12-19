import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import AdminLoginModal from './AdminLoginModal';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleUp = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: 24px;
  width: 420px;
  max-width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.theme.border};
  overflow: hidden;
  animation: ${scaleUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: ${props => props.theme.card}50;
  border-bottom: 1px solid ${props => props.theme.border}50;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.01em;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.subText};
  transition: all 0.2s ease;
  background: ${props => props.theme.border}30;
  
  &:hover {
    background: ${props => props.theme.border};
    color: ${props => props.theme.text};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ModalBody = styled.div`
  padding: 32px 24px;
`;

const ProfileHeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
`;

const AvatarContainer = styled.div`
  position: relative;
  width: 88px;
  height: 88px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }

  &:hover .avatar-overlay {
    opacity: 1;
  }
`;

const Avatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.theme.primaryGradient};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 600;
  background-image: ${props => props.$profilePicture ? `url(${props.$profilePicture})` : 'none'};
  background-size: cover;
  background-position: center;
  box-shadow: 0 8px 24px ${props => props.theme.shadow}40;
  border: 4px solid ${props => props.theme.sidebar};
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  border: 4px solid transparent; // Match Avatar border for alignment
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const Username = styled.h4`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.02em;
  background: ${props => props.theme.primaryGradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const UserEmail = styled.p`
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: ${props => props.theme.subText};
`;

const InfoGroup = styled.div`
  background: ${props => props.theme.card};
  border-radius: 16px;
  padding: 8px 0;
  border: 1px solid ${props => props.theme.border}40;
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid ${props => props.theme.border}20;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const InfoValue = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.subText};
  font-variant-numeric: tabular-nums;
`;

const ActionButton = styled.button`
  background: ${props => props.$variant === 'danger'
    ? '#ef444410'
    : props.theme.primaryGradient};
  color: ${props => props.$variant === 'danger' ? '#ef4444' : 'white'};
  border: ${props => props.$variant === 'danger' ? '1px solid #ef444430' : 'none'};
  border-radius: 12px;
  padding: 14px;
  width: 100%;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${props => props.$marginTop ? '12px' : '0'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-1px);
    background: ${props => props.$variant === 'danger' ? '#ef444420' : props.theme.primaryGradient};
    box-shadow: ${props => props.$variant === 'danger' ? 'none' : `0 4px 12px ${props.theme.shadow}40`};
  }

  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  
  &:hover {
    background: ${props => props.theme.hover};
    box-shadow: none;
    border-color: ${props => props.theme.text}40;
  }
`;

const formatDate = (dateString) => {
  try {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString || 'Unknown';
  }
};

const ProfileModal = ({ closeModal }) => {
  const { user, adminUser, logout, adminLogout } = useAuth();
  const { t } = useTranslation();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    localStorage.getItem('profilePicture') || null
  );
  const fileInputRef = useRef(null);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      if (adminUser) await adminLogout();
      closeModal();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error('Admin logout error:', err);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('account.alert.invalidImageType'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t('account.alert.imageTooLarge'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setProfilePicture(imageData);
        localStorage.setItem('profilePicture', imageData);
        window.dispatchEvent(new CustomEvent('profilePictureChanged', {
          detail: { profilePicture: imageData }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <ModalOverlay onClick={handleOutsideClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t('account.title')}</ModalTitle>
          <CloseButton onClick={closeModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <ProfileHeaderSection>
            <AvatarContainer onClick={handleAvatarClick}>
              <Avatar $profilePicture={profilePicture}>
                {!profilePicture && avatarLetter}
              </Avatar>
              <AvatarOverlay className="avatar-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </AvatarOverlay>
            </AvatarContainer>
            <Username>{user.username}</Username>
            <UserEmail>{user.email || t('account.emailFallback')}</UserEmail>

            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </ProfileHeaderSection>

          <InfoGroup>
            <InfoItem>
            <InfoLabel>{t('account.memberSince')}</InfoLabel>
            <InfoValue>{formatDate(user.createdAt)}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>{t('account.theme')}</InfoLabel>
            <InfoValue style={{ textTransform: 'capitalize' }}>{user.settings?.theme || t('account.themeDefault')}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>{t('account.status')}</InfoLabel>
            <InfoValue>{adminUser ? t('account.statusAdmin') : t('account.statusMember')}</InfoValue>
          </InfoItem>
        </InfoGroup>

          {!adminUser ? (
            <SecondaryButton onClick={() => setShowAdminLogin(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              {t('account.button.switchToAdmin')}
            </SecondaryButton>
          ) : (
            <SecondaryButton onClick={handleAdminLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              {t('account.button.logoutAdmin')}
            </SecondaryButton>
          )}

          <ActionButton $variant="danger" $marginTop onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            {t('account.button.signOut')}
          </ActionButton>
        </ModalBody>
      </ModalContent>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
      />
    </ModalOverlay>
  );
};

export default ProfileModal;
