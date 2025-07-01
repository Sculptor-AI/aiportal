import React, { useState } from 'react';
import styled, { ThemeProvider, keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { getTheme } from '../styles/themes';

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

const LoginScreenContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe);
  background-size: 400% 400%;
  animation: ${gradientShift} 15s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
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
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    animation: ${floatingAnimation} 25s infinite linear reverse;
  }
`;

const FloatingShape = styled.div`
  position: absolute;
  background: rgba(255, 255, 255, 0.05);
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

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
  text-align: center;
  position: relative;
  z-index: 10;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 24px;
    z-index: -1;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
`;

const Logo = styled.div`
  font-size: 2.8rem;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 14px 18px;
  border: 1px solid rgba(209, 213, 219, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: #374151;
  font-size: 1rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  outline: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background: rgba(255, 255, 255, 0.95);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
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
  border: 1px solid rgba(209, 213, 219, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 1);
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
    background: rgba(209, 213, 219, 0.4);
  }
  
  span {
    background: rgba(255, 255, 255, 0.95);
    padding: 0 16px;
    color: #9ca3af;
    font-size: 0.9rem;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  margin-top: 16px;
  text-decoration: underline;
  transition: all 0.2s ease;

  &:hover {
    color: #764ba2;
    text-decoration: none;
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
    setIsLoginMode(!isLoginMode);
    setFormData({ username: '', password: '', email: '' });
    setLocalError('');
    setSuccessMessage('');
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
        <FloatingShape $duration={22} />
        <FloatingShape $duration={18} $reverse />
        <FloatingShape $duration={25} />
        
        <LoginCard>
          <LogoContainer>
            <LogoIcon>S</LogoIcon>
            <Logo>Sculptor</Logo>
          </LogoContainer>
          <Subtitle>
            {isLoginMode ? 'Welcome back to your creative workspace' : 'Create your Sculptor account'}
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
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="email"
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

          <ToggleButton type="button" onClick={toggleMode}>
            {isLoginMode 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </ToggleButton>
        </LoginCard>
      </LoginScreenContainer>
    </ThemeProvider>
  );
};

export default ForcedLoginScreen;