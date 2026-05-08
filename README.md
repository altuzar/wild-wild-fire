# Wild Wild Fire

Real-time multiplayer "Uno All Wild" — every card is a wild. Built with Next.js, Tailwind, and Firebase.

## Setup

1. `npm install`
2. Create a Firebase project, enable **Anonymous Authentication** and **Firestore**.
3. Copy `.env.local.example` to `.env.local` and paste your Firebase web SDK config.
4. `npm run dev` and open http://localhost:3000

## Firestore rules (dev)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How to play

- Create a room → share the URL
- Up to 8 players join, hit Ready
- Host starts the game; 7 cards each
- Every card is wild. Action cards trigger when played; some prompt you to pick a target.
- Click **UNO!** when you're down to 2 cards. If you don't, opponents can challenge you for +2.

## Card types

| Card | Effect |
| --- | --- |
| Wild | No effect |
| Wild Skip | Skip next player |
| Wild Skip Two | Skip next two players |
| Wild Reverse | Reverse direction |
| Wild Draw Two | Next player draws 2 + skip |
| Wild Targeted Draw Two | Pick a target — they draw 2 (no skip) |
| Wild Draw Four | Next player draws 4 + skip |
| Wild Forced Swap | Pick a target — swap entire hands |
