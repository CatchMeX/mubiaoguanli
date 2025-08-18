import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  BarChart3,
  Loader2,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Split,
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { companyYearlyGoalService } from '@/services/goalService';
import { goalAPI, departmentAPI } from '@/services/api';
import unitAPI from '@/services/unitAPI';
import type { CompanyYearlyGoal, QuarterlyGoal } from '@/types';
import type { Unit } from '@/services/unitAPI';
import type { Department } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentSelect from '@/components/DepartmentSelect';
import { PermissionGuard } from '@/hooks/usePermissions';

const CompanyYearlyGoals = () => {
  const [goals, setGoals] = useState<CompanyYearlyGoal[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState<CompanyYearlyGoal | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [expandedTeamGoals, setExpandedTeamGoals] = useState<Set<string>>(new Set());
  const [isSplitToTeamDialogOpen, setIsSplitToTeamDialogOpen] = useState(false);
  const [selectedGoalForSplit, setSelectedGoalForSplit] = useState<CompanyYearlyGoal | null>(null);
  const [teamFormData, setTeamFormData] = useState({
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
    } catch (err) {
      console.error('加载年度目标失败:', err);
      toast({
        title: '加载年度目标失败',
        description: err instanceof Error ? err.message : '加载年度目标失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

      await loadGoals(); // 重新加载数据
      setIsAddDialogOpen(false);
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
    
    setIsEditDialogOpen(true);
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
      setIsEditDialogOpen(false);
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



  // 计算基于个人月度目标日报的实际收入
  const calculateActualRevenueFromReports = (goal: CompanyYearlyGoal): number => {
    if (!goal.team_monthly_goals) return 0;
    
    let totalActualRevenue = 0;
    
    // 遍历所有团队月度目标
    goal.team_monthly_goals.forEach(teamGoal => {
      if (teamGoal.personalGoals) {
        // 遍历每个团队目标下的个人目标
        teamGoal.personalGoals.forEach(personalGoal => {
          if (personalGoal.dailyReports) {
            // 累加所有日报的performance_value
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

  const calculateProgress = (goal: CompanyYearlyGoal) => {
    const actualRevenue = calculateActualRevenueFromReports(goal);
    return Math.round((actualRevenue / goal.target_value) * 100);
  };

  // 计算季度目标的实际收入
  const calculateQuarterActualRevenue = (goal: CompanyYearlyGoal, quarter: number): number => {
    if (!goal.team_monthly_goals) return 0;
    
    let quarterActualRevenue = 0;
    
    // 根据季度确定月份范围
    const quarterMonths = {
      1: [1, 2, 3],
      2: [4, 5, 6], 
      3: [7, 8, 9],
      4: [10, 11, 12]
    };
    
    const months = quarterMonths[quarter as keyof typeof quarterMonths] || [];
    
    // 遍历所有团队月度目标
    goal.team_monthly_goals.forEach(teamGoal => {
      // 只计算属于该季度的月份
      if (months.includes(teamGoal.month) && teamGoal.personalGoals) {
        teamGoal.personalGoals.forEach(personalGoal => {
          if (personalGoal.dailyReports) {
            const personalActualRevenue = personalGoal.dailyReports.reduce(
              (sum: number, report: any) => sum + (report.performance_value || 0),
              0
            );
            quarterActualRevenue += personalActualRevenue;
          }
        });
      }
    });
    
    return quarterActualRevenue;
  };

  const getStatusBadge = (goal: CompanyYearlyGoal) => {
    const progress = calculateProgress(goal);
    
    if (progress >= 100) {
      return <Badge className="bg-green-600 text-white">已完成</Badge>;
    } else if (progress >= 80) {
      return <Badge className="bg-blue-600 text-white">进行中</Badge>;
    } else if (progress >= 50) {
      return <Badge className="bg-yellow-600 text-white">进行中</Badge>;
    } else {
      return <Badge className="bg-red-600 text-white">待完成</Badge>;
    }
  };

  // 展开收缩处理函数
  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

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

  // 计算个人月度目标进度
  const calculatePersonalGoalProgress = (personalGoal: any): number => {
    if (!personalGoal.dailyReports) return personalGoal.progress || 0;
    
    const totalPerformance = personalGoal.dailyReports.reduce(
      (sum: number, report: any) => sum + (report.performance_value || 0), 
      0
    );
    
    return personalGoal.target_value > 0 ? Math.round((totalPerformance / personalGoal.target_value) * 100) : 0;
  };

  // 计算部门月度目标进度
  const calculateTeamGoalProgress = (teamGoal: any): number => {
    if (!teamGoal.personalGoals || teamGoal.personalGoals.length === 0) {
      return teamGoal.progress || 0;
    }
    
    let totalActualValue = 0;
    let totalTargetValue = 0;
    
    teamGoal.personalGoals.forEach((personalGoal: any) => {
      const personalProgress = calculatePersonalGoalProgress(personalGoal);
      const actualValue = Math.round((personalProgress * personalGoal.target_value / 100));
      totalActualValue += actualValue;
      totalTargetValue += personalGoal.target_value;
    });
    
    return totalTargetValue > 0 ? Math.round((totalActualValue / totalTargetValue) * 100) : 0;
  };

  // 处理拆分到部门
  const handleSplitToTeam = (goal: CompanyYearlyGoal) => {
    setSelectedGoalForSplit(goal);
    setTeamFormData({
      year: goal.year,
      month: new Date().getMonth() + 1,
      department_id: '',
      company_yearly_goal_id: goal.id,
      title: '',
      target_value: '',
      unit_id: goal.unit_id || '',
    });
    setIsSplitToTeamDialogOpen(true);
  };

  // 创建部门月度目标
  const handleCreateTeamGoal = async () => {
    try {
      // 检查必填字段
      if (!teamFormData.department_id) {
        toast({
          title: '请选择部门',
          description: '请选择部门',
          variant: 'destructive',
        });
        return;
      }
      

      
      if (!teamFormData.target_value || teamFormData.target_value.trim() === '') {
        toast({
          title: '请输入目标值',
          description: '请输入目标值',
          variant: 'destructive',
        });
        return;
      }

      const targetValue = parseFloat(teamFormData.target_value);
      
      if (isNaN(targetValue) || targetValue <= 0) {
        toast({
          title: '目标值必须大于0',
          description: '目标值必须大于0',
          variant: 'destructive',
        });
        return;
      }

      const goalData = {
        year: teamFormData.year,
        month: teamFormData.month,
        department_id: teamFormData.department_id,
        company_yearly_goal_id: teamFormData.company_yearly_goal_id,
        target_value: targetValue,
        unit_id: selectedGoalForSplit?.unit_id || undefined,
        created_by: user?.id,
        progress: 0,
        status: 'active' as const
      };

      await goalAPI.createTeamMonthlyGoal(goalData);
      setIsSplitToTeamDialogOpen(false);
      setTeamFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        department_id: '',
        company_yearly_goal_id: '',
        title: '',
        target_value: '',
        unit_id: '',
      });
      setSelectedGoalForSplit(null);
      
      // 重新加载数据
      await loadGoals();
      
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

  // 重置部门表单
  const resetTeamForm = () => {
    setTeamFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      department_id: '',
      company_yearly_goal_id: '',
      title: '',
      target_value: '',
      unit_id: '',
    });
    setSelectedGoalForSplit(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">正在加载年度目标数据...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background theme-transition">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadGoals}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">公司年度目标</h1>
            <p className="text-muted-foreground mt-1">设定和跟踪公司年度战略目标</p>
          </div>
          <PermissionGuard permission="CREATE_COMPANY_GOAL">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  新增年度目标
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>设定新的年度目标</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-foreground">
                        目标标题 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-background border-border text-foreground"
                        placeholder="请输入目标标题"
                      />
                    </div>
                    <div>
                      <Label htmlFor="year" className="text-foreground">
                        目标年度 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        min="2000"
                        max="2100"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="bg-background border-border text-foreground"
                        placeholder="请输入目标年度"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="targetValue" className="text-foreground">
                        年度目标值 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="targetValue"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        className="bg-background border-border text-foreground"
                        placeholder="请输入目标值"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit" className="text-foreground">
                        目标单位 <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="请选择单位" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-foreground">目标描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入目标描述"
                      rows={3}
                    />
                  </div>
                </div>

                {/* 季度分解 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">季度目标分解</h3>
                  <div className="space-y-3">
                    {formData.quarters.map((quarter, index) => (
                      <div key={quarter.quarter} className="flex items-center space-x-4 p-4 bg-card border border-border rounded-lg">
                        <div className="flex-shrink-0 w-20">
                          <span className="text-sm font-medium text-foreground">第{quarter.quarter}季度</span>
                        </div>
                        <div className="flex-1">
                          <Label className="text-foreground text-sm">目标值</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={quarter.targetValue}
                            onChange={(e) => updateQuarterTarget(quarter.quarter, e.target.value)}
                            className="bg-background border-border text-foreground mt-1"
                            placeholder="请输入季度目标值"
                          />
                        </div>
                        <div className="flex-shrink-0 w-20 text-right">
                          <span className="text-sm text-muted-foreground">
                            {parseFloat(formData.targetValue) > 0 ? Math.round((parseFloat(quarter.targetValue) / parseFloat(formData.targetValue)) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    季度目标总和：{formData.quarters.reduce((sum, q) => sum + (parseFloat(q.targetValue) || 0), 0)} {formData.unit_id ? units.find(u => u.id === formData.unit_id)?.name : ''}
                    {parseFloat(formData.targetValue) > 0 && (
                      <span className="ml-2">
                        (占年度目标 {Math.round((formData.quarters.reduce((sum, q) => sum + (parseFloat(q.targetValue) || 0), 0) / parseFloat(formData.targetValue)) * 100)}%)
                      </span>
                    )}
                  </div>
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
                    onClick={addGoal}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    设定目标
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
              <CardTitle className="text-sm font-medium text-muted-foreground">年度目标数</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{goals.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">待完成目标数</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {goals.filter(goal => calculateProgress(goal) < 100).length}
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
                {goals.filter(goal => calculateProgress(goal) >= 100).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均完成率</CardTitle>
              <Target className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {goals.length > 0 
                  ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g), 0) / goals.length)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选和排序 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="year-filter" className="text-sm">年份筛选:</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue placeholder="全部年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年份</SelectItem>
                  {Array.from(new Set(goals.map(goal => goal.year))).sort((a, b) => b - a).map(year => (
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

        {/* 年度目标列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">年度目标列表</CardTitle>
            
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground w-8"></TableHead>
                  <TableHead className="text-foreground">目标标题</TableHead>
                  <TableHead className="text-foreground">年度</TableHead>
                  <TableHead className="text-foreground">目标值</TableHead>
                  <TableHead className="text-foreground">完成进度</TableHead>
                  <TableHead className="text-foreground">状态</TableHead>
                  <TableHead className="text-foreground">创建人</TableHead>
                  <TableHead className="text-foreground">创建时间</TableHead>
                  <TableHead className="text-foreground">备注</TableHead>
                  <TableHead className="text-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals
                  .filter(goal => {
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
                        return (b.target_value || 0) - (a.target_value || 0);
                      case 'target_asc':
                        return (a.target_value || 0) - (b.target_value || 0);
                      default:
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                  })
                  .map((goal) => {
                  const progress = calculateProgress(goal);
                  const actualRevenue = calculateActualRevenueFromReports(goal);
                  const targetValue = goal.target_value || 0;
                  const isExpanded = expandedGoals.has(goal.id);
                  const hasTeamGoals = goal.team_monthly_goals && goal.team_monthly_goals.length > 0;
                  
                  return (
                    <>
                      <TableRow key={goal.id} className="border-border">
                        <TableCell className="w-8">
                          {hasTeamGoals && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleGoalExpansion(goal.id)}
                              className="h-6 w-6 p-0 hover:bg-accent transition-all duration-200"
                              title="展开查看下级目标"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{goal.title}</div>
                            {goal.description && (
                              <div className="text-sm text-muted-foreground mt-1">{goal.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{goal.year}年</TableCell>
                        <TableCell className="text-foreground">
                          {actualRevenue.toLocaleString()} / {targetValue.toLocaleString()} {goal.unit_id ? units.find(u => u.id === goal.unit_id)?.name : ''}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                            <div className="text-sm text-muted-foreground text-center">{progress}%</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(goal)}</TableCell>
                        <TableCell className="text-foreground">
                          {goal.creator?.name || '未知'}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {new Date(goal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <PermissionGuard permission="EDIT_COMPANY_GOAL">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editGoal(goal)}
                                className="border-border text-foreground hover:bg-accent"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="SPLIT_YEARLY_GOAL">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSplitToTeam(goal)}
                                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                              >
                                <Split className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="DELETE_COMPANY_GOAL">
                              <DeleteButton
                                onConfirm={() => deleteGoal(goal)}
                                itemName={`${goal.year}年的年度目标"${goal.title}"`}
                                variant="outline"
                              />
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* 展开的部门月度目标 */}
                      {isExpanded && hasTeamGoals && (
                        <>
                          {goal.team_monthly_goals?.map((teamGoal) => {
                            const isTeamExpanded = expandedTeamGoals.has(teamGoal.id);
                            const hasPersonalGoals = teamGoal.personalGoals && teamGoal.personalGoals.length > 0;
                            
                            return (
                              <>
                                <TableRow key={`team-${teamGoal.id}`} className="border-border bg-muted/30 hover:bg-muted/40 transition-colors">
                                  <TableCell className="w-8">
                                    {hasPersonalGoals && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleTeamGoalExpansion(teamGoal.id)}
                                        className="h-6 w-6 p-0 hover:bg-accent ml-4 transition-all duration-200"
                                        title="展开查看个人目标"
                                      >
                                        {isTeamExpanded ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="ml-4">
                                      <div className="font-medium text-foreground text-sm">
                                        {teamGoal.department?.name || '未知部门'}
                                      </div>
                                      {teamGoal.title && (
                                        <div className="text-xs text-muted-foreground mt-1">{teamGoal.title}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-foreground text-sm">
                                    {teamGoal.year}年{teamGoal.month}月
                                  </TableCell>
                                  <TableCell className="text-foreground text-sm">
                                    {(() => {
                                      const teamProgress = calculateTeamGoalProgress(teamGoal);
                                      return `${Math.round((teamProgress * teamGoal.target_value / 100))} / ${teamGoal.target_value.toLocaleString()} ${teamGoal.unit_id ? units.find(u => u.id === teamGoal.unit_id)?.name : ''}`;
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      {(() => {
                                        const teamProgress = calculateTeamGoalProgress(teamGoal);
                                        return (
                                          <>
                                            <Progress value={Math.min(teamProgress, 100)} className="h-2" />
                                            <div className="text-xs text-muted-foreground text-center">{teamProgress}%</div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">部门目标</Badge>
                                  </TableCell>
                                  <TableCell className="text-foreground text-sm">
                                    {teamGoal.creator?.name || '未知'}
                                  </TableCell>
                                  <TableCell className="text-foreground text-sm">
                                    {new Date(teamGoal.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell></TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                                
                                {/* 展开的个人月度目标 */}
                                {isTeamExpanded && hasPersonalGoals && (
                                  <>
                                    {teamGoal.personalGoals?.map((personalGoal) => {
                                      const personalProgress = calculatePersonalGoalProgress(personalGoal);
                                      
                                      return (
                                        <TableRow key={`personal-${personalGoal.id}`} className="border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                                          <TableCell className="w-8"></TableCell>
                                          <TableCell>
                                            <div className="ml-8">
                                              <div className="font-medium text-foreground text-sm">
                                                {personalGoal.user?.name || '未知成员'}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-foreground text-sm">
                                            {personalGoal.year}年{personalGoal.month}月
                                          </TableCell>
                                          <TableCell className="text-foreground text-sm">
                                            {Math.round((personalProgress * personalGoal.target_value / 100))} / {personalGoal.target_value.toLocaleString()} {personalGoal.unit_id ? units.find(u => u.id === personalGoal.unit_id)?.name : ''}
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <Progress value={Math.min(personalProgress, 100)} className="h-2" />
                                              <div className="text-xs text-muted-foreground text-center">{personalProgress}%</div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge className="bg-green-100 text-green-800 text-xs">个人目标</Badge>
                                          </TableCell>
                                          <TableCell className="text-foreground text-sm">
                                            {personalGoal.creator?.name || '未知'}
                                          </TableCell>
                                          <TableCell className="text-foreground text-sm">
                                            {new Date(personalGoal.created_at).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell>
                                            {personalGoal.remark && (
                                              <div className="text-xs text-muted-foreground max-w-32 truncate" title={personalGoal.remark}>
                                                {personalGoal.remark}
                                              </div>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}
                              </>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑目标对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>编辑年度目标</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title" className="text-foreground">
                      目标标题 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-title"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入目标标题"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-year" className="text-foreground">
                      目标年度 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={editFormData.year}
                      onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入目标年度"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-targetValue" className="text-foreground">
                      年度目标值 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-targetValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.targetValue}
                      onChange={(e) => setEditFormData({ ...editFormData, targetValue: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入目标值"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-unit" className="text-foreground">
                      目标单位 <span className="text-red-500">*</span>
                    </Label>
                    <Select value={editFormData.unit_id} onValueChange={(value) => setEditFormData({ ...editFormData, unit_id: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="请选择单位" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {units.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-foreground">目标描述</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入目标描述"
                    rows={3}
                  />
                </div>
              </div>

              {/* 季度分解 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">季度目标分解</h3>
                <div className="space-y-3">
                  {editFormData.quarters.map((quarter, index) => (
                    <div key={quarter.quarter} className="flex items-center space-x-4 p-4 bg-card border border-border rounded-lg">
                      <div className="flex-shrink-0 w-20">
                        <span className="text-sm font-medium text-foreground">第{quarter.quarter}季度</span>
                      </div>
                      <div className="flex-1">
                        <Label className="text-foreground text-sm">目标值</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={quarter.targetValue}
                          onChange={(e) => updateQuarterTarget(quarter.quarter, e.target.value, true)}
                          className="bg-background border-border text-foreground mt-1"
                          placeholder="请输入季度目标值"
                        />
                      </div>
                      <div className="flex-shrink-0 w-20 text-right">
                        <span className="text-sm text-muted-foreground">
                          {parseFloat(editFormData.targetValue) > 0 ? Math.round((parseFloat(quarter.targetValue) / parseFloat(editFormData.targetValue)) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  季度目标总和：{editFormData.quarters.reduce((sum, q) => sum + (parseFloat(q.targetValue) || 0), 0)} {editFormData.unit_id ? units.find(u => u.id === editFormData.unit_id)?.name : ''}
                  {parseFloat(editFormData.targetValue) > 0 && (
                    <span className="ml-2">
                      (占年度目标 {Math.round((editFormData.quarters.reduce((sum, q) => sum + (parseFloat(q.targetValue) || 0), 0) / parseFloat(editFormData.targetValue)) * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedGoal(null);
                    resetEditForm();
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={updateGoal}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  更新目标
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        {/* 拆分到部门对话框 */}
        <Dialog open={isSplitToTeamDialogOpen} onOpenChange={setIsSplitToTeamDialogOpen}>
          <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>拆分到部门</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedGoalForSplit && (
                <div className="bg-accent p-4 rounded-lg theme-transition">
                  <h4 className="font-medium text-foreground mb-3">公司目标信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">目标标题:</span>
                      <span className="font-medium text-foreground">{selectedGoalForSplit.title || `${selectedGoalForSplit.year}年度目标`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">年度:</span>
                      <span className="font-medium text-foreground">{selectedGoalForSplit.year}年</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">目标值:</span>
                      <span className="font-medium text-foreground">{selectedGoalForSplit.target_value?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">单位:</span>
                      <span className="font-medium text-foreground">{selectedGoalForSplit.unit_id ? units.find(u => u.id === selectedGoalForSplit.unit_id)?.name : '元'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamYear">年份</Label>
                  <Input 
                    id="teamYear" 
                    type="number" 
                    value={teamFormData.year}
                    onChange={(e) => setTeamFormData({...teamFormData, year: parseInt(e.target.value)})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="teamMonth">月份</Label>
                  <Select value={teamFormData.month.toString()} onValueChange={(value) => setTeamFormData({...teamFormData, month: parseInt(value)})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择月份" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="department">部门 <span className="text-red-500">*</span></Label>
                <DepartmentSelect
                  value={teamFormData.department_id}
                  onValueChange={(value) => setTeamFormData({...teamFormData, department_id: value})}
                  placeholder="选择部门"
                />
              </div>
              
              <div>
                <Label htmlFor="teamTargetValue">目标值 <span className="text-red-500">*</span></Label>
                <Input 
                  id="teamTargetValue" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={teamFormData.target_value}
                  onChange={(e) => setTeamFormData({...teamFormData, target_value: e.target.value})}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入目标值"
                />
              </div>
              
              <div>
                <Label htmlFor="teamUnit">单位</Label>
                <Input 
                  id="teamUnit" 
                  value={selectedGoalForSplit?.unit_id ? units.find(u => u.id === selectedGoalForSplit.unit_id)?.name || '元' : '元'}
                  readOnly
                  className="bg-muted border-border text-muted-foreground cursor-not-allowed" 
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsSplitToTeamDialogOpen(false);
                    resetTeamForm();
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleCreateTeamGoal}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  创建部门目标
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CompanyYearlyGoals;
