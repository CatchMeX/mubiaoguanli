import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  CheckCircle,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  DollarSign,
  UserCheck,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

// 待办任务类型定义
interface PendingTask {
  id: string;
  title: string;
  type: string;
  typeName: string;
  applicant: string;
  applicantAvatar?: string;
  department: string;
  submitTime: string;
  urgency: "high" | "normal" | "low";
  status: "pending" | "approved" | "rejected" | "completed" | "skipped";
  description: string;
  currentStep: string;
  nextApprover: string;
  taskId: string;
  instanceId: string;
  entityType: string;
  entityId: string;
}

// 表单字段配置 - 根据表单类型定义可用字段
const formFields = {
  financial_matters: [
    { value: "amount", label: "金额", type: "number" },
    { value: "applicant_id", label: "申请人", type: "users" },
    { value: "department_id", label: "部门", type: "departments" }
  ],
  payment_requests: [
    {
      value: "document_type",
      label: "单据类型",
      type: "select",
      options: [
        { value: "payment", label: "付款申请单" },
        { value: "loan", label: "借款申请单" }
      ]
    },
    { value: "applicant_id", label: "申请人", type: "users" },
    { value: "total_amount", label: "金额", type: "number" },
    { value: "department_id", label: "部门", type: "departments" },
    { value: "team_id", label: "关联团队", type: "teams" },
    { value: "company_id", label: "关联公司", type: "companies" }
  ],
  expense_reimbursements: [
    {
      value: "expense_category",
      label: "报销类别",
      type: "select",
      options: [
        { value: "loan_offset", label: "冲销借款" },
        { value: "expense_reimbursement", label: "费用报销" }
      ]
    },
    { value: "applicant_id", label: "申请人", type: "users" },
    { value: "department_id", label: "部门", type: "departments" },
    { value: "total_amount", label: "金额", type: "number" }
  ],
  business_trip_reimbursements: [
    { value: "applicant_id", label: "申请人", type: "users" },
    { value: "department_id", label: "部门", type: "departments" },
    { value: "total_amount", label: "总金额", type: "number" }
  ]
};

// 获取状态显示文本
const getTaskStatusText = (status: string) => {
  const statusMap = {
    pending: "待处理",
    approved: "已批准",
    rejected: "已拒绝",
    completed: "已完成",
    skipped: "已跳过"
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

// 获取状态颜色
const getTaskStatusColor = (status: string) => {
  const colorMap = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    skipped: "bg-gray-100 text-gray-800"
  };
  return (
    colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
  );
};

// 格式化字段值
const formatFieldValue = (field: any, value: any, entityData: any) => {
  if (value === null || value === undefined) return "-";

  switch (field.type) {
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "select":
      const option = field.options?.find((opt: any) => opt.value === value);
      return option ? option.label : value;
    case "users":
      // 通用处理用户关联字段
      if (field.value.endsWith("_id")) {
        const relationKey = field.value.replace("_id", "");
        const relatedUser = entityData[relationKey] || entityData.applicant; // 默认尝试 applicant
        if (relatedUser && relatedUser.name) {
          return `${relatedUser.name}${
            relatedUser.employee_id ? ` (${relatedUser.employee_id})` : ""
          }`;
        }
      }
      return value;
    case "departments":
      // 通用处理部门关联字段
      if (field.value.endsWith("_id")) {
        const relationKey = field.value.replace("_id", "");
        const relatedDept = entityData[relationKey] || entityData.department; // 默认尝试 department
        if (relatedDept && relatedDept.name) {
          return `${relatedDept.name}${
            relatedDept.code ? ` (${relatedDept.code})` : ""
          }`;
        }
      }
      return value;
    case "teams":
      // 通用处理团队关联字段
      if (field.value.endsWith("_id")) {
        const relationKey = field.value.replace("_id", "");
        const relatedTeam = entityData[relationKey] || entityData.team; // 默认尝试 team
        if (relatedTeam && relatedTeam.name) {
          return `${relatedTeam.name}${
            relatedTeam.code ? ` (${relatedTeam.code})` : ""
          }`;
        }
      }
      return value;
    case "companies":
      // 通用处理公司关联字段
      if (field.value.endsWith("_id")) {
        const relationKey = field.value.replace("_id", "");
        const relatedCompany = entityData[relationKey] || entityData.company; // 默认尝试 company
        if (relatedCompany && relatedCompany.name) {
          return `${relatedCompany.name}${
            relatedCompany.code ? ` (${relatedCompany.code})` : ""
          }`;
        }
      }
      return value;
    default:
      return value;
  }
};

// 详情弹窗组件
const WorkflowDetailsDialog = ({
  open,
  onOpenChange,
  details
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: any;
}) => {
  if (!details) return null;

  const entityFields =
    formFields[details.entity_type as keyof typeof formFields] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            工作流详情 - {details.workflow?.name}
          </DialogTitle>
          <DialogDescription>
            查看工作流实例的详细信息、业务数据和审批进度
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="space-y-6 p-1">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    工作流名称
                  </div>
                  <div>{details.workflow?.name || "-"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    当前状态
                  </div>
                  <Badge className={getTaskStatusColor(details.status)}>
                    {getTaskStatusText(details.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    发起人
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {details.initiated_by?.name || "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    发起时间
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {details.initiated_at
                      ? new Date(details.initiated_at).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 业务数据 */}
            {details.entityData && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    业务数据
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {entityFields.map((field) => (
                      <div key={field.value} className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          {field.label}
                        </div>
                        <div className="p-2 bg-muted rounded">
                          {formatFieldValue(
                            field,
                            details.entityData[field.value],
                            details.entityData
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 任务进度 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                任务进度
              </h3>
              <div className="space-y-4">
                {details.tasksByNode &&
                  Object.entries(details.tasksByNode).map(
                    ([nodeId, nodeTasks]: [string, any]) => (
                      <div key={nodeId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-lg">{nodeId}</div>
                          <Badge variant="outline">
                            {Array.isArray(nodeTasks) ? nodeTasks.length : 0}{" "}
                            个审批人
                          </Badge>
                        </div>

                        {/* 显示该节点的所有审批人 */}
                        <div className="space-y-3">
                          {Array.isArray(nodeTasks) &&
                            nodeTasks.map((task: any) => (
                              <div
                                key={task.id}
                                className="bg-muted rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">
                                      {task.assigned_to?.name || "未分配"}
                                    </span>
                                  </div>
                                  <Badge
                                    className={getTaskStatusColor(task.status)}
                                  >
                                    {getTaskStatusText(task.status)}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      分配时间:{" "}
                                      {task.assigned_at
                                        ? new Date(
                                            task.assigned_at
                                          ).toLocaleString()
                                        : "-"}
                                    </span>
                                  </div>
                                  {task.completed_by && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" />
                                        <span>
                                          完成人: {task.completed_by.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          完成时间:{" "}
                                          {task.completed_at
                                            ? new Date(
                                                task.completed_at
                                              ).toLocaleString()
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          审批决定:{" "}
                                          {task.decision === "approved"
                                            ? "批准"
                                            : task.decision === "rejected"
                                            ? "拒绝"
                                            : "-"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {task.comments && (
                                  <div className="mt-2 p-2 bg-background rounded text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="font-medium">备注</span>
                                    </div>
                                    {task.comments}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* 审批历史 */}
            {details.approvals && details.approvals.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    审批历史
                  </h3>
                  <div className="space-y-4">
                    {/* 按节点分组显示审批历史 */}
                    {Object.entries(
                      details.approvals.reduce((acc: any, approval: any) => {
                        if (!acc[approval.node_id]) {
                          acc[approval.node_id] = [];
                        }
                        acc[approval.node_id].push(approval);
                        return acc;
                      }, {})
                    ).map(([nodeId, nodeApprovals]: [string, any]) => (
                      <div key={nodeId} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <span>{nodeId}</span>
                          <Badge variant="outline">
                            {Array.isArray(nodeApprovals)
                              ? nodeApprovals.length
                              : 0}{" "}
                            条审批记录
                          </Badge>
                        </h4>
                        <div className="space-y-3">
                          {Array.isArray(nodeApprovals) &&
                            nodeApprovals.map((approval: any) => (
                              <div
                                key={approval.id}
                                className="bg-muted rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">
                                      {approval.approver?.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        approval.action === "approved"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }
                                    >
                                      {approval.action === "approved"
                                        ? "已批准"
                                        : approval.action === "rejected"
                                        ? "已拒绝"
                                        : approval.action}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(
                                        approval.approved_at
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                {approval.comments && (
                                  <div className="p-2 bg-background rounded text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="font-medium">
                                        审批意见
                                      </span>
                                    </div>
                                    {approval.comments}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const PendingList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [processedTasks, setProcessedTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [workflowInstanceDetails, setWorkflowInstanceDetails] =
    useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // 审批意见对话框状态
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [currentTask, setCurrentTask] = useState<PendingTask | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);

      if (!user) {
        toast({
          title: "用户信息不存在",
          description: "请先登录或检查用户信息",
          variant: "destructive"
        });
        return;
      }

      // 并行加载待办和已处理任务
      const [pendingData, processedData] = await Promise.all([
        api.workflow.getUserPendingTasks(user.id),
        api.workflow.getUserProcessedTasks(user.id)
      ]);

      // 转换待办任务数据
      const transformedPendingTasks = pendingData.map((task: any) => ({
        id: `${task.id}-${task.instance.id}`, // 使用task.id和instance.id组合确保唯一性
        title: getTaskTitle(task),
        type: task.instance.workflow?.form_type || "unknown",
        typeName: getTaskTypeName(task.instance.workflow?.form_type),
        applicant: task.instance.initiated_by?.name || "未知",
        applicantAvatar: "",
        department: getDepartmentFromData(task.instance.data),
        submitTime: formatDateTime(task.instance.initiated_at),
        urgency: getUrgencyFromData(task.instance.data),
        status: "pending" as const,
        description: getTaskDescription(task),
        currentStep: getCurrentStep(task),
        nextApprover: task.assigned_to?.name || "未知",
        taskId: task.id,
        instanceId: task.instance.id,
        entityType: task.instance.entity_type,
        entityId: task.instance.entity_id
      }));

      // 转换已处理任务数据
      const transformedProcessedTasks = processedData.map((task: any) => ({
        id: `${task.id}-${task.instance.id}`, // 使用task.id和instance.id组合确保唯一性
        title: getTaskTitle(task),
        type: task.instance.workflow?.form_type || "unknown",
        typeName: getTaskTypeName(task.instance.workflow?.form_type),
        applicant: task.instance.initiated_by?.name || "未知",
        applicantAvatar: "",
        department: getDepartmentFromData(task.instance.data),
        submitTime: formatDateTime(task.instance.initiated_at),
        urgency: getUrgencyFromData(task.instance.data),
        status: task.status as
          | "approved"
          | "rejected"
          | "completed"
          | "skipped",
        description: getTaskDescription(task),
        currentStep: getCurrentStep(task),
        nextApprover: task.assigned_to?.name || "未知",
        taskId: task.id,
        instanceId: task.instance.id,
        entityType: task.instance.entity_type,
        entityId: task.instance.entity_id
      }));

      setPendingTasks(transformedPendingTasks);
      setProcessedTasks(transformedProcessedTasks);
    } catch (error) {
      console.error("加载待办数据失败:", error);
      toast({
        title: "加载数据失败",
        description: "无法加载待办申请列表",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取任务标题
  const getTaskTitle = (task: any): string => {
    const entityType = task.instance.entity_type;
    const data = task.instance.data || {};

    switch (entityType) {
      case "expense_reimbursement":
        return `${data.applicant_name || "未知"}的费用报销申请`;
      case "payment_request":
        return `${data.applicant_name || "未知"}的付款申请`;
      case "financial_matter":
        return `${data.applicant_name || "未知"}的财务事项申请`;
      case "business_trip_reimbursement":
        return `${data.applicant_name || "未知"}的差旅报销申请`;
      default:
        return `${
          task.instance.initiated_by?.name || "未知"
        }的${getTaskTypeName(task.instance.workflow?.form_type)}`;
    }
  };

  // 获取任务类型名称
  const getTaskTypeName = (formType: string): string => {
    switch (formType) {
      case "expense":
        return "费用报销";
      case "payment":
        return "付款申请";
      case "financial":
        return "财务事项";
      case "purchase":
        return "采购申请";
      case "revenue":
        return "收入确认";
      case "cost":
        return "成本管理";
      case "transaction":
        return "往来管理";
      case "inventory":
        return "出入库管理";
      default:
        return "审批申请";
    }
  };

  // 从数据中获取部门信息
  const getDepartmentFromData = (data: any): string => {
    if (!data) return "未知部门";
    return data.department || data.department_name || "未知部门";
  };

  // 从数据中获取紧急程度
  const getUrgencyFromData = (data: any): "high" | "normal" | "low" => {
    if (!data) return "normal";
    return data.urgency || "normal";
  };

  // 获取任务描述
  const getTaskDescription = (task: any): string => {
    const data = task.instance.data || {};
    const entityType = task.instance.entity_type;

    switch (entityType) {
      case "expense_reimbursement":
        return data.expense_reason || "费用报销申请";
      case "payment_request":
        return data.payment_reason || "付款申请";
      case "financial_matter":
        return data.matter_description || "财务事项申请";
      case "business_trip_reimbursement":
        return data.expense_reason || "差旅报销申请";
      default:
        return "审批申请";
    }
  };

  // 获取当前步骤
  const getCurrentStep = (task: any): string => {
    const nodeId = task.node_id;
    const workflowName = task.instance.workflow?.name || "审批流程";

    switch (nodeId) {
      case "finance":
        return "财务审批";
      case "manager":
        return "主管审批";
      case "hr":
        return "HR审批";
      case "leader":
        return "领导审批";
      default:
        return `${workflowName}审批`;
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "未知时间";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "destructive";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "紧急";
      case "normal":
        return "普通";
      case "low":
        return "低";
      default:
        return "普通";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "expense":
        return "bg-orange-100 text-orange-800";
      case "payment":
        return "bg-blue-100 text-blue-800";
      case "financial":
        return "bg-purple-100 text-purple-800";
      case "purchase":
        return "bg-green-100 text-green-800";
      case "revenue":
        return "bg-emerald-100 text-emerald-800";
      case "cost":
        return "bg-red-100 text-red-800";
      case "transaction":
        return "bg-indigo-100 text-indigo-800";
      case "inventory":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "skipped":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "已批准";
      case "rejected":
        return "已拒绝";
      case "completed":
        return "已完成";
      case "skipped":
        return "已跳过";
      default:
        return "未知状态";
    }
  };

  const filteredPendingItems = pendingTasks.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applicant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesUrgency =
      filterUrgency === "all" || item.urgency === filterUrgency;

    return matchesSearch && matchesType && matchesUrgency;
  });

  const filteredProcessedItems = processedTasks.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applicant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesUrgency =
      filterUrgency === "all" || item.urgency === filterUrgency;

    return matchesSearch && matchesType && matchesUrgency;
  });

  const handleApprove = async (task: PendingTask) => {
    setCurrentTask(task);
    setApprovalComments("");
    setApprovalDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!user || !currentTask) {
      toast({
        title: "用户信息不存在",
        description: "请先登录或检查用户信息",
        variant: "destructive"
      });
      return;
    }

    if (!approvalComments.trim()) {
      toast({
        title: "请填写审批意见",
        description: "批准时必须填写审批意见",
        variant: "destructive"
      });
      return;
    }

    try {
      setApprovalLoading(true);
      
      // 调用后端审批接口
      const response = await fetch(
        "https://database.fedin.cn/functions/v1/goal-management/approveTask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            taskId: currentTask.taskId,
            decision: "approved",
            comments: approvalComments.trim(),
            approverId: user.id
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: `已批准 - ${result.message || "操作成功"}`,
          description: "申请已批准"
        });
        setApprovalDialogOpen(false);
        setApprovalComments("");
        setCurrentTask(null);
        loadData(); // 重新加载数据
      } else {
        toast({
          title: `操作失败: ${result.message}`,
          description: "申请批准失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批准失败:", error);
      toast({
        title: "操作失败",
        description: "申请批准失败",
        variant: "destructive"
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleReject = async (task: PendingTask) => {
    setCurrentTask(task);
    setRejectionComments("");
    setRejectionDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!user || !currentTask) {
      toast({
        title: "用户信息不存在",
        description: "请先登录或检查用户信息",
        variant: "destructive"
      });
      return;
    }

    if (!rejectionComments.trim()) {
      toast({
        title: "请填写审批意见",
        description: "驳回时必须填写审批意见",
        variant: "destructive"
      });
      return;
    }

    try {
      setApprovalLoading(true);
      
      // 调用后端审批接口
      const response = await fetch(
        "https://database.fedin.cn/functions/v1/goal-management/approveTask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            taskId: currentTask.taskId,
            decision: "rejected",
            comments: rejectionComments.trim(),
            approverId: user.id
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: `已拒绝 - ${result.data?.message || "操作成功"}`,
          description: "申请已拒绝",
          variant: "destructive"
        });
        setRejectionDialogOpen(false);
        setRejectionComments("");
        setCurrentTask(null);
        loadData(); // 重新加载数据
      } else {
        toast({
          title: `操作失败: ${result.message}`,
          description: "申请拒绝失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("拒绝失败:", error);
      toast({
        title: "操作失败",
        description: "申请拒绝失败",
        variant: "destructive"
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleView = async (task: PendingTask) => {
    try {
      const details = await api.workflow.getWorkflowInstanceDetails(
        task.instanceId
      );
      setWorkflowInstanceDetails(details);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error("获取详情失败:", error);
      toast({
        title: "获取详情失败",
        description: "无法加载申请详情",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">待办列表</h1>
          <p className="text-muted-foreground mt-2">管理和处理待审批的申请</p>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索申请标题或申请人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="申请类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="expense">费用报销</SelectItem>
                <SelectItem value="payment">付款申请</SelectItem>
                <SelectItem value="financial">财务事项</SelectItem>
                <SelectItem value="purchase">采购申请</SelectItem>
                <SelectItem value="revenue">收入确认</SelectItem>
                <SelectItem value="cost">成本管理</SelectItem>
                <SelectItem value="transaction">往来管理</SelectItem>
                <SelectItem value="inventory">出入库管理</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="紧急程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="high">紧急</SelectItem>
                <SelectItem value="normal">普通</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 待办列表 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            待处理 ({filteredPendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            已处理 ({filteredProcessedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredPendingItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  暂无待处理申请
                </h3>
                <p className="text-sm text-muted-foreground">
                  所有申请都已处理完成
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPendingItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <Badge className={getTypeColor(item.type)}>
                          {item.typeName}
                        </Badge>
                        <Badge variant={getUrgencyColor(item.urgency)}>
                          {getUrgencyText(item.urgency)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            申请人：{item.applicant} ({item.department})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>提交时间：{item.submitTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>当前步骤：{item.currentStep}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(item)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        查看
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(item)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        拒绝
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item)}
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        批准
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {filteredProcessedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  暂无已处理申请
                </h3>
                <p className="text-sm text-muted-foreground">
                  这里将显示已处理的申请记录
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProcessedItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <Badge className={getTypeColor(item.type)}>
                          {item.typeName}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            申请人：{item.applicant} ({item.department})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>提交时间：{item.submitTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>处理步骤：{item.currentStep}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(item)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        查看
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 详情弹窗 */}
      <WorkflowDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        details={workflowInstanceDetails}
      />

      {/* 批准意见对话框 */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              批准申请
            </DialogTitle>
            <DialogDescription>
              请填写批准意见，意见将保存到审批记录中
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-comments">审批意见</Label>
              <Textarea
                id="approval-comments"
                placeholder="请输入批准意见..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setApprovalDialogOpen(false);
                  setApprovalComments("");
                  setCurrentTask(null);
                }}
                disabled={approvalLoading}
              >
                取消
              </Button>
              <Button
                onClick={handleApproveSubmit}
                disabled={approvalLoading || !approvalComments.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {approvalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    确认批准
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 驳回意见对话框 */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              驳回申请
            </DialogTitle>
            <DialogDescription>
              请填写驳回意见，意见将保存到审批记录中
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-comments">审批意见</Label>
              <Textarea
                id="rejection-comments"
                placeholder="请输入驳回意见..."
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectionDialogOpen(false);
                  setRejectionComments("");
                  setCurrentTask(null);
                }}
                disabled={approvalLoading}
              >
                取消
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={approvalLoading || !rejectionComments.trim()}
                variant="destructive"
              >
                {approvalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    确认驳回
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingList;
