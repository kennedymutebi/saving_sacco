import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Card } from '@mui/material';
import Header from '../components/Header';
import SideNavbar from '../components/SideNavbar';

const Layout: React.FC = () => {
  const [sideNavActive, setSideNavActive] = useState(true);

  const handleSideNavActive = () => {
    setSideNavActive(!sideNavActive);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        // Remove fixed minWidth, let it be fluid
        width: '100%',
        overflow: 'hidden', // Prevent horizontal scroll
      }}
    >
      <SideNavbar
        sideNavActive={sideNavActive}
        handleSideNavActive={handleSideNavActive}
      />
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', // Changed from 'center' to 'column'
          width: '100%',
          minWidth: 0, // Allows flex item to shrink below content size
        }}
      >
        <Header onMenuClick={handleSideNavActive} />
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 }, // Responsive padding
            display: 'flex',
            flexDirection: 'column', // Changed from 'center' to 'column'
            backgroundColor: '#ffffff',
            minHeight: 'calc(100vh - 64px)', // Adjust based on header height
            overflow: 'auto', // Changed from 'hidden' to 'auto' for scrolling
            // Remove fixed marginTop, use dynamic spacing
            mt: { xs: '56px', sm: '64px' }, // Account for header height
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Card
            elevation={2}
            sx={{
              flexGrow: 1,
              mt: { xs: 2, sm: 3, md: 4 }, // Responsive top margin
              width: '100%',
              maxWidth: '100%',
              borderRadius: 2,
              p: { xs: 2, sm: 3, md: 3 }, // Responsive padding
              display: 'flex',
              flexDirection: 'column', // Changed from 'center' to 'column'
              overflow: 'auto',
              backgroundColor: '#F8F9FC',
              // Add box-sizing to prevent overflow issues
              boxSizing: 'border-box',
            }}
          >
            <Outlet />
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;