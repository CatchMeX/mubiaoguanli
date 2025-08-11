import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

// 表单字段配置 - 从 WorkflowDesigner.tsx 复制
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
    { value: "payment_amount", label: "总金额", type: "number" }
  ]
};

interface WorkflowDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: any;
}

const WorkflowDetailsDialog: React.FC<WorkflowDetailsDialogProps> = ({ 
  open, 
  onOpenChange, 
  details 
}) => {
  if (!details) return null;

  const entityFields = formFields[details.entity_type as keyof typeof formFields] || [];

  // 格式化字段值
  const formatFieldValue = (field: any, value: any, entityData: any) => {
    if (value === null || value === undefined) return '-';
    
    switch (field.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'select':
        const option = field.options?.find((opt: any) => opt.value === value);
        return option ? option.label : value;
      case 'users':
        if (field.value.endsWith('_id')) {
          const relationKey = field.value.replace('_id', '');
          const relatedUser = entityData[relationKey] || entityData.applicant;
          if (relatedUser && relatedUser.name) {
            return `${relatedUser.name}${relatedUser.employee_id ? ` (${relatedUser.employee_id})` : ''}`;
          }
        }
        return value;
      case 'departments':
        if (field.value.endsWith('_id')) {
          const relationKey = field.value.replace('_id', '');
          const relatedDept = entityData[relationKey] || entityData.department;
          if (relatedDept && relatedDept.name) {
            return `${relatedDept.name}${relatedDept.code ? ` (${relatedDept.code})` : ''}`;
          }
        }
        return value;
      case 'teams':
        if (field.value.endsWith('_id')) {
          const relationKey = field.value.replace('_id', '');
          const relatedTeam = entityData[relationKey] || entityData.team;
          if (relatedTeam && relatedTeam.name) {
            return `${relatedTeam.name}${relatedTeam.code ? ` (${relatedTeam.code})` : ''}`;
          }
        }
        return value;
      case 'companies':
        if (field.value.endsWith('_id')) {
          const relationKey = field.value.replace('_id', '');
          const relatedCompany = entityData[relationKey] || entityData.company;
          if (relatedCompany && relatedCompany.name) {
            return `${relatedCompany.name}${relatedCompany.code ? ` (${relatedCompany.code})` : ''}`;
          }
        }
        return value;
      default:
        return value;
    }
  };

  // 获取任务状态颜色
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取任务状态文本
  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

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
                  <div className="text-sm font-medium text-muted-foreground">工作流名称</div>
                  <div>{details.workflow?.name || '-'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">当前状态</div>
                  <Badge className={getTaskStatusColor(details.status)}>
                    {getTaskStatusText(details.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">发起人</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {details.initiated_by?.name || '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">发起时间</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {details.initiated_at ? new Date(details.initiated_at).toLocaleString() : '-'}
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
                        <div className="text-sm font-medium text-muted-foreground">{field.label}</div>
                        <div className="p-2 bg-muted rounded">
                          {formatFieldValue(field, details.entityData[field.value], details.entityData)}
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
                {details.tasksByNode && Object.entries(details.tasksByNode).map(([nodeId, nodeTasks]: [string, any]) => (
                  <div key={nodeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-lg">{nodeId}</div>
                      <Badge variant="outline">
                        {Array.isArray(nodeTasks) ? nodeTasks.length : 0} 个审批人
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {Array.isArray(nodeTasks) && nodeTasks.map((task: any) => (
                        <div key={task.id} className="bg-muted rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {task.assigned_to?.name || '未分配'}
                              </span>
                            </div>
                            <Badge className={getTaskStatusColor(task.status)}>
                              {getTaskStatusText(task.status)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>分配时间: {task.assigned_at ? new Date(task.assigned_at).toLocaleString() : '-'}</span>
                            </div>
                            {task.completed_by && (
                              <>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  <span>完成人: {task.completed_by.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>完成时间: {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">审批决定: {task.decision === 'approved' ? '批准' : task.decision === 'rejected' ? '拒绝' : '-'}</span>
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
                ))}
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
                            {Array.isArray(nodeApprovals) ? nodeApprovals.length : 0} 条审批记录
                          </Badge>
                        </h4>
                        <div className="space-y-3">
                          {Array.isArray(nodeApprovals) && nodeApprovals.map((approval: any) => (
                            <div key={approval.id} className="bg-muted rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{approval.approver?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={approval.action === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {approval.action === 'approved' ? '已批准' : approval.action === 'rejected' ? '已拒绝' : approval.action}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(approval.approved_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {approval.comments && (
                                <div className="p-2 bg-background rounded text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="font-medium">审批意见</span>
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

export default WorkflowDetailsDialog; 