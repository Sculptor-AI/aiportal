import React from 'react';
import styled from 'styled-components';

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: ${props => props.theme.background || '#f0f0f0'}; /* Fallback background */
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: ${props => props.theme.text || '#000000'}; /* Fallback text color */
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 14px;
`;

const Input = styled.input`
  width: 60px;
  background: ${props => props.theme.inputBackground || '#ffffff'}; /* Fallback input background */
  border: 1px solid ${props => props.theme.border || '#cccccc'}; /* Fallback border */
  color: ${props => props.theme.text || '#000000'}; /* Fallback text color */
  border-radius: 3px;
`;

const Button = styled.button`
  background: ${props => props.theme.primary || '#007bff'}; /* Fallback primary color */
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.primaryHover || '#0056b3'}; /* Fallback primary hover color */
  }
`;

const ObjectControls = ({ object, setObject, sendToAI, theme, objects, setObjects, setSelectedId }) => {
  const handleInputChange = (axis, value, property) => {
    setObject({
      ...object,
      [property]: { ...object[property], [axis]: parseFloat(value) },
    });
  };

  const handleAddObject = (type) => {
    const newId = (objects.length + 1).toString();
    const newObj = {
      id: newId,
      type,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: type === 'box' ? 'orange' : 'blue'
    };
    setObjects([...objects, newObj]);
    setSelectedId(newId);
  };

  return (
    <ControlsContainer theme={theme}>
      <ControlRow>
        <Label>Position:</Label>
        <Input
          type="number"
          value={object.position.x}
          onChange={e => handleInputChange('x', e.target.value, 'position')}
        />
        <Input
          type="number"
          value={object.position.y}
          onChange={e => handleInputChange('y', e.target.value, 'position')}
        />
        <Input
          type="number"
          value={object.position.z}
          onChange={e => handleInputChange('z', e.target.value, 'position')}
        />
      </ControlRow>
      <ControlRow>
        <Label>Rotation:</Label>
        <Input
          type="number"
          value={object.rotation.x}
          onChange={e => handleInputChange('x', e.target.value, 'rotation')}
        />
        <Input
          type="number"
          value={object.rotation.y}
          onChange={e => handleInputChange('y', e.target.value, 'rotation')}
        />
        <Input
          type="number"
          value={object.rotation.z}
          onChange={e => handleInputChange('z', e.target.value, 'rotation')}
        />
      </ControlRow>
      <ControlRow>
        <Label>Scale:</Label>
        <Input
          type="number"
          value={object.scale.x}
          onChange={e => handleInputChange('x', e.target.value, 'scale')}
        />
        <Input
          type="number"
          value={object.scale.y}
          onChange={e => handleInputChange('y', e.target.value, 'scale')}
        />
        <Input
          type="number"
          value={object.scale.z}
          onChange={e => handleInputChange('z', e.target.value, 'scale')}
        />
      </ControlRow>
      <Button onClick={sendToAI}>Send to AI</Button>
      <Button onClick={() => handleAddObject('box')}>Add Box</Button>
      <Button onClick={() => handleAddObject('sphere')}>Add Sphere</Button>
    </ControlsContainer>
  );
};

export default ObjectControls;