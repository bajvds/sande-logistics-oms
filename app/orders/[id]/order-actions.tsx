'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { takeInBehandeling, markAsVerwerkt, deleteOrderAction } from './actions';

interface OrderActionsProps {
  orderId: number;
  currentStatus: string;
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Optimistic status update for instant UI feedback
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_, newStatus: string) => newStatus
  );

  const handleTakeInBehandeling = () => {
    startTransition(async () => {
      setOptimisticStatus('In Behandeling');
      try {
        await takeInBehandeling(orderId);
        router.refresh();
      } catch (error) {
        alert('Er ging iets mis bij het bijwerken van de status');
      }
    });
  };

  const handleMarkVerwerkt = () => {
    startTransition(async () => {
      setOptimisticStatus('Verwerkt');
      try {
        await markAsVerwerkt(orderId);
        router.refresh();
      } catch (error) {
        alert('Er ging iets mis bij het bijwerken van de status');
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOrderAction(orderId);
      // Redirect happens in the server action
    } catch (error) {
      alert('Er ging iets mis bij het verwijderen');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const showInBehandelingButton = optimisticStatus === 'Review' || optimisticStatus === 'Nieuw';
  const showVerwerktButton = optimisticStatus === 'In Behandeling';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* In Behandeling Nemen */}
      {showInBehandelingButton && (
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={handleTakeInBehandeling}
          disabled={isPending || isDeleting}
        >
          {isPending ? 'Bezig...' : 'IN BEHANDELING NEMEN'}
        </Button>
      )}

      {/* Mark as Verwerkt */}
      {showVerwerktButton && (
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleMarkVerwerkt}
          disabled={isPending || isDeleting}
        >
          {isPending ? 'Bezig...' : 'MARKEER ALS VERWERKT'}
        </Button>
      )}

      {/* Bewerken - placeholder for now */}
      <Button 
        variant="secondary" 
        size="sm" 
        className="bg-yellow-400 text-black hover:bg-yellow-500"
        disabled={isPending || isDeleting}
      >
        BEWERKEN
      </Button>

      {/* Verwijderen */}
      {!showDeleteConfirm ? (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending || isDeleting}
        >
          VERWIJDEREN
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600 font-medium">Weet je het zeker?</span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
          >
            {isDeleting ? 'Bezig...' : 'JA, VERWIJDER'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isPending || isDeleting}
          >
            NEE
          </Button>
        </div>
      )}
    </div>
  );
}

