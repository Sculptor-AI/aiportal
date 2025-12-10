import React, { useState, useEffect } from 'react';
import styled, { withTheme } from 'styled-components';
import { fetchArticlesByCategory, fetchArticleContent } from '../services/rssService';
import { sendMessageToBackend } from '../services/aiService';

const NewsContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
  width: ${props => (props.$collapsed ? '100%' : 'calc(100% - 320px)')};
  margin-left: ${props => (props.$collapsed ? '0' : '320px')};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

const Header = styled.div`
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RefreshButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${props => props.theme.primary || '#007bff'};
    color: white;
    border-color: ${props => props.theme.primary || '#007bff'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  overflow-x: auto;
  padding-bottom: 10px;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.$active ? 'rgba(0,0,0,0.1)' : 'transparent'};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: rgba(0,0,0,0.05);
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: 0.8;
  }
`;

const ArticlesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(280px, auto);
  gap: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(250px, auto);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(220px, auto);
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 15px;
  }
`;

const ArticleCard = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
  min-height: 250px;

  &:hover {
    transform: translateY(-5px);
  }

  /* Size variants */
  ${props => props.$size === 'featured' && `
    grid-column: span 2;
    grid-row: span 2;
    min-height: 400px;
    
    @media (max-width: 768px) {
      grid-column: span 2;
      grid-row: span 1;
      min-height: 320px;
    }
    
    @media (max-width: 480px) {
      grid-column: span 1;
      grid-row: auto;
      min-height: 280px;
    }
  `}

  ${props => props.$size === 'wide' && `
    grid-column: span 2;
    grid-row: span 1;
    min-height: 280px;
    
    @media (max-width: 768px) {
      grid-column: span 2;
      min-height: 250px;
    }
    
    @media (max-width: 480px) {
      grid-column: span 1;
      min-height: 280px;
    }
  `}

  ${props => props.$size === 'tall' && `
    grid-column: span 1;
    grid-row: span 2;
    min-height: 400px;
    
    @media (max-width: 768px) {
      grid-row: span 1;
      min-height: 280px;
    }
    
    @media (max-width: 480px) {
      grid-row: auto;
      min-height: 280px;
    }
  `}

  ${props => props.$size === 'compact' && `
    grid-column: span 1;
    grid-row: span 1;
    min-height: 250px;
  `}

  ${props => props.$size === 'standard' && `
    grid-column: span 1;
    grid-row: span 1;
    min-height: 280px;
  `}
`;

const ArticleImage = styled.img`
  width: 100%;
  height: ${props => {
    switch(props.$size) {
      case 'featured': return '220px';
      case 'wide': return '160px';
      case 'tall': return '200px';
      case 'compact': return '140px';
      default: return '180px';
    }
  }};
  object-fit: cover;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    height: ${props => {
      switch(props.$size) {
        case 'featured': return '180px';
        case 'wide': return '140px';
        case 'tall': return '160px';
        case 'compact': return '120px';
        default: return '150px';
      }
    }};
  }
  
  @media (max-width: 480px) {
    height: 140px;
  }
`;

const ArticleContent = styled.div`
  padding: ${props => {
    switch(props.$size) {
      case 'featured': return '20px';
      case 'compact': return '16px';
      default: return '18px';
    }
  }};
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  
  @media (max-width: 768px) {
    padding: ${props => {
      switch(props.$size) {
        case 'featured': return '18px';
        case 'compact': return '14px';
        default: return '16px';
      }
    }};
  }
  
  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const ArticleTag = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;

  svg {
    width: 12px;
    height: 12px;
    opacity: 0.7;
  }
`;

const ArticleTitle = styled.h3`
  font-size: ${props => {
    switch(props.$size) {
      case 'featured': return '1.4rem';
      case 'wide': return '1.3rem';
      case 'tall': return '1.2rem';
      case 'compact': return '1.05rem';
      default: return '1.2rem';
    }
  }};
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: ${props => {
    switch(props.$size) {
      case 'featured': return '3';
      case 'wide': return '2';
      case 'compact': return '2';
      default: return '2';
    }
  }};
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: ${props => {
      switch(props.$size) {
        case 'featured': return '1.25rem';
        case 'wide': return '1.2rem';
        default: return '1.1rem';
      }
    }};
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
    -webkit-line-clamp: 2;
  }
`;

const ArticleDescription = styled.p`
  font-size: ${props => {
    switch(props.$size) {
      case 'featured': return '1rem';
      case 'wide': return '0.95rem';
      case 'tall': return '0.9rem';
      case 'compact': return '0.85rem';
      default: return '0.9rem';
    }
  }};
  color: ${props => props.theme.textSecondary};
  line-height: 1.4;
  margin: 0 0 12px 0;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: ${props => {
    switch(props.$size) {
      case 'featured': return '4';
      case 'wide': return '3';
      case 'tall': return '3';
      case 'compact': return '2';
      default: return '3';
    }
  }};
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    -webkit-line-clamp: ${props => {
      switch(props.$size) {
        case 'featured': return '3';
        case 'wide': return '2';
        default: return '2';
      }
    }};
  }
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    -webkit-line-clamp: 2;
    margin-bottom: 10px;
  }
`;

const ArticleFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
`;

const ArticleSource = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
`;

const BookmarkIcon = styled.div`
  cursor: pointer;
`;

const ArticleDetailOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ArticleDetailContainer = styled.div`
  background-color: ${props => props.theme.name === 'light' ? '#f8f9fa' : '#2c2c2e'};
  color: ${props => props.theme.text};
  width: 90%;
  max-width: 1000px;
  height: 90vh;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s ease-out;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ArticleDetailContent = styled.div`
  padding: 50px 60px;
  overflow-y: auto;
  flex-grow: 1;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.2);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  color: white;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(0,0,0,0.4);
  }
`;

const DetailTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 20px;
  color: ${props => props.theme.text};
`;

const DetailBody = styled.div`
  font-size: 1.05rem;
  line-height: 1.7;
  color: ${props => props.theme.name === 'light' ? '#343a40' : '#e0e0e0'};
  
  p {
    margin-bottom: 18px;
    text-align: justify;
  }
  
  p:last-child {
    margin-bottom: 0;
  }
`;

const DetailImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  margin: 30px 0;
`;

const DetailIntro = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  color: ${props => props.theme.name === 'light' ? '#495057' : '#d1d1d1'};
  margin-bottom: 25px;
  font-weight: 400;
`;

const ArticleMetadata = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.name === 'light' ? '#e9ecef' : '#404040'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.textSecondary};
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AuthorName = styled.span`
  font-weight: 500;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
`;

const ReadTime = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary};
`;

const MetadataRight = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary};
`;

const PublishTime = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:before {
    content: "🕒";
  }
`;

const SourceTags = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const SourceTag = styled.span`
  background-color: ${props => props.theme.name === 'light' ? '#007bff' : '#0056b3'};
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:first-child {
    background-color: ${props => props.theme.name === 'light' ? '#dc3545' : '#c82333'};
  }
  
  &:nth-child(2) {
    background-color: ${props => props.theme.name === 'light' ? '#28a745' : '#1e7e34'};
  }
  
  &:nth-child(3) {
    background-color: ${props => props.theme.name === 'light' ? '#ffc107' : '#e0a800'};
    color: #000;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid ${props => props.theme.border};
  border-top: 3px solid ${props => props.theme.primary || '#007bff'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.textSecondary};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
  text-align: center;
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.error || '#dc3545'};
`;

const RetryButton = styled.button`
  background-color: ${props => props.theme.primary || '#007bff'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.primaryHover || '#0056b3'};
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
  text-align: center;
`;

const EmptyStateMessage = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.textSecondary};
`;

const filters = [
    {
      name: 'Top',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    },
    {
      name: 'Saved',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
    },
    {
      name: 'Tech',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="22" y2="7"></line><line x1="2" y1="17" x2="22" y2="17"></line></svg>
    },
    {
      name: 'Sports',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>
    },
    {
      name: 'Finance',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
    },
    {
      name: 'Art',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
    },
    {
      name: 'TV',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
    },
    {
      name: 'Politics',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
    }
  ];

const ArticleDetailView = ({ article, onClose }) => {
  const [articleContent, setArticleContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentError, setContentError] = useState(null);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const loadArticleContent = async () => {
      setLoadingContent(true);
      setContentError(null);
      setSummary('');
      
      try {
        const content = await fetchArticleContent(article.url, article.description);
        setArticleContent(content);
        
        if (content && content.content) {
          setSummarizing(true);
          try {
            const summaryPrompt = `Please provide a concise summary of the following news article:\n\n---\n\n${content.content}`;
            const result = await sendMessageToBackend('gemini-2.5-flash', summaryPrompt);
            if (result && result.response) {
              setSummary(result.response);
            } else {
              setSummary('Could not generate summary.');
            }
          } catch (summaryError) {
            console.error('Error generating summary:', summaryError);
            setSummary('Failed to generate summary.');
          } finally {
            setSummarizing(false);
          }
        }

      } catch (error) {
        console.error('Error loading article content:', error);
        setContentError('Failed to load full article content');
        const fallbackContent = {
          content: article.description || 'No content available',
          title: article.title,
          image: article.image,
          extracted: false
        };
        setArticleContent(fallbackContent);
        
        // Still try to generate a summary from the description
        if (article.description && article.description.length > 20) {
          setSummarizing(true);
          try {
            const summaryPrompt = `Please provide a concise summary and analysis of the following news article:\n\n${article.title}\n\n${article.description}`;
            const result = await sendMessageToBackend('gemini-2.5-flash', summaryPrompt);
            if (result && result.response) {
              setSummary(result.response);
            } else {
              setSummary('Could not generate summary.');
            }
          } catch (summaryError) {
            console.error('Error generating summary:', summaryError);
            setSummary('Failed to generate summary.');
          } finally {
            setSummarizing(false);
          }
        }
      } finally {
        setLoadingContent(false);
      }
    };

    loadArticleContent();
  }, [article]);

  const displayContent = articleContent || {
    content: article.description || 'Loading...',
    title: article.title,
    image: article.image
  };

  const formatContent = (content) => {
    if (!content) return [];
    // Split content into paragraphs
    return content.split('\n\n').filter(p => p.trim());
  };

  const contentParagraphs = formatContent(displayContent.content);

  return (
    <ArticleDetailOverlay onClick={onClose}>
      <ArticleDetailContainer onClick={(e) => e.stopPropagation()}>
        <ArticleDetailContent>
            <DetailTitle>{displayContent.title || article.title}</DetailTitle>
            
            <ArticleMetadata>
              <AuthorSection>
                <AuthorAvatar>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="8" r="3"/>
                    <path d="M6.168 18.849a4 4 0 0 1 3.832-2.849h4a4 4 0 0 1 3.834 2.855"/>
                  </svg>
                </AuthorAvatar>
                <AuthorInfo>
                  <AuthorName>
                    {displayContent.author ? `By ${displayContent.author}` : `Source: ${article.source}`}
                  </AuthorName>
                  <ReadTime>
                    {displayContent.publishDate 
                      ? new Date(displayContent.publishDate).toLocaleDateString()
                      : new Date(article.pubDate).toLocaleDateString()}
                  </ReadTime>
                </AuthorInfo>
              </AuthorSection>
              
              <MetadataRight>
                <PublishTime>Published {new Date(article.pubDate).toLocaleString()}</PublishTime>
              </MetadataRight>
            </ArticleMetadata>

            <SourceTags>
              <SourceTag>{article.source}</SourceTag>
              <SourceTag>{article.category}</SourceTag>
              {articleContent?.extracted && <SourceTag style={{ backgroundColor: '#28a745' }}>Full Article</SourceTag>}
            </SourceTags>
            
            {(displayContent.image || article.image) && 
              <DetailImage
                src={displayContent.image || article.image}
                alt={displayContent.title || article.title}
                $size={article.size}
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.onerror = null; // Prevent infinite loop
                  
                  // Try multiple fallbacks
                  if (e.target.src.includes('pollinations.ai')) {
                    console.log('Trying LoremFlickr fallback...');
                    const words = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').filter(Boolean).slice(0, 3);
                    e.target.src = `https://loremflickr.com/800/600/${words.join(',')}`;
                  } else if (e.target.src.includes('loremflickr.com')) {
                    console.log('Trying Picsum fallback...');
                    e.target.src = `https://picsum.photos/seed/${encodeURIComponent(article.id || article.title)}/800/600`;
                  } else {
                    console.log('All fallbacks failed, hiding image');
                    e.target.style.display = 'none';
                  }
                }}
                onLoad={(e) => {
                  console.log('Image loaded successfully:', e.target.src);
                }}
              />
            }
            
            <DetailBody>
              {loadingContent ? (
                <LoadingContainer>
                  <LoadingSpinner />
                  <LoadingText>Loading article...</LoadingText>
                </LoadingContainer>
              ) : contentError ? (
                <>
                  <ErrorMessage style={{ textAlign: 'center', marginBottom: '20px' }}>{contentError}</ErrorMessage>
                  <p>{article.description}</p>
                </>
              ) : summarizing ? (
                <LoadingContainer>
                  <LoadingSpinner />
                  <LoadingText>Generating summary...</LoadingText>
                </LoadingContainer>
              ) : (
                summary.split('\n\n').map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: '18px' }}>{paragraph}</p>
                ))
              )}
              
              <p style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                  Read the original article on {article.source} →
                </a>
              </p>
            </DetailBody>
        </ArticleDetailContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
      </ArticleDetailContainer>
    </ArticleDetailOverlay>
  );
};

const NewsPage = ({ collapsed }) => {
  const [activeFilter, setActiveFilter] = useState('Top');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [savedArticles, setSavedArticles] = useState(() => {
    try {
      const saved = window.localStorage.getItem('savedNewsArticles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse saved articles from localStorage', e);
      return [];
    }
  });

  const loadArticles = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const categoryToFetch = activeFilter.toLowerCase();
      const fetchedArticles = await fetchArticlesByCategory(categoryToFetch, 20);
      setArticles(fetchedArticles);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading articles:', err);
      setError(err.message || 'Failed to load articles');
      setArticles([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [activeFilter]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadArticles(false); // Don't show loading spinner for auto-refresh
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [activeFilter]);

  useEffect(() => {
    try {
      window.localStorage.setItem('savedNewsArticles', JSON.stringify(savedArticles));
    } catch (e) {
      console.error('Failed to save articles to localStorage', e);
    }
  }, [savedArticles]);

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const handleSaveArticle = (e, articleId) => {
    e.stopPropagation();
    setSavedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleRetry = () => {
    loadArticles();
  };

  const handleRefresh = () => {
    loadArticles();
  };

  const displayArticles = activeFilter === 'Saved' 
    ? articles.filter(article => savedArticles.includes(article.id))
    : articles;

  return (
    <NewsContainer $collapsed={collapsed}>
      <Header>
        <Title>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          News
        </Title>
        <RefreshButton onClick={handleRefresh} disabled={loading} $loading={loading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </Header>

      <FilterBar>
        {filters.map(filter => (
          <FilterButton
            key={filter.name}
            $active={activeFilter === filter.name}
            onClick={() => setActiveFilter(filter.name)}
          >
            {filter.icon}
            {filter.name}
          </FilterButton>
        ))}
      </FilterBar>

      {loading && (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading fresh articles...</LoadingText>
        </LoadingContainer>
      )}

      {error && !loading && (
        <ErrorContainer>
          <ErrorMessage>Failed to load articles</ErrorMessage>
          <p>{error}</p>
          <RetryButton onClick={handleRetry}>Try Again</RetryButton>
        </ErrorContainer>
      )}

      {!loading && !error && displayArticles.length === 0 && (
        <EmptyStateContainer>
          <EmptyStateMessage>
            {activeFilter === 'Saved' 
              ? 'No saved articles yet. Click the bookmark icon to save articles.'
              : 'No articles available for this category.'}
          </EmptyStateMessage>
        </EmptyStateContainer>
      )}

      {!loading && !error && displayArticles.length > 0 && (
        <ArticlesGrid>
          {displayArticles.map(article => {
            const filter = filters.find(f => f.name.toLowerCase() === article.category);
            const isSaved = savedArticles.includes(article.id);
            return (
              <ArticleCard key={article.id} $size={article.size} onClick={() => handleArticleClick(article)}>
                {article.image && (
                  <ArticleImage
                    src={article.image}
                    alt={article.title}
                    $size={article.size}
                    onError={(e) => {
                      console.log('Image failed to load:', e.target.src);
                      e.target.onerror = null; // Prevent infinite loop
                      
                      // Try multiple fallbacks
                      if (e.target.src.includes('pollinations.ai')) {
                        console.log('Trying LoremFlickr fallback...');
                        const words = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').filter(Boolean).slice(0, 3);
                        e.target.src = `https://loremflickr.com/800/600/${words.join(',')}`;
                      } else if (e.target.src.includes('loremflickr.com')) {
                        console.log('Trying Picsum fallback...');
                        e.target.src = `https://picsum.photos/seed/${encodeURIComponent(article.id || article.title)}/800/600`;
                      } else {
                        console.log('All fallbacks failed, hiding image');
                        e.target.style.display = 'none';
                      }
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', e.target.src);
                    }}
                  />
                )}
                <ArticleContent $size={article.size}>
                  <ArticleTitle $size={article.size}>{article.title}</ArticleTitle>
                  {filter && (
                    <ArticleTag>
                      {filter.icon}
                      <span>{filter.name}</span>
                    </ArticleTag>
                  )}
                  <ArticleDescription $size={article.size}>{article.description}</ArticleDescription>
                  <ArticleFooter>
                    <ArticleSource>{article.source}</ArticleSource>
                    <BookmarkIcon onClick={(e) => handleSaveArticle(e, article.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                      </svg>
                    </BookmarkIcon>
                  </ArticleFooter>
                </ArticleContent>
              </ArticleCard>
            )
          })}
        </ArticlesGrid>
      )}

      {selectedArticle && (
        <ArticleDetailView article={selectedArticle} onClose={handleCloseArticle} />
      )}
    </NewsContainer>
  );
};

export default NewsPage; 