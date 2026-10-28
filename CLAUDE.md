# Notes for working on this repo

## Pop-ups

Every pop-up, banner or dialog that shows promotional or explanatory text to
visitors is managed from `/admin/popups`. When you add one:

1. Register it in `BUILTIN_POPUPS` in `src/lib/popups.ts`: an `id`, a `name`,
   a one-line `where`, `canTurnOff` (false only if switching it off would break
   buying or signing in), and every line of text it shows as a field with its
   default.
2. In the component, read the words with `usePopup(id)` from
   `src/lib/popups.client.ts` (`p.t("key", vars)`, `p.list("key")` for
   one-per-line lists), and render nothing while `!p.ready || !p.enabled`.
3. If it can appear on its own (not opened by a click), check `popupOnScreen()`
   from `src/app/_components/PopupView.tsx` first, so two never stack.

`/admin/popups` lists the registry, so a registered pop-up appears there with
nothing else to do. Card-style pop-ups should render through `PopupView`, which
gives them the four designs admin can choose between.
