-- Script simplificado para ejecutar desde pgAdmin o psql
-- IMPORTANTE: Ejecutar este script después de que las tablas se hayan creado

-- Limpiar datos existentes (opcional)
DELETE FROM "client-observations";
DELETE FROM clients;
DELETE FROM "client-goals";
DELETE FROM "blood-types";
DELETE FROM genders;

-- Resetear secuencias
ALTER SEQUENCE genders_id_seq RESTART WITH 1;
ALTER SEQUENCE "blood-types_id_seq" RESTART WITH 1;
ALTER SEQUENCE "client-goals_id_seq" RESTART WITH 1;
ALTER SEQUENCE clients_id_seq RESTART WITH 1;
ALTER SEQUENCE "client-observations_id_seq" RESTART WITH 1;

-- Insertar géneros
INSERT INTO genders (name) VALUES ('Masculino'), ('Femenino'), ('Otro');

-- Insertar tipos de sangre
INSERT INTO "blood-types" (name) VALUES ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

-- Insertar objetivos
INSERT INTO "client-goals" (name, description) VALUES 
    ('Pérdida de peso', 'Reducir peso corporal'),
    ('Ganancia muscular', 'Aumentar masa muscular'),
    ('Tonificación', 'Definir músculos'),
    ('Resistencia', 'Mejorar cardio'),
    ('Mantenimiento', 'Mantener forma física');

-- Insertar clientes de prueba
INSERT INTO clients (name, "lastName", "documentNumber", email, "phoneNumber", address, "birthDate", "registrationDate", "genderId", "bloodTypeId", "clientGoalId") VALUES 
    ('Juan', 'Pérez', '12345678', 'juan@email.com', '1234567890', 'Av. Corrientes 1234, CABA', '1990-05-15', CURRENT_DATE, 1, 7, 2),
    ('María', 'González', '87654321', 'maria@email.com', '0987654321', 'Calle San Martín 567, Palermo', '1985-08-22', CURRENT_DATE, 2, 1, 1),
    ('Carlos', 'Rodríguez', '11223344', 'carlos@email.com', '1122334455', 'Av. Santa Fe 2890, Recoleta', '1992-12-03', CURRENT_DATE, 1, 3, 4),
    ('Ana', 'Martínez', '44332211', 'ana@email.com', '4433221100', 'Av. Las Heras 1890, Barrio Norte', '1988-03-17', CURRENT_DATE, 2, 2, 3);

-- Insertar observaciones de prueba
INSERT INTO "client-observations" (summary, comment, date, "clientId") VALUES 
    ('Excelente progreso', 'Muy disciplinado con la rutina de ejercicios', CURRENT_DATE, 1), -- Juan
    ('Buena actitud', 'Siempre llega puntual a las sesiones', CURRENT_DATE, 2), -- María
    ('Progreso constante', 'Ha mejorado mucho su resistencia cardiovascular', CURRENT_DATE, 2), -- María (segunda observación)
    ('Necesita más constancia', 'Faltas frecuentes en las últimas semanas', CURRENT_DATE, 3), -- Carlos
    ('Muy motivada', 'Excelente dedicación y seguimiento de la dieta', CURRENT_DATE, 4); -- Ana

-- Verificar resultados
SELECT 'Datos insertados correctamente' as status;
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_observations FROM "client-observations";
SELECT c.name, COUNT(o.id) as num_observations 
FROM clients c 
LEFT JOIN "client-observations" o ON c.id = o."clientId" 
GROUP BY c.id, c.name 
ORDER BY c.name;