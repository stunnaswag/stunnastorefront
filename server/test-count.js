import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { count, error } = await supabase
    .from('variants')
    .select('products!inner(is_active)', { count: 'exact', head: true })
    .lte('stock', 5)
    .eq('products.is_active', true);
    
  console.log('Count:', count);
  console.log('Error:', error);
}
test();
