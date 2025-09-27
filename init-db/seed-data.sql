-- Archivo SQL para poblar la base de datos con datos de prueba
-- Gym Client Managing System - Test Data

-- =====================================================
-- 1. INSERTAR GÉNEROS
-- =====================================================
INSERT INTO genders (name) VALUES 
    ('Masculino'),
    ('Femenino'),
    ('Otro');

-- =====================================================
-- 2. INSERTAR TIPOS DE SANGRE
-- =====================================================
INSERT INTO "blood-types" (name) VALUES 
    ('A+'),
    ('A-'),
    ('B+'),
    ('B-'),
    ('AB+'),
    ('AB-'),
    ('O+'),
    ('O-');

-- =====================================================
-- 3. INSERTAR OBJETIVOS DE CLIENTES
-- =====================================================
INSERT INTO "client-goals" (name, description) VALUES 
    ('Pérdida de peso', 'Reducir peso corporal de forma saludable'),
    ('Ganancia muscular', 'Aumentar masa muscular y fuerza'),
    ('Tonificación', 'Definir y tonificar músculos existentes'),
    ('Resistencia cardiovascular', 'Mejorar capacidad cardiovascular y resistencia'),
    ('Rehabilitación', 'Recuperación de lesiones o problemas físicos'),
    ('Mantenimiento', 'Mantener condición física actual'),
    ('Preparación deportiva', 'Entrenamiento específico para deporte'),
    ('Bienestar general', 'Mejorar salud y bienestar general');

-- =====================================================
-- 4. INSERTAR CLIENTES DE PRUEBA
-- =====================================================
INSERT INTO clients (
    name, 
    "lastName", 
    "documentNumber", 
    email, 
    "phoneNumber", 
    "birthDate", 
    "registrationDate",
    "genderId",
    "bloodTypeId",
    "clientGoalId"
) VALUES 
    (
        'Juan Carlos', 
        'Pérez García', 
        '12345678', 
        'juan.perez@email.com', 
        '+54 9 11 1234-5678', 
        '1990-05-15', 
        CURRENT_DATE,
        1, -- Masculino
        7, -- O+
        2  -- Ganancia muscular
    ),
    (
        'María Elena', 
        'González López', 
        '87654321', 
        'maria.gonzalez@email.com', 
        '+54 9 11 8765-4321', 
        '1985-08-22', 
        CURRENT_DATE,
        2, -- Femenino
        1, -- A+
        1  -- Pérdida de peso
    ),
    (
        'Carlos Alberto', 
        'Rodríguez Silva', 
        '11223344', 
        'carlos.rodriguez@email.com', 
        '+54 9 11 1122-3344', 
        '1992-12-03', 
        CURRENT_DATE,
        1, -- Masculino
        3, -- B+
        4  -- Resistencia cardiovascular
    ),
    (
        'Ana Sofía', 
        'Martínez Torres', 
        '44332211', 
        'ana.martinez@email.com', 
        '+54 9 11 4433-2211', 
        '1988-03-17', 
        CURRENT_DATE,
        2, -- Femenino
        2, -- A-
        3  -- Tonificación
    ),
    (
        'Roberto', 
        'Fernández Castro', 
        '55667788', 
        'roberto.fernandez@email.com', 
        '+54 9 11 5566-7788', 
        '1995-09-28', 
        CURRENT_DATE,
        1, -- Masculino
        8, -- O-
        7  -- Preparación deportiva
    ),
    (
        'Laura Beatriz', 
        'Sánchez Ruiz', 
        '99887766', 
        'laura.sanchez@email.com', 
        '+54 9 11 9988-7766', 
        '1991-11-12', 
        CURRENT_DATE,
        2, -- Femenino
        5, -- AB+
        6  -- Mantenimiento
    ),
    (
        'Diego Alejandro', 
        'Morales Vega', 
        '13579246', 
        'diego.morales@email.com', 
        '+54 9 11 1357-9246', 
        '1987-07-04', 
        CURRENT_DATE,
        1, -- Masculino
        4, -- B-
        5  -- Rehabilitación
    ),
    (
        'Valentina', 
        'Herrera Jiménez', 
        '24681357', 
        'valentina.herrera@email.com', 
        '+54 9 11 2468-1357', 
        '1993-01-30', 
        CURRENT_DATE,
        2, -- Femenino
        6, -- AB-
        8  -- Bienestar general
    );

-- =====================================================
-- 5. INSERTAR OBSERVACIONES DE CLIENTES
-- =====================================================
INSERT INTO "client-observations" (observation, date, "clientId") VALUES 
    ('Cliente muy motivado, excelente progreso en las primeras semanas', CURRENT_DATE - INTERVAL '7 days', 1),
    ('Necesita mejorar la técnica en ejercicios de peso libre', CURRENT_DATE - INTERVAL '5 days', 1),
    ('Excelente disciplina con la dieta, se nota en los resultados', CURRENT_DATE - INTERVAL '10 days', 2),
    ('Recomendar incrementar cardio gradualmente', CURRENT_DATE - INTERVAL '3 days', 2),
    ('Atleta con gran experiencia previa, adaptación rápida', CURRENT_DATE - INTERVAL '8 days', 3),
    ('Muy constante con los entrenamientos', CURRENT_DATE - INTERVAL '2 days', 4),
    ('En proceso de recuperación, progreso satisfactorio', CURRENT_DATE - INTERVAL '6 days', 7),
    ('Cliente busca equilibrio vida-entrenamiento', CURRENT_DATE - INTERVAL '4 days', 8);

-- =====================================================
-- 6. VERIFICAR DATOS INSERTADOS (CONSULTAS DE PRUEBA)
-- =====================================================
-- Descomentar estas líneas para verificar los datos insertados:

-- SELECT * FROM genders;
-- SELECT * FROM "blood-types";
-- SELECT * FROM "client-goals";
-- SELECT 
--     c.id,
--     c.name,
--     c."lastName",
--     c."documentNumber",
--     c.email,
--     c."phoneNumber",
--     c."registrationDate",
--     g.name as gender,
--     bt.name as blood_type,
--     cg.name as goal
-- FROM clients c
-- LEFT JOIN genders g ON c."genderId" = g.id
-- LEFT JOIN "blood-types" bt ON c."bloodTypeId" = bt.id
-- LEFT JOIN "client-goals" cg ON c."clientGoalId" = cg.id;
-- SELECT * FROM "client-observations";