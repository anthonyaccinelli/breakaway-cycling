/** Render the very same user-approved Illustrator handheld as inline SVG.
 * External <img> SVG documents do not inherit the game's custom font.
 * This replaces only the rendering container, preserving every authored path,
 * label, position, and existing overlay control.
 */
let artworkPromise:Promise<string|null>|null=null;
function handheldMarkup(){
 if(!artworkPromise){
  artworkPromise=fetch('/pedalkin/route-v2.svg')
   .then(async response=>response.ok?await response.text():null)
   .catch(()=>null);
 }
 return artworkPromise;
}
export async function enableSpokemonHandheldFont(host:HTMLElement):Promise<void>{
 const existing=host.querySelector<HTMLImageElement>('img.pk-v2-art,img.pk-dev-art');
 if(!existing)return;
 const source=await handheldMarkup();
 if(!source||!existing.isConnected)return; // image fallback on network failures
 const root=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
 if(root.localName!=='svg'||root.querySelector('parsererror'))return;
 const svg=document.importNode(root,true) as unknown as SVGSVGElement;
 svg.classList.add(...Array.from(existing.classList));
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label',existing.alt);
 svg.setAttribute('focusable','false');
 svg.style.pointerEvents='none';
 existing.replaceWith(svg);
 // Route and Devices now inherit the exact same Minecraft face as Ride.
 // Refresh once the font has loaded; the SVG paths themselves never change.
 try{await document.fonts.load('700 20px "Spokemon Minecraft"');}catch{}
}
