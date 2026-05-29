-- Polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id TEXT PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id),
  created_by TEXT REFERENCES public.users(id),
  question TEXT NOT NULL,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Poll options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0
);

-- Poll votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id TEXT REFERENCES public.poll_options(id),
  user_id TEXT REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (poll_id, user_id, option_id)
);

-- Add poll reference to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS poll_id TEXT REFERENCES public.polls(id);

-- Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members select polls" ON public.polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = circle_id AND auth.uid()::text = member
    )
  );

CREATE POLICY "Circle members insert polls" ON public.polls
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = circle_id AND auth.uid()::text = member
    )
  );

CREATE POLICY "Circle creators update polls" ON public.polls
  FOR UPDATE USING (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = circle_id AND auth.uid()::text = member
    )
  ) WITH CHECK (
    auth.uid()::text = created_by
  );

CREATE POLICY "Circle members select poll options" ON public.poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = (
        SELECT circle_id FROM public.polls WHERE id = poll_id
      )
      AND auth.uid()::text = member
    )
  );

CREATE POLICY "Poll creator insert options" ON public.poll_options
  FOR INSERT WITH CHECK (
    auth.uid()::text = (
      SELECT created_by FROM public.polls WHERE id = poll_id
    )
  );

CREATE POLICY "Circle members select poll votes" ON public.poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = (
        SELECT circle_id FROM public.polls WHERE id = poll_id
      )
      AND auth.uid()::text = member
    )
  );

CREATE POLICY "Users insert poll votes" ON public.poll_votes
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id AND
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = (
        SELECT circle_id FROM public.polls WHERE id = poll_id
      )
      AND auth.uid()::text = member
    )
  );

CREATE POLICY "Users delete own poll votes" ON public.poll_votes
  FOR DELETE USING (
    auth.uid()::text = user_id AND
    EXISTS (
      SELECT 1 FROM public.circles, unnest(members) AS member
      WHERE id = (
        SELECT circle_id FROM public.polls WHERE id = poll_id
      )
      AND auth.uid()::text = member
    )
  );

notify pgrst, 'reload schema';
