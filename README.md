# GitHub Cityscapes

Crée une application web appelée Commit City qui transforme un profil GitHub en une ville 2D moderne générée en SVG.

Chaque repository devient un bâtiment : sa hauteur dépend du nombre de commits, sa largeur de la taille du projet, et des éléments spéciaux apparaissent selon les stars et les langages utilisés.

L’utilisateur entre son pseudo GitHub et obtient une URL partageable comme :

commit.city/username.svg?theme=night&color=purple

Prévoir :

mode jour et nuit

couleurs personnalisables

statistiques GitHub sous la ville

quartiers par langage

design flat/vectoriel inspiré de SimCity et des badges GitHub

page d’accueil avec aperçu, champ GitHub et bouton “Generate my city”

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bd62e62c-66cd-4427-81b2-d94254823252).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
