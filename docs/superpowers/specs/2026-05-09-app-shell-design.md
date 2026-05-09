# App Shell — Design Spec
**Date:** 2026-05-09  
**Status:** Approved

## Problem

The authenticated `/app` area has no layout wrapper. Every route renders in isolation with no navigation between pages. Users cannot navigate from the dashboard to CVs or billing without manually changing the URL. The editor's SCSS also has a broken selector mismatch.

## Solution

Add an `AppShellComponent` as a route-level layout wrapper for all authenticated pages except the editor. The editor gets its own minimal full-screen header.

---

## Architecture

### New component
`frontend/src/app/shared/components/app-shell/app-shell.component.ts` (+ `.html`, `.scss`, `.spec.ts`)

- Selector: `lba-app-shell`
- Standalone, `ChangeDetectionStrategy.OnPush`
- Imports: `RouterOutlet`, `RouterLink`, `RouterLinkActive`
- Injects: `AuthService`, `Router`
- Template: top nav bar + `<router-outlet />`

### Route changes (`app.routes.ts`)

**Before:**
```ts
{
  path: 'app',
  canActivate: [authGuard],
  children: [
    { path: '', component: DashboardComponent },
    { path: 'cvs', component: MasterCvsComponent },
    { path: 'applications/:id', component: EditorComponent },
    { path: 'billing', component: BillingComponent },
    { path: 'wizard', component: WizardComponent },
  ]
}
```

**After:**
```ts
{
  path: 'app',
  canActivate: [authGuard],
  children: [
    {
      path: '',
      component: AppShellComponent,      // layout wrapper with <router-outlet>
      children: [
        { path: '', loadComponent: () => DashboardComponent },
        { path: 'cvs', loadComponent: () => MasterCvsComponent },
        { path: 'billing', loadComponent: () => BillingComponent },
        { path: 'wizard', loadComponent: () => WizardComponent },
      ]
    },
    // Editor is a sibling — full-screen, no shell
    { path: 'applications/:id', loadComponent: () => EditorComponent },
  ]
}
```

---

## Top Nav Layout

```
[ Lebenslauf-Agent ]  [ Dashboard ]  [ Lebensläufe ]  [ Abrechnung ]     [ Free badge ]  [ Hans ]  [ Abmelden ]
```

- Height: 52px, `background: var(--bg-2)`, `border-bottom: 1px solid`
- Logo: plain text, links to `/app`
- Nav links: `routerLink` + `routerLinkActive="is-active"` for highlight
- Right side: plan badge (colour-coded: Free=green, Pay=blue, Pro=purple), user name from `AuthService.user()`, logout button
- Logout: calls `auth.logout()` then `router.navigate(['/'])`

---

## Editor Full-Screen Header

The `EditorComponent` renders its own slim 44px header with:
- Back link (`← Zurück`) to `/app`
- Job title (from application data)
- PDF download + "Als gesendet markieren" buttons on the right

No `AppShellComponent` wraps the editor.

---

## Bug Fix: master-cvs SCSS mismatch

`master-cvs.component.html` uses class `master-cvs__header` but `master-cvs.component.scss` defines `.page-header`. Fix: rename `.page-header` → `.master-cvs__header` in the SCSS file.

---

## Files to create
- `frontend/src/app/shared/components/app-shell/app-shell.component.ts`
- `frontend/src/app/shared/components/app-shell/app-shell.component.html`
- `frontend/src/app/shared/components/app-shell/app-shell.component.scss`
- `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts`

## Files to modify
- `frontend/src/app/app.routes.ts` — add shell wrapper, move editor to sibling route
- `frontend/src/app/features/master-cvs/master-cvs.component.scss` — fix `.page-header` → `.master-cvs__header`

---

## Testing

**AppShellComponent spec:**
- Renders nav links for Dashboard, Lebensläufe, Abrechnung
- Logout button calls `AuthService.logout()` and navigates to `/`
- User name from `AuthService.user()` is displayed
- Plan badge renders with correct text

**No regression:**
- Editor route still loads at `/app/applications/:id`
- `authGuard` still protects both the shell and the editor route
