import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteUserById,
  getAllUsers,
  getDashboardStats,
  getUsageLimits,
  resetUserUsage as resetAdminUserUsage,
  updateUsageLimits,
  getDeepResearchConfig,
  getChatModels,
  updateDeepResearchConfig,
  updateUserDetails,
  updateUserStatus
} from '../services/authService';
import AdminLoginModal from '../components/AdminLoginModal';

const STATUS_LABELS = { active: 'Active', pending: 'Pending', suspended: 'Suspended', banned: 'Banned' };
const ROLE_LABELS = { admin: 'Admin', user: 'User' };
const DEFAULT_LIMITS = { turns: null, images: null, videos: null };
const DEFAULT_DEEP_RESEARCH_CONFIG = {
  plannerModel: 'gemini-3.1-pro',
  researcherModel: 'gemini-3-flash',
  writerModel: 'claude-sonnet-4.6',
  reportLength: 'standard',
  reportDepth: 'standard',
  minAgents: 2,
  maxAgents: 12,
  defaultMaxAgents: 8,
  maxParallelAgents: 4,
  plannerMaxTokens: 2048,
  agentMaxTokens: 3072,
  writerMaxTokens: 8192,
  plannerTemperature: 0.2,
  agentTemperature: 0.2,
  writerTemperature: 0.2,
  requestTimeoutMs: 180000,
  allowWriterModelOverride: false
};
const REPORT_LENGTH_OPTIONS = ['short', 'standard', 'long'];
const REPORT_DEPTH_OPTIONS = ['surface', 'standard', 'deep'];
const DEEP_RESEARCH_FORM_FIELD_KEYS = {
  plannerModel: 'plannerModel',
  researcherModel: 'researcherModel',
  writerModel: 'writerModel',
  reportLength: 'reportLength',
  reportDepth: 'reportDepth',
  minAgents: 'minAgents',
  maxAgents: 'maxAgents',
  defaultMaxAgents: 'defaultMaxAgents',
  maxParallelAgents: 'maxParallelAgents',
  plannerMaxTokens: 'plannerMaxTokens',
  agentMaxTokens: 'agentMaxTokens',
  writerMaxTokens: 'writerMaxTokens',
  plannerTemperature: 'plannerTemperature',
  agentTemperature: 'agentTemperature',
  writerTemperature: 'writerTemperature',
  requestTimeoutMs: 'requestTimeoutMs',
  allowWriterModelOverride: 'allowWriterModelOverride'
};
const EMPTY_LIMIT_FORM = { turns: '', images: '', videos: '' };

const Page = styled.div`
  flex: 1; min-height: 100vh; min-width: 0; color: ${p => p.theme.text}; overflow-y: auto; overflow-x: hidden;
  transition: padding-left 0.42s cubic-bezier(0.22, 1, 0.36, 1); padding-left: ${p => (p.$collapsed ? '0' : '280px')};
  @media (max-width: 1024px) { padding-left: 0; }
`;
const Wrap = styled.div`
  max-width: 1440px; margin: 0 auto; padding: 48px 40px 80px;
  @media (max-width: 768px) { padding: 32px 20px 60px; }
`;
const Header = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px;
  @media (max-width: 880px) { flex-direction: column; gap: 20px; }
`;
const HeaderLeft = styled.div`display:flex; flex-direction:column; gap:8px;`;
const Title = styled.h1`
  margin:0; font-size:2.25rem; font-weight:700; letter-spacing:-0.03em; line-height:1.1;
  @media (max-width: 640px) { font-size: 1.875rem; }
`;
const Subtitle = styled.p`
  margin:0; font-size:0.9375rem; color:${p => p.theme.textSecondary || `${p.theme.text}80`}; letter-spacing:-0.01em; max-width:760px;
`;
const Actions = styled.div`display:flex; gap:10px; flex-wrap:wrap;`;
const Button = styled.button`
  border:1px solid ${p => p.theme.border}; background:${p => p.$primary ? (p.theme.accentBackground || p.theme.primary) : (p.theme.inputBackground || p.theme.sidebar)};
  color:${p => p.$primary ? '#fff' : p.theme.text}; padding:10px 14px; border-radius:10px; cursor:pointer; font-size:0.9rem; font-weight:600; transition:all 0.16s ease;
  &:hover:not(:disabled){transform:translateY(-1px);} &:disabled{opacity:0.6; cursor:not-allowed;}
`;
const MiniButton = styled(Button)`padding:7px 10px; border-radius:8px; font-size:0.8rem;`;
const DangerButton = styled(MiniButton)`border-color:#ef4444; background:#7f1d1d22; color:#ef4444;`;
const Banner = styled.div`
  border-radius:10px; border:1px solid ${p => p.$error ? '#fca5a5' : '#86efac'}; background:${p => p.$error ? '#7f1d1d26' : '#14532d26'};
  color:${p => p.$error ? '#fecaca' : '#dcfce7'}; padding:11px 13px; margin-bottom:14px; font-size:0.9rem;
`;
const StatsGrid = styled.div`
  display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-bottom:18px;
  @media (max-width: 1100px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
const Card = styled.div`
  background:${p => p.theme.sidebar}; border:1px solid ${p => p.theme.border}; border-radius:14px; padding:14px;
`;
const StatLabel = styled.div`font-size:0.78rem; text-transform:uppercase; letter-spacing:0.05em; opacity:0.7;`;
const StatValue = styled.div`font-size:1.45rem; font-weight:700; letter-spacing:-0.02em; margin-top:8px;`;
const TwoCol = styled.div`
  display:grid; grid-template-columns:minmax(360px,1.2fr) minmax(280px,0.8fr); gap:14px; margin-bottom:20px;
  @media (max-width: 1100px) { grid-template-columns:1fr; }
`;
const Panel = styled(Card)`padding:18px; display:flex; flex-direction:column; gap:16px;`;
const PanelHeader = styled.div`
  display:flex; justify-content:space-between; gap:14px; align-items:flex-start;
  @media (max-width: 680px) { flex-direction:column; }
`;
const PanelTitle = styled.h2`margin:0; font-size:1.02rem; letter-spacing:-0.02em;`;
const PanelText = styled.p`margin:6px 0 0; font-size:0.88rem; line-height:1.5; opacity:0.76;`;
const LimitGrid = styled.div`
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;
  @media (max-width: 720px) { grid-template-columns:1fr; }
`;
const LimitCard = styled.div`
  border:1px solid ${p => p.theme.border}; border-radius:12px; padding:14px; background:${p => p.theme.inputBackground || p.theme.background};
`;
const SmallLabel = styled.div`font-size:0.76rem; text-transform:uppercase; letter-spacing:0.05em; opacity:0.72;`;
const BigValue = styled.div`font-size:1.2rem; font-weight:700; letter-spacing:-0.02em; margin:8px 0 10px;`;
const Input = styled.input`
  width:100%; padding:10px 11px; border-radius:9px; border:1px solid ${p => p.theme.border}; background:${p => p.theme.inputBackground || p.theme.background}; color:${p => p.theme.text};
  &:focus{outline:none; border-color:${p => p.theme.accentColor || p.theme.primary}; box-shadow:0 0 0 3px ${p => p.theme.accentSurface || `${p.theme.primary}22`};}
`;
const Select = styled.select`
  width:100%; padding:10px 12px; border-radius:10px; border:1px solid ${p => p.theme.border}; background:${p => p.theme.inputBackground || p.theme.sidebar}; color:${p => p.theme.text};
`;
const Helper = styled.div`font-size:0.78rem; line-height:1.45; opacity:0.68; margin-top:8px;`;
const SnapshotGrid = styled.div`
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px;
  @media (max-width: 520px) { grid-template-columns:1fr; }
`;
const Controls = styled.div`
  display:grid; grid-template-columns:minmax(220px,1fr) 180px 180px auto; gap:10px; margin-bottom:14px;
  @media (max-width: 980px) { grid-template-columns:1fr 1fr; }
  @media (max-width: 560px) { grid-template-columns:1fr; }
`;
const SearchWrap = styled.div`position:relative;`;
const SearchInput = styled(Input)`padding:11px 12px 11px 38px; background:${p => p.theme.inputBackground || p.theme.sidebar};`;
const SearchIcon = styled.span`
  position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.55; pointer-events:none; display:inline-flex;
`;
const TableWrap = styled.div`
  border:1px solid ${p => p.theme.border}; border-radius:14px; overflow:hidden; background:${p => p.theme.sidebar}; overflow-x:auto;
`;
const Table = styled.table`width:100%; border-collapse:collapse; min-width:1260px;`;
const THead = styled.thead`background:${p => p.theme.inputBackground || p.theme.background};`;
const Th = styled.th`
  text-align:left; padding:13px 14px; font-size:0.8rem; letter-spacing:0.05em; text-transform:uppercase; opacity:0.75; border-bottom:1px solid ${p => p.theme.border};
`;
const Tr = styled.tr`
  border-bottom:1px solid ${p => p.theme.border}; &:last-child{border-bottom:none;} &:hover{background:${p => p.theme.inputBackground || 'rgba(255,255,255,0.04)'};}
`;
const Td = styled.td`padding:13px 14px; vertical-align:middle;`;
const UserCell = styled.div`display:flex; align-items:center; gap:10px;`;
const Avatar = styled.div`
  width:38px; height:38px; border-radius:999px; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:700; background:${p => p.$color}; flex-shrink:0;
`;
const UserMeta = styled.div`display:flex; flex-direction:column; gap:3px;`;
const UserName = styled.span`font-size:0.96rem; font-weight:600;`;
const UserEmail = styled.span`font-size:0.82rem; opacity:0.72;`;
const Badge = styled.span`
  display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:4px 10px; font-size:0.74rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#fff;
  background:${p => p.$bg || '#475569'};
`;
const UsageStack = styled.div`display:flex; flex-direction:column; gap:8px; min-width:230px;`;
const UsageRow = styled.div`display:flex; flex-direction:column; gap:5px;`;
const UsageTop = styled.div`display:flex; justify-content:space-between; gap:8px; align-items:center; font-size:0.78rem;`;
const UsageTrack = styled.div`height:6px; border-radius:999px; background:${p => p.theme.border}; overflow:hidden;`;
const UsageFill = styled.div`
  height:100%; width:${p => `${p.$progress}%`}; border-radius:inherit; background:${p => p.$tone === 'danger' ? '#dc2626' : p.$tone === 'warning' ? '#d97706' : '#059669'}; transition:width 0.18s ease;
`;
const RowActions = styled.div`display:flex; gap:7px; justify-content:flex-end; flex-wrap:wrap;`;
const EmptyState = styled.div`
  border:1px dashed ${p => p.theme.border}; border-radius:12px; padding:28px; text-align:center; opacity:0.85; background:${p => p.theme.sidebar};
`;
const Overlay = styled.div`
  position:fixed; inset:0; background:rgba(0,0,0,0.58); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:1200;
`;
const Modal = styled.div`width:min(760px,92vw); background:${p => p.theme.sidebar}; border:1px solid ${p => p.theme.border}; border-radius:14px; overflow:hidden;`;
const ModalHead = styled.div`display:flex; justify-content:space-between; align-items:center; padding:18px 18px 14px; border-bottom:1px solid ${p => p.theme.border};`;
const ModalBody = styled.div`
  padding:16px 18px; display:grid; grid-template-columns:1fr 1fr; gap:14px;
  @media (max-width: 680px) { grid-template-columns:1fr; }
`;
const Field = styled.div`display:flex; flex-direction:column; gap:7px;`;
const FieldLabel = styled.label`font-size:0.78rem; letter-spacing:0.04em; text-transform:uppercase; opacity:0.75;`;
const Full = styled.div`grid-column:1 / -1;`;
const InfoText = styled.p`margin:0; font-size:0.84rem; opacity:0.76;`;
const DeepResearchGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:14px 16px;
  @media (max-width: 880px) { grid-template-columns:repeat(2, minmax(0, 1fr)); }
  @media (max-width: 520px) { grid-template-columns:1fr; }
`;
const DeepResearchGridWide = styled.div`
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:14px 16px;
  @media (max-width: 980px) { grid-template-columns:repeat(2, minmax(0, 1fr)); }
  @media (max-width: 560px) { grid-template-columns:1fr; }
`;
const DRSection = styled.div`
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:16px;
  border:1px solid ${p => p.theme.border};
  border-radius:12px;
  background:${p => p.theme.inputBackground || p.theme.background};
`;
const DRSectionHead = styled.div`display:flex; justify-content:space-between; align-items:baseline; gap:10px; flex-wrap:wrap;`;
const DRSectionTitle = styled.h3`
  margin:0;
  font-size:0.78rem;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:${p => p.theme.accentColor || p.theme.primary || '#2563eb'};
  font-weight:700;
`;
const DRSectionHint = styled.span`font-size:0.8rem; opacity:0.68;`;
const DRSummaryRow = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-bottom:4px;
`;
const DRSummaryPill = styled.span`
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid ${p => p.theme.border};
  background:${p => p.theme.sidebar};
  font-size:0.78rem;
  line-height:1.2;
  strong { font-weight:600; text-transform:capitalize; }
  span { opacity:0.65; }
`;
const CheckboxGroup = styled.label`
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:4px;
  font-size:0.86rem;
  opacity:0.9;
  cursor:pointer;
`;
const CheckboxInput = styled.input`
  width:16px;
  height:16px;
  accent-color: ${p => p.theme.accentColor || p.theme.primary || '#6366f1'};
`;
const ModalFoot = styled.div`
  display:flex; justify-content:space-between; align-items:center; gap:10px; padding:14px 18px; border-top:1px solid ${p => p.theme.border}; background:${p => p.theme.inputBackground || p.theme.background};
  @media (max-width: 640px) { flex-direction:column; align-items:stretch; }
`;
const FootGroup = styled.div`display:flex; gap:8px; flex-wrap:wrap;`;

const getAvatarInitials = (name = '') => name.split(/\s+/).filter(Boolean).map(part => part[0]?.toUpperCase() || '').join('').slice(0, 2) || '?';
const getAvatarColor = (name = '') => ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#f97316'][name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6];
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };
const getTimeAgo = (value) => { if (!value) return 'Never'; const now = new Date(); const date = new Date(value); if (Number.isNaN(date.getTime())) return 'Unknown'; const diff = Math.max(0, now.getTime() - date.getTime()); const mins = Math.floor(diff / 60000); const hours = Math.floor(mins / 60); const days = Math.floor(hours / 24); const months = Math.floor(days / 30); if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`; if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`; if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`; if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`; return 'just now'; };
const normalizeUsage = (usage = {}) => ({ turns: Math.max(0, Math.floor(Number(usage.turns) || 0)), images: Math.max(0, Math.floor(Number(usage.images) || 0)), videos: Math.max(0, Math.floor(Number(usage.videos) || 0)), resetAt: usage.resetAt || null });
const normalizeUser = (user) => ({ id: user.id, username: user.username || user.name || 'Unknown', email: user.email || '', role: user.role === 'admin' ? 'admin' : 'user', status: ['active', 'pending', 'suspended', 'banned'].includes(user.status) ? user.status : 'active', usage: normalizeUsage(user.usage), lastActive: getTimeAgo(user.last_login || user.updated_at), createdAt: formatDate(user.created_at), avatar: getAvatarInitials(user.username || user.name || 'Unknown'), avatarColor: getAvatarColor(user.username || user.name || 'Unknown') });
const toLimitInput = (value) => value === null || value === undefined ? '' : String(value);
const formatLimitValue = (value) => value === null || value === undefined ? 'Unlimited' : value.toLocaleString('en-US');
const formatUsageValue = (used, limit) => limit === null || limit === undefined ? `${used.toLocaleString('en-US')} used` : `${used.toLocaleString('en-US')} / ${limit.toLocaleString('en-US')}`;
const getUsageTone = (used, limit) => { if (limit === null || limit === undefined) return 'neutral'; if (limit === 0) return used > 0 ? 'danger' : 'safe'; const ratio = used / limit; if (ratio >= 1) return 'danger'; if (ratio >= 0.8) return 'warning'; return 'safe'; };
const getUsageProgress = (used, limit) => { if (limit === null || limit === undefined) return null; if (limit === 0) return used > 0 ? 100 : 0; return Math.max(0, Math.min(100, Math.round((used / limit) * 100))); };
const syncLimitForm = (limits) => ({ turns: toLimitInput(limits?.turns), images: toLimitInput(limits?.images), videos: toLimitInput(limits?.videos) });

const AdminPage = ({ collapsed }) => {
  const { adminUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, pendingUsers: 0, activeUsers: 0, adminUsers: 0, suspendedUsers: 0, totalTurnsUsed: 0, totalImagesUsed: 0, totalVideosUsed: 0 });
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [limitForm, setLimitForm] = useState(EMPTY_LIMIT_FORM);
  const [deepResearchConfig, setDeepResearchConfig] = useState(DEFAULT_DEEP_RESEARCH_CONFIG);
  const [deepResearchConfigForm, setDeepResearchConfigForm] = useState(DEFAULT_DEEP_RESEARCH_CONFIG);
  const [chatModels, setChatModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', role: 'user', status: 'active', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingDeepResearchConfig, setSavingDeepResearchConfig] = useState(false);
  const [workingUserId, setWorkingUserId] = useState(null);
  const [resettingUsageUserId, setResettingUsageUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!adminUser) return null;
    silent ? setRefreshing(true) : setLoading(true);
    setError('');

    try {
      const [usersData, statsData, limitsData, deepResearchConfigData, chatModelData] = await Promise.all([
        getAllUsers(),
        getDashboardStats(),
        getUsageLimits(),
        getDeepResearchConfig(),
        getChatModels().catch(() => [])
      ]);
      const nextUsers = (usersData || []).map(normalizeUser);
      const nextLimits = limitsData || statsData?.usageLimits || DEFAULT_LIMITS;
      const nextDeepResearchConfig = deepResearchConfigData || DEFAULT_DEEP_RESEARCH_CONFIG;
      setUsers(nextUsers);
      setStats({ totalUsers: 0, pendingUsers: 0, activeUsers: 0, adminUsers: 0, suspendedUsers: 0, totalTurnsUsed: 0, totalImagesUsed: 0, totalVideosUsed: 0, ...(statsData || {}) });
      setLimits(nextLimits);
      setLimitForm(syncLimitForm(nextLimits));
      setDeepResearchConfig(nextDeepResearchConfig);
      setDeepResearchConfigForm({
        ...DEFAULT_DEEP_RESEARCH_CONFIG,
        ...nextDeepResearchConfig
      });
      setChatModels(Array.isArray(chatModelData) ? chatModelData : []);
      return nextUsers;
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (!adminUser) return;
    loadData(false);
  }, [adminUser, loadData]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.role.toLowerCase().includes(query) || user.status.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const usageSnapshot = useMemo(() => {
    let nearingLimitUsers = 0;
    let cappedOutUsers = 0;

    for (const user of users) {
      const states = ['turns', 'images', 'videos'].map((field) => {
        const limit = limits[field];
        if (limit === null || limit === undefined) return null;
        const used = user.usage[field];
        if (limit === 0) return used > 0 ? 'capped' : null;
        const ratio = used / limit;
        if (ratio >= 1) return 'capped';
        if (ratio >= 0.8) return 'nearing';
        return null;
      }).filter(Boolean);

      if (states.includes('capped')) cappedOutUsers += 1;
      else if (states.includes('nearing')) nearingLimitUsers += 1;
    }

    return { nearingLimitUsers, cappedOutUsers };
  }, [users, limits]);

  const beginEdit = (user) => {
    setError('');
    setSuccess('');
    setEditingUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role, status: user.status, newPassword: '' });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm({ username: '', email: '', role: 'user', status: 'active', newPassword: '' });
  };

  const refreshEditingUser = (nextUsers, userId) => {
    if (!nextUsers || !editingUser || editingUser.id !== userId) return;
    const refreshed = nextUsers.find((user) => user.id === userId);
    if (refreshed) setEditingUser(refreshed);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    if (editingUser.id === adminUser?.id && editForm.role !== editingUser.role) {
      setError('You cannot change your own admin role.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const detailUpdates = {};
      if (editForm.username.trim() !== editingUser.username) detailUpdates.username = editForm.username.trim();
      if (editForm.email.trim() !== editingUser.email) detailUpdates.email = editForm.email.trim();
      if (editForm.newPassword.trim()) detailUpdates.password = editForm.newPassword.trim();
      if (editForm.role !== editingUser.role) detailUpdates.role = editForm.role;
      if (Object.keys(detailUpdates).length > 0) await updateUserDetails(editingUser.id, detailUpdates);
      if (editForm.status !== editingUser.status) await updateUserStatus(editingUser.id, editForm.status);
      closeEdit();
      await loadData(true);
      setSuccess('User updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimits = async () => {
    setSavingLimits(true);
    setError('');
    setSuccess('');
    try {
      const nextLimits = await updateUsageLimits({ turns: limitForm.turns.trim(), images: limitForm.images.trim(), videos: limitForm.videos.trim() });
      setLimits(nextLimits || DEFAULT_LIMITS);
      setLimitForm(syncLimitForm(nextLimits || DEFAULT_LIMITS));
      await loadData(true);
      setSuccess('Global usage limits updated.');
    } catch (err) {
      setError(err.message || 'Failed to update usage limits.');
    } finally {
      setSavingLimits(false);
    }
  };

  const handleSaveDeepResearchConfig = async () => {
    setSavingDeepResearchConfig(true);
    setError('');
    setSuccess('');
    try {
      const nextConfig = await updateDeepResearchConfig(deepResearchConfigForm);
      setDeepResearchConfig(nextConfig || {});
      setDeepResearchConfigForm(nextConfig || DEFAULT_DEEP_RESEARCH_CONFIG);
      setSuccess('Deep research configuration updated.');
    } catch (err) {
      setError(err.message || 'Failed to update deep research configuration.');
    } finally {
      setSavingDeepResearchConfig(false);
    }
  };

  const handleDeepResearchConfigFieldChange = (field, value) => {
    setDeepResearchConfigForm((current) => ({ ...current, [field]: value }));
  };

  const formatOptionValue = (value) => value === undefined || value === null ? '' : String(value);
  const deepResearchModelsByProvider = useMemo(
    () => ({
      gemini: (Array.isArray(chatModels) ? chatModels : []).filter((model) => model?.provider === 'gemini'),
      anthropic: (Array.isArray(chatModels) ? chatModels : []).filter((model) => model?.provider === 'anthropic')
    }),
    [chatModels]
  );
  const getProviderModelOptions = (provider, fallbackValue) => {
    const options = provider === 'gemini'
      ? deepResearchModelsByProvider.gemini
      : deepResearchModelsByProvider.anthropic;
    if (options.length > 0) return options;
    const fallbackId = formatOptionValue(fallbackValue);
    return fallbackId ? [{ id: fallbackId }] : [];
  };

  const quickStatusChange = async (user, nextStatus) => {
    if (!user || user.status === nextStatus) return;
    if (user.id === adminUser?.id) {
      setError('You cannot change your own account status.');
      return;
    }
    if (nextStatus === 'banned' && !window.confirm(`Ban ${user.username}? This will revoke active sessions and API keys.`)) return;

    setWorkingUserId(user.id);
    setError('');
    setSuccess('');
    try {
      await updateUserStatus(user.id, nextStatus);
      const nextUsers = await loadData(true);
      refreshEditingUser(nextUsers, user.id);
      setSuccess(`${user.username} is now ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setWorkingUserId(null);
    }
  };

  const handleResetUserUsage = async (user) => {
    if (!user || !window.confirm(`Reset usage for ${user.username}? This clears turn, image, and video counters.`)) return;
    setResettingUsageUserId(user.id);
    setError('');
    setSuccess('');
    try {
      await resetAdminUserUsage(user.id);
      const nextUsers = await loadData(true);
      refreshEditingUser(nextUsers, user.id);
      setSuccess(`${user.username}'s usage was reset.`);
    } catch (err) {
      setError(err.message || 'Failed to reset user usage.');
    } finally {
      setResettingUsageUserId(null);
    }
  };

  const deleteUser = async (user) => {
    if (!user) return;
    if (user.id === adminUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete ${user.username}? This action is permanent.`)) return;

    setWorkingUserId(user.id);
    setError('');
    setSuccess('');
    try {
      await deleteUserById(user.id);
      await loadData(true);
      if (editingUser?.id === user.id) closeEdit();
      setSuccess(`${user.username} was deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setWorkingUserId(null);
    }
  };

  if (!adminUser) {
    return (
      <Page $collapsed={collapsed}>
        <Wrap>
          <EmptyState>
            <h2>Admin access required</h2>
            <p style={{ marginBottom: '16px' }}>Log in with an administrator account to manage users and quotas.</p>
            <Button $primary onClick={() => setShowAdminLogin(true)}>Admin login</Button>
          </EmptyState>
        </Wrap>
        <AdminLoginModal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} />
      </Page>
    );
  }

  return (
    <Page $collapsed={collapsed}>
      <Wrap>
        {error && <Banner $error>{error}</Banner>}
        {success && <Banner>{success}</Banner>}

        <Header>
          <HeaderLeft>
            <Title>Admin panel</Title>
            <Subtitle>
              User access, account status, and quota controls for chat turns, image generation, and video generation.
            </Subtitle>
          </HeaderLeft>
          <Actions>
            <Button onClick={() => setLimitForm(syncLimitForm(limits))} disabled={savingLimits}>Revert limit edits</Button>
            <Button onClick={() => loadData(true)} disabled={refreshing || loading}>{refreshing ? 'Refreshing...' : 'Refresh'}</Button>
          </Actions>
        </Header>

        <StatsGrid>
          <Card><StatLabel>Total users</StatLabel><StatValue>{stats.totalUsers || 0}</StatValue></Card>
          <Card><StatLabel>Admins</StatLabel><StatValue>{stats.adminUsers || 0}</StatValue></Card>
          <Card><StatLabel>Active</StatLabel><StatValue>{stats.activeUsers || 0}</StatValue></Card>
          <Card><StatLabel>Pending</StatLabel><StatValue>{stats.pendingUsers || 0}</StatValue></Card>
          <Card><StatLabel>Suspended or banned</StatLabel><StatValue>{stats.suspendedUsers || 0}</StatValue></Card>
          <Card><StatLabel>Total turns used</StatLabel><StatValue>{(stats.totalTurnsUsed || 0).toLocaleString('en-US')}</StatValue></Card>
          <Card><StatLabel>Total images used</StatLabel><StatValue>{(stats.totalImagesUsed || 0).toLocaleString('en-US')}</StatValue></Card>
          <Card><StatLabel>Total videos used</StatLabel><StatValue>{(stats.totalVideosUsed || 0).toLocaleString('en-US')}</StatValue></Card>
        </StatsGrid>

        <TwoCol>
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Global usage limits</PanelTitle>
                <PanelText>Limits apply per user account. Leave a field blank to keep that resource unlimited.</PanelText>
              </div>
              <Button $primary onClick={handleSaveLimits} disabled={savingLimits}>{savingLimits ? 'Saving...' : 'Save limits'}</Button>
            </PanelHeader>

            <LimitGrid>
              <LimitCard>
                <SmallLabel>Chat turns</SmallLabel>
                <BigValue>{formatLimitValue(limits.turns)}</BigValue>
                <Input inputMode="numeric" placeholder="Unlimited" value={limitForm.turns} onChange={(e) => setLimitForm((current) => ({ ...current, turns: e.target.value }))} />
                <Helper>Each successful chat completion counts as one turn.</Helper>
              </LimitCard>
              <LimitCard>
                <SmallLabel>Image generations</SmallLabel>
                <BigValue>{formatLimitValue(limits.images)}</BigValue>
                <Input inputMode="numeric" placeholder="Unlimited" value={limitForm.images} onChange={(e) => setLimitForm((current) => ({ ...current, images: e.target.value }))} />
                <Helper>Counts the number of images requested or returned per generation.</Helper>
              </LimitCard>
              <LimitCard>
                <SmallLabel>Video generations</SmallLabel>
                <BigValue>{formatLimitValue(limits.videos)}</BigValue>
                <Input inputMode="numeric" placeholder="Unlimited" value={limitForm.videos} onChange={(e) => setLimitForm((current) => ({ ...current, videos: e.target.value }))} />
                <Helper>Counts each successful Sora generation request.</Helper>
              </LimitCard>
            </LimitGrid>

            <Actions style={{ justifyContent: 'space-between' }}>
              <Helper style={{ marginTop: 0 }}>
                Lowering a limit below current usage does not erase history. It simply blocks new requests until usage is reset.
              </Helper>
              <Button onClick={() => setLimitForm(EMPTY_LIMIT_FORM)} disabled={savingLimits}>Clear form</Button>
            </Actions>
          </Panel>

          <Panel>
            <div>
              <PanelTitle>Quota snapshot</PanelTitle>
              <PanelText>Quick visibility into accounts that are approaching or already at the current limits.</PanelText>
            </div>

            <SnapshotGrid>
              <LimitCard>
                <SmallLabel>Users nearing a limit</SmallLabel>
                <BigValue>{usageSnapshot.nearingLimitUsers}</BigValue>
                <Helper style={{ marginTop: 0 }}>At or above 80% of any active quota.</Helper>
              </LimitCard>
              <LimitCard>
                <SmallLabel>Users at a limit</SmallLabel>
                <BigValue>{usageSnapshot.cappedOutUsers}</BigValue>
                <Helper style={{ marginTop: 0 }}>Already at or beyond at least one active quota.</Helper>
              </LimitCard>
              <LimitCard>
                <SmallLabel>Turn limit</SmallLabel>
                <BigValue>{formatLimitValue(limits.turns)}</BigValue>
                <Helper style={{ marginTop: 0 }}>Applies to successful chat completion requests.</Helper>
              </LimitCard>
              <LimitCard>
                <SmallLabel>Media limits</SmallLabel>
                <BigValue>{`${formatLimitValue(limits.images)} / ${formatLimitValue(limits.videos)}`}</BigValue>
                <Helper style={{ marginTop: 0 }}>Images first, videos second.</Helper>
              </LimitCard>
            </SnapshotGrid>
          </Panel>
        </TwoCol>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Deep research configuration</PanelTitle>
              <PanelText>Pick the models and quality knobs used by the multi-agent deep research pipeline. Changes save to KV and apply instantly to the next run.</PanelText>
            </div>
            <Button $primary onClick={handleSaveDeepResearchConfig} disabled={savingDeepResearchConfig}>{savingDeepResearchConfig ? 'Saving...' : 'Save configuration'}</Button>
          </PanelHeader>

          <DRSummaryRow>
            <DRSummaryPill><span>Planner</span><strong>{deepResearchConfig.plannerModel || '—'}</strong></DRSummaryPill>
            <DRSummaryPill><span>Researcher</span><strong>{deepResearchConfig.researcherModel || '—'}</strong></DRSummaryPill>
            <DRSummaryPill><span>Writer</span><strong>{deepResearchConfig.writerModel || '—'}</strong></DRSummaryPill>
            <DRSummaryPill><span>Report</span><strong>{deepResearchConfig.reportLength || 'standard'} · {deepResearchConfig.reportDepth || 'standard'}</strong></DRSummaryPill>
            <DRSummaryPill><span>Agents</span><strong>{deepResearchConfig.defaultMaxAgents ?? '—'} default / {deepResearchConfig.maxAgents ?? '—'} max</strong></DRSummaryPill>
          </DRSummaryRow>

          <DRSection>
            <DRSectionHead>
              <DRSectionTitle>Pipeline models</DRSectionTitle>
              <DRSectionHint>Only models defined in models.json are selectable.</DRSectionHint>
            </DRSectionHead>
            <DeepResearchGrid>
              <Field>
                <FieldLabel>Planner model</FieldLabel>
                <Select
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.plannerModel])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.plannerModel, e.target.value)}
                >
                  {getProviderModelOptions('gemini', deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.plannerModel]).map((model) => (
                    <option key={`planner-${model.id}`} value={model.id}>{model.id}</option>
                  ))}
                </Select>
                <Helper>Decomposes the query into sub-questions.</Helper>
              </Field>

              <Field>
                <FieldLabel>Researcher model</FieldLabel>
                <Select
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.researcherModel])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.researcherModel, e.target.value)}
                >
                  {getProviderModelOptions('gemini', deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.researcherModel]).map((model) => (
                    <option key={`researcher-${model.id}`} value={model.id}>{model.id}</option>
                  ))}
                </Select>
                <Helper>Runs per sub-question agent in parallel.</Helper>
              </Field>

              <Field>
                <FieldLabel>Writer model</FieldLabel>
                <Select
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.writerModel])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.writerModel, e.target.value)}
                >
                  {getProviderModelOptions('anthropic', deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.writerModel]).map((model) => (
                    <option key={`writer-${model.id}`} value={model.id}>{model.id}</option>
                  ))}
                </Select>
                <Helper>Synthesises the final report with citations.</Helper>
              </Field>
            </DeepResearchGrid>

            <CheckboxGroup>
              <CheckboxInput
                type="checkbox"
                checked={!!deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.allowWriterModelOverride]}
                onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.allowWriterModelOverride, e.target.checked)}
              />
              Allow API clients to override the writer model per request
            </CheckboxGroup>
          </DRSection>

          <DRSection>
            <DRSectionHead>
              <DRSectionTitle>Report shape</DRSectionTitle>
              <DRSectionHint>Defaults for output scope. Requests can override per-run.</DRSectionHint>
            </DRSectionHead>
            <DeepResearchGrid>
              <Field>
                <FieldLabel>Report length</FieldLabel>
                <Select
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.reportLength])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.reportLength, e.target.value)}
                >
                  {REPORT_LENGTH_OPTIONS.map((value) => (
                    <option key={`report-length-${value}`} value={value}>{value}</option>
                  ))}
                </Select>
                <Helper>Target output volume and token budget.</Helper>
              </Field>

              <Field>
                <FieldLabel>Report depth</FieldLabel>
                <Select
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.reportDepth])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.reportDepth, e.target.value)}
                >
                  {REPORT_DEPTH_OPTIONS.map((value) => (
                    <option key={`report-depth-${value}`} value={value}>{value}</option>
                  ))}
                </Select>
                <Helper>Research breadth and verification rigor.</Helper>
              </Field>
            </DeepResearchGrid>
          </DRSection>

          <DRSection>
            <DRSectionHead>
              <DRSectionTitle>Concurrency</DRSectionTitle>
              <DRSectionHint>Throughput vs. cost. Higher = more citations, more spend.</DRSectionHint>
            </DRSectionHead>
            <DeepResearchGridWide>
              <Field>
                <FieldLabel>Minimum agents</FieldLabel>
                <Input
                  type="number" min={1} max={24}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.minAgents])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.minAgents, e.target.value)}
                />
                <Helper>Soft lower bound for the planner.</Helper>
              </Field>
              <Field>
                <FieldLabel>Default agents</FieldLabel>
                <Input
                  type="number" min={1} max={24}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.defaultMaxAgents])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.defaultMaxAgents, e.target.value)}
                />
                <Helper>Used when a request omits the field.</Helper>
              </Field>
              <Field>
                <FieldLabel>Max agents</FieldLabel>
                <Input
                  type="number" min={1} max={24}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.maxAgents])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.maxAgents, e.target.value)}
                />
                <Helper>Absolute cap per run.</Helper>
              </Field>
              <Field>
                <FieldLabel>Parallel agents</FieldLabel>
                <Input
                  type="number" min={1} max={24}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.maxParallelAgents])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.maxParallelAgents, e.target.value)}
                />
                <Helper>Concurrent researcher tasks.</Helper>
              </Field>
              <Field>
                <FieldLabel>Request timeout (ms)</FieldLabel>
                <Input
                  type="number" min={5000} max={300000}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.requestTimeoutMs])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.requestTimeoutMs, e.target.value)}
                />
                <Helper>Upstream model timeout.</Helper>
              </Field>
            </DeepResearchGridWide>
          </DRSection>

          <DRSection>
            <DRSectionHead>
              <DRSectionTitle>Token budgets</DRSectionTitle>
              <DRSectionHint>Maximum generated tokens per stage.</DRSectionHint>
            </DRSectionHead>
            <DeepResearchGridWide>
              <Field>
                <FieldLabel>Planner tokens</FieldLabel>
                <Input
                  type="number" min={256} max={8192}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.plannerMaxTokens])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.plannerMaxTokens, e.target.value)}
                />
                <Helper>Plan output budget.</Helper>
              </Field>
              <Field>
                <FieldLabel>Researcher tokens</FieldLabel>
                <Input
                  type="number" min={256} max={8192}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.agentMaxTokens])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.agentMaxTokens, e.target.value)}
                />
                <Helper>Per-agent evidence budget.</Helper>
              </Field>
              <Field>
                <FieldLabel>Writer tokens</FieldLabel>
                <Input
                  type="number" min={512} max={16384}
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.writerMaxTokens])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.writerMaxTokens, e.target.value)}
                />
                <Helper>Final report budget.</Helper>
              </Field>
            </DeepResearchGridWide>
          </DRSection>

          <DRSection>
            <DRSectionHead>
              <DRSectionTitle>Temperatures</DRSectionTitle>
              <DRSectionHint>Keep low (≤0.3) for factual, high-reliability output.</DRSectionHint>
            </DRSectionHead>
            <DeepResearchGridWide>
              <Field>
                <FieldLabel>Planner</FieldLabel>
                <Input
                  type="number" min={0} max={1} step="0.1"
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.plannerTemperature])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.plannerTemperature, e.target.value)}
                />
                <Helper>Planning creativity.</Helper>
              </Field>
              <Field>
                <FieldLabel>Researcher</FieldLabel>
                <Input
                  type="number" min={0} max={1} step="0.1"
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.agentTemperature])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.agentTemperature, e.target.value)}
                />
                <Helper>Research diversity.</Helper>
              </Field>
              <Field>
                <FieldLabel>Writer</FieldLabel>
                <Input
                  type="number" min={0} max={1} step="0.1"
                  value={formatOptionValue(deepResearchConfigForm[DEEP_RESEARCH_FORM_FIELD_KEYS.writerTemperature])}
                  onChange={(e) => handleDeepResearchConfigFieldChange(DEEP_RESEARCH_FORM_FIELD_KEYS.writerTemperature, e.target.value)}
                />
                <Helper>Report narrative style.</Helper>
              </Field>
            </DeepResearchGridWide>
          </DRSection>

          <Actions style={{ justifyContent: 'space-between' }}>
            <InfoText>Current defaults apply to the next deep research run. Requests can override length/depth per-call.</InfoText>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button onClick={() => setDeepResearchConfigForm(deepResearchConfig)} disabled={savingDeepResearchConfig}>Revert unsaved</Button>
              <Button onClick={() => setDeepResearchConfigForm(DEFAULT_DEEP_RESEARCH_CONFIG)} disabled={savingDeepResearchConfig}>Restore defaults</Button>
            </div>
          </Actions>
        </Panel>

        <Controls>
          <SearchWrap>
            <SearchIcon aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </SearchIcon>
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search username, email, role, status" />
          </SearchWrap>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </Select>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>
          <Button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoleFilter('all'); }}>Clear filters</Button>
        </Controls>

        {loading && users.length === 0 ? (
          <EmptyState>Loading users...</EmptyState>
        ) : filteredUsers.length === 0 ? (
          <EmptyState>No users match the current filters.</EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Usage</Th>
                  <Th>Last active</Th>
                  <Th>Created</Th>
                  <Th style={{ textAlign: 'right' }}>Actions</Th>
                </tr>
              </THead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isBusy = workingUserId === user.id || saving || resettingUsageUserId === user.id;
                  const isSelf = user.id === adminUser?.id;
                  const usageRows = [
                    { key: 'turns', label: 'Turns', used: user.usage.turns, limit: limits.turns },
                    { key: 'images', label: 'Images', used: user.usage.images, limit: limits.images },
                    { key: 'videos', label: 'Videos', used: user.usage.videos, limit: limits.videos }
                  ];

                  return (
                    <Tr key={user.id}>
                      <Td>
                        <UserCell>
                          <Avatar $color={user.avatarColor}>{user.avatar}</Avatar>
                          <UserMeta>
                            <UserName>{user.username}</UserName>
                            <UserEmail>{user.email}</UserEmail>
                          </UserMeta>
                        </UserCell>
                      </Td>
                      <Td><Badge $bg={user.role === 'admin' ? '#1d4ed8' : '#475569'}>{ROLE_LABELS[user.role] || user.role}</Badge></Td>
                      <Td><Badge $bg={user.status === 'active' ? '#059669' : user.status === 'pending' ? '#d97706' : user.status === 'suspended' ? '#b45309' : '#dc2626'}>{STATUS_LABELS[user.status] || user.status}</Badge></Td>
                      <Td>
                        <UsageStack>
                          {usageRows.map((row) => {
                            const tone = getUsageTone(row.used, row.limit);
                            const progress = getUsageProgress(row.used, row.limit);
                            return (
                              <UsageRow key={row.key}>
                                <UsageTop>
                                  <span style={{ opacity: 0.75 }}>{row.label}</span>
                                  <span style={{ fontWeight: 700, color: tone === 'danger' ? '#dc2626' : tone === 'warning' ? '#d97706' : tone === 'safe' ? '#059669' : 'inherit' }}>
                                    {formatUsageValue(row.used, row.limit)}
                                  </span>
                                </UsageTop>
                                {progress !== null && <UsageTrack><UsageFill $progress={progress} $tone={tone} /></UsageTrack>}
                              </UsageRow>
                            );
                          })}
                        </UsageStack>
                      </Td>
                      <Td>{user.lastActive}</Td>
                      <Td>{user.createdAt}</Td>
                      <Td>
                        <RowActions>
                          <MiniButton onClick={() => beginEdit(user)} disabled={isBusy}>Edit</MiniButton>
                          <MiniButton onClick={() => handleResetUserUsage(user)} disabled={isBusy}>{resettingUsageUserId === user.id ? 'Resetting...' : 'Reset usage'}</MiniButton>
                          {user.status === 'active' ? (
                            <MiniButton onClick={() => quickStatusChange(user, 'suspended')} disabled={isBusy || isSelf}>Suspend</MiniButton>
                          ) : (
                            <MiniButton onClick={() => quickStatusChange(user, 'active')} disabled={isBusy || isSelf}>Activate</MiniButton>
                          )}
                          <DangerButton onClick={() => deleteUser(user)} disabled={isBusy || isSelf}>Delete</DangerButton>
                        </RowActions>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Wrap>

      {editingUser && (
        <Overlay onClick={closeEdit}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Edit user</h2>
              <Button onClick={closeEdit}>Close</Button>
            </ModalHead>
            <ModalBody>
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input value={editForm.username} onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))} placeholder="username" />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="email" />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select value={editForm.role} disabled={editingUser.id === adminUser?.id} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={editForm.status} disabled={editingUser.id === adminUser?.id} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </Select>
              </Field>
              <Field>
                <FieldLabel>New password (optional)</FieldLabel>
                <Input type="password" value={editForm.newPassword} onChange={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))} placeholder="Leave empty to keep current password" />
              </Field>
              <Full>
                <UsageStack>
                  {[
                    { key: 'turns', label: 'Turns', used: editingUser.usage.turns, limit: limits.turns },
                    { key: 'images', label: 'Images', used: editingUser.usage.images, limit: limits.images },
                    { key: 'videos', label: 'Videos', used: editingUser.usage.videos, limit: limits.videos }
                  ].map((row) => {
                    const tone = getUsageTone(row.used, row.limit);
                    const progress = getUsageProgress(row.used, row.limit);
                    return (
                      <UsageRow key={row.key}>
                        <UsageTop>
                          <span style={{ opacity: 0.75 }}>{row.label}</span>
                          <span style={{ fontWeight: 700, color: tone === 'danger' ? '#dc2626' : tone === 'warning' ? '#d97706' : tone === 'safe' ? '#059669' : 'inherit' }}>{formatUsageValue(row.used, row.limit)}</span>
                        </UsageTop>
                        {progress !== null && <UsageTrack><UsageFill $progress={progress} $tone={tone} /></UsageTrack>}
                      </UsageRow>
                    );
                  })}
                </UsageStack>
              </Full>
              <Full>
                <InfoText>Created: {editingUser.createdAt} | Last active: {editingUser.lastActive}</InfoText>
                {editingUser.usage.resetAt && <InfoText style={{ marginTop: '6px' }}>Usage last reset: {formatDate(editingUser.usage.resetAt)}</InfoText>}
                {editingUser.id === adminUser?.id && <InfoText style={{ marginTop: '6px' }}>Your own role and status cannot be changed from this view.</InfoText>}
              </Full>
            </ModalBody>
            <ModalFoot>
              <FootGroup>
                <MiniButton disabled={resettingUsageUserId === editingUser.id} onClick={() => handleResetUserUsage(editingUser)}>{resettingUsageUserId === editingUser.id ? 'Resetting...' : 'Reset usage'}</MiniButton>
                <DangerButton disabled={editingUser.id === adminUser?.id || saving} onClick={() => deleteUser(editingUser)}>Delete user</DangerButton>
              </FootGroup>
              <FootGroup>
                <Button onClick={closeEdit} disabled={saving}>Cancel</Button>
                <Button $primary onClick={handleSaveUser} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
              </FootGroup>
            </ModalFoot>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
};

export default AdminPage;
