import React from "react";
import { useNavigate } from "react-router";
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    Timestamp,
} from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

import { PanoramaBackground } from "../../components/panorama";
import "./styles.css";

const app = initializeApp({
    apiKey: "AIzaSyB7APiLe5PvHmzOrnmAFBRVuUtq7cnUXZY",
    authDomain: "economy-a063a.firebaseapp.com",
    projectId: "economy-a063a",
    storageBucket: "economy-a063a.firebasestorage.app",
    messagingSenderId: "852192366276",
    appId: "1:852192366276:web:e4d468cbc091628a894391",
});

const db = getFirestore(app);
const auth = getAuth(app);

export function SignInPage() {
    const navigate = useNavigate();
    const [user, loading, error] = useAuthState(auth);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            location.reload();
        } catch (error) {
            console.error("Error signing in or creating user:", error);
            alert("Failed to sign in: " + error.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef).then((docSnapshot) => {
            if (!docSnapshot.exists()) {
                const username = prompt(
                    "Please enter a username:",
                    user.displayName || "New User"
                );
                setDoc(userDocRef, {
                    username: username,
                    coins: 1000000,
                    inventory: [],
                    orders: [],
                    stats: {
                        coins_spent: 0,
                        coins_earned: 0,
                    },
                    created: Timestamp.now(),
                })
                    .then(() => {
                        navigate("/game");
                    })
                    .catch((error) => {
                        console.error("Error creating user document:", error);
                        alert(
                            "Failed to create user document: " + error.message
                        );
                    });
            } else {
                navigate("/game");
            }
        });
    }

    return (
        <>
            <PanoramaBackground />
            <div className="signin-page">
                <div className="signin-container">
                    <h1>Please Sign In</h1>
                    <button onClick={signInWithGoogle}>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </>
    );
}
