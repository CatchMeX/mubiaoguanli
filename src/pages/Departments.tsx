import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  User as UserIcon,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import DepartmentSelect from '@/components/DepartmentSelect';
import { departmentAPI, userAPI } from '@/services/api';
import { supabase } from '@/lib/supabase';
import type { Department, User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/usePermissions';

const Departments = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<Map<string, User[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 搜索时自动展开匹配的部门路径
  useEffect(() => {
    if (searchTerm.trim()) {
      // 搜索时展开所有匹配的部门路径
      const visibleIds = findMatchingDepartmentsWithParents(departmentList, searchTerm);
      setExpandedDepts(visibleIds);
    } else {
      // 没有搜索时，所有部门都折叠
      setExpandedDepts(new Set());
    }
  }, [searchTerm, departmentList]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [departmentsData, usersData] = await Promise.all([
        // 获取包含经理信息的部门数据
        departmentAPI.getHierarchyWithManager(),
        // 获取用户数据并包含职位信息
        supabase
          .from('users')
          .select(`
            *,
            position:position_names!users_position_id_fkey (*)
          `)
          .then(result => {
            if (result.error) throw result.error;
            return result.data;
          })
      ]);
      setDepartmentList(departmentsData);
      setUsers(usersData);
      
      // 默认所有部门都折叠（包括一级部门）
      setExpandedDepts(new Set());
      
      // 加载每个部门的成员数据
      const membersMap = new Map<string, User[]>();
      await Promise.all(
        departmentsData.map(async (dept) => {
          try {
            const members = await departmentAPI.getDepartmentMembers(dept.id);
            membersMap.set(dept.id, members);
          } catch (err) {
            console.error(`获取部门 ${dept.name} 成员失败:`, err);
            membersMap.set(dept.id, []);
          }
        })
      );
      setDepartmentMembers(membersMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载部门数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 新增部门表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parentId: 'none', // 修复：使用 'none' 而不是空字符串
    managerId: 'none', // 修复：使用 'none' 而不是空字符串
    description: '',
  });

  // 编辑部门表单状态
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    parentId: 'none', // 修复：使用 'none' 而不是空字符串
    managerId: 'none', // 修复：使用 'none' 而不是空字符串
    description: '',
  });

  // 递归查找匹配的部门及其所有父级
  const findMatchingDepartmentsWithParents = (depts: Department[], searchTerm: string): Set<string> => {
    const matchingIds = new Set<string>();
    
    // 如果没有搜索词，返回所有部门
    if (!searchTerm.trim()) {
      return new Set(depts.map(dept => dept.id));
    }
    
    // 找到直接匹配的部门
    const directMatches = depts.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 添加直接匹配的部门
    directMatches.forEach(dept => matchingIds.add(dept.id));
    
    // 为每个匹配的部门添加其所有父级
    const addParentPath = (deptId: string) => {
      const dept = depts.find(d => d.id === deptId);
      if (dept && dept.parent_id) {
        matchingIds.add(dept.parent_id);
        addParentPath(dept.parent_id); // 递归添加父级
      }
    };
    
    directMatches.forEach(dept => addParentPath(dept.id));
    
    // 为每个匹配的部门添加其所有子级
    const addChildrenPath = (deptId: string) => {
      const children = depts.filter(d => d.parent_id === deptId);
      children.forEach(child => {
        matchingIds.add(child.id);
        addChildrenPath(child.id); // 递归添加子级
      });
    };
    
    directMatches.forEach(dept => addChildrenPath(dept.id));
    
    return matchingIds;
  };

  // 获取应该显示的部门ID集合
  const visibleDepartmentIds = findMatchingDepartmentsWithParents(departmentList, searchTerm);

  // 过滤部门 - 只包含可见的部门
  const filteredDepartments = departmentList.filter(dept => 
    visibleDepartmentIds.has(dept.id)
  );

  // 构建树形结构
  const buildDepartmentTree = (depts: Department[], parentId: string | null = null): Department[] => {
    return depts
      .filter(dept => dept.parent_id === parentId)
      .map(dept => ({
        ...dept,
        children: buildDepartmentTree(depts, dept.id)
      }));
  };

  const departmentTree = buildDepartmentTree(filteredDepartments);

  // 切换展开状态
  const toggleExpanded = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  // 获取部门员工数量
  const getDepartmentEmployeeCount = (deptId: string): number => {
    const members = departmentMembers.get(deptId);
    return members ? members.length : 0;
  };

  // 渲染部门成员列表
  const renderDepartmentMembers = (deptId: string, level: number) => {
    const members = departmentMembers.get(deptId) || [];
    
    if (members.length === 0) {
      return null; // 没有成员时不显示任何内容
    }

    return (
      <div className="mt-2" style={{ marginLeft: `${(level + 1) * 24}px` }}>
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => (
            <div key={member.id} className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 hover:bg-blue-100 transition-colors">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span className="font-medium">{member.name}</span>
              <span className="text-blue-500 ml-1">·</span>
              <span className="text-blue-600 ml-1">{member.employee_id}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 高亮匹配的文本
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      parentId: 'none', // 修复：使用 'none' 而不是空字符串
      managerId: 'none', // 修复：使用 'none' 而不是空字符串
      description: '',
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      code: '',
      parentId: 'none', // 修复：使用 'none' 而不是空字符串
      managerId: 'none', // 修复：使用 'none' 而不是空字符串
      description: '',
    });
  };

  // 添加部门
  const addDepartment = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '请输入部门名称',
        description: '请输入部门名称',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.code.trim()) {
      toast({
        title: '请输入部门编码',
        description: '请输入部门编码',
        variant: 'destructive',
      });
      return;
    }

    // 检查编码是否重复
    if (departmentList.some(dept => dept.code === formData.code.trim())) {
      toast({
        title: '部门编码已存在',
        description: '部门编码已存在',
        variant: 'destructive',
      });
      return;
    }

    try {
      await departmentAPI.create({
        name: formData.name.trim(),
        code: formData.code.trim(),
        parent_id: formData.parentId !== 'none' ? formData.parentId : undefined,
        manager_id: formData.managerId !== 'none' ? formData.managerId : undefined,
        description: formData.description.trim()
      });

      await loadData(); // 重新加载数据
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: '部门添加成功',
        description: `部门 "${formData.name}" 已成功添加到系统`,
        duration: 2000,
      });
    } catch (err) {
      console.error('添加部门失败:', err);
      toast({
        title: '添加部门失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 编辑部门
  const editDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setEditFormData({
      name: department.name,
      code: department.code,
      parentId: department.parent_id || 'none', // 修复：处理 null 值
      managerId: department.manager?.id || 'none', // 修复：处理 undefined 值
      description: department.description || '',
    });
    setIsEditDialogOpen(true);
  };

  // 更新部门
  const updateDepartment = async () => {
    if (!selectedDepartment) return;

    if (!editFormData.name.trim()) {
      toast({
        title: '请输入部门名称',
        description: '请输入部门名称',
        variant: 'destructive',
      });
      return;
    }
    if (!editFormData.code.trim()) {
      toast({
        title: '请输入部门编码',
        description: '请输入部门编码',
        variant: 'destructive',
      });
      return;
    }

    // 检查编码是否重复（排除当前部门）
    if (departmentList.some(dept => dept.code === editFormData.code.trim() && dept.id !== selectedDepartment.id)) {
      toast({
        title: '部门编码已存在',
        description: '部门编码已存在',
        variant: 'destructive',
      });
      return;
    }

    try {
      await departmentAPI.update(selectedDepartment.id, {
        name: editFormData.name.trim(),
        code: editFormData.code.trim(),
        parent_id: editFormData.parentId !== 'none' ? editFormData.parentId : undefined,
        manager_id: editFormData.managerId !== 'none' ? editFormData.managerId : undefined,
        description: editFormData.description.trim()
      });

      await loadData(); // 重新加载数据
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      resetEditForm();
      toast({
        title: '部门更新成功',
        description: `部门 "${editFormData.name}" 已成功更新`,
        duration: 2000,
      });
    } catch (err) {
      console.error('更新部门失败:', err);
      toast({
        title: '更新部门失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 删除部门
  const deleteDepartment = async (department: Department) => {
    // 检查是否有子部门
    const hasChildren = departmentList.some(dept => dept.parent_id === department.id);
    if (hasChildren) {
      toast({
        title: '无法删除部门',
        description: '该部门下还有子部门，无法删除',
        variant: 'destructive',
      });
      return;
    }

    // 检查是否有员工
    const employeeCount = getDepartmentEmployeeCount(department.id);
    if (employeeCount > 0) {
      toast({
        title: '无法删除部门',
        description: `该部门下还有 ${employeeCount} 名员工，无法删除`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await departmentAPI.delete(department.id);
      await loadData(); // 重新加载数据
      toast({
        title: '部门删除成功',
        description: `部门 "${department.name}" 已成功删除`,
        duration: 2000,
      });
    } catch (err) {
      console.error('删除部门失败:', err);
      toast({
        title: '删除部门失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 渲染部门树
  const renderDepartmentTree = (depts: Department[], level = 0) => {
    return depts.map(dept => {
      const hasChildren = dept.children && dept.children.length > 0;
      const isExpanded = expandedDepts.has(dept.id);
      const employeeCount = getDepartmentEmployeeCount(dept.id);

      return (
        <div key={dept.id} className="space-y-2">
          <Card className="bg-card border-border theme-transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3" style={{ marginLeft: `${level * 24}px` }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(dept.id)}
                      className="p-1 h-6 w-6 text-muted-foreground hover:bg-accent"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  
                  {isExpanded ? (
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Folder className="h-5 w-5 text-blue-500" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">
                        {highlightMatch(dept.name, searchTerm)}
                      </h3>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {highlightMatch(dept.code, searchTerm)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      {dept.manager && (
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{dept.manager.name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{employeeCount} 人</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <PermissionGuard permission="EDIT_DEPARTMENT">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editDepartment(dept)}
                      className="border-border text-muted-foreground hover:bg-accent"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="DELETE_DEPARTMENT">
                    <DeleteButton
                      onConfirm={() => deleteDepartment(dept)}
                      itemName={dept.name}
                      variant="outline"
                    />
                  </PermissionGuard>
                </div>
              </div>

              {/* 显示部门成员 */}
              {isExpanded && renderDepartmentMembers(dept.id, level)}
            </CardContent>
          </Card>

          {hasChildren && isExpanded && (
            <div className="space-y-2">
              {renderDepartmentTree(dept.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">部门管理</h1>
            <p className="text-muted-foreground mt-1">管理组织架构和部门信息</p>
          </div>
          <PermissionGuard permission="CREATE_DEPARTMENT">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  新增部门
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>添加新部门</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">部门名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入部门名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">部门编码 *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入部门编码"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parent">上级部门</Label>
                    <DepartmentSelect
                      value={formData.parentId === 'none' ? '' : formData.parentId}
                      onValueChange={(value) => setFormData({ ...formData, parentId: value || 'none' })}
                      placeholder="选择上级部门"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager">部门负责人</Label>
                    <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择负责人" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="none">暂无负责人</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.position?.name || '未设置职位'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">部门描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入部门描述"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={addDepartment}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    添加
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </PermissionGuard>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总部门数</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{departmentList.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">一级部门</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {departmentList.filter(d => !d.parent_id).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">有负责人</CardTitle>
              <UserIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {departmentList.filter(d => d.manager).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总员工数</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索部门名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* 部门树 */}
        <div className="space-y-2">
          {departmentTree.length > 0 ? (
            renderDepartmentTree(departmentTree)
          ) : (
            <Card className="bg-card border-border theme-transition">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">暂无部门</h3>
                  <p className="text-muted-foreground">创建第一个部门开始管理组织架构</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 编辑部门对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>编辑部门</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">部门名称 *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入部门名称"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">部门编码 *</Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入部门编码"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-parent">上级部门</Label>
                  <DepartmentSelect
                    value={editFormData.parentId === 'none' ? '' : editFormData.parentId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, parentId: value || 'none' })}
                    placeholder="选择上级部门"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-manager">部门负责人</Label>
                  <Select value={editFormData.managerId} onValueChange={(value) => setEditFormData({ ...editFormData, managerId: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择负责人" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">暂无负责人</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.position?.name || '未设置职位'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">部门描述</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入部门描述"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedDepartment(null);
                    resetEditForm();
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={updateDepartment}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Departments;
