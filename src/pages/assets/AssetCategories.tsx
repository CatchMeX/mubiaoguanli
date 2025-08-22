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
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  FolderTree,
  Folder,
  FileType,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { assetAPI } from '@/services/api';
import type { AssetCategory } from '@/types';

const AssetCategories = () => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    code: '',
    parent_id: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await assetAPI.getAssetCategoriesHierarchy();
      setCategories(data);
    } catch (error) {
      console.error('加载资产分类失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载资产分类数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 展平分类树形结构为列表
  const flattenCategories = (categories: AssetCategory[], level = 0): (AssetCategory & { level: number })[] => {
    let result: (AssetCategory & { level: number })[] = [];
    
    categories.forEach(category => {
      result.push({ ...category, level });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    
    return result;
  };

  // 获取父级分类选项
  const getParentOptions = () => {
    const flatList = flattenCategories(categories);
    return flatList.filter(cat => cat.level === 0); // 只允许一级分类作为父级
  };

  // 获取分类类型图标
  const getCategoryIcon = (level: number) => {
    return level === 0 ? Folder : FileType;
  };

  // 过滤分类
  const filteredCategories = flattenCategories(categories).filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newCategory.name.trim() || !newCategory.code.trim()) {
      toast({
        title: '验证失败',
        description: '请填写分类名称和编码',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // 确定层级
      const level = newCategory.parent_id ? 1 : 0;
      
      const categoryData = {
        ...newCategory,
        parent_id: newCategory.parent_id && newCategory.parent_id.trim() !== '' ? newCategory.parent_id : undefined,
        level,
        sort_order: 0,
        status: 'active' as const,
      };

      await assetAPI.createAssetCategory(categoryData);
      
      toast({
        title: '创建成功',
        description: '资产分类已创建',
        duration: 2000,
      });
      
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('创建分类失败:', error);
      toast({
        title: '创建失败',
        description: '无法创建资产分类',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: AssetCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      code: category.code,
      parent_id: category.parent_id || '',
      description: category.description || '',
    });
    setIsCreateOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !newCategory.name.trim() || !newCategory.code.trim()) {
      toast({
        title: '验证失败',
        description: '请填写分类名称和编码',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // 确定层级
      const level = newCategory.parent_id ? 1 : 0;
      
      const categoryData = {
        ...newCategory,
        parent_id: newCategory.parent_id && newCategory.parent_id.trim() !== '' ? newCategory.parent_id : undefined,
        level,
        sort_order: editingCategory.sort_order,
        status: editingCategory.status,
      };

      await assetAPI.updateAssetCategory(editingCategory.id, categoryData);
      
      toast({
        title: '更新成功',
        description: '资产分类已更新',
        duration: 2000,
      });
      
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('更新分类失败:', error);
      toast({
        title: '更新失败',
        description: '无法更新资产分类',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: AssetCategory) => {
    if (category.children && category.children.length > 0) {
      toast({
        title: '删除失败',
        description: '该分类下还有子分类，请先删除子分类',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assetAPI.deleteAssetCategory(category.id);
              toast({
          title: '删除成功',
          description: '资产分类已删除',
          duration: 2000,
        });
      loadData();
    } catch (error) {
      console.error('删除分类失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除资产分类',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewCategory({
      name: '',
      code: '',
      parent_id: '',
      description: '',
    });
    setEditingCategory(null);
  };

  const handleDialogClose = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">资产分类管理</h1>
          <p className="text-muted-foreground">管理资产分类信息，支持二级分类结构</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              新增分类
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingCategory ? '编辑分类' : '新建分类'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">分类名称 <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入分类名称"
                  />
                </div>
                <div>
                  <Label htmlFor="code">分类编码 <span className="text-red-500">*</span></Label>
                  <Input
                    id="code"
                    value={newCategory.code}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, code: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入分类编码"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="parent_id">父级分类</Label>
                <Select 
                  value={newCategory.parent_id || 'none'} 
                  onValueChange={(value) => setNewCategory(prev => ({ ...prev, parent_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="选择父级分类（可选）" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">无父级分类（一级分类）</SelectItem>
                    {getParentOptions().map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} ({category.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入描述（可选）"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  取消
                </Button>
                <Button 
                  onClick={editingCategory ? handleUpdate : handleCreate} 
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? '更新' : '创建'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <Card className="bg-card border-border theme-transition">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索分类名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card className="bg-card border-border theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground">分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">分类名称</TableHead>
                <TableHead className="text-muted-foreground">分类编码</TableHead>
                <TableHead className="text-muted-foreground">层级</TableHead>
                <TableHead className="text-muted-foreground">描述</TableHead>
                <TableHead className="text-muted-foreground">状态</TableHead>
                <TableHead className="text-muted-foreground">创建时间</TableHead>
                <TableHead className="text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const Icon = getCategoryIcon(category.level);
                return (
                  <TableRow key={category.id} className="border-border">
                    <TableCell className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <div style={{ marginLeft: `${category.level * 20}px` }}>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span>{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono">{category.code}</TableCell>
                    <TableCell className="text-foreground">
                      <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                        {category.level === 0 ? '一级分类' : '二级分类'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <span className="text-muted-foreground">{category.description || '无描述'}</span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                        {category.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {new Date(category.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(category)}
                          className="hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onConfirm={() => handleDelete(category)}
                          itemName={category.name}
                          variant="ghost"
                          className="hover:bg-muted"
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
    </div>
  );
};

export default AssetCategories;
