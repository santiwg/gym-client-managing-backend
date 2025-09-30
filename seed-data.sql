-- Gym Client Managing System - Complete Test Data Seed
-- Execute this script after tables are created via TypeORM migrations
-- All data is in English for consistency with the application

-- =====================================================
-- CLEANUP EXISTING DATA
-- =====================================================
DELETE FROM "client-observations";
DELETE FROM clients;
DELETE FROM "client-goals";
DELETE FROM "blood-types";
DELETE FROM genders;

-- Reset sequences
ALTER SEQUENCE genders_id_seq RESTART WITH 1;
ALTER SEQUENCE "blood-types_id_seq" RESTART WITH 1;
ALTER SEQUENCE "client-goals_id_seq" RESTART WITH 1;
ALTER SEQUENCE clients_id_seq RESTART WITH 1;
ALTER SEQUENCE "client-observations_id_seq" RESTART WITH 1;

-- =====================================================
-- REQUIRED DATA (NOT MANAGED IN FRONTEND)
-- =====================================================

-- Insert Genders
INSERT INTO genders (name) VALUES 
    ('Male'),
    ('Female'),
    ('Prefer not to say');

-- Insert Blood Types
INSERT INTO "blood-types" (name) VALUES 
    ('A+'),
    ('A-'),
    ('B+'),
    ('B-'),
    ('AB+'),
    ('AB-'),
    ('O+'),
    ('O-');

-- Insert Client Goals
INSERT INTO "client-goals" (name, description) VALUES 
    ('Weight Loss', 'Reduce body weight in a healthy way'),
    ('Muscle Gain', 'Increase muscle mass and strength'),
    ('Toning', 'Define and tone existing muscles'),
    ('Cardiovascular Endurance', 'Improve cardiovascular capacity and endurance'),
    ('Rehabilitation', 'Recovery from injuries or physical problems'),
    ('Maintenance', 'Maintain current physical condition'),
    ('Sports Preparation', 'Sport-specific training'),
    ('General Wellness', 'Improve overall health and wellbeing'),
    ('Flexibility', 'Improve range of motion and flexibility'),
    ('Core Strengthening', 'Strengthen core muscles and improve stability');

-- =====================================================
-- TEST CLIENTS DATA (30+ CLIENTS)
-- =====================================================
INSERT INTO clients (

    name, 
    "lastName", 
    "documentNumber", 
    email, 
    "phoneNumber", 
    address,
    "birthDate", 
    "registrationDate",
    "genderId",
    "bloodTypeId",
    "clientGoalId"

) VALUES 
    ('John', 'Smith', '12345678', 'john.smith@email.com', '+1-555-0101', '123 Main St, Apt 4B, New York, NY', '1990-05-15', CURRENT_DATE - INTERVAL '30 days', 1, 7, 2),
    ('Sarah', 'Johnson', '23456789', 'sarah.johnson@email.com', '+1-555-0102', '456 Oak Ave, Los Angeles, CA', '1985-08-22', CURRENT_DATE - INTERVAL '25 days', 2, 1, 1),
    ('Michael', 'Williams', '34567890', 'michael.williams@email.com', '+1-555-0103', '789 Pine Rd, Chicago, IL', '1992-12-03', CURRENT_DATE - INTERVAL '20 days', 1, 3, 4),
    ('Emily', 'Brown', '45678901', 'emily.brown@email.com', '+1-555-0104', '321 Elm St, Houston, TX', '1988-03-17', CURRENT_DATE - INTERVAL '18 days', 2, 2, 3),
    ('David', 'Jones', '56789012', 'david.jones@email.com', '+1-555-0105', '654 Maple Dr, Phoenix, AZ', '1995-09-28', CURRENT_DATE - INTERVAL '15 days', 1, 8, 7),
    ('Jessica', 'Garcia', '67890123', 'jessica.garcia@email.com', '+1-555-0106', '987 Cedar Ln, Philadelphia, PA', '1991-11-12', CURRENT_DATE - INTERVAL '12 days', 2, 5, 6),
    ('Daniel', 'Miller', '78901234', 'daniel.miller@email.com', '+1-555-0107', '147 Birch St, San Antonio, TX', '1987-07-04', CURRENT_DATE - INTERVAL '10 days', 1, 4, 5),
    ('Ashley', 'Davis', '89012345', 'ashley.davis@email.com', '+1-555-0108', '258 Walnut Ave, San Diego, CA', '1993-01-30', CURRENT_DATE - INTERVAL '8 days', 2, 6, 8),
    ('Christopher', 'Rodriguez', '90123456', 'chris.rodriguez@email.com', '+1-555-0109', '369 Cherry Blvd, Dallas, TX', '1989-06-25', CURRENT_DATE - INTERVAL '7 days', 1, 1, 9),
    ('Amanda', 'Wilson', '01234567', 'amanda.wilson@email.com', '+1-555-0110', '741 Spruce Way, San Jose, CA', '1994-04-18', CURRENT_DATE - INTERVAL '6 days', 2, 7, 10),
    ('Ryan', 'Martinez', '11234567', 'ryan.martinez@email.com', '+1-555-0111', '852 Poplar St, Austin, TX', '1986-10-09', CURRENT_DATE - INTERVAL '5 days', 1, 2, 1),
    ('Nicole', 'Anderson', '21234567', 'nicole.anderson@email.com', '+1-555-0112', '963 Ash Dr, Jacksonville, FL', '1992-02-14', CURRENT_DATE - INTERVAL '4 days', 2, 3, 2),
    ('Kevin', 'Taylor', '31234567', 'kevin.taylor@email.com', '+1-555-0113', '174 Hickory Ln, Fort Worth, TX', '1988-12-07', CURRENT_DATE - INTERVAL '3 days', 1, 8, 3),
    ('Stephanie', 'Thomas', '41234567', 'stephanie.thomas@email.com', '+1-555-0114', '285 Willow Rd, Columbus, OH', '1990-08-31', CURRENT_DATE - INTERVAL '2 days', 2, 4, 4),
    ('Brandon', 'Hernandez', '51234567', 'brandon.hernandez@email.com', '+1-555-0115', '396 Cypress Ave, San Francisco, CA', '1987-05-23', CURRENT_DATE - INTERVAL '1 day', 1, 5, 5),
    ('Rachel', 'Moore', '61234567', 'rachel.moore@email.com', '+1-555-0116', '507 Redwood St, Charlotte, NC', '1991-09-16', CURRENT_DATE, 2, 6, 6),
    ('Tyler', 'Martin', '71234567', 'tyler.martin@email.com', '+1-555-0117', '618 Sequoia Blvd, Seattle, WA', '1989-11-02', CURRENT_DATE, 1, 1, 7),
    ('Megan', 'Jackson', '81234567', 'megan.jackson@email.com', '+1-555-0118', '729 Palm Dr, Denver, CO', '1993-03-12', CURRENT_DATE, 2, 7, 8),
    ('Andrew', 'Thompson', '91234567', 'andrew.thompson@email.com', '+1-555-0119', '830 Magnolia Way, Washington, DC', '1985-07-28', CURRENT_DATE, 1, 2, 9),
    ('Brittany', 'White', '02345678', 'brittany.white@email.com', '+1-555-0120', '941 Sycamore Ln, Boston, MA', '1994-01-06', CURRENT_DATE, 2, 8, 10),
    ('Jonathan', 'Lopez', '12345679', 'jonathan.lopez@email.com', '+1-555-0121', '152 Dogwood St, El Paso, TX', '1988-04-20', CURRENT_DATE, 1, 3, 1),
    ('Samantha', 'Lee', '22345678', 'samantha.lee@email.com', '+1-555-0122', '263 Beech Ave, Detroit, MI', '1992-10-11', CURRENT_DATE, 2, 4, 2),
    ('Matthew', 'Gonzalez', '32345678', 'matthew.gonzalez@email.com', '+1-555-0123', '374 Cottonwood Rd, Memphis, TN', '1986-12-29', CURRENT_DATE, 1, 5, 3),
    ('Lauren', 'Harris', '42345678', 'lauren.harris@email.com', '+1-555-0124', '485 Fir Dr, Portland, OR', '1991-06-08', CURRENT_DATE, 2, 6, 4),
    ('Joshua', 'Clark', '52345678', 'joshua.clark@email.com', '+1-555-0125', '596 Pine Valley Ln, Oklahoma City, OK', '1989-02-15', CURRENT_DATE, 1, 1, 5),
    ('Taylor', 'Lewis', '62345678', 'taylor.lewis@email.com', '+1-555-0126', '607 Oak Ridge Dr, Las Vegas, NV', '1993-08-03', CURRENT_DATE, 3, 7, 6),
    ('Alexis', 'Robinson', '72345678', 'alexis.robinson@email.com', '+1-555-0127', '718 Maple Heights Blvd, Louisville, KY', '1990-05-27', CURRENT_DATE, 2, 2, 7),
    ('Nathan', 'Walker', '82345678', 'nathan.walker@email.com', '+1-555-0128', '829 Cedar Ridge Way, Baltimore, MD', '1987-11-14', CURRENT_DATE, 1, 8, 8),
    ('Kayla', 'Hall', '92345678', 'kayla.hall@email.com', '+1-555-0129', '930 Birch Hill St, Milwaukee, WI', '1994-09-21', CURRENT_DATE, 2, 3, 9),
    ('Justin', 'Allen', '03456789', 'justin.allen@email.com', '+1-555-0130', '041 Willow Creek Rd, Albuquerque, NM', '1988-01-18', CURRENT_DATE, 1, 4, 10);

-- =====================================================
-- CLIENT OBSERVATIONS (0-3 PER CLIENT) - METRIC SYSTEM
-- =====================================================
INSERT INTO "client-observations" (summary, comment, date, "clientId") VALUES 

    -- John Smith (3 observations)
    ('Excellent motivation', 'Shows great dedication to workout routine', CURRENT_DATE - INTERVAL '5 days', 1),
    ('Improved form', 'Better technique in compound movements', CURRENT_DATE - INTERVAL '2 days', 1),
    ('Weight progress', 'Lost 2.3 kg in first month', CURRENT_DATE, 1),
    
    -- Sarah Johnson (2 observations)
    ('Diet compliance', 'Following nutrition plan consistently', CURRENT_DATE - INTERVAL '7 days', 2),
    ('Cardio improvement', 'Can now run 30 minutes without stopping', CURRENT_DATE - INTERVAL '1 day', 2),
    
    -- Michael Williams (1 observation)
    ('Athletic background', 'Former soccer player, good base fitness', CURRENT_DATE - INTERVAL '10 days', 3),
    
    -- Emily Brown (2 observations)
    ('Flexibility issues', 'Needs more stretching and mobility work', CURRENT_DATE - INTERVAL '8 days', 4),
    ('Core strength', 'Significant improvement in plank hold time', CURRENT_DATE - INTERVAL '3 days', 4),
    
    -- David Jones (0 observations - no entries)
    
    -- Jessica Garcia (3 observations)
    ('Consistent attendance', 'Never missed a scheduled session', CURRENT_DATE - INTERVAL '6 days', 6),
    ('Goal adjustment', 'Changed focus from weight loss to maintenance', CURRENT_DATE - INTERVAL '4 days', 6),
    ('Stress management', 'Exercise helping with work-related stress', CURRENT_DATE - INTERVAL '1 day', 6),
    
    -- Daniel Miller (1 observation)
    ('Injury recovery', 'Knee rehabilitation progressing well', CURRENT_DATE - INTERVAL '5 days', 7),
    
    -- Ashley Davis (2 observations)
    ('Holistic approach', 'Combining fitness with meditation practices', CURRENT_DATE - INTERVAL '4 days', 8),
    ('Energy levels', 'Reports feeling more energetic throughout day', CURRENT_DATE - INTERVAL '1 day', 8),
    
    -- Christopher Rodriguez (3 observations)
    ('Technique focus', 'Working on proper squat and deadlift form', CURRENT_DATE - INTERVAL '3 days', 9),
    ('Flexibility gains', 'Hip mobility has improved significantly', CURRENT_DATE - INTERVAL '2 days', 9),
    ('Strength progress', 'Increased all major lifts by 15%', CURRENT_DATE, 9),
    
    -- Amanda Wilson (1 observation)
    ('Core stability', 'Excellent progress in core strengthening exercises', CURRENT_DATE - INTERVAL '2 days', 10),
    
    -- Ryan Martinez (2 observations)
    ('Weight loss success', 'Down 5.4 kg in 3 weeks', CURRENT_DATE - INTERVAL '4 days', 11),
    ('Motivation high', 'Very committed to reaching his goals', CURRENT_DATE - INTERVAL '1 day', 11),
    
    -- Nicole Anderson (0 observations - no entries)
    
    -- Kevin Taylor (1 observation)
    ('Form improvement', 'Much better posture during exercises', CURRENT_DATE - INTERVAL '2 days', 13),
    
    -- Stephanie Thomas (3 observations)
    ('Endurance boost', 'Can handle longer workout sessions', CURRENT_DATE - INTERVAL '2 days', 14),
    ('Heart rate zones', 'Learning to train in optimal zones', CURRENT_DATE - INTERVAL '1 day', 14),
    ('Recovery focus', 'Implementing proper rest and recovery', CURRENT_DATE, 14),
    
    -- Brandon Hernandez (2 observations)
    ('Injury prevention', 'Working on movement patterns to prevent injury', CURRENT_DATE - INTERVAL '1 day', 15),
    ('Rehab progress', 'Lower back issues improving', CURRENT_DATE, 15),
    
    -- Rachel Moore (1 observation)
    ('Consistency key', 'Maintaining good workout schedule', CURRENT_DATE, 16),
    
    -- Tyler Martin (0 observations - no entries)
    
    -- Megan Jackson (2 observations)
    ('Mind-body connection', 'Improved focus during workouts', CURRENT_DATE, 18),
    ('Wellness goals', 'Seeing improvements in sleep quality', CURRENT_DATE, 18),
    
    -- Andrew Thompson (1 observation)
    ('Flexibility priority', 'Daily stretching routine established', CURRENT_DATE, 19),
    
    -- Brittany White (3 observations)
    ('Core strength focus', 'Planks and stability exercises paying off', CURRENT_DATE, 20),
    ('Balance improvement', 'Single-leg exercises showing results', CURRENT_DATE, 20),
    ('Functional movement', 'Better movement patterns in daily activities', CURRENT_DATE, 20),
    
    -- Jonathan Lopez (2 observations)
    ('Weight management', 'Successfully maintaining target weight', CURRENT_DATE, 21),
    ('Lifestyle changes', 'Incorporating more activity outside gym', CURRENT_DATE, 21),
    
    -- Samantha Lee (1 observation)
    ('Muscle development', 'Visible muscle definition improvements', CURRENT_DATE, 22),
    
    -- Matthew Gonzalez (0 observations - no entries)
    
    -- Lauren Harris (2 observations)
    ('Cardio progress', 'Running pace improved by 18 seconds per km', CURRENT_DATE, 24),
    ('Endurance goals', 'Training for upcoming 5K race', CURRENT_DATE, 24),
    
    -- Joshua Clark (1 observation)
    ('Rehabilitation success', 'Shoulder mobility fully restored', CURRENT_DATE, 25),
    
    -- Taylor Lewis (3 observations)
    ('Individual approach', 'Customized routine working well', CURRENT_DATE, 26),
    ('Goal clarification', 'Focused on overall health rather than appearance', CURRENT_DATE, 26),
    ('Progress tracking', 'Keeping detailed workout logs', CURRENT_DATE, 26),
    
    -- Alexis Robinson (0 observations - no entries)
    
    -- Nathan Walker (2 observations)
    ('Competition prep', 'Training for athletic competition', CURRENT_DATE, 28),
    ('Performance metrics', 'All benchmarks improving steadily', CURRENT_DATE, 28),
    
    -- Kayla Hall (1 observation)
    ('Flexibility focus', 'Daily yoga practice showing benefits', CURRENT_DATE, 29),
    
    -- Justin Allen (2 observations)
    ('Core stability', 'Reduced back pain through core strengthening', CURRENT_DATE, 30),
    ('Functional fitness', 'Improved performance in daily activities', CURRENT_DATE, 30);

-- =====================================================
-- DATA VERIFICATION QUERIES
-- =====================================================
SELECT 'Database seeded successfully!' as status;
SELECT COUNT(*) as total_genders FROM genders;
SELECT COUNT(*) as total_blood_types FROM "blood-types";
SELECT COUNT(*) as total_client_goals FROM "client-goals";
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_observations FROM "client-observations";

-- Clients with observation counts
SELECT 
    c.name || ' ' || c."lastName" as client_name,
    COUNT(o.id) as observation_count
FROM clients c 
LEFT JOIN "client-observations" o ON c.id = o."clientId" 
GROUP BY c.id, c.name, c."lastName"
ORDER BY c.id;

-- Summary by goal
SELECT 
    cg.name as goal,
    COUNT(c.id) as client_count
FROM "client-goals" cg
LEFT JOIN clients c ON cg.id = c."clientGoalId"
GROUP BY cg.id, cg.name
ORDER BY client_count DESC;