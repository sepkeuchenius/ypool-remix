import { Link, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { ArrowLeftIcon, ArrowRightIcon, CrownIcon, MedalIcon } from "lucide-react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { EloStanding, getElos, getElosAsUserStats, getMatches, getUserNames } from "~/services/firebase.server";
import { UserStats } from "./dashboard/route";
import { calcEloFromGames, getTimeFrameByScope, listGamesInTimeFrame as listMatchesInTimeFrame } from "~/utils/calc_elo";
import { DB } from "~/services/firebase.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });

    const timeScope = params.timeScope || "week"
    const timeIndex = timeScope != "alltime" ? Number(params.timeIndex || "0") : 0

    const elos = await getElosAsUserStats();
    const lastEloStanding = elos[elos.length - 1].sort((a: UserStats, b: UserStats) => b.elo - a.elo);

    const userNames = await getUserNames();

    const matches = await getMatches()

    const [startTime, endTime] = getTimeFrameByScope(timeScope, timeIndex);
    const matchesInTimeFrame = listMatchesInTimeFrame(matches, startTime, endTime);
    const lastElos = calcEloFromGames(matchesInTimeFrame);

    console.log(matches.length)
    console.log(elos.length)
    let lastMatchPlayers = new Set()
    for(const matchI in matches){
        const index = Number(matchI)
        const match = matches[index]
        if(elos[index] && index > 0){
            const prevElo = elos[index - 1]
            const changes = elos[index].map((standing: UserStats) => {
                const prevStanding = prevElo.find((prevStanding: UserStats) => prevStanding.userId == standing.userId)
                return {
                    ...standing,
                    eloChange: standing.elo - (prevStanding ? prevStanding.elo : 0)
                }
            }).filter((standing: UserStats) => standing.eloChange != 0).map((standing: UserStats) => {return userNames[standing.userId].name})
            const match = matches[index]
            console.log(changes)
            console.log(new Set(changes) == lastMatchPlayers)
            console.log(userNames[match.loser].name, userNames[match.winner].name)
            lastMatchPlayers = new Set([userNames[match.loser].name, userNames[match.winner].name])
        }
        else {
            console.log(userNames[match.loser].name, userNames[match.winner].name)
            lastMatchPlayers = new Set([userNames[match.loser].name, userNames[match.winner].name])
        }

    }
    
    return { standings: lastElos, timeScope, timeIndex, elos, userNames, userId: user.uid }


}


export default function Dashboard() {
    const { standings, elos, userNames } = useLoaderData<typeof loader>();

    const userHalf = Math.ceil(standings.length / 2)
    return (
        <div className="rounded p-6 dark:bg-slate-800 bg-white" style={{ minWidth: 800 }}>
            <TimeRangePicker />
            <div className="flex flex-row gap-10 items-start justify-between w-full">
                <StaningsTable standings={standings.slice(0, userHalf)} />
                <StaningsTable indexStart={userHalf} standings={standings.slice(userHalf)} />
            </div>
        </div>
    );
}


function Standing({ index}: { index: number}) {
    return (
        <td>
            {index == 0 ? (<CrownIcon color="gold" />) : index < 2 ? (<MedalIcon color="silver" />) : index < 3 ? (<MedalIcon color="#CD7F32" />) : index + 1}
            {}
        </td>
    )
}

function StaningsTable({ standings, indexStart }: { standings: UserStats[], indexStart?: number }) {
    const {  userNames, userId } = useLoaderData<typeof loader>()
    return (<table className="w-1/2 scoretable text-xl px-10">
        {
            standings.map((standing: UserStats, index: number) => (
                <tr className="max-h-5" style={standing.dead ? {textDecoration: 'line-through', fontSize:13}:{}}>
                    <td><Standing index={indexStart ? indexStart + index : index} /></td>
                    <td style={standing.userId == userId ? {color: "#5f5fff"}: {}}>{userNames[standing.userId].name}</td>
                    <Elo elo={standing.elo} />
                </tr>
            ))
        }
    </table>)
}



function Elo({ elo }: { elo: number }) {
    return (
        <td style={{ color: elo < 1500 ? 'rgb(255 134 96)' : '#50a350', textAlign:"right" }}>
            {elo}
        </td>
    )
}

function TimeRangePicker() {
    const { timeScope, timeIndex } = useLoaderData<typeof loader>()


    return (
        <div className="flex flex-row items-center gap-10 justify-center w-full mb-3" >
            {timeScope != "alltime" ? (<Link to={`/dashboard/${timeScope}/${Math.max(0, Number(timeIndex) - 1)}`} className="cursor-pointer">
                <ArrowLeftIcon className="cursor-pointer" />
            </Link>) : null}
            <div className="text-xl ">{timeScope != "alltime" && timeIndex === 0 ? "This " : timeScope != "alltime" ? timeIndex : null} <TimeScopePicker /> {timeIndex > 0 ? " ago" : null}</div>
            {timeScope != "alltime" ? (<Link to={`/dashboard/${timeScope}/${Math.max(0, Number(timeIndex) + 1)}`} className="cursor-pointer">
                <ArrowRightIcon className="cursor-pointer" />
            </Link>) : null}
        </div>
    )
}

function TimeScopePicker() {
    const { timeScope, timeIndex } = useLoaderData<typeof loader>()
    const navigate = useNavigate()
    return (
        <select value={timeScope} className="text-l bg-transparent border-1 border-slate-500 hover:bg-slate-100 px-3 py-2 rounded-l dark:text-slate-800 dark:bg-slate-300"
            onChange={(event) => { navigate(`/dashboard/${event.target.value}/0`) }}>
            <option value="week">Week{timeIndex > 1 ? 's' : null}</option>
            <option value="month">Month{timeIndex > 1 ? 's' : null}</option>
            <option value="year">Year{timeIndex > 1 ? 's' : null}</option>
            <option value="alltime">All Time</option>
        </select>
    )
}