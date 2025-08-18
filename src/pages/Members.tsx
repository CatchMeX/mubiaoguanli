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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  UserCheck, 
  AlertTriangle,
  Save,
  X,
  Crown,
  Lock,
  Settings,
  Key,
  Mail,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { userAPI, departmentAPI, positionAPI, jobLevelAPI, roleAPI } from '@/services/api';
import { jobLevelNamesAPI } from '@/services/memberSettingsAPI';
// 保留mock数据导入，但添加真实角色数据状态
import { roles as mockRoles, getUserRoles, userRoles } from '@/data/mockdatarbac';
import MemberSettings from '@/components/MemberSettings';
import DepartmentSelect from '@/components/DepartmentSelect';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/usePermissions';

const Members = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);
  // 添加真实角色数据状态
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCardFilter, setSelectedCardFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isMemberSettingsOpen, setIsMemberSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // 重置密码相关状态
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { resetPassword, changePassword } = useAuth();

  // 处理统计卡片点击
  const handleCardClick = (status: string | null) => {
    if (selectedCardFilter === status) {
      // 如果点击的是当前选中的卡片，则取消筛选
      setSelectedCardFilter(null);
    } else {
      // 否则设置新的筛选
      setSelectedCardFilter(status);
    }
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedCardFilter(null);
    setSelectedDepartment('all');
    setSearchTerm('');
  };

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用带关联数据的API，并添加角色数据加载
      const [usersData, departmentsData, positionsData, jobLevelsData, rolesData] = await Promise.all([
        userAPI.getUsersWithRelations(),
        departmentAPI.getAll(),
        positionAPI.getActivePositionNames(), // 使用新的API
        jobLevelAPI.getActiveJobLevelNames(),
        roleAPI.getAll() // 加载真实角色数据
      ]);
      
      // 为每个用户获取角色信息
      const usersWithRoles = await Promise.all(
        usersData.map(async (user) => {
          try {
            const userRoles = await roleAPI.getUserRoles(user.id);
            return {
              ...user,
              user_roles: userRoles
            };
          } catch (error) {
            console.error(`获取用户 ${user.id} 的角色失败:`, error);
            return {
              ...user,
              user_roles: []
            };
          }
        })
      );
      
      setUsers(usersWithRoles);
      setDepartments(departmentsData);
      setPositions(positionsData);
      setJobLevels(jobLevelsData);
      setRoles(rolesData); // 设置真实角色数据
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载成员数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    employeeId: '',
    positionId: '',
    jobLevelId: '',
    departmentId: '',
    joinDate: '',
    baseSalary: '',
    bonus: '',
    performancePay: '',
    status: 'active',
    email: '',
    phone: ''
  });

  // 新增表单状态
  const [addForm, setAddForm] = useState({
    name: '',
    employeeId: '',
    positionId: '',
    jobLevelId: '',
    departmentId: '',
    joinDate: '',
    baseSalary: '',
    bonus: '',
    performancePay: '',
    status: 'active',
    email: '',
    phone: ''
  });

  // 自动生成工号函数
  const generateEmployeeId = () => {
    // 获取所有现有的工号
    const existingEmployeeIds = users
      .map(user => user.employee_id)
      .filter(id => id && id.startsWith('EMP'))
      .map(id => {
        const match = id.match(/^EMP(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    // 找到最大的数字
    const maxNumber = existingEmployeeIds.length > 0 ? Math.max(...existingEmployeeIds) : 0;
    
    // 生成下一个工号
    const nextNumber = maxNumber + 1;
    const newEmployeeId = `EMP${nextNumber.toString().padStart(4, '0')}`;
    
    return newEmployeeId;
  };

  // 处理职级选择变化，自动填充薪资信息
  const handleJobLevelChange = async (jobLevelId: string, isAddForm: boolean = true) => {
    if (!jobLevelId) {
      // 如果清空职级选择，清空薪资字段
      if (isAddForm) {
        setAddForm(prev => ({ 
          ...prev, 
          jobLevelId: '',
          baseSalary: '',
          performancePay: ''
        }));
      } else {
        setEditForm(prev => ({ 
          ...prev, 
          jobLevelId: '',
          baseSalary: '',
          performancePay: ''
        }));
      }
      return;
    }

    try {
      // 获取职级详细信息
      const jobLevel = await jobLevelNamesAPI.getJobLevelById(jobLevelId);
      
      if (jobLevel) {
        if (isAddForm) {
          setAddForm(prev => ({ 
            ...prev, 
            jobLevelId,
            baseSalary: jobLevel.base_salary ? jobLevel.base_salary.toString() : '',
            performancePay: jobLevel.performance_salary ? jobLevel.performance_salary.toString() : ''
          }));
        } else {
          setEditForm(prev => ({ 
            ...prev, 
            jobLevelId,
            baseSalary: jobLevel.base_salary ? jobLevel.base_salary.toString() : '',
            performancePay: jobLevel.performance_salary ? jobLevel.performance_salary.toString() : ''
          }));
        }
      }
    } catch (error) {
      console.error('获取职级信息失败:', error);
      // 如果获取失败，只设置职级ID，不填充薪资
      if (isAddForm) {
        setAddForm(prev => ({ ...prev, jobLevelId }));
      } else {
        setEditForm(prev => ({ ...prev, jobLevelId }));
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
                             user.primary_department_id === selectedDepartment;
    const matchesStatus = !selectedCardFilter || user.status === selectedCardFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-600 text-white">在职</Badge>
    ) : (
      <Badge variant="destructive">离职</Badge>
    );
  };

  const getRoleBadge = (role: any) => {
    // 处理真实角色数据，可能没有isProtected和isSystem字段
    const isProtected = role.is_protected || role.isProtected;
    const isSystem = role.is_system || role.isSystem;
    
    if (isProtected) {
      return (
        <Badge className="bg-red-600 text-white">
          <Crown className="w-3 h-3 mr-1" />
          {role.name}
        </Badge>
      );
    }
    if (isSystem) {
      return (
        <Badge className="bg-blue-600 text-white">
          <Lock className="w-3 h-3 mr-1" />
          {role.name}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <UserCheck className="w-3 h-3 mr-1" />
        {role.name}
      </Badge>
    );
  };

  // 获取用户的角色
  const getUserRolesList = async (userId: string) => {
    try {
      // 优先使用真实API获取用户角色
      if (roles.length > 0) {
        const userRoles = await roleAPI.getUserRoles(userId);
        return userRoles.map((ur: any) => ur.role).filter(Boolean);
      }
      // 如果真实角色数据未加载，回退到mock数据
      return getUserRoles(userId);
    } catch (error) {
      console.error('获取用户角色失败:', error);
      // 回退到mock数据
      return getUserRoles(userId);
    }
  };

  // 处理编辑按钮点击
  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name || '',
      employeeId: member.employee_id || '',
      positionId: member.position_id || '',
      jobLevelId: member.job_level_id || '',
      departmentId: member.primary_department_id || '',
      joinDate: member.join_date || '',
      baseSalary: member.base_salary ? member.base_salary.toString() : '',
      bonus: member.bonus ? member.bonus.toString() : '',
      performancePay: member.performance_pay ? member.performance_pay.toString() : '',
      status: member.status || 'active',
      email: member.email || '',
      phone: member.phone || ''
    });
    setIsEditDialogOpen(true);
  };

  // 处理角色管理按钮点击
  const handleManageRoles = async (member: any) => {
    setSelectedMember(member);
    try {
      const memberRoles = await getUserRolesList(member.id);
      setSelectedRoles(memberRoles.map(role => role.id));
      setIsRoleDialogOpen(true);
    } catch (error) {
      console.error('获取用户角色失败:', error);
      toast({
        title: '获取用户角色失败',
        description: '无法加载用户当前角色信息',
        variant: 'destructive',
      });
    }
  };

  // 处理角色选择
  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedMember) return;

    try {
      const updateData = {
        name: editForm.name,
        employee_id: editForm.employeeId,
        position_id: editForm.positionId || undefined,
        job_level_id: editForm.jobLevelId || undefined,
        base_salary: editForm.baseSalary ? parseFloat(editForm.baseSalary) : undefined,
        bonus: editForm.bonus ? parseFloat(editForm.bonus) : undefined,
        performance_pay: editForm.performancePay ? parseFloat(editForm.performancePay) : undefined,
        join_date: editForm.joinDate || undefined,
        status: (editForm.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        email: editForm.email || undefined,
        phone: editForm.phone || undefined
      };

      await userAPI.update(selectedMember.id, updateData);
      
      // 如果更新了部门，需要更新user_departments关联表
      if (editForm.departmentId && editForm.departmentId !== selectedMember.primary_department_id) {
        await userAPI.updateUserDepartments(selectedMember.id, [editForm.departmentId], editForm.departmentId);
      }
      
      await loadData(); // 重新加载数据
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: "更新成功",
        description: `成员 "${editForm.name}" 的信息已成功更新`,
        variant: "default",
      });
    } catch (err) {
      console.error('更新成员信息失败:', err);
      toast({
        title: '更新成员信息失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 保存角色分配
  const handleSaveRoles = async () => {
    if (!selectedMember) return;

    try {
      // 获取用户当前的角色
      const currentUserRoles = await roleAPI.getUserRoles(selectedMember.id);
      const currentRoleIds = currentUserRoles.map((ur: any) => ur.role_id);
      
      // 计算需要添加和移除的角色
      const rolesToAdd = selectedRoles.filter(roleId => !currentRoleIds.includes(roleId));
      const rolesToRemove = currentRoleIds.filter(roleId => !selectedRoles.includes(roleId));
      
      // 移除不需要的角色
      for (const roleId of rolesToRemove) {
        await roleAPI.removeUserRole(selectedMember.id, roleId);
      }
      
      // 添加新的角色
      for (const roleId of rolesToAdd) {
        await roleAPI.assignUserRole(selectedMember.id, roleId);
      }
      
      // 重新加载数据以更新显示
      await loadData();
      
      setIsRoleDialogOpen(false);
      setSelectedMember(null);
      setSelectedRoles([]);
      
      toast({
        title: "角色分配成功",
        description: `已成功为 "${selectedMember.name}" 分配角色`,
        variant: "default",
      });
    } catch (err) {
      console.error('保存角色分配失败:', err);
      toast({
        title: '保存角色分配失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 保存新增成员
  const handleSaveAdd = async () => {
          if (!addForm.name || !addForm.departmentId) {
      toast({
        title: '请填写必填信息',
        description: '请填写必填信息',
        variant: 'destructive',
      });
      return;
    }

    try {
      const createData = {
        name: addForm.name,
        employee_id: addForm.employeeId,
        position_id: addForm.positionId || undefined,
        job_level_id: addForm.jobLevelId || undefined,
        base_salary: addForm.baseSalary ? parseFloat(addForm.baseSalary) : undefined,
        bonus: addForm.bonus ? parseFloat(addForm.bonus) : undefined,
        performance_pay: addForm.performancePay ? parseFloat(addForm.performancePay) : undefined,
        join_date: addForm.joinDate || undefined,
        status: (addForm.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        email: addForm.email || undefined,
        phone: addForm.phone || undefined
      };

      const newUser = await userAPI.create(createData);
      
      // 创建部门关联关系
      if (addForm.departmentId) {
        await userAPI.updateUserDepartments(newUser.id, [addForm.departmentId], addForm.departmentId);
      }
      
      await loadData(); // 重新加载数据
      setIsAddDialogOpen(false);
      toast({
        title: "添加成功",
        description: `成员 "${addForm.name}" 已成功添加到系统`,
        variant: "default",
      });
              setAddForm({
          name: '',
          employeeId: generateEmployeeId(),
          positionId: '',
          jobLevelId: '',
          departmentId: '',
          joinDate: '',
          baseSalary: '',
          bonus: '',
          performancePay: '',
          status: 'active',
          email: '',
          phone: ''
        });
    } catch (err) {
      console.error('添加成员失败:', err);
      toast({
        title: '添加成员失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 删除成员
  const handleDeleteMember = async (member: any) => {
    try {
      await userAPI.delete(member.id);
      await loadData(); // 重新加载数据
      toast({
        title: "删除成功",
        description: `成员 "${member.name}" 已成功删除`,
        variant: "default",
      });
    } catch (err) {
      console.error('删除成员失败:', err);
      toast({
        title: '删除成员失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 重置密码处理函数
  const handleResetPassword = async (user: any) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsResetPasswordOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: '密码不一致',
        description: '两次输入的密码不一致，请重新输入',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: '密码长度不足',
        description: '密码长度至少需要6位',
        variant: 'destructive',
      });
      return;
    }

    setResetPasswordLoading(true);
    try {
      // 使用真正的API调用来重置密码
      const success = await changePassword(resetPasswordUser.id, newPassword);
      
      if (success) {
        toast({
        title: "密码重置成功",
        description: `用户 "${resetPasswordUser.name}" 的密码已成功重置`,
        variant: "default",
      });
        setIsResetPasswordOpen(false);
        setResetPasswordUser(null);
        setNewPassword('');
        setConfirmPassword('');
        
        // 重新加载数据但不设置筛选
        await loadData();
      } else {
        toast({
          title: '密码重置失败',
          description: '密码重置失败，请稍后重试',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('重置密码失败:', err);
      toast({
        title: '密码重置失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // 如果正在显示成员设置页面
  if (isMemberSettingsOpen) {
    return (
      <div className="min-h-screen bg-background theme-transition">
        <MemberSettings onClose={() => setIsMemberSettingsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">成员管理</h1>
            <p className="text-muted-foreground mt-1">管理组织成员信息和权限</p>
          </div>
          <div className="flex space-x-2">
            <PermissionGuard permission="MEMBER_SETTINGS">
              <Button 
                variant="outline"
                onClick={() => setIsMemberSettingsOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                设置
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="CREATE_MEMBER">
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (open) {
                  // 打开对话框时自动生成工号
                  const newEmployeeId = generateEmployeeId();
                  setAddForm(prev => ({ ...prev, employeeId: newEmployeeId }));
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    新增成员
                  </Button>
                </DialogTrigger>
              <DialogContent className="bg-popover border-border text-popover-foreground max-w-3xl">
                <DialogHeader>
                  <DialogTitle>添加新成员</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addName">
                        姓名 <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="addName" 
                        value={addForm.name}
                        onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="addEmployeeId">
                        工号 <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="addEmployeeId" 
                        value={addForm.employeeId}
                        onChange={(e) => setAddForm(prev => ({ ...prev, employeeId: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                        placeholder="工号将自动生成"
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        工号将自动生成，格式为 EMP + 四位数字
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addEmail">邮箱</Label>
                      <Input 
                        id="addEmail"
                        type="email"
                        value={addForm.email}
                        onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="addPhone">手机号</Label>
                      <Input 
                        id="addPhone"
                        value={addForm.phone}
                        onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addPosition">职位</Label>
                      <Select value={addForm.positionId} onValueChange={(value) => setAddForm(prev => ({ ...prev, positionId: value }))}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="选择职位" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {positions.map(position => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="addJobLevel">职级</Label>
                      <Select value={addForm.jobLevelId} onValueChange={(value) => handleJobLevelChange(value, true)}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="选择职级" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {jobLevels.map(level => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addDepartment">
                        部门 <span className="text-red-500">*</span>
                      </Label>
                      <DepartmentSelect
                        value={addForm.departmentId}
                        onValueChange={(value) => setAddForm(prev => ({ ...prev, departmentId: value }))}
                        placeholder="选择部门"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addJoinDate">
                        入职日期 <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="addJoinDate" 
                        type="date" 
                        value={addForm.joinDate}
                        onChange={(e) => setAddForm(prev => ({ ...prev, joinDate: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="addBaseSalary">
                        基本薪资 <span className="text-red-500">*</span>
                        {addForm.jobLevelId && (
                          <span className="text-xs text-blue-500 ml-1">(自动填充)</span>
                        )}
                      </Label>
                      <Input 
                        id="addBaseSalary" 
                        type="number" 
                        value={addForm.baseSalary}
                        onChange={(e) => setAddForm(prev => ({ ...prev, baseSalary: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                        placeholder="基本薪资"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addBonus">奖金</Label>
                      <Input 
                        id="addBonus" 
                        type="number" 
                        value={addForm.bonus}
                        onChange={(e) => setAddForm(prev => ({ ...prev, bonus: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                        placeholder="奖金"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addPerformancePay">
                        绩效
                        {addForm.jobLevelId && (
                          <span className="text-xs text-blue-500 ml-1">(自动填充)</span>
                        )}
                      </Label>
                      <Input 
                        id="addPerformancePay" 
                        type="number" 
                        value={addForm.performancePay}
                        onChange={(e) => setAddForm(prev => ({ ...prev, performancePay: e.target.value }))}
                        className="bg-background border-border text-foreground" 
                        placeholder="绩效"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="addStatus" 
                      checked={addForm.status === 'active'}
                      onCheckedChange={(checked) => setAddForm(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                    />
                    <Label htmlFor="addStatus">在职状态</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      <X className="mr-2 h-4 w-4" />
                      取消
                    </Button>
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleSaveAdd}
                      disabled={!addForm.name || !addForm.departmentId}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      添加
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </PermissionGuard>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总员工数</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
            </CardContent>
          </Card>
          <Card 
            className={`bg-card border-border theme-transition cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCardFilter === 'active' ? 'ring-2 ring-green-500 bg-green-500/5' : ''
            }`}
            onClick={() => handleCardClick('active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">在职员工</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">部门数量</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{departments.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均薪资</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(() => {
                  const usersWithSalary = users.filter(u => (u.base_salary || u.bonus || u.performance_pay) != null);
                  if (usersWithSalary.length === 0) return '0';
                  const avgSalary = Math.round(usersWithSalary.reduce((sum, u) => {
                    const totalSalary = (u.base_salary || 0) + (u.bonus || 0) + (u.performance_pay || 0);
                    return sum + totalSalary;
                  }, 0) / usersWithSalary.length);
                  return avgSalary.toLocaleString();
                })()}
              </div>
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
                  placeholder="搜索姓名或工号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(selectedCardFilter || searchTerm || selectedDepartment !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  className="bg-background border-border text-foreground"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  清除筛选
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 成员列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">成员列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">成员</TableHead>
                  <TableHead className="text-muted-foreground">工号</TableHead>
                  <TableHead className="text-muted-foreground">职位</TableHead>
                  <TableHead className="text-muted-foreground">职级</TableHead>
                  <TableHead className="text-muted-foreground">部门</TableHead>
                  <TableHead className="text-muted-foreground">角色</TableHead>
                  <TableHead className="text-muted-foreground">入职日期</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">薪资</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  // 从用户数据中获取角色信息，避免异步调用
                  const userRolesList = user.user_roles ? user.user_roles.map((ur: any) => ur.role).filter(Boolean) : [];
                  return (
                    <TableRow key={user.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-foreground font-medium">{user.name || '未知'}</div>
                            <div className="text-xs text-muted-foreground">{user.email || '无邮箱'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.employee_id || '未设置'}</TableCell>
                      <TableCell>
                        {user.position_name ? (
                          <Badge variant="outline" className="border-primary text-primary">
                            {user.position_name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            未设置
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.job_level_name ? (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            {user.job_level_name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            未设置
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.primary_department_name || '未设置'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userRolesList.length > 0 ? (
                            userRolesList.slice(0, 2).map((role: any) => (
                              <div key={role.id}>
                                {getRoleBadge(role)}
                              </div>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              无角色
                            </Badge>
                          )}
                          {userRolesList.length > 2 && (
                            <Badge variant="outline" className="text-muted-foreground">
                              +{userRolesList.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.join_date || '未设置'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="text-sm">
                          <div>基本: ¥{(user.base_salary || 0).toLocaleString()}</div>
                          <div>奖金: ¥{(user.bonus || 0).toLocaleString()}</div>
                          <div>绩效: ¥{(user.performance_pay || 0).toLocaleString()}</div>
                          <div className="font-medium">
                            总计: ¥{((user.base_salary || 0) + (user.bonus || 0) + (user.performance_pay || 0)).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <PermissionGuard permission="EDIT_MEMBER">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-border text-muted-foreground hover:bg-accent"
                              onClick={() => handleEditMember(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="MANAGE_MEMBER_ROLES">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                              onClick={() => handleManageRoles(user)}
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="RESET_PASSWORD">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                              onClick={() => handleResetPassword(user)}
                              title="重置密码"
                            >
                              <Key className="h-3 w-3" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="DELETE_MEMBER">
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
                                    <AlertTriangle className="h-5 w-3" />
                                    <span>确认删除成员</span>
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确定要删除成员 "{user.name}" 吗？此操作不可撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDeleteMember(user)}
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑成员对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-3xl">
            <DialogHeader>
              <DialogTitle>编辑成员信息</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editName">
                      姓名 <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="editName" 
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEmployeeId">
                      工号 <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="editEmployeeId" 
                      value={editForm.employeeId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEmail">邮箱</Label>
                    <Input 
                      id="editEmail"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhone">手机号</Label>
                    <Input 
                      id="editPhone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPosition">职位</Label>
                    <Select value={editForm.positionId} onValueChange={(value) => setEditForm(prev => ({ ...prev, positionId: value }))}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择职位" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {positions.map(position => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editJobLevel">职级</Label>
                    <Select value={editForm.jobLevelId} onValueChange={(value) => handleJobLevelChange(value, false)}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择职级" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {jobLevels.map(level => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editDepartment">部门</Label>
                    <DepartmentSelect
                      value={editForm.departmentId}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, departmentId: value }))}
                      placeholder="选择部门"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editJoinDate">
                      入职日期 <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="editJoinDate" 
                      type="date" 
                      value={editForm.joinDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, joinDate: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editBaseSalary">
                      基本薪资
                      {editForm.jobLevelId && (
                        <span className="text-xs text-blue-500 ml-1">(自动填充)</span>
                      )}
                    </Label>
                    <Input 
                      id="editBaseSalary" 
                      type="number" 
                      value={editForm.baseSalary}
                      onChange={(e) => setEditForm(prev => ({ ...prev, baseSalary: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                      placeholder="基本薪资"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBonus">奖金</Label>
                    <Input 
                      id="editBonus" 
                      type="number" 
                      value={editForm.bonus}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bonus: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                      placeholder="奖金"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPerformancePay">
                      绩效
                      {editForm.jobLevelId && (
                        <span className="text-xs text-blue-500 ml-1">(自动填充)</span>
                      )}
                    </Label>
                    <Input 
                      id="editPerformancePay" 
                      type="number" 
                      value={editForm.performancePay}
                      onChange={(e) => setEditForm(prev => ({ ...prev, performancePay: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                      placeholder="绩效"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="editStatus" 
                    checked={editForm.status === 'active'}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                  />
                  <Label htmlFor="editStatus">在职状态</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSaveEdit}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 角色管理对话框 */}
        <StrictDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>角色管理 - {selectedMember?.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  已选择 {selectedRoles.length} 个角色
                </p>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedRoles([])}
                  >
                    清空选择
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedRoles(roles.filter(r => r.status === 'active').map(r => r.id))}
                  >
                    全选
                  </Button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  {roles.filter(role => role.status === 'active').map(role => (
                    <div key={role.id} className="flex items-center space-x-3 p-3 hover:bg-accent rounded border border-border">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(role)}
                          <code className="text-xs bg-muted px-2 py-1 rounded">{role.code || role.name}</code>
                        </div>
                        {role.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">角色分配说明：</p>
                    <ul className="text-xs space-y-1">
                      <li>• <strong>多角色支持</strong>：一个成员可以拥有多个角色</li>
                      <li>• <strong>权限合并</strong>：多个角色的权限会自动合并</li>
                      <li>• <strong>受保护角色</strong>：超级管理员等角色需要特殊权限才能分配</li>
                      <li>• <strong>实时生效</strong>：角色变更会立即生效</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  取消
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSaveRoles}
                >
                  <Save className="mr-2 h-4 w-4" />
                  保存角色分配
                </Button>
              </div>
            </div>
          </StrictDialogContent>
        </StrictDialog>

        {/* 重置密码确认对话框 */}
        <StrictDialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-orange-500" />
                <span>重置密码</span>
              </DialogTitle>
              <DialogDescription>
                为用户 "{resetPasswordUser?.name}" 设置新密码
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="请输入新密码（至少6位）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">重置说明</p>
                  <p className="text-sm text-muted-foreground">
                    重置后，用户将使用新密码登录系统。
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsResetPasswordOpen(false)}
                  disabled={resetPasswordLoading}
                >
                  取消
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleConfirmResetPassword}
                  disabled={resetPasswordLoading || !newPassword || !confirmPassword}
                >
                  {resetPasswordLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      重置中...
                    </>
                  ) : (
                    '确认重置'
                  )}
                </Button>
              </div>
            </div>
          </StrictDialogContent>
        </StrictDialog>
      </div>
    </div>
  );
};

export default Members;
