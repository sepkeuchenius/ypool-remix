import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "../../services/auth.server";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ArrowLeftIcon, ArrowRight, ArrowRightIcon, AwardIcon, BellIcon, CircleSlashedIcon, RadioIcon, ZapIcon } from "lucide-react";
import { Charts } from "~/components/Charts";
import { getElos, getMatches, getUserNames, PlayedMatch } from "~/services/firebase.server";
import { calc_monthly_matches, calc_tourny_scheme, Match, Round, Tourny } from "./utils";


export interface UserStats {
    name?: string;
    elo: number;
    wins?: number;
    losses?: number;
    draws?: number;
    userId: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });

    const userNames = await getUserNames()
    const elos = await getElos()
    const matches = await getMatches()
    const matchesPerMonth = calc_monthly_matches(matches, elos);
    const tournies = []
    for (const month in matchesPerMonth) {
        if (Number(month) == 0) continue
        const monthlyMatches = matchesPerMonth[month]
        const lastMonthMatches = matchesPerMonth[Number(month) - 1]
        const tourny = calc_tourny_scheme(monthlyMatches, lastMonthMatches)
        if (tourny) tournies.push(tourny)
    }
    tournies.reverse();
    return { tournies, userId: user.uid, userNames }
}


export default function Tournies() {
    const { tournies } = useLoaderData<typeof loader>();
    return (
        <div className="flex flex-col pt-10 items-center justify-center">
            <div className="flex flex-col pt-10" style={{ width: 1200 }}>
                <h2 className="text-center text-3xl font-bold">Tournaments</h2>
                {tournies.map((tourny, index) => (
                    (<TournyTable tourny={tourny} index={index} />)
                ))}
            </div>
        </div>
    );
}

function TournyTable({ tourny, index }: { tourny: Tourny, index: number }) {
    return (
        <div className="w-full flex-col border border-2 rounded-xl bg-white p-4 my-5 gap-5">
            <div className="flex flex-row gap-3">
                {index === 0 ? <RadioIcon color={'green'}/> : <></>}
                <h1>{tourny.year} - {tourny.month}</h1>
            </div>
            <div className="flex flex-col gap-4">
                {tourny.rounds.map((round, index) => (
                    <>
                        <RoundTable round={round} index={index + 1} />
                    </>
                ))}
            </div>
        </div>
    )
}

function RoundTable({ round, index }: { round: Round, index?: number }) {
    return (
        <div className="bg-slate-100 rounded p-4 border-2 my-3 flex flex-col gap-3 align-center items-center">
            <h2 className="bg-blue-100 w-fit px-4 py-2 rounded-l flex flex-row justify-center gap-3"> Round {index} </h2>

            {round.matches.map((match, index) => (
                <MatchTable match={match} />
            ))}
        </div>
    )
}

function MatchTable({ match }: { match: Match }) {
    return (
        <div className="flex flex-col gap-3 items-center justify-center my-5">
            <div className="flex flex-row justify-center gap-3">
                <UserBadge userId={match.players[0]} />
                <ZapIcon className="mt-2" />
                <UserBadge userId={match.players[1]} />

            </div>
            {match.outcome && match.outcome.winner ? <WinnerBadge userId={match.outcome.winner} /> : <div className="px-3 py-2 bg-red-100 w-64 text-center rounded align-center items-center flex flex-row justify-center"><CircleSlashedIcon /></div>}

        </div>
    )
}

function UserBadge({ userId }: { userId: string }) {
    const { userNames } = useLoaderData<typeof loader>()
    return (
        <div className="px-4 py-2 bg-slate-200 rounded-l text-center w-64">
            {userNames[userId].name}
        </div>
    )
}

function WinnerBadge({ userId }: { userId: string }) {
    const { userNames } = useLoaderData<typeof loader>()
    return (
        <div className="px-4 py-2 bg-green-300 rounded-l text-center w-64 mt-5 flex flex-row justify-center gap-4">
            <AwardIcon /> {userNames[userId].name}
        </div>
    )
}