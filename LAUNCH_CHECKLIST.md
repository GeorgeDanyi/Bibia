## Go-live checklist (Bibia search)

- [ ] Enable auth-gate on "Najít terapeuty" (feature flag + middleware)
- [ ] Privacy copy present on results page and API privacy footer link
- [ ] Rate limiting on `/api/searchTherapists` (per-IP burst + sliding window)
- [ ] Error states covered (network, 5xx) with actionable CTAs
- [ ] Empty results state with relax options (online, radius)
- [ ] Observability dashboards
  - [ ] API p95 latency (<200 ms)
  - [ ] Error rate (<1%)
  - [ ] Fallback usage rate
  - [ ] Results distribution (scores bands)
  - [ ] Top queries coverage
- [ ] Telemetry funnels wired (search_started → results_count → result_opened → contact)
- [ ] Accessibility quick scan (contrast, keyboard, landmarks)
- [ ] SEO: noindex on results (if behind auth), metadata sane
- [ ] Security headers and CORS check

Owners: Eng: ___, PM: ___, Design: ___


