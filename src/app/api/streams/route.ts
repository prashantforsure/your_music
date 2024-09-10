import { prisma } from "@/app/lib/db";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const checkStreamSchema = z.object({
creatorId: z.string(),
url: z.string()
});
export async function POST(req: NextRequest){
   try{
        const session  = await getServerSession();
        const user = await prisma.user.findFirst({
            where:{
                email: session?.user?.email ?? ""
            }
        })
        if(!user){
            return NextResponse.json({
                message: "user does not exist"
            })
        }
      
    
    const data =  checkStreamSchema.parse(req.json());
    if(!data.url.trim()){
        return NextResponse.json({
            message: "the url is empty"
        })
    }
    const extractedId = data.url.split("?v=")[1];
    const res = await youtubesearchapi.GetVideoDetails(extractedId);

 if(user.id !== data.creatorId){
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twoMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
    const userRecentStream = await prisma.stream.count({
        where: {
            userId: data.creatorId,
            addedBy: user.id,
            createAt: {
                gte : thirtyMinutesAgo
            }
        }
    })
    
    const duplicateSong = await prisma.stream.findFirst({
        where:{
            userId: data.creatorId,
            extractedId: extractedId,
            createAt: {
                gte: thirtyMinutesAgo
            }
        }
    }) 
if(!duplicateSong){
    return NextResponse.json({
        message: "song was added 30 minutes ago"
    }, {
        status: 429
    })
}
const streamsLastTwoMinutes = await prisma.stream.count({
    where: {
        userId: data.creatorId,
        addedBy: user.id,
        createAt: {
            gte: twoMinutesAgo
        }
    }
})
if(streamsLastTwoMinutes >= 2){
return NextResponse.json({
    messaage: "Rate limit exceeded: You can only add 2 songs per 2 minutes"
}, {
    status: 429
})
}

if (userRecentStream >= 5) {
    return NextResponse.json({
        message: "Rate limit exceeded: You can only add 5 songs per 10 minutes"
    }, {
        status: 429
    });
}
}

const existingUser = await prisma.stream.count({
    where: {
        userId: data.creatorId,
        played: false
    }
})

if(existingUser >= 20){
    return NextResponse.json({
        message: "queue is full"
    }, {
        status: 429
    })
}
const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1);

const stream = await prisma.stream.create({
    data: {
        userId: data.creatorId,
        addedBy: user.id,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "Can't find video",
        smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
        bigImg: thumbnails[thumbnails.length - 1].url ?? "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg"
    }
})
return NextResponse.json({
    ...stream,
    hasUpvoted: false,
    upvotes: 0
})
   }catch(error){
    console.log(error);
    return NextResponse.json({
        message: "something went wrong with the request"
    })
   }

}


export async function GET(req: NextRequest){
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const session = await getServerSession();
    const user  = await prisma.user.findFirst({
        where: {
            email: session?.user?.email || ""
        }
    })
    if(!user){
        return NextResponse.json({
            message: "user is not logged in"
        },{
            status: 403
        }
    )
    }
    if(!creatorId){
        return NextResponse.json({
            message: "error, no creatorID"
        },
    {
        status: 411
    })
    }
    const [streams, activeSteam] = await Promise.all([
        prisma.stream.findMany({
            where: {
                userId: creatorId,
                played: false
            },
            include: {
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
        }),
        prisma.currentStream.findFirst({
            where: {
                userId: creatorId
            },
            include: {
                stream: true
            }
        })
    ])
    const isCreator = user.id === creatorId;
    
    return NextResponse.json({
        streams: streams.map(({_count, ...rest}) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: rest.upvotes.length ? true : false
        })),
        //@ts-ignore
        activeStream,
        creatorId,
        isCreator
    });
}