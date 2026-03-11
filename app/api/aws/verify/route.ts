import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

export async function POST(request: Request) {
  try {
    const { connectionId } = await request.json();

    if (!connectionId) {
      return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
    }

    // 1. Fetch the pending connection from Firestore using Admin SDK
    const connectionRef = db.collection('cloud_connections').doc(connectionId);
    const connectionDoc = await connectionRef.get();

    if (!connectionDoc.exists) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const connectionData = connectionDoc.data();
    const targetRoleArn = connectionData?.aws_role_arn;

    // 2. Initialize STS to assume the user's role
    // This uses your app's AWS credentials automatically from process.env
    // (You will need AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env.local later)
    const stsClient = new STSClient({ region: "us-east-1" });
    
    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: targetRoleArn,
      RoleSessionName: "NimbusGuardVerificationSession",
      DurationSeconds: 900, // 15 minutes is the minimum session time
    });

    const assumedRole = await stsClient.send(assumeRoleCommand);

    if (!assumedRole.Credentials) {
      throw new Error("Failed to assume role: No credentials returned.");
    }

    // 3. Initialize Cost Explorer using the temporary credentials we just got
    const ceClient = new CostExplorerClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: assumedRole.Credentials.AccessKeyId!,
        secretAccessKey: assumedRole.Credentials.SecretAccessKey!,
        sessionToken: assumedRole.Credentials.SessionToken!,
      },
    });

    // 4. Do a dry-run test to ensure we have permissions (fetching yesterday's cost)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Format dates to YYYY-MM-DD for AWS
    const start = yesterday.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];

    const testCommand = new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Granularity: "DAILY",
      Metrics: ["UnblendedCost"],
    });

    // If they didn't give us the right permissions, this will throw an error
    await ceClient.send(testCommand);

    // 5. If it didn't throw an error, it works! Update Firestore status to active.
    await connectionRef.update({
      sync_status: "active",
      last_synced_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: "AWS Account verified and connected successfully!" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("AWS Verification Error:", error);
    
    // If we fail, we could optionally update the DB to status: "failed" here
    return NextResponse.json({ 
      error: "Failed to verify AWS connection.", 
      details: error.message 
    }, { status: 500 });
  }
}