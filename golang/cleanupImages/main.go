package main

import (
	"log"
	"os"
)

func main() {
	log.Printf("Starting machine image cleanup")

	projectId := os.Getenv("PROJECT_ID")
	if len(projectId) == 0 {
		log.Fatalf("missing required env: PROJECT_ID ")
	}
	log.Printf("Creating bucket for project: %v", projectId)

	credentials := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if len(credentials) == 0 {
		log.Fatalf("missing required env: GOOGLE_APPLICATION_CREDENTIALS")
	}

	gcp, _ := NewGCPClient(projectId)
	gcp.GetInventory()
}
