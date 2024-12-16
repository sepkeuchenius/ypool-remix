import moment from "moment";
import { Duel, Player } from "teslo";
import { UserStats } from "~/routes/dashboard/route";
import { EloStanding, PlayedMatch } from "~/services/firebase.server";

const LEARNING_RATE = 3.8

export function calcEloFromGames(games: PlayedMatch[]): UserStats[] {
    // get players
    const players = Array.from(new Set(games.flatMap((game) => [game.winner, game.loser])));
    // initialize elo
    const eloPlayers = players.map((player) => (new Player(player, 1500)))
    for (const game of games) {
        const winner = eloPlayers[players.indexOf(game.winner)];
        const loser = eloPlayers[players.indexOf(game.loser)];
        if (!winner || !loser || winner === loser) {
            console.log("Player not found", game);
            continue;
        }
        const duel = new Duel({kFactor: LEARNING_RATE}); // todo: check k-factor
        duel.addPlayer(winner);
        duel.addPlayer(loser);
        duel.calculate(winner.id);
    }

    return eloPlayers.sort((playerA, playerB) => { return playerB.elo - playerA.elo }).map((player) => (
        { userId: player.id, elo: Number(player.elo.toFixed(2)), dead: false }
    ));

}

function isPlayerDead(player: Player, games: PlayedMatch[]): boolean {
    const playedGames = games.filter((game) => game.winner === player.id || game.loser === player.id)
    if (playedGames.length === 0) {
        return true;
    }
    const lastPlayedGame = playedGames[playedGames.length - 1];
    return moment(lastPlayedGame.datetime) < moment().subtract(30, "days")
}

export function listGamesInTimeFrame(games: PlayedMatch[], startTime: moment.Moment, endTime: moment.Moment): PlayedMatch[] {
    return games.filter((game) => {
        const gameMoment = moment(game.datetime);
        return game.datetime && gameMoment.isAfter(startTime) && gameMoment.isBefore(endTime);
    });
}

export function getTimeFrameByScope(scope: string, index: number): [moment.Moment, moment.Moment] {
    const now = moment();
    switch (scope) {
        case "week":
            return [now.clone().subtract(7 * (index), "days").startOf('week'), now.clone().subtract(7 * index, "days").endOf('week')];
        case "month":
            return [now.clone().subtract(index, "months").startOf("month"), now.clone().subtract(index, "months").endOf("month")];
        case "year":
            return [now.clone().subtract(index, "years").startOf('year'), now.clone().subtract(index, "years").endOf('year')];
        default:
            return [moment(0), moment()];
    }
}