import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import main


class OrderNotificationTests(unittest.TestCase):
    def test_build_admin_order_notification_payload_includes_order_summary(self):
        order_data = {
            'PhoneNumber': '9999999999',
            'PaymentMethod': 'UPI',
            'ShippingAddress': {'city': 'Mumbai'},
            'Items': [{'name': 'Chocolate Cake', 'quantity': 2}],
            'TotalAmount': 500,
        }

        payload = main.build_admin_order_notification_payload(order_data, 'ord-123')

        self.assertIn('New order received', payload['subject'])
        self.assertIn('ord-123', payload['htmlContent'])
        self.assertIn('Chocolate Cake', payload['htmlContent'])
        self.assertIn('UPI', payload['htmlContent'])


if __name__ == '__main__':
    unittest.main()
