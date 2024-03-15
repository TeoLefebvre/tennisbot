const puppeteer = require("puppeteer")
const reservations = require("./reservations.json")
const fs = require("fs/promises")
const nodemailer = require("nodemailer")

const DEBUG = process.env.DEBUG === "1" // 0 pour la prod
const COURTS = {
  "int": [24, 25, 26, 27, 28],
  "ext": [33, 31, 32] // dans l'ordre de la numérotation des terrains du club
}
const TYPE = ["INFO", "DEBUG", "WARNING"]
const FILES = ["app.log", "error.log"]

async function log(file, type, message) {
  if (DEBUG) {
    console.log(message)
  } else {
    let date = new Date()
    let content = `${date.toISOString()} - ${TYPE[type]}: ${message}\n`
    await fs.writeFile(FILES[file], content, {flag: 'a+'})
  }
}

function notification(mail, subject, message) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.MAIL_ADDRESS,
      pass: process.env.MAIL_PASSWORD,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  })
  
  let mailOptions = {
    from: process.env.MAIL_ADDRESS,
    to: mail,
    subject: subject,
    text: message
  }
  
  transporter.sendMail(mailOptions, function(err, data) {
    if (err) {
      log(0, 1, `Le mail à ${mail} n'a pas été envoyé.`)
      log(1, 2, err)
    } else {
      log(0, 0, `Le mail à ${mail} a bien été envoyé.`)
    }
  })
}

async function click_on_selector(page, selector) {
  const btn = await page.waitForSelector(selector)
  await btn.click()
}

function compute_selector(hour, i, court) {
  /* selector du i-ème 1/4 d'heure du terrain choisi */
  if (hour < 10) {
    return `#\\3${hour} _${i*15}_${court}`
  } else {
    let [hour1, hour2] = String(hour).split("")
    return `#\\3${hour1} ${hour2}_${i*15}_${court}`
  }
}

function delay(time) {
  /* Temps en secondes. */
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time*1000)
  })
}

async function book(reservation) {
  let booked = false
  const browser = await puppeteer.launch({headless: !DEBUG})
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(10_000) // en milisecondes

    try {
      await page.goto("https://www.tennisblr.com/")
      await click_on_selector(page, "#menu-item-629") // menu réservation
    } catch (error) {
      log(0, 1, "La page n'a pas chargée.")
      log(1, 2, error)
    }

    const username_input_sel = ".bloc > p:nth-child(1) > input"
    await page.waitForSelector(username_input_sel)
    await page.focus(username_input_sel)
    await page.keyboard.type(process.env.TENNIS_USERNAME)

    const password_input_sel = ".bloc > p:nth-child(2) > input"
    await page.waitForSelector(password_input_sel)
    await page.focus(password_input_sel)
    await page.keyboard.type(process.env.TENNIS_PASSWORD)

    await click_on_selector(page, ".bloc > p:nth-child(3) > button") // bouton se connecter
    await click_on_selector(page, "button.ui-button:nth-child(2)") // accéder au tableau de réservation

    for (let i = 0; i < 3; i++)
      await click_on_selector(page, "#btn_plus") // avancer d'1 jour

    page.setDefaultTimeout(2_000) // en milisecondes
    for (let court of COURTS[reservation.court]) {
      let free = true
      for (let i = 0; i < 4; i++) {
        let selector = compute_selector(reservation.hour, i, court)
        try {
          await page.waitForSelector(selector, {visible: true})
        } catch (error) {
          free = false
          break
        }
      }
      if (!free) {
        log(0, 0, `Terrain ${court} indisponible.`)
      }
      else {
        let selector = compute_selector(reservation.hour, 0, court)
        const rect = await page.evaluate((selector) => {
          const element = document.querySelector(selector)
          if (!element) return null
          const { x, y } = element.getBoundingClientRect()
          return { x, y }
        }, selector)
        await page.mouse.click(rect.x, rect.y, { clickCount: 2, delay: 100 })
        
        if (court==24) { // premier terrain donc il y a la popup pour demander si on veut utiliser la caméra Mojo
          await click_on_selector(page, "button.bouton:nth-child(12)") // non
          await click_on_selector(page, "button.bouton:nth-child(8)") // confirmation
        }

        await click_on_selector(page, "#CHAMP_TYPE_1-button") // choisir partenaire
        await click_on_selector(page, "#CHAMP_TYPE_1-menu > li:nth-child(2)") // désigner un partenaire
        
        try {
          let name = `${reservation.partner.lastname} ${reservation.partner.firstname}`
          let partner_input_sel = ".ui-autocomplete-input"
          await page.waitForSelector(partner_input_sel)
          await page.focus(partner_input_sel)
          await page.keyboard.type(reservation.partner.lastname)

          await delay(1) // attend que la liste s'affiche
          let count = await page.evaluate((name) => {
            let ul = document.getElementById("ui-id-1")
            let propositions = ul.children[0].children
            let i = 0
            for (let proposition of propositions) {
              i++
              if (proposition.innerText == name)
                break
            }
            return i
          }, name)

          for (let i = 0; i < count; i++)
            page.keyboard.press("ArrowDown") // descend pour sélectionner le bon nom
          page.keyboard.press("Enter") // sélectionne le nom

        } catch (error) {
          log(0, 1, `Le partenaire ${reservation.partner.firstname} ${reservation.partner.lastname} n'a pas été trouvé.`)
          log(1, 2, error)
        }

        await click_on_selector(page, "button.ui-button:nth-child(6)") // valider la réservation
        booked = true
        break
      }
    }
  } catch (error) {
    log(0, 1, "Une erreur s'est produite.")
    log(1, 2, error)
  } finally {
    await browser.close()
  }

  if (booked) {
    log(0, 0, "Terrain réservé.")
  } else {
    let message = `La réservation pour le ${reservation.date} à ${reservation.hour}h a échoué.\nIl faut réserver manuellement.`
    log(0, 0, message)
    let subject = "TennisBot - échec de la réservation"
    notification(process.env.MAIL_ADDRESS, subject, message)
    if (!DEBUG && reservation.partner.mail)
      notification(reservation.partner.mail, subject, message)
  }
}

function check_reservation() {
  let today = new Date()
  let booked = false
  for (let reservation of reservations) {
    log(0, 0, "Lancement du programme.")
    let [day, month, year] = reservation.date.split("/")
    let date = new Date(year, month-1, day)
    let diff = Math.ceil((date-today)/(1000*3600*24))
    if (diff===3) {
      log(0, 0, `Réservation pour le ${reservation.date} à ${reservation.hour}h trouvée.`)
      book(reservation)
      booked = true
    }
  }
  if (!booked)
    log(0, 0, "Aucune réservation à faire.")
}

console.log(`DEBUG: ${DEBUG}`)
check_reservation()