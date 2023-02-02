import postgres from 'postgres';


export const sql = postgres('jdbc:postgresql://localhost:5432/postgres', {
    host: 'localhost',             // Postgres ip address[s] or domain name[s]
    port: 5432,                    // Postgres server port[s]
    database: 'testik',              // Name of database to connect to
    username: 'postgres',              // Username of database user
    password: '308696',                // Password of database user
});

export async function insertToManyToMany(player_id, hero_id, matches, win_rate, KDA, lane) {
    await sql`
    insert into many_to_many
      (player_id, hero_id, matches, win_rate, KDA, lane)
    values
      (${player_id}, ${hero_id}, ${matches}, ${win_rate}, ${KDA}, ${lane})
    returning *;
  `;
}


export async function createManyToMany() {
    await sql`
         CREATE TABLE many_to_many
            (
                player_id INTEGER  NOT NULL,
                hero_id  INTEGER NOT NULL,
                matches  INTEGER   NOT NULL,
                win_rate CHAR(6)   NOT NULL,
                KDA      FLOAT     NOT NULL,
                lane     CHAR(9)  NOT NULL,
                FOREIGN KEY (player_id) REFERENCES top_players (id),
                FOREIGN KEY (hero_id) REFERENCES favourite_heroes (id)
            );
    `;
}