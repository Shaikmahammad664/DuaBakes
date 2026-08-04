import os
import uuid
import json
import hashlib
import base64
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from loguru import logger
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.sql import text

try:
    import pymysql
except ImportError:
    pymysql = None

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    psycopg2 = None
    psycopg2_extras = None

load_dotenv()

DEFAULT_ADMIN_EMAIL = os.getenv('DEFAULT_ADMIN_EMAIL')
DEFAULT_ADMIN_PASSWORD = os.getenv('DEFAULT_ADMIN_PASSWORD')

engine = None
connection = None
cursor = None


def get_db_dialect_name() -> str:
    if engine is not None:
        return engine.dialect.name
    database_url = os.getenv('DATABASE_URL', '')
    dialect = urlparse(database_url).scheme
    return dialect.split('+', 1)[0] if dialect else ''


def is_cockroach_database() -> bool:
    return get_db_dialect_name() == 'cockroachdb'


def backfill_mysql_order_phone():
    if is_cockroach_database():
        logger.info('Skipping MySQL-specific order backfill on CockroachDB.')
        return

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
    if is_cockroach_database():
        logger.info('Skipping MySQL table creation on CockroachDB.')
        return

    try:
        mysql_cursor = connection.cursor()
        mysql_cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                Order_Id VARCHAR(32) NOT NULL,
                PhoneNumber VARCHAR(20),
                CustomerName VARCHAR(255),
                PaymentMethod VARCHAR(100),
                ShippingAddress TEXT,
                BillingAddress TEXT,
                Items TEXT NOT NULL,
                TotalAmount DECIMAL(10,2) DEFAULT 0.00,
                CreatedAt TEXT NOT NULL,
                DeliveryDate VARCHAR(50),
                DeliveryTime VARCHAR(50),
                CakeText TEXT,
                Order_Status VARCHAR(50) DEFAULT 'placed',
                TrackingNote TEXT,
                PRIMARY KEY (Order_Id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ''')

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'PhoneNumber'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN PhoneNumber VARCHAR(20) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'CustomerName'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN CustomerName VARCHAR(255) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'PaymentMethod'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN PaymentMethod VARCHAR(100) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'ShippingAddress'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN ShippingAddress TEXT NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'BillingAddress'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN BillingAddress TEXT NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'DeliveryDate'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN DeliveryDate VARCHAR(50) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'DeliveryTime'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN DeliveryTime VARCHAR(50) NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'CakeText'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN CakeText TEXT NULL")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'Order_Status'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN Order_Status VARCHAR(50) DEFAULT 'placed'")

        mysql_cursor.execute("SHOW COLUMNS FROM orders LIKE 'TrackingNote'")
        if mysql_cursor.fetchone() is None:
            mysql_cursor.execute("ALTER TABLE orders ADD COLUMN TrackingNote TEXT NULL")

        mysql_cursor.execute('''
            CREATE TABLE IF NOT EXISTS Admin (
                Admin_Id VARCHAR(32) PRIMARY KEY,
                FirstName VARCHAR(255),
                LastName VARCHAR(255),
                Email VARCHAR(255) NOT NULL UNIQUE,
                Password VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ''')

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
    if is_cockroach_database():
        logger.info('Skipping MySQL default admin creation on CockroachDB.')
        return False

    try:
        admin_email = os.getenv('DEFAULT_ADMIN_EMAIL', 'duabakesofficial@gmail.com')
        placeholder = get_placeholder()
        cursor.execute(f"SELECT 1 FROM Admin WHERE Email = {placeholder}", (admin_email,))
        if cursor.fetchone():
            return True

        admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin1234')
        admin_id = uuid.uuid4().hex[:12]
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


def create_db_cursor(connection):
    if pymysql is not None and connection.__class__.__module__.startswith('pymysql'):
        return connection.cursor(pymysql.cursors.DictCursor)
    if psycopg2 is not None and connection.__class__.__module__.startswith('psycopg2'):
        return connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return connection.cursor()


def row_to_dict(row, cursor_obj=None):
    if isinstance(row, dict):
        return row
    if hasattr(row, '_mapping'):
        try:
            return dict(row._mapping)
        except Exception:
            pass
    if cursor_obj is not None and getattr(cursor_obj, 'description', None):
        try:
            return {col[0]: row[idx] for idx, col in enumerate(cursor_obj.description)}
        except Exception:
            pass
    try:
        return dict(row)
    except Exception:
        return {}


def create_engine_connection(database_url):
    global engine, connection, cursor
    engine = create_engine(database_url, pool_pre_ping=True)
    connection = engine.raw_connection()
    cursor = create_db_cursor(connection)
    return engine, connection, cursor


def normalize_database_url(database_url: str) -> str:
    # Ensure CockroachDB URLs without sslrootcert use system sslmode
    if database_url.startswith('cockroachdb://'):
        parsed = urlparse(database_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        if query.get('sslmode') == 'verify-full' and 'sslrootcert' not in query:
            query['sslmode'] = 'system'
            normalized_url = urlunparse(parsed._replace(query=urlencode(query, doseq=True)))
            logger.warning('CockroachDB DATABASE_URL normalized to sslmode=system because no sslrootcert is configured.')
            return normalized_url
    # If a plain mysql:// URL is provided, prefer PyMySQL driver explicitly
    if database_url.startswith('mysql://') and 'mysql+pymysql://' not in database_url:
        logger.warning('DATABASE_URL uses mysql:// — normalizing to mysql+pymysql:// to ensure PyMySQL driver is used.')
        return 'mysql+pymysql://' + database_url[len('mysql://'):]
    return database_url


def build_database_url():
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url
    raise ValueError('DATABASE_URL is required for SQLAlchemy connections.')


def connect_to_database():
    global connection, cursor, engine
    database_url = normalize_database_url(build_database_url())
    create_engine_connection(database_url)
    logger.info('Connected to database successfully via SQLAlchemy.')
    ensure_mysql_tables()
    ensure_default_admin()


def get_placeholder():
    return '%s'


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
    except Exception as e:
        msg = str(e)
        logger.error(f"Integrity error storing user: {msg}")
        if 'Duplicate' in msg and 'Email' in msg:
            raise ValueError('Email already registered')
        if 'Duplicate' in msg and 'PhoneNumber' in msg:
            raise ValueError('Phone number already registered')
        raise
    except Exception as e:
        msg = str(e)
        logger.error(f"Integrity error storing user: {msg}")
        if 'Duplicate' in msg and 'Email' in msg:
            raise ValueError('Email already registered')
        if 'Duplicate' in msg and 'PhoneNumber' in msg:
            raise ValueError('Phone number already registered')
        raise


# to fetch user data

def fetch_user(query, table='users'):
    try:
        logger.info(f"Fetching user with query keys {list(query.keys())} from {table}")
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
            # Normalize DB row -> dict in a robust way using cursor.description
            try:
                if isinstance(user, dict):
                    row = user
                else:
                    # If cursor.description is available, map column names to values
                    if getattr(cursor, 'description', None):
                        cols = [c[0] for c in cursor.description]
                        row = dict(zip(cols, user))
                    else:
                        # Fall back to attempting direct dict() conversion
                        row = dict(user)
            except Exception as e:
                logger.error(f"Failed to convert DB row to dict: {e}")
                return None

            # log presence and type of stored password (do NOT log actual password)
            pwd = row.get('Password')
            if pwd is None:
                logger.debug('Fetched user has no Password field set')
            else:
                try:
                    logger.debug(f"Fetched user Password prefix: {str(pwd)[:16]}... (len={len(str(pwd))})")
                except Exception:
                    logger.debug('Fetched user has a non-string Password field')

            if 'Password' in query:
                stored_password = row.get('Password')
                verified = verify_password(query['Password'], stored_password)
                logger.debug(f"Password verification result: {verified}")
                if not verified:
                    return None
            logger.debug(f"User found in {table}.")
            return row
        return None
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
        return dict(product) if product is not None else None
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

        order_id = (order_data.get('Order_Id') or '').strip() or uuid.uuid4().hex[:12]
        placeholder = get_placeholder()
        query = f"INSERT INTO orders (PhoneNumber, CustomerName, Order_Id, PaymentMethod, ShippingAddress, BillingAddress, Items, TotalAmount, CreatedAt, DeliveryDate, DeliveryTime, CakeText, Order_Status, TrackingNote) VALUES ({', '.join([placeholder]*14)})"
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
            order_data.get('CustomerName'),
            order_id,
            order_data.get('PaymentMethod'),
            json.dumps(order_data.get('ShippingAddress', {})),
            json.dumps(order_data.get('BillingAddress', {})),
            json.dumps(order_data.get('Items', [])),
            float(order_data.get('TotalAmount', 0)),
            created_at,
            order_data.get('DeliveryDate'),
            order_data.get('DeliveryTime'),
            order_data.get('CakeText'),
            order_data.get('Order_Status') or 'placed',
            order_data.get('TrackingNote') or '',
        )
        cursor.execute(query, values)
        connection.commit()
        return order_id
    except Exception as e:
        logger.error(f"Error storing order: {e}")
        return False


def fetch_all_orders():
    try:
        cursor.execute("SELECT * FROM orders ORDER BY CreatedAt DESC")
        orders = cursor.fetchall()
        result = []
        for row in orders:
            item = row_to_dict(row, cursor)
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
            mcur = connection.cursor()
            mcur.execute("SHOW COLUMNS FROM orders")
            columns = [r[0] for r in mcur.fetchall()]
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
            item = row_to_dict(row, cursor)
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
    """Backfill PhoneNumber on orders from users table for MySQL."""
    try:
        backfill_mysql_order_phone()
        return True
    except Exception as e:
        logger.error(f'Error backfilling orders phone numbers: {e}')
        return False
