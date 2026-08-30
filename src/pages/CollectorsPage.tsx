import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Paper,
  TextField,
  Button,
  Chip,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Add, Search, NotificationsNone, PersonPin, SwapHoriz,
  Edit, Save, Close, GroupsOutlined,
} from '@mui/icons-material';

import { tokens, avatarColor } from '../config/theme';
import { collectorsService } from '../services/collectorsService';
import type { Collector, MemberForReassign } from '../services/collectorsService';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: tokens.radius.md,
    bgcolor: tokens.color.surface,
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
  },
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');

export default function CollectorsPage() {
  const [tab, setTab] = useState<'collectors' | 'reassign'>('collectors');

  // ── Collectors list + create form ───────────────────────────────────────
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [collectorsLoading, setCollectorsLoading] = useState(true);
  const [collectorsError, setCollectorsError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ── Inline edit collector (name / phone) ────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Bulk "move all members" per collector ───────────────────────────────
  const [bulkTargetByCollector, setBulkTargetByCollector] = useState<{ [id: number]: number }>({});
  const [bulkLoading, setBulkLoading] = useState<{ [id: number]: boolean }>({});
  const [bulkError, setBulkError] = useState<{ [id: number]: string | null }>({});
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  // ── Reassign members (single) tab ───────────────────────────────────────
  const [members, setMembers] = useState<MemberForReassign[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [pendingCollectorByMember, setPendingCollectorByMember] = useState<{ [id: number]: number }>({});
  const [reassignLoading, setReassignLoading] = useState<{ [id: number]: boolean }>({});
  const [reassignError, setReassignError] = useState<{ [id: number]: string | null }>({});
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  useEffect(() => { loadCollectors(); }, []);
  useEffect(() => { if (tab === 'reassign') loadMembers(); }, [tab]);

  const loadCollectors = async () => {
    try {
      setCollectorsLoading(true);
      setCollectorsError(null);
      const data = await collectorsService.getCollectors(false); // show all, active + inactive
      setCollectors(data);
    } catch (err: any) {
      setCollectorsError(err.message || 'Failed to load collectors');
    } finally {
      setCollectorsLoading(false);
    }
  };

  const loadMembers = async (search?: string) => {
    try {
      setMembersLoading(true);
      setMembersError(null);
      const data = await collectorsService.getAllMembers(search);
      setMembers(data);
    } catch (err: any) {
      setMembersError(err.message || 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateCollector = async () => {
    if (!newName.trim()) {
      setCreateError('Name is required.');
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError(null);
      const collector = await collectorsService.createCollector({
        name: newName.trim(),
        phone_number: newPhone.trim() || undefined,
      });
      setCollectors((prev) => [...prev, collector]);
      setNewName('');
      setNewPhone('');
      setCreateSuccess(`Collector "${collector.name}" added.`);
      setTimeout(() => setCreateSuccess(null), 4000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create collector');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit collector handlers ──────────────────────────────────────────────
  const startEdit = (collector: Collector) => {
    setEditingId(collector.id);
    setEditName(collector.name);
    setEditPhone(collector.phone_number || '');
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const saveEdit = async (collectorId: number) => {
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    try {
      setEditLoading(true);
      setEditError(null);
      const updated = await collectorsService.updateCollector(collectorId, {
        name: editName.trim(),
        phone_number: editPhone.trim() || undefined,
      });
      setCollectors((prev) => prev.map((c) => (c.id === collectorId ? { ...c, ...updated } : c)));
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update collector');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Bulk reassign-all-members handlers ──────────────────────────────────
  const handleBulkTargetChange = (collectorId: number, targetId: number) => {
    setBulkTargetByCollector((prev) => ({ ...prev, [collectorId]: targetId }));
    setBulkError((prev) => ({ ...prev, [collectorId]: null }));
  };

  const handleBulkMove = async (collector: Collector) => {
    const targetId = bulkTargetByCollector[collector.id];
    if (!targetId || targetId === collector.id) {
      setBulkError((prev) => ({ ...prev, [collector.id]: 'Pick a different collector to move people to.' }));
      return;
    }
    try {
      setBulkLoading((prev) => ({ ...prev, [collector.id]: true }));
      setBulkError((prev) => ({ ...prev, [collector.id]: null }));
      const { movedCount, failed } = await collectorsService.bulkReassignCollector(collector.id, targetId);
      const targetName = collectors.find((c) => c.id === targetId)?.name || 'the selected collector';

      if (movedCount === 0 && failed.length === 0) {
        setBulkSuccess(`${collector.name} has no members attached — nothing to move.`);
      } else if (failed.length === 0) {
        setBulkSuccess(`Moved ${movedCount} member${movedCount !== 1 ? 's' : ''} from ${collector.name} to ${targetName}.`);
      } else {
        setBulkError((prev) => ({
          ...prev,
          [collector.id]: `Moved ${movedCount}, but ${failed.length} failed. Try again for the rest.`,
        }));
      }
      setTimeout(() => setBulkSuccess(null), 5000);

      // Refresh the reassign tab's member list if it's already loaded
      if (members.length > 0) loadMembers(memberSearch || undefined);
    } catch (err: any) {
      setBulkError((prev) => ({ ...prev, [collector.id]: err.message || 'Failed to move members' }));
    } finally {
      setBulkLoading((prev) => ({ ...prev, [collector.id]: false }));
    }
  };

  // ── Single reassign handlers (Reassign Members tab) ─────────────────────
  const handlePendingChange = (memberId: number, collectorId: number) => {
    setPendingCollectorByMember((prev) => ({ ...prev, [memberId]: collectorId }));
    setReassignError((prev) => ({ ...prev, [memberId]: null }));
  };

  const handleReassign = async (member: MemberForReassign) => {
    const newCollectorId = pendingCollectorByMember[member.id];
    if (!newCollectorId || newCollectorId === member.collector_id) {
      setReassignError((prev) => ({ ...prev, [member.id]: 'Pick a different collector first.' }));
      return;
    }
    try {
      setReassignLoading((prev) => ({ ...prev, [member.id]: true }));
      setReassignError((prev) => ({ ...prev, [member.id]: null }));
      const updated = await collectorsService.reassignMemberCollector(member.id, newCollectorId);
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, ...updated } : m)));
      setPendingCollectorByMember((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
      setReassignSuccess(`${updated.full_name} moved to ${updated.collector_name}.`);
      setTimeout(() => setReassignSuccess(null), 4000);
    } catch (err: any) {
      setReassignError((prev) => ({ ...prev, [member.id]: err.message || 'Failed to reassign' }));
    } finally {
      setReassignLoading((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  const filteredMembers = memberSearch.trim()
    ? members.filter(
        (m) =>
          m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.membership_id.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.color.bg, fontFamily: tokens.font.base }}>
      {/* Top bar */}
      <Box sx={{
        background: tokens.color.surface, borderBottom: `1px solid ${tokens.color.border}`,
        px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(45,106,79,0.06)',
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: tokens.color.textDark }}>
          Collectors
        </Typography>
        <IconButton sx={{ color: tokens.color.textMid }}><NotificationsNone /></IconButton>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2.5, pb: 4 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2.5,
            minHeight: 0,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', minHeight: 0, py: 1 },
            '& .Mui-selected': { color: `${tokens.color.primary} !important` },
            '& .MuiTabs-indicator': { backgroundColor: tokens.color.primary },
          }}
        >
          <Tab label="All Collectors" value="collectors" icon={<PersonPin sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Reassign Members" value="reassign" icon={<SwapHoriz sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* COLLECTORS TAB                                                */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'collectors' && (
          <>
            {/* Create collector card */}
            <Card sx={{ borderRadius: tokens.radius.xl, p: 2.5, mb: 2.5, boxShadow: tokens.shadow.card }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: tokens.color.textDark, mb: 1.5 }}>
                Add a Collector
              </Typography>

              {createSuccess && (
                <Alert severity="success" sx={{ mb: 1.5, borderRadius: tokens.radius.md, fontSize: '0.85rem' }}>
                  {createSuccess}
                </Alert>
              )}
              {createError && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: tokens.radius.md, fontSize: '0.85rem' }}>
                  {createError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <TextField
                  label="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  size="small"
                  sx={{ flex: '1 1 220px' }}
                  InputProps={{ sx: inputSx }}
                />
                <TextField
                  label="Phone (optional)"
                  placeholder="+256700123456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  size="small"
                  sx={{ flex: '1 1 200px' }}
                  InputProps={{ sx: inputSx }}
                />
                <Button
                  variant="contained"
                  startIcon={createLoading ? <CircularProgress size={14} color="inherit" /> : <Add sx={{ fontSize: 18 }} />}
                  onClick={handleCreateCollector}
                  disabled={createLoading}
                  sx={{
                    bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary },
                    textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md,
                    boxShadow: 'none', px: 2.5, height: 40,
                  }}
                >
                  {createLoading ? 'Adding…' : 'Add Collector'}
                </Button>
              </Box>
            </Card>

            {/* Collectors list */}
            {bulkSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: tokens.radius.md }}>{bulkSuccess}</Alert>
            )}
            {collectorsError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: tokens.radius.md }}>{collectorsError}</Alert>
            )}

            <Paper sx={{ borderRadius: tokens.radius.xxl, overflow: 'hidden', boxShadow: tokens.shadow.card }}>
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceAlt }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>
                  All Collectors
                </Typography>
              </Box>

              {collectorsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress size={32} sx={{ color: tokens.color.primary }} />
                </Box>
              ) : collectors.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: tokens.color.textMuted }}>
                  <Typography>No collectors yet — add one above.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Collector</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Phone</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Move All Members To</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Edit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {collectors.map((c, idx) => {
                        const isEditing = editingId === c.id;
                        return (
                          <TableRow key={c.id} sx={{ background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt, verticalAlign: 'top' }}>
                            <TableCell sx={{ py: 1.5 }}>
                              {isEditing ? (
                                <TextField
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  size="small"
                                  autoFocus
                                  InputProps={{ sx: inputSx }}
                                />
                              ) : (
                                <Box display="flex" alignItems="center" gap={1.25}>
                                  <Avatar sx={{ bgcolor: avatarColor(idx), width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}>
                                    {getInitials(c.name)}
                                  </Avatar>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: tokens.color.textDark }}>
                                    {c.name}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>

                            <TableCell sx={{ py: 1.5 }}>
                              {isEditing ? (
                                <TextField
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  placeholder="+256700123456"
                                  size="small"
                                  InputProps={{ sx: inputSx }}
                                />
                              ) : (
                                <Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>
                                  {c.phone_number || '—'}
                                </Typography>
                              )}
                              {isEditing && editError && (
                                <Typography sx={{ fontSize: '0.72rem', color: tokens.color.danger, mt: 0.5 }}>
                                  {editError}
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Chip
                                label={c.is_active === false ? 'Inactive' : 'Active'}
                                size="small"
                                sx={{
                                  fontWeight: 700, fontSize: '0.7rem',
                                  bgcolor: c.is_active === false ? tokens.color.dangerPale : tokens.color.primaryPale,
                                  color: c.is_active === false ? tokens.color.danger : tokens.color.primary,
                                }}
                              />
                            </TableCell>

                            <TableCell sx={{ py: 1.5, minWidth: 200 }}>
                              <Box display="flex" gap={1} alignItems="flex-start">
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                  <Select
                                    displayEmpty
                                    value={bulkTargetByCollector[c.id] ?? ''}
                                    onChange={(e) => handleBulkTargetChange(c.id, Number(e.target.value))}
                                    sx={{ borderRadius: tokens.radius.md, fontSize: '0.8rem', bgcolor: tokens.color.surface }}
                                  >
                                    <MenuItem value="" disabled>
                                      <em>Select collector</em>
                                    </MenuItem>
                                    {collectors
                                      .filter((other) => other.id !== c.id)
                                      .map((other) => (
                                        <MenuItem key={other.id} value={other.id}>{other.name}</MenuItem>
                                      ))}
                                  </Select>
                                </FormControl>
                                <Tooltip title={`Move every member currently under ${c.name}`}>
                                  <span>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={bulkLoading[c.id] ? <CircularProgress size={14} /> : <GroupsOutlined sx={{ fontSize: 16 }} />}
                                      onClick={() => handleBulkMove(c)}
                                      disabled={bulkLoading[c.id] || !bulkTargetByCollector[c.id]}
                                      sx={{
                                        textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md,
                                        fontSize: '0.75rem', borderColor: tokens.color.border, color: tokens.color.textMid,
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      Move All
                                    </Button>
                                  </span>
                                </Tooltip>
                              </Box>
                              {bulkError[c.id] && (
                                <Typography sx={{ fontSize: '0.72rem', color: tokens.color.danger, mt: 0.5 }}>
                                  {bulkError[c.id]}
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {isEditing ? (
                                <Box display="flex" gap={0.5} justifyContent="center">
                                  <IconButton size="small" onClick={() => saveEdit(c.id)} disabled={editLoading} sx={{ color: tokens.color.success }}>
                                    {editLoading ? <CircularProgress size={16} /> : <Save sx={{ fontSize: 18 }} />}
                                  </IconButton>
                                  <IconButton size="small" onClick={cancelEdit} disabled={editLoading} sx={{ color: tokens.color.textMuted }}>
                                    <Close sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Box>
                              ) : (
                                <IconButton size="small" onClick={() => startEdit(c)} sx={{ color: tokens.color.primary }}>
                                  <Edit sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* REASSIGN MEMBERS TAB (single member at a time)                */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'reassign' && (
          <>
            {reassignSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: tokens.radius.md }}>{reassignSuccess}</Alert>
            )}
            {membersError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: tokens.radius.md }}>{membersError}</Alert>
            )}

            <TextField
              fullWidth
              placeholder="Search member by name or membership ID…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              size="small"
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: tokens.color.textMuted, fontSize: 19 }} /></InputAdornment>,
                sx: inputSx,
              }}
            />

            <Paper sx={{ borderRadius: tokens.radius.xxl, overflow: 'hidden', boxShadow: tokens.shadow.card }}>
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceAlt }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>
                  Members
                </Typography>
              </Box>

              {membersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress size={32} sx={{ color: tokens.color.primary }} />
                </Box>
              ) : filteredMembers.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: tokens.color.textMuted }}>
                  <Typography>No members found.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Member</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Current Collector</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Move To</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, textTransform: 'uppercase', borderBottom: `2px solid ${tokens.color.border}` }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMembers.map((m, idx) => (
                        <TableRow key={m.id} sx={{ background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt }}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.25}>
                              <Avatar sx={{ bgcolor: avatarColor(idx), width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}>
                                {getInitials(m.full_name)}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: tokens.color.textDark }}>
                                  {m.full_name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: tokens.color.textMuted, fontFamily: 'monospace' }}>
                                  {m.membership_id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMid }}>
                              {m.collector_name || '— none —'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <FormControl size="small" fullWidth>
                              <Select
                                displayEmpty
                                value={pendingCollectorByMember[m.id] ?? ''}
                                onChange={(e) => handlePendingChange(m.id, Number(e.target.value))}
                                sx={{ borderRadius: tokens.radius.md, fontSize: '0.82rem', bgcolor: tokens.color.surface }}
                              >
                                <MenuItem value="" disabled>
                                  <em>Select collector</em>
                                </MenuItem>
                                {collectors
                                  .filter((c) => c.id !== m.collector_id)
                                  .map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                  ))}
                              </Select>
                            </FormControl>
                            {reassignError[m.id] && (
                              <Typography sx={{ fontSize: '0.72rem', color: tokens.color.danger, mt: 0.5 }}>
                                {reassignError[m.id]}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleReassign(m)}
                              disabled={reassignLoading[m.id] || !pendingCollectorByMember[m.id]}
                              sx={{
                                bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary },
                                textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md,
                                boxShadow: 'none', fontSize: '0.75rem', minWidth: 0, px: 1.5,
                              }}
                            >
                              {reassignLoading[m.id] ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Move'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}