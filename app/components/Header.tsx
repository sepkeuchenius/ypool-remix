import { Link, useLoaderData } from "@remix-run/react";
import { LogOutIcon } from "lucide-react";
import { loader } from "~/root";
import ypool from "~/routes/assets/ypool.svg";
export function Header() {
    const { DB, userName } = useLoaderData<typeof loader>();
    return (
        <header className="px-10 w-full h-16 bg-slate-900 text-white flex items-center justify-between grow flex-row">
            <div className="flex flex-row items-center gap-3 justify-between">
                <img src={ypool} alt="YPool Logo" className="h-10" />
                <div className="text-xl font-bold">Y Pool</div>
                <div className="text-sm font-italic">({DB})</div>
            </div>
            <div className="flex items-center gap-10 font-bold">
                {userName}
            </div>
            <Navigation />
        </header>
    )
}

function Navigation() {
    return (
        <nav className="flex items-center gap-10 font-bold">
            <Link to="/dashboard/alltime/0">Dashboard</Link>
            <Link to="/tournies">Tournies</Link>
            <Link to="/logout"><LogOutIcon /></Link>
        </nav>
    )
}