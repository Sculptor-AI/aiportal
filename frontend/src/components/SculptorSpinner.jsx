import styled, { keyframes } from 'styled-components';

const sculptorFrame = keyframes`
  0% { background-image: url("/images/sculptorlogo1.png"); }
  12.5% { background-image: url("/images/sculptorlogo2 (1).png"); }
  25% { background-image: url("/images/_sculptorlogo3 (1).png"); }
  37.5% { background-image: url("/images/sculptorlogo4 (1).png"); }
  50% { background-image: url("/images/sculptorlogo5 (1).png"); }
  62.5% { background-image: url("/images/sculptorlogo6 (1).png"); }
  75% { background-image: url("/images/sculptorlogo7 (1).png"); }
  87.5% { background-image: url("/images/sculptorlogo8 (1).png"); }
  100% { background-image: url("/images/sculptorlogo1.png"); }
`;

const sculptorSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SculptorSpinner = styled.div`
  --size: ${props => props.$size || '24px'};
  width: var(--size);
  aspect-ratio: 1;
  border-radius: 50%;
  display: inline-block;
  background-image: url("/images/sculptorlogo1.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: ${sculptorFrame} 1s steps(8) infinite, ${sculptorSpin} 1.6s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export default SculptorSpinner;
