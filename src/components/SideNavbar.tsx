import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Box,
  Button,
  Drawer,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Book,
  LibraryBooks,
  People,
  Description,
  Logout,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ─── Shared Design Tokens (same as ViewSavingsPage & SavingsDashboard) ────────
const tokens = {
  color: {
    bg: '#1B2B24',              // sidebar deep green background
    bgHover: '#243D31',         // hover state
    bgActive: '#2D6A4F',        // active item background
    surface: '#F2F6F3',         // page background (reference)
    border: 'rgba(255,255,255,0.08)',
    primary: '#52B788',         // active text / accent
    primaryLight: '#74C69D',    // icon color on active
    text: 'rgba(255,255,255,0.92)',
    textMuted: 'rgba(255,255,255,0.45)',
    danger: '#C0392B',
    dangerHover: '#A93226',
    logo: '#52B788',
  },
  radius: {
    md: '12px',
    lg: '16px',
  },
  font: "'Inter', 'Segoe UI', sans-serif",
};

// ─── Nav items config ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',          label: 'Dashboard',       icon: Dashboard,       to: '/dashboard' },
  { id: 'ViewSavingsPage',    label: 'View Savings',    icon: LibraryBooks,    to: '/dashboard/ViewSavingsPage' },
  { id: 'AddSavingsPage',     label: 'Add Savings',     icon: Book,            to: '/dashboard/AddSavingsPage' },
  { id: 'manage-members',     label: 'Add Member',      icon: People,          to: '/dashboard/manage-member' },
  { id: 'MonthlySavingsPage', label: 'Start the Month', icon: Description,     to: '/dashboard/MonthlySavingsPage' },
];

// ─── Tab Component ─────────────────────────────────────────────────────────────
interface TabProps {
  id: string;
  label: string;
  IconComponent: React.ElementType;
  isActive: boolean;
  to: string;
  onClick: () => void;
}

const NavTab: React.FC<TabProps> = ({ label, IconComponent, isActive, to, onClick }) => (
  <Button
    component={Link}
    to={to}
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 1.5,
      width: '100%',
      px: 2,
      py: 1.25,
      mb: 0.5,
      borderRadius: tokens.radius.md,
      textTransform: 'none',
      fontFamily: tokens.font,
      fontWeight: isActive ? 700 : 500,
      fontSize: '0.9rem',
      color: isActive ? '#fff' : tokens.color.textMuted,
      backgroundColor: isActive ? tokens.color.bgActive : 'transparent',
      boxShadow: isActive ? '0 4px 12px rgba(45,106,79,0.4)' : 'none',
      transition: 'all 0.18s ease',
      minHeight: 44,
      '&:hover': {
        backgroundColor: isActive ? tokens.color.bgActive : tokens.color.bgHover,
        color: '#fff',
      },
      // left accent bar for active
      position: 'relative',
      '&::before': isActive
        ? {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '20%',
            height: '60%',
            width: 3,
            borderRadius: '0 4px 4px 0',
            backgroundColor: tokens.color.primary,
          }
        : {},
    }}
  >
    <IconComponent
      sx={{
        fontSize: 20,
        color: isActive ? tokens.color.primary : tokens.color.textMuted,
        flexShrink: 0,
        transition: 'color 0.18s',
      }}
    />
    <Typography
      sx={{
        fontSize: '0.875rem',
        fontWeight: isActive ? 700 : 500,
        color: 'inherit',
        letterSpacing: isActive ? 0.1 : 0,
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </Typography>
  </Button>
);

// ─── Sidebar Component ────────────────────────────────────────────────────────
interface SideNavbarProps {
  sideNavActive: boolean;
  handleSideNavActive: () => void;
}

const SideNavbar: React.FC<SideNavbarProps> = ({ sideNavActive, handleSideNavActive }) => {
  const [active, setActive] = useState<string>('dashboard');
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const handleActive = (id: string) => {
    setActive(id);
    if (isMobile || isTablet) handleSideNavActive();
  };

  const handleLogout = () => {
    try {
      logout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error logging out');
    }
  };

  const drawerWidth = isMobile ? 264 : 272;

  // ── Sidebar inner content ───────────────────────────────────────────────────
  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: tokens.color.bg,
        fontFamily: tokens.font,
        overflowX: 'hidden',
        // safe area support for notched devices
        paddingTop: 'max(0px, env(safe-area-inset-top))',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      {/* ── Brand header ──────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          pt: 3,
          pb: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Logo container */}
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: tokens.radius.md,
              overflow: 'hidden',
              flexShrink: 0,
              border: `2px solid ${tokens.color.bgActive}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: tokens.color.bgActive,
            }}
          >
            <img
              src="/profit-rounded-lines-icon.jpg"
              alt="HHSSA logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // fallback to initials if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.05rem',
                color: '#fff',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              HHSSA
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: tokens.color.textMuted, mt: 0.1 }}>
              Savings Platform
            </Typography>
          </Box>
        </Box>

        {/* Close button — mobile only */}
        {isMobile && (
          <Box
            component="button"
            onClick={handleSideNavActive}
            sx={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tokens.color.textMuted,
              p: 0.5,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': { color: '#fff', bgcolor: tokens.color.bgHover },
              transition: 'all 0.15s',
            }}
          >
            <Close sx={{ fontSize: 18 }} />
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: tokens.color.border, mx: 2, mb: 1 }} />

      {/* ── Nav section label ─────────────────────────────────────────── */}
      <Typography
        sx={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: tokens.color.textMuted,
          px: 2.5,
          py: 1,
        }}
      >
        Navigation
      </Typography>

      {/* ── Nav items ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          px: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: tokens.color.bgHover,
            borderRadius: 4,
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavTab
            key={item.id}
            id={item.id}
            label={item.label}
            IconComponent={item.icon}
            isActive={active === item.id}
            to={item.to}
            onClick={() => handleActive(item.id)}
          />
        ))}
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Box sx={{ px: 1.5, pt: 2, pb: 2.5 }}>
        <Divider sx={{ borderColor: tokens.color.border, mb: 2 }} />
        <Button
          onClick={handleLogout}
          startIcon={<Logout sx={{ fontSize: 18 }} />}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            px: 2,
            py: 1.25,
            borderRadius: tokens.radius.md,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            fontFamily: tokens.font,
            color: '#fff',
            backgroundColor: tokens.color.danger,
            minHeight: 44,
            boxShadow: 'none',
            transition: 'all 0.18s ease',
            '&:hover': {
              backgroundColor: tokens.color.dangerHover,
              boxShadow: '0 4px 12px rgba(192,57,43,0.35)',
            },
          }}
        >
          Log Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={sideNavActive}
      onClose={isMobile ? handleSideNavActive : undefined}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: sideNavActive ? drawerWidth : 0,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          background: tokens.color.bg,
          overflowX: 'hidden',
          // subtle right shadow to lift sidebar off page
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
          transition: 'all 0.3s ease',
        },
        // remove default MUI backdrop tint on mobile — use our own
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(27,43,36,0.6)',
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default SideNavbar;