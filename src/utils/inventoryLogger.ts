type LogAction = 'create' | 'update' | 'delete' | 'sale';

interface LogItemChange {
  action: LogAction;
  itemId: string;
  itemName: string;
  userId?: string;
  userName?: string;
  details: Record<string, any>;
}

/**
 * Simplified inventory logging utility
 * Logs important inventory changes with essential information only
 */
export const logItemChange = async ({
  action,
  itemId,
  itemName,
  userId,
  userName,
  details
}: LogItemChange, createInventoryLogMutation?: any) => {
  try {
    // Skip logging for non-critical actions in development
    if (process.env.NODE_ENV === 'development' && action === 'update' && !details.significant) {
      return true;
    }

    // Prepare simplified log data
    const logData = {
      data: {
        action,
        itemId,
        itemName,
        userId,
        userName,
        details: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...details
        })
      }
    };

    // Use mutation if provided, otherwise fall back to API
    if (createInventoryLogMutation) {
      await createInventoryLogMutation(logData);
    } else {
      const response = await fetch('/api/inventoryLog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return true;
  } catch (error) {
    // Log error but don't fail the main operation
    console.warn('Inventory logging failed (non-critical):', error);
    return false;
  }
};

/**
 * Batch log multiple inventory changes
 */
export const batchLogChanges = async (
  changes: LogItemChange[],
  createInventoryLogMutation?: any
) => {
  const results = await Promise.allSettled(
    changes.map(change => logItemChange(change, createInventoryLogMutation))
  );
  
  const failed = results.filter(result => result.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`${failed} out of ${changes.length} inventory logs failed`);
  }
  
  return results;
};
