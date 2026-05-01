-- Atomic loyalty reward redemption RPC.
-- Replaces the three-step client-side sequence in use-loyalty.ts (insert redemption,
-- update balance, insert transaction) with a single transactional function.
CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(
  p_member_id UUID,
  p_reward_id  UUID
)
RETURNS TABLE (
  success  BOOLEAN,
  code     TEXT,
  message  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member  loyalty_members%ROWTYPE;
  v_reward  loyalty_rewards%ROWTYPE;
  v_code    TEXT;
BEGIN
  -- Lock the member row to prevent concurrent redemptions racing each other
  SELECT * INTO v_member
  FROM loyalty_members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, 'Member not found'::TEXT;
    RETURN;
  END IF;

  -- Caller must own the member record
  IF v_member.user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, 'Unauthorized'::TEXT;
    RETURN;
  END IF;

  -- Fetch and validate the reward
  SELECT * INTO v_reward
  FROM loyalty_rewards
  WHERE id = p_reward_id AND active = TRUE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, 'Reward not found or inactive'::TEXT;
    RETURN;
  END IF;

  -- Check sufficient balance
  IF v_member.points_balance < v_reward.points_required THEN
    RETURN QUERY SELECT
      FALSE,
      ''::TEXT,
      ('You need ' || (v_reward.points_required - v_member.points_balance)::TEXT
        || ' more points to redeem this reward')::TEXT;
    RETURN;
  END IF;

  -- Generate code using the existing helper (trigger is a no-op when code != '')
  v_code := generate_reward_code();

  -- Insert redemption
  INSERT INTO loyalty_redemptions (member_id, reward_id, points_spent, code)
  VALUES (p_member_id, p_reward_id, v_reward.points_required, v_code);

  -- Deduct points
  UPDATE loyalty_members
  SET
    points_balance = points_balance - v_reward.points_required,
    updated_at     = now()
  WHERE id = p_member_id;

  -- Record transaction
  INSERT INTO loyalty_transactions (member_id, type, points, description)
  VALUES (p_member_id, 'redeem', -v_reward.points_required, 'Redeemed: ' || v_reward.name);

  RETURN QUERY SELECT TRUE, v_code, 'Success'::TEXT;
END;
$$;

-- Restrict to authenticated users only (ownership is enforced inside the function)
REVOKE ALL ON FUNCTION public.redeem_loyalty_reward(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(UUID, UUID) TO authenticated;
