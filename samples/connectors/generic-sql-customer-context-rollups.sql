create table if not exists customer_context_rollups (
    tenant_slug text not null,
    external_user_id text not null,
    observed_at_utc timestamptz not null,
    plan_interest_signal text not null,
    active_days_30 integer not null,
    pricing_page_visits_30 integer not null,
    open_support_tickets_30 integer not null,
    recommended_sales_motion_signal text not null,
    primary key (tenant_slug, external_user_id)
);

insert into customer_context_rollups (
    tenant_slug,
    external_user_id,
    observed_at_utc,
    plan_interest_signal,
    active_days_30,
    pricing_page_visits_30,
    open_support_tickets_30,
    recommended_sales_motion_signal
) values (
    'demo',
    '123',
    '2026-05-09T11:45:00Z',
    'enterprise',
    24,
    7,
    1,
    'sales-assisted expansion'
) on conflict (tenant_slug, external_user_id) do update set
    observed_at_utc = excluded.observed_at_utc,
    plan_interest_signal = excluded.plan_interest_signal,
    active_days_30 = excluded.active_days_30,
    pricing_page_visits_30 = excluded.pricing_page_visits_30,
    open_support_tickets_30 = excluded.open_support_tickets_30,
    recommended_sales_motion_signal = excluded.recommended_sales_motion_signal;
