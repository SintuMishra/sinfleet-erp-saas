# UI Guidelines

## Visual Direction

SinFleet ERP uses a premium dark navy/slate SaaS shell with white glass content surfaces and cyan/blue accents.

## Core Principles

- Keep transport workflows simple and readable.
- Use large tap targets for mobile and field teams.
- Prefer cards for repeated records and dashboard metrics.
- Use clear operational labels: Total Income, Diesel Cost, Other Expense, Pending Payment, Net Profit.
- Keep labels Hindi/English-ready and avoid overly technical wording.
- Preserve consistent spacing, rounded 2xl surfaces, soft shadows, and professional contrast.
- Keep business forms close to the list they affect so non-technical operators can enter data quickly.
- Use calm SaaS surfaces: white/glass content, slate text, cyan/blue action accents, and restrained semantic colors for risk/profit/status.
- Sidebar navigation must work on mobile through a drawer and show a clear active state.

## Components

- `AppShell`: public/demo shell.
- `CompanyShell`: company workspace shell with sidebar and topbar.
- `AdminShell`: Super Admin workspace shell.
- `PageHeader`: consistent page heading with optional icon/actions.
- `StatCard`: premium metric card.
- `StatusBadge`: status display for operational states.
- `EmptyState`: helpful empty/loading surface.
- `DataTable`: premium table/list container.
- `FilterBar`: reusable filter surface.
- `FormSection`: grouped form surface.
- `ConfirmDialog`: destructive action confirmation modal for soft-delete flows.
- `LanguageToggle`: English/Hindi placeholder.

## Page Rules

- Dashboard pages should lead with the most important metrics.
- Forms should stay close to lists for fast data entry.
- Financial pages should show income, received, pending, cost, and profit clearly.
- Report pages should remain table/card based until chart and export modules are added.
- Mobile views should stack naturally without horizontal scrolling except for true data tables.
- Loading and empty states should be explicit and reassuring, not blank panels.
- Repeated rows should use `premium-record` treatment for hover lift and scanability.
- Filters should use consistent rounded-xl controls and clear labels/placeholders.

## Screenshot Placeholders

When seeded data is available, capture:

- Landing page.
- Company login.
- Company dashboard.
- Vehicles, trips, payments, and reports pages.
- Super Admin dashboard and companies page.
