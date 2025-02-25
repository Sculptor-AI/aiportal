import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: 8px;
  width: 360px;
  max-width: 90%;
  box-shadow: 0 4px 12px ${props => props.theme.shadow};
  overflow: hidden;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;
  
  &:hover {
    background-color: ${props => props.theme.secondary};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e53935;
  font-size: 0.9rem;
  margin-top: 8px;
  text-align: center;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 16px;
  font-size: 0.9rem;
`;

const SwitchLink = styled.a`
  color: ${props => props.theme.primary};
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: ${props => props.theme.secondary};
  }
`;

const LoginModal = ({ closeModal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        // Registration validation
        if (username.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await register(username, password);
      }
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
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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