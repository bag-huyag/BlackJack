-- Active: 1709286938507@@127.0.0.1@3306@blackjack
DROP PROCEDURE IF EXISTS insertUniqueCards;
CREATE PROCEDURE insertUniqueCards()
COMMENT 'Procedure to insert 52 unique playing cards into the cards table,
         This procedure does not let the table to have more than 52 cards,
         Every card is unique so ensure interigity to the gameplay.'
BEGIN
    DECLARE cardCount INT;
    SET cardCount = (SELECT COUNT(*) FROM cards);
    
    IF cardCount < 52 THEN
        INSERT IGNORE INTO cards (value, suit)
        VALUES
            ('2', '♠'),
            ('3', '♠'),
            ('4', '♠'),
            ('5', '♠'),
            ('6', '♠'),
            ('7', '♠'),
            ('8', '♠'),
            ('9', '♠'),
            ('10', '♠'),
            ('A', '♠'),
            ('J', '♠'),
            ('Q', '♠'),
            ('K', '♠'),
            ('2', '♥'),
            ('3', '♥'),
            ('4', '♥'),
            ('5', '♥'),
            ('6', '♥'),
            ('7', '♥'),
            ('8', '♥'),
            ('9', '♥'),
            ('10', '♥'),
            ('A', '♥'),
            ('J', '♥'),
            ('Q', '♥'),
            ('K', '♥'),
            ('2', '♦'),
            ('3', '♦'),
            ('4', '♦'),
            ('5', '♦'),
            ('6', '♦'),
            ('7', '♦'),
            ('8', '♦'),
            ('9', '♦'),
            ('10', '♦'),
            ('A', '♦'),
            ('J', '♦'),
            ('Q', '♦'),
            ('K', '♦'),
            ('2', '♣'),
            ('3', '♣'),
            ('4', '♣'),
            ('5', '♣'),
            ('6', '♣'),
            ('7', '♣'),
            ('8', '♣'),
            ('9', '♣'),
            ('10', '♣'),
            ('A', '♣'),
            ('J', '♣'),
            ('Q', '♣'),
            ('K', '♣');
    END IF;
END;

DROP PROCEDURE IF EXISTS getTotalScore;
CREATE PROCEDURE getTotalScore(player_id INT, OUT total_score INT)
COMMENT 'Procedure to calculate the total score of a player in a game
         player_id INT - the id of the player
         total_score INT - the total score of the player'
BEGIN
    DECLARE ace_count INT DEFAULT 0;
    DECLARE other_cards_total INT DEFAULT 0;
    DECLARE total_score INT DEFAULT 0;
    
    -- Count the number of Aces in the player's hand
    SELECT COUNT(*) INTO ace_count
    FROM player_hands
    JOIN cards ON player_hands.card_id = cards.id
    WHERE player_hands.player_id = player_id AND cards.value = 'A';
    
    -- Calculate the total value of non-Ace cards
    SELECT SUM(CASE 
                 WHEN cards.value IN ('J', 'Q', 'K') THEN 10
                 ELSE IF(cards.value = 'A', 0, CAST(cards.value AS UNSIGNED))
               END) INTO other_cards_total
    FROM player_hands
    JOIN cards ON player_hands.card_id = cards.id
    WHERE player_hands.player_id = player_id AND cards.value <> 'A';
    
    -- Initialize total score with the total of non-Ace cards
    SET total_score = other_cards_total;
    
    -- Adjust the score for each Ace in the hand
    WHILE ace_count > 0 DO
        IF (total_score + 11) > 21 THEN
            SET total_score = total_score + 1;
        ELSE
            SET total_score = total_score + 11;
        END IF;
        SET ace_count = ace_count - 1;
    END WHILE;

    SET @total_score = total_score;
END;
