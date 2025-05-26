import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, itemId, itemName, userId, userName, details } = body;

    const inventoryLog = await db.inventoryLog.create({
      data: {
        action,
        itemId,
        itemName,
        userId,
        userName,
        details: typeof details === 'string' ? details : JSON.stringify(details)
      },
    });

    return NextResponse.json(inventoryLog);
  } catch (error) {
    console.error('Error creating inventory log:', error);
    return NextResponse.json({ error: 'Failed to create inventory log' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const inventoryLogs = await db.inventoryLog.findMany({
      include: {
        user: true,
        item: true
      },
      orderBy: {
        dateCreated: 'desc'
      },
      take: limit,
      skip: offset
    });

    return NextResponse.json(inventoryLogs);
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory logs' }, { status: 500 });
  }
}
