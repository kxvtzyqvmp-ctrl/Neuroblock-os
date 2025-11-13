import { supabase } from './supabase';

export const generatePairingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createParentLink = async (parentProfileId: string): Promise<{ code: string; linkId: string } | null> => {
  try {
    const code = generatePairingCode();

    const { data, error } = await supabase
      .from('linked_accounts')
      .insert([
        {
          parent_id: parentProfileId,
          pairing_code: code,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating parent link:', error);
      return null;
    }

    return { code, linkId: data.id };
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

export const validatePairingCode = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('linked_accounts')
      .select('*')
      .eq('pairing_code', code)
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    if (data.created_at < fiveMinutesAgo) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error validating code:', error);
    return null;
  }
};

export const acceptParentLink = async (
  linkId: string,
  childProfileId: string,
  childName: string
): Promise<boolean> => {
  try {
    const { error: linkError } = await supabase
      .from('linked_accounts')
      .update({
        child_id: childProfileId,
        status: 'active',
        pairing_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId);

    if (linkError) {
      console.error('Error accepting link:', linkError);
      return false;
    }

    const { data: linkData } = await supabase
      .from('linked_accounts')
      .select('parent_id')
      .eq('id', linkId)
      .single();

    if (linkData) {
      await supabase
        .from('user_profiles')
        .update({
          role: 'child',
          linked_user_id: linkData.parent_id,
          display_name: childName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', childProfileId);

      await supabase
        .from('user_profiles')
        .update({
          role: 'parent',
          linked_user_id: childProfileId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkData.parent_id);
    }

    await supabase.from('link_history').insert([
      {
        linked_account_id: linkId,
        action: 'linked',
        performed_by: 'child',
        details: { child_name: childName },
      },
    ]);

    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
};

export const unlinkAccounts = async (
  linkId: string,
  performedBy: 'parent' | 'child'
): Promise<boolean> => {
  try {
    const { data: linkData } = await supabase
      .from('linked_accounts')
      .select('parent_id, child_id')
      .eq('id', linkId)
      .single();

    if (!linkData) return false;

    await supabase
      .from('linked_accounts')
      .update({
        status: 'unlinked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId);

    await supabase
      .from('user_profiles')
      .update({
        role: null,
        linked_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', [linkData.parent_id, linkData.child_id]);

    await supabase.from('link_history').insert([
      {
        linked_account_id: linkId,
        action: 'unlinked',
        performed_by: performedBy,
      },
    ]);

    return true;
  } catch (error) {
    console.error('Error unlinking accounts:', error);
    return false;
  }
};
