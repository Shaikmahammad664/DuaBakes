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
import mysql.connector
from loguru import logger
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

# add local connection variable
connection= mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)

cursor= connection.cursor(dictionary=True)
# to store user data in my sql
def store_user(user_data):
    try:
        user_id= str(ObjectId())        
        logger.info(f"Registering user with id: {user_id}")
        query = "INSERT INTO users (User_Id,FirstName,LastName, Email,Password,phoneNumber) VALUES (%s, %s, %s, %s, %s, %s)"
        values = (user_id,user_data['FirstName'], user_data['LastName'], user_data['Email'], user_data['Password'], user_data['PhoneNumber'])
        cursor.execute(query, values)
        connection.commit()
        return True
    except Exception as e:
        logger.error(f"Error storing user: {e}")
        return False
    
# to fetch user data from my sql

def fetch_user(query, table="users"):
    try:
        logger.info(f"{query} : {table}")
        sql_query = f"SELECT * FROM {table} WHERE Email = %s"
        cursor.execute(sql_query, (query['Email'],))
        user = cursor.fetchone()
        logger.debug(f"User {user['User_Id']} logged in sucessfully.")
        return user
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return None
# to update the password from reset password 

def update_user(query, update_password, table="users"):
    try:
        sql_query = f"UPDATE {table} SET Password = %s WHERE Email = %s"
        cursor.execute(sql_query, (update_password['Password'], query['Email']))
        connection.commit()
        logger.info(f"User with Email {query['Email']} Updated successfully.")
        return True
    except Exception as e:
        logger.info(f"Error Updating User Password : {e}")
        return False

# admin login page 

def fetch_admin(item:dict):

    try:
        user= fetch_user(item, table="Admin")
        return user
    except Exception as e:
        logger.error("Error Fetching admin {e}")
        return None

# to store products in sql 

def store_products(products_data):
    try:
        product_id = str(ObjectId())[:7]
        logger.info(f"Inserting product {product_id} ")
        query = "INSERT into products (ProductId, ProductName, Description, Category, ImageUrl, Price, StockQuantity, Weight) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        values = (product_id,products_data['ProductName'],products_data['Description'],products_data['Category'],products_data['ImageUrl'],products_data['Price'],products_data['StockQuantity'],products_data['Weight'])
        cursor.execute(query, values) 
        connection.commit()
        return True
    except Exception as e:
        logger.error(f"Error storing products: {e}")
        return False

