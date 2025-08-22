import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Filter,
  Loader2,
  Plus,
  Split,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { goalAPI, userAPI } from '@/services/api';
import unitAPI from '@/services/unitAPI';
import type { CompanyYearlyGoal, TeamMonthlyGoal, PersonalMonthlyGoal } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentSelect from '@/components/DepartmentSelect';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';

interface GoalNodeProps {
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const GoalNode: React.FC<GoalNodeProps & { children: React.ReactNode }> = ({
  level,
  isExpanded,
  onToggle,
  children,
}) => {
  const indentClass = level === 0 ? '' : level === 1 ? 'ml-8' : 'ml-16';
  
  return (
    <div className={`relative ${indentClass}`}>
      {level > 0 && (
        <div className="absolute -left-4 top-6 w-4 h-px bg-border"></div>
      )}
      <div className="flex items-start space-x-3">
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-8 w-8 p-0 flex-shrink-0 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 transition-all duration-200 shadow-sm"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const PersonalGoalNode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative ml-16">
      <div className="absolute -left-4 top-6 w-4 h-px bg-border"></div>
      <div className="flex items-start space-x-3">
        <div className="mt-2 h-2 w-2 bg-primary rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

interface CompanyYearlyGoalCardProps {
  goal: CompanyYearlyGoal;
  isExpanded: boolean;
  onToggle: () => void;
  progress: number;
  actualRevenue: number;
}

const CompanyYearlyGoalCard: React.FC<CompanyYearlyGoalCardProps> = ({ 
  goal, 
  isExpanded, 
  onToggle, 
  progress, 
  actualRevenue,
  onSplitToTeam,
  onEdit,
  onDelete
}) => {
  return (
    <GoalNode level={0} isExpanded={isExpanded} onToggle={onToggle}>
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-300 flex items-center">
                <Target className="mr-2 h-5 w-5" />
                {goal.title || `${goal.year}年度目标`}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" />
                  <span>年度目标: {goal.target_value?.toLocaleString()} {goal.unit?.name || '元'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>{goal.year}年</span>
                </div>
                {goal.creator && (
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    <span>创建人: {goal.creator.name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>创建时间: {new Date(goal.created_at).toLocaleDateString()}</span>
                </div>
              </div>


            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {progress}%
                </div>
                <div className="text-xs text-muted-foreground">
                  完成进度
                </div>
              </div>

            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">实际完成:</span>
              <span className="font-medium">{actualRevenue.toLocaleString()} {goal.unit?.name || '元'}</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{actualRevenue.toLocaleString()} {goal.unit?.name || '元'}</span>
              <span>{goal.target_value?.toLocaleString()} {goal.unit?.name || '元'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </GoalNode>
  );
};

interface TeamMonthlyGoalCardProps {
  goal: TeamMonthlyGoal;
  isExpanded: boolean;
  onToggle: () => void;
  progress: number;
  actualRevenue: number;
}

const TeamMonthlyGoalCard: React.FC<TeamMonthlyGoalCardProps> = ({ 
  goal, 
  isExpanded, 
  onToggle, 
  progress, 
  actualRevenue
}) => {
  const getMonthName = (month: number) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[month - 1];
  };

  return (
    <GoalNode level={1} isExpanded={isExpanded} onToggle={onToggle}>
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold text-green-700 dark:text-green-300 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                {goal.title || `${goal.department?.name} - ${goal.year}年${getMonthName(goal.month)}目标`}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" />
                  <span>月度目标: {goal.target_value?.toLocaleString()} {goal.unit?.name || '元'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>{goal.year}年{getMonthName(goal.month)}</span>
                </div>
                {goal.company_yearly_goal && (
                  <div className="flex items-center">
                    <Target className="mr-1 h-4 w-4" />
                    <span>关联: {goal.company_yearly_goal.year}年{goal.company_yearly_goal.title}</span>
                  </div>
                )}
                {goal.creator && (
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    <span>创建人: {goal.creator.name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>创建时间: {new Date(goal.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right space-y-1">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {progress}%
                </div>
                <div className="text-xs text-muted-foreground">
                  完成进度
                </div>
              </div>

            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">实际完成:</span>
              <span className="font-medium">{actualRevenue.toLocaleString()} {goal.unit?.name || '元'}</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{actualRevenue.toLocaleString()} {goal.unit?.name || '元'}</span>
              <span>{goal.target_value?.toLocaleString()} {goal.unit?.name || '元'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </GoalNode>
  );
};

interface PersonalMonthlyGoalCardProps {
  goal: PersonalMonthlyGoal;
  progress: number;
  actualRevenue: number;
}

const PersonalMonthlyGoalCard: React.FC<PersonalMonthlyGoalCardProps> = ({ 
  goal, 
  progress, 
  actualRevenue 
}) => {
  return (
    <PersonalGoalNode>
      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/30 dark:to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                {goal.user?.name}的个人目标
              </CardTitle>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <DollarSign className="mr-1 h-3 w-3" />
                  <span>个人目标: {goal.target_value?.toLocaleString()} {goal.unit?.name || '元'}</span>
                </div>
                <div className="flex items-center">
                  <span>工号: {goal.user?.employee_id}</span>
                </div>
                {goal.creator && (
                  <div className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    <span>创建人: {goal.creator.name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>创建时间: {new Date(goal.created_at).toLocaleDateString()}</span>
                </div>
                {goal.team_goal_deleted && (
                  <div className="flex items-center">
                    <span className="text-red-500 font-medium">关联目标已删除</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {progress}%
              </div>
              <div className="text-xs text-muted-foreground">
                完成进度
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">实际完成:</span>
              <span className="font-medium">{actualRevenue.toLocaleString()} {goal.unit?.name || '元'}</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-1" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{actualRevenue.toLocaleString()} {goal.unit?.name || '元'}</span>
              <span>{goal.target_value?.toLocaleString()} {goal.unit?.name || '元'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PersonalGoalNode>
  );
};

const GoalDashboard = () => {
  const [expandedYearly, setExpandedYearly] = useState<Record<string, boolean>>({});
  const [expandedMonthly, setExpandedMonthly] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [allGoalData, setAllGoalData] = useState<{
    yearlyGoals: CompanyYearlyGoal[];
    teamMonthlyGoals: TeamMonthlyGoal[];
    personalMonthlyGoals: PersonalMonthlyGoal[];
  }>({
    yearlyGoals: [],
    teamMonthlyGoals: [],
    personalMonthlyGoals: []
  });

  // 拆分到团队对话框状态
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedCompanyGoal, setSelectedCompanyGoal] = useState<CompanyYearlyGoal | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department_id: '',
    company_yearly_goal_id: '',
    title: '', // 新增：目标标题字段
    target_value: '',
    unit_id: ''
  });

  // 拆分到个人对话框状态
  const [isPersonalDialogOpen, setIsPersonalDialogOpen] = useState(false);
  const [selectedTeamGoal, setSelectedTeamGoal] = useState<TeamMonthlyGoal | null>(null);
  const [personalFormData, setPersonalFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: '',
    team_monthly_goal_id: '',
    target_value: '',
    unit_id: ''
  });

  // 新增年度目标对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    targetValue: '',
    unit_id: ''
  });

  // 编辑年度目标对话框状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    description: '',
    year: new Date().getFullYear(),
    targetValue: '',
    unit_id: ''
  });
  const [selectedGoal, setSelectedGoal] = useState<CompanyYearlyGoal | null>(null);

  // 数据加载状态
  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // 首次加载所有目标数据以确定可用年份
  const loadAllGoalData = async () => {
    try {
      setLoading(true);
      // 不传年份参数，获取所有年份的数据
      const [data, usersData, unitsData] = await Promise.all([
        goalAPI.getGoalDashboardData(),
        userAPI.getAll(),
        unitAPI.getAll()
      ]);
      
      // 临时调试：检查单位数据
      console.log('目标看板数据:', {
        yearlyGoals: data.yearlyGoals?.map((g: any) => ({ id: g.id, unit: g.unit?.name })),
        teamMonthlyGoals: data.teamMonthlyGoals?.map((g: any) => ({ id: g.id, unit: g.unit?.name })),
        personalMonthlyGoals: data.personalMonthlyGoals?.map((g: any) => ({ id: g.id, unit: g.unit?.name }))
      });
      
      setAllGoalData(data);
      setUsers(usersData);
      setUnits(unitsData);
      
      // 确定默认选中的年份
      if (data.yearlyGoals.length > 0) {
        const currentYear = new Date().getFullYear();
        const availableYears = [...new Set(data.yearlyGoals.map((goal: any) => goal.year))].sort((a: any, b: any) => b - a);
        
        // 优先选择当前年度，如果没有则选择最新年度
        const defaultYear = availableYears.includes(currentYear) 
          ? currentYear.toString() 
          : (availableYears[0] as number).toString();
        
        setSelectedYear(defaultYear);
      }
    } catch (error) {
      console.error('加载目标数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllGoalData();
  }, []);

  // 处理拆分到团队
  const handleSplitToTeam = (companyGoal: CompanyYearlyGoal) => {
    setSelectedCompanyGoal(companyGoal);
    setTeamFormData({
      year: companyGoal.year,
      month: new Date().getMonth() + 1,
      department_id: '',
      company_yearly_goal_id: companyGoal.id, // 默认关联选中的年度目标
      title: '', // 新增：目标标题字段
      target_value: '',
      unit_id: companyGoal.unit_id || ''
    });
    setIsTeamDialogOpen(true);
  };

  // 处理拆分到个人
  const handleSplitToPersonal = (teamGoal: TeamMonthlyGoal) => {
    setSelectedTeamGoal(teamGoal);
    setPersonalFormData({
      year: teamGoal.year,
      month: teamGoal.month,
      user_id: '',
      team_monthly_goal_id: teamGoal.id,
      target_value: '',
      unit_id: teamGoal.unit_id || ''
    });
    setIsPersonalDialogOpen(true);
  };

  // 创建团队月度目标
  const handleCreateTeamGoal = async () => {
    try {
      console.log('部门表单数据:', teamFormData);
      console.log('目标值类型:', typeof teamFormData.target_value, '值:', teamFormData.target_value);
      
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
      
      // 如果不关联年度目标，则目标标题为必填
      if (teamFormData.company_yearly_goal_id === 'none' && !teamFormData.title.trim()) {
        toast({
          title: '请填写目标标题',
          description: '不关联年度目标时，目标标题为必填字段',
          variant: 'destructive',
        });
        return;
      }

      const targetValue = parseInt(teamFormData.target_value);
      console.log('解析后的目标值:', targetValue, '类型:', typeof targetValue);
      
      if (isNaN(targetValue) || targetValue <= 0) {
        console.log('目标值验证失败:', { isNaN: isNaN(targetValue), targetValue, originalValue: teamFormData.target_value });
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
        company_yearly_goal_id: teamFormData.company_yearly_goal_id === 'none' ? undefined : teamFormData.company_yearly_goal_id,
        title: teamFormData.company_yearly_goal_id === 'none' ? teamFormData.title : undefined, // 如果不关联年度目标，则使用自定义标题
        target_value: targetValue,
        unit_id: teamFormData.unit_id || undefined,
        created_by: user?.id,
        progress: 0,
        status: 'active' as const
      };

      await goalAPI.createTeamMonthlyGoal(goalData);
      setIsTeamDialogOpen(false);
      setTeamFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        department_id: '',
        company_yearly_goal_id: '',
        title: '', // 新增：目标标题字段
        target_value: '',
        unit_id: ''
      });
      loadAllGoalData();
      toast({
        title: '部门月度目标创建成功',
        description: '部门月度目标创建成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '创建部门目标失败',
        description: '创建部门目标失败，请重试',
        variant: 'destructive',
      });
      console.error('创建部门目标失败:', err);
    }
  };

  // 创建个人月度目标
  const handleCreatePersonalGoal = async () => {
    try {
      // 检查必填字段
      if (!personalFormData.user_id) {
        toast({
          title: '请选择成员',
          description: '请选择成员',
          variant: 'destructive',
        });
        return;
      }
      
      if (!personalFormData.target_value || personalFormData.target_value.trim() === '') {
        toast({
          title: '请输入目标值',
          description: '请输入目标值',
          variant: 'destructive',
        });
        return;
      }

      const targetValue = parseInt(personalFormData.target_value);
      if (isNaN(targetValue) || targetValue <= 0) {
        toast({
          title: '目标值必须大于0',
          description: '目标值必须大于0',
          variant: 'destructive',
        });
        return;
      }

      const goalData = {
        year: personalFormData.year,
        month: personalFormData.month,
        user_id: personalFormData.user_id,
        team_monthly_goal_id: personalFormData.team_monthly_goal_id,
        target_value: targetValue,
        unit_id: personalFormData.unit_id || undefined,
        created_by: user?.id,
        progress: 0,
        status: 'active' as const
      };

      await goalAPI.createPersonalMonthlyGoal(goalData);
      setIsPersonalDialogOpen(false);
      setPersonalFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        user_id: '',
        team_monthly_goal_id: '',
        target_value: '',
        unit_id: ''
      });
      loadAllGoalData();
      toast({
        title: '个人月度目标创建成功',
        description: '个人月度目标创建成功',
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

  // 新增年度目标
  const handleAddGoal = async () => {
    try {
      if (!formData.title || !formData.targetValue) {
        toast({
          title: '创建年度目标失败',
          description: '请填写必填字段',
          variant: 'destructive',
        });
        return;
      }

      await goalAPI.createCompanyYearlyGoal({
        title: formData.title,
        description: formData.description || undefined,
        year: formData.year,
        target_value: parseFloat(formData.targetValue),
        unit_id: formData.unit_id || undefined,
        status: 'active'
      });

      setIsAddDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        year: new Date().getFullYear(),
        targetValue: '',
        unit_id: ''
      });
      loadAllGoalData();
      toast({
        title: '年度目标创建成功',
        description: '年度目标创建成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '创建年度目标失败',
        description: '创建年度目标失败，请重试',
        variant: 'destructive',
      });
      console.error('创建年度目标失败:', err);
    }
  };

  // 编辑年度目标
  const handleEditGoal = (goal: CompanyYearlyGoal) => {
    setSelectedGoal(goal);
    setEditFormData({
      id: goal.id,
      title: goal.title || '',
      description: goal.description || '',
      year: goal.year,
      targetValue: goal.target_value?.toString() || '',
      unit_id: goal.unit_id || ''
    });
    setIsEditDialogOpen(true);
  };

  // 更新年度目标
  const handleUpdateGoal = async () => {
    try {
      if (!editFormData.title || !editFormData.targetValue) {
        toast({
          title: '更新年度目标失败',
          description: '请填写必填字段',
          variant: 'destructive',
        });
        return;
      }

      await goalAPI.updateCompanyYearlyGoal(editFormData.id, {
        title: editFormData.title,
        description: editFormData.description || undefined,
        year: editFormData.year,
        target_value: parseFloat(editFormData.targetValue),
        unit_id: editFormData.unit_id || undefined,
        status: 'active'
      });

      setIsEditDialogOpen(false);
      setEditFormData({
        id: '',
        title: '',
        description: '',
        year: new Date().getFullYear(),
        targetValue: '',
        unit_id: ''
      });
      setSelectedGoal(null);
      loadAllGoalData();
      toast({
        title: '年度目标更新成功',
        description: '年度目标更新成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '更新年度目标失败',
        description: '更新年度目标失败，请重试',
        variant: 'destructive',
      });
      console.error('更新年度目标失败:', err);
    }
  };

  // 删除年度目标
  const handleDeleteGoal = async (goal: CompanyYearlyGoal) => {
    try {
      await goalAPI.deleteCompanyYearlyGoal(goal.id);
      loadAllGoalData();
      toast({
        title: '年度目标删除成功',
        description: '年度目标删除成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '删除年度目标失败',
        description: '删除年度目标失败，请重试',
        variant: 'destructive',
      });
      console.error('删除年度目标失败:', err);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[month - 1];
  };

  // 计算个人目标的实际收入
  const calculatePersonalActualRevenue = (personalGoal: any): number => {
    if (!personalGoal.daily_reports) return 0;
    return personalGoal.daily_reports.reduce((sum: number, report: any) => sum + (report.performance_value || 0), 0);
  };

  // 计算个人目标的进度
  const calculatePersonalProgress = (personalGoal: any): number => {
    const actualRevenue = calculatePersonalActualRevenue(personalGoal);
    if (!personalGoal.target_value || personalGoal.target_value === 0) return 0;
    return Math.round((actualRevenue / personalGoal.target_value) * 100);
  };

  // 计算团队月度目标的实际收入
  const calculateTeamActualRevenue = (teamGoal: any): number => {
    // 从API返回的数据中获取个人目标
    const personalGoalsForTeam = allGoalData.personalMonthlyGoals.filter(pg => 
      pg.team_monthly_goal_id === teamGoal.id || 
      pg.team_monthly_goal?.id === teamGoal.id
    );
    return personalGoalsForTeam.reduce((sum: number, personalGoal: any) => sum + calculatePersonalActualRevenue(personalGoal), 0);
  };

  // 计算团队月度目标的进度
  const calculateTeamProgress = (teamGoal: any): number => {
    const actualRevenue = calculateTeamActualRevenue(teamGoal);
    if (!teamGoal.target_value || teamGoal.target_value === 0) return 0;
    return Math.round((actualRevenue / teamGoal.target_value) * 100);
  };

  // 计算公司年度目标的实际收入
  const calculateYearlyActualRevenue = (yearlyGoal: CompanyYearlyGoal): number => {
    const teamGoalsForYear = allGoalData.teamMonthlyGoals.filter(tm => 
      tm.company_yearly_goal_id === yearlyGoal.id || 
      tm.company_yearly_goal?.id === yearlyGoal.id
    );
    return teamGoalsForYear.reduce((sum: number, teamGoal: any) => sum + calculateTeamActualRevenue(teamGoal), 0);
  };

  // 计算公司年度目标的进度
  const calculateYearlyProgress = (yearlyGoal: CompanyYearlyGoal): number => {
    const actualRevenue = calculateYearlyActualRevenue(yearlyGoal);
    if (!yearlyGoal.target_value || yearlyGoal.target_value === 0) return 0;
    return Math.round((actualRevenue / yearlyGoal.target_value) * 100);
  };

  // 获取所有可用年份
  const availableYears = useMemo(() => {
    const years = [...new Set(allGoalData.yearlyGoals.map(goal => goal.year))];
    return years.sort((a, b) => b - a); // 降序排列，最新年份在前
  }, [allGoalData.yearlyGoals]);

  // 根据选择的年份筛选目标数据
  const filteredYearlyGoals = useMemo(() => {
    return allGoalData.yearlyGoals.filter(goal => 
      goal.year.toString() === selectedYear
    );
  }, [allGoalData.yearlyGoals, selectedYear]);

  const toggleYearlyGoal = (goalId: string) => {
    setExpandedYearly(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  const toggleMonthlyGoal = (goalId: string) => {
    setExpandedMonthly(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">公司年度目标</h1>
            <p className="text-muted-foreground">
              设定和跟踪公司年度战略目标
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Badge variant="secondary" className="text-sm">
              加载中...
            </Badge>
          </div>
        </div>
        <Separator />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和筛选器 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">目标看板</h1>
          <p className="text-muted-foreground">
            可视化展示公司年度目标、月度目标及个人目标的完成情况
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* 年度筛选器 */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">年度筛选：</span>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={loading || availableYears.length === 0}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={loading ? "加载中..." : "选择年度"} />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedYear ? `${selectedYear}年度` : '加载中...'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              思维导图视图
            </Badge>
          </div>
        </div>


      </div>

      <Separator />



      {/* 目标看板 */}
      <div className="space-y-6">
        {filteredYearlyGoals.map((yearlyGoal) => {
          // 获取该年度目标下的月度目标
          const monthlyGoalsForYear = allGoalData.teamMonthlyGoals.filter(tm => tm.company_yearly_goal?.id === yearlyGoal.id);
          
          // 计算年度目标的进度和实际收入
          const yearlyProgress = calculateYearlyProgress(yearlyGoal);
          const yearlyActualRevenue = calculateYearlyActualRevenue(yearlyGoal);
          
          return (
            <div key={yearlyGoal.id} className="space-y-4">
              {/* 公司年度目标 */}
              <CompanyYearlyGoalCard
                goal={yearlyGoal}
                isExpanded={expandedYearly[yearlyGoal.id] || false}
                onToggle={() => toggleYearlyGoal(yearlyGoal.id)}
                progress={yearlyProgress}
                actualRevenue={yearlyActualRevenue}
              />

              {/* 团队月度目标 */}
              {expandedYearly[yearlyGoal.id] && monthlyGoalsForYear.length > 0 && (
                <div className="space-y-3">
                  {monthlyGoalsForYear.map((monthlyGoal) => {
                    // 修复个人目标数据获取逻辑
                    const personalGoalsForMonth = allGoalData.personalMonthlyGoals.filter(pm => 
                      pm.team_monthly_goal_id === monthlyGoal.id || 
                      pm.team_monthly_goal?.id === monthlyGoal.id
                    );
                    
                    // 计算团队目标的进度和实际收入
                    const teamProgress = calculateTeamProgress(monthlyGoal);
                    const teamActualRevenue = calculateTeamActualRevenue(monthlyGoal);
                    
                    return (
                      <div key={monthlyGoal.id} className="space-y-2">
                        <TeamMonthlyGoalCard
                          goal={monthlyGoal}
                          isExpanded={expandedMonthly[monthlyGoal.id] || false}
                          onToggle={() => toggleMonthlyGoal(monthlyGoal.id)}
                          progress={teamProgress}
                          actualRevenue={teamActualRevenue}
                        />

                        {/* 个人月度目标 */}
                        {expandedMonthly[monthlyGoal.id] && personalGoalsForMonth.length > 0 && (
                          <div className="space-y-2">
                            {personalGoalsForMonth.map((personalGoal) => {
                              // 计算个人目标的进度和实际收入
                              const personalProgress = calculatePersonalProgress(personalGoal);
                              const personalActualRevenue = calculatePersonalActualRevenue(personalGoal);
                              

                              
                              return (
                                <PersonalMonthlyGoalCard
                                  key={personalGoal.id}
                                  goal={personalGoal}
                                  progress={personalProgress}
                                  actualRevenue={personalActualRevenue}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* 如果没有个人目标数据，显示提示 */}
                        {expandedMonthly[monthlyGoal.id] && personalGoalsForMonth.length === 0 && (
                          <div className="ml-16">
                            <Card className="p-3 text-center border-dashed border-muted-foreground/30 bg-muted/20">
                              <div className="space-y-1">
                                <Users className="h-6 w-6 text-muted-foreground mx-auto" />
                                <h3 className="text-xs font-medium text-muted-foreground">暂无个人目标</h3>
                                <p className="text-xs text-muted-foreground">
                                  {monthlyGoal.department?.name} {monthlyGoal.year}年{monthlyGoal.month}月目标还没有分配到个人。
                                </p>
                              </div>
                            </Card>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 如果年度目标展开但没有月度目标数据 */}
              {expandedYearly[yearlyGoal.id] && monthlyGoalsForYear.length === 0 && (
                <div className="ml-8">
                  <Card className="p-4 text-center border-dashed border-muted-foreground/30 bg-muted/20">
                    <div className="space-y-2">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                      <h3 className="text-sm font-medium text-muted-foreground">暂无月度目标</h3>
                      <p className="text-xs text-muted-foreground">
                        {yearlyGoal.year}年度目标还没有分解到具体的月度目标。
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          );
        })}

        {filteredYearlyGoals.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">暂无目标数据</h3>
              <p className="text-muted-foreground">
                {selectedYear}年度还没有设置公司目标，请先创建年度目标。
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* 拆分到团队对话框 */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>拆分到部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCompanyGoal && (
              <div className="bg-accent p-4 rounded-lg theme-transition">
                <h4 className="font-medium text-foreground mb-3">公司目标信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">目标标题:</span>
                    <span className="font-medium text-foreground">{selectedCompanyGoal.title || `${selectedCompanyGoal.year}年度目标`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">年度:</span>
                    <span className="font-medium text-foreground">{selectedCompanyGoal.year}年</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">目标值:</span>
                    <span className="font-medium text-foreground">{selectedCompanyGoal.target_value?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">单位:</span>
                    <span className="font-medium text-foreground">{selectedCompanyGoal.unit?.name || '元'}</span>
                  </div>
                  {selectedCompanyGoal.manager?.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">负责人:</span>
                      <span className="font-medium text-foreground">{selectedCompanyGoal.manager.name}</span>
                    </div>
                  )}
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
                        {getMonthName(i + 1)}
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
              <Label htmlFor="teamCompanyGoal">关联年度目标</Label>
              <Select 
                value={teamFormData.company_yearly_goal_id} 
                onValueChange={(value) => setTeamFormData({...teamFormData, company_yearly_goal_id: value})}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="选择年度目标" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联年度目标</SelectItem>
                  {allGoalData.yearlyGoals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.year}年 - {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {teamFormData.company_yearly_goal_id === 'none' && (
              <div>
                <Label htmlFor="teamTitle">目标标题 <span className="text-red-500">*</span></Label>
                <Input 
                  id="teamTitle" 
                  value={teamFormData.title}
                  onChange={(e) => setTeamFormData({...teamFormData, title: e.target.value})}
                  placeholder="请输入目标标题"
                  className="bg-background border-border text-foreground" 
                />
              </div>
            )}
            <div>
              <Label htmlFor="teamTargetValue">目标值 <span className="text-red-500">*</span></Label>
              <Input 
                id="teamTargetValue" 
                type="number" 
                value={teamFormData.target_value}
                onChange={(e) => setTeamFormData({...teamFormData, target_value: e.target.value})}
                placeholder="请输入目标值"
                className="bg-background border-border text-foreground" 
              />
            </div>
            <div>
              <Label htmlFor="teamUnit">单位</Label>
              {teamFormData.company_yearly_goal_id === 'none' ? (
                <Select 
                  value={teamFormData.unit_id} 
                  onValueChange={(value) => setTeamFormData({...teamFormData, unit_id: value})}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="请选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  id="teamUnit" 
                  value={selectedCompanyGoal?.unit?.name || '元'}
                  readOnly
                  className="bg-muted border-border text-muted-foreground cursor-not-allowed" 
                />
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateTeamGoal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                创建部门目标
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 拆分到个人对话框 */}
      <Dialog open={isPersonalDialogOpen} onOpenChange={setIsPersonalDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>拆分到个人</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTeamGoal && (
              <div className="bg-accent p-4 rounded-lg theme-transition">
                <h4 className="font-medium text-foreground mb-2">部门目标信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>部门: {selectedTeamGoal.department?.name}</div>
                  <div>目标值: {selectedTeamGoal.target_value?.toLocaleString()}</div>
                  <div>单位: {selectedTeamGoal.unit?.name || '元'}</div>
                  <div>时间: {selectedTeamGoal.year}年{getMonthName(selectedTeamGoal.month)}</div>
                  {selectedTeamGoal.title && (
                    <div className="col-span-2">目标标题: {selectedTeamGoal.title}</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="personalYear">年份</Label>
                <Input 
                  id="personalYear" 
                  type="number" 
                  value={personalFormData.year}
                  onChange={(e) => setPersonalFormData({...personalFormData, year: parseInt(e.target.value)})}
                  className="bg-background border-border text-foreground" 
                />
              </div>
              <div>
                <Label htmlFor="personalMonth">月份</Label>
                <Select value={personalFormData.month.toString()} onValueChange={(value) => setPersonalFormData({...personalFormData, month: parseInt(value)})}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="user">关联成员 <span className="text-red-500">*</span></Label>
              <Select value={personalFormData.user_id} onValueChange={(value) => setPersonalFormData({...personalFormData, user_id: value})}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="选择成员" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.position?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="personalTargetValue">目标值 <span className="text-red-500">*</span></Label>
              <Input 
                id="personalTargetValue" 
                type="number" 
                value={personalFormData.target_value}
                onChange={(e) => setPersonalFormData({...personalFormData, target_value: e.target.value})}
                placeholder="请输入目标值"
                className="bg-background border-border text-foreground" 
              />
            </div>
            <div>
              <Label htmlFor="personalUnit">单位</Label>
              <Select value={personalFormData.unit_id} onValueChange={(value) => setPersonalFormData({...personalFormData, unit_id: value})}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="请选择单位" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPersonalDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreatePersonalGoal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                创建个人目标
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑年度目标对话框 */}
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
                  <Label htmlFor="editTitle" className="text-foreground">
                    目标标题 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="editTitle"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入目标标题"
                  />
                </div>
                <div>
                  <Label htmlFor="editYear" className="text-foreground">
                    目标年度 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="editYear"
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
                  <Label htmlFor="editTargetValue" className="text-foreground">
                    年度目标值 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="editTargetValue"
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
                  <Label htmlFor="editUnit" className="text-foreground">
                    单位
                  </Label>
                  <Select value={editFormData.unit_id} onValueChange={(value) => setEditFormData({ ...editFormData, unit_id: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="请选择单位" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editDescription" className="text-foreground">
                  目标描述
                </Label>
                <Textarea
                  id="editDescription"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入目标描述"
                  rows={3}
                />
              </div>

            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateGoal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              更新目标
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalDashboard;
