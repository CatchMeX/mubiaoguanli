import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

const MobileDynamicRedirect = () => {
  const { hasPermission } = usePermissions();
  const [redirectPath, setRedirectPath] = useState<string>('');

  useEffect(() => {
    // 按照优先级顺序检查用户可访问的目标管理页面
    const accessiblePaths = [
      { path: '/goals/company-yearly', permission: 'COMPANY_YEARLY_GOAL' },
      { path: '/goals/team', permission: 'TEAM_MONTHLY_GOAL' },
      { path: '/goals/personal', permission: 'PERSONAL_MONTHLY_GOAL' },
    ];

    console.log('📱 移动端开始检查目标管理权限...');
    
    // 找到第一个用户有权限访问的目标管理页面
    let foundPath = '';
    for (const { path, permission } of accessiblePaths) {
      const hasAccess = hasPermission(permission);
      console.log(`检查权限 ${permission}: ${hasAccess ? '✅' : '❌'} -> ${path}`);
      
      if (hasAccess) {
        foundPath = path;
        console.log(`🎯 移动端找到第一个可访问的页面: ${path}`);
        break;
      }
    }

    // 设置重定向路径，如果没有权限则默认到个人月度目标
    const finalPath = foundPath || '/goals/personal';
    console.log(`🚀 移动端最终重定向到: ${finalPath}`);
    setRedirectPath(finalPath);
  }, [hasPermission]);

  // 如果还没有确定重定向路径，显示加载状态
  if (!redirectPath) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>正在加载...</span>
        </div>
      </div>
    );
  }

  // 重定向到第一个可访问的页面
  return <Navigate to={redirectPath} replace />;
};

export default MobileDynamicRedirect;
