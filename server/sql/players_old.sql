DROP PROCEDURE IF EXISTS getPlayerData;
CREATE PROCEDURE getPlayerData(IN user_id INT, IN game_code VARCHAR(20))
BEGIN
    DECLARE game_id INT;
    DECLARE player_exists INT;
    DECLARE game_exists INT;

    -- Check if the user exists
    SELECT COUNT(*) INTO player_exists FROM users WHERE id = user_id;
    IF player_exists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    -- Find the game ID based on the game code
    SELECT id INTO game_id FROM games WHERE code = game_code LIMIT 1;
    IF game_id IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    ELSE
        -- Check if the player exists in the specified game
        SELECT COUNT(*) INTO game_exists FROM players WHERE userId = user_id AND gameId = game_id;
        IF game_exists = 0 THEN 
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found in the specified game';
        END IF;
    END IF;

    -- If everything is fine, select the player's data
    SELECT p.*, u.name AS userName, u.email, u.balance, g.code AS gameCode, g.bet AS gameBet, g.state AS gameState
    FROM players p
    JOIN users u ON p.userId = u.id
    JOIN games g ON p.gameId = g.id
    WHERE p.userId = user_id AND g.id = game_id;
END;


DROP PROCEDURE IF EXISTS getPlayerGameCards;
CREATE PROCEDURE getPlayerGameCards(IN p_playerId INT, IN p_gameCode VARCHAR(20))
BEGIN
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_playerInGame INT DEFAULT 0;

    -- Check if the game exists using gameCode
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;
    
    -- Check if the player is part of the game
    SELECT COUNT(*) INTO v_playerInGame
    FROM players
    WHERE id = p_playerId
    AND gameId IN (SELECT id FROM games WHERE code = p_gameCode);
    
    IF v_playerInGame = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found in the specified game';
    END IF;

    -- Attempt to fetch cards for the player in the specified game
    SELECT c.* 
    FROM gamePlayerCards gpc
    JOIN cards c ON gpc.cardId = c.id
    WHERE gpc.playerId = p_playerId AND gpc.gameCode = p_gameCode;

    -- Note: If no cards are found, this will return an empty set. Handling this case to
    -- explicitly return a structure without rows is beyond SQL's capabilities and should
    -- be managed by the application logic.
END;


DROP PROCEDURE IF EXISTS deletePlayerAndCards;
CREATE PROCEDURE deletePlayerAndCards(IN p_playerId INT, IN p_gameCode VARCHAR(20))
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_playersCount INT;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Check if the game exists using gameCode and get its ID and playersCount
    SELECT id, playersCount INTO v_gameId, v_playersCount FROM games WHERE code = p_gameCode LIMIT 1;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Delete player's cards
    DELETE FROM gamePlayerCards WHERE playerId = p_playerId AND gameCode = p_gameCode;

    -- Delete the player
    DELETE FROM players WHERE id = p_playerId AND gameId = v_gameId;

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



CREATE PROCEDURE IF NOT EXISTS updatePlayerReadyState(IN p_playerId INT, IN p_gameCode VARCHAR(20), IN p_ready VARCHAR(10))
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
    IF p_ready IN ('1', 'ready') THEN
        SET v_isReady = 1;
    ELSEIF p_ready IN ('0', 'not ready') THEN
        SET v_isReady = 0;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ready must be a boolean or a string of ''ready'' or ''not ready''';
    END IF;

    -- Update the player's ready state
    UPDATE players SET ready = v_isReady WHERE id = p_playerId;

END;
