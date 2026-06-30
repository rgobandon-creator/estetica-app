import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eshwqowvtgepniomytmy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_7OTPkH0A2nd7vInTywowQw_s8-yrJpS'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
