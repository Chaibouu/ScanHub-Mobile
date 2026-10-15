/**
 * Complète app.json au moment de la construction.
 *
 * ALLOW_CLEARTEXT_HTTP=1 (profil « local » de eas.json) autorise le téléphone à joindre un
 * serveur en http:// simple, comme l'ordinateur de développement sur le Wi-Fi local. Android
 * l'interdit par défaut. Les versions publiques, qui visent un serveur https://, ne l'activent pas.
 */
module.exports = ({ config }) => {
  if (process.env.ALLOW_CLEARTEXT_HTTP !== '1') return config;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
    ],
  };
};
