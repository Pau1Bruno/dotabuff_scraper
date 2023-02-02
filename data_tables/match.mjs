import postgres from 'postgres';


export const sql = postgres('jdbc:postgresql://localhost:5432/postgres', {
    host: 'localhost',             // Postgres ip address[s] or domain name[s]
    port: 5432,                    // Postgres server port[s]
    database: 'testik',              // Name of database to connect to
    username: 'postgres',              // Username of database user
    password: '308696',                // Password of database user
});

export async function insertToMatch(id, hero, result, length, KDA) {
    await sql`
    insert into match
      (id, hero, result, length, KDA)
    values
      (${id}, ${hero}, ${result}, ${length}, ${KDA})
    returning *;
  `;
}


export async function createMatch() {
    await sql`
         CREATE TABLE match
            (
                id BIGINT PRIMARY KEY NOT NULL,
                hero     CHAR(19)             NOT NULL,
                result   CHAR(11)             NOT NULL,
                length   CHAR(7)              NOT NULL,
                KDA      FLOAT                NOT NULL,
                FOREIGN KEY (id) REFERENCES one_to_many (match_id)
            );
    `;
}