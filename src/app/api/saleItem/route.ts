import { db } from '@/core/database';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const saleItems = await db.saleItem.findMany({
      include: {
        sale: true,
        item: true,
      },
    });
    return NextResponse.json(saleItems);
  } catch (error) {
    console.error('Error fetching sale items:', error);
    return NextResponse.json({ error: 'Failed to fetch sale items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { saleId, itemId, itemName, itemCategory, itemPrice, sellPrice, quantitySold, profit } = body;

    const saleItem = await db.saleItem.create({
      data: {
        saleId,
        itemId,
        itemName,
        itemCategory,
        itemPrice,
        sellPrice,
        quantitySold,
        profit,
      },
    });

    return NextResponse.json(saleItem);
  } catch (error) {
    console.error('Error creating sale item:', error);
    return NextResponse.json({ error: 'Failed to create sale item' }, { status: 500 });
  }
}
