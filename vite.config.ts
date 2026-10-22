import {defineConfig} from 'vite';
export default defineConfig(({mode})=>({
 base:mode==='desktop'?'./':'/',
 define:{__BREAKAWAY_DESKTOP__:JSON.stringify(mode==='desktop')}
}));
