import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { getTheme, lightTheme, darkTheme, oledTheme, oceanTheme, forestTheme, bisexualTheme, lakesideTheme, prideTheme, transTheme, galaxyTheme, sunsetTheme, cyberpunkTheme, bubblegumTheme, desertTheme, retroTheme } from '../styles/themes';

// Animated background
const floatingAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(90deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
  75% { transform: translateY(-15px) rotate(270deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

const LoginScreenContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.background};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 60px;
    height: 60px;
    background: ${props => props.theme.accent ? `${props.theme.accent}20` : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 50%;
    animation: ${floatingAnimation} 20s infinite linear;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 20%;
    right: 15%;
    width: 40px;
    height: 40px;
    background: ${props => props.theme.accent ? `${props.theme.accent}15` : 'rgba(255, 255, 255, 0.08)'};
    border-radius: 50%;
    animation: ${floatingAnimation} 25s infinite linear reverse;
  }
`;

const FloatingShape = styled.div`
  position: absolute;
  background: ${props => props.theme.accent ? `${props.theme.accent}10` : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 50%;
  animation: ${floatingAnimation} ${props => props.$duration}s infinite linear ${props => props.$reverse ? 'reverse' : 'normal'};
  
  &:nth-child(1) {
    top: 30%;
    right: 20%;
    width: 80px;
    height: 80px;
    animation-delay: -5s;
  }
  
  &:nth-child(2) {
    bottom: 40%;
    left: 20%;
    width: 50px;
    height: 50px;
    animation-delay: -10s;
  }
  
  &:nth-child(3) {
    top: 60%;
    left: 80%;
    width: 30px;
    height: 30px;
    animation-delay: -15s;
  }
`;

const DualPanelContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 960px;
  min-height: 600px;
  background: ${props => props.theme.sidebar};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${props => props.theme.border};
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 10;
  color: ${props => props.theme.text};
  
  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
    min-height: auto;
  }
`;

const InfoPanel = styled.div`
  flex: 1;
  background: ${props => props.theme.primaryGradient};
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 32px;
    min-height: 200px;
  }
`;

const InfoTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: translateY(${props => props.$isVisible ? '0' : '10px'});
`;

const InfoText = styled.p`
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-bottom: 24px;
  max-width: 300px;
  line-height: 1.6;
  transition: all 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: translateY(${props => props.$isVisible ? '0' : '10px'});
`;

const InfoButton = styled.button`
  padding: 12px 32px;
  background: transparent;
  color: white;
  border: 2px solid white;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: translateY(${props => props.$isVisible ? '0' : '10px'});

  &:hover {
    background: white;
    color: ${props => props.theme.primary};
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const LogoIcon = styled.img`
  width: 48px;
  height: 48px;
`;

const Logo = styled.div`
  font-size: 2.8rem;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  background: ${props => props.theme.logoGradient || props.theme.primaryGradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
`;

const FormPanel = styled.div`
  flex: 1.2;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${props => props.theme.sidebar};
  
  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const FormInnerContainer = styled.div`
  width: 100%;
  max-width: 380px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.subText};
  margin-bottom: 32px;
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  transition: all 0.3s ease;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.4s ease;
`;

const Input = styled.input`
  padding: 14px 18px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  outline: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:focus {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
    background: ${props => props.theme.inputBackground};
  }

  &::placeholder {
    color: ${props => props.theme.subText};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmailInput = styled(Input)`
  max-height: ${props => props.$isVisible ? '60px' : '0'};
  opacity: ${props => props.$isVisible ? 1 : 0};
  margin-bottom: ${props => props.$isVisible ? '0' : '-16px'};
  padding: ${props => props.$isVisible ? '14px 18px' : '0 18px'};
  transition: all 0.4s ease;
  overflow: hidden;
  transform: translateY(${props => props.$isVisible ? '0' : '-10px'});
`;

const SubmitButton = styled.button`
  padding: 14px 24px;
  background: ${props => props.theme.buttonGradient || props.theme.primaryGradient};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  box-shadow: 0 4px 16px ${props => props.theme.primary}40;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px ${props => props.theme.primary}50;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 16px ${props => props.theme.primary}20;
  }
`;

const OAuthContainer = styled.div`
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OAuthButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  background: ${props => props.theme.card};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  font-weight: 500;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover};
    border-color: ${props => props.$provider === 'google' ? '#4285f4' : '#0078d4'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Divider = styled.div`
  position: relative;
  margin: 24px 0;
  text-align: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => props.theme.border};
  }
  
  span {
    background: ${props => props.theme.sidebar};
    padding: 0 16px;
    color: ${props => props.theme.subText};
    font-size: 0.9rem;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.9rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-top: 8px;
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

const SuccessMessage = styled.div`
  color: #10b981;
  font-size: 0.9rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-top: 8px;
  text-align: center;
  background: rgba(16, 185, 129, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.2);
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ForcedLoginScreen = () => {
  const { login, register, loading, error, loginWithGoogle } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(getTheme('light'));

  // Load theme from localStorage
  useEffect(() => {
    const savedThemeName = localStorage.getItem('ai_portal_theme') || 'light';
    setCurrentTheme(getTheme(savedThemeName));

    // Listen for theme changes from other components
    const handleStorageChange = () => {
      const newThemeName = localStorage.getItem('ai_portal_theme') || 'light';
      setCurrentTheme(getTheme(newThemeName));
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-window updates
    window.addEventListener('themeChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleStorageChange);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        if (!formData.username || !formData.password) {
          setLocalError('Please fill in all fields');
          return;
        }
        await login(formData.username, formData.password);
        // Login successful - user will be redirected automatically by App component
      } else {
        if (!formData.username || !formData.password || !formData.email) {
          setLocalError('Please fill in all fields');
          return;
        }
        if (formData.password.length < 8) {
          setLocalError('Password must be at least 8 characters long');
          return;
        }
        await register(formData.username, formData.password, formData.email);
        setSuccessMessage('Account created successfully! Please log in.');
        setIsLoginMode(true);
        setFormData(prev => ({ ...prev, password: '', email: '' }));
      }
    } catch (err) {
      setLocalError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsAnimating(true);

    // Start the transition
    setTimeout(() => {
      setIsLoginMode(!isLoginMode);
      setFormData({ username: '', password: '', email: '' });
      setLocalError('');
      setSuccessMessage('');

      // End animation after content change
      setTimeout(() => {
        setIsAnimating(false);
      }, 100);
    }, 150);
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      // Login successful - user will be redirected automatically
    } catch (err) {
      setLocalError(err.message || 'Google login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLocalError('');
    setLocalError('Microsoft login is not yet implemented. Please use email/password or Google sign-in.');
    // In a real app, this would redirect to Microsoft OAuth
    // window.location.href = 'https://login.microsoftonline.com/...'
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <LoginScreenContainer>
        <FloatingShape $duration={22} />
        <FloatingShape $duration={18} $reverse />
        <FloatingShape $duration={25} />

        <DualPanelContainer>
          <InfoPanel>
            {isLoginMode ? (
              <>
                <InfoTitle $isVisible={!isAnimating}>New Here?</InfoTitle>
                <InfoText $isVisible={!isAnimating}>Sign up and discover a great amount of new opportunities!</InfoText>
                <InfoButton $isVisible={!isAnimating} onClick={toggleMode}>Sign Up</InfoButton>
              </>
            ) : (
              <>
                <InfoTitle $isVisible={!isAnimating}>Welcome Back!</InfoTitle>
                <InfoText $isVisible={!isAnimating}>To keep connected with us please login with your personal info</InfoText>
                <InfoButton $isVisible={!isAnimating} onClick={toggleMode}>Sign In</InfoButton>
              </>
            )}
          </InfoPanel>
          <FormPanel>
            <FormInnerContainer>
              <LogoContainer>
                <LogoIcon src="/sculptor.svg" alt="Sculptor Logo" />
                <Logo>Sculptor</Logo>
              </LogoContainer>
              <Subtitle>
                {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
              </Subtitle>

              <OAuthContainer>
                <OAuthButton
                  type="button"
                  $provider="google"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                >
                  <svg viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </OAuthButton>

                <OAuthButton
                  type="button"
                  $provider="microsoft"
                  onClick={handleMicrosoftLogin}
                  disabled={isSubmitting}
                >
                  <svg viewBox="0 0 24 24">
                    <path fill="#f25022" d="M11.4 11.4H.6V.6h10.8v10.8z" />
                    <path fill="#00a4ef" d="M23.4 11.4H12.6V.6h10.8v10.8z" />
                    <path fill="#7fba00" d="M11.4 23.4H.6V12.6h10.8v10.8z" />
                    <path fill="#ffb900" d="M23.4 23.4H12.6V12.6h10.8v10.8z" />
                  </svg>
                  Continue with Microsoft
                </OAuthButton>
              </OAuthContainer>

              <Divider>
                <span>or</span>
              </Divider>

              <FormContainer onSubmit={handleSubmit}>
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  autoComplete="username"
                />

                {!isLoginMode && (
                  <EmailInput
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    autoComplete="email"
                    $isVisible={!isLoginMode}
                  />
                )}

                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                />

                <SubmitButton type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting ? (
                    <LoadingSpinner />
                  ) : (
                    isLoginMode ? 'Sign In' : 'Create Account'
                  )}
                </SubmitButton>
              </FormContainer>

              {(localError || error) && (
                <ErrorMessage>{localError || error}</ErrorMessage>
              )}

              {successMessage && (
                <SuccessMessage>{successMessage}</SuccessMessage>
              )}
            </FormInnerContainer>
          </FormPanel>
        </DualPanelContainer>
      </LoginScreenContainer>
    </ThemeProvider>
  );
};

export default ForcedLoginScreen;