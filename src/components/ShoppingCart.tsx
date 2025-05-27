import {
    DeleteOutlined,
    DollarOutlined,
    InfoCircleOutlined,
    MinusOutlined,
    PlusOutlined,
    ShoppingCartOutlined,
    TagOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    Divider,
    Empty,
    InputNumber,
    notification,
    Popover,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sellPrice: number;
  quantity: number;
  branchId: string;
  branchName: string;
  minimumSellPrice: number;
  stock: number; // Available stock
}

interface ShoppingCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateSellPrice: (itemId: string, sellPrice: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cartItems,
  onUpdateQuantity,
  onUpdateSellPrice,
  onRemoveItem,
  onClearCart
}) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // Calculate totals
    const amount = cartItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    setTotalAmount(amount);
    setTotalItems(items);
  }, [cartItems]);

  const columns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CartItem) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Space size={4}>
            <Tag color="blue">{record.category}</Tag>
            <Tag color="green">{record.branchName}</Tag>
          </Space>
        </div>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record: CartItem) => (
        <Space>
          <Button
            icon={<MinusOutlined />}
            size="small"
            onClick={() => onUpdateQuantity(record.id, Math.max(1, record.quantity - 1))}
            disabled={record.quantity <= 1}
          />
          <InputNumber
            min={1}
            max={record.stock}
            value={record.quantity}
            onChange={(value) => onUpdateQuantity(record.id, value as number)}
            style={{ width: '60px' }}
          />
          <Button
            icon={<PlusOutlined />}
            size="small"
            onClick={() => onUpdateQuantity(record.id, Math.min(record.stock, record.quantity + 1))}
            disabled={record.quantity >= record.stock}
          />
          <Tooltip title={`Available stock: ${record.stock}`}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Price',
      key: 'sellPrice',
      render: (_, record: CartItem) => (
        <div>
          <InputNumber
            min={record.minimumSellPrice}
            value={record.sellPrice}
            onChange={(value) => {
              if (value && value < record.minimumSellPrice) {
                notification.warning({
                  message: 'Minimum Sell Price',
                  description: `The minimum sell price for ${record.name} is KES ${record.minimumSellPrice}`,
                  placement: 'bottomRight'
                });
                onUpdateSellPrice(record.id, record.minimumSellPrice);
              } else {
                onUpdateSellPrice(record.id, value as number);
              }
            }}
            formatter={(value) => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseFloat(value!.replace(/KES\s?|(,*)/g, '')) || 0}
            style={{ width: '120px' }}
          />
          <div style={{ marginTop: 4 }}>
            <Tooltip title="Minimum sell price">
              <Tag color="volcano" icon={<TagOutlined />}>Min: KES {record.minimumSellPrice}</Tag>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record: CartItem) => (
        <div>
          <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>{`KES ${(record.sellPrice * record.quantity).toLocaleString()}`}</Text>
          <div style={{ marginTop: 4 }}>
            <Tooltip title="Profit">
              <Tag color="green" icon={<DollarOutlined />}>
                KES {((record.sellPrice - record.price) * record.quantity).toLocaleString()}
              </Tag>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: CartItem) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onRemoveItem(record.id)}
          size="small"
        />
      ),
    },
  ];

  // Calculate total profit
  const calculateTotalProfit = () => {
    return cartItems.reduce((sum, item) => sum + ((item.sellPrice - item.price) * item.quantity), 0);
  };

  const CartSummary = () => (
    <div style={{ padding: '16px' }}>
      <Card
        style={{ marginBottom: '16px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text>Items:</Text>
          <Text>{totalItems}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text>Subtotal:</Text>
          <Text>{`KES ${totalAmount.toLocaleString()}`}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text type="success">Profit:</Text>
          <Text type="success">{`KES ${calculateTotalProfit().toLocaleString()}`}</Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0' }}>
          <Text strong style={{ fontSize: '16px' }}>Total:</Text>
          <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>{`KES ${totalAmount.toLocaleString()}`}</Text>
        </div>
      </Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button
          type="primary"
          danger
          onClick={onClearCart}
          disabled={cartItems.length === 0}
          icon={<DeleteOutlined />}
        >
          Clear Cart
        </Button>
        <Button
          type="primary"
          disabled={cartItems.length === 0}
          icon={<ShoppingCartOutlined />}
        >
          Checkout
        </Button>
      </Space>
    </div>
  );

  const CartContent = () => (
    <div style={{ maxWidth: '600px', minWidth: '300px' }}>
      {cartItems.length === 0 ? (
        <Empty description="Your cart is empty" />
      ) : (
        <>
          <Table
            dataSource={cartItems}
            columns={columns}
            pagination={false}
            rowKey="id"
            size="small"
            scroll={{ y: 300 }}
          />
          <CartSummary />
        </>
      )}
    </div>
  );

  return (
    <div>
      <Popover
        content={<CartContent />}
        title={<Title level={5}><ShoppingCartOutlined /> Shopping Cart</Title>}
        trigger="click"
        placement="bottomRight"
        overlayStyle={{ maxWidth: '80vw' }}
      >
        <Badge count={totalItems} showZero>
          <Button
            type="primary"
            shape="circle"
            icon={<ShoppingCartOutlined />}
            size="large"
          />
        </Badge>
      </Popover>
    </div>
  );
};

export default ShoppingCart;
