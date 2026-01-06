import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { fetchArticlesByCategory, fetchArticleContent } from '../services/rssService';
import { sendMessageToBackend } from '../services/aiService';
import { useTranslation } from '../contexts/TranslationContext';

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

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  letter-spacing: -0.01em;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${props => props.theme.hover || props.theme.inputBackground};
    border-color: ${props => props.theme.text}20;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.3s ease;
    ${props => props.$loading && css`
      animation: spin 1s linear infinite;
    `}
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================================================
// FILTER TABS
// ============================================================================

const FilterContainer = styled.nav`
  margin-bottom: 36px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => props.theme.border};
  }
`;

const FilterScroll = styled.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterTab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  color: ${props => props.$active
    ? props.theme.text
    : (props.theme.textSecondary || `${props.theme.text}60`)};
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 8px;
    right: 8px;
    height: 2px;
    background: ${props => props.theme.accentColor || props.theme.primary};
    border-radius: 2px;
    opacity: ${props => props.$active ? 1 : 0};
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: all 0.2s ease;
  }

  &:hover {
    color: ${props => props.theme.text};
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
  }

  svg {
    width: 16px;
    height: 16px;
    opacity: ${props => props.$active ? 0.9 : 0.5};
  }
`;

// ============================================================================
// ARTICLES GRID
// ============================================================================

const ArticlesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const FeaturedArticle = styled.article`
  grid-column: span 2;
  grid-row: span 2;

  @media (max-width: 1200px) {
    grid-column: span 2;
    grid-row: span 1;
  }

  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

// ============================================================================
// ARTICLE CARD
// ============================================================================

const CardContainer = styled.article`
  background: ${props => props.theme.sidebar};
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  border: 1px solid ${props => props.theme.border};
  animation: ${slideUp} 0.5s ease forwards;
  animation-delay: ${props => props.$delay || 0}ms;
  opacity: 0;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px ${props => props.theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)'};
    border-color: transparent;
  }
`;

const FeaturedCardContainer = styled(CardContainer)`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  min-height: 380px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
    min-height: 280px;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    min-height: auto;
  }
`;

const CardImageWrapper = styled.div`
  position: relative;
  overflow: hidden;
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};

  ${props => props.$featured ? css`
    height: 100%;
    min-height: 200px;
  ` : css`
    height: 180px;
    flex-shrink: 0;
  `}
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);

  ${CardContainer}:hover &,
  ${FeaturedCardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    ${props => props.theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 0%,
    ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 100%
  );

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.3;
  }
`;

const CardContent = styled.div`
  padding: ${props => props.$featured ? '28px' : '20px'};
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${props => props.theme.accentSurface || (props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')};
  color: ${props => props.theme.accentColor || props.theme.primary};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const SourceLabel = styled.span`
  font-size: 0.8125rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
`;

const CardTitle = styled.h3`
  font-size: ${props => props.$featured ? '1.5rem' : '1.0625rem'};
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.$featured ? 3 : 2};
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: ${props => props.$featured ? '1.25rem' : '1rem'};
  }
`;

const CardDescription = styled.p`
  font-size: 0.9375rem;
  line-height: 1.6;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.$featured ? 4 : 2};
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
`;

const TimeAgo = styled.span`
  font-size: 0.8125rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}50`};
`;

const BookmarkButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.$saved
    ? (props.theme.accentColor || props.theme.primary)
    : (props.theme.textSecondary || `${props.theme.text}50`)};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
    color: ${props => props.theme.accentColor || props.theme.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ============================================================================
// LOADING & EMPTY STATES
// ============================================================================

const SkeletonCard = styled.div`
  background: ${props => props.theme.sidebar};
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.border};
`;

const SkeletonImage = styled.div`
  height: 180px;
  background: linear-gradient(
    90deg,
    ${props => props.theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 0%,
    ${props => props.theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 50%,
    ${props => props.theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const SkeletonContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SkeletonLine = styled.div`
  height: ${props => props.$height || '14px'};
  width: ${props => props.$width || '100%'};
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  border-radius: 6px;
  animation: ${pulse} 1.5s infinite;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  svg {
    width: 64px;
    height: 64px;
    opacity: 0.3;
    margin-bottom: 24px;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 8px;
`;

const EmptyText = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  margin: 0;
  max-width: 320px;
`;

const ErrorState = styled(EmptyState)`
  svg {
    color: ${props => props.theme.error || '#EF4444'};
    opacity: 0.8;
  }
`;

const RetryButton = styled.button`
  margin-top: 20px;
  padding: 10px 24px;
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: ${props => props.theme.accentText || '#fff'};
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
  }
`;

// ============================================================================
// ARTICLE DETAIL OVERLAY
// ============================================================================

const DetailOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${props => props.theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)'};
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: ${fadeIn} 0.2s ease;
`;

const DetailPanel = styled.div`
  width: 100%;
  max-width: 720px;
  height: 100%;
  background: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  overflow-y: auto;
  animation: ${slideInFromRight} 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  position: relative;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const DetailHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: ${props => props.theme.sidebar};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const OpenExternalButton = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
  color: ${props => props.theme.text};
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const DetailImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
`;

const DetailContent = styled.div`
  padding: 32px 32px 48px;

  @media (max-width: 640px) {
    padding: 24px 20px 40px;
  }
`;

const DetailMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const DetailSource = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}70`};
`;

const DetailDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${props => props.theme.textSecondary || `${props.theme.text}40`};
`;

const DetailTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin: 0 0 24px;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const DetailBody = styled.div`
  font-size: 1.0625rem;
  line-height: 1.75;
  color: ${props => props.theme.textSecondary || `${props.theme.text}e0`};

  p {
    margin: 0 0 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const SummarySection = styled.div`
  margin-bottom: 32px;
  padding: 24px;
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
  border-radius: 12px;
  border-left: 3px solid ${props => props.theme.accentColor || props.theme.primary};
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.accentColor || props.theme.primary};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const SummaryText = styled.div`
  font-size: 1rem;
  line-height: 1.7;
  color: ${props => props.theme.text};

  p {
    margin: 0 0 12px;
    &:last-child { margin-bottom: 0; }
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  font-size: 0.9375rem;

  svg {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================================================
// FILTER OPTIONS DATA
// ============================================================================

const filterOptions = [
  {
    id: 'top',
    labelKey: 'news.filters.top',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  },
  {
    id: 'saved',
    labelKey: 'news.filters.saved',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    id: 'tech',
    labelKey: 'news.filters.tech',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )
  },
  {
    id: 'sports',
    labelKey: 'news.filters.sports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
      </svg>
    )
  },
  {
    id: 'finance',
    labelKey: 'news.filters.finance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    id: 'art',
    labelKey: 'news.filters.art',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" /><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" /><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" /><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
      </svg>
    )
  },
  {
    id: 'tv',
    labelKey: 'news.filters.tv',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
      </svg>
    )
  },
  {
    id: 'politics',
    labelKey: 'news.filters.politics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    )
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// ============================================================================
// ARTICLE CARD COMPONENT
// ============================================================================

const ArticleCard = ({ article, filter, isSaved, onSave, onClick, delay, featured }) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const Container = featured ? FeaturedCardContainer : CardContainer;

  return (
    <Container onClick={onClick} $delay={delay}>
      <CardImageWrapper $featured={featured}>
        {article.image && !imageError ? (
          <CardImage
            src={article.image}
            alt={article.title}
            onError={() => setImageError(true)}
          />
        ) : (
          <ImagePlaceholder>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </ImagePlaceholder>
        )}
      </CardImageWrapper>

      <CardContent $featured={featured}>
        <CardMeta>
          {filter && (
            <CategoryBadge>
              {filter.icon}
              {t(filter.labelKey)}
            </CategoryBadge>
          )}
          <SourceLabel>{article.source}</SourceLabel>
        </CardMeta>

        <CardTitle $featured={featured}>{article.title}</CardTitle>

        {article.description && (
          <CardDescription $featured={featured}>
            {article.description}
          </CardDescription>
        )}

        <CardFooter>
          <TimeAgo>{getTimeAgo(article.pubDate)}</TimeAgo>
          <BookmarkButton
            $saved={isSaved}
            onClick={(e) => {
              e.stopPropagation();
              onSave(article.id);
            }}
            aria-label={isSaved ? 'Remove from saved' : 'Save article'}
          >
            <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </BookmarkButton>
        </CardFooter>
      </CardContent>
    </Container>
  );
};

// ============================================================================
// ARTICLE DETAIL VIEW COMPONENT
// ============================================================================

const ArticleDetailView = ({ article, onClose }) => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setSummary('');

      try {
        const content = await fetchArticleContent(article.url, article.description);
        const textContent = content?.content || article.description;

        if (textContent && textContent.length > 20) {
          try {
            const prompt = `Please provide a concise, well-structured summary of the following news article. Focus on the key points and main takeaways:\n\n---\n\n${textContent}`;
            const result = await sendMessageToBackend('gemini-2.5-flash', prompt);
            if (result?.response) {
              setSummary(result.response);
            } else {
              setSummary(t('news.summary.couldNotGenerate'));
            }
          } catch (err) {
            console.error('Summary generation failed:', err);
            setSummary(t('news.summary.failed'));
          }
        }
      } catch (err) {
        console.error('Content fetch failed:', err);
        // Fall back to description-based summary
        if (article.description && article.description.length > 20) {
          try {
            const prompt = `Please provide a concise summary and analysis of: ${article.title}\n\n${article.description}`;
            const result = await sendMessageToBackend('gemini-2.5-flash', prompt);
            if (result?.response) {
              setSummary(result.response);
            }
          } catch (summaryErr) {
            console.error('Fallback summary failed:', summaryErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadContent();

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [article, t, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const filter = filterOptions.find(f => f.id === article.category);

  return (
    <DetailOverlay onClick={handleOverlayClick}>
      <DetailPanel ref={panelRef}>
        <DetailHeader>
          <BackButton onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('news.detail.back', 'Back')}
          </BackButton>

          <OpenExternalButton href={article.url} target="_blank" rel="noopener noreferrer">
            {t('news.detail.openOriginal', 'Open original')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </OpenExternalButton>
        </DetailHeader>

        {article.image && !imageError && (
          <DetailImage
            src={article.image}
            alt={article.title}
            onError={() => setImageError(true)}
          />
        )}

        <DetailContent>
          <DetailMeta>
            {filter && <CategoryBadge>{filter.icon}{t(filter.labelKey)}</CategoryBadge>}
            <DetailSource>{article.source}</DetailSource>
            <DetailDot />
            <DetailSource>{new Date(article.pubDate).toLocaleDateString()}</DetailSource>
          </DetailMeta>

          <DetailTitle>{article.title}</DetailTitle>

          {loading ? (
            <LoadingIndicator>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              {t('news.generatingSummary', 'Generating summary...')}
            </LoadingIndicator>
          ) : summary ? (
            <SummarySection>
              <SummaryLabel>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {t('news.summary.label', 'AI Summary')}
              </SummaryLabel>
              <SummaryText>
                {summary.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </SummaryText>
            </SummarySection>
          ) : null}

          {article.description && (
            <DetailBody>
              <p>{article.description}</p>
            </DetailBody>
          )}
        </DetailContent>
      </DetailPanel>
    </DetailOverlay>
  );
};

// ============================================================================
// MAIN NEWSPAGE COMPONENT
// ============================================================================

const NewsPage = ({ collapsed }) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('top');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedArticles, setSavedArticles] = useState(() => {
    try {
      const saved = window.localStorage.getItem('savedNewsArticles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadArticles = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const fetched = await fetchArticlesByCategory(activeFilter, 20);
      setArticles(fetched);
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError(err.message || t('news.error.fetch'));
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
    const interval = setInterval(() => loadArticles(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeFilter]);

  // Persist saved articles
  useEffect(() => {
    try {
      window.localStorage.setItem('savedNewsArticles', JSON.stringify(savedArticles));
    } catch (err) {
      console.error('Failed to save articles:', err);
    }
  }, [savedArticles]);

  const handleSaveArticle = (articleId) => {
    setSavedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const displayArticles = activeFilter === 'saved'
    ? articles.filter(article => savedArticles.includes(article.id))
    : articles;

  return (
    <PageContainer $collapsed={collapsed}>
      <ContentWrapper>
        <Header>
          <TitleSection>
            <PageTitle>{t('news.title', 'News')}</PageTitle>
            <Subtitle>{t('news.subtitle', 'Stay informed with the latest stories')}</Subtitle>
          </TitleSection>

          <RefreshButton onClick={() => loadArticles()} disabled={loading} $loading={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" />
            </svg>
            {loading ? t('news.refreshing', 'Refreshing...') : t('news.refresh', 'Refresh')}
          </RefreshButton>
        </Header>

        <FilterContainer>
          <FilterScroll>
            {filterOptions.map(filter => (
              <FilterTab
                key={filter.id}
                $active={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.icon}
                {t(filter.labelKey)}
              </FilterTab>
            ))}
          </FilterScroll>
        </FilterContainer>

        {loading ? (
          <ArticlesGrid>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i}>
                <SkeletonImage />
                <SkeletonContent>
                  <SkeletonLine $width="30%" $height="12px" />
                  <SkeletonLine $width="90%" $height="18px" />
                  <SkeletonLine $width="70%" $height="18px" />
                  <SkeletonLine $width="100%" />
                  <SkeletonLine $width="80%" />
                </SkeletonContent>
              </SkeletonCard>
            ))}
          </ArticlesGrid>
        ) : error ? (
          <ErrorState>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <EmptyTitle>{t('news.error.title', 'Failed to load news')}</EmptyTitle>
            <EmptyText>{error}</EmptyText>
            <RetryButton onClick={() => loadArticles()}>
              {t('news.error.retry', 'Try again')}
            </RetryButton>
          </ErrorState>
        ) : displayArticles.length === 0 ? (
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
            <EmptyTitle>
              {activeFilter === 'saved'
                ? t('news.empty.savedTitle', 'No saved articles')
                : t('news.empty.categoryTitle', 'No articles found')}
            </EmptyTitle>
            <EmptyText>
              {activeFilter === 'saved'
                ? t('news.empty.saved', 'Articles you save will appear here')
                : t('news.empty.category', 'Try a different category or refresh')}
            </EmptyText>
          </EmptyState>
        ) : (
          <ArticlesGrid>
            {displayArticles.map((article, index) => {
              const filter = filterOptions.find(f => f.id === article.category);
              const isSaved = savedArticles.includes(article.id);
              const isFeatured = index === 0 && article.size === 'featured';

              if (isFeatured) {
                return (
                  <FeaturedArticle key={article.id}>
                    <ArticleCard
                      article={article}
                      filter={filter}
                      isSaved={isSaved}
                      onSave={handleSaveArticle}
                      onClick={() => setSelectedArticle(article)}
                      delay={index * 50}
                      featured
                    />
                  </FeaturedArticle>
                );
              }

              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  filter={filter}
                  isSaved={isSaved}
                  onSave={handleSaveArticle}
                  onClick={() => setSelectedArticle(article)}
                  delay={index * 50}
                />
              );
            })}
          </ArticlesGrid>
        )}
      </ContentWrapper>

      {selectedArticle && (
        <ArticleDetailView
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </PageContainer>
  );
};

export default NewsPage;
