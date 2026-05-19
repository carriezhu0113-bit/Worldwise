// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://oqcdhkhxodifxhevqusr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_njoQhSyOTW7aTRwteqq24g_Y5l6pkNV';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// ==================== DATA STORE ====================
const TEACHER_PASSWORD = 'teacher888';
let currentUser = null;
let currentTab = 'dashboard';
let currentTeacherTab = 'overview';
