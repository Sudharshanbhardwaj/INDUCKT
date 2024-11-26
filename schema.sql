CREATE DATABASE INDUCKT;
USE INDUCKT;

CREATE TABLE Blogs (
    blog_id INT AUTO_INCREMENT PRIMARY KEY,
    headline VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    content TEXT NOT NULL,
    link VARCHAR(255),
    image_url VARCHAR(255)
);