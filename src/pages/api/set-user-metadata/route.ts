import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gender, role } = await req.json();

    if (!gender || !role) {
        return NextResponse.json({ error: 'Gender and role are required' }, { status: 400 });
    }

    await clerkClient.users.updateUser(userId, {
        publicMetadata: {
            role, // e.g., 'participant' or 'coordinator'
        },
        privateMetadata: {
            gender, // e.g., 'male', 'female', 'non-binary', etc.
        },
    });

    return NextResponse.json({ success: true });
}
