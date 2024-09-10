import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse){
const session = await getServerSession()
try{
const user = await prismaClient.user.findFirst({
where: {
     email: session?.user?.email ?? ""
}
})
if(!user){
   return NextResponse.json({
        message: "user does not exist"
    })
}

return NextResponse.json({user})

}catch(error){
    console.log(error);
    NextResponse.json({
        error: "there is an error"
    })
}
}
export const dynamic = 'force-dynamic'