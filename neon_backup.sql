--
-- PostgreSQL database dump
--

\restrict dJmkU3y0jYjITbHg1yaKQny8cMaLUNwppchnC7naAOnG8hbOBmJcaXJ1Edc5bU2

-- Dumped from database version 17.8 (130b160)
-- Dumped by pg_dump version 18.3

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

ALTER TABLE IF EXISTS ONLY public.settlements DROP CONSTRAINT IF EXISTS settlements_to_user_id_humans_id_fk;
ALTER TABLE IF EXISTS ONLY public.settlements DROP CONSTRAINT IF EXISTS settlements_group_id_expense_groups_id_fk;
ALTER TABLE IF EXISTS ONLY public.settlements DROP CONSTRAINT IF EXISTS settlements_from_user_id_humans_id_fk;
ALTER TABLE IF EXISTS ONLY public.settlements DROP CONSTRAINT IF EXISTS settlements_event_id_events_id_fk;
ALTER TABLE IF EXISTS ONLY public.email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_customer_id_customers_id_fk;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_inviterId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS "account_userId_fkey";
CREATE OR REPLACE VIEW public.events_summary_for_analysis AS
SELECT
    NULL::uuid AS event_id,
    NULL::character varying(255) AS event_name,
    NULL::character varying(50) AS event_type,
    NULL::character varying(50) AS status,
    NULL::character varying(3) AS currency,
    NULL::date AS start_date,
    NULL::date AS end_date,
    NULL::interval AS duration_days,
    NULL::bigint AS total_expenses,
    NULL::numeric AS total_spending_dollars,
    NULL::numeric AS avg_expense_dollars,
    NULL::bigint AS unique_payers;
DROP INDEX IF EXISTS public.splits_user_idx;
DROP INDEX IF EXISTS public.splits_expense_idx;
DROP INDEX IF EXISTS public.settlements_to_user_idx;
DROP INDEX IF EXISTS public.settlements_status_idx;
DROP INDEX IF EXISTS public.settlements_from_user_idx;
DROP INDEX IF EXISTS public.settlements_event_idx;
DROP INDEX IF EXISTS public.settlements_created_at_idx;
DROP INDEX IF EXISTS public.sessions_user_id_idx;
DROP INDEX IF EXISTS public.sessions_expires_at_idx;
DROP INDEX IF EXISTS public.pending_invitations_status_idx;
DROP INDEX IF EXISTS public.pending_invitations_group_email_idx;
DROP INDEX IF EXISTS public.idx_human_system_roles_role_id;
DROP INDEX IF EXISTS public.idx_human_system_roles_human_id;
DROP INDEX IF EXISTS public.idx_events_status;
DROP INDEX IF EXISTS public.idx_events_start_time;
DROP INDEX IF EXISTS public.idx_activities_start_time;
DROP INDEX IF EXISTS public.idx_activities_event_id;
DROP INDEX IF EXISTS public.humans_name_idx;
DROP INDEX IF EXISTS public.groups_created_by_idx;
DROP INDEX IF EXISTS public.group_members_group_user_idx;
DROP INDEX IF EXISTS public.email_tokens_token_idx;
DROP INDEX IF EXISTS public.email_tokens_expires_at_idx;
DROP INDEX IF EXISTS public.email_tokens_email_idx;
DROP INDEX IF EXISTS public.email_tokens_customer_idx;
DROP INDEX IF EXISTS public.email_idx;
DROP INDEX IF EXISTS public.email_history_human_idx;
DROP INDEX IF EXISTS public.email_history_email_idx;
DROP INDEX IF EXISTS public.customers_verified_idx;
DROP INDEX IF EXISTS public.customers_username_idx;
DROP INDEX IF EXISTS public.customers_human_idx;
DROP INDEX IF EXISTS public.customers_email_idx;
DROP INDEX IF EXISTS neon_auth.verification_identifier_idx;
DROP INDEX IF EXISTS neon_auth."session_userId_idx";
DROP INDEX IF EXISTS neon_auth.organization_slug_uidx;
DROP INDEX IF EXISTS neon_auth."member_userId_idx";
DROP INDEX IF EXISTS neon_auth."member_organizationId_idx";
DROP INDEX IF EXISTS neon_auth."invitation_organizationId_idx";
DROP INDEX IF EXISTS neon_auth.invitation_email_idx;
DROP INDEX IF EXISTS neon_auth."account_userId_idx";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.system_roles DROP CONSTRAINT IF EXISTS system_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.settlements DROP CONSTRAINT IF EXISTS settlements_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.pending_group_invitations DROP CONSTRAINT IF EXISTS pending_group_invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.humans DROP CONSTRAINT IF EXISTS humans_pkey;
ALTER TABLE IF EXISTS ONLY public.human_system_roles DROP CONSTRAINT IF EXISTS human_system_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.group_roles DROP CONSTRAINT IF EXISTS group_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.group_role_permissions DROP CONSTRAINT IF EXISTS group_role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.expense_splits DROP CONSTRAINT IF EXISTS expense_splits_pkey;
ALTER TABLE IF EXISTS ONLY public.expense_groups DROP CONSTRAINT IF EXISTS expense_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_pkey;
ALTER TABLE IF EXISTS ONLY public.email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.email_history DROP CONSTRAINT IF EXISTS email_history_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.activities DROP CONSTRAINT IF EXISTS activities_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.verification DROP CONSTRAINT IF EXISTS verification_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_email_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_token_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_endpoint_id_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_slug_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS member_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.jwks DROP CONSTRAINT IF EXISTS jwks_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS invitation_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS account_pkey;
DROP TABLE IF EXISTS public.users;
DROP VIEW IF EXISTS public.user_payer_summary_for_analysis;
DROP VIEW IF EXISTS public.user_participant_summary_for_analysis;
DROP TABLE IF EXISTS public.system_roles;
DROP TABLE IF EXISTS public.settlements;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.pending_group_invitations;
DROP TABLE IF EXISTS public.humans;
DROP TABLE IF EXISTS public.human_system_roles;
DROP VIEW IF EXISTS public.group_spending_for_analysis;
DROP TABLE IF EXISTS public.group_roles;
DROP TABLE IF EXISTS public.group_role_permissions;
DROP TABLE IF EXISTS public.group_members;
DROP TABLE IF EXISTS public.expense_splits;
DROP TABLE IF EXISTS public.expense_groups;
DROP VIEW IF EXISTS public.events_summary_for_analysis;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.email_verification_tokens;
DROP TABLE IF EXISTS public.email_history;
DROP VIEW IF EXISTS public.daily_spending_trend_for_analysis;
DROP TABLE IF EXISTS public.customers;
DROP VIEW IF EXISTS public.category_spending_for_analysis;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.activities;
DROP TABLE IF EXISTS neon_auth.verification;
DROP TABLE IF EXISTS neon_auth."user";
DROP TABLE IF EXISTS neon_auth.session;
DROP TABLE IF EXISTS neon_auth.project_config;
DROP TABLE IF EXISTS neon_auth.organization;
DROP TABLE IF EXISTS neon_auth.member;
DROP TABLE IF EXISTS neon_auth.jwks;
DROP TABLE IF EXISTS neon_auth.invitation;
DROP TABLE IF EXISTS neon_auth.account;
DROP SCHEMA IF EXISTS neon_auth;
--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    title character varying(255) NOT NULL,
    location_name character varying(255),
    sequence_order integer DEFAULT 0,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata json DEFAULT '{}'::json,
    created_by uuid NOT NULL
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    activity_id uuid,
    paid_by uuid NOT NULL,
    amount integer NOT NULL,
    description character varying(500) DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tip_amount integer DEFAULT '0'::numeric NOT NULL,
    event_id uuid,
    category character varying(50) DEFAULT 'misc'::character varying,
    metadata json DEFAULT '{}'::json
);


--
-- Name: category_spending_for_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.category_spending_for_analysis AS
 SELECT category,
    count(*) AS expense_count,
    round(((sum(amount))::numeric / 100.0), 2) AS subtotal_dollars,
    round(((sum(tip_amount))::numeric / 100.0), 2) AS total_tips_dollars,
    round(((sum((amount + tip_amount)))::numeric / 100.0), 2) AS total_dollars,
    round((avg((amount + tip_amount)) / 100.0), 2) AS avg_expense_dollars,
    round(((max(amount))::numeric / 100.0), 2) AS max_expense_dollars,
    round(((min(amount))::numeric / 100.0), 2) AS min_expense_dollars
   FROM public.expenses e
  WHERE (category IS NOT NULL)
  GROUP BY category
  ORDER BY (round(((sum((amount + tip_amount)))::numeric / 100.0), 2)) DESC;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    human_id uuid NOT NULL,
    username character varying(255) NOT NULL,
    password_hash text NOT NULL,
    loyalty_points integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    email character varying(255) NOT NULL
);


--
-- Name: daily_spending_trend_for_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.daily_spending_trend_for_analysis AS
 SELECT (created_at)::date AS expense_date,
    (date_part('year'::text, created_at))::integer AS year,
    (date_part('month'::text, created_at))::integer AS month,
    (date_part('week'::text, created_at))::integer AS week,
    count(*) AS expense_count,
    round(((sum(amount))::numeric / 100.0), 2) AS subtotal_dollars,
    round(((sum(tip_amount))::numeric / 100.0), 2) AS total_tips_dollars,
    round(((sum((amount + tip_amount)))::numeric / 100.0), 2) AS daily_total_dollars,
    round((avg((amount + tip_amount)) / 100.0), 2) AS avg_expense_dollars,
    count(DISTINCT paid_by) AS unique_payers
   FROM public.expenses e
  GROUP BY ((created_at)::date), (date_part('year'::text, created_at)), (date_part('month'::text, created_at)), (date_part('week'::text, created_at))
  ORDER BY ((created_at)::date) DESC;


--
-- Name: email_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    human_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    effective_from timestamp with time zone DEFAULT now() NOT NULL,
    effective_to timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    location character varying(255),
    currency character varying(3) DEFAULT 'USD'::character varying,
    budget_cents integer,
    group_id uuid,
    type character varying(50) DEFAULT 'general'::character varying NOT NULL,
    status character varying(50) DEFAULT 'scheduled'::character varying,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    is_virtual boolean DEFAULT false,
    venue_id uuid,
    is_public boolean DEFAULT true,
    metadata json DEFAULT '{}'::json,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone
);


--
-- Name: events_summary_for_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.events_summary_for_analysis AS
SELECT
    NULL::uuid AS event_id,
    NULL::character varying(255) AS event_name,
    NULL::character varying(50) AS event_type,
    NULL::character varying(50) AS status,
    NULL::character varying(3) AS currency,
    NULL::date AS start_date,
    NULL::date AS end_date,
    NULL::interval AS duration_days,
    NULL::bigint AS total_expenses,
    NULL::numeric AS total_spending_dollars,
    NULL::numeric AS avg_expense_dollars,
    NULL::bigint AS unique_payers;


--
-- Name: expense_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: expense_splits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_splits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL
);


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    invited_at timestamp without time zone DEFAULT now() NOT NULL,
    joined_at timestamp without time zone,
    group_role_id uuid
);


--
-- Name: group_role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: group_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: group_spending_for_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.group_spending_for_analysis AS
 SELECT eg.id AS group_id,
    eg.name AS group_name,
    (eg.created_at)::date AS group_created_date,
    count(DISTINCT e.id) AS total_expenses,
    round(((sum((e.amount + e.tip_amount)))::numeric / 100.0), 2) AS total_group_spending_dollars,
    round((avg((e.amount + e.tip_amount)) / 100.0), 2) AS avg_expense_dollars,
    (min(e.created_at))::date AS first_expense_date,
    (max(e.created_at))::date AS last_expense_date
   FROM (public.expense_groups eg
     LEFT JOIN public.expenses e ON ((eg.id = e.group_id)))
  GROUP BY eg.id, eg.name, eg.created_at
  ORDER BY (round(((sum((e.amount + e.tip_amount)))::numeric / 100.0), 2)) DESC;


--
-- Name: human_system_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.human_system_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    human_id uuid NOT NULL,
    system_role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: humans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.humans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    dob date,
    gender character varying(50),
    phone character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pending_group_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_group_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    invited_by uuid NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    invited_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    accepted_at timestamp without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    permission_name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: settlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    group_id uuid,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    amount integer NOT NULL,
    description character varying(500) DEFAULT ''::character varying,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: system_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_participant_summary_for_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_participant_summary_for_analysis AS
 SELECT h.id AS user_id,
    c.username,
    h.first_name,
    h.last_name,
    count(DISTINCT es.expense_id) AS expenses_involved_in,
    round(((sum(es.amount))::numeric / 100.0), 2) AS total_owed_dollars,
    round((avg(es.amount) / 100.0), 2) AS avg_split_dollars
   FROM ((public.humans h
     LEFT JOIN public.customers c ON ((h.id = c.human_id)))
     LEFT JOIN public.expense_splits es ON ((h.id = es.user_id)))
  WHERE (es.id IS NOT NULL)
  GROUP BY h.id, c.username, h.first_name, h.last_name
  ORDER BY (round(((sum(es.amount))::numeric / 100.0), 2)) DESC;


--
-- Name: user_payer_summary_for_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_payer_summary_for_analysis AS
 SELECT h.id AS user_id,
    c.username,
    h.first_name,
    h.last_name,
    count(DISTINCT e.id) AS expenses_created,
    round(((sum((e.amount + e.tip_amount)))::numeric / 100.0), 2) AS total_paid_dollars,
    round((avg((e.amount + e.tip_amount)) / 100.0), 2) AS avg_expense_dollars,
    round(((sum(e.tip_amount))::numeric / 100.0), 2) AS total_tips_paid_dollars,
    (min(e.created_at))::date AS first_expense_date,
    (max(e.created_at))::date AS last_expense_date
   FROM ((public.humans h
     LEFT JOIN public.customers c ON ((h.id = c.human_id)))
     LEFT JOIN public.expenses e ON ((h.id = e.paid_by)))
  WHERE (e.id IS NOT NULL)
  GROUP BY h.id, c.username, h.first_name, h.last_name
  ORDER BY (round(((sum((e.amount + e.tip_amount)))::numeric / 100.0), 2)) DESC;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
53077f88-d869-4d6a-babc-236382f51cec	Split	ep-twilight-flower-anebzpau	2026-04-02 16:28:18.3+00	2026-04-02 16:28:18.3+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, event_id, title, location_name, sequence_order, start_time, end_time, created_at, metadata, created_by) FROM stdin;
5df8253a-9937-4650-9eb1-a770ee59c338	\N	Morning Hike	Mountain Trail	0	2026-04-09 14:58:00+00	2026-04-09 16:58:00+00	2026-04-09 14:58:53.439656+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
9f781e55-effa-439f-8966-e4e6033c3739	8e130393-445b-42f2-9dca-2315369b553a	Flight To Houston	DIA	0	2026-04-15 15:45:00+00	2026-05-15 19:10:00+00	2026-04-21 12:00:00.692052+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
d41f3285-225e-4a89-b9e5-e0c71258231f	8e130393-445b-42f2-9dca-2315369b553a	Flight From Houston	IAH	0	2026-05-17 22:11:00+00	2026-05-17 23:11:00+00	2026-04-21 12:12:44.42867+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
3eea6a97-0cdf-47e9-bc71-8937bba6bee1	959b9678-545f-449f-b839-4b35573532df	Drive to Denver	I-25 North	1	\N	\N	2026-04-21 18:01:20.406+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
8a2260a5-0e46-45d0-ad1a-2e709447030c	959b9678-545f-449f-b839-4b35573532df	Hotel Check-in	Grand Hyatt Denver	2	\N	\N	2026-04-21 18:01:20.456+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
cc838617-c2f1-4811-95c4-13fd9cd2ab9c	959b9678-545f-449f-b839-4b35573532df	Dinner Downtown	Wynkoop Brewing Company	3	\N	\N	2026-04-21 18:01:20.496+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
638941be-409c-4c78-8752-800ea3969602	959b9678-545f-449f-b839-4b35573532df	Day hike - Red Rocks Park	Red Rocks Park	4	\N	\N	2026-04-21 18:01:20.537+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
ddd75d7b-c102-4366-afbd-942be76f879c	ef74d380-7ea1-4071-a97c-e1acdc9ba281	Team Gathering	Local Restaurant	1	\N	\N	2026-04-21 18:01:20.576+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
e842e0f6-62fc-4082-96cd-f8a06353a848	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	Drive to Denver	I-25 North	1	\N	\N	2026-04-21 18:27:31.085+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
ebce87c8-12d9-41ac-8f01-34e398d8a0df	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	Hotel Check-in	Grand Hyatt Denver	2	\N	\N	2026-04-21 18:27:31.128+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
e902b618-2930-4ecc-8f0f-833cb71009ee	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	Dinner Downtown	Wynkoop Brewing Company	3	\N	\N	2026-04-21 18:27:31.168+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
6565e602-35e8-48b5-904f-e4fcddaa530c	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	Day hike - Red Rocks Park	Red Rocks Park	4	\N	\N	2026-04-21 18:27:31.208+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
c8eb648c-c08f-47ee-843d-a9250b163f8e	34dcad7a-6844-463f-b44c-9aadccd924cb	Team Gathering	Local Restaurant	1	\N	\N	2026-04-21 18:27:31.247+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
249d4eba-5054-48d2-be16-6779e619ac29	\N	SSE Test Activity	\N	0	\N	\N	2026-04-23 12:22:37.890998+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
056c6e6d-3a25-495c-9271-2d0938ea3ff0	\N	SSE Test Activity	\N	0	\N	\N	2026-04-23 12:24:45.451174+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
79d253a2-4ba1-4b0e-8ea2-b9b0d7a43116	\N	SSE Test Activity	\N	0	\N	\N	2026-04-23 12:25:44.412044+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
a90cfd68-be46-4bcc-a39a-915c1c714856	\N	SSE Test Activity 4	\N	0	\N	\N	2026-04-23 12:35:37.773521+00	{}	75169a5c-569c-4606-b643-12590ae16c6e
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, human_id, username, password_hash, loyalty_points, created_at, updated_at, email_verified, email) FROM stdin;
0b1fc70c-ac46-4028-ace7-29a27af8f0fe	ab387893-b5a2-4bdf-8fe1-6d59d0fa5fc0	testuser	$2b$10$RddbVtyIhFDP2z3E6QQRC.cZLul6z36nwNBI1LwDUzy9TTA9WwsB6	0	2026-04-22 11:50:01.44993	2026-04-22 11:58:00.946	t	delivered@resend.dev
05837d3a-e69f-4e29-97c6-a798738c0a3f	61994963-eb56-4d04-89af-8e1593a507ca	sonny	$2b$10$RBt9GQbOZGgOJKQd0YDIBO45wQVor83VLnth2syl4jKMvBzzase2e	0	2026-04-22 22:52:53.445048	2026-04-22 22:52:53.445048	t	sonny+1776898373137@split.local
172c6505-2d49-4f19-9cb2-9bd1b38cdd3f	75169a5c-569c-4606-b643-12590ae16c6e	cathyd	$2b$10$dVGVot0nt9qSha7np7mwWedRS71y.B5wkKNQIEO3vBNYVBwBPN2Q.	0	2026-04-23 00:41:07.605915	2026-04-23 00:41:07.605915	f	user-172c6505-2d49-4f19-9cb2-9bd1b38cdd3f@example.com
\.


--
-- Data for Name: email_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_history (id, human_id, email, effective_from, effective_to, created_at) FROM stdin;
e839fda7-ef13-46e6-9fdf-aa64bbf8f294	61994963-eb56-4d04-89af-8e1593a507ca	sonny@example.com	2026-04-21 14:34:59.445468+00	\N	2026-04-21 14:34:59.445468+00
66867515-8eb4-44ff-a70a-92a8214f51ed	10000004-0000-0000-0000-000000000004	power.user@example.com	2026-04-21 14:34:59.485801+00	\N	2026-04-21 14:34:59.485801+00
2b020637-1b22-4c75-aac4-ee0447fc7e22	10000003-0000-0000-0000-000000000003	viewer.user@example.com	2026-04-21 14:34:59.525365+00	\N	2026-04-21 14:34:59.525365+00
825e60d8-a275-475a-a558-84d3d6404a4f	10000002-0000-0000-0000-000000000002	regular.user@example.com	2026-04-21 14:34:59.565141+00	\N	2026-04-21 14:34:59.565141+00
9815ac7c-428f-48e4-ab14-58468ecfa907	10000001-0000-0000-0000-000000000001	admin.user@example.com	2026-04-21 14:34:59.604816+00	\N	2026-04-21 14:34:59.604816+00
c4164a64-4994-4d29-bc54-c2eef93b6f28	6d916ed5-f539-4a51-9e17-044d81c956d2	johndoe@example.com	2026-04-21 14:34:59.644322+00	\N	2026-04-21 14:34:59.644322+00
2255283b-1c27-48cf-ba1a-78ab9a719f40	c9a566f3-0415-43ec-8beb-ace776b39c6a	testuser@example.com	2026-04-21 14:34:59.684468+00	\N	2026-04-21 14:34:59.684468+00
189e71a0-6b20-4734-9eb3-24a5af69fb62	75169a5c-569c-4606-b643-12590ae16c6e	cathyd@example.com	2026-04-21 14:34:59.399576+00	2026-04-21 14:43:40.094242+00	2026-04-21 14:34:59.399576+00
62104046-3ed1-4132-8910-890cdf6b987b	75169a5c-569c-4606-b643-12590ae16c6e	grammyhaynes0727@gmail.com	2026-04-21 14:43:40.133442+00	\N	2026-04-21 14:43:40.133442+00
60435cca-f68d-4b3b-98e1-e94e5e0c956a	05e1951d-d284-4275-b7bf-ee2e73430d01	hilliard16@comcast.net	2026-04-22 10:30:57.839977+00	\N	2026-04-22 10:30:57.839977+00
c16b8a0b-9beb-4de6-8f02-acd7c88cb8a5	ab387893-b5a2-4bdf-8fe1-6d59d0fa5fc0	delivered@resend.dev	2026-04-22 11:50:01.410326+00	\N	2026-04-22 11:50:01.410326+00
612249af-d70e-46ad-9491-e99c7728982d	d7176e8c-194c-4d11-bccb-a4125d2c5eee	delivered@resend.dev	2026-04-22 11:50:01.414583+00	\N	2026-04-22 11:50:01.414583+00
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verification_tokens (id, customer_id, email, token, expires_at, verified_at, created_at) FROM stdin;
c14f52f6-95fb-40bf-944d-72dd187368a8	0b1fc70c-ac46-4028-ace7-29a27af8f0fe	delivered@resend.dev	c07523c13c07542f25044b888f610a6de3561c17576fb2ceef1a54cf50511573	2026-04-23 11:50:00.763	2026-04-22 11:58:00.894	2026-04-22 11:50:01.761894
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, creator_id, title, description, created_at, location, currency, budget_cents, group_id, type, status, timezone, is_virtual, venue_id, is_public, metadata, start_time, end_time) FROM stdin;
765856eb-d894-4ea8-ac27-60941d365a41	61994963-eb56-4d04-89af-8e1593a507ca	Trip To OZ	yello brick road	2026-04-20 15:41:55.704+00	\N	USD	\N	d06517e4-ac7a-4141-9d47-fc00647cda9c	trip	scheduled	America/Denver	f	\N	t	{}	2026-04-20 15:41:00+00	2026-04-21 15:41:00+00
8e130393-445b-42f2-9dca-2315369b553a	61994963-eb56-4d04-89af-8e1593a507ca	Teresa's Birthday Bash 2026	Celebrating the Big '50'	2026-04-21 10:04:10.819+00	\N	USD	\N	d06517e4-ac7a-4141-9d47-fc00647cda9c	general	scheduled	America/Denver	f	\N	t	{}	2026-05-17 04:03:00+00	2026-05-19 04:03:00+00
959b9678-545f-449f-b839-4b35573532df	f0abac11-f1ab-4350-9840-bbc126bdc10d	Denver Weekend Trip	Weekend trip to Denver with friends	2026-04-21 18:01:20.321+00	\N	USD	50000	13a3282a-e043-4b1c-9164-950f0e08f22e	trip	scheduled	America/Denver	f	\N	t	{}	2026-04-22 18:01:20.321+00	2026-04-24 18:01:20.321+00
ef74d380-7ea1-4071-a97c-e1acdc9ba281	f0abac11-f1ab-4350-9840-bbc126bdc10d	Team Lunch	Team celebration lunch	2026-04-21 18:01:20.365+00	\N	USD	15000	699df82a-836e-440b-a48a-d3e0c1da4e81	trip	scheduled	UTC	f	\N	t	{}	2026-04-24 18:01:20.321+00	\N
d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	f0abac11-f1ab-4350-9840-bbc126bdc10d	Denver Weekend Trip	Weekend trip to Denver with friends	2026-04-21 18:27:31+00	\N	USD	50000	fb628941-0576-4ed5-9025-5217061759f8	trip	scheduled	America/Denver	f	\N	t	{}	2026-04-22 18:27:31+00	2026-04-24 18:27:31+00
34dcad7a-6844-463f-b44c-9aadccd924cb	f0abac11-f1ab-4350-9840-bbc126bdc10d	Team Lunch	Team celebration lunch	2026-04-21 18:27:31.044+00	\N	USD	15000	7b235ac7-0fca-4636-9106-72f0812d98d6	trip	scheduled	UTC	f	\N	t	{}	2026-04-24 18:27:31+00	\N
\.


--
-- Data for Name: expense_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_groups (id, name, created_by, created_at) FROM stdin;
37ea6043-bf84-418d-859e-5546375b6b4e	Test Group 4	6d916ed5-f539-4a51-9e17-044d81c956d2	2026-04-08 13:50:13.055503
6f84bf75-5991-4444-9b5b-ccdf88ef5e74	Test Event Expenses	6d916ed5-f539-4a51-9e17-044d81c956d2	2026-04-08 22:18:57.528905
930c1ff4-34fb-4d3c-8c1c-033360491dc4	Dallas Kids	6d916ed5-f539-4a51-9e17-044d81c956d2	2026-04-11 22:20:41.290554
d06517e4-ac7a-4141-9d47-fc00647cda9c	Houston Party People	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-20 09:27:38.847348
13a3282a-e043-4b1c-9164-950f0e08f22e	Denver Weekend Trip	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:01:19.842
699df82a-836e-440b-a48a-d3e0c1da4e81	Work Team Dinner	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:01:20.065
fa51b0d1-9096-4b0c-ba55-422761278cf9	Roommate Expenses	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:01:20.202
fb628941-0576-4ed5-9025-5217061759f8	Denver Weekend Trip	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:27:30.493
7b235ac7-0fca-4636-9106-72f0812d98d6	Work Team Dinner	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:27:30.763
f4a05d74-6f66-43f6-aef8-b34552c68146	Roommate Expenses	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:27:30.882
\.


--
-- Data for Name: expense_splits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_splits (id, expense_id, user_id, amount) FROM stdin;
51dc3c7d-cecb-4ba5-a6cf-57b54ca307e8	ec818ffb-8b66-47d9-91fa-c45a0eb0ceb2	6d916ed5-f539-4a51-9e17-044d81c956d2	1481
0ee75648-58fc-495a-9745-86b9374b6fdd	a4c7ed6b-0b1a-4770-86fc-3ac29a3a166c	6d916ed5-f539-4a51-9e17-044d81c956d2	1200
fbde3dd2-d0e8-480b-ade4-6fd43c8d5f9e	91e0c9ab-692a-47b6-84be-c928cff1e7dc	6d916ed5-f539-4a51-9e17-044d81c956d2	1000
61c8152d-7dd5-4533-98c6-9686637dd537	3df42b49-3f92-4f46-b265-540e1b502766	61994963-eb56-4d04-89af-8e1593a507ca	5000
203f7d9c-8692-4e9e-9e32-e5916f68bfa1	3df42b49-3f92-4f46-b265-540e1b502766	75169a5c-569c-4606-b643-12590ae16c6e	5000
fb5f88b1-8b67-4cd0-9475-c082319bdcbf	784c5756-e9d4-4568-a9ad-c4815a4eb009	61994963-eb56-4d04-89af-8e1593a507ca	28196
96d9d9fe-3884-42cf-9ce2-de70230c7bdf	784c5756-e9d4-4568-a9ad-c4815a4eb009	75169a5c-569c-4606-b643-12590ae16c6e	28196
a06fb106-8e4d-4756-834c-3303b9a31dba	7515ee14-e983-4375-9dbb-0e7951339cbf	61994963-eb56-4d04-89af-8e1593a507ca	28196
4223be1a-248b-4244-9f94-566d52f88a2d	7515ee14-e983-4375-9dbb-0e7951339cbf	75169a5c-569c-4606-b643-12590ae16c6e	28196
57e42205-aa07-4672-a6e4-9aea5ba56f6c	6f5bc61d-c0d4-4984-b631-598a386166eb	61994963-eb56-4d04-89af-8e1593a507ca	28196
17d05ec0-761d-4192-b8e2-3e0c13bc55d2	6f5bc61d-c0d4-4984-b631-598a386166eb	75169a5c-569c-4606-b643-12590ae16c6e	28196
b262c844-645b-4d9a-b249-6c1301245da6	050211fc-d67f-4e7d-9708-e6e31f9700c1	61994963-eb56-4d04-89af-8e1593a507ca	28196
9498c4e7-e36f-4bac-a1bd-cf62a42e1e44	050211fc-d67f-4e7d-9708-e6e31f9700c1	75169a5c-569c-4606-b643-12590ae16c6e	28196
50e78727-fa8c-4552-8cc9-57e40bfef7e7	db87fe49-f978-4a1c-ac93-0c5d796a8bbe	61994963-eb56-4d04-89af-8e1593a507ca	28196
72910ae1-6b7b-4d06-80d2-cc144b2f9efd	db87fe49-f978-4a1c-ac93-0c5d796a8bbe	75169a5c-569c-4606-b643-12590ae16c6e	28196
682e6922-2f96-40a2-8389-1895e0fb6ddf	6d40b9c3-b033-435a-bb70-ca702bdb39f3	61994963-eb56-4d04-89af-8e1593a507ca	28196
76808cbd-12fb-4659-8984-9b8933c9a740	6d40b9c3-b033-435a-bb70-ca702bdb39f3	75169a5c-569c-4606-b643-12590ae16c6e	28196
36b7fff7-4a36-4ee7-a193-41f0960e0cab	3bcb1d99-4b19-4f0a-b9c4-d30e5462a844	61994963-eb56-4d04-89af-8e1593a507ca	4950
89c3c0f1-58e5-49b5-8926-70dc48dccf6f	3bcb1d99-4b19-4f0a-b9c4-d30e5462a844	75169a5c-569c-4606-b643-12590ae16c6e	4950
ad0c73d4-6f74-474a-a586-49bef69d15ad	c917bd5c-eab2-47db-a2b6-0f137ab9c5ea	61994963-eb56-4d04-89af-8e1593a507ca	165000
80554d70-9171-40ed-a89f-cb755967a49f	c917bd5c-eab2-47db-a2b6-0f137ab9c5ea	75169a5c-569c-4606-b643-12590ae16c6e	165000
4e38b249-94e8-46d8-8601-40c4dbcaf490	cac5591f-a44e-4a9e-9adc-fe217694759e	61994963-eb56-4d04-89af-8e1593a507ca	28196
e07a9747-9b15-48e0-88ba-5ca96a8f6d66	cac5591f-a44e-4a9e-9adc-fe217694759e	75169a5c-569c-4606-b643-12590ae16c6e	28196
6036eefe-a649-4fa4-80dc-05b1120df735	f151fd0e-d941-4953-b112-71079e3c89b2	61994963-eb56-4d04-89af-8e1593a507ca	5940
b38abee7-8549-4b51-9484-50624e89b7e2	f151fd0e-d941-4953-b112-71079e3c89b2	75169a5c-569c-4606-b643-12590ae16c6e	5940
0b3f6e75-5223-4660-8ae1-d630098d6fca	8b16dee2-51a0-4e4f-a460-1fe7bb2c24d8	61994963-eb56-4d04-89af-8e1593a507ca	3300
649d07d2-b6b5-4a3d-9817-1ffb31a912a3	8b16dee2-51a0-4e4f-a460-1fe7bb2c24d8	75169a5c-569c-4606-b643-12590ae16c6e	3300
d87ef110-cc6d-4dac-8888-6a16026c294e	2769b540-2f4c-495f-a6ab-c7208191fc28	61994963-eb56-4d04-89af-8e1593a507ca	1440
41bcb7e9-3a6c-435c-b3e1-e35fa95c3a5e	2769b540-2f4c-495f-a6ab-c7208191fc28	75169a5c-569c-4606-b643-12590ae16c6e	1440
72a8e9cf-cfe5-4baf-aa82-1b69c406a6ef	765ffb6c-579c-4ff5-ac86-a3ba178ebb87	61994963-eb56-4d04-89af-8e1593a507ca	2500
d47dbe2a-69f6-4915-a11d-25f08fa3a570	765ffb6c-579c-4ff5-ac86-a3ba178ebb87	75169a5c-569c-4606-b643-12590ae16c6e	2500
656d78a3-f3a1-473e-855e-1bf765e8dd8b	085b5fc8-4ff4-477f-ba53-a05e0af63523	61994963-eb56-4d04-89af-8e1593a507ca	14840
4ac998b4-1673-4bef-948c-a7ff73520271	085b5fc8-4ff4-477f-ba53-a05e0af63523	75169a5c-569c-4606-b643-12590ae16c6e	14840
9b481ac1-f12e-448f-bb23-b87db98baeda	bdc2ae59-80e2-4ed2-b637-97976c26b763	61994963-eb56-4d04-89af-8e1593a507ca	14840
b9379f54-8989-40a2-a697-1ad4852e4e24	bdc2ae59-80e2-4ed2-b637-97976c26b763	75169a5c-569c-4606-b643-12590ae16c6e	14840
bb33ccf1-44e8-4edb-8055-0be79e61b4fc	a734a959-cbdb-4263-a2eb-5e1e37158fa6	61994963-eb56-4d04-89af-8e1593a507ca	8754
1d9883f3-ef90-403e-b19d-dc4122795d16	a734a959-cbdb-4263-a2eb-5e1e37158fa6	75169a5c-569c-4606-b643-12590ae16c6e	8754
1d2ccfd7-5740-4d6a-9235-590ccbd0f00a	acf5dffb-b046-482a-a724-58e501f5ae50	61994963-eb56-4d04-89af-8e1593a507ca	6075
e9812fc4-eb59-4ad1-8ba7-4d56c8aa64e8	acf5dffb-b046-482a-a724-58e501f5ae50	75169a5c-569c-4606-b643-12590ae16c6e	6075
5137d970-9759-4000-8aca-7cdc5ef8c85b	9b983e54-db89-47e1-bf75-684ed239d71a	f0abac11-f1ab-4350-9840-bbc126bdc10d	10000
f0f149e6-7c29-4c68-9453-1f2179a0e3a7	9b983e54-db89-47e1-bf75-684ed239d71a	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	10000
7c801c60-52ba-4116-96d4-768c21c7a339	9b983e54-db89-47e1-bf75-684ed239d71a	f93fb85a-6356-49dc-8e11-7eed1e15de74	10000
fd765927-6ea6-4332-81ea-15cab9a9a17c	9b983e54-db89-47e1-bf75-684ed239d71a	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	10000
6a067c51-9b76-4059-b888-aaffe5195d4d	c0f1e496-eb11-4ff4-afe5-5d91c929787a	f0abac11-f1ab-4350-9840-bbc126bdc10d	3600
9350fe7a-9e04-4660-a443-74d1605f3c63	c0f1e496-eb11-4ff4-afe5-5d91c929787a	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	3600
3be5d1d3-ff54-46ad-9469-ee2f410ed20d	c0f1e496-eb11-4ff4-afe5-5d91c929787a	f93fb85a-6356-49dc-8e11-7eed1e15de74	3600
d2b15cec-af16-4982-a99e-9467cd8a6b12	c0f1e496-eb11-4ff4-afe5-5d91c929787a	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	3600
99d3c95f-9f9f-4f77-b197-830efbeb9c81	9e0c2810-65d9-4a15-8f60-a496a8e7a921	f0abac11-f1ab-4350-9840-bbc126bdc10d	1250
31ec0d2c-bd68-4065-9223-1c630e841cde	9e0c2810-65d9-4a15-8f60-a496a8e7a921	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	1250
0f2d2df5-7e0d-4124-9ddf-fdd43676bbe0	9e0c2810-65d9-4a15-8f60-a496a8e7a921	f93fb85a-6356-49dc-8e11-7eed1e15de74	1250
4fd2d633-d50d-4113-a436-4e429f2257e8	9e0c2810-65d9-4a15-8f60-a496a8e7a921	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	1250
a2300118-54eb-4475-8a81-63e82a05f666	c7e45ee8-94e0-4536-a195-72edf02a76ed	f0abac11-f1ab-4350-9840-bbc126bdc10d	5750
421ec4fc-dab7-414f-9fe7-eb7aff74a1ad	c7e45ee8-94e0-4536-a195-72edf02a76ed	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	5750
d9450781-6ff3-4c00-9f16-a963d33577ea	717481f5-25aa-4cd0-85a3-ff31f408ad6e	f0abac11-f1ab-4350-9840-bbc126bdc10d	10000
772a216c-63c5-49a3-9a95-af81bd3e29b6	717481f5-25aa-4cd0-85a3-ff31f408ad6e	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	10000
6820f784-408c-4015-9dec-2c1311c05bbb	717481f5-25aa-4cd0-85a3-ff31f408ad6e	f93fb85a-6356-49dc-8e11-7eed1e15de74	10000
6a212882-933d-4c27-b91e-1eece8ed5f98	717481f5-25aa-4cd0-85a3-ff31f408ad6e	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	10000
da5250c9-06b5-42ee-9176-ace7294603e5	c62f5da3-f759-4790-8d62-663ab2ff94da	f0abac11-f1ab-4350-9840-bbc126bdc10d	3600
fae8ff73-6ad2-453d-a475-2d5dc9b4db13	c62f5da3-f759-4790-8d62-663ab2ff94da	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	3600
3455f439-4c7a-4b99-95dd-e2277557b39f	c62f5da3-f759-4790-8d62-663ab2ff94da	f93fb85a-6356-49dc-8e11-7eed1e15de74	3600
44851c7e-0023-43dc-8134-3ee77a2bd717	c62f5da3-f759-4790-8d62-663ab2ff94da	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	3600
565b4dbd-a447-454d-b3d9-7bc41210e26d	fd074a1f-468e-4729-abfe-5d30c0a7388b	f0abac11-f1ab-4350-9840-bbc126bdc10d	1250
81a5e2fd-6cab-4353-8416-2b2ed81a5292	fd074a1f-468e-4729-abfe-5d30c0a7388b	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	1250
2eac8ebc-8562-43c8-917e-c249834dc45e	fd074a1f-468e-4729-abfe-5d30c0a7388b	f93fb85a-6356-49dc-8e11-7eed1e15de74	1250
b3324d1d-5e9e-4f9b-bcd7-8582b08ef4b4	fd074a1f-468e-4729-abfe-5d30c0a7388b	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	1250
fc2917aa-3c7c-4dfa-97ac-59b5ac6689bd	91e74b42-79fa-46fc-92d9-52e711781b63	f0abac11-f1ab-4350-9840-bbc126bdc10d	5750
cc755d0c-d284-4b26-9b99-1a56e8e551ba	91e74b42-79fa-46fc-92d9-52e711781b63	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	5750
6fa79188-0ed9-4a05-a6d3-91631e05db67	f9d93264-1f02-4374-9dab-1db88c32af30	afc527e4-bd37-4b0a-8f15-a9bb4d046f51	29681
944689f7-c518-498e-a4bd-a0a27e3b7939	f9d93264-1f02-4374-9dab-1db88c32af30	2f6b17aa-7bf0-4e28-8925-2d8d824fb193	29681
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, group_id, activity_id, paid_by, amount, description, created_at, tip_amount, event_id, category, metadata) FROM stdin;
ec818ffb-8b66-47d9-91fa-c45a0eb0ceb2	6f84bf75-5991-4444-9b5b-ccdf88ef5e74	\N	6d916ed5-f539-4a51-9e17-044d81c956d2	1234	Breakfast at Dennys	2026-04-08 22:29:14.94123	247	\N	misc	{}
a4c7ed6b-0b1a-4770-86fc-3ac29a3a166c	6f84bf75-5991-4444-9b5b-ccdf88ef5e74	\N	6d916ed5-f539-4a51-9e17-044d81c956d2	1000	Breakfast at Tiffanys	2026-04-08 22:34:00.743342	200	\N	misc	{}
91e0c9ab-692a-47b6-84be-c928cff1e7dc	6f84bf75-5991-4444-9b5b-ccdf88ef5e74	\N	6d916ed5-f539-4a51-9e17-044d81c956d2	1000	Test Activity	2026-04-09 16:31:10.925719	0	\N	misc	{}
cac5591f-a44e-4a9e-9adc-fe217694759e	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	56392	Flight	2026-04-20 15:41:56.979988	0	765856eb-d894-4ea8-ac27-60941d365a41	misc	{}
8b16dee2-51a0-4e4f-a460-1fe7bb2c24d8	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	6600	Parking	2026-04-20 15:50:45.316295	0	765856eb-d894-4ea8-ac27-60941d365a41	parking	{}
f151fd0e-d941-4953-b112-71079e3c89b2	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	9900	Dinner	2026-04-20 15:43:38.177259	1980	765856eb-d894-4ea8-ac27-60941d365a41	meal	{}
2769b540-2f4c-495f-a6ab-c7208191fc28	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	2400	Lunch	2026-04-20 15:57:12.158929	480	765856eb-d894-4ea8-ac27-60941d365a41	meal	{}
765ffb6c-579c-4ff5-ac86-a3ba178ebb87	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	4000	Breakfast	2026-04-20 17:39:27.734746	1000	765856eb-d894-4ea8-ac27-60941d365a41	meal	{}
085b5fc8-4ff4-477f-ba53-a05e0af63523	d06517e4-ac7a-4141-9d47-fc00647cda9c	9f781e55-effa-439f-8966-e4e6033c3739	61994963-eb56-4d04-89af-8e1593a507ca	29681	Flight To Houston	2026-04-21 12:00:01.060421	0	8e130393-445b-42f2-9dca-2315369b553a	transport	{}
bdc2ae59-80e2-4ed2-b637-97976c26b763	d06517e4-ac7a-4141-9d47-fc00647cda9c	d41f3285-225e-4a89-b9e5-e0c71258231f	61994963-eb56-4d04-89af-8e1593a507ca	29681	Flight From Houston	2026-04-21 12:12:44.618723	0	8e130393-445b-42f2-9dca-2315369b553a	transport	{}
a734a959-cbdb-4263-a2eb-5e1e37158fa6	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	17508	WoodSpring Suites Houston	2026-04-21 12:40:46.463413	0	8e130393-445b-42f2-9dca-2315369b553a	accommodation	{"Confirmation Number":"30662902","Reservation Name":"Hilliard","Hotel Name":"WoodSpring Suites Houston IAH Airport","Room Type":"Standard Room, 1 Queen Bed, Non Smoking","Check-in Date":"May 15 2026","Check-out Date":"May 17 2026"}
acf5dffb-b046-482a-a724-58e501f5ae50	d06517e4-ac7a-4141-9d47-fc00647cda9c	\N	61994963-eb56-4d04-89af-8e1593a507ca	12150	Car Rental Houston	2026-04-21 14:13:08.35895	0	8e130393-445b-42f2-9dca-2315369b553a	transport	{"Company":"Easirent","Confirmation Number":"#US160426244919HS","Itenerary Number":"73421985577413","Vehicle Type":"Toyota Rav 4 or similar","Location":"15840 John F Kennedy Blvd C/O Courtyard By Marriott","Reserved For":"Hilliard M. Scott"}
9b983e54-db89-47e1-bf75-684ed239d71a	13a3282a-e043-4b1c-9164-950f0e08f22e	8a2260a5-0e46-45d0-ad1a-2e709447030c	f0abac11-f1ab-4350-9840-bbc126bdc10d	40000	Hotel for 2 nights	2026-04-21 18:01:20.616	0	959b9678-545f-449f-b839-4b35573532df	lodging	{}
c0f1e496-eb11-4ff4-afe5-5d91c929787a	13a3282a-e043-4b1c-9164-950f0e08f22e	cc838617-c2f1-4811-95c4-13fd9cd2ab9c	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	12000	Dinner at Wynkoop	2026-04-21 18:01:20.833	2400	959b9678-545f-449f-b839-4b35573532df	food	{}
9e0c2810-65d9-4a15-8f60-a496a8e7a921	13a3282a-e043-4b1c-9164-950f0e08f22e	638941be-409c-4c78-8752-800ea3969602	f93fb85a-6356-49dc-8e11-7eed1e15de74	5000	Gas for the drive	2026-04-21 18:01:21.03	0	959b9678-545f-449f-b839-4b35573532df	transportation	{}
c7e45ee8-94e0-4536-a195-72edf02a76ed	699df82a-836e-440b-a48a-d3e0c1da4e81	ddd75d7b-c102-4366-afbd-942be76f879c	f0abac11-f1ab-4350-9840-bbc126bdc10d	10000	Team lunch celebration	2026-04-21 18:01:21.224	1500	ef74d380-7ea1-4071-a97c-e1acdc9ba281	food	{}
717481f5-25aa-4cd0-85a3-ff31f408ad6e	fb628941-0576-4ed5-9025-5217061759f8	ebce87c8-12d9-41ac-8f01-34e398d8a0df	f0abac11-f1ab-4350-9840-bbc126bdc10d	40000	Hotel for 2 nights	2026-04-21 18:27:31.287	0	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	lodging	{}
c62f5da3-f759-4790-8d62-663ab2ff94da	fb628941-0576-4ed5-9025-5217061759f8	e902b618-2930-4ecc-8f0f-833cb71009ee	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	12000	Dinner at Wynkoop	2026-04-21 18:27:31.492	2400	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	food	{}
fd074a1f-468e-4729-abfe-5d30c0a7388b	fb628941-0576-4ed5-9025-5217061759f8	6565e602-35e8-48b5-904f-e4fcddaa530c	f93fb85a-6356-49dc-8e11-7eed1e15de74	5000	Gas for the drive	2026-04-21 18:27:31.688	0	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	transportation	{}
91e74b42-79fa-46fc-92d9-52e711781b63	7b235ac7-0fca-4636-9106-72f0812d98d6	c8eb648c-c08f-47ee-843d-a9250b163f8e	f0abac11-f1ab-4350-9840-bbc126bdc10d	10000	Team lunch celebration	2026-04-21 18:27:31.882	1500	34dcad7a-6844-463f-b44c-9aadccd924cb	food	{}
f9d93264-1f02-4374-9dab-1db88c32af30	\N	\N	2f6b17aa-7bf0-4e28-8925-2d8d824fb193	59362	Round‑trip Flight	2026-04-25 04:24:39.225001	0	8b62cddc-b825-4137-90d2-9339881f461b	flight	{"airline":"Delta Airlines","flightNumber":"DL 1234","confirmationNumber":"ABC-7890","takeOffTime":"2026-04-15T08:30:00Z","arrivalTime":"2026-04-15T12:45:00Z","seatNumber":"12A"}
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_members (id, group_id, user_id, invited_at, joined_at, group_role_id) FROM stdin;
162dbedb-4c30-4790-b62e-27d53c0968ab	37ea6043-bf84-418d-859e-5546375b6b4e	6d916ed5-f539-4a51-9e17-044d81c956d2	2026-04-08 19:48:56.956966	2026-04-08 13:50:13.055503	cf8d8119-37c2-4b4f-beac-ed07f7418d6d
2e0d4cf5-2e89-471c-a60a-f8fa9e1d6374	930c1ff4-34fb-4d3c-8c1c-033360491dc4	6d916ed5-f539-4a51-9e17-044d81c956d2	2026-04-11 22:20:41.337273	2026-04-11 22:20:41.102	\N
2bfe7a6c-bd24-429c-bfb9-7f622fbcbe91	930c1ff4-34fb-4d3c-8c1c-033360491dc4	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-11 23:07:23.418148	2026-04-11 23:07:23.145	\N
8ea15cef-c819-4e00-8ee9-8fefc18ff981	d06517e4-ac7a-4141-9d47-fc00647cda9c	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-20 09:27:38.895004	2026-04-20 09:27:38.206	\N
e69a0d2c-5272-429d-841b-cb2537bf41c2	d06517e4-ac7a-4141-9d47-fc00647cda9c	75169a5c-569c-4606-b643-12590ae16c6e	2026-04-20 09:27:54.589447	2026-04-20 09:27:53.9	\N
d99d28a7-1c9d-4258-8f1c-ff11ce283fa9	13a3282a-e043-4b1c-9164-950f0e08f22e	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:01:21.005904	2026-04-21 18:01:19.888	\N
45e1a59c-3978-45db-a472-ae7190a32877	13a3282a-e043-4b1c-9164-950f0e08f22e	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	2026-04-21 18:01:21.057649	2026-04-21 18:01:19.94	\N
20249b0c-059a-4a61-a5b4-f804d8752e89	13a3282a-e043-4b1c-9164-950f0e08f22e	f93fb85a-6356-49dc-8e11-7eed1e15de74	2026-04-21 18:01:21.101898	2026-04-21 18:01:19.98	\N
79b72712-5b25-4421-8628-825bbf34dc4d	13a3282a-e043-4b1c-9164-950f0e08f22e	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	2026-04-21 18:01:21.142562	2026-04-21 18:01:20.025	\N
5f452254-1f4e-42c3-903c-5ca5e56f5aab	699df82a-836e-440b-a48a-d3e0c1da4e81	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:01:21.223769	2026-04-21 18:01:20.105	\N
94e25939-c100-4578-8107-6857c709fcf0	699df82a-836e-440b-a48a-d3e0c1da4e81	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	2026-04-21 18:01:21.280025	2026-04-21 18:01:20.146	\N
75e94448-0484-4632-a108-057ac048bfc8	fa51b0d1-9096-4b0c-ba55-422761278cf9	f93fb85a-6356-49dc-8e11-7eed1e15de74	2026-04-21 18:01:21.360016	2026-04-21 18:01:20.242	\N
44f16648-fb6d-4c20-bdd3-ba001ecd1c23	fa51b0d1-9096-4b0c-ba55-422761278cf9	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	2026-04-21 18:01:21.399235	2026-04-21 18:01:20.282	\N
5624c53d-3a5e-4832-8fba-bae3cfbec45a	fb628941-0576-4ed5-9025-5217061759f8	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:27:31.736937	2026-04-21 18:27:30.598	\N
cc1749c0-2404-4632-a0d9-184de1bc803b	fb628941-0576-4ed5-9025-5217061759f8	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	2026-04-21 18:27:31.782803	2026-04-21 18:27:30.644	\N
970f3aa5-e012-4eab-a327-ecd5103b29eb	fb628941-0576-4ed5-9025-5217061759f8	f93fb85a-6356-49dc-8e11-7eed1e15de74	2026-04-21 18:27:31.822214	2026-04-21 18:27:30.684	\N
9678544b-a4af-47ec-80a8-3fe2744c8594	fb628941-0576-4ed5-9025-5217061759f8	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	2026-04-21 18:27:31.86139	2026-04-21 18:27:30.723	\N
035042b5-9d3c-47b2-9c7d-4e677119ae59	7b235ac7-0fca-4636-9106-72f0812d98d6	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-21 18:27:31.941245	2026-04-21 18:27:30.803	\N
a3447249-b501-4bc1-999d-a37ca109aea5	7b235ac7-0fca-4636-9106-72f0812d98d6	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	2026-04-21 18:27:31.980855	2026-04-21 18:27:30.842	\N
7a70d37c-c2d4-4933-89d7-9d962612df64	f4a05d74-6f66-43f6-aef8-b34552c68146	f93fb85a-6356-49dc-8e11-7eed1e15de74	2026-04-21 18:27:32.060056	2026-04-21 18:27:30.921	\N
179988bb-47fa-4fda-8315-2fe7a5448463	f4a05d74-6f66-43f6-aef8-b34552c68146	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	2026-04-21 18:27:32.099377	2026-04-21 18:27:30.961	\N
53ca025d-10a4-4ef8-a942-27a11c485207	d06517e4-ac7a-4141-9d47-fc00647cda9c	75169a5c-569c-4606-b643-12590ae16c6e	2026-04-23 00:43:24.786483	2026-04-23 00:43:24.786483	ad630bd3-7b5c-4f10-8408-9fc3668ee315
\.


--
-- Data for Name: group_role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_role_permissions (id, group_role_id, permission_id, created_at) FROM stdin;
a53bd696-5bfa-4de0-b4a8-4bac604ae5f1	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	15eecb4a-ce86-4c2b-b2a5-d8f7532b0a7b	2026-04-08 19:48:56.956966
9c3653d2-7972-4e68-9015-15c115a9f6b5	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	7f787527-ccaa-473d-bddc-7e647045f9f1	2026-04-08 19:48:56.956966
6d0a7500-b81d-4fe3-9811-08ad937edc1a	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	a3983ae1-6714-41bb-af0c-3ffdc01d054a	2026-04-08 19:48:56.956966
db75d3e4-e79e-4150-a2d6-a123cb5d42a9	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	3d9c445b-3cd7-4dbb-b91b-91a2e39acc53	2026-04-08 19:48:56.956966
9ab5439c-db3f-4629-8d85-49877d4ab172	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	ca1742dd-9c42-4268-b0ff-466b3ce374d2	2026-04-08 19:48:56.956966
85523969-7747-4b09-83da-2ef7a357d2c3	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	ea07b520-0ca7-402d-99bf-7c1b014aae50	2026-04-08 19:48:56.956966
d1a34349-0455-499b-94e7-718ebc03c7cd	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	64d8f417-c7b0-4afb-b348-26a2646c0cd2	2026-04-08 19:48:56.956966
2cefacc2-2947-441d-9fc7-2ef7d25be3af	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	b46cd244-0eb0-4d7c-a1b7-b90d7efc3ac0	2026-04-08 19:48:56.956966
2c5ced43-e904-416e-9bc0-f9806e604617	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	15b9ce3f-ef2c-47fc-92a8-b9b40ea7825c	2026-04-08 19:48:56.956966
c7b3b9db-813f-472c-8bd7-c34c72541d2a	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	598d1557-3a8e-4f85-9fcb-d369700cd421	2026-04-08 19:48:56.956966
15f69479-b6b0-4b6a-abf7-d45ef344c3ca	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	ad9ccfd7-796b-42ce-adb8-a5ab6ae8bec0	2026-04-08 19:48:56.956966
8719a838-373f-4a61-af02-84297340cf4b	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	4582fdca-0366-441f-b7a5-afb7e93e44af	2026-04-08 19:48:56.956966
19b6ae31-fda2-41b8-a1a8-7e5c6c2815d8	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	2fcda4ab-f710-4ada-bcb4-5fddc7adb7c4	2026-04-08 19:48:56.956966
9429f219-97db-4fd1-abd2-cd288d881c18	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	c938d566-44a3-456c-95a4-b765928d5e44	2026-04-08 19:48:56.956966
db578151-7e64-477a-bfab-706f567c1302	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	1c2b00d4-10a2-4218-aec0-599c039e4690	2026-04-08 19:48:56.956966
8606060c-7037-4f74-9ef5-e8f3650f4b28	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	4513d32c-1a47-4357-9497-d80e70052893	2026-04-08 19:48:56.956966
62be435e-cc2d-43bb-96e5-316b3d879dee	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	d8c7629e-5f17-48af-8848-b19073e3c0e4	2026-04-08 19:48:56.956966
4a9106d4-6b06-4df4-815e-2d7207b11ba9	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	f304962c-b813-4357-82b4-7d9d7e7c270f	2026-04-08 19:48:56.956966
063abfaf-a72b-4496-bf21-92f65beb6ea6	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	14365b60-7cf7-49e9-8762-f9de771192eb	2026-04-08 19:48:56.956966
207698f7-917e-4e91-9265-4ffcad53d286	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	a483c703-2642-40e3-85a8-f8e3bdbdd132	2026-04-08 19:48:56.956966
7cf677ae-6813-479a-a23e-1ad99bee86e0	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	5b1eb0b1-9695-41c5-9430-04a250afdc64	2026-04-08 19:48:56.956966
5de9d86f-bfbe-490e-a3d7-8b2cf5f81349	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	c880306e-cd9b-4f13-a38c-54c1e347f0b9	2026-04-08 19:48:56.956966
fa57b83d-1b43-454b-8ecd-52a563371049	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	83d682e9-a5c2-40bf-bf43-137e896ab244	2026-04-08 19:48:56.956966
b1c6842a-d0f6-4161-84a3-cfc9f71d03c5	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	a6c545f6-2187-4166-b669-e74b8cefb9dd	2026-04-08 19:48:56.956966
55f31838-a71c-4ccc-ae6f-babf77b423a5	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	76a09ddb-52a6-462f-a2da-b30a7d5c352e	2026-04-08 19:48:56.956966
be29b894-242f-4a1c-b39b-3b46ba37ddc0	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	42786ff7-f998-40b0-99aa-cd180bd1601d	2026-04-08 19:48:56.956966
cadb0803-5db5-48b9-9014-8204d9223549	cf8d8119-37c2-4b4f-beac-ed07f7418d6d	e3ba9516-8266-42fb-bcfd-4a4ad1a960b0	2026-04-08 19:48:56.956966
5377a29b-f8fc-461b-baf4-ae520f5bf8a2	77bc83da-d62c-4367-8727-2949b05b9eb4	15eecb4a-ce86-4c2b-b2a5-d8f7532b0a7b	2026-04-08 19:48:56.956966
7e1cd8d7-7b6f-48b7-bada-2bbfda1f865f	77bc83da-d62c-4367-8727-2949b05b9eb4	7f787527-ccaa-473d-bddc-7e647045f9f1	2026-04-08 19:48:56.956966
9fbd2ffb-7688-4f2e-b55c-376d923795f9	77bc83da-d62c-4367-8727-2949b05b9eb4	a3983ae1-6714-41bb-af0c-3ffdc01d054a	2026-04-08 19:48:56.956966
19e0fd5b-f29d-4c54-900f-d27410e78228	77bc83da-d62c-4367-8727-2949b05b9eb4	3d9c445b-3cd7-4dbb-b91b-91a2e39acc53	2026-04-08 19:48:56.956966
e5de6a37-3504-4611-84a9-56dcf9115d01	77bc83da-d62c-4367-8727-2949b05b9eb4	ca1742dd-9c42-4268-b0ff-466b3ce374d2	2026-04-08 19:48:56.956966
d72133d6-1d3c-4f2b-ac27-2e90ca07c4f7	77bc83da-d62c-4367-8727-2949b05b9eb4	ea07b520-0ca7-402d-99bf-7c1b014aae50	2026-04-08 19:48:56.956966
5559bf6d-c35c-4073-9fbd-c3a07ce6c114	77bc83da-d62c-4367-8727-2949b05b9eb4	64d8f417-c7b0-4afb-b348-26a2646c0cd2	2026-04-08 19:48:56.956966
1fc6f5df-4362-43c7-809c-a9663a7c0c73	77bc83da-d62c-4367-8727-2949b05b9eb4	b46cd244-0eb0-4d7c-a1b7-b90d7efc3ac0	2026-04-08 19:48:56.956966
847e5505-e47e-4d67-9173-7b12f15113be	77bc83da-d62c-4367-8727-2949b05b9eb4	15b9ce3f-ef2c-47fc-92a8-b9b40ea7825c	2026-04-08 19:48:56.956966
f13f018a-1ebe-4ae5-885b-594a768a1e1c	77bc83da-d62c-4367-8727-2949b05b9eb4	598d1557-3a8e-4f85-9fcb-d369700cd421	2026-04-08 19:48:56.956966
0ffe2871-1bfd-4b33-99bb-6988b909dbde	77bc83da-d62c-4367-8727-2949b05b9eb4	ad9ccfd7-796b-42ce-adb8-a5ab6ae8bec0	2026-04-08 19:48:56.956966
45f50859-3485-448e-804d-f8294ac6d0b9	77bc83da-d62c-4367-8727-2949b05b9eb4	4582fdca-0366-441f-b7a5-afb7e93e44af	2026-04-08 19:48:56.956966
1ff3cc4f-ffcf-4d8d-9551-a26078dd3b37	77bc83da-d62c-4367-8727-2949b05b9eb4	2fcda4ab-f710-4ada-bcb4-5fddc7adb7c4	2026-04-08 19:48:56.956966
adbbadd0-39d3-4b8a-82c0-6d484ad9c8d6	77bc83da-d62c-4367-8727-2949b05b9eb4	c938d566-44a3-456c-95a4-b765928d5e44	2026-04-08 19:48:56.956966
76836398-51f4-4dee-a45c-e0e483263ab0	77bc83da-d62c-4367-8727-2949b05b9eb4	1c2b00d4-10a2-4218-aec0-599c039e4690	2026-04-08 19:48:56.956966
6c219368-3560-45d5-994c-6c266b90806f	77bc83da-d62c-4367-8727-2949b05b9eb4	4513d32c-1a47-4357-9497-d80e70052893	2026-04-08 19:48:56.956966
829f147c-275a-4210-9a71-931d2449ca92	77bc83da-d62c-4367-8727-2949b05b9eb4	d8c7629e-5f17-48af-8848-b19073e3c0e4	2026-04-08 19:48:56.956966
7cd74984-f994-41a8-ba06-f3a06405e142	77bc83da-d62c-4367-8727-2949b05b9eb4	a483c703-2642-40e3-85a8-f8e3bdbdd132	2026-04-08 19:48:56.956966
c193f7a9-3b0c-41ae-a19e-4bdde7919b63	77bc83da-d62c-4367-8727-2949b05b9eb4	5b1eb0b1-9695-41c5-9430-04a250afdc64	2026-04-08 19:48:56.956966
6b1232b9-0bb3-41ee-82e3-4b59b80c69e5	77bc83da-d62c-4367-8727-2949b05b9eb4	c880306e-cd9b-4f13-a38c-54c1e347f0b9	2026-04-08 19:48:56.956966
a3237b9a-4427-4e78-86c8-b3724a523c3c	77bc83da-d62c-4367-8727-2949b05b9eb4	83d682e9-a5c2-40bf-bf43-137e896ab244	2026-04-08 19:48:56.956966
9cdf7766-3fae-488c-bfeb-4e66e4862420	77bc83da-d62c-4367-8727-2949b05b9eb4	a6c545f6-2187-4166-b669-e74b8cefb9dd	2026-04-08 19:48:56.956966
605e8e9e-cb77-4f87-8268-957d8e2fb3fc	77bc83da-d62c-4367-8727-2949b05b9eb4	76a09ddb-52a6-462f-a2da-b30a7d5c352e	2026-04-08 19:48:56.956966
2e1b05ea-3208-4813-b0b3-0ee6d443dc0a	77bc83da-d62c-4367-8727-2949b05b9eb4	42786ff7-f998-40b0-99aa-cd180bd1601d	2026-04-08 19:48:56.956966
08fef275-96c8-4f1d-bf3d-da8da324d6d2	77bc83da-d62c-4367-8727-2949b05b9eb4	e3ba9516-8266-42fb-bcfd-4a4ad1a960b0	2026-04-08 19:48:56.956966
de44e48b-1823-4c35-88e8-dec7a635e26e	ad630bd3-7b5c-4f10-8408-9fc3668ee315	a483c703-2642-40e3-85a8-f8e3bdbdd132	2026-04-08 19:48:56.956966
3f536e1a-7cca-41cf-bffb-23e3ebb8de1b	ad630bd3-7b5c-4f10-8408-9fc3668ee315	5b1eb0b1-9695-41c5-9430-04a250afdc64	2026-04-08 19:48:56.956966
67040c13-a39e-4c1f-af3d-fdf0cc82f9b7	ad630bd3-7b5c-4f10-8408-9fc3668ee315	c880306e-cd9b-4f13-a38c-54c1e347f0b9	2026-04-08 19:48:56.956966
f79c39d5-2bfb-4825-b918-379011e9df1b	ad630bd3-7b5c-4f10-8408-9fc3668ee315	a6c545f6-2187-4166-b669-e74b8cefb9dd	2026-04-08 19:48:56.956966
67f1f0dd-777b-40db-b11d-3ccf74f3c8f6	ad630bd3-7b5c-4f10-8408-9fc3668ee315	76a09ddb-52a6-462f-a2da-b30a7d5c352e	2026-04-08 19:48:56.956966
1479fd84-a0af-4f15-9496-96ae44808a45	ad630bd3-7b5c-4f10-8408-9fc3668ee315	42786ff7-f998-40b0-99aa-cd180bd1601d	2026-04-08 19:48:56.956966
7252f57f-05d1-4242-b835-e84a54a9b53b	45110a5f-62c0-4bfd-bf7f-62914be91660	1c2b00d4-10a2-4218-aec0-599c039e4690	2026-04-08 19:48:56.956966
d612546e-160b-4d2e-9cf2-b2fbbb5c3ca1	45110a5f-62c0-4bfd-bf7f-62914be91660	5b1eb0b1-9695-41c5-9430-04a250afdc64	2026-04-08 19:48:56.956966
67173e42-f54a-416a-9970-d4cd521817ed	45110a5f-62c0-4bfd-bf7f-62914be91660	76a09ddb-52a6-462f-a2da-b30a7d5c352e	2026-04-08 19:48:56.956966
\.


--
-- Data for Name: group_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_roles (id, name, description, created_at) FROM stdin;
cf8d8119-37c2-4b4f-beac-ed07f7418d6d	owner	Group creator - full control of group	2026-04-08 19:37:24.656941
77bc83da-d62c-4367-8727-2949b05b9eb4	admin	Group admin - invite/manage events	2026-04-08 19:37:24.656941
ad630bd3-7b5c-4f10-8408-9fc3668ee315	member	Group member - can participate and create events	2026-04-08 19:37:24.656941
45110a5f-62c0-4bfd-bf7f-62914be91660	viewer	Read-only access to group	2026-04-08 19:37:24.656941
\.


--
-- Data for Name: human_system_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.human_system_roles (id, human_id, system_role_id, assigned_by, assigned_at) FROM stdin;
4aee9cbe-6141-4c0f-8c2e-ca2bb724aa8b	10000001-0000-0000-0000-000000000001	aca45293-5169-46a9-80c1-f17ec1f0238f	\N	2026-04-08 21:05:00.811998
042da345-a7b3-4ce6-9c16-252ea9d387a3	10000002-0000-0000-0000-000000000002	e25a736f-91ba-4881-976d-c6fa1a85dd95	\N	2026-04-08 21:05:01.053415
1cc193fa-df72-48f2-a107-a5e1c4860f59	10000003-0000-0000-0000-000000000003	e25a736f-91ba-4881-976d-c6fa1a85dd95	\N	2026-04-08 21:05:01.245883
396798eb-fa7c-4147-8f03-b605dd8211ea	10000004-0000-0000-0000-000000000004	e25a736f-91ba-4881-976d-c6fa1a85dd95	\N	2026-04-08 21:05:01.438771
fb983245-2a20-4e4e-b73e-41d63c652aff	61994963-eb56-4d04-89af-8e1593a507ca	aca45293-5169-46a9-80c1-f17ec1f0238f	\N	2026-04-22 22:58:38.896509
\.


--
-- Data for Name: humans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.humans (id, first_name, last_name, dob, gender, phone, created_at, updated_at) FROM stdin;
c9a566f3-0415-43ec-8beb-ace776b39c6a	testuser		\N	\N	\N	2026-04-07 15:47:00.185263	2026-04-07 15:47:00.185263
6d916ed5-f539-4a51-9e17-044d81c956d2	johndoe		\N	\N	\N	2026-04-07 16:49:22.905167	2026-04-07 16:49:22.905167
10000001-0000-0000-0000-000000000001	Admin	User	\N	\N	\N	2026-04-08 21:05:00.550613	2026-04-08 21:05:00.550613
10000002-0000-0000-0000-000000000002	Regular	User	\N	\N	\N	2026-04-08 21:05:00.9401	2026-04-08 21:05:00.9401
10000003-0000-0000-0000-000000000003	Guest	Viewer	\N	\N	\N	2026-04-08 21:05:01.132749	2026-04-08 21:05:01.132749
10000004-0000-0000-0000-000000000004	Power	User	\N	\N	\N	2026-04-08 21:05:01.325387	2026-04-08 21:05:01.325387
61994963-eb56-4d04-89af-8e1593a507ca	sonny		\N	\N	\N	2026-04-11 23:07:23.170563	2026-04-11 23:07:23.170563
75169a5c-569c-4606-b643-12590ae16c6e	cathyd		\N	\N	\N	2026-04-20 08:56:35.586944	2026-04-20 08:56:35.586944
f0abac11-f1ab-4350-9840-bbc126bdc10d	Alice	Test	\N	\N	\N	2026-04-21 17:43:10.789029	2026-04-21 17:43:10.789029
83be5978-28bd-4be6-8f80-b0b59ac5fd2f	Charlie	Test	\N	\N	\N	2026-04-21 17:43:11.012339	2026-04-21 17:43:11.012339
f93fb85a-6356-49dc-8e11-7eed1e15de74	Frank	Test	\N	\N	\N	2026-04-21 17:43:11.173736	2026-04-21 17:43:11.173736
cdc6bb16-7730-4bc5-a9c1-626a08579fd3	Grace	Test	\N	\N	\N	2026-04-21 17:43:11.329891	2026-04-21 17:43:11.329891
05e1951d-d284-4275-b7bf-ee2e73430d01	testuser123		\N	\N	\N	2026-04-22 10:30:57.794465	2026-04-22 10:30:57.794465
4e99f1a7-107e-48a6-895e-677d1ad234ee	testverify2		\N	\N	\N	2026-04-22 11:44:27.211498	2026-04-22 11:44:27.211498
ab387893-b5a2-4bdf-8fe1-6d59d0fa5fc0	testuser		\N	\N	\N	2026-04-22 11:50:01.370489	2026-04-22 11:50:01.370489
d7176e8c-194c-4d11-bccb-a4125d2c5eee	testuser		\N	\N	\N	2026-04-22 11:50:01.375579	2026-04-22 11:50:01.375579
\.


--
-- Data for Name: pending_group_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_group_invitations (id, group_id, email, invited_by, status, invited_at, expires_at, accepted_at) FROM stdin;
5c4c6fb2-cd23-49a7-9da0-3b891b4ed86b	930c1ff4-34fb-4d3c-8c1c-033360491dc4	hilliards@gmail.com	6d916ed5-f539-4a51-9e17-044d81c956d2	accepted	2026-04-11 23:02:02.715999	2026-05-11 23:02:02.447	2026-04-11 23:07:23.231
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, permission_name, resource, action, description, is_active, created_at) FROM stdin;
15eecb4a-ce86-4c2b-b2a5-d8f7532b0a7b	users.manage	users	manage	\N	t	2026-04-06 20:56:00.631196
7f787527-ccaa-473d-bddc-7e647045f9f1	users.view	users	view	\N	t	2026-04-06 20:56:00.631196
a3983ae1-6714-41bb-af0c-3ffdc01d054a	events.create	events	create	\N	t	2026-04-06 20:56:00.631196
3d9c445b-3cd7-4dbb-b91b-91a2e39acc53	events.edit	events	edit	\N	t	2026-04-06 20:56:00.631196
ca1742dd-9c42-4268-b0ff-466b3ce374d2	events.delete	events	delete	\N	t	2026-04-06 20:56:00.631196
ea07b520-0ca7-402d-99bf-7c1b014aae50	events.view	events	view	\N	t	2026-04-06 20:56:00.631196
64d8f417-c7b0-4afb-b348-26a2646c0cd2	expenses.create	expenses	create	\N	t	2026-04-06 20:56:00.631196
b46cd244-0eb0-4d7c-a1b7-b90d7efc3ac0	expenses.edit	expenses	edit	\N	t	2026-04-06 20:56:00.631196
15b9ce3f-ef2c-47fc-92a8-b9b40ea7825c	expenses.delete	expenses	delete	\N	t	2026-04-06 20:56:00.631196
598d1557-3a8e-4f85-9fcb-d369700cd421	expenses.view	expenses	view	\N	t	2026-04-06 20:56:00.631196
ad9ccfd7-796b-42ce-adb8-a5ab6ae8bec0	groups.create	groups	create	\N	t	2026-04-06 20:56:00.631196
4582fdca-0366-441f-b7a5-afb7e93e44af	groups.manage	groups	manage	\N	t	2026-04-06 20:56:00.631196
2fcda4ab-f710-4ada-bcb4-5fddc7adb7c4	groups.view	groups	view	\N	t	2026-04-06 20:56:00.631196
c938d566-44a3-456c-95a4-b765928d5e44	group.create	group	create	Create a new group	t	2026-04-08 19:48:56.956966
1c2b00d4-10a2-4218-aec0-599c039e4690	group.read	group	read	View group details	t	2026-04-08 19:48:56.956966
4513d32c-1a47-4357-9497-d80e70052893	group.update	group	update	Edit group	t	2026-04-08 19:48:56.956966
d8c7629e-5f17-48af-8848-b19073e3c0e4	group.delete	group	delete	Delete group	t	2026-04-08 19:48:56.956966
f304962c-b813-4357-82b4-7d9d7e7c270f	group.member.invite	group.member	invite	Invite user to group	t	2026-04-08 19:48:56.956966
14365b60-7cf7-49e9-8762-f9de771192eb	group.member.remove	group.member	remove	Remove user from group	t	2026-04-08 19:48:56.956966
a483c703-2642-40e3-85a8-f8e3bdbdd132	event.create	event	create	Create event in group	t	2026-04-08 19:48:56.956966
5b1eb0b1-9695-41c5-9430-04a250afdc64	event.read	event	read	View event	t	2026-04-08 19:48:56.956966
c880306e-cd9b-4f13-a38c-54c1e347f0b9	event.update	event	update	Edit event	t	2026-04-08 19:48:56.956966
83d682e9-a5c2-40bf-bf43-137e896ab244	event.delete	event	delete	Delete event	t	2026-04-08 19:48:56.956966
a6c545f6-2187-4166-b669-e74b8cefb9dd	expense.create	expense	create	Add expense	t	2026-04-08 19:48:56.956966
76a09ddb-52a6-462f-a2da-b30a7d5c352e	expense.read	expense	read	View expense	t	2026-04-08 19:48:56.956966
42786ff7-f998-40b0-99aa-cd180bd1601d	expense.update	expense	update	Edit expense	t	2026-04-08 19:48:56.956966
e3ba9516-8266-42fb-bcfd-4a4ad1a960b0	user.manage	user	manage	Manage users (admin only)	t	2026-04-08 19:48:56.956966
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, expires_at) FROM stdin;
a606459d18bfc27c1578ec0b3e5ebf37be565a9939aa8d693e0aca628ce5c2ab	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-18 23:07:23.271
62739855e39fbd6d90e67726bc6f0818a3d151f281a49371b051607cf4d150bf	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-18 23:46:12.342
5d5f1256fba840542a3bae7a65bce568c97258dbb348bf4c23038a81e04e743e	f0abac11-f1ab-4350-9840-bbc126bdc10d	2026-04-28 17:44:15.71
5ec641cfd6f0772553298447daed67bdd75c32c50694f2101fa09690eb8babc6	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	2026-04-28 18:24:16.131
214480555854b00bbd4fff139e1a9bef9e91bc5f86abbfd140d3a7e64058b379	fa34343f-b5f4-40be-ad30-8aea673b5055	2026-04-29 11:05:39.983
f0370037-760a-40e2-a292-f8f41ad3097b	fa34343f-b5f4-40be-ad30-8aea673b5055	2026-04-29 11:18:51.052
1fa54e820f81e22d89099373ce733b8ad7adf68cd88f8110d963601bc8e7c9e8	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-29 22:54:06.137
78ac6f7891a03b0c40afcd779699d3bfab6ec631ea7d3344262c150df1dad9aa	61994963-eb56-4d04-89af-8e1593a507ca	2026-04-29 23:05:43.224
a9089637417ae3f42f1f646b3e756cef01e4af7f7cae014a4ee5047005c07386	75169a5c-569c-4606-b643-12590ae16c6e	2026-04-30 00:50:33.306
745131039f94556d123169dfb35065b1deaa21afccb2174660321afe7c301c64	75169a5c-569c-4606-b643-12590ae16c6e	2026-04-30 11:54:27.249
\.


--
-- Data for Name: settlements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settlements (id, event_id, group_id, from_user_id, to_user_id, amount, description, status, payment_method, created_at, completed_at, updated_at) FROM stdin;
6b30cd7f-1d15-44c3-bdf7-bc6674d31c43	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	\N	f93fb85a-6356-49dc-8e11-7eed1e15de74	f0abac11-f1ab-4350-9840-bbc126bdc10d	9850		pending	\N	2026-04-21 18:27:32.195	\N	2026-04-21 18:27:33.332855
d24cee90-83c6-4faf-ac44-464b4ddfb9c2	34dcad7a-6844-463f-b44c-9aadccd924cb	\N	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	f0abac11-f1ab-4350-9840-bbc126bdc10d	5750		pending	\N	2026-04-21 18:27:32.348	\N	2026-04-21 18:27:33.486167
a0a4552b-e40e-43d3-ad11-061870ee4c61	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	\N	83be5978-28bd-4be6-8f80-b0b59ac5fd2f	f0abac11-f1ab-4350-9840-bbc126bdc10d	450		completed	\N	2026-04-21 18:27:32.233	2026-04-21 18:34:07.173	2026-04-21 18:34:07.173
2cb7a3d3-a1d7-48d1-b797-0779b28358d4	d51ba5cf-3d3d-4609-9a6f-3fa03b80e64f	\N	cdc6bb16-7730-4bc5-a9c1-626a08579fd3	f0abac11-f1ab-4350-9840-bbc126bdc10d	14850		completed	\N	2026-04-21 18:27:32.148	2026-04-21 18:40:41.268	2026-04-21 18:40:41.268
\.


--
-- Data for Name: system_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_roles (id, name, description, created_at) FROM stdin;
aca45293-5169-46a9-80c1-f17ec1f0238f	admin	System administrator - full access to app and users	2026-04-08 19:37:24.565505
e25a736f-91ba-4881-976d-c6fa1a85dd95	user	Regular user - personal and group access	2026-04-08 19:37:24.565505
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password_hash, created_at, updated_at) FROM stdin;
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: email_history email_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_history
    ADD CONSTRAINT email_history_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_unique UNIQUE (token);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: expense_groups expense_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_groups
    ADD CONSTRAINT expense_groups_pkey PRIMARY KEY (id);


--
-- Name: expense_splits expense_splits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_splits
    ADD CONSTRAINT expense_splits_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_role_permissions group_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_role_permissions
    ADD CONSTRAINT group_role_permissions_pkey PRIMARY KEY (id);


--
-- Name: group_roles group_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_roles
    ADD CONSTRAINT group_roles_pkey PRIMARY KEY (id);


--
-- Name: human_system_roles human_system_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.human_system_roles
    ADD CONSTRAINT human_system_roles_pkey PRIMARY KEY (id);


--
-- Name: humans humans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.humans
    ADD CONSTRAINT humans_pkey PRIMARY KEY (id);


--
-- Name: pending_group_invitations pending_group_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_group_invitations
    ADD CONSTRAINT pending_group_invitations_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: system_roles system_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: customers_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_email_idx ON public.customers USING btree (email);


--
-- Name: customers_human_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_human_idx ON public.customers USING btree (human_id);


--
-- Name: customers_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_username_idx ON public.customers USING btree (username);


--
-- Name: customers_verified_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_verified_idx ON public.customers USING btree (email_verified);


--
-- Name: email_history_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_history_email_idx ON public.email_history USING btree (email);


--
-- Name: email_history_human_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_history_human_idx ON public.email_history USING btree (human_id);


--
-- Name: email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_idx ON public.users USING btree (email);


--
-- Name: email_tokens_customer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_tokens_customer_idx ON public.email_verification_tokens USING btree (customer_id);


--
-- Name: email_tokens_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_tokens_email_idx ON public.email_verification_tokens USING btree (email);


--
-- Name: email_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_tokens_expires_at_idx ON public.email_verification_tokens USING btree (expires_at);


--
-- Name: email_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_tokens_token_idx ON public.email_verification_tokens USING btree (token);


--
-- Name: group_members_group_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX group_members_group_user_idx ON public.group_members USING btree (group_id, user_id);


--
-- Name: groups_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX groups_created_by_idx ON public.expense_groups USING btree (created_by);


--
-- Name: humans_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX humans_name_idx ON public.humans USING btree (first_name, last_name);


--
-- Name: idx_activities_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_event_id ON public.activities USING btree (event_id);


--
-- Name: idx_activities_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_start_time ON public.activities USING btree (start_time);


--
-- Name: idx_events_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_start_time ON public.events USING btree (start_time);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_human_system_roles_human_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_human_system_roles_human_id ON public.human_system_roles USING btree (human_id);


--
-- Name: idx_human_system_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_human_system_roles_role_id ON public.human_system_roles USING btree (system_role_id);


--
-- Name: pending_invitations_group_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_invitations_group_email_idx ON public.pending_group_invitations USING btree (group_id, email);


--
-- Name: pending_invitations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_invitations_status_idx ON public.pending_group_invitations USING btree (status);


--
-- Name: sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: settlements_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlements_created_at_idx ON public.settlements USING btree (created_at);


--
-- Name: settlements_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlements_event_idx ON public.settlements USING btree (event_id);


--
-- Name: settlements_from_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlements_from_user_idx ON public.settlements USING btree (from_user_id);


--
-- Name: settlements_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlements_status_idx ON public.settlements USING btree (status);


--
-- Name: settlements_to_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlements_to_user_idx ON public.settlements USING btree (to_user_id);


--
-- Name: splits_expense_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX splits_expense_idx ON public.expense_splits USING btree (expense_id);


--
-- Name: splits_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX splits_user_idx ON public.expense_splits USING btree (user_id);


--
-- Name: events_summary_for_analysis _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.events_summary_for_analysis AS
 SELECT ev.id AS event_id,
    ev.title AS event_name,
    ev.type AS event_type,
    ev.status,
    ev.currency,
    (ev.start_time)::date AS start_date,
    (ev.end_time)::date AS end_date,
    (ev.end_time - ev.start_time) AS duration_days,
    count(DISTINCT e.id) AS total_expenses,
    round(((sum((e.amount + e.tip_amount)))::numeric / 100.0), 2) AS total_spending_dollars,
    round((avg((e.amount + e.tip_amount)) / 100.0), 2) AS avg_expense_dollars,
    count(DISTINCT e.paid_by) AS unique_payers
   FROM (public.events ev
     LEFT JOIN public.expenses e ON ((ev.id = e.event_id)))
  GROUP BY ev.id, ev.title, ev.type, ev.status, ev.currency, ev.start_time, ev.end_time
  ORDER BY ev.created_at DESC;


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: settlements settlements_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: settlements settlements_from_user_id_humans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_from_user_id_humans_id_fk FOREIGN KEY (from_user_id) REFERENCES public.humans(id) ON DELETE RESTRICT;


--
-- Name: settlements settlements_group_id_expense_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_group_id_expense_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.expense_groups(id) ON DELETE SET NULL;


--
-- Name: settlements settlements_to_user_id_humans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_to_user_id_humans_id_fk FOREIGN KEY (to_user_id) REFERENCES public.humans(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict dJmkU3y0jYjITbHg1yaKQny8cMaLUNwppchnC7naAOnG8hbOBmJcaXJ1Edc5bU2

