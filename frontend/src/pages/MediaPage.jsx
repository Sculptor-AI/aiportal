import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';
import { generateVideo, pollVideoStatus, getVideoDownloadUrl, downloadGeneratedVideo } from '../services/videoService';
import { useToast } from '../contexts/ToastContext';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
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

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  color: ${props => props.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  transition: padding-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  padding-left: ${props => props.$collapsed ? '0' : '300px'};

  @media (max-width: 1024px) {
    padding-left: 0;
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
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
  gap: 12px;

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const BetaTag = styled.span`
  font-size: 0.75rem;
  padding: 3px 10px;
  background: ${props => props.theme.border};
  color: ${props => props.theme.text};
  border-radius: 6px;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 28px;
  align-items: start;

  @media (max-width: 1080px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const SidePanel = styled.aside`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 20px;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1080px) {
    position: static;
  }
`;

const PanelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.9375rem;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  font-size: 0.9375rem;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: ${props => props.theme.sidebar};
    color: ${props => props.theme.text};
  }
`;

const TemplateStrip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
`;

const TemplateTag = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  font-size: 0.8rem;
  text-align: left;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.7;
  transition: background 0.15s, opacity 0.15s;

  &:hover {
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.1)'};
    opacity: 1;
  }
`;

const GenerateButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${props => props.theme.accentColor || props.theme.primary}40;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MainColumn = styled.div`
  min-width: 0;
`;

const GalleryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const GalleryTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.02em;
`;

const VideoCount = styled.span`
  font-size: 0.8rem;
  padding: 2px 8px;
  background: ${props => props.theme.border};
  border-radius: 12px;
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.1)'};
  }
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`;

const VideoCard = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  animation: ${scaleIn} 0.4s ease-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => props.theme.shadow || 'rgba(0,0,0,0.15)'};
    border-color: transparent;
  }
`;

const VideoPreview = styled.div`
  position: relative;
  background: #000;
  aspect-ratio: 16/9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StatusMessage = styled.div`
  color: #fff;
  font-size: 0.85rem;
  opacity: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const CardContent = styled.div`
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const VideoPromptText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: ${props => props.theme.text};
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid ${props => props.theme.border};
`;

const StatusBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  background: ${props => props.theme.border};
  color: ${props => props.theme.text};
  
  ${props => props.$status === 'completed' && css`
    color: #22C55E;
    background: rgba(34, 197, 94, 0.1);
  `}
  
  ${props => props.$status === 'failed' && css`
    color: #EF4444;
    background: rgba(239, 68, 68, 0.1);
  `}
`;

const CardActions = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
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

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;

  svg {
    width: 56px;
    height: 56px;
    margin-bottom: 24px;
    color: ${props => props.theme.accentColor || props.theme.primary};
    opacity: 0.6;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
`;

const EmptyDescription = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  max-width: 320px;
  line-height: 1.6;
`;

// Simple Spinner
const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PROMPT_TEMPLATES = [
  'A cinematic close-up of a rainy neon metropolis at night, ultra-realistic, dramatic lighting',
  'A minimalist product demo with clean white studio setup, soft shadows, product in motion',
  'Vintage sci-fi spaceship launch sequence, sweeping camera movement, editorial motion',
];

const MediaPage = ({ collapsed }) => {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeOperation, setActiveOperation] = useState(null);
  
  const [videos, setVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('generated_videos');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading videos:', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('generated_videos', JSON.stringify(videos));
  }, [videos]);

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

  const handleDownload = async (video) => {
    if (video.url) {
      try {
        await downloadGeneratedVideo(video.url);
      } catch (error) {
        toast.showErrorToast('Download Failed', error.message || 'Unable to download video');
      }
    }
  };

  const handleUseTemplate = (template) => {
    if (isGenerating) return;
    setPrompt(template);
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
          </TitleSection>
        </Header>

        <LayoutGrid>
          <SidePanel>
            <PanelSection>
              <Label>Prompt</Label>
              <TextArea 
                placeholder="Describe your video in detail..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <TemplateStrip>
                {PROMPT_TEMPLATES.map((template, idx) => (
                  <TemplateTag key={idx} onClick={() => handleUseTemplate(template)} disabled={isGenerating}>
                    "{template.length > 50 ? template.substring(0, 50) + '...' : template}"
                  </TemplateTag>
                ))}
              </TemplateStrip>
            </PanelSection>

            <PanelSection>
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
            </PanelSection>
            
            <PanelSection>
              <Label>Duration</Label>
              <Select disabled>
                <option>5-8 seconds (Auto)</option>
              </Select>
            </PanelSection>

            <GenerateButton 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <><Spinner /> Generating...</>
              ) : (
                'Generate Video'
              )}
            </GenerateButton>
          </SidePanel>

          <MainColumn>
            {videos.length > 0 ? (
              <>
                <GalleryHeader>
                  <GalleryTitle>
                    Generated Videos
                    <VideoCount>{videos.length}</VideoCount>
                  </GalleryTitle>
                  <ClearButton onClick={handleClearAll}>
                    Clear All
                  </ClearButton>
                </GalleryHeader>

                <VideoGrid>
                  {videos.map(video => (
                    <VideoCard key={video.id}>
                      <VideoPreview>
                        {video.status === 'completed' && video.url ? (
                          <VideoPlayer src={video.url} controls />
                        ) : (
                          <StatusMessage>
                            {video.status === 'failed' ? (
                              'Generation Failed'
                            ) : (
                              <>
                                <Spinner />
                                Processing...
                              </>
                            )}
                          </StatusMessage>
                        )}
                      </VideoPreview>
                      <CardContent>
                        <VideoPromptText title={video.prompt}>
                          {video.prompt}
                        </VideoPromptText>
                        <CardFooter>
                          <StatusBadge $status={video.status}>
                            {video.status === 'generating' ? 'Processing' : video.status}
                          </StatusBadge>
                          <CardActions>
                            {video.status === 'completed' && (
                              <ActionBtn onClick={() => handleDownload(video)} title="Download">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </ActionBtn>
                            )}
                            <ActionBtn onClick={() => handleDelete(video.id)} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </ActionBtn>
                          </CardActions>
                        </CardFooter>
                      </CardContent>
                    </VideoCard>
                  ))}
                </VideoGrid>
              </>
            ) : (
              <EmptyState>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <EmptyTitle>No videos yet</EmptyTitle>
                <EmptyDescription>
                  Enter a prompt in the left panel and click Generate to create your first video.
                </EmptyDescription>
              </EmptyState>
            )}
          </MainColumn>
        </LayoutGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default MediaPage;
