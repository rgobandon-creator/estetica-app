
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eshwqowvtgepniomytmy.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaHdxb3d2dGdlcG5pb215dG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDU5OTMsImV4cCI6MjA5Njg4MTk5M30.I1fesHE6p6hSl4CpOCS_24HikRdZlmXXOkUBPjGZOwY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)