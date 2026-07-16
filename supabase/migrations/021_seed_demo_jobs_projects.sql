-- ─────────────────────────────────────────────────────────────────────────────
-- DEMO SEED DATA  —  Delete/hide when real clients/companies start coming
-- All posts are linked to the admin user (tellitorg1@gmail.com)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Find admin user
  SELECT id INTO admin_id FROM auth.users WHERE email = 'tellitorg1@gmail.com' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;

  -- ── DEMO JOBS ─────────────────────────────────────────────────────────────
  INSERT INTO jobs (
    title, description, company_name, location, job_type,
    salary_min, salary_max, skills_required,
    status, poster_id, created_at
  ) VALUES

  ('Senior React Developer',
   'We are looking for an experienced React.js developer to join our product team. You will work on building scalable web applications for our e-commerce platform. Strong knowledge of Next.js, TypeScript, and REST APIs required. Remote-friendly startup, great culture.',
   'Nexus Technologies', 'Bengaluru (Remote)', 'full_time',
   80000, 150000, ARRAY['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
   'active', admin_id, now() - interval '1 day'),

  ('UI/UX Designer — Product',
   'Join our design team to craft beautiful, user-centric experiences for 500k+ users. You should have 2+ years of product design experience with Figma. We value systems thinking and attention to detail. Competitive salary + equity.',
   'Growthify India', 'Mumbai (Hybrid)', 'full_time',
   60000, 100000, ARRAY['Figma', 'UI Design', 'UX Research', 'Prototyping'],
   'active', admin_id, now() - interval '2 days'),

  ('Digital Marketing Manager',
   'Lead performance marketing campaigns across Google, Meta, and influencer channels. Must have hands-on experience with paid ads, SEO, and content strategy. We are a D2C brand growing 3x YoY and need someone to drive the next phase.',
   'UrbanKart', 'Delhi NCR', 'full_time',
   50000, 90000, ARRAY['Google Ads', 'Meta Ads', 'SEO', 'Content Marketing', 'Analytics'],
   'active', admin_id, now() - interval '3 days'),

  ('Backend Engineer — Python/FastAPI',
   'We are building AI-powered SaaS tools and need a strong backend engineer. You should know Python, FastAPI, PostgreSQL, and have basic familiarity with ML APIs. Remote-first, async culture, US-based startup with Indian team.',
   'Synthiq AI', 'Remote', 'remote',
   90000, 160000, ARRAY['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS'],
   'active', admin_id, now() - interval '4 days'),

  ('Content Writer — Tech & Finance',
   'Looking for a skilled content writer with knowledge of fintech, SaaS, or B2B technology. You will write blogs, case studies, whitepapers, and LinkedIn posts. 1-2 years experience preferred. Flexible hours.',
   'Contentra Media', 'Remote', 'remote',
   25000, 50000, ARRAY['Content Writing', 'SEO', 'Blog Writing', 'Copywriting'],
   'active', admin_id, now() - interval '5 days'),

  ('Mobile App Developer — Flutter',
   'We need a Flutter developer to build our consumer app for Android and iOS. You will work closely with design and backend teams. Experience with Firebase, REST APIs, and state management required. Equity available.',
   'AppBridge Labs', 'Pune (Hybrid)', 'full_time',
   70000, 130000, ARRAY['Flutter', 'Dart', 'Firebase', 'React Native', 'REST API'],
   'active', admin_id, now() - interval '6 days'),

  ('Social Media Manager',
   'Manage and grow our brand presence across Instagram, LinkedIn, Twitter, and YouTube. Create engaging content, run campaigns, and track analytics. Experience with reels and short-form video is a big plus.',
   'Brandify Studio', 'Mumbai', 'full_time',
   30000, 55000, ARRAY['Instagram Marketing', 'Social Media Marketing', 'Canva', 'Video Editing'],
   'active', admin_id, now() - interval '7 days'),

  ('DevOps Engineer',
   'We are scaling our infrastructure and need a DevOps engineer with strong AWS and Kubernetes experience. You will manage CI/CD pipelines, monitor uptime, and work with dev teams to improve deployment velocity.',
   'CloudScale India', 'Bengaluru', 'full_time',
   100000, 180000, ARRAY['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform'],
   'active', admin_id, now() - interval '8 days'),

  ('Sales Executive — SaaS',
   'We are hiring a SaaS sales executive to handle inbound leads and close mid-market deals. Must have 1+ year B2B sales experience. Good communication and CRM skills needed. Uncapped commission structure.',
   'Vendora CRM', 'Remote', 'full_time',
   35000, 70000, ARRAY['Sales Professional', 'CRM', 'B2B Sales'],
   'active', admin_id, now() - interval '9 days'),

  ('Graphic Designer — Brand Identity',
   'Looking for a creative graphic designer to handle branding, social media creatives, and pitch decks for our clients. Must be proficient in Adobe Suite and Canva. Portfolio link required with application.',
   'Pixelframe Creative', 'Delhi (Remote)', 'part_time',
   20000, 40000, ARRAY['Photoshop', 'Illustrator', 'Canva', 'Logo Design', 'Brand Identity'],
   'active', admin_id, now() - interval '10 days'),

  ('Data Analyst — Growth Team',
   'Join our growth team as a data analyst. You will own dashboards, run A/B tests, and surface insights that drive product decisions. Strong SQL, Excel, and Python skills are a must. Experience with Mixpanel or Amplitude is a plus.',
   'DataLens Analytics', 'Hyderabad', 'full_time',
   55000, 100000, ARRAY['Data Analyst', 'SQL', 'Python', 'Analytics', 'Excel'],
   'active', admin_id, now() - interval '11 days'),

  ('HR Recruiter — Tech Hiring',
   'We are hiring a recruiter to own our tech hiring pipeline. You will source candidates, conduct HR rounds, and coordinate with hiring managers. LinkedIn Recruiter and ATS experience preferred.',
   'TalentBridge HR', 'Remote', 'full_time',
   30000, 55000, ARRAY['HR Professional', 'Recruiting', 'LinkedIn'],
   'active', admin_id, now() - interval '12 days')

  ON CONFLICT DO NOTHING;

  -- ── DEMO PROJECTS ─────────────────────────────────────────────────────────
  INSERT INTO projects (
    title, description, category, budget, status,
    skills_required, client_id, created_at
  ) VALUES

  ('Build a Multi-vendor E-commerce Platform',
   'We need an experienced full stack developer to build a multi-vendor marketplace. The platform should support seller onboarding, product listings, cart, payments (Razorpay), and order management. Tech stack: Next.js + Supabase preferred.',
   'Web Development', 120000, 'open',
   ARRAY['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Razorpay'],
   admin_id, now() - interval '1 day'),

  ('Logo + Brand Identity for D2C Startup',
   'We are a new D2C skincare startup looking for a brand identity. Need logo, color palette, typography guide, and packaging mockups. Looking for a modern, minimal aesthetic. 5–7 concepts expected in first round.',
   'Design', 15000, 'open',
   ARRAY['Logo Design', 'Brand Identity', 'Illustrator', 'Photoshop'],
   admin_id, now() - interval '2 days'),

  ('Mobile App UI/UX — EdTech Platform',
   'Design the complete UI/UX for a mobile learning app (iOS + Android). Includes student dashboard, course player, quiz module, and progress tracking. Deliverables: Figma file + clickable prototype.',
   'Design', 40000, 'open',
   ARRAY['Figma', 'UI Design', 'UX Research', 'Mobile Design'],
   admin_id, now() - interval '3 days'),

  ('SEO + Content Strategy for B2B SaaS',
   'We need an SEO expert to audit our website and build a 6-month content strategy. Deliverables include keyword research, competitor analysis, content calendar, and 10 blog articles. Target: rank on page 1 for 20 keywords.',
   'Marketing', 35000, 'open',
   ARRAY['SEO', 'Content Writing', 'Content Marketing', 'Analytics'],
   admin_id, now() - interval '4 days'),

  ('AI Chatbot Integration — WhatsApp',
   'Integrate an AI chatbot into our WhatsApp business account using GPT-4 API and Twilio or similar. The bot should handle FAQs, lead qualification, and appointment booking. Provide source code + deployment guide.',
   'AI / Automation', 50000, 'open',
   ARRAY['Python', 'ChatGPT', 'AI Automation', 'REST API', 'n8n'],
   admin_id, now() - interval '5 days'),

  ('Video Editing — YouTube Channel (Monthly)',
   'Looking for a skilled video editor for our YouTube tech channel. We upload 4 videos/month (10–15 min each). Need good storytelling, smooth transitions, motion graphics, and thumbnail design. Long-term collaboration preferred.',
   'Video Production', 20000, 'open',
   ARRAY['Video Editing', 'After Effects', 'Premiere Pro', 'Motion Graphics', 'YouTube Content'],
   admin_id, now() - interval '6 days'),

  ('React Native App — Fitness Tracker',
   'Build a cross-platform fitness tracker app in React Native. Features: workout logging, calorie tracking, progress charts, push notifications, and Fitbit API integration. Backend on Firebase.',
   'Mobile Development', 80000, 'open',
   ARRAY['React Native', 'Flutter', 'Firebase', 'REST API'],
   admin_id, now() - interval '7 days'),

  ('Instagram + LinkedIn Content Creation',
   'We need a social media content creator for our fintech brand. 20 posts/month across Instagram and LinkedIn. Must understand financial services, create engaging carousels and reels, and write punchy captions.',
   'Marketing', 18000, 'open',
   ARRAY['Social Media Marketing', 'Canva', 'Instagram Marketing', 'Copywriting'],
   admin_id, now() - interval '8 days'),

  ('Bookkeeping & GST Filing — Monthly',
   'Need a qualified accountant to handle monthly bookkeeping, GST reconciliation, and quarterly ITR filing for our small business (turnover < 2Cr). Tally or Zoho Books experience needed.',
   'Finance & Legal', 12000, 'open',
   ARRAY['Accountant', 'GST', 'Tally', 'Financial Analysis'],
   admin_id, now() - interval '9 days'),

  ('Custom CRM Development',
   'Build a custom CRM for our sales team with features: lead management, pipeline tracking, email integration, activity log, and reporting dashboard. Tech: React + Node.js + PostgreSQL.',
   'Web Development', 200000, 'open',
   ARRAY['React', 'Node.js', 'PostgreSQL', 'REST API', 'Docker'],
   admin_id, now() - interval '10 days')

  ON CONFLICT DO NOTHING;

END $$;
