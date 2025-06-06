import React from 'react';
import styled from 'styled-components';

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
  return (
    <PageContainer>
      <Title>Media Page</Title>
      <p>Content for the Media page will go here.</p>
    </PageContainer>
  );
};

export default MediaPage; 