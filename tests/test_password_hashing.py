import unittest

from db_ops import hash_password, verify_password


class PasswordHashingTests(unittest.TestCase):
    def test_password_hashing_is_one_way_and_verifiable(self):
        password = "SuperSecret123!"
        hashed = hash_password(password)

        self.assertNotEqual(hashed, password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong-password", hashed))


if __name__ == "__main__":
    unittest.main()
