import React, { useRef, useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import {
  CUSTOM_THEME_FIELDS,
  BUILTIN_BACKGROUND_IMAGES,
  CUSTOM_THEME_PRESETS,
  buildCustomTheme,
  hydrateFromPreset,
} from '../styles/customTheme';

/**
 * CustomThemeEditor
 *
 * A compact, three-panel editor that replaces the old three-input stub for
 * the "Custom" theme. Layout:
 *
 *   ┌─────────────────┬────────────────────────────────────┐
 *   │   Live preview  │  Presets (start from a base theme) │
 *   │   (mock app)    │─────────────────────────────────────│
 *   │                 │  Tabs: Colors · Background         │
 *   │                 │  <field grid / image controls>     │
 *   └─────────────────┴────────────────────────────────────┘
 *
 * The preview panel is a miniature of the real app chrome (sidebar + chat
 * with two bubbles + input) rendered through `<ThemeProvider>` using the
 * theme produced by the current authoring state, so every change here
 * renders exactly the same way in the real app.
 */
const CustomThemeEditor = ({ value, onChange }) => {
  const state = value || hydrateFromPreset('light');
  const [activeTab, setActiveTab] = useState('colors');
  const fileInputRef = useRef(null);

  const previewTheme = buildCustomTheme(state);

  const patch = (next) => {
    onChange({ ...state, ...next });
  };

  const setField = (key, v) => patch({ [key]: v });

  const applyPreset = (presetId) => {
    const hydrated = hydrateFromPreset(presetId);
    // Preserve any uploaded image + its opacity; swap every coloured token.
    onChange({
      ...hydrated,
      backgroundImage: state.backgroundImage,
      backgroundImageSource: state.backgroundImageSource,
      backgroundImageOpacity: state.backgroundImageOpacity,
    });
  };

  const pickBuiltinImage = (img) => {
    patch({
      backgroundImage: img.url,
      backgroundImageSource: img.id,
    });
  };

  const clearImage = () => {
    patch({ backgroundImage: null, backgroundImageSource: 'none' });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    // ~4MB upper bound to keep localStorage sane.
    if (file.size > 4 * 1024 * 1024) {
      alert('Please choose an image smaller than 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch({
        backgroundImage: reader.result,
        backgroundImageSource: 'uploaded',
      });
    };
    reader.readAsDataURL(file);
  };

  const groupedFields = groupFields(CUSTOM_THEME_FIELDS);

  return (
    <EditorShell>
      <PreviewColumn>
        <ThemeProvider theme={previewTheme}>
          <PreviewCanvas $hasImage={!!state.backgroundImage}>
            {state.backgroundImage && <PreviewImage $src={state.backgroundImage} />}
            <PreviewVeil />
            <PreviewSidebar>
              <PreviewSidebarRow $muted>New chat</PreviewSidebarRow>
              <PreviewSidebarRow $active>Welcome</PreviewSidebarRow>
              <PreviewSidebarRow>Design notes</PreviewSidebarRow>
              <PreviewSidebarRow>Project brief</PreviewSidebarRow>
            </PreviewSidebar>
            <PreviewMain>
              <PreviewAiBubble>Hi! How can I help today?</PreviewAiBubble>
              <PreviewUserBubble>Show me a preview of this theme.</PreviewUserBubble>
              <PreviewAiBubble>
                This is what your chat surface will look like.
              </PreviewAiBubble>
              <PreviewInput>
                <span>Message…</span>
                <PreviewSendButton>Send</PreviewSendButton>
              </PreviewInput>
            </PreviewMain>
          </PreviewCanvas>
        </ThemeProvider>
        <PreviewLabel>Live preview</PreviewLabel>
      </PreviewColumn>

      <ControlsColumn>
        <PresetSection>
          <SmallLabel>Start from</SmallLabel>
          <PresetGrid>
            {CUSTOM_THEME_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                $active={state.baseTheme === preset.id}
              >
                <PresetSwatch $preset={preset.id} />
                <span>{preset.label}</span>
              </PresetButton>
            ))}
          </PresetGrid>
        </PresetSection>

        <Tabs>
          <TabButton
            type="button"
            $active={activeTab === 'colors'}
            onClick={() => setActiveTab('colors')}
          >
            Colors
          </TabButton>
          <TabButton
            type="button"
            $active={activeTab === 'background'}
            onClick={() => setActiveTab('background')}
          >
            Background
          </TabButton>
          <TabButton
            type="button"
            $active={activeTab === 'mode'}
            onClick={() => setActiveTab('mode')}
          >
            Mode
          </TabButton>
        </Tabs>

        {activeTab === 'colors' && (
          <FieldScroll>
            {Object.entries(groupedFields).map(([group, fields]) => (
              <FieldGroup key={group}>
                <GroupTitle>{groupLabel(group)}</GroupTitle>
                <FieldGrid>
                  {fields.map((field) => (
                    <ColorField
                      key={field.key}
                      label={field.label}
                      value={state[field.key] || '#000000'}
                      onChange={(v) => setField(field.key, v)}
                    />
                  ))}
                </FieldGrid>
              </FieldGroup>
            ))}
          </FieldScroll>
        )}

        {activeTab === 'background' && (
          <FieldScroll>
            <FieldGroup>
              <GroupTitle>Image</GroupTitle>
              <GalleryGrid>
                {BUILTIN_BACKGROUND_IMAGES.map((img) => (
                  <GalleryTile
                    key={img.id}
                    type="button"
                    onClick={() => (img.url ? pickBuiltinImage(img) : clearImage())}
                    $active={state.backgroundImageSource === img.id}
                    $src={img.url}
                  >
                    {!img.url && <span>None</span>}
                    <GalleryTileLabel>{img.label}</GalleryTileLabel>
                  </GalleryTile>
                ))}
                <GalleryTile
                  as="label"
                  htmlFor="custom-theme-image-upload"
                  $active={state.backgroundImageSource === 'uploaded'}
                  $src={state.backgroundImageSource === 'uploaded' ? state.backgroundImage : null}
                >
                  {!state.backgroundImage || state.backgroundImageSource !== 'uploaded' ? (
                    <UploadPrompt>
                      <UploadIcon />
                      <span>Upload</span>
                    </UploadPrompt>
                  ) : null}
                  <GalleryTileLabel>Your image</GalleryTileLabel>
                </GalleryTile>
                <input
                  id="custom-theme-image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </GalleryGrid>
              <HelperText>
                Photos shine when you also lower the colour veil below. Uploads are
                stored locally in your browser.
              </HelperText>
            </FieldGroup>

            <FieldGroup>
              <GroupTitle>Gradient</GroupTitle>
              <FieldGrid>
                <ColorField
                  label="From"
                  value={state.background || '#000000'}
                  onChange={(v) => setField('background', v)}
                />
                <ColorField
                  label="To (optional)"
                  value={state.backgroundTo || ''}
                  onChange={(v) => setField('backgroundTo', v)}
                  allowEmpty
                />
              </FieldGrid>
              <SliderRow>
                <SliderLabel>Angle</SliderLabel>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={state.backgroundAngle ?? 160}
                  onChange={(e) => setField('backgroundAngle', Number(e.target.value))}
                />
                <SliderValue>{state.backgroundAngle ?? 160}°</SliderValue>
              </SliderRow>
              {state.backgroundImage && (
                <SliderRow>
                  <SliderLabel>Veil opacity</SliderLabel>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.backgroundImageOpacity ?? 0.35}
                    onChange={(e) => setField('backgroundImageOpacity', Number(e.target.value))}
                  />
                  <SliderValue>
                    {Math.round((state.backgroundImageOpacity ?? 0.35) * 100)}%
                  </SliderValue>
                </SliderRow>
              )}
            </FieldGroup>
          </FieldScroll>
        )}

        {activeTab === 'mode' && (
          <FieldScroll>
            <FieldGroup>
              <GroupTitle>Appearance mode</GroupTitle>
              <HelperText>
                Dark mode tells the rest of the app to use light text colours
                and glass tints. Flip this if your background is very dark or
                very light.
              </HelperText>
              <ModeRow>
                <ModeChoice
                  type="button"
                  $active={!state.isDark}
                  onClick={() => setField('isDark', false)}
                >
                  <ModeChip $mode="light" />
                  Light mode
                </ModeChoice>
                <ModeChoice
                  type="button"
                  $active={!!state.isDark}
                  onClick={() => setField('isDark', true)}
                >
                  <ModeChip $mode="dark" />
                  Dark mode
                </ModeChoice>
              </ModeRow>
            </FieldGroup>
            <FieldGroup>
              <GroupTitle>Reset</GroupTitle>
              <ResetButton type="button" onClick={() => applyPreset(state.baseTheme || 'light')}>
                Reset all colours to {CUSTOM_THEME_PRESETS.find((p) => p.id === (state.baseTheme || 'light'))?.label || 'base'}
              </ResetButton>
            </FieldGroup>
          </FieldScroll>
        )}
      </ControlsColumn>
    </EditorShell>
  );
};

export default CustomThemeEditor;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ColorField = ({ label, value, onChange, allowEmpty }) => {
  const [text, setText] = useState(value || '');
  React.useEffect(() => {
    setText(value || '');
  }, [value]);

  return (
    <ColorFieldRow>
      <ColorFieldLabel>{label}</ColorFieldLabel>
      <ColorFieldControls>
        <ColorSwatch>
          <input
            type="color"
            value={/^#([0-9a-f]{6})$/i.test(value || '') ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
          <ColorSwatchVisual style={{ background: value || 'transparent' }} />
        </ColorSwatch>
        <HexInput
          type="text"
          value={text}
          placeholder={allowEmpty ? '(none)' : '#RRGGBB'}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const v = text.trim();
            if (!v && allowEmpty) {
              onChange('');
              return;
            }
            if (/^#([0-9a-f]{3,8})$/i.test(v)) onChange(v);
            else setText(value || '');
          }}
        />
      </ColorFieldControls>
    </ColorFieldRow>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupFields(fields) {
  return fields.reduce((acc, field) => {
    const group = field.group || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});
}

function groupLabel(key) {
  switch (key) {
    case 'surfaces':
      return 'Surfaces';
    case 'typography':
      return 'Text';
    case 'brand':
      return 'Brand';
    case 'chat':
      return 'Messages';
    default:
      return key;
  }
}

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const EditorShell = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 380px) 1fr;
  gap: 20px;
  margin-top: 8px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PreviewLabel = styled.div`
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.text}88;
  padding-left: 4px;
`;

const PreviewCanvas = styled.div`
  position: relative;
  height: 360px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.border};
  background-color: ${(p) => p.theme.background};
  display: grid;
  grid-template-columns: 110px 1fr;
  isolation: isolate;
`;

const PreviewImage = styled.div`
  position: absolute;
  inset: 0;
  background-image: url(${(p) => p.$src});
  background-size: cover;
  background-position: center;
  z-index: 0;
`;

const PreviewVeil = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) => p.theme.background};
  z-index: 1;
  pointer-events: none;
`;

const PreviewSidebar = styled.div`
  z-index: 2;
  background: ${(p) => p.theme.sidebar};
  border-right: 1px solid ${(p) => p.theme.border};
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 8px;
  backdrop-filter: ${(p) => p.theme.glassEffect};
  -webkit-backdrop-filter: ${(p) => p.theme.glassEffect};
`;

const PreviewSidebarRow = styled.div`
  color: ${(p) => (p.$muted ? `${p.theme.textSecondary}` : p.theme.text)};
  background: ${(p) => (p.$active ? p.theme.accentSurface : 'transparent')};
  border-left: 3px solid ${(p) => (p.$active ? p.theme.accentColor : 'transparent')};
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PreviewMain = styled.div`
  z-index: 2;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  background: ${(p) => p.theme.chat};
`;

const PreviewAiBubble = styled.div`
  align-self: flex-start;
  background: ${(p) => p.theme.messageAi};
  color: ${(p) => p.theme.text};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 14px 14px 14px 4px;
  padding: 8px 12px;
  font-size: 0.78rem;
  max-width: 85%;
`;

const PreviewUserBubble = styled.div`
  align-self: flex-end;
  background: ${(p) => p.theme.messageUser};
  color: ${(p) => p.theme.text};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 14px 14px 4px 14px;
  padding: 8px 12px;
  font-size: 0.78rem;
  max-width: 85%;
`;

const PreviewInput = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: ${(p) => p.theme.inputBackground};
  border: 1px solid ${(p) => p.theme.border};
  color: ${(p) => p.theme.textSecondary};
  font-size: 0.78rem;
`;

const PreviewSendButton = styled.div`
  background: ${(p) => p.theme.accentBackground};
  color: ${(p) => p.theme.accentText};
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
`;

const ControlsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

const PresetSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SmallLabel = styled.div`
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.text}88;
`;

const PresetGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const PresetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? p.theme.accentColor : p.theme.border)};
  background: ${(p) => (p.$active ? p.theme.accentSurface : p.theme.cardBackground || p.theme.sidebar)};
  color: ${(p) => p.theme.text};
  cursor: pointer;
  font-size: 0.85rem;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${(p) => p.theme.accentColor};
  }
`;

const PresetSwatch = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: ${(p) => {
    switch (p.$preset) {
      case 'dark':
        return 'linear-gradient(135deg, #141414 0%, #1a1a1c 100%)';
      case 'oled':
        return '#000000';
      case 'ocean':
        return 'linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%)';
      case 'forest':
        return 'linear-gradient(135deg, #14281a 0%, #9ccc65 100%)';
      case 'sunset':
        return 'linear-gradient(135deg, #2a0d1a 0%, #ff7a59 100%)';
      case 'sunrise':
        return 'linear-gradient(135deg, #f4c987 0%, #d48940 100%)';
      case 'lakeside':
        return 'linear-gradient(135deg, #2a0e16 0%, #c84860 100%)';
      case 'light':
      default:
        return 'linear-gradient(135deg, #f5f5f7 0%, #eeeff2 100%)';
    }
  }};
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 1px solid ${(p) => p.theme.border};
`;

const TabButton = styled.button`
  border: none;
  background: transparent;
  padding: 8px 14px;
  font-size: 0.9rem;
  cursor: pointer;
  color: ${(p) => (p.$active ? p.theme.text : `${p.theme.text}99`)};
  border-bottom: 2px solid ${(p) => (p.$active ? p.theme.accentColor : 'transparent')};
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  margin-bottom: -1px;

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;

const FieldScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 6px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.border};
    border-radius: 999px;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GroupTitle = styled.div`
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.text}88;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 8px;
`;

const ColorFieldRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: ${(p) => p.theme.cardBackground || p.theme.sidebar};
  gap: 10px;
`;

const ColorFieldLabel = styled.span`
  font-size: 0.85rem;
  color: ${(p) => p.theme.text};
`;

const ColorFieldControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ColorSwatch = styled.label`
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.border};
  cursor: pointer;

  input[type='color'] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
`;

const ColorSwatchVisual = styled.span`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, #d0d0d0 25%, transparent 25%, transparent 75%, #d0d0d0 75%),
    linear-gradient(45deg, #d0d0d0 25%, transparent 25%, transparent 75%, #d0d0d0 75%);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
`;

const HexInput = styled.input`
  width: 88px;
  padding: 6px 8px;
  font-size: 0.8rem;
  font-family: 'SF Mono', 'Menlo', monospace;
  border-radius: 6px;
  border: 1px solid ${(p) => p.theme.border};
  background: ${(p) => p.theme.inputBackground};
  color: ${(p) => p.theme.text};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.accentColor};
  }
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
`;

const GalleryTile = styled.button`
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? p.theme.accentColor : p.theme.border)};
  background: ${(p) => (p.$src ? `url(${p.$src})` : p.theme.cardBackground || p.theme.sidebar)};
  background-size: cover;
  background-position: center;
  cursor: pointer;
  overflow: hidden;
  color: ${(p) => p.theme.textSecondary};
  font-size: 0.85rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s;

  &:hover {
    border-color: ${(p) => p.theme.accentColor};
  }
`;

const GalleryTileLabel = styled.span`
  position: absolute;
  bottom: 4px;
  left: 6px;
  right: 6px;
  font-size: 0.7rem;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  text-align: left;
`;

const UploadPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: ${(p) => p.theme.text};
  font-weight: 500;
`;

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const HelperText = styled.p`
  font-size: 0.78rem;
  color: ${(p) => p.theme.text}99;
  line-height: 1.4;
  margin: 0;
`;

const SliderRow = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr 48px;
  align-items: center;
  gap: 10px;

  input[type='range'] {
    width: 100%;
    accent-color: ${(p) => p.theme.accentColor};
  }
`;

const SliderLabel = styled.span`
  font-size: 0.85rem;
  color: ${(p) => p.theme.text};
`;

const SliderValue = styled.span`
  font-size: 0.8rem;
  color: ${(p) => p.theme.text}aa;
  font-family: 'SF Mono', 'Menlo', monospace;
  text-align: right;
`;

const ModeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const ModeChoice = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid ${(p) => (p.$active ? p.theme.accentColor : p.theme.border)};
  background: ${(p) => (p.$active ? p.theme.accentSurface : p.theme.cardBackground || p.theme.sidebar)};
  color: ${(p) => p.theme.text};
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;

  &:hover {
    border-color: ${(p) => p.theme.accentColor};
  }
`;

const ModeChip = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: ${(p) => (p.$mode === 'dark' ? '#0a0a0a' : '#ffffff')};
  border: 1px solid ${(p) => p.theme.border};
`;

const ResetButton = styled.button`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: ${(p) => p.theme.cardBackground || p.theme.sidebar};
  color: ${(p) => p.theme.text};
  cursor: pointer;
  font-size: 0.9rem;
  align-self: flex-start;

  &:hover {
    border-color: ${(p) => p.theme.accentColor};
  }
`;
