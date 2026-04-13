// User types
export type BotUser = {
  id: string
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  credits: number
  blocked: boolean
  created_at: Date
  last_activity?: Date
  rented_numbers: RentedNumber[]
  transactions: Transaction[]
}

export type RentedNumber = {
  id: string
  user_id: string
  phone_number: string
  service: string
  country: string
  price: number
  rented_at: Date
  returned_at?: Date
  is_active: boolean
}

export type Transaction = {
  id: string
  user_id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  created_at: Date
  metadata?: Record<string, any>
}

export type AuditLog = {
  id: string
  action: string
  user_id?: string
  admin_id: string
  description: string
  metadata?: Record<string, any>
  created_at: Date
}

export type Notification = {
  id: string
  recipient_id?: string
  message: string
  title?: string
  is_sent: boolean
  sent_at?: Date
  created_at: Date
  created_by: string
}

export type BotSettings = {
  id: string
  max_users?: number
  max_numbers_per_user?: number
  credit_price?: number
  min_credits_to_buy?: number
  sms_timeout_minutes?: number
  maintenance_mode?: boolean
  updated_at: Date
}

// Form types
export type LoginFormData = {
  email: string
  password: string
}

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// API Response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard metrics
export type DashboardMetrics = {
  total_users: number
  active_users_7d: number
  active_users_30d: number
  total_rented_numbers: number
  total_revenue: number
  growth_rate: number
}

// Chart data types
export type CountryStats = {
  country: string
  count: number
}

export type ServiceStats = {
  service: string
  count: number
}

export type RevenueData = {
  date: string
  revenue: number
}

export type UserActivityData = {
  date: string
  new_users: number
}