import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Check for missing environment variables first to prevent hard HTML crashes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing Supabase ENV variables.' }, { status: 500 });
    }

    // Initialize clients INSIDE the try/catch block
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supabaseStandard = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 2. Extract the token and target user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { targetUserId } = await req.json();

    // 3. Verify the identity of the person making the request
    const { data: { user: requestingUser }, error: authError } = await supabaseStandard.auth.getUser(token);
    if (authError || !requestingUser) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // 4. Verify the requester is actually an Admin in the database
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    // 5. Generate the Silent Magic Link directly (Bypassing the auth.users check)
    // Supabase admin can generate a link via ID directly using admin.generateLink
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: (await supabaseAdmin.auth.admin.getUserById(targetUserId)).data?.user?.email || '',
    });

    if (linkError) throw linkError;

    // 6. Return the URL to the frontend
    return NextResponse.json({ url: linkData.properties.action_link });

  } catch (error: any) {
    console.error("IMPERSONATE API ERROR:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}