// Supabase client compartido para toda la app
const SUPABASE_URL = 'https://ginnudktkcdulhqekdoe.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpbm51ZGt0a2NkdWxocWVrZG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTQ1NzMsImV4cCI6MjA5NjA3MDU3M30.We83eVpDJdbGCH6d07RbYTsj_HDnwx61EjhOfEQR75o'
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
