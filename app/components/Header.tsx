import { Link } from "@remix-run/react";
import { LogOutIcon } from "lucide-react";
import ypool from "~/routes/assets/ypool.svg";
export function Header() {
    return (
        <header className="px-10 w-full h-16 bg-slate-900 text-white flex items-center justify-between grow flex-row">
            <div className="flex flex-row items-center gap-3 justify-between">
                <img src={ypool} alt="YPool Logo" className="h-10" />
                <div className="text-xl font-bold">Y Pool</div>
            </div>
            <Navigation />
        </header>
    )
}

function Navigation() {
    return (
        <nav className="flex items-center gap-10 font-bold">
            <Link to="/dashboard/alltime/0">Dashboard</Link>
            <Link to="/logout"><LogOutIcon /></Link>
        </nav>
    )
}