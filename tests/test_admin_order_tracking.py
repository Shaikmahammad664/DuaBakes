import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import db_ops


class AdminOrderTrackingTests(unittest.TestCase):
    def setUp(self):
        self.cursor = db_ops.cursor
        self.connection = db_ops.connection
        self.cursor.execute("DELETE FROM orders WHERE Order_Id LIKE 'test-%'")
        self.cursor.execute("DELETE FROM products WHERE ProductId LIKE 'test-%'")
        self.connection.commit()

    def test_update_order_status_writes_status_and_note(self):
        self.assertTrue(hasattr(db_ops, 'update_order_status'))
        self.cursor.execute(
            "INSERT INTO orders (PhoneNumber, Order_Id, PaymentMethod, ShippingAddress, BillingAddress, Items, TotalAmount, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ('9999999999', 'test-order-1', 'Cash', '{}', '{}', '[]', 0.0, '2024-01-01T00:00:00+00:00'),
        )
        self.connection.commit()

        updated = db_ops.update_order_status('test-order-1', 'preparing', 'Packed and ready for pickup')
        self.assertTrue(updated)

        self.cursor.execute("SELECT Order_Status, TrackingNote FROM orders WHERE Order_Id = ?", ('test-order-1',))
        row = self.cursor.fetchone()
        self.assertEqual(row['Order_Status'], 'preparing')
        self.assertEqual(row['TrackingNote'], 'Packed and ready for pickup')


if __name__ == '__main__':
    unittest.main()
