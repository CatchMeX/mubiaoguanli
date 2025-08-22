import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  Building2,
  Calculator,
  Save,
  X,
  Target,
  DollarSign,
  Settings,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { teamAPI, userAPI } from '@/services/api';
import type { User, Team, TeamPerformanceConfig, PerformanceTier, TeamAllocationConfig } from '@/types';
import { toast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/usePermissions';
import UserSelect from '@/components/UserSelect';

const TeamManagement = () => {
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // 分摊配置状态
  const [allocationConfigs, setAllocationConfigs] = useState<TeamAllocationConfig[]>([]);
  
  // 绩效配置状态
  const [performanceConfigs, setPerformanceConfigs] = useState<Map<string, TeamPerformanceConfig>>(new Map());

  // 新增项目表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    leaderId: 'none',
    description: '',
    teamType: 'functional' as 'project' | 'functional' | 'cross_functional',
    memberIds: [] as string[],
    establishedDate: '',
    objectives: '',
    location: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'disbanded',
    // 绩效配置
    performanceCalculationType: 'fixed' as 'fixed' | 'tiered',
    performanceFixedRate: '',
    performanceTiers: [] as PerformanceTier[],
    performanceIsActive: true,
  });

  // 编辑项目表单状态
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    leaderId: 'none',
    description: '',
    teamType: 'functional' as 'project' | 'functional' | 'cross_functional',
    memberIds: [] as string[],
    establishedDate: '',
    objectives: '',
    location: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'disbanded',
    // 绩效配置
    performanceCalculationType: 'fixed' as 'fixed' | 'tiered',
    performanceFixedRate: '',
    performanceTiers: [] as PerformanceTier[],
    performanceIsActive: true,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsResponse, usersResponse] = await Promise.all([
        teamAPI.getTeamsWithMembers(),
        userAPI.getAll()
      ]);

      setTeamList(teamsResponse || []);
      setUsers(usersResponse || []);
      
      // 获取所有项目的绩效配置
      const teams = teamsResponse || [];
      const performanceConfigMap = new Map<string, TeamPerformanceConfig>();
      
      for (const team of teams) {
        try {
          const config = await teamAPI.getTeamPerformanceConfig(team.id);
          if (config) {
            performanceConfigMap.set(team.id, config);
          }
        } catch (err) {
          console.log(`获取项目 ${team.name} 的绩效配置失败:`, err);
        }
      }
      
      setPerformanceConfigs(performanceConfigMap);
      
      // 获取所有项目的分摊配置
      try {
        const allocationConfigs = await teamAPI.getAllTeamAllocationConfigs();
        setAllocationConfigs(allocationConfigs || []);
      } catch (err) {
        console.log('获取分摊配置失败:', err);
      }
    } catch (err) {
      setError('加载数据失败，请重试');
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 过滤项目
  const filteredTeams = teamList.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (team.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    const matchesType = typeFilter === 'all' || team.team_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 状态映射
  const statusMap = {
    active: { label: '活跃', color: 'bg-green-600' },
    inactive: { label: '暂停', color: 'bg-yellow-600' },
    disbanded: { label: '解散', color: 'bg-red-600' },
  };

  // 项目类型映射
  const teamTypeMap = {
    project: { label: '项目团队', color: 'bg-blue-600' },
    functional: { label: '职能团队', color: 'bg-purple-600' },
    cross_functional: { label: '跨职能团队', color: 'bg-orange-600' },
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      leaderId: 'none',
      description: '',
      teamType: 'functional',
      memberIds: [],
      establishedDate: '',
      objectives: '',
      location: '',
      email: '',
      phone: '',
      status: 'active',
      performanceCalculationType: 'fixed',
      performanceFixedRate: '',
      performanceTiers: [],
      performanceIsActive: true,
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      code: '',
      leaderId: 'none',
      description: '',
      teamType: 'functional',
      memberIds: [],
      establishedDate: '',
      objectives: '',
      location: '',
      email: '',
      phone: '',
      status: 'active',
      performanceCalculationType: 'fixed',
      performanceFixedRate: '',
      performanceTiers: [],
      performanceIsActive: true,
    });
  };

  // 添加团队
  const addTeam = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: '请输入项目名称',
          description: '请输入项目名称',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.code.trim()) {
        toast({
          title: '请输入项目编码',
          description: '请输入项目编码',
          variant: 'destructive',
        });
        return;
      }
      if (formData.leaderId === 'none') {
        toast({
          title: '请选择项目负责人',
          description: '请选择项目负责人',
          variant: 'destructive',
        });
        return;
      }

      // 检查编码是否重复
      if (teamList.some(team => team.code === formData.code.trim())) {
        toast({
          title: '项目编码已存在',
          description: '项目编码已存在',
          variant: 'destructive',
        });
        return;
      }

      const teamData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        leader_id: formData.leaderId,
        description: formData.description.trim(),
        team_type: formData.teamType as 'project' | 'functional' | 'cross_functional',
        established_date: formData.establishedDate || undefined,
        status: formData.status,
        objectives: formData.objectives.trim(),
        location: formData.location.trim(),
        contact_email: formData.email.trim(),
        contact_phone: formData.phone.trim(),
      };

      const newTeam = await teamAPI.create(teamData);
      
      // 保存绩效配置
      if (formData.performanceIsActive) {
        console.log('准备保存绩效配置:', {
          calculation_type: formData.performanceCalculationType,
          fixed_rate: formData.performanceFixedRate,
          tiers: formData.performanceTiers
        });

        const performanceConfigData = {
          team_id: newTeam.id,
          calculation_type: formData.performanceCalculationType,
          fixed_rate: formData.performanceCalculationType === 'fixed' && formData.performanceFixedRate ? 
            parseFloat(formData.performanceFixedRate) : undefined,
          is_active: true,
        };
        
        const performanceConfig = await teamAPI.createTeamPerformanceConfig(performanceConfigData);
        console.log('绩效配置保存成功:', performanceConfig);
        
        // 如果是阶梯式，保存阶梯配置
        if (formData.performanceCalculationType === 'tiered' && formData.performanceTiers.length > 0) {
          console.log('准备保存阶梯配置:', formData.performanceTiers);
          
          for (const tier of formData.performanceTiers) {
            const tierData = {
              team_performance_config_id: performanceConfig.id,
              tier_name: tier.tier_name || `阶梯${formData.performanceTiers.indexOf(tier) + 1}`,
              min_value: tier.min_value,
              max_value: tier.max_value,
              rate: tier.rate,
            };
            
            console.log('保存阶梯:', tierData);
            await teamAPI.createPerformanceTier(tierData);
          }
          
          console.log('所有阶梯配置保存完成');
        }
      } else {
        console.log('绩效配置未启用，跳过保存');
      }
      
      // 添加项目成员
      for (const memberId of formData.memberIds) {
        await teamAPI.addTeamMember(newTeam.id, memberId);
      }

      setIsAddDialogOpen(false);
      resetForm();
      loadData();
      setError(null);
      toast({
        title: '项目创建成功',
        description: `项目 "${formData.name}" 已成功创建`,
        duration: 2000,
      });
    } catch (err) {
      console.error('创建项目失败:', err);
      toast({
        title: '创建项目失败',
        description: '创建项目失败，请重试',
        variant: 'destructive',
      });
    }
  };

  // 编辑项目
  const editTeam = async (team: Team) => {
    setSelectedTeam(team);
    
    // 加载现有的绩效配置
    let performanceConfig = null;
    let performanceTiers: PerformanceTier[] = [];
    let performanceIsActive = false;
    let performanceCalculationType: 'fixed' | 'tiered' = 'fixed';
    let performanceFixedRate = '';

    try {
      performanceConfig = await teamAPI.getTeamPerformanceConfig(team.id);
      if (performanceConfig) {
        performanceIsActive = performanceConfig.is_active;
        performanceCalculationType = performanceConfig.calculation_type;
        performanceFixedRate = performanceConfig.fixed_rate ? performanceConfig.fixed_rate.toString() : '';
        
        // 如果是阶梯式，加载阶梯配置
        if (performanceCalculationType === 'tiered') {
          performanceTiers = await teamAPI.getPerformanceTiers(performanceConfig.id) || [];
        }
      }
    } catch (err) {
      console.log('未找到绩效配置，使用默认值');
    }

    setEditFormData({
      name: team.name,
      code: team.code || '',
      leaderId: team.leader_id || 'none',
      description: team.description || '',
      teamType: team.team_type || 'functional',
      memberIds: team.team_members?.map(m => m.user_id) || [],
      establishedDate: team.established_date ? new Date(team.established_date).toISOString().split('T')[0] : '',
      objectives: team.objectives || '',
      location: team.location || '',
      email: team.contact_email || '',
      phone: team.contact_phone || '',
      status: team.status,
      performanceCalculationType,
      performanceFixedRate,
      performanceTiers,
      performanceIsActive,
    });
    
    setIsEditDialogOpen(true);
  };

  // 更新团队
  const updateTeam = async () => {
    try {
      if (!selectedTeam) return;

              if (!editFormData.name.trim()) {
          toast({
            title: '请输入项目名称',
            description: '请输入项目名称',
            variant: 'destructive',
          });
          return;
        }
              if (!editFormData.code.trim()) {
          toast({
            title: '请输入项目编码',
            description: '请输入项目编码',
            variant: 'destructive',
          });
          return;
        }
              if (editFormData.leaderId === 'none') {
          toast({
            title: '请选择项目负责人',
            description: '请选择项目负责人',
            variant: 'destructive',
          });
          return;
        }

      // 检查编码是否重复（排除当前项目）
      if (teamList.some(team => team.id !== selectedTeam.id && team.code === editFormData.code.trim())) {
        toast({
          title: '项目编码已存在',
          description: '项目编码已存在',
          variant: 'destructive',
        });
        return;
      }

      const teamData = {
        name: editFormData.name.trim(),
        code: editFormData.code.trim(),
        leader_id: editFormData.leaderId,
        description: editFormData.description.trim(),
        team_type: editFormData.teamType as 'project' | 'functional' | 'cross_functional',
        established_date: editFormData.establishedDate || undefined,
        status: editFormData.status,
        objectives: editFormData.objectives.trim(),
        location: editFormData.location.trim(),
        contact_email: editFormData.email.trim(),
        contact_phone: editFormData.phone.trim(),
      };

      await teamAPI.update(selectedTeam.id, teamData);

      // 更新绩效配置
      if (editFormData.performanceIsActive) {
        console.log('更新绩效配置:', {
          calculation_type: editFormData.performanceCalculationType,
          fixed_rate: editFormData.performanceFixedRate,
          tiers: editFormData.performanceTiers
        });

        // 检查是否已有绩效配置
        let existingConfig;
        try {
          existingConfig = await teamAPI.getTeamPerformanceConfig(selectedTeam.id);
        } catch (err) {
          console.log('未找到现有绩效配置，将创建新的');
        }

        const performanceConfigData = {
          team_id: selectedTeam.id,
          calculation_type: editFormData.performanceCalculationType,
          fixed_rate: editFormData.performanceCalculationType === 'fixed' && editFormData.performanceFixedRate ? 
            parseFloat(editFormData.performanceFixedRate) : undefined,
          is_active: true,
        };

        let performanceConfig;
        if (existingConfig) {
          // 更新现有配置
          performanceConfig = await teamAPI.updateTeamPerformanceConfig(existingConfig.id, performanceConfigData);
          
          // 删除现有阶梯配置
          await teamAPI.deletePerformanceTiersByConfig(existingConfig.id);
        } else {
          // 创建新配置
          performanceConfig = await teamAPI.createTeamPerformanceConfig(performanceConfigData);
        }

        console.log('绩效配置保存成功:', performanceConfig);
        
        // 如果是阶梯式，保存阶梯配置
        if (editFormData.performanceCalculationType === 'tiered' && editFormData.performanceTiers.length > 0) {
          console.log('保存阶梯配置:', editFormData.performanceTiers);
          
          for (const tier of editFormData.performanceTiers) {
            const tierData = {
              team_performance_config_id: performanceConfig.id,
              tier_name: tier.tier_name || `阶梯${editFormData.performanceTiers.indexOf(tier) + 1}`,
              min_value: tier.min_value,
              max_value: tier.max_value,
              rate: tier.rate,
            };
            
            await teamAPI.createPerformanceTier(tierData);
          }
          
          console.log('阶梯配置保存完成');
        }
      } else {
        console.log('绩效配置未启用，删除现有配置');
        
        // 如果禁用绩效配置，删除现有配置
        try {
          const existingConfig = await teamAPI.getTeamPerformanceConfig(selectedTeam.id);
          if (existingConfig) {
            await teamAPI.deleteTeamPerformanceConfig(existingConfig.id);
          }
        } catch (err) {
          console.log('未找到现有绩效配置，无需删除');
        }
      }

              // 更新项目成员 - 先删除现有成员，再添加新成员
      const currentMembers = await teamAPI.getTeamMembers(selectedTeam.id);
      for (const member of currentMembers) {
        await teamAPI.removeTeamMember(selectedTeam.id, member.user_id);
      }

      for (const memberId of editFormData.memberIds) {
        await teamAPI.addTeamMember(selectedTeam.id, memberId);
      }

      setIsEditDialogOpen(false);
      resetEditForm();
      setSelectedTeam(null);
      loadData();
      setError(null);
      toast({
        title: '项目更新成功',
        description: `项目 "${editFormData.name}" 已成功更新`,
        duration: 2000,
      });
    } catch (err) {
      console.error('更新项目失败:', err);
      toast({
        title: '更新项目失败',
        description: '更新项目失败，请重试',
        variant: 'destructive',
      });
    }
  };

  // 删除项目
  const deleteTeam = async (teamId: string) => {
    try {
      await teamAPI.delete(teamId);
      loadData();
      setError(null);
      toast({
        title: '项目删除成功',
        description: '项目已成功删除',
        duration: 2000,
      });
    } catch (err) {
      console.error('删除项目失败:', err);
      toast({
        title: '删除项目失败',
        description: '删除项目失败，请重试',
        variant: 'destructive',
      });
    }
  };

  // 处理成员选择
  const handleMemberToggle = (userId: string, isEdit = false) => {
    const currentFormData = isEdit ? editFormData : formData;
    const setCurrentFormData = isEdit ? setEditFormData : setFormData;

    const memberIds = currentFormData.memberIds.includes(userId)
      ? currentFormData.memberIds.filter(id => id !== userId)
      : [...currentFormData.memberIds, userId];

    setCurrentFormData({
      ...currentFormData,
      memberIds
    });
  };

  // 添加绩效阶梯
  const addTier = (isEdit = false) => {
    const currentFormData = isEdit ? editFormData : formData;
    const setCurrentFormData = isEdit ? setEditFormData : setFormData;

    const newTier: PerformanceTier = {
      id: `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      team_performance_config_id: '',
      tier_name: `阶梯${currentFormData.performanceTiers.length + 1}`,
      min_value: 0,
      max_value: 100,
      rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCurrentFormData({
      ...currentFormData,
      performanceTiers: [...currentFormData.performanceTiers, newTier]
    });
  };

  // 移除绩效阶梯
  const removeTier = (tierId: string, isEdit = false) => {
    const currentFormData = isEdit ? editFormData : formData;
    const setCurrentFormData = isEdit ? setEditFormData : setFormData;

    setCurrentFormData({
      ...currentFormData,
      performanceTiers: currentFormData.performanceTiers.filter(tier => tier.id !== tierId)
    });
  };

  // 更新绩效阶梯
  const updateTier = (tierId: string, field: keyof PerformanceTier, value: number, isEdit = false) => {
    const currentFormData = isEdit ? editFormData : formData;
    const setCurrentFormData = isEdit ? setEditFormData : setFormData;
    
    // 直接更新特定的阶梯，避免重新创建整个数组
    const updatedTiers = currentFormData.performanceTiers.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    );
    
    // 只有当值确实改变时才更新状态
    const currentTier = currentFormData.performanceTiers.find(t => t.id === tierId);
    if (currentTier && currentTier[field] !== value) {
      setCurrentFormData(prev => ({ ...prev, performanceTiers: updatedTiers }));
    }
  };

  // 优化的输入处理函数
  const handleTierInputChange = (tierId: string, field: keyof PerformanceTier, isEdit = false) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      updateTier(tierId, field, value, isEdit);
    };
  };

  // 获取项目绩效配置描述
  const getTeamPerformanceText = (team: Team): string => {
    const config = performanceConfigs.get(team.id);
    
    if (!config) {
      return '绩效配置待完善';
    }
    
    if (!config.is_active) {
      return '绩效配置已禁用';
    }
    
    if (config.calculation_type === 'fixed') {
      return `固定单价：${config.fixed_rate || 0}元/公里`;
    } else if (config.calculation_type === 'tiered') {
      return `阶梯计费：${config.tiers?.length || 0}个阶梯`;
    }
    
    return '绩效配置待完善';
  };

  // 获取项目分摊配置描述
  const getTeamAllocationText = (team: Team): string => {
    // 从数据库中获取分摊配置信息
    const config = allocationConfigs.find(config => config.team_id === team.id);
    
    if (!config) {
      return '分摊配置待完善';
    }
    
    if (!config.is_enabled) {
      return '分摊配置已禁用';
    }
    
    return `分摊比例：${config.allocation_ratio.toFixed(2)}%`;
  };

  // 处理分摊配置
  const handleAllocationConfig = async () => {
    try {
      // 加载现有的分摊配置
      const existingConfigs = await teamAPI.getAllTeamAllocationConfigs();
      
      // 为每个项目创建或更新分摊配置
      const configs = teamList.map(team => {
        const existingConfig = existingConfigs.find(config => config.team_id === team.id);
        
        if (existingConfig) {
          return existingConfig;
        } else {
          // 创建新的分摊配置
          return {
            id: `temp_${team.id}`,
            team_id: team.id,
            allocation_ratio: 0,
            is_enabled: false,
            description: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            team: team
          } as TeamAllocationConfig;
        }
      });
      
      setAllocationConfigs(configs);
      setIsAllocationDialogOpen(true);
    } catch (err) {
      console.error('加载分摊配置失败:', err);
      setError('加载分摊配置失败，请重试');
    }
  };

  // 更新分摊配置
  const updateAllocationConfig = (teamId: string, field: keyof TeamAllocationConfig, value: any) => {
    const updatedConfigs = allocationConfigs.map(config => {
      if (config.team_id === teamId) {
        return { ...config, [field]: value };
      }
      return config;
    });
    
    // 如果没有找到对应的配置，创建一个新的配置
    if (!updatedConfigs.find(config => config.team_id === teamId)) {
      const team = teamList.find(t => t.id === teamId);
      if (team) {
        const newConfig = {
          id: `temp_${teamId}`,
          team_id: teamId,
          allocation_ratio: field === 'allocation_ratio' ? value : 0,
          is_enabled: field === 'is_enabled' ? value : false,
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team: team
        } as TeamAllocationConfig;
        updatedConfigs.push(newConfig);
      }
    }
    
    setAllocationConfigs(updatedConfigs);
  };

  // 保存分摊配置
  const saveAllocationConfig = async () => {
    try {
      const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
      const totalRatio = enabledConfigs.reduce((sum, config) => sum + config.allocation_ratio, 0);
      
      if (Math.abs(totalRatio - 100) > 0.01) {
        setError(`分摊比例总和必须为100%，当前为${totalRatio.toFixed(2)}%`);
        return;
      }
      
      // 保存或更新分摊配置
      for (const config of allocationConfigs) {
        try {
          if (config.id.startsWith('temp_')) {
            // 创建新的分摊配置
            const newConfig = {
              team_id: config.team_id,
              allocation_ratio: config.allocation_ratio,
              is_enabled: config.is_enabled,
              description: config.description || ''
            };
            await teamAPI.createTeamAllocationConfig(newConfig);
          } else {
            // 更新现有的分摊配置
            await teamAPI.updateTeamAllocationConfig(config.id, {
              allocation_ratio: config.allocation_ratio,
              is_enabled: config.is_enabled,
              description: config.description || ''
            });
          }
        } catch (err) {
          console.error(`保存项目 ${config.team_id} 的分摊配置失败:`, err);
        }
      }
      
      setIsAllocationDialogOpen(false);
      setError(null);
      
      // 可选：重新加载数据以确保同步
      await loadData();
    } catch (err) {
      console.error('保存分摊配置失败:', err);
      setError('保存分摊配置失败，请重试');
    }
  };

  // 获取分摊配置验证
  const getAllocationValidation = () => {
    const totalRatio = allocationConfigs
      .filter(config => config.is_enabled)
      .reduce((sum, config) => sum + config.allocation_ratio, 0);
    
    return {
      isValid: Math.abs(totalRatio - 100) < 0.01,
      totalRatio,
      message: totalRatio === 100 ? '分摊比例正确' : `分摊比例总计：${totalRatio.toFixed(2)}%，需要等于100%`
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadData}>重试</Button>
        </div>
      </div>
    );
  }

  // 绩效配置表单组件
  const PerformanceConfigForm = ({ isEdit = false }) => {
    const data = isEdit ? editFormData : formData;
    const setData = isEdit ? setEditFormData : setFormData;

    return (
      <div className="space-y-4">
        {/* 计算方式选择 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">计算方式</Label>
          <RadioGroup
            value={data.performanceCalculationType}
            onValueChange={(value: 'fixed' | 'tiered') => 
              setData(prev => ({ ...prev, performanceCalculationType: value }))
            }
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id={`fixed-${isEdit ? 'edit' : 'add'}`} />
              <Label htmlFor={`fixed-${isEdit ? 'edit' : 'add'}`} className="cursor-pointer">固定值</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tiered" id={`tiered-${isEdit ? 'edit' : 'add'}`} />
              <Label htmlFor={`tiered-${isEdit ? 'edit' : 'add'}`} className="cursor-pointer">阶梯计算</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 固定值配置 */}
        {data.performanceCalculationType === 'fixed' && (
          <div className="space-y-3">
            <Label htmlFor={`fixedRate-${isEdit ? 'edit' : 'add'}`} className="text-base font-medium">固定单价</Label>
            <div className="flex items-center space-x-2">
              <Input
                id={`fixedRate-${isEdit ? 'edit' : 'add'}`}
                type="number"
                step="0.01"
                min="0"
                value={data.performanceFixedRate}
                onChange={(e) => setData(prev => ({ ...prev, performanceFixedRate: e.target.value }))}
                placeholder="请输入单价"
                className="w-40"
              />
              <span className="text-sm text-muted-foreground">元/公里</span>
            </div>
            <p className="text-sm text-muted-foreground">
              设置固定的绩效单价，项目所有成员按实际公里数计算绩效
            </p>
          </div>
        )}

        {/* 阶梯计算配置 */}
        {data.performanceCalculationType === 'tiered' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">阶梯明细</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTier(isEdit)}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加阶梯
              </Button>
            </div>

            {data.performanceTiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>暂无阶梯明细，请点击"添加阶梯"按钮添加</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.performanceTiers.map((tier, index) => (
                  <div key={tier.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm whitespace-nowrap">距离范围:</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={tier.min_value}
                        onChange={handleTierInputChange(tier.id, 'min_value', isEdit)}
                        placeholder="最小"
                        className="w-20"
                      />
                      <span className="text-sm">-</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={tier.max_value}
                        onChange={handleTierInputChange(tier.id, 'max_value', isEdit)}
                        placeholder="最大"
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">公里</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm whitespace-nowrap">费率:</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tier.rate}
                        onChange={handleTierInputChange(tier.id, 'rate', isEdit)}
                        placeholder="费率"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">元/公里</span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTier(tier.id, isEdit)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              设置不同距离范围对应的绩效金额，项目所有成员根据实际公里数匹配对应阶梯计算绩效
            </p>
          </div>
        )}

        {/* 启用状态 */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`isActive-${isEdit ? 'edit' : 'add'}`}
            checked={data.performanceIsActive}
            onChange={(e) => setData(prev => ({ ...prev, performanceIsActive: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor={`isActive-${isEdit ? 'edit' : 'add'}`} className="cursor-pointer">启用绩效配置</Label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">项目管理</h1>
          <p className="text-muted-foreground mt-2">管理公司各个项目的基本信息和绩效配置</p>
        </div>
        <div className="flex space-x-2">
          <PermissionGuard permission="ALLOCATION_CONFIG">
            <Button variant="outline" onClick={handleAllocationConfig}>
              <PieChart className="mr-2 h-4 w-4" />
              分摊配置
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="CREATE_TEAM">
            <StrictDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  新增项目
                </Button>
              </DialogTrigger>
            <StrictDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增项目</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="members">项目成员</TabsTrigger>
                  <TabsTrigger value="performance">绩效管理</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">项目名称 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入项目名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">项目编码 *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="请输入项目编码"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leader">项目负责人 *</Label>
                      <UserSelect
                        value={formData.leaderId === 'none' ? '' : formData.leaderId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, leaderId: value || 'none' }))}
                        placeholder="选择项目负责人"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamType">项目类型</Label>
                      <Select value={formData.teamType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, teamType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="functional">职能团队</SelectItem>
                          <SelectItem value="project">项目团队</SelectItem>
                          <SelectItem value="cross_functional">跨职能团队</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="establishedDate">成立日期</Label>
                      <Input
                        id="establishedDate"
                        type="date"
                        value={formData.establishedDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, establishedDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">项目状态</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">活跃</SelectItem>
                          <SelectItem value="inactive">暂停</SelectItem>
                          <SelectItem value="disbanded">解散</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                                          <Label htmlFor="description">项目描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请输入项目描述"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objectives">项目目标</Label>
                    <Textarea
                      id="objectives"
                      value={formData.objectives}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                                              placeholder="请输入项目目标"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">项目位置</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                              placeholder="请输入项目位置"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">联系邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="请输入联系邮箱"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">联系电话</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="请输入联系电话"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>项目成员</Label>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {users.map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`member-${user.id}`}
                              checked={formData.memberIds.includes(user.id)}
                              onChange={() => handleMemberToggle(user.id)}
                              className="rounded"
                            />
                            <label htmlFor={`member-${user.id}`} className="text-sm cursor-pointer">
                              {user.name} - {user.position || '未设置职位'}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">绩效管理配置</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      配置项目的绩效计算规则，项目内所有成员将使用相同的计算方式
                    </p>
                    <PerformanceConfigForm />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={addTeam}>
                  确定
                </Button>
              </div>
            </StrictDialogContent>
          </StrictDialog>
          </PermissionGuard>
        </div>
      </div>

      {/* 统计卡片 
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总项目数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamList.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃项目 {teamList.filter(t => t.status === 'active').length} 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">职能团队</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamList.filter(t => t.team_type === 'functional').length}
            </div>
            <p className="text-xs text-muted-foreground">
              占比 {((teamList.filter(t => t.team_type === 'functional').length / teamList.length) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">项目团队</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamList.filter(t => t.team_type === 'project').length}
            </div>
            <p className="text-xs text-muted-foreground">
              占比 {((teamList.filter(t => t.team_type === 'project').length / teamList.length) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均项目规模</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamList.length > 0 ? (teamList.reduce((sum, t) => sum + (t.team_members?.length || 0), 0) / teamList.length).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              人/项目
            </p>
          </CardContent>
        </Card>
      </div>*/}

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索项目名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">暂停</SelectItem>
                <SelectItem value="disbanded">解散</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="functional">职能团队</SelectItem>
                <SelectItem value="project">项目团队</SelectItem>
                <SelectItem value="cross_functional">跨职能团队</SelectItem>
              </SelectContent>
            </Select>
          </div>

                      {/* 项目表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目信息</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>成员数量</TableHead>
                  <TableHead>绩效配置</TableHead>
                  <TableHead>分摊配置</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>成立日期</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-muted-foreground">{team.code}</div>
                        {team.description && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.leader?.name || '未设置'}</div>
                        <div className="text-sm text-muted-foreground">{team.leader?.position || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${teamTypeMap[team.team_type || 'functional'].color} text-white`}>
                        {teamTypeMap[team.team_type || 'functional'].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {team.team_members?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {getTeamPerformanceText(team)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PieChart className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {getTeamAllocationText(team)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusMap[team.status].color} text-white`}>
                        {statusMap[team.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {team.established_date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {team.contact_email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate max-w-32">{team.contact_email}</span>
                          </div>
                        )}
                        {team.contact_phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {team.contact_phone}
                          </div>
                        )}
                        {team.location && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate max-w-32">{team.location}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <PermissionGuard permission="EDIT_TEAM">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await editTeam(team);
                              } catch (err) {
                                console.error('编辑项目失败:', err);
                                setError('加载项目信息失败，请重试');
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="DELETE_TEAM">
                          <DeleteButton
                            onConfirm={() => deleteTeam(team.id)}
                            itemName={team.name}
                            variant="outline"
                            title="确认删除项目"
                            description="确定要删除这个项目吗？此操作不可恢复。"
                          />
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无项目数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑团队对话框 */}
      <StrictDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <StrictDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="members">项目成员</TabsTrigger>
              <TabsTrigger value="performance">绩效管理</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">项目名称 *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入项目名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">项目编码 *</Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="请输入项目编码"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-leader">项目负责人 *</Label>
                  <UserSelect
                    value={editFormData.leaderId === 'none' ? '' : editFormData.leaderId}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, leaderId: value || 'none' }))}
                    placeholder="选择项目负责人"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-teamType">项目类型</Label>
                  <Select value={editFormData.teamType} onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, teamType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">职能团队</SelectItem>
                      <SelectItem value="project">项目团队</SelectItem>
                      <SelectItem value="cross_functional">跨职能团队</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-establishedDate">成立日期</Label>
                  <Input
                    id="edit-establishedDate"
                    type="date"
                    value={editFormData.establishedDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, establishedDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">项目状态</Label>
                  <Select value={editFormData.status} onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">活跃</SelectItem>
                      <SelectItem value="inactive">暂停</SelectItem>
                      <SelectItem value="disbanded">解散</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">项目描述</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入项目描述"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-objectives">项目目标</Label>
                <Textarea
                  id="edit-objectives"
                  value={editFormData.objectives}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, objectives: e.target.value }))}
                  placeholder="请输入项目目标"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">项目位置</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入项目位置"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">联系邮箱</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="请输入联系邮箱"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">联系电话</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>项目成员</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-member-${user.id}`}
                          checked={editFormData.memberIds.includes(user.id)}
                          onChange={() => handleMemberToggle(user.id, true)}
                          className="rounded"
                        />
                        <label htmlFor={`edit-member-${user.id}`} className="text-sm cursor-pointer">
                          {user.name} - {user.position || '未设置职位'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">绩效管理配置</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  配置项目的绩效计算规则，项目内所有成员将使用相同的计算方式
                </p>
                <PerformanceConfigForm isEdit={true} />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={updateTeam}>
              更新
            </Button>
          </div>
        </StrictDialogContent>
      </StrictDialog>

      {/* 分摊配置对话框 */}
      <StrictDialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <StrictDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-primary" />
              <span>项目分摊配置</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">配置说明</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 启用的项目将参与分摊计算</li>
                <li>• 输入分摊数字后，系统会自动计算各项目的分摊比例</li>
                <li>• 如果数字为0或空，可以直接输入比例</li>
                <li>• 保存时会校验总分摊比例必须为100%</li>
              </ul>
            </div>

            {/* 分摊配置验证状态 */}
            {(() => {
              const validation = getAllocationValidation();
              return (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                  validation.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {validation.isValid ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {validation.isValid 
                      ? `分摊比例配置正确，总计：${validation.totalRatio}%`
                      : `分摊比例配置错误，总计：${validation.totalRatio}%，需要调整为100%`
                    }
                  </span>
                </div>
              );
            })()}

            {/* 分摊配置表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目名称</TableHead>
                    <TableHead>是否启用</TableHead>
                    <TableHead>分摊比例</TableHead>
                    <TableHead>项目负责人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamList.map((team) => {
                    const config = allocationConfigs.find(c => c.team_id === team.id);
                    
                    // 如果没有找到配置，创建一个临时的默认配置
                    const currentConfig = config || {
                      id: `temp_${team.id}`,
                      team_id: team.id,
                      allocation_ratio: 0,
                      is_enabled: false,
                      description: '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      team: team
                    } as TeamAllocationConfig;

                    return (
                      <TableRow key={team.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-muted-foreground">{team.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={currentConfig.is_enabled}
                            onChange={(e) => updateAllocationConfig(team.id, 'is_enabled', e.target.checked)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={currentConfig.allocation_ratio}
                            onChange={(e) => updateAllocationConfig(team.id, 'allocation_ratio', parseFloat(e.target.value) || 0)}
                            placeholder="输入比例"
                            className="w-24"
                            disabled={!currentConfig.is_enabled}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{team.leader?.name || '未设置'}</div>
                            <div className="text-sm text-muted-foreground">{team.leader?.position || ''}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveAllocationConfig}>
              <Save className="mr-2 h-4 w-4" />
              保存配置
            </Button>
          </div>
        </StrictDialogContent>
      </StrictDialog>
    </div>
  );
};

export default TeamManagement;
