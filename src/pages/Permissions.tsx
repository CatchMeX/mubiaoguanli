import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  StrictDialog,
  StrictDialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Users,
  Key,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  UserCheck,
  Lock,
  Monitor,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import { permissionAPI, roleAPI, userAPI, menuAPI } from '@/services/api';
import { getUserRoles, permissions as mockPermissions } from '@/data/mockdatarbac';
import { toast } from '@/components/ui/use-toast';
import type { Permission, Role, User, UserRole } from '@/types';
import { FunctionPermissionTree } from '@/components/permissions/FunctionPermissionTree';
import { permissionsAPI, type PermissionTree } from '@/services/permissionsAPI';
import { PermissionGuard } from '@/hooks/usePermissions';

const Permissions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedFunctionPermissions, setSelectedFunctionPermissions] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [permissionTab, setPermissionTab] = useState('function');
  
  // 表单状态
  const [newRole, setNewRole] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [editRole, setEditRole] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 数据状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [permissionTree, setPermissionTree] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rolesData, permissionsData, permissionTreeData, usersData] = await Promise.all([
        roleAPI.getRolesWithPermissions(),
        permissionsAPI.getAll(),
        permissionsAPI.getTree(),
        userAPI.getAll()
      ]);
      
      setRoles(rolesData);
      setPermissions(permissionsData);
      setPermissionTree(permissionTreeData);
      setUsers(usersData);
      
      console.log('成功加载权限数据:', permissionsData.length, '个权限');
      console.log('权限树结构:', permissionTreeData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载数据失败:', err);
      
      toast({
        title: '数据库连接失败',
        description: '正在使用模拟数据，权限保存将无法生效',
        variant: 'destructive',
        duration: 5000
      });
      
      // 使用mock数据作为后备
      setPermissions(mockPermissions as any[]);
      setPermissionTree([]);
    } finally {
      setLoading(false);
    }
  };

  // 使用从数据库获取的权限树
  const functionPermissions = permissionTree;
  const allFunctionPermissions = permissions.map(p => p.code);
  


  // 计算统计信息
  const stats = {
    totalRoles: roles.length,
    activeRoles: roles.filter((r: any) => r.status === 'active').length,
    totalPermissions: permissions.length,
    functionPermissions: permissions.filter(p => p.type !== 'data').length,
    systemRoles: roles.filter((r: any) => r.isSystem).length,
    totalUserRoles: 0, // TODO: 从用户角色关联表计算
    usersWithMultipleRoles: 0 // TODO: 计算拥有多个角色的用户数
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.code.toLowerCase().includes(searchTerm.toLowerCase());
    // 由于数据库中没有status字段，我们基于is_system来过滤
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && !role.is_system) ||
                         (selectedStatus === 'system' && role.is_system);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-600 text-white">
        <CheckCircle className="w-3 h-3 mr-1" />
        启用
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        禁用
      </Badge>
    );
  };

  const getRoleTypeBadge = (role: any) => {
    if (role.isProtected) {
      return (
        <Badge className="bg-red-600 text-white">
          <Crown className="w-3 h-3 mr-1" />
          受保护
        </Badge>
      );
    }
    if (role.isSystem) {
      return (
        <Badge className="bg-blue-600 text-white">
          <Lock className="w-3 h-3 mr-1" />
          系统角色
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <UserCheck className="w-3 h-3 mr-1" />
        自定义
      </Badge>
    );
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name || '',
      description: role.description || '',
      status: role.status || 'active'
    });
    setIsEditDialogOpen(true);
  };

  const handleManagePermissions = (role: any) => {
    setSelectedRole(role);
    
    // 从API返回的数据结构中提取权限ID数组
    let rolePermissionIds: string[] = [];
    
    if (role.role_permissions && Array.isArray(role.role_permissions)) {
      // 从关联表中提取权限ID
      rolePermissionIds = role.role_permissions
        .map((rp: any) => rp.permission?.id)
        .filter((id: string) => id); // 过滤掉undefined的值
    } else if (role.permissions && Array.isArray(role.permissions)) {
      // 如果直接有permissions数组
      rolePermissionIds = role.permissions;
    }
    
    console.log('角色权限ID:', rolePermissionIds);
    
    // 从权限数据中查找对应的权限代码
    const functionPermissionCodes: string[] = [];
    
    rolePermissionIds.forEach(permId => {
      const permission = permissions.find(p => p.id === permId);
      if (permission) {
        console.log(`找到权限ID ${permId} 对应的代码: ${permission.code}`);
        functionPermissionCodes.push(permission.code);
      } else {
        console.log(`未找到权限ID ${permId} 对应的代码`);
      }
    });
    
    console.log('最终的功能权限代码:', functionPermissionCodes);
    


    setSelectedFunctionPermissions(functionPermissionCodes);
    setPermissionTab('function');
    setIsPermissionDialogOpen(true);
  };

  // 根据权限代码获取权限信息
  const getPermissionByCode = (code: string) => {
    return permissions.find(p => p.code === code) || null;
  };

  // 根据权限代码获取权限ID
  const getPermissionIdByCode = (code: string): string | null => {
    const permission = getPermissionByCode(code);
    return permission ? permission.id : null;
  };

  // 将权限代码数组转换为权限ID数组
  const convertPermissionCodesToIds = (codes: string[]): string[] => {
    return codes
      .map(code => getPermissionIdByCode(code))
      .filter(id => id !== null) as string[];
  };

  // 获取拥有指定角色的用户
  const getRoleUsers = (roleId: string) => {
    // 临时返回空数组，实际项目中应该从用户角色关联表查询
    // 或者从users数据中过滤出拥有该角色的用户
    return [];
  };

  const handleManageMembers = (role: any) => {
    setSelectedRole(role);
    const roleUsers = getRoleUsers(role.id);
    setSelectedMembers(roleUsers.map((u: any) => u.id));
    setIsMemberDialogOpen(true);
  };

  // 获取权限的所有子权限ID
  const getAllChildPermissionIds = (permission: any): string[] => {
    const childIds: string[] = [];
    if (permission.children) {
      permission.children.forEach((child: any) => {
        childIds.push(child.id);
        childIds.push(...getAllChildPermissionIds(child));
      });
    }
    return childIds;
  };

  // 获取权限的所有父权限ID
  const getAllParentPermissionIds = (permissionId: string, allPermissions: any[]): string[] => {
    const parentIds: string[] = [];
    
    const findParents = (perms: any[], targetId: string): boolean => {
      for (const perm of perms) {
        if (perm.id === targetId) {
          return true;
        }
        if (perm.children && findParents(perm.children, targetId)) {
          parentIds.push(perm.id);
          return true;
        }
      }
      return false;
    };
    
    findParents(allPermissions, permissionId);
    return parentIds;
  };

  // 创建角色
  const handleCreateRole = async () => {
    try {
      // 验证必填字段
      if (!newRole.name.trim()) {
        toast({
          title: '请输入角色名称',
          variant: 'destructive',
        });
        return;
      }
      if (!newRole.code.trim()) {
        toast({
          title: '请输入角色编码',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);
      
      const roleData = {
        name: newRole.name.trim(),
        code: newRole.code.trim(),
        description: newRole.description.trim() || undefined,
        is_system: false,
      };

      await roleAPI.create(roleData);
      
      toast({
        title: '角色创建成功',
        description: '新角色已成功创建',
        duration: 2000,
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('创建角色失败:', error);
      toast({
        title: '创建角色失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 更新角色
  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      // 验证必填字段
      if (!editRole.name.trim()) {
        toast({
          title: '请输入角色名称',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);
      
      const roleData = {
        name: editRole.name.trim(),
        description: editRole.description.trim() || undefined,
        status: editRole.status,
      };

      await roleAPI.update(selectedRole.id, roleData);
      
      toast({
        title: '角色更新成功',
        description: '角色信息已成功更新',
        duration: 2000,
      });
      
      setIsEditDialogOpen(false);
      resetEditForm();
      await loadData();
    } catch (error) {
      console.error('更新角色失败:', error);
      toast({
        title: '更新角色失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setNewRole({
      name: '',
      code: '',
      description: ''
    });
  };

  // 重置编辑表单
  const resetEditForm = () => {
    setEditRole({
      name: '',
      description: '',
      status: 'active' as 'active' | 'inactive'
    });
  };

  // 检查是否所有子权限都被选中
  const areAllChildrenSelected = (permission: any): boolean => {
    if (!permission.children || permission.children.length === 0) {
      return true;
    }
    
    return permission.children.every((child: any) => {
      const isChildSelected = selectedFunctionPermissions.includes(child.code);
      const areChildrenSelected = areAllChildrenSelected(child);
      return isChildSelected && areChildrenSelected;
    });
  };

  // 检查是否有部分子权限被选中
  const areSomeChildrenSelected = (permission: any): boolean => {
    if (!permission.children || permission.children.length === 0) {
      return false;
    }
    
    return permission.children.some((child: any) => {
      const isChildSelected = selectedFunctionPermissions.includes(child.code);
      const areSomeChildrenSelectedRecursive = areSomeChildrenSelected(child);
      return isChildSelected || areSomeChildrenSelectedRecursive;
    });
  };

  // 获取复选框状态
  const getCheckboxState = (permission: any): 'checked' | 'unchecked' | 'indeterminate' => {
    const isSelected = selectedFunctionPermissions.includes(permission.code);
    
    if (!permission.children || permission.children.length === 0) {
      return isSelected ? 'checked' : 'unchecked';
    }
    
    const allChildrenSelected = areAllChildrenSelected(permission);
    const someChildrenSelected = areSomeChildrenSelected(permission);
    
    if (isSelected && allChildrenSelected) {
      return 'checked';
    } else if (isSelected || someChildrenSelected) {
      return 'indeterminate';
    } else {
      return 'unchecked';
    }
  };

  const toggleFunctionPermission = (permissionCode: string) => {
    setSelectedFunctionPermissions(prev => {
      const isCurrentlySelected = prev.includes(permissionCode);
      let newPermissions = [...prev];
      
      // 找到当前权限对象
      const findPermission = (perms: any[], code: string): any => {
        for (const perm of perms) {
          if (perm.code === code) return perm;
          if (perm.children) {
            const found = findPermission(perm.children, code);
            if (found) return found;
          }
        }
        return null;
      };
      
      const currentPermission = findPermission(functionPermissions, permissionCode);
      
      if (isCurrentlySelected) {
        // 取消选择：只移除当前权限，不自动移除子权限
        newPermissions = newPermissions.filter(code => code !== permissionCode);
      } else {
        // 选择：只添加当前权限，不自动添加子权限
        newPermissions.push(permissionCode);
      }
      
      return newPermissions;
    });
  };

  // 辅助函数：使用指定的权限列表检查是否所有子权限都被选中
  const areAllChildrenSelectedWithPermissions = (permission: any, permissionsList: string[]): boolean => {
    if (!permission.children || permission.children.length === 0) {
      return true;
    }
    
    return permission.children.every((child: any) => {
      const isChildSelected = permissionsList.includes(child.code);
      const areChildrenSelected = areAllChildrenSelectedWithPermissions(child, permissionsList);
      return isChildSelected && areChildrenSelected;
    });
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 紧凑的权限树渲染函数 - 集中显示
  const renderFunctionPermissionTree = (perms: any[]) => {
    return (
      <div className="space-y-4">
        {perms.map(menuPermission => {
          const menuCheckboxState = getCheckboxState(menuPermission);
          
          return (
            <div key={menuPermission.id} className="border border-border rounded-lg bg-background">
              {/* 菜单级权限 - 紧凑头部 */}
              <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={menuPermission.id}
                    checked={menuCheckboxState === 'checked'}
                    ref={(el) => {
                      if (el && menuCheckboxState === 'indeterminate') {
                        (el as HTMLInputElement).indeterminate = true;
                      }
                    }}
                    onCheckedChange={() => toggleFunctionPermission(menuPermission.code)}
                  />
                  <Label htmlFor={menuPermission.id} className="font-semibold text-foreground cursor-pointer">
                    {menuPermission.name}
                  </Label>
                </div>
                {menuPermission.children && (
                  <Badge variant="outline" className="text-xs">
                    {menuPermission.children.length} 个页面
                  </Badge>
                )}
              </div>

              {/* 页面和按钮级权限 - 紧凑布局 */}
              {menuPermission.children && (
                <div className="p-3 space-y-3">
                  {menuPermission.children.map((pagePermission: any) => {
                    const pageCheckboxState = getCheckboxState(pagePermission);
                    
                    return (
                      <div key={pagePermission.id} className="space-y-2">
                        {/* 页面权限 - 一行显示 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={pagePermission.id}
                              checked={pageCheckboxState === 'checked'}
                              ref={(el) => {
                                if (el && pageCheckboxState === 'indeterminate') {
                                  (el as HTMLInputElement).indeterminate = true;
                                }
                              }}
                              onCheckedChange={() => toggleFunctionPermission(pagePermission.code)}
                            />
                            <Label htmlFor={pagePermission.id} className="font-medium text-foreground cursor-pointer">
                              {pagePermission.name}
                            </Label>
                          </div>
                          {pagePermission.children && pagePermission.children.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {pagePermission.children.length} 个操作
                            </Badge>
                          )}
                        </div>

                        {/* 按钮级权限 - 标签形式紧凑排列 */}
                        {pagePermission.children && pagePermission.children.length > 0 && (
                          <div className="ml-6 flex flex-wrap gap-2">
                            {pagePermission.children.map((buttonPermission: any) => {
                              const buttonCheckboxState = getCheckboxState(buttonPermission);
                              const isSelected = buttonCheckboxState === 'checked';
                              
                              return (
                                <div 
                                  key={buttonPermission.id} 
                                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground border-primary' 
                                      : 'bg-background border-border hover:bg-muted'
                                  }`}
                                  onClick={() => toggleFunctionPermission(buttonPermission.code)}
                                >
                                  <Checkbox
                                    id={buttonPermission.id}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleFunctionPermission(buttonPermission.code)}
                                    className="h-3 w-3"
                                  />
                                  <Label htmlFor={buttonPermission.id} className="text-xs cursor-pointer">
                                    {buttonPermission.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };



  const savePermissions = async () => {
    if (!selectedRole?.id) {
      toast({
        title: '错误',
        description: '未选择角色',
        variant: 'destructive',
        duration: 2000
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // 将权限代码转换为权限ID
      const functionPermissionIds = convertPermissionCodesToIds(selectedFunctionPermissions);
      
      // 合并功能权限并去重
      const allSelectedPermissions = [...new Set([...functionPermissionIds])];
      
      console.log('保存权限:', {
        roleId: selectedRole.id,
        functionPermissions: selectedFunctionPermissions,
        functionPermissionIds,
        allPermissions: allSelectedPermissions
      });

      // 调用API保存权限
      await roleAPI.assignPermissions(selectedRole.id, allSelectedPermissions);
      
      toast({
        title: '权限保存成功',
        description: `已为角色"${selectedRole.name}"分配权限`,
        duration: 2000
      });
      
      // 重新加载数据
      await loadData();
      
      setIsPermissionDialogOpen(false);
    } catch (error) {
      console.error('保存权限失败:', error);
      toast({
        title: '保存失败',
        description: '保存权限时发生错误，请重试',
        variant: 'destructive',
        duration: 2000
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">权限管理</h1>
            <p className="text-muted-foreground mt-1">管理系统角色和权限分配</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增角色
              </Button>
            </DialogTrigger>
            <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-md">
              <DialogHeader>
                <DialogTitle>创建新角色</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roleName">角色名称 *</Label>
                  <Input 
                    id="roleName" 
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入角色名称" 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="roleCode">角色编码 *</Label>
                  <Input 
                    id="roleCode" 
                    value={newRole.code}
                    onChange={(e) => setNewRole(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="请输入角色编码（唯一标识）" 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription">角色描述</Label>
                  <Textarea 
                    id="roleDescription" 
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入角色描述" 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleCreateRole}
                    disabled={submitting}
                  >
                    {submitting ? '创建中...' : '创建'}
                  </Button>
                </div>
              </div>
            </StrictDialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总角色数</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalRoles}</div>
              <p className="text-xs text-muted-foreground">
                启用 {stats.activeRoles} 个
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">功能权限</CardTitle>
              <Monitor className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.functionPermissions}</div>
              <p className="text-xs text-muted-foreground">
                页面功能权限
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">用户分配</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUserRoles}</div>
              <p className="text-xs text-muted-foreground">
                多角色用户 {stats.usersWithMultipleRoles} 个
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索角色名称或编码..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 角色列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">角色列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">角色信息</TableHead>
                  <TableHead className="text-muted-foreground">角色编码</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id} className="border-border">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-foreground font-medium">{role.name}</span>
                        </div>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{role.code}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <PermissionGuard permission="EDIT_PERMISSION">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-border text-muted-foreground hover:bg-accent"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="MANAGE_PERMISSIONS">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            onClick={() => handleManagePermissions(role)}
                          >
                            <Key className="h-3 w-3" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="DELETE_PERMISSION">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center space-x-2">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                  <span>确认删除角色</span>
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除角色 "{role.name}" 吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 创建角色对话框 */}
        <StrictDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新角色</DialogTitle>
              <DialogDescription>
                创建一个新的角色，用于管理用户权限
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">角色名称 *</Label>
                <Input 
                  id="roleName" 
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border text-foreground" 
                />
              </div>
              <div>
                <Label htmlFor="roleCode">角色编码 *</Label>
                <Input 
                  id="roleCode" 
                  value={newRole.code}
                  onChange={(e) => setNewRole(prev => ({ ...prev, code: e.target.value }))}
                  className="bg-background border-border text-foreground" 
                />
                <p className="text-xs text-muted-foreground mt-1">角色编码用于系统识别，创建后不可修改</p>
              </div>
              <div>
                <Label htmlFor="roleDescription">角色描述</Label>
                <Textarea 
                  id="roleDescription" 
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-background border-border text-foreground" 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}>
                  取消
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleCreateRole}
                  disabled={submitting}
                >
                  {submitting ? '创建中...' : '创建角色'}
                </Button>
              </div>
            </div>
          </StrictDialogContent>
        </StrictDialog>

        {/* 编辑角色对话框 */}
        <StrictDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑角色</DialogTitle>
              <DialogDescription>
                修改角色的基本信息
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editRoleName">角色名称 *</Label>
                  <Input 
                    id="editRoleName" 
                    value={editRole.name}
                    onChange={(e) => setEditRole(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="editRoleCode">角色编码</Label>
                  <Input 
                    id="editRoleCode" 
                    value={selectedRole.code}
                    disabled
                    className="bg-muted border-border text-muted-foreground" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">角色编码不可修改</p>
                </div>
                <div>
                  <Label htmlFor="editRoleDescription">角色描述</Label>
                  <Textarea 
                    id="editRoleDescription" 
                    value={editRole.description}
                    onChange={(e) => setEditRole(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="editRoleStatus">状态</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="editRoleStatus"
                      checked={editRole.status === 'active'}
                      onCheckedChange={(checked) => setEditRole(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                    />
                    <Label htmlFor="editRoleStatus" className="text-sm">
                      {editRole.status === 'active' ? '启用' : '禁用'}
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    resetEditForm();
                  }}>
                    取消
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleUpdateRole}
                    disabled={submitting}
                  >
                    {submitting ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            )}
          </StrictDialogContent>
        </StrictDialog>

        {/* 权限管理对话框 */}
        <StrictDialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-6xl max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <span>权限管理 - {selectedRole?.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={permissionTab} onValueChange={setPermissionTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-1 flex-shrink-0">
                <TabsTrigger value="function" className="flex items-center space-x-2">
                  <span>功能权限</span>
                  
                </TabsTrigger>
              </TabsList>

              <TabsContent value="function" className="flex-1 mt-4 overflow-y-auto min-h-0">
                <div className="space-y-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      
                    </div>
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedFunctionPermissions([])}
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        清空选择
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // 递归获取所有权限ID
                          const getAllPermissionIds = (perms: any[]): string[] => {
                            return perms.flatMap(p => [p.code, ...getAllPermissionIds(p.children || [])]);
                          };
                          setSelectedFunctionPermissions(getAllPermissionIds(functionPermissions));
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        全选
                      </Button>
                    </div>
                  </div>
                  <FunctionPermissionTree
                    permissions={functionPermissions}
                    selectedPermissions={selectedFunctionPermissions}
                    onPermissionsChange={setSelectedFunctionPermissions}
                    disabled={submitting}
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">💡 权限选择说明：选择菜单或页面权限时会自动包含其下的所有按钮权限</p>
                    </div>
                  </div>
                </div>
              </TabsContent>


            </Tabs>

            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-border flex-shrink-0">
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                取消
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={savePermissions}
                disabled={submitting}
              >
                <Key className="h-4 w-4 mr-2" />
                {submitting ? '保存中...' : '保存权限配置'}
              </Button>
            </div>
          </StrictDialogContent>
        </StrictDialog>

        {/* 成员管理对话框 */}
        <StrictDialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>成员管理 - {selectedRole?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  已选择 {selectedMembers.length} 个成员
                </p>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedMembers([])}
                  >
                    清空选择
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedMembers(users.map(u => u.id))}
                  >
                    全选
                  </Button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-accent rounded">
                      <Checkbox
                        id={`member-${user.id}`}
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.employee_id}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.primaryDepartment?.name} - {user.position?.name || '未设置职位'}
                        </p>
                        {/* 显示用户当前角色 */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getUserRoles(user.id).map(role => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-border flex-shrink-0">
              <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                取消
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                保存分配
              </Button>
            </div>
          </StrictDialogContent>
        </StrictDialog>
      </div>
    </div>
  );
};

export default Permissions;
