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
body.classic-design-overlay #overlayOpacity{accent-color:#074ce0!important}
body.classic-design-overlay button:focus-visible{
 outline:2px solid #074ce0!important;outline-offset:2px!important;
}
@media(prefers-reduced-motion:reduce){
 body.classic-design-overlay *{transition:none!important;animation:none!important}
}`;
