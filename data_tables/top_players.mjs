import postgres from 'postgres';


export const sql = postgres('jdbc:postgresql://localhost:5432/postgres', {
    host: 'localhost',             // Postgres ip address[s] or domain name[s]
    port: 5432,                    // Postgres server port[s]
    database: 'testik',              // Name of database to connect to
    username: 'postgres',              // Username of database user
    password: '308696',                // Password of database user
});

export async function insertToTopPlayers(name, region, win_rate, lane) {
    await sql`
    insert into top_players
      (name, region, win_rate, lane)
    values
      (${name}, ${region}, ${win_rate}, ${lane})
    returning *;
  `;
}

export async function dropAllTables() {
    await sql`
         DROP TABLE IF EXISTS top_players, favourite_heroes, one_to_many, many_to_many, match CASCADE;
        `;
}

export async function createTopPlayers() {
    await sql`
         CREATE TABLE top_players
            (
                id            SERIAL PRIMARY KEY,
                name     CHAR(30)       NOT NULL,
                region   CHAR(7)       NOT NULL,
                win_rate CHAR(6)        NOT NULL,
                lane     CHAR(9)       NOT NULL
            );
    `;
}