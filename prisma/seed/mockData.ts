import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const splitSql = (sql: string) => {
  return sql.split(';').filter(content => content.trim() !== '')
}

async function main() {
  const sql = `

INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('90538dfd-8823-473f-9905-f91a0fc95251', '1Laurel_Breitenberg15@yahoo.com', 'Jane Smith', 'https://i.imgur.com/YfJQV5z.png?id=3', 'cus_M1ch43lBr0wn', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('a4e243ee-16bc-434e-9dfc-66ccc422eba8', '13Elvera.Wiegand54@hotmail.com', 'Emily Jones', 'https://i.imgur.com/YfJQV5z.png?id=15', 'cus_M1ch43lBr0wn', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('160feebd-e9ce-45eb-8342-a23cf4ed9725', '19Heloise_Lueilwitz-Hyatt48@hotmail.com', 'Michael Brown', 'https://i.imgur.com/YfJQV5z.png?id=21', 'cus_3m1lyJ0n3s', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('9a362b6a-7612-41ba-b4dd-d623a2c1d480', '25America_McKenzie2@hotmail.com', 'John Doe', 'https://i.imgur.com/YfJQV5z.png?id=27', 'cus_J4n3Sm1th', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('8715843b-a5ef-44ec-9652-be5864191433', '31Dahlia.Frami22@gmail.com', 'John Doe', 'https://i.imgur.com/YfJQV5z.png?id=33', 'cus_M1ch43lBr0wn', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('b1624796-50b3-4bee-a3fd-aeda34b041a9', '37Marcel_Veum72@yahoo.com', 'Emily Jones', 'https://i.imgur.com/YfJQV5z.png?id=39', 'cus_J0nD03', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('7ceb4ef2-a99c-4676-b900-a698adb6514b', '43Michaela.Larkin@yahoo.com', 'John Doe', 'https://i.imgur.com/YfJQV5z.png?id=45', 'cus_M1ch43lBr0wn', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('b0b002f0-a93c-4e48-a21c-50da5f016e52', '49Amaya_Walker66@yahoo.com', 'John Doe', 'https://i.imgur.com/YfJQV5z.png?id=51', 'cus_J0nD03', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');
INSERT INTO "User" ("id", "email", "name", "pictureUrl", "stripeCustomerId", "password") VALUES ('18050fba-3f50-43de-84cc-ff064bfc048d', '55Wyatt.Gutkowski50@yahoo.com', 'David Wilson', 'https://i.imgur.com/YfJQV5z.png?id=57', 'cus_M1ch43lBr0wn', '$2b$10$ppubsZypHzkqW9dkhMB97ul2.wSsvaCoDE2CzqIHygddRMKXvpYUC');

INSERT INTO "Admin" ("id", "userId") VALUES ('16974ad0-d965-4146-a944-a0561c95b1e1', '18050fba-3f50-43de-84cc-ff064bfc048d');
INSERT INTO "Admin" ("id", "userId") VALUES ('50e1817e-fb95-47e4-8f4f-600eada51133', '21a857f1-ba5f-4435-bcf6-f910ec07c0dc');
INSERT INTO "Admin" ("id", "userId") VALUES ('ce60767c-9deb-4e48-968c-b08e40c4f5c4', 'a4e243ee-16bc-434e-9dfc-66ccc422eba8');
INSERT INTO "Admin" ("id", "userId") VALUES ('ca258a91-0d08-4d65-b5a0-81fd78a516f7', '8715843b-a5ef-44ec-9652-be5864191433');
INSERT INTO "Admin" ("id", "userId") VALUES ('ab4c11e6-d16b-41b5-96fb-7703bebab816', '21a857f1-ba5f-4435-bcf6-f910ec07c0dc');
INSERT INTO "Admin" ("id", "userId") VALUES ('11e2f57c-b537-4186-b760-94441ebc6374', '21a857f1-ba5f-4435-bcf6-f910ec07c0dc');
INSERT INTO "Admin" ("id", "userId") VALUES ('722f7495-1a78-4038-8002-a6811dd2ea04', '21a857f1-ba5f-4435-bcf6-f910ec07c0dc');
INSERT INTO "Admin" ("id", "userId") VALUES ('c4aad95d-4327-4e42-bf75-b1a6d0b01783', 'a4e243ee-16bc-434e-9dfc-66ccc422eba8');
INSERT INTO "Admin" ("id", "userId") VALUES ('dea735ff-cc66-4fb2-a271-32a986df30f5', '90538dfd-8823-473f-9905-f91a0fc95251');
INSERT INTO "Admin" ("id", "userId") VALUES ('b481fd68-c1af-4826-bd69-42d393e11029', '90538dfd-8823-473f-9905-f91a0fc95251');

INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('7428ec73-f506-4f09-ae2d-cf26e3aff4b6', 'Uptown Store', '101 Pine St Star City', '5558765');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('2ffd8dfc-1f8f-4e83-8a71-9db82c1f3dcc', 'West End Outlet', '789 Oak St Gotham', '5556789');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('a51c6c62-2a7e-47a0-ae5c-c394720c124f', 'Eastside Depot', '101 Pine St Star City', '5554321');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('7c6fcf6b-6798-4fb4-ae99-b5d1a528d93c', 'West End Outlet', '101 Pine St Star City', '5556789');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('90203989-9ea6-4db8-807f-ce31fbfc4f6a', 'Eastside Depot', '789 Oak St Gotham', '5551234');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('7aa11c72-6829-42d1-8b75-17ad96632b9e', 'Central Warehouse', '123 Main St Springfield', '5551234');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('dcec6eda-18c7-455d-8779-49339b24965e', 'Uptown Store', '202 Maple St Smallville', '5554321');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('1ba6b1bb-18c1-420f-9ab8-6d0ac0ceded6', 'West End Outlet', '789 Oak St Gotham', '5556789');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('d19e6037-bcd6-49b0-802d-08763525ae2c', 'West End Outlet', '456 Elm St Metropolis', '5551234');
INSERT INTO "Branch" ("id", "name", "location", "phoneNumber") VALUES ('e5d847ca-6544-4b40-9ec2-a5e146871e6e', 'Central Warehouse', '101 Pine St Star City', '5556789');

INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('9e8e501c-475f-42a9-a72f-846422189508', 'Tool C', 'Versatile gadget', 'Electronics', 256, 'SKU09876', 92, 'China', 'https://i.imgur.com/YfJQV5z.png?id=118', '90203989-9ea6-4db8-807f-ce31fbfc4f6a');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('3c7664cd-5d75-4ed6-b81e-b47fad6b3b50', 'Gadget B', 'Highquality widget', 'Tools', 759, 'SKU11223', 783, 'China', 'https://i.imgur.com/YfJQV5z.png?id=127', '7aa11c72-6829-42d1-8b75-17ad96632b9e');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('ce9f38fc-b506-44d7-a042-94a98264400d', 'Widget A', 'Durable tool', 'Electronics', 824, 'SKU11223', 876, 'Germany', 'https://i.imgur.com/YfJQV5z.png?id=136', '1ba6b1bb-18c1-420f-9ab8-6d0ac0ceded6');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('35f571c8-2f1e-4867-b01c-600cd0fdf608', 'Device D', 'Durable tool', 'Tools', 384, 'SKU67890', 220, 'Germany', 'https://i.imgur.com/YfJQV5z.png?id=145', 'e5d847ca-6544-4b40-9ec2-a5e146871e6e');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('57638c41-669d-4aba-904e-57a3a883f663', 'Instrument E', 'Durable tool', 'Electronics', 929, 'SKU67890', 528, 'Canada', 'https://i.imgur.com/YfJQV5z.png?id=154', '2ffd8dfc-1f8f-4e83-8a71-9db82c1f3dcc');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('d00a80f8-4f1b-4b40-977c-9a6198d9b343', 'Tool C', 'Durable tool', 'Electronics', 434, 'SKU67890', 442, 'Canada', 'https://i.imgur.com/YfJQV5z.png?id=163', 'd19e6037-bcd6-49b0-802d-08763525ae2c');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('74d6c3e5-c9e1-40c1-be63-25973248769a', 'Device D', 'Highquality widget', 'Appliances', 378, 'SKU11223', 607, 'Germany', 'https://i.imgur.com/YfJQV5z.png?id=172', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('3b29ae0a-6757-496d-9997-f0d255023c7e', 'Device D', 'Durable tool', 'Appliances', 681, 'SKU12345', 573, 'Canada', 'https://i.imgur.com/YfJQV5z.png?id=181', 'd19e6037-bcd6-49b0-802d-08763525ae2c');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('84ad1c5a-c574-43ed-9a1a-2e27ab557386', 'Device D', 'Versatile gadget', 'Hardware', 715, 'SKU11223', 798, 'Canada', 'https://i.imgur.com/YfJQV5z.png?id=190', '7c6fcf6b-6798-4fb4-ae99-b5d1a528d93c');
INSERT INTO "Item" ("id", "name", "description", "category", "price", "sku", "quantity", "origin", "imageUrl", "branchId") VALUES ('846a58bb-b5a2-409e-88bc-5859ed58cce7', 'Tool C', 'Durable tool', 'Hardware', 804, 'SKU11223', 374, 'Germany', 'https://i.imgur.com/YfJQV5z.png?id=199', 'e5d847ca-6544-4b40-9ec2-a5e146871e6e');

INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('fa538836-2099-4a66-ad1e-c281b5b92ca6', 443, 660, '2023-12-21T20:21:05.108Z', '35f571c8-2f1e-4867-b01c-600cd0fdf608', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('29f28b83-1bb4-4449-8e1e-534b7cab18a2', 947, 139, '2024-12-26T02:58:43.303Z', '3c7664cd-5d75-4ed6-b81e-b47fad6b3b50', '7aa11c72-6829-42d1-8b75-17ad96632b9e');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('e0f96e33-dddb-416a-96f7-675194a494d3', 852, 89, '2024-09-20T16:00:34.630Z', '3c7664cd-5d75-4ed6-b81e-b47fad6b3b50', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('89c5b2b1-c6e4-49c1-98e4-390315237af0', 833, 670, '2024-04-29T05:37:59.972Z', 'ce9f38fc-b506-44d7-a042-94a98264400d', '90203989-9ea6-4db8-807f-ce31fbfc4f6a');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('c0d0a8a7-6f6c-4861-90e9-5e49b20af3b8', 233, 158, '2023-12-18T23:33:52.081Z', '35f571c8-2f1e-4867-b01c-600cd0fdf608', '7c6fcf6b-6798-4fb4-ae99-b5d1a528d93c');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('53128620-fba5-44a1-92ad-880d6fbb0387', 649, 641, '2024-04-16T23:44:19.865Z', '74d6c3e5-c9e1-40c1-be63-25973248769a', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('5140268c-bc14-4066-914d-e162167954e9', 781, 546, '2024-10-01T16:56:38.496Z', 'ce9f38fc-b506-44d7-a042-94a98264400d', 'a51c6c62-2a7e-47a0-ae5c-c394720c124f');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('a904ec1b-f30b-4f2a-8dd8-c0db4cea60af', 688, 836, '2024-05-09T14:59:56.531Z', 'd00a80f8-4f1b-4b40-977c-9a6198d9b343', '7c6fcf6b-6798-4fb4-ae99-b5d1a528d93c');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('e10a590f-6e67-4e37-bdff-65f0e85a5875', 707, 886, '2025-08-01T19:00:22.538Z', '35f571c8-2f1e-4867-b01c-600cd0fdf608', 'd19e6037-bcd6-49b0-802d-08763525ae2c');
INSERT INTO "Sale" ("id", "sellPrice", "quantitySold", "saleDate", "itemId", "branchId") VALUES ('43e0a95c-80eb-4810-8780-7e1e7b484732', 467, 239, '2025-05-16T10:56:09.092Z', 'd00a80f8-4f1b-4b40-977c-9a6198d9b343', '7aa11c72-6829-42d1-8b75-17ad96632b9e');

INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('b44f4009-f5e5-4aae-9058-b1b86108e24c', 893, '2024-07-31T22:00:25.405Z', 'd00a80f8-4f1b-4b40-977c-9a6198d9b343', 'e5d847ca-6544-4b40-9ec2-a5e146871e6e', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('b9209636-7f7c-43ff-9c31-84200655be7b', 443, '2023-10-08T19:11:22.551Z', '35f571c8-2f1e-4867-b01c-600cd0fdf608', '90203989-9ea6-4db8-807f-ce31fbfc4f6a', '1ba6b1bb-18c1-420f-9ab8-6d0ac0ceded6');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('ab1bc0fa-71d7-4d18-aee2-6ccf2d3877e4', 726, '2023-08-09T22:40:55.042Z', 'ce9f38fc-b506-44d7-a042-94a98264400d', '7aa11c72-6829-42d1-8b75-17ad96632b9e', '7aa11c72-6829-42d1-8b75-17ad96632b9e');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('b9d36e2f-79bb-4d02-87c7-4e83f94ac50f', 767, '2024-02-09T10:14:18.717Z', 'ce9f38fc-b506-44d7-a042-94a98264400d', '7aa11c72-6829-42d1-8b75-17ad96632b9e', '7c6fcf6b-6798-4fb4-ae99-b5d1a528d93c');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('4fd26a78-5ce2-4b2e-bf35-f68e38b8dfc5', 392, '2024-03-08T03:17:17.188Z', 'd00a80f8-4f1b-4b40-977c-9a6198d9b343', 'd19e6037-bcd6-49b0-802d-08763525ae2c', '90203989-9ea6-4db8-807f-ce31fbfc4f6a');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('9742fc46-273c-45dd-b371-08a122ade456', 11, '2024-12-03T05:02:49.154Z', '84ad1c5a-c574-43ed-9a1a-2e27ab557386', '1ba6b1bb-18c1-420f-9ab8-6d0ac0ceded6', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('3f8d9da4-b073-4ac8-84bc-b40db83501ff', 893, '2025-08-04T05:35:07.001Z', '9e8e501c-475f-42a9-a72f-846422189508', 'dcec6eda-18c7-455d-8779-49339b24965e', 'dcec6eda-18c7-455d-8779-49339b24965e');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('f059e1f7-a883-430d-a71b-4fe13528bc89', 226, '2025-03-31T05:10:19.493Z', '74d6c3e5-c9e1-40c1-be63-25973248769a', '2ffd8dfc-1f8f-4e83-8a71-9db82c1f3dcc', '7428ec73-f506-4f09-ae2d-cf26e3aff4b6');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('95085fb6-71c1-4eed-ad75-223f8674eaf2', 316, '2024-05-31T01:27:55.581Z', '9e8e501c-475f-42a9-a72f-846422189508', 'a51c6c62-2a7e-47a0-ae5c-c394720c124f', '7aa11c72-6829-42d1-8b75-17ad96632b9e');
INSERT INTO "StockTransfer" ("id", "quantity", "transferDate", "itemId", "fromBranchId", "toBranchId") VALUES ('30f16592-ebaa-4b80-8cbb-79c6eaae6ae5', 555, '2025-04-06T22:51:44.930Z', '3b29ae0a-6757-496d-9997-f0d255023c7e', 'e5d847ca-6544-4b40-9ec2-a5e146871e6e', '7c6fcf6b-6798-4fb4-ae99-b5d1a528d93c');

  `

  const sqls = splitSql(sql)

  for (const sql of sqls) {
    try {
      await prisma.$executeRawUnsafe(`${sql}`)
    } catch (error) {
      console.log(`Could not insert SQL: ${error.message}`)
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
