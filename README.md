# Mérite - Communication entre machines - version 2 - Du passé faisons table rase

- remplacer les web sockets par des connexions http longues (utilisant des [server sent events](https://fr.wikipedia.org/wiki/Server-sent_events))
- définir un langage dédié permettant de faciliter les extensions

## Etape 0 - Préambule : configuration initiale

- Récupérer la licence.
- Récupérer les fichiers de configuration du dépôt de la version 1 :
  - `package.json` pour les scripts à lancer par `npm` et les paquets à installer,
    - repartir de zéro et enrichir progressivement,
  - `tsconfig` pour les options de compilation,
  - `tslint` pour le [linter](https://fr.wikipedia.org/wiki/Lint_(logiciel)) typescript,
  - `webpack.config` pour l'agrégateur de modules [webpack](https://en.wikipedia.org/wiki/Webpack).
- Configurer globalement [Typescript](https://code.visualstudio.com/Docs/languages/typescript).
  - Ajouter globalement l'interpréteur `ts-node` : `npm install -g ts-node`. 
  - Ajouter localement (par une dépendance de développement) le linter : `npm install -D tslint`.
- Installer localement React.
  - `npm install react react-dom @types/react @types/react-dom`

## Etape 1 - le prototype

- Créer un répertoire `prototype`, et deux sous-répertoires `client` et `serveur`.
- Dans `build`, définir la page `html`, définissant le script à utiliser et la division à remplacer par l'application React (ici d'identifiant `conteneur`).
  ```
    <html>
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0"/>
            <title>Prototype SSE</title>
            <script defer="defer" src="/protoReact.client.js"></script>
        </head>
        <body>
            <div id="conteneur" style="height: 100%"></div>
        </body>
    </html>
  ```
- Dans `prototype/client`, définir ce qui va être rendu par l'application React : le corps à l'intérieur de `conteneur`. Le corps est défini par le composant React `Corps`.
- A faire côté client : le code dans `componentDidMount(): void`.
- A faire côté serveur : le serveur web en utilisant Express servant l'application, fournissant le service pour poster les messages et diffuser les informations de connexion.  