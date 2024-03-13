# Tennis Bot

Pour réserver automatiquement un terrain de tennis à Bourg-la-Reine.
A utiliser avec un cron job pour le lancer tous les jours à 7h30.

Il faut lancer le script avec la commande : `npm run start` ou `npm start` qui permet d'inclure le fichier `.env`.

### TODO

- Metre des logs pour prévenir quand la réservation n'a pas fonctionné
- Trouver un moyen de modifier facilement en ligne le fichier de réservation (makefile qui pull de github avant d'exécuter le script ?)

### Etape du programme

- Se lance tous les jours à 7h31 (cron job)
- Regarde dans fichier les réservations à faire (comment les noter ? il faut terrain date horaire et mail du partenaire de jeu)
- Compare la date des réservations à la date d'aujourd'hui
- Si il y en a une dans 3j lance le programme de réservation
- Va au tableau de réservation
- Avance de 3 jours
- Sélectionne le bon terrain à la bonne heure (fonction pour générer l'id)
- Réserve celui ci avec William (attention au terrain 1, il y a une étape en plus pour répondre si on veut la caméra Mojjo ou pas)