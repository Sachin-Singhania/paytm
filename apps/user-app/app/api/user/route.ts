import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../lib/auth"


export const GET = async () => {
        const session =await getServerSession(authOptions);
        if (session.user) {
            return NextResponse.json({
                user: session.user
            })
        }
    return NextResponse.json({
        message: "Unable to login"
    },{
        status: 500
    }
)
}
