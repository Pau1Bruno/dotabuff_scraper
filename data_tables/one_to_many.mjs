import postgres from 'postgres';


export const sql = postgres('jdbc:postgresql://localhost:5432/postgres', {
    host: 'localhost',             // Postgres ip address[s] or domain name[s]
    port: 5432,                    // Postgres server port[s]
    database: 'testik',              // Name of database to connect to
    username: 'postgres',              // Username of database user
    password: '308696',                // Password of database user
});

export async function insertToOneToMany(player_id, match_id) {
    await sql`
    insert into one_to_many
      (player_id, match_id)
    values
      (${player_id}, ${match_id})
    returning *;
  `;
}


export async function createOneToMany() {
    await sql`
         CREATE TABLE one_to_many
            (
                player_id INTEGER  NOT NULL,
                match_id  BIGINT unique NOT NULL,
                FOREIGN KEY (player_id) REFERENCES top_players (id)
            );
    `;
}