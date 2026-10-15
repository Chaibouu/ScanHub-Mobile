/**
 * Complète app.json au moment de la construction.
 *
 * ALLOW_CLEARTEXT_HTTP=1 (profil « local » de eas.json) autorise le téléphone à joindre un
 * serveur en http:// simple, comme l'ordinateur de développement sur le Wi-Fi local. Android
 * l'interdit par défaut. Les versions publiques, qui visent un serveur https://, ne l'activent pas.
 */
const BUILD_PROPERTIES = 'expo-build-properties';

module.exports = ({ config }) => {
  if (process.env.ALLOW_CLEARTEXT_HTTP !== '1') return config;

  // Complète la configuration de expo-build-properties déjà présente dans app.json
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== BUILD_PROPERTIES) return plugin;
    const [name, options = {}] = plugin;
    return [name, { ...options, android: { ...options.android, usesCleartextTraffic: true } }];
  });

  return { ...config, plugins };
};
