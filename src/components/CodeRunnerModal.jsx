import React, { useState } from 'react';
import styled from 'styled-components';
import { sendMessageToBackend } from '../services/aiService';

const Container = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px;
  width: 450px;
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1003;
  display: flex;
  flex-direction: column;
  box-shadow: -3px 0 10px rgba(0,0,0,0.15);
  border-left: 1px solid ${props => props.theme.border};
  transform: ${props => props.$isOpen ? 'translateX(0%)' : 'translateX(100%)'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: transform 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  cursor: pointer;
  font-size: 24px;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TextArea = styled.textarea`
  width: 100%;
  flex: 1;
  resize: vertical;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.chat};
  color: ${props => props.theme.text};
`;

const ResultArea = styled.pre`
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.chat};
  color: ${props => props.theme.text};
  white-space: pre-wrap;
  overflow-y: auto;
`;

const Select = styled.select`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.chat};
  color: ${props => props.theme.text};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme.border};
`;

const Button = styled.button`
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.$primary ? props.theme.primary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.text};
`;

const CodeRunnerModal = ({ isOpen, onClose, onInsert, modelId, otherPanelsOpen = 0 }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const prompt = `Execute the following ${language} code and show the output. If execution fails, return the error.\n\n${code}`;
      const res = await sendMessageToBackend(modelId, prompt);
      setResult(res.response || '');
    } catch {
      setResult('Error running code');
    }
    setLoading(false);
  };

  const handleInsert = () => {
    if (onInsert && result) onInsert(result + ' ');
    onClose();
    setCode('');
    setResult('');
  };

  return (
    <Container $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>Code Runner</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      <Content>
        <Select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="bash">Bash</option>
        </Select>
        <TextArea value={code} onChange={e => setCode(e.target.value)} placeholder="Enter code..." />
        <Button onClick={handleRun} disabled={loading || !code.trim()} $primary>
          {loading ? 'Running...' : 'Run'}
        </Button>
        <ResultArea>{result}</ResultArea>
      </Content>
      <ButtonRow>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleInsert} disabled={!result} $primary>Insert</Button>
      </ButtonRow>
    </Container>
  );
};

export default CodeRunnerModal;
