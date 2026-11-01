/** Approved SPOKEMON overlay: 170px compact skin.
 * Scoped to Pedalkin, leaves Classic, Survival and Cycle Quest unchanged.
 * Tiles are real data from Breakaway's existing overlay telemetry bridge.
 */
export const PEDALKIN_OVERLAY_CSS=String.raw`
body.pedalkin-overlay-theme{
 --pk-deep:#0f292f;--pk-panel:#10343b;--pk-teal:#21484e;
 --pk-peach:#fbc5ab;--pk-cream:#f9ebcb;--pk-leaf:#78b59a;
 padding:4px 7px 6px!important;
 background:var(--pk-deep)!important;color:var(--pk-cream)!important;
 font-family:Georgia,"Courier New",serif!important;
}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent{
 position:relative!important;height:100%!important;min-height:0!important;
 display:grid!important;grid-template-columns:minmax(0,12.5%) minmax(0,12.5%) minmax(0,1fr) minmax(0,13.6%) minmax(0,13.6%)!important;
 grid-template-rows:27px repeat(2,minmax(0,1fr))!important;
 gap:5px 6px!important;border:2px solid var(--pk-peach)!important;
 border-radius:14px!important;padding:4px 6px!important;background:linear-gradient(115deg,#0f292f,#10373c 53%,#0f292f)!important;
 box-shadow:none!important;overflow:hidden!important;
}
body.pedalkin-overlay-theme #overlayTop{
 display:flex!important;grid-column:1 / -1!important;grid-row:1!important;
 min-width:0!important;align-items:center!important;
 justify-content:space-between!important;gap:7px!important;
 border-bottom:1px solid var(--pk-peach)!important;padding:0 3px 3px!important;
}
body.pedalkin-overlay-theme #overlayTop strong{
 flex:1 1 0!important;min-width:0!important;
 color:var(--pk-cream)!important;font:900 clamp(10px,1.2vw,16px)/1.1 Georgia,serif!important;
 letter-spacing:.2px!important;white-space:nowrap!important;
 overflow:hidden!important;text-overflow:ellipsis!important;
}
body.pedalkin-overlay-theme #overlayLabel{
 flex:0 1 auto!important;max-width:32%!important;min-width:0!important;
 color:var(--pk-cream)!important;border:2px solid var(--pk-leaf)!important;
 border-radius:24px!important;padding:3px 10px!important;
 font:800 clamp(8px,.85vw,12px)/1 Georgia,serif!important;
 text-align:center!important;white-space:nowrap!important;
 overflow:hidden!important;text-overflow:ellipsis!important;
 letter-spacing:.4px!important;
}
body.pedalkin-overlay-theme #overlayActions{
 flex:1 1 0!important;display:flex!important;justify-content:flex-end!important;
 align-items:center!important;gap:4px!important;min-width:0!important;
}
body.pedalkin-overlay-theme #overlayActions button{
 background:var(--pk-teal)!important;color:var(--pk-cream)!important;
 border:1.5px solid var(--pk-peach)!important;border-radius:6px!important;
 padding:2px 5px!important;min-height:21px!important;min-width:24px!important;
 font:900 clamp(9px,.73vw,11px)/1 Georgia,serif!important;
 box-shadow:none!important;white-space:nowrap!important;cursor:pointer!important;
}
body.pedalkin-overlay-theme #overlayActions button:hover{
 background:#366464!important;color:white!important;
}
body.pedalkin-overlay-theme #overlayZoomControls{display:flex!important;gap:3px!important}
body.pedalkin-overlay-theme #overlayZoomControls button.active{
 background:var(--pk-peach)!important;color:var(--pk-deep)!important;
 border-color:var(--pk-peach)!important;
}
body.pedalkin-overlay-theme #overlaySettings{
 background:var(--pk-deep)!important;color:var(--pk-cream)!important;
 border:2px solid var(--pk-peach)!important;border-radius:8px!important;
}
body.pedalkin-overlay-theme #overlayOpacity{accent-color:var(--pk-peach)!important}
body.pedalkin-overlay-theme #overlayMetrics{display:contents!important}
body.pedalkin-overlay-theme #overlayContent .tile{
 min-width:0!important;min-height:0!important;display:flex!important;
 flex-direction:column-reverse!important;align-items:flex-start!important;
 justify-content:center!important;gap:2px!important;
 background:var(--pk-panel)!important;color:var(--pk-cream)!important;
 border:2px solid var(--pk-peach)!important;border-radius:11px!important;
 padding:2px 7px!important;overflow:hidden!important;cursor:default!important;
 box-shadow:none!important;
}
body.pedalkin-overlay-theme #overlayContent .tile::after{
 content:"";display:block!important;height:5px!important;min-height:5px!important;
 width:100%!important;border-radius:6px!important;flex:0 0 auto!important;
 background:linear-gradient(90deg,#83bea2 0 68%,#f7ebcc 68% 100%)!important;
 order:-1!important;
}
body.pedalkin-overlay-theme #overlayContent .tile[data-metric-key="elapsedTime"]::after{
 background:linear-gradient(90deg,#ec827d 0 57%,#8fbb9d 57% 100%)!important;
}
body.pedalkin-overlay-theme #overlayContent .tile[data-metric-key="distance"]::after{
 background:linear-gradient(90deg,#fbd37c 0 14%,#82ba9d 14% 100%)!important;
}
body.pedalkin-overlay-theme #overlayContent .tile[data-metric-key="heartRate"]::after{
 background:linear-gradient(90deg,#ed7776 0 66%,#8cbea4 66% 100%)!important;
}
body.pedalkin-overlay-theme #overlayContent .tile small{
 color:var(--pk-cream)!important;font:800 clamp(8px,.75vw,11px)/1 Georgia,serif!important;
 text-transform:uppercase!important;letter-spacing:.1px!important;
 white-space:nowrap!important;max-width:100%!important;
}
body.pedalkin-overlay-theme #overlayContent .tile b{
 color:var(--pk-cream)!important;
 font:900 clamp(13px,1.9vw,29px)/1 Georgia,serif!important;
 font-variant-numeric:tabular-nums!important;letter-spacing:0!important;
 white-space:nowrap!important;max-width:100%!important;
}
body.pedalkin-overlay-theme #overlayContent .tile[data-metric-key="elapsedTime"] b{
 font-size:clamp(12px,1.55vw,22px)!important;
}
body.pedalkin-overlay-theme #overlayContent .tile[data-metric-key="heartRate"] b{
 color:var(--pk-cream)!important;
}
body.pedalkin-overlay-theme #overlayChart{
 display:block!important;grid-column:3!important;grid-row:2 / span 2!important;
 min-width:0!important;min-height:0!important;position:relative!important;
 background:#10373c!important;border:2px solid var(--pk-peach)!important;
 border-radius:11px!important;overflow:hidden!important;
}
body.pedalkin-overlay-theme #overlayChart .overlay-profile-graphic{
 width:100%!important;height:100%!important;min-height:0!important;
 background:linear-gradient(180deg,#0f3037,#184b4e)!important;
}
body.pedalkin-overlay-theme #overlayChart svg{
 width:100%!important;height:100%!important;display:block!important;
}
body.pedalkin-overlay-theme #overlayChart .overlay-profile-grade{
 position:absolute!important;top:6px!important;
 border:2px solid var(--pk-peach)!important;border-radius:7px!important;
 padding:2px 6px!important;background:var(--pk-deep)!important;
 color:var(--pk-cream)!important;text-shadow:none!important;
 font:900 clamp(11px,1.35vw,19px)/1 Georgia,serif!important;
 letter-spacing:0!important;box-shadow:none!important;pointer-events:none!important;
 max-width:76px!important;
}
body.pedalkin-overlay-theme #overlayChart .overlay-profile-grade .climb-hud-details{display:none!important}
body.pedalkin-overlay-theme button:focus-visible{
 outline:2px solid #fff0ce!important;outline-offset:1px!important;
}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile[data-metric-key="gear"]{grid-column:1!important;grid-row:2!important}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile[data-metric-key="speed"]{grid-column:2!important;grid-row:2!important}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile[data-metric-key="elapsedTime"]{grid-column:1!important;grid-row:3!important}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile[data-metric-key="cadence"]{grid-column:2!important;grid-row:3!important}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile[data-metric-key="distance"]{grid-column:4 / span 2!important;grid-row:2!important}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile[data-metric-key="heartRate"]{grid-column:4 / span 2!important;grid-row:3!important}
body.pedalkin-overlay-theme:not(.expanded) #overlayContent .tile:not([data-metric-key="gear"]):not([data-metric-key="speed"]):not([data-metric-key="elapsedTime"]):not([data-metric-key="cadence"]):not([data-metric-key="distance"]):not([data-metric-key="heartRate"]){
 display:none!important;
}
body.pedalkin-overlay-theme.expanded #overlayContent{
 background:var(--pk-deep)!important;border:2px solid var(--pk-peach)!important;
 border-radius:12px!important;padding:7px!important;
}
body.pedalkin-overlay-theme.expanded #overlayChart{
 grid-column:1 / -1!important;grid-row:4!important;
}
@media(max-width:900px){
 body.pedalkin-overlay-theme:not(.expanded) #overlayContent{
 grid-template-columns:minmax(0,13%) minmax(0,13%) minmax(0,1fr) minmax(0,15%) minmax(0,15%)!important;
 gap:4px!important;padding:4px!important;
 }
 body.pedalkin-overlay-theme #overlayTop strong{font-size:10px!important}
 body.pedalkin-overlay-theme #overlayLabel{max-width:24%!important;padding:3px 5px!important;font-size:8px!important}
 body.pedalkin-overlay-theme #overlayActions button{font-size:9px!important;padding:2px 3px!important}
 body.pedalkin-overlay-theme #overlayContent .tile{padding:2px 3px!important}
 body.pedalkin-overlay-theme #overlayContent .tile small{font-size:8px!important}
 body.pedalkin-overlay-theme #overlayContent .tile b{font-size:clamp(11px,2vw,19px)!important}
 body.pedalkin-overlay-theme #overlayContent .tile[data-metric-key="elapsedTime"] b{font-size:clamp(11px,1.65vw,17px)!important}
}
@media(prefers-reduced-motion:reduce){
 body.pedalkin-overlay-theme *{transition:none!important;animation:none!important}
}
`;
