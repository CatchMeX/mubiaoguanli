import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/hooks/usePermissions";
import api from "@/services/api";
import { ExpenseReimbursementAPI } from "@/services/expenseReimbursementAPI";
import workflowInstanceAPI from "@/services/workflowInstanceApi";

import type {
  ExpenseReimbursement,
  ExpenseReimbursementAllocation,
  ExpenseReimbursementAttachment,
  ExpenseReimbursementFormData,
  ExpenseReimbursementAllocationFormData,
  User,
  Team,
  Department,
  WorkflowInstance
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DeleteButton } from "@/components/ui/delete-confirm-dialog";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  Download,
  AlertCircle,
  Calculator,
  Users,
  Building2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import ExpenseReimbursementPDFExport from "@/components/ExpenseReimbursementPDFExport";

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

const expenseReimbursementAPI = new ExpenseReimbursementAPI();

const ExpenseReimbursement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseReimbursements, setExpenseReimbursements] = useState<
    ExpenseReimbursement[]
  >([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<any[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<any[]>([]);

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] =
    useState<ExpenseReimbursement | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<ExpenseReimbursementFormData>({
    expense_reason: "",
    expense_category: "expense_reimbursement",
    total_amount: "",
    department_id: "",
    is_corporate_dimension: false,
    team_id: "",
    approval_workflow_id: "",
    allocations: [],
    attachments: []
  });

  // 分摊数据
  const [allocations, setAllocations] = useState<
    ExpenseReimbursementAllocationFormData[]
  >([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExpenseReimbursementAttachment[]
  >([]);

  // 筛选条件
  const [filters, setFilters] = useState({
    status: "all",
    department_id: "all",
    expense_category: "all",
    applicant_id: "all",
    search: ""
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        reimbursementsData,
        departmentsData,
        teamsData,
        usersData,
        workflowsData,
        allocationConfigsData
      ] = await Promise.all([
        expenseReimbursementAPI.getExpenseReimbursements(),
        api.department.getAll(),
        api.team.getAll(),
        api.user.getAll(),
        api.workflow.getWorkflowsWithDetails(),
        api.team.getAllTeamAllocationConfigs()
      ]);

      // 为每个费用报销获取工作流实例状态
      const reimbursementsWithWorkflowStatus = await Promise.all(
        (reimbursementsData || []).map(async (reimbursement) => {
          try {
            const workflowInstance = await api.workflow.getWorkflowInstanceByEntity('expense_reimbursements', reimbursement.id);
            return {
              ...reimbursement,
              workflowStatus: workflowInstance?.status || 'running'
            };
          } catch (error) {
            console.error(`获取费用报销 ${reimbursement.id} 的工作流状态失败:`, error);
            return {
              ...reimbursement,
              workflowStatus: 'running'
            };
          }
        })
      );

      setExpenseReimbursements(reimbursementsWithWorkflowStatus);
      setDepartments(departmentsData);
      setTeams(teamsData);
      setUsers(usersData);
      setWorkflowInstances(workflowsData);
      setAllocationConfigs(allocationConfigsData);

      console.log("📊 数据加载完成:", {
        reimbursementsCount: reimbursementsData.length,
        departmentsCount: departmentsData.length,
        teamsCount: teamsData.length,
        usersCount: usersData.length,
        workflowsCount: workflowsData.length,
        allocationConfigsCount: allocationConfigsData.length,
        allocationConfigs: allocationConfigsData,
        enabledConfigs: allocationConfigsData.filter(
          (config) => config.is_enabled
        )
      });

      // 检查分摊配置数据结构
      if (allocationConfigsData && allocationConfigsData.length > 0) {
        console.log("🔍 分摊配置数据结构检查:", {
          firstConfig: allocationConfigsData[0],
          fields: Object.keys(allocationConfigsData[0]),
          is_enabled_field: allocationConfigsData[0].is_enabled,
          allocation_ratio_field: allocationConfigsData[0].allocation_ratio,
          team_id_field: allocationConfigsData[0].team_id
        });
      }
    } catch (err) {
      setError("加载数据失败");
      console.error("加载数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 重置表单
  const resetForm = () => {
    setFormData({
      expense_reason: "",
      expense_category: "expense_reimbursement",
      total_amount: "",
      department_id: "",
      is_corporate_dimension: false,
      team_id: "",
      approval_workflow_id: "",
      allocations: [],
      attachments: []
    });
    setAllocations([]);
    setSelectedFiles([]);
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "待审批", variant: "default" as const },
      approved: { label: "已通过", variant: "default" as const },
      rejected: { label: "已拒绝", variant: "destructive" as const },
      completed: { label: "已完成", variant: "default" as const }
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 筛选数据
  const filteredReimbursements = expenseReimbursements.filter(
    (reimbursement) => {
      // 状态筛选 - 使用工作流实例状态
      if (
        filters.status &&
        filters.status !== "all" &&
        reimbursement.workflowStatus !== filters.status
      )
        return false;
      if (
        filters.department_id &&
        filters.department_id !== "all" &&
        reimbursement.department_id !== filters.department_id
      )
        return false;
      if (
        filters.expense_category &&
        filters.expense_category !== "all" &&
        reimbursement.expense_category !== filters.expense_category
      )
        return false;
      if (
        filters.applicant_id &&
        filters.applicant_id !== "all" &&
        reimbursement.applicant_id !== filters.applicant_id
      )
        return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          reimbursement.request_number.toLowerCase().includes(searchLower) ||
          reimbursement.expense_reason.toLowerCase().includes(searchLower) ||
          (reimbursement.applicant?.name &&
            reimbursement.applicant.name.toLowerCase().includes(searchLower))
        );
      }
      return true;
    }
  );

  // 创建申请单
  const handleCreate = async () => {
    try {
      if (
        !formData.expense_reason ||
        !formData.total_amount ||
        !formData.department_id
      ) {
        toast({
          title: "验证失败",
          description: "请填写所有必填字段",
          variant: "destructive"
        });
        return;
      }

      // 验证分摊比例总和
      if (formData.is_corporate_dimension && allocations.length > 0) {
        const totalRatio = allocations.reduce(
          (sum, allocation) => sum + allocation.allocation_ratio,
          0
        );
        if (Math.abs(totalRatio - 100) > 0.01) {
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

      // 自动查找expense_reimbursements的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId) {
        try {
          const expenseReimbursementsWorkflows = await api.workflow.getWorkflowsByFormType('expense_reimbursements');
          if (expenseReimbursementsWorkflows && expenseReimbursementsWorkflows.length > 0) {
            // 取第一个激活的expense_reimbursements工作流
            approvalWorkflowId = expenseReimbursementsWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找expense_reimbursements审批流程失败:', workflowError);
        }
      }

      // 创建申请单
      const reimbursementData = {
        expense_reason: formData.expense_reason,
        expense_category: formData.expense_category,
        total_amount: Number(formData.total_amount),
        department_id: formData.department_id,
        is_corporate_dimension: formData.is_corporate_dimension,
        team_id: formData.team_id || undefined,
        approval_workflow_id: approvalWorkflowId || undefined,
        applicant_id: user.id,
        created_by: user.id
      };

      const newReimbursement =
        await expenseReimbursementAPI.createExpenseReimbursement(
          reimbursementData
        );
      
      if (approvalWorkflowId) {
        await workflowInstanceAPI.createWorkflowInstance({
          entity_type: "expense_reimbursements",
          entity_id: newReimbursement.id,
          applicantId: user.id,
          approval_workflow_id: approvalWorkflowId,
          data: { ...reimbursementData }
        });
      }

      // 创建分摊记录
      if (formData.is_corporate_dimension && allocations.length > 0) {
        const allocationData = allocations.map((allocation) => ({
          team_id: allocation.team_id,
          allocation_ratio: allocation.allocation_ratio / 100, // 转换为小数
          allocation_amount:
            (Number(formData.total_amount) * allocation.allocation_ratio) / 100
        }));
        await expenseReimbursementAPI.createAllocations(
          newReimbursement.id,
          allocationData
        );
      }

      // 上传附件
      if (selectedFiles.length > 0) {
        try {
          console.log("📤 开始上传附件，文件数量:", selectedFiles.length);
          for (const file of selectedFiles) {
            console.log("📤 上传文件:", file.name, "大小:", file.size);
            const attachment = await expenseReimbursementAPI.uploadAttachment(
              newReimbursement.id,
              file,
              user.id
            );
            console.log("✅ 附件上传成功:", attachment);
          }
        } catch (uploadError: any) {
          console.error("❌ 附件上传失败:", uploadError);
          toast({
            title: "附件上传失败",
            description: `申请单已创建，但附件上传失败: ${
              uploadError?.message || "未知错误"
            }`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "创建成功",
        description: "申请单已成功创建"
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast({
        title: "创建失败",
        description: "创建申请单时发生错误",
        variant: "destructive"
      });
      console.error("创建申请单失败:", err);
    }
  };

  // 删除申请单
  const handleDelete = async (id: string) => {
    try {
      await expenseReimbursementAPI.deleteExpenseReimbursement(id);
      toast({
        title: "删除成功",
        description: "申请单已成功删除"
      });
      loadData();
    } catch (err) {
      toast({
        title: "删除失败",
        description: "删除申请单时发生错误",
        variant: "destructive"
      });
      console.error("删除申请单失败:", err);
    }
  };

  // 查看申请单
  const handleView = async (reimbursement: ExpenseReimbursement) => {
    try {
      // 获取完整的申请单信息
      const fullReimbursement =
        await expenseReimbursementAPI.getExpenseReimbursementById(
          reimbursement.id
        );
      if (fullReimbursement) {
        // 获取分摊记录
        const allocations = await expenseReimbursementAPI.getAllocations(
          reimbursement.id
        );
        // 获取附件
        const attachments = await expenseReimbursementAPI.getAttachments(
          reimbursement.id
        );

        setSelectedReimbursement({
          ...fullReimbursement,
          allocations,
          attachments
        });
        setIsViewDialogOpen(true);
      }
    } catch (err) {
      toast({
        title: "获取详情失败",
        description: "获取申请单详情时发生错误",
        variant: "destructive"
      });
      console.error("获取申请单详情失败:", err);
    }
  };

  // 编辑申请单
  const handleEdit = async (reimbursement: ExpenseReimbursement) => {
    try {
      // 获取完整的申请单信息
      const fullReimbursement =
        await expenseReimbursementAPI.getExpenseReimbursementById(
          reimbursement.id
        );
      if (fullReimbursement) {
        // 获取分摊记录
        const allocations = await expenseReimbursementAPI.getAllocations(
          reimbursement.id
        );
        // 获取附件
        const attachments = await expenseReimbursementAPI.getAttachments(
          reimbursement.id
        );

        setSelectedReimbursement({
          ...fullReimbursement,
          allocations,
          attachments
        });

        // 填充表单数据
        setFormData({
          expense_reason: fullReimbursement.expense_reason,
          expense_category: fullReimbursement.expense_category,
          total_amount: fullReimbursement.total_amount.toString(),
          department_id: fullReimbursement.department_id || "",
          is_corporate_dimension: fullReimbursement.is_corporate_dimension,
          team_id: fullReimbursement.team_id || "",
          approval_workflow_id: fullReimbursement.approval_workflow_id || "",
          allocations: [],
          attachments: []
        });

        // 填充分摊数据
        setAllocations(
          allocations.map((allocation) => ({
            team_id: allocation.team_id,
            allocation_ratio: allocation.allocation_ratio * 100, // 转换为百分比
            allocation_amount: allocation.allocation_amount
          }))
        );

        setExistingAttachments(attachments || []);
        setIsEditDialogOpen(true);
      }
    } catch (err) {
      toast({
        title: "获取详情失败",
        description: "获取申请单详情时发生错误",
        variant: "destructive"
      });
      console.error("获取申请单详情失败:", err);
    }
  };

  // 更新申请单
  const handleUpdate = async () => {
    try {
      if (!selectedReimbursement?.id || !user?.id) {
        toast({
          title: "错误",
          description: "缺少必要信息",
          variant: "destructive"
        });
        return;
      }

      // 验证分摊比例总和
      if (formData.is_corporate_dimension && allocations.length > 0) {
        const totalRatio = allocations.reduce(
          (sum, allocation) => sum + allocation.allocation_ratio,
          0
        );
        if (Math.abs(totalRatio - 100) > 0.01) {
          toast({
            title: "分摊比例错误",
            description: "分摊比例总和必须等于100%",
            variant: "destructive"
          });
          return;
        }
      }

      // 自动查找expense_reimbursements的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId) {
        try {
          const expenseReimbursementsWorkflows = await api.workflow.getWorkflowsByFormType('expense_reimbursements');
          if (expenseReimbursementsWorkflows && expenseReimbursementsWorkflows.length > 0) {
            // 取第一个激活的expense_reimbursements工作流
            approvalWorkflowId = expenseReimbursementsWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找expense_reimbursements审批流程失败:', workflowError);
        }
      }

      // 更新申请单
      const updateData = {
        expense_reason: formData.expense_reason,
        expense_category: formData.expense_category,
        total_amount: Number(formData.total_amount),
        department_id: formData.department_id,
        is_corporate_dimension: formData.is_corporate_dimension,
        team_id: formData.team_id || undefined,
        approval_workflow_id: approvalWorkflowId || undefined,
        updated_by: user.id
      };

      await expenseReimbursementAPI.updateExpenseReimbursement(
        selectedReimbursement.id,
        updateData
      );

      // 删除旧的分摊记录并创建新的
      if (formData.is_corporate_dimension) {
        const existingAllocations =
          await expenseReimbursementAPI.getAllocations(
            selectedReimbursement.id
          );
        for (const allocation of existingAllocations) {
          await expenseReimbursementAPI.deleteAllocation(allocation.id);
        }

        if (allocations.length > 0) {
          const allocationData = allocations.map((allocation) => ({
            team_id: allocation.team_id,
            allocation_ratio: allocation.allocation_ratio / 100,
            allocation_amount:
              (Number(formData.total_amount) * allocation.allocation_ratio) /
              100
          }));
          await expenseReimbursementAPI.createAllocations(
            selectedReimbursement.id,
            allocationData
          );
        }
      }

      // 上传新附件
      if (selectedFiles.length > 0) {
        try {
          for (const file of selectedFiles) {
            await expenseReimbursementAPI.uploadAttachment(
              selectedReimbursement.id,
              file,
              user.id
            );
          }
        } catch (uploadError: any) {
          toast({
            title: "附件上传失败",
            description: `申请单已更新，但附件上传失败: ${
              uploadError?.message || "未知错误"
            }`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "更新成功",
        description: "申请单已成功更新"
      });

      setIsEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast({
        title: "更新失败",
        description: "更新申请单时发生错误",
        variant: "destructive"
      });
      console.error("更新申请单失败:", err);
    }
  };

  // 分摊相关函数
  const calculateAllocation = (amount: number = 0) => {
    if (!formData.is_corporate_dimension) {
      setAllocations([]);
      return;
    }

    console.log("🔍 分摊计算开始:", {
      is_corporate_dimension: formData.is_corporate_dimension,
      amount: amount,
      allocationConfigsCount: allocationConfigs.length,
      allocationConfigs: allocationConfigs,
      enabledConfigsCount: allocationConfigs.filter(
        (config) => config.is_enabled
      ).length,
      enabledConfigs: allocationConfigs.filter((config) => config.is_enabled)
    });

    const enabledConfigs = allocationConfigs.filter(
      (config) => config.is_enabled
    );
    if (enabledConfigs.length === 0) {
      toast({
        title: "没有可用的分摊配置",
        description: "请先在项目管理中配置分摊比例",
        variant: "destructive"
      });
      return;
    }

    const results = enabledConfigs.map((config) => {
      const team = teams.find((t) => t.id === config.team_id);
      console.log("📊 分摊配置:", {
        config: config,
        team: team,
        allocation_ratio: config.allocation_ratio
      });
      return {
        team_id: config.team_id,
        allocation_ratio: config.allocation_ratio,
        allocation_amount: (amount * config.allocation_ratio) / 100
      };
    });

    console.log("✅ 分摊计算结果:", results);
    setAllocations(results);
  };

  const updateAllocation = (
    index: number,
    field: keyof ExpenseReimbursementAllocationFormData,
    value: any
  ) => {
    const updatedAllocations = [...allocations];
    updatedAllocations[index] = {
      ...updatedAllocations[index],
      [field]: value
    };

    // 自动计算分摊金额
    if (field === "allocation_ratio" && formData.total_amount) {
      const amount = Number(formData.total_amount);
      updatedAllocations[index].allocation_amount = (amount * value) / 100;
    }

    setAllocations(updatedAllocations);
  };

  // 附件相关函数
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log(
      "📁 选择的文件:",
      files.map((f) => ({ name: f.name, size: f.size }))
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId: string) => {
    try {
      await expenseReimbursementAPI.deleteAttachment(attachmentId);
      setExistingAttachments((prev) =>
        prev.filter((att) => att.id !== attachmentId)
      );
      toast({
        title: "删除成功",
        description: "附件已成功删除"
      });
    } catch (err) {
      toast({
        title: "删除失败",
        description: "删除附件时发生错误",
        variant: "destructive"
      });
    }
  };

  // 监听分摊计算
  useEffect(() => {
    if (formData.is_corporate_dimension) {
      const amount = formData.total_amount ? Number(formData.total_amount) : 0;
      calculateAllocation(amount);
    } else {
      setAllocations([]);
    }
  }, [
    formData.is_corporate_dimension,
    formData.total_amount,
    allocationConfigs,
    teams
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">费用报销/冲销管理</h1>
          <p className="text-muted-foreground">
            管理费用报销申请单和冲销借款申请单
          </p>
        </div>
        <PermissionGuard permission="CREATE_EXPENSE">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建申请单
          </Button>
        </PermissionGuard>
      </div>



      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                placeholder="搜索申请单号、报销事由..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="status-filter">状态</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
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
              <Label htmlFor="category-filter">报销类别</Label>
              <Select
                value={filters.expense_category || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, expense_category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  <SelectItem value="expense_reimbursement">
                    费用报销
                  </SelectItem>
                  <SelectItem value="loan_offset">冲销借款</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department-filter">部门</Label>
              <Select
                value={filters.department_id || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, department_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="applicant-filter">申请人</Label>
              <Select
                value={filters.applicant_id || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, applicant_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部申请人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部申请人</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    status: "all",
                    department_id: "all",
                    expense_category: "all",
                    applicant_id: "all",
                    search: ""
                  })
                }
              >
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
          <CardTitle>申请单列表</CardTitle>
          <CardDescription>
            共 {expenseReimbursements.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请单号</TableHead>
                <TableHead>报销类别</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>报销事由</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>项目</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReimbursements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredReimbursements.map((reimbursement) => (
                  <TableRow key={reimbursement.id}>
                    <TableCell className="font-medium">
                      {reimbursement.request_number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reimbursement.expense_category ===
                          "expense_reimbursement"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {reimbursement.expense_category ===
                        "expense_reimbursement"
                          ? "费用报销"
                          : "冲销借款"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {reimbursement.applicant?.name ||
                            users.find(
                              (u) => u.id === reimbursement.applicant_id
                            )?.name ||
                            "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div
                        className="truncate"
                        title={reimbursement.expense_reason}
                      >
                        {reimbursement.expense_reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ¥{reimbursement.total_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {departments.find(
                            (d) => d.id === reimbursement.department_id
                          )?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>
                        {teams.find((t) => t.id === reimbursement.team_id)
                          ?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusWithProgress 
                        entityType="expense_reimbursements"
                        entityId={reimbursement.id}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(reimbursement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <PermissionGuard permission="VIEW_EXPENSE_DETAILS">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(reimbursement)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="EDIT_EXPENSE">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(reimbursement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="EXPORT_EXPENSE_PDF">
                          <ExpenseReimbursementPDFExport
                            reimbursement={reimbursement}
                            onExport={async () => {
                              try {
                                // 获取详细信息
                                const [allocations, attachments, workflowInstance] = await Promise.all([
                                  expenseReimbursementAPI.getAllocations(reimbursement.id),
                                  expenseReimbursementAPI.getAttachments(reimbursement.id),
                                  api.workflow.getWorkflowInstanceByEntity('expense_reimbursements', reimbursement.id)
                                ]);

                                // 如果找到工作流实例，获取详细信息
                                let workflowDetails = null;
                                if (workflowInstance) {
                                  workflowDetails = await api.workflow.getWorkflowInstanceDetails(workflowInstance.id);
                                }

                                return {
                                  allocations: allocations || [],
                                  attachments: attachments || [],
                                  workflowInstance: workflowDetails || workflowInstance
                                };
                              } catch (error) {
                                console.error('获取导出数据失败:', error);
                                return {
                                  allocations: [],
                                  attachments: [],
                                  workflowInstance: null
                                };
                              }
                            }}
                          />
                        </PermissionGuard>
                        <PermissionGuard permission="DELETE_EXPENSE">
                          <DeleteButton
                            onConfirm={() => handleDelete(reimbursement.id)}
                            itemName={`申请单 - ${reimbursement.expense_reason}`}
                            title="删除申请单"
                            description={`确定要删除"${reimbursement.expense_reason}"吗？删除后无法恢复。`}
                            variant="ghost"
                            size="sm"
                          />
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 创建申请单对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建申请单</DialogTitle>
            <DialogDescription>
              创建新的费用报销申请单或冲销借款申请单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="expense-category">报销类别 *</Label>
                <Select
                  value={formData.expense_category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      expense_category: value as
                        | "loan_offset"
                        | "expense_reimbursement"
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择报销类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense_reimbursement">
                      费用报销
                    </SelectItem>
                    <SelectItem value="loan_offset">冲销借款</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="applicant">申请人</Label>
                <Input
                  id="applicant"
                  value={user?.name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="total-amount">金额 *</Label>
                <Input
                  id="total-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      total_amount: e.target.value
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="department">所属部门 *</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, department_id: value }))
                  }
                >
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
            </div>

            <div>
              <Label htmlFor="expense-reason">报销事由 *</Label>
              <Textarea
                id="expense-reason"
                placeholder="保山公司报销2024年房屋租赁费"
                value={formData.expense_reason}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expense_reason: e.target.value
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="is-corporate-dimension">是否总商维度</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="is-corporate-dimension"
                    checked={formData.is_corporate_dimension}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        is_corporate_dimension: checked,
                        team_id: checked ? "" : prev.team_id // 如果启用总商维度，清空团队选择
                      }));
                    }}
                  />
                  <Label htmlFor="is-corporate-dimension">
                    {formData.is_corporate_dimension ? "是" : "否"}
                  </Label>
                </div>
              </div>

              {!formData.is_corporate_dimension && (
                <div>
                  <Label htmlFor="team">费用归属项目</Label>
                  <Select
                    value={formData.team_id || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        team_id: value === "none" ? "" : value
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {teams.map((team) => (
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
                    系统将自动关联expense_reimbursements审批流程
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
                          <TableHead className="text-center">
                            默认比例
                          </TableHead>
                          <TableHead className="text-center">
                            本次比例
                          </TableHead>
                          <TableHead className="text-right">分配金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((allocation, index) => {
                          const team = teams.find(
                            (t) => t.id === allocation.team_id
                          );
                          const defaultConfig = allocationConfigs.find(
                            (config) => config.team_id === allocation.team_id
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell className="text-blue-600 font-medium">
                                {team?.name || "未知项目"}
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
                                    onChange={(e) =>
                                      updateAllocation(
                                        index,
                                        "allocation_ratio",
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-16 text-center"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    %
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                ¥{allocation.allocation_amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center p-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        分摊比例总和:
                      </span>
                      <span className="text-green-600 font-medium">
                        {allocations
                          .reduce((sum, item) => sum + item.allocation_ratio, 0)
                          .toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                )}

                {allocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无分摊明细，点击"重新计算"按钮生成
                  </div>
                )}
              </div>
            )}

            {/* 附件上传 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-600">附件</h3>
              </div>

              <div>
                <Label htmlFor="attachments">选择文件</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
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

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "创建中..." : "创建"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看申请单对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申请单详情</DialogTitle>
            <DialogDescription>查看费用报销申请单的详细信息</DialogDescription>
          </DialogHeader>

          {selectedReimbursement && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>申请单号</Label>
                  <div className="text-sm font-medium">
                    {selectedReimbursement.request_number}
                  </div>
                </div>
                <div>
                  <Label>申请人</Label>
                  <div className="text-sm">
                    {selectedReimbursement.applicant?.name ||
                      users.find(
                        (u) => u.id === selectedReimbursement.applicant_id
                      )?.name ||
                      "-"}
                  </div>
                </div>
                <div>
                  <Label>创建时间</Label>
                  <div className="text-sm">
                    {new Date(
                      selectedReimbursement.created_at
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <Label>报销事由</Label>
                <div className="text-sm whitespace-pre-wrap">
                  {selectedReimbursement.expense_reason}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>报销类别</Label>
                  <div className="text-sm">
                    <Badge
                      variant={
                        selectedReimbursement.expense_category ===
                        "expense_reimbursement"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedReimbursement.expense_category ===
                      "expense_reimbursement"
                        ? "费用报销"
                        : "冲销借款"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>金额</Label>
                  <div className="text-sm font-medium">
                    ¥{selectedReimbursement.total_amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label>所属部门</Label>
                  <div className="text-sm">
                    {departments.find(
                      (d) => d.id === selectedReimbursement.department_id
                    )?.name || "-"}
                  </div>
                </div>
                <div>
                  <Label>状态</Label>
                  <div className="text-sm">
                    <StatusWithProgress 
                      entityType="expense_reimbursements"
                      entityId={selectedReimbursement.id}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>是否总商维度</Label>
                  <div className="text-sm">
                    {selectedReimbursement.is_corporate_dimension ? "是" : "否"}
                  </div>
                </div>
                {!selectedReimbursement.is_corporate_dimension && (
                  <div>
                    <Label>费用归属项目</Label>
                    <div className="text-sm">
                      {teams.find((t) => t.id === selectedReimbursement.team_id)
                        ?.name || "-"}
                    </div>
                  </div>
                )}
                <div>
                  <Label>关联审批流程</Label>
                  <div className="text-sm">
                    {selectedReimbursement.approval_workflow?.id || "-"}
                  </div>
                </div>
              </div>

              {/* 分摊明细 */}
              {selectedReimbursement.is_corporate_dimension &&
                selectedReimbursement.allocations &&
                selectedReimbursement.allocations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-blue-600">
                        分摊明细
                      </h3>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>分摊比例</TableHead>
                          <TableHead>分摊金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReimbursement.allocations.map(
                          (allocation, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {teams.find((t) => t.id === allocation.team_id)
                                  ?.name || "-"}
                              </TableCell>
                              <TableCell>
                                {(allocation.allocation_ratio * 100).toFixed(2)}
                                %
                              </TableCell>
                              <TableCell>
                                ¥{allocation.allocation_amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* 附件信息 */}
              {selectedReimbursement.attachments &&
                selectedReimbursement.attachments.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-blue-600">
                        附件
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {selectedReimbursement.attachments.map(
                        (attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {attachment.file_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({(attachment.file_size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const downloadUrl =
                                    await expenseReimbursementAPI.getAttachmentDownloadUrl(
                                      attachment.file_path
                                    );
                                  window.open(downloadUrl, "_blank");
                                } catch (error) {
                                  console.error("下载附件失败:", error);
                                  toast({
                                    title: "下载失败",
                                    description: "附件下载失败，请稍后重试",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑申请单对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑申请单</DialogTitle>
            <DialogDescription>编辑费用报销申请单信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="edit-expense-category">报销类别 *</Label>
                <Select
                  value={formData.expense_category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      expense_category: value as
                        | "loan_offset"
                        | "expense_reimbursement"
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择报销类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense_reimbursement">
                      费用报销
                    </SelectItem>
                    <SelectItem value="loan_offset">冲销借款</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-applicant">申请人</Label>
                <Input
                  id="edit-applicant"
                  value={user?.name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="edit-total-amount">金额 *</Label>
                <Input
                  id="edit-total-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      total_amount: e.target.value
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-department">所属部门 *</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, department_id: value }))
                  }
                >
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
            </div>

            <div>
              <Label htmlFor="edit-expense-reason">报销事由 *</Label>
              <Textarea
                id="edit-expense-reason"
                placeholder="保山公司报销2024年房屋租赁费"
                value={formData.expense_reason}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expense_reason: e.target.value
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-is-corporate-dimension">
                  是否总商维度
                </Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="edit-is-corporate-dimension"
                    checked={formData.is_corporate_dimension}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        is_corporate_dimension: checked,
                        team_id: checked ? "" : prev.team_id
                      }));
                    }}
                  />
                  <Label htmlFor="edit-is-corporate-dimension">
                    {formData.is_corporate_dimension ? "是" : "否"}
                  </Label>
                </div>
              </div>

              {!formData.is_corporate_dimension && (
                <div>
                  <Label htmlFor="edit-team">费用归属项目</Label>
                  <Select
                    value={formData.team_id || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        team_id: value === "none" ? "" : value
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {teams.map((team) => (
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
                    系统将自动关联expense_reimbursements审批流程
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
                          <TableHead className="text-center">
                            默认比例
                          </TableHead>
                          <TableHead className="text-center">
                            本次比例
                          </TableHead>
                          <TableHead className="text-right">分配金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((allocation, index) => {
                          const team = teams.find(
                            (t) => t.id === allocation.team_id
                          );
                          const defaultConfig = allocationConfigs.find(
                            (config) => config.team_id === allocation.team_id
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell className="text-blue-600 font-medium">
                                {team?.name || "未知项目"}
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
                                    onChange={(e) =>
                                      updateAllocation(
                                        index,
                                        "allocation_ratio",
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-16 text-center"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    %
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                ¥{allocation.allocation_amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center p-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        分摊比例总和:
                      </span>
                      <span className="text-green-600 font-medium">
                        {allocations
                          .reduce((sum, item) => sum + item.allocation_ratio, 0)
                          .toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                )}

                {allocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无分摊明细，点击"重新计算"按钮生成
                  </div>
                )}
              </div>
            )}

            {/* 现有附件 */}
            {existingAttachments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-blue-600">
                    现有附件
                  </h3>
                </div>

                <div className="space-y-2">
                  {existingAttachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{attachment.file_name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(attachment.file_size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const downloadUrl =
                                await expenseReimbursementAPI.getAttachmentDownloadUrl(
                                  attachment.file_path
                                );
                              window.open(downloadUrl, "_blank");
                            } catch (error) {
                              console.error("下载附件失败:", error);
                              toast({
                                title: "下载失败",
                                description: "附件下载失败，请稍后重试",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeExistingAttachment(attachment.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 新增附件 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-600">新增附件</h3>
              </div>

              <div>
                <Label htmlFor="edit-attachments">选择文件</Label>
                <Input
                  id="edit-attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
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

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "更新中..." : "更新"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseReimbursement;
