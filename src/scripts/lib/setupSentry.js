import * as Sentry from '@sentry/browser';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';

import { BuildType } from '../../shared/constants/app';
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
  let sentryTarget;

  if(WALLET_DEBUG) {
    return undefined;
  } else if (WALLET_ENVIRONMENT === 'production') {
    if(!process.env.SENTRY_DSN) {
      throw new Error(
        `Missing SENTRY_DSN environment variable in production environment`,
      );
    }
    console.log(
      `Setting up Sentry Remote Error Reporting for '${WALLET_ENVIRONMENT}: SENTRY_DSN'`,
    );
    sentryTarget = process.env.SENTRY_DSN;
  } else {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${WALLET_ENVIRONMENT}: SENTRY_DSN_DEV'`,
    );
    sentryTarget = process.env.SENTRY_DSN_DEV;
  }

  const environment = 
    WALLET_BUILD_TYPE === BuildType.main
      ? WALLET_ENVIRONMENT
      : `${WALLET_ENVIRONMENT}-${WALLET_BUILD_TYPE}`;
  
  Sentry.init({
    dsn: sentryTarget,
    debug: WALLET_DEBUG,
    environment,
    integrations: [new Dedupe(), new ExtraErrorData()],
    release,
    beforeSend: (report) => rewriteReport(report),
  });

  function rewriteReport(report) {
    try {
      // simplify certain complex error messages (e.g. Ethjs)
      simplifyErrorMessages(report);
      // modify report urls
      rewriteReportUrls(report);
      // append app state
      if (getState) {
        const appState = getState();
        if (!report.extra) {
          report.extra = {};
        }
        report.extra.appState = appState;
      }
    } catch (err) {
      console.warn(err);
    }
    return report;
  }

  return Sentry;
}

function simplifyErrorMessages(report) {
  rewriteErrorMessages(report, (errorMessage) => {
    // simplify ethjs error messages
    let simplifiedErrorMessage = extractEthjsErrorMessage(errorMessage);
    // simplify 'Transaction Failed: known transaction'
    if (
      simplifiedErrorMessage.indexOf(
        'Transaction Failed: known transaction',
      ) === 0
    ) {
      // cut the hash from the error message
      simplifiedErrorMessage = 'Transaction Failed: known transaction';
    }
    return simplifiedErrorMessage;
  });
}

function rewriteErrorMessages(report, rewriteFn) {
  // rewrite top level message
  if (typeof report.message === 'string') {
    report.message = rewriteFn(report.message);
  }
  // rewrite each exception message
  if (report.exception && report.exception.values) {
    report.exception.values.forEach((item) => {
      if (typeof item.value === 'string') {
        item.value = rewriteFn(item.value);
      }
    });
  }
}

function rewriteReportUrls(report) {
  // update request url
  report.request.url = toWalletUrl(report.request.url);
  // update exception stack trace
  if (report.exception && report.exception.values) {
    report.exception.values.forEach((item) => {
      if (item.stacktrace) {
        item.stacktrace.frames.forEach((frame) => {
          frame.filename = toWalletUrl(frame.filename);
        });
      }
    });
  }
}

function toWalletUrl(origUrl) {
  const filePath = origUrl.split(window.location.origin)[1];
  if (!filePath) {
    return origUrl;
  }
  const walletUrl = `wallet${filePath}`;
  return walletUrl;
}