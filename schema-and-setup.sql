-- Remove any existing database and user.
DROP DATABASE IF EXISTS social;
DROP USER IF EXISTS social_user@localhost;

-- Create social database and user. Ensure Unicode is fully supported.
CREATE DATABASE social CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER social_user@localhost IDENTIFIED WITH mysql_native_password BY 'social';
GRANT ALL PRIVILEGES ON social.* TO social_user@localhost;

use social;
DROP TABLE IF EXISTS human;

CREATE TABLE human (
  id SERIAL PRIMARY KEY,
  username text,
  screenname text
);

DROP TABLE IF EXISTS follow;

CREATE TABLE follow (
  id SERIAL PRIMARY KEY,
  followee int,
  follower int
);