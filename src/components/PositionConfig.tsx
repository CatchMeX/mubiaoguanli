import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Settings,
  Users,
  Building,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { positionAPI } from '@/services/api';
import { Position } from '@/types/index';

interface PositionConfigProps {
  onClose: () => void;
}

const PositionConfig = ({ onClose }: PositionConfigProps) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    level: 1,
    status: 'active' as 'active' | 'inactive'
  });

  // 职位级别选项
  const positionLevels = [
    { value: 1, label: '1级 - 实习生/助理' },
    { value: 2, label: '2级 - 专员' },
    { value: 3, label: '3级 - 高级专员' },
    { value: 4, label: '4级 - 主管' },
    { value: 5, label: '5级 - 经理' },
    { value: 6, label: '6级 - 高级经理' },
    { value: 7, label: '7级 - 总监' },
    { value: 8, label: '8级 - 副总' },
    { value: 9, label: '9级 - 总经理' },
    { value: 10, label: '10级 - 董事长' }
  ];

  // 加载职位数据
  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await positionAPI.getAll();
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载职位数据失败');
      console.error('加载职位数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 筛选职位
  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || position.level.toString() === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      level: 1,
      status: 'active'
    });
  };

  // 处理新增
  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // 处理编辑
  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    setFormData({
      name: position.name,
      code: position.code,
      description: position.description || '',
      level: position.level,
      status: position.status
    });
    setIsEditDialogOpen(true);
  };

  // 保存新增
  const handleSaveAdd = async () => {
    if (!formData.name || !formData.code) {
      alert('请填写职位名称和代码');
      return;
    }

    try {
      await positionAPI.create(formData);
      await loadPositions();
      setIsAddDialogOpen(false);
      resetForm();
      alert('职位添加成功！');
    } catch (err) {
      console.error('添加职位失败:', err);
      alert('添加职位失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedPosition) return;

    try {
      await positionAPI.update(selectedPosition.id, formData);
      await loadPositions();
      setIsEditDialogOpen(false);
      setSelectedPosition(null);
      resetForm();
      alert('职位更新成功！');
    } catch (err) {
      console.error('更新职位失败:', err);
      alert('更新职位失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 删除职位
  const handleDelete = async (position: Position) => {
    try {
      await positionAPI.delete(position.id);
      await loadPositions();
      alert('职位删除成功！');
    } catch (err) {
      console.error('删除职位失败:', err);
      alert('删除职位失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-600 text-white">启用</Badge>
    ) : (
      <Badge variant="destructive">停用</Badge>
    );
  };

  // 获取级别徽章
  const getLevelBadge = (level: number) => {
    const levelInfo = positionLevels.find(l => l.value === level);
    return (
      <Badge variant="outline" className="text-primary border-primary">
        {levelInfo ? levelInfo.label : `${level}级`}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">错误：{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">职位配置</h2>
          <p className="text-muted-foreground mt-1">管理组织职位结构和级别</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" />
            关闭
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            新增职位
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总职位数</CardTitle>
            <Settings className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{positions.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">启用职位</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {positions.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">最高级别</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {positions.length > 0 ? Math.max(...positions.map(p => p.level)) : 0}级
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索职位名称或代码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                <SelectValue placeholder="选择级别" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">全部级别</SelectItem>
                {positionLevels.map(level => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 职位列表 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">职位列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">职位名称</TableHead>
                <TableHead className="text-muted-foreground">代码</TableHead>
                <TableHead className="text-muted-foreground">级别</TableHead>
                <TableHead className="text-muted-foreground">状态</TableHead>
                <TableHead className="text-muted-foreground">描述</TableHead>
                <TableHead className="text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => (
                <TableRow key={position.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {position.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {position.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getLevelBadge(position.level)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(position.status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {position.description || '无描述'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(position)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除职位 "{position.name}" 吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(position)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增职位对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>新增职位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addName">职位名称 *</Label>
                <Input 
                  id="addName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="addCode">职位代码 *</Label>
                <Input 
                  id="addCode"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="addLevel">职位级别</Label>
              <Select 
                value={formData.level.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {positionLevels.map(level => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="addDescription">职位描述</Label>
              <Textarea 
                id="addDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border text-foreground"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveAdd}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑职位对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>编辑职位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">职位名称 *</Label>
                <Input 
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="editCode">职位代码 *</Label>
                <Input 
                  id="editCode"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editLevel">职位级别</Label>
              <Select 
                value={formData.level.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {positionLevels.map(level => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editDescription">职位描述</Label>
              <Textarea 
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border text-foreground"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
              <Label>职位状态</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PositionConfig; 