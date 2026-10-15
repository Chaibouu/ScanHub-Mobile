# ScanHub — application mobile (Expo)

Application de contrôle d'accès pour les agents : scan de QR codes, validation des entrées,
mode hors-ligne avec synchronisation.

**Télécharger l'application Android :** https://chaibouu.github.io/ScanHub-Mobile/

## Démarrage

```bash
npm install
npx expo start
```

En développement, l'application vise toute seule le backend lancé sur l'ordinateur qui fait
tourner Expo (même adresse, port 3000) : rien à configurer, même si le Wi-Fi change.
Pour viser un autre serveur, définir `EXPO_PUBLIC_API_URL` dans `.env` (voir `.env.example`).

La caméra, SQLite et le stockage sécurisé sont des modules natifs : utiliser un build de
développement (`npx expo run:android` / `npx expo run:ios`, ou `eas build --profile development`).

## Construire et publier l'APK

Les profils sont dans `eas.json` :

| Profil | Résultat | Serveur visé |
|---|---|---|
| `preview` | APK à installer directement | https://scan-hub.vercel.app |
| `production` | Fichier pour le Play Store (.aab) | https://scan-hub.vercel.app |
| `local` | APK de test | l'ordinateur de développement sur le Wi-Fi (http) |

```bash
npx eas-cli@latest build -p android --profile preview
```

Pour le rendre téléchargeable depuis la page GitHub Pages (`docs/`) :

1. Télécharger l'APK produit par EAS et le renommer **`ScanHub.apk`** (nom attendu par la page).
2. Sur GitHub : *Releases → Draft a new release*, créer une étiquette (`v1.0.0`, `v1.1.0`…),
   joindre `ScanHub.apk`, publier.
3. La page affiche toute seule la dernière version, sa date et sa taille.

Pensez à augmenter `version` et `android.versionCode` dans `app.json` à chaque nouvelle version.

## Première utilisation

1. **Activer le terminal** : écran de connexion → « Téléphone pas encore activé ».
   Le code (8 caractères, usage unique, 48 h) est généré par un administrateur dans le tableau de
   bord, rubrique *Terminaux Mobiles*.
2. **Se connecter** avec un compte agent.
3. **Choisir l'événement** : la liste de ses billets est téléchargée automatiquement pour le
   mode hors-ligne (*Synchronisation* permet de la retélécharger).

## Mode hors-ligne

- Chaque scan interroge d'abord le serveur (5 s au plus). S'il ne répond pas, le téléphone
  utilise la liste téléchargée : un QR absent de cette liste n'est jamais accepté.
- Les entrées validées hors-ligne sont mises en file (SQLite) et envoyées au retour du réseau.
  Le serveur revalide chaque scan : un billet déjà utilisé ailleurs remonte en conflit.

## Vérifications

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```
