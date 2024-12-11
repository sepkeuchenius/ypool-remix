import { useLoaderData } from "@remix-run/react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { loader, UserStats } from "~/routes/dashboard/route";
import colors from "~/utils/colors";
import moment, { weekdays } from "moment";


export function Charts() {
    return (
        <>
            <EloAllTime />
            <PlaysPerWeek />
            <UserWinsAndLosses />
        </>
    )
}


function EloAllTime() {
    const { elos, userNames } = useLoaderData<typeof loader>();
    const lastEloStanding = elos[elos.length - 1];
    const players = lastEloStanding.map((userStats: UserStats) => userStats.userId);



    return (
        <div className="bg-white rounded p-5">
            <div className="text-xl text-center">Elo all time</div>
            <ResponsiveContainer width={500} height={500} >
                <LineChart
                    width={400}
                    height={400}
                    data={elos}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                    <Tooltip />
                    {
                        players.map((userId, index) => {
                            return <Line type="monotone"
                                dataKey={
                                    (list: UserStats[]) => list.find((stats: UserStats) => stats.userId == userId)?.elo
                                }
                                stroke={colors[index]} width={1} dot={false} name={userNames[userId].name} />
                        })
                    }
                    <YAxis type="number" allowDataOverflow domain={['dataMin - 10', 'dataMax + 10']} allowDecimals={false} />
                    <XAxis />
                </ LineChart >
            </ResponsiveContainer>
        </div>
    )
}

function sameWeek(date1: Date, date2: Date) {
    return moment(date1).week() == moment(date2).week() && moment(date1).year() == moment(date2).year()
}

function getWeekString(date: Date) {
    return `${moment(date).week()}`
}

function PlaysPerWeek() {
    const { matches } = useLoaderData<typeof loader>();
    const matchesWithDate = matches.filter((match) => match.datetime).map((match) => {
        return { ...match, datetime: new Date(match.datetime) }
    });

    let currentWeek = null;
    const weekCount = []
    for (const match of matchesWithDate) {
        if (!currentWeek) {
            currentWeek = match.datetime
            weekCount.push({ week: currentWeek, count: 1 })
        }
        else if (sameWeek(currentWeek, match.datetime)) {
            weekCount[weekCount.length - 1].count++
        }
        else {
            currentWeek = match.datetime
            weekCount.push({ week: currentWeek, count: 1, weekString: getWeekString(currentWeek) })
        }
    }


    return (
        <div className="bg-white rounded p-5">
            <div className="text-xl text-center">Matches per week</div>
            <ResponsiveContainer width={500} height={500} className={""}>
                <LineChart
                    width={500}
                    height={500}
                    data={weekCount}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke={colors[0]} width={1} dot={false} />
                    <YAxis type="number" allowDataOverflow allowDecimals={false} />
                    <XAxis dataKey={"weekString"} />
                </ LineChart >
            </ResponsiveContainer>
        </div>
    )
}

function UserWinsAndLosses() {
    const { matches, userId } = useLoaderData<typeof loader>();
    const winsVsLosses = []
    for (const match of matches) {
        const lastBalance = winsVsLosses.length > 0 ? winsVsLosses[winsVsLosses.length - 1] : { wins: 0, losses: 0 }
        if (match.winner == userId) {
            winsVsLosses.push({ ...lastBalance, wins: lastBalance.wins + 1 })
        }
        if (match.loser == userId) {
            winsVsLosses.push({ ...lastBalance, losses: lastBalance.losses + 1 })
        }
    }
    return (
        <div className="bg-white rounded p-5">
            <div className="text-xl text-center">Wins vs Losses</div>
            <ResponsiveContainer width={500} height={500} className={""}>
                <AreaChart width={500} height={500} data={winsVsLosses}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="wins" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
                    <Area type="monotone" dataKey="losses" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}