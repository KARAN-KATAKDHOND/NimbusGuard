export interface UserProfile {
  uid: string; 
  full_name: string;
  email: string;
  subscription_tier: 'free' | 'pro_tier' | 'enterprise';
  created_at: Date | string;
  alert_preferences: {
    email_alerts: boolean;
    slack_webhook_url: string;
  };
}

export interface CloudConnection {
  id: string; 
  user_uid: string;
  provider: string; // e.g., 'AWS', 'GCP'
  aws_account_id: string;
  account_alias: string;
  aws_role_arn: string;
  last_synced_at: Date | string;
  sync_status: 'active' | 'failed' | 'pending';
}

export interface DailyCostMetric {
  id: string; 
  user_uid: string;
  connection_id: string;
  date: Date | string;
  currency: string;
  total_cost: number;
  is_anomaly: boolean; // Maps to 'is_anamoly' in your DB
  service_breakdown: Record<string, number>; // e.g., { "Amazon_EC2": 135.00, "AWS_Lambda": 12.00 }
}

export interface AnomalyReport {
  id: string; 
  user_id: string;
  collection_id: string; 
  detected_on: Date | string;
  actual_cost: number;
  expected_cost: number;
  implicated_service: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Investigating' | 'Resolved' | 'Ignored';
}