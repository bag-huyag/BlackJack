-- Active: 1706868882476@@127.0.0.1@3306@blackjack
DROP PROCEDURE IF EXISTS getUserGames;
CREATE PROCEDURE getUserGames(IN p_userId INT)
BEGIN
    DECLARE userExists INT DEFAULT 0;
    
    -- Check if the user exists
    SELECT COUNT(*) INTO userExists FROM users WHERE id = p_userId;
    IF userExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid token!';
    END IF;
    
    -- Check if the user has joined any games
    SELECT COUNT(*) INTO userExists FROM players WHERE userId = p_userId;
    IF userExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User has not joined any games!';
    END IF;
    
    -- Fetch and return all games the user has joined
    SELECT g.* 
    FROM games g
    INNER JOIN players p ON g.id = p.gameId
    WHERE p.userId = p_userId;
END;

DROP PROCEDURE IF EXISTS getGameDetailsWithPlayers;
CREATE PROCEDURE getGameDetailsWithPlayers(IN p_gameCode VARCHAR(20))
BEGIN
    -- Variables to hold game data
    DECLARE v_gameId INT;
    DECLARE v_creatorId INT;

    -- Check if the game exists and get its ID and creatorId
    SELECT id, creatorId INTO v_gameId, v_creatorId FROM games WHERE code = p_gameCode LIMIT 1;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found!';
    END IF;

    -- Fetch and output game details (excluding players for now)
    SELECT * FROM games WHERE id = v_gameId;

    -- Fetch players, adjusting their outcome based on their score, for the game
    SELECT 
        p.*,
        (CASE 
            WHEN p.score > 21 THEN 'BUSTED'
            WHEN p.score = 21 THEN 'WINNER'
            ELSE p.outcome
         END) AS adjustedOutcome
    FROM players p WHERE p.gameId = v_gameId;

END;


DROP PROCEDURE IF EXISTS getPlayerHandsAndCards;
CREATE PROCEDURE getPlayerHandsAndCards(IN p_playerId INT, IN p_gameCode VARCHAR(20))
BEGIN
    -- Fetch player's hands and associated card details for a given game
    SELECT gpc.*, c.*
    FROM gamePlayerCards gpc
    JOIN cards c ON gpc.cardId = c.id
    WHERE gpc.playerId = p_playerId AND gpc.gameCode = p_gameCode;
END;


DROP  PROCEDURE IF EXISTS createGameAndFirstPlayer;
CREATE PROCEDURE createGameAndFirstPlayer(IN p_userId INT, IN p_bet INT, IN p_turnTime INT, IN p_gameCode VARCHAR(20))
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_playerId INT;
    
    -- Insert a new game
    INSERT INTO games (code, bet, playersCount, state, turnTime, creatorId)
    VALUES (p_gameCode, p_bet, 1, 'WAITING', p_turnTime, p_userId);
    
    -- Get the ID of the newly inserted game
    SET v_gameId = LAST_INSERT_ID();
    
    -- Insert a new player as the game creator
    INSERT INTO players (bet, gameId, userId, ready, state, outcome, score)
    VALUES (p_bet, v_gameId, p_userId, TRUE, 'IDLE', 'JOINED', 0);
    
    -- Get the ID of the newly inserted player
    SET v_playerId = LAST_INSERT_ID();
    
    -- Update the game to set the currentTurnId and creatorId to the new player's ID
    UPDATE games SET currentTurnId = v_playerId, creatorId = v_playerId WHERE id = v_gameId;
    
    -- Optionally, return the game code and player ID
    SELECT p_gameCode AS gameCode, v_playerId AS playerId;
END;


DROP PROCEDURE IF EXISTS joinGame;
CREATE PROCEDURE joinGame(IN p_gameCode VARCHAR(20), IN p_userId INT)
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_bet INT;
    DECLARE v_playersCount INT;
    DECLARE v_userExists INT;
    DECLARE v_playerExists INT;

    -- Check if the game exists
    SELECT id, bet, playersCount INTO v_gameId, v_bet, v_playersCount 
    FROM games WHERE code = p_gameCode LIMIT 1;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found!';
    END IF;
    
    -- Check if the game is full
    IF v_playersCount >= 4 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game is full!';
    END IF;

    -- Check if the user exists
    SELECT COUNT(*) INTO v_userExists FROM users WHERE id = p_userId;
    IF v_userExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found!';
    END IF;

    -- Check if the user has already joined the game
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE userId = p_userId AND gameId = v_gameId;
    IF v_playerExists > 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already joined the game!';
    END IF;

    -- Add the user as a new player to the game
    INSERT INTO players (bet, gameId, userId, name, ready, state, outcome, score)
    SELECT v_bet, v_gameId, id, name, TRUE, 'IDLE', 'JOINED', 0 FROM users WHERE id = p_userId;
    
    -- Update the playersCount for the game
    UPDATE games SET playersCount = v_playersCount + 1 WHERE id = v_gameId;
END;


DROP PROCEDURE IF EXISTS addCardToPlayerHand;
CREATE PROCEDURE addCardToPlayerHand(IN p_playerId INT, IN p_cardId INT, IN p_cardValue INT, IN p_gameCode VARCHAR(20))
BEGIN
    DECLARE v_gameId INT;
    DECLARE v_playerScore INT;
    DECLARE v_newScore INT;
    DECLARE v_outcome VARCHAR(20);
    DECLARE v_cardExists INT DEFAULT 0;

    -- Check if the game exists and get its ID
    SELECT id INTO v_gameId FROM games WHERE code = p_gameCode;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found!';
    END IF;

    -- Check if the player exists
    IF NOT EXISTS (SELECT * FROM players WHERE id = p_playerId) THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found!';
    END IF;

    -- Check if the card exists
    SELECT COUNT(*) INTO v_cardExists FROM cards WHERE id = p_cardId;
    IF v_cardExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Card not found!';
    END IF;

    -- Calculate the new score and determine the outcome
    SELECT score INTO v_playerScore FROM players WHERE id = p_playerId;
    SET v_newScore = v_playerScore + p_cardValue; -- Use the provided card value

    IF v_newScore = 21 THEN
        SET v_outcome = 'WINNER';
    ELSEIF v_newScore > 21 THEN
        SET v_outcome = 'BUSTED';
    ELSE
        SET v_outcome = 'PLAYING';
    END IF;

    -- Update player's score and outcome
    UPDATE players SET score = v_newScore, outcome = v_outcome WHERE id = p_playerId;

    -- Insert the card into player's hand
    INSERT INTO gamePlayerCards (playerId, cardId, gameCode) VALUES (p_playerId, p_cardId, p_gameCode);

END;


DROP PROCEDURE IF EXISTS changePlayerTurn;
CREATE PROCEDURE changePlayerTurn(IN p_currentPlayerId INT, IN p_nextPlayers VARCHAR(255), IN p_gameCode VARCHAR(20))
BEGIN
    DECLARE v_nextTurnId INT DEFAULT 0;
    DECLARE v_playerId INT;
    DECLARE v_outcome VARCHAR(20);
    DECLARE v_gameId INT;
    DECLARE v_finished INT DEFAULT 0;

    -- Find the game ID
    SELECT id INTO v_gameId FROM games WHERE code = p_gameCode;
    IF v_gameId IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found!';
    END IF;

    -- Label the loop for later use with LEAVE statement
    player_loop: WHILE LENGTH(p_nextPlayers) > 0 AND v_finished = 0 DO
        SET v_playerId = CAST(SUBSTRING_INDEX(p_nextPlayers, ',', 1) AS UNSIGNED); -- Get the next player ID
        SET p_nextPlayers = IF(LOCATE(',', p_nextPlayers), SUBSTRING(p_nextPlayers FROM LOCATE(',', p_nextPlayers) + 1), ''); -- Remove processed ID
        
        -- Check if the player exists and is not BUSTED
        SELECT outcome INTO v_outcome FROM players WHERE id = v_playerId AND gameId = v_gameId LIMIT 1;
        IF v_outcome IS NOT NULL AND v_outcome <> 'BUSTED' THEN
            SET v_nextTurnId = v_playerId;
            SET v_finished = 1; -- Use a flag to indicate finding the next player
        END IF;
    END WHILE;

    -- Update the game with the new currentTurnId
    IF v_nextTurnId <> 0 THEN
        UPDATE games SET currentTurnId = v_nextTurnId WHERE id = v_gameId;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No eligible next player found!';
    END IF;
END;