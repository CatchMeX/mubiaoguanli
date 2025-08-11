import { useState, useEffect, useCallback } from 'react';
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
  DialogFooter,
  DialogClose,
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
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Building,
  Package,
} from 'lucide-react';
import { assetAPI, userAPI, departmentAPI } from '@/services/api';
import { departments, assetLocations } from '@/data/mockData';
import type { AssetMovement, Asset } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ExtendedAssetMovement extends AssetMovement {
  type: 'location_change' | 'department_change' | 'custodian_change' | 'user_change' | 'status_change';
  from_value: string;
  to_value: string;
  operator: { name: string };
}

// 添加类型映射
const MOVEMENT_TYPE_MAP = {
  location_change: 'transfer',
  department_change: 'transfer',
  custodian_change: 'allocation',
  user_change: 'allocation',
  status_change: 'maintenance'
} as const;

// 添加反向映射
const REVERSE_MOVEMENT_TYPE_MAP = {
  transfer: ['location_change', 'department_change'],
  allocation: ['custodian_change', 'user_change'],
  maintenance: ['status_change']
} as const;

const AssetMovements = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<ExtendedAssetMovement[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<ExtendedAssetMovement | null>(null);
  const [newMovement, setNewMovement] = useState({
    assetId: '',
    type: 'location_change' as 'location_change' | 'department_change' | 'custodian_change' | 'user_change' | 'status_change',
    fromValue: '',
    toValue: '',
    reason: '',
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // 获取部门列表
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentAPI.getAll();
      setDepartments(res);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // 获取位置列表
  const fetchLocations = useCallback(async () => {
    try {
      const res = await assetAPI.getAssetLocations();
      setLocations(res);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }, []);

  // 获取资产列表
  const fetchAssets = useCallback(async () => {
    try {
      const res = await assetAPI.getAssets();
      setAssets(res);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({
        title: '获取资产列表失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  }, []);

  // 获取资产变动记录
  const fetchMovements = useCallback(async (): Promise<void> => {
    try {
      const res = await assetAPI.getAssetMovements();
      if (res) {
        // 转换数据以匹配扩展类型
        const extendedMovements = res.map(movement => ({
          ...movement,
          type: movement.movement_type as 'location_change' | 'department_change' | 'custodian_change' | 'user_change' | 'status_change',
          from_value: movement.from_location_id || movement.from_department_id || movement.from_custodian_id || '',
          to_value: movement.to_location_id || movement.to_department_id || movement.to_custodian_id || '',
          operator: { name: movement.applicant?.name || '' },
        }));
        setMovements(extendedMovements);
      }
    } catch (error) {
      console.error('Error fetching asset movements:', error);
      toast({
        title: '获取资产变动记录失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  }, []);

  useEffect(() => {
    fetchMovements();
    fetchAssets();
    fetchDepartments();
    fetchUsers();
    fetchLocations();
  }, [fetchMovements, fetchAssets, fetchDepartments, fetchUsers, fetchLocations]);

  // 过滤变动记录
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      (movement.asset?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.asset?.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || movement.status === statusFilter;
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'border-yellow-500 text-yellow-500';
      case 'approved': return 'border-green-500 text-green-500';
      case 'rejected': return 'border-red-500 text-red-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待审批',
      'approved': '已批准',
      'rejected': '已拒绝',
    };
    return statusMap[status] || status;
  };

  // 获取变动类型名称
  const getMovementTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'transfer': '位置变更',
      'allocation': '保管人变更',
      'maintenance': '状态变更'
    };
    return typeMap[type] || type;
  };

  // 获取变动内容
  const getMovementContent = (movement: ExtendedAssetMovement) => {
    if (!movement.asset) return { from: '', to: '' };

    switch (movement.movement_type) {
      case 'transfer':
        if (movement.from_location_id) {
          // 位置变更
          const fromLocation = locations.find(l => l.id === movement.from_location_id);
          const toLocation = locations.find(l => l.id === movement.to_location_id);
          return {
            from: fromLocation?.name || '未知位置',
            to: toLocation?.name || '未知位置'
          };
        } else if (movement.from_department_id) {
          // 部门变更
          const fromDepartment = departments.find(d => d.id === movement.from_department_id);
          const toDepartment = departments.find(d => d.id === movement.to_department_id);
          return {
            from: fromDepartment?.name || '未知部门',
            to: toDepartment?.name || '未知部门'
          };
        }
        break;
      case 'allocation':
        // 保管人或使用人变更
        const fromUser = users.find(u => u.id === movement.from_custodian_id);
        const toUser = users.find(u => u.id === movement.to_custodian_id);
        return {
          from: fromUser?.name || '未知用户',
          to: toUser?.name || '未知用户'
        };
      case 'maintenance':
        // 状态变更
        return {
          from: getStatusLabel(movement.asset.status),
          to: movement.to_status ? getStatusLabel(movement.to_status) : '未知状态'
        };
    }
    return { from: '', to: '' };
  };

  // 获取变动类型图标
  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'location_change': return MapPin;
      case 'department_change': return Building;
      case 'custodian_change': return User;
      case 'user_change': return User;
      case 'status_change': return Package;
      default: return ArrowRight;
    }
  };

  // 展平位置数据
  const flattenLocations = (locations: any[], level = 0): any[] => {
    let result: any[] = [];
    locations.forEach(location => {
      result.push({ ...location, level });
      if (location.children) {
        result = result.concat(flattenLocations(location.children, level + 1));
      }
    });
    return result;
  };

  const flatLocations = flattenLocations(assetLocations);

  // 获取选项列表
  const getToValueOptions = () => {
    switch (newMovement.type) {
      case 'location_change':
        return locations.map(location => ({
          value: location.id,
          label: location.name
        }));
      case 'department_change':
        return departments.map(dept => ({
          value: dept.id,
          label: dept.name
        }));
      case 'custodian_change':
      case 'user_change':
        return users.map(user => ({
          value: user.id,
          label: user.name
        }));
      case 'status_change':
        return [
          { value: 'in_use', label: '使用中' },
          { value: 'idle', label: '闲置' },
          { value: 'maintenance', label: '维修中' },
          { value: 'scrapped', label: '已报废' }
        ];
      default:
        return [];
    }
  };

  // 获取变更前的值
  const getFromValue = (asset: Asset | undefined, type: string) => {
    if (!asset) return '';
    
    switch (type) {
      case 'location_change':
        const location = locations.find(l => l.id === asset.location_id);
        return location ? location.name : '';
      case 'department_change':
        const department = departments.find(d => d.id === asset.department_id);
        return department ? department.name : '';
      case 'custodian_change':
        const custodian = users.find(u => u.id === asset.custodian_id);
        return custodian ? custodian.name : '';
      case 'user_change':
        const user = users.find(u => u.id === asset.user_id);
        return user ? user.name : '';
      case 'status_change':
        return getStatusLabel(asset.status);
      default:
        return '';
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'in_use': '使用中',
      'idle': '闲置',
      'maintenance': '维修中',
      'scrapped': '已报废'
    };
    return statusMap[status] || status;
  };

  // 获取变更后的显示值
  const getToValueLabel = (value: string, type: string) => {
    if (!value) return '';
    
    switch (type) {
      case 'location_change':
        const location = locations.find(l => l.id === value);
        return location ? location.name : value;
      case 'department_change':
        const department = departments.find(d => d.id === value);
        return department ? department.name : value;
      case 'custodian_change':
      case 'user_change':
        const user = users.find(u => u.id === value);
        return user ? user.name : value;
      case 'status_change':
        return getStatusLabel(value);
      default:
        return value;
    }
  };

  // 监听资产选择变化
  const handleAssetChange = (assetId: string) => {
    const selectedAsset = assets.find(a => a.id === assetId);
    setNewMovement(prev => ({
      ...prev,
      assetId,
      fromValue: getFromValue(selectedAsset, prev.type)
    }));
  };

  // 监听变动类型变化
  const handleTypeChange = (type: 'location_change' | 'department_change' | 'custodian_change' | 'user_change' | 'status_change') => {
    const selectedAsset = assets.find(a => a.id === newMovement.assetId);
    setNewMovement(prev => ({
      ...prev,
      type,
      fromValue: getFromValue(selectedAsset, type),
      toValue: ''
    }));
  };

  // 创建变动记录
  const handleCreate = async () => {
    try {
      console.log('Starting asset movement creation...');
      if (!user?.id) {
        console.error('User not logged in:', user);
        toast({
          title: '未登录',
          description: '请先登录后再操作',
          variant: 'destructive',
        });
        return;
      }

      console.log('User authenticated:', user);
      console.log('New movement data:', newMovement);

      const selectedAsset = assets.find(a => a.id === newMovement.assetId);
      if (!selectedAsset) {
        console.error('Asset not found:', newMovement.assetId);
        toast({
          title: '资产不存在',
          description: '请选择一个有效的资产',
          variant: 'destructive',
        });
        return;
      }

      console.log('Selected asset:', selectedAsset);

      // 只对非状态变更类型进行 UUID 验证
      if (newMovement.type !== 'status_change') {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(newMovement.toValue)) {
          console.error('Invalid UUID format:', newMovement.toValue);
          toast({
            title: '无效的目标值',
            description: '请选择有效的目标选项',
            variant: 'destructive',
          });
          return;
        }
      }

      console.log('Validation passed');

      // 根据变动类型设置相应的字段
      const movementData = {
        movement_number: `MOV-${new Date().getTime()}`,
        asset_id: selectedAsset.id,
        movement_type: MOVEMENT_TYPE_MAP[newMovement.type] as AssetMovement['movement_type'],
        reason: newMovement.reason,
        status: 'pending' as const,
        application_date: new Date().toISOString().split('T')[0],
        applicant_id: user.id,
      } as const;

      console.log('Base movement data:', movementData);

      // 根据变动类型添加相应的字段
      let finalMovementData: Partial<AssetMovement>;
      switch (newMovement.type) {
        case 'location_change':
          finalMovementData = {
            ...movementData,
            from_location_id: selectedAsset.location_id,
            to_location_id: newMovement.toValue,
          };
          break;
        case 'department_change':
          finalMovementData = {
            ...movementData,
            from_department_id: selectedAsset.department_id,
            to_department_id: newMovement.toValue,
          };
          break;
        case 'custodian_change':
          finalMovementData = {
            ...movementData,
            from_custodian_id: selectedAsset.custodian_id,
            to_custodian_id: newMovement.toValue,
          };
          break;
        case 'user_change':
          finalMovementData = {
            ...movementData,
            from_custodian_id: selectedAsset.user_id,
            to_custodian_id: newMovement.toValue,
            notes: '使用人变更',
          };
          break;
        case 'status_change':
          finalMovementData = {
            ...movementData,
            notes: `状态从 ${selectedAsset.status} 变更为 ${newMovement.toValue}`,
            to_status: newMovement.toValue, // 添加状态字段
          };
          break;
        default:
          throw new Error('不支持的变动类型');
      }

      console.log('Final movement data:', finalMovementData);

      console.log('Calling API to create asset movement...');
      const result = await assetAPI.createAssetMovement(finalMovementData);
      console.log('API response:', result);

      if (!result) {
        throw new Error('创建资产变动记录失败');
      }

      setIsCreateOpen(false);
      setNewMovement({
        assetId: '',
        type: 'location_change',
        fromValue: '',
        toValue: '',
        reason: '',
      });
      toast({
        title: '创建成功',
        description: '资产变动记录已创建',
        duration: 2000,
      });
      // 使用 setTimeout 来处理异步调用
      setTimeout(() => {
        fetchMovements();
      }, 0);
    } catch (error) {
      console.error('Error creating asset movement:', error);
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '服务器错误',
        variant: 'destructive',
      });
    }
  };

  // 编辑变动记录
  const handleEdit = (movement: ExtendedAssetMovement) => {
    setEditingMovement(movement);
    setNewMovement({
      assetId: movement.asset_id,
      type: movement.type,
      fromValue: movement.from_value || '',
      toValue: movement.to_value || '',
      reason: movement.reason || '',
    });
  };

  // 更新变动记录
  const handleUpdate = async () => {
    try {
      if (!editingMovement) return;

      const movementData: Partial<ExtendedAssetMovement> = {
        movement_type: 'transfer' as 'transfer', // 映射到 AssetMovement 的类型
        from_location_id: newMovement.type === 'location_change' ? newMovement.fromValue : undefined,
        to_location_id: newMovement.type === 'location_change' ? newMovement.toValue : undefined,
        from_department_id: newMovement.type === 'department_change' ? newMovement.fromValue : undefined,
        to_department_id: newMovement.type === 'department_change' ? newMovement.toValue : undefined,
        from_custodian_id: newMovement.type === 'custodian_change' ? newMovement.fromValue : undefined,
        to_custodian_id: newMovement.type === 'custodian_change' ? newMovement.toValue : undefined,
        reason: newMovement.reason,
      };

      const res = await assetAPI.updateAssetMovement(editingMovement.id, movementData);
      if (res) {
        toast({
          title: '资产变动记录更新成功',
          description: `变动记录已更新`,
          duration: 2000,
        });
        setIsCreateOpen(false);
        fetchMovements();
        setEditingMovement(null);
        setNewMovement({
          assetId: '',
          type: 'location_change',
          fromValue: '',
          toValue: '',
          reason: '',
        });
      }
    } catch (error) {
      console.error('Error updating asset movement:', error);
      toast({
        title: '更新失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  };

  // 删除变动记录
  const handleDelete = async (id: string) => {
    try {
      await assetAPI.deleteAssetMovement(id);
        toast({
          title: '删除成功',
          description: '资产变动记录已删除',
        duration: 2000,
        });
        fetchMovements();
    } catch (error) {
      console.error('Error deleting asset movement:', error);
      toast({
        title: '删除失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  };

  // 审批变动
  const handleApprove = async (id: string) => {
    try {
      // 1. 先获取变动记录详情
      const movement = movements.find(m => m.id === id);
      if (!movement || !movement.asset) {
        toast({
          title: '审批失败',
          description: '找不到相关变动记录或资产信息',
          variant: 'destructive',
        });
        return;
      }

      // 2. 更新变动记录状态
      const res = await assetAPI.updateAssetMovement(id, { 
        status: 'approved',
        approval_date: new Date().toISOString().split('T')[0],
        approver_id: user?.id
      });

      if (!res) {
        throw new Error('更新变动记录失败');
      }

      // 3. 根据变动类型更新资产信息
      const assetUpdateData: Partial<Asset> = {};
      
      switch (movement.movement_type) {
        case 'transfer':
          if (movement.to_location_id) {
            // 位置变更
            assetUpdateData.location_id = movement.to_location_id;
          } else if (movement.to_department_id) {
            // 部门变更
            assetUpdateData.department_id = movement.to_department_id;
          }
          break;
        
        case 'allocation':
          if (movement.notes === '使用人变更') {
            // 使用人变更
            assetUpdateData.user_id = movement.to_custodian_id;
          } else {
            // 保管人变更
            assetUpdateData.custodian_id = movement.to_custodian_id;
          }
          break;
        
        case 'maintenance':
          // 状态变更
          if (movement.to_status && (movement.to_status === 'in_use' || movement.to_status === 'idle' || movement.to_status === 'maintenance' || movement.to_status === 'scrapped')) {
            assetUpdateData.status = movement.to_status;
          }
          break;
      }

      // 4. 更新资产信息
      if (Object.keys(assetUpdateData).length > 0) {
        const assetRes = await assetAPI.updateAsset(movement.asset_id, assetUpdateData);
        if (!assetRes) {
          throw new Error('更新资产信息失败');
        }
      }

      // 5. 显示成功消息
      toast({
        title: '审批成功',
        description: '资产变动已批准，相关资产信息已更新',
        duration: 2000,
      });

      // 6. 刷新数据
      await Promise.all([
        fetchMovements(),
        fetchAssets()
      ]);

    } catch (error) {
      console.error('Error approving asset movement:', error);
      toast({
        title: '审批失败',
        description: error instanceof Error ? error.message : '服务器错误',
        variant: 'destructive',
      });
    }
  };

  // 拒绝变动
  const handleReject = async (id: string) => {
    try {
      const res = await assetAPI.updateAssetMovement(id, { status: 'rejected' });
      if (res) {
        toast({
          title: '拒绝成功',
          description: '资产变动已拒绝',
        duration: 2000,
        });
        fetchMovements();
      }
    } catch (error) {
      console.error('Error rejecting asset movement:', error);
      toast({
        title: '拒绝失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setNewMovement({
        assetId: '',
        type: 'location_change',
        fromValue: '',
        toValue: '',
        reason: '',
      });
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    if (!open) {
      setEditingMovement(null);
      setNewMovement({
        assetId: '',
        type: 'location_change',
        fromValue: '',
        toValue: '',
        reason: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">资产变动</h1>
            <p className="text-muted-foreground mt-1">管理资产变动记录和审批</p>
          </div>
          <Dialog 
            open={isCreateOpen} 
            onOpenChange={handleCreateDialogChange}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增变动
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">新增资产变动</DialogTitle>
              </DialogHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="asset" className="text-sm font-medium flex items-center">
                    选择资产
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select 
                    value={newMovement.assetId} 
                    onValueChange={handleAssetChange}
                  >
                    <SelectTrigger id="asset" className="w-full">
                      <SelectValue placeholder="选择要变动的资产" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.code} - {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium flex items-center">
                    变动类型
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select 
                    value={newMovement.type} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="选择变动类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="location_change">位置变更</SelectItem>
                      <SelectItem value="department_change">部门变更</SelectItem>
                      <SelectItem value="custodian_change">保管人变更</SelectItem>
                      <SelectItem value="user_change">使用人变更</SelectItem>
                      <SelectItem value="status_change">状态变更</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromValue" className="text-sm font-medium">
                      变更前
                    </Label>
                    <Input
                      id="fromValue"
                      value={newMovement.fromValue}
                      className="w-full bg-muted"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toValue" className="text-sm font-medium flex items-center">
                      变更后
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select 
                      value={newMovement.toValue} 
                      onValueChange={(value) => setNewMovement(prev => ({ ...prev, toValue: value }))}
                    >
                      <SelectTrigger id="toValue" className="w-full">
                        <SelectValue placeholder="选择目标值" />
                      </SelectTrigger>
                      <SelectContent>
                        {getToValueOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium flex items-center">
                    变动原因
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    value={newMovement.reason}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="请输入变动原因"
                    className="w-full min-h-[100px]"
                  />
                </div>

                <DialogFooter className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    创建
                  </Button>
                </DialogFooter>
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
                  placeholder="搜索资产名称、编号或变动原因..."
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
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已批准</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="location_change">位置变更</SelectItem>
                  <SelectItem value="department_change">部门变更</SelectItem>
                  <SelectItem value="custodian_change">保管人变更</SelectItem>
                  <SelectItem value="user_change">使用人变更</SelectItem>
                  <SelectItem value="status_change">状态变更</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 变动记录列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">变动记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">资产信息</TableHead>
                  <TableHead className="text-muted-foreground">变动类型</TableHead>
                  <TableHead className="text-muted-foreground">变动内容</TableHead>
                  <TableHead className="text-muted-foreground">变动原因</TableHead>
                  <TableHead className="text-muted-foreground">操作人</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">操作时间</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => {
                  const IconComponent = getMovementTypeIcon(movement.type);
                  return (
                    <TableRow key={movement.id} className="border-border">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">{movement.asset?.name || ''}</span>
                          </div>
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            {movement.asset?.code || ''}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{getMovementTypeName(movement.movement_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground text-sm">{getMovementContent(movement).from}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground text-sm font-medium">{getMovementContent(movement).to}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-sm">{movement.reason || ''}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{movement.operator?.name || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusStyle(movement.status)}>
                          {getStatusName(movement.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.application_date ? new Date(movement.application_date).toLocaleDateString('zh-CN') : ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {movement.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                onClick={() => handleApprove(movement.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                onClick={() => handleReject(movement.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Dialog 
                            open={editingMovement?.id === movement.id} 
                            onOpenChange={handleEditDialogChange}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                onClick={() => handleEdit(movement)}
                                disabled={movement.status !== 'pending'}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>编辑资产变动</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-asset">选择资产</Label>
                                  <Select value={newMovement.assetId} onValueChange={(value) => setNewMovement(prev => ({ ...prev, assetId: value }))}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                      {assets.map(asset => (
                                        <SelectItem key={asset.id} value={asset.id}>
                                          {asset.code} - {asset.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-type">变动类型</Label>
                                  <Select value={newMovement.type} onValueChange={(value: 'location_change' | 'department_change' | 'custodian_change' | 'user_change' | 'status_change') => setNewMovement(prev => ({ ...prev, type: value }))}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                      <SelectItem value="location_change">位置变更</SelectItem>
                                      <SelectItem value="department_change">部门变更</SelectItem>
                                      <SelectItem value="custodian_change">保管人变更</SelectItem>
                                      <SelectItem value="user_change">使用人变更</SelectItem>
                                      <SelectItem value="status_change">状态变更</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-fromValue">变更前</Label>
                                    <Input
                                      id="edit-fromValue"
                                      value={newMovement.fromValue}
                                      onChange={(e) => setNewMovement(prev => ({ ...prev, fromValue: e.target.value }))}
                                      className="bg-background border-border text-foreground"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-toValue">变更后</Label>
                                    <Select 
                                      value={newMovement.toValue} 
                                      onValueChange={(value) => setNewMovement(prev => ({ ...prev, toValue: value }))}
                                    >
                                      <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getToValueOptions().map(option => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-reason">变动原因</Label>
                                  <Textarea
                                    id="edit-reason"
                                    value={newMovement.reason}
                                    onChange={(e) => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
                                    className="bg-background border-border text-foreground"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setEditingMovement(null)}>
                                    取消
                                  </Button>
                                  <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    更新
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DeleteButton 
                            onConfirm={() => handleDelete(movement.id)}
                            itemName="资产变动记录"
                            description="删除后将无法恢复该变动记录"
                            disabled={movement.status === 'approved'}
                            size="sm"
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
    </div>
  );
};

export default AssetMovements;
