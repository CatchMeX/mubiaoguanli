import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  Plus, 
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import api from '@/services/api';
import unitAPI from '@/services/unitAPI';
import { PersonalMonthlyGoal, TeamMonthlyGoal, User as UserType } from '@/types';
import type { Unit } from '@/services/unitAPI';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard, usePermissions } from '@/hooks/usePermissions';
// 自定义选择器组件
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  label: string;
}

const CustomSelect = ({ value, onChange, options, placeholder, label }: CustomSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background border-border text-popover-foreground">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// 可搜索选择器组件
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  label: string;
  searchPlaceholder?: string;
}

const SearchableSelect = ({ value, onChange, options, placeholder, label, searchPlaceholder = "搜索..." }: SearchableSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
        <SelectTrigger className="bg-background border-border text-popover-foreground">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </div>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

const PersonalMonthlyGoals = () => {
  const { hasPermission } = usePermissions();
  
  // 检查页面访问权限
  if (!hasPermission('PERSONAL_MONTHLY_GOAL')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">权限不足</h2>
          <p className="text-muted-foreground">您没有访问个人月度目标页面的权限</p>
        </div>
      </div>
    );
  }
  
  const [personalMonthlyGoals, setPersonalMonthlyGoals] = useState<PersonalMonthlyGoal[]>([]);
  const [teamMonthlyGoals, setTeamMonthlyGoals] = useState<TeamMonthlyGoal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PersonalMonthlyGoal | null>(null);
  const [showDailyReportDialog, setShowDailyReportDialog] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  
  // 日报填写相关状态
  const [dailyReportFormData, setDailyReportFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    performance_value: '',
    work_content: ''
  });
  
  const [formData, setFormData] = useState<{
    year: number;
    month: number;
    user_id: string;
    team_monthly_goal_id: string;
    target_value: string;
    unit_id: string;
    remark: string;
  }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: '',
    team_monthly_goal_id: 'none',
    target_value: '',
    unit_id: '',
    remark: ''
  });
  
  const [editFormData, setEditFormData] = useState<{
    year: number;
    month: number;
    user_id: string;
    team_monthly_goal_id: string;
    target_value: string;
    unit_id: string;
    remark: string;
  }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: '',
    team_monthly_goal_id: 'none',
    target_value: '',
    unit_id: '',
    remark: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();

  // 打开日报填写弹框
  const openDailyReportDialog = (goal: PersonalMonthlyGoal) => {
    setSelectedGoal(goal);
    setDailyReportFormData({
      date: new Date().toISOString().split('T')[0],
      performance_value: '',
      work_content: ''
    });
    setShowDailyReportDialog(true);
  };

  // 添加日报
  const handleAddDailyReport = async () => {
    try {
      if (!selectedGoal || !dailyReportFormData.date || !dailyReportFormData.performance_value || !dailyReportFormData.work_content) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      const reportData = {
        personal_monthly_goal_id: selectedGoal.id,
        report_date: dailyReportFormData.date,
        performance_value: parseFloat(dailyReportFormData.performance_value),
        work_content: dailyReportFormData.work_content,
        status: 'submitted' as const
      };

      await api.goal.createDailyReport(reportData);
      
      // 重新加载数据
      await loadData();
      
      // 关闭弹框并重置表单
      setShowDailyReportDialog(false);
      setSelectedGoal(null);
      setDailyReportFormData({
        date: new Date().toISOString().split('T')[0],
        performance_value: '',
        work_content: ''
      });
      
      toast({
        title: '日报添加成功',
        description: '日报添加成功！',
      });
    } catch (err) {
      console.error('添加日报失败:', err);
      toast({
        title: '添加日报失败',
        description: '添加日报失败，请重试',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        personalGoalsResponse,
        teamGoalsResponse,
        usersResponse,
        unitsResponse,
        departmentsResponse
      ] = await Promise.all([
        api.goal.getPersonalMonthlyGoals(),
        api.goal.getTeamMonthlyGoals(),
        api.user.getAll(),
        unitAPI.getAll(),
        api.department.getAll()
      ]);

      setPersonalMonthlyGoals(personalGoalsResponse);
      setTeamMonthlyGoals(teamGoalsResponse);
      setUsers(usersResponse);
      setUnits(unitsResponse);
      setDepartments(departmentsResponse);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请重试');
      toast({
        title: '加载数据失败',
        description: '加载数据失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取有个人目标的用户
  const getUsersWithGoals = () => {
    const userIds = Array.from(new Set(personalMonthlyGoals.map(goal => goal.user_id).filter(Boolean)));
    return users.filter(user => userIds.includes(user.id));
  };

  // 获取筛选后的目标
  const getFilteredGoals = () => {
    return personalMonthlyGoals.filter(goal => {
      if (userFilter && userFilter !== 'all' && goal.user_id !== userFilter) return false;
      if (yearFilter && yearFilter !== 'all' && goal.year !== parseInt(yearFilter)) return false;
      return true;
    });
  };

  // 按成员分组目标
  const groupGoalsByMember = () => {
    const filteredGoals = getFilteredGoals();
    const grouped: { [key: string]: PersonalMonthlyGoal[] } = {};
    
    filteredGoals.forEach(goal => {
      const userName = goal.user?.name || '未知用户';
      if (!grouped[userName]) {
        grouped[userName] = [];
      }
      grouped[userName].push(goal);
    });
    
    return grouped;
  };

  // 获取成员统计信息
  const getMemberStats = (goals: PersonalMonthlyGoal[]) => {
    const totalGoals = goals.length;
    const totalProgress = goals.reduce((sum, goal) => {
      const progress = calculateProgress(goal);
      return sum + progress;
    }, 0);
    const avgProgress = totalGoals > 0 ? totalProgress / totalGoals : 0;
    
    return { totalGoals, avgProgress };
  };

  // 计算进度（参考PC端，使用Math.round四舍五入）
  const calculateProgress = (goal: PersonalMonthlyGoal) => {
    if (!goal.target_value || goal.target_value <= 0) return 0;
    
    const actualValue = calculateActualValue(goal);
    const progress = (actualValue / goal.target_value) * 100;
    return Math.round(Math.max(progress, 0)); // 先限制最小值，再四舍五入
  };

  // 计算实际值（参考PC端，使用performance_value）
  const calculateActualValue = (goal: PersonalMonthlyGoal) => {
    if (!goal.dailyReports || goal.dailyReports.length === 0) return 0;
    
    return goal.dailyReports.reduce((sum, report) => {
      return sum + ((report as any).performance_value || 0);
    }, 0);
  };

  // 切换成员展开状态
  const toggleMemberExpansion = (memberName: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberName)) {
      newExpanded.delete(memberName);
    } else {
      newExpanded.add(memberName);
    }
    setExpandedMembers(newExpanded);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      user_id: '',
      team_monthly_goal_id: '',
      target_value: '',
      unit_id: '',
      remark: ''
    });
  };

  // 重置编辑表单
  const resetEditForm = () => {
    setEditFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      user_id: '',
      team_monthly_goal_id: '',
      target_value: '',
      unit_id: '',
      remark: ''
    });
  };

  // 添加目标
  const addGoal = async () => {
    try {
      if (!formData.user_id || !formData.target_value) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.team_monthly_goal_id && !formData.unit_id) {
        toast({
          title: '请选择单位',
          description: '当没有关联部门目标时，单位是必填的',
          variant: 'destructive',
        });
        return;
      }

      const targetValue = parseInt(formData.target_value);
      if (isNaN(targetValue) || targetValue <= 0) {
        toast({
          title: '目标值必须大于0',
          description: '目标值必须大于0',
          variant: 'destructive',
        });
        return;
      }

      // 如果选择了关联部门目标，自动获取单位
      let unitId = formData.unit_id || '';
      if (formData.team_monthly_goal_id && formData.team_monthly_goal_id !== 'none') {
        const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === formData.team_monthly_goal_id);
        unitId = selectedTeamGoal?.unit_id || '';
      }

      const goalData = {
        year: formData.year,
        month: formData.month,
        user_id: formData.user_id,
        team_monthly_goal_id: formData.team_monthly_goal_id === 'none' ? undefined : formData.team_monthly_goal_id,
        target_value: targetValue,
        unit_id: unitId,
        remark: formData.remark || undefined,
      };

      await api.goal.createPersonalMonthlyGoal(goalData);
      
      await loadData();
      resetForm();
      setIsAddDialogOpen(false);
      toast({
        title: '个人月度目标创建成功',
        description: '个人月度目标创建成功',
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

  // 编辑目标
  const editGoal = (goal: PersonalMonthlyGoal) => {
    setSelectedGoal(goal);
    setEditFormData({
      year: goal.year,
      month: goal.month,
      user_id: goal.user_id || '',
      team_monthly_goal_id: goal.team_monthly_goal_id ? goal.team_monthly_goal_id : 'none',
      target_value: goal.target_value.toString(),
      unit_id: goal.unit_id || '',
      remark: goal.remark || ''
    });
    setIsEditDialogOpen(true);
  };

  // 更新目标
  const updateGoal = async () => {
    try {
      if (!editFormData.user_id || !editFormData.target_value) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      if (!editFormData.team_monthly_goal_id || editFormData.team_monthly_goal_id === 'none') {
        if (!editFormData.unit_id || editFormData.unit_id === '') {
          toast({
            title: '请选择单位',
            description: '当没有关联部门目标时，单位是必填的',
            variant: 'destructive',
          });
          return;
        }
      }

      if (!selectedGoal) return;

      const targetValue = parseInt(editFormData.target_value);
      if (isNaN(targetValue) || targetValue <= 0) {
        toast({
          title: '目标值必须大于0',
          description: '目标值必须大于0',
          variant: 'destructive',
        });
        return;
      }

      // 如果选择了关联部门目标，自动获取单位
      let unitId = editFormData.unit_id || '';
      if (editFormData.team_monthly_goal_id && editFormData.team_monthly_goal_id !== 'none') {
        const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === editFormData.team_monthly_goal_id);
        unitId = selectedTeamGoal?.unit_id || '';
      }

      const goalData = {
        year: editFormData.year,
        month: editFormData.month,
        user_id: editFormData.user_id,
        team_monthly_goal_id: editFormData.team_monthly_goal_id === 'none' ? undefined : editFormData.team_monthly_goal_id,
        target_value: targetValue,
        unit_id: unitId,
        remark: editFormData.remark || undefined,
      };

      await api.goal.updatePersonalMonthlyGoal(selectedGoal.id, goalData);
      
      await loadData();
      setSelectedGoal(null);
      resetEditForm();
      setIsEditDialogOpen(false);
      toast({
        title: '个人月度目标更新成功',
        description: '个人月度目标更新成功',
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

  // 删除目标
  const deleteGoal = async (goal: PersonalMonthlyGoal) => {
    try {
      await api.goal.deletePersonalMonthlyGoal(goal.id);
      await loadData();
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

  // 获取部门名称
  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return '未知部门';
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : '未知部门';
  };

  // 获取单位名称
  const getUnitName = (unitId?: string) => {
    if (!unitId) return '';
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : '';
  };

  // 获取创建人姓名
  const getCreatorName = (goal: PersonalMonthlyGoal) => {
    // 如果有创建人信息，优先显示
    if (goal.creator?.name) {
      return goal.creator.name;
    }
    // 如果没有创建人信息，尝试从用户列表中找到对应的用户
    if (goal.user_id) {
      const user = users.find(u => u.id === goal.user_id);
      if (user?.name) {
        return user.name;
      }
    }
    // 如果都没有，显示当前登录用户
    if (user?.name) {
      return user.name;
    }
    return '未知';
  };

  // 获取关联部门目标标题（参考PC端格式）
  const getCompanyGoalTitle = (goalId?: string) => {
    if (!goalId) return '无关联';
    const goal = teamMonthlyGoals.find(g => g.id === goalId);
    if (!goal) return '无关联';
    
    // 格式：部门目标的年月+部门名称+-+关联的年度目标名称
    const departmentName = goal.department?.name || '部门';
    const yearlyGoalTitle = goal.company_yearly_goal?.title;
    const monthlyGoalTitle = goal.title;
    
    if (yearlyGoalTitle) {
      return `${goal.year}年${goal.month}月${departmentName} - ${yearlyGoalTitle}`;
    }
    
    return `${goal.year}年${goal.month}月${departmentName} - ${monthlyGoalTitle || '无标题'}`;
  };

  // 获取月份名称
  const getMonthName = (month: number) => {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month - 1] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></Loader2>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2"></AlertCircle>
          <p className="text-red-500">{error}</p>
          <Button onClick={loadData} className="mt-2">重试</Button>
        </div>
      </div>
    );
  }

  const groupedGoals = groupGoalsByMember();
  const usersWithGoals = getUsersWithGoals();

  // 计算统计数据
  const totalGoals = personalMonthlyGoals.length;
  const pendingGoals = personalMonthlyGoals.filter(goal => calculateProgress(goal) < 100).length;
  const completedGoals = personalMonthlyGoals.filter(goal => calculateProgress(goal) >= 100).length;
  const averageProgress = personalMonthlyGoals.length > 0 
    ? Math.round(personalMonthlyGoals.reduce((sum, g) => sum + calculateProgress(g), 0) / personalMonthlyGoals.length)
    : 0;

  return (
    <div className="p-4 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">月度目标数</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待完成目标数</p>
                <p className="text-2xl font-bold">{pendingGoals}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已完成目标数</p>
                <p className="text-2xl font-bold">{completedGoals}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均完成率</p>
                <p className="text-2xl font-bold">{averageProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <SearchableSelect
                  value={userFilter}
                  onChange={(value: string) => setUserFilter(value)}
                  options={[{ id: 'all', name: '全部成员' }, ...usersWithGoals]}
                  placeholder="选择成员"
                  label="成员筛选"
                  searchPlaceholder="搜索成员"
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  value={yearFilter}
                  onChange={(value: string) => setYearFilter(value)}
                  options={[
                    { id: 'all', name: '全部年份' },
                    ...Array.from(new Set(personalMonthlyGoals.map(goal => goal.year)))
                      .sort((a, b) => b - a)
                      .map(year => ({ id: year.toString(), name: `${year}年` }))
                  ]}
                  placeholder="选择年份"
                  label="年份筛选"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 目标列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">个人月度目标列表</CardTitle>
            <PermissionGuard permission="CREATE_PERSONAL_GOAL">
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                添加目标
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedGoals).map(([memberName, goals]) => {
            const stats = getMemberStats(goals);
            const isExpanded = expandedMembers.has(memberName);
            
            return (
              <div key={memberName} className="space-y-4">
                {/* 成员级别行 */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMemberExpansion(memberName)}
                      className="h-8 w-8 p-0 hover:bg-accent transition-all duration-200"
                      title="展开查看成员目标"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                    <div>
                      <span className="font-medium text-foreground">{memberName}</span>
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

                {/* 成员目标详情 - 2级展示 */}
                {isExpanded && (
                  <div className="ml-4 space-y-3">
                    {goals.map((goal) => {
                      const progress = calculateProgress(goal);
                      const actualValue = calculateActualValue(goal);
                      const targetValue = goal.target_value || 0;
                      
                      return (
                        <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {goal.year}年{goal.month}月
                                </Badge>
                                <div className="flex gap-1 ml-auto items-center">
                                  <PermissionGuard permission="DAILY_REPORT_WRITE">
                                    <Button size="sm" variant="ghost" onClick={() => openDailyReportDialog(goal)} className="h-6 w-6 p-0">
                                      <Calendar className="h-3 w-3" />
                                    </Button>
                                  </PermissionGuard>
                                  <PermissionGuard permission="EDIT_PERSONAL_GOAL">
                                    <Button size="sm" variant="ghost" onClick={() => editGoal(goal)} className="h-6 w-6 p-0">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </PermissionGuard>
                                  <PermissionGuard permission="DELETE_PERSONAL_GOAL">
                                    <DeleteButton
                                      onConfirm={() => deleteGoal(goal)}
                                      itemName={`${memberName} - ${goal.year}年${getMonthName(goal.month)}目标`}
                                      title="删除个人月度目标"
                                      description={`确定要删除"${memberName} - ${goal.year}年${getMonthName(goal.month)}目标"吗？`}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    />
                                  </PermissionGuard>
                                </div>
                              </div>
                              
                              <div className="space-y-3 text-xs mb-3">
                                <div>
                                  <span className="text-muted-foreground">关联部门目标: </span>
                                  <span className="font-medium">{getCompanyGoalTitle(goal.team_monthly_goal_id)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">目标值: </span>
                                  <span className="font-medium">
                                    {actualValue.toLocaleString()} / {targetValue.toLocaleString()} {getUnitName(goal.unit_id)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">创建人: </span>
                                  <span className="font-medium">{getCreatorName(goal)}</span>
                                  <span className="text-muted-foreground ml-4">创建时间: </span>
                                  <span className="font-medium">
                                    {new Date(goal.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span>完成进度</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                              
                              <div className="text-xs">
                                <span className="text-muted-foreground">当月绩效工资: </span>
                                <span className="font-medium">
                                  {(() => {
                                    // 计算该用户当月的平均完成进度
                                    const userMonthlyGoals = personalMonthlyGoals.filter(g => 
                                      g.user_id === goal.user_id && 
                                      g.year === goal.year && 
                                      g.month === goal.month
                                    );
                                    const averageProgress = userMonthlyGoals.length > 0 ? 
                                      userMonthlyGoals.reduce((sum, g) => sum + Math.min(calculateProgress(g), 100), 0) / userMonthlyGoals.length : 0;
                                    const performancePay = goal.user?.performance_pay || 0;
                                    const performanceAmount = Math.round((averageProgress / 100) * performancePay);
                                    return performanceAmount.toLocaleString();
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 添加目标对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>创建个人月度目标</DialogTitle>
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
              <Label htmlFor="teamGoal">关联部门目标（可选）</Label>
              <Select value={formData.team_monthly_goal_id} onValueChange={(value) => setFormData({...formData, team_monthly_goal_id: value})}>
                <SelectTrigger className="bg-background border-border text-popover-foreground">
                  <SelectValue placeholder="选择部门目标（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联部门目标</SelectItem>
                  {teamMonthlyGoals.filter(goal => !goal.deleted_at).map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.year}年{getMonthName(goal.month)}{goal.department?.name || '部门'} - {goal.company_yearly_goal?.title || goal.title || '无标题'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user">成员</Label>
              <SearchableSelect
                value={formData.user_id}
                onChange={(value: string) => setFormData({...formData, user_id: value})}
                options={users}
                placeholder="请选择成员"
                label=""
                searchPlaceholder="搜索成员"
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
                className="bg-background border-border text-foreground" 
              />
            </div>

            <div>
              <Label htmlFor="unit">单位</Label>
              {formData.team_monthly_goal_id && formData.team_monthly_goal_id !== 'none' ? (
                <div className="p-3 bg-muted/30 rounded-md border border-border">
                  <span className="text-sm font-medium">
                    {(() => {
                      const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === formData.team_monthly_goal_id);
                      const teamUnit = units.find(unit => unit.id === selectedTeamGoal?.unit_id);
                      return teamUnit ? teamUnit.name : '未知单位';
                    })()}
                  </span>
                </div>
              ) : (
                <CustomSelect
                  value={formData.unit_id}
                  onChange={(value: string) => setFormData({...formData, unit_id: value})}
                  options={units}
                  placeholder="请选择单位"
                  label=""
                />
              )}
            </div>

            <div>
              <Label htmlFor="remark">备注</Label>
              <Textarea 
                id="remark" 
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                placeholder="请输入备注（可选）"
                className="bg-background border-border text-popover-foreground" 
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <PermissionGuard permission="CREATE_PERSONAL_GOAL">
                <Button onClick={addGoal} className="flex-1">创建目标</Button>
              </PermissionGuard>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑目标对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑个人月度目标</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-year">年份</Label>
                <Input 
                  id="edit-year" 
                  type="number" 
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({...editFormData, year: Number(e.target.value)})}
                  className="bg-background border-border text-foreground" 
                />
              </div>
              <div>
                <Label htmlFor="edit-month">月份</Label>
                <Select value={editFormData.month.toString()} onValueChange={(value) => setEditFormData({...editFormData, month: Number(value)})}>
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
              <Label htmlFor="edit-teamGoal">关联部门目标（可选）</Label>
              <Select value={editFormData.team_monthly_goal_id} onValueChange={(value) => setEditFormData({...editFormData, team_monthly_goal_id: value})}>
                <SelectTrigger className="bg-background border-border text-popover-foreground">
                  <SelectValue placeholder="选择部门目标（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联部门目标</SelectItem>
                  {teamMonthlyGoals.filter(goal => !goal.deleted_at).map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.year}年{getMonthName(goal.month)}{goal.department?.name || '部门'} - {goal.company_yearly_goal?.title || goal.title || '无标题'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-user">成员</Label>
              <SearchableSelect
                value={editFormData.user_id}
                onChange={(value: string) => setEditFormData({...editFormData, user_id: value})}
                options={users}
                placeholder="请选择成员"
                label=""
                searchPlaceholder="搜索成员"
              />
            </div>

            <div>
              <Label htmlFor="edit-targetValue">目标值</Label>
              <Input 
                id="edit-targetValue" 
                type="number" 
                value={editFormData.target_value}
                onChange={(e) => setEditFormData({...editFormData, target_value: e.target.value})}
                placeholder="请输入目标值"
                className="bg-background border-border text-foreground" 
              />
            </div>

            <div>
              <Label htmlFor="edit-unit">单位</Label>
              {editFormData.team_monthly_goal_id && editFormData.team_monthly_goal_id !== 'none' ? (
                <div className="p-3 bg-muted/30 rounded-md border border-border">
                  <span className="text-sm font-medium">
                    {(() => {
                      const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === editFormData.team_monthly_goal_id);
                      const teamUnit = units.find(unit => unit.id === selectedTeamGoal?.unit_id);
                      return teamUnit ? teamUnit.name : '未知单位';
                    })()}
                  </span>
                </div>
              ) : (
                <CustomSelect
                  value={editFormData.unit_id}
                  onChange={(value: string) => setEditFormData({...editFormData, unit_id: value})}
                  options={units}
                  placeholder="请选择单位"
                  label=""
                />
              )}
            </div>

            <div>
              <Label htmlFor="edit-remark">备注</Label>
              <Textarea 
                id="edit-remark" 
                value={editFormData.remark}
                onChange={(e) => setEditFormData({...editFormData, remark: e.target.value})}
                placeholder="请输入备注（可选）"
                className="bg-background border-border text-popover-foreground" 
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button onClick={updateGoal} className="flex-1">更新目标</Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 日报填写对话框 */}
      <Dialog open={showDailyReportDialog} onOpenChange={setShowDailyReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>填写日报</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>目标: {selectedGoal?.target_value?.toLocaleString()} {selectedGoal?.unit_id ? getUnitName(selectedGoal.unit_id) : ''}</p>
              <p>年月: {selectedGoal?.year}年{selectedGoal?.month}月</p>
            </div>
            
            <div>
              <Label htmlFor="report-date">日期 *</Label>
              <Input
                id="report-date"
                type="date"
                value={dailyReportFormData.date}
                onChange={(e) => setDailyReportFormData({...dailyReportFormData, date: e.target.value})}
                className="bg-background border-border text-foreground"
              />
            </div>
            
            <div>
              <Label htmlFor="report-performance">完成值 *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="report-performance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={dailyReportFormData.performance_value}
                  onChange={(e) => setDailyReportFormData({...dailyReportFormData, performance_value: e.target.value})}
                  placeholder="请输入完成值"
                  className="flex-1 bg-background border-border text-foreground"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedGoal?.unit_id ? getUnitName(selectedGoal.unit_id) : ''}
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="report-content">工作内容 *</Label>
              <Textarea
                id="report-content"
                value={dailyReportFormData.work_content}
                onChange={(e) => setDailyReportFormData({...dailyReportFormData, work_content: e.target.value})}
                placeholder="请描述今天完成的工作内容"
                rows={3}
                className="bg-background border-border text-popover-foreground"
              />
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button onClick={handleAddDailyReport} className="flex-1">提交日报</Button>
              <Button variant="outline" onClick={() => setShowDailyReportDialog(false)} className="flex-1">取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalMonthlyGoals;
