import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin';
import mockData from '../../../data/mockBilling.json';

export async function GET() {
  try {
    // 1. In a real app, you would fetch this from AWS Cost Explorer API
    const billingData = mockData;

    // 2. Calculate the "Baseline" (Average of the normal days)
    // We take all days except the last one to find our normal baseline
    const normalDays = billingData.slice(0, billingData.length - 1);
    const totalNormalCost = normalDays.reduce((sum, day) => sum + day.cost, 0);
    const baselineAverage = totalNormalCost / normalDays.length;

    // 3. Analyze the latest day (The 7th day)
    const latestDay = billingData[billingData.length - 1];
    const anomalyThreshold = baselineAverage * 1.2; // 20% spike threshold
    const isAnomaly = latestDay.cost > anomalyThreshold;

    const report = {
      user_uid: "demo-user-123", // In production, this comes from Firebase Auth
      connection_id: "aws-prod-env-xyz",
      detected_on: new Date().toISOString(), // Using ISO string for easy JSON serialization
      severity: latestDay.cost > baselineAverage * 2 ? "High" : "Low",
      expected_cost: parseFloat(baselineAverage.toFixed(2)),
      actual_cost: latestDay.cost,
      implicated_service: "Amazon_EC2", // Hardcoded for demo, normally extracted from data
      status: "Investigating"
    };

    // 4. Push to Firebase if it's an anomaly
    if (isAnomaly) {
      // Add to anomaly_reports collection
      const anomalyRef = await db.collection('anomaly_reports').add(report);
      
      // Also save the daily metric
      await db.collection('daily_cost_metrics').add({
        ...report,
        date: latestDay.date,
        is_anomaly: true,
        service_breakdown: latestDay.serviceBreakdown
      });

      return NextResponse.json({ 
        success: true, 
        message: "Anomaly detected and logged to Firebase!", 
        baseline: baselineAverage,
        spike: latestDay.cost,
        firebase_id: anomalyRef.id 
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: "Costs are normal. No anomalies." });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}