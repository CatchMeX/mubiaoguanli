import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { 
  Play, 
  User, 
  GitBranch, 
  CheckCircle, 
  FileText 
} from 'lucide-react';

export interface WorkflowNodeData {
  title: string;
  type: 'start' | 'approval' | 'condition' | 'end';
  config?: {
    // 审批节点配置
    approverType?: 'specific_members' | 'team_leader' | 'department_manager';
    approvalType?: 'single' | 'all';
    specificApprovers?: string[];
    allowAllocationEdit?: boolean; // 是否支持编辑分摊
    // 条件节点配置
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value?: string;
    condition?: string;
  };
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'start': return <Play className="h-4 w-4" />;
    case 'approval': return <User className="h-4 w-4" />;
    case 'condition': return <GitBranch className="h-4 w-4" />;
    case 'end': return <CheckCircle className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case 'start': return 'bg-green-100 border-green-300 text-green-800';
    case 'approval': return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'condition': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'end': return 'bg-gray-100 border-gray-300 text-gray-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getApproverTypeLabel = (type?: string) => {
  switch (type) {
    case 'specific_members': return '指定成员';
    case 'team_leader': return '团队负责人';
    case 'department_manager': return '部门负责人';
    default: return '未配置';
  }
};

const getOperatorSymbol = (operator?: string) => {
  switch (operator) {
    case 'equals': return '=';
    case 'not_equals': return '≠';
    case 'contains': return '∋';
    case 'not_contains': return '∌';
    default: return '?';
  }
};

const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 transition-all ${getNodeColor(nodeData.type)} ${
      selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
    }`} style={{ minWidth: '120px' }}>
      {/* 输入连接点 */}
      {nodeData.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        />
      )}

      {/* 输出连接点 */}
      {nodeData.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        />
      )}

      <div className="flex items-center gap-2 mb-1">
        {getNodeIcon(nodeData.type)}
        <span className="font-medium text-sm">{nodeData.title}</span>
      </div>
      
      {nodeData.config && (
        <div className="text-xs opacity-75">
          {/* 审批节点信息 */}
          {nodeData.type === 'approval' && (
            <>
              {nodeData.config.approverType && (
                <div>审批人: {getApproverTypeLabel(nodeData.config.approverType)}</div>
              )}
              {nodeData.config.specificApprovers && nodeData.config.specificApprovers.length > 0 && (
                <div>已选择: {nodeData.config.specificApprovers.length}人</div>
              )}
              {nodeData.config.allowAllocationEdit && (
                <div className="text-green-600">✓ 支持编辑分摊</div>
              )}
            </>
          )}
          
          {/* 条件节点信息 */}
          {nodeData.type === 'condition' && (
            <>
              {nodeData.config.field && nodeData.config.operator && (
                <div className="truncate">
                  {nodeData.config.field} {getOperatorSymbol(nodeData.config.operator)} {nodeData.config.value || '?'}
                </div>
              )}
              {(!nodeData.config.field || !nodeData.config.operator) && (
                <div className="text-red-600">未配置条件</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
