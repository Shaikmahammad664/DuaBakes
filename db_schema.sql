-- SQL schema for DuaBakes MySQL backend
CREATE DATABASE IF NOT EXISTS duabakes;
USE duabakes;

CREATE TABLE IF NOT EXISTS users (
    User_Id VARCHAR(32) PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(20)
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
