import { db } from '@/core/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleItem = await db.saleItem.findUnique({
      where: {
        id: params.id,
      },
      include: {
        sale: true,
        item: true,
      },
    });

    if (!saleItem) {
      return NextResponse.json({ error: 'Sale item not found' }, { status: 404 });
    }

    return NextResponse.json(saleItem);
  } catch (error) {
    console.error('Error fetching sale item:', error);
    return NextResponse.json({ error: 'Failed to fetch sale item' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { saleId, itemId, itemName, itemCategory, itemPrice, sellPrice, quantitySold, profit } = body;

    const saleItem = await db.saleItem.update({
      where: {
        id: params.id,
      },
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
    console.error('Error updating sale item:', error);
    return NextResponse.json({ error: 'Failed to update sale item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.saleItem.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Sale item deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale item:', error);
    return NextResponse.json({ error: 'Failed to delete sale item' }, { status: 500 });
  }
}
