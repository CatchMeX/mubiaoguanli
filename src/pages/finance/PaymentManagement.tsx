import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { paymentAPI } from "../../services/paymentAPI";
import api from "../../services/api";
import workflowInstanceAPI from "@/services/workflowInstanceApi";

import { Department, Team, User, WorkflowInstance } from "../../types";
import {
  PaymentRequest,
  PaymentRequestFormData,
  PaymentBankAccountFormData,
  PaymentRequestAttachment,
  Company
} from "../../types/payment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useToast } from "../../hooks/use-toast";
import { DeleteButton } from "../../components/ui/delete-confirm-dialog";
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
  Settings,
  CreditCard,
  X,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import PaymentRequestPDFExport from "@/components/PaymentRequestPDFExport";

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


const PaymentManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // 状态管理
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
    null
  );

  // 表单数据
  const [formData, setFormData] = useState<PaymentRequestFormData>({
    document_type: "payment",
    payment_reason: "",
    total_amount: "",
    team_id: "",
    department_id: "",
    company_id: "",
    approval_workflow_id: "",
    bank_accounts: [],
    attachments: []
  });

  // 银行账户信息
  const [bankAccounts, setBankAccounts] = useState<
    PaymentBankAccountFormData[]
  >([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    PaymentRequestAttachment[]
  >([]);

  // 筛选条件
  const [filters, setFilters] = useState({
    status: "all",
    department_id: "all",
    document_type: "all",
    applicant_id: "all",
    search: ""
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        requestsData,
        departmentsData,
        teamsData,
        usersData,
        companiesData,
        workflowsData
      ] = await Promise.all([
        paymentAPI.getPaymentRequests(),
        api.department.getAll(),
        api.team.getAll(),
        api.user.getAll(),
        paymentAPI.getCompanies(),
        api.workflow.getWorkflowsWithDetails()
      ]);

      console.log("📊 加载的数据:", {
        requests: requestsData?.length || 0,
        departments: departmentsData?.length || 0,
        teams: teamsData?.length || 0,
        users: usersData?.length || 0,
        companies: companiesData?.length || 0,
        workflows: workflowsData?.length || 0
      });

      if (requestsData && requestsData.length > 0) {
        console.log("📋 第一条申请单数据:", requestsData[0]);
        console.log("🔍 关联数据查找测试:");
        console.log("  - 部门ID:", requestsData[0].department_id);
        console.log(
          "  - 找到的部门:",
          departmentsData.find((d) => d.id === requestsData[0].department_id)
        );
        console.log("  - 团队ID:", requestsData[0].team_id);
        console.log(
          "  - 找到的团队:",
          teamsData.find((t) => t.id === requestsData[0].team_id)
        );
        console.log("  - 公司ID:", requestsData[0].company_id);
        console.log(
          "  - 找到的公司:",
          companiesData.find((c) => c.id === requestsData[0].company_id)
        );
      }

      // 为每个付款申请获取工作流实例状态
      const requestsWithWorkflowStatus = await Promise.all(
        (requestsData || []).map(async (request) => {
          try {
            const workflowInstance = await api.workflow.getWorkflowInstanceByEntity('payment_requests', request.id);
            return {
              ...request,
              workflowStatus: workflowInstance?.status || 'running'
            };
          } catch (error) {
            console.error(`获取付款申请 ${request.id} 的工作流状态失败:`, error);
            return {
              ...request,
              workflowStatus: 'running'
            };
          }
        })
      );

      setPaymentRequests(requestsWithWorkflowStatus);
      setDepartments(departmentsData);
      setTeams(teamsData);
      setUsers(usersData);
      setCompanies(companiesData);
      setWorkflowTemplates(workflowsData);
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
      document_type: "payment",
      payment_reason: "",
      total_amount: "",
      team_id: "",
      department_id: "",
      company_id: "",
      approval_workflow_id: "",
      bank_accounts: [],
      attachments: []
    });
    setBankAccounts([]);
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

  // 创建申请单
  const handleCreate = async () => {
    try {
      if (
        !formData.payment_reason ||
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

      // 验证银行账户金额总和
      if (bankAccounts.length > 0) {
        const totalBankAmount = bankAccounts.reduce(
          (sum, account) => sum + account.payment_amount,
          0
        );
        const requestAmount = Number(formData.total_amount);
        if (Math.abs(totalBankAmount - requestAmount) > 0.01) {
          toast({
            title: "金额不匹配",
            description: "银行账户金额总和必须等于申请单金额",
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

      // 自动查找payment_requests的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId) {
        try {
          const paymentRequestsWorkflows = await api.workflow.getWorkflowsByFormType('payment_requests');
          if (paymentRequestsWorkflows && paymentRequestsWorkflows.length > 0) {
            // 取第一个激活的payment_requests工作流
            approvalWorkflowId = paymentRequestsWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找payment_requests审批流程失败:', workflowError);
        }
      }

      // 创建申请单
      const requestData = {
        document_type: formData.document_type,
        payment_reason: formData.payment_reason,
        total_amount: Number(formData.total_amount),
        team_id: formData.team_id || undefined,
        department_id: formData.department_id,
        company_id: formData.company_id || undefined,
        approval_workflow_id: approvalWorkflowId || undefined,
        applicant_id: user.id,
        created_by: user.id
      };

      const newRequest = await paymentAPI.createPaymentRequest(requestData);

      if (approvalWorkflowId) {
        await workflowInstanceAPI.createWorkflowInstance({
          entity_type: "payment_requests",
          entity_id: newRequest.id,
          applicantId: user.id,
          approval_workflow_id: approvalWorkflowId,
          data: { ...requestData }
        });
      }

      // 创建银行账户记录
      if (bankAccounts.length > 0) {
        await paymentAPI.createBankAccounts(newRequest.id, bankAccounts);
      }

      // 上传附件
      if (selectedFiles.length > 0) {
        try {
          console.log("📤 开始上传附件，文件数量:", selectedFiles.length);
          for (const file of selectedFiles) {
            console.log("📤 上传文件:", file.name, "大小:", file.size);
            const attachment = await paymentAPI.uploadAttachment(
              newRequest.id,
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
      await paymentAPI.deletePaymentRequest(id);
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
  const handleView = async (request: PaymentRequest) => {
    try {
      // 加载完整的申请单详情，包括银行账户和附件
      const fullRequest = await paymentAPI.getPaymentRequestById(request.id);

      if (fullRequest) {
        // 加载银行账户信息
        const bankAccounts = await paymentAPI.getBankAccounts(request.id);
        fullRequest.bank_accounts = bankAccounts;

        // 加载附件信息
        const attachments = await paymentAPI.getAttachments(request.id);
        fullRequest.attachments = attachments;

        setSelectedRequest(fullRequest);
      } else {
        setSelectedRequest(request);
      }

      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("加载申请单详情失败:", error);
      // 如果加载失败，使用原始数据
      setSelectedRequest(request);
      setIsViewDialogOpen(true);
    }
  };

  // 编辑申请单
  const handleEdit = async (request: PaymentRequest) => {
    try {
      // 加载完整的申请单详情，包括银行账户和附件
      const fullRequest = await paymentAPI.getPaymentRequestById(request.id);

      if (fullRequest) {
        // 加载银行账户信息
        const bankAccounts = await paymentAPI.getBankAccounts(request.id);
        fullRequest.bank_accounts = bankAccounts;

        // 加载附件信息
        const attachments = await paymentAPI.getAttachments(request.id);
        fullRequest.attachments = attachments;

        setSelectedRequest(fullRequest);

        // 设置表单数据
        setFormData({
          document_type: fullRequest.document_type,
          payment_reason: fullRequest.payment_reason,
          total_amount: fullRequest.total_amount.toString(),
          team_id: fullRequest.team_id || "",
          department_id: fullRequest.department_id,
          company_id: fullRequest.company_id || "",
          approval_workflow_id: fullRequest.approval_workflow_id || "",
          bank_accounts: [],
          attachments: []
        });

        // 设置银行账户信息
        if (bankAccounts && bankAccounts.length > 0) {
          const editBankAccounts = bankAccounts.map((account) => ({
            account_holder_name: account.account_holder_name,
            bank_account: account.bank_account,
            bank_name: account.bank_name,
            payment_amount: account.payment_amount,
            sort_order: account.sort_order
          }));
          setBankAccounts(editBankAccounts);
        } else {
          setBankAccounts([]);
        }

        // 设置附件信息
        setExistingAttachments(attachments || []);
        setSelectedFiles([]);
        console.log("📎 加载现有附件:", attachments);
      } else {
        // 如果加载失败，使用原始数据
        setSelectedRequest(request);
        setFormData({
          document_type: request.document_type,
          payment_reason: request.payment_reason,
          total_amount: request.total_amount.toString(),
          team_id: request.team_id || "",
          department_id: request.department_id,
          company_id: request.company_id || "",
          approval_workflow_id: request.approval_workflow_id || "",
          bank_accounts: [],
          attachments: []
        });
        setBankAccounts([]);
        setExistingAttachments([]);
        setSelectedFiles([]);
      }

      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("加载申请单详情失败:", error);
      // 如果加载失败，使用原始数据
      setSelectedRequest(request);
      setFormData({
        document_type: request.document_type,
        payment_reason: request.payment_reason,
        total_amount: request.total_amount.toString(),
        team_id: request.team_id || "",
        department_id: request.department_id,
        company_id: request.company_id || "",
        approval_workflow_id: request.approval_workflow_id || "",
        bank_accounts: [],
        attachments: []
      });
      setBankAccounts([]);
      setExistingAttachments([]);
      setSelectedFiles([]);
      setIsEditDialogOpen(true);
    }
  };

  // 更新申请单
  const handleUpdate = async () => {
    try {
      if (
        !formData.payment_reason ||
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

      // 验证银行账户金额总和
      if (bankAccounts.length > 0) {
        const totalBankAmount = bankAccounts.reduce(
          (sum, account) => sum + account.payment_amount,
          0
        );
        const requestAmount = Number(formData.total_amount);
        if (Math.abs(totalBankAmount - requestAmount) > 0.01) {
          toast({
            title: "金额不匹配",
            description: "银行账户金额总和必须等于申请单金额",
            variant: "destructive"
          });
          return;
        }
      }

      if (!user?.id || !selectedRequest) {
        toast({
          title: "错误",
          description: "用户信息或申请单信息获取失败",
          variant: "destructive"
        });
        return;
      }

      // 自动查找payment_requests的审批流程
      let approvalWorkflowId = formData.approval_workflow_id;
      if (!approvalWorkflowId) {
        try {
          const paymentRequestsWorkflows = await api.workflow.getWorkflowsByFormType('payment_requests');
          if (paymentRequestsWorkflows && paymentRequestsWorkflows.length > 0) {
            // 取第一个激活的payment_requests工作流
            approvalWorkflowId = paymentRequestsWorkflows[0].id;
            console.log('自动关联审批流程:', approvalWorkflowId);
          }
        } catch (workflowError) {
          console.error('查找payment_requests审批流程失败:', workflowError);
        }
      }

      // 更新申请单
      const requestData = {
        document_type: formData.document_type,
        payment_reason: formData.payment_reason,
        total_amount: Number(formData.total_amount),
        team_id: formData.team_id || undefined,
        department_id: formData.department_id,
        company_id: formData.company_id || undefined,
        approval_workflow_id: approvalWorkflowId || undefined,
        updated_by: user.id
      };

      await paymentAPI.updatePaymentRequest(selectedRequest.id, requestData);

      // 更新银行账户记录
      if (bankAccounts.length > 0) {
        // 先删除原有的银行账户记录
        const existingAccounts = await paymentAPI.getBankAccounts(
          selectedRequest.id
        );
        for (const account of existingAccounts) {
          await paymentAPI.deleteBankAccount(account.id);
        }

        // 创建新的银行账户记录
        await paymentAPI.createBankAccounts(selectedRequest.id, bankAccounts);
      }

      // 上传新附件
      if (selectedFiles.length > 0) {
        try {
          console.log("📤 开始上传新附件，文件数量:", selectedFiles.length);
          for (const file of selectedFiles) {
            console.log("📤 上传文件:", file.name, "大小:", file.size);
            const attachment = await paymentAPI.uploadAttachment(
              selectedRequest.id,
              file,
              user.id
            );
            console.log("✅ 附件上传成功:", attachment);
          }
        } catch (uploadError: any) {
          console.error("❌ 附件上传失败:", uploadError);
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

  // 添加银行账户
  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        account_holder_name: "",
        bank_account: "",
        bank_name: "",
        payment_amount: 0,
        sort_order: bankAccounts.length
      }
    ]);
  };

  // 更新银行账户
  const updateBankAccount = (
    index: number,
    field: keyof PaymentBankAccountFormData,
    value: any
  ) => {
    const updatedAccounts = [...bankAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setBankAccounts(updatedAccounts);
  };

  // 删除银行账户
  const removeBankAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  // 文件上传处理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log("📁 文件选择事件触发，文件数量:", files.length);
    console.log(
      "📁 选择的文件:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
    setSelectedFiles([...selectedFiles, ...files]);
  };

  // 删除文件
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // 删除现有附件
  const removeExistingAttachment = async (attachmentId: string) => {
    try {
      await paymentAPI.deleteAttachment(attachmentId);
      setExistingAttachments(
        existingAttachments.filter((att) => att.id !== attachmentId)
      );
      toast({
        title: "删除成功",
        description: "附件已成功删除"
      });
    } catch (error) {
      console.error("❌ 删除附件失败:", error);
      toast({
        title: "删除失败",
        description: "删除附件时发生错误",
        variant: "destructive"
      });
    }
  };

  // 筛选数据
  const filteredRequests = paymentRequests.filter((request) => {
    // 状态筛选 - 使用工作流实例状态
    if (
      filters.status &&
      filters.status !== "all" &&
      request.workflowStatus !== filters.status
    )
      return false;
    if (
      filters.department_id &&
      filters.department_id !== "all" &&
      request.department_id !== filters.department_id
    )
      return false;
    if (
      filters.document_type &&
      filters.document_type !== "all" &&
      request.document_type !== filters.document_type
    )
      return false;
    if (
      filters.applicant_id &&
      filters.applicant_id !== "all" &&
      request.applicant_id !== filters.applicant_id
    )
      return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        request.request_number.toLowerCase().includes(searchLower) ||
        request.payment_reason.toLowerCase().includes(searchLower) ||
        (request.applicant?.name &&
          request.applicant.name.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">付款/借款管理</h1>
          <p className="text-muted-foreground">管理付款申请单和借款申请单</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsCompanySettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            公司设置
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建申请单
          </Button>
        </div>
      </div>



      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                placeholder="搜索申请单号、付款事由..."
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
              <Label htmlFor="document-type-filter">单据类型</Label>
              <Select
                value={filters.document_type || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, document_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="payment">付款申请单</SelectItem>
                  <SelectItem value="loan">借款申请单</SelectItem>
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
                    document_type: "all",
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
          <CardDescription>共 {paymentRequests.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请单号</TableHead>
                <TableHead>单据类型</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>付款事由</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>项目</TableHead>
                <TableHead>公司</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.request_number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.document_type === "payment"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {request.document_type === "payment"
                          ? "付款申请单"
                          : "借款申请单"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {request.applicant?.name ||
                            users.find((u) => u.id === request.applicant_id)
                              ?.name ||
                            "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={request.payment_reason}>
                        {request.payment_reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ¥{request.total_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {departments.find(
                            (d) => d.id === request.department_id
                          )?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>
                        {teams.find((t) => t.id === request.team_id)?.name ||
                          "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span>
                        {companies.find((c) => c.id === request.company_id)
                          ?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusWithProgress 
                        entityType="payment_requests"
                        entityId={request.id}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(request)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <PaymentRequestPDFExport
                          request={request}
                          onExport={async () => {
                            try {
                              const [bankAccounts, attachments, workflowInstance] = await Promise.all([
                                paymentAPI.getBankAccounts(request.id),
                                paymentAPI.getAttachments(request.id),
                                api.workflow.getWorkflowInstanceByEntity('payment_requests', request.id)
                              ]);
                              
                              return {
                                bankAccounts,
                                attachments,
                                workflowInstance: workflowInstance ? await api.workflow.getWorkflowInstanceDetails(workflowInstance.id) : undefined
                              };
                            } catch (error) {
                              console.error('获取PDF导出数据失败:', error);
                              return {
                                bankAccounts: [],
                                attachments: [],
                                workflowInstance: undefined
                              };
                            }
                          }}
                        />
                        <DeleteButton
                          onConfirm={() => handleDelete(request.id)}
                          itemName={`申请单 - ${request.payment_reason}`}
                          title="删除申请单"
                          description={`确定要删除"${request.payment_reason}"吗？删除后无法恢复。`}
                          variant="ghost"
                          size="sm"
                        />
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
              创建新的付款申请单或借款申请单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="document-type">单据类型 *</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      document_type: value as "payment" | "loan"
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择单据类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">付款申请单</SelectItem>
                    <SelectItem value="loan">借款申请单</SelectItem>
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
            </div>

            <div>
              <Label htmlFor="payment-reason">付款事由 *</Label>
              <Textarea
                id="payment-reason"
                placeholder="宝山公司申请支付xx款项/费用"
                value={formData.payment_reason}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_reason: e.target.value
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="department">所在部门 *</Label>
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

              <div>
                <Label htmlFor="team">关联项目</Label>
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

              <div>
                <Label htmlFor="company">关联公司</Label>
                <Select
                  value={formData.company_id || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      company_id: value === "none" ? "" : value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公司" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="workflow">关联审批流程</Label>
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-700 font-medium">自动关联</span>
                </div>
                <span className="text-xs text-blue-600">
                  系统将自动关联payment_requests审批流程
                </span>
              </div>
            </div>

            {/* 银行账户信息 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-blue-600">
                    银行信息
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBankAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加银行账户
                </Button>
              </div>

              {bankAccounts.length > 0 && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>收款人开户名</TableHead>
                        <TableHead>银行账号</TableHead>
                        <TableHead>开户银行</TableHead>
                        <TableHead>支付金额</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankAccounts.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={account.account_holder_name}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "account_holder_name",
                                  e.target.value
                                )
                              }
                              placeholder="收款人姓名"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={account.bank_account}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "bank_account",
                                  e.target.value
                                )
                              }
                              placeholder="银行账号"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={account.bank_name}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "bank_name",
                                  e.target.value
                                )
                              }
                              placeholder="开户银行"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={account.payment_amount}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "payment_amount",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBankAccount(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      银行账户金额总和: ¥
                      {bankAccounts
                        .reduce(
                          (sum, account) => sum + account.payment_amount,
                          0
                        )
                        .toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      申请单金额: ¥
                      {Number(formData.total_amount || 0).toLocaleString()}
                    </span>
                  </div>

                  {bankAccounts.length > 0 &&
                    Math.abs(
                      bankAccounts.reduce(
                        (sum, account) => sum + account.payment_amount,
                        0
                      ) - Number(formData.total_amount || 0)
                    ) > 0.01 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          银行账户金额总和必须等于申请单金额
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}
            </div>

            {/* 附件上传 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-600">附件</h3>
              </div>

              <div className="space-y-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{file.name}</span>
                        <Button
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreate}>创建申请单</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑申请单对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑申请单</DialogTitle>
            <DialogDescription>
              修改付款申请单或借款申请单信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-document-type">单据类型 *</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      document_type: value as "payment" | "loan"
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择单据类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">付款申请单</SelectItem>
                    <SelectItem value="loan">借款申请单</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div>
              <Label htmlFor="edit-payment-reason">付款事由 *</Label>
              <Textarea
                id="edit-payment-reason"
                placeholder="宝山公司申请支付xx款项/费用"
                value={formData.payment_reason}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_reason: e.target.value
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-department">所在部门 *</Label>
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

              <div>
                <Label htmlFor="edit-team">关联项目</Label>
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

              <div>
                <Label htmlFor="edit-company">关联公司</Label>
                <Select
                  value={formData.company_id || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      company_id: value === "none" ? "" : value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公司" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-workflow">关联审批流程</Label>
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-700 font-medium">自动关联</span>
                </div>
                <span className="text-xs text-blue-600">
                  系统将自动关联payment_requests审批流程
                </span>
              </div>
            </div>

            {/* 银行账户信息 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-blue-600">
                    银行信息
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBankAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加银行账户
                </Button>
              </div>

              {bankAccounts.length > 0 && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>收款人开户名</TableHead>
                        <TableHead>银行账号</TableHead>
                        <TableHead>开户银行</TableHead>
                        <TableHead>支付金额</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankAccounts.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={account.account_holder_name}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "account_holder_name",
                                  e.target.value
                                )
                              }
                              placeholder="收款人姓名"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={account.bank_account}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "bank_account",
                                  e.target.value
                                )
                              }
                              placeholder="银行账号"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={account.bank_name}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "bank_name",
                                  e.target.value
                                )
                              }
                              placeholder="开户银行"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={account.payment_amount}
                              onChange={(e) =>
                                updateBankAccount(
                                  index,
                                  "payment_amount",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBankAccount(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      银行账户金额总和: ¥
                      {bankAccounts
                        .reduce(
                          (sum, account) => sum + account.payment_amount,
                          0
                        )
                        .toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      申请单金额: ¥
                      {Number(formData.total_amount || 0).toLocaleString()}
                    </span>
                  </div>

                  {bankAccounts.length > 0 &&
                    Math.abs(
                      bankAccounts.reduce(
                        (sum, account) => sum + account.payment_amount,
                        0
                      ) - Number(formData.total_amount || 0)
                    ) > 0.01 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          银行账户金额总和必须等于申请单金额
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}
            </div>

            {/* 附件信息 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-600">附件</h3>
              </div>

              {/* 现有附件 */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <Label>现有附件</Label>
                  {existingAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
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
                              const downloadUrl =
                                await paymentAPI.getAttachmentDownloadUrl(
                                  attachment.file_path
                                );
                              window.open(downloadUrl, "_blank");
                            } catch (error) {
                              console.error("下载失败:", error);
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
              )}

              {/* 上传新附件 */}
              <div className="space-y-2">
                <Label>上传新附件</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{file.name}</span>
                        <Button
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleUpdate}>更新申请单</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看申请单对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申请单详情</DialogTitle>
            <DialogDescription>
              查看付款申请单或借款申请单的详细信息
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>申请单号</Label>
                  <div className="text-sm font-medium">
                    {selectedRequest.request_number}
                  </div>
                </div>
                <div>
                  <Label>单据类型</Label>
                  <div className="text-sm">
                    <Badge
                      variant={
                        selectedRequest.document_type === "payment"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedRequest.document_type === "payment"
                        ? "付款申请单"
                        : "借款申请单"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>金额</Label>
                  <div className="text-sm font-medium">
                    ¥{selectedRequest.total_amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label>状态</Label>
                  <div className="text-sm">
                    <StatusWithProgress 
                      entityType="payment_requests"
                      entityId={selectedRequest.id}
                    />
                  </div>
                </div>
                <div>
                  <Label>申请人</Label>
                  <div className="text-sm">
                    {selectedRequest.applicant?.name ||
                      users.find((u) => u.id === selectedRequest.applicant_id)
                        ?.name ||
                      "-"}
                  </div>
                </div>
                <div>
                  <Label>创建时间</Label>
                  <div className="text-sm">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <Label>付款事由</Label>
                <div className="text-sm whitespace-pre-wrap">
                  {selectedRequest.payment_reason}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>所在部门</Label>
                  <div className="text-sm">
                    {departments.find(
                      (d) => d.id === selectedRequest.department_id
                    )?.name || "-"}
                  </div>
                </div>
                <div>
                  <Label>关联项目</Label>
                  <div className="text-sm">
                    {teams.find((t) => t.id === selectedRequest.team_id)
                      ?.name || "-"}
                  </div>
                </div>
                <div>
                  <Label>关联公司</Label>
                  <div className="text-sm">
                    {companies.find((c) => c.id === selectedRequest.company_id)
                      ?.name || "-"}
                  </div>
                </div>
              </div>

              {/* 银行账户信息 */}
              {selectedRequest.bank_accounts &&
                selectedRequest.bank_accounts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-blue-600">
                        银行信息
                      </h3>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>收款人开户名</TableHead>
                          <TableHead>银行账号</TableHead>
                          <TableHead>开户银行</TableHead>
                          <TableHead>支付金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.bank_accounts.map((account, index) => (
                          <TableRow key={index}>
                            <TableCell>{account.account_holder_name}</TableCell>
                            <TableCell>{account.bank_account}</TableCell>
                            <TableCell>{account.bank_name}</TableCell>
                            <TableCell>
                              ¥{account.payment_amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* 附件信息 */}
              {selectedRequest.attachments &&
                selectedRequest.attachments.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-blue-600">
                        附件
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {selectedRequest.attachments.map((attachment, index) => (
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
                                  await paymentAPI.getAttachmentDownloadUrl(
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
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 公司设置对话框 */}
      <Dialog
        open={isCompanySettingsOpen}
        onOpenChange={setIsCompanySettingsOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>公司管理</DialogTitle>
            <DialogDescription>管理关联公司信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">公司列表</h3>
              <Button
                variant="outline"
                onClick={() => {
                  // 这里可以添加新建公司的逻辑
                  toast({
                    title: "功能开发中",
                    description: "新建公司功能正在开发中"
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                新建公司
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>{company.description || "-"}</TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompanySettingsOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
