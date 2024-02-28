-- Active: 1707734547291@@127.0.0.1@3306
DROP PROCEDURE IF EXISTS getGameByGameCode;
CREATE PROCEDURE getGameByGameCode(IN p_gameCode VARCHAR(20))
COMMENT 'Retrieve details of a game using its unique game code, 
        p_gameCode: The game code identifying the game.'
BEGIN
    SELECT * FROM games WHERE code = p_gameCode;
END;
DROP PROCEDURE IF EXISTS getAllGames;
CREATE PROCEDURE getAllGames()
COMMENT 'Retrieve details of all games available in the database without any input parameters.'
BEGIN
    SELECT * FROM games;
END;

DROP PROCEDURE IF EXISTS createGame;
CREATE PROCEDURE createGame(
    IN p_gameCode VARCHAR(20), 
    IN p_userId INT,
    IN p_turnTime INT,
    IN p_bet INT
)
COMMENT 'Creates a new game with specified parameters and automatically adds the creator as a player, 
        p_gameCode: Unique game code, 
        p_userId: User ID of the game creator, 
        p_turnTime: Time allocated for each turn, 
        p_bet: Initial bet amount.'
BEGIN
    DECLARE v_userExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_gameId INT;
    DECLARE v_userName VARCHAR(50);
    DECLARE v_playerId INT;
    
    -- Check if the user exists
    SELECT COUNT(*) INTO v_userExists FROM users WHERE id = p_userId;
    IF v_userExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    
    -- Create the game
    INSERT INTO games (code, turnTime, bet) VALUES (p_gameCode, p_turnTime, p_bet);

    -- Get the last insert id 
    SELECT LAST_INSERT_ID() INTO v_gameId;

    -- Get the user 
    SELECT name FROM users WHERE id = p_userId INTO v_userName;

    -- Create the player immediately
    CALL createPlayer(v_gameId, p_userId, v_userName, p_bet, v_playerId);

    -- Update the game info
    UPDATE games SET currentTurnId = v_playerId, creatorId = v_playerId WHERE id = v_gameId;

    SELECT v_gameId, v_playerId;
END;


DROP PROCEDURE IF EXISTS joinGame;
CREATE PROCEDURE joinGame(
    IN p_gameCode VARCHAR(20), 
    IN p_userId INT
)
COMMENT 'Allows a user to join an existing game if it is not full, 
        p_gameCode: The game code of the game to join, 
        p_userId: The user ID of the player joining the game.'
BEGIN
    DECLARE v_userExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_gameId INT;
    DECLARE v_playerExists INT;
    DECLARE v_playersCount INT;
    DECLARE v_userName VARCHAR(50);
    DECLARE v_playerId INT;
    DECLARE v_bet INT;

    -- Check if the user exists
    SELECT COUNT(*) INTO v_userExists FROM users WHERE id = p_userId;
    IF v_userExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    -- Check if the game exists
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Get the game id
    SELECT id, playersCount INTO v_gameId, v_playerId FROM games WHERE code = p_gameCode;

    IF v_playersCount >= 4 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game is full';
    END IF;

    -- Check if a player already EXISTS
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE gameId = v_gameId AND userId = p_userId LIMIT 1;
    IF v_playerExists > 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player already joined';
    END IF;

    -- Get the user name 
    SELECT name INTO v_userName FROM users WHERE id = p_userId;

    -- Get the game's bet 
    SELECT bet INTO v_bet FROM games WHERE code = p_gameCode;

    -- Create the player immediately
    CALL createPlayer(v_gameId, p_userId, v_userName, v_bet, v_playerId);

    -- Update the game info
    UPDATE games SET playersCount = playersCount + 1 WHERE id = v_gameId;

    SELECT 'Game joined successfully' AS message;
END;


DROP PROCEDURE IF EXISTS restartGame;
CREATE PROCEDURE restartGame(
    IN p_gameCode VARCHAR(20), 
    IN p_playerId INT
)
COMMENT 'Restarts a game by resetting player scores, outcomes, and other game-related states, 
        p_gameCode: The game code of the game to restart, 
        p_playerId: The player ID requesting the restart.'
BEGIN
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameId INT;
    DECLARE v_playerName VARCHAR(50);
    DECLARE v_bet INT;
    DECLARE v_playersCount INT;
    DECLARE v_previousTurns VARCHAR(50);
    DECLARE v_currentTurnId INT;
    DECLARE v_winnerId INT;

    -- Check if the game exists
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Get the game id
    SELECT id, playersCount, previousTurns, currentTurnId, winnerId INTO v_gameId, v_playersCount, v_previousTurns, v_currentTurnId, v_winnerId FROM games WHERE code = p_gameCode;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE gameId = v_gameId AND id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Delete the player's card 
    DELETE FROM gamePlayerCards WHERE gameCode = p_gameCode AND playerId = p_playerId;

    -- Set the player's data
    UPDATE players SET score = 0, outcome = 'PLAYING', stay = 0 WHERE id = p_playerId;

    -- Check if the playerId is the winnerId
    IF v_winnerId = p_playerId THEN
        UPDATE games SET winnerId = NULL WHERE code = p_gameCode;
    END IF;

    SELECT 'Game restarted successfully' AS message;
END;

DROP PROCEDURE IF EXISTS setGameTurns;
CREATE PROCEDURE setGameTurns(
    IN p_gameCode VARCHAR(20), 
    IN p_previousTurns VARCHAR(50),
    IN p_currentTurnId INT
)
COMMENT 'Updates the game state with the previous turns taken and sets the current turn ID, 
        p_gameCode: The game code, 
        p_previousTurns: A string representing the sequence of previous turns, 
        p_currentTurnId: The player ID whose turn is next.'
BEGIN
    DECLARE v_gameExists INT DEFAULT 0;

    -- Check if the game exists
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Update the game info
    UPDATE games SET previousTurns = p_previousTurns, currentTurnId = p_currentTurnId WHERE code = p_gameCode;

    SELECT 'Game turns set successfully' AS message;
END;

DROP PROCEDURE IF EXISTS updateGameWinner;
CREATE PROCEDURE updateGameWinner(
    IN p_gameCode VARCHAR(20), 
    IN p_winnerId INT
)
COMMENT 'Updates the game with the winner ID and changes the player outcome to "WINNER",
        p_gameCode: The game code, 
        p_winnerId: The player ID of the winner.'
BEGIN
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameId INT;
    DECLARE v_playersCount INT;
    DECLARE v_previousTurns VARCHAR(50);
    DECLARE v_currentTurnId INT;
    DECLARE v_winnerId INT;
    DECLARE v_bet INT;

    -- Check if the game exists
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Get the game id
    SELECT id, playersCount, previousTurns, currentTurnId, winnerId, bet INTO v_gameId, v_playersCount, v_previousTurns, v_currentTurnId, v_winnerId, v_bet FROM games WHERE code = p_gameCode;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE gameId = v_gameId AND id = p_winnerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Update the player info
    UPDATE players 
        SET outcome = 'WINNER', balance = balance + (v_bet * v_playersCount) 
    WHERE id = p_winnerId;

    -- Decrease the balance of other players
    UPDATE players 
        SET balance = balance - v_bet 
    WHERE gameId = v_gameId AND id != p_winnerId;

    -- Update the game info
    UPDATE games SET winnerId = p_winnerId WHERE code = p_gameCode;


    SELECT 'Game winner updated successfully' AS message;
END;


DROP PROCEDURE IF EXISTS getGameAndCheckPlayers;
CREATE PROCEDURE getGameAndCheckPlayers(
    IN p_gameCode VARCHAR(20),
    IN p_currentPlayerId INT
)
COMMENT 'Checks the existence of a game, the current player, and other players in the game, then retrieves combined details of the game and players, 
        p_gameCode: The game code, 
        p_currentPlayerId: The current player ID engaging with the game.'
BEGIN
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_currentPlayerExists INT DEFAULT 0;
    DECLARE v_playersExists INT DEFAULT 0;
    DECLARE v_gameId INT;

    -- Check for game
    SELECT COUNT(*), id INTO v_gameExists, v_gameId FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Check for current player
    SELECT COUNT(*) INTO v_currentPlayerExists FROM players WHERE id = p_currentPlayerId;
    IF v_currentPlayerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Current Player not found';
    END IF;

    -- Check for players in the game
    SELECT COUNT(*) INTO v_playersExists FROM players WHERE gameId = v_gameId;
    IF v_playersExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No players in the game';
    END IF;

    -- Join the players and the games tables
    SELECT 
        g.id AS game_id, 
        g.code AS game_code, 
        g.bet AS game_bet, 
        g.turnTime AS game_turnTime, 
        g.creatorId AS game_creatorId, 
        g.playersCount AS game_playersCount, 
        g.state AS game_state, 
        g.previousTurns AS game_previousTurns, 
        g.currentTurnId AS game_currentTurnId, 
        g.winnerId AS game_winnerId, 
        p.id AS player_id, 
        p.balance AS player_bet, 
        p.gameId AS player_gameId, 
        p.userId AS player_userId, 
        p.name AS player_name, 
        p.ready AS player_ready, 
        p.state AS player_state, 
        p.outcome AS player_outcome, 
        p.score AS player_score, 
        p.stay AS player_stay 
    FROM games g 
    JOIN players p ON g.id = p.gameId WHERE g.code = p_gameCode;
END;
