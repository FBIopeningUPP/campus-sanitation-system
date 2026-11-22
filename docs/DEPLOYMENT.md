# Deployment Guide

## Quick Deployment Options

### Option 1: Docker (Recommended for Azure)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3001
```

### Option 2: Manual Deployment

```bash
# Install dependencies
npm run install:all

# Initialize database
npm run init-db
npm run seed

# Build frontend
npm run build

# Start in production mode
NODE_ENV=production npm start
```

---

## Azure Deployment

### Prerequisites
- Azure account with $100 credits
- Azure CLI installed (`az`)

### Option A: Azure App Service (Easiest)

1. **Login to Azure:**
```bash
az login
```

2. **Create Resource Group:**
```bash
az group create --name bennett-sanitation-rg --location eastus
```

3. **Create App Service Plan:**
```bash
az appservice plan create \
  --name bennett-sanitation-plan \
  --resource-group bennett-sanitation-rg \
  --sku B1 \
  --is-linux
```

4. **Create Web App:**
```bash
az webapp create \
  --name bennett-sanitation \
  --resource-group bennett-sanitation-rg \
  --plan bennett-sanitation-plan \
  --runtime "NODE:20-lts"
```

5. **Configure Environment Variables:**
```bash
az webapp config appsettings set \
  --name bennett-sanitation \
  --resource-group bennett-sanitation-rg \
  --settings \
    NODE_ENV=production \
    JWT_SECRET=your-secure-secret-key \
    ADMIN_EMAIL=admin@bennett.edu.in \
    ADMIN_PASSWORD=your-secure-password
```

6. **Deploy the app:**
```bash
# Build first
npm run build

# Create deployment package
zip -r deploy.zip backend frontend/dist package.json uploads database -x "*/node_modules/*"

# Deploy
az webapp deployment source config-zip \
  --name bennett-sanitation \
  --resource-group bennett-sanitation-rg \
  --src deploy.zip
```

7. **Access your app:**
```
https://bennett-sanitation.azurewebsites.net
```

### Option B: Azure Container Instance (Docker)

1. **Create Azure Container Registry:**
```bash
az acr create \
  --name bennettsanitationacr \
  --resource-group bennett-sanitation-rg \
  --sku Basic
```

2. **Build and push Docker image:**
```bash
az acr build \
  --registry bennettsanitationacr \
  --image campus-sanitation:latest .
```

3. **Deploy to Container Instance:**
```bash
az container create \
  --name bennett-sanitation \
  --resource-group bennett-sanitation-rg \
  --image bennettsanitationacr.azurecr.io/campus-sanitation:latest \
  --dns-name-label bennett-sanitation \
  --ports 3001 \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    NODE_ENV=production \
    JWT_SECRET=your-secure-secret-key
```

### Option C: Azure Static Web Apps + Azure Functions

For a serverless approach:

1. Create Azure Static Web App for the frontend
2. Create Azure Functions for the backend API
3. Use Azure Cosmos DB or Azure SQL instead of SQLite

This requires more setup but offers better scalability.

---

## Other Deployment Options

### Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
cd frontend
vercel deploy
```

**Backend on Railway:**
1. Connect GitHub repo to Railway
2. Set environment variables
3. Deploy

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure as Node.js app
3. Set build command: `npm run setup`
4. Set run command: `npm start`

### Self-hosted VPS

```bash
# On your server
git clone <your-repo>
cd campus-sanitation-system

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup and run
npm run setup
pm2 start backend/server.js --name campus-sanitation
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | (random) | Secret for JWT tokens |
| `ADMIN_EMAIL` | admin@bennett.edu.in | Initial admin email |
| `ADMIN_PASSWORD` | admin123 | Initial admin password |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `RATING_LIMIT_PER_DAY` | 10 | Max ratings per IP per day |

---

## Post-Deployment Checklist

- [ ] Change default admin password
- [ ] Set secure JWT_SECRET
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup for database
- [ ] Test all features

---

## Estimated Azure Costs

With $100 credits:

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| App Service | B1 | ~$13 |
| Storage (uploads) | Standard | ~$1 |
| **Total** | | **~$14/month** |

Your $100 credits will last approximately **7 months**.
