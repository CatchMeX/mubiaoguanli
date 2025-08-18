// 请假类型选项
export const LEAVE_TYPE_OPTIONS = [
  { value: 'annual', label: '年假' },
  { value: 'personal', label: '事假' },
  { value: 'sick', label: '病假' },
  { value: 'marriage', label: '婚假' },
  { value: 'maternity', label: '产假' },
  { value: 'paternity', label: '陪产假' },
  { value: 'bereavement', label: '丧假' }
] as const;

// 时间段选项
export const PERIOD_OPTIONS = [
  { value: 'full_day', label: '全天' },
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' }
] as const;

// 交通工具选项
export const TRANSPORTATION_OPTIONS = [
  { value: 'plane', label: '飞机' },
  { value: 'train', label: '火车' },
  { value: 'bus', label: '汽车' },
  { value: 'car', label: '自驾' },
  { value: 'other', label: '其他' }
] as const;

// 出差类型选项
export const TRIP_TYPE_OPTIONS = [
  { value: 'one_way', label: '单程' },
  { value: 'round_trip', label: '往返' }
] as const;

// 申请状态选项
export const REQUEST_STATUS_OPTIONS = [
  { value: 'pending', label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: '已批准', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: '已拒绝', color: 'bg-red-100 text-red-800' }
] as const;

// 出差状态选项
export const BUSINESS_TRIP_STATUS_OPTIONS = [
  { value: 'pending', label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: '已批准', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: '已拒绝', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: '已完成', color: 'bg-blue-100 text-blue-800' }
] as const;

// 考勤组
export interface AttendanceGroup {
  id: string;
  name: string;
  description?: string;
  workStartTime: string;
  workEndTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// 考勤组成员
export interface AttendanceGroupMember {
  id: string;
  groupId: string;
  memberId: string;
  joinedAt: string;
}

// 请假申请
export interface LeaveRequest {
  id: string;
  requestNumber: string;
  applicantId: string;
  leaveType: string;
  startDate: string;
  startPeriod: string;
  endDate: string;
  endPeriod: string;
  durationHours: number;
  reason: string;
  attachmentUrl?: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 请假申请详情（包含关联信息）
export interface LeaveRequestDetail extends LeaveRequest {
  applicantEmployeeId: string;
  applicantName: string;
  applicantEmail: string;
  applicantDepartment: string;
  approverName?: string;
}

// 出差申请
export interface BusinessTrip {
  id: string;
  requestNumber: string;
  applicantId: string;
  startDate: string;
  startPeriod: string;
  endDate: string;
  endPeriod: string;
  durationHours: number;
  departureLocation: string;
  destination: string;
  transportation: string;
  tripType: string;
  purpose: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 出差申请详情（包含关联信息）
export interface BusinessTripDetail extends BusinessTrip {
  applicantEmployeeId: string;
  applicantName: string;
  applicantEmail: string;
  applicantDepartment: string;
  approverName?: string;
  companions?: string[];
}

// 补卡申请
export interface CardReplacement {
  id: string;
  requestNumber: string;
  applicantId: string;
  departmentId: string;
  replacementDate: string;
  replacementTime: string;
  reason: string;
  attachmentUrl?: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 补卡申请详情（包含关联信息）
export interface CardReplacementDetail extends CardReplacement {
  applicantEmployeeId: string;
  applicantName: string;
  applicantEmail: string;
  applicantDepartment: string;
  approverName?: string;
}

// 外出申请
export interface Outing {
  id: string;
  requestNumber: string;
  applicantId: string;
  location: string;
  startDate: string;
  startPeriod: string;
  endDate: string;
  endPeriod: string;
  durationHours: number;
  attachmentUrl?: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 外出申请详情（包含关联信息）
export interface OutingDetail extends Outing {
  applicantEmployeeId: string;
  applicantName: string;
  applicantEmail: string;
  applicantDepartment: string;
  approverName?: string;
}

// 行政管理统计
export interface AdministrativeStatistics {
  totalLeaveRequests: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  rejectedLeaveRequests: number;
  totalBusinessTrips: number;
  pendingBusinessTrips: number;
  approvedBusinessTrips: number;
  completedBusinessTrips: number;
  totalCardReplacements: number;
  pendingCardReplacements: number;
  totalOutings: number;
  pendingOutings: number;
}

// 创建请假申请数据
export interface CreateLeaveRequestData {
  applicantId: string;
  leaveType: string;
  startDate: string;
  startPeriod: string;
  endDate: string;
  endPeriod: string;
  reason: string;
  attachmentUrl?: string;
}

// 更新请假申请数据
export interface UpdateLeaveRequestData {
  leaveType?: string;
  startDate?: string;
  startPeriod?: string;
  endDate?: string;
  endPeriod?: string;
  reason?: string;
  attachmentUrl?: string;
}

// 创建出差申请数据
export interface CreateBusinessTripData {
  applicantId: string;
  startDate: string;
  startPeriod: string;
  endDate: string;
  endPeriod: string;
  departureLocation: string;
  destination: string;
  transportation: string;
  tripType: string;
  purpose: string;
  companionIds?: string[];
}

// 更新出差申请数据
export interface UpdateBusinessTripData {
  startDate?: string;
  startPeriod?: string;
  endDate?: string;
  endPeriod?: string;
  departureLocation?: string;
  destination?: string;
  transportation?: string;
  tripType?: string;
  purpose?: string;
  companionIds?: string[];
}

// 创建补卡申请数据
export interface CreateCardReplacementData {
  applicantId: string;
  departmentId: string;
  replacementDate: string;
  replacementTime: string;
  reason: string;
  attachmentUrl?: string;
}

// 更新补卡申请数据
export interface UpdateCardReplacementData {
  departmentId?: string;
  replacementDate?: string;
  replacementTime?: string;
  reason?: string;
  attachmentUrl?: string;
}

// 创建外出申请数据
export interface CreateOutingData {
  applicantId: string;
  location: string;
  startDate: string;
  startPeriod: string;
  endDate: string;
  endPeriod: string;
  attachmentUrl?: string;
}

// 更新外出申请数据
export interface UpdateOutingData {
  location?: string;
  startDate?: string;
  startPeriod?: string;
  endDate?: string;
  endPeriod?: string;
  attachmentUrl?: string;
} 