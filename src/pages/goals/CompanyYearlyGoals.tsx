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
  Eye,
  BarChart3,
  Loader2,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { companyYearlyGoalService } from '@/services/goalService';
import { goalAPI } from '@/services/api';
import unitAPI from '@/services/unitAPI';
import { keyIndicatorAPI, type KeyIndicator } from '@/services/keyIndicatorAPI';
import type { CompanyYearlyGoal, QuarterlyGoal } from '@/types';
import type { Unit } from '@/services/unitAPI';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CompanyYearlyGoals = () => {
  const [goals, setGoals] = useState<CompanyYearlyGoal[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<CompanyYearlyGoal | null>(null);
  const [keyIndicators, setKeyIndicators] = useState<KeyIndicator[]>([]);
  const [newIndicatorName, setNewIndicatorName] = useState('');
  const [goalKeyIndicators, setGoalKeyIndicators] = useState<Record<string, KeyIndicator[]>>({});
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
      const [goalsData, unitsData] = await Promise.all([
        companyYearlyGoalService.getAll(),
        unitAPI.getAll()
      ]);
      setGoals(goalsData);
      setUnits(unitsData);

      // 加载关键指标数据
      if (goalsData && goalsData.length > 0) {
        const keyIndicatorsPromises = goalsData.map(async (goal) => {
          try {
            const indicatorsData = await keyIndicatorAPI.getByCompanyYearlyGoalId(goal.id);
            return { goalId: goal.id, indicators: indicatorsData };
          } catch (error) {
            console.error(`加载关键指标失败 (目标ID: ${goal.id}):`, error);
            return { goalId: goal.id, indicators: [] };
          }
        });

        const keyIndicatorsResults = await Promise.all(keyIndicatorsPromises);
        const keyIndicatorsMap = keyIndicatorsResults.reduce((acc, result) => {
          acc[result.goalId] = result.indicators;
          return acc;
        }, {} as Record<string, KeyIndicator[]>);

        setGoalKeyIndicators(keyIndicatorsMap);
      }
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
    setKeyIndicators([]);
    setNewIndicatorName('');
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
    setKeyIndicators([]);
    setNewIndicatorName('');
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

      // 保存关键指标
      const savedIndicators: KeyIndicator[] = [];
      for (const indicator of keyIndicators) {
        if (indicator.id.startsWith('temp_')) {
          const savedIndicator = await keyIndicatorAPI.create(newGoal.id, indicator.indicator_name);
          savedIndicators.push(savedIndicator);
        }
      }
      
      // 更新本地状态
      setGoalKeyIndicators(prev => ({
        ...prev,
        [newGoal.id]: savedIndicators
      }));

      await loadGoals(); // 重新加载数据
      setIsAddDialogOpen(false);
      resetForm();
      setKeyIndicators([]);
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
    
    // 加载关键指标
    try {
      const indicators = await keyIndicatorAPI.getByCompanyYearlyGoalId(goal.id);
      setKeyIndicators(indicators);
    } catch (error) {
      console.error('加载关键指标失败:', error);
      setKeyIndicators([]);
    }
    
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

      // 保存关键指标
      const savedIndicators: KeyIndicator[] = [];
      for (const indicator of keyIndicators) {
        if (indicator.id.startsWith('temp_')) {
          const savedIndicator = await keyIndicatorAPI.create(selectedGoal.id, indicator.indicator_name);
          savedIndicators.push(savedIndicator);
        }
      }
      
      // 更新本地状态
      setGoalKeyIndicators(prev => ({
        ...prev,
        [selectedGoal.id]: savedIndicators
      }));

      await loadGoals();
      setIsEditDialogOpen(false);
      setSelectedGoal(null);
      resetEditForm();
      setKeyIndicators([]);
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
      // 删除关键指标
      await keyIndicatorAPI.deleteByCompanyYearlyGoalId(goal.id);
      
      // 删除年度目标
      await companyYearlyGoalService.delete(goal.id);
      
      // 更新本地状态
      setGoalKeyIndicators(prev => {
        const newState = { ...prev };
        delete newState[goal.id];
        return newState;
      });
      
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

  const viewGoalDetail = async (goal: CompanyYearlyGoal) => {
    setSelectedGoal(goal);
    
    // 加载关键指标
    try {
      const indicators = await keyIndicatorAPI.getByCompanyYearlyGoalId(goal.id);
      setKeyIndicators(indicators);
    } catch (error) {
      console.error('加载关键指标失败:', error);
      setKeyIndicators([]);
    }
    
    setIsDetailDialogOpen(true);
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

  // 添加关键指标
  const handleAddIndicator = () => {
    if (!newIndicatorName.trim()) {
      toast({
        title: '请输入关键指标名称',
        description: '请输入关键指标名称',
        variant: 'destructive',
      });
      return;
    }

    const indicatorName = newIndicatorName.trim();
    const newIndicator = {
      id: `temp_${Date.now()}`, // 临时ID
      company_yearly_goal_id: 'temp',
      indicator_name: indicatorName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setKeyIndicators(prev => [...prev, newIndicator]);
    setNewIndicatorName('');
    toast({
      title: '关键指标添加成功',
      description: `关键指标 "${indicatorName}" 已成功添加`,
      duration: 2000,
    });
  };

  // 删除关键指标
  const handleDeleteIndicator = async (indicator: KeyIndicator) => {
    try {
      if (!indicator.id.startsWith('temp_')) {
        await keyIndicatorAPI.delete(indicator.id);
      }
      setKeyIndicators(prev => prev.filter(item => item.id !== indicator.id));
      toast({
        title: '关键指标删除成功',
        description: `关键指标 "${indicator.indicator_name}" 已成功删除`,
        duration: 2000,
      });
    } catch (error) {
      console.error('删除关键指标失败:', error);
      toast({
        title: '删除关键指标失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
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

                {/* 关键指标 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">关键指标</h3>
                  <div className="space-y-3">
                    {/* 现有的关键指标 */}
                    <div className="flex flex-wrap gap-2">
                      {keyIndicators.map((indicator) => (
                        <div key={indicator.id} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                          <span className="text-sm font-medium">
                            {indicator.indicator_name}
                          </span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-4 w-4 p-0 hover:bg-primary/20 text-primary hover:text-primary"
                            onClick={() => handleDeleteIndicator(indicator)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* 添加新关键指标 */}
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={newIndicatorName}
                        onChange={(e) => setNewIndicatorName(e.target.value)}
                        placeholder="请输入关键指标名称"
                        className="bg-background border-border text-foreground flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddIndicator();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleAddIndicator}
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        添加
                      </Button>
                    </div>
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
                  <TableHead className="text-foreground">目标标题</TableHead>
                  <TableHead className="text-foreground">年度</TableHead>
                  <TableHead className="text-foreground">目标值</TableHead>
                  <TableHead className="text-foreground">关键指标</TableHead>
                  <TableHead className="text-foreground">完成进度</TableHead>
                  <TableHead className="text-foreground">状态</TableHead>
                  <TableHead className="text-foreground">创建人</TableHead>
                  <TableHead className="text-foreground">创建时间</TableHead>
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
                  // 使用基于日报的实际收入计算
                  const actualRevenue = calculateActualRevenueFromReports(goal);
                  // 使用正确的字段名 target_value
                  const targetValue = goal.target_value || 0;
                  

                  
                  return (
                    <TableRow key={goal.id} className="border-border">
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
                        <div className="flex flex-wrap gap-1">
                          {goalKeyIndicators[goal.id]?.map((indicator) => (
                            <span key={indicator.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {indicator.indicator_name}
                            </span>
                          ))}
                          {(!goalKeyIndicators[goal.id] || goalKeyIndicators[goal.id].length === 0) && (
                            <span className="text-xs text-muted-foreground">暂无关键指标</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                          <div className="text-sm text-muted-foreground">{progress}%</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(goal)}</TableCell>
                      <TableCell className="text-foreground">
                        {goal.creator?.name || '未知'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(goal.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewGoalDetail(goal)}
                            className="border-border text-foreground hover:bg-accent"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editGoal(goal)}
                            className="border-border text-foreground hover:bg-accent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onConfirm={() => deleteGoal(goal)}
                            itemName={`${goal.year}年的年度目标"${goal.title}"`}
                            variant="outline"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
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

              {/* 关键指标 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">关键指标</h3>
                <div className="space-y-3">
                  {/* 现有的关键指标 */}
                  <div className="flex flex-wrap gap-2">
                    {keyIndicators.map((indicator) => (
                      <div key={indicator.id} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                        <span className="text-sm font-medium">
                          {indicator.indicator_name}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-4 w-4 p-0 hover:bg-primary/20 text-primary hover:text-primary"
                          onClick={() => handleDeleteIndicator(indicator)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* 添加新关键指标 */}
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={newIndicatorName}
                      onChange={(e) => setNewIndicatorName(e.target.value)}
                      placeholder="请输入关键指标名称"
                      className="bg-background border-border text-foreground flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddIndicator();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddIndicator}
                      variant="outline"
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      添加
                    </Button>
                  </div>
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

        {/* 目标详情对话框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>年度目标详情</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">基本信息</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">目标标题：</span>
                        <span className="text-foreground">{selectedGoal.title}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">目标年度：</span>
                        <span className="text-foreground">{selectedGoal.year}年</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">目标值：</span>
                        <span className="text-foreground">{selectedGoal.target_value} {selectedGoal.unit_id ? units.find(u => u.id === selectedGoal.unit_id)?.name : ''}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">状态：</span>
                        {getStatusBadge(selectedGoal)}
                      </div>
                      {selectedGoal.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">描述：</span>
                          <p className="text-foreground mt-1">{selectedGoal.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">完成进度</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">整体进度</span>
                          <span className="text-foreground">{calculateProgress(selectedGoal)}%</span>
                        </div>
                        <Progress value={Math.min(calculateProgress(selectedGoal), 100)} className="h-4" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">实际完成：</span>
                        <span className="text-foreground">
                          {calculateActualRevenueFromReports(selectedGoal)} {selectedGoal.unit_id ? units.find(u => u.id === selectedGoal.unit_id)?.name : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 季度分解详情 */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">季度分解详情</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedGoal.quarters?.map((quarter, index) => (
                      <Card key={index} className="bg-accent border-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-foreground">Q{index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">目标值：</span>
                            <span className="text-sm text-foreground">{quarter.target_value} {selectedGoal.unit_id ? units.find(u => u.id === selectedGoal.unit_id)?.name : ''}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">实际值：</span>
                            <span className="text-sm text-foreground">{calculateQuarterActualRevenue(selectedGoal, index + 1)} {selectedGoal.unit_id ? units.find(u => u.id === selectedGoal.unit_id)?.name : ''}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">完成率：</span>
                            <span className="text-sm text-foreground">
                              {quarter.target_value > 0 ? Math.round((calculateQuarterActualRevenue(selectedGoal, index + 1) / quarter.target_value) * 100) : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={quarter.target_value > 0 ? (calculateQuarterActualRevenue(selectedGoal, index + 1) / quarter.target_value) * 100 : 0} 
                            className="h-1" 
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 关键指标详情 */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">关键指标</h3>
                  {keyIndicators.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {keyIndicators.map((indicator) => (
                        <div key={indicator.id} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                          <span className="text-sm font-medium">
                            {indicator.indicator_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      暂无关键指标
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    关闭
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CompanyYearlyGoals;
