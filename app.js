const puppeteer = require("puppeteer")
const reservations = require("./reservations.json")

main()

const TERRAINS = {
  "int": [24, 25, 26, 27, 28],
  "ext": [33, 31, 32] // dans l'ordre de la numérotation des terrains du club
}

function main() {
  const today = new Date()
  for (let reservation of reservations) {
    let [day, month, year] = reservation.date.split("/")
    let date = new Date(year, month-1, day)
    let diff = Math.ceil((date-today)/(1000*3600*24))
    if (diff===3) {
      book(reservation)
    }
  }
}

function compute_selector(heure, i, terrain) {
  if (heure < 10) {
    return `#\\3${heure} _${i*15}_${terrain}`
  } else {
    let [heure1, heure2] = String(heure).split("")
    return `#\\3${heure1} ${heure2}_${i*15}_${terrain}`
  }
}

async function click_on_selector(page, selector) {
  const btn = await page.waitForSelector(selector)
  await btn.click()
}

async function book(reservation) {
  const browser = await puppeteer.launch({headless: false})
  try {
    const page = await browser.newPage()
    const default_timeout = 10 // in seconds
    page.setDefaultTimeout(default_timeout*1000)

    let url = "https://www.tennisblr.com/"
    await page.goto(url)

    await click_on_selector(page, "#menu-item-629") // menu réservation

    const username_input_sel = ".bloc > p:nth-child(1) > input" // CSS Selector
    await page.waitForSelector(username_input_sel)
    await page.focus(username_input_sel)
    await page.keyboard.type(process.env.USERNAME)

    const password_input_sel = ".bloc > p:nth-child(2) > input"
    await page.waitForSelector(password_input_sel)
    await page.focus(password_input_sel)
    await page.keyboard.type(process.env.PASSWORD)

    await click_on_selector(page, ".bloc > p:nth-child(3) > button") // bouton se connecter
    await click_on_selector(page, "button.ui-button:nth-child(2)") // accéder au tableau de réservation

    for (let i = 0; i < 3; i++)
      await click_on_selector(page, "#btn_plus") // avancer d'1 jour

    let booked = false
    for (let terrain of TERRAINS[reservation.terrain]) {
      let free = true
      for (let i = 0; i < 4; i++) {
        let selector = compute_selector(reservation.heure, i, terrain)
        try {
          await page.waitForSelector(selector, {visible: true})
        } catch (error) {
          free = false
          break
        }
      }
      if (free) {
        let selector = compute_selector(reservation.heure, 0, terrain)
        const rect = await page.evaluate((selector) => {
          const element = document.querySelector(selector)
          if (!element) return null
          const { x, y } = element.getBoundingClientRect()
          return { x, y }
        }, selector)
        await page.mouse.click(rect.x, rect.y, { clickCount: 2, delay: 100 })
        
        if (terrain==24) { // premier terrain donc il y a la popup pour demander si on veut utiliser la caméra Mojo
          await click_on_selector(page, "button.bouton:nth-child(12)") // non
          await click_on_selector(page, "button.bouton:nth-child(8)") // confirmation ne pas utiliser mojo
        }

        await click_on_selector(page, "#CHAMP_TYPE_1-button") // choisir partenaire
        await click_on_selector(page, "#CHAMP_TYPE_1-menu > li:nth-child(2)") // désigner un partenaire
        
        let [lastname, firstname] = reservation.partenaire.split(" ")
        let partner_input_sel = ".ui-autocomplete-input"
        await page.waitForSelector(partner_input_sel)
        await page.focus(partner_input_sel)
        await page.keyboard.type(lastname)

        await delay(1)
        let count = await page.evaluate((partenaire) => {
          let ul = document.getElementById("ui-id-1")
          let propositions = ul.children[0].children
          let i = 0
          for (let proposition of propositions) {
            i++
            if (proposition.innerText == partenaire)
              break
          }
          return i
        }, reservation.partenaire)

        for (let i = 0; i < count; i++)
          page.keyboard.press("ArrowDown") // descend pour sélectionner le bon nom
        page.keyboard.press("Enter") // sélectionne le nom

        await click_on_selector(page, "button.ui-button:nth-child(6)") // valider la réservation

        booked = true
        break
      }
    }
    if (!booked) {
      console.log("Pas de terrains libres")
    }
    
  } catch (error) {
    console.log("Une erreure s'est produite")
    console.error(error)
  } finally {
    await delay(10)
    await browser.close()
  }
}

function delay(time) {
  /* Time must be in seconds */
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time*1000)
  })
}