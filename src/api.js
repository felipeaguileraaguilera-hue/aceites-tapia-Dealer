import { supabase } from './supabaseClient'

// ============================================================
// AUTH
// ============================================================
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}
export async function signOut() {
  return await supabase.auth.signOut()
}
export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange(cb)
}
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ============================================================
// PROFILE
// ============================================================
export async function getClientProfile(authUserId) {
  const { data, error } = await supabase.from('clients').select('*').eq('auth_user_id', authUserId).single()
  return { data, error }
}

// ============================================================
// PRODUCTS
// ============================================================
export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').eq('active', true).order('display_order')
  return { data, error }
}

// ============================================================
// CLIENTS MANAGEMENT
// ============================================================
export async function getAllClients(activeOnly = true) {
  let query = supabase.from('clients').select(`*, price_levels(name, discount_pct), delivery_points(*)`).order('name')
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  return { data, error }
}

export async function searchClients(term) {
  const { data, error } = await supabase.from('clients')
    .select(`*, price_levels(name, discount_pct), delivery_points(*)`)
    .or(`name.ilike.%${term}%,cif_nif.ilike.%${term}%,contact_person.ilike.%${term}%,alprivawin_code.ilike.%${term}%`)
    .eq('is_active', true)
    .order('name')
    .limit(20)
  return { data, error }
}

export async function getClientById(clientId) {
  const { data, error } = await supabase.from('clients')
    .select(`*, price_levels(name, discount_pct), delivery_points(*)`)
    .eq('id', clientId).single()
  return { data, error }
}

export async function createClient(clientData) {
  const { data, error } = await supabase.from('clients').insert({
    email: clientData.email || null,
    name: clientData.name,
    contact_person: clientData.contact_person || '',
    phone: clientData.phone || '',
    address: clientData.address || '',
    cif_nif: clientData.cif_nif,
    fiscal_name: clientData.fiscal_name || '',
    fiscal_address: clientData.fiscal_address || '',
    fiscal_city: clientData.fiscal_city || '',
    fiscal_postal_code: clientData.fiscal_postal_code || '',
    fiscal_province: clientData.fiscal_province || '',
    client_type: clientData.client_type || 'restauracion',
    client_subtype: clientData.client_subtype || '',
    price_level_id: 'silver',
    role: 'client',
    is_active: true,
    wants_invoice_default: clientData.wants_invoice_default ?? true,
    alprivawin_code: clientData.alprivawin_code || '',
    notes_admin: clientData.notes_admin || '',
  }).select().single()
  return { data, error }
}

export async function updateClient(clientId, updates) {
  const { data, error } = await supabase.from('clients').update(updates).eq('id', clientId).select().single()
  return { data, error }
}

export async function setClientInactive(clientId, reason) {
  const { data, error } = await supabase.from('clients').update({
    is_active: false,
    inactive_reason: reason,
    inactive_date: new Date().toISOString()
  }).eq('id', clientId).select().single()
  return { data, error }
}

export async function reactivateClient(clientId) {
  const { data, error } = await supabase.from('clients').update({
    is_active: true,
    inactive_reason: null,
    inactive_date: null
  }).eq('id', clientId).select().single()
  return { data, error }
}

// ============================================================
// DELIVERY POINTS
// ============================================================
export async function getDeliveryPoints(clientId) {
  const { data, error } = await supabase.from('delivery_points')
    .select('*').eq('client_id', clientId).eq('active', true).order('is_default', { ascending: false })
  return { data, error }
}

export async function createDeliveryPoint(point) {
  const { data, error } = await supabase.from('delivery_points').insert({
    client_id: point.client_id,
    name: point.name,
    address: point.address,
    contact_person: point.contact_person || '',
    phone: point.phone || '',
    is_default: point.is_default || false,
    is_fiscal_address: point.is_fiscal_address || false,
  }).select().single()
  return { data, error }
}

export async function updateDeliveryPoint(pointId, updates) {
  const { data, error } = await supabase.from('delivery_points').update(updates).eq('id', pointId).select().single()
  return { data, error }
}

export async function deleteDeliveryPoint(pointId) {
  const { error } = await supabase.from('delivery_points').update({ active: false }).eq('id', pointId)
  return { error }
}

// ============================================================
// ORDERS
// ============================================================
export async function createOrder(clientId, items, wantsInvoice, notes, deliveryPointId) {
  const { data: idData, error: idError } = await supabase.rpc('next_order_id')
  if (idError) return { data: null, error: idError }
  const orderId = idData

  // Get client price level for discount
  const { data: client } = await supabase.from('clients')
    .select('price_level_id, price_levels(discount_pct)').eq('id', clientId).single()
  const discountPct = client?.price_levels?.discount_pct || 0

  // Calculate totals
  let totalBase = 0, totalVat = 0
  const orderItems = []
  for (const item of items) {
    const { data: product } = await supabase.from('products').select('base_price, vat_rate').eq('id', item.productId).single()
    const basePrice = product?.base_price || 0
    const vatRate = product?.vat_rate || 0.04
    const unitPrice = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100
    const lineBase = Math.round(unitPrice * item.qty * 100) / 100
    const lineVat = Math.round(lineBase * vatRate * 100) / 100
    totalBase += lineBase
    totalVat += lineVat
    orderItems.push({
      order_id: orderId, product_id: item.productId, quantity: item.qty,
      original_quantity: item.qty, unit_price: unitPrice, vat_rate: vatRate,
      discount_pct: discountPct, line_base: lineBase, line_vat: lineVat,
      line_total: Math.round((lineBase + lineVat) * 100) / 100
    })
  }

  const { data: order, error: orderError } = await supabase.from('orders').insert({
    id: orderId, client_id: clientId, status: 'pending',
    wants_invoice: wantsInvoice, notes: notes || '',
    delivery_point_id: deliveryPointId || null,
    total_base: Math.round(totalBase * 100) / 100,
    total_vat: Math.round(totalVat * 100) / 100,
    total_amount: Math.round((totalBase + totalVat) * 100) / 100,
    discount_pct: discountPct
  }).select().single()
  if (orderError) return { data: null, error: orderError }

  await supabase.from('order_items').insert(orderItems)
  await supabase.from('order_history').insert({
    order_id: orderId, action: 'created', changed_by: clientId,
    changes: { items: orderItems, created_by: 'driver' }
  })
  return { data: order, error: null }
}

export async function getAllPendingOrders() {
  const { data, error } = await supabase.from('orders')
    .select(`*, clients!orders_client_id_fkey(name, contact_person, phone, email, address, cif_nif, client_type),
      delivery_points(name, address, phone), order_items(product_id, quantity, original_quantity, unit_price, line_total)`)
    .eq('status', 'pending').order('created_at', { ascending: false })
  return { data, error }
}

export async function getAllDeliveredOrders(limit = 50) {
  const { data, error } = await supabase.from('orders')
    .select(`*, clients!orders_client_id_fkey(name, contact_person, phone, email, address),
      delivery_points(name, address), order_items(product_id, quantity, original_quantity, unit_price, line_total)`)
    .eq('status', 'delivered').order('delivered_at', { ascending: false }).limit(limit)
  return { data, error }
}

export async function confirmDelivery(orderId, deliveryData, modifiedItems, driverId) {
  const modified = modifiedItems !== null
  const { error: orderError } = await supabase.from('orders').update({
    status: 'delivered', delivery_date: deliveryData.date, delivery_time: deliveryData.time,
    delivery_payment: deliveryData.payment, delivery_document: deliveryData.document,
    delivery_driver_id: driverId, delivery_modified: modified, delivered_at: new Date().toISOString()
  }).eq('id', orderId)
  if (orderError) return { error: orderError }

  if (modified && modifiedItems) {
    await supabase.from('order_items').delete().eq('order_id', orderId)
    const newItems = modifiedItems.map(item => ({
      order_id: orderId, product_id: item.productId, quantity: item.qty,
      original_quantity: item.originalQty || item.qty,
      unit_price: item.unitPrice || 0, line_total: item.lineTotal || 0
    }))
    await supabase.from('order_items').insert(newItems)
  }

  await supabase.from('order_history').insert({
    order_id: orderId, action: 'delivered', changed_by: driverId,
    changes: { delivery: deliveryData, modified, items: modifiedItems }
  })
  return { error: null }
}

export async function getClientOrders(clientId, limit = 50) {
  const { data, error } = await supabase.from('orders')
    .select(`*, delivery_points(name, address), order_items(product_id, quantity, unit_price, line_total)`)
    .eq('client_id', clientId).order('created_at', { ascending: false }).limit(limit)
  return { data, error }
}

// ============================================================
// PRICE LEVELS (read only for driver)
// ============================================================
export async function getPriceLevels() {
  const { data, error } = await supabase.from('price_levels').select('*').order('sort_order')
  return { data, error }
}

// ============================================================
// ADMIN: PRICE LEVELS MANAGEMENT
// ============================================================
export async function updatePriceLevel(id, updates) {
  const { data, error } = await supabase.from('price_levels').update(updates).eq('id', id).select().single()
  return { data, error }
}

// ============================================================
// ADMIN: ZONES MANAGEMENT
// ============================================================
export async function getZones(activeOnly = true) {
  let query = supabase.from('zones').select('*').order('route_order')
  if (activeOnly) query = query.eq('active', true)
  const { data, error } = await query
  return { data, error }
}

export async function createZone(zone) {
  const { data, error } = await supabase.from('zones').insert({
    code: zone.code || null,
    name: zone.name,
    description: zone.description || '',
    delivery_day: zone.delivery_day,
    postal_codes: zone.postal_codes || [],
    route_order: zone.route_order || 0,
  }).select().single()
  return { data, error }
}

export async function updateZone(id, updates) {
  const { data, error } = await supabase.from('zones').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteZone(id) {
  // First check if zone has active clients
  const { data: hasClients } = await supabase.rpc('zone_has_clients', { p_zone_id: id })
  if (hasClients) return { error: { message: 'No se puede eliminar: hay clientes activos en esta zona. Reasígnalos primero.' } }
  const { error } = await supabase.from('zones').update({ active: false }).eq('id', id)
  return { error }
}

// ============================================================
// ADMIN: VOLUME DISCOUNT TIERS
// ============================================================
export async function getVolumeTiers() {
  const { data, error } = await supabase.from('volume_discount_tiers').select('*').order('min_amount')
  return { data, error }
}

export async function upsertVolumeTiers(tiers) {
  // Delete existing and replace
  await supabase.from('volume_discount_tiers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (!tiers.length) return { error: null }
  const { data, error } = await supabase.from('volume_discount_tiers').insert(
    tiers.map(t => ({
      min_amount: t.min_amount,
      max_amount: t.max_amount || null,
      extra_discount_pct: t.extra_discount_pct || 0,
      suggested_level: t.suggested_level || null,
    }))
  ).select()
  return { data, error }
}

// ============================================================
// ADMIN: BULK OPERATIONS
// ============================================================
export async function bulkUpdateClients(clientIds, updates) {
  const results = { success: 0, errors: [] }
  for (const id of clientIds) {
    const { error } = await supabase.from('clients').update(updates).eq('id', id)
    if (error) results.errors.push({ id, error: error.message })
    else results.success++
  }
  return results
}

export async function bulkDeactivateClients(clientIds, reason) {
  const results = { success: 0, errors: [] }
  for (const id of clientIds) {
    const { error } = await supabase.from('clients').update({
      is_active: false, inactive_reason: reason, inactive_date: new Date().toISOString()
    }).eq('id', id)
    if (error) results.errors.push({ id, error: error.message })
    else results.success++
  }
  return results
}

export async function getClientsFiltered(filters) {
  let query = supabase.from('clients')
    .select('*, price_levels(name), zones(name, delivery_day)')
    .order('name')
  if (filters.zone_id) query = query.eq('zone_id', filters.zone_id)
  if (filters.client_type) query = query.eq('client_type', filters.client_type)
  if (filters.price_level_id) query = query.eq('price_level_id', filters.price_level_id)
  if (filters.delivery_frequency) query = query.eq('delivery_frequency', filters.delivery_frequency)
  if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active)
  const { data, error } = await query
  return { data, error }
}

// ============================================================
// ADMIN: DISTRIBUTOR PRICES
// ============================================================
export async function getDistributorPrices() {
  const { data, error } = await supabase.from('distributor_prices')
    .select('*, products(name, description)').order('product_id')
  return { data, error }
}

export async function upsertDistributorPrice(productId, price) {
  const { data, error } = await supabase.from('distributor_prices')
    .upsert({ product_id: productId, price }, { onConflict: 'product_id' }).select().single()
  return { data, error }
}

