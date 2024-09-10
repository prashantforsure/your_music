import { NextApiRequest } from "next";
//@ts-ignore
import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
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

    const streams = await prisma.stream.findMany({
        where: {
userId: user.id
        },
        include:{
            _count: {
                select: {
                    upvotes: true
                }
            },
            upvotes: {
                where: {
                    userId: user.id
                }
            }
        }
    })
    return NextResponse.json({
        streams: streams.map(({_count, ...rest}) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: rest.upvotes.length ? true : false
        }))
    })
}