import { LoaderFunctionArgs } from "@remix-run/node";
import { EloStanding, getElos, getElosAsUserStats, getMatches, getUserNames } from "~/services/firebase.server";
import { UserStats } from "./dashboard/route";
import { calcEloFromGames, getTimeFrameByScope, listGamesInTimeFrame as listMatchesInTimeFrame } from "~/utils/calc_elo";


const LEARNING_RATE_DEFAULT = 4

export async function loader({ request, params }: LoaderFunctionArgs) {

    const timeScope = "alltime"
    const timeIndex = 0

    const elos = await getElosAsUserStats();

    const userNames = await getUserNames();

    const matches = await getMatches()
    let { searchParams } = new URL(request.url);
    const learningRate = Number(searchParams.get("learningrate") || LEARNING_RATE_DEFAULT);


    const [startTime, endTime] = getTimeFrameByScope(timeScope, timeIndex);
    const matchesInTimeFrame = listMatchesInTimeFrame(matches, startTime, endTime);
    const lastElos = calcEloFromGames(matchesInTimeFrame, learningRate);

    let lastMatchPlayers = new Set()
    for (const matchI in matches) {
        const index = Number(matchI)
        const match = matches[index]
        if (elos[index] && index > 0) {
            const prevElo = elos[index - 1]
            const changes = elos[index].map((standing: UserStats) => {
                const prevStanding = prevElo.find((prevStanding: UserStats) => prevStanding.userId == standing.userId)
                return {
                    ...standing,
                    eloChange: standing.elo - (prevStanding ? prevStanding.elo : 0)
                }
            }).filter((standing: UserStats) => standing.eloChange != 0).map((standing: UserStats) => { return userNames[standing.userId].name })
            const match = matches[index]
            lastMatchPlayers = new Set([userNames[match.loser].name, userNames[match.winner].name])
        }
        else {
            lastMatchPlayers = new Set([userNames[match.loser].name, userNames[match.winner].name])
        }

    }

    return new Response(
        lastElos.map((standing: UserStats) => {
            return `${userNames[standing.userId].name.split(" ").join("_").replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')} ${standing.elo}`
        }).join("\n"), 
        {headers:{ "Content-Type": "text/plain" }}
    );
}
