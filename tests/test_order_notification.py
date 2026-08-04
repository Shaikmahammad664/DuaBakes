import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import main


class OrderNotificationTests(unittest.TestCase):
    def test_build_admin_order_notification_payload_includes_order_summary(self):
        order_data = {
            'CustomerName': 'Jane Doe',
            'PhoneNumber': '9999999999',
            'PaymentMethod': 'UPI',
            'ShippingAddress': {
                'address': '123 Baker Street',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pinCode': '400001',
            },
            'Items': [{'name': 'Chocolate Cake', 'quantity': 2, 'size': '1kg'}],
            'TotalAmount': 500,
            'DeliveryDate': '2025-12-25',
            'DeliveryTime': '18:00',
            'CakeText': 'Happy Birthday',
        }

        payload = main.build_admin_order_notification_payload(order_data, 'ord-123')

        self.assertIn('New order received', payload['subject'])
        self.assertIn('ord-123', payload['htmlContent'])
        self.assertIn('Chocolate Cake', payload['htmlContent'])
        self.assertIn('1kg', payload['htmlContent'])
        self.assertIn('UPI', payload['htmlContent'])
        self.assertIn('2025-12-25', payload['htmlContent'])
        self.assertIn('18:00', payload['htmlContent'])
        self.assertIn('Happy Birthday', payload['htmlContent'])
        self.assertIn('123 Baker Street', payload['htmlContent'])
        self.assertIn('9999999999', payload['htmlContent'])


if __name__ == '__main__':
    unittest.main()
