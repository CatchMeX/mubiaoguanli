import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

const PermissionDebug = () => {
  const { user } = useAuth();
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    userPermissions,
    getPermissionStats 
  } = usePermissions();

  const stats = getPermissionStats();

  // 测试权限
  const testPermissions = [
    'DASHBOARD_MENU',
    'DEPARTMENT_MANAGEMENT', 
    'DEPARTMENT_CREATE',
    'DEPARTMENT_EDIT',
    'DEPARTMENT_DELETE',
    'MEMBER_MANAGEMENT',
    'PERMISSION_MANAGEMENT'
  ];

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">权限调试页面</h1>
            <p className="text-muted-foreground mt-1">诊断权限系统问题</p>
          </div>
        </div>

        {/* 用户信息 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>用户ID:</strong> {user?.id || '未登录'}
              </div>
              <div>
                <strong>用户名:</strong> {user?.name || '未登录'}
              </div>
              <div>
                <strong>工号:</strong> {user?.employee_id || '未登录'}
              </div>
              <div>
                <strong>角色数量:</strong> {user?.roles?.length || 0}
              </div>
              {user?.roles && user.roles.length > 0 && (
                <div>
                  <strong>角色详情:</strong>
                  <div className="mt-2 space-y-2">
                    {user.roles.map((role: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div><strong>角色名称:</strong> {role.name || role.id}</div>
                        <div><strong>角色编码:</strong> {role.code || '无编码'}</div>
                        <div><strong>权限数量:</strong> {role.permissions?.length || 0}</div>
                        {role.permissions && (
                          <div>
                            <strong>权限列表:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.permissions.map((perm: string, permIndex: number) => (
                                <Badge key={permIndex} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 权限统计 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>权限统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">总权限数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.accessible}</div>
                <div className="text-sm text-muted-foreground">可访问权限</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.inaccessible}</div>
                <div className="text-sm text-muted-foreground">不可访问权限</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{(stats.coverage * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">权限覆盖率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 权限测试 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>权限测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">测试权限检查</h4>
                <div className="grid grid-cols-2 gap-4">
                  {testPermissions.map(permission => (
                    <div key={permission} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">{permission}</span>
                      <Badge variant={hasPermission(permission) ? 'default' : 'secondary'}>
                        {hasPermission(permission) ? '有权限' : '无权限'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">组合权限测试</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>部门管理相关权限 (任意一个):</span>
                    <Badge variant={hasAnyPermission(['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT', 'DEPARTMENT_DELETE']) ? 'default' : 'secondary'}>
                      {hasAnyPermission(['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT', 'DEPARTMENT_DELETE']) ? '有权限' : '无权限'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>完整部门管理权限 (所有):</span>
                    <Badge variant={hasAllPermissions(['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT']) ? 'default' : 'secondary'}>
                      {hasAllPermissions(['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT']) ? '有权限' : '无权限'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 当前用户权限列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>当前用户权限列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                共 {userPermissions.length} 个权限
              </div>
              {userPermissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userPermissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无权限数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 调试信息 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>调试信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">控制台日志</h4>
                <p className="text-sm text-muted-foreground">
                  请打开浏览器开发者工具的控制台，查看权限检查的详细日志信息。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">常见问题排查</h4>
                <div className="space-y-2 text-sm">
                  <div>1. 检查用户是否有角色分配</div>
                  <div>2. 检查角色是否有权限配置</div>
                  <div>3. 检查权限代码是否与配置一致</div>
                  <div>4. 检查用户登录状态</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermissionDebug;
