import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://llnspdxlzyoblznxcchz.supabase.co', 'sb_publishable_E5BTs3TzYLjUcFz-dy_11A_vor2XJHf');

async function test() {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-auth-agent-${Date.now()}@gmail.com`,
      password: 'password123'
    });
    if (authError) {
      console.error('Auth Error:', authError.message);
      return;
    }
    console.log('User created:', authData.user?.id);
    
    // Attempt to insert/fetch a profile
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .maybeSingle();
      
    if (profError) {
      console.error('Profile DB Error:', profError.message);
    } else {
      console.log('Profile fetched:', profile);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}
test();
