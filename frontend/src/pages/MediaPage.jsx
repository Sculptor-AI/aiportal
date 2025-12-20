import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';

const PageContainer = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: ${props => props.theme.text};
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
`;

const MediaPage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <Title>{t('media.title')}</Title>
      <p>{t('media.placeholder')}</p>
    </PageContainer>
  );
};

export default MediaPage; 
