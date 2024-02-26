-- Active: 1707734547291@@127.0.0.1@3306@blackjack
DROP PROCEDURE IF EXISTS getCardsByPlayerId;
CREATE PROCEDURE getCardsByPlayerId(IN p_playerId INT)
COMMENT 'Get all the cards of a player by playerId,
         p_playerId: The id of the player.'
BEGIN
    SELECT * FROM gamePlayerCards WHERE playerId = p_playerId;
END;

DROP PROCEDURE IF EXISTS getCardsByPlayerIdAndGameCode;
CREATE PROCEDURE getCardsByPlayerIdAndGameCode(IN p_playerId INT, IN p_gameCode VARCHAR(20))
COMMENT 'Get cards of a player who is inside a specific game using its playerId & gameCode,
         p_playerId - The player id,
         p_gameCode - The game code.'
BEGIN
    SELECT gamePlayerCards.*, cards.name AS card_name, cards.value AS card_value, cards.suit AS card_suit
    FROM gamePlayerCards
    INNER JOIN cards ON gamePlayerCards.cardId = cards.id
    WHERE playerId = p_playerId AND gameCode = p_gameCode;
END;

DROP PROCEDURE IF EXISTS createGamePlayerCard;
CREATE PROCEDURE createGamePlayerCard(
    IN p_cardId INT, 
    IN p_playerId INT,
    IN p_gameCode VARCHAR(20)
)
COMMENT 'Creates a new card from cardId for a player in a game identified by playerId and gameCode,
         p_cardId - The id of the generated card,
         p_playerId - The player id,
         p_gameCode - The game code.' 
BEGIN
    -- Check for the input
    DECLARE v_cardExists INT DEFAULT 0;
    DECLARE v_playerExists INT DEFAULT 0;
    DECLARE v_gameExists INT DEFAULT 0;
    DECLARE v_cardValue VARCHAR(5);
    DECLARE v_numericValue INT;
    DECLARE v_score INT;

    -- Check if the card exists
    SELECT COUNT(*) INTO v_cardExists FROM cards WHERE id = p_cardId;
    IF v_cardExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Card not found';
    END IF;

    -- Check if the player exists
    SELECT COUNT(*) INTO v_playerExists FROM players WHERE id = p_playerId;
    IF v_playerExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player not found';
    END IF;

    -- Check if the game exists
    SELECT COUNT(*) INTO v_gameExists FROM games WHERE code = p_gameCode;
    IF v_gameExists = 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game not found';
    END IF;

    -- Get the card value
    SELECT value INTO v_cardValue FROM cards WHERE id = p_cardId;

    --  Get the numeric value of the card
    IF v_cardValue = 'A' THEN
        SET v_numericValue = 11;
    ELSEIF v_cardValue IN ('J', 'Q', 'K') THEN
        SET v_numericValue = 10;
    ELSE
        SET v_numericValue = CAST(v_cardValue AS SIGNED);
    END IF;

    -- Update the player's score
    UPDATE players SET score = score + v_numericValue WHERE id = p_playerId;

    INSERT INTO gamePlayerCards (cardId, playerId, gameCode) VALUES (p_cardId, p_playerId, p_gameCode);

    SELECT 'Game player card created successfully' AS message;
END;