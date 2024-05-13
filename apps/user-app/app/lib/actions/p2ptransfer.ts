"use server"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2ptransfer(to:string,amount:number) {
    const session= await getServerSession(authOptions);
    const from = session?.user?.id;
    if (!from) {
        return {
            message:"Error while sending "
        }
    }
    const touser= await prisma.user.findFirst({
        where:{
            number:to
        }
    })
    if (!touser) {
        return {
            Message: "No such user"
        }
    }
    await prisma.$transaction(async (txn)=>{
        await txn.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;
        const frombal= await txn.balance.findFirst({
            where:{
                userId:Number(from)
            }
        });
        if (!frombal || frombal.amount<amount ) {
            return {
                message: "Insufficient Balance"
            }
        };
         await txn.balance.update({
            where:{
                userId:Number(from)
            },
            data:{
                amount: {decrement: amount}
            }
        });
        await txn.balance.update({
            where:{
               userId: Number(touser.id) 
            },
            data:{
                amount:{
                    increment: amount
                }
            }
        });
        await txn.p2pTransfer.create({
            data:{
                fromUserId: Number(from),
                toUserId: touser.id,
                amount,
                timestamp: new Date()
            }
        })
        const token= (Math.random()*1000).toString();
        await prisma.onRampTransaction.create({
            data:{
                status:"Success",
                amount:amount,
                provider: "P2P",
                startTime: new Date(),token:token,
                userId:Number(from)
            }
        })
    })
}
