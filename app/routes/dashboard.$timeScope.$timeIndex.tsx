import { Link, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { ArrowLeftIcon, ArrowRightIcon, CrownIcon, MedalIcon } from "lucide-react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { EloStanding } from "./dashboard/route";
import { getElos, getElosAsUserStats, getUserNames } from "~/services/firebase.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });

    const timeScope = params.timeScope || "week"
    const timeIndex = timeScope != "alltime" ? Number(params.timeIndex || "0") : 0

    const elos = await getElosAsUserStats();
    const lastEloStanding = elos[elos.length - 1].sort((a: EloStanding, b: EloStanding) => b.elo - a.elo);

    const userNames = await getUserNames();
    return { standings: lastEloStanding, timeScope, timeIndex, elos, userNames, userId: user.uid }


}


export default function Dashboard() {
    const { standings, elos, userNames } = useLoaderData<typeof loader>();

    return (
        <div className="rounded p-6  bg-white" style={{ minWidth: 800 }}>
            <TimeRangePicker />
            <div className="flex flex-row gap-10 items-start justify-between w-full">
                <StaningsTable standings={standings.slice(0, Math.ceil(standings.length / 2))} />
                <StaningsTable indexStart={10} standings={standings.slice(Math.ceil(standings.length / 2))} />
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

function StaningsTable({ standings, indexStart }: { standings: EloStanding[], indexStart?: number }) {
    const {  userNames, userId } = useLoaderData<typeof loader>()
    return (<table className="w-1/2 scoretable text-xl px-10">
        {
            standings.map((standing: EloStanding, index: number) => (
                <tr className="max-h-5">
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
        <select value={timeScope} className="text-l bg-transparent border-1 border-slate-500 hover:bg-slate-100 px-3 py-2 rounded-l"
            onChange={(event) => { navigate(`/dashboard/${event.target.value}/0`) }}>
            <option value="week">Week{timeIndex > 1 ? 's' : null}</option>
            <option value="month">Month{timeIndex > 1 ? 's' : null}</option>
            <option value="year">Year{timeIndex > 1 ? 's' : null}</option>
            <option value="alltime">All Time</option>
        </select>
    )
}