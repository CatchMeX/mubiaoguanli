import React, { useContext, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FUNCTION_PERMISSIONS, PermissionNode, getAllPermissionCodes } from '@/config/permissions';

// 权限检查Hook
export function usePermissions() {
  const { user } = useAuth();
  const permissionsCache = useRef<Map<string, boolean>>(new Map());

  // 获取用户的所有权限代码
  const userPermissions = useMemo(() => {
    if (!user) {
      return [];
    }
    
    // 检查用户是否有角色信息
    if (!user.roles || user.roles.length === 0) {
      return [];
    }
    
    // 从用户角色中提取权限代码
    const permissions: string[] = [];
    
    // 处理从users_with_relations视图获取的角色数据
    user.roles.forEach((role: any) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        // 从角色权限对象中提取权限代码
        role.permissions.forEach((perm: any) => {
          if (perm.code) {
            permissions.push(perm.code);
          }
        });
      }
    });
    
    // 清空缓存，因为用户权限可能发生变化
    permissionsCache.current.clear();
    
    return [...new Set(permissions)]; // 去重
  }, [user]);

  // 检查用户是否有指定权限（带缓存）
  const hasPermission = useCallback((permissionCode: string): boolean => {
    // 检查缓存
    if (permissionsCache.current.has(permissionCode)) {
      return permissionsCache.current.get(permissionCode)!;
    }
    
    // 计算权限
    const hasAccess = userPermissions.includes(permissionCode);
    
    // 缓存结果
    permissionsCache.current.set(permissionCode, hasAccess);
    
    return hasAccess;
  }, [userPermissions]);

  // 检查用户是否有指定权限列表中的任意一个
  const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  }, [hasPermission]);

  // 检查用户是否有指定权限列表中的所有权限
  const hasAllPermissions = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  }, [hasPermission]);

  // 获取用户有权限的菜单
  const getAccessibleMenus = useCallback((): PermissionNode[] => {
    if (!user || !user.roles) return [];

    return FUNCTION_PERMISSIONS.filter(menu => {
      // 检查菜单级权限
      if (!hasPermission(menu.code)) return false;

      // 如果有子菜单，递归检查
      if (menu.children) {
        menu.children = menu.children.filter(page => {
          // 检查页面级权限
          if (!hasPermission(page.code)) return false;

          // 如果有按钮权限，递归检查
          if (page.children) {
            page.children = page.children.filter(button => 
              hasPermission(button.code)
            );
          }

          return true;
        });
      }

      return true;
    });
  }, [user, hasPermission]);

  // 获取用户有权限的页面路径
  const getAccessiblePaths = useCallback((): string[] => {
    const accessibleMenus = getAccessibleMenus();
    const paths: string[] = [];

    function extractPaths(nodes: PermissionNode[]) {
      nodes.forEach(node => {
        if (node.path) {
          paths.push(node.path);
        }
        if (node.children) {
          extractPaths(node.children);
        }
      });
    }

    extractPaths(accessibleMenus);
    return paths;
  }, [getAccessibleMenus]);

  // 检查用户是否可以访问指定路径
  const canAccessPath = useCallback((path: string): boolean => {
    const accessiblePaths = getAccessiblePaths();
    return accessiblePaths.includes(path);
  }, [getAccessiblePaths]);

  // 获取用户有权限的按钮权限
  const getButtonPermissions = useCallback((): string[] => {
    const accessibleMenus = getAccessibleMenus();
    const buttonPermissions: string[] = [];

    function extractButtonPermissions(nodes: PermissionNode[]) {
      nodes.forEach(node => {
        if (node.type === 'button') {
          buttonPermissions.push(node.code);
        }
        if (node.children) {
          extractButtonPermissions(node.children);
        }
      });
    }

    extractButtonPermissions(accessibleMenus);
    return buttonPermissions;
  }, [getAccessibleMenus]);

  // 检查用户是否有指定页面的按钮权限
  const hasPageButtonPermission = useCallback((pageCode: string, buttonCode: string): boolean => {
    const accessibleMenus = getAccessibleMenus();
    
    function findPageAndCheckButton(nodes: PermissionNode[]): boolean {
      for (const node of nodes) {
        if (node.code === pageCode && node.children) {
          return node.children.some(button => 
            button.code === buttonCode && hasPermission(button.code)
          );
        }
        if (node.children) {
          if (findPageAndCheckButton(node.children)) {
            return true;
          }
        }
      }
      return false;
    }

    return findPageAndCheckButton(accessibleMenus);
  }, [getAccessibleMenus, hasPermission]);

  // 获取用户权限统计信息
  const getPermissionStats = useCallback(() => {
    const allCodes = getAllPermissionCodes();
    const accessibleCodes = userPermissions;
    const inaccessibleCodes = allCodes.filter(code => !accessibleCodes.includes(code));

    return {
      total: allCodes.length,
      accessible: accessibleCodes.length,
      inaccessible: inaccessibleCodes.length,
      coverage: accessibleCodes.length / allCodes.length
    };
  }, [userPermissions]);

  return {
    // 基础权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // 菜单和路径权限
    getAccessibleMenus,
    getAccessiblePaths,
    canAccessPath,
    
    // 按钮权限
    getButtonPermissions,
    hasPageButtonPermission,
    
    // 权限统计
    getPermissionStats,
    
    // 用户权限数据
    userPermissions,
    
    // 用户信息
    user,
    isAuthenticated: !!user
  };
}

// 权限检查组件的高阶组件
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string,
  fallback?: React.ReactNode
) {
  return function PermissionWrapper(props: P) {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(requiredPermission)) {
      return fallback || null;
    }
    
    return React.createElement(WrappedComponent, props);
  };
}

// 权限检查的渲染组件（使用React.memo优化）
export const PermissionGuard = React.memo(({ 
  permission, 
  children, 
  fallback = null 
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
});

// 多权限检查的渲染组件（使用React.memo优化）
export const MultiPermissionGuard = React.memo(({ 
  permissions, 
  children, 
  fallback = null,
  requireAll = false
}: {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);
  
  if (!hasAccess) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
});
