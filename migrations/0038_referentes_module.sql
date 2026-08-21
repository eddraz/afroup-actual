-- Migration 0038: Referentes Module (Comunidad / Figuras y Líderes)

-- 1. Register 'referentes' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Referentes', 'referentes', 'Gestión del catálogo de figuras, líderes históricos y contemporáneos de la diáspora afro.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'referentes');

-- 2. Register permissions: create, read, update, delete for 'referentes' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'referentes'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'referentes' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'referentes')
 WHERE r.name = 'Administrador'
   AND NOT EXISTS (
     SELECT 1 FROM admin_role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
   );

-- 4. Grant direct permissions to active administrator users
INSERT INTO admin_user_permissions (user_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT u.id, p.id, 1, NULL, 1, 1
  FROM users u
  CROSS JOIN admin_permissions p
 WHERE u.email IN ('jenniffer@afroup.com', 'tantaroth@gmail.com', 'tantaorth@gmail.com')
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'referentes')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create referentes table
CREATE TABLE IF NOT EXISTS referentes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category_tag TEXT NOT NULL DEFAULT 'Historia',
  badge_theme TEXT NOT NULL DEFAULT 'primary',
  photo_url TEXT,
  years_active TEXT,
  quote TEXT,
  milestones_json TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'published',
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_referentes_status_sort ON referentes (status, featured DESC, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referentes_category ON referentes (category_tag);

-- 6. Create referente_locales table
CREATE TABLE IF NOT EXISTS referente_locales (
  referente_id INTEGER NOT NULL REFERENCES referentes(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  role_label TEXT,
  years_label TEXT,
  dek TEXT,
  bio_html TEXT,
  quote TEXT,
  milestones_json TEXT DEFAULT '[]',
  og_json TEXT,
  PRIMARY KEY (referente_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_referente_locales_lookup ON referente_locales (referente_id, locale);

-- 7. Create referentes_page_locales table
CREATE TABLE IF NOT EXISTS referentes_page_locales (
  locale TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Comunidad',
  title TEXT NOT NULL DEFAULT 'Referentes',
  lead TEXT NOT NULL DEFAULT 'Las personas que abrieron camino — de la historia y del presente. Conocerlas es parte de conocernos.',
  band_title TEXT NOT NULL DEFAULT '¿Falta alguien?',
  band_dek TEXT NOT NULL DEFAULT 'Propón un referente para la colección.',
  band_cta_label TEXT NOT NULL DEFAULT 'Proponer',
  band_cta_url TEXT NOT NULL DEFAULT '/colabora',
  og_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Seed Page configuration for es & en
INSERT OR IGNORE INTO referentes_page_locales (locale, eyebrow, title, lead, band_title, band_dek, band_cta_label, band_cta_url)
VALUES
  (
    'es',
    'Comunidad',
    'Referentes',
    'Las personas que abrieron camino — de la historia y del presente. Conocerlas es parte de conocernos.',
    '¿Falta alguien?',
    'Propón un referente para la colección.',
    'Proponer',
    '/colabora'
  ),
  (
    'en',
    'Community',
    'Role Models & Figures',
    'The people who paved the way — from history and the present. Knowing them is part of knowing ourselves.',
    'Is someone missing?',
    'Propose a role model or historical figure for the collection.',
    'Propose',
    '/en/colabora'
  );

-- 9. Seed 6 Initial Referentes
INSERT OR IGNORE INTO referentes (id, slug, category_tag, badge_theme, years_active, status, featured, sort_order)
VALUES
  (1, 'martin-luther-king-jr', 'Activismo', 'primary', '1929–1968', 'published', 1, 1),
  (2, 'reina-nzinga', 'Historia', 'secondary', '1583–1663', 'published', 1, 2),
  (3, 'lelia-gonzalez', 'Pensamiento', 'accent', '1935–1994', 'published', 1, 3),
  (4, 'benkos-bioho', 'Historia', 'secondary', 's. XVII', 'published', 0, 4),
  (5, 'nina-simone', 'Arte', 'primary', '1933–2003', 'published', 0, 5),
  (6, 'francia-marquez', 'Activismo', 'accent', 'Presente', 'published', 1, 6);

-- Seed Spanish translations
INSERT OR IGNORE INTO referente_locales (referente_id, locale, name, role_label, years_label, dek, bio_html, quote, milestones_json)
VALUES
  (
    1,
    'es',
    'Martin Luther King Jr.',
    'Activismo · Derechos civiles',
    'Atlanta, 1929 — Memphis, 1968',
    'Pastor, orador y líder del movimiento por los derechos civiles en Estados Unidos. Su lucha noviolenta contra la segregación cambió las leyes — y sigue inspirando a la diáspora entera.',
    '<p>De Montgomery a Washington, King articuló un movimiento de masas que combinó desobediencia civil, organización comunitaria y una visión radical de justicia económica que suele olvidarse: la Campaña de los Pobres fue su última gran batalla.</p><p>Su liderazgo transformó la lucha por la igualdad racial en un referente universal de dignidad humana y derechos inalienables.</p>',
    '“La verdadera paz no es la ausencia de tensión: es la presencia de justicia.”',
    '[{"year":"1955","event":"Lidera el boicot de autobuses de Montgomery tras el arresto de Rosa Parks."},{"year":"1963","event":"Marcha sobre Washington: pronuncia “I Have a Dream” ante 250.000 personas."},{"year":"1964","event":"Premio Nobel de la Paz; se aprueba la Ley de Derechos Civiles."},{"year":"1968","event":"Es asesinado en Memphis mientras apoyaba una huelga de trabajadores."}]'
  ),
  (
    2,
    'es',
    'Reina Nzinga',
    'Historia · Resistencia anticolonial',
    'Ndongo y Matamba, 1583–1663',
    'Monarca de los reinos de Ndongo y Matamba (actual Angola). Brillante diplomática y estratega militar que combatió durante décadas los avances colonialistas y la trata esclavista portuguesa.',
    '<p>Nzinga Mbande es una de las figuras más formidables de la historia africana. Utilizó alianzas diplomáticas, tácticas de guerrilla y su profundo liderazgo para proteger la soberanía de su pueblo durante más de cuatro décadas.</p>',
    '“Nadie doblega a quien conoce el valor de su tierra y la libertad de su gente.”',
    '[{"year":"1622","event":"Negocia en Luanda un histórico tratado de paz de igual a igual con el gobernador portugués."},{"year":"1624","event":"Asciende al trono de Ndongo y declara su territorio santuario para personas esclavizadas fugitivas."},{"year":"1631","event":"Funda el reino unificado de Ndongo-Matamba consolidando un ejército de resistencia."},{"year":"1656","event":"Firma un tratado de paz definitivo obligando a los invasores a reconocer su soberanía."}]'
  ),
  (
    3,
    'es',
    'Lélia Gonzalez',
    'Pensamiento · Filosofía y feminismo negro',
    'Belo Horizonte, 1935 — Río de Janeiro, 1994',
    'Antropóloga, intelectual, política y activista brasileña. Pionera en articular la intersección de raza, clase y género en América Latina a través del concepto de «Amefricanidad».',
    '<p>Cofundadora del Movimiento Negro Unificado (MNU) y del Instituto de Investigación de las Culturas Negras (IPCN), Lélia desmanteló el mito de la democracia racial en Brasil y formuló un pensamiento crítico anticolonial imprescindible.</p>',
    '“El racismo latinoamericano es lo suficientemente sofisticado como para mantener a los negros y los indios en condición de segmentos dominados.”',
    '[{"year":"1978","event":"Cofunda el Movimiento Negro Unificado (MNU) en las escalinatas del Teatro Municipal de São Paulo."},{"year":"1982","event":"Candidata a diputada federal, impulsando la agenda afrobrasileña en el parlamento."},{"year":"1988","event":"Publica sus ensayos fundamentales sobre «Amefricanidad» y feminismo afrodiaspórico."}]'
  ),
  (
    4,
    'es',
    'Benkos Biohó',
    'Historia · Cimarronaje y libertad',
    'Islas Bijagós (Guinea-Bisáu) — Cartagena de Indias, 1621',
    'Líder cimarrón que encabezó la rebelión de esclavizados en el Nuevo Reino de Granada y fundó el Palenque de San Basilio, el primer pueblo libre de la América colonial.',
    '<p>Secuestrado en África Occidental, Benkos escapó a fines del siglo XVI y organizó una red de palenques autónomos en los Montes de María, desafiando a la Corona Española con un ejército disciplinado y una diplomacia inquebrantable.</p>',
    '“En el monte no hay amos: la libertad se defiende con la vida.”',
    '[{"year":"1599","event":"Lidera la gran fuga de Cartagena hacia las ciénagas y ciudadelas de los Montes de María."},{"year":"1605","event":"Firma la capitulación de paz con el gobernador, logrando el reconocimiento de la autonomía de su pueblo."},{"year":"1619","event":"Es traicionado y capturado tras años de convivencia pacífica con la corona."},{"year":"1621","event":"Ejecutado en Cartagena; su legado germina el posterior decreto real de libertad absoluta para Palenque."}]'
  ),
  (
    5,
    'es',
    'Nina Simone',
    'Arte · Música y derechos civiles',
    'Tryon, 1933 — Carry-le-Rouet, 2003',
    'Cantante, compositora y virtuosa pianista estadounidense. Apodada «La Alta Sacerdotisa del Soul», convirtió su arte en el himno sonoro de la liberación negra.',
    '<p>Eunice Kathleen Waymon combinó música clásica, jazz, blues, góspel y folk con un activismo intransigente. Canciones como «Mississippi Goddam» o «To Be Young, Gifted and Black» definieron una era de dignidad y resistencia cultural.</p>',
    '“Te diré lo que la libertad significa para mí: no tener miedo.”',
    '[{"year":"1958","event":"Lanza su legendaria versión de «I Loves You, Porgy» alcanzando reconocimiento nacional."},{"year":"1964","event":"Compone «Mississippi Goddam» en respuesta al asesinato de Medgar Evers."},{"year":"1969","event":"Lanza «To Be Young, Gifted and Black» en homenaje a Lorraine Hansberry."}]'
  ),
  (
    6,
    'es',
    'Francia Márquez',
    'Activismo · Derechos territoriales y política',
    'Suárez, Cauca, 1981 — Presente',
    'Líder social afrocolombiana, abogada ambientalista, ganadora del Premio Goldman y Vicepresidenta de Colombia. Símbolo de la lucha territorial comunitaria de «los nadie».',
    '<p>Desde su juventud en La Toma (Cauca), Francia defendió el río Ovejas y las tierras ancestrales contra la minería ilegal y los megaproyectos. Su ascenso político abrió las puertas de la representación estatal a las comunidades históricamente marginadas.</p>',
    '“Hasta que la dignidad se haga costumbre.”',
    '[{"year":"2014","event":"Lidera la «Marcha de los Turbantes» de 350 km desde el Cauca hasta Bogotá por los derechos sobre la tierra."},{"year":"2018","event":"Galardonada con el Premio Ambiental Goldman («Nobel ambiental») por su defensa territorial."},{"year":"2022","event":"Electa Vicepresidenta de la República de Colombia, primera mujer afrodescendiente en el cargo."}]'
  );

-- Seed English translations
INSERT OR IGNORE INTO referente_locales (referente_id, locale, name, role_label, years_label, dek, bio_html, quote, milestones_json)
VALUES
  (
    1,
    'en',
    'Martin Luther King Jr.',
    'Activism · Civil rights',
    'Atlanta, 1929 — Memphis, 1968',
    'Minister, orator and paramount leader of the American Civil Rights Movement. His nonviolent struggle against segregation transformed laws and continues to inspire the global diaspora.',
    '<p>From Montgomery to Washington, King articulated a grassroots movement combining civil disobedience, community organizing, and a radical vision of economic justice: the Poor People''s Campaign was his final battle.</p>',
    '“True peace is not merely the absence of tension: it is the presence of justice.”',
    '[{"year":"1955","event":"Leads the Montgomery Bus Boycott following the arrest of Rosa Parks."},{"year":"1963","event":"March on Washington: delivers “I Have a Dream” before 250,000 people."},{"year":"1964","event":"Nobel Peace Prize laureate; the Civil Rights Act is signed into law."},{"year":"1968","event":"Assassinated in Memphis while supporting striking sanitation workers."}]'
  ),
  (
    2,
    'en',
    'Queen Nzinga',
    'History · Anticolonial resistance',
    'Ndongo & Matamba, 1583–1663',
    'Monarch of the Ndongo and Matamba kingdoms (present-day Angola). A brilliant diplomat and military strategist who fought Portuguese colonial expansion and the slave trade for decades.',
    '<p>Nzinga Mbande stands as one of the most formidable figures in African history. She employed shrewd diplomatic alliances, guerrilla tactics, and charismatic leadership to safeguard her people''s sovereignty for over forty years.</p>',
    '“Nobody bends those who understand the value of their homeland and their freedom.”',
    '[{"year":"1622","event":"Negotiates a historic peace treaty as an equal with the Portuguese governor in Luanda."},{"year":"1624","event":"Ascends to the Ndongo throne, declaring her kingdom a sanctuary for escaped enslaved people."},{"year":"1631","event":"Founds the unified kingdom of Ndongo-Matamba, building a powerful resistance army."},{"year":"1656","event":"Signs a lasting peace treaty forcing colonial invaders to recognize her sovereignty."}]'
  ),
  (
    3,
    'en',
    'Lélia Gonzalez',
    'Thought · Black feminism & philosophy',
    'Belo Horizonte, 1935 — Rio de Janeiro, 1994',
    'Brazilian anthropologist, intellectual, politician and activist. Pioneer in articulating race, class and gender intersectionality across Latin America through the concept of «Amefricanity».',
    '<p>Co-founder of the Unified Black Movement (MNU) and the Black Cultures Research Institute (IPCN), Lélia dismantled the myth of racial democracy in Brazil and formulated vital anticolonial critical theory.</p>',
    '“Latin American racism is sophisticated enough to keep Blacks and Indigenous people in subordinate status.”',
    '[{"year":"1978","event":"Co-founds the Unified Black Movement (MNU) on the steps of São Paulo Municipal Theatre."},{"year":"1982","event":"Runs for federal deputy, championing Afro-Brazilian priorities in parliament."},{"year":"1988","event":"Publishes seminal essays on «Amefricanity» and Afrodiasporic feminism."}]'
  ),
  (
    4,
    'en',
    'Benkos Biohó',
    'History · Maroon resistance & freedom',
    'Bijagós Islands (Guinea-Bissau) — Cartagena, 1621',
    'Maroon leader who spearheaded enslaved rebellions in the New Kingdom of Granada and founded Palenque de San Basilio, the first free town in colonial America.',
    '<p>Kidnapped in West Africa, Benkos escaped in the late 16th century and organized a network of autonomous palenques in Montes de María, defying the Spanish Crown with disciplined defense and unwavering diplomacy.</p>',
    '“In the wilderness there are no masters: freedom is defended with our lives.”',
    '[{"year":"1599","event":"Leads the great escape from Cartagena into the swamps of Montes de María."},{"year":"1605","event":"Signs peace capitulations with the colonial governor, gaining autonomous recognition."},{"year":"1619","event":"Betrayed and captured after years of peaceful coexistence with the crown."},{"year":"1621","event":"Executed in Cartagena; his legacy spurred the eventual royal decree granting absolute freedom to Palenque."}]'
  ),
  (
    5,
    'en',
    'Nina Simone',
    'Art · Music & civil rights',
    'Tryon, 1933 — Carry-le-Rouet, 2003',
    'American singer, songwriter and virtuoso pianist. Known as «The High Priestess of Soul», she turned her art into the defining soundtrack of Black liberation.',
    '<p>Eunice Kathleen Waymon melded classical music, jazz, blues, gospel and folk with uncompromising activism. Songs like «Mississippi Goddam» and «To Be Young, Gifted and Black» captured a generational cry for dignity.</p>',
    '“I''ll tell you what freedom is to me: no fear.”',
    '[{"year":"1958","event":"Releases landmark rendition of «I Loves You, Porgy» gaining national acclaim."},{"year":"1964","event":"Composes «Mississippi Goddam» in response to the murder of Medgar Evers."},{"year":"1969","event":"Releases «To Be Young, Gifted and Black» honoring Lorraine Hansberry."}]'
  ),
  (
    6,
    'en',
    'Francia Márquez',
    'Activism · Environmental justice & politics',
    'Suárez, Cauca, 1981 — Present',
    'Afro-Colombian community leader, environmental lawyer, Goldman Environmental Prize recipient and Vice President of Colombia. Champion for territorial autonomy and ancestral rights.',
    '<p>Since her youth in La Toma (Cauca), Francia defended the Ovejas River and ancestral lands against illegal mining. Her political ascent opened state representation to historically marginalized communities.</p>',
    '“Until dignity becomes the norm.”',
    '[{"year":"2014","event":"Leads the 350-km «March of the Turbans» from Cauca to Bogotá for ancestral land rights."},{"year":"2018","event":"Awarded the Goldman Environmental Prize («Environmental Nobel») for territorial defense."},{"year":"2022","event":"Elected Vice President of Colombia, the first Afro-descendant woman in the office."}]'
  );

-- 10. Populate search_documents for seeded Referentes
INSERT OR REPLACE INTO search_documents (module_slug, record_id, locale, title, summary, tags, kind, path, extra, published_at)
VALUES
  ('referentes', 1, 'es', 'Martin Luther King Jr.', 'Pastor, orador y líder del movimiento por los derechos civiles en Estados Unidos.', 'Martin Luther King Jr. Activismo Derechos civiles Estados Unidos', 'Referente', '/referente/martin-luther-king-jr', 'Activismo', datetime('now')),
  ('referentes', 1, 'en', 'Martin Luther King Jr.', 'Minister, orator and paramount leader of the American Civil Rights Movement.', 'Martin Luther King Jr. Activism Civil rights United States', 'Role Model', '/en/referente/martin-luther-king-jr', 'Activism', datetime('now')),
  ('referentes', 2, 'es', 'Reina Nzinga', 'Monarca de los reinos de Ndongo y Matamba. Brillante diplomática y estratega militar anticolonial.', 'Reina Nzinga Historia Angola Ndongo Matamba Resistencia', 'Referente', '/referente/reina-nzinga', 'Historia', datetime('now')),
  ('referentes', 2, 'en', 'Queen Nzinga', 'Monarch of Ndongo and Matamba kingdoms. Brilliant diplomat and anticolonial military strategist.', 'Queen Nzinga History Angola Ndongo Matamba Resistance', 'Role Model', '/en/referente/reina-nzinga', 'History', datetime('now')),
  ('referentes', 3, 'es', 'Lélia Gonzalez', 'Antropóloga, intelectual y activista brasileña pionera de la Amefricanidad.', 'Lelia Gonzalez Pensamiento Filosofia Feminismo negro Brasil Amefricanidad', 'Referente', '/referente/lelia-gonzalez', 'Pensamiento', datetime('now')),
  ('referentes', 3, 'en', 'Lélia Gonzalez', 'Brazilian anthropologist, intellectual and activist pioneer of Amefricanity.', 'Lelia Gonzalez Thought Philosophy Black feminism Brazil Amefricanity', 'Role Model', '/en/referente/lelia-gonzalez', 'Thought', datetime('now')),
  ('referentes', 4, 'es', 'Benkos Biohó', 'Líder cimarrón que fundó el Palenque de San Basilio, primer pueblo libre de América.', 'Benkos Bioho Historia Cimarronaje Palenque Colombia Libertad', 'Referente', '/referente/benkos-bioho', 'Historia', datetime('now')),
  ('referentes', 4, 'en', 'Benkos Biohó', 'Maroon leader who founded Palenque de San Basilio, the first free town in America.', 'Benkos Bioho History Maroon Palenque Colombia Freedom', 'Role Model', '/en/referente/benkos-bioho', 'History', datetime('now')),
  ('referentes', 5, 'es', 'Nina Simone', 'Cantante, compositora y pianista, la voz musical de la lucha por los derechos civiles.', 'Nina Simone Arte Musica Soul Jazz Derechos civiles', 'Referente', '/referente/nina-simone', 'Arte', datetime('now')),
  ('referentes', 5, 'en', 'Nina Simone', 'Singer, songwriter and pianist, the musical voice of the civil rights struggle.', 'Nina Simone Art Music Soul Jazz Civil rights', 'Role Model', '/en/referente/nina-simone', 'Art', datetime('now')),
  ('referentes', 6, 'es', 'Francia Márquez', 'Líder social afrocolombiana, abogada ambientalista y Vicepresidenta de Colombia.', 'Francia Marquez Activismo Derechos territoriales Colombia Goldman', 'Referente', '/referente/francia-marquez', 'Activismo', datetime('now')),
  ('referentes', 6, 'en', 'Francia Márquez', 'Afro-Colombian community leader, environmental lawyer and Vice President of Colombia.', 'Francia Marquez Activism Territorial rights Colombia Goldman', 'Role Model', '/en/referente/francia-marquez', 'Activism', datetime('now'));
