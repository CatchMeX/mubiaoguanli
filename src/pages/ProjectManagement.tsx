import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  FolderOpen, 
  DollarSign, 
  Calendar,
  Building2,
  Edit,
  Trash2,
  Eye,
  Search,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { projectAPI, departmentAPI, userAPI, expenseAPI } from '@/services/api';
import type { Project, Department, User } from '@/types';

const ProjectManagement = () => {
  // 状态管理
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager_id: '',
    department_id: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planning' as const
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 开始加载项目管理数据...');
      
      const [projectsData, departmentsData, usersData] = await Promise.all([
        projectAPI.getProjectsWithDetails(),
        departmentAPI.getAll(),
        userAPI.getAll()
      ]);
      
      console.log('📊 项目数据:', projectsData);
      console.log('🏢 部门数据:', departmentsData);
      console.log('👥 用户数据:', usersData);
      
      setProjects(projectsData);
      setDepartments(departmentsData);
      setUsers(usersData);
    } catch (err) {
      console.error('❌ 加载项目管理数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      manager_id: '',
      department_id: '',
      start_date: '',
      end_date: '',
      budget: '',
      status: 'planning'
    });
  };

  // 创建项目
  const handleCreateProject = async () => {
    try {
      if (!formData.name || !formData.code) {
        alert('请填写项目名称和编号');
        return;
      }

      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        progress: 0
      };

      console.log('🔄 创建项目:', projectData);
      
      const newProject = await projectAPI.create(projectData);
      console.log('✅ 项目创建成功:', newProject);
      
      setProjects(prev => [...prev, newProject]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('❌ 创建项目失败:', err);
      alert('创建项目失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 更新项目
  const handleUpdateProject = async () => {
    try {
      if (!selectedProject || !formData.name || !formData.code) {
        alert('请填写项目名称和编号');
        return;
      }

      const updateData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };

      console.log('🔄 更新项目:', selectedProject.id, updateData);
      
      const updatedProject = await projectAPI.update(selectedProject.id, updateData);
      console.log('✅ 项目更新成功:', updatedProject);
      
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      resetForm();
    } catch (err) {
      console.error('❌ 更新项目失败:', err);
      alert('更新项目失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    try {
      console.log('🔄 删除项目:', projectId);
      
      await projectAPI.delete(projectId);
      console.log('✅ 项目删除成功');
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('❌ 删除项目失败:', err);
      alert('删除项目失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 过滤项目
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 打开项目详情
  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setIsDetailDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || '',
      manager_id: project.manager_id || '',
      department_id: project.department_id || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget?.toString() || '',
      status: project.status
    });
    setIsEditDialogOpen(true);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'planning': return '计划中';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载项目数据中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
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
            <h1 className="text-3xl font-bold text-foreground">项目管理</h1>
            <p className="text-muted-foreground mt-1">管理项目预算、周期和进度</p>
          </div>
          <StrictDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增项目
              </Button>
            </DialogTrigger>
            <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>新建项目</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectName">项目名称</Label>
                    <Input 
                      id="projectName" 
                      placeholder="请输入项目名称"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectCode">项目编号</Label>
                    <Input 
                      id="projectCode" 
                      placeholder="请输入项目编号"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">项目描述</Label>
                  <Textarea 
                    id="description" 
                    placeholder="请输入项目描述"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">项目预算</Label>
                    <Input 
                      id="budget" 
                      type="number"
                      placeholder="请输入预算金额"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">项目状态</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择项目状态" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="planning">计划中</SelectItem>
                        <SelectItem value="active">进行中</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manager">项目经理</Label>
                    <Select value={formData.manager_id} onValueChange={(value) => setFormData({...formData, manager_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择项目经理" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">关联部门</Label>
                    <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择关联部门" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">开始日期</Label>
                    <Input 
                      id="startDate" 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">结束日期</Label>
                    <Input 
                      id="endDate" 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                    className="border-border"
                  >
                    取消
                  </Button>
                  <Button onClick={handleCreateProject}>
                    创建项目
                  </Button>
                </div>
              </div>
            </StrictDialogContent>
          </StrictDialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总项目数</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总预算</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">进行中项目</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {projects.filter(p => p.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已完成项目</CardTitle>
              <AlertTriangle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {projects.filter(p => p.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索项目名称、编号或部门..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* 项目列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">项目列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">项目信息</TableHead>
                  <TableHead className="text-muted-foreground">关联部门</TableHead>
                  <TableHead className="text-muted-foreground">项目经理</TableHead>
                  <TableHead className="text-muted-foreground">预算</TableHead>
                  <TableHead className="text-muted-foreground">进度</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="text-foreground font-medium">{project.name}</span>
                          <div className="text-sm text-muted-foreground">{project.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {project.department?.name || '未指定'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {project.manager?.name || '未指定'}
                    </TableCell>
                    <TableCell className="text-foreground">
                      ¥{(project.budget || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusText(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openProjectDetail(project)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(project)}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onConfirm={() => handleDeleteProject(project.id)}
                          itemName={project.name}
                          variant="ghost"
                          title="确认删除"
                          description="确定要删除这个项目吗？此操作不可撤销。"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? '没有找到匹配的项目' : '暂无项目数据'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 编辑项目对话框 */}
        <StrictDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑项目</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editProjectName">项目名称</Label>
                  <Input 
                    id="editProjectName" 
                    placeholder="请输入项目名称"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="editProjectCode">项目编号</Label>
                  <Input 
                    id="editProjectCode" 
                    placeholder="请输入项目编号"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editDescription">项目描述</Label>
                <Textarea 
                  id="editDescription" 
                  placeholder="请输入项目描述"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-background border-border text-foreground" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editBudget">项目预算</Label>
                  <Input 
                    id="editBudget" 
                    type="number"
                    placeholder="请输入预算金额"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="editStatus">项目状态</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择项目状态" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="planning">计划中</SelectItem>
                      <SelectItem value="active">进行中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editManager">项目经理</Label>
                  <Select value={formData.manager_id} onValueChange={(value) => setFormData({...formData, manager_id: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择项目经理" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editDepartment">关联部门</Label>
                  <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择关联部门" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStartDate">开始日期</Label>
                  <Input 
                    id="editStartDate" 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="editEndDate">结束日期</Label>
                  <Input 
                    id="editEndDate" 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedProject(null);
                    resetForm();
                  }}
                  className="border-border"
                >
                  取消
                </Button>
                <Button onClick={handleUpdateProject}>
                  更新项目
                </Button>
              </div>
            </div>
          </StrictDialogContent>
        </StrictDialog>

        {/* 项目详情对话框 */}
        <StrictDialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <StrictDialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>项目详情</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目名称</Label>
                      <div className="text-foreground">{selectedProject.name}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目编号</Label>
                      <div className="text-foreground">{selectedProject.code}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目状态</Label>
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {getStatusText(selectedProject.status)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目预算</Label>
                      <div className="text-foreground">¥{(selectedProject.budget || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目经理</Label>
                      <div className="text-foreground">{selectedProject.manager?.name || '未指定'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">关联部门</Label>
                      <div className="text-foreground">{selectedProject.department?.name || '未指定'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目进度</Label>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full" 
                            style={{ width: `${selectedProject.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-foreground">{selectedProject.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">项目周期</Label>
                      <div className="text-foreground">
                        {selectedProject.start_date && selectedProject.end_date ? 
                          `${selectedProject.start_date} 至 ${selectedProject.end_date}` : 
                          '未设置'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                {selectedProject.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">项目描述</Label>
                    <div className="text-foreground mt-1 p-3 bg-background rounded border">
                      {selectedProject.description}
                    </div>
                  </div>
                )}
              </div>
            )}
          </StrictDialogContent>
        </StrictDialog>
      </div>
    </div>
  );
};

export default ProjectManagement;
