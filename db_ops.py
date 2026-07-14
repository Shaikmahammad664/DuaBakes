# import pymongo
# import os
# from loguru import logger
# from dotenv import load_dotenv
# load_dotenv()

# # MONGO_URL = os.getenv("MONGO_URL")
# # DB_NAME = os.getenv("DB_NAME")
# USER_COLLECTION = os.getenv("USER_COLLECTION")
# # client= pymongo.MongoClient(MONGO_URL)
# # logger.info("Connected to MongoDB")

# # db = client[DB_NAME]=
# db=""

# def store_user(user_data):

#     try:
#         users_collection = db[USER_COLLECTION]
#         users_collection.insert_one(user_data)  
#         return True
#     except Exception as e:
#         print(f"Error storing user: {e}")
#         return False

# def fetch_user(query):
#     users_collection = db[USER_COLLECTION]
#     user = users_collection.find_one(query)
#     return user
# def update_user(query, update_data):
#     users_collection = db[USER_COLLECTION]
#     users_collection.update_one(query, {'$set': update_data})
#     return True

import os
import uuid
import sqlite3
import mysql.connector
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
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            User_Id TEXT PRIMARY KEY,
            FirstName TEXT NOT NULL,
            LastName TEXT NOT NULL,
            Email TEXT NOT NULL UNIQUE,
            Password TEXT NOT NULL,
            PhoneNumber TEXT
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
    connection.commit()


def connect_to_database():
    global DB_TYPE, connection, cursor
    try:
        connection = mysql.connector.connect(**MYSQL_SETTINGS)
        cursor = connection.cursor(dictionary=True)
        DB_TYPE = 'mysql'
        logger.info('Connected to MySQL database successfully.')
    except Exception as mysql_error:
        logger.error(f'MySQL connection failed: {mysql_error}')
        logger.info('Falling back to SQLite local database.')
        connection = sqlite3.connect(SQLITE_FILE, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()
        DB_TYPE = 'sqlite'
        init_sqlite_tables()
        logger.info('SQLite fallback database initialized.')


connect_to_database()


def get_placeholder():
    return '%s' if DB_TYPE == 'mysql' else '?'


# to store user data in db

def store_user(user_data):
    try:
        existing = fetch_user({'Email': user_data['Email']})
        if existing:
            logger.warning(f"User already exists: {user_data['Email']}")
            return False

        user_id = uuid.uuid4().hex
        logger.info(f"Registering user with id: {user_id}")
        placeholder = get_placeholder()
        query = f"INSERT INTO users (User_Id, FirstName, LastName, Email, Password, PhoneNumber) VALUES ({', '.join([placeholder]*6)})"
        values = (
            user_id,
            user_data['FirstName'],
            user_data['LastName'],
            user_data['Email'],
            user_data['Password'],
            user_data['PhoneNumber'],
        )
        cursor.execute(query, values)
        connection.commit()
        return True
    except Exception as e:
        logger.error(f"Error storing user: {e}")
        return False


# to fetch user data

def fetch_user(query, table='users'):
    try:
        logger.info(f"Fetching user with query {query} from {table}")
        placeholder = get_placeholder()
        if 'Password' in query:
            sql_query = f"SELECT * FROM {table} WHERE Email = {placeholder} AND Password = {placeholder}"
            values = (query['Email'], query['Password'])
        else:
            sql_query = f"SELECT * FROM {table} WHERE Email = {placeholder}"
            values = (query['Email'],)

        cursor.execute(sql_query, values)
        user = cursor.fetchone()
        if user:
            if DB_TYPE == 'sqlite':
                user = dict(user)
            logger.debug(f"User found in {table}.")
        return user
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return None


# to update the password from reset password 

def update_user(query, update_data, table='users'):
    try:
        set_clauses = []
        values = []
        placeholder = get_placeholder()
        for key, value in update_data.items():
            set_clauses.append(f"{key} = {placeholder}")
            values.append(value)
        values.append(query['Email'])
        sql_query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE Email = {placeholder}"
        cursor.execute(sql_query, tuple(values))
        connection.commit()
        logger.info(f"User with Email {query['Email']} updated successfully.")
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
        product_id = uuid.uuid4().hex[:12]
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

