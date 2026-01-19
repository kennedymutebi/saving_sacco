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
} from '@mui/material';
import {
  Dashboard,
  Book,
  LibraryBooks,
  People,
  Description,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ---- Tab Component ----
interface TabProps {
  value: string;
  onClick: () => void;
  icon: React.ReactNode;
  isActive: boolean;
  to?: string;
}

const Tab: React.FC<TabProps> = ({ value, onClick, icon, isActive, to }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Button
      component={to ? Link : 'button'}
      to={to}
      onClick={onClick}
      startIcon={icon}
      sx={{
        justifyContent: 'flex-start',
        textTransform: 'none',
        px: { xs: 2, sm: 2.5, md: 3 },
        py: { xs: 1.25, md: 1.5 },
        borderRadius: 2,
        width: '100%',
        color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
        backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: isActive ? theme.palette.primary.dark : theme.palette.action.hover,
        },
        mb: { xs: 1, md: 1.5 },
        fontWeight: 500,
        fontSize: { xs: '0.875rem', md: '0.95rem' },
        // Add touch-friendly sizing on mobile
        minHeight: isMobile ? 44 : 'auto',
      }}
    >
      {value}
    </Button>
  );
};

// ---- Sidebar Component ----
interface SideNavbarProps {
  sideNavActive: boolean;
  handleSideNavActive: () => void;
}

const SideNavbar: React.FC<SideNavbarProps> = ({ sideNavActive, handleSideNavActive }) => {
  const [active, setActive] = useState<string>('dashboard');
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Detect mobile/tablet screens
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const handleActive = (value: string) => {
    setActive(value);
    // Auto-close sidebar on mobile/tablet after selection
    if (isMobile || isTablet) {
      handleSideNavActive();
    }
  };

  const handleLogout = () => {
    try {
      // Call the logout function from AuthContext
      logout();
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  // Determine drawer width based on screen size
  const drawerWidth = isMobile ? 260 : isTablet ? 270 : 280;

  return (
    <Drawer
      // Use temporary drawer on mobile, persistent on desktop
      variant={isMobile ? 'temporary' : 'persistent'}
      open={sideNavActive}
      onClose={isMobile ? handleSideNavActive : undefined}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
          p: { xs: 2, md: 2 },
          transition: 'all 0.3s ease',
          // Add safe area padding for mobile devices with notches
          paddingTop: { xs: 'max(16px, env(safe-area-inset-top))', md: 2 },
          paddingBottom: { xs: 'max(16px, env(safe-area-inset-bottom))', md: 2 },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          py: { xs: 2, md: 3 },
        }}
      >
        {/* Logo/Title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, md: 2 },
            mb: { xs: 3, md: 4 },
            px: { xs: 0.5, md: 0 },
          }}
        >
          <img
            src="/profit-rounded-lines-icon.jpg"
            alt="Church Logo"
            style={{
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 400,
              color: theme.palette.primary.main,
              letterSpacing: '-0.025em',
              fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
            }}
          >
            HHSSA 
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box 
          sx={{ 
            flexGrow: 1,
            // Add scrolling for mobile if nav items are many
            overflowY: isMobile ? 'auto' : 'visible',
            overflowX: 'hidden',
            // Hide scrollbar but keep functionality
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.divider,
              borderRadius: '4px',
            },
          }}
        >
          <Tab
            value="Dashboard"
            onClick={() => handleActive('dashboard')}
            icon={<Dashboard sx={{ fontSize: { xs: 20, md: 24 } }} />}
            isActive={active === 'dashboard'}
            to="/dashboard"
          />
          <Tab
            value="View Savings"
            onClick={() => handleActive('ViewSavingsPage')}
            icon={<LibraryBooks sx={{ fontSize: { xs: 20, md: 24 } }} />}
            isActive={active === 'ViewSavingsPage'}
            to="/dashboard/ViewSavingsPage"
          />
          <Tab
            value="Add Savings"
            onClick={() => handleActive('AddSavingsPage')}
            icon={<Book sx={{ fontSize: { xs: 20, md: 24 } }} />}
            isActive={active === 'AddSavingsPage'}
            to="/dashboard/AddSavingsPage"
          />
          <Tab
            value="Add Member"
            onClick={() => handleActive('manage-members')}
            icon={<People sx={{ fontSize: { xs: 20, md: 24 } }} />}
            isActive={active === 'manage-members'}
            to="/dashboard/manage-member"
          />
          <Tab
            value="Start the Month"
            onClick={() => handleActive('MonthlySavingsPage')}
            icon={<Description sx={{ fontSize: { xs: 20, md: 24 } }} />}
            isActive={active === 'MonthlySavingsPage'}
            to="/dashboard/MonthlySavingsPage"
          />
        </Box>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          startIcon={<Logout sx={{ fontSize: { xs: 20, md: 24 } }} />}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            px: { xs: 2, sm: 2.5, md: 3 },
            py: { xs: 1.25, md: 1.5 },
            color: theme.palette.error.contrastText,
            backgroundColor: theme.palette.error.main,
            fontWeight: 600,
            borderRadius: 2,
            fontSize: { xs: '0.875rem', md: '0.95rem' },
            transition: 'all 0.3s ease',
            minHeight: isMobile ? 44 : 'auto',
            '&:hover': {
              backgroundColor: theme.palette.error.dark,
            },
          }}
        >
          Log Out
        </Button>
      </Box>
    </Drawer>
  );
};

export default SideNavbar;