'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SelectRolePage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [role, setRole] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        const hasRole = user?.publicMetadata?.role;

        if (hasRole) {
            // Skip if already set
            router.replace('/');
        }
    }, [isLoaded, user, router]);

    const handleSubmit = async () => {
        if (!role) return;
        setSubmitting(true);

        await fetch('/api/set-user-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
        });

        router.push('/');
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-4 border rounded shadow space-y-4">
            <h1 className="text-xl font-bold text-center">Select Role</h1>

            <div>
                <label className="block font-medium mb-1">Role</label>
                <select
                    className="w-full p-2 border rounded"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="">Select role</option>
                    <option value="participant">Participant</option>
                    <option value="coordinator">Coordinator</option>
                </select>
            </div>

            <button
                className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                onClick={handleSubmit}
                disabled={!role || submitting}
            >
                {submitting ? 'Saving...' : 'Continue'}
            </button>
        </div>
    );
}
