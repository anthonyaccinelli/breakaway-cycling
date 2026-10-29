// The protected endpoint and autoplay builder share this dependency manifest.
export const QUEST_ASSETS=Object.freeze({
 'index.html':'text/html; charset=utf-8',
 'game.css':'text/css; charset=utf-8',
 'shared-ui.css':'text/css; charset=utf-8',
 'devices-ui.css':'text/css; charset=utf-8',
 ...Object.fromEntries(['game','shared-ui','devices-ui','combat','monsters','profile','routes','level-up','reward-gesture','rewards','save-state','combat-save','ui-utils','workouts','workout-ui','fit-decoder','summary-capture'].map(name=>[name+'.js','text/javascript; charset=utf-8'])),
 'FIT-PARSER-LICENSE.txt':'text/plain; charset=utf-8',
 'SUMMARY-CAPTURE-LICENSE.txt':'text/plain; charset=utf-8'
});
