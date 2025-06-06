#!/bin/bash

echo "📦 Bootstrapping TerraFusionPro Dev Environment..."

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
  echo "🔧 Installing pnpm..."
  npm install -g pnpm
fi

# Install dependencies
pnpm install

# Set up Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Set up environment file
echo "⚙️ Creating .env.local..."
cat <<EOF > .env.local
DATABASE_URL=postgres://terra:password@localhost:5432/terra
JWT_SECRET=supersecret
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET=terra-backups
EOF

echo "✅ Bootstrap complete. Run 'pnpm dev' to start development."
