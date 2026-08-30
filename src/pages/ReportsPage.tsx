// src/pages/ReportsPage.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Chip,
  Paper, CircularProgress, Alert, IconButton, Select, MenuItem,
  FormControl, InputLabel, List, ListItemButton, ListItemText,
} from '@mui/material';
import {
  Search, Description, PictureAsPdf, TableChart, NotificationsNone,
  CalendarToday, Person, Groups, DownloadDone,
} from '@mui/icons-material';
import { reportsService } from '../services/reportsService';
import type { SavingsCycle, MemberSearchResult, CollectorOption } from '../services/reportsService';
import { tokens } from '../config/theme';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: tokens.radius.md,
    bgcolor: tokens.color.surface,
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
  },
};

// One row: title, description, and a set of format buttons that call onDownload.
function ReportRow({
  icon,
  title,
  description,
  buttons,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttons: { label: string; icon: React.ReactNode; onClick: () => void; loading: boolean }[];
  disabled?: boolean;
}) {
  return (
    <Card
      sx={{
        borderRadius: tokens.radius.lg,
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        border: `1px solid ${tokens.color.border}`,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Box
        sx={{
          width: 44, height: 44, borderRadius: tokens.radius.md,
          bgcolor: tokens.color.primaryPale, color: tokens.color.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: tokens.color.textDark }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: tokens.color.textMuted }}>
          {description}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {buttons.map((b) => (
          <Button
            key={b.label}
            variant="outlined"
            size="small"
            disabled={disabled || b.loading}
            startIcon={b.loading ? <CircularProgress size={14} /> : b.icon}
            onClick={b.onClick}
            sx={{
              textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
              borderRadius: tokens.radius.md, borderColor: tokens.color.border,
              color: tokens.color.textDark,
              '&:hover': { borderColor: tokens.color.primary, color: tokens.color.primary },
            }}
          >
            {b.label}
          </Button>
        ))}
      </Box>
    </Card>
  );
}

export default function ReportsPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cycle report state
  const [cycles, setCycles] = useState<SavingsCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('active');
  const [cycleExcelLoading, setCycleExcelLoading] = useState(false);
  const [cyclePdfLoading, setCyclePdfLoading] = useState(false);

  // Member statement state
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<MemberSearchResult[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [memberExcelLoading, setMemberExcelLoading] = useState(false);
  const [memberPdfLoading, setMemberPdfLoading] = useState(false);

  // Collector summary state
  const [collectors, setCollectors] = useState<CollectorOption[]>([]);
  const [collectorsLoading, setCollectorsLoading] = useState(true);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>('');
  const [collectorCycleId, setCollectorCycleId] = useState<string>('all');
  const [collectorExcelLoading, setCollectorExcelLoading] = useState(false);
  const [collectorPdfLoading, setCollectorPdfLoading] = useState(false);

  // All-collectors state
  const [allCollectorsCycleId, setAllCollectorsCycleId] = useState<string>('all');
  const [allCollectorsLoading, setAllCollectorsLoading] = useState(false);

  useEffect(() => {
    reportsService.getCycles()
      .then(setCycles)
      .catch((e) => setError(e.message))
      .finally(() => setCyclesLoading(false));

    reportsService.getCollectors()
      .then(setCollectors)
      .catch((e) => setError(e.message))
      .finally(() => setCollectorsLoading(false));
  }, []);

  // Debounced member search
  useEffect(() => {
    if (!memberQuery.trim()) {
      setMemberResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setMemberSearching(true);
        const results = await reportsService.searchMembers(memberQuery);
        setMemberResults(results);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setMemberSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [memberQuery]);

  const flashSuccess = useCallback((msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }, []);

  const runDownload = async (fn: () => Promise<void>, setLoading: (v: boolean) => void, successMsg: string) => {
    try {
      setLoading(true);
      setError(null);
      await fn();
      flashSuccess(successMsg);
    } catch (e: any) {
      setError(e.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  const cycleIdParam = selectedCycleId === 'active' ? undefined : Number(selectedCycleId);
  const collectorCycleIdParam = collectorCycleId === 'all' ? undefined : Number(collectorCycleId);
  const allCollectorsCycleIdParam = allCollectorsCycleId === 'all' ? undefined : Number(allCollectorsCycleId);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.color.bg, fontFamily: tokens.font.base }}>
      {/* Top bar */}
      <Box sx={{
        background: tokens.color.surface, borderBottom: `1px solid ${tokens.color.border}`,
        px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(45,106,79,0.06)',
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: tokens.color.textDark }}>
          Reports
        </Typography>
        <IconButton sx={{ color: tokens.color.textMid }}><NotificationsNone /></IconButton>
      </Box>

      {success && (
        <Alert severity="success" icon={<DownloadDone />} onClose={() => setSuccess(null)} sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md }}>
          {error}
        </Alert>
      )}

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2.5, pb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── Cycle report ────────────────────────────────────────────── */}
        <Paper sx={{ borderRadius: tokens.radius.xxl, p: 2.5, boxShadow: tokens.shadow.card, background: tokens.color.surface }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalendarToday sx={{ fontSize: 18, color: tokens.color.primary }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>
              Cycle Report for Twezimbe Development Group
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 220, mb: 2 }}>
            <InputLabel>Cycle</InputLabel>
            <Select
              label="Cycle"
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              disabled={cyclesLoading}
              sx={{ borderRadius: tokens.radius.md, fontSize: '0.85rem' }}
            >
              <MenuItem value="active">Active cycle</MenuItem>
              {cycles.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name} ({c.status})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ReportRow
            icon={<Description />}
            title="All members — selected cycle"
            description="Every active member's savings and withdrawals for the chosen cycle."
            buttons={[
              {
                label: 'Excel', icon: <TableChart sx={{ fontSize: 16 }} />, loading: cycleExcelLoading,
                onClick: () => runDownload(
                  () => reportsService.downloadCycleExcel(cycleIdParam),
                  setCycleExcelLoading, 'Cycle report (Excel) downloaded.'
                ),
              },
              {
                label: 'PDF', icon: <PictureAsPdf sx={{ fontSize: 16 }} />, loading: cyclePdfLoading,
                onClick: () => runDownload(
                  () => reportsService.downloadCyclePdf(cycleIdParam),
                  setCyclePdfLoading, 'Cycle report (PDF) downloaded.'
                ),
              },
            ]}
          />
        </Paper>

        {/* ── Member statement ───────────────────────────────────────── */}
        <Paper sx={{ borderRadius: tokens.radius.xxl, p: 2.5, boxShadow: tokens.shadow.card, background: tokens.color.surface }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Person sx={{ fontSize: 18, color: tokens.color.primary }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>
              Member Statement Twezimbe Development Group
            </Typography>
          </Box>

          <TextField
            fullWidth
            placeholder="Search by name or membership ID…"
            value={memberQuery}
            onChange={(e) => { setMemberQuery(e.target.value); setSelectedMember(null); }}
            size="small"
            sx={{ mb: selectedMember ? 2 : 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: tokens.color.textMuted, fontSize: 19 }} /></InputAdornment>,
              endAdornment: memberSearching ? <CircularProgress size={16} /> : null,
              sx: inputSx,
            }}
          />

          {!selectedMember && memberResults.length > 0 && (
            <List sx={{ mb: 2, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
              {memberResults.map((m) => (
                <ListItemButton
                  key={m.id}
                  onClick={() => { setSelectedMember(m); setMemberQuery(m.name); setMemberResults([]); }}
                  sx={{ py: 1 }}
                >
                  <ListItemText
                    primary={m.name}
                    secondary={`#${m.membership_id}${m.collector ? ' · ' + m.collector : ''}`}
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.72rem' }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          <ReportRow
            icon={<Description />}
            title={selectedMember ? selectedMember.name : 'Select a member above'}
            description="Full lifetime savings history and withdrawal record for this member."
            disabled={!selectedMember}
            buttons={[
              {
                label: 'Excel', icon: <TableChart sx={{ fontSize: 16 }} />, loading: memberExcelLoading,
                onClick: () => selectedMember && runDownload(
                  () => reportsService.downloadMemberHistoryExcel(selectedMember.id),
                  setMemberExcelLoading, `${selectedMember.name}'s statement (Excel) downloaded.`
                ),
              },
              {
                label: 'PDF', icon: <PictureAsPdf sx={{ fontSize: 16 }} />, loading: memberPdfLoading,
                onClick: () => selectedMember && runDownload(
                  () => reportsService.downloadMemberStatementPdf(selectedMember.id),
                  setMemberPdfLoading, `${selectedMember.name}'s statement (PDF) downloaded.`
                ),
              },
            ]}
          />
        </Paper>

        {/* ── Collector summary ──────────────────────────────────────── */}
        <Paper sx={{ borderRadius: tokens.radius.xxl, p: 2.5, boxShadow: tokens.shadow.card, background: tokens.color.surface }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Groups sx={{ fontSize: 18, color: tokens.color.primary }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>
              Collector Summary for Twezimbe Development Group
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Collector</InputLabel>
              <Select
                label="Collector"
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
                disabled={collectorsLoading}
                sx={{ borderRadius: tokens.radius.md, fontSize: '0.85rem' }}
              >
                {collectors.length === 0 && (
                  <MenuItem value="" disabled>No collectors found</MenuItem>
                )}
                {collectors.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Cycle</InputLabel>
              <Select
                label="Cycle"
                value={collectorCycleId}
                onChange={(e) => setCollectorCycleId(e.target.value)}
                disabled={cyclesLoading}
                sx={{ borderRadius: tokens.radius.md, fontSize: '0.85rem' }}
              >
                <MenuItem value="all">All-time</MenuItem>
                {cycles.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name} ({c.status})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <ReportRow
            icon={<Description />}
            title={
              selectedCollectorId
                ? collectors.find((c) => String(c.id) === selectedCollectorId)?.name || 'Selected collector'
                : 'Select a collector above'
            }
            description="Totals saved and withdrawn across this collector's members."
            disabled={!selectedCollectorId}
            buttons={[
              {
                label: 'Excel', icon: <TableChart sx={{ fontSize: 16 }} />, loading: collectorExcelLoading,
                onClick: () => selectedCollectorId && runDownload(
                  () => reportsService.downloadCollectorExcel(Number(selectedCollectorId), collectorCycleIdParam),
                  setCollectorExcelLoading, 'Collector summary (Excel) downloaded.'
                ),
              },
              {
                label: 'PDF', icon: <PictureAsPdf sx={{ fontSize: 16 }} />, loading: collectorPdfLoading,
                onClick: () => selectedCollectorId && runDownload(
                  () => reportsService.downloadCollectorPdf(Number(selectedCollectorId), collectorCycleIdParam),
                  setCollectorPdfLoading, 'Collector summary (PDF) downloaded.'
                ),
              },
            ]}
          />
        </Paper>

        {/* ── All collectors summary ─────────────────────────────────── */}
        <Paper sx={{ borderRadius: tokens.radius.xxl, p: 2.5, boxShadow: tokens.shadow.card, background: tokens.color.surface }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Groups sx={{ fontSize: 18, color: tokens.color.primary }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>
              All Collectors — Combined Summary for Twezimbe Development Group
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
            <InputLabel>Cycle</InputLabel>
            <Select
              label="Cycle"
              value={allCollectorsCycleId}
              onChange={(e) => setAllCollectorsCycleId(e.target.value)}
              disabled={cyclesLoading}
              sx={{ borderRadius: tokens.radius.md, fontSize: '0.85rem' }}
            >
              <MenuItem value="all">All-time</MenuItem>
              {cycles.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name} ({c.status})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ReportRow
            icon={<Description />}
            title="Every collector, one file"
            description="A single spreadsheet comparing all collectors' totals side by side. Excel only."
            buttons={[
              {
                label: 'Excel', icon: <TableChart sx={{ fontSize: 16 }} />, loading: allCollectorsLoading,
                onClick: () => runDownload(
                  () => reportsService.downloadAllCollectorsExcel(allCollectorsCycleIdParam),
                  setAllCollectorsLoading, 'All-collectors summary (Excel) downloaded.'
                ),
              },
            ]}
          />
        </Paper>

      </Box>
    </Box>
  );
}