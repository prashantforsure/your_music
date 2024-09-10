import { prisma } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RemoveStreamSchema = z.object({
    streamId: z.string()
});

export async function DELETE(req: NextRequest) {
    const session = await getServerSession();
    const user = await prisma.user.findFirst({
        where: {
            email: session?.user?.email ?? ""
        }
    });

    if (!user) {
        return NextResponse.json({
            message: "Unauthenticated"
        }, {
            status: 403
        });
    }
    try{
        const { searchParams } = new URL(req.url)
        const streamId = searchParams.get('streamId')
        
        if(!streamId){
            return NextResponse.json({
                message: "stream ID is required"
            },{
                status: 400
            }
        )
        }
        await prisma.stream.delete({
            where: {
                id: streamId,
                userId: user.id
            }
        })
        return NextResponse.json({
            message: " song removed succeessfully"
        })
    }catch(e){
        
    }
}