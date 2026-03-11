import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret to ensure random people can't trigger this URL
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch ALL active connections across ALL users
    const activeConnections = await db.collection('cloud_connections')
      .where('sync_status', '==', 'active')
      .get();

    // 3. Loop through them and trigger the sync logic (similar to your analyze-costs route)
    // For brevity in this instruction, you would map through activeConnections.docs
    // and run the AWS Cost Explorer fetch for each one, saving the results.
    
    // Example placeholder:
    console.log(`Starting automated sync for ${activeConnections.size} accounts...`);
    
    return NextResponse.json({ success: true, message: `Synced ${activeConnections.size} accounts.` });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Cron Failed" }, { status: 500 });
  }
}