import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Get the user's active AWS connection from Firestore
    const connectionsSnapshot = await db.collection('cloud_connections')
      .where('user_uid', '==', userId)
      .where('sync_status', '==', 'active')
      .limit(1)
      .get();

    if (connectionsSnapshot.empty) {
      return NextResponse.json({ error: "No active AWS connections found." }, { status: 404 });
    }

    const connectionDoc = connectionsSnapshot.docs[0];
    const connectionData = connectionDoc.data();
    const connectionId = connectionDoc.id;

    // 2. Assume the User's IAM Role
    const stsClient = new STSClient({ region: "us-east-1" });
    const assumedRole = await stsClient.send(new AssumeRoleCommand({
      RoleArn: connectionData.aws_role_arn,
      RoleSessionName: "NimbusGuardDataSync",
      DurationSeconds: 900,
    }));

    // 3. Initialize Cost Explorer
    const ceClient = new CostExplorerClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: assumedRole.Credentials!.AccessKeyId!,
        secretAccessKey: assumedRole.Credentials!.SecretAccessKey!,
        sessionToken: assumedRole.Credentials!.SessionToken!,
      },
    });

    // 4. Set Time Period (Last 7 Days)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const startStr = lastWeek.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    // 5. Fetch Data Grouped by Service
    const costCommand = new GetCostAndUsageCommand({
      TimePeriod: { Start: startStr, End: endStr },
      Granularity: "DAILY",
      Metrics: ["UnblendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }]
    });

    const awsResponse = await ceClient.send(costCommand);

    if (!awsResponse.ResultsByTime || awsResponse.ResultsByTime.length === 0) {
      return NextResponse.json({ message: "No cost data found in AWS." }, { status: 200 });
    }

    // 6. Process the AWS Data into our format
    let totalNormalCost = 0;
    const processedDays = awsResponse.ResultsByTime.map(day => {
      let dailyTotal = 0;
      const serviceBreakdown: Record<string, number> = {};

      day.Groups?.forEach(group => {
        const serviceName = group.Keys?.[0]?.replace(/ /g, '_') || "Unknown";
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || "0");
        if (cost > 0) {
          serviceBreakdown[serviceName] = cost;
          dailyTotal += cost;
        }
      });

      return {
        date: day.TimePeriod?.Start || "",
        total_cost: dailyTotal,
        service_breakdown: serviceBreakdown
      };
    });

    // 7. Anomaly Detection Engine
    // Calculate the baseline using days 1-6
    const baselineDays = processedDays.slice(0, processedDays.length - 1);
    const latestDay = processedDays[processedDays.length - 1];
    
    baselineDays.forEach(day => totalNormalCost += day.total_cost);
    const baselineAverage = baselineDays.length > 0 ? (totalNormalCost / baselineDays.length) : 0;
    
    // Determine if the latest day is an anomaly (e.g., > 20% spike and over $5)
    const anomalyThreshold = baselineAverage * 1.2; 
    const isAnomaly = latestDay.total_cost > anomalyThreshold && latestDay.total_cost > 5;

    // 8. Batch Write to Firestore (Upsert logic to avoid duplicates)
    const batch = db.batch();
    
    processedDays.forEach(day => {
      // Create a predictable document ID: "connectionId_YYYY-MM-DD"
      const docId = `${connectionId}_${day.date}`;
      const docRef = db.collection('daily_cost_metrics').doc(docId);
      
      const isLatestDayAnomaly = (day.date === latestDay.date) && isAnomaly;

      batch.set(docRef, {
        user_uid: userId,
        connection_id: connectionId,
        date: day.date,
        currency: "USD",
        total_cost: day.total_cost,
        service_breakdown: day.service_breakdown,
        is_anomaly: isLatestDayAnomaly,
        updated_at: new Date().toISOString() // Track when we last synced
      }, { merge: true }); // Merge ensures we update existing days rather than duplicating
    });

    // If there is an anomaly, log an official report
    if (isAnomaly) {
      // Find the service that caused the spike
      const sortedServices = Object.entries(latestDay.service_breakdown)
        .sort((a, b) => b[1] - a[1]);
      const primaryService = sortedServices.length > 0 ? sortedServices[0][0] : "Multiple_Services";

      const reportRef = db.collection('anomaly_reports').doc(`${connectionId}_${latestDay.date}`);
      batch.set(reportRef, {
        user_id: userId,
        connection_id: connectionId,
        detected_on: new Date().toISOString(),
        actual_cost: latestDay.total_cost,
        expected_cost: baselineAverage,
        implicated_service: primaryService,
        severity: latestDay.total_cost > (baselineAverage * 2) ? "Critical" : "High",
        status: "Investigating"
      });
    }

    // Commit all database writes at once
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: "Data synced successfully!",
      isAnomalyDetected: isAnomaly
    }, { status: 200 });

  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}