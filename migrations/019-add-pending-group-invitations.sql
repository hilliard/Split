-- Create pending_group_invitations table for email-based invitations
CREATE TABLE IF NOT EXISTS pending_group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  invited_by uuid NOT NULL REFERENCES humans(id) ON DELETE CASCADE,
  status varchar(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
  invited_at timestamp NOT NULL DEFAULT NOW(),
  expires_at timestamp,
  accepted_at timestamp,
  CONSTRAINT unique_pending_invitation UNIQUE(group_id, email, status)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS pending_invitations_group_email_idx 
  ON pending_group_invitations(group_id, email);

CREATE INDEX IF NOT EXISTS pending_invitations_status_idx 
  ON pending_group_invitations(status);

CREATE INDEX IF NOT EXISTS pending_invitations_email_idx 
  ON pending_group_invitations(email);
