import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar que quien llama está autenticado (debe ser un admin)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cliente con service_role para crear usuarios (seguro en el servidor)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar que el solicitante es un usuario válido del sistema
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Leer body
    const { email, password, nombre, rol_id } = await req.json();

    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: 'email, password y nombre son requeridos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirmar email automáticamente
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authUserId = authData.user.id;

    // 2. Crear registro en usuario_sistema
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario_sistema')
      .insert({ auth_user_id: authUserId, nombre, email, is_active: true })
      .select('id')
      .single();

    if (usuarioError) {
      // Revertir: eliminar el usuario de auth si falla el registro
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(JSON.stringify({ error: usuarioError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Asignar rol si se proporcionó
    if (rol_id) {
      await supabaseAdmin
        .from('usuario_rol')
        .insert({ usuario_id: usuarioData.id, rol_id });
    }

    return new Response(
      JSON.stringify({ success: true, usuario_id: usuarioData.id, auth_user_id: authUserId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
