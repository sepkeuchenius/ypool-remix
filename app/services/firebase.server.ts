import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { child, get, getDatabase, push, ref, set } from "firebase/database";
import { UserProps } from "~/routes/interfaces";
import { UserStats } from "~/routes/dashboard/route";
import { User } from "lucide-react";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Your web app's Firebase configuration

export const DB = process.env.NODE_ENV == "production" ? "default-rtdb" : "dev-db"

const firebaseConfig = {
  apiKey: "AIzaSyBhQ_fWHC_XM72eR9uShjP74ZKKdeNGR3c",
  authDomain: "ypool-generic-platform.firebaseapp.com",
  databaseURL: `https://ypool-generic-platform-${DB}.europe-west1.firebasedatabase.app`,
  projectId: "ypool-generic-platform",
  storageBucket: "ypool-generic-platform.appspot.com",
  messagingSenderId: "580948985126",
  appId: "1:580948985126:web:4af3df8c2eb8fa8a9dade7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app)


export function createGame(user: UserProps) {
  const db = getDatabase(app);

  const gameId = `game_${Date.now()}`;
  const gameData = {
    userId: user.uid,
    createdAt: new Date().toISOString(),
    status: "pending"
  };

  set(getGameRef(gameId), gameData)
    .then(() => {
      console.log("Game created successfully");
    })
    .catch((error) => {
      console.error("Error creating game: ", error);
    });
  push(child(ref(db, user.uid), "games"), gameId)

  return gameId;

}

export function getGameRef(gameId: string) {
  const db = getDatabase(app);
  return ref(db, 'games/' + gameId);
}

export async function ensureUserExists(user: UserProps) {
  const db = getDatabase(app);
  const userRef = ref(db, user.uid);
  return await get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
    } else {
      set(userRef, user).catch((error) => {
        console.log(error)
      });
    }
  });

}

export async function getUserGames(user: UserProps): Promise<string[]> {
  const db = getDatabase(app);
  await ensureUserExists(user)
  const userGamesRef = child(ref(db, user.uid), "games");
  return await get(userGamesRef).then(async (snapshot) => {
    if (snapshot.exists()) {
      console.log(snapshot.val());
      return Object.values(snapshot.val())
    } else {
      console.log("No user games yet");
      return await set(userGamesRef, []).catch((error) => {
        console.log(error)
        return []
      }).then(() => { return [] });
    }
  });
}

export async function getElos(): Promise<UserStats[][]> {
  const db = getDatabase(app);
  const elosRef = ref(db, 'elos');
  return await get(elosRef).then((snapshot) => {
    if (snapshot.exists()) {
      return asUserStats(Object.values(snapshot.val()))
    } else {
      console.log("No elos yet");
      return []
    }
  });
}

function asUserStats(data: object[]): UserStats[][] {
  return data.map((eloSnapshot: any) => {
    return Object.entries(eloSnapshot).map(([userId, elo]) => {
      return { userId, elo: elo.toFixed(2) } as UserStats
    }).sort((a: UserStats, b: UserStats) => b.elo - a.elo)
  })
}

export async function getUserNames(): Promise<object> {
  const db = getDatabase(app);
  const userGamesRef = ref(db, 'users');
  return await get(userGamesRef).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      return []
    }
  });
}

interface Match {
  loser: string;
  winner: string;
  issuer: string;
  datetime?: string;
}

export async function getMatches(): Promise<Match[]> {
  const db = getDatabase(app);
  const gamesRef = ref(db, 'matches');
  return await get(gamesRef).then((snapshot) => {
    if (snapshot.exists()) {
      return Object.values(snapshot.val())
    } else {
      return []
    }
  });
}