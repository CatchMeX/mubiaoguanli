import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { financialMatterAPI } from '../../services/financialMatterAPI';
import api from '../../services/api';
import workflowInstanceAPI from '../../services/workflowInstanceApi';

import { 
  FinancialMatter, 
  FinancialMatterFormData, 
  FinancialMatterAllocationFormData,
  FinancialMatterAttachment,
  Department,
  Team,
  User,
  TeamAllocationConfig,
  WorkflowInstance
} from '../../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useToast } from '../../hooks/use-toast';
import { DeleteButton } from '../../components/ui/delete-confirm-dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Eye,
  FileText,
  Users,
  Building2,
  Calculator,
  AlertCircle,
  X,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import FinancialMatterPDFExport from "@/components/FinancialMatterPDFExport";

// 新增状态组件
interface StatusWithProgressProps {
  entityType: string;
  entityId: string;
}

const StatusWithProgress: React.FC<StatusWithProgressProps> = ({ entityType, entityId }) => {
  const [workflowInstance, setWorkflowInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [taskProgress, setTaskProgress] = useState<any[]>([]);

  // 加载工作流实例
  useEffect(() => {
    const loadWorkflowInstance = async () => {
      try {
        setLoading(true);
        const instance = await api.workflow.getWorkflowInstanceByEntity(entityType, entityId);
        setWorkflowInstance(instance);
      } catch (error) {
        console.error('获取工作流状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (entityType && entityId) {
      loadWorkflowInstance();
    }
  }, [entityType, entityId]);

  // 获取简化的状态
  const getSimplifiedStatus = (status: string) => {
    switch (status) {
      case 'running':
        return { label: '审批中', variant: 'default' as const, icon: Clock };
      case 'completed':
        return { label: '已完成', variant: 'secondary' as const, icon: CheckCircle };
      case 'terminated':
        return { label: '已终止', variant: 'destructive' as const, icon: XCircle };
      default:
        return { label: '审批中', variant: 'default' as const, icon: Clock };
    }
  };

  // 查看任务进度
  const handleViewProgress = async () => {
    if (!workflowInstance) return;

    try {
      const details = await api.workflow.getWorkflowInstanceDetails(workflowInstance.id);
      setTaskProgress(details?.tasks || []);
      setIsProgressDialogOpen(true);
    } catch (error) {
      console.error('获取任务进度失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (!workflowInstance) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline">无工作流</Badge>
      </div>
    );
  }

  const statusConfig = getSimplifiedStatus(workflowInstance.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant={statusConfig.variant}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewProgress}
          className="h-6 px-2"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>

      {/* 审批进度弹框 */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审批进度</DialogTitle>
            <DialogDescription>
              查看当前审批流程的执行情况
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {taskProgress.length > 0 ? (
              <div className="space-y-4">
                {/* 按节点分组显示 */}
                {(() => {
                  // 按节点ID分组
                  const groupedByNode: any = {};
                  taskProgress.forEach((task: any) => {
                    const nodeId = task.node_id || 'unknown';
                    if (!groupedByNode[nodeId]) {
                      groupedByNode[nodeId] = [];
                    }
                    groupedByNode[nodeId].push(task);
                  });

                  return Object.entries(groupedByNode).map(([nodeId, tasks]: any, nodeIndex: any) => (
                    <div key={nodeId} className="border rounded-lg">
                      {/* 节点标题 */}
                      <div className="bg-muted px-4 py-2 border-b">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">审批节点 {nodeIndex + 1}</span>
                        </div>
                      </div>
                      
                      {/* 节点内的审批记录 */}
                      <div className="p-4 space-y-3">
                        {tasks.map((task: any, taskIndex: any) => (
                          <div key={task.id || taskIndex} className="border rounded p-3 bg-background">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">审批人</span>
                                <Badge variant={
                                  task.status === 'rejected' ? 'destructive' :
                                  task.status === 'skipped' ? 'outline' :
                                  task.status === 'completed' || task.status === 'approved' ? 'default' :
                                  'default'
                                } className={
                                  task.status === 'completed' || task.status === 'approved' ? 'bg-green-500 text-white hover:bg-green-600' : ''
                                }>
                                  {task.status === 'rejected' ? '已拒绝' :
                                   task.status === 'skipped' ? '跳过' :
                                   task.status === 'completed' || task.status === 'approved' ? '已通过' :
                                   '待处理'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {task.assigned_to && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground w-16">负责人:</span>
                                  <span className="text-sm">{task.assigned_to.name}</span>
                                </div>
                              )}
                              
                              {task.comments && (
                                <div className="flex items-start gap-2">
                                  <span className="text-sm font-medium text-muted-foreground w-16">审批意见:</span>
                                  <div className="text-sm bg-muted p-2 rounded flex-1">
                                    {task.comments}
                                  </div>
                                </div>
                              )}
                              
                              {task.completed_at && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground w-16">完成时间:</span>
                                  <span className="text-sm">{new Date(task.completed_at).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无审批进度信息
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const FinancialMatters: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 状态管理
  const [financialMatters, setFinancialMatters] = useState<FinancialMatter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<TeamAllocationConfig[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState<FinancialMatter | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<FinancialMatterFormData>({
    matter_description: '',
    amount: '',
    department_id: '',
    is_corporate_dimension: false,
    team_id: '',
    approval_workflow_id: '',
    allocations: [],
    attachments: []
  });
  
  // 分摊明细
  const [allocations, setAllocations] = useState<FinancialMatterAllocationFormData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<FinancialMatterAttachment[]>([]);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    status: '',
    department_id: '',
    search: ''
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        mattersResponse, 
        departmentsResponse, 
        teamsResponse, 
        usersResponse,
        allocationConfigsResponse,
        workflowInstancesResponse,
        workflowTemplatesResponse
      ] = await Promise.all([
        financialMatterAPI.getFinancialMatters(),
        api.department.getAll(),
        api.team.getAll(),
        api.user.getUsersWithDepartments(),
        api.team.getAllTeamAllocationConfigs(),
        api.workflow.getWorkflowInstances(),
        api.workflow.getWorkflowsWithDetails()
      ]);

      // 为每个财务事项获取工作流实例状态
      const mattersWithWorkflowStatus = await Promise.all(
        (mattersResponse || []).map(async (matter) => {
          try {
            const workflowInstance = await api.workflow.getWorkflowInstanceByEntity('financial_matters', matter.id);
            return {
              ...matter,
              workflowStatus: workflowInstance?.status || 'running'
            };
          } catch (error) {
            console.error(`获取财务事项 ${matter.id} 的工作流状态失败:`, error);
            return {
              ...matter,
              workflowStatus: 'running'
            };
          }
        })
      );

      setFinancialMatters(mattersWithWorkflowStatus);
      setDepartments(departmentsResponse || []);
      setTeams(teamsResponse || []);
      setUsers(usersResponse || []);
      setAllocationConfigs(allocationConfigsResponse || []);
      setWorkflowInstances(workflowInstancesResponse || []);
      setWorkflowTemplates(workflowTemplatesResponse || []);
      

      

    } catch (err) {
      setError('加载数据失败，请重试');
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 监听总商维度和金额变化，自动计算分摊
  useEffect(() => {
    if (formData.is_corporate_dimension && formData.amount) {
      const amount = Number(formData.amount);
      calculateAllocation(amount);
    } else if (!formData.is_corporate_dimension) {
      setAllocations([]);
    }
  }, [formData.is_corporate_dimension, formData.amount, allocationConfigs, teams]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      matter_description: '',
      amount: '',
      department_id: '',
      is_corporate_dimension: false,
      team_id: '',
      approval_workflow_id: '',
      allocations: [],
      attachments: []
    });
    setAllocations([]);
    setSelectedFiles([]);
  };

  // 创建财务事项
  const handleCreate = async () => {
    try {
      if (!formData.matter_description || !formData.amount || !formData.department_id) {
        toast({
          title: "验证失败",
          description: "请填写所有必填字段",
          variant: "destructive"
        });
        return;
      }

      // 验证分摊比例
      if (formData.is_corporate_dimension && allocations.length > 0) {
        if (!validateAllocationRatios()) {
          toast({
            title: "分摊比例错误",
            description: "分摊比例总和必须等于100%",
            variant: "destructive"
          });
          return;
        }
      }

      if (!user?.id) {
        toast({
          title: "错误",
          description: "用户信息获取失败",
          variant: "destructive"
        });
        return;
      }

      // 自动查找financial_matters的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId) {
        try {
          const financialMattersWorkflows = await api.workflow.getWorkflowsByFormType('financial_matters');
          if (financialMattersWorkflows && financialMattersWorkflows.length > 0) {
            // 取第一个激活的financial_matters工作流
            approvalWorkflowId = financialMattersWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找financial_matters审批流程失败:', workflowError);
        }
      }

      // 创建财务事项
      const matterData = {
        applicant_id: user.id,
        matter_description: formData.matter_description,
        amount: Number(formData.amount),
        department_id: formData.department_id,
        is_corporate_dimension: formData.is_corporate_dimension,
        team_id: formData.team_id || undefined,
        approval_workflow_id: approvalWorkflowId || undefined,
        status: 'pending', // 新增后直接设置为待审核状态
        created_by: user.id
      };

      const newMatter = await financialMatterAPI.createFinancialMatter(matterData);

      // 如果关联了审批流程，创建工作流实例
      if (approvalWorkflowId) {
        await workflowInstanceAPI.createWorkflowInstance({
          entity_type: "financial_matters",
          entity_id: newMatter.id,
          applicantId: user.id,
          approval_workflow_id: approvalWorkflowId,
          data: { ...matterData }
        });
      }

      // 如果是总商维度且有分摊明细，创建分摊记录
      if (formData.is_corporate_dimension && allocations.length > 0) {
        // 将百分比转换为小数格式（数据库期望 0-1 之间的小数）
        const allocationsForDB = allocations.map(allocation => ({
          ...allocation,
          allocation_ratio: allocation.allocation_ratio / 100
        }));
        await financialMatterAPI.createAllocations(newMatter.id, allocationsForDB);
      }

      // 上传附件
      if (selectedFiles.length > 0) {
        try {
          console.log('📤 开始上传附件，文件数量:', selectedFiles.length);
          for (const file of selectedFiles) {
            console.log('📤 上传文件:', file.name, '大小:', file.size);
            const attachment = await financialMatterAPI.uploadAttachment(newMatter.id, file, user.id);
            console.log('✅ 附件上传成功:', attachment);
          }
        } catch (uploadError: any) {
          console.error('❌ 附件上传失败:', uploadError);
          toast({
            title: "附件上传失败",
            description: `财务事项已创建，但附件上传失败: ${uploadError?.message || '未知错误'}`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "创建成功",
        description: "财务事项已成功创建"
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast({
        title: "创建失败",
        description: "创建财务事项时发生错误",
        variant: "destructive"
      });
      console.error('创建财务事项失败:', err);
    }
  };

  // 删除财务事项
  const handleDelete = async (id: string) => {
    try {
      await financialMatterAPI.deleteFinancialMatter(id);
      toast({
        title: "删除成功",
        description: "财务事项已成功删除"
      });
      loadData();
    } catch (err) {
      toast({
        title: "删除失败",
        description: "删除财务事项时发生错误",
        variant: "destructive"
      });
      console.error('删除财务事项失败:', err);
    }
  };

  // 查看财务事项详情
  const handleView = async (matter: FinancialMatter) => {
    setSelectedMatter(matter);
    setIsViewDialogOpen(true);
  };

  // 编辑财务事项
  const handleEdit = async (matter: FinancialMatter) => {
    setSelectedMatter(matter);
    setFormData({
      matter_description: matter.matter_description,
      amount: matter.amount.toString(),
      department_id: matter.department_id,
      is_corporate_dimension: matter.is_corporate_dimension,
      team_id: matter.team_id || '',
      approval_workflow_id: matter.approval_workflow_id || '',
      allocations: [],
      attachments: []
    });
    
    // 如果有分摊明细，加载到编辑表单
    if (matter.allocations && matter.allocations.length > 0) {
      const editAllocations = matter.allocations.map(allocation => ({
        team_id: allocation.team_id,
        allocation_ratio: allocation.allocation_ratio * 100, // 转换为百分比
        allocated_amount: allocation.allocated_amount,
        remark: allocation.remark || ''
      }));
      setAllocations(editAllocations);
    } else {
      setAllocations([]);
    }
    
    // 加载现有附件
    try {
      const attachments = await financialMatterAPI.getAttachments(matter.id);
      setExistingAttachments(attachments);
      console.log('📎 加载现有附件:', attachments);
    } catch (error) {
      console.error('❌ 加载附件失败:', error);
      setExistingAttachments([]);
    }
    
    setIsEditDialogOpen(true);
  };

  // 更新财务事项
  const handleUpdate = async () => {
    try {
      if (!formData.matter_description || !formData.amount || !formData.department_id) {
        toast({
          title: "验证失败",
          description: "请填写所有必填字段",
          variant: "destructive"
        });
        return;
      }

      // 验证分摊比例
      if (formData.is_corporate_dimension && allocations.length > 0) {
        if (!validateAllocationRatios()) {
          toast({
            title: "分摊比例错误",
            description: "分摊比例总和必须等于100%",
            variant: "destructive"
          });
          return;
        }
      }

      if (!user?.id || !selectedMatter) {
        toast({
          title: "错误",
          description: "用户信息或财务事项信息获取失败",
          variant: "destructive"
        });
        return;
      }

      // 自动查找financial_matters的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId) {
        try {
          const financialMattersWorkflows = await api.workflow.getWorkflowsByFormType('financial_matters');
          if (financialMattersWorkflows && financialMattersWorkflows.length > 0) {
            // 取第一个激活的financial_matters工作流
            approvalWorkflowId = financialMattersWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找financial_matters审批流程失败:', workflowError);
        }
      }

      // 更新财务事项
      const matterData = {
        matter_description: formData.matter_description,
        amount: Number(formData.amount),
        department_id: formData.department_id,
        is_corporate_dimension: formData.is_corporate_dimension,
        team_id: formData.team_id || undefined,
        approval_workflow_id: approvalWorkflowId || undefined,
        updated_by: user.id
      };

      await financialMatterAPI.updateFinancialMatter(selectedMatter.id, matterData);

      // 如果是总商维度且有分摊明细，更新分摊记录
      if (formData.is_corporate_dimension && allocations.length > 0) {
        // 先删除原有的分摊记录
        const existingAllocations = await financialMatterAPI.getAllocations(selectedMatter.id);
        for (const allocation of existingAllocations) {
          await financialMatterAPI.deleteAllocation(allocation.id);
        }
        
        // 创建新的分摊记录
        const allocationsForDB = allocations.map(allocation => ({
          ...allocation,
          allocation_ratio: allocation.allocation_ratio / 100
        }));
        await financialMatterAPI.createAllocations(selectedMatter.id, allocationsForDB);
      }

      // 上传新附件
      if (selectedFiles.length > 0) {
        try {
          console.log('📤 开始上传新附件，文件数量:', selectedFiles.length);
          for (const file of selectedFiles) {
            console.log('📤 上传文件:', file.name, '大小:', file.size);
            const attachment = await financialMatterAPI.uploadAttachment(selectedMatter.id, file, user.id);
            console.log('✅ 附件上传成功:', attachment);
          }
        } catch (uploadError: any) {
          console.error('❌ 附件上传失败:', uploadError);
          toast({
            title: "附件上传失败",
            description: `财务事项已更新，但附件上传失败: ${uploadError?.message || '未知错误'}`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "更新成功",
        description: "财务事项已成功更新"
      });

      setIsEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast({
        title: "更新失败",
        description: "更新财务事项时发生错误",
        variant: "destructive"
      });
      console.error('更新财务事项失败:', err);
    }
  };



  // 计算分摊明细（根据团队分摊配置自动带出）
  const calculateAllocation = (amount: number = 0) => {
    if (!formData.is_corporate_dimension) {
      setAllocations([]);
      return;
    }

    const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
    if (enabledConfigs.length === 0) {
      toast({
        title: '没有可用的分摊配置',
        description: '请先在项目管理中配置分摊比例',
        variant: 'destructive',
      });
      return;
    }

    const results = enabledConfigs.map(config => {
      const team = teams.find(t => t.id === config.team_id);
      return {
        team_id: config.team_id,
        allocation_ratio: config.allocation_ratio,
        allocated_amount: (amount * config.allocation_ratio) / 100,
        remark: ''
      };
    });

    setAllocations(results);
  };

  // 更新分摊明细
  const updateAllocation = (index: number, field: keyof FinancialMatterAllocationFormData, value: any) => {
    const updatedAllocations = [...allocations];
    updatedAllocations[index] = { ...updatedAllocations[index], [field]: value };
    
    // 自动计算分摊金额
    if (field === 'allocation_ratio' && formData.amount) {
      const amount = Number(formData.amount);
      updatedAllocations[index].allocated_amount = (amount * value) / 100;
    }
    
    setAllocations(updatedAllocations);
  };

  // 验证分摊比例总和
  const validateAllocationRatios = () => {
    const totalRatio = allocations.reduce((sum, allocation) => sum + allocation.allocation_ratio, 0);
    return Math.abs(totalRatio - 100) <= 0.01;
  };

  // 文件上传处理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('📁 文件选择事件触发，文件数量:', files.length);
    console.log('📁 选择的文件:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    setSelectedFiles([...selectedFiles, ...files]);
  };

  // 删除文件
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // 删除现有附件
  const removeExistingAttachment = async (attachmentId: string) => {
    try {
      await financialMatterAPI.deleteAttachment(attachmentId);
      setExistingAttachments(existingAttachments.filter(att => att.id !== attachmentId));
      toast({
        title: "删除成功",
        description: "附件已成功删除"
      });
    } catch (error) {
      console.error('❌ 删除附件失败:', error);
      toast({
        title: "删除失败",
        description: "删除附件时发生错误",
        variant: "destructive"
      });
    }
  };

  // 获取状态标签


  // 筛选数据
  const filteredMatters = financialMatters.filter(matter => {
    // 状态筛选 - 使用工作流实例状态
    if (filters.status && filters.status !== 'all') {
      if (matter.workflowStatus !== filters.status) return false;
    }
    if (filters.department_id && matter.department_id !== filters.department_id) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!(
        matter.matter_description.toLowerCase().includes(searchLower) ||
        matter.applicant?.name.toLowerCase().includes(searchLower) ||
        matter.department?.name.toLowerCase().includes(searchLower)
      )) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">财务事项管理</h1>
          <p className="text-muted-foreground mt-2">管理财务相关事项的申请、审批和分摊</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              新建财务事项
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新建财务事项</DialogTitle>
              <DialogDescription>
                填写财务事项的基本信息，包括申请人、事项描述、金额等
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本信息</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicant">申请人</Label>
                    <Input 
                      id="applicant" 
                      value={user?.name || ''} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">所属部门 *</Label>
                    <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label htmlFor="description">事项简述 *</Label>
                  <Textarea 
                    id="description"
                    value={formData.matter_description}
                    onChange={(e) => setFormData({...formData, matter_description: e.target.value})}
                    placeholder="例如：财务管理部申请5月份团建费用，共计4人，发生费用共计120.00元。（活动方案详见附件）"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">金额（元） *</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="请输入金额"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="corporate-dimension"
                      checked={formData.is_corporate_dimension}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData, 
                          is_corporate_dimension: checked,
                          team_id: checked ? "" : formData.team_id // 启用总商维度时清空费用归属团队
                        });
                        if (checked && formData.amount) {
                          calculateAllocation(Number(formData.amount));
                        } else if (!checked) {
                          setAllocations([]);
                        }
                      }}
                    />
                    <Label htmlFor="corporate-dimension">是否总商维度</Label>
                  </div>
                </div>

                {!formData.is_corporate_dimension && (
                  <div>
                    <Label htmlFor="team">费用归属项目</Label>
                    <Select value={formData.team_id} onValueChange={(value) => setFormData({...formData, team_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择项目" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="approval-workflow">关联审批流程</Label>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700 font-medium">自动关联</span>
                    </div>
                    <span className="text-xs text-blue-600">
                      系统将自动关联financial_matters审批流程
                    </span>
                  </div>
                </div>
              </div>

              {/* 分摊明细 */}
              {formData.is_corporate_dimension && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">分摊配置</h3>
                  </div>
                  <p className="text-sm text-blue-600">
                    可修改各项目的分摊比例,系统将自动计算分配金额
                  </p>
                  
                  {allocations.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-left">项目名称</TableHead>
                            <TableHead className="text-center">默认比例</TableHead>
                            <TableHead className="text-center">本次比例</TableHead>
                            <TableHead className="text-right">分配金额</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allocations.map((allocation, index) => {
                            const team = teams.find(t => t.id === allocation.team_id);
                            const defaultConfig = allocationConfigs.find(config => config.team_id === allocation.team_id);
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-blue-600 font-medium">
                                  {team?.name || '未知项目'}
                                </TableCell>
                                <TableCell className="text-center text-blue-600">
                                  {defaultConfig?.allocation_ratio || 0}%
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center">
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      value={allocation.allocation_ratio}
                                      onChange={(e) => updateAllocation(index, 'allocation_ratio', Number(e.target.value))}
                                      className="w-16 text-center"
                                    />
                                    <span className="text-xs text-muted-foreground">%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-medium">
                                  ¥{allocation.allocated_amount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      
                      <div className="flex justify-between items-center p-4 border-t">
                        <span className="text-sm text-muted-foreground">分摊比例总和:</span>
                        <span className="text-green-600 font-medium">
                          {allocations.reduce((sum, item) => sum + item.allocation_ratio, 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 附件上传 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">附件</h3>
                <div>
                  <Label htmlFor="attachments">上传附件</Label>
                  <Input 
                    id="attachments" 
                    type="file" 
                    multiple
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate}>
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>筛选条件</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <Input 
                id="search"
                placeholder="搜索事项描述、申请人、部门..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">状态</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="running">审批中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="terminated">已终止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department-filter">部门</Label>
              <Select value={filters.department_id} onValueChange={(value) => setFilters({...filters, department_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="全部部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">全部部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setFilters({status: '', department_id: '', search: ''})}>
                重置筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>财务事项列表</CardTitle>
          <CardDescription>
            共 {filteredMatters.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请人</TableHead>
                <TableHead>事项简述</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>总商维度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatters.map((matter) => (
                <TableRow key={matter.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{matter.applicant?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={matter.matter_description}>
                      {matter.matter_description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">¥{matter.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{matter.department?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {matter.is_corporate_dimension ? (
                      <Badge variant="default">是</Badge>
                    ) : (
                      <Badge variant="secondary">否</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusWithProgress 
                      entityType="financial_matters"
                      entityId={matter.id}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(matter.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleView(matter)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(matter)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <FinancialMatterPDFExport
                        matter={matter}
                        onExport={async () => {
                          try {
                            const [allocations, attachments, workflowInstance] = await Promise.all([
                              financialMatterAPI.getAllocations(matter.id),
                              financialMatterAPI.getAttachments(matter.id),
                              api.workflow.getWorkflowInstanceByEntity('financial_matters', matter.id)
                            ]);
                            
                            return {
                              allocations,
                              attachments,
                              workflowInstance: workflowInstance ? await api.workflow.getWorkflowInstanceDetails(workflowInstance.id) : undefined
                            };
                          } catch (error) {
                            console.error('获取PDF导出数据失败:', error);
                            return {
                              allocations: [],
                              attachments: [],
                              workflowInstance: undefined
                            };
                          }
                        }}
                      />
                      <DeleteButton
                        onConfirm={() => handleDelete(matter.id)}
                        itemName={`财务事项 - ${matter.matter_description}`}
                        title="删除财务事项"
                        description={`确定要删除"${matter.matter_description}"吗？删除后无法恢复。`}
                        variant="ghost"
                        size="sm"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>财务事项详情</DialogTitle>
          </DialogHeader>
          
          {selectedMatter && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>申请人</Label>
                    <p className="text-sm text-muted-foreground">{selectedMatter.applicant?.name}</p>
                  </div>
                  <div>
                    <Label>所属部门</Label>
                    <p className="text-sm text-muted-foreground">{selectedMatter.department?.name}</p>
                  </div>
                  <div>
                    <Label>金额</Label>
                    <p className="text-sm font-medium">¥{selectedMatter.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <div>
                      <StatusWithProgress 
                        entityType="financial_matters"
                        entityId={selectedMatter.id}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>事项简述</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedMatter.matter_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>是否总商维度</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedMatter.is_corporate_dimension ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <Label>费用归属项目</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedMatter.team?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <Label>关联审批流程</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedMatter.approval_workflow?.workflow?.name || '无'}
                    </p>
                  </div>
                  <div>
                    <Label>创建时间</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMatter.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 分摊明细 */}
              {selectedMatter.is_corporate_dimension && selectedMatter.allocations && selectedMatter.allocations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">分摊明细</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>项目</TableHead>
                        <TableHead>分摊比例</TableHead>
                        <TableHead>分摊金额</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMatter.allocations.map((allocation) => (
                        <TableRow key={allocation.id}>
                          <TableCell>{allocation.team?.name}</TableCell>
                          <TableCell>{(allocation.allocation_ratio * 100).toFixed(2)}%</TableCell>
                          <TableCell>¥{allocation.allocated_amount.toLocaleString()}</TableCell>
                          <TableCell>{allocation.remark || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* 附件 */}
              {selectedMatter.attachments && selectedMatter.attachments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">附件</h3>
                  <div className="space-y-2">
                    {selectedMatter.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment.file_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑财务事项对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑财务事项</DialogTitle>
            <DialogDescription>
              修改财务事项信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-matter-description">事项简述 *</Label>
                  <Textarea
                    id="edit-matter-description"
                    placeholder="请输入财务事项简述"
                    value={formData.matter_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, matter_description: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-amount">金额（元）*</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    placeholder="请输入金额"
                    value={formData.amount}
                    onChange={(e) => {
                      const amount = e.target.value;
                      setFormData(prev => ({ ...prev, amount }));
                      if (formData.is_corporate_dimension) {
                        calculateAllocation(Number(amount));
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-department">所属部门 *</Label>
                <Select value={formData.department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-corporate-dimension"
                  checked={formData.is_corporate_dimension}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      is_corporate_dimension: checked as boolean,
                      team_id: checked ? "" : prev.team_id // 启用总商维度时清空费用归属团队
                    }));
                    if (!checked) {
                      setAllocations([]);
                    } else if (formData.amount) {
                      calculateAllocation(Number(formData.amount));
                    }
                  }}
                />
                <Label htmlFor="edit-corporate-dimension">是否总商维度</Label>
              </div>

              {!formData.is_corporate_dimension && (
                <div>
                  <Label htmlFor="edit-team">费用归属项目</Label>
                  <Select value={formData.team_id || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, team_id: value === "none" ? "" : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="edit-approval-workflow">关联审批流程</Label>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700 font-medium">自动关联</span>
                  </div>
                  <span className="text-xs text-blue-600">
                    系统将自动关联financial_matters审批流程
                  </span>
                </div>
              </div>
            </div>

            {/* 分摊明细 */}
            {formData.is_corporate_dimension && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">分摊配置</h3>
                </div>
                <p className="text-sm text-blue-600">
                  可修改各项目的分摊比例,系统将自动计算分配金额
                </p>
                
                {allocations.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left">项目名称</TableHead>
                          <TableHead className="text-center">默认比例</TableHead>
                          <TableHead className="text-center">本次比例</TableHead>
                          <TableHead className="text-right">分配金额</TableHead>
                          <TableHead className="text-center">备注</TableHead>
                          <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((allocation, index) => {
                          const team = teams.find(t => t.id === allocation.team_id);
                          const defaultConfig = allocationConfigs.find(config => config.team_id === allocation.team_id);
                          return (
                            <TableRow key={index}>
                              <TableCell className="text-blue-600 font-medium">
                                {team?.name || '未知项目'}
                              </TableCell>
                              <TableCell className="text-center text-blue-600">
                                {defaultConfig?.allocation_ratio || 0}%
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={allocation.allocation_ratio}
                                    onChange={(e) => updateAllocation(index, 'allocation_ratio', Number(e.target.value))}
                                    className="w-16 text-center"
                                  />
                                  <span className="text-xs text-muted-foreground">%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                ¥{allocation.allocated_amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={allocation.remark}
                                  onChange={(e) => updateAllocation(index, 'remark', e.target.value)}
                                  placeholder="备注"
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAllocations(allocations.filter((_, i) => i !== index));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-between items-center p-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        分摊比例总和: {allocations.reduce((sum, allocation) => sum + allocation.allocation_ratio, 0).toFixed(2)}%
                        {!validateAllocationRatios() && (
                          <span className="text-red-500 ml-2">
                            (必须等于100%)
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => calculateAllocation(Number(formData.amount))}
                      >
                        重新计算
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    暂无分摊明细，点击"重新计算"按钮生成
                  </div>
                )}
              </div>
            )}

            {/* 附件上传 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">附件</h3>
              
              {/* 现有附件 */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <Label>现有附件</Label>
                  {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{attachment.file_name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const downloadUrl = await financialMatterAPI.getAttachmentDownloadUrl(attachment.file_path);
                              window.open(downloadUrl, '_blank');
                            } catch (error) {
                              console.error('下载失败:', error);
                              toast({
                                title: "下载失败",
                                description: "无法下载附件",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingAttachment(attachment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 上传新附件 */}
              <div>
                <Label htmlFor="edit-file-upload">上传新附件</Label>
                <Input
                  id="edit-file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  支持图片、PDF、Word、Excel等格式，单个文件最大10MB
                </p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>已选择的文件</Label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              取消
            </Button>
            <Button onClick={handleUpdate}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialMatters; 