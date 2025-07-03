
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ObjectControls from './ObjectControls';

const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px;
  width: 450px;
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.15);
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
  font-size: 24px;
  cursor: pointer;
`;

const Content = styled.div`
  flex: 1;
  position: relative; /* Add relative positioning */
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${props => props.theme.text};
`;

const Box = ({ object }) => {
  const meshRef = useRef();

  return (
    <mesh
      ref={meshRef}
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'orange'} />
    </mesh>
  );
};

const Sandbox3DModal = ({ isOpen, onClose, theme, otherPanelsOpen = 0, onSend }) => {
  const [object, setObject] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  });

  const handleSendToAI = () => {
    onSend(object);
    onClose();
  };

  return (
    <ModalContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>3D Object Sandbox</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      <Content>
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Box object={object} />
          <OrbitControls />
        </Canvas>
        <ObjectControls
          object={object}
          setObject={setObject}
          sendToAI={handleSendToAI}
          theme={theme}
        />
      </Content>
    </ModalContainer>
  );
};

export default Sandbox3DModal;
