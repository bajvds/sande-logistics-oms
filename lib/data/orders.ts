import { supabase } from '@/lib/supabase';
import { DatabaseOrderTableRow } from '@/types';

/**
 * Fetch orders from Supabase with limit, ordered by created_at descending
 * Default limit is 100 for performance
 */
export async function getOrders(limit: number = 100): Promise<DatabaseOrderTableRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single order by ID
 */
export async function getOrderById(id: number): Promise<DatabaseOrderTableRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - order not found
      return null;
    }
    console.error('Error fetching order:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }

  return data;
}

/**
 * Fetch orders filtered by status
 */
export async function getOrdersByStatus(status: string): Promise<DatabaseOrderTableRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by status:', error);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data || [];
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: number, status: string): Promise<DatabaseOrderTableRow> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return data;
}

/**
 * Delete an order by ID
 */
export async function deleteOrder(id: number): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting order:', error);
    throw new Error(`Failed to delete order: ${error.message}`);
  }
}

/**
 * Update full order data
 */
export async function updateOrder(
  id: number, 
  updates: Partial<Pick<DatabaseOrderTableRow, 'status' | 'klant_email' | 'email_onderwerp' | 'order_data'>>
): Promise<DatabaseOrderTableRow> {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return data;
}

