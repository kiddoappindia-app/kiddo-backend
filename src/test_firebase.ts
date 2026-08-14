import { firebaseAuth } from './config/firebase-admin.js';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = "AIzaSyDrAtpsmxp46I_U3sKHm0OEG3JUVEfWtMs";
const TEST_EMAIL = `test-parent-${Date.now()}@kiddoapp.in`;
const TEST_UID = `test-uid-${Date.now()}`;

async function testFirebaseAuth() {
  try {
    console.log("1. Generating custom token for uid:", TEST_UID, "email:", TEST_EMAIL);
    const customToken = await firebaseAuth.createCustomToken(TEST_UID, {
      email: TEST_EMAIL
    });
    console.log("Custom Token generated successfully.");

    console.log("2. Exchanging custom token for ID token via Google SecureToken API...");
    const exchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`;
    const exchangeResponse = await fetch(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    });

    if (!exchangeResponse.ok) {
      const errorText = await exchangeResponse.text();
      throw new Error(`Failed to exchange custom token: ${errorText}`);
    }

    const exchangeData: any = await exchangeResponse.json();
    const idToken = exchangeData.idToken;
    console.log("ID Token received successfully.");

    console.log("3. Sending ID Token to local backend auth endpoint http://localhost:4000/api/v1/auth/firebase ...");
    const loginResponse = await fetch("http://localhost:4000/api/v1/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken: idToken,
        familyName: "Tester Family",
        firstName: "Firebase",
        lastName: "Test"
      })
    });

    const loginData: any = await loginResponse.json();
    console.log("Backend response status:", loginResponse.status);
    console.log("Backend response body:", JSON.stringify(loginData, null, 2));

    if (loginResponse.ok && loginData.accessToken) {
      console.log("✅ End-to-End Firebase Auth Test PASSED!");
    } else {
      console.error("❌ End-to-End Firebase Auth Test FAILED!");
    }
  } catch (error) {
    console.error("Error during testing:", error);
    process.exit(1);
  }
}

testFirebaseAuth();
