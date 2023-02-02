-- Лёгкие запросы:
-- 1 запрос
CREATE INDEX pla_id_wr
ON top_players(id, win_rate);

SELECT id, name, win_rate FROM top_players
WHERE lane = 'Safe Lane'
ORDER BY win_rate DESC;

-- 2 запрос
SELECT hero, intelligence
FROM favourite_heroes
WHERE intelligence > 22
GROUP BY hero, intelligence;

-- 3 запрос
SELECT hero,COUNT(hero)
FROM match
GROUP BY hero
ORDER BY COUNT(hero) DESC;

-- 4 запрос
SELECT player_id, SUM(matches) as all_matches
FROM many_to_many
WHERE player_id = 1
GROUP BY player_id;

--Средние запросы:
-- 1 запрос
SELECT top_players.name, MAX(matches) as max_matches
FROM many_to_many
LEFT JOIN top_players
ON many_to_many.player_id = top_players.id
GROUP BY top_players.name, player_id
ORDER BY MAX(matches) DESC;

-- 2 запрос
SELECT favourite_heroes.hero, win_rate
FROM many_to_many
LEFT JOIN favourite_heroes
ON many_to_many.hero_id = favourite_heroes.id
GROUP BY favourite_heroes.hero, win_rate
ORDER BY win_rate DESC
LIMIT 10;

-- 3 запрос
SELECT match.hero, match.kda
FROM one_to_many
LEFT JOIN top_players
ON top_players.id = one_to_many.player_id
RIGHT JOIN match
ON match.id = one_to_many.match_id
WHERE (match.kda LIKE '%/0/%')
ORDER BY match.length;

--Сложные запросы:
-- 1 запрос
SELECT DISTINCT ON (one_game_info.id) one_game_info.name, otm.match_id, m.hero, one_game_info.win_rate, one_game_info.kda
FROM
    (
    SELECT sf_table.id, sf_table.name, sf_table.matches, sf_table.win_rate, sf_table.kda
        FROM
            (
            SELECT tp.id, tp.name, mtm.matches, mtm.win_rate, mtm.kda
            FROM many_to_many as mtm
            JOIN top_players tp ON tp.id = mtm.player_id
            WHERE (hero_id = 11 AND mtm.win_rate > '52%' AND kda > 3.5)
            GROUP BY tp.id, mtm.matches, mtm.win_rate, mtm.kda)
                AS sf_table)
        AS one_game_info
    LEFT JOIN one_to_many otm
    ON otm.player_id = one_game_info.id
    LEFT JOIN match m
    ON m.id = otm.match_id;

--2 запрос
SELECT DISTINCT ON (fh.id) fh.id, fh.hero, wins, fh.strength, fh.agility, fh.intelligence
FROM favourite_heroes, (SELECT top_heroes_win.hero, top_heroes_win.wins FROM
        (
        SELECT hero, COUNT(result) AS wins
        FROM match
        WHERE result LIKE '%Won%'
        GROUP BY hero
        )
            AS top_heroes_win)
    AS from_match
    JOIN favourite_heroes AS fh
    ON fh.hero = from_match.hero
    WHERE (fh.strength > 20 AND fh.agility > 20 AND fh.intelligence > 20);

-- 3 запрос
SELECT DISTINCT ON (from_mtm_to_tp.hero_id)  tp.name, mtm.player_id, from_mtm_to_tp.hero_id,  from_mtm_to_tp.kda, from_mtm_to_tp.sum
FROM many_to_many, (SELECT *
    FROM
        (
        SELECT hero_id, AVG(kda) as kda, SUM(matches) as sum
        FROM many_to_many
        GROUP BY hero_id
        )
            AS most_matches)
    AS from_mtm_to_tp
    JOIN many_to_many AS mtm
    ON mtm.hero_id = from_mtm_to_tp.hero_id
    JOIN top_players tp on tp.id = mtm.player_id
    LIMIT 10;

