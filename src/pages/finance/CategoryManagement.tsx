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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Tags, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash2,
  Search,
  TreePine,
  Folder,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { financeCategoryAPI } from '@/services/api';
import type { FinanceCategory } from '@/types';
import { toast } from '@/components/ui/use-toast';

const CategoryManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 数据状态
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [categoryTree, setCategoryTree] = useState<FinanceCategory[]>([]);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'expense' as 'income' | 'expense' | 'cost' | 'asset' | 'liability' | 'equity',
    parent_id: '',
    description: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    type: 'expense' as 'income' | 'expense' | 'cost' | 'asset' | 'liability' | 'equity',
    parent_id: '',
    description: '',
    is_active: true,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesData = await financeCategoryAPI.getAll();
      setCategories(categoriesData);
      
      // 手动构建树形结构
      const treeData = buildTree(categoriesData);
      setCategoryTree(treeData);
      
      // 默认展开一级分类
      const topLevelIds = treeData.map(cat => cat.id);
      setExpandedCategories(new Set(topLevelIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载财务分类数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 手动构建树形结构
  const buildTree = (categories: FinanceCategory[], parentId: string | null = null): FinanceCategory[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildTree(categories, cat.id)
      }))
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'expense',
      parent_id: '',
      description: '',
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      code: '',
      type: 'expense',
      parent_id: '',
      description: '',
      is_active: true,
    });
  };

  // 切换科目展开状态
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 获取可作为父科目的选项
  const getParentOptions = (excludeId?: string): FinanceCategory[] => {
    return categories.filter(category => {
      if (excludeId && category.id === excludeId) return false;
      return category.level < 3; // 只有1、2级科目可以作为父科目
    });
  };

  // 添加分类
  const handleAddCategory = async () => {
    try {
      // 验证必填字段
      if (!formData.name.trim()) {
        toast({
          title: '请输入分类名称',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.code.trim()) {
        toast({
          title: '请输入分类编码',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.type) {
        toast({
          title: '请选择分类类型',
          variant: 'destructive',
        });
        return;
      }

      // 检查编码是否重复（在本地检查）
      const existingCategory = categories.find(cat => cat.code === formData.code.trim());
      if (existingCategory) {
        toast({
          title: '分类编码已存在',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);

      // 计算层级
      let level = 1;
      if (formData.parent_id && formData.parent_id !== 'none') {
        const parent = categories.find(c => c.id === formData.parent_id);
        if (parent) {
          level = parent.level + 1;
        }
      }
      // parent_id只允许uuid或undefined
      const parent_id = formData.parent_id && formData.parent_id !== 'none' && formData.parent_id !== '' ? formData.parent_id : undefined;
      const createData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        type: formData.type,
        parent_id,
        level,
        sort_order: 0,
        description: formData.description.trim(),
        is_active: true,
        is_system: false,
      };
      console.log('Creating finance category with data:', createData);
      await financeCategoryAPI.create(createData);

      await loadData();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: '分类添加成功',
        description: '财务分类已创建',
        duration: 2000,
      });
    } catch (err) {
      console.error('添加分类失败:', err);
      toast({
        title: '添加分类失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑对话框
  const openEditDialog = (category: FinanceCategory) => {
    setSelectedCategory(category);
    setEditFormData({
      name: category.name,
      code: category.code,
      type: category.type,
      parent_id: category.parent_id || '',
      description: category.description || '',
      is_active: category.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // 更新分类
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      // 验证必填字段
      if (!editFormData.name.trim()) {
        toast({
          title: '请输入分类名称',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.code.trim()) {
        toast({
          title: '请输入分类编码',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.type) {
        toast({
          title: '请选择分类类型',
          variant: 'destructive',
        });
        return;
      }

      // 检查编码是否重复（排除当前编辑的分类）
      const existingCategory = categories.find(cat => 
        cat.code === editFormData.code.trim() && cat.id !== selectedCategory.id
      );
      if (existingCategory) {
        toast({
          title: '分类编码已存在',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);

      // 计算层级
      let level = 1;
      if (editFormData.parent_id && editFormData.parent_id !== 'none') {
        const parent = categories.find(c => c.id === editFormData.parent_id);
        if (parent) {
          level = parent.level + 1;
        }
      }
      // parent_id只允许uuid或undefined
      const parent_id = editFormData.parent_id && editFormData.parent_id !== 'none' && editFormData.parent_id !== '' ? editFormData.parent_id : undefined;
      const updateData = {
        name: editFormData.name.trim(),
        code: editFormData.code.trim(),
        type: editFormData.type,
        parent_id,
        level,
        sort_order: selectedCategory.sort_order || 0,
        description: editFormData.description.trim(),
        is_active: editFormData.is_active,
      };
      await financeCategoryAPI.update(selectedCategory.id, updateData);

      await loadData();
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetEditForm();
      toast({
        title: '分类更新成功',
        description: '财务分类已更新',
        duration: 2000,
      });
    } catch (err) {
      console.error('更新分类失败:', err);
      toast({
        title: '更新分类失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (category: FinanceCategory) => {
    try {
      setSubmitting(true);
      await financeCategoryAPI.delete(category.id);
      await loadData();
      toast({
        title: '分类删除成功',
        description: '财务分类已删除',
        duration: 2000,
      });
    } catch (err) {
      console.error('删除分类失败:', err);
      toast({
        title: '删除分类失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染分类树
  const renderCategoryTree = (categories: FinanceCategory[], level: number = 0) => {
    return categories.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const hasChildren = category.children && category.children.length > 0;
      const isVisible = !searchTerm || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (!isVisible) return null;

      return (
        <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
          <Card className="bg-card border-border theme-transition">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CollapsibleTrigger
                    className="flex items-center space-x-2 hover:bg-accent/50 p-1 rounded"
                  >
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {category.code}
                    </Badge>
                    <span className="font-medium text-foreground">{category.name}</span>
                    <Badge className="text-xs">
                      {getTypeLabel(category.type)}
                    </Badge>
                    {!category.is_active && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        已禁用
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAddChildDialog(category)}
                    disabled={category.level >= 3}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    添加子分类
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    编辑
                  </Button>
                  <DeleteButton
                    onConfirm={() => handleDeleteCategory(category)}
                    itemName={category.name}
                    variant="outline"
                    className="hover:bg-red-50"
                  />
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-2 ml-6">
                  {category.description}
                </p>
              )}
            </CardContent>
            {hasChildren && (
              <CollapsibleContent>
                <div className="ml-6 border-l border-border">
                  {renderCategoryTree(category.children || [], level + 1)}
                </div>
              </CollapsibleContent>
            )}
          </Card>
        </Collapsible>
      );
    });
  };

  // 获取分类类型标签
  const getTypeLabel = (type: string) => {
    const typeMap = {
      'income': '收入',
      'expense': '费用',
      'cost': '成本',
      'asset': '资产',
      'liability': '负债',
      'equity': '权益',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // 打开添加子科目对话框
  const openAddChildDialog = (parentCategory: FinanceCategory) => {
    setFormData({
      name: '',
      code: '',
      type: parentCategory.type,
      parent_id: parentCategory.id,
      description: '',
    });
    setIsAddDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载财务分类中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <Tags className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">财务分类模块初始化</h2>
            <p className="text-red-500 mb-4">{error}</p>
          </div>
          
          {error.includes('finance_categories') && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="text-left">
                <h3 className="text-yellow-800 font-medium mb-2">📋 需要创建数据库表</h3>
                <p className="text-yellow-700 text-sm mb-2">
                  请按以下步骤创建财务分类表：
                </p>
                <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1">
                  <li>打开 Supabase 控制台</li>
                  <li>进入 SQL Editor</li>
                  <li>运行项目根目录下的 <code>scripts/create-finance-tables.sql</code></li>
                  <li>返回此页面点击重试</li>
                </ol>
              </div>
            </div>
          )}
          
          <div className="space-x-2">
            <Button onClick={loadData}>重试</Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://supabase.com/dashboard/projects', '_blank')}
            >
              打开 Supabase 控制台
            </Button>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">财务分类管理</h1>
            <p className="text-muted-foreground mt-1">管理收入、费用、成本等财务科目分类</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增分类
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>新增财务分类</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium flex items-center">
                      分类名称
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入分类名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code" className="text-sm font-medium flex items-center">
                      分类编码
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="如：5101"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium flex items-center">
                      分类类型
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择分类类型" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="income">收入</SelectItem>
                        <SelectItem value="expense">费用</SelectItem>
                        <SelectItem value="cost">成本</SelectItem>
                        <SelectItem value="asset">资产</SelectItem>
                        <SelectItem value="liability">负债</SelectItem>
                        <SelectItem value="equity">权益</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="parent" className="text-sm font-medium flex items-center">
                      上级分类
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={formData.parent_id || 'none'} onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择上级分类" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="none">无上级分类</SelectItem>
                        {getParentOptions().map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.code} - {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">分类描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入分类描述"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    取消
                  </Button>
                  <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    添加分类
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 搜索 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索分类名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* 分类树 */}
        <div className="space-y-2">
          {categoryTree.length > 0 ? (
            renderCategoryTree(categoryTree)
          ) : (
            <Card className="bg-card border-border theme-transition">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">暂无分类</h3>
                  <p className="text-muted-foreground">创建第一个财务分类开始管理</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 编辑分类对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>编辑财务分类</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium flex items-center">
                    分类名称
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入分类名称"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code" className="text-sm font-medium flex items-center">
                    分类编码
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="如：5101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type" className="text-sm font-medium flex items-center">
                    分类类型
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={editFormData.type} onValueChange={(value: any) => setEditFormData({ ...editFormData, type: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择分类类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="income">收入</SelectItem>
                      <SelectItem value="expense">费用</SelectItem>
                      <SelectItem value="cost">成本</SelectItem>
                      <SelectItem value="asset">资产</SelectItem>
                      <SelectItem value="liability">负债</SelectItem>
                      <SelectItem value="equity">权益</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-parent" className="text-sm font-medium flex items-center">
                    上级分类
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={editFormData.parent_id || 'none'} onValueChange={(value) => setEditFormData({ ...editFormData, parent_id: value === 'none' ? '' : value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择上级分类" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">无上级分类</SelectItem>
                      {getParentOptions(selectedCategory?.id).map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.code} - {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">分类描述</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入分类描述"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editFormData.is_active}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="edit-active">启用状态</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCategory(null);
                  resetEditForm();
                }}>
                  取消
                </Button>
                <Button onClick={handleUpdateCategory} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                  更新分类
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CategoryManagement;
