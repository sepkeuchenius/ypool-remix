import { redirect } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import ypool_logo from "~/routes/assets/ypool.svg";

export default function Index() {
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/dashboard/alltime/0");
        }, 1000);

        return () => clearTimeout(timer);
    }, [navigate]);


    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-16">
                <img src={ypool_logo} alt="YPool Logo" className="w-32" />
            </div>
        </div>
    )

}