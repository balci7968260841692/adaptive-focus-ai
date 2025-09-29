-- Create table for storing app usage data
CREATE TABLE public.app_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_name TEXT NOT NULL,
  app_package TEXT,
  category TEXT NOT NULL,
  time_used INTEGER NOT NULL DEFAULT 0, -- in minutes
  time_limit INTEGER NOT NULL DEFAULT 60, -- in minutes
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_name, usage_date)
);

-- Enable RLS
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own app usage" 
ON public.app_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own app usage" 
ON public.app_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app usage" 
ON public.app_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app usage" 
ON public.app_usage 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for daily screen time summaries
CREATE TABLE public.screen_time_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_screen_time INTEGER NOT NULL DEFAULT 0, -- in minutes
  daily_limit INTEGER NOT NULL DEFAULT 360, -- 6 hours default
  trust_score INTEGER NOT NULL DEFAULT 100,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.screen_time_summary ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own screen time summary" 
ON public.screen_time_summary 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screen time summary" 
ON public.screen_time_summary 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screen time summary" 
ON public.screen_time_summary 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for timestamp updates
CREATE TRIGGER update_app_usage_updated_at
BEFORE UPDATE ON public.app_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screen_time_summary_updated_at
BEFORE UPDATE ON public.screen_time_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_app_usage_user_date ON public.app_usage(user_id, usage_date);
CREATE INDEX idx_screen_time_summary_user_date ON public.screen_time_summary(user_id, usage_date);