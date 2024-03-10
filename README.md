# Tennis Bot

Pour réserver automatiquement un terrain de tennis à Bourg-la-Reine.
A utiliser avec un cron job pour le lancer tous les jours à 7h30.

Il faut lancer le script avec la commande : `npm run start` ou `npm start` qui permet d'inclure le fichier `.env`.

### TODO

- Metre des logs pour prévenir quand la réservation n'a pas fonctionné
- Lire les réservations à faire d'un fichier JSON
- Trouver un moyen de modifier facilement en ligne le fichier de réservation (makefile qui pull de github avant d'exécuter le script ?)
