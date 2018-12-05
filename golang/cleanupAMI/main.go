package main

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/storage"
)

func main() {
	log.Printf("Starting migration")

	ctx := context.Background()

	project_id := os.Getenv("PROJECT_ID")
	if len(project_id) == 0 {
		log.Fatalf("missing required env: PROJECT_ID ")
	}
	log.Printf("Creating bucket for project: %v", project_id)

	log.Printf("Creating bucket context")
	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	bucket_name := "my-new-bucket-ric03uec"
	// create a bucket instance
	bucket := client.Bucket(bucket_name)

	if err := bucket.Create(ctx, project_id, nil); err != nil {
		log.Fatalf("Failed to ccreate bucket: %v", err)
	}

	log.Printf("Bucket created: %v", bucket_name)
}
