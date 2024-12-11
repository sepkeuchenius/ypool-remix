import { EloStanding, PlayedMatch } from "~/services/firebase.server";

export interface Match {
    outcome?: PlayedMatch;
    counterpart?: Match;
    players: string[];
}


interface MonthMatches{
    year: number
    month: number
    matches: PlayedMatch[]
    last_elo: EloStanding
}

interface MonthMatches {
    year: number;
    month: number;
    matches: PlayedMatch[];
    last_elo: EloStanding;
}

export function calc_monthly_matches(
    matches: PlayedMatch[], elos: EloStanding[]
): MonthMatches[] {
    const tournies: MonthMatches[] = [];
    matches.forEach((match, index) => {
        if (match.datetime) {
            const matchDate = new Date(match.datetime);
            const year = matchDate.getFullYear();
            const month = matchDate.getMonth() + 1;
            if (
                tournies.length > 0 &&
                year === tournies[tournies.length - 1].year &&
                month === tournies[tournies.length - 1].month
            ) {
                tournies[tournies.length - 1].matches.push(match);
                tournies[tournies.length - 1].last_elo = elos[index];
            } else {
                tournies.push({
                    year,
                    month,
                    matches: [match],
                    last_elo: elos[index],
                });
            }
        }
    });
    return tournies;
}

export interface Round {
    matches: Match[];
    played: PlayedMatch[];
    closed: boolean;
}

export interface Tourny {
    year: number;
    month: number;
    rounds: Round[];
    winner: string | null;
}

export function calc_tourny_scheme(
    month_matches: MonthMatches, previous_month_matches: MonthMatches
): Tourny | null {
    const players: string[] = [];
    previous_month_matches.matches.forEach(match => {
        if (!players.includes(match.winner)) players.push(match.winner);
        if (!players.includes(match.loser)) players.push(match.loser);
    });

    //sort the players by elo
    players.sort((a, b) => previous_month_matches.last_elo[b] - previous_month_matches.last_elo[a]);
    
    //decide the amount of players (needs to be a power of 2)
    const max_players = 4;
    if (players.length < max_players) return null;

    //decide who plays the tournies
    const tourny_players = players.slice(0, max_players);
    
    //the first matches match up the best player with the worst player, the second best with the second worst, etc.
    const first_matches = tourny_players.slice(0, max_players / 2).map((player, i) => ({
        players: [player, tourny_players[max_players - i - 1]],
    } as Match));
    const first_round = {matches: first_matches, played: [], closed: false} as Round;
    const rounds = Math.log2(max_players);
    const tourny = {
        year: month_matches.year,
        month: month_matches.month,
        rounds: Array.from({ length: rounds }, () => { return { matches: [], played: [], closed: false } as Round }),
    } as Tourny;
    tourny.rounds[0] = first_round;

    // now we've decided the initial matches for the tourny, we can see if they've been played.
    return play_tourny(tourny, first_round, month_matches.matches, 0);
}

function make_counterparts(round: Round): Round {
    if (round.matches.length > 1) {
        round.matches.forEach((match, index) => {
            if (index % 2 === 0) {
                match.counterpart = round.matches[index + 1];
                round.matches[index + 1].counterpart = match;
            }
        });
    }
    return round;
}

function play_tourny(
    tourny: Tourny, round: Round, played_matches: PlayedMatch[], last_match_index = 0
): Tourny {
    const next_round = tourny.rounds[tourny.rounds.indexOf(round) + 1] || null;
    //every round has matches, that all have a counterpart for the following round
    round = make_counterparts(round);
    
    console.log(round.matches.length);

    console.log(round.matches)

    // for all matches in the round, we'll now check if they have been played
    for(const match of round.matches) {
        for(const index in played_matches) {
            if (Number(index) < last_match_index) {
                continue;
            }
            const played_match = played_matches[index];
            if (
                [played_match.winner, played_match.loser].includes(match.players[0]) &&
                [played_match.winner, played_match.loser].includes(match.players[1])
            ) {
                if (Number(index) > last_match_index) last_match_index = Number(index);

                round.played.push(played_match);
                match.outcome = played_match;
                if (!match.counterpart) {
                    round.closed = true;
                    console.log("tourny completed!");
                    console.log(_get_username(played_match.winner));
                    tourny.winner = played_match.winner;
                    return tourny;
                } else if (match.counterpart.outcome) {
                    if (next_round) {
                        console.log("appending next match");
                        next_round.matches.push({
                            players: [match.counterpart.outcome.winner, played_match.winner]
                        });
                        break;
                    } else {
                        throw new Error("Why does this match have a counterpart?");
                    }
                }
                else {
                    console.log("match played, but counterpart not yet");
                    break
                }
            }
        }
    };

    if (round.matches.every(match => match.outcome)) {
        round.closed = true;
        return play_tourny(tourny, next_round, played_matches, last_match_index);
    } else {
        console.log("not all matches have been played in round");
        if (next_round) make_counterparts(next_round);
        return tourny;
    }
}

function _get_username(userId: string): string {
    // Mock function to get username from userId
    return `User_${userId}`;
}