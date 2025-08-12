import { CartItem, Customer } from '@/types/common';
import {
    CreditCardOutlined,
    DeleteOutlined,
    DollarOutlined,
    PhoneOutlined,
    TagOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Divider,
    Form,
    Input,
    InputNumber,
    notification,
    Radio,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;
const { Option } = Select;

interface MultiItemCheckoutProps {
  cartItems: CartItem[];
  customers: Customer[];
  onCustomerPhoneChange: (phone: string) => void;
  onCheckout: (values: any) => void;
  onCancel: () => void;
  isNewCustomer: boolean;
  currentCustomer: Customer | null;
  onUpdateCartItemSellPrice?: (itemId: string, sellPrice: number) => void;
  onUpdateCartItemQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

const MultiItemCheckout: React.FC<MultiItemCheckoutProps> = ({
  cartItems,
  customers,
  onCustomerPhoneChange,
  onCheckout,
  onCancel,
  isNewCustomer,
  currentCustomer,
  onUpdateCartItemSellPrice,
  onUpdateCartItemQuantity,
  onRemoveItem
}) => {
  const [form] = Form.useForm();
  const [totalAmount, setTotalAmount] = useState(0);
  const [redeemablePoints, setRedeemablePoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  useEffect(() => {
    // Calculate totals
    const amount = cartItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

    setTotalAmount(amount);

    // Set redeemable points
    if (currentCustomer && !isNewCustomer) {
      setRedeemablePoints(currentCustomer.loyaltyPoints);
    } else {
      setRedeemablePoints(0);
    }

    // Calculate final amount after points redemption
    setFinalAmount(Math.max(0, amount - pointsToRedeem));
  }, [cartItems, currentCustomer, isNewCustomer, pointsToRedeem]);

  // Update form values when currentCustomer changes
  useEffect(() => {
    if (currentCustomer && !isNewCustomer) {
      form.setFieldsValue({
        customerName: currentCustomer.name,
        customerPhone: currentCustomer.phoneNumber
      });
    }
  }, [currentCustomer, isNewCustomer, form]);

  const handlePointsRedemption = (value: number) => {
    setPointsToRedeem(value || 0);
    form.setFieldsValue({ redeemPoints: value });
  };

  const handleSubmit = (values: any) => {
    const checkoutData = {
      ...values,
      cartItems,
      totalAmount,
      pointsRedeemed: pointsToRedeem,
      finalAmount
    };
    onCheckout(checkoutData);
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CartItem) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.category}</Text>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_: number, record: CartItem) => (
        <div>
          <InputNumber
            min={1}
            max={record.stock}
            value={record.quantity}
            onChange={(value) => {
              if (value && onUpdateCartItemQuantity) {
                if (value > record.stock) {
                  notification.warning({
                    message: 'Insufficient Stock',
                    description: `Only ${record.stock} units available for ${record.name}`,
                    placement: 'bottomRight'
                  });
                  onUpdateCartItemQuantity(record.id, record.stock);
                } else {
                  onUpdateCartItemQuantity(record.id, value as number);
                }
              }
            }}
            onKeyDown={(e) => {
              // Prevent all keyboard input except arrow keys and tab
              if (!['ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            controls={true}
            size="small"
            style={{ width: '80px' }}
          />
          <div style={{ marginTop: 4 }}>
            <Tooltip title="Available stock">
              <Tag color="blue" style={{ fontSize: '10px' }}>
                Stock: {record.stock}
              </Tag>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (_: number, record: CartItem) => (
        <div>
          <InputNumber
            min={record.minimumSellPrice}
            value={record.sellPrice}
            onChange={(value) => {
              if (value && onUpdateCartItemSellPrice) {
                if (value < record.minimumSellPrice) {
                  notification.warning({
                    message: 'Minimum Sell Price',
                    description: `The minimum sell price for ${record.name} is KES ${record.minimumSellPrice}`,
                    placement: 'bottomRight'
                  });
                  onUpdateCartItemSellPrice(record.id, record.minimumSellPrice);
                } else {
                  onUpdateCartItemSellPrice(record.id, value as number);
                }
              }
            }}
            formatter={(value) => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => Number(value!.replace(/KES\s?|(,*)/g, ''))}
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
      render: (_: any, record: CartItem) => (
        <div>
          <Text>{`KES ${(record.sellPrice * record.quantity).toLocaleString()}`}</Text>
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
      width: 80,
      render: (_: any, record: CartItem) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => onRemoveItem && onRemoveItem(record.id)}
          disabled={!onRemoveItem}
          title="Remove item from cart"
        />
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        customerPhone: currentCustomer?.phoneNumber || '',
        customerName: currentCustomer?.name || '',
        paymentMethod: 'cash',
        redeemPoints: 0
      }}
    >
      <Card title="Cart Summary" style={{ marginBottom: '20px' }}>
        <Table
          dataSource={cartItems}
          columns={columns}
          pagination={false}
          rowKey="id"
          size="small"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>{`KES ${totalAmount.toLocaleString()}`}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Card title="Customer Information" style={{ marginBottom: '20px' }}>
        <Form.Item
          name="customerPhone"
          label="Customer Phone"
          rules={[
            { required: true, message: 'Please enter customer phone number!' },
            { pattern: /^[0-9+\-\s]+$/, message: 'Please enter a valid phone number!' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Enter customer phone number"
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="customerName"
          label="Customer Name"
          rules={[
            {
              required: isNewCustomer,
              message: 'Please enter customer name!'
            }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter customer name"
            disabled={!isNewCustomer && currentCustomer !== null}
          />
        </Form.Item>

        {isNewCustomer && (
          <Form.Item
            name="referredBy"
            label="Referred By (Optional)"
          >
            <Select
              allowClear
              showSearch
              placeholder="Select referring customer"
              optionFilterProp="children"
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phoneNumber})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Card>

      <Card title="Payment Information" style={{ marginBottom: '20px' }}>
        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[{ required: true, message: 'Please select payment method!' }]}
        >
          <Radio.Group>
            <Radio.Button value="cash">Cash</Radio.Button>
            <Radio.Button value="card">Card</Radio.Button>
            <Radio.Button value="mobile">Mobile Money</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="paymentReference"
          label="Payment Reference"
          rules={[
            {
              required: form.getFieldValue('paymentMethod') !== 'cash',
              message: 'Please enter payment reference!'
            }
          ]}
          hidden={form.getFieldValue('paymentMethod') === 'cash'}
        >
          <Input
            prefix={<CreditCardOutlined />}
            placeholder="Enter payment reference number"
          />
        </Form.Item>

        {currentCustomer && !isNewCustomer && currentCustomer.loyaltyPoints > 0 && (
          <>
            <Alert
              message={`Available Loyalty Points: KES ${currentCustomer.loyaltyPoints.toFixed(2)}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="redeemPoints"
              label="Redeem Loyalty Points"
              rules={[
                {
                  validator: async (_, value) => {
                    if (value && value > redeemablePoints) {
                      return Promise.reject(`Cannot redeem more than available points (KES ${redeemablePoints.toFixed(2)})`)
                    }
                    if (value && value > totalAmount) {
                      return Promise.reject(`Cannot redeem more than the total amount (KES ${totalAmount.toFixed(2)})`)
                    }
                    return Promise.resolve()
                  }
                }
              ]}
              help={`Remaining points after redemption: KES ${(redeemablePoints - pointsToRedeem).toFixed(2)}`}
            >
              <InputNumber
                min={0}
                max={Math.min(redeemablePoints, totalAmount)}
                style={{ width: '100%' }}
                formatter={value => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => Number(value!.replace(/KES\s?|(,*)/g, ''))}
                onChange={handlePointsRedemption}
              />
            </Form.Item>
          </>
        )}

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text>Subtotal:</Text>
          <Text>{`KES ${totalAmount.toLocaleString()}`}</Text>
        </div>

        {pointsToRedeem > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text>Points Redeemed:</Text>
            <Text type="danger">{`- KES ${pointsToRedeem.toLocaleString()}`}</Text>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text strong>Final Amount:</Text>
          <Text strong>{`KES ${finalAmount.toLocaleString()}`}</Text>
        </div>
      </Card>

      <Card title="Receipt Options" style={{ marginBottom: '20px' }}>
        <Form.Item
          name="printReceipt"
          valuePropName="checked"
          initialValue={true}
        >
          <Checkbox>
            Print receipt for customer
          </Checkbox>
        </Form.Item>
      </Card>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Complete Sale
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default MultiItemCheckout;
