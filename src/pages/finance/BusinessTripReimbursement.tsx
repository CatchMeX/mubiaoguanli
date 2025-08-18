import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DeleteButton } from "@/components/ui/delete-confirm-dialog";
import { PermissionGuard } from "@/hooks/usePermissions";
import api from "@/services/api";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Download,
  Calculator,
  Plane,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import BusinessTripPDFExport from "@/components/BusinessTripPDFExport";

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
import { useAuth } from "@/contexts/AuthContext";
import type {
  BusinessTripReimbursement,
  BusinessTripExpenseDetail,
  BusinessTripBankAccount,
  BusinessTripAllocation,
  BusinessTripAttachment,
  BusinessTripReimbursementFormData,
  BusinessTripExpenseDetailFormData,
  BusinessTripBankAccountFormData,
  BusinessTripAllocationFormData,
  TeamAllocationConfig
} from "@/types";


export default function BusinessTripReimbursement() {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessTripReimbursements, setBusinessTripReimbursements] = useState<
    BusinessTripReimbursement[]
  >([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<any[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<
    TeamAllocationConfig[]
  >([]);

  // 筛选状态
  const [filters, setFilters] = useState({
    status: 'all',
    department_id: 'all',
    applicant_id: 'all',
    search: ''
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] =
    useState<BusinessTripReimbursement | null>(null);
  const [selectedReimbursementDetails, setSelectedReimbursementDetails] =
    useState<{
      expenseDetails: BusinessTripExpenseDetail[];
      bankAccounts: BusinessTripBankAccount[];
      allocations: BusinessTripAllocation[];
      attachments: BusinessTripAttachment[];
    } | null>(null);

  // Form data
  const [formData, setFormData] = useState<BusinessTripReimbursementFormData>({
    applicant_id: "",
    expense_reason: "",
    total_amount: "",
    department_id: "",
    team_id: "",
    approval_workflow_id: "",
    is_corporate_dimension: false,
    expense_details: [],
    bank_accounts: [],
    allocations: [],
    attachments: []
  });

  // Set applicant when user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, applicant_id: user.id }));
    }
  }, [user]);

  // 筛选数据
  const filteredReimbursements = businessTripReimbursements.filter(reimbursement => {
    // 状态筛选 - 使用工作流实例状态
    if (filters.status && filters.status !== 'all') {
      if (reimbursement.workflowStatus !== filters.status) return false;
    }
    // 部门筛选
    if (filters.department_id && filters.department_id !== 'all') {
      if (reimbursement.department_id !== filters.department_id) return false;
    }
    // 申请人筛选
    if (filters.applicant_id && filters.applicant_id !== 'all') {
      if (reimbursement.applicant_id !== filters.applicant_id) return false;
    }
    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!(
        reimbursement.request_number.toLowerCase().includes(searchLower) ||
        reimbursement.expense_reason.toLowerCase().includes(searchLower) ||
        (reimbursement.applicant?.name && reimbursement.applicant.name.toLowerCase().includes(searchLower))
      )) return false;
    }
    return true;
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        reimbursements,
        departmentsData,
        teamsData,
        usersData,
        workflowData,
        allocationConfigsData
      ] = await Promise.all([
        api.businessTrip.getBusinessTripReimbursements(),
        api.department.getAll(),
        api.team.getAll(),
        api.user.getAll(),
        api.workflow.getWorkflowsWithDetails(),
        api.team.getEnabledAllocationConfigs()
      ]);

      // 为每个差旅费报销获取工作流实例状态
      const reimbursementsWithWorkflowStatus = await Promise.all(
        (reimbursements || []).map(async (reimbursement) => {
          try {
            const workflowInstance = await api.workflow.getWorkflowInstanceByEntity('business_trip_reimbursements', reimbursement.id);
            return {
              ...reimbursement,
              workflowStatus: workflowInstance?.status || 'running'
            };
          } catch (error) {
            console.error(`获取差旅费报销 ${reimbursement.id} 的工作流状态失败:`, error);
            return {
              ...reimbursement,
              workflowStatus: 'running'
            };
          }
        })
      );

      setBusinessTripReimbursements(reimbursementsWithWorkflowStatus);
      setDepartments(departmentsData);
      setTeams(teamsData);
      setUsers(usersData);
      setWorkflowInstances(workflowData);
      setAllocationConfigs(allocationConfigsData);
    } catch (err) {
      console.error("加载数据失败:", err);
      setError(err instanceof Error ? err.message : "加载数据失败");
      toast.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      applicant_id: user?.id || "",
      expense_reason: "",
      total_amount: "",
      department_id: "",
      team_id: "",
      approval_workflow_id: "",
      is_corporate_dimension: false,
      expense_details: [],
      bank_accounts: [],
      allocations: [],
      attachments: []
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">待审批</Badge>;
      case "approved":
        return <Badge variant="default">已批准</Badge>;
      case "rejected":
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate total amount from expense details
  const calculateTotalAmount = () => {
    return formData.expense_details.reduce((total, detail) => {
      return (
        total +
        (parseFloat(detail.accommodation_fee) || 0) +
        (parseFloat(detail.intercity_transport_fee) || 0) +
        (parseFloat(detail.local_transport_fee) || 0) +
        (parseFloat(detail.other_fees) || 0)
      );
    }, 0);
  };

  // Calculate bank total amount
  const calculateBankTotalAmount = () => {
    return formData.bank_accounts.reduce((total, account) => {
      return total + (parseFloat(account.payment_amount) || 0);
    }, 0);
  };

  // Calculate allocation
  const calculateAllocation = async (totalAmount: number) => {
    if (!formData.is_corporate_dimension || allocationConfigs.length === 0) {
      setFormData((prev) => ({ ...prev, allocations: [] }));
      return;
    }

    const allocations: BusinessTripAllocationFormData[] = allocationConfigs.map(
      (config) => ({
        team_id: config.team_id,
        allocation_ratio: config.allocation_ratio.toString()
      })
    );

    setFormData((prev) => ({ ...prev, allocations }));
  };

  // Update allocation
  const updateAllocation = (
    index: number,
    field: keyof BusinessTripAllocationFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      allocations: prev.allocations.map((allocation, i) =>
        i === index ? { ...allocation, [field]: value } : allocation
      )
    }));
  };

  // File handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const removeExistingAttachment = async (attachmentId: string) => {
    try {
      await api.businessTrip.deleteAttachment(attachmentId);
      if (selectedReimbursementDetails) {
        setSelectedReimbursementDetails((prev) =>
          prev
            ? {
                ...prev,
                attachments: prev.attachments.filter(
                  (a) => a.id !== attachmentId
                )
              }
            : null
        );
      }
      toast.success("附件删除成功");
    } catch (err) {
      console.error("删除附件失败:", err);
      toast.error("删除附件失败");
    }
  };

  const getAttachmentDownloadUrl = async (filePath: string) => {
    try {
      return await api.businessTrip.getAttachmentDownloadUrl(filePath);
    } catch (err) {
      console.error("获取下载链接失败:", err);
      toast.error("获取下载链接失败");
      return "";
    }
  };

  // Expense detail management
  const addExpenseDetail = () => {
    setFormData((prev) => ({
      ...prev,
      expense_details: [
        ...prev.expense_details,
        {
          accommodation_fee: "",
          intercity_transport_fee: "",
          local_transport_fee: "",
          other_fees: "",
          description: ""
        }
      ]
    }));
  };

  const removeExpenseDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      expense_details: prev.expense_details.filter((_, i) => i !== index)
    }));
  };

  const updateExpenseDetail = (
    index: number,
    field: keyof BusinessTripExpenseDetailFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      expense_details: prev.expense_details.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  // Bank account management
  const addBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: [
        ...prev.bank_accounts,
        {
          payee_account_name: "",
          bank_account: "",
          bank_name: "",
          payment_amount: ""
        }
      ]
    }));
  };

  const removeBankAccount = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((_, i) => i !== index)
    }));
  };

  const updateBankAccount = (
    index: number,
    field: keyof BusinessTripBankAccountFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: prev.bank_accounts.map((account, i) =>
        i === index ? { ...account, [field]: value } : account
      )
    }));
  };

  // Handle view reimbursement
  const handleView = async (reimbursement: BusinessTripReimbursement) => {
    try {
      setSelectedReimbursement(reimbursement);

      // Load related data
      const [expenseDetails, bankAccounts, allocations, attachments] =
        await Promise.all([
          api.businessTrip.getExpenseDetails(reimbursement.id),
          api.businessTrip.getBankAccounts(reimbursement.id),
          api.businessTrip.getAllocations(reimbursement.id),
          api.businessTrip.getAttachments(reimbursement.id)
        ]);

      setSelectedReimbursementDetails({
        expenseDetails,
        bankAccounts,
        allocations,
        attachments
      });

      setViewDialogOpen(true);
    } catch (err) {
      console.error("加载申请单详情失败:", err);
      toast.error("加载申请单详情失败");
    }
  };

  // Handle edit reimbursement
  const handleEdit = async (reimbursement: BusinessTripReimbursement) => {
    try {
      setSelectedReimbursement(reimbursement);

      // Load related data
      const [expenseDetails, bankAccounts, allocations, attachments] =
        await Promise.all([
          api.businessTrip.getExpenseDetails(reimbursement.id),
          api.businessTrip.getBankAccounts(reimbursement.id),
          api.businessTrip.getAllocations(reimbursement.id),
          api.businessTrip.getAttachments(reimbursement.id)
        ]);

      // Populate form data
      setFormData({
        applicant_id: reimbursement.applicant_id,
        expense_reason: reimbursement.expense_reason,
        total_amount: reimbursement.total_amount.toString(),
        department_id: reimbursement.department_id || "",
        team_id: reimbursement.team_id || "",
        approval_workflow_id: reimbursement.approval_workflow_id || "",
        is_corporate_dimension: reimbursement.is_corporate_dimension,
        expense_details: expenseDetails.map((detail) => ({
          accommodation_fee: detail.accommodation_fee.toString(),
          intercity_transport_fee: detail.intercity_transport_fee.toString(),
          local_transport_fee: detail.local_transport_fee.toString(),
          other_fees: detail.other_fees.toString(),
          description: detail.description || ""
        })),
        bank_accounts: bankAccounts.map((account) => ({
          payee_account_name: account.payee_account_name,
          bank_account: account.bank_account,
          bank_name: account.bank_name,
          payment_amount: account.payment_amount.toString()
        })),
        allocations: allocations.map((allocation) => ({
          team_id: allocation.team_id,
          allocation_ratio: allocation.allocation_ratio.toString()
        })),
        attachments: []
      });

      setSelectedReimbursementDetails({
        expenseDetails,
        bankAccounts,
        allocations,
        attachments
      });

      setEditDialogOpen(true);
    } catch (err) {
      console.error("加载申请单详情失败:", err);
      toast.error("加载申请单详情失败");
    }
  };

  // Handle update reimbursement
  const handleUpdate = async () => {
    if (!selectedReimbursement) return;

    try {
      console.log("开始校验编辑表单数据...");

      // 1. 校验报销原因
      if (!formData.expense_reason.trim()) {
        toast.error("请填写报销原因");
        return;
      }

      // 2. 校验报销明细
      if (formData.expense_details.length === 0) {
        toast.error("请至少添加一条报销明细");
        return;
      }

      // 3. 校验报销明细内容
      for (let i = 0; i < formData.expense_details.length; i++) {
        const detail = formData.expense_details[i];
        const accommodation_fee = parseFloat(detail.accommodation_fee) || 0;
        const intercity_transport_fee =
          parseFloat(detail.intercity_transport_fee) || 0;
        const local_transport_fee = parseFloat(detail.local_transport_fee) || 0;
        const other_fees = parseFloat(detail.other_fees) || 0;
        const detailTotal =
          accommodation_fee +
          intercity_transport_fee +
          local_transport_fee +
          other_fees;

        if (detailTotal <= 0) {
          toast.error(`第${i + 1}条报销明细的金额必须大于0`);
          return;
        }
      }

      // 4. 计算并校验报销总金额
      const totalAmount = calculateTotalAmount();
      console.log("报销总金额:", totalAmount);

      if (totalAmount <= 0) {
        toast.error("报销总金额必须大于0");
        return;
      }

      // 5. 校验银行账户信息
      if (formData.bank_accounts.length === 0) {
        toast.error("请至少添加一个银行账户");
        return;
      }

      // 6. 校验银行账户内容
      for (let i = 0; i < formData.bank_accounts.length; i++) {
        const account = formData.bank_accounts[i];
        if (!account.payee_account_name.trim()) {
          toast.error(`第${i + 1}个银行账户的收款人账户名不能为空`);
          return;
        }
        if (!account.bank_account.trim()) {
          toast.error(`第${i + 1}个银行账户的银行账号不能为空`);
          return;
        }
        if (!account.bank_name.trim()) {
          toast.error(`第${i + 1}个银行账户的银行名称不能为空`);
          return;
        }
        const paymentAmount = parseFloat(account.payment_amount) || 0;
        if (paymentAmount <= 0) {
          toast.error(`第${i + 1}个银行账户的支付金额必须大于0`);
          return;
        }
      }

      // 7. 校验银行账户总金额
      const bankTotal = calculateBankTotalAmount();
      console.log("银行账户总金额:", bankTotal);
      console.log("报销总金额:", totalAmount);
      console.log("差额:", Math.abs(bankTotal - totalAmount));

      if (Math.abs(bankTotal - totalAmount) > 0.01) {
        toast.error(
          `银行账户支付金额总和(¥${bankTotal.toFixed(
            2
          )})必须等于报销总金额(¥${totalAmount.toFixed(2)})`
        );
        return;
      }

      // 8. 校验分摊比例（如果启用总商维度）
      if (formData.is_corporate_dimension) {
        if (formData.allocations.length === 0) {
          toast.error("启用总商维度时，必须配置分摊比例");
          return;
        }

        const totalRatio = formData.allocations.reduce(
          (sum, a) => sum + parseFloat(a.allocation_ratio || "0"),
          0
        );
        console.log("分摊比例总和:", totalRatio);

        if (Math.abs(totalRatio - 100) > 0.01) {
          toast.error(`分摊比例总和(${totalRatio.toFixed(2)}%)必须等于100%`);
          return;
        }
      }

      console.log("所有校验通过，开始更新申请单...");

      // 自动查找business_trip_reimbursements的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId || approvalWorkflowId === "none") {
        try {
          const businessTripReimbursementsWorkflows = await api.workflow.getWorkflowsByFormType('business_trip_reimbursements');
          if (businessTripReimbursementsWorkflows && businessTripReimbursementsWorkflows.length > 0) {
            // 取第一个激活的business_trip_reimbursements工作流
            approvalWorkflowId = businessTripReimbursementsWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找business_trip_reimbursements审批流程失败:', workflowError);
        }
      }

      // Update reimbursement
      const updateData = {
        expense_reason: formData.expense_reason,
        total_amount: totalAmount,
        department_id:
          formData.department_id === "none"
            ? undefined
            : formData.department_id,
        team_id: formData.team_id === "none" ? undefined : formData.team_id,
        approval_workflow_id: approvalWorkflowId === "none" ? undefined : approvalWorkflowId,
        is_corporate_dimension: formData.is_corporate_dimension,
        expense_details: formData.expense_details.map((detail) => {
          const accommodation_fee = parseFloat(detail.accommodation_fee) || 0;
          const intercity_transport_fee =
            parseFloat(detail.intercity_transport_fee) || 0;
          const local_transport_fee =
            parseFloat(detail.local_transport_fee) || 0;
          const other_fees = parseFloat(detail.other_fees) || 0;
          const total_fee =
            accommodation_fee +
            intercity_transport_fee +
            local_transport_fee +
            other_fees;

          return {
            accommodation_fee,
            intercity_transport_fee,
            local_transport_fee,
            other_fees,
            total_fee,
            description: detail.description
          };
        }),
        bank_accounts: formData.bank_accounts.map((account) => ({
          payee_account_name: account.payee_account_name,
          bank_account: account.bank_account,
          bank_name: account.bank_name,
          payment_amount: parseFloat(account.payment_amount) || 0
        })),
        allocations: formData.allocations.map((allocation) => ({
          team_id: allocation.team_id,
          allocation_ratio: parseFloat(allocation.allocation_ratio) || 0
        }))
      };

      await api.businessTrip.updateBusinessTripReimbursement(
        selectedReimbursement.id,
        updateData
      );

      // Upload new attachments
      if (formData.attachments.length > 0) {
        console.log("开始上传新增附件...");
        for (const file of formData.attachments) {
          try {
            await api.businessTrip.uploadAttachment(
              selectedReimbursement.id,
              file
            );
            console.log(`附件 ${file.name} 上传成功`);
          } catch (uploadError) {
            console.error(`附件 ${file.name} 上传失败:`, uploadError);
            toast.error(`附件 ${file.name} 上传失败`);
          }
        }
        console.log("所有新增附件上传完成");
      }

      toast.success("申请单更新成功");
      setEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error("更新申请单失败:", err);
      toast.error("更新申请单失败");
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Calculate allocation when corporate dimension changes
  useEffect(() => {
    if (formData.is_corporate_dimension) {
      calculateAllocation(calculateTotalAmount());
    } else {
      setFormData((prev) => ({ ...prev, allocations: [] }));
    }
  }, [formData.is_corporate_dimension, allocationConfigs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">加载中...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        错误: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Plane className="h-6 w-6" />
          <h1 className="text-2xl font-bold">差旅费报销管理</h1>
        </div>
        <PermissionGuard permission="CREATE_BUSINESS_TRIP">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建申请
          </Button>
        </PermissionGuard>
      </div>



      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                placeholder="搜索申请单号、报销原因..."
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

      {/* Reimbursements Table */}
      <Card>
        <CardHeader>
          <CardTitle>申请单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请单号</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>报销原因</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReimbursements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredReimbursements.map((reimbursement) => (
                  <TableRow key={reimbursement.id}>
                    <TableCell>{reimbursement.request_number}</TableCell>
                    <TableCell>
                      {reimbursement.applicant?.name || "未知"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {reimbursement.expense_reason}
                    </TableCell>
                    <TableCell>
                      ¥{reimbursement.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {reimbursement.department?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusWithProgress 
                        entityType="business_trip_reimbursements"
                        entityId={reimbursement.id}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(reimbursement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <PermissionGuard permission="VIEW_BUSINESS_TRIP_DETAILS">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(reimbursement)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="EDIT_BUSINESS_TRIP">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(reimbursement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="EXPORT_BUSINESS_TRIP_PDF">
                          <BusinessTripPDFExport
                            reimbursement={reimbursement}
                            onExport={async () => {
                              try {
                                // 获取详细信息
                                const [expenseDetails, bankAccounts, allocations, attachments, workflowInstance] = await Promise.all([
                                  api.businessTrip.getExpenseDetails(reimbursement.id),
                                  api.businessTrip.getBankAccounts(reimbursement.id),
                                  api.businessTrip.getAllocations(reimbursement.id),
                                  api.businessTrip.getAttachments(reimbursement.id),
                                  api.workflow.getWorkflowInstanceByEntity('business_trip_reimbursements', reimbursement.id)
                                ]);

                                // 如果找到工作流实例，获取详细信息
                                let workflowDetails = null;
                                if (workflowInstance) {
                                  workflowDetails = await api.workflow.getWorkflowInstanceDetails(workflowInstance.id);
                                }

                                return {
                                  expenseDetails: expenseDetails || [],
                                  bankAccounts: bankAccounts || [],
                                  allocations: allocations || [],
                                  attachments: attachments || [],
                                  workflowInstance: workflowDetails || workflowInstance
                                };
                              } catch (error) {
                                console.error('获取导出数据失败:', error);
                                return {
                                  expenseDetails: [],
                                  bankAccounts: [],
                                  allocations: [],
                                  attachments: [],
                                  workflowInstance: null
                                };
                              }
                            }}
                          />
                        </PermissionGuard>
                        <PermissionGuard permission="DELETE_BUSINESS_TRIP">
                          <DeleteButton
                            onConfirm={async () => {
                              try {
                                await api.businessTrip.deleteBusinessTripReimbursement(
                                  reimbursement.id
                                );
                                toast.success("删除成功");
                                loadData();
                              } catch (err) {
                                console.error("删除失败:", err);
                                toast.error("删除失败");
                              }
                            }}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建差旅费报销申请</DialogTitle>
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
                    value={user?.name || ""}
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="department">关联部门</Label>
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
                      <SelectItem value="none">无</SelectItem>
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
                <Label htmlFor="expense_reason">报销原因 *</Label>
                <Textarea
                  id="expense_reason"
                  placeholder="例如：强制格式：**（姓名）报销到**（地名）出差费用"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflow">关联审批流程</Label>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700 font-medium">自动关联</span>
                    </div>
                    <span className="text-xs text-blue-600">
                      系统将自动关联business_trip_reimbursements审批流程
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="corporate-dimension"
                    checked={formData.is_corporate_dimension}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        is_corporate_dimension: checked,
                        team_id: checked ? "" : prev.team_id
                      }));
                    }}
                  />
                  <Label htmlFor="corporate-dimension">是否总商维度</Label>
                </div>
              </div>

              {!formData.is_corporate_dimension && (
                <div>
                  <Label htmlFor="team">费用归属项目</Label>
                  <Select
                    value={formData.team_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, team_id: value }))
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
            </div>

            {/* 分摊明细 - 移到总商维度下方 */}
            {formData.is_corporate_dimension && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">分摊配置</h3>
                </div>
                <p className="text-sm text-blue-600">
                  可修改各项目的分摊比例,系统将自动计算分配金额
                </p>

                {formData.allocations.length > 0 && (
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
                        {formData.allocations.map((allocation, index) => {
                          const config = allocationConfigs.find(
                            (c) => c.team_id === allocation.team_id
                          );
                          const team = teams.find(
                            (t) => t.id === allocation.team_id
                          );
                          const allocationAmount =
                            (calculateTotalAmount() *
                              parseFloat(allocation.allocation_ratio || "0")) /
                            100;

                          return (
                            <TableRow key={index}>
                              <TableCell className="text-blue-600 font-medium">
                                {team?.name || "未知项目"}
                              </TableCell>
                              <TableCell className="text-center text-blue-600">
                                {config?.allocation_ratio || 0}%
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
                                        e.target.value
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
                                ¥{allocationAmount.toFixed(2)}
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
                        {formData.allocations
                          .reduce(
                            (sum, a) =>
                              sum + parseFloat(a.allocation_ratio || "0"),
                            0
                          )
                          .toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expense Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">报销明细</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpenseDetail}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加明细
                </Button>
              </div>

              {formData.expense_details.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  暂无报销明细，请添加明细
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.expense_details.map((detail, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          明细 {index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpenseDetail(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>住宿费</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.accommodation_fee}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "accommodation_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>城际交通费</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.intercity_transport_fee}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "intercity_transport_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>市内交通费</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.local_transport_fee}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "local_transport_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>其他费用</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.other_fees}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "other_fees",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>说明</Label>
                        <Textarea
                          placeholder="费用说明"
                          value={detail.description}
                          onChange={(e) =>
                            updateExpenseDetail(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <div className="text-right">
                    <Label className="text-base font-medium">
                      报销明细合计: ¥{calculateTotalAmount().toFixed(2)}
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* Bank Accounts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">银行账户信息</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBankAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加账户
                </Button>
              </div>

              {formData.bank_accounts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  暂无银行账户信息，请添加账户
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.bank_accounts.map((account, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          账户 {index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBankAccount(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>收款人账户名</Label>
                          <Input
                            placeholder="收款人姓名"
                            value={account.payee_account_name}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "payee_account_name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>银行账号</Label>
                          <Input
                            placeholder="银行账号"
                            value={account.bank_account}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "bank_account",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>银行名称</Label>
                          <Input
                            placeholder="银行名称"
                            value={account.bank_name}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "bank_name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>支付金额</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={account.payment_amount}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "payment_amount",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="text-right">
                    <Label className="text-base font-medium">
                      银行账户合计: ¥{calculateBankTotalAmount().toFixed(2)}
                    </Label>
                  </div>
                </div>
              )}
            </div>

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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="cursor-pointer mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  支持 PDF、Word、Excel、图片等格式，单个文件不超过 10MB
                </p>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded bg-gray-50"
                    >
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

            {/* 金额信息 */}
            <div className="space-y-2 p-4 bg-blue-50 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">
                  报销明细合计:
                </span>
                <span className="text-lg font-bold text-blue-700">
                  ¥{calculateTotalAmount().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">
                  银行账户合计:
                </span>
                <span className="text-lg font-bold text-green-700">
                  ¥{calculateBankTotalAmount().toFixed(2)}
                </span>
              </div>
              {Math.abs(calculateTotalAmount() - calculateBankTotalAmount()) >
                0.01 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-700">
                    差额:
                  </span>
                  <span className="text-lg font-bold text-red-700">
                    ¥
                    {Math.abs(
                      calculateTotalAmount() - calculateBankTotalAmount()
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              {Math.abs(calculateTotalAmount() - calculateBankTotalAmount()) <=
                0.01 &&
                calculateTotalAmount() > 0 && (
                  <div className="text-center">
                    <span className="text-sm font-medium text-green-600">
                      ✓ 金额匹配
                    </span>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={async () => {
                  try {
                    console.log("开始校验表单数据...");

                    // 1. 校验报销原因
                    if (!formData.expense_reason.trim()) {
                      toast.error("请填写报销原因");
                      return;
                    }

                    // 2. 校验报销明细
                    if (formData.expense_details.length === 0) {
                      toast.error("请至少添加一条报销明细");
                      return;
                    }

                    // 3. 校验报销明细内容
                    for (let i = 0; i < formData.expense_details.length; i++) {
                      const detail = formData.expense_details[i];
                      const accommodation_fee =
                        parseFloat(detail.accommodation_fee) || 0;
                      const intercity_transport_fee =
                        parseFloat(detail.intercity_transport_fee) || 0;
                      const local_transport_fee =
                        parseFloat(detail.local_transport_fee) || 0;
                      const other_fees = parseFloat(detail.other_fees) || 0;
                      const detailTotal =
                        accommodation_fee +
                        intercity_transport_fee +
                        local_transport_fee +
                        other_fees;

                      if (detailTotal <= 0) {
                        toast.error(`第${i + 1}条报销明细的金额必须大于0`);
                        return;
                      }
                    }

                    // 4. 计算并校验报销总金额
                    const totalAmount = calculateTotalAmount();
                    console.log("报销总金额:", totalAmount);

                    if (totalAmount <= 0) {
                      toast.error("报销总金额必须大于0");
                      return;
                    }

                    // 5. 校验银行账户信息
                    if (formData.bank_accounts.length === 0) {
                      toast.error("请至少添加一个银行账户");
                      return;
                    }

                    // 6. 校验银行账户内容
                    for (let i = 0; i < formData.bank_accounts.length; i++) {
                      const account = formData.bank_accounts[i];
                      if (!account.payee_account_name.trim()) {
                        toast.error(
                          `第${i + 1}个银行账户的收款人账户名不能为空`
                        );
                        return;
                      }
                      if (!account.bank_account.trim()) {
                        toast.error(`第${i + 1}个银行账户的银行账号不能为空`);
                        return;
                      }
                      if (!account.bank_name.trim()) {
                        toast.error(`第${i + 1}个银行账户的银行名称不能为空`);
                        return;
                      }
                      const paymentAmount =
                        parseFloat(account.payment_amount) || 0;
                      if (paymentAmount <= 0) {
                        toast.error(`第${i + 1}个银行账户的支付金额必须大于0`);
                        return;
                      }
                    }

                    // 7. 校验银行账户总金额
                    const bankTotal = calculateBankTotalAmount();
                    console.log("银行账户总金额:", bankTotal);
                    console.log("报销总金额:", totalAmount);
                    console.log("差额:", Math.abs(bankTotal - totalAmount));

                    if (Math.abs(bankTotal - totalAmount) > 0.01) {
                      toast.error(
                        `银行账户支付金额总和(¥${bankTotal.toFixed(
                          2
                        )})必须等于报销总金额(¥${totalAmount.toFixed(2)})`
                      );
                      return;
                    }

                    // 8. 校验分摊比例（如果启用总商维度）
                    if (formData.is_corporate_dimension) {
                      if (formData.allocations.length === 0) {
                        toast.error("启用总商维度时，必须配置分摊比例");
                        return;
                      }

                      const totalRatio = formData.allocations.reduce(
                        (sum, a) => sum + parseFloat(a.allocation_ratio || "0"),
                        0
                      );
                      console.log("分摊比例总和:", totalRatio);

                      if (Math.abs(totalRatio - 100) > 0.01) {
                        toast.error(
                          `分摊比例总和(${totalRatio.toFixed(2)}%)必须等于100%`
                        );
                        return;
                      }
                    }

                    console.log("所有校验通过，开始创建申请单...");

                    // 自动查找business_trip_reimbursements的审批流程
                    let approvalWorkflowId = formData.approval_workflow_id;
                    if (!approvalWorkflowId || approvalWorkflowId === "none") {
                      try {
                        const businessTripReimbursementsWorkflows = await api.workflow.getWorkflowsByFormType('business_trip_reimbursements');
                        if (businessTripReimbursementsWorkflows && businessTripReimbursementsWorkflows.length > 0) {
                          // 取第一个激活的business_trip_reimbursements工作流
                          approvalWorkflowId = businessTripReimbursementsWorkflows[0].id;
                          console.log('自动关联审批流程:', approvalWorkflowId);
                        }
                      } catch (workflowError) {
                        console.error('查找business_trip_reimbursements审批流程失败:', workflowError);
                      }
                    }

                    // Create reimbursement
                    const createData = {
                      applicant_id: formData.applicant_id,
                      expense_reason: formData.expense_reason,
                      total_amount: totalAmount,
                      department_id:
                        formData.department_id === "none"
                          ? undefined
                          : formData.department_id,
                      team_id:
                        formData.team_id === "none"
                          ? undefined
                          : formData.team_id,
                      approval_workflow_id: approvalWorkflowId === "none" ? undefined : approvalWorkflowId,
                      is_corporate_dimension: formData.is_corporate_dimension,
                      expense_details: formData.expense_details.map(
                        (detail) => {
                          const accommodation_fee =
                            parseFloat(detail.accommodation_fee) || 0;
                          const intercity_transport_fee =
                            parseFloat(detail.intercity_transport_fee) || 0;
                          const local_transport_fee =
                            parseFloat(detail.local_transport_fee) || 0;
                          const other_fees = parseFloat(detail.other_fees) || 0;
                          const total_fee =
                            accommodation_fee +
                            intercity_transport_fee +
                            local_transport_fee +
                            other_fees;

                          return {
                            accommodation_fee,
                            intercity_transport_fee,
                            local_transport_fee,
                            other_fees,
                            total_fee,
                            description: detail.description
                          };
                        }
                      ),
                      bank_accounts: formData.bank_accounts.map((account) => ({
                        payee_account_name: account.payee_account_name,
                        bank_account: account.bank_account,
                        bank_name: account.bank_name,
                        payment_amount: parseFloat(account.payment_amount) || 0
                      })),
                      allocations: formData.allocations.map((allocation) => ({
                        team_id: allocation.team_id,
                        allocation_ratio:
                          parseFloat(allocation.allocation_ratio) || 0
                      }))
                    };

                    await api.businessTrip.createBusinessTripReimbursement(
                      createData
                    );

                    // Upload attachments
                    if (formData.attachments.length > 0) {
                      console.log("开始上传附件...");
                      const createdReimbursement =
                        await api.businessTrip.getBusinessTripReimbursements();
                      const latestReimbursement = createdReimbursement[0]; // 获取最新创建的申请单

                      for (const file of formData.attachments) {
                        try {
                          await api.businessTrip.uploadAttachment(
                            latestReimbursement.id,
                            file
                          );
                          console.log(`附件 ${file.name} 上传成功`);
                        } catch (uploadError) {
                          console.error(
                            `附件 ${file.name} 上传失败:`,
                            uploadError
                          );
                          toast.error(`附件 ${file.name} 上传失败`);
                        }
                      }
                      console.log("所有附件上传完成");
                    }

                    toast.success("申请单创建成功");
                    setCreateDialogOpen(false);
                    resetForm();
                    loadData();
                  } catch (err) {
                    console.error("创建申请单失败:", err);
                    toast.error("创建申请单失败");
                  }
                }}
              >
                创建申请
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>查看差旅费报销申请</DialogTitle>
          </DialogHeader>

          {selectedReimbursement && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>申请单号</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReimbursement.request_number}
                    </p>
                  </div>
                  <div>
                    <Label>申请人</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReimbursement.applicant?.name || "未知"}
                    </p>
                  </div>
                  <div>
                    <Label>报销总金额</Label>
                    <p className="text-sm font-medium">
                      ¥{selectedReimbursement.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <div>
                      <StatusWithProgress 
                        entityType="business_trip_reimbursements"
                        entityId={selectedReimbursement.id}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>报销原因</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedReimbursement.expense_reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>是否总商维度</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReimbursement.is_corporate_dimension
                        ? "是"
                        : "否"}
                    </p>
                  </div>
                  <div>
                    <Label>费用归属项目</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReimbursement.team?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <Label>关联部门</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReimbursement.department?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <Label>关联审批流程</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReimbursement.approval_workflow
                        ? `审批流程 - ${new Date(
                            selectedReimbursement.approval_workflow.initiated_at
                          ).toLocaleDateString()}`
                        : "无"}
                    </p>
                  </div>
                  <div>
                    <Label>创建时间</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        selectedReimbursement.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expense Details */}
              {selectedReimbursementDetails &&
                selectedReimbursementDetails.expenseDetails.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">报销明细</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>住宿费</TableHead>
                          <TableHead>城际交通费</TableHead>
                          <TableHead>市内交通费</TableHead>
                          <TableHead>其他费用</TableHead>
                          <TableHead>费用小计</TableHead>
                          <TableHead>说明</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReimbursementDetails.expenseDetails.map(
                          (detail, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                ¥{detail.accommodation_fee.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                ¥{detail.intercity_transport_fee.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                ¥{detail.local_transport_fee.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                ¥{detail.other_fees.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                ¥{detail.total_fee.toFixed(2)}
                              </TableCell>
                              <TableCell>{detail.description || "-"}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* Bank Accounts */}
              {selectedReimbursementDetails &&
                selectedReimbursementDetails.bankAccounts.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      银行账户信息
                    </Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>收款人账户名</TableHead>
                          <TableHead>银行账号</TableHead>
                          <TableHead>银行名称</TableHead>
                          <TableHead>支付金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReimbursementDetails.bankAccounts.map(
                          (account, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {account.payee_account_name}
                              </TableCell>
                              <TableCell>{account.bank_account}</TableCell>
                              <TableCell>{account.bank_name}</TableCell>
                              <TableCell>
                                ¥{account.payment_amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* Allocations */}
              {selectedReimbursement.is_corporate_dimension &&
                selectedReimbursementDetails &&
                selectedReimbursementDetails.allocations.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">分摊明细</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目</TableHead>
                          <TableHead>分摊比例</TableHead>
                          <TableHead>分摊金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReimbursementDetails.allocations.map(
                          (allocation, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {allocation.team?.name || "未知项目"}
                              </TableCell>
                              <TableCell>
                                {allocation.allocation_ratio}%
                              </TableCell>
                              <TableCell>
                                ¥
                                {(
                                  (selectedReimbursement.total_amount *
                                    allocation.allocation_ratio) /
                                  100
                                ).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* Attachments */}
              {selectedReimbursementDetails &&
                selectedReimbursementDetails.attachments.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">附件</Label>
                    <div className="space-y-2">
                      {selectedReimbursementDetails.attachments.map(
                        (attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="text-sm">
                              {attachment.file_name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const url = await getAttachmentDownloadUrl(
                                    attachment.file_path
                                  );
                                  if (url) {
                                    window.open(url, "_blank");
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑差旅费报销申请</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-applicant">申请人</Label>
                  <Input
                    id="edit-applicant"
                    value={
                      users.find((u) => u.id === formData.applicant_id)?.name ||
                      ""
                    }
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-department">关联部门</Label>
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
                      <SelectItem value="none">无</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-workflow">关联审批流程</Label>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700 font-medium">自动关联</span>
                    </div>
                    <span className="text-xs text-blue-600">
                      系统将自动关联business_trip_reimbursements审批流程
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-corporate-dimension"
                      checked={formData.is_corporate_dimension}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          is_corporate_dimension: checked,
                          team_id: checked ? "" : prev.team_id
                        }));
                      }}
                    />
                    <Label htmlFor="edit-corporate-dimension">
                      是否总商维度
                    </Label>
                  </div>
                </div>

                {!formData.is_corporate_dimension && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-team">费用归属项目</Label>
                    <Select
                      value={formData.team_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, team_id: value }))
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
              </div>

              <div>
                <Label htmlFor="edit-expense_reason">报销原因</Label>
                <Textarea
                  id="edit-expense_reason"
                  placeholder="例如：强制格式：**（姓名）报销到**（地名）出差费用"
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
            </div>

            {/* 分摊配置 */}
            {formData.is_corporate_dimension && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">分摊配置</h3>
                </div>

                {formData.allocations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    暂无分摊明细
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>默认比例</TableHead>
                          <TableHead>本次比例</TableHead>
                          <TableHead>分配金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.allocations.map((allocation, index) => {
                          const config = allocationConfigs.find(
                            (c) => c.team_id === allocation.team_id
                          );
                          const team = teams.find(
                            (t) => t.id === allocation.team_id
                          );
                          const allocationAmount =
                            (calculateTotalAmount() *
                              parseFloat(allocation.allocation_ratio || "0")) /
                            100;

                          return (
                            <TableRow key={index}>
                              <TableCell>{team?.name || "未知项目"}</TableCell>
                              <TableCell>
                                {config?.allocation_ratio || 0}%
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="w-20"
                                  value={allocation.allocation_ratio}
                                  onChange={(e) =>
                                    updateAllocation(
                                      index,
                                      "allocation_ratio",
                                      e.target.value
                                    )
                                  }
                                />
                                %
                              </TableCell>
                              <TableCell>
                                ¥{allocationAmount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="text-right">
                      <Label className="text-base font-medium">
                        分摊比例总和:{" "}
                        {formData.allocations
                          .reduce(
                            (sum, a) =>
                              sum + parseFloat(a.allocation_ratio || "0"),
                            0
                          )
                          .toFixed(2)}
                        %
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 报销明细 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">报销明细</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpenseDetail}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加明细
                </Button>
              </div>

              {formData.expense_details.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  暂无报销明细，请添加明细
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.expense_details.map((detail, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          明细 {index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpenseDetail(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>住宿费</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.accommodation_fee}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "accommodation_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>城际交通费</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.intercity_transport_fee}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "intercity_transport_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>市内交通费</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.local_transport_fee}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "local_transport_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>其他费用</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={detail.other_fees}
                            onChange={(e) =>
                              updateExpenseDetail(
                                index,
                                "other_fees",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>说明</Label>
                        <Textarea
                          placeholder="费用说明"
                          value={detail.description}
                          onChange={(e) =>
                            updateExpenseDetail(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 银行账户信息 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">银行账户信息</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBankAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加账户
                </Button>
              </div>

              {formData.bank_accounts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  暂无银行账户信息，请添加账户
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.bank_accounts.map((account, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          账户 {index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBankAccount(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>收款人账户名</Label>
                          <Input
                            placeholder="收款人姓名"
                            value={account.payee_account_name}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "payee_account_name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>银行账号</Label>
                          <Input
                            placeholder="银行账号"
                            value={account.bank_account}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "bank_account",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>银行名称</Label>
                          <Input
                            placeholder="银行名称"
                            value={account.bank_name}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "bank_name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>支付金额</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={account.payment_amount}
                            onChange={(e) =>
                              updateBankAccount(
                                index,
                                "payment_amount",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 金额信息 */}
            <div className="space-y-2 p-4 bg-blue-50 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">
                  报销明细合计:
                </span>
                <span className="text-lg font-bold text-blue-700">
                  ¥{calculateTotalAmount().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">
                  银行账户合计:
                </span>
                <span className="text-lg font-bold text-green-700">
                  ¥{calculateBankTotalAmount().toFixed(2)}
                </span>
              </div>
              {Math.abs(calculateTotalAmount() - calculateBankTotalAmount()) >
                0.01 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-700">
                    差额:
                  </span>
                  <span className="text-lg font-bold text-red-700">
                    ¥
                    {Math.abs(
                      calculateTotalAmount() - calculateBankTotalAmount()
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              {Math.abs(calculateTotalAmount() - calculateBankTotalAmount()) <=
                0.01 &&
                calculateTotalAmount() > 0 && (
                  <div className="text-center">
                    <span className="text-sm font-medium text-green-600">
                      ✓ 金额匹配
                    </span>
                  </div>
                )}
            </div>

            {/* 附件上传 */}
            <div className="space-y-4">
              <Label className="text-base font-medium">附件上传</Label>

              {/* 现有附件 */}
              {selectedReimbursementDetails &&
                selectedReimbursementDetails.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">现有附件:</Label>
                    {selectedReimbursementDetails.attachments.map(
                      (attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">
                              {attachment.file_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const url = await getAttachmentDownloadUrl(
                                  attachment.file_path
                                );
                                if (url) {
                                  window.open(url, "_blank");
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
                      )
                    )}
                  </div>
                )}

              {/* 新增附件 */}
              <div className="space-y-2">
                <Label>选择文件</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="cursor-pointer mt-1"
                />
                <p className="text-sm text-muted-foreground">
                  支持 PDF、Word、Excel、图片等格式，单个文件不超过 10MB
                </p>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">已选择的文件:</Label>
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleUpdate}>更新申请</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
