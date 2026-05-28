import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { usuario_sistema_id, auth_user_id } = await req.json();

    if (!usuario_sistema_id) {
      return new Response(JSON.stringify({ error: 'usuario_sistema_id es requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar que el solicitante no se está eliminando a sí mismo
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await supabaseClient.auth.getUser();

    if (caller && auth_user_id && caller.id === auth_user_id) {
      return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Eliminar roles del usuario
    await supabaseAdmin
      .from('usuario_rol')
      .delete()
      .eq('usuario_id', usuario_sistema_id);

    // 2. Eliminar registro en usuario_sistema
    const { error: dbError } = await supabaseAdmin
      .from('usuario_sistema')
      .delete()
      .eq('id', usuario_sistema_id);

    if (dbError) throw dbError;

    // 3. Eliminar de Supabase Auth si se proporcionó el auth_user_id
    if (auth_user_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
      if (authError) throw authError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
