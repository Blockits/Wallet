import * as Sentry from '@sentry/browser';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';

import { BuildType } from '../../../shared/constants/app';
import extractEthjsErrorMessage from './extractEthjsErrorMessage';

// Destructuring breaks the inlining of the environment variables
const WALLET_DEBUG = process.env.WALLET_DEBUG;
const WALLET_ENVIRONMENT = process.env.WALLET_ENVIRONMENT;
const SENTRY_DSN_DEV = process.env.SENTRY_DSN_DEV;
const WALLET_BUILD_TYPE = process.env.WALLET_BUILD_TYPE;

/**
 * Describe subset of Redux state attached to errors to push to sentry and
 * don't include any identifiable information
 */
export const SENTRY_ENTRY = {
    gas: true,
    history: true,
    wallet: {
        alertEnabledness: true,
        conversionDate: true,
        conversionRate: true,
        currentBlockGasLimit: true,
        currentCurrency: true,
        currentLocale: true,
        customNonceValue: true,
        isInitialized: true,
        isUnlocked: true,
        network: true,
        provider: {
            nickname: true,
            ticker: true,
            type: true,
        },
        seedPhraseBackedUp: true,
        showRestorePrompt: true,
        useBlockie: true,
        useNonceField: true,
        usePhishDetect: true,
        welcomeScreenSeen: true,
    },
    unconnectedAccount: true,
};

export default function setupSentry(release, getState) {

}