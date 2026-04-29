import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB0tqyJ_TVBeVSNWqK4JzG1WqTPMMd4-EE",
  authDomain: "mess-2cfc0.firebaseapp.com",
  projectId: "mess-2cfc0",
  storageBucket: "mess-2cfc0.firebasestorage.app",
  messagingSenderId: "359562836279",
  appId: "1:359562836279:web:2988de79597814d09602b2"
};
 

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
