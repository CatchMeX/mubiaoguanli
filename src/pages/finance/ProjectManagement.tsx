import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  AlertTriangle
} from 'lucide-react';
import { projects, departments, operatingCosts } from '@/data/mockData';
import type { Project } from '@/types';

const ProjectManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取项目的成本明细
  const getProjectCosts = (projectId: string) => {
    return operatingCosts.filter(cost => cost.project?.id === projectId);
  };

  // 计算项目已使用预算
  const getUsedBudget = (projectId: string) => {
    return getProjectCosts(projectId).reduce((sum, cost) => sum + cost.amount, 0);
  };

  // 计算预算使用率
  const getBudgetUsage = (project: Project) => {
    const used = getUsedBudget(project.id);
    return (used / project.budget) * 100;
  };

  // 过滤项目
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.department.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 打开项目详情
  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setIsDetailDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">项目管理</h1>
            <p className="text-muted-foreground mt-1">管理项目预算、周期和成本明细</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
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
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">项目预算</Label>
                    <Input 
                      id="budget" 
                      type="number"
                      placeholder="请输入预算金额"
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">项目周期</Label>
                    <Input 
                      id="duration" 
                      placeholder="如：6个月"
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">关联部门</Label>
                    <Select>
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
                <div>
                  <Label htmlFor="description">项目描述</Label>
                  <Textarea 
                    id="description" 
                    placeholder="请输入项目描述"
                    className="bg-background border-border text-foreground" 
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    创建项目
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
                ¥{projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已使用预算</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{operatingCosts.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">预算超支项目</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {projects.filter(p => getBudgetUsage(p) > 100).length}
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
                placeholder="搜索项目名称或部门..."
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
                  <TableHead className="text-muted-foreground">项目名称</TableHead>
                  <TableHead className="text-muted-foreground">关联部门</TableHead>
                  <TableHead className="text-muted-foreground">预算</TableHead>
                  <TableHead className="text-muted-foreground">已使用</TableHead>
                  <TableHead className="text-muted-foreground">使用率</TableHead>
                  <TableHead className="text-muted-foreground">周期</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const usedBudget = getUsedBudget(project.id);
                  const usageRate = getBudgetUsage(project);
                  
                  return (
                    <TableRow key={project.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-foreground font-medium">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{project.department.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        ¥{project.budget.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-foreground">
                        ¥{usedBudget.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-accent rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                usageRate > 100 ? 'bg-red-500' : 
                                usageRate > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(usageRate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm ${
                            usageRate > 100 ? 'text-red-500' : 
                            usageRate > 80 ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {usageRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{project.duration}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            onClick={() => openProjectDetail(project)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                            onClick={() => openEditDialog(project)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 项目详情对话框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>项目详情</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">基本信息</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted-foreground">项目名称：</span>
                        <span className="text-foreground">{selectedProject.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">关联部门：</span>
                        <span className="text-foreground">{selectedProject.department.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">项目周期：</span>
                        <span className="text-foreground">{selectedProject.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">预算信息</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted-foreground">总预算：</span>
                        <span className="text-foreground">¥{selectedProject.budget.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">已使用：</span>
                        <span className="text-foreground">¥{getUsedBudget(selectedProject.id).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">剩余预算：</span>
                        <span className="text-foreground">¥{(selectedProject.budget - getUsedBudget(selectedProject.id)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 成本明细 */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">成本明细</h3>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">日期</TableHead>
                        <TableHead className="text-muted-foreground">描述</TableHead>
                        <TableHead className="text-muted-foreground">分类</TableHead>
                        <TableHead className="text-muted-foreground">金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProjectCosts(selectedProject.id).map((cost) => (
                        <TableRow key={cost.id} className="border-border">
                          <TableCell className="text-muted-foreground">{cost.date}</TableCell>
                          <TableCell className="text-foreground">{cost.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              {cost.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">¥{cost.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 编辑项目对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑项目</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editProjectName">项目名称</Label>
                    <Input 
                      id="editProjectName" 
                      defaultValue={selectedProject.name}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBudget">项目预算</Label>
                    <Input 
                      id="editBudget" 
                      type="number"
                      defaultValue={selectedProject.budget}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editDuration">项目周期</Label>
                    <Input 
                      id="editDuration" 
                      defaultValue={selectedProject.duration}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDepartment">关联部门</Label>
                    <Select defaultValue={selectedProject.department.id}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    取消
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    保存更改
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

export default ProjectManagement;
