#!/usr/bin/env python3
"""Generate migrations/0002_seed_official_guide.sql from the official AfroUp guide."""

from pathlib import Path

SOURCE = (
    "Guía de puntos de acopio y ayudas humanitarias — AfroUp, "
    "actualización 14 de agosto de 2026"
)
PUBLISHED_AT = "2026-08-14T00:00:00Z"

NEW_DEPARTMENTS = [
    ("bogota", "Bogotá"),
    ("cundinamarca", "Cundinamarca"),
    ("atlantico", "Atlántico"),
    ("santander", "Santander"),
    ("bolivar", "Bolívar"),
    ("tolima", "Tolima"),
]


def entry(department, title, *, summary=None, body=None, location=None,
          category="Punto de acopio", contact_name=None, contact_phone=None,
          contact_email=None):
    return {
        "department": department,
        "title": title,
        "summary": summary,
        "body": body,
        "location": location,
        "category": category,
        "contact_name": contact_name,
        "contact_phone": contact_phone,
        "contact_email": contact_email,
        "source": SOURCE,
    }


ENTRIES = [
    entry(
        "valle-del-cauca",
        "Oficina de Atención al Ciudadano",
        summary="Punto de acopio en Buenaventura, diagonal a la Alcaldía.",
        location="Oficina de Atención al Ciudadano, diagonal a la Alcaldía, Buenaventura",
    ),
    entry(
        "valle-del-cauca",
        "Fundaproductividad y Redmupaz",
        summary="Fundación Social para la Productividad y Redmupaz se unieron para apoyar a las familias afectadas.",
        body="Centro Comercial Bellavista. Local 14, tercer piso.",
        location="Centro Comercial Bellavista, local 14, tercer piso, Buenaventura",
    ),
    entry(
        "valle-del-cauca",
        "Punto de acopio en el centro de Buenaventura",
        summary="Punto de acopio al lado del Torito Rojo, en el centro por la primera.",
        location="Calle 1 Cr. 6a-45, al lado del Torito Rojo, centro de Buenaventura",
        contact_phone="3107019109",
    ),
    entry(
        "valle-del-cauca",
        "Asociación de Parteras Unidas del Pacífico (ASOPARUPA)",
        summary="Punto de acopio de ASOPARUPA en Independencia, segunda etapa.",
        body="Redes: @asoparupa",
        location="Carrera 59 N° 7A-11, barrio Independencia 2 etapa, Buenaventura",
    ),
    entry(
        "valle-del-cauca",
        "Apadrina una familia en Buenaventura",
        summary="Inscripción para ser contactado y apadrinar una familia en Buenaventura.",
        body="Link de inscripción: https://shorturl.at/D84wL\nMás información en redes: @elagricultorcol",
        category="Apadrinamiento",
        location="Buenaventura",
    ),
    entry(
        "choco",
        "Hospital Local Ismael Roldán Valencia",
        summary="Punto de acopio en Quibdó.",
        body="Redes: @hospitalismaelroldan",
        location="Calle 21 #20-126, Quibdó",
    ),
    entry(
        "choco",
        "Centro Logístico Humanitario del Departamento del Chocó",
        summary="Centro logístico humanitario en la antigua bodega Postobón.",
        location="Antigua Bodega Postobón, kilómetro 4, vía Quibdó - Yuto",
    ),
    entry(
        "choco",
        "Gobernación del Chocó",
        summary="Punto de acopio y cuenta única habilitada para ayuda humanitaria.",
        body=(
            "La Gobernación del Chocó habilitó una única cuenta bancaria en el Banco de Bogotá, "
            "cuenta de ahorros 578818429, a nombre de Ayuda humanitaria, con NIT 891.680.010-3. "
            "La cuenta pertenece a la Gobernación del Chocó y está a cargo del Fondo Departamental "
            "de Gestión del Riesgo del Chocó.\n"
            "Instagram y Facebook: @gobernaciondelchoco"
        ),
        category="Punto de acopio y donación económica",
        location="Calle 31, Edificio La Confianza, Quibdó",
    ),
    entry(
        "choco",
        "ASOMADERE y Fundación Nueva Generación",
        summary="La Asociación de Mujeres Afro Víctimas ASOMADERE y la Fundación Nueva Generación habilitaron un punto de acopio.",
        body="Facebook: Asomadere - Asociación De Mujeres Afro Y Desplazadas Edificando Redes",
        location="Carrera 29 #12-29, barrio San Judas Tadeo, Quibdó",
    ),
    entry(
        "choco",
        "Fundación Banco de Alimentos de la Diócesis de Quibdó",
        summary="Punto de acopio del Banco de Alimentos de la Diócesis de Quibdó.",
        location="Barrio Yesquita, Calle 21 #4-82, Quibdó",
    ),
    entry(
        "choco",
        "Fundación Miguel Alejandro",
        summary="Centro de acopio en el restaurante Grill & Beer.",
        body="Redes: @fundacionmiguelalejandro e Instagram @grillandbeerquibdo",
        location="Restaurante Grill & Beer, Carrera 7 #28-58, Quibdó",
        contact_phone="3148168863",
    ),
    entry(
        "choco",
        "Punto de acopio en barrio Jardín",
        summary="Punto de acopio en el sector Los Rosales.",
        location="Calle 22-13 B100, barrio Jardín, sector Los Rosales, Quibdó",
    ),
    entry(
        "choco",
        "Casa verde de 2 pisos en Rosales",
        summary="Punto de acopio en la esquina de Rosales.",
        body="Redes: @lavoz_delpacifico",
        location="Rosales, Calle 121, esquina, casa verde de 2 pisos, Quibdó",
        contact_phone="3233957912",
    ),
    entry(
        "choco",
        "Punto de acopio en El Silencio",
        summary="Punto de acopio en El Silencio.",
        body="Redes: @jmd_lavoz",
        location="Cra 8 #28-45B, El Silencio, Quibdó",
        contact_phone="3202865158",
    ),
    entry(
        "choco",
        "Fundación Herencia de Timbiquí",
        summary="Canal para aportes económicos destinados a las comunidades afectadas en Chocó.",
        body=(
            "Bancolombia, cuenta de ahorros 06211683862, NIT 900.023.250-9. "
            "También es posible donar en https://shorturl.at/K0phH\n"
            "Redes: @herenciadetimbiqui"
        ),
        category="Donación económica",
        location="Chocó",
    ),
    entry(
        "choco",
        "Fundación Innovación Social Paz y Desarrollo",
        summary="Centro de acopio en el barrio El Silencio.",
        location="Barrio El Silencio, Calle 27 #9-12, Quibdó",
        contact_name="Gina Marcela Moreno",
    ),
    entry(
        "choco",
        "Red departamental de mujeres Chocoanas",
        summary="Centro de acopio en el barrio Roma.",
        location="Barrio Roma, Cra 2 #26-66, segundo piso, Quibdó",
    ),
    entry(
        "choco",
        "Reddhhpac en Quibdó",
        summary="La organización de defensa de derechos humanos en el Pacífico (Reddhhpac) habilitó puntos de recepción de ayudas en Quibdó.",
        body="Redes: @reddhhpac, @semillasdedignidad, @libreriadelfos1",
        location="Calle 25 #6-58, barrio Pandeyuca, Quibdó",
        contact_phone="3235403547",
    ),
    entry(
        "choco",
        "Punto de donaciones en Carrera 81",
        summary="Punto de donaciones.",
        location="Carrera 81 33A-08, Quibdó",
        contact_name="Mario",
        contact_phone="3016587928",
    ),
    entry(
        "choco",
        "Consejo Comunitario Mayor del Alto San Juan (ASOCASAN)",
        summary="Canal de donación en Tadó.",
        body="Bre-B / Nequi llave 3016409724.\nRedes: @pipedazaocurrencias",
        category="Donación económica",
        location="Tadó, Chocó",
        contact_name="Ingrid Lozada",
        contact_phone="3016409724",
    ),
    entry(
        "choco",
        "Alcaldía Municipal de Tadó",
        summary="Cuenta oficial para donaciones de la Alcaldía de Tadó.",
        body=(
            "Banco Agrario, cuenta de ahorros 4-337-53-00530-0. "
            "Alcaldía Municipal de Tadó. NIT: 8916800816.\n"
            "Facebook: alcaldiadetado"
        ),
        category="Donación económica",
        location="Tadó, Chocó",
    ),
    entry(
        "choco",
        "Cancha Múltiple de Docordó",
        summary="Punto de acopio en la cabecera municipal de Docordó.",
        location="Cancha Múltiple de la cabecera municipal, Docordó, Chocó",
    ),
    entry(
        "quindio",
        "Banco de Alimentos Monseñor Roberto López Londoño",
        summary="Punto de acopio en Armenia, de lunes a viernes.",
        body="Horario: lunes a viernes de 8:00 a.m. a 5:00 p.m.",
        location="Carrera 14 21N-30, Armenia",
    ),
    entry(
        "atlantico",
        "Centro de acopio en Barranquillita",
        summary="Centro de acopio habilitado las 24 horas.",
        body="Habilitado las 24 horas.",
        location="Carrera 43 #6-120, Barranquillita, Barranquilla",
    ),
    entry(
        "atlantico",
        "Universidad de la Costa (CUC)",
        summary="Tres puntos de acopio en el campus de la Universidad de la Costa.",
        body=(
            "Departamento de Arquitectura y Diseño (bloque 8, piso 2): 8:00 a.m. a 12:00 p.m. y 2:00 p.m. a 5:00 p.m.\n"
            "Departamento de Ciencias Empresariales (bloque 5, piso 2): 8:00 a.m. a 12:00 p.m. y 2:00 p.m. a 5:00 p.m.\n"
            "Bienestar Estudiantil (bloque 8, piso 1): horario extendido hasta las 8:00 p.m.\n"
            "Redes: @unicostacol"
        ),
        location="Calle 58 #55-66, Barranquilla",
    ),
    entry(
        "atlantico",
        "Punto de acopio de Funcvida",
        summary="Bodega de acopio sobre la vía 40 hacia Eternit.",
        body="Lunes a viernes de 8:30 a.m. a 5:00 p.m.\nRedes: @funcvidaoficial",
        location="Calle 3 #60-177, bodega 6, entrando por la vía 40 hacia Eternit, Barranquilla",
        contact_phone="3185932571",
    ),
    entry(
        "bogota",
        "Cruz Roja Colombiana, seccional Cundinamarca y Bogotá",
        summary="Varios puntos de acopio habilitados por la Cruz Roja.",
        body=(
            "Avenida Carrera 68 #31-41 Sur: Samu Sur.\n"
            "Calle 134 - Carrera 7B Bis #132-31: Samu Norte.\n"
            "Avenida La Esmeralda #63-81: Centro de Salvamento Acuático.\n"
            "Diagonal 79B #62-53: bodega de la Cruz Roja.\n"
            "Carrera 24 #73-38: sede administrativa, con operación las 24 horas."
        ),
        location="Varios puntos en Bogotá",
    ),
    entry(
        "bogota",
        "Palacio de los Deportes",
        summary="Punto de acopio de 8:00 a.m. a 8:00 p.m.",
        body="Horario: de 8:00 a.m. a 8:00 p.m.",
        location="Calle 63 #54A-06, Bogotá",
    ),
    entry(
        "bogota",
        "Estadio Nemesio Camacho",
        summary="Punto de acopio de 8:00 a.m. a 9:00 p.m.",
        body="Horario: de 8:00 a.m. a 9:00 p.m.\nRedes: @senciabogota",
        location="Estadio Nemesio Camacho, Bogotá",
    ),
    entry(
        "bogota",
        "Universidad Jorge Tadeo Lozano",
        summary="Punto de acopio en la Universidad Jorge Tadeo Lozano.",
        location="Cra. 4 #22-61, Bogotá",
    ),
    entry(
        "bogota",
        "Casa del Valle",
        summary="Punto de acopio en La Merced.",
        location="Calle 34 #5-50, barrio La Merced, Bogotá",
    ),
    entry(
        "bogota",
        "Centro Comercial Unicentro",
        summary="Punto de acopio en Unicentro.",
        location="Carrera 15 #124-30, Bogotá",
    ),
    entry(
        "bogota",
        "Banco de Alimentos de Bogotá",
        summary="Punto de acopio del Banco de Alimentos de Bogotá.",
        body="Redes: @bancodealimentosbgt",
        location="Calle 19A #32-50, Bogotá",
    ),
    entry(
        "bogota",
        "Galería Aborigen",
        summary="Punto de acopio en Galería Aborigen.",
        body="Redes: @galeriaaborigen",
        location="Carrera 6a #116-17, Bogotá",
    ),
    entry(
        "bogota",
        "JAL de Teusaquillo",
        summary="Punto de acopio de la JAL de Teusaquillo.",
        location="Transversal 28B #36-39, Bogotá",
    ),
    entry(
        "bogota",
        "Casa PCN",
        summary="Punto de acopio en La Candelaria Centro.",
        body="Horario: de 9:00 a.m. a 8:00 p.m.",
        location="Calle 12D #1A-10, Candelaria Centro, Bogotá",
    ),
    entry(
        "bogota",
        "Fundación Tambores Yoruba",
        summary="Punto de acopio en Kennedy Central.",
        body="Facebook: Tambores Yoruba.",
        location="Calle 38B Sur #78B-32, Kennedy Central, Bogotá",
        contact_phone="3138500447",
    ),
    entry(
        "bogota",
        "Casa de PCR en La Candelaria",
        summary="Punto de acopio en La Candelaria Centro.",
        location="Calle 12D #1A-10, barrio La Candelaria Centro, casa de PCR, Bogotá",
        contact_phone="3004951097",
    ),
    entry(
        "bogota",
        "Restaurante La tierrita del Berriondo",
        summary="Punto de acopio en La Candelaria.",
        body="Horario: de 9:00 a.m. a 6:00 p.m.",
        location="Carrera 3 #12C-18, Candelaria, Bogotá",
    ),
    entry(
        "bogota",
        "Casa Afro Las Polonias",
        summary="Punto de acopio en Candelaria La Nueva.",
        body="Redes: @casa_afrolaspolonias",
        location="Cra. 36 Bis #64-10 Sur, Candelaria La Nueva, Bogotá",
    ),
    entry(
        "bogota",
        "Edificio Qark",
        summary="Punto de acopio en el edificio Qark.",
        body="Redes: @carolacaceres.c",
        location="Carrera 28a #51-88, edificio Qark, Bogotá",
        contact_name="Carolina Cáceres",
        contact_phone="3002401873",
    ),
    entry(
        "bogota",
        "Casa en Carrera 98a",
        summary="Punto de acopio en casa particular.",
        body="Redes: @eldelosplanes",
        location="Carrera 98a #73-46, Bogotá",
        contact_name="Cristian Cabra",
        contact_phone="3208000275",
    ),
    entry(
        "bogota",
        "Fundación MujerES SF",
        summary="Campaña para recolectar y enviar 500 kits de gestión menstrual a Quibdó.",
        body=(
            "La Fundación MujerES SF lidera una campaña para recolectar y enviar 500 kits de gestión "
            "menstrual a Quibdó, en articulación con la Secretaría de la Mujer y Equidad de Género de la "
            "Alcaldía de Quibdó. Cada kit cuesta $30.000 COP y se reciben donaciones en especie de "
            "productos nuevos, cerrados y sin fragancia. Atención las 24 horas.\n"
            "Redes: @mujeres.sf"
        ),
        location="Calle 90 #49A-44, Torre 2, apto 202, Bogotá",
    ),
    entry(
        "bogota",
        "Punto de acopio en Carrera 17",
        summary="Punto de acopio de 10:30 a.m. a 6:00 p.m.",
        body="Horario: de 10:30 a.m. a 6:00 p.m.",
        location="Carrera 17 #53-20, Bogotá",
        contact_phone="3223047076 - 3106601199",
    ),
    entry(
        "bogota",
        "PactoCol en Teusaquillo",
        summary="Punto de acopio en Teusaquillo.",
        body="Redes: @PactoCol",
        location="Carrera 17A #37-27, Teusaquillo, Bogotá",
    ),
    entry(
        "bogota",
        "Colecta Solidaria de Cobijas",
        summary="Colecta de cobijas de lunes a sábado.",
        body="Lunes a sábado de 8:00 a.m. a 6:00 p.m.",
        location="Calle 30 #15-17, Bogotá",
    ),
    entry(
        "bogota",
        "Hotel Click Clack Bogotá",
        summary="Punto de acopio las 24 horas.",
        body="Atención las 24 horas.\nRedes: @clickclackhotels",
        location="Carrera 11 #93-77, Bogotá",
    ),
    entry(
        "bogota",
        "Casa Azul",
        summary="Punto de acopio en Palermo.",
        body="Horario: de 10:00 a.m. a 7:00 p.m.\nRedes: @casaazulbogota",
        location="Carrera 20 #45A-33, barrio Palermo, Bogotá",
    ),
    entry(
        "bogota",
        "Puntos de acopio en centros comerciales de Bogotá",
        summary="Varios centros comerciales habilitaron puntos de información o administración para recibir ayudas.",
        body=(
            "Portal 80, Tv. 100 a #80 A-20. Primer piso, punto de información; segundo piso, oficinas de administración. De 8:00 a.m. a 7:00 p.m.\n"
            "Centro Suba, Calle 145 #91-19. De 9:00 a.m. a 7:00 p.m.\n"
            "Paseo Villa del Río, Diagonal 57C #62-60 Sur, piso 3, local 303. Lunes a viernes de 8:00 a.m. a 4:00 p.m.\n"
            "Atlantis Plaza, Calle 81 con Carrera 13, sótano 1. Hasta el 18 de agosto. De 10:00 a.m. a 7:00 p.m.\n"
            "Avenida Chile, Calle 72 #10-34, primer piso, punto de información.\n"
            "Centro Mayor, Calle 38A Sur #34D-51, administración, 2.º piso. Todos los días de 8:00 a.m. a 8:00 p.m.\n"
            "Nuestro Bogotá, Avenida Carrera 86 #55A-75. Lunes a viernes 10:00 a.m. a 7:00 p.m.; sábado 11:00 a.m. a 7:00 p.m.; domingo 12:00 p.m. a 7:00 p.m.\n"
            "Ciudad Tunal, Calle 47B Sur #24B-33, local 1135. De 9:00 a.m. a 7:00 p.m.\n"
            "Galerías, Calle 53B #25-21.\n"
            "Altavista Centro Comercial, Carrera 1 No. 65D-58 Sur. Lunes a viernes 9:00 a.m. a 9:00 p.m.; sábados y domingos 11:00 a.m. a 7:00 p.m.\n"
            "Meridiano 13 La Felicidad, Calle 18 No. 77-51. De 8:00 a.m. a 5:00 p.m. Hasta el lunes 17 de agosto de 2026.\n"
            "Outlet Factory, Avenida de las Américas No. 62-84. De 9:00 a.m. a 6:00 p.m.\n"
            "Palatino, Cra. 7 #138-33, piso 1.\n"
            "Paseo San Rafael, Av. Cll 134 No. 55-30, primer piso. De 10:00 a.m. a 7:00 p.m.\n"
            "Plaza Central, Calle 13 Carrera 62, punto de información piso 1. Del 11 al 18 de agosto, 10:00 a.m. a 7:00 p.m.\n"
            "Plaza de las Américas, segundo piso, junto a Royal Films.\n"
            "Plaza Imperial, Av. Ciudad de Cali con Av. Suba. A partir de las 8:00 a.m.\n"
            "Salitre Plaza, Carrera 68 B No. 24-39, punto de atención. Lunes a domingo de 9:00 a.m. a 8:00 p.m.\n"
            "San Martín, Carrera 7 #32-84, tercer piso, local 319 A.\n"
            "Subazar, Calle 145 #91-34. Lunes a domingo de 9:00 a.m. a 7:00 p.m.\n"
            "Titán Plaza, Av. Boyacá #80-94, punto de información. De 9:00 a.m. a 8:00 p.m.\n"
            "Trebolis Capellanía, Calle 19 A #91-05, oficina de administración, primer piso.\n"
            "El Porvenir, Calle 54F Sur No. 94-18, punto de información. De 11:00 a.m. a 7:00 p.m.\n"
            "Unilago, Carrera 15 No. 78-33, puertas 3 y 4.\n"
            "Puerta Grande San José, en San Andresito, Calle 10 #22-04, punto de información, primer piso.\n"
            "Fontanar, nivel 0 norte, diagonal al punto de validación.\n"
            "Parque La Colina, sótano 1 (zona morada). De 9:00 a.m. a 9:00 p.m."
        ),
        location="Varios centros comerciales en Bogotá",
    ),
    entry(
        "bogota",
        "Punto de acopio en Carrera 13",
        summary="Punto de acopio en oficina.",
        location="Carrera 13 #32-93, oficina 912, Torre 3, Bogotá",
        contact_phone="3223867624",
    ),
    entry(
        "bogota",
        "Manos Visibles",
        summary="Canal digital de donaciones y tres puntos de recogida en Bogotá.",
        body=(
            "La organización Manos Visibles abrió un canal para recibir donaciones económicas a través "
            "de una plataforma digital. Los aportes pueden realizarse con tarjeta o PSE. "
            "Los puntos tienen un horario de recepción de 8:00 a.m. a 6:00 p.m.\n"
            "Casa Jardín Origen, Calle 38 #29-29, Teusaquillo. Contacto: Sergio Mosquera 3058954149.\n"
            "Human Construction, Carrera 52A #134D-23, local 1. Contacto: Hillary Angulo 3016441221.\n"
            "Fundación Catalina Muñoz, Diagonal 48 #19-16.\n"
            "Redes: @manosvisibles"
        ),
        category="Donación económica y puntos de acopio",
        location="Tres puntos en Bogotá",
    ),
    entry(
        "santander",
        "Gobernación de Santander",
        summary="Punto de acopio de la Gobernación de Santander.",
        body="Redes: @gobernaciondesantander",
        location="Calle 37 No. 10-30, Bucaramanga",
    ),
    entry(
        "santander",
        "Centro de Gestión Integral del Riesgo de Desastres (CEGIRD)",
        summary="Recolección las 24 horas.",
        body="La recolección se realiza las 24 horas.",
        location="Calle 5 #3-18, al lado del Canal TRO, Bucaramanga",
    ),
    entry(
        "santander",
        "Lotería de Santander",
        summary="Punto de acopio en la Lotería de Santander.",
        location="Calle 36 #21-16, Bucaramanga",
    ),
    entry(
        "santander",
        "INDER Santander",
        summary="Punto de acopio del Instituto Departamental de Recreación y Deportes de Santander.",
        location="Bucaramanga",
    ),
    entry(
        "santander",
        "Idesan",
        summary="Punto de acopio del Instituto Financiero para el Desarrollo de Santander.",
        body="Horario: de 8:00 a.m. a 5:00 p.m.",
        location="Calle 48 #27 a-48, Bucaramanga",
    ),
    entry(
        "valle-del-cauca",
        "Ciudadela Petronio Álvarez",
        summary="Centro de acopio en el Complejo Deportivo Alberto Galindo.",
        location="Ciudadela Petronio Álvarez, Complejo Deportivo Alberto Galindo, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Plazoleta Jairo Varela",
        summary="Punto de acopio en Granada.",
        location="Av. 2 Nte #10 Nte-1, Granada, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Asociación Casa Cultural El Chontaduro",
        summary="Punto de acopio en Marroquín II.",
        body="Redes: @elchontadurocasacultural",
        location="Diagonal 26G 9 #72s-25, barrio Marroquín II, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Escuela Nacional del Deporte",
        summary="Punto de acopio en Eucarístico.",
        location="Cll 9 #34-01, Eucarístico, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Edificio Santorini, barrio Menga",
        summary="Punto de acopio en el edificio Santorini.",
        body="Números de contacto: 3155538001 / 3117700486.",
        location="Avenida 7A Norte #56-120, edificio Santorini, barrio Menga, Cali",
        contact_phone="3155538001 / 3117700486",
    ),
    entry(
        "valle-del-cauca",
        "Universidad ICESI",
        summary="Punto de acopio en Pance. Recibe ayudas hasta el 15 de agosto.",
        body="Jornada continua de 8:00 a.m. a 5:00 p.m. Se reciben ayudas hasta el 15 de agosto.",
        location="Calle 18 #122-135, Pance, edificio G-108G, Cali",
        contact_name="Ana Lucía Paz",
        contact_phone="3207163511",
    ),
    entry(
        "valle-del-cauca",
        "Fundación Pacífico Somos Todos",
        summary="Punto de acopio en Caney.",
        body="Lunes a sábado de 8:00 a.m. a 6:00 p.m.\nRedes: @fundacion_pst",
        location="Carrera 81 #42-41, Caney, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Parque de la Caña",
        summary="Punto de acopio en el Parque de la Caña.",
        location="Cra. 8 #39-01, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Punto de acopio en Ciudad Córdoba",
        summary="Punto de acopio en el barrio Ciudad Córdoba.",
        location="Carrera 49b #51-11, barrio Ciudad Córdoba, Cali",
        contact_phone="3113738583",
    ),
    entry(
        "valle-del-cauca",
        "Escuela Politécnica CIFORTED",
        summary="Punto de acopio en San Bosco.",
        body="Horario: de 9:00 a.m. a 8:30 p.m.",
        location="Carrera 12 #5-64, San Bosco, Cali",
        contact_phone="3172906261",
    ),
    entry(
        "valle-del-cauca",
        "Casa Obeso Mejía",
        summary="Punto de acopio en Casa Obeso Mejía.",
        body="Horario: de 8:00 a.m. a 6:00 p.m.\nRedes: @casaobesomejia",
        location="Avenida 4 Oeste #4-59, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Entre Copas y Amigos",
        summary="Punto de acopio frente al Puente de López.",
        body="Horario: de 9:00 a.m. a 9:00 p.m.\nRedes: @entrecopasyamigoscali",
        location="Calle 70 #7T Bis 08, barrio Las Ceibas, frente al Puente de López, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Serviteca Central Autopesado",
        summary="Punto de acopio en el barrio La Unión.",
        body="Redes: @ronaldtenoriofranco",
        location="Calle 36 #41B-129, barrio La Unión, diagonal a la SIJIN, frente al polideportivo de Villa del Sur, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Resistencia Antirracista y Mujeres de Asfalto",
        summary="Dos puntos de acopio en Ciudad 2000 y El Diamante.",
        body="Redes: @resistencia_antirracista y @mujeresdeasfalto",
        location="Carrera 63 #46-95, Ciudad 2000, y Calle 36 #32-07, barrio El Diamante, enseguida de Leandro Gym, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Étnica TV",
        summary="Centro de acopio en Versalles.",
        body="Redes: @etnica_tv",
        location="Av. 5ta Norte #21N-52, barrio Versalles, Santiago de Cali",
    ),
    entry(
        "valle-del-cauca",
        "Casa Cultural Sotavento",
        summary="Punto de acopio en Casa Cultural Sotavento.",
        location="Carrera 22 #4-39, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Restaurante Valle Pacífico",
        summary="Punto de acopio en el barrio Libertadores.",
        body="Redes: @restaurantevallepacifico",
        location="Carrera 6 #2-130, barrio Libertadores, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Único Centro Comercial Outlet",
        summary="Punto de acopio en Yumbo.",
        body="Horario: de 8:00 a.m. a 6:00 p.m.\nRedes: @unicooutletyumbo",
        location="Único Centro Comercial Outlet, bloque 1, primer piso, local 48, Yumbo",
    ),
    entry(
        "valle-del-cauca",
        "Fundación Biosfera Pacífico",
        summary="Punto de acopio de Fundación Biosfera Pacífico.",
        body="Redes: @biosferapacifico",
        location="Av. 5ta Norte 25N-43, Cali",
        contact_phone="3175736980 - 3176750457",
    ),
    entry(
        "valle-del-cauca",
        "Punto de acopio en Carrera 43A",
        summary="Punto de acopio en Cali.",
        location="Carrera 43A #14C-85, Cali",
        contact_name="Gisel",
        contact_phone="3136812201",
    ),
    entry(
        "valle-del-cauca",
        "Variedades MJ",
        summary="Punto de acopio en Variedades MJ.",
        body="Redes: @mj.variedadesj",
        location="Carrera 44 #8A-03, local 12, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Customext S.A.S.",
        summary="Punto de acopio en Customext.",
        location="Carrera 32 #7-61, Cali",
        contact_phone="3144932566 - 3225967334 - 3136122460",
    ),
    entry(
        "valle-del-cauca",
        "Nova Import S.A.S.",
        summary="Punto de acopio en San Vicente.",
        location="Calle 23 Nte. #5N-67, San Vicente, Cali",
        contact_phone="3144932566 - 3225967334 - 3136122460",
    ),
    entry(
        "bolivar",
        "Coliseo Bernardo Caraballo",
        summary="Punto de acopio de 7:00 a.m. a 5:00 p.m.",
        body="Horario: de 7:00 a.m. a 5:00 p.m.",
        location="Carrera 17 con Calle 35A, Cartagena",
    ),
    entry(
        "bolivar",
        "Centro Comercial Caribe Plaza",
        summary="Punto de información para acopio.",
        body="Horario: de 10:00 a.m. a 7:00 p.m.",
        location="Centro Comercial Caribe Plaza, Cartagena",
    ),
    entry(
        "bolivar",
        "Fundación Tierra Grata Colombia",
        summary="Punto de acopio en el barrio España.",
        body="Horario: de 8:00 a.m. a 6:00 p.m.",
        location="Edificio Torre Mar de Luna, Carrera 44D No. 30-42, barrio España, Cartagena",
        contact_name="Carolina Colpas",
        contact_phone="3237931670",
    ),
    entry(
        "bolivar",
        "Edificio Morros 1",
        summary="Punto de acopio en Zona Norte.",
        body="Horario: de 8:00 a.m. a 6:00 p.m.",
        location="Edificio Morros 1, al lado del Hotel Las Américas, Zona Norte, Cartagena",
    ),
    entry(
        "bolivar",
        "Punto de acopio en Avenida Pedro de Heredia",
        summary="Punto de acopio de lunes a domingo.",
        body="Lunes a domingo de 8:00 a.m. a 6:00 p.m.",
        location="Avenida Pedro de Heredia #32-190, Cartagena",
    ),
    entry(
        "bolivar",
        "Padel Club Bocagrande",
        summary="Punto de acopio en Bocagrande.",
        body="Horario: de 6:00 a.m. a 9:00 p.m.",
        location="Carrera 4 #7-28, Bocagrande, Cartagena",
        contact_phone="3104107649",
    ),
    entry(
        "cundinamarca",
        "Plaza de la Paz de la Gobernación de Cundinamarca",
        summary="Punto de acopio de la Gobernación de Cundinamarca.",
        body="Horario: de 8:00 a.m. a 5:00 p.m.",
        location="Calle 26 #51-53, Bogotá",
    ),
    entry(
        "valle-del-cauca",
        "Cuerpo de Bomberos Voluntarios de Dagua",
        summary="Punto de acopio en la cabecera municipal de Dagua.",
        body="Facebook: Alcaldía De Dagua",
        location="Cuerpo de Bomberos Voluntarios, cabecera municipal, Dagua",
    ),
    entry(
        "antioquia",
        "Can Love en Envigado",
        summary="Iniciativa en alianza con Can Love para recolectar ayudas para personas y animales afectados en el Chocó.",
        body=(
            "Quienes quieran donar pueden comunicarse por mensaje directo para recibir información "
            "sobre la entrega o coordinar la recolección de las ayudas.\n"
            "Redes: @canlove01"
        ),
        location="Envigado",
    ),
    entry(
        "tolima",
        "Casa del Maestro",
        summary="Punto de acopio de lunes a sábado en jornada continua.",
        body="De lunes a sábado, jornada continua, de 8:00 a.m. a 6:00 p.m.",
        location="Calle 37 con carrera 4G, esquina, Ibagué",
    ),
    entry(
        "tolima",
        "Banco Arquidiocesano de Alimentos de Ibagué",
        summary="Punto de acopio del Banco Arquidiocesano de Alimentos.",
        body="Facebook: Banco De Alimentos Ibagué.",
        location="Carrera 4ta Estadio #23-42, Ibagué",
    ),
    entry(
        "tolima",
        "Casa del Deportista",
        summary="Punto de acopio en Naciones Unidas.",
        location="Calle 35 #3-47, barrio Naciones Unidas, Ibagué",
    ),
    entry(
        "tolima",
        "Polideportivo Bocaneme",
        summary="Punto de acopio de 9:00 a.m. a 5:00 p.m.",
        body="Horario: de 9:00 a.m. a 5:00 p.m.",
        location="Calle 74 #75, Ibagué",
    ),
    entry(
        "antioquia",
        "Consejo Municipal de Juventudes de Itagüí y AfroDhamiri",
        summary="Punto de acopio en el Parque Principal de Itagüí.",
        body="Horario: entre las 10:00 a.m. y las 5:00 p.m.\nRedes: @cmj_itagui",
        location="Parque Principal de Itagüí",
    ),
    entry(
        "caldas",
        "Banco Arquidiocesano de Alimentos de Manizales",
        summary="Punto de acopio de lunes a viernes.",
        body="Lunes a viernes de 8:00 a.m. a 5:00 p.m.\nRedes: @bancodealimentosmanizales",
        location="Calle 49 No. 27A-85 y Carrera 9 #19-03, Manizales",
        contact_phone="3104184472",
    ),
    entry(
        "antioquia",
        "Reddhhpac en Medellín",
        summary="La organización de defensa de derechos humanos en el Pacífico (Reddhhpac) habilitó este punto en Medellín.",
        location="Calle 25 sur #6-58, barrio Pandeyuca, Medellín",
    ),
    entry(
        "antioquia",
        "Agité Teatro y Corporación La Parla",
        summary="Punto de acopio en el barrio Bostón.",
        body="WhatsApp: 3106625665 - 3122871656.\nRedes: @teatrolaparla y @agiteteatro",
        location="Calle 52 #39A-30, barrio Bostón, Medellín",
        contact_phone="3106625665 - 3122871656",
    ),
    entry(
        "antioquia",
        "Hotel Click Clack Medellín",
        summary="Punto de acopio las 24 horas.",
        body="Atención las 24 horas.\nRedes: @clickclackhotels",
        location="Calle 10B #38-29, Medellín",
    ),
    entry(
        "antioquia",
        "Librería Rodante Delfos",
        summary="Punto de acopio en Laureles-Estadio.",
        location="Carrera 79 #52A-23, sector Laureles-Estadio, Medellín",
        contact_phone="3123661304",
    ),
    entry(
        "antioquia",
        "Mall 30 Plus, Belén Rosales",
        summary="Punto de acopio en Belén Rosales.",
        location="Calle 30 #69-180, local 3, Mall 30 Plus, Belén Rosales, diagonal a la estación Rosales del Metroplús, Medellín",
    ),
    entry(
        "antioquia",
        "Terminal del Norte",
        summary="Punto de acopio de 8:00 a.m. a 1:00 p.m.",
        body="Horario: de 8:00 a.m. a 1:00 p.m.",
        location="Terminal del Norte, local 9840, Medellín",
    ),
    entry(
        "antioquia",
        "Fundación Banco Arquidiocesano de Alimentos de Medellín",
        summary="Punto de acopio de 8:00 a.m. a 2:00 p.m.",
        body="Horario: de 8:00 a.m. a 2:00 p.m.",
        location="Carrera 52 #30A-97, Medellín",
    ),
    entry(
        "antioquia",
        "Fundación Saciar",
        summary="Punto de acopio de 8:00 a.m. a 2:00 p.m.",
        body="Horario: de 8:00 a.m. a 2:00 p.m.",
        location="Carrera 50 #25-261, Medellín",
    ),
    entry(
        "antioquia",
        "Parque Biblioteca Belén",
        summary="Punto de acopio en el Parque Biblioteca Belén.",
        location="Carrera 76 #18A-19, Medellín",
    ),
    entry(
        "antioquia",
        "Parque Biblioteca San Javier",
        summary="Punto de acopio en el Parque Biblioteca San Javier.",
        location="Calle 42C #95-50, Medellín",
    ),
    entry(
        "antioquia",
        "Parque Biblioteca Gabriel García Márquez",
        summary="Punto de acopio en Doce de Octubre.",
        location="Doce de Octubre, carrera 80 #104-04, Medellín",
    ),
    entry(
        "antioquia",
        "Parque Biblioteca León de Greiff",
        summary="Punto de acopio en La Ladera.",
        location="La Ladera, Calle 59A #36-30, Medellín",
    ),
    entry(
        "antioquia",
        "Biblioteca Pública El Poblado",
        summary="Punto de acopio en El Poblado.",
        location="Calle 3B Sur #29B-56, Medellín",
    ),
    entry(
        "antioquia",
        "Politécnico Grancolombiano",
        summary="Punto de acopio en Laureles – Estadio.",
        body="Horario: de 9:00 a.m. a 12:00 p.m. y de 2:00 p.m. a 5:00 p.m.",
        location="Cra. 74 #52-20, Laureles – Estadio, Medellín",
    ),
    entry(
        "antioquia",
        "Universidad de Antioquia y colectivo AfroUdeA",
        summary="Puntos de acopio en el Bloque 9. No están recibiendo ropa.",
        body=(
            "Proyecto Oficinas Estudiantiles (POE), Bloque 9, oficina 211B. De 9:00 a.m. a 5:00 p.m. "
            "También, el colectivo de estudiantes afro AfroUdeA recibe donaciones en la oficina ubicada "
            "en los bajos del Bloque 9. El punto funciona de lunes a viernes. "
            "No están recibiendo ropa por razones de logística y priorización."
        ),
        location="Universidad de Antioquia, Bloque 9, Medellín",
        contact_name="Ximena Hernández",
        contact_phone="3114505940",
    ),
    entry(
        "antioquia",
        "Universidad EAFIT",
        summary="Punto de acopio en la placa cubierta.",
        body="Horario: de 9:00 a.m. a 6:00 p.m.",
        location="Carrera 49 #7 Sur-50, placa cubierta, Medellín",
    ),
    entry(
        "valle-del-cauca",
        "Fundación Resistencia Antirracista",
        summary="Punto de acopio en Palmira.",
        body="Redes: @resistencia_antirracista",
        location="Diagonal 24C #6A-83, Palmira",
    ),
    entry(
        "risaralda",
        "Expofuturo",
        summary="Punto de acopio de lunes a domingo.",
        body="De lunes a domingo de 8:00 a.m. a 6:00 p.m.",
        location="Avenida 30 de agosto #87-76, Pereira",
    ),
    entry(
        "risaralda",
        "Café Consota",
        summary="Punto de acopio en Villa Consota.",
        location="Mz 7 y Mz 8 Villa Consota Cuba, Pereira",
    ),
    entry(
        "risaralda",
        "Café Perla del Otún",
        summary="Punto de acopio frente a la iglesia de los 2.500 lotes.",
        location="Diagonal a la iglesia de los 2.500 lotes, Pereira",
    ),
    entry(
        "risaralda",
        "Café El Remanso",
        summary="Punto de acopio al lado del centro de salud.",
        location="Avenida principal barrio El Remanso, al lado del centro de salud, Pereira",
    ),
    entry(
        "risaralda",
        "Café Kennedy",
        summary="Punto de acopio en el parque principal de Kennedy.",
        location="Parque principal de Kennedy, Pereira",
    ),
    entry(
        "risaralda",
        "Café Ormanza",
        summary="Punto de acopio en la avenida del Río.",
        location="Calle 3 bis #5-38, avenida del Río, Pereira",
    ),
    entry(
        "risaralda",
        "Café San Nicolás",
        summary="Punto de acopio en la antigua estación de Policía.",
        location="Carrera 14 bis #28-38, antigua estación de Policía, Pereira",
    ),
    entry(
        "risaralda",
        "Café Comuna del Café",
        summary="Punto de acopio en el Parque Industrial.",
        location="Carrera 3 calle 59 A, sector A Parque Industrial, Pereira",
    ),
    entry(
        "quindio",
        "Lavandería J&M",
        summary="Punto de acopio en Quimbaya.",
        location="Carrera 5 #13-30, Quimbaya, Quindío",
    ),
    entry(
        "quindio",
        "Club Rotario de Quimbaya",
        summary="Punto de acopio habilitado durante todo el día.",
        body="Está habilitado durante todo el día.\nRedes: @clubrotarioquimbaya y @alcaldiadequimbaya",
        location="Sede del Club Rotario de Quimbaya, rotonda, entrada por Montenegro, Quimbaya",
    ),
    entry(
        "quindio",
        "Centro de Convenciones del Quindío",
        summary="Punto de acopio de 8:00 a.m. a 8:00 p.m.",
        body="Horario: de 8:00 a.m. a 8:00 p.m.\nFacebook: Gobernación del Quindío.",
        location="Centro de Convenciones del Quindío",
    ),
    entry(
        "cundinamarca",
        "Cuerpo Oficial de Bomberos de Soacha",
        summary="Punto de acopio en la Comuna 2.",
        body="Facebook: Bomberos Oficiales Soacha.",
        location="Calle 22 No. 9-10, Comuna 2, Soacha",
    ),
    entry(
        "bogota",
        "Banco Distrital de Sangre IDCBIS",
        summary="El Banco Distrital de Sangre IDCBIS ha enviado 89 unidades de componentes sanguíneos a Quibdó e invita a donar.",
        body=(
            "Las autoridades invitan a la ciudadanía a donar para mantener las reservas y continuar "
            "atendiendo a los pacientes en las zonas afectadas. De domingo a domingo de 8:00 a.m. a 5:00 p.m. "
            "Revisar idcbis.org.co/banco-distrital-de-sangre para confirmar los puntos, ya que constantemente "
            "los están actualizando y ubican jornadas de donación adicionales.\n"
            "Viernes 14 de agosto: Secretaría Distrital de Salud, 8:00 a.m. a 5:00 p.m.\n"
            "Sábado 15 de agosto: Centro Comercial Plaza Imperial, 11:00 a.m. a 6:00 p.m.\n"
            "Domingo 16 de agosto: Iglesia María Madre Admirable, 8:00 a.m. a 3:30 p.m.; Parque Timiza, 9:00 a.m. a 4:30 p.m.; Parque San Andrés, 9:00 a.m. a 4:30 p.m.\n"
            "Lunes 17 de agosto: Parque El Tunal, 9:30 a.m. a 5:30 p.m.; Parque Gilma Jiménez, 9:00 a.m. a 4:30 p.m.; Centro Comercial Plaza Imperial, 10:30 a.m. a 6:00 p.m."
        ),
        category="Banco de sangre",
        location="Bogotá. Confirmar puntos en idcbis.org.co/banco-distrital-de-sangre",
    ),
    entry(
        "valle-del-cauca",
        "Banco de sangre HUV",
        summary="Punto permanente de donación de sangre en el Hospital Universitario del Valle.",
        body="Activo de manera permanente de 8:00 a.m. a 6:00 p.m.",
        category="Banco de sangre",
        location="Calle 5ta #36-08, urgencias del Hospital Universitario del Valle, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Banco de sangre Hemolife",
        summary="Punto permanente de donación de sangre.",
        body="Activo de manera permanente de 8:00 a.m. a 6:00 p.m.",
        category="Banco de sangre",
        location="Calle 38 N #3N-21, Prados del Norte, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Banco de sangre Cruz Roja Valle",
        summary="Punto permanente de donación de sangre.",
        body="Activo de manera permanente de 8:00 a.m. a 6:00 p.m.",
        category="Banco de sangre",
        location="Parqueadero Cruz Roja Valle, carrera 38 bis #5B, San Fernando, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Banco de sangre Fundación Valle del Lili",
        summary="Punto permanente de donación de sangre.",
        body="Activo de manera permanente de 8:00 a.m. a 6:00 p.m.",
        category="Banco de sangre",
        location="Sede principal, torre 2, piso 4, Cali",
    ),
    entry(
        "valle-del-cauca",
        "Banco de sangre Imbanaco",
        summary="Punto permanente de donación de sangre.",
        body="Activo de manera permanente de 8:00 a.m. a 6:00 p.m.",
        category="Banco de sangre",
        location="Sede principal, carrera 38 bis #5B2-04, Santa Isabel, Cali",
    ),
]


def sql_str(value):
    if value is None or value == "":
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def main():
    lines = [
        "-- Official aid listings from AfroUp guide dated 14 August 2026.",
        "-- Source PDF only. No invented facts.",
        "",
        "INSERT INTO departments (slug, name) VALUES",
    ]
    dept_rows = [f"  ({sql_str(slug)}, {sql_str(name)})" for slug, name in NEW_DEPARTMENTS]
    lines.append(",\n".join(dept_rows) + ";")
    lines.append("")

    for item in ENTRIES:
        lines.append(
            "INSERT INTO aid_entries (\n"
            "  department_id, title, summary, body, contact_name, contact_phone, contact_email,\n"
            "  location, category, source, status, published_at\n"
            ") VALUES (\n"
            f"  (SELECT id FROM departments WHERE slug = {sql_str(item['department'])}),\n"
            f"  {sql_str(item['title'])},\n"
            f"  {sql_str(item['summary'])},\n"
            f"  {sql_str(item['body'])},\n"
            f"  {sql_str(item['contact_name'])},\n"
            f"  {sql_str(item['contact_phone'])},\n"
            f"  {sql_str(item['contact_email'])},\n"
            f"  {sql_str(item['location'])},\n"
            f"  {sql_str(item['category'])},\n"
            f"  {sql_str(item['source'])},\n"
            "  'published',\n"
            f"  {sql_str(PUBLISHED_AT)}\n"
            ");"
        )
        lines.append("")

    out = Path(__file__).resolve().parents[1] / "migrations" / "0002_seed_official_guide.sql"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(ENTRIES)} entries to {out}")


if __name__ == "__main__":
    main()
