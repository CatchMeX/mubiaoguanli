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
import { PermissionGuard } from '../../hooks/usePermissions';
import DepartmentSelect from '../../components/DepartmentSelect';

// 审批流程显示组件
interface ApprovalProcessDisplayProps {
  entityType: string;
  entityId: string;
}

const ApprovalProcessDisplay: React.FC<ApprovalProcessDisplayProps> = ({ entityType, entityId }) => {
  const [workflowInstance, setWorkflowInstance] = useState<any>(null);
  const [workflowDetails, setWorkflowDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载工作流实例和详情
  useEffect(() => {
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
      {/* 审批流程节点 - 美观的横向排列 */}
      {workflowDetails?.workflowNodes && workflowDetails.workflowNodes.length > 0 ? (
        <div className="relative">
          {/* 水平滚动容器 - 独立滚动，不影响弹框 */}
          <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* 节点容器 */}
            <div className="flex items-start space-x-12 min-w-max px-2 relative workflow-container">
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
                  
                  // 获取审批人信息，包括未开始的节点
                  const getApproverInfo = () => {
                    if (nodeTasks.length > 0) {
                      // 有任务记录的节点（已开始、进行中、已完成）
                      return nodeTasks.map((task: any) => ({
                        name: task.assigned_to?.name || '未知审批人',
                        comments: task.comments,
                        completed_at: task.completed_at,
                        status: task.status
                      }));
                    } else {
                      // 未开始的节点，尝试从所有tasks中查找该节点的pending任务
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
                      
                      // 如果没找到pending任务，根据配置类型显示
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
                    <div key={node.id} className="flex flex-col items-center relative group">
                      
                      {/* 节点圆圈 */}
                      <div className={`relative w-16 h-16 rounded-full border-4 flex items-center justify-center text-lg font-bold mb-4 transition-all duration-300 group-hover:scale-110 z-20 ${
                        nodeStatus === 'completed' ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white shadow-lg shadow-green-200' :
                        nodeStatus === 'running' ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200' :
                        nodeStatus === 'rejected' ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-500 text-white shadow-lg shadow-red-200' :
                        'bg-gradient-to-br from-gray-200 to-gray-400 border-gray-300 text-gray-600 shadow-lg shadow-gray-200'
                      }`}>
                        {index + 1}
                        
                        {/* 状态指示器 */}
                        {nodeStatus === 'completed' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-30">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {nodeStatus === 'running' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse z-30">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {nodeStatus === 'rejected' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center z-30">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* 节点卡片 */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px] max-w-[250px] transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 z-20">
                        {/* 节点标题 */}
                        <div className="text-center mb-3">
                          <div className="font-semibold text-gray-800 text-sm mb-1">{node.title}</div>
                        </div>
                        
                        {/* 审批人信息 */}
                        <div className="text-center">
                          {approvers.map((approver: any, approverIndex: number) => (
                            <div key={approverIndex} className="space-y-2">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="font-medium text-gray-800 text-sm">{approver.name}</span>
                              </div>
                              
                              {approver.comments && (
                                <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded-lg max-h-20 overflow-y-auto">
                                  {approver.comments}
                                </div>
                              )}
                              
                              {approver.completed_at && (
                                <div className="text-gray-500 text-xs flex items-center justify-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span>{new Date(approver.completed_at).toLocaleDateString()}</span>
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
            
            {/* 节点间的连接线 - 使用简单的div元素 */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 z-10"></div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">暂无审批流程信息</p>
        </div>
      )}


    </div>
  );
};

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

  // 生成单号：MAT+年月日+4位自增数字
  const generateMatterNumber = (matterId: string, createdAt: string) => {
    const date = new Date(createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(matterId).slice(-4).padStart(4, '0');
    return `MAT${year}${month}${day}${sequence}`;
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
        <PermissionGuard permission="CREATE_MATTER">
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
              {/* 基本信息 - 固定宽度，与弹框宽度一致 */}
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                
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
                    <DepartmentSelect
                      value={formData.department_id}
                      onValueChange={(value) => setFormData({...formData, department_id: value})}
                      placeholder="选择部门"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="description">事项简述 *</Label>
                  <Textarea 
                    id="description"
                    value={formData.matter_description}
                    onChange={(e) => setFormData({...formData, matter_description: e.target.value})}
                    placeholder="例如：财务管理部申请5月份团建费用，共计4人，发生费用共计120.00元。（活动方案详见附件）"
                    rows={4}
                  />
                </div>

                <div className="mt-4">
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

                {/* 新建时隐藏费用归属项目字段 */}

                {/* 审批流程自动关联，无需用户选择 */}
              </div>

              {/* 新建时隐藏分摊明细，因为总商维度默认为false */}

              {/* 附件上传 - 固定宽度，与弹框宽度一致 */}
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-4">附件</h3>
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
                  <div className="space-y-2 mt-4">
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
        </PermissionGuard>
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
              <DepartmentSelect
                value={filters.department_id === 'none' ? '' : filters.department_id}
                onValueChange={(value) => setFilters({...filters, department_id: value || 'none'})}
                placeholder="全部部门"
              />
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
                <TableHead>单号</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>事项简述</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>总商维度</TableHead>
                <TableHead>所属项目</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatters.map((matter) => (
                <TableRow key={matter.id}>
                  <TableCell>
                    <span className="font-mono text-sm">{matter.matter_number || generateMatterNumber(matter.id, matter.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{matter.applicant?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{matter.department?.name}</span>
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
                    {matter.is_corporate_dimension ? (
                      <Badge variant="default">是</Badge>
                    ) : (
                      <Badge variant="secondary">否</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {matter.team?.name || '-'}
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
                      <PermissionGuard permission="VIEW_MATTER_DETAILS">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleView(matter)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      {/* 只有非审批中和非已完成状态才允许编辑 */}
                      {(() => {
                        // 获取工作流状态来判断是否允许编辑
                        const workflowStatus = matter.workflowStatus;
                        const isEditable = workflowStatus !== 'running' && workflowStatus !== 'completed';
                        return isEditable ? (
                          <PermissionGuard permission="EDIT_MATTER">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(matter)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                        ) : null;
                      })()}
                      <PermissionGuard permission="EXPORT_MATTER_PDF">
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
                      </PermissionGuard>
                      {/* 只有非审批中和非已完成状态才允许删除 */}
                      {(() => {
                        // 获取工作流状态来判断是否允许删除
                        const workflowStatus = matter.workflowStatus;
                        const isDeletable = workflowStatus !== 'running' && workflowStatus !== 'completed';
                        return isDeletable ? (
                          <PermissionGuard permission="DELETE_MATTER">
                            <DeleteButton
                              onConfirm={() => handleDelete(matter.id)}
                              itemName={`财务事项 - ${matter.matter_description}`}
                              title="删除财务事项"
                              description={`确定要删除"${matter.matter_description}"吗？删除后无法恢复。`}
                              variant="ghost"
                              size="sm"
                            />
                          </PermissionGuard>
                        ) : null;
                      })()}
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>财务事项详情</DialogTitle>
          </DialogHeader>
          
          {selectedMatter && (
            <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* 基本信息 - 重新排列字段顺序 */}
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                
                {/* 第一行：单号、创建时间 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>单号</Label>
                    <p className="text-sm font-mono text-muted-foreground">
                      {selectedMatter.matter_number || generateMatterNumber(selectedMatter.id, selectedMatter.created_at)}
                    </p>
                  </div>
                  <div>
                    <Label>创建时间</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMatter.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 第二行：申请人、所属部门 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>申请人</Label>
                    <p className="text-sm text-muted-foreground">{selectedMatter.applicant?.name}</p>
                  </div>
                  <div>
                    <Label>所属部门</Label>
                    <p className="text-sm text-muted-foreground">{selectedMatter.department?.name}</p>
                  </div>
                </div>

                {/* 第三行：金额、状态 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
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

                {/* 第四行：事项描述 */}
                <div className="mb-4">
                  <Label>事项描述</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedMatter.matter_description}</p>
                </div>

                {/* 第五行：是否总商维度、费用归属项目 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>是否总商维度</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedMatter.is_corporate_dimension ? '是' : '否'}
                    </p>
                  </div>
                  {!selectedMatter.is_corporate_dimension && (
                    <div>
                      <Label>费用归属项目</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedMatter.team?.name || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 分摊明细 */}
              {selectedMatter.is_corporate_dimension && selectedMatter.allocations && selectedMatter.allocations.length > 0 && (
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">分摊明细</h3>
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

              {/* 附件 - 固定宽度，与弹框宽度一致 */}
              {selectedMatter.attachments && selectedMatter.attachments.length > 0 && (
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">附件</h3>
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

              {/* 审批流程 - 独立滚动容器 */}
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-4">审批流程</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <ApprovalProcessDisplay 
                    entityType="financial_matters"
                    entityId={selectedMatter.id}
                  />
                </div>
              </div>
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
            {/* 基本信息 - 固定宽度，与弹框宽度一致 */}
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-4">基本信息</h3>
              
              {/* 申请人、所属部门（占一行） */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>申请人</Label>
                  <Input 
                    value={selectedMatter?.applicant?.name || ''} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">所属部门 *</Label>
                  <DepartmentSelect
                    value={formData.department_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                    placeholder="选择部门"
                  />
                </div>
              </div>

              {/* 事项简述（单独一行） */}
              <div className="mt-4">
                <Label htmlFor="edit-matter-description">事项简述 *</Label>
                <Textarea
                  id="edit-matter-description"
                  placeholder="请输入财务事项简述"
                  value={formData.matter_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, matter_description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* 金额（单独一行） */}
              <div className="mt-4">
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

              {/* 隐藏是否总商维度、费用归属项目和分摊明细字段 */}
              {/* 审批流程自动关联，无需用户选择 */}
            </div>

            {/* 隐藏分摊明细字段 */}

            {/* 附件上传 - 固定宽度，与弹框宽度一致 */}
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-4">附件</h3>
              
              {/* 现有附件 */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2 mb-4">
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