-- Active: 1707734547291@@127.0.0.1@3306
DROP PROCEDURE IF EXISTS getAPlayer;
CREATE PROCEDURE getAPlayer(IN i_playerId INT)
COMMENT 'Retrieve player details by their ID, i_playerId: The ID of the player.'
BEGIN
    SELECT * FROM players WHERE id = i_playerId;
END;

DROP PROCEDURE IF EXISTS getPlayerByUserId;
CREATE PROCEDURE getPlayerByUserId(IN i_userId INT)
COMMENT 'Retrieve player details by their user ID, 
         i_userId: The user ID associated with the player.'
BEGIN
    SELECT * FROM players WHERE userId = i_userId;
END;

DROP PROCEDURE IF EXISTS getPlayerByGameId;
CREATE PROCEDURE getPlayerByGameId(IN i_gameId INT)
COMMENT 'Retrieve players by their game ID, 
        i_gameId: The ID of the game.'
BEGIN
    SELECT * FROM players WHERE gameId = i_gameId;
END;

DROP PROCEDURE IF EXISTS getPlayerByUserIdAndGameId;
CREATE PROCEDURE getPlayerByUserIdAndGameId(IN i_userId INT, IN i_gameId INT)
COMMENT 'Retrieve a player by both their user ID and game ID, 
        i_userId: The user ID, 
        i_gameId: The game ID.'
BEGIN
    SELECT * FROM players WHERE userId = i_userId AND gameId = i_gameId;
END;




DROP PROCEDURE IF EXISTS createPlayer;
CREATE PROCEDURE createPlayer(
    IN p_gameId INT, 
    IN p_userId INT,
    IN p_name VARCHAR(50),
    IN p_balance INT,
    OUT playerId INT
)
COMMENT 'Create a player with game ID, user ID, name, and bet. 
        Returns new player ID, 
        p_gameId: Game ID, 
        p_userId: User ID, 
        p_name: Name, 
        p_balance: Balance.'
BEGIN
    -- Check for the user 
    DECLARE v_userExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_playerId INT;

    -- Check if the user exists
    SELECT COUNT(*) INTO v_userExists FROM users WHERE id = p_userId;
    IF v_userExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    -- Check if the game exists
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE id = p_gameId;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Create the player
    INSERT INTO players (gameId, userId, name, balance) VALUES (p_gameId, p_userId, p_name, p_balance);

    SET playerId = LAST_INSERT_ID();

    SELECT 'Player created successfully' AS message;
END;


DROP PROCEDURE IF EXISTS deletePlayer;
CREATE PROCEDURE deletePlayer(IN p_playerId INT, IN p_gameCode VARCHAR(20))
COMMENT 'Delete a player and associated cards from a game, 
        p_playerId: Player ID, 
        p_gameCode: Game code.'
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_userId INT;
    DECLARE v_playerBalance INT;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_playersCount INT;

    -- Check if the player exists
    SELECT COUNT(*), userId, balance INTO v_playerExists, v_userId, v_playerBalance FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Check if the game exists using gameCode and get its ID and playersCount
    SELECT id, playersCount INTO v_gameId, v_playersCount FROM games WHERE code = p_gameCode;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Delete player's cards
    DELETE FROM gamePlayerCards WHERE playerId = p_playerId AND gameCode = p_gameCode;

    -- Delete the player
    DELETE FROM players WHERE id = p_playerId AND gameId = v_gameId;

    -- Add the player's balance to the user's balance
    UPDATE users SET 
        balance = balance + v_playerBalance
    WHERE id = v_userId;
    

    -- If the player is the last player in the game, delete the game
    IF v_playersCount = 1 THEN
        DELETE FROM games WHERE id = v_gameId;
    ELSE
        -- Otherwise, decrement the playersCount
        UPDATE games SET playersCount = playersCount - 1 WHERE id = v_gameId;
    END IF;

    -- Indicating successful deletion
    SELECT 'Player and associated cards deleted successfully' AS message;
END;


DROP PROCEDURE IF EXISTS updatePlayerReadyState;
CREATE PROCEDURE updatePlayerReadyState(IN p_playerId INT, IN p_gameCode VARCHAR(20), IN p_ready VARCHAR(10))
COMMENT 'Update a player ready state in a game, 
        p_playerId: Player ID, 
        p_gameCode: Game code, 
        p_ready: New ready state.'
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_isReady INT;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Check if the game exists using gameCode and get its ID
    SELECT id INTO v_gameId FROM games WHERE code = p_gameCode LIMIT 1;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Determine the ready state based on input
    IF p_ready IN ('1', 'ready', 'true') THEN
        SET v_isReady = 1;

    ELSEIF p_ready IN ('0', 'not ready', 'false') THEN
        SET v_isReady = 0;

    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ready must be a boolean or a string of ''ready'' or ''not ready''';
    END IF;

    -- Update the player's ready state
    UPDATE players SET ready = v_isReady WHERE id = p_playerId;

    SELECT 'Player ready state updated successfully' AS message;
END;


DROP PROCEDURE IF EXISTS updatePlayerStayState;
CREATE PROCEDURE updatePlayerStayState(IN p_playerId INT, IN p_gameCode VARCHAR(20), IN p_stay VARCHAR(10))
COMMENT 'Update a player stay state in a game, 
        p_playerId: Player ID, 
        p_gameCode: Game code, 
        p_stay: New stay state.'
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_isStay INT;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Check if the game exists using gameCode and get its ID
    SELECT id INTO v_gameId FROM games WHERE code = p_gameCode LIMIT 1;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Determine the ready state based on input
    IF p_stay IN ('1', 'stay', 'true') THEN
        SET v_isStay = 1;

    ELSEIF p_stay IN ('0', 'not stay', 'false') THEN
        SET v_isStay = 0;

    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'stay must be a boolean or a string of ''stay'' or ''not stay''';
    END IF;

    -- Update the player's ready state
    UPDATE players SET stay = v_isStay WHERE id = p_playerId;

    SELECT 'Player stay state updated successfully' AS message;
END;


DROP PROCEDURE IF EXISTS updatePlayerOutcome;
CREATE PROCEDURE updatePlayerOutcome(IN p_playerId INT, IN p_outcome VARCHAR(20))
COMMENT 'Update a player outcome in a game 
        p_playerId: Player ID, 
        p_outcome: The outcome of the player'
BEGIN
    DECLARE v_playerExists INT DEFAULT 0;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Update the player's outcome
    UPDATE players SET outcome = p_outcome WHERE id = p_playerId;

    SELECT 'Player outcome updated successfully' AS message;
END;


DROP PROCEDURE IF EXISTS updatePlayerScore;
CREATE PROCEDURE updatePlayerScore(IN p_playerId INT, IN p_score INT)
COMMENT 'Update a player score in a game 
        p_playerId: Player ID, 
        p_score: The player score'
BEGIN
    DECLARE v_playerExists INT DEFAULT 0;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Update the player's score
    UPDATE players SET score = p_score WHERE id = p_playerId;

    SELECT 'Player score updated successfully' AS message;
END;

