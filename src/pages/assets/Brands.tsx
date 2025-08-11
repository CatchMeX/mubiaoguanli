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
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Award,
  Globe,
  FileText,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { assetAPI } from '@/services/api';
import type { AssetBrand } from '@/types';

const Brands = () => {
  const [brands, setBrands] = useState<AssetBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AssetBrand | null>(null);
  const [newBrand, setNewBrand] = useState({
    name: '',
    code: '',
    country: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const brandsData = await assetAPI.getAssetBrands();
      setBrands(brandsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载品牌数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 过滤品牌
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (brand.country && brand.country.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'border-green-500 text-green-500';
      case 'inactive': return 'border-red-500 text-red-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': '启用',
      'inactive': '停用',
    };
    return statusMap[status] || status;
  };

  // 创建品牌
  const handleCreate = async () => {
    if (!newBrand.name || !newBrand.code) {
      toast({
        title: '验证失败',
        description: '请填写品牌名称和编码',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await assetAPI.createAssetBrand({
        ...newBrand,
        description: newBrand.description || undefined,
      });

      toast({
        title: '创建成功',
        description: '品牌已创建',
        duration: 2000,
      });
      
      setIsCreateOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('创建品牌失败:', error);
      toast({
        title: '创建失败',
        description: '创建品牌时发生错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 编辑品牌
  const handleEdit = (brand: AssetBrand) => {
    setEditingBrand(brand);
    setNewBrand({
      name: brand.name,
      code: brand.code,
      country: brand.country || '',
      description: brand.description || '',
      status: brand.status,
    });
  };

  // 更新品牌
  const handleUpdate = async () => {
    if (!editingBrand) return;

    if (!newBrand.name || !newBrand.code) {
      toast({
        title: '验证失败',
        description: '请填写品牌名称和编码',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await assetAPI.updateAssetBrand(editingBrand.id, {
        ...newBrand,
        description: newBrand.description || undefined,
      });

      toast({
        title: '更新成功',
        description: '品牌已更新',
        duration: 2000,
      });
      
      setEditingBrand(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('更新品牌失败:', error);
      toast({
        title: '更新失败',
        description: '更新品牌时发生错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除品牌
  const handleDelete = async (brand: AssetBrand) => {
    try {
      await assetAPI.deleteAssetBrand(brand.id);
      
              toast({
          title: '删除成功',
          description: '品牌已删除',
          duration: 2000,
        });
      
      await loadData();
    } catch (error) {
      console.error('删除品牌失败:', error);
      toast({
        title: '删除失败',
        description: '删除品牌时发生错误',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewBrand({
      name: '',
      code: '',
      country: '',
      description: '',
      status: 'active',
    });
  };

  const handleDialogClose = () => {
    setIsCreateOpen(false);
    setEditingBrand(null);
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
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">品牌管理</h1>
            <p className="text-muted-foreground mt-1">管理资产品牌信息</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增品牌
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增品牌</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">品牌名称</Label>
                    <Input
                      id="name"
                      value={newBrand.name}
                      onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入品牌名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">品牌编码</Label>
                    <Input
                      id="code"
                      value={newBrand.code}
                      onChange={(e) => setNewBrand(prev => ({ ...prev, code: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入品牌编码"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">所属国家</Label>
                    <Input
                      id="country"
                      value={newBrand.country}
                      onChange={(e) => setNewBrand(prev => ({ ...prev, country: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入所属国家"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">状态</Label>
                    <Select value={newBrand.status} onValueChange={(value: 'active' | 'inactive') => setNewBrand(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="active">启用</SelectItem>
                        <SelectItem value="inactive">停用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">品牌描述</Label>
                  <Textarea
                    id="description"
                    value={newBrand.description}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入品牌描述（可选）"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDialogClose}>
                    取消
                  </Button>
                  <Button onClick={handleCreate} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 搜索和筛选栏 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索品牌名称、编码或国家..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 品牌列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">品牌列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">品牌名称</TableHead>
                  <TableHead className="text-muted-foreground">品牌编码</TableHead>
                  <TableHead className="text-muted-foreground">所属国家</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">描述</TableHead>
                  <TableHead className="text-muted-foreground">创建时间</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id} className="border-border">
                    <TableCell className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span>{brand.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono">{brand.code}</TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{brand.country || '未知'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <Badge variant="outline" className={getStatusStyle(brand.status)}>
                        {getStatusName(brand.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{brand.description || '无描述'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {new Date(brand.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(brand)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onConfirm={() => handleDelete(brand)}
                          itemName={brand.name}
                          variant="ghost"
                          className="hover:bg-red-50"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑对话框 */}
        <Dialog open={!!editingBrand} onOpenChange={handleDialogClose}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑品牌</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">品牌名称</Label>
                  <Input
                    id="edit-name"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入品牌名称"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">品牌编码</Label>
                  <Input
                    id="edit-code"
                    value={newBrand.code}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, code: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入品牌编码"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-country">所属国家</Label>
                  <Input
                    id="edit-country"
                    value={newBrand.country}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, country: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入所属国家"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">状态</Label>
                  <Select value={newBrand.status} onValueChange={(value: 'active' | 'inactive') => setNewBrand(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">品牌描述</Label>
                <Textarea
                  id="edit-description"
                  value={newBrand.description}
                  onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入品牌描述（可选）"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  取消
                </Button>
                <Button onClick={handleUpdate} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Brands;
