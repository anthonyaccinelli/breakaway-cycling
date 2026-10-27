// Exact left-to-right swatches supplied for Cycle Quest.
export const GRADE_COLORS=['#5969a2','#3f4e86','#333f78','#27336b','#132057'];
export function gradeColor(g){return GRADE_COLORS[g<0?0:g<3?1:g<6?2:g<9?3:4];}
export function elevationSVG(route,sample,width,height,progress=0,marker=true){
 const pad=14,low=Math.min(...route.points.map(p=>p.e)),range=Math.max(...route.points.map(p=>p.e))-low;
 const x=d=>pad+d/route.distance*(width-2*pad),y=e=>height-18-(range>0?.12+.8*(e-low)/range:.3)*(height-42);
 // Original segment boundaries preserve short climbs. Bounded polygons avoid
 // clipPath issues in Document Picture-in-Picture and share the same palette.
 const segments=route.points.slice(1).map((b,i)=>{const a=route.points[i],g=100*(b.e-a.e)/(b.d-a.d);return '<polygon points="'+x(a.d)+','+(height-18)+' '+x(a.d)+','+y(a.e)+' '+x(b.d)+','+y(b.e)+' '+x(b.d)+','+(height-18)+'" fill="'+gradeColor(g)+'" stroke="'+gradeColor(g)+'" stroke-width="0.5"/>';}).join('');
 const outline=route.points.map(p=>x(p.d)+','+y(p.e)).join(' '),d=Math.max(0,Math.min(1,progress))*route.distance;
 return '<svg viewBox="0 0 '+width+' '+height+'" aria-hidden="true">'+[.25,.5,.75].map(f=>'<line x1="0" y1="'+height*f+'" x2="'+width+'" y2="'+height*f+'" stroke="#7289c0" opacity=".16"/>').join('')+segments+'<polyline points="'+outline+'" fill="none" stroke="#bdcdf3" stroke-width="1.6" stroke-linejoin="round"/>'+(route.summits||[]).map(f=>'<text x="'+x(f*route.distance)+'" y="20" fill="#ffe777" text-anchor="middle" font-size="18">⚔</text>').join('')+(marker?'<line x1="'+x(d)+'" x2="'+x(d)+'" y1="0" y2="'+height+'" stroke="#ffdf43" stroke-width="3"/>':'')+'</svg>';
}
