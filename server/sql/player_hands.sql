-- Active: 1709286938507@@127.0.0.1@3306@blackjack
DROP PROCEDURE IF EXISTS addRandomGamePlayerCard;
CREATE PROCEDURE addRandomGamePlayerCard(
    IN p_game_code VARCHAR(20),
    IN p_token VARCHAR(255)
)
COMMENT 'Add a random card to a player in a game performing several checks, 
        p_game_code: The game code identifying the game, 
        p_token: The token of the player.'
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_user_exists INT DEFAULT 0;
    DECLARE v_player_id INT;
    DECLARE v_game_id INT;
    DECLARE v_player_exists INT DEFAULT 0;
    DECLARE v_player_stayed BOOLEAN;
    DECLARE v_player_in_game INT DEFAULT 0;
    DECLARE v_card_id INT;
    DECLARE v_current_turn_player_id INT;
    DECLARE total_score INT;

    -- Check if token exists
    SELECT user_id INTO v_user_id FROM tokens WHERE token = p_token LIMIT 1;
    IF v_user_id IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    -- Check if the user_id exists in the users table
    SELECT COUNT(*) INTO v_user_exists FROM users WHERE id = v_user_id;
    IF v_user_exists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    -- Check if the user is a player in any game
    SELECT COUNT(*) INTO v_player_exists FROM players WHERE user_id = v_user_id;
    IF v_player_exists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is not a player in any game';
    END IF;

    -- Check if game exists 
    SELECT id INTO v_game_id FROM games WHERE code = p_game_code LIMIT 1;
    IF v_game_id IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Get the player ID
    SELECT id, stay INTO v_player_id, v_player_stayed FROM players WHERE user_id = v_user_id AND game_id = v_game_id LIMIT 1;
    IF v_player_id IS NULL THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Check if the player has stayed
    IF v_player_stayed = TRUE OR v_player_stayed = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player has stayed and cannot add more cards';
    END IF;

    -- Check if the player is in the game
    SELECT COUNT(*) INTO v_player_in_game FROM players WHERE id = v_player_id AND game_id = v_game_id;
    IF v_player_in_game = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not in game';
    END IF;

    -- Get the current player's ID for the game from the current_players table
    SELECT player_id INTO v_current_turn_player_id
    FROM current_players
    JOIN players ON current_players.player_id = players.id
    WHERE players.game_id = v_game_id
    LIMIT 1;

    -- Check if it's the player's turn
    IF v_current_turn_player_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game is not started';
    END IF;

    IF NOT v_current_turn_player_id = v_player_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'It is not the player''s turn';
    END IF;

    -- TODO: debug this

    -- Calculate the player's total score
    CALL getTotalScore(v_player_id, total_score);

    -- Check if the player is busted
    IF @total_score > 21 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player is busted and cannot add more cards';
    END IF;

    IF @total_score = 21 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player has reached 21 and cannot add more cards';
    END IF;

    -- Get a random card which is not in players hands
    SELECT id INTO v_card_id FROM cards WHERE id NOT IN (SELECT card_id FROM player_hands) ORDER BY RAND() LIMIT 1;

    -- Check if a card was available
    IF v_card_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No more cards available';
    ELSE
        -- Add the card to the player's hand
        INSERT INTO player_hands (player_id, card_id) VALUES (v_player_id, v_card_id);
    END IF;
    
    -- Return the card ID
    SELECT v_card_id;
END;
