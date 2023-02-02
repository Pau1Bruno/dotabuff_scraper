import postgres from 'postgres';


export const sql = postgres('jdbc:postgresql://localhost:5432/postgres', {
    host: 'localhost',             // Postgres ip address[s] or domain name[s]
    port: 5432,                    // Postgres server port[s]
    database: 'testik',              // Name of database to connect to
    username: 'postgres',              // Username of database user
    password: '308696',                // Password of database user
});

export async function insertToFavouriteHeroes(id, hero, str, agi, int) {
    await sql`
    insert into favourite_heroes
      (id, hero, strength, agility, intelligence)
    values
      (${id}, ${hero}, ${str}, ${agi}, ${int})
    returning *;
  `;
}


export async function createFavouriteHeroes() {
    await sql`
            CREATE TABLE favourite_heroes
                (
                    id       INTEGER PRIMARY KEY   NOT NULL,
                    hero            CHAR(19)       NOT NULL,
                    strength       INTEGER         NOT NULL,
                    agility        INTEGER         NOT NULL,
                    intelligence   INTEGER         NOT NULL
                );
    `;
//     await sql `
//             ALTER TABLE many_to_many ADD CONSTRAINT fav_many FOREIGN KEY (hero_id) REFERENCES favourite_heroes (id);
//     `;                    FOREIGN KEY (id) REFERENCES many_to_many (hero_id)
}