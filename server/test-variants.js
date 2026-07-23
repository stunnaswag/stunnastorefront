import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('variants')
    .select('id, stock, size, color, product_id, products(name, is_active)')
    .order('stock', { ascending: true });
    
  console.log(JSON.stringify(data, null, 2));
}
test();
