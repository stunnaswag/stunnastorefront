// ============================================================
// STUNNA — Express API Server
// ============================================================
// This is the foundational backend for the Stunna streetwear
// e-commerce store. It exposes a JSON API consumed by the
// vanilla JS frontend and handles all Supabase interactions
// using the service-role key (bypasses RLS).
// ============================================================

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// 1. Path Verification
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.warn(`⚠️  Warning: .env file not found at ${envPath}`);
} else {
  console.log(`✅ .env file found at ${envPath}`);
}

dotenv.config();

import dns from 'node:dns';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import multer from 'multer';

// Set up memory storage for multipart uploads
const upload = multer({ storage: multer.memoryStorage() });
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// 1. ENVIRONMENT VALIDATION
// ============================================================
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'https://stunnaswagseason.onrender.com';
const allowedOrigins = Array.from(new Set([
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean)));

// 3. Cleaning: trim and remove quotes
let rawSupabaseUrl = process.env.SUPABASE_URL || '';
let rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const SUPABASE_URL = rawSupabaseUrl.replace(/^"|"$/g, '').trim();
const SUPABASE_SERVICE_ROLE_KEY = rawServiceRoleKey.replace(/^"|"$/g, '').trim();

// 2. Hard-coded Validation
if (!SUPABASE_URL) {
  throw new Error("Error: Missing SUPABASE_URL in .env configuration.");
}
if (!SUPABASE_URL.startsWith('http')) {
  throw new Error(`Error: Invalid SUPABASE_URL. Must start with 'http'. Detected: '${SUPABASE_URL}'`);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env configuration.");
}

// 4. Debug Logging
console.log(`✅ Supabase configuration validated:`);
console.log(`   → URL present: true | Length: ${SUPABASE_URL.length} | Start: ${SUPABASE_URL.substring(0, 10)}...`);
console.log(`   → Service Key present: true | Length: ${SUPABASE_SERVICE_ROLE_KEY.length} | Start: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...`);

// ============================================================
// 2. SUPABASE CLIENT (service-role)
// ============================================================
// The service-role key bypasses Row Level Security entirely.
// NEVER expose this key to the frontend.

// 5. Initialization only occurs after all checks pass
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================
// 3. EXPRESS SETUP
// ============================================================

const app = express();

// --- Middleware ---

// Parse incoming JSON bodies (for POST/PUT routes later)
app.use(express.json());

// CORS — allow the live Render origin and keep localhost development working
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Simple request logger for development
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ============================================================
// 4. ADMIN MIDDLEWARE
// ============================================================

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Missing or invalid token format.' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('CRITICAL: JWT_SECRET is not configured in .env');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid or expired token.' });
  }
};

const upsertDefaultVariantStock = async (productId, stock) => {
  const normalizedStock = Number.parseInt(stock, 10);

  if (Number.isNaN(normalizedStock) || normalizedStock < 0) {
    return null;
  }

  const { data: existingVariants, error: selectError } = await supabase
    .from('variants')
    .select('id')
    .eq('product_id', productId)
    .eq('size', 'ONE SIZE');

  if (selectError) throw selectError;

  if (existingVariants?.length) {
    const { data: updatedVariant, error: updateError } = await supabase
      .from('variants')
      .update({ stock: normalizedStock })
      .eq('id', existingVariants[0].id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedVariant;
  }

  const sku = `VAR-${productId.substring(0, 5)}-OS`.toUpperCase();
  const { data: createdVariant, error: insertError } = await supabase
    .from('variants')
    .insert([{ product_id: productId, size: 'ONE SIZE', color: '', stock: normalizedStock, sku }])
    .select()
    .single();

  if (insertError) throw insertError;
  return createdVariant;
};

// ============================================================
// 5. PUBLIC ROUTES
// ============================================================

// ----- Health check -----------------------------------------
// Quick sanity endpoint for uptime monitors / deployment checks.

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----- GET /api/settings/:key -------------------------------
app.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      if (key === 'hero_image') {
        return res.status(200).json({ value: 'https://images.unsplash.com/photo-1617331721458-bd3bd3f9c7f8?q=80&w=2000&auto=format&fit=crop' });
      }
      return res.status(200).json({ value: null });
    }
    
    res.json({ value: data?.setting_value });
  } catch (err) {
    console.error(`Settings fetch error for ${req.params.key}:`, err);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// ----- GET /api/products ------------------------------------
// Returns all *active* products with their associated variants.
// Used by the storefront catalogue / collection pages.
//
// Supabase's PostgREST engine supports embedded resources via
// the `select` syntax:  products(*, variants(*))
// This performs a server-side JOIN and nests variants as an
// array on each product object.

app.get('/api/products', async (_req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        description,
        base_price,
        collection,
        created_at,
        thumbnail_url,
        image_urls,
        variants (
          id,
          sku,
          size,
          color,
          stock
        )
      `
      )
      .eq('is_active', true) // Only show published products
      .order('created_at', { ascending: false }); // Newest first

    if (error) {
      console.error('Supabase error (GET /api/products):', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    console.error('Unexpected error (GET /api/products):', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

// ----- GET /api/products/:slug ------------------------------
// Returns a single active product by its URL slug, along with
// its variants. Used by the product detail page (PDP).
//
// We use .single() to tell PostgREST we expect exactly one row.
// If zero rows match, Supabase returns a PGRST116 error code
// which we translate to a clean 404 for the frontend.

app.get('/api/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        description,
        base_price,
        collection,
        created_at,
        thumbnail_url,
        image_urls,
        variants (
          id,
          sku,
          size,
          color,
          stock
        )
      `
      )
      .eq('slug', slug)
      .eq('is_active', true) // Don't expose deactivated products
      .single(); // Expect exactly one result

    // Handle "no rows found" — Supabase returns code PGRST116
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: `Product "${slug}" not found.`,
        });
      }

      console.error('Supabase error (GET /api/products/:slug):', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch product. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error('Unexpected error (GET /api/products/:slug):', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

// ============================================================
// 4b. TRANSACTION ENDPOINTS
// ============================================================

// ----- POST /api/checkout -----------------------------------
app.post('/api/checkout', async (req, res) => {
  const { customer_email, customer_name, customer_phone, shipping_address, cart, paystack_reference } = req.body;

  if (!customer_email || !customer_name || !cart || !cart.length) {
    return res.status(400).json({ success: false, message: 'Missing required checkout fields.' });
  }

  try {
    let serverTotalAmount = 0;
    const orderItemsToInsert = [];

    // 1. Validate Prices and Calculate Total Server-Side
    for (const item of cart) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('base_price, name')
        .eq('id', item.product.id)
        .single();

      if (productError || !productData) {
        throw new Error(`Invalid product in cart: ${item.product.id}`);
      }

      serverTotalAmount += productData.base_price * item.quantity;

      orderItemsToInsert.push({
        variant_id: item.variant.id,
        product_name: productData.name,
        variant_label: `${item.variant.color} / ${item.variant.size}`,
        quantity: item.quantity,
        price_at_purchase: productData.base_price
      });
    }

    let createdOrderId = null;

    // 2. Create the Order with server-calculated total and 'pending' status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_email,
        customer_name,
        customer_phone,
        shipping_address,
        total_amount: serverTotalAmount,
        payment_status: 'pending',
        paystack_reference: paystack_reference || `MOCK-${Date.now()}`
      }])
      .select()
      .single();

    if (orderError) throw orderError;
    createdOrderId = order.id;

    try {
      // 3. Process Items (No stock deduction until payment is verified)
      for (const orderItem of orderItemsToInsert) {
        orderItem.order_id = createdOrderId;
        const { error: itemError } = await supabase.from('order_items').insert([orderItem]);
        if (itemError) throw itemError;
      }
    } catch (insertError) {
      // Compensating rollback: delete the orphaned order
      await supabase.from('orders').delete().eq('id', createdOrderId);
      throw insertError;
    }

    res.status(200).json({ success: true, orderId: createdOrderId });
  } catch (error) {
    console.error('Checkout Transaction Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Transaction failed.' });
  }
});

// ----- POST /api/checkout/manual ----------------------------
app.post('/api/checkout/manual', async (req, res) => {
  const { customer_email, customer_name, customer_phone, shipping_address, cart, reference_id } = req.body;

  if (!customer_email || !customer_name || !cart || !cart.length || !reference_id) {
    return res.status(400).json({ success: false, message: 'Missing required checkout fields or reference ID.' });
  }

  try {
    // 1. Duplicate Prevention: Check reference_id
    const { data: existingPayment } = await supabase
      .from('manual_payments')
      .select('id')
      .eq('reference_id', reference_id)
      .maybeSingle();

    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'Duplicate transaction reference. This reference ID has already been submitted.' });
    }

    let serverTotalAmount = 0;
    const orderItemsToInsert = [];

    // 2. Validate Prices and Calculate Total Server-Side
    for (const item of cart) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('base_price, name')
        .eq('id', item.product.id)
        .single();

      if (productError || !productData) {
        throw new Error(`Invalid product in cart: ${item.product.id}`);
      }

      serverTotalAmount += productData.base_price * item.quantity;

      orderItemsToInsert.push({
        variant_id: item.variant.id,
        product_name: productData.name,
        variant_label: `${item.variant.color} / ${item.variant.size}`,
        quantity: item.quantity,
        price_at_purchase: productData.base_price
      });
    }

    let createdOrderId = null;

    // 3. Create the Order with 'manual_pending'
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_email,
        customer_name,
        customer_phone,
        shipping_address,
        total_amount: serverTotalAmount,
        payment_status: 'manual_pending',
        paystack_reference: `MANUAL-${Date.now()}`
      }])
      .select()
      .single();

    if (orderError) throw orderError;
    createdOrderId = order.id;

    try {
      // 4. Process Items (No stock deduction here)
      for (const orderItem of orderItemsToInsert) {
        orderItem.order_id = createdOrderId;
        const { error: itemError } = await supabase.from('order_items').insert([orderItem]);
        if (itemError) throw itemError;
      }

      // 5. Create manual_payments record
      const { error: manualError } = await supabase
        .from('manual_payments')
        .insert([{
          order_id: createdOrderId,
          customer_email,
          amount: serverTotalAmount,
          reference_id,
          status: 'Pending'
        }]);

      if (manualError) throw manualError;
    } catch (insertError) {
      // Compensating rollback: delete the orphaned order
      await supabase.from('orders').delete().eq('id', createdOrderId);
      throw insertError;
    }

    res.status(200).json({ success: true, orderId: createdOrderId });
  } catch (error) {
    console.error('Manual Checkout Transaction Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Transaction failed.' });
  }
});

// ----- POST /api/webhooks/paystack --------------------------
app.post('/api/webhooks/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(JSON.stringify(req.body)).digest('hex');
    
    if (hash !== signature) {
      console.warn('Webhook signature mismatch. Aborting.');
      return res.status(400).send('Invalid signature');
    }

    const { event, data } = req.body;
    
    // In production, verify the Paystack signature here using crypto!
    if (event === 'charge.success') {
      const reference = data.reference;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('paystack_reference', reference)
        .single();
        
      if (orderError || !order) return res.status(404).send('Order not found');
      
      if (order.payment_status === 'pending') {
        await supabase.from('orders').update({ payment_status: 'success' }).eq('id', order.id);
        
        // Safely deduct stock on success
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('variant_id, quantity')
          .eq('order_id', order.id);
          
        if (orderItems) {
          for (const item of orderItems) {
            await supabase.rpc('decrement_stock', {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity
            });
          }
        }
      }
    }
    
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook failed');
  }
});

// ----- POST /api/newsletter ---------------------------------
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  try {
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email }]);
      
    if (error && error.code !== '23505') throw error; // Ignore duplicates silently

    res.status(200).json({ success: true, message: 'Subscribed successfully.' });
  } catch (error) {
    console.error('Newsletter Error:', error);
    res.status(500).json({ success: false, message: 'Subscription failed.' });
  }
});

// ============================================================
// 6. ADMIN ROUTES
// ============================================================


// ----- POST /api/admin/login ---------------------------------
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPasswordHash || !jwtSecret) {
      console.error('CRITICAL: Admin auth env variables not configured.');
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    if (email !== adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ email }, jwtSecret, { expiresIn: '12h' });

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ----- GET /api/admin/products ------------------------------
app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, base_price, collection, is_active, created_at, thumbnail_url, image_urls,
        variants ( id, sku, size, color, stock )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Admin Products Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve administrative products.' });
  }
});

// ----- GET /api/admin/orders --------------------------------
app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, customer_email, customer_name, total_amount, payment_status, fulfillment_status, tracking_number, fulfilled_at, created_at,
        order_items ( id, variant_id, product_name, variant_label, quantity, price_at_purchase )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Admin Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve administrative orders.' });
  }
});

// ----- POST /api/admin/upload-media -------------------------
app.post('/api/admin/upload-media', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error('Upload media error:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// ----- POST /api/admin/products ------------------------------
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, base_price, collection, is_active, image_urls, stock } = req.body;
    
    // Generate a URL-friendly slug with unique hex suffix
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${randomSuffix}`;
    
    // Derive thumbnail from the first image
    const thumbnail_url = image_urls && image_urls.length > 0 ? image_urls[0] : null;

    const { data: product, error } = await supabase
      .from('products')
      .insert([{ name, slug, description, base_price, collection, is_active, image_urls, thumbnail_url }])
      .select()
      .single();

    if (error) throw error;

    if (stock !== undefined && stock !== null) {
      await upsertDefaultVariantStock(product.id, stock);
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Admin POST Product Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product', details: error.message });
  }
});

// ----- PUT /api/admin/products/:id ---------------------------
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, collection, image_urls, stock } = req.body;
    
    // Derive thumbnail from the first image
    const thumbnail_url = image_urls && image_urls.length > 0 ? image_urls[0] : null;

    const { data: product, error } = await supabase
      .from('products')
      .update({ name, description, base_price, collection, image_urls, thumbnail_url })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (stock !== undefined && stock !== null) {
      await upsertDefaultVariantStock(id, stock);
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Admin PUT Product Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product', details: error.message });
  }
});

// ----- PATCH /api/admin/products/:id/toggle-active -----------
app.patch('/api/admin/products/:id/toggle-active', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data: product, error } = await supabase
      .from('products')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Admin Toggle Active Error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle product status', details: error.message });
  }
});

// ----- POST /api/admin/products/:id/variants -----------------
app.post('/api/admin/products/:id/variants', requireAdmin, async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { size, color, stock } = req.body;

    // Generate SKU based on product_id and size
    const sku = `VAR-${product_id.substring(0, 5)}-${size}`.toUpperCase();

    const { data: variant, error } = await supabase
      .from('variants')
      .insert([{ product_id, size, color, stock, sku }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: variant });
  } catch (error) {
    console.error('Admin POST Variant Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create variant', details: error.message });
  }
});

// ----- PATCH /api/admin/variants/:id/stock -------------------
app.patch('/api/admin/variants/:id/stock', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock < 0) {
      return res.status(400).json({ success: false, error: 'Invalid stock value', details: 'Stock cannot be less than 0.' });
    }

    const { data: variant, error } = await supabase
      .from('variants')
      .update({ stock })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    console.error('Admin PATCH Variant Stock Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update stock', details: error.message });
  }
});

// ----- PATCH /api/admin/orders/:id/fulfillment-status --------
app.patch('/api/admin/orders/:id/fulfillment-status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status provided.' });
    }

    // Automatically timestamp the transition if shifting into an active physical state
    const fulfilled_at = (status === 'shipped' || status === 'delivered') ? new Date().toISOString() : null;

    const updatePayload = { fulfillment_status: status };
    if (tracking_number !== undefined) updatePayload.tracking_number = tracking_number;
    if (fulfilled_at !== undefined) updatePayload.fulfilled_at = fulfilled_at;

    const { data: order, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Admin PATCH Order Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order', details: error.message });
  }
});

// ----- POST /api/admin/settings/hero/upload ------------------
app.post('/api/admin/settings/hero/upload', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    
    // Upload buffer to Supabase Storage bucket 'storefront'
    const { error: uploadError } = await supabase.storage
      .from('storefront')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Retrieve the public URL
    const { data } = supabase.storage.from('storefront').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // Save to store_settings table
    const { error: dbError } = await supabase
      .from('store_settings')
      .upsert(
        { setting_key: 'hero_image', setting_value: publicUrl },
        { onConflict: 'setting_key' }
      );

    if (dbError) throw dbError;

    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Upload hero image error:', err);
    res.status(500).json({ error: 'Failed to upload hero image' });
  }
});

// ----- PUT /api/admin/settings/:key --------------------------
// Note: setting_value for catalog_hero_images is expected to be a JSON-stringified array
app.put('/api/admin/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) return res.status(400).json({ error: 'Missing value in request body' });

    const { error } = await supabase
      .from('store_settings')
      .upsert(
        { setting_key: key, setting_value: value },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(`Update setting error for ${req.params.key}:`, err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ----- GET /api/admin/summary --------------------------------
app.get('/api/admin/summary', requireAdmin, async (_req, res) => {
  try {
    // Perform highly optimized parallel HEAD queries
    const [
      { count: totalProducts }, 
      { count: activeProducts }, 
      { count: openOrders }, 
      { count: lowStockAlerts },
      { count: pendingPayments }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('fulfillment_status', 'pending'),
      supabase.from('variants').select('*', { count: 'exact', head: true }).lte('stock', 5),
      supabase.from('manual_payments').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        openOrders: openOrders || 0,
        lowStockAlerts: lowStockAlerts || 0,
        pendingPayments: pendingPayments || 0
      }
    });
  } catch (error) {
    console.error('Admin GET Summary Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve summary analytics', details: error.message });
  }
});

// ----- GET /api/admin/payments ------------------------------
app.get('/api/admin/payments', requireAdmin, async (_req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('manual_payments')
      .select(`
        *,
        orders ( id, total_amount, customer_name, customer_email, payment_status )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    console.error('Admin Payments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve manual payments.' });
  }
});

// ----- PATCH /api/admin/payments/:id/verify -----------------
app.patch('/api/admin/payments/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verification_notes } = req.body; // status should be 'Verified' or 'Rejected'

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Verified or Rejected.' });
    }

    if (status === 'Rejected' && (!verification_notes || !verification_notes.trim())) {
      return res.status(400).json({ success: false, message: 'Rejection requires verification notes.' });
    }

    // 1. Get the payment to find the linked order
    const { data: payment, error: fetchError } = await supabase
      .from('manual_payments')
      .select('order_id, status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (payment.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Payment is already processed.' });
    }

    // 2. Update manual_payments
    const { data: updatedPayment, error: updateError } = await supabase
      .from('manual_payments')
      .update({ status, verification_notes })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Update orders payment_status
    const orderStatus = status === 'Verified' ? 'success' : 'failed';
    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: orderStatus })
      .eq('id', payment.order_id);

    if (orderError) throw orderError;

    // 4. Safely deduct inventory ONLY on verified payment success
    if (orderStatus === 'success') {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', payment.order_id);
      
      if (!itemsError && orderItems) {
        for (const item of orderItems) {
          const { error: stockError } = await supabase.rpc('decrement_stock', {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity
          });
          if (stockError) console.error('Failed to deduct stock for verified payment:', stockError);
        }
      }
    }

    res.status(200).json({ success: true, data: updatedPayment });
  } catch (error) {
    console.error('Admin PATCH Payment Verify Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update payment status.' });
  }
});

// ============================================================
// 7. 404 CATCH-ALL
// ============================================================
// Any route that doesn't match the above handlers gets a clean
// JSON 404 instead of Express's default HTML error page.

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// ============================================================
// 6. GLOBAL ERROR HANDLER
// ============================================================
// Express error-handling middleware (4 args). Catches anything
// that slips through the route-level try/catch blocks.

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// ============================================================
// 7. START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🔥  Stunna API Server');
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   → CORS origin: ${CLIENT_URL}`);
  console.log('');
});
