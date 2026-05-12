import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSharedModel } from '../services/shareService';
import { DEFAULT_CUSTOM_BASE_MODEL_ID, getPreferredModelId } from '../config/modelConfig';
import { fetchModelsFromBackend } from '../services/aiService';

const Page = styled.main`
  min-height: 100vh;
  background: ${props => props.theme.chat || props.theme.background};
  color: ${props => props.theme.text};
`;

const Shell = styled.div`
  width: min(820px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 36px 0 56px;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 20px;
  margin-bottom: 26px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Logo = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  opacity: 0.8;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 16px;
  line-height: 1.25;
  font-weight: 500;
  opacity: 0.8;
`;

const Card = styled.section`
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  background: ${props => props.theme.sidebar};
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeroRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
`;

const Avatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const HeroInfo = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ModelName = styled.h2`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  font-size: 13px;
  color: ${props => props.theme.text};
  opacity: 0.62;
`;

const Description = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: ${props => props.theme.text};
  opacity: 0.85;
  overflow-wrap: anywhere;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${props => props.theme.text};
  opacity: 0.6;
`;

const BaseModelPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 20px;
  background: ${props => props.theme.inputBackground || `${props.theme.primary}10`};
  border: 1px solid ${props => props.theme.border};
  font-size: 13px;
  color: ${props => props.theme.text};
  max-width: 100%;
  overflow: hidden;

  svg { width: 14px; height: 14px; opacity: 0.7; flex-shrink: 0; }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const PromptBlock = styled.pre`
  margin: 0;
  padding: 16px;
  border-radius: 12px;
  background: ${props => props.theme.inputBackground || 'rgba(0,0,0,0.04)'};
  border: 1px solid ${props => props.theme.border};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: ${props => props.theme.text};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 360px;
  overflow-y: auto;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid ${props => props.theme.border};
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: ${props => props.theme.accentText || '#fff'};
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 18px ${props => props.theme.accentColor || props.theme.primary}40;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  svg { width: 16px; height: 16px; }
`;

const SecondaryLink = styled.a`
  font-size: 13px;
  color: ${props => props.theme.text};
  opacity: 0.65;
  text-decoration: none;

  &:hover { opacity: 1; text-decoration: underline; }
`;

const StatusText = styled.div`
  font-size: 13px;
  color: ${props => props.theme.text};
  opacity: 0.7;
`;

const CenterState = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: ${props => props.theme.text};
  opacity: 0.72;
`;

const generateLocalModelId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
};

const readCustomModels = () => {
  try {
    const raw = localStorage.getItem('customModels');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read customModels from localStorage:', error);
    return [];
  }
};

const resolveBaseModel = (originalBaseModelId, availableModels) => {
  if (!Array.isArray(availableModels) || availableModels.length === 0) {
    return originalBaseModelId || DEFAULT_CUSTOM_BASE_MODEL_ID;
  }
  const hasOriginal = availableModels.some(model => model?.id === originalBaseModelId);
  if (hasOriginal) return originalBaseModelId;
  return getPreferredModelId(availableModels, DEFAULT_CUSTOM_BASE_MODEL_ID);
};

const SharedModelView = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableBaseModels, setAvailableBaseModels] = useState([]);
  const [importStatus, setImportStatus] = useState('idle');

  const shareId = useMemo(() => {
    if (params.shareId) return params.shareId;
    return new URLSearchParams(window.location.search).get('id');
  }, [params.shareId]);

  useEffect(() => {
    let cancelled = false;

    const loadShare = async () => {
      if (!shareId) {
        setError('No shared model id was provided.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchSharedModel(shareId);
        if (!cancelled) setModel(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Could not load this shared model.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadShare();
    return () => { cancelled = true; };
  }, [shareId]);

  useEffect(() => {
    let cancelled = false;

    const loadBaseModels = async () => {
      try {
        const backendModels = await fetchModelsFromBackend();
        if (!cancelled && Array.isArray(backendModels)) {
          setAvailableBaseModels(backendModels);
        }
      } catch (loadError) {
        console.warn('Could not load base models for shared model preview:', loadError);
      }
    };

    loadBaseModels();
    return () => { cancelled = true; };
  }, []);

  const resolvedBaseModelId = useMemo(() => {
    if (!model) return null;
    return resolveBaseModel(model.baseModel, availableBaseModels);
  }, [model, availableBaseModels]);

  const baseModelDisplay = useMemo(() => {
    if (!model) return '';
    const match = availableBaseModels.find(m => m.id === model.baseModel);
    if (match) {
      return match.provider ? `${match.name} (${match.provider})` : match.name;
    }
    return model.baseModel;
  }, [model, availableBaseModels]);

  const handleImport = () => {
    if (!model) return;
    setImportStatus('importing');

    try {
      const existing = readCustomModels();
      const importedModel = {
        id: generateLocalModelId(),
        name: model.name,
        description: model.description || '',
        avatar: model.avatar || '🤖',
        avatarImage: model.avatarImage || null,
        avatarColor: model.avatarColor || '',
        systemPrompt: model.systemPrompt || '',
        baseModel: resolvedBaseModelId || model.baseModel || DEFAULT_CUSTOM_BASE_MODEL_ID,
        author: model.author || 'Sculptor user',
        enabled: false,
        importedFromShareId: shareId
      };

      const next = [...existing, importedModel];
      localStorage.setItem('customModels', JSON.stringify(next));

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'customModels',
        newValue: JSON.stringify(next),
        url: window.location.href
      }));

      setImportStatus('imported');
      setTimeout(() => navigate('/workspace'), 600);
    } catch (importError) {
      console.error('Failed to import shared model:', importError);
      setImportStatus('error');
    }
  };

  if (loading) {
    return <CenterState>Loading shared model...</CenterState>;
  }

  if (error) {
    return <CenterState>{error}</CenterState>;
  }

  if (!model) {
    return <CenterState>Shared model unavailable.</CenterState>;
  }

  const fallbackUsed = model.baseModel
    && resolvedBaseModelId
    && resolvedBaseModelId !== model.baseModel;

  return (
    <Page>
      <Shell>
        <Header>
          <Logo src="/images/sculptor.svg" alt="" />
          <HeaderTitle>Shared from Sculptor</HeaderTitle>
        </Header>

        <Card>
          <HeroRow>
            <Avatar>
              {model.avatarImage ? (
                <img src={model.avatarImage} alt={model.name} />
              ) : (
                model.avatar || (model.name ? model.name.charAt(0).toUpperCase() : '🤖')
              )}
            </Avatar>
            <HeroInfo>
              <ModelName>{model.name}</ModelName>
              <Meta>
                {model.author ? `By ${model.author} · ` : ''}Workspace model
              </Meta>
            </HeroInfo>
          </HeroRow>

          {model.description && (
            <Description>{model.description}</Description>
          )}

          <div>
            <SectionTitle>Base model</SectionTitle>
            <BaseModelPill>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span>{baseModelDisplay || 'Unknown'}</span>
            </BaseModelPill>
            {fallbackUsed && (
              <Meta style={{ marginTop: 8 }}>
                Your workspace doesn't have "{model.baseModel}". It'll be imported with a default base model — you can change it after.
              </Meta>
            )}
          </div>

          <div>
            <SectionTitle>System prompt</SectionTitle>
            <PromptBlock>{model.systemPrompt}</PromptBlock>
          </div>

          <ActionRow>
            <PrimaryButton
              type="button"
              onClick={handleImport}
              disabled={importStatus === 'importing' || importStatus === 'imported'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {importStatus === 'imported' ? 'Added to your workspace' : 'Add to my workspace'}
            </PrimaryButton>
            <SecondaryLink href="/workspace">Open Workspace</SecondaryLink>
            {importStatus === 'error' && (
              <StatusText>Could not save to your workspace. Check browser storage.</StatusText>
            )}
          </ActionRow>
        </Card>
      </Shell>
    </Page>
  );
};

export default SharedModelView;
