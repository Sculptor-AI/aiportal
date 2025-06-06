import React, { useState } from 'react';
import styled, { withTheme } from 'styled-components';

const placeholderArticles = [
  {
    id: 1,
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'The Future of AI in Software Development',
    description: 'AI is revolutionizing the way we build software, from automated coding to intelligent testing.',
    source: 'techanalyst.io',
  },
  {
    id: 2,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1546866751-ecceca95c979?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Titans Clinch Victory in a Nail-Biting Finish',
    description: 'A last-minute touchdown secures the championship for the Titans in a dramatic showdown.',
    source: 'sportsdaily.com',
  },
  {
    id: 3,
    category: 'finance',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Market Trends: What to Expect in the Next Quarter',
    description: 'Experts weigh in on the latest market fluctuations and predict upcoming financial trends.',
    source: 'financeinsights.net',
  },
  {
    id: 4,
    category: 'art',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'A Renaissance of Digital Art and NFTs',
    description: 'Exploring the vibrant and often controversial world of digital art and non-fungible tokens.',
    source: 'culturehub.org',
  },
  {
    id: 5,
    category: 'tv',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'The Most Anticipated TV Shows of the Year',
    description: 'A look at the new and returning series that have everyone talking.',
    source: 'screenrant.com',
  },
  {
    id: 6,
    category: 'politics',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Global Leaders Summit Addresses Climate Change',
    description: 'Nations come together to discuss new policies and commitments to combat the climate crisis.',
    source: 'worldnews.gov',
  },
  {
    id: 7,
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=2125&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Breakthrough in Quantum Computing Announced',
    description: 'Scientists achieve a new milestone in quantum supremacy, promising to reshape technology.',
    source: 'innovatech.com',
  },
  {
    id: 8,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'The Underdog Story: A Season to Remember',
    description: 'Follow the journey of a team that defied all odds to become champions.',
    source: 'espn.com',
  },
];

const NewsContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
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
  background-color: ${props => props.active ? 'rgba(0,0,0,0.1)' : 'transparent'};
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
`;

const ArticleCard = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ArticleImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const ArticleContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const ArticleTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 12px;

  svg {
    width: 14px;
    height: 14px;
    opacity: 0.7;
  }
`;

const ArticleTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 10px 0;
`;

const ArticleDescription = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.textSecondary};
  line-height: 1.5;
  margin: 0 0 15px 0;
  flex-grow: 1;
`;

const ArticleFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ArticleSource = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
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
  font-size: 2.8rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 25px;
`;

const DetailBody = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  color: ${props => props.theme.name === 'light' ? '#343a40' : '#e0e0e0'};
  
  p {
    margin-bottom: 20px;
  }
`;

const DetailImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  margin-top: 30px;
`;

const ArticleDetailView = ({ article, onClose }) => {
  return (
    <ArticleDetailOverlay onClick={onClose}>
      <ArticleDetailContainer onClick={(e) => e.stopPropagation()}>
        <ArticleDetailContent>
            <DetailTitle>{article.title}</DetailTitle>
            <DetailBody>
              <p>{article.description}</p>
              <p>This is placeholder content to simulate a longer article. In a real application, the full text of the news story would be displayed here, providing readers with in-depth information and analysis. The layout supports multiple paragraphs and other text formatting.</p>
              <p>Further details and context would follow, allowing for a comprehensive reading experience. The modal view ensures that the user stays within the application context while focusing on the selected content.</p>
            </DetailBody>
            <DetailImage src={article.image} alt={article.title} />
        </ArticleDetailContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
      </ArticleDetailContainer>
    </ArticleDetailOverlay>
  );
};

const filters = [
    {
      name: 'Top',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
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

const NewsPage = () => {
  const [activeFilter, setActiveFilter] = useState('Top');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  return (
    <NewsContainer>
      <Header>
        <Title>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          News
        </Title>
      </Header>

      <FilterBar>
        {filters.map(filter => (
          <FilterButton
            key={filter.name}
            active={activeFilter === filter.name}
            onClick={() => setActiveFilter(filter.name)}
          >
            {filter.icon}
            {filter.name}
          </FilterButton>
        ))}
      </FilterBar>

      <ArticlesGrid>
        {placeholderArticles
          .filter(article => activeFilter === 'Top' || article.category === activeFilter.toLowerCase())
          .map(article => {
            const filter = filters.find(f => f.name.toLowerCase() === article.category);
            return (
              <ArticleCard key={article.id} onClick={() => handleArticleClick(article)}>
                <ArticleImage src={article.image} alt={article.title} />
                <ArticleContent>
                  <ArticleTitle>{article.title}</ArticleTitle>
                  {filter && (
                    <ArticleTag>
                      {filter.icon}
                      <span>{filter.name}</span>
                    </ArticleTag>
                  )}
                  <ArticleDescription>{article.description}</ArticleDescription>
                  <ArticleFooter>
                    <ArticleSource>{article.source}</ArticleSource>
                    <BookmarkIcon>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </BookmarkIcon>
                  </ArticleFooter>
                </ArticleContent>
              </ArticleCard>
            )
          })}
      </ArticlesGrid>

      {selectedArticle && (
        <ArticleDetailView article={selectedArticle} onClose={handleCloseArticle} />
      )}
    </NewsContainer>
  );
};

export default NewsPage; 