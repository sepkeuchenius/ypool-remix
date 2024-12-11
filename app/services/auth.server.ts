// app/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { FormStrategy } from "remix-auth-form";
import { auth } from "~/services/firebase.server";
import { signInWithEmailAndPassword, signInWithCustomToken, signInWithCredential, AuthCredential, GoogleAuthProvider, User as FirebaseUser, createUserWithEmailAndPassword } from "firebase/auth";
import { GoogleStrategy } from 'remix-auth-google'
import { UserProps } from "~/routes/interfaces";

// app/services/auth.server.ts

export let authenticator = new Authenticator<UserProps>(sessionStorage);

// authenticator.use(googleStrategy)

// // Tell the Authenticator to use the form strategy
authenticator.use(
  new FormStrategy(async ({ form }) => {
    let email = form.get("email");
    let password = form.get("password");
    let user = await signInWithEmailAndPassword(auth, email, password)
    // the type of this user must match the type you pass to the Authenticator
    // the strategy will automatically inherit the type if you instantiate
    // directly inside the `use` method
    return { email: email, name: user.user.displayName, uid: user.user.uid } as UserProps
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session

