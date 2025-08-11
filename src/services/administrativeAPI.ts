import { supabase } from '@/lib/supabase';
import { executeQuery } from '@/lib/supabase';
import type {
  AttendanceGroup,
  AttendanceGroupMember,
  LeaveRequest,
  LeaveRequestDetail,
  BusinessTrip,
  BusinessTripDetail,
  CardReplacement,
  CardReplacementDetail,
  Outing,
  OutingDetail,
  AdministrativeStatistics
} from '@/types/administrative';

// 考勤组管理 API
export class AttendanceGroupAPI {
  async getAll(): Promise<AttendanceGroup[]> {
    return executeQuery(
      supabase
        .from('attendance_groups')
        .select('*')
        .order('created_at', { ascending: false })
    );
  }

  async getById(id: string): Promise<AttendanceGroup> {
    return executeQuery(
      supabase
        .from('attendance_groups')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async create(data: {
    name: string;
    description?: string;
    work_start_time: string;
    work_end_time: string;
    break_start_time?: string;
    break_end_time?: string;
    is_active: boolean;
    created_by_id: string;
  }): Promise<AttendanceGroup> {
    return executeQuery(
      supabase
        .from('attendance_groups')
        .insert(data)
        .select()
        .single()
    );
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    work_start_time?: string;
    work_end_time?: string;
    break_start_time?: string;
    break_end_time?: string;
    is_active?: boolean;
  }): Promise<AttendanceGroup> {
    return executeQuery(
      supabase
        .from('attendance_groups')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    return executeQuery(
      supabase
        .from('attendance_groups')
        .delete()
        .eq('id', id)
    );
  }

  async addMember(groupId: string, memberId: string): Promise<AttendanceGroupMember> {
    return executeQuery(
      supabase
        .from('attendance_group_members')
        .insert({
          group_id: groupId,
          member_id: memberId
        })
        .select()
        .single()
    );
  }

  async removeMember(groupId: string, memberId: string): Promise<void> {
    return executeQuery(
      supabase
        .from('attendance_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('member_id', memberId)
    );
  }
}

// 请假管理 API
export class LeaveRequestAPI {
  async getAll(): Promise<LeaveRequestDetail[]> {
    return executeQuery(
      supabase
        .from('leave_request_details')
        .select('*')
        .order('created_at', { ascending: false })
    );
  }

  async getById(id: string): Promise<LeaveRequestDetail> {
    return executeQuery(
      supabase
        .from('leave_request_details')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async create(data: Omit<LeaveRequest, 'id' | 'request_number' | 'status' | 'created_at' | 'updated_at'>): Promise<LeaveRequest> {
    return executeQuery(
      supabase
        .from('leave_requests')
        .insert(data)
        .select()
        .single()
    );
  }

  async update(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return executeQuery(
      supabase
        .from('leave_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    return executeQuery(
      supabase
        .from('leave_requests')
        .delete()
        .eq('id', id)
    );
  }

  async approve(id: string, approved: boolean, approverId?: string, notes?: string): Promise<LeaveRequest> {
    const updateData: any = {
      status: approved ? 'approved' : 'rejected',
      approved_at: new Date().toISOString()
    };
    
    if (approverId) updateData.approved_by_id = approverId;
    if (notes) updateData.approval_notes = notes;

    return executeQuery(
      supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    );
  }

  calculateDuration(startDate: string, startPeriod: string, endDate: string, endPeriod: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 计算天数差
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // 计算小时数
    let hours = daysDiff * 8; // 默认每天8小时
    
    // 根据时间段调整
    if (startPeriod === 'morning') hours -= 4;
    if (startPeriod === 'afternoon') hours -= 4;
    if (endPeriod === 'morning') hours -= 4;
    if (endPeriod === 'afternoon') hours -= 4;
    
    return Math.max(0, hours);
  }
}

// 出差管理 API
export class BusinessTripAPI {
  async getAll(): Promise<BusinessTripDetail[]> {
    return executeQuery(
      supabase
        .from('business_trip_details')
        .select('*')
        .order('created_at', { ascending: false })
    );
  }

  async getById(id: string): Promise<BusinessTripDetail> {
    return executeQuery(
      supabase
        .from('business_trip_details')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async create(data: Omit<BusinessTrip, 'id' | 'request_number' | 'status' | 'created_at' | 'updated_at'>): Promise<BusinessTrip> {
    return executeQuery(
      supabase
        .from('business_trips')
        .insert(data)
        .select()
        .single()
    );
  }

  async update(id: string, data: Partial<BusinessTrip>): Promise<BusinessTrip> {
    return executeQuery(
      supabase
        .from('business_trips')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    return executeQuery(
      supabase
        .from('business_trips')
        .delete()
        .eq('id', id)
    );
  }

  async addCompanion(tripId: string, companionId: string): Promise<void> {
    return executeQuery(
      supabase
        .from('business_trip_companions')
        .insert({
          trip_id: tripId,
          companion_id: companionId
        })
    );
  }

  async removeCompanion(tripId: string, companionId: string): Promise<void> {
    return executeQuery(
      supabase
        .from('business_trip_companions')
        .delete()
        .eq('trip_id', tripId)
        .eq('companion_id', companionId)
    );
  }

  calculateDuration(startDate: string, startPeriod: string, endDate: string, endPeriod: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let hours = daysDiff * 8;
    
    if (startPeriod === 'morning') hours -= 4;
    if (startPeriod === 'afternoon') hours -= 4;
    if (endPeriod === 'morning') hours -= 4;
    if (endPeriod === 'afternoon') hours -= 4;
    
    return Math.max(0, hours);
  }
}

// 补卡管理 API
export class CardReplacementAPI {
  async getAll(): Promise<CardReplacementDetail[]> {
    return executeQuery(
      supabase
        .from('card_replacement_details')
        .select('*')
        .order('created_at', { ascending: false })
    );
  }

  async getById(id: string): Promise<CardReplacementDetail> {
    return executeQuery(
      supabase
        .from('card_replacement_details')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async create(data: Omit<CardReplacement, 'id' | 'request_number' | 'status' | 'created_at' | 'updated_at'>): Promise<CardReplacement> {
    return executeQuery(
      supabase
        .from('card_replacements')
        .insert(data)
        .select()
        .single()
    );
  }

  async update(id: string, data: Partial<CardReplacement>): Promise<CardReplacement> {
    return executeQuery(
      supabase
        .from('card_replacements')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    return executeQuery(
      supabase
        .from('card_replacements')
        .delete()
        .eq('id', id)
    );
  }
}

// 外出管理 API
export class OutingAPI {
  async getAll(): Promise<OutingDetail[]> {
    return executeQuery(
      supabase
        .from('outing_details')
        .select('*')
        .order('created_at', { ascending: false })
    );
  }

  async getById(id: string): Promise<OutingDetail> {
    return executeQuery(
      supabase
        .from('outing_details')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async create(data: Omit<Outing, 'id' | 'request_number' | 'status' | 'created_at' | 'updated_at'>): Promise<Outing> {
    return executeQuery(
      supabase
        .from('outings')
        .insert(data)
        .select()
        .single()
    );
  }

  async update(id: string, data: Partial<Outing>): Promise<Outing> {
    return executeQuery(
      supabase
        .from('outings')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    return executeQuery(
      supabase
        .from('outings')
        .delete()
        .eq('id', id)
    );
  }

  calculateDuration(startDate: string, startPeriod: string, endDate: string, endPeriod: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let hours = daysDiff * 8;
    
    if (startPeriod === 'morning') hours -= 4;
    if (startPeriod === 'afternoon') hours -= 4;
    if (endPeriod === 'morning') hours -= 4;
    if (endPeriod === 'afternoon') hours -= 4;
    
    return Math.max(0, hours);
  }
}

// 行政管理统计 API
export class AdministrativeStatisticsAPI {
  async getStatistics(): Promise<AdministrativeStatistics> {
    // 这里可以实现统计数据的聚合查询
    // 暂时返回模拟数据
    return {
      totalLeaveRequests: 0,
      pendingLeaveRequests: 0,
      approvedLeaveRequests: 0,
      rejectedLeaveRequests: 0,
      totalBusinessTrips: 0,
      pendingBusinessTrips: 0,
      approvedBusinessTrips: 0,
      completedBusinessTrips: 0,
      totalCardReplacements: 0,
      pendingCardReplacements: 0,
      totalOutings: 0,
      pendingOutings: 0
    };
  }
} 