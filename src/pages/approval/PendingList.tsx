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
  MessageSquare,
  Download,
  XCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import FinancialMatterDetailDialog from "@/components/FinancialMatterDetailDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import React from "react"; // Added missing import for React

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
  node_id: string; // 添加node_id字段
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
            {details.entity_type === 'payment_requests' ? '付款/借款详情' : '工作流详情 - ' + (details.workflow?.name || '')}
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
            </div>

            

            {/* 业务数据 */}
            {details.entityData && (
              <>
                <div className="space-y-4">
                 
                  
                  {/* 付款/借款单据专门显示 */}
                  {details.entity_type === 'payment_requests' ? (
                    <div className="space-y-6">
                      {/* 调试信息 */}
                      {console.log('Payment Request Details:', details)}

                      {/* 基本信息 */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">申请单号</div>
                            <div>{details.entityData.request_number || "-"}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">单据类型</div>
                            <div>
                              {details.entityData.document_type === 'payment' ? '付款申请单' : 
                               details.entityData.document_type === 'loan' ? '借款申请单' : "-"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">申请人</div>
                            <div>{details.entityData.applicant?.name || "-"}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">金额</div>
                            <div>
                              ¥{details.entityData.total_amount ? Number(details.entityData.total_amount).toLocaleString() : "0"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">付款事由</div>
                            <div>{details.entityData.payment_reason || "-"}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">创建时间</div>
                            <div>
                              {details.entityData.created_at ? new Date(details.entityData.created_at).toLocaleString() : "-"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">所在部门</div>
                            <div>{details.entityData.department?.name || "-"}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">关联项目</div>
                            <div>{details.entityData.team?.name || "-"}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">关联公司</div>
                            <div>{details.entityData.company?.name || "-"}</div>
                          </div>
                        </div>
                      </div>

                      {/* 银行信息 */}
                      {details.entityData.bank_accounts && details.entityData.bank_accounts.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">银行信息</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>银行名称</TableHead>
                                <TableHead>开户名</TableHead>
                                <TableHead>账号</TableHead>
                                <TableHead>金额</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {details.entityData.bank_accounts.map((account: any) => (
                                <TableRow key={account.id}>
                                  <TableCell>{account.bank_name || "-"}</TableCell>
                                  <TableCell>{account.account_holder_name || "-"}</TableCell>
                                  <TableCell>{account.bank_account || "-"}</TableCell>
                                  <TableCell>
                                    ¥{account.payment_amount ? Number(account.payment_amount).toLocaleString() : "0"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* 审批流程 */}
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />
                          审批流程
                        </h3>
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <ApprovalProcessDisplay 
                            entityType="payment_requests"
                            entityId={details.instanceId || details.id}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 其他业务类型的通用显示 */
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
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* 附件信息 - 仅对事项管理显示 */}
            {details.entityData && details.entityData.attachments && details.entityData.attachments.length > 0 && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    附件信息
                  </h3>
                  <div className="space-y-3">
                    {details.entityData.attachments.map((attachment: any) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{attachment.file_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • 
                              {attachment.uploaded_by_user?.name || '未知用户'} • 
                              {new Date(attachment.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // 下载附件的逻辑
                            const fileUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/attachments/${attachment.file_path}`;
                            window.open(fileUrl, '_blank');
                          }}
                        >
                          下载
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

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

// 审批流程显示组件
const ApprovalProcessDisplay: React.FC<{entityType: string, entityId: string}> = ({ entityType, entityId }) => {
  const [workflowInstance, setWorkflowInstance] = React.useState<any>(null);
  const [workflowDetails, setWorkflowDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  console.log('ApprovalProcessDisplay - Input:', { entityType, entityId });

  // 加载工作流实例和详情
  React.useEffect(() => {
    const loadWorkflowData = async () => {
      try {
        setLoading(true);
        console.log('Attempting to fetch workflow instance...');
        const instance = await api.workflow.getWorkflowInstanceByEntity(entityType, entityId);
        console.log('Workflow Instance:', instance);
        setWorkflowInstance(instance);
        
        if (instance) {
          console.log('Attempting to fetch workflow details...');
          const details = await api.workflow.getWorkflowInstanceDetails(instance.id);
          console.log('Workflow Details:', details);
          setWorkflowDetails(details);
        }
      } catch (error) {
        console.error('获取工作流数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (entityType && entityId) {
      loadWorkflowData();
    }
  }, [entityType, entityId]);

  // 获取节点状态
  const getNodeStatus = (nodeId: string, tasks: any[]) => {
    const nodeTasks = tasks.filter(task => task.node_id === nodeId);
    if (nodeTasks.length === 0) return 'pending'; // 未开始
    
    const hasCompleted = nodeTasks.some(task => task.status === 'completed' || task.status === 'approved');
    const hasRejected = nodeTasks.some(task => task.status === 'rejected');
    const hasPending = nodeTasks.some(task => task.status === 'pending');
    
    if (hasRejected) return 'rejected';
    if (hasCompleted && !hasPending) return 'completed';
    if (hasPending) return 'running';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">加载审批流程中...</span>
      </div>
    );
  }

  if (!workflowInstance) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>暂无关联的审批流程</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 审批流程节点 - 按照设计图样式 */}
      {workflowDetails?.workflowNodes && workflowDetails.workflowNodes.length > 0 ? (
        <div className="relative">
          {/* 节点容器 - 垂直排列 */}
          <div className="space-y-0">
              {workflowDetails.workflowNodes
                .filter((node: any) => node.type === 'approval') // 只显示审批节点
                .filter((node: any) => {
                  // 只显示已执行的节点和下一步节点
                  const nodeTasks = (workflowDetails.tasks || []).filter((task: any) => task.node_id === node.node_id);
                  
                  // 1. 已执行的节点（有completed或approved状态的任务）
                  const hasExecutedTasks = nodeTasks.some((task: any) => 
                    task.status === 'completed' || task.status === 'approved'
                  );
                  
                  // 2. 当前正在执行的节点（有running状态的任务）
                  const hasRunningTasks = nodeTasks.some((task: any) => task.status === 'running');
                  
                  // 3. 下一步节点（根据工作流状态判断）
                  const isNextNode = workflowDetails.current_node_id === node.node_id;
                  
                  // 4. 待执行的节点（有pending状态的任务）
                  const hasPendingTasks = nodeTasks.some((task: any) => task.status === 'pending');
                  
                  // 显示条件：已执行 || 正在执行 || 下一步 || 待执行
                  return hasExecutedTasks || hasRunningTasks || isNextNode || hasPendingTasks;
                })
                .sort((a: any, b: any) => {
                  // 根据position_x排序，position_x越小的节点越靠前
                  return a.position_x - b.position_x;
                })
                .map((node: any, index: number, nodes: any[]) => {
                  const nodeStatus = getNodeStatus(node.node_id, workflowDetails.tasks || []);
                  const nodeTasks = (workflowDetails.tasks || []).filter((task: any) => task.node_id === node.node_id);
                  
                  // 获取审批人信息
                  const getApproverInfo = () => {
                    if (nodeTasks.length > 0) {
                      return nodeTasks.map((task: any) => ({
                        name: task.assigned_to?.name || '未知审批人',
                        comments: task.comments,
                        completed_at: task.completed_at,
                        status: task.status
                      }));
                    } else {
                      const allTasks = workflowDetails.tasks || [];
                      const pendingTasks = allTasks.filter((task: any) => 
                        task.node_id === node.node_id && task.status === 'pending'
                      );
                      
                      if (pendingTasks.length > 0) {
                        return pendingTasks.map((task: any) => ({
                          name: task.assigned_to?.name || '待分配',
                          comments: null,
                          completed_at: null,
                          status: 'pending'
                        }));
                      }
                      
                      return [{
                        name: node.config?.approverType === 'department_manager' ? '部门负责人' :
                              node.config?.approverType === 'team_leader' ? '团队负责人' :
                              node.config?.approverType === 'specific_members' ? '指定成员' :
                              '待分配审批人',
                        comments: null,
                        completed_at: null,
                        status: 'pending'
                      }];
                    }
                  };
                  
                  const approvers = getApproverInfo();
                  
                  return (
                    <div key={node.id} className="relative mb-6">
                      {/* 连接线 - 垂直连接到下一个节点 */}
                      {index < nodes.length - 1 && (
                        <div 
                          className="absolute left-8 top-16 w-0.5 bg-gray-300 z-0"
                          style={{ 
                            height: '60px'
                          }}
                        ></div>
                      )}
                      
                      {/* 节点内容 */}
                      <div className="relative z-10 flex items-start">
                        {/* 节点圆圈 */}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 ${
                          nodeStatus === 'completed' ? 'bg-blue-500' :
                          nodeStatus === 'running' ? 'bg-blue-500' :
                          nodeStatus === 'rejected' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`}>
                          {nodeStatus === 'completed' ? (
                            <CheckCircle className="h-8 w-8" />
                          ) : nodeStatus === 'running' ? (
                            <Clock className="h-8 w-8" />
                          ) : nodeStatus === 'rejected' ? (
                            <XCircle className="h-8 w-8" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        
                        {/* 节点信息卡片 */}
                        <div className="ml-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex-1">
                          <h4 className="font-medium text-gray-900 mb-3">{node.name}</h4>
                          {approvers.map((approver, idx) => (
                            <div key={idx} className="mb-2">
                              <div className="flex items-center text-sm text-gray-600 mb-1">
                                <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">{approver.name}</span>
                              </div>
                              {approver.completed_at && (
                                <div className="text-xs text-gray-500 ml-6">
                                  {new Date(approver.completed_at).toLocaleString()}
                                </div>
                              )}
                              {approver.comments && (
                                <div className="text-xs text-gray-600 ml-6 mt-1 p-2 bg-gray-50 rounded">
                                  {approver.comments}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>暂无审批流程配置</p>
        </div>
      )}
    </div>
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
  const [isFinancialMatterDialogOpen, setIsFinancialMatterDialogOpen] = useState(false);
  
  // 审批意见对话框状态
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [currentTask, setCurrentTask] = useState<PendingTask | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // 在状态定义部分添加新的状态
  const [currentApprovalNode, setCurrentApprovalNode] = useState<any>(null);
  const [showAllocationEdit, setShowAllocationEdit] = useState(false);
  const [allocationConfigs, setAllocationConfigs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [approvalFormData, setApprovalFormData] = useState({
    is_corporate_dimension: false,
    team_id: "",
    allocations: [] as any[]
  });

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
        entityId: task.instance.entity_id,
        node_id: task.node_id // 添加node_id
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
        entityId: task.instance.entity_id,
        node_id: task.node_id // 添加node_id
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
        return "申请";
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
        return "申请";
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
        return "一般";
      case "low":
        return "低";
      default:
        return "一般";
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
    
    // 如果是事项管理审批，需要检查当前审批节点是否支持编辑分摊
    if (task.currentStep === "事项管理审批") {
      try {
        // 步骤1: 获取当前workflow_instance_tasks的id从而查找到node_id
        const details = await api.workflow.getWorkflowInstanceDetails(task.instanceId);
        setWorkflowInstanceDetails(details);
        
        // 步骤2: 根据node_id去workflow_nodes表中查node_id等于步骤1的节点
        // 使用task.node_id而不是details.current_node_id
        const currentNodeId = task.node_id;
        if (currentNodeId) {
          // 从workflowNodes中找到对应的节点
          const currentNode = details.workflowNodes?.find((node: any) => 
            node.node_id === currentNodeId
          );
          
          // 步骤3: 判断他的config的JSON字段中是否allowAllocationEdit等于true
          if (currentNode && currentNode.config?.allowAllocationEdit === true) {
            setShowAllocationEdit(true);
            setCurrentApprovalNode(currentNode);
            
            // 获取分摊配置和团队数据
            const [configs, teamsData] = await Promise.all([
              api.team.getEnabledAllocationConfigs(),
              api.team.getAll()
            ]);
            setAllocationConfigs(configs);
            setTeams(teamsData);
            
            // 初始化表单数据
            if (details.entityData) {
              setApprovalFormData({
                is_corporate_dimension: details.entityData.is_corporate_dimension || false,
                team_id: details.entityData.team_id || "",
                allocations: details.entityData.allocations || []
              });
              
              // 如果开启了总商维度，自动计算分摊明细
              if (details.entityData.is_corporate_dimension && configs.length > 0) {
                // 直接计算分摊明细
                const amount = details.entityData.amount || 0;
                const totalRatio = configs.reduce((sum, config) => sum + config.allocation_ratio, 0);
                
                console.log("初始化分摊明细:", {
                  configs: configs,
                  amount: amount,
                  totalRatio: totalRatio
                });
                
                const newAllocations = configs.map((config: any) => ({
                  team_id: config.team_id,
                  team_name: config.team?.name || `团队ID: ${config.team_id}`,
                  original_ratio: config.allocation_ratio / 100, // 转换为小数（例如：10 -> 0.1）
                  allocation_ratio: (config.allocation_ratio / totalRatio) / 100, // 归一化分摊比例并转换为小数
                  allocated_amount: amount * ((config.allocation_ratio / totalRatio) / 100),
                  is_selected: true
                }));
                
                console.log("生成的分摊明细:", newAllocations);
                
                setApprovalFormData(prev => ({
                  ...prev,
                  allocations: newAllocations
                }));
              }
            }
          } else {
            setShowAllocationEdit(false);
            setCurrentApprovalNode(null);
          }
        } else {
          setShowAllocationEdit(false);
          setCurrentApprovalNode(null);
        }
      } catch (error) {
        console.error("获取工作流详情失败:", error);
        setShowAllocationEdit(false);
        setCurrentApprovalNode(null);
      }
    } else {
      setShowAllocationEdit(false);
      setCurrentApprovalNode(null);
    }
    
    setApprovalDialogOpen(true);
  };

  // 计算分摊明细
  const calculateAllocations = () => {
    if (!workflowInstanceDetails?.entityData?.amount) return;
    
    const amount = workflowInstanceDetails.entityData.amount;
    const configs = allocationConfigs.filter((config: any) => config.is_enabled);
    
    if (configs.length === 0) return;
    
    // 创建分摊明细，包含勾选状态和原始比例
    const totalRatio = configs.reduce((sum, config) => sum + config.allocation_ratio, 0);
    
    const newAllocations = configs.map((config: any) => ({
      team_id: config.team_id,
      team_name: config.team?.name || `团队ID: ${config.team_id}`,
      original_ratio: config.allocation_ratio / 100, // 转换为小数（例如：10 -> 0.1）
      allocation_ratio: (config.allocation_ratio / totalRatio) / 100, // 归一化分摊比例并转换为小数
      allocated_amount: 0, // 初始化为0，稍后计算
      is_selected: true // 默认全部勾选
    }));
    
    // 计算本次分摊比例和金额
    updateAllocationRatiosAndAmounts(newAllocations, amount);
    
    setApprovalFormData(prev => ({
      ...prev,
      allocations: newAllocations
    }));
  };

  // 更新分摊选择状态并重新计算比例和金额
  const updateAllocationSelection = (index: number, isSelected: boolean) => {
    setApprovalFormData(prev => {
      const newAllocations = prev.allocations.map((allocation: any, i: number) =>
        i === index ? { ...allocation, is_selected: isSelected } : allocation
      );
      
      // 重新计算本次分摊比例和金额
      if (workflowInstanceDetails?.entityData?.amount) {
        updateAllocationRatiosAndAmounts(newAllocations, workflowInstanceDetails.entityData.amount);
      }
      
      return {
        ...prev,
        allocations: newAllocations
      };
    });
  };

  // 更新分摊比例和金额
  const updateAllocationRatiosAndAmounts = (allocations: any[], totalAmount: number) => {
    const selectedAllocations = allocations.filter(a => a.is_selected);
    
    if (selectedAllocations.length === 0) {
      // 如果没有选中的项目，所有项目金额为0
      allocations.forEach(allocation => {
        allocation.allocation_ratio = 0;
        allocation.allocated_amount = 0;
      });
      return;
    }
    
    // 计算选中项目的原始比例总和
    const totalOriginalRatio = selectedAllocations.reduce((sum, config) => sum + config.original_ratio, 0);
    
    // 重新计算本次分摊比例和金额
    allocations.forEach(allocation => {
      if (allocation.is_selected) {
        // 本次分摊比例 = 原始比例 / 选中项目原始比例总和
        allocation.allocation_ratio = allocation.original_ratio / totalOriginalRatio;
        // 本次分摊金额 = 总金额 * 本次分摊比例
        allocation.allocated_amount = totalAmount * allocation.allocation_ratio;
      } else {
        // 未选中的项目比例为0，金额为0
        allocation.allocation_ratio = 0;
        allocation.allocated_amount = 0;
      }
    });
  };

  // 验证分摊比例总和
  const validateAllocationRatios = () => {
    const totalRatio = approvalFormData.allocations.reduce((sum: number, allocation: any) => sum + allocation.allocation_ratio, 0);
    return Math.abs(totalRatio - 1) < 0.0001; // 允许0.01%的误差
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

    // 如果显示分摊编辑，验证分摊设置
    if (showAllocationEdit) {
      if (approvalFormData.is_corporate_dimension && !validateAllocationRatios()) {
        toast({
          title: "分摊比例错误",
          description: "分摊比例总和必须等于100%",
          variant: "destructive"
        });
        return;
      }
      
      if (!approvalFormData.is_corporate_dimension && !approvalFormData.team_id) {
        toast({
          title: "请选择归属项目",
          description: "关闭总商维度时必须选择归属项目",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setApprovalLoading(true);
      
      // 如果显示分摊编辑，先更新财务事项
      if (showAllocationEdit && currentTask.entityType === 'financial_matters') {
        try {
          // 更新财务事项的基本信息
          await api.financialMatter.updateFinancialMatter(currentTask.entityId, {
            is_corporate_dimension: approvalFormData.is_corporate_dimension,
            team_id: approvalFormData.is_corporate_dimension ? undefined : approvalFormData.team_id
          });

          // 如果开启总商维度，更新分摊明细
          if (approvalFormData.is_corporate_dimension) {
            // 删除现有分摊记录
            const existingAllocations = await api.financialMatter.getAllocations(currentTask.entityId);
            for (const allocation of existingAllocations) {
              await api.financialMatter.deleteAllocation(allocation.id);
            }
            
            // 创建新的分摊记录
            if (approvalFormData.allocations.length > 0) {
              // 只保存勾选的项目
              const selectedAllocations = approvalFormData.allocations.filter((allocation: any) => allocation.is_selected);
              
              if (selectedAllocations.length > 0) {
                // 确保分摊比例总和为100%
                const totalRatio = selectedAllocations.reduce((sum, a) => sum + a.allocation_ratio, 0);
                
                await api.financialMatter.createAllocations(
                  currentTask.entityId,
                  selectedAllocations.map((allocation: any) => ({
                    team_id: allocation.team_id,
                    allocation_ratio: allocation.allocation_ratio, // 保存小数形式（例如：0.1 表示 10%）
                    allocated_amount: allocation.allocated_amount
                  }))
                );
                
                console.log("保存分摊设置成功:", {
                  entityId: currentTask.entityId,
                  selectedAllocations: selectedAllocations,
                  totalRatio: totalRatio
                });
              }
            }
          }
        } catch (error) {
          console.error("更新分摊设置失败:", error);
          toast({
            title: "更新分摊设置失败",
            description: "分摊设置更新失败，但审批将继续进行",
            variant: "destructive"
          });
        }
      }
      
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
        setShowAllocationEdit(false);
        setCurrentApprovalNode(null);
        setApprovalFormData({
          is_corporate_dimension: false,
          team_id: "",
          allocations: []
        });
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
      
      // 如果是事项管理审批，显示财务事项详情弹框
      if (task.currentStep === "事项管理审批") {
        setIsFinancialMatterDialogOpen(true);
      } else {
        // 其他类型显示原有的工作流详情弹框
        setIsDetailsDialogOpen(true);
      }
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
          <p className="text-muted-foreground mt-2">管理和处理待审批的事项</p>
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
                <SelectValue placeholder="事项类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="expense">费用报销</SelectItem>
                <SelectItem value="payment">付款</SelectItem>
                <SelectItem value="financial">财务事项</SelectItem>
                <SelectItem value="purchase">采购</SelectItem>
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
                  暂无待处理事项
                </h3>
                <p className="text-sm text-muted-foreground">
                  所有事项都已处理完成
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
                          {item.currentStep}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            申请人：{item.applicant}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>提交时间：{item.submitTime}</span>
                        </div>

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
                  暂无已处理事项
                </h3>
                <p className="text-sm text-muted-foreground">
                  这里将显示已处理的事项记录
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
                          {item.currentStep}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            申请人：{item.applicant}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>提交时间：{item.submitTime}</span>
                        </div>
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

      {/* 财务事项详情弹框 */}
      <FinancialMatterDetailDialog
        open={isFinancialMatterDialogOpen}
        onOpenChange={setIsFinancialMatterDialogOpen}
        workflowDetails={workflowInstanceDetails}
      />

      {/* 批准意见对话框 */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              批准
            </DialogTitle>
            <DialogDescription>
              请填写批准意见，意见将保存到审批记录中
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 分摊编辑字段 - 仅当事项管理审批且支持编辑分摊时显示 */}
            {showAllocationEdit && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">分摊设置</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="corporate-dimension" className="text-sm">是否总商维度</Label>
                    <Switch
                      id="corporate-dimension"
                      checked={approvalFormData.is_corporate_dimension}
                      onCheckedChange={(checked) => {
                        setApprovalFormData(prev => ({
                          ...prev,
                          is_corporate_dimension: checked
                        }));
                        
                        // 如果开启总商维度，自动计算分摊明细
                        if (checked && allocationConfigs.length > 0) {
                          setTimeout(() => calculateAllocations(), 100);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 归属项目 - 当总商维度关闭时显示 */}
                {!approvalFormData.is_corporate_dimension && (
                  <div>
                    <Label htmlFor="team-select">归属项目</Label>
                    <Select
                      value={approvalFormData.team_id}
                      onValueChange={(value) => setApprovalFormData(prev => ({
                        ...prev,
                        team_id: value
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="选择归属项目" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 分摊明细 - 当总商维度开启时显示 */}
                {approvalFormData.is_corporate_dimension && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">分摊明细</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={calculateAllocations}
                        className="h-8 px-3"
                      >
                        重新计算
                      </Button>
                    </div>
                    
                    {approvalFormData.allocations.length > 0 && (
                      <div className="space-y-2">
                        {/* 表头 */}
                        <div className="grid grid-cols-4 gap-4 p-2 bg-gray-100 rounded font-medium text-sm">
                          <div>项目名称</div>
                          <div>默认比例</div>
                          <div>本次比例</div>
                          <div>分配金额</div>
                        </div>
                        
                        {/* 数据行 */}
                        {approvalFormData.allocations.map((allocation, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4 p-2 bg-white rounded border items-center">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={allocation.is_selected}
                                onCheckedChange={(checked) => updateAllocationSelection(index, checked as boolean)}
                              />
                              <span className="text-sm font-medium">
                                {allocation.team_name || `团队ID: ${allocation.team_id}`}
                              </span>
                            </div>
                            <div className="text-sm text-blue-600">
                              {(allocation.original_ratio * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm">
                              {(allocation.allocation_ratio * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              ¥{allocation.allocated_amount?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        ))}
                        
                        {/* 总计行 */}
                        <div className="grid grid-cols-4 gap-4 p-2 bg-blue-50 rounded border font-medium text-sm">
                          <div>分摊比例总和:</div>
                          <div></div>
                          <div className="text-green-600">
                            {(approvalFormData.allocations.filter(a => a.is_selected).reduce((sum, a) => sum + a.allocation_ratio, 0) * 100).toFixed(2)}%
                          </div>
                          <div className="text-green-600">
                            ¥{approvalFormData.allocations.filter(a => a.is_selected).reduce((sum, a) => sum + (a.allocated_amount || 0), 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 审批意见 */}
            <div>
              <Label htmlFor="approval-comments">审批意见</Label>
              <Textarea
                id="approval-comments"
                placeholder="请输入批准意见..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="mt-2"
                rows={4}
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
              驳回
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
