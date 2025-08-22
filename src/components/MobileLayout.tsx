import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileSidebar from './MobileSidebar';
import MobileHeader from './MobileHeader';

const MobileLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/goals/company-yearly':
        return '公司年度目标';
      case '/goals/team':
        return '部门月度目标';
      case '/goals/personal':
        return '个人月度目标';
      default:
        return '目标管理系统';
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端Header */}
      <MobileHeader 
        onMenuToggle={toggleSidebar} 
        title={getPageTitle(location.pathname)}
      />
      
      {/* 移动端侧边栏 */}
      <MobileSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
      />
      
      {/* 页面内容 */}
      <main className="lg:hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default MobileLayout;
