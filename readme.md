# Spécifications techniques & fonctionnelles — Quiz Multijoueur en temps réel

Application web de quiz multijoueur en temps réel (type Kahoot/QuizUp), entièrement en français. Ce document sert de cahier des charges exhaustif pour l'implémentation par un agent de développement IA.

---

## 1. Stack technique

* **Frontend** : Vue.js 3 (Composition API, `<script setup>`), Vite, Tailwind CSS, Pinia, Socket.io-client.
* **Backend** : Node.js (v20+), Express.js, Socket.io, TypeScript (ou ES Modules stricts).
* **Stockage** : 
  * En mémoire (RAM / Map JS) pour la gestion des salons et états éphémères de jeu.
  * Fichier local `questions.json` pour la banque de données initiale (extensible vers SQLite/Prisma).

---

## 2. Architecture du projet (Monorepo simple)

```text
quiz-app/
├── client/                 # Application Vue 3
│   ├── src/
│   │   ├── components/     # Composants UI (Lobby, QuestionCard, ScoreBoard, Timer)
│   │   ├── stores/         # Pinia store (quizStore.js)
│   │   ├── views/          # Pages (HomeView.vue, RoomView.vue)
│   │   ├── socket.js       # Client Socket.io configuré
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── server/                 # Serveur Node.js
│   ├── src/
│   │   ├── data/
│   │   │   └── questions.json  # Banque de questions en français
│   │   ├── handlers/       # Gestionnaires d'événements Socket.io
│   │   ├── managers/       # Logique métier (RoomManager.js, GameEngine.js)
│   │   └── server.js       # Point d'entrée Express + Socket.io
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 3. Règles du jeu & cycle de vie d'une partie

1. **Création d'un salon** : Un joueur (l'hôte) génère une partie. Le serveur lui renvoie un code unique court à 4 ou 5 caractères alphanumériques (ex. `K7X9`).
2. **Rejoindre** : D'autres joueurs entrent le code et un pseudonyme unique dans la salle.
3. **Lancement** : Seul l'hôte peut cliquer sur « Lancer la partie ».
4. **Déroulement d'un tour (10 questions par défaut)** :
   * **Phase Question (15 s)** : Envoi de l'intitulé et de 4 propositions (la bonne réponse reste masquée côté client).
   * **Calcul des points** : Basé sur la justesse et la rapidité. Formule recommandée :
     $$\text{Points} = \text{base (500)} + \left(\frac{\text{temps restant}}{\text{temps total}} \times 500\right)$$
   * **Phase Révélation (5 s)** : Envoi de la bonne réponse, de l'explication et du classement provisoire mis à jour.
5. **Fin de partie** : Écran de podium (Top 3) et récapitulatif complet des scores.

---

## 4. Contrat d'interface Socket.io (Événements)

Toutes les communications en jeu reposent sur Socket.io.

### Client $\to$ Serveur

| Événement | Charge utile (Payload) | Description |
|---|---|---|
| `room:create` | `{ hostName: string }` | Crée un salon et assigne l'émetteur comme hôte. |
| `room:join` | `{ roomCode: string, playerName: string }` | Rejoint un salon existant. |
| `game:start` | `{ roomCode: string }` | Démarre la partie (autorisé uniquement pour l'hôte). |
| `game:submit_answer` | `{ roomCode: string, answerIndex: number }` | Soumission du choix du joueur. |

### Serveur $\to$ Client

| Événement | Charge utile (Payload) | Description |
|---|---|---|
| `room:joined` | `{ roomCode: string, playerId: string, isHost: boolean }` | Confirmation d'accès avec statut hôte. |
| `room:player_list`| `{ players: Array<{ id: string, name: string, score: number }> }` | Mise à jour de la liste des joueurs connectés. |
| `game:new_question`| `{ questionIndex: number, total: number, prompt: string, choices: string[], timeLimit: number }` | Nouvelle question (sans la réponse correcte). |
| `game:round_ended`| `{ correctAnswer: number, scores: Array<{ name: string, score: number, gained: number }> }` | Fin du chronomètre : affichage de la bonne réponse. |
| `game:game_over` | `{ podium: Array<{ rank: number, name: string, score: number }> }` | Fin de la partie et classement définitif. |
| `error:message` | `{ code: string, message: string }` | Alerte utilisateur (ex. « Salon introuvable », « Pseudo déjà pris »). |

---

## 5. Schéma de données (`questions.json`)

Les questions doivent impérativement être rédigées en français correct avec accords vérifiés.

```json
[
  {
    "id": "q1",
    "theme": "Culture générale",
    "prompt": "Quelle est la capitale de l'Australie ?",
    "choices": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    "correctIndex": 2
  },
  {
    "id": "q2",
    "theme": "Sciences",
    "prompt": "Quel gaz compose principalement l'atmosphère terrestre ?",
    "choices": ["Dioxygène", "Diazote", "Dioxyde de carbone", "Argon"],
    "correctIndex": 1
  }
]
```

---

## 6. Contraintes techniques & sécurité

* **Triche & Anti-triche** : Le serveur ne doit **jamais** envoyer `correctIndex` lors de l'événement `game:new_question`. La validation s'effectue exclusivement côté serveur.
* **Synchronisation temporelle** : Le chronomètre officiel est tenu par le serveur via des `setTimeout` / `setInterval`. Le client affiche uniquement un décompte visuel fluide basé sur le timestamp de fin fourni par le serveur.
* **Gestion des déconnexions** : Si un joueur ferme sa fenêtre, le serveur le retire de la liste (`disconnect`) et prévient les autres membres du salon. Si l'hôte part avant le début du jeu, transférer le rôle au joueur suivant ou détruire le salon.
* **Typographie & langue** : Interface 100 % en français (labels, erreurs, boutons). Respecter les espaces insécables devant les deux-points et points d'interrogation.

---

## 7. Instructions d'implémentation pour l'agent IA

1. Initialiser le backend Node/Express et configurer l'instance Socket.io avec CORS activé pour le port frontend Vite (par défaut `http://localhost:5173`).
2. Créer une classe `RoomManager` côté serveur qui encapsule la logique d'état des salons :
   ```typescript
   type Player = { id: string; name: string; score: number; answered: boolean; hasAnsweredCorrectly: boolean };
   type Room = { code: string; hostId: string; players: Map<string, Player>; state: 'LOBBY' | 'PLAYING' | 'ENDED'; currentQuestion: number };
   ```
3. Mettre en place le frontend Vue 3 avec un store Pinia (`useQuizStore`) réactif qui écoute directement les événements Socket.io et stocke l'état global du jeu.
4. Styliser l'interface avec Tailwind CSS pour proposer 4 boutons de couleur distincts pour les choix (façon Kahoot : Rouge, Bleu, Jaune, Vert).

---

## 8. Démarrage rapide

Prérequis : Node.js v20 ou supérieur.

### 1. Installer les dépendances

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Lancer le serveur (backend)

```bash
cd server
npm run dev        # ou : npm start
```

Le serveur écoute sur `http://localhost:3001` (CORS autorisé pour `http://localhost:5173`).

Variables d'environnement optionnelles :

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3001` | Port d'écoute du serveur |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origine autorisée par CORS |

### 3. Lancer le frontend (Vue 3)

```bash
cd client
npm run dev
```

Ouvrez `http://localhost:5173` dans plusieurs fenêtres pour tester le multijoueur.

Pour pointer vers un autre serveur, créez `client/.env` à partir de `client/.env.example` :

```
VITE_SERVER_URL=http://localhost:3001
```

### Build de production du frontend

```bash
cd client && npm run build     # génère client/dist
```

---

## 9. Comportement du jeu implémenté

* **Salon** : code à 4 caractères alphanumériques (sans caractères ambigus), généré côté serveur.
* **Anti-triche** : `correctIndex` n'est jamais transmis dans `game:new_question` ; la validation et le calcul des points sont exclusivement serveur.
* **Chronométrage** : le serveur arme les `setTimeout` (15 s de question, 5 s de révélation) et fournit `endsAt` + `serverNow` pour un décompte visuel synchronisé côté client.
* **Score** : `500 + (temps_restant / temps_total) × 500`, borné entre 0 et 1000 points par bonne réponse.
* **Fin anticipée** : une manche se termine dès que tous les joueurs ont répondu.
* **Déconnexion** : un joueur qui ferme son onglet est retiré du salon ; si l'hôte part, le rôle est transféré au joueur suivant ; un salon vide est détruit et ses timers libérés.
