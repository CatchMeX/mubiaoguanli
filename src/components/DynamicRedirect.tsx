import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

const DynamicRedirect = () => {
  const { hasPermission } = usePermissions();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // 按照侧边栏的实际菜单顺序来检查权限
    const accessiblePaths = [
      // 组织管理 - 第一个菜单
      { path: '/departments', permission: 'DEPARTMENT_MANAGEMENT' },
      { path: '/teams', permission: 'PROJECT_MANAGEMENT' },
      { path: '/permissions', permission: 'PERMISSION_MANAGEMENT' },
      { path: '/members', permission: 'MEMBER_MANAGEMENT' },
      
      // 任务管理 - 第二个菜单
      { path: '/tasks', permission: 'TASK_MANAGEMENT' },
      
      // 目标管理 - 第三个菜单
      { path: '/goals/dashboard', permission: 'GOAL_DASHBOARD' },
      { path: '/goals/company-yearly', permission: 'COMPANY_YEARLY_GOAL' },
      { path: '/goals/team', permission: 'TEAM_MONTHLY_GOAL' },
      { path: '/goals/personal', permission: 'PERSONAL_MONTHLY_GOAL' },
      { path: '/goals/units', permission: 'UNIT_MANAGEMENT' },
      
      // 审批管理 - 第四个菜单
      { path: '/approval/workflow', permission: 'WORKFLOW_CONFIG' },
      { path: '/approval/pending', permission: 'PENDING_LIST' },
      
      // 财务管理 - 第五个菜单
      { path: '/finance/matters', permission: 'MATTER_MANAGEMENT' },
      { path: '/finance/payments', permission: 'PAYMENT_MANAGEMENT' },
      { path: '/finance/expense-reimbursement', permission: 'EXPENSE_REIMBURSEMENT' },
      { path: '/finance/business-trip-reimbursement', permission: 'BUSINESS_TRIP_REIMBURSEMENT' },
      
      // 资产管理 - 第六个菜单
      { path: '/assets', permission: 'ASSET_MANAGEMENT' },
      { path: '/assets/list', permission: 'ASSET_LIST' },
      { path: '/assets/inventory', permission: 'ASSET_INVENTORY' },
    ];

    // 找到第一个用户有权限访问的页面
    let foundPath = null;
    console.log('🔍 开始检查用户权限...');
    
    for (const { path, permission } of accessiblePaths) {
      const hasAccess = hasPermission(permission);
      console.log(`检查权限 ${permission}: ${hasAccess ? '✅' : '❌'} -> ${path}`);
      
      if (hasAccess) {
        foundPath = path;
        console.log(`🎯 找到第一个可访问的页面: ${path}`);
        break;
      }
    }

    // 设置重定向路径
    const finalPath = foundPath || '/goals/dashboard';
    console.log(`🚀 最终重定向到: ${finalPath}`);
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

export default DynamicRedirect;
