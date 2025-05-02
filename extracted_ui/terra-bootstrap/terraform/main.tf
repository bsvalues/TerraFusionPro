provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "backup" {
  bucket = "terrafusion-backups"
}

resource "aws_db_instance" "pg" {
  allocated_storage    = 20
  engine               = "postgres"
  instance_class       = "db.t3.micro"
  name                 = "terra"
  username             = "terra"
  password             = "password"
  skip_final_snapshot  = true
}
