const puppeteer = require("puppeteer")
const reservations = require("./reservations.json")
const fs = require("fs/promises")

const TERRAINS = {
  "int": [24, 25, 26, 27, 28],
  "ext": [33, 31, 32] // dans l'ordre de la numérotation des terrains du club
}
const TYPE = ["INFO", "DEBUG", "WARNING"]
const FILES = ["app.log", "error.log"]

async function log(file, type, message) {
  let date = new Date()
  let content = `${date.toISOString()} - ${TYPE[type]}: ${message}\n`
  await fs.writeFile(FILES[file], content, {flag: 'a+'})
}

function verifie_reservation() {
  const today = new Date()
  for (let reservation of reservations) {
    log(0, 0, "Lancement du programme.")
    let [day, month, year] = reservation.date.split("/")
    let date = new Date(year, month-1, day)
    let diff = Math.ceil((date-today)/(1000*3600*24))
    if (diff===3) {
      log(0, 0, "Réservation trouvée.")
      book(reservation)
    }
  }
}

function compute_selector(heure, i, terrain) {
  /* selector du i-ème 1/4 d'heure du terrain choisi */
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

    try {
      await page.goto("https://www.tennisblr.com/")
      await click_on_selector(page, "#menu-item-629") // menu réservation
    } catch (error) {
      log(0, 2, "La page n'a pas chargée.")
      log(1, 2, error)
    }

    const username_input_sel = ".bloc > p:nth-child(1) > input"
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
      if (!free) {
        log(0, 0, "Pas de terrains disponibles.")
      }
      else {
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
        
        try {
          let [lastname, firstname] = reservation.partenaire.split(" ")
          let partner_input_sel = ".ui-autocomplete-input"
          await page.waitForSelector(partner_input_sel)
          await page.focus(partner_input_sel)
          await page.keyboard.type(lastname)

          await delay(1) // attend que la liste s'affiche
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
        } catch (error) {
          log(0, 0, `Le partenaire ${reservation.partenaire} n'a pas été trouvé.`)
          log(1, 2, error)
        }

        await click_on_selector(page, "button.ui-button:nth-child(6)") // valider la réservation

        booked = true
        break
      }
    }
    if (booked)
      log(0, 0, "Terrain réservé.")
    else
      log(0, 0, "Aucun terrain n'a été réservé.")

  } catch (error) {
    log(0, 1, "Une erreur s'est produite")
    log(1, 2, error)
  } finally {
    await browser.close()
  }
}

function delay(time) {
  /* Temps en secondes. */
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time*1000)
  })
}

verifie_reservation()