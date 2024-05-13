"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import prisma from "@repo/db/client";

export async function onRampTransaction(provider: string, amount: number) {
    const session= await getServerSession(authOptions);
    if (!session.user.id && !session.user) {
        return{
            message: "Unauthorized access"
        }
    }
    const token= (Math.random()*1000).toString();
    const onramptrans= await prisma.onRampTransaction.create({
        data:{
            status:"Processing",
            amount:amount*100,
            provider: provider,
            startTime: new Date(),
            token:token,userId:Number(session.user.id)
        }
    })
    return {
        message: "Done"
    }
}