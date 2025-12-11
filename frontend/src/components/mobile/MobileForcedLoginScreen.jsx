import React, { useState } from 'react';
import styled, { ThemeProvider, keyframes } from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/themes';

// Animated background
const floatingAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(90deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
  75% { transform: translateY(-15px) rotate(270deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LoginScreenContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%);
  background-size: 200% 200%;
  animation: ${gradientShift} 15s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  overflow: hidden;
`;

const FloatingOrb = styled.div`
  position: absolute;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
  border-radius: 50%;
  animation: ${floatingAnimation} ${props => props.$duration}s infinite ease-in-out ${props => props.$delay}s;
  filter: blur(1px);
  
  &:nth-child(1) {
    top: 10%;
    left: 5%;
    width: 80px;
    height: 80px;
  }
  
  &:nth-child(2) {
    bottom: 15%;
    right: 10%;
    width: 60px;
    height: 60px;
  }
  
  &:nth-child(3) {
    top: 50%;
    right: 20%;
    width: 40px;
    height: 40px;
  }
  
  &:nth-child(4) {
    bottom: 30%;
    left: 15%;
    width: 50px;
    height: 50px;
  }
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 380px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 100px rgba(102, 126, 234, 0.2),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
  padding: 32px 24px;
  position: relative;
  z-index: 10;
  animation: ${fadeIn} 0.6s ease-out;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  gap: 12px;
`;

const LogoIcon = styled.img`
  width: 56px;
  height: 56px;
  filter: none;
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #64748b;
  margin-bottom: 28px;
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(209, 213, 219, 0.3);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  color: #1f2937;
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  outline: none;
  transition: all 0.3s ease;
  -webkit-appearance: none;

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
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
  padding: ${props => props.$isVisible ? '16px 20px' : '0 20px'};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:active::before {
    width: 300px;
    height: 300px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  }
`;

const OAuthContainer = styled.div`
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OAuthButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 14px 20px;
  border: 2px solid rgba(209, 213, 219, 0.3);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.95);
    border-color: ${props => props.$provider === 'google' ? '#4285f4' : '#0078d4'};
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Divider = styled.div`
  position: relative;
  margin: 20px 0;
  text-align: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(209, 213, 219, 0.4), transparent);
  }
  
  span {
    background: rgba(255, 255, 255, 0.98);
    padding: 0 16px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    position: relative;
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  margin-top: 20px;
  padding: 8px;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  text-decoration: none;
  width: 100%;

  &:active {
    transform: scale(0.95);
  }

  &:hover {
    color: #764ba2;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-top: 12px;
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
`;

const SuccessMessage = styled.div`
  color: #10b981;
  font-size: 0.875rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-top: 12px;
  text-align: center;
  background: rgba(16, 185, 129, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
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

const MobileForcedLoginScreen = () => {
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
  };

  const theme = getTheme('light'); // Use light theme for login screen

  return (
    <ThemeProvider theme={theme}>
      <LoginScreenContainer>
        <FloatingOrb $duration={22} $delay={0} />
        <FloatingOrb $duration={18} $reverse $delay={1} />
        <FloatingOrb $duration={25} $delay={2} />
        <FloatingOrb $duration={20} $delay={3} />
        <LoginCard>
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
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
                <path fill="#f25022" d="M11.4 11.4H.6V.6h10.8v10.8z"/>
                <path fill="#00a4ef" d="M23.4 11.4H12.6V.6h10.8v10.8z"/>
                <path fill="#7fba00" d="M11.4 23.4H.6V12.6h10.8v10.8z"/>
                <path fill="#ffb900" d="M23.4 23.4H12.6V12.6h10.8v10.8z"/>
              </svg>
              Continue with Microsoft
            </OAuthButton>
          </OAuthContainer>

          <Divider>
            <span>or</span>
          </Divider>

          <FormContainer onSubmit={handleSubmit}>
            <InputGroup>
              <Input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="username"
              />
            </InputGroup>

            {!isLoginMode && (
              <InputGroup>
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
              </InputGroup>
            )}

            <InputGroup>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete={isLoginMode ? "current-password" : "new-password"}
              />
            </InputGroup>

            <SubmitButton type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? (
                <LoadingSpinner />
              ) : (
                isLoginMode ? 'Sign in' : 'Create Account'
              )}
            </SubmitButton>
          </FormContainer>

          {(localError || error) && (
            <ErrorMessage>{localError || error}</ErrorMessage>
          )}

          {successMessage && (
            <SuccessMessage>{successMessage}</SuccessMessage>
          )}

          <ToggleButton onClick={toggleMode} disabled={isSubmitting}>
            {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </ToggleButton>
        </LoginCard>
      </LoginScreenContainer>
    </ThemeProvider>
  );
};

export default MobileForcedLoginScreen;
