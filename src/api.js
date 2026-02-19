import { supabase } from './supabaseClient'

// ============================================================
// AUTH
// ============================================================

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ============================================================
// CLIENTS
// ============================================================

export async function getClientProfile(authUserId) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()
  return { data, error }
}

export async function createClientProfile(authUserId, profile) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      auth_user_id: authUserId,
      email: profile.email,
      name: profile.name,
      contact_person: profile.contact_person || '',
      phone: profile.phone || '',
      address: profile.address || '',
      wants_invoice_default: profile.wants_invoice_default ?? true,
      role: profile.role || 'client'
    })
    .select()
    .single()
  return { data, error }
}

export async function updateClientProfile(clientId, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()
  return { data, error }
}

export async function getAllClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  return { data, error }
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('display_order')
  return { data, error }
}

// ============================================================
// ORDERS
// ============================================================

export async function createOrder(clientId, items, wantsInvoice, notes) {
  // 1. Generate order ID
  const { data: idData, error: idError } = await supabase.rpc('next_order_id')
  if (idError) return { data: null, error: idError }
  const orderId = idData

  // 2. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      client_id: clientId,
      status: 'pending',
      wants_invoice: wantsInvoice,
      notes: notes || ''
    })
    .select()
    .single()

  if (orderError) return { data: null, error: orderError }

  // 3. Create order items
  const orderItems = items.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    quantity: item.qty,
    original_quantity: item.qty
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) return { data: null, error: itemsError }

  // 4. Log to history
  await supabase.from('order_history').insert({
    order_id: orderId,
    action: 'created',
    changed_by: clientId,
    changes: { items: orderItems }
  })

  return { data: order, error: null }
}

export async function getClientOrders(clientId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        product_id,
        quantity,
        original_quantity
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getAllPendingOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      clients!orders_client_id_fkey (
        name, contact_person, phone, email, address
      ),
      order_items (
        product_id,
        quantity,
        original_quantity
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getAllDeliveredOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      clients!orders_client_id_fkey (
        name, contact_person, phone, email, address
      ),
      order_items (
        product_id,
        quantity,
        original_quantity
      )
    `)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })
    .limit(50)

  return { data, error }
}

export async function confirmDelivery(orderId, deliveryData, modifiedItems, driverId) {
  const modified = modifiedItems !== null

  // 1. Update order with delivery info
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivery_date: deliveryData.date,
      delivery_time: deliveryData.time,
      delivery_payment: deliveryData.payment,
      delivery_document: deliveryData.document,
      delivery_driver_id: driverId,
      delivery_modified: modified,
      delivered_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (orderError) return { error: orderError }

  // 2. If items were modified, update them
  if (modified && modifiedItems) {
    // Delete existing items
    await supabase.from('order_items').delete().eq('order_id', orderId)

    // Insert modified items
    const newItems = modifiedItems.map(item => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.qty,
      original_quantity: item.originalQty || item.qty
    }))

    await supabase.from('order_items').insert(newItems)
  }

  // 3. Log to history
  await supabase.from('order_history').insert({
    order_id: orderId,
    action: 'delivered',
    changed_by: driverId,
    changes: {
      delivery: deliveryData,
      modified,
      items: modifiedItems
    }
  })

  return { error: null }
}

// ============================================================
// HISTORY & REPORTS
// ============================================================

export async function getOrderHistory(orderId) {
  const { data, error } = await supabase
    .from('order_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  return { data, error }
}
