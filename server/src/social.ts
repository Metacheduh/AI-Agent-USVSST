import { TwitterApi } from 'twitter-api-v2';

/**
 * Phase 4 PRD: Autonomous Faceless X/Twitter Profile
 * Executes autonomous intelligence broadcasts using contentEngine output when
 * GovWatch validates a multi-national seizure event.
 */
export class AutonomousSocialEngine {
    private client: TwitterApi | null = null;

    constructor() {
        // Instantiate using standard X API v2 credentials
        if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
            console.log("🐦 [Faceless Profile] Connecting to X/Twitter API v2...");
            try {
                this.client = new TwitterApi({
                    appKey: process.env.TWITTER_API_KEY,
                    appSecret: process.env.TWITTER_API_SECRET,
                    accessToken: process.env.TWITTER_ACCESS_TOKEN,
                    accessSecret: process.env.TWITTER_ACCESS_SECRET,
                });
            } catch(e) {
                console.error("🐦 [Faceless Profile] Failed to connect to X/Twitter API.");
            }
        } else {
            console.warn("🐦 [Faceless Profile] Twitter API keys missing. Running in simulated broadcasting mode.");
        }
    }

    /** 
     * Autonomously publishes the generated Genkit alert to the faceless X/Twitter profile.
     */
    async publishAlert(text: string) {
        if (!text) return;

        console.log(`\n🚀 [Faceless Profile] Preparing to broadcast intercept to X/Twitter array...`);
        console.log(`================ BROADCAST PAYLOAD ================`);
        console.log(text);
        console.log(`===================================================`);

        if (this.client) {
            try {
                // Post the actual tweet using Twitter API v2
                const response = await this.client.v2.tweet(text);
                console.log(`✅ [Faceless Profile] Autonomous Tweet deeply successful! ID: ${response.data.id}`);
            } catch (error) {
                console.error(`❌ [Faceless Profile] X/Twitter API execution failed. Target WAF blocked or rate limit hit.`, error);
            }
        } else {
            // Mock output mode if keys are missing to prevent application crashes
            console.log("✅ [Faceless Profile] SIMULATED SUCCESS: The broadcast would have been posted to X/Twitter if active keys were supplied in .env.");
        }
    }
}

export const socialEngine = new AutonomousSocialEngine();
