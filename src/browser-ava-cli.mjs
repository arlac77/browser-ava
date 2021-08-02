#!/usr/bin/node

import { chromium, firefox, webkit } from 'playwright';

async function run () {
    const browser = await chromium.launch({ headless: false});

    console.log(browser);
    const page = await browser.newPage();
    const x = await page.goto('http://github.com/');
    console.log(x);
 //   await browser.close();
}


run();

