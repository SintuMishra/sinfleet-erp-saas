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
- Layouts must fit MacBook Air, standard laptop, tablet, and mobile widths without horizontal page overflow.
- Dense list/form workspaces should stack on laptop widths and only move side-by-side on very wide screens.

## Components

- `AppShell`: public/demo shell.
- `CompanyShell`: company workspace shell with sidebar and topbar.
- `AdminShell`: Super Admin workspace shell.
- `PageHeader`: consistent page heading with optional icon/actions.
- `StatCard`: premium metric card.
- `StatusBadge`: status display for operational states.
- `EmptyState`: helpful empty/loading surface.
- `DataTable`: premium table/list container.
- `ResponsiveContainer`: page-level responsive wrapper for stabilized app pages.
- `ResponsiveTable`: horizontal-scroll wrapper for true data tables.
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
- True data tables should sit inside a horizontal scroll wrapper, never force page-level horizontal overflow.
- Filter bars should wrap into 1-2 columns on mobile/tablet and avoid five-column layouts until wide desktop.
- Repeated record rows must use `min-w-0`, wrapping, and responsive grids so long names, routes, amounts, and export buttons stay inside cards.
- Sidebars and drawer menus should scroll independently when the nav is taller than the viewport.
- Sticky headers should not assume fixed height; allow wrapping on small widths.
- Loading and empty states should be explicit and reassuring, not blank panels.
- Repeated rows should use `premium-record` treatment for hover lift and scanability.
- Filters should use consistent rounded-xl controls and clear labels/placeholders.
- Export buttons should sit near the report or record they download, show a loading label while active, and remain wrapped inside their header/filter container.
- Audit trail screens should use compact tables inside `ResponsiveTable`, clear action badges, readable timestamps, and concise metadata previews.
- Demo-facing pages should avoid blank panels: use explicit loading, empty, and error states even when the backend is still warming up.

## Screenshot Placeholders

When seeded data is available, capture:

- Landing page.
- Company login.
- Company dashboard.
- Vehicles, trips, payments, and reports pages.
- Audit logs pages.
- Super Admin dashboard and companies page.
