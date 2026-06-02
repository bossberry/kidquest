import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dgpsnlkedergkbhqnjpu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_I9xmeXgWqRhvdn-kyyn_AQ_noLWfW2l'

export let supabase = null
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
} catch (e) {
  console.warn('Supabase init failed:', e)
}
