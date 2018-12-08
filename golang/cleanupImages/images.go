package main

import (
	"context"
	"log"

	"cloud.google.com/go/storage"
)

type GCP struct {
	client storage.Client
}

func NewGCPClient(projectId string) (*GCP, error){
	// connect and validate creds
	ctx := context.Background()

	log.Printf("Creating bucket context")
	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	gcpClient := &GCP{
		client:		*client,
	}

	return gcpClient, nil
}

func (gcp *GCP) GetInventory() {
	log.Printf("geting inventory")

// 	bucketName := "my-new-bucket-ric03uec"
// 	// create a bucket instance
// 	bucket := gcp.client.Bucket(bucketName)
//
// 	if err := bucket.Create(ctx, projectId, nil); err != nil {
// 		log.Fatalf("Failed to ccreate bucket: %v", err)
// 	}
//
// 	log.Printf("Bucket created: %v", bucketName)
	// get
	// get list of machine images
	// get list of whitelisted images
	// create diff
	// print what needs to be done
}

//func CleanupImages() {
//	// remove final list of machine images
//	// cleanup everything afterwards
//	// print summary
//
//}
