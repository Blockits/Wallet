/**
 * string present type of environment the application is current running on
 * popup - When the user click on browser extension bar - default view
 * notification - When the extension opens due to interaction with web3 enabled service
 * fullscreen - When the user click 'expand view' to view extension in new tab
 * background - background process that power the extension
 */
export const ENVIRONMENT_TYPE_POPUP = 'popup';
export const ENVIRONMENT_TYPE_NOTIFICATION = 'notification';
export const ENVIRONMENT_TYPE_FULLSCREEN = 'fullscreen';
export const ENVIRONMENT_TYPE_BACKGROUND = 'background';

/**
 * Build Type - this build is intent for
 */
export const BuildType = {
    beta: 'beta',
    flask: 'flask',
    main: 'main',
  };

export const PLATFORM_BRAVE = 'Brave';
export const PLATFORM_CHROME = 'Chrome';
export const PLATFORM_EDGE = 'Edge';
export const PLATFORM_FIREFOX = 'Firefox';
export const PLATFORM_OPERA = 'Opera';

export const MESSAGE_TYPE = {
    ADD_ETHEREUM_CHAIN: 'wallet_addEthereumChain',
    ETH_ACCOUNTS: 'eth_accounts',
    ETH_DECRYPT: 'eth_decrypt',
    ETH_GET_ENCRYPTION_PUBLIC_KEY: 'eth_getEncryptionPublicKey',
    ETH_REQUEST_ACCOUNTS: 'eth_requestAccounts',
    ETH_SIGN: 'eth_sign',
    ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
    GET_PROVIDER_STATE: 'metamask_getProviderState',
    LOG_WEB3_SHIM_USAGE: 'metamask_logWeb3ShimUsage',
    PERSONAL_SIGN: 'personal_sign',
    SEND_METADATA: 'metamask_sendDomainMetadata',
    SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
    WATCH_ASSET: 'wallet_watchAsset',
    WATCH_ASSET_LEGACY: 'metamask_watchAsset',
  };

export const POLLING_TOKEN_ENVIRONMENT_TYPES = {
[ENVIRONMENT_TYPE_POPUP]: 'popupGasPollTokens',
[ENVIRONMENT_TYPE_NOTIFICATION]: 'notificationGasPollTokens',
[ENVIRONMENT_TYPE_FULLSCREEN]: 'fullScreenGasPollTokens',
};