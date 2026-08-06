set -e

if [ -z "$1" ]; then
  echo "⚠️  Debés ingresar un mensaje de commit como argumento."
  echo "Uso: npm run deploy -- 'mensaje'"
  exit 1
fi

git add .
git commit -m "$1"
npm version patch
git push origin main --follow-tags