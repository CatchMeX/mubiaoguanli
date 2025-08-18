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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar,
  User,
  Edit,
  Eye,
  BarChart3,
  FileText,
  DollarSign,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import api from '@/services/api';
import unitAPI from '@/services/unitAPI';
import { PersonalMonthlyGoal, TeamMonthlyGoal, User as UserType, DailyReport } from '@/types';
import type { Unit } from '@/services/unitAPI';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PermissionGuard } from '@/hooks/usePermissions';



const PersonalMonthlyGoals = () => {
  const [personalMonthlyGoals, setPersonalMonthlyGoals] = useState<PersonalMonthlyGoal[]>([]);
  const [teamMonthlyGoals, setTeamMonthlyGoals] = useState<TeamMonthlyGoal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<any[]>([]); // 新增部门数据
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: '',
    team_monthly_goal_id: '',
    target_value: '',
    unit_id: '',
    remark: ''
  });
  const [editFormData, setEditFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: '',
    team_monthly_goal_id: '',
    target_value: '',
    unit_id: '',
    remark: ''
  });
  const [reportFormData, setReportFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    actual_revenue: '',
    performance_value: '',
    description: ''
  });
  
  // 日报编辑状态
  const [editingReport, setEditingReport] = useState<any>(null);
  const [editReportFormData, setEditReportFormData] = useState({
    date: '',
    actual_revenue: '',
    description: ''
  });
  
  // 部门目标进度状态
  const [teamGoalProgress, setTeamGoalProgress] = useState<number>(0);
  const [teamGoalLoading, setTeamGoalLoading] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  
  // 成员目标展开状态
  const [expandedTeamGoals, setExpandedTeamGoals] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { user } = useAuth();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);



  // 展开/收缩成员目标
  const toggleTeamGoalExpansion = (memberName: string) => {
    setExpandedTeamGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberName)) {
        newSet.delete(memberName);
      } else {
        newSet.add(memberName);
      }
      return newSet;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== 开始加载数据 ===');
      const [
        personalGoalsResponse,
        teamGoalsResponse,
        usersResponse,
        unitsResponse,
        departmentsResponse
      ] = await Promise.all([
        api.goal.getPersonalMonthlyGoals(),
        api.goal.getTeamMonthlyGoals(),
        api.user.getUsersWithDepartments(),
        unitAPI.getAll(),
        api.department.getHierarchy()
      ]);

      console.log('获取到的个人目标数据:', personalGoalsResponse);
      console.log('获取到的单位数据:', unitsResponse);
      console.log('单位数据长度:', unitsResponse?.length || 0);
      console.log('获取到的用户数据:', usersResponse);
      console.log('用户数据长度:', usersResponse?.length || 0);
      console.log('获取到的部门数据:', departmentsResponse);
      console.log('部门数据长度:', departmentsResponse?.length || 0);
      
      // 检查用户数据结构
      if (usersResponse && usersResponse.length > 0) {
        console.log('第一个用户数据结构:', usersResponse[0]);
      }
      
      // 检查部门数据结构
      if (departmentsResponse && departmentsResponse.length > 0) {
        console.log('第一个部门数据结构:', departmentsResponse[0]);
      }

      // 确保日报按日期降序排序
      const sortedPersonalGoals = personalGoalsResponse.map(goal => ({
        ...goal,
        dailyReports: goal.dailyReports?.sort((a, b) => 
          new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
        ) || []
      }));

      setPersonalMonthlyGoals(sortedPersonalGoals);
      setTeamMonthlyGoals(teamGoalsResponse);
      setUsers(usersResponse);
      setUnits(unitsResponse);
      setDepartments(departmentsResponse);
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
      if (!formData.user_id || !formData.target_value) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      // 如果没有选择关联部门目标，则单位是必填的
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

      // 如果选择了团队月度目标，使用团队目标的单位
      const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === formData.team_monthly_goal_id);
      const unitId = formData.team_monthly_goal_id 
        ? selectedTeamGoal?.unit_id || undefined
        : formData.unit_id || undefined;

      const goalData = {
        year: formData.year,
        month: formData.month,
        user_id: formData.user_id,
        team_monthly_goal_id: formData.team_monthly_goal_id || undefined,
        target_value: targetValue,
        unit_id: unitId,
        created_by: user?.id,
        progress: 0,
        status: 'active' as const,
        remark: formData.remark || undefined
      };

      await api.goal.createPersonalMonthlyGoal(goalData);
      setIsAddDialogOpen(false);
      setFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        user_id: '',
        team_monthly_goal_id: '',
        target_value: '',
        unit_id: '',
        remark: ''
      });
      loadData();
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

  const handleDelete = async (id: string) => {
    try {
      await api.goal.deletePersonalMonthlyGoal(id);
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

  const handleEdit = (goal: PersonalMonthlyGoal) => {
    setSelectedGoal(goal);
    setEditFormData({
      year: goal.year,
      month: goal.month,
      user_id: goal.user_id || '',
      team_monthly_goal_id: goal.team_monthly_goal_id || '',
      target_value: goal.target_value.toString(),
      unit_id: goal.unit_id || '',
      remark: goal.remark || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedGoal) return;
      
      await api.goal.updatePersonalMonthlyGoal(selectedGoal.id, {
        year: editFormData.year,
        month: editFormData.month,
        user_id: editFormData.user_id,
        team_monthly_goal_id: editFormData.team_monthly_goal_id || undefined,
        target_value: parseFloat(editFormData.target_value),
        unit_id: editFormData.unit_id || undefined,
        remark: editFormData.remark
      });
      
      toast({
        title: '更新成功',
        description: '个人月度目标已成功更新',
        duration: 2000,
      });
      
      setIsEditDialogOpen(false);
      setSelectedGoal(null);
      loadData();
    } catch (error) {
      console.error('更新失败:', error);
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetail = (goal: PersonalMonthlyGoal) => {
    setSelectedGoal(goal);
    setIsDetailDialogOpen(true);
  };

  const handleAddReport = async () => {
    try {
      if (!selectedGoal || !reportFormData.date || !reportFormData.actual_revenue || !reportFormData.description) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      const reportData = {
        personal_monthly_goal_id: selectedGoal.id,
        report_date: reportFormData.date,
        performance_value: parseFloat(reportFormData.actual_revenue),
        work_content: reportFormData.description,
        status: 'submitted' as const
      };

      const newReport = await api.goal.createDailyReport(reportData);
      
      // 重置表单数据，但保持弹框打开
      setReportFormData({
        date: new Date().toISOString().split('T')[0],
        actual_revenue: '',
        performance_value: '',
        description: ''
      });
      
      // 更新当前目标的日报列表
      const updatedSelectedGoal = {
        ...selectedGoal,
        dailyReports: [
          ...(selectedGoal.dailyReports || []),
          {
            id: newReport.id,
            report_date: reportFormData.date,
            performance_value: parseFloat(reportFormData.actual_revenue),
            work_content: reportFormData.description,
            status: 'submitted',
            created_at: new Date().toISOString()
          }
        ]
      };
      
      setSelectedGoal(updatedSelectedGoal);
      
      // 更新个人月度目标列表中的对应目标
      setPersonalMonthlyGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === selectedGoal.id ? updatedSelectedGoal : goal
        )
      );
      
      // 如果有关联的部门目标，更新部门目标进度
      if (selectedGoal.team_monthly_goal?.id) {
        try {
          const totalActualRevenue = await calculateTeamGoalProgress(selectedGoal.team_monthly_goal.id);
          const targetValue = selectedGoal.team_monthly_goal.target_value || 0;
          const progress = targetValue > 0 ? Math.round((totalActualRevenue / targetValue) * 100) : 0;
          setTeamGoalProgress(progress);
          
          // 更新部门月度目标列表中的对应目标
          setTeamMonthlyGoals(prevTeamGoals => 
            prevTeamGoals.map(teamGoal => 
              teamGoal.id === selectedGoal.team_monthly_goal.id 
                ? { ...teamGoal, progress: progress }
                : teamGoal
            )
          );
        } catch (error) {
          console.error('更新部门目标进度失败:', error);
        }
      }
      
      toast({
        title: '日报添加成功',
        description: '日报添加成功，您可以继续添加更多日报',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '添加日报失败',
        description: '添加日报失败，请重试',
        variant: 'destructive',
      });
      console.error('添加日报失败:', err);
    }
  };

  // 修改对话框的关闭处理
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setReportFormData({
        date: new Date().toISOString().split('T')[0],
        actual_revenue: '',
        performance_value: '',
        description: ''
      });
      setError(null);
    }
    setIsReportDialogOpen(open);
  };

  const openReportDialog = async (goal: any) => {
    setSelectedGoal(goal);
    setIsReportDialogOpen(true);
    
    // 如果有关联的部门目标，计算其进度
    if (goal.team_monthly_goal?.id) {
      setTeamGoalLoading(true);
      try {
        const totalActualRevenue = await calculateTeamGoalProgress(goal.team_monthly_goal.id);
        const targetValue = goal.team_monthly_goal.target_value || 0;
        const progress = targetValue > 0 ? Math.round((totalActualRevenue / targetValue) * 100) : 0;
        setTeamGoalProgress(progress);
      } catch (error) {
        console.error('加载部门目标进度失败:', error);
        setTeamGoalProgress(0);
      } finally {
        setTeamGoalLoading(false);
      }
    }
  };

  // 开始编辑日报
  const handleStartEditReport = (report: DailyReport) => {
    setEditingReport(report);
    setEditReportFormData({
      date: report.report_date,
      actual_revenue: report.performance_value?.toString() || '',
      description: report.work_content || ''
    });
  };

  // 取消编辑日报
  const handleCancelEditReport = () => {
    setEditingReport(null);
    setEditReportFormData({
      date: '',
      actual_revenue: '',
      description: ''
    });
  };

  // 更新日报
  const handleUpdateReport = async () => {
    try {
      if (!editingReport || !editReportFormData.date || !editReportFormData.actual_revenue || !editReportFormData.description) {
        toast({
          title: '请填写所有必填字段',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      const updateData = {
        report_date: editReportFormData.date,
        performance_value: parseFloat(editReportFormData.actual_revenue),
        work_content: editReportFormData.description
      };

      await api.goal.updateDailyReport(editingReport.id, updateData);

      // 更新本地状态
      const updatedSelectedGoal = {
        ...selectedGoal,
        dailyReports: selectedGoal.dailyReports?.map((report: DailyReport) => 
          report.id === editingReport.id 
            ? { ...report, ...updateData }
            : report
        ) || []
      };

      setSelectedGoal(updatedSelectedGoal);
      
      // 更新个人月度目标列表中的对应目标
      setPersonalMonthlyGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === selectedGoal.id ? updatedSelectedGoal : goal
        )
      );
      
      // 如果有关联的部门目标，更新部门目标进度
      if (selectedGoal.team_monthly_goal?.id) {
        try {
          const totalActualRevenue = await calculateTeamGoalProgress(selectedGoal.team_monthly_goal.id);
          const targetValue = selectedGoal.team_monthly_goal.target_value || 0;
          const progress = targetValue > 0 ? Math.round((totalActualRevenue / targetValue) * 100) : 0;
          setTeamGoalProgress(progress);
          
          // 更新部门月度目标列表中的对应目标
          setTeamMonthlyGoals(prevTeamGoals => 
            prevTeamGoals.map(teamGoal => 
              teamGoal.id === selectedGoal.team_monthly_goal.id 
                ? { ...teamGoal, progress: progress }
                : teamGoal
            )
          );
        } catch (error) {
          console.error('更新部门目标进度失败:', error);
        }
      }

      setEditingReport(null);
      setEditReportFormData({
        date: '',
        actual_revenue: '',
        description: ''
      });

      toast({
        title: '日报更新成功',
        description: '日报更新成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '更新日报失败',
        description: '更新日报失败，请重试',
        variant: 'destructive',
      });
      console.error('更新日报失败:', err);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[month - 1];
  };

  const calculateActualRevenue = (goal: PersonalMonthlyGoal) => {
    if (!goal.dailyReports) return 0;
    return goal.dailyReports.reduce((sum: number, report: DailyReport) => 
      sum + (report.performance_value || 0), 0
    );
  };

  const calculateProgress = (goal: PersonalMonthlyGoal) => {
    if (!goal.target_value) return 0;
    const actualRevenue = calculateActualRevenue(goal);
    return Math.round((actualRevenue / goal.target_value) * 100);
  };

  // 计算分组的平均进度
  const calculateGroupAverageProgress = (goals: PersonalMonthlyGoal[]) => {
    if (goals.length === 0) return 0;
    
    const totalProgress = goals.reduce((sum, goal) => {
      const progress = calculateProgress(goal);
      // 如果超过100%，按100%计算
      return sum + Math.min(progress, 100);
    }, 0);
    
    return Math.round(totalProgress / goals.length);
  };

  // 计算分组的绩效金额
  const calculateGroupPerformanceAmount = (goals: PersonalMonthlyGoal[]) => {
    if (goals.length === 0) return 0;
    
    const averageProgress = calculateGroupAverageProgress(goals);
    const user = goals[0]?.user;
    const performancePay = user?.performance_pay || 0;
    
    return Math.round((averageProgress / 100) * performancePay);
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

  // 计算部门目标下所有个人目标的日报总和
  const calculateTeamGoalProgress = async (teamGoalId: string) => {
    try {
      // 获取该部门目标下的所有个人目标
      const { data: personalGoals } = await supabase
        .from('personal_monthly_goals')
        .select(`
          id,
          dailyReports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (
            performance_value
          )
        `)
        .eq('team_monthly_goal_id', teamGoalId);

      if (!personalGoals) return 0;

      // 计算所有个人目标的日报总和
      const totalActualRevenue = personalGoals.reduce((sum, personalGoal) => {
        return sum + (personalGoal.dailyReports?.reduce((dailySum, report) => {
          return dailySum + (report.performance_value || 0);
        }, 0) || 0);
      }, 0);

      return totalActualRevenue;
    } catch (error) {
      console.error('计算部门目标进度失败:', error);
      return 0;
    }
  };

  // 删除日报
  const handleDeleteReport = async (reportId: string) => {
    try {
      await api.goal.deleteDailyReport(reportId);

      // 更新本地状态
      const updatedSelectedGoal = {
        ...selectedGoal,
        dailyReports: selectedGoal.dailyReports?.filter((report: DailyReport) => 
          report.id !== reportId
        ) || []
      };

      setSelectedGoal(updatedSelectedGoal);
      
      // 更新个人月度目标列表中的对应目标
      setPersonalMonthlyGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === selectedGoal.id ? updatedSelectedGoal : goal
        )
      );
      
      // 如果有关联的部门目标，更新部门目标进度
      if (selectedGoal.team_monthly_goal?.id) {
        try {
          const totalActualRevenue = await calculateTeamGoalProgress(selectedGoal.team_monthly_goal.id);
          const targetValue = selectedGoal.team_monthly_goal.target_value || 0;
          const progress = targetValue > 0 ? Math.round((totalActualRevenue / targetValue) * 100) : 0;
          setTeamGoalProgress(progress);
          
          // 更新部门月度目标列表中的对应目标
          setTeamMonthlyGoals(prevTeamGoals => 
            prevTeamGoals.map(teamGoal => 
              teamGoal.id === selectedGoal.team_monthly_goal.id 
                ? { ...teamGoal, progress: progress }
                : teamGoal
            )
          );
        } catch (error) {
          console.error('更新部门目标进度失败:', error);
        }
      }

      toast({
        title: '日报删除成功',
        description: '日报删除成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '删除日报失败',
        description: '删除日报失败，请重试',
        variant: 'destructive',
      });
      console.error('删除日报失败:', err);
    }
  };

  // 根据选择的部门目标过滤用户列表（包含下级部门）
  const getFilteredUsers = () => {
    console.log('=== getFilteredUsers 开始 ===');
    console.log('formData.team_monthly_goal_id:', formData.team_monthly_goal_id);
    console.log('users 长度:', users.length);
    console.log('departments 长度:', departments.length);
    
    if (!formData.team_monthly_goal_id) {
      console.log('没有选择部门目标，返回所有用户');
      return users; // 如果没有选择部门目标，显示所有用户
    }
    
    const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === formData.team_monthly_goal_id);
    console.log('selectedTeamGoal:', selectedTeamGoal);
    
    if (!selectedTeamGoal?.department_id) {
      console.log('部门目标没有部门ID，返回所有用户');
      return users; // 如果部门目标没有部门ID，显示所有用户
    }
    
    console.log('目标部门ID:', selectedTeamGoal.department_id);
    
    // 检查用户数据结构
    if (users.length > 0) {
      console.log('第一个用户数据结构:', users[0]);
      console.log('用户部门关联:', users[0].user_departments);
    }
    
    // 过滤用户：只显示该部门的用户
    const filteredUsers = users.filter(user => {
      console.log(`检查用户 ${user.name}:`, user);
      
      // 检查用户的部门关联（user_departments 数组）
      if (user.user_departments && Array.isArray(user.user_departments)) {
        const hasMatchingDept = user.user_departments.some((ud: any) => 
          ud.departments && ud.departments.id === selectedTeamGoal.department_id
        );
        if (hasMatchingDept) {
          console.log(`用户 ${user.name} 的部门关联匹配:`, user.user_departments);
        }
        return hasMatchingDept;
      }
      
      console.log(`用户 ${user.name} 不匹配目标部门`);
      return false;
    });
    
    console.log('过滤后的用户数量:', filteredUsers.length);
    console.log('过滤后的用户:', filteredUsers.map(u => u.name));
    console.log('=== getFilteredUsers 结束 ===');
    
    return filteredUsers;
  };

  // 根据选择的部门目标过滤编辑表单的用户列表（包含下级部门）
  const getFilteredUsersForEdit = () => {
    if (!editFormData.team_monthly_goal_id) {
      return users; // 如果没有选择部门目标，显示所有用户
    }
    
    const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === editFormData.team_monthly_goal_id);
    if (!selectedTeamGoal?.department_id) {
      return users; // 如果部门目标没有部门ID，显示所有用户
    }
    
    // 过滤用户：只显示该部门的用户
    return users.filter(user => {
      // 检查用户的部门关联（user_departments 数组）
      if (user.user_departments && Array.isArray(user.user_departments)) {
        return user.user_departments.some((ud: any) => 
          ud.departments && ud.departments.id === selectedTeamGoal.department_id
        );
      }
      
      return false;
    });
  };

  // 按成员分组目标数据
  const groupGoalsByMember = () => {
    const grouped: { [key: string]: PersonalMonthlyGoal[] } = {};
    
    personalMonthlyGoals
      .filter(goal => {
        if (userFilter && userFilter !== 'all' && goal.user_id !== userFilter) return false;
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
        const memberName = goal.user?.name || '未知成员';
        if (!grouped[memberName]) {
          grouped[memberName] = [];
        }
        grouped[memberName].push(goal);
      });
    
    return grouped;
  };

  // 计算成员统计信息
  const getMemberStats = (goals: PersonalMonthlyGoal[]) => {
    const totalGoals = goals.length;
    const totalProgress = goals.reduce((sum, goal) => sum + calculateProgress(goal), 0);
    const avgProgress = totalGoals > 0 ? totalProgress / totalGoals : 0;
    
    return { totalGoals, avgProgress };
  };

  // 获取成员部门信息
  const getMemberDepartment = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.primaryDepartment) {
      return user.primaryDepartment.name;
    }
    if (user?.departments && user.departments.length > 0) {
      return user.departments[0].name;
    }
    return '未知部门';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadData}>重试</Button>
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
            <h1 className="text-3xl font-bold text-foreground">个人月度目标</h1>
            <p className="text-muted-foreground mt-1">管理个人月度业绩目标和日报</p>
          </div>
          <PermissionGuard permission="CREATE_PERSONAL_GOAL">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  新增个人目标
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
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
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="month">月份</Label>
                    <Select value={formData.month.toString()} onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}>
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
                  <Label htmlFor="teamGoal">关联部门目标（可选）</Label>
                  <Select 
                    value={formData.team_monthly_goal_id} 
                    onValueChange={(value) => {
                      const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === value && !goal.deleted_at);
                      setFormData({
                        ...formData, 
                        team_monthly_goal_id: value,
                        // 如果选择了团队目标，自动设置单位
                        unit_id: value ? selectedTeamGoal?.unit_id || '' : formData.unit_id,
                        // 清空已选择的用户，因为用户列表会发生变化
                        user_id: ''
                      });
                    }}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择部门目标" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {teamMonthlyGoals.filter(goal => !goal.deleted_at).map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.year}年{goal.month}月{goal.department?.name} - {goal.company_yearly_goal?.title || goal.title || '无关联年度目标'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user">关联成员</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择成员" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getFilteredUsers().map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={formData.unit_id} 
                    onValueChange={(value) => setFormData({...formData, unit_id: value})}
                    disabled={!!formData.team_monthly_goal_id}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder={
                        formData.team_monthly_goal_id 
                          ? (() => {
                              const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === formData.team_monthly_goal_id && !goal.deleted_at);
                              const teamUnit = units.find(unit => unit.id === selectedTeamGoal?.unit_id);
                              return teamUnit ? teamUnit.name : "单位将自动设置为部门目标的单位";
                            })()
                          : "请选择单位"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.team_monthly_goal_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === formData.team_monthly_goal_id && !goal.deleted_at);
                        const teamUnit = units.find(unit => unit.id === selectedTeamGoal?.unit_id);
                        return teamUnit 
                          ? `单位将自动设置为部门目标的单位：${teamUnit.name}`
                          : "单位将自动设置为部门目标的单位";
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="remark">备注</Label>
                  <Textarea 
                    id="remark" 
                    value={formData.remark}
                    onChange={(e) => setFormData({...formData, remark: e.target.value})}
                    placeholder="可选，添加目标备注信息..."
                    className="bg-background border-border text-foreground"
                    rows={3}
                  />
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



        {/* 筛选和排序 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="user-filter" className="text-sm">人员筛选:</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-40 bg-background border-border text-foreground">
                  <SelectValue placeholder="全部人员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部人员</SelectItem>
                  {Array.from(new Set(personalMonthlyGoals.map(goal => goal.user?.id).filter((id): id is string => Boolean(id)))).map(userId => {
                    const user = personalMonthlyGoals.find(goal => goal.user?.id === userId)?.user;
                    return user ? (
                      <SelectItem key={userId} value={userId}>
                        {user.name}
                      </SelectItem>
                    ) : null;
                  })}
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
                  {Array.from(new Set(personalMonthlyGoals.map(goal => goal.year))).sort((a, b) => b - a).map(year => (
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

        {/* 个人月度目标列表 - 2级展示结构 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">个人月度目标列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupGoalsByMember()).map(([memberName, goals], memberIndex) => {
                const stats = getMemberStats(goals);
                const isExpanded = expandedTeamGoals.has(memberName);
                
                return (
                  <div key={memberName} className="space-y-4">
                    {/* 成员级别行 */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTeamGoalExpansion(memberName)}
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
                      <div className="ml-8 space-y-2">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead className="text-foreground">关联部门目标</TableHead>
                              <TableHead className="text-foreground">年月</TableHead>
                              <TableHead className="text-foreground">目标值</TableHead>
                              <TableHead className="text-foreground">创建人</TableHead>
                              <TableHead className="text-foreground">创建时间</TableHead>
                              <TableHead className="text-foreground">完成进度</TableHead>
                              <TableHead className="text-foreground">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goals.map((goal) => {
                              const progress = calculateProgress(goal);
                              const actualRevenue = calculateActualRevenue(goal);
                              const targetValue = goal.target_value || 0;
                              
                              return (
                                <TableRow key={goal.id} className="border-border">
                                  <TableCell className="text-foreground">
                                    {goal.team_monthly_goal && !goal.team_monthly_goal.deleted_at ? (
                                      `${goal.team_monthly_goal.year}年${goal.team_monthly_goal.month}月${goal.team_monthly_goal.department?.name} - ${goal.team_monthly_goal.company_yearly_goal?.title || goal.team_monthly_goal.title || '无关联年度目标'}`
                                    ) : '无'}
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    {goal.year}年{getMonthName(goal.month)}
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
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <PermissionGuard permission="DAILY_REPORT_WRITE">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openReportDialog(goal)}
                                          className="border-border text-foreground hover:bg-accent"
                                          title="日报管理"
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      </PermissionGuard>
                                      <PermissionGuard permission="EDIT_PERSONAL_GOAL">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEdit(goal)}
                                          className="border-border text-foreground hover:bg-accent"
                                          title="编辑"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </PermissionGuard>
                                      <PermissionGuard permission="DELETE_PERSONAL_GOAL">
                                        <DeleteButton
                                          onConfirm={() => handleDelete(goal.id)}
                                          itemName={`${goal.user?.name} (${goal.user?.employee_id}) - ${goal.year}年${getMonthName(goal.month)}目标`}
                                          title="删除个人月度目标"
                                          description={`确定要删除"${goal.user?.name} (${goal.user?.employee_id}) - ${goal.year}年${getMonthName(goal.month)}目标"吗？删除后相关的日报记录也将被移除。`}
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

        {/* 日报管理对话框 */}
        <Dialog open={isReportDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>日报管理</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {selectedGoal && (
                <div className="bg-accent p-4 rounded-lg theme-transition">
                  <h4 className="font-medium text-foreground mb-2">目标信息</h4>
                  <div className="space-y-4">
                    {/* 个人月度目标信息 */}
                    <div className="border-b border-border pb-3">
                      <h5 className="text-sm font-medium text-foreground mb-2">个人月度目标</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>成员: {selectedGoal.user?.name} ({selectedGoal.user?.employee_id})</div>
                        <div>年月: {selectedGoal.year}年{getMonthName(selectedGoal.month)}</div>
                        <div>目标值: {selectedGoal.target_value.toLocaleString()} {selectedGoal.unit?.name || '元'}</div>
                        <div>完成进度: {calculateProgress(selectedGoal)}%</div>
                        <div>实际收入: {calculateActualRevenue(selectedGoal).toLocaleString()} {selectedGoal.unit?.name || '元'}</div>
                        <div>创建人: {selectedGoal.creator?.name || '未知'}</div>
                        <div>创建时间: {new Date(selectedGoal.created_at).toLocaleDateString()}</div>
                        <div>备注: {selectedGoal.remark || '无'}</div>
                      </div>
                    </div>
                    
                    {/* 部门月度目标信息 */}
                    <div>
                      <h5 className="text-sm font-medium text-foreground mb-2">关联部门月度目标</h5>
                      {selectedGoal.team_monthly_goal && !selectedGoal.team_monthly_goal.deleted_at ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>部门: {selectedGoal.team_monthly_goal.department?.name}</div>
                          <div>年月: {selectedGoal.team_monthly_goal.year}年{getMonthName(selectedGoal.team_monthly_goal.month)}</div>
                          <div>目标值: {selectedGoal.team_monthly_goal.target_value?.toLocaleString()} {selectedGoal.team_monthly_goal.unit?.name || '元'}</div>
                          <div>完成进度: {teamGoalLoading ? (
                            <span className="text-muted-foreground">计算中...</span>
                          ) : (
                            `${teamGoalProgress}%`
                          )}</div>
                          <div>创建人: {selectedGoal.team_monthly_goal.creator?.name || '未知'}</div>
                          <div>创建时间: {new Date(selectedGoal.team_monthly_goal.created_at).toLocaleDateString()}</div>
                          <div>备注: {selectedGoal.team_monthly_goal.remark || '无'}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          '无关联部门目标'
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 添加日报表单 */}
              <Card className="bg-accent border-border theme-transition">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">添加日报</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reportDate">日期 <span className="text-red-500">*</span></Label>
                      <Input 
                        id="reportDate" 
                        type="date" 
                        value={reportFormData.date}
                        onChange={(e) => setReportFormData({...reportFormData, date: e.target.value})}
                        className="bg-background border-border text-foreground" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualRevenue">实际收入 <span className="text-red-500">*</span></Label>
                      <Input 
                        id="actualRevenue" 
                        type="number" 
                        value={reportFormData.actual_revenue}
                        onChange={(e) => setReportFormData({...reportFormData, actual_revenue: e.target.value})}
                        placeholder="请输入实际收入"
                        className="bg-background border-border text-foreground" 
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">工作描述 <span className="text-red-500">*</span></Label>
                    <Textarea 
                      id="description" 
                      value={reportFormData.description}
                      onChange={(e) => setReportFormData({...reportFormData, description: e.target.value})}
                      placeholder="描述今日的工作内容和成果..."
                      className="bg-background border-border text-foreground"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddReport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="mr-2 h-4 w-4" />
                      确认提交
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 日报列表 */}
              <Card className="bg-accent border-border theme-transition">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">历史日报</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedGoal?.dailyReports && selectedGoal.dailyReports.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">日期</TableHead>
                          <TableHead className="text-muted-foreground">实际收入</TableHead>
                          <TableHead className="text-muted-foreground">工作描述</TableHead>
                          <TableHead className="text-muted-foreground">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGoal.dailyReports.map((report: any) => (
                          <TableRow key={report.id} className="border-border">
                            <TableCell className="text-muted-foreground">
                              {editingReport?.id === report.id ? (
                                <Input 
                                  type="date" 
                                  value={editReportFormData.date}
                                  onChange={(e) => setEditReportFormData({...editReportFormData, date: e.target.value})}
                                  className="bg-background border-border text-foreground h-8 text-xs" 
                                />
                              ) : (
                                new Date(report.report_date).toLocaleDateString('zh-CN')
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {editingReport?.id === report.id ? (
                                <Input 
                                  type="number" 
                                  value={editReportFormData.actual_revenue}
                                  onChange={(e) => setEditReportFormData({...editReportFormData, actual_revenue: e.target.value})}
                                  className="bg-background border-border text-foreground h-8 text-xs" 
                                />
                              ) : (
                                (report.performance_value || 0).toLocaleString()
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {editingReport?.id === report.id ? (
                                <Textarea 
                                  value={editReportFormData.description}
                                  onChange={(e) => setEditReportFormData({...editReportFormData, description: e.target.value})}
                                  className="bg-background border-border text-foreground h-8 text-xs resize-none" 
                                  rows={1}
                                />
                              ) : (
                                report.work_content
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {editingReport?.id === report.id ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                      onClick={handleUpdateReport}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                      onClick={handleCancelEditReport}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-border text-muted-foreground hover:bg-accent"
                                    onClick={() => handleStartEditReport(report)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">暂无日报</h3>
                      <p className="text-muted-foreground">添加第一条日报记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑个人月度目标对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground">
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
                    onChange={(e) => setEditFormData({...editFormData, year: parseInt(e.target.value)})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-month">月份</Label>
                  <Select value={editFormData.month.toString()} onValueChange={(value) => setEditFormData({...editFormData, month: parseInt(value)})}>
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
                <Label htmlFor="edit-teamGoal">关联部门目标（可选）</Label>
                <Select 
                  value={editFormData.team_monthly_goal_id} 
                  onValueChange={(value) => {
                    const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === value && !goal.deleted_at);
                    setEditFormData({
                      ...editFormData, 
                      team_monthly_goal_id: value,
                      unit_id: value ? selectedTeamGoal?.unit_id || '' : editFormData.unit_id,
                      // 清空已选择的用户，因为用户列表会发生变化
                      user_id: ''
                    });
                  }}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="选择部门目标" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {teamMonthlyGoals.filter(goal => !goal.deleted_at).map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.year}年{goal.month}月{goal.department?.name} - {goal.company_yearly_goal?.title || goal.title || '无关联年度目标'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-user">关联成员</Label>
                <Select value={editFormData.user_id} onValueChange={(value) => setEditFormData({...editFormData, user_id: value})}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="选择成员" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {getFilteredUsersForEdit().map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select 
                  value={editFormData.unit_id} 
                  onValueChange={(value) => setEditFormData({...editFormData, unit_id: value})}
                  disabled={!!editFormData.team_monthly_goal_id}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder={
                      editFormData.team_monthly_goal_id 
                        ? (() => {
                            const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === editFormData.team_monthly_goal_id && !goal.deleted_at);
                            const teamUnit = units.find(unit => unit.id === selectedTeamGoal?.unit_id);
                            return teamUnit ? teamUnit.name : "单位将自动设置为部门目标的单位";
                          })()
                        : "请选择单位"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editFormData.team_monthly_goal_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const selectedTeamGoal = teamMonthlyGoals.find(goal => goal.id === editFormData.team_monthly_goal_id && !goal.deleted_at);
                      const teamUnit = units.find(unit => unit.id === selectedTeamGoal?.unit_id);
                      return teamUnit 
                        ? `单位将自动设置为部门目标的单位：${teamUnit.name}`
                        : "单位将自动设置为部门目标的单位";
                    })()}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-remark">备注</Label>
                <Textarea 
                  id="edit-remark" 
                  value={editFormData.remark}
                  onChange={(e) => setEditFormData({...editFormData, remark: e.target.value})}
                  placeholder="可选，添加目标备注信息..."
                  className="bg-background border-border text-foreground"
                  rows={3}
                />
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

        {/* 查看详情对话框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>个人月度目标详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {selectedGoal && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">年份</Label>
                      <p className="text-foreground">{selectedGoal.year}年</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">月份</Label>
                      <p className="text-foreground">{getMonthName(selectedGoal.month)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">关联部门目标</Label>
                    <p className="text-foreground">
                      {selectedGoal.team_monthly_goal && !selectedGoal.team_monthly_goal.deleted_at
                        ? `${selectedGoal.team_monthly_goal.year}年${selectedGoal.team_monthly_goal.month}月${selectedGoal.team_monthly_goal.department?.name} - ${selectedGoal.team_monthly_goal.company_yearly_goal?.title || selectedGoal.team_monthly_goal.title || '无关联年度目标'}`
                        : '无'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">关联成员</Label>
                    <p className="text-foreground">{selectedGoal.user?.name} ({selectedGoal.user?.employee_id})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">目标值</Label>
                    <p className="text-foreground">{selectedGoal.target_value.toLocaleString()} {selectedGoal.unit?.name || '元'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">单位</Label>
                    <p className="text-foreground">{selectedGoal.unit?.name || '元'}</p>
                  </div>
                  {selectedGoal.remark && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">备注</Label>
                      <p className="text-foreground">{selectedGoal.remark}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">完成进度</Label>
                    <div className="space-y-2">
                      <Progress value={Math.min(calculateProgress(selectedGoal), 100)} className="h-2" />
                      <p className="text-foreground">{calculateProgress(selectedGoal)}%</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">实际收入</Label>
                    <p className="text-foreground">{calculateActualRevenue(selectedGoal).toLocaleString()} {selectedGoal.unit?.name || '元'}</p>
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {personalMonthlyGoals.length === 0 && (
          <Card className="bg-card border-border theme-transition">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">暂无个人月度目标</h3>
                <p className="text-muted-foreground">创建第一个个人月度目标开始管理</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PersonalMonthlyGoals;
