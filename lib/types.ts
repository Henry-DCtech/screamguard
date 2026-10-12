export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string | null;
  is_primary: boolean;
  fcm_token: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  confidence: number;
  address: string | null;
  status: 'sent' | 'delivered' | 'acknowledged' | 'false_alarm';
  audio_clip_url: string | null;
  sms_sent: boolean;
  push_sent: boolean;
  created_at: string;
}

export interface DeviceSettings {
  id: string;
  user_id: string;
  sensitivity: number;
  monitoring_enabled: boolean;
  consecutive_detections: number;
  cooldown_seconds: number;
  updated_at: string;
}
