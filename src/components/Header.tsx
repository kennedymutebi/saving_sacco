import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  styled,
  keyframes,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled Components
const StyledAppBar = styled(AppBar)({
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  animation: `${fadeIn} 0.5s ease-out`,
});

const MenuButton = styled(IconButton)({
  color: '#2563eb',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: '#eff6ff',
    transform: 'rotate(90deg)',
  },
});

const DashboardText = styled(Typography)({
  color: '#2563eb',
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  animation: `${slideIn} 0.6s ease-out`,
});

const WelcomeText = styled(Typography)({
  color: '#111',
  fontWeight: 700,
  fontSize: '1.25rem',
  animation: `${fadeIn} 0.8s ease-out`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -4,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 60,
    height: 3,
    background: 'linear-gradient(90deg, #2563eb, #8b5cf6)',
    borderRadius: 2,
  },
});

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <StyledAppBar position="fixed">
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '70px',
          px: { xs: 2, md: 4 },
        }}
      >
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuButton
            edge="start"
            aria-label="menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </MenuButton>
          <DashboardText variant="h6" noWrap>
            Dashboard
          </DashboardText>
        </Box>

        {/* Center Section */}
        <Box
          sx={{
            position: 'absolute',
            fontSize:'40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: { xs: 'none', md: 'block' },
          }}
        >
          <WelcomeText variant="h5" noWrap>
           Havest Haven Sacco Saving Association
          </WelcomeText>
        </Box>

        {/* Mobile Center */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: '#111',
              fontWeight: 600,
              animation: `${fadeIn} 0.8s ease-out`,
            }}
          >
            LMS
          </Typography>
        </Box>

        {/* Right Section - Placeholder for future actions */}
        <Box sx={{ width: 48 }} />
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;