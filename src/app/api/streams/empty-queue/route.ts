import { prisma } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(){
    const session = await getServerSession();
    const user = await prisma.user.findFirst({
        where: {
            email: session?.user?.email ?? ""
        }
    })
    if(!user){
        return NextResponse.json({
            message: "user is not logged in"
        }, {
            status: 403
        })
    }

    try {
        await prisma.stream.updateMany({
            where: {
                userId: user.id,
                played: false
            }, 
            data: {
                played: true,
                playedTs: new Date()
            }
        })
        return NextResponse.json({
            message: "Queue emptied successfully"
        });
    }catch(e){
        return NextResponse.json({
            message: "error while upvoting"
        }, {
            status: 403
        })
    }
}
