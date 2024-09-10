import { prisma } from "@/app/lib/db";
import { getServerSession } from "next-auth";
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

}