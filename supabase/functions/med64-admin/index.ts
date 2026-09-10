import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const secretMapRaw = Deno.env.get('SUPABASE_SECRET_KEYS')
  const serviceKey = secretMapRaw ? JSON.parse(secretMapRaw).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey) return json({ error: 'Server secret is not configured' }, 500)
  const admin = createClient(supabaseUrl, serviceKey)

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Authentication required' }, 401)

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return json({ error: 'Invalid session' }, 401)

  const { data: caller, error: callerError } = await admin
    .from('profiles').select('id,username,role,active').eq('id', authData.user.id).single()
  if (callerError || !caller || caller.role !== 'admin' || !caller.active) {
    return json({ error: 'Admin access required' }, 403)
  }

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const action = body?.action

  if (action === 'create_student') {
    const username = String(body.username || '').trim().toLowerCase()
    const password = String(body.password || '')
    const displayName = String(body.displayName || username).trim()
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) return json({ error: 'User ID must be 3-40 characters: letters, numbers, dot, underscore or hyphen.' }, 400)
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400)

    // Synthetic internal email keeps the student-facing login as a simple ID.
    const email = `${username}@users.med64.local`
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName, role: 'student' }
    })
    if (createError) return json({ error: createError.message }, 400)

    const { error: profileError } = await admin.from('profiles').upsert({
      id: created.user.id, username, display_name: displayName, role: 'student', active: true
    })
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: profileError.message }, 400)
    }
    return json({ ok: true, id: created.user.id, username })
  }

  if (action === 'list_users') {
    const { data, error } = await admin.from('profiles').select('id,username,display_name,role,active,created_at').order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 400)
    return json({ users: data })
  }

  if (action === 'set_user_active') {
    const userId = String(body.userId || '')
    const active = Boolean(body.active)
    if (!userId) return json({ error: 'Missing userId' }, 400)
    const { data: target } = await admin.from('profiles').select('id,role').eq('id', userId).single()
    if (!target) return json({ error: 'User not found' }, 404)
    if (target.role === 'admin' && !active) return json({ error: 'This action cannot disable an admin from this screen.' }, 400)
    const { error } = await admin.from('profiles').update({ active }).eq('id', userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (action === 'delete_student') {
    const userId = String(body.userId || '')
    const { data: target } = await admin.from('profiles').select('id,role').eq('id', userId).single()
    if (!target) return json({ error: 'User not found' }, 404)
    if (target.role !== 'student') return json({ error: 'Only student accounts can be deleted here.' }, 400)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (action === 'reset_student_password') {
    const userId = String(body.userId || '')
    const password = String(body.password || '')
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400)
    const { data: target } = await admin.from('profiles').select('id,role').eq('id', userId).single()
    if (!target || target.role !== 'student') return json({ error: 'Student not found' }, 404)
    const { error } = await admin.auth.admin.updateUserById(userId, { password })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (action === 'bootstrap_admin') {
    return json({ error: 'Create the first admin manually as described in README, then use this function for students.' }, 400)
  }

  return json({ error: 'Unknown action' }, 400)
})
