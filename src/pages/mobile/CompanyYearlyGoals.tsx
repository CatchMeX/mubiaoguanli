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
  Search
} from 'lucide-react';
import { companyYearlyGoalService } from '@/services/goalService';
import { goalAPI, departmentAPI } from '@/services/api';
import unitAPI from '@/services/unitAPI';
import type { CompanyYearlyGoal, QuarterlyGoal } from '@/types';
import type { Unit } from '@/services/unitAPI';
import type { Department } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard, usePermissions } from '@/hooks/usePermissions';

interface CompanyGoal {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  currentValue: string;
  unit: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  startDate: string;
  endDate: string;
  responsiblePerson: string;
  priority: 'high' | 'medium' | 'low';
}

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
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className="w-full p-2 text-left hover:bg-accent first:rounded-t-md last:rounded-b-md"
                >
                  {option.name}
                </button>
              ))}
            </div>
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

const CompanyYearlyGoals = () => {
  const { hasPermission } = usePermissions();
  
  // 检查页面访问权限
  if (!hasPermission('COMPANY_YEARLY_GOAL')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">权限不足</h2>
          <p className="text-muted-foreground">您没有访问公司年度目标页面的权限</p>
        </div>
      </div>
    );
  }
  
  const [goals, setGoals] = useState<CompanyYearlyGoal[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CompanyYearlyGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed' | 'overdue'>('all');
  const [selectedGoal, setSelectedGoal] = useState<CompanyYearlyGoal | null>(null);
  const [showTeamGoals, setShowTeamGoals] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitFormData, setSplitFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department_id: '',
    company_yearly_goal_id: '',
    title: '',
    target_value: '',
    unit_id: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // 新增目标表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    targetValue: '',
    unit_id: '',
    quarters: [
      { quarter: 1, targetValue: '' },
      { quarter: 2, targetValue: '' },
      { quarter: 3, targetValue: '' },
      { quarter: 4, targetValue: '' },
    ],
  });

  // 编辑目标表单状态
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    targetValue: '',
    unit_id: '',
    quarters: [
      { quarter: 1, targetValue: '' },
      { quarter: 2, targetValue: '' },
      { quarter: 3, targetValue: '' },
      { quarter: 4, targetValue: '' },
    ],
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      year: new Date().getFullYear(),
      targetValue: '',
      unit_id: '',
      quarters: [
        { quarter: 1, targetValue: '' },
        { quarter: 2, targetValue: '' },
        { quarter: 3, targetValue: '' },
        { quarter: 4, targetValue: '' },
      ],
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      title: '',
      description: '',
      year: new Date().getFullYear(),
      targetValue: '',
      unit_id: '',
      quarters: [
        { quarter: 1, targetValue: '' },
        { quarter: 2, targetValue: '' },
        { quarter: 3, targetValue: '' },
        { quarter: 4, targetValue: '' },
      ],
    });
  };

  // 更新季度目标
  const updateQuarterTarget = (quarter: number, value: string, isEdit = false) => {
    const setData = isEdit ? setEditFormData : setFormData;
    const data = isEdit ? editFormData : formData;
    
    setData({
      ...data,
      quarters: data.quarters.map(q => 
        q.quarter === quarter ? { ...q, targetValue: value } : q
      )
    });
  };

  // 加载数据
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const [goalsData, unitsData, departmentsData] = await Promise.all([
        companyYearlyGoalService.getAll(),
        unitAPI.getAll(),
        departmentAPI.getAll()
      ]);
      setGoals(goalsData);
      setUnits(unitsData);
      setDepartments(departmentsData);
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

  // 添加目标
  const addGoal = async () => {
    // 验证必填字段
    if (!formData.title?.trim()) {
      toast({
        title: '目标标题不能为空',
        description: '目标标题不能为空',
      });
      return;
    }
    
    const targetValue = parseFloat(formData.targetValue);
    if (isNaN(targetValue) || targetValue <= 0) {
      toast({
        title: '年度目标值必须大于0',
        description: '年度目标值必须大于0',
      });
      return;
    }
    
    if (!formData.unit_id) {
      toast({
        title: '目标单位不能为空',
        description: '目标单位不能为空',
      });
      return;
    }

    try {
      const newGoal = await companyYearlyGoalService.create({
        title: formData.title,
        description: formData.description || '',
        year: formData.year,
        target_value: targetValue,
        unit_id: formData.unit_id,
        created_by: user?.id,
        status: 'active'
      });

      // 创建季度目标
      if (formData.quarters && formData.quarters.length > 0) {
        for (const quarter of formData.quarters) {
          const quarterTargetValue = parseFloat(quarter.targetValue);
          if (quarter.quarter && !isNaN(quarterTargetValue) && quarterTargetValue > 0) {
            await goalAPI.createQuarterlyGoal({
              company_yearly_goal_id: newGoal.id,
              quarter: quarter.quarter as 1 | 2 | 3 | 4,
              target_value: quarterTargetValue,
              percentage: (quarterTargetValue / targetValue) * 100,
              basis: ''
            });
          }
        }
      }

      await loadGoals();
      setShowAddForm(false);
      resetForm();
      toast({
        title: '年度目标添加成功！',
        description: '年度目标添加成功！',
      });
    } catch (err) {
      console.error('添加年度目标失败:', err);
      toast({
        title: '添加年度目标失败',
        description: err instanceof Error ? err.message : '未知错误',
      });
    }
  };

  // 编辑目标
  const editGoal = async (goal: CompanyYearlyGoal) => {
    setSelectedGoal(goal);
    setEditFormData({
      title: goal.title,
      description: goal.description || '',
      year: goal.year,
      targetValue: goal.target_value.toString(),
      unit_id: goal.unit_id || '',
      quarters: goal.quarters?.map(q => ({
        quarter: q.quarter,
        targetValue: q.target_value.toString()
      })) || [
        { quarter: 1, targetValue: '' },
        { quarter: 2, targetValue: '' },
        { quarter: 3, targetValue: '' },
        { quarter: 4, targetValue: '' },
      ]
    });
  };

  const updateGoal = async () => {
    if (!selectedGoal) return;

    // 验证必填字段
    if (!editFormData.title?.trim()) {
      toast({
        title: '目标标题不能为空',
        description: '目标标题不能为空',
      });
      return;
    }
    
    const targetValue = parseFloat(editFormData.targetValue);
    if (isNaN(targetValue) || targetValue <= 0) {
      toast({
        title: '年度目标值必须大于0',
        description: '年度目标值必须大于0',
      });
      return;
    }
    
    if (!editFormData.unit_id) {
      toast({
        title: '目标单位不能为空',
        description: '目标单位不能为空',
      });
      return;
    }

    try {
      await companyYearlyGoalService.update(selectedGoal.id, {
        title: editFormData.title,
        description: editFormData.description || '',
        year: editFormData.year,
        target_value: targetValue,
        unit_id: editFormData.unit_id
      });

      // 更新季度目标
      if (editFormData.quarters && editFormData.quarters.length > 0) {
        for (const quarter of editFormData.quarters) {
          const quarterTargetValue = parseFloat(quarter.targetValue);
          if (quarter.quarter && !isNaN(quarterTargetValue) && quarterTargetValue > 0) {
            const existingQuarter = selectedGoal.quarters?.find(q => q.quarter === quarter.quarter);
            if (existingQuarter) {
              await goalAPI.updateQuarterlyGoal(existingQuarter.id, {
                target_value: quarterTargetValue,
                percentage: (quarterTargetValue / targetValue) * 100
              });
            } else {
              await goalAPI.createQuarterlyGoal({
                company_yearly_goal_id: selectedGoal.id,
                quarter: quarter.quarter as 1 | 2 | 3 | 4,
                target_value: quarterTargetValue,
                percentage: (quarterTargetValue / targetValue) * 100,
                basis: ''
              });
            }
          }
        }
      }

      await loadGoals();
      setSelectedGoal(null);
      resetEditForm();
      toast({
        title: '年度目标更新成功！',
        description: '年度目标更新成功！',
      });
    } catch (err) {
      console.error('更新年度目标失败:', err);
      toast({
        title: '更新年度目标失败',
        description: err instanceof Error ? err.message : '未知错误',
      });
    }
  };

  // 删除目标
  const deleteGoal = async (goal: CompanyYearlyGoal) => {
    try {
      await companyYearlyGoalService.delete(goal.id);
      await loadGoals();
      toast({
        title: '年度目标删除成功！',
        description: '年度目标删除成功！',
      });
    } catch (err) {
      console.error('删除年度目标失败:', err);
      toast({
        title: '删除年度目标失败',
        description: err instanceof Error ? err.message : '未知错误',
      });
    }
  };

  // 查看下级目标
  const viewTeamGoals = (goal: CompanyYearlyGoal) => {
    setSelectedGoal(goal);
    setShowTeamGoals(true);
  };

  // 拆分到部门
  const splitToDepartments = (goal: CompanyYearlyGoal) => {
    setSelectedGoal(goal);
    setShowSplitDialog(true);
    setSplitFormData({
      year: goal.year,
      month: new Date().getMonth() + 1,
      department_id: '',
      company_yearly_goal_id: goal.id,
      title: '',
      target_value: '',
      unit_id: goal.unit_id || '',
    });
  };

  // 创建部门月度目标
  const createTeamGoal = async () => {
    if (!splitFormData.department_id || !splitFormData.target_value) {
      toast({
        title: '请填写完整信息',
        description: '部门和目标值不能为空',
      });
      return;
    }

    try {
      await goalAPI.createTeamMonthlyGoal({
        year: splitFormData.year,
        month: splitFormData.month,
        department_id: splitFormData.department_id,
        company_yearly_goal_id: splitFormData.company_yearly_goal_id,
        title: `${splitFormData.year}年${splitFormData.month}月目标`,
        target_value: parseFloat(splitFormData.target_value),
        unit_id: splitFormData.unit_id,
        created_by: user?.id,
      });

      await loadGoals();
      setShowSplitDialog(false);
      setSelectedGoal(null);
      setSplitFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        department_id: '',
        company_yearly_goal_id: '',
        title: '',
        target_value: '',
        unit_id: '',
      });
      toast({
        title: '部门月度目标创建成功！',
        description: '部门月度目标创建成功！',
      });
    } catch (err) {
      console.error('创建部门月度目标失败:', err);
      toast({
        title: '创建部门月度目标失败',
        description: err instanceof Error ? err.message : '未知错误',
      });
    }
  };

  // 计算基于个人月度目标日报的实际收入
  const calculateActualRevenueFromReports = (goal: CompanyYearlyGoal): number => {
    if (!goal.team_monthly_goals) return 0;
    
    let totalActualRevenue = 0;
    
    // 遍历所有团队月度目标，过滤掉已删除的
    goal.team_monthly_goals
      .filter(teamGoal => !teamGoal.deleted_at) // 过滤掉已删除的团队月度目标
      .forEach(teamGoal => {
        if (teamGoal.personalGoals) {
          teamGoal.personalGoals
            .filter(personalGoal => !personalGoal.team_goal_deleted) // 过滤掉关联的团队目标已删除的个人目标
            .forEach(personalGoal => {
              if (personalGoal.dailyReports) {
                const personalActualRevenue = personalGoal.dailyReports.reduce(
                  (sum: number, report: any) => sum + (report.performance_value || 0),
                  0
                );
                totalActualRevenue += personalActualRevenue;
              }
            });
        }
      });
    
    return totalActualRevenue;
  };

  // 计算目标进度
  const calculateProgress = (goal: CompanyYearlyGoal) => {
    const actualRevenue = calculateActualRevenueFromReports(goal);
    return Math.round((actualRevenue / goal.target_value) * 100);
  };

  // 计算部门月度目标进度
  const calculateTeamGoalProgress = (teamGoal: any): number => {
    if (!teamGoal.personalGoals) return teamGoal.progress || 0;
    
    let totalActualValue = 0;
    let totalTargetValue = 0;
    
    teamGoal.personalGoals
      .filter((personalGoal: any) => !personalGoal.team_goal_deleted)
      .forEach((personalGoal: any) => {
        if (personalGoal.dailyReports) {
          const personalActualValue = personalGoal.dailyReports.reduce(
            (sum: number, report: any) => sum + (report.performance_value || 0),
            0
          );
          totalActualValue += personalActualValue;
        }
        totalTargetValue += personalGoal.target_value || 0;
      });
    
    if (totalTargetValue === 0) return 0;
    return Math.round((totalActualValue / totalTargetValue) * 100);
  };

  // 计算部门月度目标的实际完成值
  const calculateTeamGoalActualValue = (teamGoal: any): number => {
    if (!teamGoal.personalGoals) return 0;
    
    let totalActualValue = 0;
    
    teamGoal.personalGoals
      .filter((personalGoal: any) => !personalGoal.team_goal_deleted)
      .forEach((personalGoal: any) => {
        if (personalGoal.dailyReports) {
          const personalActualValue = personalGoal.dailyReports.reduce(
            (sum: number, report: any) => sum + (report.performance_value || 0),
            0
          );
          totalActualValue += personalActualValue;
        }
      });
    
    return totalActualValue;
  };

  // 获取状态徽章
  const getStatusBadge = (goal: CompanyYearlyGoal) => {
    const progress = calculateProgress(goal);
    
    if (progress >= 100) {
      return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
    } else if (progress >= 80) {
      return <Badge className="bg-blue-100 text-blue-800">进行中</Badge>;
    } else if (progress >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">进行中</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">待完成</Badge>;
    }
  };

  // 获取状态标签
  const getStatusLabel = (goal: CompanyYearlyGoal) => {
    const progress = calculateProgress(goal);
    
    if (progress >= 100) {
      return '已完成';
    } else if (progress >= 80) {
      return '进行中';
    } else if (progress >= 50) {
      return '进行中';
    } else {
      return '待完成';
    }
  };

  // 获取状态颜色
  const getStatusColor = (goal: CompanyYearlyGoal) => {
    const progress = calculateProgress(goal);
    
    if (progress >= 100) {
      return 'bg-green-100 text-green-800';
    } else if (progress >= 80) {
      return 'bg-blue-100 text-blue-800';
    } else if (progress >= 50) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  // 获取单位名称
  const getUnitName = (unitId?: string) => {
    if (!unitId) return '';
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : '';
  };

  // 获取创建人姓名
  const getCreatorName = (goal: CompanyYearlyGoal) => {
    return goal.creator?.name || '未知';
  };

  // 过滤目标
  const filteredGoals = goals.filter(goal => {
    const progress = calculateProgress(goal);
    if (filter === 'all') return true;
    if (filter === 'completed') return progress >= 100;
    if (filter === 'in-progress') return progress >= 50 && progress < 100;
    if (filter === 'not-started') return progress < 50;
    return true;
  });

  // 计算统计数据
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => calculateProgress(g) >= 100).length;
  const inProgressGoals = goals.filter(g => {
    const progress = calculateProgress(g);
    return progress >= 50 && progress < 100;
  }).length;
  const notStartedGoals = goals.filter(g => calculateProgress(g) < 50).length;
  const overallProgress = totalGoals > 0 
    ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g), 0) / totalGoals)
    : 0;

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
          <Button onClick={loadGoals} className="mt-2">重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">年度目标数</p>
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
                <p className="text-2xl font-bold">{notStartedGoals}</p>
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
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'not-started', label: '待完成' },
              { key: 'in-progress', label: '进行中' },
              { key: 'completed', label: '已完成' }
            ].map((filterOption) => (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption.key as any)}
                className="whitespace-nowrap"
              >
                {filterOption.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 目标列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">目标列表</CardTitle>
            <PermissionGuard permission="CREATE_COMPANY_GOAL">
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                添加目标
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredGoals.map((goal) => {
            const progress = calculateProgress(goal);
            const actualRevenue = calculateActualRevenueFromReports(goal);
            const targetValue = goal.target_value || 0;
            
            return (
              <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`text-xs ${getStatusColor(goal)}`}>
                        {getStatusLabel(goal)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {goal.year}年
                      </Badge>
                      <div className="flex gap-1 ml-auto">
                        <Button size="sm" variant="ghost" onClick={() => viewTeamGoals(goal)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <PermissionGuard permission="SPLIT_YEARLY_GOAL">
                          <Button size="sm" variant="ghost" onClick={() => splitToDepartments(goal)}>
                            <Target className="h-3 w-3" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="EDIT_COMPANY_GOAL">
                          <Button size="sm" variant="ghost" onClick={() => editGoal(goal)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="DELETE_COMPANY_GOAL">
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteGoal(goal)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-sm mb-1">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-muted-foreground">目标值: </span>
                        <span className="font-medium">{targetValue.toLocaleString()} {getUnitName(goal.unit_id)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">当前值: </span>
                        <span className="font-medium">{actualRevenue.toLocaleString()} {getUnitName(goal.unit_id)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">创建人: </span>
                        <span className="font-medium">{getCreatorName(goal)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">创建时间: </span>
                        <span className="font-medium">{new Date(goal.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>进度</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 添加目标对话框 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">添加年度目标</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">目标标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入目标标题"
                />
              </div>
              
              <div>
                <Label htmlFor="year">目标年度 *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="请输入目标年度"
                />
              </div>
              
              <div>
                <Label htmlFor="targetValue">年度目标值 *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="请输入目标值"
                />
              </div>
              
              <CustomSelect
                value={formData.unit_id}
                onChange={(value) => setFormData({ ...formData, unit_id: value })}
                options={units}
                placeholder="请选择单位"
                label="目标单位 *"
              />
              
              <div>
                <Label htmlFor="description">目标描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入目标描述"
                  rows={3}
                />
              </div>

              {/* 季度目标分解 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">季度目标分解</h4>
                {formData.quarters.map((quarter) => (
                  <div key={quarter.quarter} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="flex-shrink-0 w-16">
                      <span className="text-sm font-medium">第{quarter.quarter}季度</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={quarter.targetValue}
                        onChange={(e) => updateQuarterTarget(quarter.quarter, e.target.value)}
                        placeholder="季度目标值"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex-shrink-0 w-16 text-right">
                      <span className="text-xs text-muted-foreground">
                        {parseFloat(formData.targetValue) > 0 ? Math.round((parseFloat(quarter.targetValue) / parseFloat(formData.targetValue)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <PermissionGuard permission="CREATE_COMPANY_GOAL">
                <Button onClick={addGoal} className="flex-1">添加目标</Button>
              </PermissionGuard>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑目标对话框 */}
      {selectedGoal && !showTeamGoals && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">编辑年度目标</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedGoal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">目标标题 *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="请输入目标标题"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-year">目标年度 *</Label>
                <Input
                  id="edit-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="请输入目标年度"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-targetValue">年度目标值 *</Label>
                <Input
                  id="edit-targetValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.targetValue}
                  onChange={(e) => setEditFormData({ ...editFormData, targetValue: e.target.value })}
                  placeholder="请输入目标值"
                />
              </div>
              
              <CustomSelect
                value={editFormData.unit_id}
                onChange={(value) => setEditFormData({ ...editFormData, unit_id: value })}
                options={units}
                placeholder="请选择单位"
                label="目标单位 *"
              />
              
              <div>
                <Label htmlFor="edit-description">目标描述</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="请输入目标描述"
                  rows={3}
                />
              </div>

              {/* 季度目标分解 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">季度目标分解</h4>
                {editFormData.quarters.map((quarter) => (
                  <div key={quarter.quarter} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="flex-shrink-0 w-16">
                      <span className="text-sm font-medium">第{quarter.quarter}季度</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={quarter.targetValue}
                        onChange={(e) => updateQuarterTarget(quarter.quarter, e.target.value, true)}
                        placeholder="季度目标值"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex-shrink-0 w-16 text-right">
                      <span className="text-xs text-muted-foreground">
                        {parseFloat(editFormData.targetValue) > 0 ? Math.round((parseFloat(quarter.targetValue) / parseFloat(editFormData.targetValue)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={updateGoal} className="flex-1">更新目标</Button>
              <Button variant="outline" onClick={() => setSelectedGoal(null)} className="flex-1">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* 查看下级部门月度目标对话框 */}
      {showTeamGoals && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">下级部门月度目标 - {selectedGoal.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowTeamGoals(false);
                setSelectedGoal(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {selectedGoal.team_monthly_goals && selectedGoal.team_monthly_goals.filter(teamGoal => !teamGoal.deleted_at).length > 0 ? (
                selectedGoal.team_monthly_goals
                  .filter(teamGoal => !teamGoal.deleted_at)
                  .map((teamGoal) => {
                    const teamProgress = calculateTeamGoalProgress(teamGoal);
                    const teamActualValue = calculateTeamGoalActualValue(teamGoal);
                    
                    return (
                      <div key={teamGoal.id} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">部门名称: </span>
                            <span className="font-medium">{teamGoal.department?.name || '未知部门'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">年月: </span>
                            <span className="font-medium">{teamGoal.year}年{teamGoal.month}月</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">实际值/目标值: </span>
                            <span className="font-medium">
                              {teamActualValue.toLocaleString()} / {teamGoal.target_value.toLocaleString()} {getUnitName(teamGoal.unit_id)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">进度: </span>
                            <span className="font-medium">{teamProgress}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">创建人: </span>
                            <span className="font-medium">{teamGoal.creator?.name || '未知'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">创建时间: </span>
                            <span className="font-medium">{new Date(teamGoal.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>进度</span>
                            <span>{teamProgress}%</span>
                          </div>
                          <Progress value={Math.min(teamProgress, 100)} className="h-2" />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无下级部门月度目标
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <Button variant="outline" onClick={() => {
                setShowTeamGoals(false);
                setSelectedGoal(null);
              }} className="w-full">关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* 拆分到部门对话框 */}
      {showSplitDialog && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">拆分到部门</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowSplitDialog(false);
                setSelectedGoal(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="split-year">年份</Label>
                <Input
                  id="split-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={splitFormData.year}
                  onChange={(e) => setSplitFormData({ ...splitFormData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="请输入年份"
                />
              </div>
              
              <div>
                <Label htmlFor="split-month">月份</Label>
                <CustomSelect
                  value={splitFormData.month.toString()}
                  onChange={(value) => setSplitFormData({ ...splitFormData, month: parseInt(value) })}
                  options={[
                    { id: '1', name: '1月' },
                    { id: '2', name: '2月' },
                    { id: '3', name: '3月' },
                    { id: '4', name: '4月' },
                    { id: '5', name: '5月' },
                    { id: '6', name: '6月' },
                    { id: '7', name: '7月' },
                    { id: '8', name: '8月' },
                    { id: '9', name: '9月' },
                    { id: '10', name: '10月' },
                    { id: '11', name: '11月' },
                    { id: '12', name: '12月' },
                  ]}
                  placeholder="请选择月份"
                  label=""
                />
              </div>
              
              <SearchableSelect
                value={splitFormData.department_id}
                onChange={(value) => setSplitFormData({ ...splitFormData, department_id: value })}
                options={departments}
                placeholder="请选择部门"
                label="部门 *"
                searchPlaceholder="搜索部门"
              />
              

              
              <div>
                <Label htmlFor="split-targetValue">目标值 *</Label>
                <Input
                  id="split-targetValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={splitFormData.target_value}
                  onChange={(e) => setSplitFormData({ ...splitFormData, target_value: e.target.value })}
                  placeholder="请输入目标值"
                />
              </div>
              
              <div>
                <Label htmlFor="split-unit">单位</Label>
                <Input
                  id="split-unit"
                  value={selectedGoal?.unit_id ? units.find(u => u.id === selectedGoal.unit_id)?.name || '元' : '元'}
                  readOnly
                  className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={createTeamGoal} className="flex-1">创建部门目标</Button>
              <Button variant="outline" onClick={() => {
                setShowSplitDialog(false);
                setSelectedGoal(null);
              }} className="flex-1">取消</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyYearlyGoals;
