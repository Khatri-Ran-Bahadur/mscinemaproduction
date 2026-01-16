--
-- PostgreSQL database dump
--

\restrict edimkiMGWiLTP3deO2CUkiP0JHUhyxcWtNKgyEEWSTYP5p9bKKVIXwkaEqUJe7M

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: about_content; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.about_content (
    id integer NOT NULL,
    section text NOT NULL,
    title text,
    content text NOT NULL,
    image text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    layout text,
    width text
);


ALTER TABLE public.about_content OWNER TO prisma_migration;

--
-- Name: about_content_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_migration
--

CREATE SEQUENCE public.about_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.about_content_id_seq OWNER TO prisma_migration;

--
-- Name: about_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_migration
--

ALTER SEQUENCE public.about_content_id_seq OWNED BY public.about_content.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.admins OWNER TO prisma_migration;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_migration
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO prisma_migration;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_migration
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    image text NOT NULL,
    type text DEFAULT 'normal'::text NOT NULL,
    "movieId" integer,
    title text,
    description text,
    link text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.banners OWNER TO prisma_migration;

--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_migration
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banners_id_seq OWNER TO prisma_migration;

--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_migration
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: contact_info; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.contact_info (
    id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    value text NOT NULL,
    icon text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.contact_info OWNER TO prisma_migration;

--
-- Name: contact_info_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_migration
--

CREATE SEQUENCE public.contact_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_info_id_seq OWNER TO prisma_migration;

--
-- Name: contact_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_migration
--

ALTER SEQUENCE public.contact_info_id_seq OWNED BY public.contact_info.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    "referenceNo" text NOT NULL,
    "customerName" text,
    "customerEmail" text,
    "customerPhone" text,
    "movieId" integer,
    "movieTitle" text NOT NULL,
    "cinemaName" text,
    "hallName" text,
    "showTime" timestamp(3) without time zone,
    seats text NOT NULL,
    "ticketType" text,
    "totalAmount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    status text DEFAULT 'CONFIRMED'::text NOT NULL,
    "paymentStatus" text DEFAULT 'PAID'::text NOT NULL,
    "paymentMethod" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cinemaId" text,
    "showId" text,
    "orderId" text,
    "transactionNo" text
);


ALTER TABLE public.orders OWNER TO prisma_migration;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_migration
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO prisma_migration;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_migration
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: pages; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.pages (
    id integer NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pages OWNER TO prisma_migration;

--
-- Name: pages_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_migration
--

CREATE SEQUENCE public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pages_id_seq OWNER TO prisma_migration;

--
-- Name: pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_migration
--

ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;


--
-- Name: about_content id; Type: DEFAULT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.about_content ALTER COLUMN id SET DEFAULT nextval('public.about_content_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: contact_info id; Type: DEFAULT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.contact_info ALTER COLUMN id SET DEFAULT nextval('public.contact_info_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: pages id; Type: DEFAULT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);


--
-- Data for Name: about_content; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.about_content (id, section, title, content, image, "order", "isActive", "createdAt", "updatedAt", layout, width) FROM stdin;
2	main	About Us	<p><strong>MS&nbsp;Cinemas</strong></p><p>MS&nbsp;Cinemas&nbsp;in&nbsp;Kampar&nbsp;Perak&nbsp;is&nbsp;the&nbsp;ultimate&nbsp;destination&nbsp;for&nbsp;movie-goers&nbsp;seeking&nbsp;a&nbsp;complete&nbsp;cinematic&nbsp;experience.&nbsp;With&nbsp;8&nbsp;screens,&nbsp;One&nbsp;hall&nbsp;with&nbsp;multi-speaker&nbsp;Dolby&nbsp;Atmos&nbsp;surround&nbsp;sound&nbsp;setup&nbsp;that&nbsp;delivers&nbsp;pristine,&nbsp;crystal-clear&nbsp;audio&nbsp;and&nbsp;two&nbsp;halls&nbsp;equipped&nbsp;2&nbsp;XL&nbsp;screen&nbsp;hall&nbsp;brings&nbsp;to&nbsp;life&nbsp;high-octane,&nbsp;the&nbsp;cinema&nbsp;hall&nbsp;provides&nbsp;an&nbsp;immersive&nbsp;sound&nbsp;and&nbsp;picture&nbsp;quality,&nbsp;making&nbsp;every&nbsp;movie&nbsp;experience&nbsp;unforgettable.&nbsp;The&nbsp;halls&nbsp;use&nbsp;silver&nbsp;screens,&nbsp;which&nbsp;guarantee&nbsp;excellent&nbsp;presentation&nbsp;quality,&nbsp;and&nbsp;spacious&nbsp;seating&nbsp;with&nbsp;ample&nbsp;legroom&nbsp;that&nbsp;ensures&nbsp;you&nbsp;feel&nbsp;comfortable&nbsp;throughout&nbsp;the&nbsp;entire&nbsp;movie.</p><p>MS&nbsp;Cinemas&nbsp;also&nbsp;offers&nbsp;something&nbsp;for&nbsp;the&nbsp;whole&nbsp;family,&nbsp;with&nbsp;Kids&nbsp;Family&nbsp;Halls&nbsp;and&nbsp;a&nbsp;designated&nbsp;kids’&nbsp;toilet.&nbsp;Additionally,&nbsp;there’s&nbsp;a&nbsp;party&nbsp;area&nbsp;available&nbsp;for&nbsp;birthdays&nbsp;or&nbsp;other&nbsp;celebrations,&nbsp;providing&nbsp;a&nbsp;unique&nbsp;and&nbsp;fun&nbsp;environment&nbsp;to&nbsp;celebrate&nbsp;special&nbsp;occasions.</p><p>Besides&nbsp;movie&nbsp;screenings,&nbsp;MS&nbsp;Cinemas&nbsp;also&nbsp;offers&nbsp;versatile&nbsp;facilities&nbsp;that&nbsp;can&nbsp;be&nbsp;used&nbsp;for&nbsp;presentations&nbsp;or&nbsp;seminars,&nbsp;making&nbsp;it&nbsp;an&nbsp;excellent&nbsp;venue&nbsp;for&nbsp;corporate&nbsp;events.&nbsp;And&nbsp;for&nbsp;those&nbsp;who&nbsp;want&nbsp;to&nbsp;grab&nbsp;a&nbsp;bite&nbsp;or&nbsp;enjoy&nbsp;a&nbsp;cup&nbsp;of&nbsp;coffee,&nbsp;the&nbsp;cinema&nbsp;has&nbsp;an&nbsp;MS&nbsp;Cafe&nbsp;where&nbsp;you&nbsp;can&nbsp;relax&nbsp;and&nbsp;enjoy&nbsp;refreshments&nbsp;before&nbsp;or&nbsp;after&nbsp;the&nbsp;movie.</p><p>With&nbsp;a&nbsp;total&nbsp;seating&nbsp;capacity&nbsp;of&nbsp;approximately&nbsp;1200,&nbsp;MS&nbsp;Cinemas&nbsp;has&nbsp;something&nbsp;for&nbsp;everyone.&nbsp;Whether&nbsp;you&#39;re&nbsp;looking&nbsp;to&nbsp;catch&nbsp;the&nbsp;latest&nbsp;blockbuster&nbsp;or&nbsp;host&nbsp;an&nbsp;event,&nbsp;MS&nbsp;Cinemas&nbsp;in&nbsp;Kampar&nbsp;Perak&nbsp;has&nbsp;it&nbsp;all,&nbsp;and&nbsp;more.</p>	/uploads/1768312927531_WhatsApp_Image_2026-01-13_at_11.45.14.jpeg	1	t	2026-01-12 16:29:03.835	2026-01-13 14:02:10.142	\N	\N
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.admins (id, username, email, password, name, "createdAt", "updatedAt") FROM stdin;
1	admin	admin@mscinema.com	$2a$10$OtBHbtt4S2UenMGJvENU8O4NtizglvWuqmtuFfv.z4Xx5U6Utk6cO	Administrator	2026-01-12 15:13:18.443	2026-01-12 16:52:58.372
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.banners (id, image, type, "movieId", title, description, link, "order", "isActive", "createdAt", "updatedAt") FROM stdin;
2	/uploads/1768238848872_avatar.jpg	movie	587	Avatar Atomos	\N	\N	2	t	2026-01-12 17:27:39.639	2026-01-12 17:27:39.639
3	/uploads/1768238871508_anaconda.jpg	movie	618	Anaconda	\N	\N	3	t	2026-01-12 17:28:03.969	2026-01-12 17:28:03.969
4	/uploads/1768238925788_banner-2.jpg	movie	620	Papa Zola	\N	\N	5	t	2026-01-12 17:28:49.101	2026-01-12 17:28:49.101
1	/uploads/1768238801625_avatar.jpg	movie	646	Avatar			1	f	2026-01-12 15:52:15.536	2026-01-13 10:13:20.691
14	/uploads/1768579976687_food.jpg	normal	\N	This	\N	\N	0	t	2026-01-16 16:13:01.274	2026-01-16 16:13:01.274
\.


--
-- Data for Name: contact_info; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.contact_info (id, type, title, value, icon, "order", "isActive") FROM stdin;
1	email	Email	msckampar@mscinemas.my	Mail	0	t
2	phone	Phone	+6054670962	Phone	0	t
3	address	Address	TK1 7-01, Terminal Kampar Putra, PT53493 & PT53494, Jalan Putra Permata 9, Taman Kampar, 31900 Kampar, Perak, Malaysia.	MapPin	0	t
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.orders (id, "referenceNo", "customerName", "customerEmail", "customerPhone", "movieId", "movieTitle", "cinemaName", "hallName", "showTime", seats, "ticketType", "totalAmount", status, "paymentStatus", "paymentMethod", "createdAt", "updatedAt", "cinemaId", "showId", "orderId", "transactionNo") FROM stdin;
1	ZA5UA3L4	Ran Bdr kc	ranbdrkc201@gmail.com	9868620708	\N	.PAPA ZOLA : THE MOVIE (2D)	MSC KAMPAR	HALL - 6	2025-12-10 14:45:00	["C9"]	Standard	17.00	CONFIRMED	PENDING	Visa	2026-01-12 17:09:15.872	2026-01-12 17:09:15.872	\N	\N	\N	\N
2	MS1768274456790n1nhqnmp8_Q661VCGD	Ran Bdr kc	ranbdrkc201@gmail.com	9868620708	\N	.PAPA ZOLA : THE MOVIE (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-09 21:00:00	["C12"]	Standard	15.00	CONFIRMED	PENDING	Visa	2026-01-13 03:20:59.997	2026-01-13 03:20:59.997	\N	\N	\N	\N
3	MS1768275360094ztt8xr60b_HIJZ6EYI	Ran Bdr kc	ranbdrkc201@gmail.com	9868620708	\N	.PAPA ZOLA : THE MOVIE (2D)	MSC KAMPAR	HALL - 6	2025-12-09 20:30:00	["C9"]	Standard	17.00	CONFIRMED	PENDING	Visa	2026-01-13 03:36:01.04	2026-01-13 03:36:01.04	\N	\N	\N	\N
4	MS17682784286635fb5hhkmn_KHU1NRKH	Mohamad	gammerdai201@gmail.com	534534535	\N	.PAPA ZOLA : THE MOVIE (2D)	MSC KAMPAR	HALL - 6	2025-12-10 20:30:00	["D9"]	Standard	17.00	CONFIRMED	PENDING	Visa	2026-01-13 04:27:09.619	2026-01-13 04:27:09.619	\N	\N	\N	\N
5	MS1768283827973jvt71dbv4_VEF2P26B	Mohamed jalal	mohamedjalalj8@gmail.com	07200937758	\N	.PARASAKTHI (TAMIL)	MSC KAMPAR	HALL - 1	2026-01-13 21:10:00	["K6","K7"]	Standard	31.00	CONFIRMED	PENDING	Visa	2026-01-13 05:57:10.208	2026-01-13 05:57:10.208	\N	\N	\N	\N
6	MS1768298578115r1n67bfxo_ZQ6BMV5Q	A.Mohamed Jalal	Mohamedjalalj8@gmail.com	07200937758	\N	28 YEARS LATER: THE BONE TEMPLE	MSC KAMPAR	HALL - 5	2026-01-15 21:20:00	["K1"]	Standard	17.00	CONFIRMED	PENDING	Visa	2026-01-13 10:03:00.392	2026-01-13 10:03:00.392	\N	\N	\N	\N
7	MS83594988211LW1LI	jalal@gmail.com	jalal@gmail.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 19:10:00	["E13"]	Standard	19.00	CONFIRMED	PENDING	Visa	2026-01-14 02:58:19.768	2026-01-14 02:58:19.768	\N	\N	\N	\N
8	MS8359500984WOFBVV	jalal@gmail.com	jalal@gmail.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 19:10:00	["E13"]	Standard	19.00	CONFIRMED	PENDING	Visa	2026-01-14 02:58:21.337	2026-01-14 02:58:21.337	\N	\N	\N	\N
9	MS8362020941L7H5AI	jalal@gmail.com	ranbdrkc201@gmail.com	123456789	\N	.PAPA ZOLA : THE MOVIE (2D)	MSC KAMPAR	HALL - 6	2025-12-09 20:30:00	["D8"]	Standard	17.00	CONFIRMED	PENDING	Visa	2026-01-14 03:40:21.869	2026-01-14 03:40:21.869	\N	\N	\N	\N
10	MS83648016998WSBSK	jalal@gmail.com	rnkhatri201@gmail.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 19:10:00	["C9"]	Standard	19.00	CONFIRMED	PENDING	Visa	2026-01-14 04:26:43.974	2026-01-14 04:26:43.974	\N	\N	\N	\N
11	MS83662840767UOUY1	jalal@gmail.com	ranbdrkc201@gmail.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 19:10:00	["K12"]	Standard	19.00	CONFIRMED	PENDING	Visa	2026-01-14 04:51:25.014	2026-01-14 04:51:25.014	\N	\N	\N	\N
12	MS8366687534OWE6NV	jalal@gmail.com	ranbdrkc201@gmal.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 19:10:00	["J12"]	Standard	19.00	CONFIRMED	PENDING	Visa	2026-01-14 04:58:09.862	2026-01-14 04:58:09.862	\N	\N	\N	\N
14	MS8367673024CAG4EB	jalal@gmail.com	ranbdrkc201@gmail.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 21:20:00	["K12"]	Standard	19.00	CONFIRMED	PENDING	Visa	2026-01-14 05:14:35.78	2026-01-14 05:14:35.78	\N	\N	\N	\N
13	MS83676707755FE1W5	jalal@gmail.com	ranbdrkc201@gmail.com	123456789	\N	.ZOOTOPIA 2 (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-07 21:20:00	["K12"]	Standard	19.00	CONFIRMED	PAID	Visa	2026-01-14 05:14:33.168	2026-01-14 05:15:34.485	\N	\N	\N	\N
15	MS8468093206N7LTXH	asdf	mohamedjalalj8@gmail.com	07200937758	\N	.PAPA ZOLA : THE MOVIE (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-10 16:30:00	["C11","C12","C13"]	Standard	47.00	CONFIRMED	PENDING	Visa	2026-01-15 09:08:15.585	2026-01-15 09:08:15.585	\N	\N	\N	\N
16	MS8488625760TUZOCQ	Moahaad Jalal	ranbdrkc201@gmail.com	123456789	\N	.PAPA ZOLA : THE MOVIE (2D)	MSC KAMPAR	HALL - 6	2025-12-09 20:30:00	["D9"]	Standard	17.00	CONFIRMED	PAID	Visa	2026-01-15 14:50:28.015	2026-01-15 14:51:52.751	\N	\N	\N	\N
17	MS85337873720JIFY5	Mohamad Jalal	mohamedjalalj8@gmail.com	9868620708	\N	.PARASAKTHI (TAMIL)	MSC KAMPAR	HALL - 7	2026-01-17 07:00:00	["H1"]	Standard	16.00	CONFIRMED	PAID	Visa	2026-01-16 03:23:08.325	2026-01-16 03:23:48.81	\N	\N	\N	\N
18	15KVMQZM	Mohamad Jalal	ranbdrkc201@gmail.com	9868620708	620	.PAPA ZOLA : THE MOVIE (2D)	MSC KAMPAR	HALL - 6	2025-12-09 12:30:00	["D7","G8"]	Standard	30.00	CONFIRMED	PAID	Visa	2026-01-16 05:16:22.427	2026-01-16 05:19:01.619	7001	31407	MS8540580030XNB01O	3422380838
19	CEUR3DQR	Mohamad Jalal	mohamedjalalj8@gmail.com	9868620708	641	.PAPA ZOLA : THE MOVIE (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-09 13:00:00	["K10","K11"]	Standard	33.00	CONFIRMED	PENDING	Visa	2026-01-16 09:17:05.162	2026-01-16 09:17:05.162	7001	31403	MS8555024210XIQL5B	\N
20	9DFD3NM1	Mohamad Jalal	mohamedjalalj8@gmail.com	9868620708	641	.PAPA ZOLA : THE MOVIE (ATMOS)	MSC KAMPAR	HALL - 1	2025-12-09 13:00:00	["K10","K11"]	Standard	37.00	CONFIRMED	PENDING	Visa	2026-01-16 09:33:57.595	2026-01-16 09:33:57.595	7001	31403	MS8556035421NTHYUH	\N
21	0NN1I93G	Jalal	mohamedjalalj8@gmail.com	7200937758	587	AVATAR: FIRE AND ASH (ATMOS)	MSC KAMPAR	HALL - 1	2026-01-18 12:45:00	["K18"]	Standard	17.00	CONFIRMED	PAID	Visa	2026-01-16 16:17:25.864	2026-01-16 16:18:17.605	7001	33217	MS8580244938GA5KQM	3423924868
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.pages (id, slug, title, content, "isActive", "createdAt", "updatedAt") FROM stdin;
1	privacy-policy	Privacy and Policy	this is editor	t	2026-01-12 16:14:19.456	2026-01-12 16:14:19.456
\.


--
-- Name: about_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_migration
--

SELECT pg_catalog.setval('public.about_content_id_seq', 6, true);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_migration
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_migration
--

SELECT pg_catalog.setval('public.banners_id_seq', 14, true);


--
-- Name: contact_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_migration
--

SELECT pg_catalog.setval('public.contact_info_id_seq', 15, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_migration
--

SELECT pg_catalog.setval('public.orders_id_seq', 21, true);


--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_migration
--

SELECT pg_catalog.setval('public.pages_id_seq', 1, true);


--
-- Name: about_content about_content_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.about_content
    ADD CONSTRAINT about_content_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: contact_info contact_info_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.contact_info
    ADD CONSTRAINT contact_info_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: about_content_section_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX about_content_section_key ON public.about_content USING btree (section);


--
-- Name: admins_email_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);


--
-- Name: admins_username_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX admins_username_key ON public.admins USING btree (username);


--
-- Name: contact_info_type_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX contact_info_type_key ON public.contact_info USING btree (type);


--
-- Name: orders_orderId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "orders_orderId_key" ON public.orders USING btree ("orderId");


--
-- Name: pages_slug_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX pages_slug_key ON public.pages USING btree (slug);


--
-- PostgreSQL database dump complete
--

\unrestrict edimkiMGWiLTP3deO2CUkiP0JHUhyxcWtNKgyEEWSTYP5p9bKKVIXwkaEqUJe7M

