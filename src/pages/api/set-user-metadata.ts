import { auth } from '@clerk/nextjs/api'; ✅
import { clerkClient } from '@clerk/clerk-sdk-node';
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = await auth();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }

    try {
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: { role },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating user metadata:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
