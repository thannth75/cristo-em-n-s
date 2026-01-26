-- Tabela de provas/avaliações criadas pelos líderes
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  exam_type TEXT NOT NULL DEFAULT 'prova', -- prova, trabalho, participacao
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notas individuais dos jovens
CREATE TABLE public.exam_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score NUMERIC(5,2),
  notes TEXT,
  graded_by UUID NOT NULL,
  graded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para evitar notas duplicadas
CREATE UNIQUE INDEX idx_exam_grades_unique ON public.exam_grades(exam_id, user_id);

-- Habilitar RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_grades ENABLE ROW LEVEL SECURITY;

-- Políticas para exams
CREATE POLICY "Approved users can view exams"
ON public.exams FOR SELECT
USING (is_user_approved(auth.uid()));

CREATE POLICY "Leaders and admins can create exams"
ON public.exams FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Leaders and admins can update exams"
ON public.exams FOR UPDATE
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Leaders and admins can delete exams"
ON public.exams FOR DELETE
USING (is_admin_or_leader(auth.uid()));

-- Políticas para exam_grades
CREATE POLICY "Users can view their own grades"
ON public.exam_grades FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_leader(auth.uid()));

CREATE POLICY "Leaders and admins can manage grades"
ON public.exam_grades FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Leaders and admins can update grades"
ON public.exam_grades FOR UPDATE
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Leaders and admins can delete grades"
ON public.exam_grades FOR DELETE
USING (is_admin_or_leader(auth.uid()));

-- View para calcular score de frequência
CREATE OR REPLACE VIEW public.attendance_scores AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  COUNT(DISTINCT a.event_id) as events_attended,
  (SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months') as total_events,
  CASE 
    WHEN (SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months') = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT a.event_id)::NUMERIC / 
       NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) * 100, 
      1
    )
  END as attendance_percentage,
  CASE 
    WHEN (SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months') = 0 THEN 'sem_dados'
    WHEN (COUNT(DISTINCT a.event_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) >= 0.8 THEN 'excelente'
    WHEN (COUNT(DISTINCT a.event_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) >= 0.6 THEN 'bom'
    WHEN (COUNT(DISTINCT a.event_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) >= 0.4 THEN 'regular'
    ELSE 'baixa'
  END as status
FROM profiles p
LEFT JOIN attendance a ON a.user_id = p.user_id 
  AND a.checked_in_at >= CURRENT_DATE - INTERVAL '3 months'
WHERE p.is_approved = true
GROUP BY p.user_id, p.full_name, p.avatar_url;

-- Trigger para updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();