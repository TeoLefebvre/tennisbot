const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({headless: false})
  try {
    const page = await browser.newPage()
    const default_timeout = 10 // in seconds
    page.setDefaultTimeout(default_timeout*1000)

    let url = "https://www.tennisblr.com/"
    await page.goto(url)

    const reservation_btn = await page.waitForSelector("#menu-item-629")
    await reservation_btn.click()

    const username_input_sel = ".bloc > p:nth-child(1) > input" // CSS Selector
    await page.waitForSelector(username_input_sel)
    await page.focus(username_input_sel)
    await page.keyboard.type(process.env.USERNAME)

    const password_input_sel = ".bloc > p:nth-child(2) > input"
    await page.waitForSelector(password_input_sel)
    await page.focus(password_input_sel)
    await page.keyboard.type(process.env.PASSWORD)

    const submit_sel = ".bloc > p:nth-child(3) > button"
    const submit_btn = await page.waitForSelector(submit_sel)
    await submit_btn.click()

    const confirm_btn_sel = "button.ui-button:nth-child(2)"
    const confirm_btn = await page.waitForSelector(confirm_btn_sel)
    await confirm_btn.click()
    
  } catch (error) {
    console.error(error)
  } finally {
    await delay(5)
    await browser.close()
  }
})()

function delay(time) {
  /* Time must be in seconds */
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time*1000)
  })
}