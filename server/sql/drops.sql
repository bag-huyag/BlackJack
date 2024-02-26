-- Active: 1706868882476@@127.0.0.1@3306@blackjack
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'blackjack' AND routine_type = 'PROCEDURE';

DROP TABLE IF EXISTS gamePlayerCards;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS cards;