import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';
import { generateVideo, pollVideoStatus, getVideoDownloadUrl } from '../services/videoService';
import { useToast } from '../contexts/ToastContext';

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const glow = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
`;

// ============================================================================
// MAIN LAYOUT
// ============================================================================

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  color: ${props => props.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  width: ${props => props.$collapsed ? '100%' : 'calc(100% - 320px)'};
  margin-left: ${props => props.$collapsed ? '0' : '320px'};

  @media (max-width: 1024px) {
    width: 100%;
    margin-left: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 40px 80px;

  @media (max-width: 768px) {
    padding: 32px 20px 60px;
  }
`;

// ============================================================================
// HEADER
// ============================================================================

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PageTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const BetaTag = styled.span`
  font-size: 0.75rem;
  padding: 4px 10px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  color: ${props => props.theme.accentColor || props.theme.primary};
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const Subtitle = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  letter-spacing: -0.01em;
`;

// ============================================================================
// PROMPT CARD
// ============================================================================

const PromptCard = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 40px;
  animation: ${slideUp} 0.5s ease-out;
  animation-delay: 0.1s;
  animation-fill-mode: backwards;
  transition: border-color 0.3s ease;

  ${props => props.$generating && css`
    border-color: ${props.theme.accentColor || props.theme.primary}60;
  `}
`;

const PromptHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const PromptIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${props => props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.primaryForeground || 'white'};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PromptTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 16px 20px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  color: ${props => props.theme.text};
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}50`};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SettingsRow = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 20px;
  flex-wrap: wrap;
  align-items: flex-end;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
`;

const Label = styled.label`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Select = styled.select`
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  color: ${props => props.theme.text};
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  option {
    background: ${props => props.theme.sidebar};
    color: ${props => props.theme.text};
  }
`;

const GenerateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: ${props => props.theme.primary};
  color: ${props => props.theme.primaryForeground || 'white'};
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-left: auto;
  min-width: 180px;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:active:not(:disabled) {
    filter: brightness(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
    margin-top: 12px;
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

// ============================================================================
// VIDEO GALLERY
// ============================================================================

const GalleryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  animation: ${slideUp} 0.5s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: backwards;
`;

const GalleryTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VideoCount = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  padding: 4px 10px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  color: ${props => props.theme.accentColor || props.theme.primary};
  border-radius: 20px;
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #EF4444;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const VideoCard = styled.article`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  animation: ${scaleIn} 0.4s ease-out;
  animation-delay: ${props => props.$index * 0.05}s;
  animation-fill-mode: backwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => props.theme.shadow || 'rgba(0,0,0,0.15)'};
    border-color: ${props => props.theme.accentColor || props.theme.primary}40;
  }

  ${props => props.$generating && css`
    border-color: ${props.theme.accentColor || props.theme.primary}60;
  `}
`;

const VideoPreview = styled.div`
  position: relative;
  background: ${props => props.theme.isDark ? '#0a0a0a' : '#000'};
  aspect-ratio: 16/9;
  overflow: hidden;
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: white;
  padding: 20px;
  text-align: center;

  svg {
    width: 40px;
    height: 40px;
    opacity: 0.6;
  }
`;

const PlaceholderText = styled.span`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const ProgressBarContainer = styled.div`
  width: 80%;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: 30%;
  background: ${props => props.theme.primary};
  border-radius: 2px;
  animation: loading 2s infinite ease-in-out;
  
  @keyframes loading {
    0% { transform: translateX(-100%); width: 30%; }
    50% { width: 60%; }
    100% { transform: translateX(200%); width: 30%; }
  }
`;

const CardContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VideoPrompt = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: ${props => props.theme.text};
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return 'rgba(34, 197, 94, 0.15)';
      case 'failed': return 'rgba(239, 68, 68, 0.15)';
      default: return props.theme.accentSurface || `${props.theme.primary}15`;
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed': return '#22C55E';
      case 'failed': return '#EF4444';
      default: return props.theme.accentColor || props.theme.primary;
    }
  }};
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || props.theme.inputBackground};
    color: ${props => props.theme.text};
  }

  &:hover.delete {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const EmptyIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 32px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: ${float} 3s ease-in-out infinite;

  svg {
    width: 56px;
    height: 56px;
    color: ${props => props.theme.accentColor || props.theme.primary};
    opacity: 0.8;
  }
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
`;

const EmptyDescription = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  max-width: 420px;
  line-height: 1.6;
`;

// ============================================================================
// COMPONENT
// ============================================================================

const MediaPage = ({ collapsed }) => {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeOperation, setActiveOperation] = useState(null);
  
  // Load saved videos from localStorage
  const [videos, setVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('generated_videos');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading videos:', e);
      return [];
    }
  });

  // Persist videos to localStorage
  useEffect(() => {
    localStorage.setItem('generated_videos', JSON.stringify(videos));
  }, [videos]);

  // Polling logic
  useEffect(() => {
    let pollInterval;

    if (activeOperation) {
      const checkStatus = async () => {
        try {
          const status = await pollVideoStatus(activeOperation.id);
          
          if (status.done) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setActiveOperation(null);
            
            if (status.error) {
              toast.showErrorToast('Generation Failed', status.error);
              updateVideoStatus(activeOperation.localId, 'failed', null);
            } else {
              toast.showSuccessToast('Video Ready', 'Your video has been generated successfully!');
              const downloadUrl = getVideoDownloadUrl(status.videoUri);
              updateVideoStatus(activeOperation.localId, 'completed', downloadUrl);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      };

      pollInterval = setInterval(checkStatus, 5000);
      checkStatus();
    }

    return () => clearInterval(pollInterval);
  }, [activeOperation, toast]);

  const updateVideoStatus = (localId, status, url) => {
    setVideos(prev => prev.map(v => 
      v.id === localId 
        ? { ...v, status, url: url || v.url, updatedAt: new Date().toISOString() } 
        : v
    ));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const localId = Date.now().toString();
    
    const newVideo = {
      id: localId,
      prompt,
      aspectRatio,
      status: 'generating',
      createdAt: new Date().toISOString(),
      url: null
    };
    
    setVideos(prev => [newVideo, ...prev]);

    try {
      const result = await generateVideo(prompt, { aspectRatio });

      if (result.success && result.operationName) {
        setActiveOperation({
          id: result.operationName,
          localId
        });
        toast.showInfoToast('Generation Started', 'Your video is being created. This may take a few minutes.');
      } else {
        throw new Error(result.error || 'Failed to start generation');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setIsGenerating(false);
      updateVideoStatus(localId, 'failed', null);
      toast.showErrorToast('Error', typeof error === 'string' ? error : 'Failed to generate video. Please try again.');
    }
  };

  const handleDelete = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all videos?')) {
      setVideos([]);
    }
  };

  const handleDownload = (video) => {
    if (video.url) {
      window.open(video.url, '_blank');
    }
  };

  return (
    <PageContainer $collapsed={collapsed}>
      <ContentWrapper>
        <Header>
          <TitleSection>
            <PageTitle>
              Media Studio
              <BetaTag>Veo 2</BetaTag>
            </PageTitle>
            <Subtitle>Create AI-generated videos with Google's Veo 2 model</Subtitle>
          </TitleSection>
        </Header>

        <PromptCard $generating={isGenerating}>
          <PromptHeader>
            <PromptIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </PromptIcon>
            <PromptTitle>Create New Video</PromptTitle>
          </PromptHeader>

          <TextArea 
            placeholder="Describe your video in detail... (e.g., A cinematic drone shot of a futuristic city at night with neon lights reflecting in puddles, slow motion, 8K quality)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={isGenerating}
          />

          <SettingsRow>
            <SettingGroup>
              <Label>Aspect Ratio</Label>
              <Select 
                value={aspectRatio} 
                onChange={e => setAspectRatio(e.target.value)}
                disabled={isGenerating}
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="1:1">1:1 Square</option>
              </Select>
            </SettingGroup>
            
            <SettingGroup>
              <Label>Duration</Label>
              <Select disabled>
                <option>5-8 seconds (Auto)</option>
              </Select>
            </SettingGroup>

            <GenerateButton 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner /> Generating...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Generate Video
                </>
              )}
            </GenerateButton>
          </SettingsRow>
        </PromptCard>

        {videos.length > 0 && (
          <>
            <GalleryHeader>
              <GalleryTitle>
                Your Videos
                <VideoCount>{videos.length}</VideoCount>
              </GalleryTitle>
              <ClearButton onClick={handleClearAll}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear All
              </ClearButton>
            </GalleryHeader>

            <VideoGrid>
              {videos.map((video, index) => (
                <VideoCard key={video.id} $index={index} $generating={video.status === 'generating'}>
                  <VideoPreview>
                    {video.status === 'completed' && video.url ? (
                      <VideoPlayer src={video.url} controls />
                    ) : (
                      <VideoPlaceholder>
                        {video.status === 'failed' ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <PlaceholderText>Generation Failed</PlaceholderText>
                          </>
                        ) : (
                          <>
                            <Spinner style={{ width: 32, height: 32 }} />
                            <PlaceholderText>Generating your video...</PlaceholderText>
                            <ProgressBarContainer>
                              <ProgressBar />
                            </ProgressBarContainer>
                          </>
                        )}
                      </VideoPlaceholder>
                    )}
                  </VideoPreview>
                  <CardContent>
                    <VideoPrompt>{video.prompt}</VideoPrompt>
                    <CardFooter>
                      <StatusBadge $status={video.status}>
                        {video.status === 'generating' ? 'Processing' : video.status}
                      </StatusBadge>
                      <CardActions>
                        {video.status === 'completed' && (
                          <IconButton onClick={() => handleDownload(video)} title="Download">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </IconButton>
                        )}
                        <IconButton className="delete" onClick={() => handleDelete(video.id)} title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </IconButton>
                      </CardActions>
                    </CardFooter>
                  </CardContent>
                </VideoCard>
              ))}
            </VideoGrid>
          </>
        )}

        {videos.length === 0 && (
          <EmptyState>
            <EmptyIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </EmptyIcon>
            <EmptyTitle>No videos yet</EmptyTitle>
            <EmptyDescription>
              Create your first AI-generated video by entering a detailed prompt above. Veo 2 can generate stunning 5-8 second videos from your descriptions.
            </EmptyDescription>
          </EmptyState>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default MediaPage;
