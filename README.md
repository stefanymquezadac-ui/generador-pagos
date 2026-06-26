import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://imjmwnmjtluokjshxgub.supabase.co'
const SUPABASE_KEY = 'sb_publishable_V9o7KR_g68_smTXuLQS5Sw_qVoagqw0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
