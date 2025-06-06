# TerraFusionPro Bootstrap Guide

This archive contains everything needed to deploy TerraFusionPro locally, in production via Docker, on Kubernetes via Helm, or to provision AWS infrastructure using Terraform.

---

## 🔧 Local Development

```bash
./bootstrap.sh
```

This installs dependencies, sets up `.env.local`, and starts Docker containers (Postgres, server, client).

---

## 🐳 Docker Compose (Production)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Edit environment variables in the file before production use.

---

## ☁️ Terraform (AWS)

```bash
cd terraform
terraform init
terraform apply
```

Creates:

- S3 bucket for backups
- PostgreSQL (RDS) instance

---

## ☸️ Kubernetes with Helm

```bash
cd helm
helm install terrafusion .
```

Ensure your image repository + domain are configured in `values.yaml`.

---

## 📁 Structure

```
bootstrap.sh                  # Local dev setup
docker-compose.yml            # Dev Docker
docker-compose.prod.yml       # Prod Docker
deployment/                   # Raw Kubernetes YAMLs
helm/                         # Helm chart for K8s
terraform/                    # AWS provisioning
```

---

For any help, see the [Project Wiki] or contact your DevOps lead.
