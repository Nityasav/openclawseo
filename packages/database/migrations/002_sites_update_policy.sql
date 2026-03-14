-- Fix: add missing UPDATE policy for sites table
-- Without this, updating gsc_property_url / ga4_property_id via the anon client
-- silently returns 0 rows, breaking the GSC/GA4 property selection flow.

CREATE POLICY "Org admins/members can update sites" ON sites
  FOR UPDATE USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'))
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
