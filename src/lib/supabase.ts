import { createClient } from '@supabase/supabase-js'

// 直接使用正确的数据库连接参数
const supabaseUrl = 'https://database.fedin.cn'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'schema_11'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
})

// 数据库助手函数
const getSupabaseClient = () => supabase

// 通用错误处理
const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.message) {
    return error.message
  }
  
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return '请求的资源不存在'
      case 'PGRST301':
        return '没有权限访问该资源'
      case '42P01':
        return '数据表不存在'
      default:
        return `数据库错误: ${error.code}`
    }
  }
  
  return '未知错误'
}

// 数据库查询助手
export const executeQuery = async (query: any) => {
  try {
    console.log('Executing query:', query);
    const { data, error, status, statusText } = await query;
    
    console.log('Query response:', {
      data,
      error,
      status,
      statusText
    });
    
    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(handleSupabaseError(error));
  }
}

// 分页查询助手
export const executePaginatedQuery = async (
  query: any,
  page: number = 1,
  pageSize: number = 10
) => {
  try {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    
    const { data, error, count } = await query
      .range(start, end)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return {
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  } catch (error) {
    console.error('Paginated query error:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// 批量操作助手
const executeBatchOperation = async (operations: Promise<any>[]) => {
  try {
    const results = await Promise.allSettled(operations)
    
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      console.error('Batch operation failures:', failures)
      throw new Error(`批量操作失败: ${failures.length}/${results.length} 个操作失败`)
    }
    
    return results.map(result => result.status === 'fulfilled' ? result.value : null)
  } catch (error) {
    console.error('Batch operation error:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// 实时订阅助手
const createRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'schema_11',
        table: table,
        filter: filter
      },
      callback
    )
    .subscribe()
  
  return channel
}

// 文件上传助手
const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options)
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// 获取文件公共URL
const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// 删除文件
const deleteFile = async (bucket: string, paths: string[]) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('File deletion error:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export default supabase 