import os
import uuid
import sqlite3
import json
import hashlib
import base64
import mysql.connector
from datetime import datetime
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

DB_TYPE = None
connection = None
cursor = None

MYSQL_SETTINGS = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'duabakes'),
    'port': int(os.getenv('DB_PORT', 3306)) if os.getenv('DB_PORT') else 3306,
}

SQLITE_FILE = os.path.join(os.path.dirname(__file__), 'bakes_fallback.db')


def init_sqlite_tables():
    global cursor, connection
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            PhoneNumber TEXT PRIMARY KEY,
            FirstName TEXT NOT NULL,
            LastName TEXT NOT NULL,
            Email TEXT NOT NULL UNIQUE,
            Password TEXT NOT NULL,
            Token TEXT,
            address TEXT,
            apartment TEXT,
            city TEXT,
            state TEXT,
            pinCode TEXT,
            billingSameAsShipping INTEGER,
            billingAddress TEXT,
            billingApartment TEXT,
            billingCity TEXT,
            billingState TEXT,
            billingPinCode TEXT,
            billingPhone TEXT
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS Admin (
            Admin_Id TEXT PRIMARY KEY,
            FirstName TEXT,
            LastName TEXT,
            Email TEXT NOT NULL UNIQUE,
            Password TEXT NOT NULL
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS products (
            ProductId TEXT PRIMARY KEY,
            ProductName TEXT NOT NULL,
            Description TEXT,
            Category TEXT,
            ImageUrl TEXT,
            Price REAL DEFAULT 0.00,
            StockQuantity INTEGER DEFAULT 0,
            Weight REAL DEFAULT 0
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS orders (
            PhoneNumber TEXT NOT NULL,
            Order_Id TEXT NOT NULL,
            PaymentMethod TEXT,
            ShippingAddress TEXT,
            BillingAddress TEXT,
            Items TEXT NOT NULL,
            TotalAmount REAL DEFAULT 0.00,
            CreatedAt TEXT NOT NULL,
            Order_Status TEXT DEFAULT 'placed',
            TrackingNote TEXT,
            PRIMARY KEY (PhoneNumber, Order_Id)
        )
        '''
    )

    # runtime migration for existing sqlite DBs
    cursor.execute("PRAGMA table_info(users)")
    existing_user_columns = [row[1] for row in cursor.fetchall()]
    if 'address' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN address TEXT')
    if 'apartment' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN apartment TEXT')
    if 'city' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN city TEXT')
    if 'state' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN state TEXT')
    if 'pinCode' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN pinCode TEXT')
    if 'billingSameAsShipping' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingSameAsShipping INTEGER')
    if 'billingAddress' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingAddress TEXT')
    if 'billingApartment' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingApartment TEXT')
    if 'billingCity' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingCity TEXT')
    if 'billingState' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingState TEXT')
    if 'billingPinCode' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingPinCode TEXT')
    if 'billingPhone' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN billingPhone TEXT')
    if 'Token' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN Token TEXT')
    if 'PasswordResetToken' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN PasswordResetToken TEXT')
    if 'PasswordResetExpires' not in existing_user_columns:
        cursor.execute('ALTER TABLE users ADD COLUMN PasswordResetExpires TEXT')

    cursor.execute("PRAGMA table_info(orders)")
    existing_order_columns = [row[1] for row in cursor.fetchall()]
    if 'PaymentMethod' not in existing_order_columns:
        cursor.execute('ALTER TABLE orders ADD COLUMN PaymentMethod TEXT')
    if 'ShippingAddress' not in existing_order_columns:
        cursor.execute('ALTER TABLE orders ADD COLUMN ShippingAddress TEXT')
    if 'BillingAddress' not in existing_order_columns:
        cursor.execute('ALTER TABLE orders ADD COLUMN BillingAddress TEXT')
    if 'Order_Status' not in existing_order_columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN Order_Status TEXT DEFAULT 'placed'")
    if 'TrackingNote' not in existing_order_columns:
        cursor.execute('ALTER TABLE orders ADD COLUMN TrackingNote TEXT')

    connection.commit()


def backfill_mysql_order_phone():
    try:
        mysql_cursor = connection.cursor()
        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'PhoneNumber'")
        if mysql_cursor.fetchone() is None:
            return

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'Email'")
        if mysql_cursor.fetchone() is not None:
            mysql_cursor.execute(
                "UPDATE orders o JOIN users u ON o.Email = u.Email SET o.PhoneNumber = u.PhoneNumber WHERE (o.PhoneNumber IS NULL OR o.PhoneNumber = '') AND o.Email IS NOT NULL"
            )
            mysql_cursor.execute("ALTER TABLE orders DROP COLUMN Email")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'User_Email'")
        if mysql_cursor.fetchone() is not None:
            mysql_cursor.execute(
                "UPDATE orders o JOIN users u ON o.User_Email = u.Email SET o.PhoneNumber = u.PhoneNumber WHERE (o.PhoneNumber IS NULL OR o.PhoneNumber = '') AND o.User_Email IS NOT NULL"
            )
            mysql_cursor.execute("ALTER TABLE orders DROP COLUMN User_Email")

        connection.commit()
        logger.info('Backfilled PhoneNumber on existing MySQL orders and removed legacy email columns.')
    except Exception as e:
        logger.error(f'Error backfilling MySQL order phone numbers: {e}')


def ensure_mysql_tables():
    try:
        mysql_cursor = connection.cursor()
        mysql_cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                Order_Id VARCHAR(32) NOT NULL,
                PhoneNumber VARCHAR(20),
                PaymentMethod VARCHAR(100),
                ShippingAddress TEXT,
                BillingAddress TEXT,
                Items TEXT NOT NULL,
                TotalAmount DECIMAL(10,2) DEFAULT 0.00,
                CreatedAt TEXT NOT NULL,
                Order_Status VARCHAR(50) DEFAULT 'placed',
                TrackingNote TEXT,
                PRIMARY KEY (Order_Id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ''')

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'PhoneNumber'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN PhoneNumber VARCHAR(20) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'PaymentMethod'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN PaymentMethod VARCHAR(100) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'ShippingAddress'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN ShippingAddress TEXT NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'BillingAddress'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN BillingAddress TEXT NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'Order_Status'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN Order_Status VARCHAR(50) DEFAULT 'placed'")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'TrackingNote'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN TrackingNote TEXT NULL")

        # ensure users table exists and has address columns
        mysql_cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                PhoneNumber VARCHAR(20) PRIMARY KEY,
                FirstName VARCHAR(255) NOT NULL,
                LastName VARCHAR(255) NOT NULL,
                Email VARCHAR(255) NOT NULL UNIQUE,
                Password VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ''')

        def ensure_user_column(col_def, col_name):
            mysql_cursor.execute(f"SHOW COLUMNS FROM users LIKE '{col_name}'")
            if mysql_cursor.fetchone() is None:
                mysql_cursor.execute(col_def)

        ensure_user_column("ALTER TABLE users ADD COLUMN address TEXT NULL", 'address')
        ensure_user_column("ALTER TABLE users ADD COLUMN apartment TEXT NULL", 'apartment')
        ensure_user_column("ALTER TABLE users ADD COLUMN city TEXT NULL", 'city')
        ensure_user_column("ALTER TABLE users ADD COLUMN state TEXT NULL", 'state')
        ensure_user_column("ALTER TABLE users ADD COLUMN pinCode TEXT NULL", 'pinCode')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingSameAsShipping TINYINT(1) NULL", 'billingSameAsShipping')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingAddress TEXT NULL", 'billingAddress')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingApartment TEXT NULL", 'billingApartment')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingCity TEXT NULL", 'billingCity')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingState TEXT NULL", 'billingState')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingPinCode TEXT NULL", 'billingPinCode')
        ensure_user_column("ALTER TABLE users ADD COLUMN billingPhone TEXT NULL", 'billingPhone')
        ensure_user_column("ALTER TABLE users ADD COLUMN Token VARCHAR(255) NULL", 'Token')
        ensure_user_column("ALTER TABLE users ADD COLUMN PasswordResetToken VARCHAR(255) NULL", 'PasswordResetToken')
        ensure_user_column("ALTER TABLE users ADD COLUMN PasswordResetExpires VARCHAR(255) NULL", 'PasswordResetExpires')

        connection.commit()
        backfill_mysql_order_phone()
    except Exception as e:
        logger.error(f'Error ensuring MySQL tables: {e}')


def ensure_default_admin():
    try:
        if fetch_admin({'Email': os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@bakes.com')}):
            return True

        admin_email = os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@bakes.com')
        admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin1234')
        admin_id = uuid.uuid4().hex[:12]
        placeholder = get_placeholder()
        cursor.execute(
            f"INSERT INTO Admin (Admin_Id, FirstName, LastName, Email, Password) VALUES ({', '.join([placeholder] * 5)})",
            (admin_id, 'Admin', 'User', admin_email, hash_password(admin_password)),
        )
        connection.commit()
        logger.info(f'Created default admin account for {admin_email}')
        return True
    except Exception as e:
        logger.error(f'Error ensuring default admin account: {e}')
        return False


def connect_to_database():
    global DB_TYPE, connection, cursor
    try:
        connection = mysql.connector.connect(**MYSQL_SETTINGS)
        cursor = connection.cursor(dictionary=True)
        DB_TYPE = 'mysql'
        logger.info('Connected to MySQL database successfully.')
        ensure_mysql_tables()
    except Exception as mysql_error:
        logger.error(f'MySQL connection failed: {mysql_error}')
        logger.info('Falling back to SQLite local database.')
        connection = sqlite3.connect(SQLITE_FILE, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()
        DB_TYPE = 'sqlite'
        init_sqlite_tables()
        logger.info('SQLite fallback database initialized.')

    ensure_default_admin()


connect_to_database()


def get_placeholder():
    return '%s' if DB_TYPE == 'mysql' else '?'


def hash_password(password: str) -> str:
    if not password:
        raise ValueError('Password is required')

    salt = base64.b64encode(os.urandom(16)).decode('utf-8')
    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100_000,
    )
    encoded_hash = base64.b64encode(derived).decode('utf-8')
    return f'pbkdf2_sha256$100000${salt}${encoded_hash}'


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not password or not stored_hash:
        return False

    if isinstance(stored_hash, str) and stored_hash.startswith('pbkdf2_sha256$'):
        try:
            _, iterations_str, salt, encoded_hash = stored_hash.split('$', 3)
            iterations = int(iterations_str)
            derived = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations,
            )
            return base64.b64decode(encoded_hash.encode('utf-8')) == derived
        except (ValueError, TypeError):
            return False

    return stored_hash == password


# to store user data in db

def store_user(user_data):
    # Insert a new user, raise ValueError for known constraint failures so callers can return clear messages
    if not user_data.get('PhoneNumber'):
        logger.warning('PhoneNumber is required for user registration')
        raise ValueError('PhoneNumber is required')

    # quick pre-checks to provide friendly errors
    if fetch_user({'PhoneNumber': user_data['PhoneNumber']}):
        raise ValueError('Phone number already registered')
    if fetch_user({'Email': user_data['Email']}):
        raise ValueError('Email already registered')

    try:
        password = user_data.get('Password')
        if isinstance(password, str) and password and not password.startswith('pbkdf2_sha256$'):
            user_data['Password'] = hash_password(password)

        placeholder = get_placeholder()
        # MySQL users table may have a `User_Id` primary key without default;
        # generate and include it on MySQL inserts.
        if DB_TYPE == 'mysql':
            user_id = uuid.uuid4().hex[:32]
            query = f"INSERT INTO users (User_Id, PhoneNumber, FirstName, LastName, Email, Password) VALUES ({', '.join([placeholder]*6)})"
            values = (
                user_id,
                user_data.get('PhoneNumber'),
                user_data['FirstName'],
                user_data['LastName'],
                user_data['Email'],
                user_data['Password'],
            )
        else:
            query = f"INSERT INTO users (PhoneNumber, FirstName, LastName, Email, Password) VALUES ({', '.join([placeholder]*5)})"
            values = (
                user_data['PhoneNumber'],
                user_data['FirstName'],
                user_data['LastName'],
                user_data['Email'],
                user_data['Password'],
            )
        cursor.execute(query, values)
        connection.commit()
        return True
    except sqlite3.IntegrityError as ie:
        msg = str(ie)
        logger.error(f"SQLite integrity error storing user: {msg}")
        if 'UNIQUE constraint failed' in msg and 'users.Email' in msg:
            raise ValueError('Email already registered')
        if 'UNIQUE constraint failed' in msg and 'users.PhoneNumber' in msg:
            raise ValueError('Phone number already registered')
        raise
    except mysql.connector.IntegrityError as me:
        msg = str(me)
        logger.error(f"MySQL integrity error storing user: {msg}")
        if 'Duplicate' in msg and 'Email' in msg:
            raise ValueError('Email already registered')
        if 'Duplicate' in msg and 'PhoneNumber' in msg:
            raise ValueError('Phone number already registered')
        raise
    except Exception as e:
        logger.exception(f"Error storing user: {e}")
        raise


# to fetch user data

def fetch_user(query, table='users'):
    try:
        logger.info(f"Fetching user with query {query} from {table}")
        placeholder = get_placeholder()
        # support token-based lookup
        if 'Token' in query:
            sql_query = f"SELECT * FROM {table} WHERE Token = {placeholder}"
            values = (query['Token'],)
        elif 'PasswordResetToken' in query:
            sql_query = f"SELECT * FROM {table} WHERE PasswordResetToken = {placeholder}"
            values = (query['PasswordResetToken'],)
        elif 'Password' in query:
            if 'PhoneNumber' in query:
                sql_query = f"SELECT * FROM {table} WHERE PhoneNumber = {placeholder}"
                values = (query['PhoneNumber'],)
            else:
                sql_query = f"SELECT * FROM {table} WHERE Email = {placeholder}"
                values = (query['Email'],)
        elif 'PhoneNumber' in query:
            sql_query = f"SELECT * FROM {table} WHERE PhoneNumber = {placeholder}"
            values = (query['PhoneNumber'],)
        else:
            sql_query = f"SELECT * FROM {table} WHERE Email = {placeholder}"
            values = (query['Email'],)

        cursor.execute(sql_query, values)
        user = cursor.fetchone()
        if user:
            if DB_TYPE == 'sqlite':
                user = dict(user)
            if 'Password' in query:
                stored_password = user.get('Password') if isinstance(user, dict) else getattr(user, 'Password', None)
                if not verify_password(query['Password'], stored_password):
                    return None
            logger.debug(f"User found in {table}.")
        return user
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return None


# to update the password from reset password 

def update_user(query, update_data, table='users'):
    try:
        placeholder = get_placeholder()
        set_clauses = []
        values = []
        for k, v in update_data.items():
            if k == 'Password' and isinstance(v, str) and v and not v.startswith('pbkdf2_sha256$'):
                v = hash_password(v)
            set_clauses.append(f"{k} = {placeholder}")
            values.append(v)

        if 'PhoneNumber' in query:
            sql_query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE PhoneNumber = {placeholder}"
            values.append(query['PhoneNumber'])
            identifier = query['PhoneNumber']
        else:
            sql_query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE Email = {placeholder}"
            values.append(query['Email'])
            identifier = query['Email']

        cursor.execute(sql_query, tuple(values))
        connection.commit()
        logger.info(f"User with identifier {identifier} updated successfully.")
        return True
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        return False


# admin login page 

def fetch_admin(item: dict):
    try:
        user = fetch_user(item, table='Admin')
        return user
    except Exception as e:
        logger.error(f"Error fetching admin: {e}")
        return None


# to store products in db 

def store_products(products_data):
    try:
        product_id = (products_data.get('ProductId') or '').strip() or uuid.uuid4().hex[:12]
        logger.info(f"Inserting product {product_id}")
        placeholder = get_placeholder()
        query = f"INSERT INTO products (ProductId, ProductName, Description, Category, ImageUrl, Price, StockQuantity, Weight) VALUES ({', '.join([placeholder]*8)})"
        values = (
            product_id,
            products_data['ProductName'],
            products_data['Description'],
            products_data['Category'],
            products_data['ImageUrl'],
            products_data['Price'],
            products_data['StockQuantity'],
            products_data['Weight'],
        )
        cursor.execute(query, values)
        connection.commit()
        return True
    except Exception as e:
        logger.error(f"Error storing products: {e}")
        return False


def fetch_products():
    try:
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        if DB_TYPE == 'sqlite':
            return [dict(row) for row in products]
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        return []


def fetch_product_by_id(product_id):
    try:
        placeholder = get_placeholder()
        cursor.execute(f"SELECT * FROM products WHERE ProductId = {placeholder}", (product_id,))
        product = cursor.fetchone()
        if DB_TYPE == 'sqlite' and product:
            return dict(product)
        return product
    except Exception as e:
        logger.error(f"Error fetching product by id: {e}")
        return None


def update_product(product_id, product_data):
    try:
        placeholder = get_placeholder()
        fields = []
        values = []
        for key in ['ProductName', 'Description', 'Category', 'ImageUrl', 'Price', 'StockQuantity', 'Weight']:
            if key in product_data:
                fields.append(f"{key} = {placeholder}")
                values.append(product_data[key])
        if not fields:
            return False
        values.append(product_id)
        cursor.execute(f"UPDATE products SET {', '.join(fields)} WHERE ProductId = {placeholder}", tuple(values))
        connection.commit()
        return True
    except Exception as e:
        logger.error(f"Error updating product: {e}")
        return False


def delete_product(product_id):
    try:
        placeholder = get_placeholder()
        cursor.execute(f"DELETE FROM products WHERE ProductId = {placeholder}", (product_id,))
        connection.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error deleting product: {e}")
        return False


def store_order(order_data):
    try:
        if not order_data.get('PhoneNumber'):
            logger.warning('PhoneNumber is required to store an order')
            return False

        order_id = uuid.uuid4().hex[:12]
        placeholder = get_placeholder()
        query = f"INSERT INTO orders (PhoneNumber, Order_Id, PaymentMethod, ShippingAddress, BillingAddress, Items, TotalAmount, CreatedAt, Order_Status, TrackingNote) VALUES ({', '.join([placeholder]*10)})"
        # prefer CreatedAt from caller but normalize to local timezone-aware ISO string
        created = order_data.get('CreatedAt')
        if created:
            s = created
            # normalize trailing Z to +00:00 so fromisoformat can parse
            if isinstance(s, str) and s.endswith('Z'):
                s = s[:-1] + '+00:00'
            try:
                dt = datetime.fromisoformat(s)
                created_at = dt.astimezone().isoformat()
            except Exception:
                created_at = datetime.now().astimezone().isoformat()
        else:
            created_at = datetime.now().astimezone().isoformat()

        values = (
            order_data['PhoneNumber'],
            order_id,
            order_data.get('PaymentMethod'),
            json.dumps(order_data.get('ShippingAddress', {})),
            json.dumps(order_data.get('BillingAddress', {})),
            json.dumps(order_data.get('Items', [])),
            float(order_data.get('TotalAmount', 0)),
            created_at,
            order_data.get('Order_Status') or 'placed',
            order_data.get('TrackingNote') or '',
        )
        cursor.execute(query, values)
        connection.commit()
        return True
    except Exception as e:
        logger.error(f"Error storing order: {e}")
        return False


def fetch_all_orders():
    try:
        cursor.execute("SELECT * FROM orders ORDER BY CreatedAt DESC")
        orders = cursor.fetchall()
        result = []
        for row in orders:
            item = dict(row) if DB_TYPE == 'sqlite' else row
            item['Items'] = json.loads(item.get('Items', '[]')) if isinstance(item.get('Items'), str) else item.get('Items', [])
            if isinstance(item.get('ShippingAddress'), str) and item.get('ShippingAddress'):
                try:
                    item['ShippingAddress'] = json.loads(item['ShippingAddress'])
                except Exception:
                    pass
            if isinstance(item.get('BillingAddress'), str) and item.get('BillingAddress'):
                try:
                    item['BillingAddress'] = json.loads(item['BillingAddress'])
                except Exception:
                    pass
            result.append(item)
        return result
    except Exception as e:
        logger.error(f"Error fetching all orders: {e}")
        return []


def update_order_status(order_id, status, note=''):
    try:
        placeholder = get_placeholder()
        cursor.execute(
            f"UPDATE orders SET Order_Status = {placeholder}, TrackingNote = {placeholder} WHERE Order_Id = {placeholder}",
            (status, note, order_id),
        )
        connection.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating order status: {e}")
        return False


def fetch_orders(user_identifier):
    try:
        placeholder = get_placeholder()

        # discover which columns exist so we can query by Email or legacy User_Email if present
        columns = []
        try:
            if DB_TYPE == 'mysql':
                mcur = connection.cursor()
                mcur.execute("SHOW COLUMNS FROM orders")
                columns = [r[0] for r in mcur.fetchall()]
            else:
                cursor.execute("PRAGMA table_info(orders)")
                columns = [r[1] for r in cursor.fetchall()]
        except Exception:
            columns = []

        conditions = []
        values = []

        # if identifier looks like an email, prefer email-based lookup but fall back to phone
        if '@' in user_identifier:
            if 'Email' in columns:
                conditions.append(f"Email = {placeholder}")
                values.append(user_identifier)
            if 'User_Email' in columns:
                conditions.append(f"User_Email = {placeholder}")
                values.append(user_identifier)
            if 'PhoneNumber' in columns:
                conditions.append(f"PhoneNumber = {placeholder}")
                values.append(user_identifier)
        else:
            if 'PhoneNumber' in columns:
                conditions.append(f"PhoneNumber = {placeholder}")
                values.append(user_identifier)
            # also check email columns in case orders were stored with email
            if 'Email' in columns:
                conditions.append(f"Email = {placeholder}")
                values.append(user_identifier)
            if 'User_Email' in columns:
                conditions.append(f"User_Email = {placeholder}")
                values.append(user_identifier)

        if not conditions:
            # no recognisable columns found, return empty list
            return []

        where_clause = ' OR '.join(conditions)
        sql = f"SELECT * FROM orders WHERE ({where_clause}) ORDER BY CreatedAt DESC"
        cursor.execute(sql, tuple(values))
        orders = cursor.fetchall()

        result = []
        for row in orders:
            item = dict(row) if DB_TYPE == 'sqlite' else row
            item['Items'] = json.loads(item.get('Items', '[]')) if isinstance(item.get('Items'), str) else item.get('Items', [])
            if isinstance(item.get('ShippingAddress'), str) and item.get('ShippingAddress'):
                try:
                    item['ShippingAddress'] = json.loads(item['ShippingAddress'])
                except Exception:
                    pass
            if isinstance(item.get('BillingAddress'), str) and item.get('BillingAddress'):
                try:
                    item['BillingAddress'] = json.loads(item['BillingAddress'])
                except Exception:
                    pass
            result.append(item)
        return result
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        return []


def backfill_orders_from_users():
    """Backfill PhoneNumber on orders from users table for both MySQL and SQLite."""
    try:
        if DB_TYPE == 'mysql':
            backfill_mysql_order_phone()
            return True

        # sqlite path
        cursor.execute("PRAGMA table_info(orders)")
        order_cols = [r[1] for r in cursor.fetchall()]
        if 'PhoneNumber' not in order_cols:
            logger.info('orders table has no PhoneNumber column to backfill')
            return False

        # update from Email if present
        if 'Email' in order_cols:
            cursor.execute(
                "UPDATE orders SET PhoneNumber = (SELECT PhoneNumber FROM users WHERE users.Email = orders.Email) WHERE (PhoneNumber IS NULL OR PhoneNumber = '') AND Email IS NOT NULL"
            )

        # update from User_Email if present
        if 'User_Email' in order_cols:
            cursor.execute(
                "UPDATE orders SET PhoneNumber = (SELECT PhoneNumber FROM users WHERE users.Email = orders.User_Email) WHERE (PhoneNumber IS NULL OR PhoneNumber = '') AND User_Email IS NOT NULL"
            )

        connection.commit()
        logger.info('Backfilled PhoneNumber on existing SQLite orders.')
        return True
    except Exception as e:
        logger.error(f'Error backfilling orders phone numbers: {e}')
        return False
