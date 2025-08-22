import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Circle,
  XCircle,
  User as UserIcon,
  Building2,
  Play,
  Check,
  Edit,
  X,
  RotateCcw,
  Users
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { taskAPI, userAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/usePermissions';
import UserSelect from '@/components/UserSelect';
import type { Task, User, TaskProgress } from '@/types';

const Tasks = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);
  const [selectedTaskForReassign, setSelectedTaskForReassign] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [selectedCardFilter, setSelectedCardFilter] = useState<string | null>(null);
  const [selectedNewAssignee, setSelectedNewAssignee] = useState<string>('');
  
  // 数据状态
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, usersData] = await Promise.all([
        taskAPI.getTasksWithDetails(),
        userAPI.getAll()
      ]);
      
      // 为每个任务加载进度数据
      const tasksWithProgress = await Promise.all(
        tasksData.map(async (task: Task) => {
          try {
            const progressRecords = await taskAPI.getTaskProgress(task.id);
            return {
              ...task,
              progress_records: progressRecords,
              progress: progressRecords.reduce((sum, record) => sum + record.progress_percentage, 0)
            };
          } catch (error) {
            console.error(`加载任务 ${task.id} 的进度数据失败:`, error);
            return {
              ...task,
              progress_records: [],
              progress: 0
            };
          }
        })
      );
      
      // 检查并更新逾期状态
      const now = new Date();
      const tasksWithOverdueCheck = tasksWithProgress.map(task => {
        if (!task.deadline) return task;
        const deadline = new Date(task.deadline);
        // 如果已过截止时间且进度不足100%，则标记为逾期
        if (deadline < now && task.status !== 'completed' && task.status !== 'overdue') {
          if (task.progress === undefined || task.progress < 100) {
            return { ...task, status: 'overdue' as const };
          }
        }
        return task;
      });
      
      setTaskList(tasksWithOverdueCheck);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载任务数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 自动检查逾期任务
  useEffect(() => {
    const checkOverdueTasks = async () => {
      const now = new Date();
      const overdueTasks: string[] = [];
      
      setTaskList(prevTasks => 
        prevTasks.map(task => {
          if (!task.deadline) return task;
          const deadline = new Date(task.deadline);
          // 如果已过截止时间且进度不足100%，则标记为逾期
          if (deadline < now && task.status !== 'completed' && task.status !== 'overdue') {
            // 检查进度是否不足100%
            if (task.progress === undefined || task.progress < 100) {
              overdueTasks.push(task.id);
              return { ...task, status: 'overdue' as const };
            }
          }
          return task;
        })
      );

      // 批量更新逾期任务到数据库
      if (overdueTasks.length > 0) {
        try {
          await Promise.all(
            overdueTasks.map(taskId => 
              taskAPI.update(taskId, { status: 'overdue' })
            )
          );
          console.log(`已更新 ${overdueTasks.length} 个逾期任务到数据库`);
        } catch (error) {
          console.error('更新逾期任务到数据库失败:', error);
        }
      }
    };

    // 立即检查一次
    checkOverdueTasks();

    // 每分钟检查一次逾期任务
    const interval = setInterval(checkOverdueTasks, 60000);

    return () => clearInterval(interval);
  }, []);

  const filteredTasks = taskList.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.content?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    // 优先使用卡片筛选，如果没有则使用状态筛选
    const activeFilter = selectedCardFilter || statusFilter;
    const matchesStatus = activeFilter === 'all' || task.status === activeFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: '待接收', className: 'bg-yellow-600 text-white' },
      'in_progress': { label: '进行中', className: 'bg-blue-600 text-white' },
      'completed': { label: '已完成', className: 'bg-green-600 text-white' },
      'overdue': { label: '已逾期', className: 'bg-red-600 text-white' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priorityLevel: string | undefined) => {
    if (!priorityLevel) return null;
    const priorityMap = {
      'important_urgent': { label: '重要且紧急', className: 'bg-red-600 text-white' },
      'important_not_urgent': { label: '重要不紧急', className: 'bg-blue-600 text-white' },
      'urgent_not_important': { label: '紧急不重要', className: 'bg-orange-600 text-white' },
      'not_important_not_urgent': { label: '不重要不紧急', className: 'bg-gray-600 text-white' },
    };
    const priorityInfo = priorityMap[priorityLevel as keyof typeof priorityMap];
    return <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>;
  };

  const isOverdue = (deadline: string | undefined, status: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && status !== 'completed';
  };

  // 接收任务
  const handleAcceptTask = async (taskId: string) => {
    try {
      await taskAPI.update(taskId, { status: 'in_progress' });
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('接受任务失败:', error);
      setError(error instanceof Error ? error.message : '接受任务失败');
    }
  };

  // 完成任务
  const handleCompleteTask = async (taskId: string) => {
    try {
      // 检查任务进度
      const task = taskList.find(t => t.id === taskId);
      if (task && task.progress !== undefined && task.progress < 100) {
        toast({
          title: "无法完成任务",
          description: "进度未达成100%，请完成进度后重试！",
          variant: "destructive",
        });
        return;
      }
      
      await taskAPI.update(taskId, { status: 'completed' });
      await loadData(); // 重新加载数据
      toast({
        title: "任务完成",
        description: "任务已成功标记为完成",
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error('完成任务失败:', error);
      toast({
        title: "完成任务失败",
        description: error instanceof Error ? error.message : '完成任务失败',
        variant: "destructive",
      });
    }
  };

  // 显示任务详情
  const handleShowTaskDetail = (task: Task) => {
    setSelectedTaskForDetail(task);
    setIsDetailDialogOpen(true);
  };

  // 编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // 管理任务进度
  const handleManageProgress = (task: Task) => {
    setSelectedTaskForProgress(task);
    setIsProgressDialogOpen(true);
  };

  // 处理任务进度更新
  const handleProgressUpdate = (taskId: string, newProgress: number) => {
    setTaskList(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, progress: newProgress }
          : task
      )
    );
  };

  // 处理统计卡片点击
  const handleCardClick = (status: string) => {
    if (selectedCardFilter === status) {
      // 如果点击的是当前选中的卡片，则取消筛选
      setSelectedCardFilter(null);
      setStatusFilter('all');
    } else {
      // 否则设置新的筛选
      setSelectedCardFilter(status);
      setStatusFilter(status);
    }
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedCardFilter(null);
    setStatusFilter('all');
    setSearchTerm('');
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      // 检查任务是否存在
      const task = taskList.find(t => t.id === taskId);
      if (!task) {
        toast({
          title: '删除失败',
          description: '任务不存在',
          variant: 'destructive',
        });
        return;
      }

      // 检查当前用户是否为任务创建者
      if (task.created_by_id !== currentUser?.id) {
        toast({
          title: '删除失败',
          description: '只能删除自己创建的任务',
          variant: 'destructive',
        });
        return;
      }

      await taskAPI.delete(taskId);
      await loadData(); // 重新加载数据
      
      toast({
        title: '删除成功',
        description: '任务已成功删除',
        duration: 2000,
      });
    } catch (error) {
      console.error('删除任务失败:', error);
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除任务失败',
        variant: 'destructive',
      });
    }
  };

  // 创建新任务
  const handleCreateTask = async (taskData: any) => {
    try {
      // 处理时区转换：将本地时间转换为UTC时间
      let deadline = taskData.deadline;
      if (deadline) {
        // 创建一个本地时间的Date对象
        const localDate = new Date(deadline);
        // 转换为UTC时间字符串
        deadline = localDate.toISOString();
      }

      const newTaskData = {
        title: taskData.title,
        content: taskData.content,
        deadline: deadline,
        priority_level: taskData.priority_level,
        status: 'pending' as const,
        assignee_id: taskData.assignee,
        created_by_id: currentUser?.id // 使用当前登录用户作为创建者
      };

      await taskAPI.create(newTaskData);
      
      // 重新加载数据以获取最新状态
      await loadData();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('创建任务失败:', error);
      setError(error instanceof Error ? error.message : '创建任务失败');
    }
  };

  // 更新任务
  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;

    try {
      // 处理时区转换：将本地时间转换为UTC时间
      let deadline = taskData.deadline;
      if (deadline) {
        // 创建一个本地时间的Date对象
        const localDate = new Date(deadline);
        // 转换为UTC时间字符串
        deadline = localDate.toISOString();
      }

      const updatedTaskData = {
        title: taskData.title,
        content: taskData.content,
        deadline: deadline,
        priority_level: taskData.priority_level,
        assignee_id: taskData.assignee
      };

      await taskAPI.update(editingTask.id, updatedTaskData);
      
      // 重新加载数据以获取最新状态
      await loadData();
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('更新任务失败:', error);
      setError(error instanceof Error ? error.message : '更新任务失败');
    }
  };

  // 回退任务状态
  const handleRevertTask = async (taskId: string) => {
    try {
      await taskAPI.update(taskId, { status: 'in_progress' });
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('回退任务失败:', error);
      setError(error instanceof Error ? error.message : '回退任务失败');
    }
  };

  // 转派任务
  const handleReassignTask = async (taskId: string, newAssigneeId: string) => {
    try {
      // 检查是否选择了相同的执行人
      const currentTask = taskList.find(t => t.id === taskId);
      const currentAssignee = currentTask?.assignee_id;
      
      if (currentAssignee === newAssigneeId) {
        setError('选择的执行人与当前执行人相同，无需转派');
        return;
      }
      
      // 直接更新任务的执行人
      await taskAPI.update(taskId, { assignee_id: newAssigneeId });
      await loadData(); // 重新加载数据
      setIsReassignDialogOpen(false);
      setSelectedTaskForReassign(null);
      setSelectedNewAssignee('');
    } catch (error) {
      console.error('转派任务失败:', error);
      setError(error instanceof Error ? error.message : '转派任务失败');
    }
  };

  // 渲染操作按钮
  const renderActionButtons = (task: Task) => {
    const buttons: React.ReactNode[] = [];

    // 检查当前用户是否为任务创建者
    const isTaskCreator = task.created_by_id === currentUser?.id;

    // 编辑按钮（所有状态都可以编辑，包括逾期）
    buttons.push(
      <PermissionGuard permission="EDIT_TASK" key="edit">
        <Button 
          size="sm" 
          variant="outline" 
          className="border-border text-muted-foreground hover:bg-accent"
          onClick={() => handleEditTask(task)}
        >
          <Edit className="h-3 w-3 mr-1" />
          编辑
        </Button>
      </PermissionGuard>
    );

    // 删除按钮（只有任务创建者可以删除，包括逾期状态）
    if (isTaskCreator) {
      buttons.push(
        <PermissionGuard permission="DELETE_TASK" key="delete">
          <DeleteButton
            onConfirm={() => handleDeleteTask(task.id)}
            itemName={task.title}
            variant="outline"
            size="sm"
          />
        </PermissionGuard>
      );
    }

    // 逾期状态下不显示其他操作按钮
    if (task.status === 'overdue') {
      return buttons;
    }

    // 进度管理按钮（只在进行中状态显示）
    if (task.status === 'in_progress') {
      buttons.push(
        <PermissionGuard permission="MANAGE_TASK_PROGRESS" key="progress">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
            onClick={() => handleManageProgress(task)}
          >
            <Clock className="h-3 w-3 mr-1" />
            进度
          </Button>
        </PermissionGuard>
      );
    }

    // 转派按钮（在待接收和进行中状态显示）
    if (task.status === 'pending' || task.status === 'in_progress') {
      buttons.push(
        <PermissionGuard permission="REASSIGN_TASK" key="reassign">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
            onClick={() => {
              setSelectedTaskForReassign(task);
              setIsReassignDialogOpen(true);
            }}
          >
            <Users className="h-3 w-3 mr-1" />
            转派
          </Button>
        </PermissionGuard>
      );
    }

    // 根据状态显示不同的操作按钮
    switch (task.status) {
      case 'pending':
        buttons.push(
          <PermissionGuard permission="ACCEPT_TASK" key="accept">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              onClick={() => handleAcceptTask(task.id)}
            >
              <Play className="h-3 w-3 mr-1" />
              接收
            </Button>
          </PermissionGuard>
        );
        break;
      
      case 'in_progress':
        buttons.push(
          <PermissionGuard permission="COMPLETE_TASK" key="complete">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
              onClick={() => handleCompleteTask(task.id)}
            >
              <Check className="h-3 w-3 mr-1" />
              完成
            </Button>
          </PermissionGuard>
        );
        break;
      
      case 'completed':
        // 已完成的任务显示回退按钮
        buttons.push(
          <PermissionGuard permission="REVERT_TASK" key="revert">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
              onClick={() => {
                setSelectedTaskForReassign(task);
                setIsReassignDialogOpen(true);
              }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              回退
            </Button>
          </PermissionGuard>
        );
        break;
    }

    return buttons;
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">任务管理</h1>
            <p className="text-muted-foreground mt-1">创建、分配和跟踪任务进度</p>
          </div>
          <PermissionGuard permission="CREATE_TASK">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  新增任务
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>创建新任务</DialogTitle>
              </DialogHeader>
              <TaskForm 
                users={users}
                onSubmit={handleCreateTask} 
                onCancel={() => setIsAddDialogOpen(false)} 
              />
                          </DialogContent>
            </Dialog>
            </PermissionGuard>
          </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className={`bg-card border-border theme-transition cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCardFilter === 'all' ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => handleCardClick('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总任务数</CardTitle>
              <Circle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{taskList.length}</div>
            </CardContent>
          </Card>
          <Card 
            className={`bg-card border-border theme-transition cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCardFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-500/5' : ''
            }`}
            onClick={() => handleCardClick('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">待接收</CardTitle>
              <Circle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {taskList.filter(t => t.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`bg-card border-border theme-transition cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCardFilter === 'in_progress' ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
            }`}
            onClick={() => handleCardClick('in_progress')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {taskList.filter(t => t.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`bg-card border-border theme-transition cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCardFilter === 'completed' ? 'ring-2 ring-green-500 bg-green-500/5' : ''
            }`}
            onClick={() => handleCardClick('completed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已完成</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {taskList.filter(t => t.status === 'completed').length}
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
                  placeholder="搜索任务标题或内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="任务状态" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待接收</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="overdue">已逾期</SelectItem>
                </SelectContent>
              </Select>
              {(selectedCardFilter || searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="bg-background border-border text-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  清除筛选
                </Button>
              )}
            </div>
            {/* 当前筛选状态显示 */}
            {(selectedCardFilter || searchTerm || statusFilter !== 'all') && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCardFilter && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    卡片筛选: {selectedCardFilter === 'all' ? '全部' : 
                      selectedCardFilter === 'pending' ? '待接收' :
                      selectedCardFilter === 'in_progress' ? '进行中' :
                      selectedCardFilter === 'completed' ? '已完成' : selectedCardFilter}
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                    搜索: {searchTerm}
                  </Badge>
                )}
                {statusFilter !== 'all' && !selectedCardFilter && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    状态: {statusFilter === 'pending' ? '待接收' :
                      statusFilter === 'in_progress' ? '进行中' :
                      statusFilter === 'completed' ? '已完成' :
                      statusFilter === 'overdue' ? '已逾期' : statusFilter}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 任务列表 */}
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="bg-card border-border theme-transition">
              <CardContent className="pt-6">
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <h3 
                        className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleShowTaskDetail(task)}
                      >
                        {task.title}
                      </h3>
                      {task.status === 'overdue' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {renderActionButtons(task)}
                    </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{task.content}</p>
                  
                  {/* 逾期任务提示 */}
                  {task.status === 'overdue' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">
                          任务已逾期，进度不足100%，无法进行任何操作。
                        </span>
                      </div>
                    </div>
                  )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority_level)}
                    </div>

                  {/* 进度条 */}
                  {task.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">任务进度</span>
                        <span className="text-sm font-medium text-foreground">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                      <span>截止: {task.deadline ? new Date(task.deadline).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : '未设置'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span>创建者: {task.created_by?.name || '未知'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>创建时间: {new Date(task.created_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}</span>
                      </div>
                    {task.assignee && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span>执行人: {task.assignee.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <Card className="bg-card border-border theme-transition">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">暂无任务</h3>
                <p className="text-muted-foreground">创建第一个任务开始管理工作</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 编辑任务对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑任务</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <TaskForm 
                initialData={editingTask}
                users={users}
                onSubmit={handleUpdateTask} 
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 任务进度管理对话框 */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>任务进度管理</DialogTitle>
            </DialogHeader>
            {selectedTaskForProgress && (
              <TaskProgressManager 
                task={selectedTaskForProgress}
                users={users}
                onClose={() => {
                  setIsProgressDialogOpen(false);
                  setSelectedTaskForProgress(null);
                }}
                onProgressUpdate={handleProgressUpdate}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 任务详情对话框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>任务详情</DialogTitle>
            </DialogHeader>
            {selectedTaskForDetail && (
              <TaskDetailView 
                task={selectedTaskForDetail}
                onClose={() => {
                  setIsDetailDialogOpen(false);
                  setSelectedTaskForDetail(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 转派/回退确认弹框 */}
        <AlertDialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
          <AlertDialogContent className="bg-popover border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                {selectedTaskForReassign?.status === 'completed' ? (
                  <RotateCcw className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Users className="h-5 w-5 text-orange-500" />
                )}
                <span>
                  {selectedTaskForReassign?.status === 'completed' ? '确认回退' : '转派任务'}
                </span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedTaskForReassign?.status === 'completed' 
                  ? `确定要将任务"${selectedTaskForReassign?.title}"回退为进行中状态吗？`
                  : `请选择新的执行人来转派任务"${selectedTaskForReassign?.title}"`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            {selectedTaskForReassign?.status === 'completed' ? (
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => {
                    if (selectedTaskForReassign) {
                      handleRevertTask(selectedTaskForReassign.id);
                    }
                  }}
                >
                  确认回退
                </AlertDialogAction>
              </AlertDialogFooter>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newAssignee">选择新执行人</Label>
                  <UserSelect
                    value={selectedNewAssignee}
                    onValueChange={(value) => setSelectedNewAssignee(value)}
                    placeholder="选择执行人"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setIsReassignDialogOpen(false);
                    setSelectedTaskForReassign(null);
                    setSelectedNewAssignee('');
                  }}>
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={!selectedNewAssignee}
                    onClick={() => {
                      if (selectedTaskForReassign && selectedNewAssignee) {
                        handleReassignTask(selectedTaskForReassign.id, selectedNewAssignee);
                      }
                    }}
                  >
                    确认转派
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// 任务表单组件
const TaskForm = ({ 
  initialData, 
  users,
  onSubmit, 
  onCancel 
}: { 
  initialData?: Task;
  users: User[];
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    deadline: initialData?.deadline ? new Date(initialData.deadline).toLocaleString('sv-SE', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).slice(0, 16) : '',
    priority_level: initialData?.priority_level || '',
    assignee: initialData?.assignee_id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '任务标题为必填项';
    }
    if (!formData.content.trim()) {
      newErrors.content = '任务内容为必填项';
    }
    if (!formData.deadline) {
      newErrors.deadline = '截止时间为必填项';
    }
    if (!formData.assignee) {
      newErrors.assignee = '执行人为必填项';
    }
    if (!formData.priority_level) {
      newErrors.priority_level = '紧急重要程度为必填项';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    setFormData({
      title: '',
      content: '',
      deadline: '',
      priority_level: '',
      assignee: '',
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">任务标题 <span className="text-red-500">*</span></Label>
        <Input 
          id="title" 
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="bg-background border-border text-foreground" 
          placeholder="请输入任务标题"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>
      
      <div>
        <Label htmlFor="content">任务内容 <span className="text-red-500">*</span></Label>
        <Textarea 
          id="content" 
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className="bg-background border-border text-foreground" 
          rows={3} 
          placeholder="请输入任务详细内容"
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="deadline">截止时间 <span className="text-red-500">*</span></Label>
          <Input 
            id="deadline" 
            type="datetime-local" 
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            className="bg-background border-border text-foreground" 
          />
          {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
        </div>
        <div>
          <Label htmlFor="assignee">执行人 <span className="text-red-500">*</span></Label>
          <UserSelect
            value={formData.assignee}
            onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
            placeholder="选择执行人"
          />
          {errors.assignee && <p className="text-red-500 text-sm mt-1">{errors.assignee}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="priority_level">紧急重要程度 <span className="text-red-500">*</span></Label>
        <Select value={formData.priority_level} onValueChange={(value) => setFormData(prev => ({ ...prev, priority_level: value }))}>
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue placeholder="选择紧急重要程度" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="important_urgent">重要且紧急</SelectItem>
            <SelectItem value="important_not_urgent">重要不紧急</SelectItem>
            <SelectItem value="urgent_not_important">紧急不重要</SelectItem>
            <SelectItem value="not_important_not_urgent">不重要不紧急</SelectItem>
          </SelectContent>
        </Select>
        {errors.priority_level && <p className="text-red-500 text-sm mt-1">{errors.priority_level}</p>}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {initialData ? '更新任务' : '创建任务'}
        </Button>
      </div>
    </form>
  );
};

// 任务进度管理组件
const TaskProgressManager = ({ 
  task, 
  users,
  onClose,
  onProgressUpdate
}: { 
  task: Task;
  users: User[];
  onClose: () => void;
  onProgressUpdate: (taskId: string, newProgress: number) => void;
}) => {
  const [progressRecords, setProgressRecords] = useState<TaskProgress[]>([]);
  const [isAddProgressOpen, setIsAddProgressOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTotalProgress, setCurrentTotalProgress] = useState(task.progress || 0);

  // 加载进度记录
  useEffect(() => {
    loadProgressRecords();
  }, [task.id]);

  const loadProgressRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await taskAPI.getTaskProgress(task.id);
      setProgressRecords(records);
      
      // 计算当前总进度
      const totalProgress = records.reduce((sum, record) => sum + record.progress_percentage, 0);
      setCurrentTotalProgress(totalProgress);
      
      // 通知父组件更新任务列表中的进度
      onProgressUpdate(task.id, totalProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载进度记录失败');
      console.error('加载进度记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 添加进度记录
  const handleAddProgress = async (progressData: any) => {
    try {
      const newProgressPercentage = parseInt(progressData.progress_percentage);
      
      // 检查添加新进度后是否会超过100%
      const currentTotal = progressRecords.reduce((sum, record) => sum + record.progress_percentage, 0);
      const newTotal = currentTotal + newProgressPercentage;
      
      if (newTotal > 100) {
        setError(`添加失败：当前总进度为 ${currentTotal}%，新进度为 ${newProgressPercentage}%，总和将超过100%。请调整进度值或删除部分现有进度记录。`);
        return;
      }

      const newProgressData = {
        task_id: task.id,
        progress_date: progressData.progress_date,
        progress_percentage: newProgressPercentage,
        description: progressData.description,
        created_by_id: users[0]?.id // 假设当前用户是第一个
      };

      await taskAPI.createTaskProgress(newProgressData);
      
      // 更新任务的总进度
      await taskAPI.updateTaskProgressFromRecords(task.id);
      
      // 重新加载进度记录（这会自动更新当前总进度和通知父组件）
      await loadProgressRecords();
      setIsAddProgressOpen(false);
      setError(null); // 清除之前的错误信息
    } catch (error) {
      console.error('添加进度记录失败:', error);
      
      // 根据错误类型提供更具体的错误信息
      let errorMessage = '添加进度记录失败';
      
      if (error instanceof Error) {
        if (error.message.includes('tasks_progress_check')) {
          errorMessage = '添加失败：进度总和不能超过100%。请检查当前进度记录并调整新进度值。';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = '添加失败：违反了数据约束规则。请检查输入的数据是否符合要求。';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  // 删除进度记录
  const handleDeleteProgress = async (progressId: string) => {
    try {
      await taskAPI.deleteTaskProgress(progressId);
      
      // 更新任务的总进度
      await taskAPI.updateTaskProgressFromRecords(task.id);
      
      // 重新加载进度记录（这会自动更新当前总进度和通知父组件）
      await loadProgressRecords();
    } catch (error) {
      console.error('删除进度记录失败:', error);
      setError(error instanceof Error ? error.message : '删除进度记录失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 任务信息 */}
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
        <p className="text-muted-foreground text-sm">{task.content}</p>
        <div className="mt-2">
          <span className="text-sm text-muted-foreground">当前总进度: </span>
          <span className="font-semibold text-foreground">{currentTotalProgress}%</span>
        </div>
      </div>

      {/* 错误信息显示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* 进度记录列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-foreground">进度记录</h4>
          <Button 
            size="sm" 
            onClick={() => setIsAddProgressOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-3 w-3 mr-1" />
            添加进度
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : progressRecords.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">暂无进度记录</h3>
            <p className="text-muted-foreground">添加第一个进度记录开始跟踪</p>
          </div>
        ) : (
          <div className="space-y-3">
            {progressRecords.map((record) => (
              <Card key={record.id} className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.progress_date).toLocaleDateString('zh-CN')}
                        </span>
                        <Badge className="bg-purple-600 text-white">
                          {record.progress_percentage}%
                        </Badge>
                      </div>
                      {record.description && (
                        <p className="text-sm text-foreground">{record.description}</p>
                      )}
                    </div>
                    <DeleteButton
                      onConfirm={() => handleDeleteProgress(record.id)}
                      itemName="进度记录"
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 添加进度记录对话框 */}
      <Dialog open={isAddProgressOpen} onOpenChange={setIsAddProgressOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>添加进度记录</DialogTitle>
          </DialogHeader>
          <ProgressForm 
            onSubmit={handleAddProgress} 
            onCancel={() => setIsAddProgressOpen(false)}
            currentTotalProgress={currentTotalProgress}
          />
        </DialogContent>
      </Dialog>

      {/* 关闭按钮 */}
      <div className="flex justify-end">
        <Button onClick={onClose} variant="outline">
          关闭
        </Button>
      </div>
    </div>
  );
};

// 进度记录表单组件
const ProgressForm = ({ 
  onSubmit, 
  onCancel,
  currentTotalProgress = 0
}: { 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  currentTotalProgress?: number;
}) => {
  const [formData, setFormData] = useState({
    progress_date: new Date().toISOString().slice(0, 10),
    progress_percentage: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.progress_date) {
      newErrors.progress_date = '日期为必填项';
    }
    if (!formData.progress_percentage) {
      newErrors.progress_percentage = '进度百分比为必填项';
    } else {
      const percentage = parseInt(formData.progress_percentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        newErrors.progress_percentage = '进度百分比必须在0-100之间';
      } else {
        // 检查添加新进度后是否会超过100%
        const newTotal = currentTotalProgress + percentage;
        if (newTotal > 100) {
          newErrors.progress_percentage = `当前总进度为 ${currentTotalProgress}%，新进度为 ${percentage}%，总和将超过100%。请调整进度值。`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    setFormData({
      progress_date: new Date().toISOString().slice(0, 10),
      progress_percentage: '',
      description: ''
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="progress_date">日期 <span className="text-red-500">*</span></Label>
        <Input 
          id="progress_date" 
          type="date" 
          value={formData.progress_date}
          onChange={(e) => setFormData(prev => ({ ...prev, progress_date: e.target.value }))}
          className="bg-background border-border text-foreground" 
        />
        {errors.progress_date && <p className="text-red-500 text-sm mt-1">{errors.progress_date}</p>}
      </div>
      
      <div>
        <Label htmlFor="progress_percentage">进度百分比 <span className="text-red-500">*</span></Label>
        <div className="text-sm text-muted-foreground mb-2">
          当前总进度: {currentTotalProgress}% | 可添加进度: {100 - currentTotalProgress}%
        </div>
        <Input 
          id="progress_percentage" 
          type="number" 
          min="0" 
          max={100 - currentTotalProgress}
          value={formData.progress_percentage}
          onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: e.target.value }))}
          className="bg-background border-border text-foreground" 
          placeholder={`请输入0-${100 - currentTotalProgress}之间的数字`}
        />
        {errors.progress_percentage && <p className="text-red-500 text-sm mt-1">{errors.progress_percentage}</p>}
      </div>
      
      <div>
        <Label htmlFor="description">描述</Label>
        <Textarea 
          id="description" 
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-background border-border text-foreground" 
          rows={3} 
          placeholder="请输入进度描述（可选）"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          添加进度
        </Button>
      </div>
    </form>
  );
};

// 任务详情视图组件
const TaskDetailView = ({ 
  task, 
  onClose 
}: { 
  task: Task;
  onClose: () => void;
}) => {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: '待接收', className: 'bg-yellow-600 text-white' },
      'in_progress': { label: '进行中', className: 'bg-blue-600 text-white' },
      'completed': { label: '已完成', className: 'bg-green-600 text-white' },
      'overdue': { label: '已逾期', className: 'bg-red-600 text-white' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priorityLevel: string | undefined) => {
    if (!priorityLevel) return null;
    const priorityMap = {
      'important_urgent': { label: '重要且紧急', className: 'bg-red-600 text-white' },
      'important_not_urgent': { label: '重要不紧急', className: 'bg-blue-600 text-white' },
      'urgent_not_important': { label: '紧急不重要', className: 'bg-orange-600 text-white' },
      'not_important_not_urgent': { label: '不重要不紧急', className: 'bg-gray-600 text-white' },
    };
    const priorityInfo = priorityMap[priorityLevel as keyof typeof priorityMap];
    return <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{task.title}</h3>
          <p className="text-muted-foreground">{task.content}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority_level)}
        </div>
        
        {/* 进度条 */}
        {task.progress !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">任务进度</span>
              <span className="text-sm font-medium text-foreground">{task.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">截止时间:</span>
            <span className="text-foreground">
              {task.deadline ? new Date(task.deadline).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) : '未设置'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">创建者:</span>
            <span className="text-foreground">{task.created_by?.name || '未知'}</span>
          </div>
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">执行人:</span>
              <span className="text-foreground">{task.assignee.name}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">创建时间:</span>
            <span className="text-foreground">
              {task.created_at ? new Date(task.created_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) : '未知'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 进度记录列表 */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-foreground">进度记录</h4>
        {task.progress_records && task.progress_records.length > 0 ? (
          <div className="space-y-3">
            {task.progress_records.map((record) => (
              <Card key={record.id} className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.progress_date).toLocaleDateString('zh-CN')}
                        </span>
                        <Badge className="bg-purple-600 text-white">
                          {record.progress_percentage}%
                        </Badge>
                      </div>
                      {record.description && (
                        <p className="text-sm text-foreground">{record.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">暂无进度记录</h3>
            <p className="text-muted-foreground">该任务还没有进度记录</p>
          </div>
        )}
      </div>
      
      {/* 关闭按钮 */}
      <div className="flex justify-end">
        <Button onClick={onClose} variant="outline">
          关闭
        </Button>
      </div>
    </div>
  );
};

export default Tasks;
