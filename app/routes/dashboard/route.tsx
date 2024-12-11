import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "../../services/auth.server";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ArrowLeftIcon, ArrowRight, ArrowRightIcon } from "lucide-react";
import { Charts } from "~/components/Charts";
import { getElos, getMatches, getUserNames } from "~/services/firebase.server";


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

    const standings = [
        { name: "Alice", elo: 1200, wins: 10, losses: 5, draws: 2 },
        { name: "Bob", elo: 1100, wins: 5, losses: 10, draws: 2 },
        { name: "Charlie", elo: 1000, wins: 7, losses: 7, draws: 3 },
    ]

    const elos = await getElos()
    const matches = await getMatches()
    const userNames = await getUserNames()

    return { standings, elos, matches, userId: user.uid, userNames }
}

export default function Dashboard() {
    const { standings } = useLoaderData<typeof loader>();
    return (
        <div className="flex flex-col pt-10">
            <div className="flex flex-row items-center justify-center">
                <Outlet />
            </div>
            <div className="grid grid-cols-3 gap-4 p-10">
                <Charts />
            </div>
        </div>
    );
}

