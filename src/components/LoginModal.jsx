import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}40;
  }
`;

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &:hover {
    background-color: ${props => props.theme.secondary};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const GoogleButton = styled(Button)`
  background-color: white;
  color: #444;
  border: 1px solid #ddd;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  
  &:hover {
    background-color: #f8f8f8;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const DividerContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
`;

const Divider = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${props => props.theme.border};
`;

const DividerText = styled.span`
  padding: 0 16px;
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  color: #e53935;
  font-size: 0.9rem;
  margin-top: 8px;
  text-align: center;
  background-color: rgba(229, 57, 53, 0.1);
  padding: 8px;
  border-radius: 4px;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
`;

const SwitchLink = styled.a`
  color: ${props => props.theme.primary};
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoginModal = ({ closeModal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, loginWithGoogle } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    if (!isLogin && !email.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
        closeModal();
      } else {
        // Registration validation
        if (username.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        const result = await register(username, password, email);
        setError('');
        // Show success message for pending approval
        setError(`Registration successful! Your account is now pending approval. An administrator will review your account before you can log in.`);
        setIsLogin(true);
        setPassword(''); // Clear password for security
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };
  
  return (
    <ModalOverlay onClick={handleOutsideClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isLogin ? 'Log In' : 'Create Account'}</ModalTitle>
          <CloseButton onClick={closeModal}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <GoogleButton type="button" onClick={handleGoogleLogin} disabled={isLoading}>
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
          </GoogleButton>
          
          <DividerContainer>
            <Divider />
            <DividerText>OR</DividerText>
            <Divider />
          </DividerContainer>
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </FormGroup>
            {!isLogin && (
              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </FormGroup>
            )}
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Enter your password" : "Password (min 8 characters)"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
            </FormGroup>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isLogin ? 'Logging in...' : 'Creating account...') 
                : (isLogin ? 'Log In' : 'Create Account')}
            </Button>
          </Form>
          
          <SwitchText>
            {isLogin 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <SwitchLink onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Log in'}
            </SwitchLink>
          </SwitchText>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default LoginModal;