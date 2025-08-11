import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Package,
  Building2,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Save,
  X,
  QrCode,
  FileText,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { assetAPI, userAPI, departmentAPI, projectAPI, supplierAPI } from '@/services/api';
import type { Asset, AssetCategory, AssetLocation, AssetBrand, Department, User as UserType, Project } from '@/types';


// 表单验证模式 - 更新包含项目字段
const assetFormSchema = z.object({
  name: z.string().min(1, '资产名称不能为空'),
  code: z.string().min(1, '资产编号不能为空'),
  categoryId: z.string().min(1, '请选择资产分类'),
  brandId: z.string().optional(),
  model: z.string().min(1, '型号规格不能为空'),
  specification: z.string().optional(),
  supplierId: z.string().optional(),
  purchaseDate: z.string().min(1, '请选择采购日期'),
  purchasePrice: z.number().min(0, '采购价格不能为负数'),
  locationId: z.string().min(1, '请选择存放位置'),
  departmentId: z.string().min(1, '请选择使用部门'),
  custodianId: z.string().optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(), // 新增项目字段
  status: z.enum(['in_use', 'idle', 'maintenance', 'scrapped']), // 移除 'disposed'
  warrantyExpiry: z.string().optional(),
  description: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

const AssetList = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [brands, setBrands] = useState<AssetBrand[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 添加刷新函数
  const refreshData = () => {
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        assetsData, 
        categoriesData, 
        locationsData, 
        brandsData,
        departmentsData,
        usersData,
        projectsData,
        suppliersData
      ] = await Promise.all([
        assetAPI.getAssets(),
        assetAPI.getAssetCategories(),
        assetAPI.getAssetLocations(),
        assetAPI.getAssetBrands(),
        departmentAPI.getAll(),
        userAPI.getAll(),
        projectAPI.getAll(),
        supplierAPI.getAll()
      ]);
      
      setAssets(assetsData);
      setCategories(categoriesData);
      setLocations(locationsData);
      setBrands(brandsData);
      setDepartments(departmentsData);
      setUsers(usersData);
      setProjects(projectsData);
      setSuppliers(suppliersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载资产数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 表单实例
  const addForm = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      code: `ASSET-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      status: 'in_use',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
    },
  });

  const editForm = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
  });

  // 获取项目名称
  const getProjectName = (projectId?: string | null) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '无关联项目';
  };

  // 获取使用部门名称
  const getDepartmentName = (departmentId?: string | null) => {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : '未分配部门';
  };

  // 获取当前价值，如果没有则显示采购价格
  const getCurrentValue = (asset?: Asset | null) => {
    if (!asset) return '-';
    
    // 更安全的数值转换
    const formatValue = (value: number | undefined | null, suffix = '') => {
      if (value == null) return '-';
      const numValue = Number(value);
      return !isNaN(numValue) ? `¥ ${numValue.toFixed(2)}${suffix}` : '-';
    };

    // 优先使用当前价值，如果没有则使用采购价格
    const currentValue = asset.current_value;
    const purchasePrice = asset.purchase_price;

    const formattedCurrentValue = formatValue(currentValue);
    return formattedCurrentValue !== '-' 
      ? formattedCurrentValue 
      : formatValue(purchasePrice, ' (采购价)');
  };

  // 计算资产总价值
  const calculateTotalAssetValue = () => {
    // 优先使用当前价值，如果没有则使用采购价格
    const totalValue = assets.reduce((sum, asset) => {
      // 安全地获取数值
      const safeGetValue = (value: number | string | undefined | null): number => {
        if (value == null) return 0;
        const numValue = Number(value);
        return !isNaN(numValue) ? numValue : 0;
      };

      // 优先使用当前价值
      const currentValue = safeGetValue(asset.current_value);
      if (currentValue > 0) {
        return sum + currentValue;
      }
      
      // 备选采购价格
      const purchasePrice = safeGetValue(asset.purchase_price);
      return sum + purchasePrice;
    }, 0);

    // 如果总值为 0，返回 ¥0.00
    if (totalValue === 0) {
      return '¥0.00';
    }

    return totalValue.toLocaleString('zh-CN', {
      style: 'currency', 
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // 状态标签样式
  const getStatusBadge = (status: string) => {
    const styles = {
      in_use: 'bg-green-100 text-green-800',
      idle: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-blue-100 text-blue-800',
      scrapped: 'bg-red-100 text-red-800',
      disposed: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      in_use: '使用中',
      idle: '闲置',
      maintenance: '维护中',
      scrapped: '报废',
      disposed: '已处置',
    };
    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // 处理新增资产
  const handleAddAsset = async (data: AssetFormData) => {
    try {
      await assetAPI.create({
        name: data.name,
        code: data.code,
        category_id: data.categoryId,
        brand_id: data.brandId !== 'none' ? data.brandId : undefined,
        model: data.model,
        specification: data.specification,
        purchase_date: data.purchaseDate,
        purchase_price: data.purchasePrice,
        location_id: data.locationId,
        department_id: data.departmentId,
        custodian_id: data.custodianId !== 'none' ? data.custodianId : undefined,
        user_id: data.userId !== 'none' ? data.userId : undefined,
        status: data.status,
        warranty_expiry: data.warrantyExpiry
      });
      
      await loadData(); // 重新加载数据
      setIsAddDialogOpen(false);
      addForm.reset();
      alert('资产添加成功！');
    } catch (err) {
      console.error('添加资产失败:', err);
      alert('添加资产失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 处理编辑资产
  const handleEditAsset = async (data: AssetFormData) => {
    if (!selectedAsset) return;

    try {
      await assetAPI.update(selectedAsset.id, {
        name: data.name,
        code: data.code,
        category_id: data.categoryId,
        brand_id: data.brandId !== 'none' ? data.brandId : undefined,
        model: data.model,
        specification: data.specification,
        purchase_date: data.purchaseDate,
        purchase_price: data.purchasePrice,
        location_id: data.locationId,
        department_id: data.departmentId,
        custodian_id: data.custodianId !== 'none' ? data.custodianId : undefined,
        user_id: data.userId !== 'none' ? data.userId : undefined,
        status: data.status,
        warranty_expiry: data.warrantyExpiry
      });
      
      await loadData(); // 重新加载数据
      setIsEditDialogOpen(false);
      editForm.reset();
      alert('资产更新成功！');
    } catch (err) {
      console.error('更新资产失败:', err);
      alert('更新资产失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 删除资产
  const handleDeleteAsset = async (asset: Asset) => {
    try {
      await assetAPI.delete(asset.id);
      await loadData(); // 重新加载数据
      alert('资产删除成功！');
    } catch (err) {
      console.error('删除资产失败:', err);
      alert('删除资产失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 打开编辑对话框
  const openEditDialog = (asset: Asset) => {
    editForm.reset({
      name: asset.name,
      code: asset.code,
      categoryId: asset.category_id,
      brandId: asset.brand_id || 'none',
      model: asset.model || '',
      specification: asset.specification || '',
      supplierId: 'none', // 由于 Asset 类型中没有 supplier_id，默认为 'none'
      purchaseDate: asset.purchase_date || new Date().toISOString().split('T')[0],
      purchasePrice: asset.purchase_price || 0,
      locationId: asset.location_id || '',
      departmentId: asset.department_id || '',
      custodianId: asset.custodian_id || 'none',
      userId: asset.user_id || 'none',
      projectId: asset.project_id || 'none',
      status: asset.status,
      warrantyExpiry: asset.warranty_expiry || '',
      description: asset.specification || ''
    });
    setSelectedAsset(asset);
    setIsEditDialogOpen(true);
  };

  // 打开查看对话框
  const openViewDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsViewDialogOpen(true);
  };

  // 筛选资产 - 更新包含项目筛选
  const filteredAssets = assets.filter(asset => {
    // 安全检查：确保关键属性存在
    if (!asset || !asset.name || !asset.code || !asset.model || !asset.category) {
      console.warn('不完整的资产对象:', asset);
      return false;
    }

    const matchesSearch = 
      (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.model || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category?.id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">资产清单</h1>
            <p className="text-muted-foreground mt-1">管理公司所有固定资产信息和项目关联</p>
            <div className="mt-2 text-sm text-muted-foreground">
              总资产价值：
              <span className="font-semibold text-foreground">
                {calculateTotalAssetValue()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={loading}
              className="border-border text-foreground hover:bg-accent"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  新增资产
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>新增资产</DialogTitle>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(handleAddAsset)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 资产名称 */}
                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>资产名称 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="请输入资产名称" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 资产编号 */}
                      <FormField
                        control={addForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>资产编号 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="请输入资产编号" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 资产分类 */}
                      <FormField
                        control={addForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>资产分类 <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择资产分类" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 品牌 */}
                      <FormField
                        control={addForm.control}
                        name="brandId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>品牌</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择品牌" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无品牌</SelectItem>
                                {brands.map(brand => (
                                  <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 型号规格 */}
                      <FormField
                        control={addForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>型号规格 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="请输入型号规格" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 供应商 */}
                      <FormField
                        control={addForm.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>供应商</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择供应商" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无供应商</SelectItem>
                                {suppliers.map(supplier => (
                                  <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 关联项目 - 新增字段 */}
                      <FormField
                        control={addForm.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>关联项目</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择关联项目（可选）" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无关联项目</SelectItem>
                                {projects.map(project => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 采购日期 */}
                      <FormField
                        control={addForm.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>采购日期 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 采购价格 */}
                      <FormField
                        control={addForm.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>采购价格 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                placeholder="请输入采购价格" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 存放位置 */}
                      <FormField
                        control={addForm.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>存放位置 <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择存放位置" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locations.map(location => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 使用部门 */}
                      <FormField
                        control={addForm.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>使用部门 <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择使用部门" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map(dept => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 保管人 */}
                      <FormField
                        control={addForm.control}
                        name="custodianId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>保管人</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择保管人" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无保管人</SelectItem>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 使用人 */}
                      <FormField
                        control={addForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>使用人</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择使用人" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无使用人</SelectItem>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 资产状态 */}
                      <FormField
                        control={addForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>资产状态 <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择资产状态" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="in_use">在用</SelectItem>
                                <SelectItem value="idle">闲置</SelectItem>
                                <SelectItem value="maintenance">维护中</SelectItem>
                                <SelectItem value="scrapped">已报废</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 保修到期日期 */}
                      <FormField
                        control={addForm.control}
                        name="warrantyExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>保修到期日期</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 详细规格 */}
                      <FormField
                        control={addForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>详细规格</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="请输入详细规格说明"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        <X className="mr-2 h-4 w-4" />
                        取消
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">资产总数</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{assets.length}</div>
              <p className="text-xs text-muted-foreground">
                使用中 {assets.filter(a => a.status === 'in_use').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总价值</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{assets.reduce((sum, a) => sum + (a.current_value || a.purchase_price || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                原值 ¥{assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">项目关联</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {assets.filter(a => a.project_id).length}
              </div>
              <p className="text-xs text-muted-foreground">
                已关联项目的资产
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">维护中</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {assets.filter(a => a.status === 'maintenance').length}
              </div>
              <p className="text-xs text-muted-foreground">
                需要关注的资产
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 资产列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">资产列表</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  高级筛选
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索资产..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="in_use">使用中</SelectItem>
                  <SelectItem value="idle">闲置</SelectItem>
                  <SelectItem value="maintenance">维护中</SelectItem>
                  <SelectItem value="scrapped">报废</SelectItem>
                  <SelectItem value="disposed">已处置</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 新增项目筛选 */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="项目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部项目</SelectItem>
                  <SelectItem value="none">无关联项目</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>资产编号</TableHead>
                  <TableHead>资产名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>品牌型号</TableHead>
                  <TableHead>关联项目</TableHead>
                  <TableHead>使用部门</TableHead>
                  <TableHead>使用人</TableHead>
                  <TableHead>当前价值</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  // 安全检查：确保关键属性存在
                  if (!asset || !asset.id || !asset.name || !asset.code) {
                    console.warn('不完整的资产对象:', asset);
                    return null; // 跳过渲染不完整的资产
                  }

                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <span>{asset.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {asset.category?.name || '未分类'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.brand?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{asset.model || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className={asset.project_id ? 'text-foreground' : 'text-muted-foreground'}>
                            {getProjectName(asset.project_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getDepartmentName(asset.department_id)}</TableCell>
                      <TableCell>{asset.user?.name || '-'}</TableCell>
                      <TableCell>{getCurrentValue(asset)}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(asset)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(asset)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onConfirm={() => handleDeleteAsset(asset)}
                            itemName={asset.name}
                            variant="ghost"
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

        {/* 查看对话框 */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>资产详情</DialogTitle>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">资产编号</Label>
                    <p className="text-foreground font-medium">{selectedAsset.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">资产名称</Label>
                    <p className="text-foreground">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">资产分类</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedAsset.category?.name || '未分类'}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">品牌</Label>
                    <p className="text-foreground">{selectedAsset.brand?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">型号规格</Label>
                    <p className="text-foreground">{selectedAsset.model || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">供应商</Label>
                    <p className="text-foreground">-</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">关联项目</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <p className={selectedAsset.project_id ? 'text-foreground' : 'text-muted-foreground'}>
                        {getProjectName(selectedAsset.project_id)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">采购日期</Label>
                    <p className="text-foreground">{selectedAsset.purchase_date || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">采购价格</Label>
                    <p className="text-foreground">¥{(selectedAsset.purchase_price || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">当前价值</Label>
                    <p className="text-foreground">
                      {getCurrentValue(selectedAsset)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">累计折旧</Label>
                    <p className="text-foreground">¥{(selectedAsset.depreciation_value || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">存放位置</Label>
                    <p className="text-foreground">{selectedAsset.location?.name || '未指定位置'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">使用部门</Label>
                    <p className="text-foreground">{getDepartmentName(selectedAsset.department_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">保管人</Label>
                    <p className="text-foreground">{selectedAsset.custodian?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">使用人</Label>
                    <p className="text-foreground">{selectedAsset.user?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">资产状态</Label>
                    <div className="mt-1">{getStatusBadge(selectedAsset.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">保修到期</Label>
                    <p className="text-foreground">{selectedAsset.warranty_expiry || '-'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">详细规格</Label>
                  <p className="text-foreground mt-1">{selectedAsset.specification || '-'}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                关闭
              </Button>
              {selectedAsset && (
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedAsset);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑资产</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditAsset)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 资产名称 */}
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资产名称 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="请输入资产名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 资产编号 */}
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资产编号 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="请输入资产编号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 资产分类 */}
                  <FormField
                    control={editForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资产分类 <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择资产分类" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 品牌 */}
                  <FormField
                    control={editForm.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>品牌</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择品牌" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">无品牌</SelectItem>
                            {brands.map(brand => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 型号规格 */}
                  <FormField
                    control={editForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>型号规格 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="请输入型号规格" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 供应商 */}
                  <FormField
                    control={editForm.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>供应商</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择供应商" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">无供应商</SelectItem>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 关联项目 */}
                  <FormField
                    control={editForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>关联项目</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择关联项目（可选）" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">无关联项目</SelectItem>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 采购日期 */}
                  <FormField
                    control={editForm.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>采购日期 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 采购价格 */}
                  <FormField
                    control={editForm.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>采购价格 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            placeholder="请输入采购价格" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 存放位置 */}
                  <FormField
                    control={editForm.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>存放位置 <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择存放位置" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 使用部门 */}
                  <FormField
                    control={editForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>使用部门 <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择使用部门" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 保管人 */}
                  <FormField
                    control={editForm.control}
                    name="custodianId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>保管人</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择保管人" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">无保管人</SelectItem>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 使用人 */}
                  <FormField
                    control={editForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>使用人</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择使用人" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">无使用人</SelectItem>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 资产状态 */}
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资产状态 <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择资产状态" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_use">在用</SelectItem>
                            <SelectItem value="idle">闲置</SelectItem>
                            <SelectItem value="maintenance">维护中</SelectItem>
                            <SelectItem value="scrapped">已报废</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 保修到期日期 */}
                  <FormField
                    control={editForm.control}
                    name="warrantyExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>保修到期日期</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 详细规格 */}
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>详细规格</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="请输入详细规格说明"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    更新
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AssetList;
