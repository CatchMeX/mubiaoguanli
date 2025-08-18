import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PermissionGuard, 
  MultiPermissionGuard,
  withPermission 
} from '@/hooks/usePermissions';
import { usePermissions } from '@/hooks/usePermissions';

const PermissionExample = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    userPermissions,
    getPermissionStats 
  } = usePermissions();

  const stats = getPermissionStats();

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">权限检查示例</h1>
            <p className="text-muted-foreground mt-1">展示各种权限检查组件的使用方法</p>
          </div>
        </div>

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

        {/* 基础权限检查 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>基础权限检查</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">单个权限检查</h4>
                <div className="space-y-2">
                  <PermissionGuard permission="DEPARTMENT_CREATE">
                    <Button className="w-full">新增部门 (DEPARTMENT_CREATE)</Button>
                  </PermissionGuard>
                  
                  <PermissionGuard permission="DEPARTMENT_EDIT">
                    <Button variant="outline" className="w-full">编辑部门 (DEPARTMENT_EDIT)</Button>
                  </PermissionGuard>
                  
                  <PermissionGuard permission="DEPARTMENT_DELETE">
                    <Button variant="destructive" className="w-full">删除部门 (DEPARTMENT_DELETE)</Button>
                  </PermissionGuard>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">权限状态显示</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>DEPARTMENT_CREATE:</span>
                    <Badge variant={hasPermission('DEPARTMENT_CREATE') ? 'default' : 'secondary'}>
                      {hasPermission('DEPARTMENT_CREATE') ? '有权限' : '无权限'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DEPARTMENT_EDIT:</span>
                    <Badge variant={hasPermission('DEPARTMENT_EDIT') ? 'default' : 'secondary'}>
                      {hasPermission('DEPARTMENT_EDIT') ? '有权限' : '无权限'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DEPARTMENT_DELETE:</span>
                    <Badge variant={hasPermission('DEPARTMENT_DELETE') ? 'default' : 'secondary'}>
                      {hasPermission('DEPARTMENT_DELETE') ? '有权限' : '无权限'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 多权限检查 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>多权限检查</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">需要任意一个权限 (OR)</h4>
                <MultiPermissionGuard 
                  permissions={['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT', 'DEPARTMENT_DELETE']}
                  requireAll={false}
                >
                  <Button className="w-full">部门管理相关操作</Button>
                </MultiPermissionGuard>
                
                <div className="text-sm text-muted-foreground mt-2">
                  需要以下权限中的任意一个：DEPARTMENT_CREATE, DEPARTMENT_EDIT, DEPARTMENT_DELETE
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">需要所有权限 (AND)</h4>
                <MultiPermissionGuard 
                  permissions={['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT']}
                  requireAll={true}
                >
                  <Button variant="outline" className="w-full">完整部门管理</Button>
                </MultiPermissionGuard>
                
                <div className="text-sm text-muted-foreground mt-2">
                  需要同时拥有：DEPARTMENT_CREATE 和 DEPARTMENT_EDIT
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 条件渲染 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>条件渲染</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">根据权限显示不同内容</h4>
                {hasPermission('DEPARTMENT_CREATE') ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-green-800 font-medium">您有新增部门的权限</div>
                    <div className="text-green-600 text-sm">可以创建新的部门</div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800 font-medium">您没有新增部门的权限</div>
                    <div className="text-red-600 text-sm">请联系管理员获取权限</div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">权限组合检查</h4>
                {hasAllPermissions(['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT']) ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-800 font-medium">您有完整的部门管理权限</div>
                    <div className="text-blue-600 text-sm">可以创建、编辑部门</div>
                  </div>
                ) : hasAnyPermission(['DEPARTMENT_CREATE', 'DEPARTMENT_EDIT']) ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-800 font-medium">您有部分部门管理权限</div>
                    <div className="text-yellow-600 text-sm">权限有限，部分功能不可用</div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-gray-800 font-medium">您没有部门管理权限</div>
                    <div className="text-gray-600 text-sm">只能查看部门信息</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户权限列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle>当前用户权限</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                共 {userPermissions.length} 个权限
              </div>
              <div className="flex flex-wrap gap-2">
                {userPermissions.slice(0, 20).map(permission => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
                {userPermissions.length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{userPermissions.length - 20} 更多...
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermissionExample;
