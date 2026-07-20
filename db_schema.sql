-- SQL schema for DuaBakes MySQL backend
CREATE DATABASE IF NOT EXISTS duabakes;
USE duabakes;

CREATE TABLE IF NOT EXISTS users (
    PhoneNumber VARCHAR(20) PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
    );
        address TEXT,
        apartment TEXT,
        city TEXT,
        state TEXT,
        pinCode TEXT,
        billingSameAsShipping TINYINT(1),
        billingAddress TEXT,
        billingApartment TEXT,
        billingCity TEXT,
        billingState TEXT,
        billingPinCode TEXT,
        billingPhone TEXT
    );

CREATE TABLE IF NOT EXISTS Admin (
    Admin_Id VARCHAR(32) PRIMARY KEY,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    ProductId VARCHAR(32) PRIMARY KEY,
    ProductName VARCHAR(255) NOT NULL,
    Description TEXT,
    Category VARCHAR(255),
    ImageUrl TEXT,
    Price DECIMAL(10,2) DEFAULT 0.00,
    StockQuantity INT DEFAULT 0,
    Weight FLOAT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    PhoneNumber VARCHAR(20) NOT NULL,
    Order_Id VARCHAR(32) NOT NULL,
    PaymentMethod VARCHAR(100),
    ShippingAddress TEXT,
    BillingAddress TEXT,
    Items TEXT NOT NULL,
    TotalAmount DECIMAL(10,2) DEFAULT 0.00,
    CreatedAt TEXT NOT NULL,
    PRIMARY KEY (PhoneNumber, Order_Id)
);
