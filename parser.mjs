import puppeteer from 'puppeteer';
import {createTopPlayers, dropAllTables, insertToTopPlayers} from "./data_tables/top_players.mjs";
import {createOneToMany, insertToOneToMany} from "./data_tables/one_to_many.mjs";
import {createFavouriteHeroes, insertToFavouriteHeroes} from "./data_tables/favourite_heroes.mjs";
import {createManyToMany, insertToManyToMany} from "./data_tables/many_to_many.mjs";
import {createMatch, insertToMatch} from "./data_tables/match.mjs";


const url = 'https://www.dotabuff.com/players/leaderboard';
const start = Date.now();


(async () => {
    try {
        await dropAllTables();
        await createTopPlayers();
        await createFavouriteHeroes();
        await createManyToMany();
        await createOneToMany();
        await createMatch();


        let browser = await puppeteer.launch()
        console.log('Открывается браузер')
        let page = await browser.newPage()
        console.log('Открывается таблица лидеров');
        await page.goto(url);

        // Wait for suggest overlay to appear and click "show all results".
        const allResultsSelector = 'table > tbody > tr';
        await page.waitForSelector(allResultsSelector);
        console.log('Подгрузилась сетка героев');


        // Extract the results from the page.
        const links = await page.evaluate(allResultsSelector => {
            return [...document.querySelectorAll(allResultsSelector)].map(player => {
                const link = player.children[1].children[0]['href'];
                const playerName = player.children[1].children[0].text;
                const region = player.children[1].children[1].textContent;
                const winRate = player.children[4].textContent;
                const lane = player.children[5].children[0].children[0].children[0].children[2].children[0].children[1].textContent.trim(0);

                return [`${link}`, `${playerName}`, `${region}`, `${winRate}`, `${lane}`];
            });
        }, allResultsSelector);


        function makeTopPlayersArray() {
            const array = [];
            for (let i = 0; i < links.length; i++) { // links.length
                array.push(
                    {
                        link: links[i][0],
                        name: links[i][1],
                        region: links[i][2],
                        winRate: 0,
                        lane: links[i][4],
                    }
                )
            }
            return array;
        }

        const players = makeTopPlayersArray();


        let favouriteHeroesPromise = (link, index, player) => new Promise(async (resolve, reject) => {
            let newPage = await browser.newPage();
            await newPage.goto(link);

            const allFavouriteHeroes = 'section:nth-child(2) > article > div > div';
            await newPage.waitForSelector(allFavouriteHeroes);
            console.log('Подгрузилась сетка любимых героев', player);

            const favouriteHeroes = await newPage.evaluate(allFavouriteHeroes => {
                return [...document.querySelectorAll(allFavouriteHeroes)].map(hero => {
                    const name = hero.children[0].children[1].children[1].children[0].textContent;
                    let matches = hero.children[1].textContent.slice(7);
                    if (matches.includes(',')) {
                        matches = Number(matches.replace(/[\s.,%]/g, ''));
                    } else {
                        matches = Number(matches);
                    }
                    const winRate = hero.children[2].textContent.slice(5);
                    const KDA = Number(hero.children[3].textContent.slice(3));
                    const lane = hero?.children[5]?.children[1]?.children[0]?.children[0]?.textContent.trim(0);
                    return {
                        hero: `${name}`,
                        matches: matches,
                        winRate: `${winRate}`,
                        KDA: KDA,
                        lane: `${lane ? lane : 'No Lane'}`
                    };
                });
            }, allFavouriteHeroes); // добыли данные для любимых героев

            const allLastMatches = 'section:nth-child(3) > article > div > div.r-row';
            await newPage.waitForSelector(allLastMatches);
            console.log('Подгрузилась сетка ласт матчей', player);

            const lastMatches = await newPage.evaluate(allLastMatches => {
                return [...document.querySelectorAll(allLastMatches)].map(match => {
                    let check = match.children[0].children[1]?.children[0]?.children[0];
                    if (!check) return {
                        link: `https://ru.dotabuff.com/heroes/lifestealer`,
                        match_id: Math.floor(Math.random()*10e10),
                        hero: `Lifestealer`,
                        result: `Won match`,
                        gameLength: `24:43`,
                        KDA: 5.34
                    }

                    const link = match.children[0].children[1]?.children[0]?.children[0]['href'];
                    const match_id = Math.floor(Math.random() * 10e10)
                    const hero = match.children[0].children[1].children[1].textContent;
                    const result = match.children[1].children[1].children[0].textContent;
                    const gameLength = match.children[3].textContent.slice(8);
                    const KDA = match.children[4].textContent.slice(3);
                    let kills =Number(match.children[4].children[1].children[0].children[0].textContent);
                    let deaths = Number(match.children[4].children[1].children[0].children[1].textContent);
                    let assists = Number(match.children[4].children[1].children[0].children[2].textContent);
                    if (!deaths) return {
                            link: `${link}`,
                            match_id: match_id,
                            hero: `${hero}`,
                            result: `${result}`,
                            gameLength: `${gameLength}`,
                            KDA: kills + assists
                        };
                    return {
                        link: `${link}`,
                        match_id: match_id,
                        hero: `${hero}`,
                        result: `${result}`,
                        gameLength: `${gameLength}`,
                        KDA: ((kills + assists) / deaths).toPrecision(3)
                    };
                });
            }, allLastMatches); // добыли данные для любимых героев

            players[index].winRate = await newPage.$eval('div.header-content-secondary > dl:nth-child(3) > dd', elem => elem.textContent);
            resolve([favouriteHeroes, lastMatches]);
            await newPage.close();
        });

        let heroLinksPromise = () => new Promise(async (resolve, reject) => {
            let newPage = await browser.newPage();
            await newPage.goto(`https://www.dotabuff.com/heroes`);

            const allHeroStats = 'div.hero-grid > a';
            await newPage.waitForSelector(allHeroStats);

            const heroLinks = await newPage.evaluate(allHeroStats => {
                return [...document.querySelectorAll(allHeroStats)].map(hero => {
                    return hero['href'];
                });
            }, allHeroStats); // добыли данные для любимых героев


            resolve(heroLinks);
            await newPage.close();
        });

        let heroStatsPromise = (link) => new Promise(async (resolve, reject) => {
            let newPage = await browser.newPage();
            await newPage.goto(link);

            const allHeroStats = 'article > table.main > tbody > tr:nth-child(2)';
            await newPage.waitForSelector(allHeroStats);

            const names = 'div.header-content-avatar > div > a > img'
            const heroNames = await newPage.evaluate(names => {
                return [...document.querySelectorAll(names)].map(name => {
                    return name['alt'];
                });
            }, names);

            const heroStats = await newPage.evaluate(allHeroStats => {
                return [...document.querySelectorAll(allHeroStats)].map(stats => {
                    const str = Number(stats.children[0].textContent?.slice(0, 2));
                    const agi = Number(stats.children[1].textContent?.slice(0, 2));
                    const int = Number(stats.children[2].textContent?.slice(0, 2));
                    return {
                        str: str,
                        agi: agi,
                        int: int
                    };
                });
            }, allHeroStats);
            for (let i = 0; i < heroNames.length; i++) {
                heroStats[i].hero = heroNames[i]
            }

            resolve(heroStats);
            await newPage.close();
        });

        let favouriteHeroes = [];
        let lastMatches = [];
        for (let i = 0; i < players.length; i++) {
            console.log('Парсим', players[i].name)
            let currentPlayerData = await favouriteHeroesPromise(players[i].link, i, players[i].name);
            favouriteHeroes.push(currentPlayerData[0]);
            console.log(currentPlayerData[0])
            lastMatches.push(currentPlayerData[1]);
        }

        let heroesStats = [];
        let heroesLinks = await heroLinksPromise();
        for (let i = 0; i < heroesLinks.length; i++) {
            let currentHeroStats = await heroStatsPromise(heroesLinks[i]);
            console.log(currentHeroStats);
            heroesStats.push(currentHeroStats)
        }
        console.log(heroesStats)

        for (let i = 0; i < players.length; i++) { // top_players
            await insertToTopPlayers(players[i].name, players[i].region, players[i].winRate, players[i].lane);
        }


        let uniqueHeroes = []
        for (let i = 0; i < players.length; i++) {
            for (let j = 0; j < favouriteHeroes[i].length; j++) {
                if (!uniqueHeroes.includes(favouriteHeroes[i][j].hero)) {
                    uniqueHeroes.push(favouriteHeroes[i][j].hero);
                    let favouriteHero = '';
                    for (let k = 0; k < heroesStats.length; k++) {

                        if (heroesStats[k][0].hero === favouriteHeroes[i][j].hero) {
                            console.log(heroesStats[k][0])
                            favouriteHero = heroesStats[k][0];
                        }
                    } // uniqueHeroes.indexOf(favouriteHeroes[i][j].hero) + 1
                    await insertToFavouriteHeroes(
                        uniqueHeroes.length,
                        favouriteHero.hero ? favouriteHero.hero : 'NO NAME',
                        favouriteHero.str ? favouriteHero.str : 0,
                        favouriteHero.agi ? favouriteHero.str : 0,
                        favouriteHero.int ? favouriteHero.int : 0
                    );
                }
                await insertToManyToMany(
                    i + 1,
                    uniqueHeroes.indexOf(favouriteHeroes[i][j].hero) + 1,
                    favouriteHeroes[i][j].matches,
                    favouriteHeroes[i][j].winRate,
                    favouriteHeroes[i][j].KDA,
                    favouriteHeroes[i][j].lane
                );
            }
            for (let j = 0; j < lastMatches[i].length; j++) {
                await insertToOneToMany(i + 1, lastMatches[i][j].match_id);
                await insertToMatch(
                    lastMatches[i][j].match_id,
                    lastMatches[i][j].hero,
                    lastMatches[i][j].result,
                    lastMatches[i][j].gameLength,
                    lastMatches[i][j].KDA
                );
            }
        }

        await browser.close();
        console.log(Date.now() - start);

        // НА БАЗУ


        process.exit();


    } catch (err) {
        if (err) throw err;
    }
})();

