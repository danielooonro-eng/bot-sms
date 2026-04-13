import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse, badRequest } from '@/lib/api-utils'
import { BotSettings } from '@/lib/types'

// Default settings
const DEFAULT_SETTINGS: BotSettings = {
  id: 'default',
  max_users: 1000,
  max_numbers_per_user: 5,
  credit_price: 1,
  min_credits_to_buy: 1,
  sms_timeout_minutes: 20,
  maintenance_mode: false,
  updated_at: new Date(),
}

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Fetch from Supabase
    // For now, return default settings
    return NextResponse.json(
      successResponse(DEFAULT_SETTINGS, 'Settings retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      max_users,
      max_numbers_per_user,
      credit_price,
      min_credits_to_buy,
      sms_timeout_minutes,
      maintenance_mode,
    } = body

    // Validate input
    if (
      max_users !== undefined && typeof max_users !== 'number' ||
      max_numbers_per_user !== undefined && typeof max_numbers_per_user !== 'number'
    ) {
      return NextResponse.json(
        badRequest('Invalid input values'),
        { status: 400 }
      )
    }

    // TODO: Save to Supabase
    const updatedSettings: BotSettings = {
      id: 'default',
      max_users: max_users || DEFAULT_SETTINGS.max_users,
      max_numbers_per_user: max_numbers_per_user || DEFAULT_SETTINGS.max_numbers_per_user,
      credit_price: credit_price || DEFAULT_SETTINGS.credit_price,
      min_credits_to_buy: min_credits_to_buy || DEFAULT_SETTINGS.min_credits_to_buy,
      sms_timeout_minutes: sms_timeout_minutes || DEFAULT_SETTINGS.sms_timeout_minutes,
      maintenance_mode: maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
      updated_at: new Date(),
    }

    return NextResponse.json(
      successResponse(updatedSettings, 'Settings updated successfully')
    )
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
