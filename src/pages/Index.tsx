import React from 'react';
import { AppHeaderWrapper } from '@/components/AppHeaderWrapper';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeaderWrapper />
      <Outlet />
    </div>
  );
};

export default Layout;