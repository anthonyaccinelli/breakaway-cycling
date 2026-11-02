import {test,expect} from '@playwright/test';
test('navigate all three Spokemon screens and render the original SVG artboards',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('body')).toHaveAttribute('data-breakaway-screen','route');
 await expect(page.locator('.pk-v2-shell')).toBeVisible();
 await expect(page.locator('.pk-v2-art')).toBeVisible();
 await page.locator('.pk-v2-nav-devices').click();
 await expect(page.locator('body')).toHaveAttribute('data-breakaway-screen','setup');
 await expect(page.locator('.pk-dev-screen')).toBeVisible();
 await page.locator('[data-pk-input]').selectOption('cadence');
 await page.locator('[data-pk-play-test]').click();
 await expect(page.locator('body')).toHaveAttribute('data-breakaway-screen','ride');
 await expect(page.locator('object.pk-exact-artboard')).toHaveAttribute('data',/\/pedalkin\/encounter\.svg/,{timeout:15000});
 await expect(page.locator('.pk-ride-stage')).toBeVisible();
 await page.screenshot({path:'test-results/standalone-encounter.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('route generation and scene transitions work without real Bluetooth hardware',async({page})=>{
 await page.goto('/');
 await page.locator('.pk-v2-miles').fill('20');
 await page.locator('.pk-v2-generate').click();
 await expect(page.locator('[data-pk-stat="miles"]')).toContainText('20');
 await page.locator('.pk-v2-nav-ride').click();
 await expect(page.locator('body')).toHaveAttribute('data-breakaway-screen','ride');
 await expect(page.locator('object.pk-exact-artboard')).toHaveAttribute('data',/\/pedalkin\/explore\.svg/);
 await page.screenshot({path:'test-results/standalone-explore.png',fullPage:true});
 await page.locator('.pk-ride-nav [data-pk-nav="route"]').click();
 await expect(page.locator('body')).toHaveAttribute('data-breakaway-screen','route');
});
test('save export remains confined to Game Controls and contains player collection',async({page})=>{
 await page.goto('/');
 await page.locator('.pk-v2-nav-ride').click();
 await page.locator('.pk-game-toolbar summary').click();
 const promise=page.waitForEvent('download');
 await page.getByRole('button',{name:'EXPORT SPOKEMON SAVE'}).click();
 const download=await promise;
 expect(download.suggestedFilename()).toMatch(/^spokemon-save-.*\.json$/);
});
