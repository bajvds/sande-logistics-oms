'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateOrderStatus, deleteOrder } from '@/lib/data/orders';

/**
 * Server Action: Update order status to "In Behandeling"
 */
export async function takeInBehandeling(orderId: number) {
  try {
    await updateOrderStatus(orderId, 'In Behandeling');
    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Kon status niet bijwerken');
  }
}

/**
 * Server Action: Update order status to "Verwerkt"
 */
export async function markAsVerwerkt(orderId: number) {
  try {
    await updateOrderStatus(orderId, 'Verwerkt');
    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Kon status niet bijwerken');
  }
}

/**
 * Server Action: Delete an order
 */
export async function deleteOrderAction(orderId: number) {
  try {
    await deleteOrder(orderId);
    revalidatePath('/orders');
  } catch (error) {
    console.error('Failed to delete order:', error);
    throw new Error('Kon order niet verwijderen');
  }
  
  // Redirect after successful deletion
  redirect('/orders');
}


