-- Initial data seed

-- Model pricing
INSERT INTO model_pricing (id, model_name, provider, cost_per_1k_tokens, avg_speed_ms, specialties, active)
VALUES
  ('m1', 'GPT-4', 'openai', 0.03, 800, '["complex reasoning", "code", "analysis"]', 1),
  ('m2', 'Claude 3', 'anthropic', 0.008, 600, '["writing", "safety", "accuracy"]', 1),
  ('m3', 'Mistral 7B', 'mistral', 0.0002, 150, '["speed", "cost", "general"]', 1),
  ('m4', 'Llama 2', 'meta', 0, 200, '["free", "local", "optimization"]', 1);

-- Task templates
INSERT INTO task_templates (id, task_type, icon, description, avg_tokens, tiers_config, active)
VALUES
  ('t1', 'copywriting', '✍️', 'Ad copy, emails, product descriptions', 300, '{
    "budget": {"models": ["Mistral", "Mistral"], "cost": 0.02, "time": 100, "quality": 8},
    "standard": {"models": ["GPT-4", "Mistral"], "cost": 0.50, "time": 400, "quality": 9, "recommended": true},
    "premium": {"models": ["GPT-4", "Claude3", "voting"], "cost": 3.00, "time": 1500, "quality": 9.5},
    "enterprise": {"models": ["GPT-4", "Claude3", "Mistral", "ensemble"], "cost": 12.00, "time": 2500, "quality": 9.8}
  }', 1),
  
  ('t2', 'blog', '📝', 'Articles, guides, long-form content', 2500, '{
    "budget": {"models": ["Mistral"], "cost": 0.05, "time": 2000, "quality": 7.5},
    "standard": {"models": ["GPT-4"], "cost": 2.50, "time": 4000, "quality": 9, "recommended": true},
    "premium": {"models": ["GPT-4", "Claude3", "editing"], "cost": 8.00, "time": 7000, "quality": 9.5},
    "enterprise": {"models": ["GPT-4", "Claude3", "Mistral"], "cost": 20.00, "time": 10000, "quality": 9.8}
  }', 1),
  
  ('t3', 'code', '🔧', 'Functions, components, scripts', 1200, '{
    "budget": {"models": ["Mistral"], "cost": 0.03, "time": 800, "quality": 8},
    "standard": {"models": ["GPT-4"], "cost": 3.00, "time": 2000, "quality": 9.2, "recommended": true},
    "premium": {"models": ["GPT-4", "Mistral"], "cost": 6.00, "time": 4000, "quality": 9.5},
    "enterprise": {"models": ["GPT-4", "Claude3", "Mistral"], "cost": 15.00, "time": 6000, "quality": 9.8}
  }', 1),
  
  ('t4', 'analysis', '📊', 'Data analysis, insights, research', 1800, '{
    "budget": {"models": ["Mistral"], "cost": 0.04, "time": 1200, "quality": 7.5},
    "standard": {"models": ["GPT-4", "Mistral"], "cost": 1.50, "time": 3000, "quality": 9, "recommended": true},
    "premium": {"models": ["GPT-4", "Claude3"], "cost": 6.00, "time": 5000, "quality": 9.6},
    "enterprise": {"models": ["GPT-4", "Claude3", "Mistral"], "cost": 18.00, "time": 8000, "quality": 9.8}
  }', 1),
  
  ('t5', 'support', '💬', 'Support replies, FAQs, auto-replies', 400, '{
    "budget": {"models": ["Mistral", "Llama2"], "cost": 0.001, "time": 80, "quality": 8},
    "standard": {"models": ["Mistral"], "cost": 0.008, "time": 150, "quality": 8.5, "recommended": true},
    "premium": {"models": ["GPT-4", "Mistral"], "cost": 0.50, "time": 600, "quality": 9.5},
    "enterprise": {"models": ["GPT-4", "Claude3"], "cost": 2.00, "time": 1200, "quality": 9.8}
  }', 1),
  
  ('t6', 'creative', '🎨', 'Brainstorming, ideas, creative writing', 2000, '{
    "budget": {"models": ["Mistral"], "cost": 0.06, "time": 2000, "quality": 7},
    "standard": {"models": ["GPT-4", "Claude3"], "cost": 3.50, "time": 4000, "quality": 9, "recommended": true},
    "premium": {"models": ["GPT-4", "Claude3", "Mistral"], "cost": 9.00, "time": 6000, "quality": 9.5},
    "enterprise": {"models": ["GPT-4", "Claude3", "Mistral"], "cost": 25.00, "time": 8000, "quality": 9.8}
  }', 1);
