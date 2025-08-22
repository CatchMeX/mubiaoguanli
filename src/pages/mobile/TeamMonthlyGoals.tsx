import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Loader2,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  ChevronRight,
  Search,
  Check
} from 'lucide-react';
import api from '@/services/api';
import { departmentAPI } from '@/services/api';
import unitAPI from '@/services/unitAPI';
import type { TeamMonthlyGoal, CompanyYearlyGoal, Department, User } from '@/types';
import type { Unit } from '@/services/unitAPI';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard, usePermissions } from '@/hooks/usePermissions';

// 支持搜索的自定义下拉框组件
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  label: string;
  searchPlaceholder?: string;
}

const SearchableSelect = ({ value, onChange, options, placeholder, label, searchPlaceholder = "搜索..." }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedOption = options.find(option => option.id === value);

  // 过滤选项
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 border border-input rounded-md bg-background text-left flex items-center justify-between hover:bg-accent"
        >
          <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-64 overflow-hidden">
            {/* 搜索输入框 */}
            <div className="p-2 border-b border-input">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 border-0 focus:ring-0 h-8 text-sm"
                />
              </div>
            </div>
            
            {/* 选项列表 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className="w-full p-2 text-left hover:bg-accent flex items-center justify-between"
                  >
                    <span className="text-sm">{option.name}</span>
                    {option.id === value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  {searchTerm ? '未找到匹配项' : '暂无选项'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 点击外部关闭下拉框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};

// 自定义下拉框组件
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  label: string;
}

const CustomSelect = ({ value, onChange, options, placeholder, label }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.id === value);

  return (
    <div className="relative">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 border border-input rounded-md bg-background text-left flex items-center justify-between hover:bg-accent"
        >
          <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="w-full p-2 text-left hover:bg-accent first:rounded-t-md last:rounded-b-md"
              >
                {option.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 点击外部关闭下拉框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// 月份选择组件
interface MonthSelectProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const MonthSelect = ({ value, onChange, label }: MonthSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <div className="relative">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 border border-input rounded-md bg-background text-left flex items-center justify-between hover:bg-accent"
        >
          <span className="text-foreground">{monthNames[value - 1]}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-y-auto">
            {monthNames.map((monthName, index) => (
              <button
                key={index + 1}
                type="button"
                onClick={() => {
                  onChange(index + 1);
                  setIsOpen(false);
                }}
                className="w-full p-2 text-left hover:bg-accent first:rounded-t-md last:rounded-b-md"
              >
                {monthName}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 点击外部关闭下拉框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const TeamMonthlyGoals = () => {
  const { hasPermission } = usePermissions();
  
  // 检查页面访问权限
  if (!hasPermission('TEAM_MONTHLY_GOAL')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">权限不足</h2>
          <p className="text-muted-foreground">您没有访问部门月度目标页面的权限</p>
        </div>
      </div>
    );
  }
  
  const [teamMonthlyGoals, setTeamMonthlyGoals] = useState<TeamMonthlyGoal[]>([]);
  const [companyYearlyGoals, setCompanyYearlyGoals] = useState<CompanyYearlyGoal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [personalGoals, setPersonalGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<TeamMonthlyGoal | null>(null);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  // 拆分到个人相关状态
  const [personalGoalItems, setPersonalGoalItems] = useState<Array<{
    user_id: string;
    target_value: string;
    ratio: number;
    remark: string;
  }>>([]);
  const [departmentMembers, setDepartmentMembers] = useState<User[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // 新增目标表单状态
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department_id: '',
    company_yearly_goal_id: 'none',
    title: '',
    target_value: '',
    unit_id: ''
  });

  // 编辑目标表单状态
  const [editFormData, setEditFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department_id: '',
    company_yearly_goal_id: 'none',
    title: '',
    target_value: '',
    unit_id: ''
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      department_id: '',
      company_yearly_goal_id: 'none',
      title: '',
      target_value: '',
      unit_id: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      department_id: '',
      company_yearly_goal_id: 'none',
      title: '',
      target_value: '',
      unit_id: ''
    });
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
        departmentAPI.getAll(),
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
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('加载数据失败，请稍后重试');
      toast({
        title: "错误",
        description: "加载数据失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 拆分到个人
  const openSplitDialog = async (goal: TeamMonthlyGoal) => {
    setSelectedGoal(goal);
    setShowSplitDialog(true);
    setPersonalGoalItems([]);
    
    try {
      if (!goal.department_id) {
        setDepartmentMembers([]);
        return;
      }
      
      // 获取该部门的成员
      const members = await api.department.getDepartmentMembers(goal.department_id);
      setDepartmentMembers(members);
    } catch (err) {
      console.error('获取部门成员失败:', err);
      setDepartmentMembers([]);
    }
  };

  // 添加个人目标项
  const addPersonalGoalItem = () => {
    const newItem = {
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
  const updatePersonalGoalItem = (index: number, field: string, value: any) => {
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

  // 检查是否所有项都已填写
  const isAllItemsValid = () => {
    return personalGoalItems.every(item => 
      item.user_id && parseFloat(item.target_value) > 0
    );
  };

  // 确认拆分
  const handleConfirmSplit = async () => {
    if (!selectedGoal || personalGoalItems.length === 0) return;

    try {
      // 为每个个人目标项创建个人月度目标
      const createPromises = personalGoalItems.map(item => {
        const personalGoalData = {
          user_id: item.user_id,
          team_monthly_goal_id: selectedGoal.id,
          year: selectedGoal.year,
          month: selectedGoal.month,
          target_value: parseFloat(item.target_value),
          unit_id: selectedGoal.unit_id,
          created_by: user?.id,
          progress: 0,
          status: 'active' as const,
          remark: item.remark
        };

        return api.goal.createPersonalMonthlyGoal(personalGoalData);
      });

      // 批量创建个人目标
      await Promise.all(createPromises);
      
      // 关闭对话框并重新加载数据
      setShowSplitDialog(false);
      setPersonalGoalItems([]);
      await loadData();
      
      toast({
        title: '个人目标创建成功',
        description: '个人目标创建成功',
      });
    } catch (err) {
      console.error('创建个人目标失败:', err);
      toast({
        title: '创建个人目标失败',
        description: '创建个人目标失败，请重试',
        variant: 'destructive',
      });
    }
  };

  // 处理年度目标选择变化
  const handleCompanyYearlyGoalChange = (goalId: string, isAddForm: boolean = true) => {
    if (goalId === 'none') {
      if (isAddForm) {
        setFormData(prev => ({ ...prev, company_yearly_goal_id: 'none', unit_id: '' }));
      } else {
        setEditFormData(prev => ({ ...prev, company_yearly_goal_id: 'none', unit_id: '' }));
      }
      return;
    }
    
    if (!goalId) {
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

  // 计算团队目标实际收入
  const calculateTeamActualRevenue = (goal: TeamMonthlyGoal) => {
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
  const calculateTeamProgress = (goal: TeamMonthlyGoal) => {
    const actualRevenue = calculateTeamActualRevenue(goal);
    return goal.target_value > 0 ? Math.round((actualRevenue / goal.target_value) * 100) : 0;
  };

  // 展开收缩处理函数
  const toggleDepartmentExpansion = (deptName: string) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptName)) {
        newSet.delete(deptName);
      } else {
        newSet.add(deptName);
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

  // 获取有目标的部门列表（用于筛选）
  const getDepartmentsWithGoals = () => {
    const deptIds = new Set(teamMonthlyGoals.map(goal => goal.department_id).filter(Boolean));
    return departments.filter(dept => deptIds.has(dept.id));
  };

  // 添加目标
  const addGoal = async () => {
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
        company_yearly_goal_id: formData.company_yearly_goal_id === 'none' ? undefined : formData.company_yearly_goal_id,
        title: formData.company_yearly_goal_id === 'none' ? formData.title : undefined,
        target_value: Number(formData.target_value),
        unit_id: formData.unit_id || undefined,
        created_by: user?.id,
        progress: 0,
        status: 'active' as 'active'
      };

      await api.goal.createTeamMonthlyGoal(goalData);
      
      await loadData();
      setShowAddForm(false);
      resetForm();
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

  // 编辑目标
  const editGoal = async (goal: TeamMonthlyGoal) => {
    setSelectedGoal(goal);
    setShowEditDialog(true);
    setEditFormData({
      year: goal.year,
      month: goal.month,
      department_id: goal.department_id || '',
      company_yearly_goal_id: goal.company_yearly_goal_id || 'none',
      title: goal.title || '',
      target_value: goal.target_value.toString(),
      unit_id: goal.unit_id || ''
    });
  };

  const updateGoal = async () => {
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

      if (!selectedGoal) return;

      const goalData = {
        year: editFormData.year,
        month: editFormData.month,
        department_id: editFormData.department_id,
        company_yearly_goal_id: editFormData.company_yearly_goal_id === 'none' ? undefined : editFormData.company_yearly_goal_id,
        title: editFormData.company_yearly_goal_id === 'none' ? editFormData.title : undefined,
        target_value: Number(editFormData.target_value),
        unit_id: editFormData.unit_id || undefined,
      };

      await api.goal.updateTeamMonthlyGoal(selectedGoal.id, goalData);
      
      await loadData();
      setShowEditDialog(false);
      setSelectedGoal(null);
      resetEditForm();
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

  // 删除目标
  const deleteGoal = async (goal: TeamMonthlyGoal) => {
    try {
      await api.goal.deleteTeamMonthlyGoal(goal.id);
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
  const getCreatorName = (goal: TeamMonthlyGoal) => {
    return goal.creator?.name || '未知';
  };

  // 获取年度目标标题
  const getCompanyGoalTitle = (goalId?: string) => {
    if (!goalId) return '无关联';
    const goal = companyYearlyGoals.find(g => g.id === goalId);
    return goal ? `${goal.year}年 - ${goal.title}` : '无关联';
  };

  // 获取执行人信息（部门负责人）
  const getExecutors = (goal: TeamMonthlyGoal) => {
    // 优先显示部门负责人
    if (goal.department_id) {
      const dept = departments.find(d => d.id === goal.department_id);
      if (dept?.manager_id) {
        const manager = users.find(u => u.id === dept.manager_id);
        if (manager?.name) {
          return manager.name;
        }
      }
    }
    
    // 如果没有部门负责人，则尝试从个人目标获取执行人
    const teamPersonalGoals = personalGoals.filter(pg => pg.team_monthly_goal_id === goal.id);
    if (teamPersonalGoals.length > 0) {
      const executorNames = teamPersonalGoals
        .map(pg => pg.user?.name || '未知')
        .filter((name, index, arr) => arr.indexOf(name) === index); // 去重
      
      if (executorNames.length > 0) {
        return executorNames.join(', ');
      }
    }
    
    return '无执行人';
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

  const groupedGoals = groupGoalsByDepartment();
  const departmentsWithGoals = getDepartmentsWithGoals();

  // 计算统计数据
  const totalGoals = teamMonthlyGoals.length;
  const pendingGoals = teamMonthlyGoals.filter(goal => calculateTeamProgress(goal) < 100).length;
  const completedGoals = teamMonthlyGoals.filter(goal => calculateTeamProgress(goal) >= 100).length;
  const averageProgress = teamMonthlyGoals.length > 0 
    ? Math.round(teamMonthlyGoals.reduce((sum, g) => sum + calculateTeamProgress(g), 0) / teamMonthlyGoals.length)
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
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
                  options={[{ id: 'all', name: '全部部门' }, ...departmentsWithGoals]}
                  placeholder="选择部门"
                  label="部门筛选"
                  searchPlaceholder="搜索部门"
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  value={yearFilter}
                  onChange={setYearFilter}
                  options={[
                    { id: 'all', name: '全部年份' },
                    ...Array.from(new Set(teamMonthlyGoals.map(goal => goal.year)))
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
            <CardTitle className="text-lg">部门月度目标列表</CardTitle>
            <PermissionGuard permission="CREATE_TEAM_GOAL">
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                添加目标
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedGoals).map(([deptName, goals]) => {
            const stats = getDepartmentStats(goals);
            const isExpanded = expandedDepartments.has(deptName);
            
            return (
              <div key={deptName} className="space-y-4">
                {/* 部门级别行 */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDepartmentExpansion(deptName)}
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
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      目标数: <span className="font-medium text-foreground">{stats.totalGoals}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      平均完成进度: <span className="font-medium text-foreground">{stats.avgProgress.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* 部门目标详情 - 展开显示 */}
                {isExpanded && (
                  <div className="ml-4 space-y-3">
                    {goals.map((goal) => {
                      const progress = calculateTeamProgress(goal);
                      const actualRevenue = calculateTeamActualRevenue(goal);
                      
                      return (
                        <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {goal.year}年{goal.month}月
                                </Badge>
                                <div className="flex gap-1 ml-auto">
                                  <PermissionGuard permission="SPLIT_TEAM_GOAL">
                                    <Button size="sm" variant="ghost" onClick={() => openSplitDialog(goal)}>
                                      <Users className="h-3 w-3" />
                                    </Button>
                                  </PermissionGuard>
                                  <PermissionGuard permission="EDIT_TEAM_GOAL">
                                    <Button size="sm" variant="ghost" onClick={() => editGoal(goal)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </PermissionGuard>
                                  <PermissionGuard permission="DELETE_TEAM_GOAL">
                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteGoal(goal)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </PermissionGuard>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                                <div>
                                  <span className="text-muted-foreground">关联年度目标: </span>
                                  <span className="font-medium">{getCompanyGoalTitle(goal.company_yearly_goal_id)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">目标名称: </span>
                                  <span className="font-medium">
                                    {goal.company_yearly_goal_id ? 
                                      `${goal.year}年${goal.month}月目标` : 
                                      (goal.title || '无标题')
                                    }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">目标值: </span>
                                  <span className="font-medium">
                                    {actualRevenue.toLocaleString()} / {goal.target_value.toLocaleString()} {getUnitName(goal.unit_id)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">创建人: </span>
                                  <span className="font-medium">{getCreatorName(goal)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">创建时间: </span>
                                  <span className="font-medium">{new Date(goal.created_at).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">执行人: </span>
                                  <span className="font-medium">{getExecutors(goal)}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span>完成进度</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={Math.min(progress, 100)} className="h-2" />
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
          
          {Object.keys(groupedGoals).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无部门月度目标
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加目标对话框 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">创建部门月度目标</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">年份</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    placeholder="请输入年份"
                  />
                </div>
                <MonthSelect
                  value={formData.month}
                  onChange={(value) => setFormData({ ...formData, month: value })}
                  label="月份"
                />
              </div>
              
              <div>
                <Label>关联年度目标（可选）</Label>
                <CustomSelect
                  value={formData.company_yearly_goal_id}
                  onChange={(value) => handleCompanyYearlyGoalChange(value, true)}
                  options={[
                    { id: 'none', name: '不关联年度目标' },
                    ...companyYearlyGoals.map(goal => ({
                      id: goal.id,
                      name: `${goal.year}年 - ${goal.title}`
                    }))
                  ]}
                  placeholder="选择年度目标（可选）"
                  label=""
                />
              </div>
              
              {formData.company_yearly_goal_id === 'none' && (
                <div>
                  <Label htmlFor="title">目标标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入目标标题"
                  />
                </div>
              )}
              
              <SearchableSelect
                value={formData.department_id}
                onChange={(value) => setFormData({ ...formData, department_id: value })}
                options={departments}
                placeholder="请选择部门"
                label="部门 *"
                searchPlaceholder="搜索部门"
              />
              
              <div>
                <Label htmlFor="targetValue">目标值 *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="请输入目标值"
                />
              </div>
              
              <CustomSelect
                value={formData.unit_id}
                onChange={(value) => setFormData({ ...formData, unit_id: value })}
                options={units}
                placeholder="请选择单位"
                label="单位"
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <PermissionGuard permission="CREATE_TEAM_GOAL">
                <Button onClick={addGoal} className="flex-1">创建目标</Button>
              </PermissionGuard>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑目标对话框 */}
      {showEditDialog && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">编辑部门月度目标</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowEditDialog(false);
                setSelectedGoal(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-year">年份</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: Number(e.target.value) })}
                    placeholder="请输入年份"
                  />
                </div>
                <MonthSelect
                  value={editFormData.month}
                  onChange={(value) => setEditFormData({ ...editFormData, month: value })}
                  label="月份"
                />
              </div>
              
              <div>
                <Label>关联年度目标（可选）</Label>
                <CustomSelect
                  value={editFormData.company_yearly_goal_id}
                  onChange={(value) => handleCompanyYearlyGoalChange(value, false)}
                  options={[
                    { id: 'none', name: '不关联年度目标' },
                    ...companyYearlyGoals.map(goal => ({
                      id: goal.id,
                      name: `${goal.year}年 - ${goal.title}`
                    }))
                  ]}
                  placeholder="选择年度目标（可选）"
                  label=""
                />
              </div>
              
              {editFormData.company_yearly_goal_id === 'none' && (
                <div>
                  <Label htmlFor="edit-title">目标标题 *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="请输入目标标题"
                  />
                </div>
              )}
              
              <SearchableSelect
                value={editFormData.department_id}
                onChange={(value) => setEditFormData({ ...editFormData, department_id: value })}
                options={departments}
                placeholder="请选择部门"
                label="部门 *"
                searchPlaceholder="搜索部门"
              />
              
              <div>
                <Label htmlFor="edit-targetValue">目标值</Label>
                <Input
                  id="edit-targetValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.target_value}
                  onChange={(e) => setEditFormData({ ...editFormData, target_value: e.target.value })}
                  placeholder="请输入目标值"
                />
              </div>
              
              <CustomSelect
                value={editFormData.unit_id}
                onChange={(value) => setEditFormData({ ...editFormData, unit_id: value })}
                options={units}
                placeholder="请选择单位"
                label="单位"
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={updateGoal} className="flex-1">更新目标</Button>
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setSelectedGoal(null);
              }} className="flex-1">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* 拆分到个人对话框 */}
      {showSplitDialog && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">拆分到个人 - {selectedGoal.department?.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowSplitDialog(false);
                setSelectedGoal(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>部门目标值: {selectedGoal.target_value.toLocaleString()} {getUnitName(selectedGoal.unit_id)}</p>
                <p>年份: {selectedGoal.year}年{selectedGoal.month}月</p>
              </div>
              
              {/* 个人目标项列表 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">个人目标项</h4>
                  <Button size="sm" variant="outline" onClick={addPersonalGoalItem}>
                    <Plus className="h-3 w-3 mr-1" />
                    添加
                  </Button>
                </div>
                
                {personalGoalItems.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    点击"添加"按钮创建个人目标项
                  </div>
                )}
                
                {personalGoalItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">个人目标 #{index + 1}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 h-6 w-6 p-0"
                        onClick={() => removePersonalGoalItem(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <SearchableSelect
                        value={item.user_id}
                        onChange={(value) => updatePersonalGoalItem(index, 'user_id', value)}
                        options={departmentMembers}
                        placeholder="请选择人员"
                        label="选择人员 *"
                        searchPlaceholder="搜索人员"
                      />
                      
                      <div>
                        <Label htmlFor={`target-${index}`}>目标值 *</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`target-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.target_value}
                            onChange={(e) => updatePersonalGoalItem(index, 'target_value', e.target.value)}
                            placeholder="0"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {getUnitName(selectedGoal.unit_id)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <Label>占比（%）</Label>
                        <div className="h-10 px-3 py-2 bg-muted border border-input rounded-md flex items-center text-muted-foreground">
                          {item.ratio.toFixed(2)}%
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`remark-${index}`}>备注</Label>
                        <Input
                          id={`remark-${index}`}
                          value={item.remark}
                          onChange={(e) => updatePersonalGoalItem(index, 'remark', e.target.value)}
                          placeholder="可选"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleConfirmSplit}
                disabled={!isAllItemsValid()}
                className="flex-1"
              >
                确认拆分
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSplitDialog(false);
                  setSelectedGoal(null);
                }} 
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMonthlyGoals;
