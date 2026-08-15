-- Official aid listings from AfroUp guide dated 14 August 2026.
-- Source PDF only. No invented facts.

INSERT INTO departments (slug, name) VALUES
  ('bogota', 'Bogotá'),
  ('cundinamarca', 'Cundinamarca'),
  ('atlantico', 'Atlántico'),
  ('santander', 'Santander'),
  ('bolivar', 'Bolívar'),
  ('tolima', 'Tolima');

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Oficina de Atención al Ciudadano',
  'Punto de acopio en Buenaventura, diagonal a la Alcaldía.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Oficina de Atención al Ciudadano, diagonal a la Alcaldía, Buenaventura',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Fundaproductividad y Redmupaz',
  'Fundación Social para la Productividad y Redmupaz se unieron para apoyar a las familias afectadas.',
  'Centro Comercial Bellavista. Local 14, tercer piso.',
  NULL,
  NULL,
  NULL,
  'Centro Comercial Bellavista, local 14, tercer piso, Buenaventura',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Punto de acopio en el centro de Buenaventura',
  'Punto de acopio al lado del Torito Rojo, en el centro por la primera.',
  NULL,
  NULL,
  '3107019109',
  NULL,
  'Calle 1 Cr. 6a-45, al lado del Torito Rojo, centro de Buenaventura',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Asociación de Parteras Unidas del Pacífico (ASOPARUPA)',
  'Punto de acopio de ASOPARUPA en Independencia, segunda etapa.',
  'Redes: @asoparupa',
  NULL,
  NULL,
  NULL,
  'Carrera 59 N° 7A-11, barrio Independencia 2 etapa, Buenaventura',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Apadrina una familia en Buenaventura',
  'Inscripción para ser contactado y apadrinar una familia en Buenaventura.',
  'Link de inscripción: https://shorturl.at/D84wL
Más información en redes: @elagricultorcol',
  NULL,
  NULL,
  NULL,
  'Buenaventura',
  'Apadrinamiento',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Hospital Local Ismael Roldán Valencia',
  'Punto de acopio en Quibdó.',
  'Redes: @hospitalismaelroldan',
  NULL,
  NULL,
  NULL,
  'Calle 21 #20-126, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Centro Logístico Humanitario del Departamento del Chocó',
  'Centro logístico humanitario en la antigua bodega Postobón.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Antigua Bodega Postobón, kilómetro 4, vía Quibdó - Yuto',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Gobernación del Chocó',
  'Punto de acopio y cuenta única habilitada para ayuda humanitaria.',
  'La Gobernación del Chocó habilitó una única cuenta bancaria en el Banco de Bogotá, cuenta de ahorros 578818429, a nombre de Ayuda humanitaria, con NIT 891.680.010-3. La cuenta pertenece a la Gobernación del Chocó y está a cargo del Fondo Departamental de Gestión del Riesgo del Chocó.
Instagram y Facebook: @gobernaciondelchoco',
  NULL,
  NULL,
  NULL,
  'Calle 31, Edificio La Confianza, Quibdó',
  'Punto de acopio y donación económica',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'ASOMADERE y Fundación Nueva Generación',
  'La Asociación de Mujeres Afro Víctimas ASOMADERE y la Fundación Nueva Generación habilitaron un punto de acopio.',
  'Facebook: Asomadere - Asociación De Mujeres Afro Y Desplazadas Edificando Redes',
  NULL,
  NULL,
  NULL,
  'Carrera 29 #12-29, barrio San Judas Tadeo, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Fundación Banco de Alimentos de la Diócesis de Quibdó',
  'Punto de acopio del Banco de Alimentos de la Diócesis de Quibdó.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Barrio Yesquita, Calle 21 #4-82, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Fundación Miguel Alejandro',
  'Centro de acopio en el restaurante Grill & Beer.',
  'Redes: @fundacionmiguelalejandro e Instagram @grillandbeerquibdo',
  NULL,
  '3148168863',
  NULL,
  'Restaurante Grill & Beer, Carrera 7 #28-58, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Punto de acopio en barrio Jardín',
  'Punto de acopio en el sector Los Rosales.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 22-13 B100, barrio Jardín, sector Los Rosales, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Casa verde de 2 pisos en Rosales',
  'Punto de acopio en la esquina de Rosales.',
  'Redes: @lavoz_delpacifico',
  NULL,
  '3233957912',
  NULL,
  'Rosales, Calle 121, esquina, casa verde de 2 pisos, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Punto de acopio en El Silencio',
  'Punto de acopio en El Silencio.',
  'Redes: @jmd_lavoz',
  NULL,
  '3202865158',
  NULL,
  'Cra 8 #28-45B, El Silencio, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Fundación Herencia de Timbiquí',
  'Canal para aportes económicos destinados a las comunidades afectadas en Chocó.',
  'Bancolombia, cuenta de ahorros 06211683862, NIT 900.023.250-9. También es posible donar en https://shorturl.at/K0phH
Redes: @herenciadetimbiqui',
  NULL,
  NULL,
  NULL,
  'Chocó',
  'Donación económica',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Fundación Innovación Social Paz y Desarrollo',
  'Centro de acopio en el barrio El Silencio.',
  NULL,
  'Gina Marcela Moreno',
  NULL,
  NULL,
  'Barrio El Silencio, Calle 27 #9-12, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Red departamental de mujeres Chocoanas',
  'Centro de acopio en el barrio Roma.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Barrio Roma, Cra 2 #26-66, segundo piso, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Reddhhpac en Quibdó',
  'La organización de defensa de derechos humanos en el Pacífico (Reddhhpac) habilitó puntos de recepción de ayudas en Quibdó.',
  'Redes: @reddhhpac, @semillasdedignidad, @libreriadelfos1',
  NULL,
  '3235403547',
  NULL,
  'Calle 25 #6-58, barrio Pandeyuca, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Punto de donaciones en Carrera 81',
  'Punto de donaciones.',
  NULL,
  'Mario',
  '3016587928',
  NULL,
  'Carrera 81 33A-08, Quibdó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Consejo Comunitario Mayor del Alto San Juan (ASOCASAN)',
  'Canal de donación en Tadó.',
  'Bre-B / Nequi llave 3016409724.
Redes: @pipedazaocurrencias',
  'Ingrid Lozada',
  '3016409724',
  NULL,
  'Tadó, Chocó',
  'Donación económica',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Alcaldía Municipal de Tadó',
  'Cuenta oficial para donaciones de la Alcaldía de Tadó.',
  'Banco Agrario, cuenta de ahorros 4-337-53-00530-0. Alcaldía Municipal de Tadó. NIT: 8916800816.
Facebook: alcaldiadetado',
  NULL,
  NULL,
  NULL,
  'Tadó, Chocó',
  'Donación económica',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'choco'),
  'Cancha Múltiple de Docordó',
  'Punto de acopio en la cabecera municipal de Docordó.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Cancha Múltiple de la cabecera municipal, Docordó, Chocó',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'quindio'),
  'Banco de Alimentos Monseñor Roberto López Londoño',
  'Punto de acopio en Armenia, de lunes a viernes.',
  'Horario: lunes a viernes de 8:00 a.m. a 5:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Carrera 14 21N-30, Armenia',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'atlantico'),
  'Centro de acopio en Barranquillita',
  'Centro de acopio habilitado las 24 horas.',
  'Habilitado las 24 horas.',
  NULL,
  NULL,
  NULL,
  'Carrera 43 #6-120, Barranquillita, Barranquilla',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'atlantico'),
  'Universidad de la Costa (CUC)',
  'Tres puntos de acopio en el campus de la Universidad de la Costa.',
  'Departamento de Arquitectura y Diseño (bloque 8, piso 2): 8:00 a.m. a 12:00 p.m. y 2:00 p.m. a 5:00 p.m.
Departamento de Ciencias Empresariales (bloque 5, piso 2): 8:00 a.m. a 12:00 p.m. y 2:00 p.m. a 5:00 p.m.
Bienestar Estudiantil (bloque 8, piso 1): horario extendido hasta las 8:00 p.m.
Redes: @unicostacol',
  NULL,
  NULL,
  NULL,
  'Calle 58 #55-66, Barranquilla',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'atlantico'),
  'Punto de acopio de Funcvida',
  'Bodega de acopio sobre la vía 40 hacia Eternit.',
  'Lunes a viernes de 8:30 a.m. a 5:00 p.m.
Redes: @funcvidaoficial',
  NULL,
  '3185932571',
  NULL,
  'Calle 3 #60-177, bodega 6, entrando por la vía 40 hacia Eternit, Barranquilla',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Cruz Roja Colombiana, seccional Cundinamarca y Bogotá',
  'Varios puntos de acopio habilitados por la Cruz Roja.',
  'Avenida Carrera 68 #31-41 Sur: Samu Sur.
Calle 134 - Carrera 7B Bis #132-31: Samu Norte.
Avenida La Esmeralda #63-81: Centro de Salvamento Acuático.
Diagonal 79B #62-53: bodega de la Cruz Roja.
Carrera 24 #73-38: sede administrativa, con operación las 24 horas.',
  NULL,
  NULL,
  NULL,
  'Varios puntos en Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Palacio de los Deportes',
  'Punto de acopio de 8:00 a.m. a 8:00 p.m.',
  'Horario: de 8:00 a.m. a 8:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 63 #54A-06, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Estadio Nemesio Camacho',
  'Punto de acopio de 8:00 a.m. a 9:00 p.m.',
  'Horario: de 8:00 a.m. a 9:00 p.m.
Redes: @senciabogota',
  NULL,
  NULL,
  NULL,
  'Estadio Nemesio Camacho, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Universidad Jorge Tadeo Lozano',
  'Punto de acopio en la Universidad Jorge Tadeo Lozano.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Cra. 4 #22-61, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Casa del Valle',
  'Punto de acopio en La Merced.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 34 #5-50, barrio La Merced, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Centro Comercial Unicentro',
  'Punto de acopio en Unicentro.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Carrera 15 #124-30, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Banco de Alimentos de Bogotá',
  'Punto de acopio del Banco de Alimentos de Bogotá.',
  'Redes: @bancodealimentosbgt',
  NULL,
  NULL,
  NULL,
  'Calle 19A #32-50, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Galería Aborigen',
  'Punto de acopio en Galería Aborigen.',
  'Redes: @galeriaaborigen',
  NULL,
  NULL,
  NULL,
  'Carrera 6a #116-17, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'JAL de Teusaquillo',
  'Punto de acopio de la JAL de Teusaquillo.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Transversal 28B #36-39, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Casa PCN',
  'Punto de acopio en La Candelaria Centro.',
  'Horario: de 9:00 a.m. a 8:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 12D #1A-10, Candelaria Centro, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Fundación Tambores Yoruba',
  'Punto de acopio en Kennedy Central.',
  'Facebook: Tambores Yoruba.',
  NULL,
  '3138500447',
  NULL,
  'Calle 38B Sur #78B-32, Kennedy Central, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Casa de PCR en La Candelaria',
  'Punto de acopio en La Candelaria Centro.',
  NULL,
  NULL,
  '3004951097',
  NULL,
  'Calle 12D #1A-10, barrio La Candelaria Centro, casa de PCR, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Restaurante La tierrita del Berriondo',
  'Punto de acopio en La Candelaria.',
  'Horario: de 9:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Carrera 3 #12C-18, Candelaria, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Casa Afro Las Polonias',
  'Punto de acopio en Candelaria La Nueva.',
  'Redes: @casa_afrolaspolonias',
  NULL,
  NULL,
  NULL,
  'Cra. 36 Bis #64-10 Sur, Candelaria La Nueva, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Edificio Qark',
  'Punto de acopio en el edificio Qark.',
  'Redes: @carolacaceres.c',
  'Carolina Cáceres',
  '3002401873',
  NULL,
  'Carrera 28a #51-88, edificio Qark, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Casa en Carrera 98a',
  'Punto de acopio en casa particular.',
  'Redes: @eldelosplanes',
  'Cristian Cabra',
  '3208000275',
  NULL,
  'Carrera 98a #73-46, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Fundación MujerES SF',
  'Campaña para recolectar y enviar 500 kits de gestión menstrual a Quibdó.',
  'La Fundación MujerES SF lidera una campaña para recolectar y enviar 500 kits de gestión menstrual a Quibdó, en articulación con la Secretaría de la Mujer y Equidad de Género de la Alcaldía de Quibdó. Cada kit cuesta $30.000 COP y se reciben donaciones en especie de productos nuevos, cerrados y sin fragancia. Atención las 24 horas.
Redes: @mujeres.sf',
  NULL,
  NULL,
  NULL,
  'Calle 90 #49A-44, Torre 2, apto 202, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Punto de acopio en Carrera 17',
  'Punto de acopio de 10:30 a.m. a 6:00 p.m.',
  'Horario: de 10:30 a.m. a 6:00 p.m.',
  NULL,
  '3223047076 - 3106601199',
  NULL,
  'Carrera 17 #53-20, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'PactoCol en Teusaquillo',
  'Punto de acopio en Teusaquillo.',
  'Redes: @PactoCol',
  NULL,
  NULL,
  NULL,
  'Carrera 17A #37-27, Teusaquillo, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Colecta Solidaria de Cobijas',
  'Colecta de cobijas de lunes a sábado.',
  'Lunes a sábado de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 30 #15-17, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Hotel Click Clack Bogotá',
  'Punto de acopio las 24 horas.',
  'Atención las 24 horas.
Redes: @clickclackhotels',
  NULL,
  NULL,
  NULL,
  'Carrera 11 #93-77, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Casa Azul',
  'Punto de acopio en Palermo.',
  'Horario: de 10:00 a.m. a 7:00 p.m.
Redes: @casaazulbogota',
  NULL,
  NULL,
  NULL,
  'Carrera 20 #45A-33, barrio Palermo, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Puntos de acopio en centros comerciales de Bogotá',
  'Varios centros comerciales habilitaron puntos de información o administración para recibir ayudas.',
  'Portal 80, Tv. 100 a #80 A-20. Primer piso, punto de información; segundo piso, oficinas de administración. De 8:00 a.m. a 7:00 p.m.
Centro Suba, Calle 145 #91-19. De 9:00 a.m. a 7:00 p.m.
Paseo Villa del Río, Diagonal 57C #62-60 Sur, piso 3, local 303. Lunes a viernes de 8:00 a.m. a 4:00 p.m.
Atlantis Plaza, Calle 81 con Carrera 13, sótano 1. Hasta el 18 de agosto. De 10:00 a.m. a 7:00 p.m.
Avenida Chile, Calle 72 #10-34, primer piso, punto de información.
Centro Mayor, Calle 38A Sur #34D-51, administración, 2.º piso. Todos los días de 8:00 a.m. a 8:00 p.m.
Nuestro Bogotá, Avenida Carrera 86 #55A-75. Lunes a viernes 10:00 a.m. a 7:00 p.m.; sábado 11:00 a.m. a 7:00 p.m.; domingo 12:00 p.m. a 7:00 p.m.
Ciudad Tunal, Calle 47B Sur #24B-33, local 1135. De 9:00 a.m. a 7:00 p.m.
Galerías, Calle 53B #25-21.
Altavista Centro Comercial, Carrera 1 No. 65D-58 Sur. Lunes a viernes 9:00 a.m. a 9:00 p.m.; sábados y domingos 11:00 a.m. a 7:00 p.m.
Meridiano 13 La Felicidad, Calle 18 No. 77-51. De 8:00 a.m. a 5:00 p.m. Hasta el lunes 17 de agosto de 2026.
Outlet Factory, Avenida de las Américas No. 62-84. De 9:00 a.m. a 6:00 p.m.
Palatino, Cra. 7 #138-33, piso 1.
Paseo San Rafael, Av. Cll 134 No. 55-30, primer piso. De 10:00 a.m. a 7:00 p.m.
Plaza Central, Calle 13 Carrera 62, punto de información piso 1. Del 11 al 18 de agosto, 10:00 a.m. a 7:00 p.m.
Plaza de las Américas, segundo piso, junto a Royal Films.
Plaza Imperial, Av. Ciudad de Cali con Av. Suba. A partir de las 8:00 a.m.
Salitre Plaza, Carrera 68 B No. 24-39, punto de atención. Lunes a domingo de 9:00 a.m. a 8:00 p.m.
San Martín, Carrera 7 #32-84, tercer piso, local 319 A.
Subazar, Calle 145 #91-34. Lunes a domingo de 9:00 a.m. a 7:00 p.m.
Titán Plaza, Av. Boyacá #80-94, punto de información. De 9:00 a.m. a 8:00 p.m.
Trebolis Capellanía, Calle 19 A #91-05, oficina de administración, primer piso.
El Porvenir, Calle 54F Sur No. 94-18, punto de información. De 11:00 a.m. a 7:00 p.m.
Unilago, Carrera 15 No. 78-33, puertas 3 y 4.
Puerta Grande San José, en San Andresito, Calle 10 #22-04, punto de información, primer piso.
Fontanar, nivel 0 norte, diagonal al punto de validación.
Parque La Colina, sótano 1 (zona morada). De 9:00 a.m. a 9:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Varios centros comerciales en Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Punto de acopio en Carrera 13',
  'Punto de acopio en oficina.',
  NULL,
  NULL,
  '3223867624',
  NULL,
  'Carrera 13 #32-93, oficina 912, Torre 3, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Manos Visibles',
  'Canal digital de donaciones y tres puntos de recogida en Bogotá.',
  'La organización Manos Visibles abrió un canal para recibir donaciones económicas a través de una plataforma digital. Los aportes pueden realizarse con tarjeta o PSE. Los puntos tienen un horario de recepción de 8:00 a.m. a 6:00 p.m.
Casa Jardín Origen, Calle 38 #29-29, Teusaquillo. Contacto: Sergio Mosquera 3058954149.
Human Construction, Carrera 52A #134D-23, local 1. Contacto: Hillary Angulo 3016441221.
Fundación Catalina Muñoz, Diagonal 48 #19-16.
Redes: @manosvisibles',
  NULL,
  NULL,
  NULL,
  'Tres puntos en Bogotá',
  'Donación económica y puntos de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'santander'),
  'Gobernación de Santander',
  'Punto de acopio de la Gobernación de Santander.',
  'Redes: @gobernaciondesantander',
  NULL,
  NULL,
  NULL,
  'Calle 37 No. 10-30, Bucaramanga',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'santander'),
  'Centro de Gestión Integral del Riesgo de Desastres (CEGIRD)',
  'Recolección las 24 horas.',
  'La recolección se realiza las 24 horas.',
  NULL,
  NULL,
  NULL,
  'Calle 5 #3-18, al lado del Canal TRO, Bucaramanga',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'santander'),
  'Lotería de Santander',
  'Punto de acopio en la Lotería de Santander.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 36 #21-16, Bucaramanga',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'santander'),
  'INDER Santander',
  'Punto de acopio del Instituto Departamental de Recreación y Deportes de Santander.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Bucaramanga',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'santander'),
  'Idesan',
  'Punto de acopio del Instituto Financiero para el Desarrollo de Santander.',
  'Horario: de 8:00 a.m. a 5:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 48 #27 a-48, Bucaramanga',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Ciudadela Petronio Álvarez',
  'Centro de acopio en el Complejo Deportivo Alberto Galindo.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Ciudadela Petronio Álvarez, Complejo Deportivo Alberto Galindo, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Plazoleta Jairo Varela',
  'Punto de acopio en Granada.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Av. 2 Nte #10 Nte-1, Granada, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Asociación Casa Cultural El Chontaduro',
  'Punto de acopio en Marroquín II.',
  'Redes: @elchontadurocasacultural',
  NULL,
  NULL,
  NULL,
  'Diagonal 26G 9 #72s-25, barrio Marroquín II, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Escuela Nacional del Deporte',
  'Punto de acopio en Eucarístico.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Cll 9 #34-01, Eucarístico, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Edificio Santorini, barrio Menga',
  'Punto de acopio en el edificio Santorini.',
  'Números de contacto: 3155538001 / 3117700486.',
  NULL,
  '3155538001 / 3117700486',
  NULL,
  'Avenida 7A Norte #56-120, edificio Santorini, barrio Menga, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Universidad ICESI',
  'Punto de acopio en Pance. Recibe ayudas hasta el 15 de agosto.',
  'Jornada continua de 8:00 a.m. a 5:00 p.m. Se reciben ayudas hasta el 15 de agosto.',
  'Ana Lucía Paz',
  '3207163511',
  NULL,
  'Calle 18 #122-135, Pance, edificio G-108G, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Fundación Pacífico Somos Todos',
  'Punto de acopio en Caney.',
  'Lunes a sábado de 8:00 a.m. a 6:00 p.m.
Redes: @fundacion_pst',
  NULL,
  NULL,
  NULL,
  'Carrera 81 #42-41, Caney, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Parque de la Caña',
  'Punto de acopio en el Parque de la Caña.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Cra. 8 #39-01, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Punto de acopio en Ciudad Córdoba',
  'Punto de acopio en el barrio Ciudad Córdoba.',
  NULL,
  NULL,
  '3113738583',
  NULL,
  'Carrera 49b #51-11, barrio Ciudad Córdoba, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Escuela Politécnica CIFORTED',
  'Punto de acopio en San Bosco.',
  'Horario: de 9:00 a.m. a 8:30 p.m.',
  NULL,
  '3172906261',
  NULL,
  'Carrera 12 #5-64, San Bosco, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Casa Obeso Mejía',
  'Punto de acopio en Casa Obeso Mejía.',
  'Horario: de 8:00 a.m. a 6:00 p.m.
Redes: @casaobesomejia',
  NULL,
  NULL,
  NULL,
  'Avenida 4 Oeste #4-59, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Entre Copas y Amigos',
  'Punto de acopio frente al Puente de López.',
  'Horario: de 9:00 a.m. a 9:00 p.m.
Redes: @entrecopasyamigoscali',
  NULL,
  NULL,
  NULL,
  'Calle 70 #7T Bis 08, barrio Las Ceibas, frente al Puente de López, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Serviteca Central Autopesado',
  'Punto de acopio en el barrio La Unión.',
  'Redes: @ronaldtenoriofranco',
  NULL,
  NULL,
  NULL,
  'Calle 36 #41B-129, barrio La Unión, diagonal a la SIJIN, frente al polideportivo de Villa del Sur, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Resistencia Antirracista y Mujeres de Asfalto',
  'Dos puntos de acopio en Ciudad 2000 y El Diamante.',
  'Redes: @resistencia_antirracista y @mujeresdeasfalto',
  NULL,
  NULL,
  NULL,
  'Carrera 63 #46-95, Ciudad 2000, y Calle 36 #32-07, barrio El Diamante, enseguida de Leandro Gym, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Étnica TV',
  'Centro de acopio en Versalles.',
  'Redes: @etnica_tv',
  NULL,
  NULL,
  NULL,
  'Av. 5ta Norte #21N-52, barrio Versalles, Santiago de Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Casa Cultural Sotavento',
  'Punto de acopio en Casa Cultural Sotavento.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Carrera 22 #4-39, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Restaurante Valle Pacífico',
  'Punto de acopio en el barrio Libertadores.',
  'Redes: @restaurantevallepacifico',
  NULL,
  NULL,
  NULL,
  'Carrera 6 #2-130, barrio Libertadores, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Único Centro Comercial Outlet',
  'Punto de acopio en Yumbo.',
  'Horario: de 8:00 a.m. a 6:00 p.m.
Redes: @unicooutletyumbo',
  NULL,
  NULL,
  NULL,
  'Único Centro Comercial Outlet, bloque 1, primer piso, local 48, Yumbo',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Fundación Biosfera Pacífico',
  'Punto de acopio de Fundación Biosfera Pacífico.',
  'Redes: @biosferapacifico',
  NULL,
  '3175736980 - 3176750457',
  NULL,
  'Av. 5ta Norte 25N-43, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Punto de acopio en Carrera 43A',
  'Punto de acopio en Cali.',
  NULL,
  'Gisel',
  '3136812201',
  NULL,
  'Carrera 43A #14C-85, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Variedades MJ',
  'Punto de acopio en Variedades MJ.',
  'Redes: @mj.variedadesj',
  NULL,
  NULL,
  NULL,
  'Carrera 44 #8A-03, local 12, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Customext S.A.S.',
  'Punto de acopio en Customext.',
  NULL,
  NULL,
  '3144932566 - 3225967334 - 3136122460',
  NULL,
  'Carrera 32 #7-61, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Nova Import S.A.S.',
  'Punto de acopio en San Vicente.',
  NULL,
  NULL,
  '3144932566 - 3225967334 - 3136122460',
  NULL,
  'Calle 23 Nte. #5N-67, San Vicente, Cali',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bolivar'),
  'Coliseo Bernardo Caraballo',
  'Punto de acopio de 7:00 a.m. a 5:00 p.m.',
  'Horario: de 7:00 a.m. a 5:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Carrera 17 con Calle 35A, Cartagena',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bolivar'),
  'Centro Comercial Caribe Plaza',
  'Punto de información para acopio.',
  'Horario: de 10:00 a.m. a 7:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Centro Comercial Caribe Plaza, Cartagena',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bolivar'),
  'Fundación Tierra Grata Colombia',
  'Punto de acopio en el barrio España.',
  'Horario: de 8:00 a.m. a 6:00 p.m.',
  'Carolina Colpas',
  '3237931670',
  NULL,
  'Edificio Torre Mar de Luna, Carrera 44D No. 30-42, barrio España, Cartagena',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bolivar'),
  'Edificio Morros 1',
  'Punto de acopio en Zona Norte.',
  'Horario: de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Edificio Morros 1, al lado del Hotel Las Américas, Zona Norte, Cartagena',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bolivar'),
  'Punto de acopio en Avenida Pedro de Heredia',
  'Punto de acopio de lunes a domingo.',
  'Lunes a domingo de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Avenida Pedro de Heredia #32-190, Cartagena',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bolivar'),
  'Padel Club Bocagrande',
  'Punto de acopio en Bocagrande.',
  'Horario: de 6:00 a.m. a 9:00 p.m.',
  NULL,
  '3104107649',
  NULL,
  'Carrera 4 #7-28, Bocagrande, Cartagena',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'cundinamarca'),
  'Plaza de la Paz de la Gobernación de Cundinamarca',
  'Punto de acopio de la Gobernación de Cundinamarca.',
  'Horario: de 8:00 a.m. a 5:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 26 #51-53, Bogotá',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Cuerpo de Bomberos Voluntarios de Dagua',
  'Punto de acopio en la cabecera municipal de Dagua.',
  'Facebook: Alcaldía De Dagua',
  NULL,
  NULL,
  NULL,
  'Cuerpo de Bomberos Voluntarios, cabecera municipal, Dagua',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Can Love en Envigado',
  'Iniciativa en alianza con Can Love para recolectar ayudas para personas y animales afectados en el Chocó.',
  'Quienes quieran donar pueden comunicarse por mensaje directo para recibir información sobre la entrega o coordinar la recolección de las ayudas.
Redes: @canlove01',
  NULL,
  NULL,
  NULL,
  'Envigado',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'tolima'),
  'Casa del Maestro',
  'Punto de acopio de lunes a sábado en jornada continua.',
  'De lunes a sábado, jornada continua, de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 37 con carrera 4G, esquina, Ibagué',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'tolima'),
  'Banco Arquidiocesano de Alimentos de Ibagué',
  'Punto de acopio del Banco Arquidiocesano de Alimentos.',
  'Facebook: Banco De Alimentos Ibagué.',
  NULL,
  NULL,
  NULL,
  'Carrera 4ta Estadio #23-42, Ibagué',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'tolima'),
  'Casa del Deportista',
  'Punto de acopio en Naciones Unidas.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 35 #3-47, barrio Naciones Unidas, Ibagué',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'tolima'),
  'Polideportivo Bocaneme',
  'Punto de acopio de 9:00 a.m. a 5:00 p.m.',
  'Horario: de 9:00 a.m. a 5:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 74 #75, Ibagué',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Consejo Municipal de Juventudes de Itagüí y AfroDhamiri',
  'Punto de acopio en el Parque Principal de Itagüí.',
  'Horario: entre las 10:00 a.m. y las 5:00 p.m.
Redes: @cmj_itagui',
  NULL,
  NULL,
  NULL,
  'Parque Principal de Itagüí',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'caldas'),
  'Banco Arquidiocesano de Alimentos de Manizales',
  'Punto de acopio de lunes a viernes.',
  'Lunes a viernes de 8:00 a.m. a 5:00 p.m.
Redes: @bancodealimentosmanizales',
  NULL,
  '3104184472',
  NULL,
  'Calle 49 No. 27A-85 y Carrera 9 #19-03, Manizales',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Reddhhpac en Medellín',
  'La organización de defensa de derechos humanos en el Pacífico (Reddhhpac) habilitó este punto en Medellín.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 25 sur #6-58, barrio Pandeyuca, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Agité Teatro y Corporación La Parla',
  'Punto de acopio en el barrio Bostón.',
  'WhatsApp: 3106625665 - 3122871656.
Redes: @teatrolaparla y @agiteteatro',
  NULL,
  '3106625665 - 3122871656',
  NULL,
  'Calle 52 #39A-30, barrio Bostón, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Hotel Click Clack Medellín',
  'Punto de acopio las 24 horas.',
  'Atención las 24 horas.
Redes: @clickclackhotels',
  NULL,
  NULL,
  NULL,
  'Calle 10B #38-29, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Librería Rodante Delfos',
  'Punto de acopio en Laureles-Estadio.',
  NULL,
  NULL,
  '3123661304',
  NULL,
  'Carrera 79 #52A-23, sector Laureles-Estadio, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Mall 30 Plus, Belén Rosales',
  'Punto de acopio en Belén Rosales.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 30 #69-180, local 3, Mall 30 Plus, Belén Rosales, diagonal a la estación Rosales del Metroplús, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Terminal del Norte',
  'Punto de acopio de 8:00 a.m. a 1:00 p.m.',
  'Horario: de 8:00 a.m. a 1:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Terminal del Norte, local 9840, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Fundación Banco Arquidiocesano de Alimentos de Medellín',
  'Punto de acopio de 8:00 a.m. a 2:00 p.m.',
  'Horario: de 8:00 a.m. a 2:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Carrera 52 #30A-97, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Fundación Saciar',
  'Punto de acopio de 8:00 a.m. a 2:00 p.m.',
  'Horario: de 8:00 a.m. a 2:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Carrera 50 #25-261, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Parque Biblioteca Belén',
  'Punto de acopio en el Parque Biblioteca Belén.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Carrera 76 #18A-19, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Parque Biblioteca San Javier',
  'Punto de acopio en el Parque Biblioteca San Javier.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 42C #95-50, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Parque Biblioteca Gabriel García Márquez',
  'Punto de acopio en Doce de Octubre.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Doce de Octubre, carrera 80 #104-04, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Parque Biblioteca León de Greiff',
  'Punto de acopio en La Ladera.',
  NULL,
  NULL,
  NULL,
  NULL,
  'La Ladera, Calle 59A #36-30, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Biblioteca Pública El Poblado',
  'Punto de acopio en El Poblado.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 3B Sur #29B-56, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Politécnico Grancolombiano',
  'Punto de acopio en Laureles – Estadio.',
  'Horario: de 9:00 a.m. a 12:00 p.m. y de 2:00 p.m. a 5:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Cra. 74 #52-20, Laureles – Estadio, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Universidad de Antioquia y colectivo AfroUdeA',
  'Puntos de acopio en el Bloque 9. No están recibiendo ropa.',
  'Proyecto Oficinas Estudiantiles (POE), Bloque 9, oficina 211B. De 9:00 a.m. a 5:00 p.m. También, el colectivo de estudiantes afro AfroUdeA recibe donaciones en la oficina ubicada en los bajos del Bloque 9. El punto funciona de lunes a viernes. No están recibiendo ropa por razones de logística y priorización.',
  'Ximena Hernández',
  '3114505940',
  NULL,
  'Universidad de Antioquia, Bloque 9, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'antioquia'),
  'Universidad EAFIT',
  'Punto de acopio en la placa cubierta.',
  'Horario: de 9:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Carrera 49 #7 Sur-50, placa cubierta, Medellín',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Fundación Resistencia Antirracista',
  'Punto de acopio en Palmira.',
  'Redes: @resistencia_antirracista',
  NULL,
  NULL,
  NULL,
  'Diagonal 24C #6A-83, Palmira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Expofuturo',
  'Punto de acopio de lunes a domingo.',
  'De lunes a domingo de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Avenida 30 de agosto #87-76, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café Consota',
  'Punto de acopio en Villa Consota.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Mz 7 y Mz 8 Villa Consota Cuba, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café Perla del Otún',
  'Punto de acopio frente a la iglesia de los 2.500 lotes.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Diagonal a la iglesia de los 2.500 lotes, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café El Remanso',
  'Punto de acopio al lado del centro de salud.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Avenida principal barrio El Remanso, al lado del centro de salud, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café Kennedy',
  'Punto de acopio en el parque principal de Kennedy.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Parque principal de Kennedy, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café Ormanza',
  'Punto de acopio en la avenida del Río.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Calle 3 bis #5-38, avenida del Río, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café San Nicolás',
  'Punto de acopio en la antigua estación de Policía.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Carrera 14 bis #28-38, antigua estación de Policía, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'risaralda'),
  'Café Comuna del Café',
  'Punto de acopio en el Parque Industrial.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Carrera 3 calle 59 A, sector A Parque Industrial, Pereira',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'quindio'),
  'Lavandería J&M',
  'Punto de acopio en Quimbaya.',
  NULL,
  NULL,
  NULL,
  NULL,
  'Carrera 5 #13-30, Quimbaya, Quindío',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'quindio'),
  'Club Rotario de Quimbaya',
  'Punto de acopio habilitado durante todo el día.',
  'Está habilitado durante todo el día.
Redes: @clubrotarioquimbaya y @alcaldiadequimbaya',
  NULL,
  NULL,
  NULL,
  'Sede del Club Rotario de Quimbaya, rotonda, entrada por Montenegro, Quimbaya',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'quindio'),
  'Centro de Convenciones del Quindío',
  'Punto de acopio de 8:00 a.m. a 8:00 p.m.',
  'Horario: de 8:00 a.m. a 8:00 p.m.
Facebook: Gobernación del Quindío.',
  NULL,
  NULL,
  NULL,
  'Centro de Convenciones del Quindío',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'cundinamarca'),
  'Cuerpo Oficial de Bomberos de Soacha',
  'Punto de acopio en la Comuna 2.',
  'Facebook: Bomberos Oficiales Soacha.',
  NULL,
  NULL,
  NULL,
  'Calle 22 No. 9-10, Comuna 2, Soacha',
  'Punto de acopio',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'bogota'),
  'Banco Distrital de Sangre IDCBIS',
  'El Banco Distrital de Sangre IDCBIS ha enviado 89 unidades de componentes sanguíneos a Quibdó e invita a donar.',
  'Las autoridades invitan a la ciudadanía a donar para mantener las reservas y continuar atendiendo a los pacientes en las zonas afectadas. De domingo a domingo de 8:00 a.m. a 5:00 p.m. Revisar idcbis.org.co/banco-distrital-de-sangre para confirmar los puntos, ya que constantemente los están actualizando y ubican jornadas de donación adicionales.
Viernes 14 de agosto: Secretaría Distrital de Salud, 8:00 a.m. a 5:00 p.m.
Sábado 15 de agosto: Centro Comercial Plaza Imperial, 11:00 a.m. a 6:00 p.m.
Domingo 16 de agosto: Iglesia María Madre Admirable, 8:00 a.m. a 3:30 p.m.; Parque Timiza, 9:00 a.m. a 4:30 p.m.; Parque San Andrés, 9:00 a.m. a 4:30 p.m.
Lunes 17 de agosto: Parque El Tunal, 9:30 a.m. a 5:30 p.m.; Parque Gilma Jiménez, 9:00 a.m. a 4:30 p.m.; Centro Comercial Plaza Imperial, 10:30 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Bogotá. Confirmar puntos en idcbis.org.co/banco-distrital-de-sangre',
  'Banco de sangre',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Banco de sangre HUV',
  'Punto permanente de donación de sangre en el Hospital Universitario del Valle.',
  'Activo de manera permanente de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 5ta #36-08, urgencias del Hospital Universitario del Valle, Cali',
  'Banco de sangre',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Banco de sangre Hemolife',
  'Punto permanente de donación de sangre.',
  'Activo de manera permanente de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Calle 38 N #3N-21, Prados del Norte, Cali',
  'Banco de sangre',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Banco de sangre Cruz Roja Valle',
  'Punto permanente de donación de sangre.',
  'Activo de manera permanente de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Parqueadero Cruz Roja Valle, carrera 38 bis #5B, San Fernando, Cali',
  'Banco de sangre',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Banco de sangre Fundación Valle del Lili',
  'Punto permanente de donación de sangre.',
  'Activo de manera permanente de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Sede principal, torre 2, piso 4, Cali',
  'Banco de sangre',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);

INSERT INTO aid_entries (
  department_id, title, summary, body, contact_name, contact_phone, contact_email,
  location, category, source, status, published_at
) VALUES (
  (SELECT id FROM departments WHERE slug = 'valle-del-cauca'),
  'Banco de sangre Imbanaco',
  'Punto permanente de donación de sangre.',
  'Activo de manera permanente de 8:00 a.m. a 6:00 p.m.',
  NULL,
  NULL,
  NULL,
  'Sede principal, carrera 38 bis #5B2-04, Santa Isabel, Cali',
  'Banco de sangre',
  'Guía de puntos de acopio y ayudas humanitarias — AfroUp, actualización 14 de agosto de 2026',
  'published',
  '2026-08-14T00:00:00Z'
);
