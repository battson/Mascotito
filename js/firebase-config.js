/**
 * Configuración de Firebase (v3.3 — cuenta en la nube + amigos).
 *
 * Completá estos valores con los de TU proyecto de Firebase (ver la
 * sección "Cómo crear tu proyecto de Firebase" en README.md — es un
 * paso a paso completo, no hace falta saber nada de Firebase de
 * antemano). Los sacás de la consola de Firebase, en Configuración del
 * proyecto → tus apps → app web ("Config" / objeto firebaseConfig).
 *
 * Mientras dejes los valores de ejemplo tal cual están (o los borres),
 * la app arranca SOLA en "modo sin nube": funciona exactamente igual
 * que la v3.2 (guardado sólo en este navegador, sin pantalla de login,
 * sin amigos). Podés jugar y probar todo así antes de crear el
 * proyecto de Firebase. En cuanto pegues acá tus valores reales, en el
 * próximo F5 aparece la pantalla de usuario/PIN.
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDJQQBmr3BQVc6twOA1pyNRdLIcVTrVaUA",
  authDomain: "mascotito-84b36.firebaseapp.com",
  projectId: "mascotito-84b36",
  storageBucket: "mascotito-84b36.firebasestorage.app",
  messagingSenderId: "331394610630",
  appId: "1:331394610630:web:044abb336ff02931e3eec7"

};

// Se considera "sin configurar" mientras el apiKey siga siendo el
// valor de ejemplo (o esté vacío). No hace falta tocar esta línea.
const CLOUD_ENABLED = !!(
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.apiKey !== "TU_API_KEY" &&
  FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.projectId !== "TU_PROYECTO"
);

// Initialize Firebase
const app = initializeApp(firebaseConfig);