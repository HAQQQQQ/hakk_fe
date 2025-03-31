import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    console.log('Incoming URL:', req.url);

    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role } = body;
    console.log(JSON.stringify({ public_metadata: { role } }))

    try {
        const response = await fetch(`https://api.clerk.dev/v1/users/${userId}/metadata`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ public_metadata: { role } }),
        });

        console.log('Updated successfully', response.status)

        if (!response.ok) {
            throw new Error("Failed to update metadata");
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
