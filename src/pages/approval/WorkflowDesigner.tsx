// @ts-nocheck
import {
  useState,
  useCallback,
  useMemo,
  useRef,
  DragEvent,
  useEffect
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ConnectionMode,
  useReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Save,
  Play,
  Settings,
  Trash2,
  Copy,
  GitBranch,
  User,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Zap,
  DollarSign,
  TrendingUp,
  Receipt,
  Building2,
  ShoppingCart,
  Package,
  MousePointer,
  Move,
  GripVertical,
  UserCheck,
  Crown,
  X,
  Edit3,
  Filter,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Search
} from "lucide-react";

import CustomNode, { WorkflowNodeData } from "@/components/workflow/CustomNode";
// 导入部门和团队 API
import api from "@/services/api";
import { toast } from "sonner";
import type { User as UserType } from "@/types";
import { Department, Team } from "@/types";

// 工作流定义
interface Workflow {
  id: string;
  name: string;
  description: string;
  form_type: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  status: "draft" | "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  form_type_info?: {
    value: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    module: string;
  };
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
    { value: "payment_amount", label: "总金额", type: "number" }
  ]
};

// 比较方式配置
const comparisonOperators = [
  { value: "equals", label: "等于", symbol: "=" },
  { value: "greater_than", label: "大于", symbol: ">" },
  { value: "less_than", label: "小于", symbol: "<" },
  { value: "not_equals", label: "不等于", symbol: "≠" },
  { value: "contains", label: "包含", symbol: "∋" },
  { value: "not_contains", label: "不包含", symbol: "∌" }
];

// 节点类型配置
const nodeTypes = [
  {
    type: "approval",
    label: "审批节点",
    icon: <User className="h-4 w-4" />,
    color: "bg-blue-100 border-blue-300 text-blue-800",
    description: "需要人工审批的节点"
  },
  {
    type: "condition",
    label: "条件节点",
    icon: <GitBranch className="h-4 w-4" />,
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    description: "根据条件分支的节点"
  }
];

// 审批人类型配置
const approverTypes = [
  {
    value: "specific_members",
    label: "指定成员",
    description: "选择具体的审批人员",
    icon: <UserCheck className="h-4 w-4" />
  },
  {
    value: "department_manager",
    label: "部门负责人",
    description: "申请人所在部门的负责人",
    icon: <Users className="h-4 w-4" />
  }
];

// 将需要使用 useReactFlow 的逻辑分离到单独的组件中
const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  setNodes,
  setEdges,
  customNodeTypes,
  isFullscreen = false
}: {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onNodeClick: any;
  setNodes: any;
  setEdges: any;
  customNodeTypes: NodeTypes;
  isFullscreen?: boolean;
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const getNodeTypeLabel = (type: string) => {
    const nodeType = nodeTypes.find((nt) => nt.type === type);
    return nodeType ? nodeType.label : type;
  };

  const getDefaultNodeConfig = (type: string) => {
    switch (type) {
      case "approval":
        return {
          approverType: "department_manager" as const,
          approvalType: "single" as const,
          specificApprovers: [],
          allowAllocationEdit: false // 默认不支持编辑分摊
        };
      case "condition":
        return {
          field: "",
          operator: "equals" as const,
          value: "",
          condition: ""
        };
      default:
        return {};
    }
  };

  // 双击连线删除功能
  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      setEdges((eds: Edge[]) => eds.filter((e) => e.id !== edge.id));
    },
    [setEdges]
  );

  // 拖拽结束 - 在画布上放置节点
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      // 检查是否是有效的节点类型
      if (typeof type === "undefined" || !type) {
        return;
      }

      // 使用新的 API 计算在画布中的位置
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode: Node<WorkflowNodeData> = {
        id: `node-${Date.now()}`,
        type: "custom",
        position,
        data: {
          title: getNodeTypeLabel(type),
          type: type as any,
          config: getDefaultNodeConfig(type)
        }
      };

      setNodes((nds: Node<WorkflowNodeData>[]) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  // 允许拖拽放置
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div
      className={`${isFullscreen ? 'h-full' : 'h-[600px]'} border-2 border-dashed border-gray-300 rounded-lg`}
      ref={reactFlowWrapper}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={customNodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.type) {
              case "start":
                return "#10b981";
              case "approval":
                return "#3b82f6";
              case "condition":
                return "#f59e0b";
              case "end":
                return "#6b7280";
              default:
                return "#6b7280";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

const WorkflowDesigner = () => {
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 弹框状态
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  
  // 数据状态
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [formTypes, setFormTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<UserType[]>([]); // 真实用户数据
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );
  const [selectedNode, setSelectedNode] =
    useState<Node<WorkflowNodeData> | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // UI状态
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 用户搜索状态
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);

  // 新建工作流表单
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [newWorkflowFormType, setNewWorkflowFormType] = useState("");

  // React Flow 状态
  const [nodes, setNodes, onNodesChange] = useNodesState(
    selectedWorkflow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    selectedWorkflow?.edges || []
  );

  // 自定义节点类型
  const customNodeTypes: NodeTypes = useMemo(
    () => ({
      custom: CustomNode
    }),
    []
  );

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      // 使用getUsersWithDepartments获取包含部门信息的用户数据
      const usersData = await api.user.getUsersWithDepartments();
      console.log("加载用户数据:", usersData);
      setUsers(usersData);
      setFilteredUsers(usersData); // 初始化过滤后的用户列表
    } catch (error) {
      console.error("加载用户数据失败:", error);
      toast.error("加载用户数据失败");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 过滤用户数据
  const filterUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // 处理用户搜索
  const handleUserSearch = (searchTerm: string) => {
    setUserSearchTerm(searchTerm);
    filterUsers(searchTerm);
  };

  // 加载部门和团队数据
  const loadDepartmentsAndTeams = async () => {
    try {
      const [departmentsData, teamsData] = await Promise.all([
        api.department.getHierarchy(),
        api.team.getTeamsWithMembers()
      ]);

      setDepartments(departmentsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("加载部门和团队数据失败:", error);
      toast.error("加载部门和团队数据失败");
    }
  };

  // 在初始加载数据时调用
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 并行加载工作流列表、表单类型、用户数据、部门和团队数据
        const [workflowsData, formTypesData] = await Promise.all([
          api.workflow.getWorkflowsWithDetails(),
          api.workflow.getFormTypes()
        ]);

        // 加载部门和团队数据
        await loadDepartmentsAndTeams();

        // 转换工作流数据格式
        const transformedWorkflows = await Promise.all(
          workflowsData.map(async (workflow: any) => {
            const details = await api.workflow.getWorkflowDetails(workflow.id);
            return {
              id: details.id,
              name: details.name,
              description: details.description,
              form_type: details.form_type,
              status: details.status,
              nodes: details.nodes || [],
              edges: details.edges || [],
              created_at: details.created_at,
              updated_at: details.updated_at,
              form_type_info: details.form_type_info
            };
          })
        );

        setWorkflows(transformedWorkflows);
        setFormTypes(formTypesData);

        // 选择第一个工作流
        if (transformedWorkflows.length > 0) {
          setSelectedWorkflow(transformedWorkflows[0]);
        }

        // 加载用户数据
        await loadUsers();
      } catch (err) {
        console.error("加载数据失败:", err);
        setError("加载数据失败，请稍后重试");
        toast.error("加载数据失败");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 当选择的工作流改变时，更新节点和边
  useEffect(() => {
    if (selectedWorkflow) {
      setNodes(selectedWorkflow.nodes);
      setEdges(selectedWorkflow.edges);
    }
  }, [selectedWorkflow, setNodes, setEdges]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "已启用";
      case "draft":
        return "草稿";
      case "inactive":
        return "已停用";
      default:
        return "未知";
    }
  };

  const getFormTypeInfo = (formType: string) => {
    return (
      formTypes.find((type) => type.value === formType) || {
        value: formType,
        label: "未知类型",
        description: "",
        icon: "FileText",
        color: "text-gray-600",
        module: "其他"
      }
    );
  };

  const getNodeTypeLabel = (type: string) => {
    const nodeType = nodeTypes.find((nt) => nt.type === type);
    return nodeType ? nodeType.label : type;
  };

  const getApproverTypeInfo = (type: string) => {
    return approverTypes.find((at) => at.value === type) || approverTypes[0];
  };

  // 获取当前表单的可用字段
  const getAvailableFields = () => {
    if (!selectedWorkflow) return [];
    return (
      formFields[selectedWorkflow.form_type as keyof typeof formFields] || []
    );
  };

  // 检查连接是否有效
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // 检查源节点的连接限制
      const existingEdges = edges.filter(
        (edge) => edge.source === connection.source
      );

      // 条件节点最多只能有2个输出连接
      if (sourceNode.data.type === "condition" && existingEdges.length >= 2) {
        return false;
      }

      // 其他节点只能有1个输出连接
      if (sourceNode.data.type !== "condition" && existingEdges.length >= 1) {
        return false;
      }

      // 结束节点不能作为源节点
      if (sourceNode.data.type === "end") {
        return false;
      }

      // 开始节点不能作为目标节点
      if (targetNode.data.type === "start") {
        return false;
      }

      return true;
    },
    [nodes, edges]
  );

  // 连接处理
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) {
        return;
      }

      const sourceNode = nodes.find((node) => node.id === params.source);
      let label = "";

      // 为条件节点的连线添加标签
      if (sourceNode?.data.type === "condition") {
        const existingEdges = edges.filter(
          (edge) => edge.source === params.source
        );
        if (existingEdges.length === 0) {
          label = "是";
        } else if (existingEdges.length === 1) {
          label = "否";
        }
      }

      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: "smoothstep",
        label
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isValidConnection, nodes, edges, setEdges]
  );

  // 节点选择处理
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      if (node.data.type === "approval" || node.data.type === "condition") {
        setSelectedNode(node);
        if (isFullscreen) {
          setShowNodeDialog(true);
        }
      } else {
        setSelectedNode(null);
      }
    },
    [isFullscreen]
  );

  // 拖拽开始
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    if (nodeId === "start" || nodeId === "end") return;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  // 更新节点配置
  const updateNodeConfig = (nodeId: string, config: any) => {
    const updatedNode = nodes.find((n) => n.id === nodeId);
    if (updatedNode) {
      const newNode = {
        ...updatedNode,
        data: {
          ...updatedNode.data,
          config: {
            ...updatedNode.data.config,
            ...config
          }
        }
      };
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? newNode : n)));
      setSelectedNode(newNode);
    }
  };

  // 保存工作流
  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      setIsSaving(true);

      // 验证工作流设计
      const validation = await api.workflow.validateWorkflowDesign(
        nodes,
        edges
      );
      if (!validation.isValid) {
        toast.error(`工作流验证失败：${validation.errors.join(", ")}`);
        return;
      }

      // 保存工作流设计
      await api.workflow.saveWorkflowDesign(selectedWorkflow.id, {
        nodes,
        edges
      });

      // 更新本地状态
      const updatedWorkflow = {
        ...selectedWorkflow,
        nodes,
        edges
      };

      setWorkflows(
        workflows.map((w) =>
          w.id === selectedWorkflow.id ? updatedWorkflow : w
        )
      );

      setSelectedWorkflow(updatedWorkflow);
      toast.success("工作流保存成功");
    } catch (error) {
      console.error("保存工作流失败:", error);
      toast.error("保存工作流失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 创建新工作流
  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      toast.error("请输入工作流名称");
      return;
    }

    if (!newWorkflowFormType) {
      toast.error("请选择业务模块");
      return;
    }

    try {
      const newWorkflow = await api.workflow.createWorkflow({
        name: newWorkflowName,
        description: newWorkflowDescription,
        formType: newWorkflowFormType
      });

      // 获取详细信息
      const workflowDetails = await api.workflow.getWorkflowDetails(
        newWorkflow.id
      );

      const formattedWorkflow = {
        id: workflowDetails.id,
        name: workflowDetails.name,
        description: workflowDetails.description,
        form_type: workflowDetails.form_type,
        status: workflowDetails.status,
        nodes: workflowDetails.nodes || [],
        edges: workflowDetails.edges || [],
        created_at: workflowDetails.created_at,
        updated_at: workflowDetails.updated_at,
        form_type_info: workflowDetails.form_type_info
      };

      setWorkflows([formattedWorkflow, ...workflows]);
      setSelectedWorkflow(formattedWorkflow);
      setIsCreating(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
      setNewWorkflowFormType("");

      toast.success("工作流创建成功");
    } catch (error) {
      console.error("创建工作流失败:", error);
      toast.error("创建工作流失败");
    }
  };

  // 激活/停用工作流
  const handleActivateWorkflow = async (workflowId: string) => {
    try {
      const workflow = workflows.find((w) => w.id === workflowId);
      if (!workflow) return;

      const newStatus = workflow.status === "active" ? "inactive" : "active";

      await api.workflow.toggleWorkflowStatus(workflowId, newStatus);

      setWorkflows(
        workflows.map((w) =>
          w.id === workflowId ? { ...w, status: newStatus } : w
        )
      );

      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow({ ...selectedWorkflow, status: newStatus });
      }

      toast.success(`工作流已${newStatus === "active" ? "启用" : "停用"}`);
    } catch (error) {
      console.error("切换工作流状态失败:", error);
      toast.error("操作失败");
    }
  };

  // 删除工作流
  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm("确定要删除这个工作流吗？此操作不可恢复。")) {
      return;
    }

    try {
      await api.workflow.deleteWorkflow(workflowId);

      setWorkflows(workflows.filter((w) => w.id !== workflowId));

      if (selectedWorkflow?.id === workflowId) {
        const remainingWorkflows = workflows.filter((w) => w.id !== workflowId);
        setSelectedWorkflow(
          remainingWorkflows.length > 0 ? remainingWorkflows[0] : null
        );
      }

      toast.success("工作流删除成功");
    } catch (error) {
      console.error("删除工作流失败:", error);
      toast.error("删除工作流失败");
    }
  };

  // 复制工作流
  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    try {
      const duplicated = await api.workflow.duplicateWorkflow(
        workflow.id,
        `${workflow.name} (副本)`
      );

      // 获取详细信息
      const workflowDetails = await api.workflow.getWorkflowDetails(
        duplicated.id
      );

      const formattedWorkflow = {
        id: workflowDetails.id,
        name: workflowDetails.name,
        description: workflowDetails.description,
        form_type: workflowDetails.form_type,
        status: workflowDetails.status,
        nodes: workflowDetails.nodes || [],
        edges: workflowDetails.edges || [],
        created_at: workflowDetails.created_at,
        updated_at: workflowDetails.updated_at,
        form_type_info: workflowDetails.form_type_info
      };

      setWorkflows([formattedWorkflow, ...workflows]);
      toast.success("工作流复制成功");
    } catch (error) {
      console.error("复制工作流失败:", error);
      toast.error("复制工作流失败");
    }
  };

  // 更新工作流基本信息
  const handleUpdateWorkflow = async (data: {
    name?: string;
    description?: string;
    formType?: string;
  }) => {
    if (!selectedWorkflow) return;

    try {
      await api.workflow.updateWorkflow(selectedWorkflow.id, {
        name: data.name,
        description: data.description,
        formType: data.formType
      });

      const updatedWorkflow = {
        ...selectedWorkflow,
        name: data.name || selectedWorkflow.name,
        description: data.description || selectedWorkflow.description,
        form_type: data.formType || selectedWorkflow.form_type
      };

      setWorkflows(
        workflows.map((w) =>
          w.id === selectedWorkflow.id ? updatedWorkflow : w
        )
      );
      setSelectedWorkflow(updatedWorkflow);

      toast.success("工作流信息更新成功");
    } catch (error) {
      console.error("更新工作流失败:", error);
      toast.error("更新工作流失败");
    }
  };

  // 渲染图标组件
  const renderIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      DollarSign,
      TrendingUp,
      Receipt,
      Building2,
      ShoppingCart,
      Package,
      FileText
    };
    const IconComponent = iconMap[iconName] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  // 获取用户的主要部门名称
  const getUserPrimaryDepartmentName = (user: UserType) => {
    // 如果有直接的primaryDepartment，使用它
    if (user.primaryDepartment?.name) {
      return user.primaryDepartment.name;
    }

    // 否则尝试从departments数组中找到主要部门
    if (user.departments && user.departments.length > 0) {
      // 如果只有一个部门，直接返回
      if (user.departments.length === 1) {
        return user.departments[0].name;
      }

      // 如果有多个部门，可以返回第一个或者有特定标记的
      return user.departments[0].name;
    }

    return "未设置部门";
  };

  // 获取用户的职位名称
  const getUserPositionName = (user: UserType) => {
    return user.position?.name || "未设置职位";
  };

  // 判断是否显示属性面板
  const showPropertyPanel =
    selectedNode &&
    (selectedNode.data.type === "approval" ||
      selectedNode.data.type === "condition");

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">加载中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
        {!isFullscreen && (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">流程配置</h1>
              <p className="text-muted-foreground mt-2">
                设计和管理业务模块审批工作流程
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsFullscreen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                全屏编辑
              </Button>
              <Button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                新建流程
              </Button>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 h-full' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* 工作流列表 - 非全屏模式显示 */}
          {!isFullscreen && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">工作流列表</CardTitle>
                  <CardDescription>选择要编辑的工作流</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workflows.map((workflow) => {
                    const formTypeInfo = getFormTypeInfo(workflow.form_type);
                    return (
                      <div
                        key={workflow.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedWorkflow?.id === workflow.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        }`}
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{workflow.name}</h4>
                          <Badge className={getStatusColor(workflow.status)}>
                            {getStatusText(workflow.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {workflow.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={formTypeInfo.color}>
                              {renderIcon(formTypeInfo.icon)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formTypeInfo.label}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivateWorkflow(workflow.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {workflow.status === "active" ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateWorkflow(workflow);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkflow(workflow.id);
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 工作流设计器 */}
          <div
            className={`${
              isFullscreen 
                ? "col-span-1 h-full" 
                : showPropertyPanel 
                  ? "lg:col-span-2" 
                  : "lg:col-span-3"
            }`}
          >
            {selectedWorkflow ? (
              <Card className={isFullscreen ? 'h-full flex flex-col' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        {selectedWorkflow.name}
                        <div className="flex items-center space-x-2 ml-2">
                          <span
                            className={
                              getFormTypeInfo(selectedWorkflow.form_type).color
                            }
                          >
                            {renderIcon(
                              getFormTypeInfo(selectedWorkflow.form_type).icon
                            )}
                          </span>
                          <Badge variant="outline">
                            {getFormTypeInfo(selectedWorkflow.form_type).label}
                          </Badge>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        {selectedWorkflow.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {isFullscreen && (
                        <Button
                          variant="outline"
                          onClick={() => setIsFullscreen(false)}
                          className="flex items-center gap-2"
                        >
                          <Minimize2 className="h-4 w-4" />
                          退出全屏
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleSaveWorkflow}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        保存
                      </Button>
                      <Button
                        onClick={() =>
                          handleActivateWorkflow(selectedWorkflow.id)
                        }
                        variant={
                          selectedWorkflow.status === "active"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {selectedWorkflow.status === "active" ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            停用
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            启用
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={isFullscreen ? 'flex-1 overflow-hidden' : ''}>
                  {isFullscreen ? (
                    // 全屏模式：直接显示流程设计，不显示Tabs
                    <div className="h-full flex flex-col space-y-4">
                      {/* 可拖拽的节点工具栏 */}
                      <div className="flex gap-2 p-3 bg-accent rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                          <GripVertical className="h-4 w-4" />
                          拖拽节点到画布:
                        </div>
                        {nodeTypes.map((nodeType) => (
                          <div
                            key={nodeType.type}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            draggable
                            onDragStart={(event) =>
                              onDragStart(event, nodeType.type)
                            }
                            title={`拖拽到画布添加${nodeType.description}`}
                          >
                            {nodeType.icon}
                            <span className="text-sm font-medium">
                              {nodeType.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* React Flow 画布 - 全屏模式 */}
                      <div className="flex-1 min-h-0">
                        <FlowCanvas
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          onNodeClick={onNodeClick}
                          setNodes={setNodes}
                          setEdges={setEdges}
                          customNodeTypes={customNodeTypes}
                          isFullscreen={true}
                        />
                      </div>
                    </div>
                  ) : (
                    // 非全屏模式：显示Tabs
                    <Tabs defaultValue="design">
                      <TabsList className="hidden">
                        <TabsTrigger value="design">流程设计</TabsTrigger>
                      </TabsList>

                      <TabsContent value="design" className="space-y-4">
                        {/* 可拖拽的节点工具栏 */}
                        <div className="flex gap-2 p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                            <GripVertical className="h-4 w-4" />
                            拖拽节点到画布:
                          </div>
                          {nodeTypes.map((nodeType) => (
                            <div
                              key={nodeType.type}
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                              draggable
                              onDragStart={(event) =>
                                onDragStart(event, nodeType.type)
                              }
                              title={`拖拽到画布添加${nodeType.description}`}
                            >
                              {nodeType.icon}
                              <span className="text-sm font-medium">
                                {nodeType.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* 操作提示 */}
                        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                          <div className="flex items-center gap-2 mb-1">
                            <Move className="h-3 w-3" />
                            <strong>操作说明:</strong>
                          </div>
                          <ul className="space-y-1 ml-5">
                            <li>
                              • <strong>拖拽添加节点</strong>
                              ：从上方工具栏拖拽节点到画布任意位置
                            </li>
                            <li>
                              • <strong>移动节点</strong>：拖拽已有节点可移动位置
                            </li>
                            <li>
                              • <strong>创建连线</strong>
                              ：从节点右侧绿色连接点拖拽到目标节点左侧蓝色连接点
                            </li>
                            <li>
                              • <strong>删除连线</strong>
                              ：双击连线可删除该连线
                            </li>
                            <li>
                              • <strong>连线限制</strong>
                              ：条件节点最多2个分支（是/否），其他节点只能1个分支
                            </li>
                            <li>
                              • <strong>编辑节点</strong>
                              ：点击审批节点或条件节点在右侧面板编辑属性
                            </li>
                            <li>
                              • <strong>导航</strong>
                              ：使用右下角小地图导航大型流程图
                            </li>
                          </ul>
                        </div>

                        {/* React Flow 画布 */}
                        <FlowCanvas
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          onNodeClick={onNodeClick}
                          setNodes={setNodes}
                          setEdges={setEdges}
                          customNodeTypes={customNodeTypes}
                          isFullscreen={false}
                        />
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    选择工作流
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    从左侧列表选择一个工作流进行编辑
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧属性面板 - 非全屏模式显示 */}
          {showPropertyPanel && !isFullscreen && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedNode.data.type === "approval" ? (
                        <>
                          <Edit3 className="h-4 w-4" />
                          审批节点配置
                        </>
                      ) : (
                        <>
                          <Filter className="h-4 w-4" />
                          条件节点配置
                        </>
                      )}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNode(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedNode.data.type === "approval"
                      ? "配置审批节点的审批人和审批方式"
                      : "配置条件节点的判断条件和分支逻辑"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 基本信息 */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>节点名称</Label>
                      <Input
                        value={selectedNode.data.title}
                        onChange={(e) => {
                          const updatedNode = {
                            ...selectedNode,
                            data: {
                              ...selectedNode.data,
                              title: e.target.value
                            }
                          };
                          setNodes((nds) =>
                            nds.map((n) =>
                              n.id === selectedNode.id ? updatedNode : n
                            )
                          );
                          setSelectedNode(updatedNode);
                        }}
                      />
                    </div>
                  </div>

                  {/* 审批节点配置 */}
                  {selectedNode.data.type === "approval" && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          审批人类型
                        </Label>
                        <RadioGroup
                          value={
                            selectedNode.data.config?.approverType ||
                            "department_manager"
                          }
                          onValueChange={(value) =>
                            updateNodeConfig(selectedNode.id, {
                              approverType: value
                            })
                          }
                        >
                          {approverTypes.map((type) => (
                            <div
                              key={type.value}
                              className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-accent/50"
                            >
                              <RadioGroupItem
                                value={type.value}
                                id={type.value}
                                className="mt-1"
                              />
                              <div className="flex items-center space-x-2 flex-1">
                                <span className="text-primary">
                                  {type.icon}
                                </span>
                                <div className="flex-1">
                                  <Label
                                    htmlFor={type.value}
                                    className="font-medium cursor-pointer text-sm"
                                  >
                                    {type.label}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* 指定成员选择 */}
                      {selectedNode.data.config?.approverType ===
                        "specific_members" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">
                              选择审批人
                            </Label>
                            {isLoadingUsers && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                加载中...
                              </div>
                            )}
                          </div>

                          {/* 搜索框 */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="搜索姓名或工号..."
                              value={userSearchTerm}
                              onChange={(e) => handleUserSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                            {isLoadingUsers ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                  加载用户数据...
                                </span>
                              </div>
                            ) : filteredUsers.length === 0 ? (
                              <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">
                                  {userSearchTerm ? '没有找到匹配的用户' : '暂无用户数据'}
                                </p>
                                {!userSearchTerm && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadUsers}
                                    className="mt-2"
                                  >
                                    重新加载
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {filteredUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-start space-x-2 p-2 hover:bg-accent rounded text-sm"
                                  >
                                    <Checkbox
                                      id={`user-${user.id}`}
                                      checked={
                                        selectedNode.data.config?.specificApprovers?.includes(
                                          user.id
                                        ) || false
                                      }
                                      onCheckedChange={(checked) => {
                                        const currentApprovers =
                                          selectedNode.data.config
                                            ?.specificApprovers || [];
                                        const newApprovers = checked
                                          ? [...currentApprovers, user.id]
                                          : currentApprovers.filter(
                                              (id) => id !== user.id
                                            );
                                        updateNodeConfig(selectedNode.id, {
                                          specificApprovers: newApprovers
                                        });
                                      }}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <Label
                                        htmlFor={`user-${user.id}`}
                                        className="cursor-pointer"
                                      >
                                        <div className="font-medium truncate">
                                          {user.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {user.employee_id}
                                        </div>
                                      </Label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>审批方式</Label>
                        <Select
                          value={
                            selectedNode.data.config?.approvalType || "single"
                          }
                          onValueChange={(value) =>
                            updateNodeConfig(selectedNode.id, {
                              approvalType: value
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">单人审批</SelectItem>
                            <SelectItem value="all">全员审批</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 分摊编辑设置 */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="property-allow-allocation-edit"
                            checked={selectedNode.data.config?.allowAllocationEdit || false}
                            onCheckedChange={(checked) =>
                              updateNodeConfig(selectedNode.id, {
                                allowAllocationEdit: checked
                              })
                            }
                          />
                          <Label htmlFor="property-allow-allocation-edit">
                            支持编辑分摊
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          启用后，审批人在审批过程中可以修改事项的分摊明细
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 条件节点配置 */}
                  {selectedNode.data.type === "condition" && (
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-medium">
                        判断条件配置
                      </Label>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>字段</Label>
                          <Select
                            value={selectedNode.data.config?.field || ""}
                            onValueChange={(value) =>
                              updateNodeConfig(selectedNode.id, {
                                field: value
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择要判断的字段" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableFields().map((field) => (
                                <SelectItem
                                  key={field.value}
                                  value={field.value}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {field.label}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {field.type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>比较方式</Label>
                          <Select
                            value={
                              selectedNode.data.config?.operator || "equals"
                            }
                            onValueChange={(value) =>
                              updateNodeConfig(selectedNode.id, {
                                operator: value
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {comparisonOperators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-sm">
                                      {op.symbol}
                                    </span>
                                    <span>{op.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>比较值</Label>
                          {(() => {
                            // 获取当前选中字段的配置
                            const selectedField = getAvailableFields().find(
                              (f) => f.value === selectedNode.data.config?.field
                            );
                            
                            if (!selectedField) {
                              return (
                                <Input
                                  value={selectedNode.data.config?.value || ""}
                                  onChange={(e) =>
                                    updateNodeConfig(selectedNode.id, {
                                      value: e.target.value
                                    })
                                  }
                                  placeholder="请先选择字段"
                                  disabled
                                />
                              );
                            }

                            // 根据字段类型渲染不同的控件
                            switch (selectedField.type) {
                              case "text":
                              case "number":
                                return (
                                  <Input
                                    type={selectedField.type === "number" ? "number" : "text"}
                                    value={selectedNode.data.config?.value || ""}
                                    onChange={(e) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: e.target.value
                                      })
                                    }
                                    placeholder={`请输入${selectedField.label}`}
                                  />
                                );

                              case "select":
                                return (
                                  <Select
                                    value={selectedNode.data.config?.value || ""}
                                    onValueChange={(value) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: value
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={`请选择${selectedField.label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedField.options?.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );

                              case "users":
                                return (
                                  <Select
                                    value={selectedNode.data.config?.value || ""}
                                    onValueChange={(value) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: value
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="请选择用户" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {isLoadingUsers ? (
                                        <div className="flex items-center justify-center py-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span className="ml-2 text-sm">加载中...</span>
                                        </div>
                                      ) : (
                                        users.map((user) => (
                                          <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center space-x-2">
                                              <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {user.employee_id}
                                                </div>
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                );

                              case "departments":
                                return (
                                  <Select
                                    value={selectedNode.data.config?.value || ""}
                                    onValueChange={(value) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: value
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="请选择部门" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments.map((department) => (
                                        <SelectItem key={department.id} value={department.id.toString()}>
                                          <div className="flex items-center space-x-2">
                                            <div>
                                              <div className="font-medium">{department.name}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {department.description || department.code}
                                              </div>
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );

                              case "teams":
                                return (
                                  <Select
                                    value={selectedNode.data.config?.value || ""}
                                    onValueChange={(value) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: value
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="请选择团队" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {teams.map((team) => (
                                        <SelectItem key={team.id} value={team.id.toString()}>
                                          <div className="flex items-center space-x-2">
                                            <div>
                                              <div className="font-medium">{team.name}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {team.description}
                                              </div>
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );

                              case "companies":
                                // 这里可以添加公司数据，暂时使用placeholder
                                return (
                                  <Select
                                    value={selectedNode.data.config?.value || ""}
                                    onValueChange={(value) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: value
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="请选择公司" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {/* 这里可以添加公司数据源 */}
                                      <SelectItem value="company1">公司A</SelectItem>
                                      <SelectItem value="company2">公司B</SelectItem>
                                    </SelectContent>
                                  </Select>
                                );

                              default:
                                return (
                                  <Input
                                    value={selectedNode.data.config?.value || ""}
                                    onChange={(e) =>
                                      updateNodeConfig(selectedNode.id, {
                                        value: e.target.value
                                      })
                                    }
                                    placeholder="请输入比较值"
                                  />
                                );
                            }
                          })()}
                        </div>

                        {/* 条件预览 */}
                        {selectedNode.data.config?.field &&
                          selectedNode.data.config?.operator && (
                            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                条件预览
                              </div>
                              <div className="text-sm text-blue-700 font-mono">
                                {getAvailableFields().find(
                                  (f) =>
                                    f.value === selectedNode.data.config?.field
                                )?.label ||
                                  selectedNode.data.config?.field}{" "}
                                {
                                  comparisonOperators.find(
                                    (op) =>
                                      op.value ===
                                      selectedNode.data.config?.operator
                                  )?.symbol
                                }{" "}
                                {selectedNode.data.config?.value || "(未设置)"}
                              </div>
                            </div>
                          )}

                        {/* 分支说明 */}
                        <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                          <div className="text-sm font-medium text-yellow-800 mb-1">
                            分支说明
                          </div>
                          <div className="text-sm text-yellow-700 space-y-1">
                            <div>
                              • <strong>是</strong>：条件判断为真时的分支
                            </div>
                            <div>
                              • <strong>否</strong>：条件判断为假时的分支
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 删除按钮 */}
                  {selectedNode.id !== "start" && selectedNode.id !== "end" && (
                    <div className="border-t pt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNode(selectedNode.id)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除节点
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 新建工作流对话框 */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>新建工作流</CardTitle>
                <CardDescription>
                  为业务模块创建新的审批工作流程
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">流程名称</Label>
                  <Input
                    id="new-name"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="请输入流程名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-description">流程描述</Label>
                  <Input
                    id="new-description"
                    value={newWorkflowDescription}
                    onChange={(e) => setNewWorkflowDescription(e.target.value)}
                    placeholder="请输入流程描述"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-form-type">业务模块</Label>
                  <Select
                    value={newWorkflowFormType}
                    onValueChange={setNewWorkflowFormType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联的业务模块" />
                    </SelectTrigger>
                    <SelectContent>
                      {formTypes.map((formType) => (
                        <SelectItem key={formType.value} value={formType.value}>
                          <div className="flex items-center space-x-2">
                            <span className={formType.color}>
                              {renderIcon(formType.icon)}
                            </span>
                            <div>
                              <div className="font-medium">
                                {formType.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formType.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflowName.trim() || !newWorkflowFormType}
                >
                  创建
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 节点编辑弹框 - 全屏模式 */}
        {showNodeDialog && selectedNode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedNode.data.type === "approval" ? (
                      <>
                        <Edit3 className="h-4 w-4" />
                        审批节点配置
                      </>
                    ) : (
                      <>
                        <Filter className="h-4 w-4" />
                        条件节点配置
                      </>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNodeDialog(false);
                      setSelectedNode(null);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>
                  {selectedNode.data.type === "approval"
                    ? "配置审批节点的审批人和审批方式"
                    : "配置条件节点的判断条件和分支逻辑"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 基本信息 */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>节点名称</Label>
                    <Input
                      value={selectedNode.data.title}
                      onChange={(e) => {
                        const updatedNode = {
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            title: e.target.value
                          }
                        };
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id ? updatedNode : n
                          )
                        );
                        setSelectedNode(updatedNode);
                      }}
                    />
                  </div>
                </div>

                {/* 审批节点配置 */}
                {selectedNode.data.type === "approval" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        审批人类型
                      </Label>
                      <RadioGroup
                        value={
                          selectedNode.data.config?.approverType ||
                          "department_manager"
                        }
                        onValueChange={(value) =>
                          updateNodeConfig(selectedNode.id, {
                            approverType: value
                          })
                        }
                      >
                        {approverTypes.map((type) => (
                          <div
                            key={type.value}
                            className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-accent/50"
                          >
                            <RadioGroupItem
                              value={type.value}
                              id={type.value}
                              className="mt-1"
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-primary">
                                {type.icon}
                              </span>
                              <div className="flex-1">
                                <Label
                                  htmlFor={type.value}
                                  className="font-medium cursor-pointer text-sm"
                                >
                                  {type.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* 指定成员选择 */}
                    {selectedNode.data.config?.approverType ===
                      "specific_members" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">
                            选择审批人
                          </Label>
                          {isLoadingUsers && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              加载中...
                            </div>
                          )}
                        </div>

                        {/* 搜索框 */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="搜索姓名或工号..."
                            value={userSearchTerm}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                          {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                加载用户数据...
                              </span>
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground">
                                {userSearchTerm ? '没有找到匹配的用户' : '暂无用户数据'}
                              </p>
                              {!userSearchTerm && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={loadUsers}
                                  className="mt-2"
                                >
                                  重新加载
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {filteredUsers.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-start space-x-2 p-2 hover:bg-accent rounded text-sm"
                                >
                                  <Checkbox
                                    id={`user-${user.id}`}
                                    checked={
                                      selectedNode.data.config?.specificApprovers?.includes(
                                        user.id
                                      ) || false
                                    }
                                    onCheckedChange={(checked) => {
                                      const currentApprovers =
                                        selectedNode.data.config
                                          ?.specificApprovers || [];
                                      const newApprovers = checked
                                        ? [...currentApprovers, user.id]
                                        : currentApprovers.filter(
                                            (id) => id !== user.id
                                          );
                                      updateNodeConfig(selectedNode.id, {
                                        specificApprovers: newApprovers
                                      });
                                    }}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Label
                                      htmlFor={`user-${user.id}`}
                                      className="cursor-pointer"
                                    >
                                      <div className="font-medium truncate">
                                        {user.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {user.employee_id}
                                      </div>
                                    </Label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 审批方式 */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        审批方式
                      </Label>
                      <RadioGroup
                        value={
                          selectedNode.data.config?.approvalType ||
                          "single"
                        }
                        onValueChange={(value) =>
                          updateNodeConfig(selectedNode.id, {
                            approvalType: value
                          })
                        }
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-accent/50">
                            <RadioGroupItem
                              value="single"
                              id="single"
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor="single"
                                className="font-medium cursor-pointer text-sm"
                              >
                                单人审批
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                只需一人审批通过即可
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-accent/50">
                            <RadioGroupItem
                              value="all"
                              id="all"
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor="all"
                                className="font-medium cursor-pointer text-sm"
                              >
                                多人审批
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                需要所有人审批通过
                              </p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 分摊编辑设置 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow-allocation-edit"
                          checked={selectedNode.data.config?.allowAllocationEdit || false}
                          onCheckedChange={(checked) =>
                            updateNodeConfig(selectedNode.id, {
                              allowAllocationEdit: checked
                            })
                          }
                        />
                        <Label htmlFor="allow-allocation-edit" className="text-base font-medium">
                          是否支持编辑分摊
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        启用后，审批人在审批过程中可以修改事项的分摊明细
                      </p>
                    </div>
                  </div>
                )}

                {/* 条件节点配置 */}
                {selectedNode.data.type === "condition" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        判断字段
                      </Label>
                      <Select
                        value={selectedNode.data.config?.field || ""}
                        onValueChange={(value) =>
                          updateNodeConfig(selectedNode.id, {
                            field: value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择要判断的字段" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFields().map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        比较操作符
                      </Label>
                      <Select
                        value={selectedNode.data.config?.operator || "equals"}
                        onValueChange={(value) =>
                          updateNodeConfig(selectedNode.id, {
                            operator: value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {comparisonOperators.map((operator) => (
                            <SelectItem
                              key={operator.value}
                              value={operator.value}
                            >
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        比较值
                      </Label>
                      {(() => {
                        const field = getAvailableFields().find(
                          (f) => f.value === selectedNode.data.config?.field
                        );
                        switch (field?.type) {
                          case "number":
                            return (
                              <Input
                                type="number"
                                value={selectedNode.data.config?.value || ""}
                                onChange={(e) =>
                                  updateNodeConfig(selectedNode.id, {
                                    value: e.target.value
                                  })
                                }
                                placeholder="请输入数字"
                              />
                            );

                          case "select":
                            return (
                              <Select
                                value={selectedNode.data.config?.value || ""}
                                onValueChange={(value) =>
                                  updateNodeConfig(selectedNode.id, {
                                    value: value
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择值" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );

                          default:
                            return (
                              <Input
                                value={selectedNode.data.config?.value || ""}
                                onChange={(e) =>
                                  updateNodeConfig(selectedNode.id, {
                                    value: e.target.value
                                  })
                                }
                                placeholder="请输入比较值"
                              />
                            );
                        }
                      })()}
                    </div>

                    {/* 条件预览 */}
                    {selectedNode.data.config?.field &&
                      selectedNode.data.config?.operator && (
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <div className="text-sm font-medium text-blue-800 mb-1">
                            条件预览
                          </div>
                          <div className="text-sm text-blue-700 font-mono">
                            {getAvailableFields().find(
                              (f) =>
                                f.value === selectedNode.data.config?.field
                            )?.label ||
                              selectedNode.data.config?.field}{" "}
                            {
                              comparisonOperators.find(
                                (op) =>
                                  op.value ===
                                  selectedNode.data.config?.operator
                              )?.symbol
                            }{" "}
                            {selectedNode.data.config?.value || "(未设置)"}
                          </div>
                        </div>
                      )}

                    {/* 分支说明 */}
                    <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-sm font-medium text-yellow-800 mb-1">
                        分支说明
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>
                          • <strong>是</strong>：条件判断为真时的分支
                        </div>
                        <div>
                          • <strong>否</strong>：条件判断为假时的分支
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 删除按钮 */}
                {selectedNode.id !== "start" && selectedNode.id !== "end" && (
                  <div className="border-t pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deleteNode(selectedNode.id);
                        setShowNodeDialog(false);
                        setSelectedNode(null);
                      }}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除节点
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowDesigner;
