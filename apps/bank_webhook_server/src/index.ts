import express from "express";
import db from "@repo/db/client";
const app = express();

app.use(express.json())

app.post("/hdfcWebhook", async (req, res) => {
    const paymentInformation: {
        token: string;
        userId: string;
        amount: string;
    } = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount,
    };
    try {
        await db.$transaction(async (prisma) => {
            const tokenUpdate = await prisma.onRampTransaction.updateMany({
                where: {
                    token:paymentInformation.token,
                    expire: false
                },
                data: {
                    status: "Success",
                    expire: true
                }
            });
            if (tokenUpdate.count === 0) {
                throw new Error("Token expired or not found");
            }
            await prisma.balance.updateMany({
                where: {
                    userId: Number(paymentInformation.userId)
                },
                data: {
                    amount: {
                        increment: Number(paymentInformation.amount) * 100
                    }
                }
            });
        });
        res.json({
            message: "Captured"
        })
    } catch(e) {
        console.error(e);
        res.status(411).json({
            message: "Error while processing webhook or Token Expired"
        })
    }

})

app.listen(3003);