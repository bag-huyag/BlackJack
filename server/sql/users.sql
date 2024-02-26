-- Active: 1707734547291@@127.0.0.1@3306@blackjack
DROP PROCEDURE IF EXISTS login;
CREATE PROCEDURE login(IN _username VARCHAR(100), IN _password VARCHAR(255))
COMMENT 'Login with username and password,
         _username - The username of the user,
         _password - The password of the user.'
BEGIN
    DECLARE userId INT DEFAULT (SELECT id FROM users WHERE username = _username AND password = _password);
    IF userId IS NOT NULL THEN
        SELECT * FROM users WHERE id = userId;
    ELSE
        SELECT 'Incorrect username or password' AS error;
    END IF;
END;


DROP PROCEDURE IF EXISTS signup;
CREATE PROCEDURE signup(IN _username VARCHAR(100), IN _password VARCHAR(255), IN _name VARCHAR(50))
COMMENT 'Creates a new user with the username, password and name,
         _username - The username of new user,
         _password - The password of the new user,
         _name - The name of the new user'
BEGIN
    DECLARE userId INT DEFAULT (SELECT id FROM users WHERE username = _username);
    IF userId IS NOT NULL THEN
        SELECT 'User Already Exists' AS error;
    ELSE
        INSERT INTO users (username, password, name) 
        VALUES (_username, _password, _name);
        SELECT * FROM users WHERE username = _username;
    END IF;
END;

DROP PROCEDURE IF EXISTS updateToken;
CREATE PROCEDURE updateToken(IN _id VARCHAR(100), IN _sessionToken VARCHAR(255))
COMMENT 'updates the sessionToken of a user,
        _id - the id of the user,
        _sessionToken - the new sessionToken'
BEGIN
    UPDATE users SET sessionToken = _sessionToken WHERE id = _id;
    SELECT * FROM users WHERE id = _id;
END;


DROP PROCEDURE IF EXISTS getUserByToken;
CREATE PROCEDURE getUserByToken(IN _sessionToken VARCHAR(255))
BEGIN
    SELECT * FROM users WHERE sessionToken = _sessionToken;
END;
