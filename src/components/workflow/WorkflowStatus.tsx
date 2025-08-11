import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { toast } from 'sonner';
import WorkflowDetailsDialog from '@/components/workflow/WorkflowDetailsDialog';

interface WorkflowStatusProps {
  entityType: string;
  entityId: string;
  className?: string;
  showDetails?: boolean;
}

interface WorkflowInstance {
  id: string;
  status: string;
  workflow?: {
    name: string;
  };
  initiated_by?: {
    name: string;
  };
  initiated_at?: string;
}

const WorkflowStatus: React.FC<WorkflowStatusProps> = ({
  entityType,
  entityId,
  className,
  showDetails = true
}) => {
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [workflowDetails, setWorkflowDetails] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // 加载工作流实例
  useEffect(() => {
    const loadWorkflowInstance = async () => {
      try {
        setLoading(true);
        // 使用新的高效API方法直接查询指定业务实体的工作流实例
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

  // 获取状态样式
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'terminated':
        return 'destructive';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '审批中';
      case 'completed':
        return '已完成';
      case 'terminated':
        return '已终止';
      case 'paused':
        return '已暂停';
      default:
        return '未知状态';
    }
  };

  // 查看详情
  const handleViewDetails = async () => {
    if (!workflowInstance) return;

    try {
      setDetailsLoading(true);
      const details = await api.workflow.getWorkflowInstanceDetails(workflowInstance.id);
      setWorkflowDetails(details);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error('获取工作流详情失败:', error);
      toast.error('获取工作流详情失败');
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (!workflowInstance) {
    return (
      <div className={className}>
        <Badge variant="outline">无工作流</Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={getStatusBadgeVariant(workflowInstance.status)}>
        {getStatusText(workflowInstance.status)}
      </Badge>
      
      {showDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          disabled={detailsLoading}
          className="h-6 px-2"
        >
          {detailsLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* 详情弹窗 */}
      <WorkflowDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        details={workflowDetails}
      />
    </div>
  );
};

export default WorkflowStatus; 