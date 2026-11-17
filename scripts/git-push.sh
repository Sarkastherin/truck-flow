set -e

if [ -z "$1" ]; then
  echo "⚠️ Debés ingresar un mensaje de commit."
  echo "Uso: npm run deploy -- 'mensaje' [patch|minor|major]"
  exit 1
fi

VERSION=${2:-patch}

if [[ ! "$VERSION" =~ ^(patch|minor|major)$ ]]; then
  echo "⚠️ Versión inválida. Usá patch, minor o major."
  exit 1
fi

git add .
git commit -m "$1"
npm version "$VERSION"
git push origin main --follow-tags