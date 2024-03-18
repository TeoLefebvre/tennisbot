# Tennis Bot

Pour réserver automatiquement un terrain de tennis à Bourg-la-Reine.
A utiliser avec un cron job pour le lancer tous les jours à 7h30.

## Installation

Dans un premier temps, installer les dépendances avec : `npm i`

Il faut ensuite créer un fichier `.env` sur la base du fichier `.env.template` et remplir les informations. 

Le mode _DEBUG_ est activé quand la variable d'environnement `DEBUG` vaut 1. Dans ce cas là, les informations et les erreurs sont affichées en console plutôt, sinon elles sont enregistrés dans les fichiers `app.log` et `error.log`.

La variable _BROWSER\_PATH_ permet de spécifier le chemin vers le navigateur à utiliser. Sur linux, _puppeteer_ n'installe pas forcément son propre navigateur et il faut l'installer sois-même. Sur Ubuntu : 
```bash
sudo apt install chromium-browser
which chromium # pour obtenir le chemin d'installation à écrire dans BROWSER_PATH
```

Pour l'envoie de notifications par mail, le programme utilise _Gmail_, il faut donc créer un nouveau projet sur _Google Cloud Platform_ qui aura accès à notre compte perso pour envoyer des mails. Suivre [ce tuto](https://www.freecodecamp.org/news/use-nodemailer-to-send-emails-from-your-node-js-server/).

## Utilisation

Il faut créer un fichier `reservations.json` sur la base du fichier `reservations.template.json` et ajouter autant de réservation que l'on veut à la liste. L'adresse mail du partenaire est optionnelle.

Il faut lancer le script avec la commande : `npm run start` ou `npm start` qui permet d'inclure le fichier `.env`.