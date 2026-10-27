export const SURVIVAL_OVERLAY_CSS=String.raw`/**
 * Survival's spooky, zombie-themed Chrome always-on-top overlay.
 * Injected into the Document Picture-in-Picture window after base overlay CSS.
 * Mode scoped: Classic keeps the current default overlay.
 * Palette: slate #394252, ash #B5A7A9, blood #D54051, ember #F19F71.
 */
body.survival-overlay-theme{
 --undead-slate:#394252;
 --undead-ash:#B5A7A9;
 --undead-blood:#D54051;
 --undead-ember:#F19F71;
 --undead-bg:#09090e;
 --undead-panel:#19121a;
 --undead-raise:#281a23;
 background:#09090e!important;color:#f8edef!important;
 padding:4px 6px 6px!important;
 font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}
body.survival-overlay-theme #overlayContent{
 position:relative;isolation:isolate;
 border:1px solid var(--undead-slate)!important;
 border-radius:5px!important;
 background:#140e16!important;
 padding:4px 7px!important;
 overflow:hidden!important;
 box-shadow:inset 0 0 0 1px #b5a7a912,0 0 0 1px #09090e;
}
body.survival-overlay-theme #overlayContent::before{
 content:"";
 position:absolute;inset:0;
 z-index:-1;pointer-events:none;
 background:
  repeating-linear-gradient(108deg,transparent 0 21px,#b5a7a906 21px 22px,transparent 22px 62px),
  radial-gradient(ellipse at 95% 10%,#d540511d,transparent 46%),
  linear-gradient(115deg,#10141e,#171018 65%,#251218);
 opacity:.9;
}
body.survival-overlay-theme #overlayContent::after{
 content:"";
 position:absolute;inset:0;
 z-index:6;pointer-events:none;
 border-top:2px solid #d5405199;
 border-bottom:1px solid #f19f7138;
 border-radius:5px;
}
body.survival-overlay-theme #overlayTop{
 display:flex;align-items:center;gap:8px;min-height:19px!important;
 color:#f9e8eb!important;position:relative;z-index:3;
}
body.survival-overlay-theme #overlayTop>strong{
 display:inline-flex;align-items:center;gap:4px;
 font-size:11px!important;color:var(--undead-blood)!important;
 font-weight:900!important;letter-spacing:1.5px!important;text-transform:uppercase;
 text-shadow:0 0 15px #d5405133!important;
}
body.survival-overlay-theme #overlayTop>strong::before{content:"☣";color:var(--undead-ember);font-size:14px}
body.survival-overlay-theme #overlayLabel{
 color:var(--undead-ash)!important;font-size:9px!important;
 font-weight:750!important;letter-spacing:.25px;
}
body.survival-overlay-theme #overlayActions{gap:3px!important}
body.survival-overlay-theme #overlayActions button{
 background:#30232b!important;color:#f9e9eb!important;
 border:1px solid #665663!important;border-radius:3px!important;
 font-size:10px!important;font-weight:850!important;
 padding:3px 6px!important;min-width:0!important;min-height:22px!important;
 box-shadow:none!important;
}
body.survival-overlay-theme #overlayActions button:hover{
 border-color:var(--undead-ember)!important;color:var(--undead-ember)!important;
}
body.survival-overlay-theme #overlayZoomControls button.active{
 background:var(--undead-blood)!important;color:#fff!important;
 border-color:var(--undead-blood)!important;
}
body.survival-overlay-theme #overlaySettings{
 background:#241922!important;color:#f7e9ed!important;
 border:1px solid var(--undead-slate)!important;border-radius:5px!important;
 box-shadow:0 8px 25px #000b!important;z-index:20!important;
}
body.survival-overlay-theme #overlayOpacity{accent-color:var(--undead-blood)!important}
body.survival-overlay-theme #overlayContent .tile{
 background:var(--undead-panel)!important;color:#fff!important;
 border:1px solid #51404c!important;border-radius:3px!important;
 padding:3px 5px!important;box-shadow:inset 2px 0 #3942528c!important;
}
body.survival-overlay-theme #overlayContent .tile:nth-child(3n+1){
 box-shadow:inset 2px 0 var(--undead-blood)!important;
}
body.survival-overlay-theme #overlayContent .tile b{
 color:#fff6f5!important;letter-spacing:-.03em!important;
 font-weight:900!important;font-variant-numeric:tabular-nums;
}
body.survival-overlay-theme #overlayContent .tile small{
 color:var(--undead-ash)!important;font-size:9px!important;
 font-weight:850!important;letter-spacing:.5px!important;
 text-transform:uppercase;
}
body.survival-overlay-theme #overlayContent .tile[data-metric-key="heartRate"] b{
 color:var(--undead-ember)!important;
}
body.survival-overlay-theme #overlayContent .tile[data-metric-key="grade"] b{
 color:var(--undead-ember)!important;
}
body.survival-overlay-theme #overlayChart{
 background:#141019!important;border:1px solid var(--undead-slate)!important;
 border-radius:3px!important;position:relative!important;overflow:hidden!important;
}
body.survival-overlay-theme #overlayChart::after,
body.survival-overlay-theme .survive-hud-profile::after{
 content:"☠";position:absolute;right:14px;top:7px;z-index:1;
 font-size:64px;line-height:1;color:#b5a7a911;pointer-events:none;
}
body.survival-overlay-theme .overlay-profile-grade{
 text-shadow:0 2px 7px #08060b,0 0 6px #08060b!important;
}
body.survival-overlay-theme #overlayMetrics .tile:focus-visible,
body.survival-overlay-theme #overlayActions button:focus-visible{
 outline:2px solid var(--undead-ember)!important;outline-offset:1px!important;
}
/* Active Survival chase remains a compact cockpit with controls accessible. */
body.survival-overlay-theme #overlayContent.survive-overlay{
 display:grid!important;
 grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:23px minmax(0,1fr)!important;
 gap:4px!important;
 padding:4px 7px 5px!important;
 background:#151017!important;
 border:1px solid var(--undead-slate)!important;
 transition:border-color .25s ease,background-color .25s ease!important;
 box-shadow:inset 0 0 0 1px #b5a7a916!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay #overlayTop{
 display:flex!important;grid-column:1!important;grid-row:1!important;
 border-bottom:1px solid #56424e!important;padding-bottom:3px!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay #overlayMetrics,
body.survival-overlay-theme #overlayContent.survive-overlay #overlayChart{
 display:none!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay #surviveHud{
 display:grid!important;
 grid-template-rows:22px minmax(0,1fr)!important;
 grid-column:1!important;grid-row:2!important;
 height:100%!important;min-height:0!important;
 gap:4px!important;margin:0!important;padding:0!important;
 background:none!important;color:#fff!important;
}
body.survival-overlay-theme .survive-hud-head{
 display:flex!important;justify-content:space-between!important;align-items:center!important;
 gap:10px!important;padding:0 4px!important;min-height:0!important;
 background:transparent!important;border:0!important;
}
body.survival-overlay-theme .survive-hud-head strong{
 color:var(--undead-blood)!important;font-size:11px!important;font-weight:950!important;
 white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.7px!important;
 text-shadow:0 0 12px #d540513a;
}
body.survival-overlay-theme .survive-hud-head span{
 color:var(--undead-ember)!important;font-size:10px!important;font-weight:850!important;
 letter-spacing:1px;white-space:nowrap;
}
body.survival-overlay-theme .survive-hud-grid{
 display:grid!important;
 grid-template-columns:minmax(84px,18%) minmax(0,1fr) minmax(84px,18%)!important;
 grid-template-rows:repeat(2,minmax(0,1fr))!important;
 min-height:0!important;height:100%!important;gap:4px 6px!important;
}
body.survival-overlay-theme .survive-hud-metric{
 background:#241721!important;border:1px solid #604452!important;
 border-radius:3px!important;box-shadow:inset 2px 0 #394252!important;
 min-width:0!important;min-height:0!important;gap:2px!important;
}
body.survival-overlay-theme .survive-hud-metric small{
 color:var(--undead-ash)!important;font-size:9px!important;
 font-weight:850!important;letter-spacing:.7px!important;
}
body.survival-overlay-theme .survive-hud-metric b{
 color:#fff1ef!important;font-size:clamp(18px,2.6vw,34px)!important;
 font-weight:900!important;line-height:1.1!important;
}
body.survival-overlay-theme .survive-hud-grid>.survive-hud-metric:nth-child(4) b{
 color:var(--undead-blood)!important;
}
body.survival-overlay-theme .survive-hud-profile{
 position:relative!important;overflow:hidden!important;
 background:#0d0c12!important;
 border:1px solid var(--undead-slate)!important;border-radius:3px!important;
 grid-column:2!important;grid-row:1 / span 2!important;min-height:0!important;
}
body.survival-overlay-theme .survive-hud-profile .overlay-profile-graphic{
 height:calc(100% - 58px)!important;background:#100d14!important;
}
body.survival-overlay-theme .survive-hud-profile svg{
 height:100%!important;width:100%!important;
}
body.survival-overlay-theme .survive-hud-dots{
 position:absolute!important;top:0!important;left:7px!important;right:7px!important;
 bottom:58px!important;height:auto!important;border:0!important;pointer-events:none!important;
 z-index:4!important;background:transparent!important;
}
body.survival-overlay-theme .survive-hud-dots i{
 position:absolute!important;top:0!important;bottom:0!important;height:100%!important;
 width:3px!important;border-radius:0!important;box-shadow:0 0 7px #d5405180!important;
}
body.survival-overlay-theme .survive-hud-dots .threat{
 background:var(--undead-blood)!important;
 border-left:1px solid #f19f7180!important;
}
body.survival-overlay-theme .survive-hud-dots .rider{display:none!important}
body.survival-overlay-theme .survive-hud-timer{
 position:absolute!important;left:0!important;right:0!important;bottom:0!important;
 display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;
 gap:4px!important;height:58px!important;padding:5px!important;
 background:#161019!important;border-top:1px solid var(--undead-slate)!important;
 border-radius:0!important;
}
body.survival-overlay-theme .survive-hud-timer>div{
 background:#2b1a24!important;border:1px solid #63424f!important;
 border-radius:3px!important;min-width:0!important;min-height:0!important;
}
body.survival-overlay-theme .survive-hud-timer small{
 font-size:9px!important;font-weight:850!important;color:var(--undead-ash)!important;
}
body.survival-overlay-theme .survive-hud-timer strong{
 font-size:clamp(15px,1.9vw,23px)!important;color:#fff1f2!important;
 font-weight:950!important;line-height:1.1!important;
}
body.survival-overlay-theme .survive-hud-timer strong.survive-hud-gap{
 color:var(--undead-ember)!important;text-shadow:0 0 9px #f19f7130!important;
}
body.survival-overlay-theme .survive-hud-timer span{color:var(--undead-ash)!important}
/* All chase phases keep the four-color system. Never switch to green or blue. */
body.survival-overlay-theme #overlayContent.survive-overlay.survive-phase-chase{
 border-color:var(--undead-blood)!important;background:#211017!important;
 box-shadow:inset 0 0 20px #d540512c!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-phase-recover{
 border-color:var(--undead-slate)!important;background:#14121a!important;
 box-shadow:inset 0 0 14px #3942525e!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-phase-prepare{
 border-color:var(--undead-ember)!important;background:#26191c!important;
 box-shadow:inset 0 0 14px #f19f7130!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-danger,
body.survival-overlay-theme #overlayContent.survive-overlay.survive-critical{
 border-color:var(--undead-blood)!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-critical{
 box-shadow:inset 0 0 22px #d5405154,0 0 8px #d5405140!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-phase-chase .survive-hud-head strong{
 color:var(--undead-blood)!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-phase-recover .survive-hud-head strong{
 color:var(--undead-ash)!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay.survive-phase-prepare .survive-hud-head strong{
 color:var(--undead-ember)!important;
}
body.survival-overlay-theme #overlayContent.survive-overlay .survive-hud-metric,
body.survival-overlay-theme #overlayContent.survive-overlay .survive-hud-timer>div{
 background:#241721!important;
}
@media(max-width:850px){
 body.survival-overlay-theme #overlayTop strong{font-size:9px!important;letter-spacing:.8px!important}
 body.survival-overlay-theme #overlayLabel{display:none!important}
 body.survival-overlay-theme .survive-hud-head strong{font-size:9px!important}
 body.survival-overlay-theme .survive-hud-metric small{font-size:8px!important}
 body.survival-overlay-theme .survive-hud-metric b{font-size:clamp(17px,2.2vw,28px)!important}
}
@media(prefers-reduced-motion:reduce){
 body.survival-overlay-theme #overlayContent{transition:none!important;animation:none!important}
}
`;
