type LogAction = 'create' | 'update' | 'delete';

interface LogItemChange {
  action: LogAction;
  itemId: string;
  itemName: string;
  userId?: string;
  userName?: string;
  details: Record<string, any>;
}

/**
 * Logs an inventory change to the database
 * This function should be called with a mutation function from the component
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
    console.log('Logging inventory change:', { action, itemId, itemName, userId, userName });

    // Prepare the data
    const logData = {
      data: {
        action,
        itemId,
        itemName,
        userId,
        userName,
        details: JSON.stringify(details)
      }
    };

    // If mutation function is provided, use it; otherwise make a direct API call
    if (createInventoryLogMutation) {
      await createInventoryLogMutation(logData);
    } else {
      // Fallback to direct API call
      const response = await fetch('/api/inventoryLog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    console.log(`Inventory log created: ${action} for item ${itemName}`);
    return true;
  } catch (error) {
    console.error('Failed to create inventory log:', error);
    console.error('Error details:', error?.message, error?.stack);
    return false;
  }
};
