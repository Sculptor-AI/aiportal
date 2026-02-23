import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const ambientShift = keyframes`
  0%, 100% { opacity: 0.85; transform: translate3d(0, 0, 0); }
  50% { opacity: 1; transform: translate3d(-2%, -1%, 0); }
`;

const dotDrift = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-30px, -18px, 0); }
`;

// ─── Dot Grid Background Component ───────────────────────────────────────────

// ─── Soft flowing accent shapes ───────────────────────────────────────────────

// ─── Styled Components ────────────────────────────────────────────────────────

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: #fafaf8;
`;

const BottomDotField = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 56%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: -12% -8% 0;
    background:
      radial-gradient(120% 85% at 92% 100%, rgba(36, 43, 53, 0.44) 0%, rgba(52, 62, 76, 0.28) 35%, rgba(250, 250, 248, 0) 80%),
      linear-gradient(to top, rgba(39, 47, 59, 0.2) 0%, rgba(39, 47, 59, 0.08) 40%, rgba(250, 250, 248, 0) 82%);
    animation: ${ambientShift} 12s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -22% -8% -12%;
    background-image: radial-gradient(circle, rgba(220, 228, 238, 0.42) 1.2px, transparent 1.3px);
    background-size: 32px 32px;
    background-position: 0 0;
    mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.82) 34%, rgba(0, 0, 0, 0.2) 76%, transparent 100%);
    -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.82) 34%, rgba(0, 0, 0, 0.2) 76%, transparent 100%);
    animation: ${dotDrift} 18s linear infinite;
  }

  @media (max-width: 768px) {
    height: 50%;

    &::after {
      background-size: 26px 26px;
    }
  }
`;

const ContentWrap = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
`;

const BrandArea = styled.div`
  text-align: center;
  margin-bottom: 40px;
  animation: ${fadeIn} 0.6s ease-out both;
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const BrandIcon = styled.img`
  width: 54px;
  height: 54px;
  opacity: 0.9;
  transform: translateY(1px);

  @media (max-width: 480px) {
    width: 46px;
    height: 46px;
  }
`;

const BrandName = styled.h1`
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  font-weight: 600;
  font-size: 2.6rem;
  color: #2c2420;
  letter-spacing: -0.025em;
  line-height: 1;
  margin: 0;
`;

const Tagline = styled.p`
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 0.95rem;
  color: #9a8a7c;
  margin: 4px 0 0;
  letter-spacing: 0.01em;
`;

const Card = styled.div`
  width: 100%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(130%);
  -webkit-backdrop-filter: blur(20px) saturate(130%);
  border: 1px solid rgba(200, 190, 180, 0.18);
  border-radius: 20px;
  padding: 40px 36px 36px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.04);
  animation: ${fadeIn} 0.6s ease-out 0.1s both;

  @media (max-width: 480px) {
    padding: 32px 24px 28px;
    border-radius: 16px;
  }
`;

const FormHeading = styled.h2`
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: 1.4rem;
  color: #2c2420;
  text-align: center;
  margin: 0 0 28px;
  letter-spacing: -0.01em;
`;

const OAuthGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 0;
`;

const OAuthBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  background: #ffffff;
  border: 1px solid rgba(200, 190, 180, 0.28);
  border-radius: 10px;
  color: #3d3530;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.005em;

  &:hover:not(:disabled) {
    background: #f8f6f4;
    border-color: rgba(180, 170, 160, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &:active:not(:disabled) { transform: scale(0.995); }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  svg { width: 17px; height: 17px; flex-shrink: 0; }
`;

const DividerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(200, 190, 180, 0.22);
  }

  span {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    color: #b0a298;
    text-transform: lowercase;
    letter-spacing: 0.08em;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputWrapper = styled.div`
  transition: max-height 0.35s ease, opacity 0.3s ease, margin 0.35s ease;
  max-height: ${p => (p.$hidden ? '0' : '52px')};
  opacity: ${p => (p.$hidden ? 0 : 1)};
  margin-bottom: ${p => (p.$hidden ? '-12px' : '0')};
  overflow: hidden;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  background: rgba(250, 248, 245, 0.6);
  border: 1px solid rgba(200, 190, 180, 0.2);
  border-radius: 10px;
  color: #2c2420;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9rem;
  font-weight: 400;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #b8ada5;
    font-weight: 400;
  }

  &:focus {
    background: #ffffff;
    border-color: rgba(180, 160, 140, 0.35);
    box-shadow: 0 0 0 3px rgba(180, 160, 140, 0.08);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 12px 24px;
  margin-top: 4px;
  background: #2c2420;
  color: #faf8f6;
  border: none;
  border-radius: 10px;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #3d3228;
    box-shadow: 0 4px 16px rgba(44, 36, 32, 0.15);
  }

  &:active:not(:disabled) { transform: scale(0.995); }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(250, 248, 246, 0.3);
  border-top-color: #faf8f6;
  border-radius: 50%;
  animation: ${spin} 0.65s linear infinite;
  margin: 0 auto;
`;

const ToggleText = styled.p`
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  color: #9a8a7c;
  text-align: center;
  margin: 18px 0 0;

  button {
    background: none;
    border: none;
    color: #2c2420;
    font-family: inherit;
    font-size: inherit;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    text-decoration: none;
    border-bottom: 1px solid rgba(44, 36, 32, 0.25);
    padding-bottom: 1px;
    transition: border-color 0.2s;

    &:hover { border-color: rgba(44, 36, 32, 0.6); }
  }
`;

const Message = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  text-align: center;
  padding: 10px 14px;
  border-radius: 10px;
  margin-top: 12px;
  line-height: 1.45;

  ${p => p.$type === 'error' && css`
    color: #8b3028;
    background: rgba(192, 57, 43, 0.06);
    border: 1px solid rgba(192, 57, 43, 0.12);
  `}

  ${p => p.$type === 'success' && css`
    color: #1e6b4a;
    background: rgba(30, 122, 84, 0.06);
    border: 1px solid rgba(30, 122, 84, 0.12);
  `}
`;

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09a7.12 7.12 0 0 1 0-4.18V7.07H2.18A11.99 11.99 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24">
    <path fill="#f25022" d="M11.4 11.4H.6V.6h10.8z" />
    <path fill="#00a4ef" d="M23.4 11.4H12.6V.6h10.8z" />
    <path fill="#7fba00" d="M11.4 23.4H.6V12.6h10.8z" />
    <path fill="#ffb900" d="M23.4 23.4H12.6V12.6h10.8z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ForcedLoginScreen = () => {
  const { login, register, loading, error, loginWithGoogle } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!document.querySelector('link[href*="Playfair+Display"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      } else {
        if (!formData.username || !formData.password || !formData.email) {
          setLocalError('Please fill in all fields');
          return;
        }
        if (formData.password.length < 8) {
          setLocalError('Password must be at least 8 characters');
          return;
        }
        await register(formData.username, formData.password, formData.email);
        setSuccessMessage('Account created! Please sign in.');
        setIsLoginMode(true);
        setFormData(prev => ({ ...prev, password: '', email: '' }));
      }
    } catch (err) {
      setLocalError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(m => !m);
    setFormData({ username: '', password: '', email: '' });
    setLocalError('');
    setSuccessMessage('');
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setLocalError(err.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setLocalError('Microsoft sign-in is not yet available.');
  };

  const displayError = localError || error;

  return (
    <Screen>
      <BottomDotField />

      <ContentWrap>
        <BrandArea>
          <BrandRow>
            <BrandIcon src="/sculptor.svg" alt="Sculptor" />
            <BrandName>Sculptor</BrandName>
          </BrandRow>
          <Tagline>AI by students</Tagline>
        </BrandArea>

        <Card>
          <FormHeading>
            {isLoginMode ? 'Welcome back' : 'Create your account'}
          </FormHeading>

          <OAuthGroup>
            <OAuthBtn type="button" onClick={handleGoogleLogin} disabled={isSubmitting}>
              <GoogleIcon />
              Continue with Google
            </OAuthBtn>
            <OAuthBtn type="button" onClick={handleMicrosoftLogin} disabled={isSubmitting}>
              <MicrosoftIcon />
              Continue with Microsoft
            </OAuthBtn>
          </OAuthGroup>

          <DividerRow><span>or</span></DividerRow>

          <Form onSubmit={handleSubmit}>
            <InputWrapper>
              <Input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="username"
              />
            </InputWrapper>

            <InputWrapper $hidden={isLoginMode}>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="email"
                tabIndex={isLoginMode ? -1 : 0}
              />
            </InputWrapper>

            <InputWrapper>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              />
            </InputWrapper>

            <SubmitBtn type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? <Spinner /> : isLoginMode ? 'Sign In' : 'Create Account'}
            </SubmitBtn>
          </Form>

          {displayError && <Message $type="error">{displayError}</Message>}
          {successMessage && <Message $type="success">{successMessage}</Message>}

          <ToggleText>
            {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
            <button type="button" onClick={toggleMode}>
              {isLoginMode ? 'Sign Up' : 'Sign In'}
            </button>
          </ToggleText>
        </Card>
      </ContentWrap>
    </Screen>
  );
};

export default ForcedLoginScreen;
