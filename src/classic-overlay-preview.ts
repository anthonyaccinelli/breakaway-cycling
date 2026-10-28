/** Classic design-system overlay only. Survival and Cycle Quest untouched. */
export const CLASSIC_DESIGN_OVERLAY_CSS=String.raw`
body.classic-design-overlay {
 --dp-color-ground:#fcfcfd;--dp-color-panel:#fff;--dp-color-rule:#dde0e6;
 --dp-color-ink:#16191f;--dp-color-ink-secondary:#454c58;
 --dp-color-accent:#074ce0;--dp-color-field:#16191f;
 background:#fcfcfd!important;color:#16191f!important;
 font-family:"Instrument Sans",sans-serif!important;
}
body.classic-design-overlay #overlayContent:not(.survive-overlay) {
 background:#fcfcfd!important;color:#16191f!important;
}
body.classic-design-overlay #overlayTop strong {
 color:#16191f!important;font:750 11px/1 "Host Grotesk",sans-serif!important;
 letter-spacing:-.025em!important;
}
body.classic-design-overlay #overlayLabel{
 color:#454c58!important;font:500 10px/1.15 "Instrument Sans",sans-serif!important;
}
body.classic-design-overlay #overlayActions button,
body.classic-design-overlay #overlayZoomControls button {
 background:#f3f4f6!important;color:#16191f!important;
 border:1px solid #dde0e6!important;border-radius:6px!important;
 box-shadow:none!important;font:650 10px/1.1 "Instrument Sans",sans-serif!important;
}
body.classic-design-overlay #overlayActions button:hover{
 background:#eaf0ff!important;color:#074ce0!important;
}
body.classic-design-overlay #overlayZoomControls button.active{
 background:#074ce0!important;color:#fff!important;border-color:#074ce0!important;
}
body.classic-design-overlay #overlayContent:not(.survive-overlay) .tile{
 background:#fff!important;border:1px solid #dde0e6!important;
 border-radius:8px!important;box-shadow:0 2px 6px #16191f0c!important;
 color:#16191f!important;
}
body.classic-design-overlay #overlayContent:not(.survive-overlay) .tile b{
 color:#16191f!important;font-family:"Host Grotesk",sans-serif!important;
 font-weight:750!important;letter-spacing:-.035em!important;
}
body.classic-design-overlay #overlayContent:not(.survive-overlay) .tile small{
 color:#454c58!important;font-family:"Instrument Sans",sans-serif!important;
 font-weight:600!important;
}
body.classic-design-overlay #overlayChart{
 background:#16191f!important;border:1px solid #2e343e!important;
 border-radius:9px!important;
}
body.classic-design-overlay #overlayChart svg{
 background:#16191f!important;
}
body.classic-design-overlay .overlay-profile-grade {
 background:#fff!important;color:#16191f!important;
 border:2px solid #074ce0!important;border-radius:6px!important;
 box-shadow:0 2px 7px #16191f20!important;text-shadow:none!important;
}
body.classic-design-overlay .overlay-profile-grade .climb-hud-details{
 color:#454c58!important;text-shadow:none!important;
 font-family:"Instrument Sans",sans-serif!important;
}
body.classic-design-overlay #overlaySettings{
 background:#fff!important;color:#16191f!important;
 border:1px solid #dde0e6!important;border-radius:9px!important;
 box-shadow:0 8px 20px #16191f22!important;
}
/* Cycle Quest compact window proportions: 170px height × 80% available
   screen width (600–1600px). Keep the full original real telemetry layout:
   compact side readouts and a wide center elevation profile. */
body.classic-design-overlay:not(.expanded){
 padding:5px 9px 7px!important;
 overflow:hidden!important;
}
body.classic-design-overlay:not(.expanded) #overlayContent:not(.survive-overlay){
 display:grid!important;
 grid-template-columns:repeat(2,minmax(0,12%)) minmax(0,1fr) repeat(2,minmax(0,12%))!important;
 grid-template-rows:19px repeat(2,minmax(0,1fr))!important;
 gap:4px 7px!important;
 height:100%!important;
 min-height:0!important;
}
body.classic-design-overlay:not(.expanded) #overlayTop{
 grid-row:1!important;grid-column:1 / -1!important;
 display:flex!important;align-items:center!important;
 gap:8px!important;white-space:nowrap!important;
 min-width:0!important;
}
body.classic-design-overlay:not(.expanded) #overlayTop strong{
 flex:none!important;font-size:11px!important;
}
body.classic-design-overlay:not(.expanded) #overlayLabel{
 flex:1 1 auto!important;min-width:0!important;
 overflow:hidden!important;text-overflow:ellipsis!important;
 font-size:10px!important;
}
body.classic-design-overlay:not(.expanded) #overlayActions{
 gap:4px!important;flex:0 0 auto!important;
}
body.classic-design-overlay:not(.expanded) #overlayActions button{
 min-height:20px!important;padding:2px 5px!important;
 font-size:10px!important;line-height:1!important;
}
body.classic-design-overlay:not(.expanded) #overlayMetrics{
 display:contents!important;
}
body.classic-design-overlay:not(.expanded) #overlayContent:not(.survive-overlay) .tile{
 gap:2px!important;padding:3px 4px!important;
 min-height:0!important;min-width:0!important;
 align-items:center!important;justify-content:center!important;
 overflow:hidden!important;
}
body.classic-design-overlay:not(.expanded) #overlayContent:not(.survive-overlay) .tile b{
 font:750 clamp(13px,1.7vw,23px)/1.05 "Host Grotesk",sans-serif!important;
 letter-spacing:-.04em!important;max-width:100%!important;
 overflow:hidden!important;text-overflow:clip!important;
 font-variant-numeric:tabular-nums!important;white-space:nowrap!important;
}
body.classic-design-overlay:not(.expanded) #overlayContent:not(.survive-overlay) .tile small{
 font:600 clamp(9px,.75vw,11px)/1.1 "Instrument Sans",sans-serif!important;
 max-width:100%!important;
 white-space:nowrap!important;overflow:hidden!important;
 text-overflow:ellipsis!important;
}
body.classic-design-overlay:not(.expanded) #overlayContent:not(.survive-overlay) .tile[data-metric-key="elapsedTime"] b{
 font-size:clamp(12px,1.45vw,22px)!important;
}
body.classic-design-overlay:not(.expanded) #overlayChart{
 grid-column:3!important;grid-row:2 / span 2!important;
 min-width:0!important;min-height:0!important;
 overflow:hidden!important;position:relative!important;
 border-radius:8px!important;
}
body.classic-design-overlay:not(.expanded) #overlayChart .overlay-profile-graphic{
 width:100%!important;height:100%!important;min-height:0!important;
}
body.classic-design-overlay:not(.expanded) #overlayChart svg{
 width:100%!important;height:100%!important;display:block!important;
}
body.classic-design-overlay:not(.expanded) #overlayChart .overlay-profile-grade{
 top:6px!important;left:7px!important;
 padding:3px 5px!important;
 border:1px solid #074ce0!important;
 background:#fff!important;color:#16191f!important;
 border-radius:5px!important;box-shadow:none!important;
 font:750 clamp(12px,1.35vw,21px)/1.05 "Host Grotesk",sans-serif!important;
 letter-spacing:-.035em!important;
 max-width:calc(100% - 14px)!important;
}
body.classic-design-overlay:not(.expanded) #overlayChart .overlay-profile-grade .climb-hud-details{
 font:500 10px/1.1 "Instrument Sans",sans-serif!important;
 color:#454c58!important;
}
body.classic-design-overlay:not(.expanded) #overlayChart .overlay-profile-graphic{
 background:#16191f!important;
}
@media(max-width:740px){
 body.classic-design-overlay:not(.expanded) #overlayActions{gap:2px!important}
 body.classic-design-overlay:not(.expanded) #overlayActions button{padding:2px 4px!important;font-size:9px!important}
 body.classic-design-overlay:not(.expanded) #overlayLabel{font-size:9px!important}
 body.classic-design-overlay:not(.expanded) #overlayTop strong{font-size:10px!important}
}

body.classic-design-overlay #overlayOpacity{accent-color:#074ce0!important}
body.classic-design-overlay button:focus-visible{
 outline:2px solid #074ce0!important;outline-offset:2px!important;
}
@media(prefers-reduced-motion:reduce){
 body.classic-design-overlay *{transition:none!important;animation:none!important}
}`;
