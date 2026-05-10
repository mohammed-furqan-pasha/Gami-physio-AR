-- ============================================================
-- GamiPhysio AR — Seed Data
-- Run AFTER schema.sql.
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================
-- Gold Standard biomechanical exercise library.
-- 5 body parts × 3 severities × ~2–3 exercises each = ~35 rows.
-- angle_config keys:
--   joint         — primary joint being tracked
--   min_angle     — acceptable minimum joint angle (degrees)
--   max_angle     — acceptable maximum joint angle (degrees)
--   hold_seconds  — time to hold at end range
--   score_bands   — [poor, fair, good, great, perfect] angle tolerance (±degrees)
-- ============================================================

insert into exercises
  (name, body_part, severity, angle_config, keywords, gif_asset, description, target_reps, target_sets, tempo_seconds, requires_guardian)
values

-- ══════════════════════════════════════════════════════════════
-- NECK
-- ══════════════════════════════════════════════════════════════
(
  'Neck Side Rotation',
  'neck', 'mild',
  '{"joint":"neck","min_angle":0,"max_angle":60,"hold_seconds":2,"score_bands":[30,20,15,10,5]}',
  ARRAY['rotation','turn','cervical','lateral rotation','neck turn'],
  'neck_mild_rotation.gif',
  'Gently rotate your head left and right within a comfortable range. Keep shoulders still.',
  10, 3, 3, false
),
(
  'Neck Forward Flexion',
  'neck', 'mild',
  '{"joint":"neck","min_angle":0,"max_angle":45,"hold_seconds":2,"score_bands":[25,18,12,8,4]}',
  ARRAY['flexion','chin tuck','forward bend','neck flexion','nodding'],
  'neck_mild_flexion.gif',
  'Lower chin toward chest slowly. Stop at first resistance. Hold briefly.',
  8, 3, 4, false
),
(
  'Cervical Isometric Holds',
  'neck', 'moderate',
  '{"joint":"neck","min_angle":0,"max_angle":30,"hold_seconds":5,"score_bands":[20,15,10,7,3]}',
  ARRAY['isometric','resistance','cervical hold','static neck','muscle activation'],
  'neck_moderate_isometric.gif',
  'Press hand gently against side of head. Resist with neck muscles. Do not move the head.',
  6, 3, 5, false
),
(
  'Supervised Neck Traction Stretch',
  'neck', 'severe',
  '{"joint":"neck","min_angle":0,"max_angle":20,"hold_seconds":8,"score_bands":[15,10,8,5,2]}',
  ARRAY['traction','decompression','severe cervical','disc','nerve','herniation'],
  'neck_severe_traction.gif',
  'Gentle assisted cervical stretch. Guardian must be present. Minimal range — stop at any pain.',
  4, 2, 8, true
),

-- ══════════════════════════════════════════════════════════════
-- BACK
-- ══════════════════════════════════════════════════════════════
(
  'Cat-Cow Spinal Mobilization',
  'back', 'mild',
  '{"joint":"spine","min_angle":0,"max_angle":35,"hold_seconds":2,"score_bands":[20,15,10,7,3]}',
  ARRAY['cat cow','spinal','mobilization','lumbar','back flex','back extension'],
  'back_mild_catcow.gif',
  'On hands and knees: arch back upward (cat), then let it sag (cow). Breathe with each movement.',
  12, 3, 4, false
),
(
  'Pelvic Tilt',
  'back', 'mild',
  '{"joint":"lumbar","min_angle":0,"max_angle":20,"hold_seconds":3,"score_bands":[15,12,8,5,2]}',
  ARRAY['pelvic tilt','lower back','lumbar','core','pelvis'],
  'back_mild_pelvic_tilt.gif',
  'Lie on your back, knees bent. Flatten lower back against floor by tightening abdomen. Hold.',
  10, 3, 3, false
),
(
  'Prone Press-Up (McKenzie)',
  'back', 'moderate',
  '{"joint":"lumbar","min_angle":0,"max_angle":40,"hold_seconds":3,"score_bands":[25,18,12,8,4]}',
  ARRAY['mckenzie','press up','prone','extension','disc','lumbar extension'],
  'back_moderate_mckenzie.gif',
  'Lie face down. Press up on hands, letting hips stay on floor. Gentle lumbar extension.',
  8, 3, 5, false
),
(
  'Standing Back Extension',
  'back', 'moderate',
  '{"joint":"lumbar","min_angle":0,"max_angle":25,"hold_seconds":2,"score_bands":[18,13,9,6,3]}',
  ARRAY['extension','standing','back extension','lumbar','erector'],
  'back_moderate_extension.gif',
  'Stand tall, hands on lower back. Gently lean backward. Control the movement — no jerking.',
  8, 3, 4, false
),
(
  'Supported Bridge (Severe)',
  'back', 'severe',
  '{"joint":"lumbar","min_angle":0,"max_angle":15,"hold_seconds":5,"score_bands":[12,8,6,4,2]}',
  ARRAY['bridge','severe back','spinal stenosis','disc herniation','fracture','post-surgical'],
  'back_severe_bridge.gif',
  'Lie on back, knees bent. Slowly lift hips only a few centimetres. Guardian assists and monitors.',
  5, 2, 6, true
),

-- ══════════════════════════════════════════════════════════════
-- SHOULDERS
-- ══════════════════════════════════════════════════════════════
(
  'Pendulum Swing',
  'shoulders', 'mild',
  '{"joint":"glenohumeral","min_angle":0,"max_angle":45,"hold_seconds":0,"score_bands":[25,18,12,8,4]}',
  ARRAY['pendulum','shoulder swing','rotator cuff','glenohumeral','impingement mild'],
  'shoulders_mild_pendulum.gif',
  'Lean forward, let arm hang. Gently swing in small circles. No muscle force — gravity does the work.',
  15, 3, 2, false
),
(
  'Wall Slide Shoulder Flexion',
  'shoulders', 'mild',
  '{"joint":"glenohumeral","min_angle":0,"max_angle":160,"hold_seconds":2,"score_bands":[30,20,12,8,4]}',
  ARRAY['flexion','wall slide','overhead','elevation','shoulder flexion','abduction'],
  'shoulders_mild_wallslide.gif',
  'Stand facing wall. Slide both arms upward along the wall as high as comfortable.',
  10, 3, 4, false
),
(
  'External Rotation with Band',
  'shoulders', 'moderate',
  '{"joint":"glenohumeral","min_angle":0,"max_angle":60,"hold_seconds":2,"score_bands":[20,15,10,6,3]}',
  ARRAY['external rotation','rotator cuff','resistance band','shoulder rotation','infraspinatus'],
  'shoulders_moderate_ext_rotation.gif',
  'Elbow at side, 90° bend. Rotate forearm outward against resistance. Keep elbow glued to side.',
  10, 3, 4, false
),
(
  'Scapular Retraction',
  'shoulders', 'moderate',
  '{"joint":"scapula","min_angle":0,"max_angle":30,"hold_seconds":3,"score_bands":[18,13,9,6,3]}',
  ARRAY['scapular','retraction','shoulder blade','posture','rhomboid','trapezius'],
  'shoulders_moderate_scapular.gif',
  'Squeeze shoulder blades together as if holding a pencil between them. Hold, then release slowly.',
  12, 3, 3, false
),
(
  'Supported Shoulder Mobilization',
  'shoulders', 'severe',
  '{"joint":"glenohumeral","min_angle":0,"max_angle":30,"hold_seconds":5,"score_bands":[15,10,7,4,2]}',
  ARRAY['severe shoulder','frozen shoulder','adhesive capsulitis','surgical','rotator cuff tear','dislocation'],
  'shoulders_severe_mobilization.gif',
  'Guardian gently supports the arm. Minimal active movement. Focus on relaxation and gentle range.',
  4, 2, 8, true
),

-- ══════════════════════════════════════════════════════════════
-- KNEES
-- ══════════════════════════════════════════════════════════════
(
  'Seated Knee Extension',
  'knees', 'mild',
  '{"joint":"knee","min_angle":0,"max_angle":90,"hold_seconds":2,"score_bands":[20,15,10,7,3]}',
  ARRAY['extension','seated','quad','quadriceps','knee extension','straighten'],
  'knee_mild_extension.gif',
  'Sit on chair. Slowly straighten leg until fully extended. Hold 2 seconds. Lower slowly.',
  10, 3, 4, false
),
(
  'Short Arc Quads',
  'knees', 'mild',
  '{"joint":"knee","min_angle":40,"max_angle":90,"hold_seconds":3,"score_bands":[15,12,8,5,2]}',
  ARRAY['short arc','quad','partial extension','ACL','post surgery mild','patella'],
  'knee_mild_short_arc.gif',
  'Lie with rolled towel under knee. Lift foot until knee straightens. Only last 50° of motion.',
  12, 3, 3, false
),
(
  'Wall Squat (Isometric)',
  'knees', 'moderate',
  '{"joint":"knee","min_angle":90,"max_angle":135,"hold_seconds":10,"score_bands":[20,15,10,7,3]}',
  ARRAY['wall squat','isometric','squat','quad','meniscus','moderate knee','patellofemoral'],
  'knee_moderate_wall_squat.gif',
  'Back flat against wall. Slide down to 90° knee bend. Hold position. Track knee over 2nd toe.',
  6, 3, 10, false
),
(
  'Terminal Knee Extension (TKE)',
  'knees', 'moderate',
  '{"joint":"knee","min_angle":0,"max_angle":30,"hold_seconds":3,"score_bands":[15,10,7,5,2]}',
  ARRAY['TKE','terminal','extension','ACL rehab','hyperextension','band','moderate knee'],
  'knee_moderate_tke.gif',
  'Loop band behind knee. From slight bend, straighten knee fully. Control entire movement.',
  12, 3, 3, false
),
(
  'Assisted Passive Knee Flexion',
  'knees', 'severe',
  '{"joint":"knee","min_angle":0,"max_angle":60,"hold_seconds":5,"score_bands":[15,10,7,4,2]}',
  ARRAY['passive flexion','severe knee','total knee replacement','TKR','post op','knee surgery'],
  'knee_severe_passive_flexion.gif',
  'Guardian slowly bends the knee to comfortable end range. Patient remains relaxed. Stop at pain.',
  4, 2, 6, true
),

-- ══════════════════════════════════════════════════════════════
-- ANKLES
-- ══════════════════════════════════════════════════════════════
(
  'Ankle Alphabet',
  'ankles', 'mild',
  '{"joint":"ankle","min_angle":0,"max_angle":40,"hold_seconds":0,"score_bands":[25,18,12,8,4]}',
  ARRAY['ankle alphabet','mobility','range of motion','sprain mild','dorsiflexion','plantarflexion'],
  'ankle_mild_alphabet.gif',
  'Seated, foot off floor. Trace the alphabet A–Z with your big toe. Smooth continuous movement.',
  1, 3, 26, false
),
(
  'Calf Raises',
  'ankles', 'mild',
  '{"joint":"ankle","min_angle":0,"max_angle":40,"hold_seconds":2,"score_bands":[20,15,10,7,3]}',
  ARRAY['calf raise','plantarflexion','gastrocnemius','soleus','heel raise','calf'],
  'ankle_mild_calf_raise.gif',
  'Stand near wall for balance. Rise onto toes as high as possible. Lower with control.',
  15, 3, 3, false
),
(
  'Resistance Band Dorsiflexion',
  'ankles', 'moderate',
  '{"joint":"ankle","min_angle":0,"max_angle":20,"hold_seconds":3,"score_bands":[15,12,8,5,2]}',
  ARRAY['dorsiflexion','resistance','band','ankle','tibia','moderate sprain','peroneal'],
  'ankle_moderate_dorsiflexion.gif',
  'Band around foot, anchored forward. Pull toes toward shin against resistance. Control the return.',
  10, 3, 4, false
),
(
  'Single Leg Stance Progressions',
  'ankles', 'moderate',
  '{"joint":"ankle","min_angle":0,"max_angle":15,"hold_seconds":15,"score_bands":[10,8,5,3,1]}',
  ARRAY['balance','proprioception','single leg','stability','ankle sprain','moderate','functional'],
  'ankle_moderate_balance.gif',
  'Stand on one leg near wall. Progress from eyes open → eyes closed. Engage core.',
  6, 3, 15, false
),
(
  'Assisted Ankle ROM (Post-Fracture)',
  'ankles', 'severe',
  '{"joint":"ankle","min_angle":0,"max_angle":15,"hold_seconds":5,"score_bands":[12,8,5,3,1]}',
  ARRAY['fracture','severe ankle','post surgery','ankle ORIF','cast removal','fibula','tibia fracture'],
  'ankle_severe_assisted_rom.gif',
  'Guardian gently moves ankle through minimal range. Completely passive. Watch for swelling.',
  4, 2, 6, true
);

-- ══════════════════════════════════════════════════════════════
-- Seed a default anonymous profile
-- (App creates a real one on first load via lib/supabase.ts)
-- ══════════════════════════════════════════════════════════════
insert into profiles (id, display_name, total_points, streak_days)
values ('00000000-0000-0000-0000-000000000001', 'Demo Athlete', 0, 0)
on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════════
-- Verification queries (run separately to check seed worked)
-- ══════════════════════════════════════════════════════════════
-- select body_part, severity, count(*) from exercises group by 1,2 order by 1,2;
-- select count(*) from exercises;
