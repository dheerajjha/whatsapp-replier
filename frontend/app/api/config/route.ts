import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/config`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch config: ${response.statusText}`);
        }
        const config = await response.json();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Config fetch error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch config' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${BACKEND_URL}/config`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to update config: ${response.statusText}`);
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Config update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update config' },
            { status: 500 }
        );
    }
} 