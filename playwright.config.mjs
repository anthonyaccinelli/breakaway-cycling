import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',testMatch:'*.browser.spec.mjs',timeout:30000,retries:0,
 use:{baseURL:'http://127.0.0.1:5173',headless:true,browserName:'chromium',viewport:{width:1440,height:900}},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI,timeout:30000}
});
