import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar,
  Building2,
  Edit,
  Split,
  BarChart3,
  Users,
  Loader2,
  X,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import api from '@/services/api';
import unitAPI from '@/services/unitAPI';
import { TeamMonthlyGoal, CompanyYearlyGoal, Department, User } from '@/types';
import type { Unit } from '@/services/unitAPI';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentSelect from '@/components/DepartmentSelect';
import { PermissionGuard } from '@/hooks/usePermissions';

// 个人目标项类型
interface PersonalGoalItem {
  user_id: string;
  target_value: string;
  ratio: number;
  remark: string;
}

const TeamMonthlyGoals = () => {
  const [teamMonthlyGoals, setTeamMonthlyGoals] = useState<TeamMonthlyGoal[]>([]);
  const [companyYearlyGoals, setCompanyYearlyGoals] = useState<CompanyYearlyGoal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [departmentMembers, setDepartmentMembers] = useState<User[]>([]);
  const [personalGoalItems, setPersonalGoalItems] = useState<PersonalGoalItem[]>([]);
  const [existingPersonalGoals, setExistingPersonalGoals] = useState<any[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [expandedTeamGoals, setExpandedTeamGoals] = useState<Set<string>>(new Set());
  const [personalGoals, setPersonalGoals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department_id: '',
    company_yearly_goal_id: 'none',
    title: '', // 新增：目标标题字段
    target_value: '',
    unit_id: ''
  });
  const [editFormData, setEditFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department_id: '',
    company_yearly_goal_id: 'none',
    title: '', // 新增：目标标题字段
    target_value: '',
    unit_id: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // 处理年度目标选择变化
  const handleCompanyYearlyGoalChange = (goalId: string, isAddForm: boolean = true) => {
    if (goalId === 'none') {
      // 如果选择不关联年度目标，清空单位并确保company_yearly_goal_id为'none'
      if (isAddForm) {
        setFormData(prev => ({ ...prev, company_yearly_goal_id: 'none', unit_id: '' }));
      } else {
        setEditFormData(prev => ({ ...prev, company_yearly_goal_id: 'none', unit_id: '' }));
      }
      return;
    }
    
    if (!goalId) {
      // 如果没有选择年度目标，清空单位
      if (isAddForm) {
        setFormData(prev => ({ ...prev, company_yearly_goal_id: '', unit_id: '' }));
      } else {
        setEditFormData(prev => ({ ...prev, company_yearly_goal_id: '', unit_id: '' }));
      }
      return;
    }

    // 找到选中的年度目标
    const selectedYearlyGoal = companyYearlyGoals.find(goal => goal.id === goalId);
    if (selectedYearlyGoal && selectedYearlyGoal.unit_id) {
      // 自动设置单位
      if (isAddForm) {
        setFormData(prev => ({ 
          ...prev, 
          company_yearly_goal_id: goalId, 
          unit_id: selectedYearlyGoal.unit_id || '' 
        }));
      } else {
        setEditFormData(prev => ({ 
          ...prev, 
          company_yearly_goal_id: goalId, 
          unit_id: selectedYearlyGoal.unit_id || '' 
        }));
      }
    }
  };

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [teamGoalsResponse, companyGoalsResponse, departmentsResponse, usersResponse, unitsResponse, personalGoalsResponse] = await Promise.all([
        api.goal.getTeamMonthlyGoals(),
        api.goal.getCompanyYearlyGoals(),
        api.department.getAll(),
        api.user.getAll(),
        unitAPI.getAll(),
        api.goal.getPersonalMonthlyGoals()
      ]);

      setTeamMonthlyGoals(teamGoalsResponse);
      setCompanyYearlyGoals(companyGoalsResponse);
      setDepartments(departmentsResponse);
      setUsers(usersResponse);
      setUnits(unitsResponse);
      setPersonalGoals(personalGoalsResponse);
    } catch (err) {
      console.error('加载数据失败:', err);
      toast({
        title: '加载数据失败',
        description: '加载数据失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.department_id || !formData.target_value) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }
      
      // 如果不关联年度目标，则目标标题为必填
      if (formData.company_yearly_goal_id === 'none' && !formData.title.trim()) {
        toast({
          title: '请填写目标标题',
          description: '不关联年度目标时，目标标题为必填字段',
          variant: 'destructive',
        });
        return;
      }

      const goalData = {
        year: formData.year,
        month: formData.month,
        department_id: formData.department_id,
        company_yearly_goal_id: formData.company_yearly_goal_id === 'none' ? undefined : formData.company_yearly_goal_id, // 允许为空
        title: formData.company_yearly_goal_id === 'none' ? formData.title : undefined, // 如果不关联年度目标，则使用自定义标题
        target_value: Number(formData.target_value),
        unit_id: formData.unit_id || undefined,
        created_by: user?.id,
        progress: 0,
        status: 'active' as 'active'
      };

      await api.goal.createTeamMonthlyGoal(goalData);
      
      // 重置表单
      setFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        department_id: '',
        company_yearly_goal_id: 'none',
        title: '', // 新增：目标标题字段
        target_value: '',
        unit_id: ''
      });
      
      setIsAddDialogOpen(false);
      loadData();
      toast({
        title: '部门月度目标创建成功',
        description: '部门月度目标创建成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '创建目标失败',
        description: '创建目标失败，请重试',
        variant: 'destructive',
      });
      console.error('创建目标失败:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.goal.deleteTeamMonthlyGoal(id);
      loadData();
      toast({
        title: '删除目标成功',
        description: '删除目标成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '删除目标失败',
        description: '删除目标失败，请重试',
        variant: 'destructive',
      });
      console.error('删除目标失败:', err);
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setEditFormData({
      year: goal.year,
      month: goal.month,
      department_id: goal.department_id,
      company_yearly_goal_id: goal.company_yearly_goal_id || 'none',
      title: goal.title || '', // 新增：目标标题字段
      target_value: goal.target_value.toString(),
      unit_id: goal.unit_id || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!editFormData.department_id || !editFormData.target_value) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }
      
      // 如果不关联年度目标，则目标标题为必填
      if (editFormData.company_yearly_goal_id === 'none' && !editFormData.title.trim()) {
        toast({
          title: '请填写目标标题',
          description: '不关联年度目标时，目标标题为必填字段',
          variant: 'destructive',
        });
        return;
      }

      const goalData = {
        year: editFormData.year,
        month: editFormData.month,
        department_id: editFormData.department_id,
        company_yearly_goal_id: editFormData.company_yearly_goal_id === 'none' ? undefined : editFormData.company_yearly_goal_id,
        title: editFormData.company_yearly_goal_id === 'none' ? editFormData.title : undefined, // 如果不关联年度目标，则使用自定义标题
        target_value: Number(editFormData.target_value),
        unit_id: editFormData.unit_id || undefined
      };

      await api.goal.updateTeamMonthlyGoal(editingGoal.id, goalData);
      
      setIsEditDialogOpen(false);
      setEditingGoal(null);
      setEditFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        department_id: '',
        company_yearly_goal_id: 'none',
        title: '', // 新增：目标标题字段
        target_value: '',
        unit_id: ''
      });
      
      loadData();
      toast({
        title: '部门月度目标更新成功',
        description: '部门月度目标更新成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '更新目标失败',
        description: '更新目标失败，请重试',
        variant: 'destructive',
      });
      console.error('更新目标失败:', err);
    }
  };

  const openSplitDialog = async (goal: any) => {
    setSelectedGoal(goal);
    setIsSplitDialogOpen(true);
    setPersonalGoalItems([]);
    
    try {
      console.log('=== 开始获取部门成员 ===');
      console.log('目标信息:', goal);
      console.log('部门ID:', goal.department?.id);
      console.log('部门名称:', goal.department?.name);
      
      if (!goal.department?.id) {
        console.error('部门ID不存在');
        setDepartmentMembers([]);
        return;
      }
      
      // 获取该部门的成员
      console.log('正在调用 getDepartmentMembers...');
      const members = await api.department.getDepartmentMembers(goal.department.id);
      console.log('获取到的部门成员:', members);
      
      // 获取已存在的个人目标
      const existingGoals = await api.goal.getPersonalMonthlyGoals(undefined, goal.year, goal.month);
      const filteredExistingGoals = existingGoals.filter(pg => pg.team_monthly_goal_id === goal.id);
      setExistingPersonalGoals(filteredExistingGoals);
      
      // 显示所有部门成员，允许重复添加个人目标
      setDepartmentMembers(members);
    } catch (err) {
      console.error('获取部门成员失败:', err);
      setDepartmentMembers([]);
    }
  };

  // 添加个人目标项
  const addPersonalGoalItem = () => {
    // 移除部门成员数量的限制，允许继续添加个人目标
    // 即使所有部门成员都已经有了个人目标，用户也可以继续添加
    
    const newItem: PersonalGoalItem = {
      user_id: '',
      target_value: '',
      ratio: 0,
      remark: ''
    };
    
    setPersonalGoalItems(prev => [...prev, newItem]);
  };

  // 删除个人目标项
  const removePersonalGoalItem = (index: number) => {
    setPersonalGoalItems(prev => prev.filter((_, i) => i !== index));
  };

  // 更新个人目标项
  const updatePersonalGoalItem = (index: number, field: keyof PersonalGoalItem, value: any) => {
    setPersonalGoalItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // 自动计算比例
      if (field === 'target_value' && selectedGoal) {
        const ratio = selectedGoal.target_value > 0 ? (value / selectedGoal.target_value) * 100 : 0;
        newItems[index].ratio = Math.round(ratio * 100) / 100; // 保留两位小数
      }
      
      return newItems;
    });
  };

  // 获取已分配的总目标值（包括已存在的和正在添加的）
  const getTotalAssignedTarget = () => {
    const existingTotal = existingPersonalGoals.reduce((sum, goal) => sum + goal.target_value, 0);
    const newTotal = personalGoalItems.reduce((sum, item) => sum + (parseFloat(item.target_value) || 0), 0);
    return existingTotal + newTotal;
  };

  // 获取剩余可分配的目标值
  const getRemainingTarget = () => {
    return (selectedGoal?.target_value || 0) - getTotalAssignedTarget();
  };

  // 检查是否所有项都已填写
  const isAllItemsValid = () => {
    return personalGoalItems.every(item => 
      item.user_id && parseFloat(item.target_value) > 0
    );
  };

  // 检查是否有重复的用户（暂时禁用，允许同一用户多个目标）
  const hasDuplicateUsers = () => {
    // 暂时返回 false，允许同一用户创建多个个人目标
    // 在实际业务中，同一用户可能有多个不同的目标
    return false;
    
    // 原来的逻辑（暂时注释）
    // const userIds = personalGoalItems.map(item => item.user_id).filter(id => id);
    // return new Set(userIds).size !== userIds.length;
  };

  const handleConfirmSplit = async () => {
    if (!selectedGoal || personalGoalItems.length === 0) {
      toast({
        title: '请至少添加一个个人目标',
        description: '请至少添加一个个人目标',
        variant: 'destructive',
      });
      return;
    }

    if (!isAllItemsValid()) {
      toast({
        title: '请完善所有个人目标信息',
        description: '请完善所有个人目标信息',
        variant: 'destructive',
      });
      return;
    }

    if (hasDuplicateUsers()) {
      toast({
        title: '不能为同一用户添加多个目标',
        description: '不能为同一用户添加多个目标',
        variant: 'destructive',
      });
      return;
    }

    // 允许超额，不再限制个人目标总和不能超过团队目标值

    try {
      console.log('开始创建个人月度目标...');
      
      // 为每个个人目标项创建个人月度目标
      const createPromises = personalGoalItems.map(item => {
        const personalGoalData = {
          user_id: item.user_id,
          team_monthly_goal_id: selectedGoal.id,
          year: selectedGoal.year,
          month: selectedGoal.month,
          target_value: parseFloat(item.target_value),
          unit_id: selectedGoal.unit_id, // 继承团队目标的单位
          created_by: user?.id,
          progress: 0,
          status: 'active' as 'active',
          remark: item.remark
        };

        console.log(`创建个人目标:`, personalGoalData);
        return api.goal.createPersonalMonthlyGoal(personalGoalData);
      });

      // 批量创建个人目标
      await Promise.all(createPromises);
      
      console.log('个人月度目标创建成功');
      
      // 关闭对话框并重新加载数据
      setIsSplitDialogOpen(false);
      setPersonalGoalItems([]);
      loadData();
      toast({
        title: '个人目标创建成功',
        description: '个人目标创建成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '创建个人目标失败',
        description: '创建个人目标失败，请重试',
        variant: 'destructive',
      });
      console.error('创建个人目标失败:', err);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[month - 1];
  };

  const calculateActualRevenue = (personalGoal: any) => {
    // 从日报中计算实际收入
    if (personalGoal.daily_reports && personalGoal.daily_reports.length > 0) {
      return personalGoal.daily_reports.reduce((sum: number, report: any) => 
        sum + (report.performance_value || 0), 0);
    }
    // 如果没有日报，使用actual_revenue字段
    return personalGoal.actual_revenue || 0;
  };

  const calculateProgress = (personalGoal: any) => {
    if (!personalGoal.target_value) return 0;
    const actualRevenue = calculateActualRevenue(personalGoal);
    return Math.round((actualRevenue / personalGoal.target_value) * 100);
  };



  const calculateTeamActualRevenue = (goal: any) => {
    // 从个人目标的日报中计算实际收入
    const teamPersonalGoals = personalGoals.filter(pg => pg.team_monthly_goal_id === goal.id);
    let totalActualRevenue = 0;
    
    teamPersonalGoals.forEach(personalGoal => {
      if (personalGoal.dailyReports) {
        const personalActualRevenue = personalGoal.dailyReports.reduce(
          (sum: number, report: any) => sum + (report.performance_value || 0),
          0
        );
        totalActualRevenue += personalActualRevenue;
      }
    });
    
    return totalActualRevenue;
  };

  // 计算团队目标的进度
  const calculateTeamProgress = (goal: any) => {
    const actualRevenue = calculateTeamActualRevenue(goal);
    return goal.target_value > 0 ? Math.round((actualRevenue / goal.target_value) * 100) : 0;
  };

  // 计算个人月度目标进度
  const calculatePersonalGoalProgress = (personalGoal: any): number => {
    if (!personalGoal.dailyReports) return personalGoal.progress || 0;
    
    const totalPerformance = personalGoal.dailyReports.reduce(
      (sum: number, report: any) => sum + (report.performance_value || 0), 
      0
    );
    
    return personalGoal.target_value > 0 ? Math.round((totalPerformance / personalGoal.target_value) * 100) : 0;
  };

  // 计算个人目标的实际收入
  const calculatePersonalActualRevenue = (personalGoal: any): number => {
    if (!personalGoal.dailyReports) return 0;
    
    return personalGoal.dailyReports.reduce(
      (sum: number, report: any) => sum + (report.performance_value || 0),
      0
    );
  };

  // 展开收缩处理函数
  const toggleTeamGoalExpansion = (teamGoalId: string) => {
    setExpandedTeamGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamGoalId)) {
        newSet.delete(teamGoalId);
      } else {
        newSet.add(teamGoalId);
      }
      return newSet;
    });
  };

  // 按部门分组目标数据
  const groupGoalsByDepartment = () => {
    const grouped: { [key: string]: TeamMonthlyGoal[] } = {};
    
    teamMonthlyGoals
      .filter(goal => {
        if (departmentFilter && departmentFilter !== 'all' && goal.department_id !== departmentFilter) return false;
        if (yearFilter && yearFilter !== 'all' && goal.year !== parseInt(yearFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'created_desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'created_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'target_desc':
            return b.target_value - a.target_value;
          case 'target_asc':
            return a.target_value - b.target_value;
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      })
      .forEach(goal => {
        const deptName = goal.department?.name || '未知部门';
        if (!grouped[deptName]) {
          grouped[deptName] = [];
        }
        grouped[deptName].push(goal);
      });
    
    return grouped;
  };

  // 计算部门统计信息
  const getDepartmentStats = (goals: TeamMonthlyGoal[]) => {
    const totalGoals = goals.length;
    const totalProgress = goals.reduce((sum, goal) => sum + calculateTeamProgress(goal), 0);
    const avgProgress = totalGoals > 0 ? totalProgress / totalGoals : 0;
    
    return { totalGoals, avgProgress };
  };

  // 获取部门负责人
  const getDepartmentManager = (departmentId: string | undefined) => {
    if (!departmentId) return '未知';
    const dept = departments.find(d => d.id === departmentId);
    if (dept?.manager_id) {
      const manager = users.find(u => u.id === dept.manager_id);
      return manager?.name || '未知';
    }
    return '未知';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold text-foreground">部门月度目标管理</h1>
          <p className="text-muted-foreground mt-2">管理各部门的月度目标分配和进度跟踪</p>
          </div>
          <PermissionGuard permission="CREATE_TEAM_GOAL">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                创建部门目标
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>创建部门月度目标</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">年份</Label>
                    <Input 
                      id="year" 
                      type="number" 
                      value={formData.year}
                    onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="month">月份</Label>
                  <Select value={formData.month.toString()} onValueChange={(value) => setFormData({...formData, month: Number(value)})}>
                      <SelectTrigger className="bg-background border-border text-popover-foreground">
                      <SelectValue />
                      </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyGoal">关联年度目标（可选）</Label>
                  <Select value={formData.company_yearly_goal_id} onValueChange={(value) => handleCompanyYearlyGoalChange(value, true)}>
                    <SelectTrigger className="bg-background border-border text-popover-foreground">
                      <SelectValue placeholder="选择年度目标（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">不关联年度目标</SelectItem>
                      {companyYearlyGoals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>
                        {goal.year}年 - {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.company_yearly_goal_id === 'none' && (
                  <div>
                    <Label htmlFor="title">目标标题 <span className="text-red-500">*</span></Label>
                    <Input 
                      id="title" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="请输入目标标题"
                      className="bg-background border-border text-popover-foreground" 
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="department">部门</Label>
                  <DepartmentSelect
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({...formData, department_id: value})}
                    placeholder="选择部门"
                  />
                </div>
                <div>
                  <Label htmlFor="targetValue">目标值</Label>
                  <Input 
                    id="targetValue" 
                    type="number" 
                    value={formData.target_value}
                    onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                    placeholder="请输入目标值"
                    className="bg-background border-border text-popover-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="unit">单位</Label>
                  <Select 
                    value={formData.unit_id} 
                    onValueChange={(value) => setFormData({...formData, unit_id: value})}
                    disabled={formData.company_yearly_goal_id !== 'none' && formData.company_yearly_goal_id !== ''}
                  >
                    <SelectTrigger className="bg-background border-border text-popover-foreground">
                      <SelectValue placeholder={formData.company_yearly_goal_id !== 'none' && formData.company_yearly_goal_id !== '' ? "单位已自动设置" : "请选择单位"} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.company_yearly_goal_id !== 'none' && formData.company_yearly_goal_id !== '' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      单位已根据关联的年度目标自动设置
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    创建目标
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
              <CardTitle className="text-sm font-medium text-muted-foreground">月度目标数</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{teamMonthlyGoals.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">待完成目标数</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {teamMonthlyGoals.filter(goal => calculateTeamProgress(goal) < 100).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已完成目标数</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {teamMonthlyGoals.filter(goal => calculateTeamProgress(goal) >= 100).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均完成率</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {teamMonthlyGoals.length > 0 
                  ? Math.round(teamMonthlyGoals.reduce((sum, g) => sum + calculateTeamProgress(g), 0) / teamMonthlyGoals.length)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

        {/* 筛选和排序 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="department-filter" className="text-sm">部门筛选:</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40 bg-background border-border text-foreground">
                  <SelectValue placeholder="全部部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="year-filter" className="text-sm">年份筛选:</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue placeholder="全部年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年份</SelectItem>
                  {Array.from(new Set(teamMonthlyGoals.map(goal => goal.year))).sort((a, b) => b - a).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="sort-order" className="text-sm">排序:</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32 bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">创建时间降序</SelectItem>
                <SelectItem value="created_asc">创建时间升序</SelectItem>
                <SelectItem value="target_desc">目标值降序</SelectItem>
                <SelectItem value="target_asc">目标值升序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 部门月度目标列表 - 2级展示结构 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">部门月度目标列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupGoalsByDepartment()).map(([deptName, goals], deptIndex) => {
                const stats = getDepartmentStats(goals);
                const isExpanded = expandedTeamGoals.has(deptName);
                
                return (
                  <div key={deptName} className="space-y-4">
                    {/* 部门级别行 */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTeamGoalExpansion(deptName)}
                          className="h-8 w-8 p-0 hover:bg-accent transition-all duration-200"
                          title="展开查看部门目标"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                        <div>
                          <span className="font-medium text-foreground">{deptName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-sm text-muted-foreground">
                          目标数: <span className="font-medium text-foreground">{stats.totalGoals}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          平均完成进度: <span className="font-medium text-foreground">{stats.avgProgress.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* 部门目标详情 - 2级展示 */}
                    {isExpanded && (
                      <div className="ml-8 space-y-2">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead className="text-foreground">关联年度目标</TableHead>
                              <TableHead className="text-foreground">目标名称</TableHead>
                              <TableHead className="text-foreground">目标值</TableHead>
                              <TableHead className="text-foreground">创建人</TableHead>
                              <TableHead className="text-foreground">创建时间</TableHead>
                              <TableHead className="text-foreground">完成进度</TableHead>
                              <TableHead className="text-foreground">执行人</TableHead>
                              <TableHead className="text-foreground">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goals.map((goal) => {
                              const progress = calculateTeamProgress(goal);
                              const actualRevenue = calculateTeamActualRevenue(goal);
                              const targetValue = goal.target_value || 0;
                              
                              return (
                                <TableRow key={goal.id} className="border-border">
                                  <TableCell className="text-foreground">
                                    {goal.company_yearly_goal ? (
                                      goal.company_yearly_goal.deleted_at ? (
                                        <span className="text-red-500">
                                          {goal.company_yearly_goal.year}年{goal.company_yearly_goal.title} (已删除)
                                        </span>
                                      ) : (
                                        `${goal.company_yearly_goal.year}年${goal.company_yearly_goal.title}`
                                      )
                                    ) : '无'}
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    {goal.title || `${goal.year}年${getMonthName(goal.month)}目标`}
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    {actualRevenue.toLocaleString()} / {targetValue.toLocaleString()} {goal.unit_id ? units.find(u => u.id === goal.unit_id)?.name : ''}
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    {goal.creator?.name || '未知'}
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    {new Date(goal.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <Progress value={Math.min(progress, 100)} className="h-2" />
                                      <div className="text-sm text-muted-foreground">{progress}%</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    {getDepartmentManager(goal.department_id)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <PermissionGuard permission="EDIT_TEAM_GOAL">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEdit(goal)}
                                          className="border-border text-foreground hover:bg-accent"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </PermissionGuard>
                                      <PermissionGuard permission="SPLIT_TEAM_GOAL">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openSplitDialog(goal)}
                                          className="border-border text-foreground hover:bg-accent"
                                        >
                                          <Split className="h-4 w-4" />
                                        </Button>
                                      </PermissionGuard>
                                      <PermissionGuard permission="DELETE_TEAM_GOAL">
                                        <DeleteButton
                                          onConfirm={() => handleDelete(goal.id)}
                                          itemName={`${goal.department?.name} - ${goal.year}年${getMonthName(goal.month)}目标`}
                                          title="删除部门月度目标"
                                          description={`确定要删除"${goal.department?.name} - ${goal.year}年${getMonthName(goal.month)}目标"吗？删除后关联的个人目标不会被删除但是会失去关联。`}
                                          variant="outline"
                                          size="sm"
                                        />
                                      </PermissionGuard>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 编辑团队目标对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>编辑部门月度目标</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editYear">年份</Label>
                  <Input 
                    id="editYear" 
                    type="number" 
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({...editFormData, year: Number(e.target.value)})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="editMonth">月份</Label>
                  <Select value={editFormData.month.toString()} onValueChange={(value) => setEditFormData({...editFormData, month: Number(value)})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editCompanyGoal">关联年度目标（可选）</Label>
                <Select value={editFormData.company_yearly_goal_id} onValueChange={(value) => handleCompanyYearlyGoalChange(value, false)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="选择年度目标（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联年度目标</SelectItem>
                    {companyYearlyGoals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.year}年 - {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editFormData.company_yearly_goal_id === 'none' && (
                <div>
                  <Label htmlFor="editTitle">目标标题 <span className="text-red-500">*</span></Label>
                  <Input 
                    id="editTitle" 
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    placeholder="请输入目标标题"
                    className="bg-background border-border text-foreground" 
                  />
                </div>
              )}
              <div>
                <Label htmlFor="editDepartment">部门</Label>
                <DepartmentSelect
                  value={editFormData.department_id}
                  onValueChange={(value) => setEditFormData({...editFormData, department_id: value})}
                  placeholder="选择部门"
                />
              </div>
              <div>
                <Label htmlFor="editTargetValue">目标值</Label>
                <Input 
                  id="editTargetValue" 
                  type="number" 
                  value={editFormData.target_value}
                  onChange={(e) => setEditFormData({...editFormData, target_value: e.target.value})}
                  placeholder="请输入目标值"
                  className="bg-background border-border text-foreground" 
                />
              </div>
              <div>
                <Label htmlFor="editUnit">单位</Label>
                <Select 
                  value={editFormData.unit_id} 
                  onValueChange={(value) => setEditFormData({...editFormData, unit_id: value})}
                  disabled={editFormData.company_yearly_goal_id !== 'none' && editFormData.company_yearly_goal_id !== ''}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder={editFormData.company_yearly_goal_id !== 'none' && editFormData.company_yearly_goal_id !== '' ? "单位已自动设置" : "请选择单位"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editFormData.company_yearly_goal_id !== 'none' && editFormData.company_yearly_goal_id !== '' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    单位已根据关联的年度目标自动设置
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  更新目标
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 拆分到个人对话框 */}
        <Dialog open={isSplitDialogOpen} onOpenChange={setIsSplitDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>拆分部门目标到个人</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {selectedGoal && (
                <div className="bg-accent p-4 rounded-lg theme-transition">
                  <h4 className="font-medium text-foreground mb-2">部门目标信息</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>部门: {selectedGoal.department?.name}</div>
                    <div>目标值: {selectedGoal.target_value.toLocaleString()} {selectedGoal.unit?.name || ''}</div>
                    <div>时间: {selectedGoal.year}年{getMonthName(selectedGoal.month)}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-foreground">个人目标分配</h4>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    已分配: {getTotalAssignedTarget().toLocaleString()} / {selectedGoal?.target_value.toLocaleString() || '0'} {selectedGoal?.unit?.name || ''}
                    {getRemainingTarget() !== 0 && (
                      <span className={`ml-2 ${getRemainingTarget() > 0 ? 'text-blue-500' : 'text-green-500'}`}>
                        （{getRemainingTarget() > 0 ? '剩余' : '超额'} {Math.abs(getRemainingTarget()).toLocaleString()} {selectedGoal?.unit?.name || ''}）
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={addPersonalGoalItem}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    添加个人目标
                  </Button>
                  </div>
                </div>
                
              {personalGoalItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>点击"添加个人目标"开始分配</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalGoalItems.map((item, index) => (
                    <Card key={index} className="bg-accent border-border theme-transition">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-foreground">个人目标 #{index + 1}</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removePersonalGoalItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`user-${index}`}>选择人员</Label>
                            <Select 
                              value={item.user_id} 
                              onValueChange={(value) => updatePersonalGoalItem(index, 'user_id', value)}
                            >
                              <SelectTrigger className="bg-background border-border text-foreground">
                                <SelectValue placeholder="选择人员" />
                              </SelectTrigger>
                              <SelectContent>
                                {departmentMembers.map(member => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} ({member.employee_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                        <div>
                            <Label htmlFor={`target-${index}`}>目标值</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id={`target-${index}`}
                                type="number"
                                value={item.target_value}
                                onChange={(e) => updatePersonalGoalItem(index, 'target_value', Number(e.target.value))}
                                className="bg-background border-border text-foreground"
                                placeholder="0"
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {selectedGoal?.unit?.name || ''}
                              </span>
                            </div>
                            </div>
                          
                            <div>
                            <Label>占比（%）</Label>
                            <div className="h-10 px-3 py-2 bg-background border border-border rounded-md flex items-center text-muted-foreground">
                              {item.ratio.toFixed(2)}%
                            </div>
                          </div>
                          
                        <div>
                            <Label htmlFor={`remark-${index}`}>备注</Label>
                          <Input
                              id={`remark-${index}`}
                              value={item.remark}
                              onChange={(e) => updatePersonalGoalItem(index, 'remark', e.target.value)}
                            className="bg-background border-border text-foreground"
                              placeholder="可选"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSplitDialogOpen(false)}>
                  取消
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!isAllItemsValid() || hasDuplicateUsers()}
                  onClick={handleConfirmSplit}
                >
                  确认拆分
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {teamMonthlyGoals.length === 0 && (
          <Card className="bg-card border-border theme-transition">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">暂无部门月度目标</h3>
                <p className="text-muted-foreground">创建第一个部门月度目标开始管理</p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default TeamMonthlyGoals;
