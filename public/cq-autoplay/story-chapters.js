// Cycle Quest's ten immutable Story chapter recipes. Numeric codes match the Classic registry.
export const STORY_CHAPTERS=Object.freeze([
 {chapter:1,title:'COASTAL BEGINNINGS',seed:829101001,miles:100,gainFeet:5000,terrain:'rolling'},
 {chapter:2,title:'CASCADE CROSSING',seed:829101002,miles:100,gainFeet:7500,terrain:'mountain'},
 {chapter:3,title:'HIGH DESERT',seed:829101003,miles:100,gainFeet:3300,terrain:'rolling'},
 {chapter:4,title:'DESERT DESCENT',seed:829101004,miles:100,gainFeet:2200,terrain:'rolling'},
 {chapter:5,title:'SNAKE RIVER LOWLANDS',seed:829101005,miles:100,gainFeet:1800,terrain:'flat'},
 {chapter:6,title:'IDAHO FOOTHILLS',seed:829101006,miles:100,gainFeet:4200,terrain:'rolling'},
 {chapter:7,title:'EASTERN HIGHLANDS',seed:829101007,miles:100,gainFeet:2800,terrain:'rolling'},
 {chapter:8,title:'ROCKY MOUNTAIN APPROACH',seed:829101008,miles:100,gainFeet:4200,terrain:'mountain'},
 {chapter:9,title:'YELLOWSTONE ASCENT',seed:829101009,miles:100,gainFeet:5500,terrain:'mountain'},
 {chapter:10,title:'THE FINAL DESCENT',seed:829101010,miles:100,gainFeet:3900,terrain:'mountain'}
]);
export function storyChapter(chapter){return STORY_CHAPTERS[chapter-1]||null;}
export function storyRoute(chapter,generateRoute){const def=storyChapter(chapter);if(!def)return null;const route=generateRoute(100,def.terrain,def.gainFeet,def.seed);return {...route,name:'CHAPTER '+chapter+' · '+def.title,storyChapter:chapter};}
