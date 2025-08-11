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

const Permissions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedFunctionPermissions, setSelectedFunctionPermissions] = useState<string[]>([]);
  const [selectedDataPermission, setSelectedDataPermission] = useState<string>('');
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
  const [permissions, setPermissions] = useState<Permission[]>([]);
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
      
      const [rolesData, menuData, usersData] = await Promise.all([
        roleAPI.getRolesWithPermissions(),
        menuAPI.getMenuTree(),
        userAPI.getAll()
      ]);
      
      setRoles(rolesData);
      setUsers(usersData);
      
      // 如果菜单数据为空，显示提示
      if (!menuData || menuData.length === 0) {
        console.log('菜单数据为空，请先执行菜单初始化脚本');
        toast({
          title: '菜单数据未初始化',
          description: '请先在Supabase中执行 scripts/create-menu-system.sql 脚本',
          variant: 'destructive',
          duration: 5000
        });
        // 使用mock数据作为后备
        setPermissions(mockPermissions as any[]);
      } else {
        console.log('成功加载菜单数据:', menuData.length, '个菜单项');
        // 将菜单数据转换为权限数据格式
        const permissionData = flattenMenuToPermissions(menuData);
        setPermissions(permissionData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载数据失败:', err);
      
      toast({
        title: '数据库连接失败',
        description: '正在使用模拟数据，权限保存将无法生效',
        variant: 'destructive',
        duration: 5000
      });
      setPermissions(mockPermissions as any[]);
    } finally {
      setLoading(false);
    }
  };

  // 将菜单树形结构扁平化为权限数组
  const flattenMenuToPermissions = (menuTree: any[]): any[] => {
    const permissions: any[] = [];
    
    const traverse = (menus: any[]) => {
      menus.forEach(menu => {
        permissions.push({
          id: menu.id,
          name: menu.name,
          code: menu.code,
          type: menu.type === 'menu' ? 'function' : 'function',
          level: menu.type === 'menu' ? 'menu' : menu.type === 'page' ? 'page' : 'button',
          module: getModuleFromCode(menu.code),
          description: menu.description,
          parent_id: menu.parent_id,
          children: menu.children || []
        });
        
        if (menu.children && menu.children.length > 0) {
          traverse(menu.children);
        }
      });
    };
    
    traverse(menuTree);
    return permissions;
  };

  // 根据code推断模块名
  const getModuleFromCode = (code: string): string => {
    if (code.includes('ORGANIZATION') || code.includes('DEPT') || code.includes('TEAM') || code.includes('PERM') || code.includes('MEMBER')) {
      return 'organization';
    } else if (code.includes('CUSTOMER') || code.includes('SUPPLIER') || code.includes('PROJECT')) {
      return 'basic_data';
    } else if (code.includes('TASK')) {
      return 'tasks';
    } else if (code.includes('GOAL') || code.includes('COMPANY') || code.includes('PERSONAL')) {
      return 'goals';
    } else if (code.includes('FINANCE') || code.includes('COST') || code.includes('REVENUE') || code.includes('EXPENSE')) {
      return 'finance';
    } else if (code.includes('ASSET') || code.includes('MAINTENANCE')) {
      return 'assets';
    }
    return 'system';
  };

  // 构建权限树形结构
  const buildPermissionTree = (perms: any[]): any[] => {
    const permMap = new Map();
    const tree: any[] = [];
    
    // 创建权限映射表
    perms.forEach(perm => {
      permMap.set(perm.id, { ...perm, children: [] });
    });
    
    // 构建树形结构
    perms.forEach(perm => {
      const permNode = permMap.get(perm.id);
      if (perm.parent_id && permMap.has(perm.parent_id)) {
        // 有父级，添加到父级的children中
        permMap.get(perm.parent_id).children.push(permNode);
      } else {
        // 没有父级，是根节点
        tree.push(permNode);
      }
    });
    
    return tree;
  };

  // 分离功能权限和数据权限（基于module字段）
  const allFunctionPermissions = permissions.filter(p => p.module !== 'data');
  const functionPermissions = menuAPI ? buildPermissionTreeFromMenus() : buildPermissionTree(allFunctionPermissions);
  const dataPermissions = permissions.filter(p => p.module === 'data');

  // 从菜单数据构建权限树（数据已经是树形结构）
  function buildPermissionTreeFromMenus(): any[] {
    // 如果权限数据来自菜单API，直接使用树形结构
    const menuTree: any[] = [];
    const processedIds = new Set();
    
    permissions.forEach(perm => {
      if (!perm.parent_id && !processedIds.has(perm.id) && perm.module !== 'data') {
        // 这是根节点（菜单级），递归构建其子树
        const menuNode = buildMenuNode(perm, permissions);
        if (menuNode) {
          menuTree.push(menuNode);
          markProcessed(menuNode, processedIds);
        }
      }
    });
    
    return menuTree;
  }

  // 构建菜单节点及其子节点
  function buildMenuNode(menu: any, allPerms: any[]): any | null {
    const children = allPerms.filter(p => p.parent_id === menu.id);
    const menuNode = {
      ...menu,
      children: children.length > 0 ? children.map(child => buildMenuNode(child, allPerms)).filter(Boolean) : []
    };
    return menuNode;
  }

  // 标记已处理的节点
  function markProcessed(node: any, processedIds: Set<string>) {
    processedIds.add(node.id);
    if (node.children) {
      node.children.forEach((child: any) => markProcessed(child, processedIds));
    }
  }

  // 计算统计信息
  const stats = {
    totalRoles: roles.length,
    activeRoles: roles.filter((r: any) => r.status === 'active').length,
    totalPermissions: permissions.length,
    functionPermissions: allFunctionPermissions.length,
    dataPermissions: dataPermissions.length,
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
    
    // 分离当前角色的功能权限和数据权限
    const roleFunctionPermissions = rolePermissionIds.filter((permId: string) => 
      functionPermissions.some(p => p.id === permId || p.children?.some(c => c.id === permId || c.children?.some(cc => cc.id === permId)))
    );
    
    const roleDataPermissions = rolePermissionIds.filter((permId: string) => 
      dataPermissions.some(p => p.id === permId || p.children?.some(c => c.id === permId))
    );

    setSelectedFunctionPermissions(roleFunctionPermissions);
    // 数据权限只取第一个（单选）
    setSelectedDataPermission(roleDataPermissions[0] || '');
    setPermissionTab('function');
    setIsPermissionDialogOpen(true);
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
      const isChildSelected = selectedFunctionPermissions.includes(child.id);
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
      const isChildSelected = selectedFunctionPermissions.includes(child.id);
      const areSomeChildrenSelectedRecursive = areSomeChildrenSelected(child);
      return isChildSelected || areSomeChildrenSelectedRecursive;
    });
  };

  // 获取复选框状态
  const getCheckboxState = (permission: any): 'checked' | 'unchecked' | 'indeterminate' => {
    const isSelected = selectedFunctionPermissions.includes(permission.id);
    
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

  const toggleFunctionPermission = (permissionId: string) => {
    setSelectedFunctionPermissions(prev => {
      const isCurrentlySelected = prev.includes(permissionId);
      let newPermissions = [...prev];
      
      // 找到当前权限对象
      const findPermission = (perms: any[], id: string): any => {
        for (const perm of perms) {
          if (perm.id === id) return perm;
          if (perm.children) {
            const found = findPermission(perm.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const currentPermission = findPermission(functionPermissions, permissionId);
      
      if (isCurrentlySelected) {
        // 取消选择：移除当前权限和所有子权限
        newPermissions = newPermissions.filter(id => id !== permissionId);
        if (currentPermission) {
          const childIds = getAllChildPermissionIds(currentPermission);
          newPermissions = newPermissions.filter(id => !childIds.includes(id));
        }
      } else {
        // 选择：添加当前权限和所有子权限
        newPermissions.push(permissionId);
        if (currentPermission) {
          const childIds = getAllChildPermissionIds(currentPermission);
          childIds.forEach(childId => {
            if (!newPermissions.includes(childId)) {
              newPermissions.push(childId);
            }
          });
        }
        
        // 检查是否需要自动选择父权限
        const parentIds = getAllParentPermissionIds(permissionId, functionPermissions);
        parentIds.forEach(parentId => {
          const parentPermission = findPermission(functionPermissions, parentId);
          if (parentPermission) {
            // 临时更新权限列表来检查父权限状态
            const tempPermissions = [...newPermissions];
            const allChildrenWillBeSelected = parentPermission.children?.every((child: any) => {
              return tempPermissions.includes(child.id) && areAllChildrenSelectedWithPermissions(child, tempPermissions);
            });
            
            if (allChildrenWillBeSelected && !newPermissions.includes(parentId)) {
              newPermissions.push(parentId);
            }
          }
        });
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
      const isChildSelected = permissionsList.includes(child.id);
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
                        el.indeterminate = true;
                      }
                    }}
                    onCheckedChange={() => toggleFunctionPermission(menuPermission.id)}
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
                                  el.indeterminate = true;
                                }
                              }}
                              onCheckedChange={() => toggleFunctionPermission(pagePermission.id)}
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
                                  onClick={() => toggleFunctionPermission(buttonPermission.id)}
                                >
                                  <Checkbox
                                    id={buttonPermission.id}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleFunctionPermission(buttonPermission.id)}
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

  // 渲染数据权限选项
  const renderDataPermissionOptions = () => {
    // 直接渲染所有数据权限，不需要父子关系
    const dataPerms = dataPermissions.filter(p => p.module === 'data');
    
    return dataPerms.map(permission => (
      <div key={permission.id}>
        <div className="flex items-center space-x-2 py-2">
          <RadioGroupItem 
            value={permission.id} 
            id={permission.id}
          />
          <Label htmlFor={permission.id} className="flex items-center space-x-2 cursor-pointer">
            <span>{permission.name}</span>
            {permission.description && (
              <span className="text-xs text-muted-foreground">({permission.description})</span>
            )}
          </Label>
        </div>
      </div>
    ));
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
      
      // 合并功能权限和数据权限
      const allSelectedPermissions = [...selectedFunctionPermissions];
      if (selectedDataPermission) {
        allSelectedPermissions.push(selectedDataPermission);
      }
      
      console.log('保存权限:', {
        roleId: selectedRole.id,
        functionPermissions: selectedFunctionPermissions,
        dataPermission: selectedDataPermission,
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
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-md">
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
            </DialogContent>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">数据权限</CardTitle>
              <Database className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.dataPermissions}</div>
              <p className="text-xs text-muted-foreground">
                数据访问权限
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
                  <TableHead className="text-muted-foreground">类型</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">关联成员</TableHead>
                  <TableHead className="text-muted-foreground">更新时间</TableHead>
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
                    <TableCell>{getRoleTypeBadge(role)}</TableCell>
                    <TableCell>{getStatusBadge(role.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{role.memberCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(role.updatedAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-border text-muted-foreground hover:bg-accent"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          onClick={() => handleManagePermissions(role)}
                        >
                          <Key className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                          onClick={() => handleManageMembers(role)}
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                        {!role.isProtected && (
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
                                  {role.memberCount > 0 && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                                      该角色还有 {role.memberCount} 个关联成员，请先解除关联。
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={role.memberCount > 0}
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑角色对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-md">
            <DialogHeader>
              <DialogTitle>编辑角色</DialogTitle>
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
          </DialogContent>
        </Dialog>

        {/* 权限管理对话框 */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <span>权限管理 - {selectedRole?.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={permissionTab} onValueChange={setPermissionTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="function" className="flex items-center space-x-2">
                  <span>功能权限</span>
                  <Badge variant="secondary" className="ml-1">
                    {selectedFunctionPermissions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center space-x-2">
                  <span>数据权限</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="function" className="flex-1 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">功能权限配置</span>
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        已选择 {selectedFunctionPermissions.length} 个
                      </Badge>
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
                            return perms.flatMap(p => [p.id, ...getAllPermissionIds(p.children || [])]);
                          };
                          setSelectedFunctionPermissions(getAllPermissionIds(functionPermissions));
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        全选
                      </Button>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-4 max-h-96 overflow-y-auto bg-background">
                    {renderFunctionPermissionTree(functionPermissions)}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Monitor className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">权限选择说明：</p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>级联选择</strong>：选择上级权限时会自动选择所有下级权限</li>
                          <li>• <strong>级联取消</strong>：取消上级权限时会自动取消所有下级权限</li>
                          <li>• <strong>半选状态</strong>：当部分子权限被选中时，父权限显示为半选状态</li>
                          <li>• <strong>权限层级</strong>：菜单 → 页面 → 按钮，三级权限体系</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="flex-1 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">数据权限配置</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDataPermission('')}
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      清空选择
                    </Button>
                  </div>
                  <div className="border border-border rounded-lg p-4 max-h-80 overflow-y-auto bg-background">
                    <RadioGroup value={selectedDataPermission} onValueChange={setSelectedDataPermission}>
                      {renderDataPermissionOptions()}
                    </RadioGroup>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Database className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">数据权限说明：</p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>全部数据</strong>：可访问系统中的所有数据</li>
                          <li>• <strong>本部门数据</strong>：只能访问所属部门的数据</li>
                          <li>• <strong>本团队数据</strong>：只能访问所属团队的数据</li>
                          <li>• <strong>个人数据</strong>：只能访问个人相关的数据</li>
                          <li>• <strong>注意</strong>：每个角色只能选择一种数据权限范围</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-border">
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
          </DialogContent>
        </Dialog>

        {/* 成员管理对话框 */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>成员管理 - {selectedRole?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                            {user.employeeId}
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
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                  取消
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  保存分配
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Permissions;
