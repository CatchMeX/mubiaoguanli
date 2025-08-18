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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  X,
  Settings,
  Users,
  Crown,
  Save
} from 'lucide-react';
import { positionNamesAPI, jobLevelNamesAPI, PositionName, JobLevelName } from '@/services/memberSettingsAPI';
import { toast } from '@/hooks/use-toast';



interface MemberSettingsProps {
  onClose: () => void;
}

const MemberSettings = ({ onClose }: MemberSettingsProps) => {
  const [positionNames, setPositionNames] = useState<PositionName[]>([]);
  const [jobLevelNames, setJobLevelNames] = useState<JobLevelName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isAddLevelOpen, setIsAddLevelOpen] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelBaseSalary, setNewLevelBaseSalary] = useState('');
  const [newLevelPerformanceSalary, setNewLevelPerformanceSalary] = useState('');

  // 编辑状态
  const [isEditPositionOpen, setIsEditPositionOpen] = useState(false);
  const [isEditLevelOpen, setIsEditLevelOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionName | null>(null);
  const [editingLevel, setEditingLevel] = useState<JobLevelName | null>(null);
  const [editPositionName, setEditPositionName] = useState('');
  const [editLevelName, setEditLevelName] = useState('');
  const [editLevelBaseSalary, setEditLevelBaseSalary] = useState('');
  const [editLevelPerformanceSalary, setEditLevelPerformanceSalary] = useState('');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 这里需要调用相应的API
      // const [positionsData, levelsData] = await Promise.all([
      //   positionNamesAPI.getActive(),
      //   jobLevelNamesAPI.getActive()
      // ]);
      
      // 调用真实API
      const [positionsData, levelsData] = await Promise.all([
        positionNamesAPI.getActive(),
        jobLevelNamesAPI.getActive()
      ]);
      
      setPositionNames(positionsData);
      setJobLevelNames(levelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载设置数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 添加职位名称
  const handleAddPosition = async () => {
    if (!newPositionName.trim()) {
      toast({
        title: '请输入职位名称',
        description: '请输入职位名称',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPosition = await positionNamesAPI.create(newPositionName);
      
      setPositionNames(prev => [...prev, newPosition]);
      setNewPositionName('');
      setIsAddPositionOpen(false);
      toast({
        title: '职位名称添加成功',
        description: `职位名称 "${newPositionName}" 已成功添加`,
        duration: 2000,
      });
    } catch (err) {
      console.error('添加职位名称失败:', err);
      toast({
        title: '添加职位名称失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 添加职级名称
  const handleAddLevel = async () => {
    if (!newLevelName.trim()) {
      toast({
        title: '请输入职级名称',
        description: '请输入职级名称',
        variant: 'destructive',
      });
      return;
    }

    try {
      const baseSalary = newLevelBaseSalary ? parseFloat(newLevelBaseSalary) : undefined;
      const performanceSalary = newLevelPerformanceSalary ? parseFloat(newLevelPerformanceSalary) : undefined;
      
      const newLevel = await jobLevelNamesAPI.create(newLevelName, baseSalary, performanceSalary);
      
      setJobLevelNames(prev => [...prev, newLevel]);
      setNewLevelName('');
      setNewLevelBaseSalary('');
      setNewLevelPerformanceSalary('');
      setIsAddLevelOpen(false);
      toast({
        title: '职级名称添加成功',
        description: `职级名称 "${newLevelName}" 已成功添加`,
        duration: 2000,
      });
    } catch (err) {
      console.error('添加职级名称失败:', err);
      toast({
        title: '添加职级名称失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 删除职位名称
  const handleDeletePosition = async (position: PositionName) => {
    try {
      await positionNamesAPI.delete(position.id);
      setPositionNames(prev => prev.filter(p => p.id !== position.id));
      toast({
        title: '职位名称删除成功',
        description: `职位名称 "${position.name}" 已成功删除`,
        duration: 2000,
      });
    } catch (err) {
      console.error('删除职位名称失败:', err);
      toast({
        title: '删除职位名称失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 删除职级名称
  const handleDeleteLevel = async (level: JobLevelName) => {
    try {
      await jobLevelNamesAPI.delete(level.id);
      setJobLevelNames(prev => prev.filter(l => l.id !== level.id));
      toast({
        title: '职级名称删除成功',
        description: `职级名称 "${level.name}" 已成功删除`,
        duration: 2000,
      });
    } catch (err) {
      console.error('删除职级名称失败:', err);
      toast({
        title: '删除职级名称失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 编辑职位名称
  const handleEditPosition = (position: PositionName) => {
    setEditingPosition(position);
    setEditPositionName(position.name);
    setIsEditPositionOpen(true);
  };

  const handleSaveEditPosition = async () => {
    if (!editingPosition || !editPositionName.trim()) {
      toast({
        title: '请输入职位名称',
        description: '请输入职位名称',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedPosition = await positionNamesAPI.update(editingPosition.id, {
        name: editPositionName.trim()
      });
      
      setPositionNames(prev => prev.map(p => 
        p.id === editingPosition.id ? updatedPosition : p
      ));
      
      setIsEditPositionOpen(false);
      setEditingPosition(null);
      setEditPositionName('');
      
      toast({
        title: '职位名称更新成功',
        description: `职位名称已更新为 "${editPositionName}"`,
        duration: 2000,
      });
    } catch (err) {
      console.error('更新职位名称失败:', err);
      toast({
        title: '更新职位名称失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 编辑职级名称
  const handleEditLevel = (level: JobLevelName) => {
    setEditingLevel(level);
    setEditLevelName(level.name);
    setEditLevelBaseSalary(level.base_salary ? level.base_salary.toString() : '');
    setEditLevelPerformanceSalary(level.performance_salary ? level.performance_salary.toString() : '');
    setIsEditLevelOpen(true);
  };

  const handleSaveEditLevel = async () => {
    if (!editingLevel || !editLevelName.trim()) {
      toast({
        title: '请输入职级名称',
        description: '请输入职级名称',
        variant: 'destructive',
      });
      return;
    }

    try {
      const baseSalary = editLevelBaseSalary ? parseFloat(editLevelBaseSalary) : undefined;
      const performanceSalary = editLevelPerformanceSalary ? parseFloat(editLevelPerformanceSalary) : undefined;
      
      const updatedLevel = await jobLevelNamesAPI.update(editingLevel.id, {
        name: editLevelName.trim(),
        base_salary: baseSalary,
        performance_salary: performanceSalary
      });
      
      setJobLevelNames(prev => prev.map(l => 
        l.id === editingLevel.id ? updatedLevel : l
      ));
      
      setIsEditLevelOpen(false);
      setEditingLevel(null);
      setEditLevelName('');
      setEditLevelBaseSalary('');
      setEditLevelPerformanceSalary('');
      
      toast({
        title: '职级名称更新成功',
        description: `职级名称已更新为 "${editLevelName}"`,
        duration: 2000,
      });
    } catch (err) {
      console.error('更新职级名称失败:', err);
      toast({
        title: '更新职级名称失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
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
          <h2 className="text-2xl font-bold text-foreground">成员设置</h2>
          <p className="text-muted-foreground mt-1">管理职位名称和职级名称</p>
        </div>
        <Button 
          variant="outline"
          onClick={onClose}
        >
          <X className="mr-2 h-4 w-4" />
          关闭
        </Button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">职位名称</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{positionNames.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">职级名称</CardTitle>
            <Crown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{jobLevelNames.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 职位名称配置 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">职位名称</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 现有的职位名称标签 */}
          <div className="flex flex-wrap gap-2">
            {positionNames.map((position) => (
              <div key={position.id} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                <span 
                  className="text-sm font-medium cursor-pointer hover:text-primary/80"
                  onClick={() => handleEditPosition(position)}
                >
                  {position.name}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0 hover:bg-primary/20 text-primary hover:text-primary"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除职位名称 "{position.name}" 吗？此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeletePosition(position)}
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
          
          {/* 添加新职位名称按钮 */}
          <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-dashed border-primary/50 text-primary hover:bg-primary/10">
                <Plus className="mr-2 h-4 w-4" />
                新增
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>新增职位名称</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="positionName">职位名称</Label>
                  <Input 
                    id="positionName"
                    value={newPositionName}
                    onChange={(e) => setNewPositionName(e.target.value)}
                    placeholder="请输入职位名称"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddPositionOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddPosition}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 编辑职位名称对话框 */}
          <Dialog open={isEditPositionOpen} onOpenChange={setIsEditPositionOpen}>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>编辑职位名称</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editPositionName">职位名称</Label>
                  <Input 
                    id="editPositionName"
                    value={editPositionName}
                    onChange={(e) => setEditPositionName(e.target.value)}
                    placeholder="请输入职位名称"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditPositionOpen(false);
                    setEditingPosition(null);
                    setEditPositionName('');
                  }}>
                    取消
                  </Button>
                  <Button onClick={handleSaveEditPosition}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Separator />

      {/* 职级名称配置 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">职级名称</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 现有的职级名称标签 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobLevelNames.map((level) => (
              <div key={level.id} className="flex items-center justify-between bg-blue-500/10 text-blue-600 px-3 py-2 rounded-lg border border-blue-500/20">
                <div className="flex-1">
                  <div 
                    className="text-sm font-medium cursor-pointer hover:text-blue-700"
                    onClick={() => handleEditLevel(level)}
                  >
                    {level.name}
                  </div>
                  <div className="text-xs text-blue-500/70 mt-1">
                    基本: ¥{(level.base_salary || 0).toLocaleString()} | 绩效: ¥{(level.performance_salary || 0).toLocaleString()}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 hover:bg-blue-500/20 text-blue-600 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除职级名称 "{level.name}" 吗？此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeleteLevel(level)}
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
          
          {/* 添加新职级名称按钮 */}
          <Dialog open={isAddLevelOpen} onOpenChange={setIsAddLevelOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-dashed border-blue-500/50 text-blue-600 hover:bg-blue-500/10">
                <Plus className="mr-2 h-4 w-4" />
                新增
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>新增职级名称</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="levelName">职级名称</Label>
                  <Input 
                    id="levelName"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder="请输入职级名称"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="levelBaseSalary">基本薪资</Label>
                    <Input 
                      id="levelBaseSalary"
                      type="number"
                      value={newLevelBaseSalary}
                      onChange={(e) => setNewLevelBaseSalary(e.target.value)}
                      placeholder="请输入基本薪资"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="levelPerformanceSalary">绩效薪资</Label>
                    <Input 
                      id="levelPerformanceSalary"
                      type="number"
                      value={newLevelPerformanceSalary}
                      onChange={(e) => setNewLevelPerformanceSalary(e.target.value)}
                      placeholder="请输入绩效薪资"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddLevelOpen(false);
                    setNewLevelName('');
                    setNewLevelBaseSalary('');
                    setNewLevelPerformanceSalary('');
                  }}>
                    取消
                  </Button>
                  <Button onClick={handleAddLevel}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 编辑职级名称对话框 */}
          <Dialog open={isEditLevelOpen} onOpenChange={setIsEditLevelOpen}>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>编辑职级名称</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editLevelName">职级名称</Label>
                  <Input 
                    id="editLevelName"
                    value={editLevelName}
                    onChange={(e) => setEditLevelName(e.target.value)}
                    placeholder="请输入职级名称"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editLevelBaseSalary">基本薪资</Label>
                    <Input 
                      id="editLevelBaseSalary"
                      type="number"
                      value={editLevelBaseSalary}
                      onChange={(e) => setEditLevelBaseSalary(e.target.value)}
                      placeholder="请输入基本薪资"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLevelPerformanceSalary">绩效薪资</Label>
                    <Input 
                      id="editLevelPerformanceSalary"
                      type="number"
                      value={editLevelPerformanceSalary}
                      onChange={(e) => setEditLevelPerformanceSalary(e.target.value)}
                      placeholder="请输入绩效薪资"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditLevelOpen(false);
                    setEditingLevel(null);
                    setEditLevelName('');
                    setEditLevelBaseSalary('');
                    setEditLevelPerformanceSalary('');
                  }}>
                    取消
                  </Button>
                  <Button onClick={handleSaveEditLevel}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberSettings; 