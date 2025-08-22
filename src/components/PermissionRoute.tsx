import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * 权限路由保护组件
 * 检查用户是否有访问指定路由的权限
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  requiredPermission,
  fallback = null,
  redirectTo = '/'
}) => {
  const { hasPermission, isAuthenticated } = usePermissions();

  // 如果用户未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果用户没有所需权限
  if (!hasPermission(requiredPermission)) {
    // 如果有自定义fallback，显示fallback
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // 否则重定向到指定页面
    return <Navigate to={redirectTo} replace />;
  }

  // 有权限，显示内容
  return <>{children}</>;
};

/**
 * 多权限检查的路由保护组件
 */
interface MultiPermissionRouteProps {
  children: React.ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean; // true: 需要所有权限, false: 需要任意一个权限
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const MultiPermissionRoute: React.FC<MultiPermissionRouteProps> = ({
  children,
  requiredPermissions,
  requireAll = false,
  fallback = null,
  redirectTo = '/'
}) => {
  const { hasAllPermissions, hasAnyPermission, isAuthenticated } = usePermissions();

  // 如果用户未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 检查权限
  const hasAccess = requireAll 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  // 如果用户没有所需权限
  if (!hasAccess) {
    // 如果有自定义fallback，显示fallback
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // 否则重定向到指定页面
    return <Navigate to={redirectTo} replace />;
  }

  // 有权限，显示内容
  return <>{children}</>;
};
