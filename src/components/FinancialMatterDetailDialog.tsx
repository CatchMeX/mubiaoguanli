import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck
} from 'lucide-react';
import api from '@/services/api';

// 审批流程显示组件
interface ApprovalProcessDisplayProps {
  entityType: string;
  entityId: string;
}

const ApprovalProcessDisplay: React.FC<ApprovalProcessDisplayProps> = ({ entityType, entityId }) => {
  const [workflowInstance, setWorkflowInstance] = React.useState<any>(null);
  const [workflowDetails, setWorkflowDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // 加载工作流实例和详情
  React.useEffect(() => {
    const loadWorkflowData = async () => {
      try {
        setLoading(true);
        const instance = await api.workflow.getWorkflowInstanceByEntity(entityType, entityId);
        setWorkflowInstance(instance);
        
        if (instance) {
          const details = await api.workflow.getWorkflowInstanceDetails(instance.id);
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

  // 获取节点状态样式
  const getNodeStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'running':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'rejected':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'pending':
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  // 获取节点状态文本
  const getNodeStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'running':
        return '审批中';
      case 'rejected':
        return '已驳回';
      case 'pending':
      default:
        return '未开始';
    }
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

// 财务事项详情弹框组件
interface FinancialMatterDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowDetails: any;
}

const FinancialMatterDetailDialog: React.FC<FinancialMatterDetailDialogProps> = ({
  open,
  onOpenChange,
  workflowDetails
}) => {
  const [allocations, setAllocations] = React.useState<any[]>([]);
  const [loadingAllocations, setLoadingAllocations] = React.useState(false);

  // 获取业务数据
  const entityData = workflowDetails?.entityData || {};
  
  // 查询分摊数据
  React.useEffect(() => {
    const loadAllocations = async () => {
      if (!workflowDetails?.entity_id || !entityData.is_corporate_dimension) {
        return;
      }

      try {
        setLoadingAllocations(true);
        // 根据financial_matter_id查询分摊数据
        const allocationData = await api.financialMatter.getAllocations(workflowDetails.entity_id);
        console.log('查询到的分摊数据:', allocationData);
        setAllocations(allocationData || []);
      } catch (error) {
        console.error('查询分摊数据失败:', error);
        setAllocations([]);
      } finally {
        setLoadingAllocations(false);
      }
    };

    loadAllocations();
  }, [workflowDetails?.entity_id, entityData.is_corporate_dimension]);

  if (!workflowDetails) return null;

  // 调试信息
  console.log('FinancialMatterDetailDialog - workflowDetails:', workflowDetails);
  console.log('FinancialMatterDetailDialog - entityData:', entityData);
  console.log('FinancialMatterDetailDialog - 是否总商维度:', entityData.is_corporate_dimension || entityData.is_general_business);
  console.log('FinancialMatterDetailDialog - 分摊数据:', entityData.allocations);
  console.log('FinancialMatterDetailDialog - 分摊数据长度:', entityData.allocations?.length);
  
  // 尝试不同的分摊数据字段
  console.log('FinancialMatterDetailDialog - 尝试查找分摊数据:');
  console.log('- entityData.allocations:', entityData.allocations);
  console.log('- entityData.allocation_details:', entityData.allocation_details);
  console.log('- entityData.team_allocations:', entityData.team_allocations);
  console.log('- entityData.financial_allocations:', entityData.financial_allocations);
  console.log('- workflowDetails.allocations:', workflowDetails.allocations);
  
  // 检查分摊明细显示条件
  const shouldShowAllocations = (entityData.is_corporate_dimension || entityData.is_general_business) && 
                               allocations && 
                               allocations.length > 0;
  console.log('FinancialMatterDetailDialog - 是否显示分摊明细:', shouldShowAllocations);

  // 安全检查
  if (!entityData || typeof entityData !== 'object') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>财务事项详情</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center text-muted-foreground">
            暂无业务数据
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>财务事项详情</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(80vh-120px)]">
          <div className="space-y-6 p-1 pr-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    申请人
                  </div>
                  <div>{workflowDetails.initiated_by?.name || "-"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    金额
                  </div>
                  <div>
                    ¥{entityData.amount && !isNaN(Number(entityData.amount)) 
                      ? Number(entityData.amount).toLocaleString() 
                      : "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    事项简述
                  </div>
                  <div>{entityData.matter_description || entityData.description || "-"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    是否总商维度
                  </div>
                  <div>{entityData.is_corporate_dimension || entityData.is_general_business ? "是" : "否"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    创建时间
                  </div>
                  <div>
                    {workflowDetails.initiated_at
                      ? new Date(workflowDetails.initiated_at).toLocaleString()
                      : "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    所属部门
                  </div>
                  <div>
                    {typeof entityData.department === 'object' && entityData.department?.name 
                      ? entityData.department.name 
                      : typeof entityData.department === 'string' 
                      ? entityData.department 
                      : entityData.department_name || "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    状态
                  </div>
                  <div>
                    <Badge className="bg-purple-100 text-purple-800">
                      <Clock className="h-4 w-4 mr-1" />
                      审批中
                    </Badge>
                  </div>
                </div>
                {/* 费用归属项目 - 仅当总商维度为否时显示 */}
                {!(entityData.is_corporate_dimension || entityData.is_general_business) && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      费用归属项目
                    </div>
                    <div>
                      {typeof entityData.team === 'object' && entityData.team?.name 
                        ? entityData.team.name 
                        : typeof entityData.team === 'string' 
                        ? entityData.team 
                        : entityData.expense_project || "-"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 分摊明细 - 仅当总商维度为是时显示 */}
            {shouldShowAllocations && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">分摊明细</h3>
                  {loadingAllocations ? (
                    <div className="p-4 text-center text-muted-foreground">
                      正在加载分摊数据...
                    </div>
                  ) : (
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
                        {allocations.map((allocation: any) => (
                          <TableRow key={allocation.id}>
                            <TableCell>
                              {typeof allocation.team === 'object' && allocation.team?.name 
                                ? allocation.team.name 
                                : typeof allocation.team === 'string' 
                                ? allocation.team 
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {allocation.allocation_ratio && !isNaN(Number(allocation.allocation_ratio))
                                ? (Number(allocation.allocation_ratio) * 100).toFixed(2)
                                : '0.00'}%
                            </TableCell>
                            <TableCell>
                              ¥{allocation.allocated_amount && !isNaN(Number(allocation.allocated_amount))
                                ? Number(allocation.allocated_amount).toLocaleString()
                                : '0'}
                            </TableCell>
                            <TableCell>{allocation.remark || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
            

            {/* 附件 */}
            {entityData.attachments && entityData.attachments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">附件</h3>
                  <div className="space-y-2">
                    {entityData.attachments.map((attachment: any) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment.file_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({attachment.file_size && !isNaN(Number(attachment.file_size))
                              ? (Number(attachment.file_size) / 1024 / 1024).toFixed(2)
                              : '0.00'} MB)
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const fileUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/attachments/${attachment.file_path}`;
                            window.open(fileUrl, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
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
                  entityType="financial_matters"
                  entityId={workflowDetails.entity_id}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialMatterDetailDialog;
