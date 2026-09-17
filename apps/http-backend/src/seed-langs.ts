import "dotenv/config";
import { seedLanguages } from "@repo/db/scripts/seedLanguages.js";
import { disconnectDB } from "@repo/db";
seedLanguages().catch(error => { console.error(error); process.exitCode = 1; }).finally(disconnectDB);
