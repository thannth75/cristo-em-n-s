-- ========================================
-- SISTEMA DE CÉLULAS (PEQUENOS GRUPOS)
-- ========================================

-- Tabela de células
CREATE TABLE public.cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL,
  meeting_day TEXT, -- 'segunda', 'terça', etc
  meeting_time TIME,
  meeting_location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Membros das células
CREATE TABLE public.cell_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'membro', -- 'lider', 'co-lider', 'membro'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cell_id, user_id)
);

-- Encontros/Reuniões das células
CREATE TABLE public.cell_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  topic TEXT,
  notes TEXT,
  attendance_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Presença nos encontros
CREATE TABLE public.cell_meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.cell_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attended_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_cell_members_cell_id ON public.cell_members(cell_id);
CREATE INDEX idx_cell_members_user_id ON public.cell_members(user_id);
CREATE INDEX idx_cell_meetings_cell_id ON public.cell_meetings(cell_id);
CREATE INDEX idx_cell_meetings_date ON public.cell_meetings(meeting_date);

-- RLS Policies for cells
CREATE POLICY "Approved users can view active cells"
ON public.cells FOR SELECT
USING (is_user_approved(auth.uid()) AND is_active = true);

CREATE POLICY "Leaders can manage cells"
ON public.cells FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- RLS Policies for cell_members
CREATE POLICY "Approved users can view cell members"
ON public.cell_members FOR SELECT
USING (is_user_approved(auth.uid()));

CREATE POLICY "Leaders can manage cell members"
ON public.cell_members FOR ALL
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Users can join cells"
ON public.cell_members FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can leave cells"
ON public.cell_members FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for cell_meetings
CREATE POLICY "Approved users can view cell meetings"
ON public.cell_meetings FOR SELECT
USING (is_user_approved(auth.uid()));

CREATE POLICY "Leaders can manage cell meetings"
ON public.cell_meetings FOR ALL
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Cell leaders can create meetings"
ON public.cell_meetings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cell_members
    WHERE cell_id = cell_meetings.cell_id
    AND user_id = auth.uid()
    AND role IN ('lider', 'co-lider')
  )
);

-- RLS Policies for cell_meeting_attendance
CREATE POLICY "Approved users can view attendance"
ON public.cell_meeting_attendance FOR SELECT
USING (is_user_approved(auth.uid()));

CREATE POLICY "Leaders can manage attendance"
ON public.cell_meeting_attendance FOR ALL
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Members can record their attendance"
ON public.cell_meeting_attendance FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_cells_updated_at
BEFORE UPDATE ON public.cells
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();