-- Active: 1709286938507@@127.0.0.1@3306@blackjack
DROP PROCEDURE IF EXISTS login;
CREATE PROCEDURE login(IN p_username VARCHAR(100), IN p_password VARCHAR(255))
COMMENT 'Login with username and password,
         p_username - The username of the user,
         p_password - The password of the user.'
BEGIN
    DECLARE v_user_id INT;
    
    -- Check the length of the username and password
    IF LENGTH(p_username) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username cannot be empty';
    END IF;

    IF LENGTH(p_password) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Password cannot be empty';
    END IF;

    -- find the user by username and password
    SELECT id INTO v_user_id FROM users WHERE username = p_username AND password = p_password LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        SELECT users.*, tokens.token FROM users
        INNER JOIN tokens ON users.id = tokens.user_id
        WHERE users.id = v_user_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Incorrect username or password';
    END IF;
END;


DROP PROCEDURE IF EXISTS signup;
CREATE PROCEDURE signup(IN p_username VARCHAR(100), IN p_password VARCHAR(255))
COMMENT 'Creates a new user with the username, password.
         p_username - The username of new user,
         p_password - The password of the new user.'
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_token VARCHAR(32);

     -- Check the length of the username and password
    IF LENGTH(p_username) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username cannot be empty';
    END IF;

    IF LENGTH(p_password) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Password cannot be empty';
    END IF;
    
    -- Check if the user already exists
    SELECT id INTO v_user_id FROM users WHERE username = p_username LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already exists';
    ELSE
        INSERT INTO users (username, password) VALUES (p_username, p_password);
        
        SELECT id INTO v_user_id FROM users WHERE username = p_username;
        
        SET v_token = generateToken(p_username);
        
        INSERT INTO tokens(token, user_id) VALUES (v_token, v_user_id);
        
        SELECT users.*, tokens.token FROM users
        INNER JOIN tokens ON users.id = tokens.user_id
        WHERE users.id = v_user_id;
    END IF;

END;


DROP PROCEDURE IF EXISTS getUserByToken;
CREATE PROCEDURE getUserByToken(IN p_token VARCHAR(255))
COMMENT 'Gets the user by the session token,
        p_token - the session token of the user'
BEGIN
    DECLARE v_user_id INT DEFAULT (SELECT user_id FROM tokens WHERE token = p_token LIMIT 1);
    DECLARE v_user_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_user_exists FROM users WHERE id = v_user_id;
    IF v_user_exists > 0 THEN
        SELECT * FROM users WHERE id = v_user_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
END;


DROP FUNCTION IF EXISTS generateToken;
CREATE FUNCTION generateToken(p_username VARCHAR(100)) RETURNS VARCHAR(32)
BEGIN
    DECLARE token VARCHAR(32);
    SET token = MD5(CONCAT(p_username, 'BlackJackSecret', NOW(), RAND()));
    RETURN token;
END;
