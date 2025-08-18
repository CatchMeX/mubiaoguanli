import type { Team, User } from './index';

export interface RideSharingDailyReport {
  id: string;
  report_date: string;
  team_id: string;
  total_vehicles: number;
  operating_vehicles: number;
  week_day: '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';
  revenue_gmv: number;
  daily_turnover_rate: number; // 百分数，如 85.50 表示 85.50%
  daily_orders: number;
  average_order_revenue: number;
  average_vehicle_revenue: number;
  daily_moved_vehicles: number;
  average_moves_per_person: number;
  battery_swaps: number;
  average_swaps_per_person: number;
  dispatch_staff: number;
  battery_staff: number;
  patrol_staff: number;
  warehouse_staff: number;
  assistant_staff: number;
  total_users: number;
  active_users: number;
  new_users: number;
  maintenance_vehicles: number;
  scrapped_vehicles: number;
  inventory_vehicles: number;
  cleaned_vehicles: number;
  idle_vehicles_24h_plus: number;
  weather?: string;
  refund_amount: number;
  unpaid_rides: number;
  low_battery_rate: number; // 百分数，如 15.30 表示 15.30%
  created_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RideSharingDailyReportFormData {
  report_date: string;
  team_id: string;
  total_vehicles: number;
  operating_vehicles: number;
  week_day: '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';
  revenue_gmv: number;
  daily_turnover_rate: number;
  daily_orders: number;
  average_order_revenue: number;
  average_vehicle_revenue: number;
  daily_moved_vehicles: number;
  average_moves_per_person: number;
  battery_swaps: number;
  average_swaps_per_person: number;
  dispatch_staff: number;
  battery_staff: number;
  patrol_staff: number;
  warehouse_staff: number;
  assistant_staff: number;
  total_users: number;
  active_users: number;
  new_users: number;
  maintenance_vehicles: number;
  scrapped_vehicles: number;
  inventory_vehicles: number;
  cleaned_vehicles: number;
  idle_vehicles_24h_plus: number;
  weather?: string;
  refund_amount: number;
  unpaid_rides: number;
  low_battery_rate: number;
}

export interface RideSharingStatistics {
  total_reports: number;
  total_revenue: number;
  total_orders: number;
  average_turnover_rate: number;
  total_vehicles: number;
  average_operating_rate: number;
}

export const WEEK_DAYS = [
  { value: '周一', label: '周一' },
  { value: '周二', label: '周二' },
  { value: '周三', label: '周三' },
  { value: '周四', label: '周四' },
  { value: '周五', label: '周五' },
  { value: '周六', label: '周六' },
  { value: '周日', label: '周日' },
] as const; 