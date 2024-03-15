# Tennis Bot

Pour réserver automatiquement un terrain de tennis à Bourg-la-Reine.
A utiliser avec un cron job pour le lancer tous les jours à 7h30.

## Utilisation

Il faut d'abord créer un fichier `.env` sur la base du fichier `.env.template` et remplir les informations. 

Le mode _DEBUG_ est activé quand la variable d'environnement `DEBUG` vaut 1. Dans ce cas là, les informations et les erreurs sont affichées en console plutôt, sinon elles sont enregistrés dans les fichiers `app.log` et `error.log`.

Pour l'envoie de notifications par mail, le programme utilise _Gmail_, il faut donc créer un nouveau projet sur _Google Cloud Platform_ qui aura accès à notre compte perso pour envoyer des mails. Suivre [ce tuto](https://www.freecodecamp.org/news/use-nodemailer-to-send-emails-from-your-node-js-server/).

Il faut lancer le script avec la commande : `npm run start` ou `npm start` qui permet d'inclure le fichier `.env`.

### TODO

- Se lance tous les jours à 7h31 (cron job)
- Trouver un moyen de modifier facilement en ligne le fichier de réservation (makefile qui pull de github avant d'exécuter le script ?)