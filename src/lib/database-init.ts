import { supabase } from './supabase';

export async function initializeAssetTables() {
  try {
    console.log('开始初始化资产管理表...');

    // 首先检查表是否存在
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['asset_categories', 'asset_locations', 'asset_brands']);

    console.log('现有表:', tables);

    // 如果表不存在，则通过RPC调用创建
    const { error: rpcError } = await supabase.rpc('create_asset_tables_if_not_exists');
    
    if (rpcError) {
      console.error('创建表失败:', rpcError);
      throw rpcError;
    }

    console.log('资产管理表初始化完成');
    return true;
  } catch (error) {
    console.error('初始化资产管理表时发生错误:', error);
    return false;
  }
}

// 创建一些基础数据
export async function seedAssetData() {
  try {
    console.log('开始插入基础数据...');

    // 检查是否已有数据
    const { data: existingCategories } = await supabase
      .from('asset_categories')
      .select('id')
      .limit(1);

    if (existingCategories && existingCategories.length > 0) {
      console.log('基础数据已存在，跳过插入');
      return true;
    }

    // 插入资产分类基础数据
    const { error: categoriesError } = await supabase
      .from('asset_categories')
      .insert([
        {
          name: '计算机设备',
          code: 'IT001',
          level: 1,
          sort_order: 1,
          status: 'active'
        },
        {
          name: '办公设备',
          code: 'OF001',
          level: 1,
          sort_order: 2,
          status: 'active'
        },
        {
          name: '办公家具',
          code: 'FU001',
          level: 1,
          sort_order: 3,
          status: 'active'
        }
      ]);

    if (categoriesError) {
      console.error('插入分类数据失败:', categoriesError);
    }

    // 插入资产位置基础数据
    const { error: locationsError } = await supabase
      .from('asset_locations')
      .insert([
        {
          name: '总部大厦',
          code: 'LOC001',
          type: 'building',
          level: 1,
          capacity: 1000,
          status: 'active'
        },
        {
          name: '研发中心',
          code: 'LOC002',
          type: 'building',
          level: 1,
          capacity: 500,
          status: 'active'
        }
      ]);

    if (locationsError) {
      console.error('插入位置数据失败:', locationsError);
    }

    // 插入品牌基础数据
    const { error: brandsError } = await supabase
      .from('asset_brands')
      .insert([
        {
          name: '联想',
          code: 'BRAND001',
          country: '中国',
          status: 'active'
        },
        {
          name: '戴尔',
          code: 'BRAND002',
          country: '美国',
          status: 'active'
        },
        {
          name: '苹果',
          code: 'BRAND003',
          country: '美国',
          status: 'active'
        }
      ]);

    if (brandsError) {
      console.error('插入品牌数据失败:', brandsError);
    }

    console.log('基础数据插入完成');
    return true;
  } catch (error) {
    console.error('插入基础数据时发生错误:', error);
    return false;
  }
} 