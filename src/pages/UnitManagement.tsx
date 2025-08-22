import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Edit,
  Trash2,
  Loader2,
  Target,
} from 'lucide-react';
import unitAPI from '@/services/unitAPI';
import { useToast } from '@/hooks/use-toast';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import type { Unit } from '@/types';
import { PermissionGuard } from '@/hooks/usePermissions';

const UnitManagement = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const { toast } = useToast();

  // 加载数据
  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await unitAPI.getAll();
      setUnits(response);
    } catch (err) {
      console.error('加载单位数据失败:', err);
      toast({
        title: '加载数据失败',
        description: '加载单位数据失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: '请填写单位名称',
          description: '单位名称不能为空',
          variant: 'destructive',
        });
        return;
      }

      // 检查单位名称是否已存在（包括软删除的）
      const exists = await unitAPI.checkNameExists(formData.name.trim());
      
      if (exists) {
        // 尝试激活已存在的软删除单位
        const activatedUnit = await unitAPI.activateExistingUnit(formData.name.trim());
        
        if (activatedUnit) {
          // 成功激活已存在的单位
          setFormData({ name: '' });
          setIsAddDialogOpen(false);
          loadUnits();
          toast({
            title: '单位恢复成功',
            description: `单位"${formData.name.trim()}"已从删除状态恢复`,
            duration: 2000,
          });
          return;
        } else {
          // 存在同名活跃单位
          toast({
            title: '单位名称已存在',
            description: '请使用其他单位名称',
            variant: 'destructive',
          });
          return;
        }
      }

      // 创建新单位
      await unitAPI.create({
        name: formData.name.trim()
      });
      
      // 重置表单
      setFormData({ name: '' });
      setIsAddDialogOpen(false);
      loadUnits();
      toast({
        title: '单位创建成功',
        description: '单位创建成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '创建单位失败',
        description: '创建单位失败，请重试',
        variant: 'destructive',
      });
      console.error('创建单位失败:', err);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: '请填写单位名称',
          description: '单位名称不能为空',
          variant: 'destructive',
        });
        return;
      }

      if (!editingUnit) return;

      // 检查单位名称是否已存在（排除当前编辑的单位）
      const exists = await unitAPI.checkNameExists(formData.name.trim());
      if (exists && formData.name.trim() !== editingUnit.name) {
        toast({
          title: '单位名称已存在',
          description: '请使用其他单位名称',
          variant: 'destructive',
        });
        return;
      }

      await unitAPI.update(editingUnit.id, {
        name: formData.name.trim()
      });
      
      setIsEditDialogOpen(false);
      setEditingUnit(null);
      setFormData({ name: '' });
      loadUnits();
      toast({
        title: '单位更新成功',
        description: '单位更新成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '更新单位失败',
        description: '更新单位失败，请重试',
        variant: 'destructive',
      });
      console.error('更新单位失败:', err);
    }
  };

  const handleDelete = async (unit: Unit) => {
    try {
      await unitAPI.delete(unit.id);
      loadUnits();
      toast({
        title: '单位删除成功',
        description: '单位删除成功',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: '删除单位失败',
        description: '删除单位失败，请重试',
        variant: 'destructive',
      });
      console.error('删除单位失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">单位管理</h1>
            <p className="text-muted-foreground">
              管理系统中的单位信息
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadUnits}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">单位管理</h1>
          <p className="text-muted-foreground">
            管理系统中的单位信息
          </p>
        </div>
        <PermissionGuard permission="CREATE_UNIT">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增单位
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>新增单位</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">单位名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入单位名称"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  创建单位
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </PermissionGuard>
      </div>

      {/* 单位列表 */}
      <Card className="bg-card border-border theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Target className="mr-2 h-5 w-5" />
            单位列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-foreground">单位名称</TableHead>
                <TableHead className="text-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id} className="border-border">
                  <TableCell className="text-foreground font-medium">
                    {unit.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <PermissionGuard permission="EDIT_UNIT">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(unit)}
                          className="border-border text-foreground hover:bg-accent"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="DELETE_UNIT">
                        <DeleteButton
                          onConfirm={() => handleDelete(unit)}
                          itemName={`单位"${unit.name}"`}
                          variant="outline"
                        />
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑单位对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>编辑单位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">单位名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入单位名称"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                更新单位
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitManagement; 