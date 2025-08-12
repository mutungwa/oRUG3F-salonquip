const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  // Seed branches
  const branches = [
    {
      id: uuidv4(),
      name: 'Central Warehouse',
      location: '123 Main St Springfield',
      phoneNumber: '5551234',
    },
    {
      id: uuidv4(),
      name: 'Uptown Store',
      location: '101 Pine St Star City',
      phoneNumber: '5558765',
    },
    {
      id: uuidv4(),
      name: 'West End Outlet',
      location: '789 Oak St Gotham',
      phoneNumber: '5556789',
    },
  ];

  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      update: {},
      create: branch,
    });
  }

  // Seed items (assigning to the first branch for demo)
  const items = [
    {
      id: uuidv4(),
      name: 'Widget A',
      description: 'Durable tool',
      category: 'Electronics',
      price: 824,
      sku: 'SKU11223',
      quantity: 876,
      origin: 'Germany',
      imageUrl: 'https://i.imgur.com/YfJQV5z.png?id=136',
      branchId: branches[0].id,
    },
    {
      id: uuidv4(),
      name: 'Gadget B',
      description: 'High quality widget',
      category: 'Tools',
      price: 759,
      sku: 'SKU11224',
      quantity: 783,
      origin: 'China',
      imageUrl: 'https://i.imgur.com/YfJQV5z.png?id=127',
      branchId: branches[1].id,
    },
    {
      id: uuidv4(),
      name: 'Device C',
      description: 'Versatile gadget',
      category: 'Hardware',
      price: 715,
      sku: 'SKU11225',
      quantity: 798,
      origin: 'Canada',
      imageUrl: 'https://i.imgur.com/YfJQV5z.png?id=190',
      branchId: branches[2].id,
    },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }); 