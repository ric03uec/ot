package main

import (
	"context"
	"log"

	"cloud.google.com/go/storage"
)

type GCP struct {
	// store the address of a context object
	ctx		*context.Context

	// store the address of the Client
	client	*storage.Client

	projectId string
}

func NewGCPClient(projectId string) (*GCP, error){
	// returns a non-nil, empty Context object/struct
	ctx := context.Background()
	log.Printf("Creating bucket context")

	// returns a pointer to a Client
	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// store the address of the context
	gcpClient := &GCP{
		ctx:		&ctx,
		client:		client,
		projectId:	projectId,
	}

	return gcpClient, nil
}

func (gcp *GCP) GetInventory() {
	log.Printf("geting inventory")

 	bucketName := "my-new-bucket-ric03uec"
	// create a bucket instance
 	bucket := *gcp.client.Bucket(bucketName)

	// reference the address of the context
 	if err := bucket.Create(*gcp.ctx, gcp.projectId, nil); err != nil {
 		log.Fatalf("Failed to ccreate bucket: %v", err)
 	}

 	log.Printf("Bucket created: %v", bucketName)
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
